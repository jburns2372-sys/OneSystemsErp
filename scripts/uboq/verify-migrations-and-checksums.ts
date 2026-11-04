/**
 * Read-Only Migration Integrity, Passwordless Role Hardening (H08), & Checksum Drift Verifier (R1-H04)
 *
 * STRICT INVARIANT (R1-H04):
 *   This verifier is 100% READ-ONLY against target databases (`SET default_transaction_read_only = on`).
 *   It NEVER rewrites, updates, or reconciles `_prisma_migrations` checksums. Any checksum mismatch,
 *   failed migration step, or unapplied migration causes immediate fail-closed termination (exit code 1).
 *
 * HISTORICAL LOCAL RECONCILIATION AUDIT RECORD (ISOLATED DEV WORKSPACE ONLY — NEVER REUSED):
 *   On 2026-11-04 prior to commit 2a0d0f7c8679b847333ab55bb9eb7787710e0523, unreleased local migration
 *   `20261104193000_add_uboq_engine_and_g01_exc_01` underwent a one-time isolated local checksum
 *   reconciliation (`8f8603862f262272e3a42573d2fd335efdc990af510539590924258c0c13e036` ->
 *   `2b26be208ef667ceb135b97a664a40f0ba73cea0f45c0f5413698d5ce55daa17`) on `localhost:5432/testdb_uboq_001`
 *   to strip static role passwords before any remote push or Preview/Production deployment.
 *   From commit 2a0d0f7c8679b847333ab55bb9eb7787710e0523 onward, all migration SQL files and SHA-256
 *   checksums are strictly immutable; all subsequent schema/security changes use forward-only migrations.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export interface DiskMigrationChecksum {
  readonly migrationName: string;
  readonly sha256Checksum: string;
}

export interface AppliedMigrationRow {
  readonly migration_name: string;
  readonly checksum: string;
  readonly finished_at: Date | string | null;
  readonly rolled_back_at: Date | string | null;
  readonly applied_steps_count: number;
}

export function loadDiskMigrationChecksums(migrationsRootDir: string): DiskMigrationChecksum[] {
  const entries = fs
    .readdirSync(migrationsRootDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b));

  return entries.map((dirName) => {
    const sqlPath = path.join(migrationsRootDir, dirName, 'migration.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error(`UBOQ_MIGRATION_MISSING_SQL: Missing migration.sql in ${dirName}`);
    }
    const sha256Checksum = crypto.createHash('sha256').update(fs.readFileSync(sqlPath)).digest('hex');
    return { migrationName: dirName, sha256Checksum };
  });
}

export function assertZeroMigrationChecksumDrift(
  appliedRows: readonly AppliedMigrationRow[],
  diskMigrations: readonly DiskMigrationChecksum[]
): { verifiedCount: number } {
  const diskByName = new Map(diskMigrations.map((m) => [m.migrationName, m.sha256Checksum]));
  const activeApplied = appliedRows.filter((r) => r.rolled_back_at === null);

  for (const row of activeApplied) {
    if (!row.finished_at || row.applied_steps_count <= 0) {
      throw new Error(
        `UBOQ_MIGRATION_INCOMPLETE: Migration "${row.migration_name}" is incomplete (finished_at=${String(row.finished_at)}, steps=${row.applied_steps_count})`
      );
    }
    const expectedHash = diskByName.get(row.migration_name);
    if (!expectedHash) {
      throw new Error(
        `UBOQ_MIGRATION_UNKNOWN_APPLIED: Applied migration "${row.migration_name}" does not exist on disk`
      );
    }
    if (row.checksum.toLowerCase() !== expectedHash.toLowerCase()) {
      throw new Error(
        `UBOQ_MIGRATION_CHECKSUM_DRIFT_DETECTED: Applied migration "${row.migration_name}" checksum (${row.checksum}) != disk SHA-256 (${expectedHash})`
      );
    }
  }

  const appliedSet = new Set(activeApplied.map((r) => r.migration_name));
  const unapplied = diskMigrations.filter((m) => !appliedSet.has(m.migrationName));
  if (unapplied.length > 0) {
    throw new Error(
      `UBOQ_MIGRATION_PENDING_UNAPPLIED: ${unapplied.length} disk migration(s) not applied: ${unapplied.map((u) => u.migrationName).join(', ')}`
    );
  }

  return { verifiedCount: activeApplied.length };
}

function swapDbName(rawUrl: string, dbName: string): string {
  const u = new URL(rawUrl);
  u.pathname = `/${dbName}`;
  return u.toString();
}

function runPrisma(worktree: string, args: string[], targetDbUrl: string): string {
  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return execFileSync(npxBin, ['prisma', ...args], {
    cwd: worktree,
    env: { ...process.env, DATABASE_URL: targetDbUrl, DIRECT_URL: targetDbUrl },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

async function verifyDatabaseReadOnly(
  dbUrl: string,
  diskMigrations: readonly DiskMigrationChecksum[],
  label: string
): Promise<AppliedMigrationRow[]> {
  const client = new pg.Client({ connectionString: dbUrl });
  await client.connect();
  try {
    // Enforce session-wide PostgreSQL read-only mode so this verifier can NEVER mutate any row
    await client.query(`SET SESSION CHARACTERISTICS AS TRANSACTION READ ONLY`);
    await client.query(`SET default_transaction_read_only = on`);

    const migRes = await client.query<AppliedMigrationRow>(
      `SELECT migration_name, checksum, finished_at, rolled_back_at, applied_steps_count
       FROM "_prisma_migrations"
       ORDER BY migration_name ASC`
    );

    const { verifiedCount } = assertZeroMigrationChecksumDrift(migRes.rows, diskMigrations);
    console.log(`[${label}] READ_ONLY_CHECKSUM_AUDIT_PASS: ${verifiedCount}/${diskMigrations.length} migrations match disk SHA-256 100%`);

    const roleCheck = await client.query<{
      rolname: string;
      rolcanlogin: boolean;
      rolsuper: boolean;
      rolbypassrls: boolean;
      password_is_null: boolean;
    }>(`
      SELECT r.rolname, r.rolcanlogin, r.rolsuper, r.rolbypassrls, (a.rolpassword IS NULL) AS password_is_null
      FROM pg_roles r
      JOIN pg_authid a ON a.oid = r.oid
      WHERE r.rolname IN ('oserp_migrations_owner', 'oserp_compat_app', 'oserp_legacy_app', 'oserp_maint_cleanup_role')
      ORDER BY r.rolname ASC
    `);
    console.log(`[${label}] GROUP_ROLES_AUDIT=` + JSON.stringify(roleCheck.rows));
    for (const row of roleCheck.rows) {
      if (row.rolcanlogin !== false || row.password_is_null !== true) {
        throw new Error(
          `H08_VIOLATION [${label}]: Role ${row.rolname} has login=${row.rolcanlogin}, password_is_null=${row.password_is_null}`
        );
      }
    }

    return migRes.rows;
  } finally {
    await client.end();
  }
}

async function main() {
  const worktree = process.cwd();
  const baseEnvUrl = process.env.DATABASE_URL || '';
  if (!baseEnvUrl || !baseEnvUrl.includes('testdb_uboq')) {
    throw new Error(
      `UBOQ_SAFETY_ABORT: DATABASE_URL must point to isolated testdb_uboq* (got ${baseEnvUrl ? 'non-uboq DB' : 'empty'})`
    );
  }

  const args = process.argv.slice(2);
  const runFreshProof = args.includes('--fresh-proof');

  const migrationsDir = path.join(worktree, 'prisma', 'migrations');
  const diskMigrations = loadDiskMigrationChecksums(migrationsDir);
  console.log(`DISK_MIGRATIONS_COUNT=${diskMigrations.length}`);

  const uboqDbUrl = swapDbName(baseEnvUrl, 'testdb_uboq_001');
  console.log('\n--- 1. STRICT READ-ONLY MIGRATION & CHECKSUM AUDIT (testdb_uboq_001) ---');
  const existingRows = await verifyDatabaseReadOnly(uboqDbUrl, diskMigrations, 'testdb_uboq_001');

  if (runFreshProof) {
    const adminPgUrl = swapDbName(baseEnvUrl, 'postgres');
    const freshDbUrl = swapDbName(baseEnvUrl, 'testdb_uboq_fresh_mig');

    const adminClient = new pg.Client({ connectionString: adminPgUrl });
    await adminClient.connect();
    try {
      await adminClient.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = 'testdb_uboq_fresh_mig' AND pid <> pg_backend_pid()
      `);
      await adminClient.query(`DROP DATABASE IF EXISTS testdb_uboq_fresh_mig`);
      await adminClient.query(`CREATE DATABASE testdb_uboq_fresh_mig`);
    } finally {
      await adminClient.end();
    }

    try {
      console.log(`\n--- 2. FRESH EPHEMERAL DATABASE ${diskMigrations.length}/${diskMigrations.length} DEPLOY (testdb_uboq_fresh_mig) ---`);
      const freshDeployOut = runPrisma(worktree, ['migrate', 'deploy'], freshDbUrl);
      console.log(freshDeployOut.trim());
      const freshStatusOut = runPrisma(worktree, ['migrate', 'status'], freshDbUrl);
      console.log(freshStatusOut.trim());

      const freshRows = await verifyDatabaseReadOnly(freshDbUrl, diskMigrations, 'testdb_uboq_fresh_mig');
      if (freshRows.length !== existingRows.length) {
        throw new Error(
          `Fresh migration count (${freshRows.length}) != existing testdb_uboq_001 count (${existingRows.length})`
        );
      }
      for (let i = 0; i < freshRows.length; i++) {
        if (
          freshRows[i].migration_name !== existingRows[i].migration_name ||
          freshRows[i].checksum !== existingRows[i].checksum
        ) {
          throw new Error(
            `Checksum parity mismatch between fresh deploy and testdb_uboq_001 at ${freshRows[i].migration_name}`
          );
        }
      }
      console.log(`FRESH_VS_INCREMENTAL_PARITY=100% (${freshRows.length}/${freshRows.length} identical SHA-256 checksums)`);
    } finally {
      const dropClient = new pg.Client({ connectionString: adminPgUrl });
      await dropClient.connect();
      try {
        await dropClient.query(`
          SELECT pg_terminate_backend(pid)
          FROM pg_stat_activity
          WHERE datname = 'testdb_uboq_fresh_mig' AND pid <> pg_backend_pid()
        `);
        await dropClient.query(`DROP DATABASE IF EXISTS testdb_uboq_fresh_mig`);
      } finally {
        await dropClient.end();
      }
    }
  }
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  main().catch((err) => {
    console.error('MIGRATION_VERIFICATION_FAILED:', err.message || err);
    process.exit(1);
  });
}
