'use strict';

/**
 * OneSystemsERP Phase 9 — Full-Schema Local PostgreSQL 18 Cleanroom Migration & Verification Runner
 *
 * Specification: GitHub Issue #9 & PR #11
 * Target Engine: Local disposable PostgreSQL 18 cluster bound strictly to 127.0.0.1
 * Zero Cloud / External Dependencies:
 *   - Does NOT read `.env*`, Neon credentials, or Vercel secrets.
 *   - Generates all role passwords and trust-anchor secrets ephemerally in memory via CSPRNG.
 *   - Enforces `scram-sha-256` host/local authentication on the disposable cluster.
 *   - Reconstructs the complete 6-governed-group + 5-operational-role security architecture.
 *   - Reconciles all 39 historical `MANAGED_PG18_RC_V1` migrations via `prisma migrate deploy`
 *     (`252` public tables, `88` FORCE RLS tables, `325` RLS policies, `110` SECURITY DEFINER functions).
 *   - Captures a pre-Phase-9 `pg_dump` custom archive for rollback/recovery verification.
 *   - Executes the unmodified approved Phase 9 migration (`20261118090000_phase9_project_creator_bootstrap`)
 *     as Migration #40 via `prisma migrate deploy` inside a tightly bounded `LOGIN`-only window on
 *     `oserp_preview_migrate_admin` (`NOBYPASSRLS NOCREATEROLE NOCREATEDB`), immediately re-locking
 *     `oserp_preview_migrate_admin` (`NOLOGIN CONNECTION LIMIT 0 PASSWORD NULL`) afterward.
 *   - Exercises authenticated `createProjectProfile`, automatic creator assignment, signed RLS proof
 *     enforcement, RBAC matrix checks, negative authorization/spoofing/replay cases, transactional
 *     rollback atomicity, and full database-level backup/restore rollback to Migration #39.
 */

const fs = require('node:fs');
const os = require('node:os');
const net = require('node:net');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');
const ts = require('typescript');

const {
  RC_ID,
  CANONICAL_MIG14_SHA256,
  HISTORICAL_MIG15_SHA256,
  CANDIDATE_MIG15_SHA256,
  loadRcDiskMigrations,
  inspectTargetForManagedPg18Rc,
  evaluateRolePostureForManagedPg18Rc,
} = require('./verify-managed-pg18-rc-v1-gate.cjs');

const PINNED_APPROVED_BASE_SHA = 'e51be896907620d3c0945d779af37ca99151219c';
const PINNED_PHASE9_MIGRATION_SHA256 =
  '89ad5e8bcbbaf33564d0f4a77ffd39874ec2496b85d3140b52c30e82733f27df';
const PINNED_RC_SCHEMA_SHA256 =
  'f40364eec636e153226890abfd3e7bc81ac6b7dfa635f59bc2326537fd62eb08';

// Independently pinned 39-entry MANAGED_PG18_RC_V1 release-candidate manifest digests
const PINNED_RC_V1_MIGRATIONS = Object.freeze([
  ['20260626065906_init_postgres', '2bd70e7d248d0c7bf390e40dd06112a74176194223891980a54696a3a0cbbef0'],
  ['20260714_reconcile_pre_phase3_schema_drift', 'ddb1edbf673e68c457dbbe00f15ee00bd74c49cb3b0c3f9776565e68ee12a3a3'],
  ['20260714190000_phase3_baseline_workflow', '09f9b86981385183178ff2ec070ea1f25ced2421c00ffdbb3a298c3eebe5c599'],
  ['20260714200000_harden_schedule_baseline_activation', '0c326f801a994ddb2f6bcfa13e8324ac6648271b9a64186cb60ae9ada6fe08ea'],
  ['20260715_reconcile_gate7_boq_integrity_metadata', 'cfd688ce6004fc83edec59fc52dd17d16a49d26fd447b9b7389e8c029dad394a'],
  ['20260715100000_security_remediation', 'c6c8392bf8eebb7abf4b45cc86746b80d0f5d88b6add98d7053d1cb34ba7dce1'],
  ['20260717000000_add_schedule_workflow_transition_provenance', '95f0cf1996d996af5f02493f70a8f80a4ae612987ec3dffda8d9e750a5cf6bf5'],
  ['20260718000000_add_password_recovery', 'ccd302beff8930faa5950f4f1c1f423b4cdf3aa56eff6a2d3c0f6dbff717049a'],
  ['20260720000001_auth_password_recovery', '9624d9ed6873e0965edeac42fbcb82e0bdf8ed6684f5a711b5b7c25020c9d3cd'],
  ['20260720000002_scheduling_enums_fields', '5fa362abf342fdebd7971dd18ca0d5fbc5ff2dac8e4a8c85dd5c2ae6d1eb0d99'],
  ['20260720000003_scheduling_approvals_comments', '14c155aa296c609b83fe830d79eba35dc0cb60bed497bf5a24b9505d932c2a48'],
  ['20260720000004_baseline_activation_provenance', 'd2265c0bef88ebb29561e9b3437b79dca98bd46c057e9c2c70ba07dc973ee5eb'],
  ['20260724125410_reconcile_schema_foreign_keys', 'b85c7660d85a7d632b9eafcd4b124c1a814ab487dd69fb3403cb4865f79d8cad'],
  ['20261104193000_add_uboq_engine_and_g01_exc_01', 'a4accf399ceeccd246e98f659dd1057805583e61af247a1a88f6e060a8b2016e'],
  ['20261104233000_uboq_g02_remediation_hardening', 'f3398e991a045195a4903f32da2e71897d11c55a09a6edc6a2bbc2bb0bff35c8'],
  ['20261105043000_uboq_g02_r1_security_and_cleanup_hardening', '1f7a6a3efd4b901a073df882df4075ca05cbe98bb3b0fc30b9bb9f2210d6729f'],
  ['20261111120000_uboq_g02_r3_evidence_legacy_cleanup', '3de05edf66e8f1fa95f0546fa87fe6b92024e3b1295d10d2bb386e5ce1d1740b'],
  ['20261112120000_h02b_verified_employer_payroll', '00817af5d20da8bcff4efaf1fff07b75cba3f83b04014b60e241d137e930ee71'],
  ['20261112143000_h02b_dependency_and_history_guards', 'b023862e552d191aba31755ce60f06c678bddfb6c75fbf554b62eaf0a05d4d26'],
  ['20261112160000_h02b_verified_period_child_ownership', '69e8c08a968962b1088b410dae11e1bc8e8fd99ee4efe6af7fd3d5e96d023c54'],
  ['20261113090000_g02_bounded_cleanup_project_payroll', 'b92590b5aa1deaafa6063a48c1efb026d51524da3085049a70732de62d73bb07'],
  ['20261113093000_g02_project_cutoff_compatibility', '60cc6e7ba2a84f108bd876206a3aeca639e83d276ade8ec8a30b258e1cea8d11'],
  ['20261113110000_g02_operation_reads_and_worker_projection', 'b4f4f57659c371b37d4639c632eaf7380e608ca6e12508f41525d06d49eb88a2'],
  ['20261113130000_wp3_increment02_saved_layouts_and_formal_exports', 'bfc43cdb1d4d638edf5d38d80451019b3eb925cf6f03c4ffe46143941018aac8'],
  ['20261113140000_wp3_increment02_audit_auth_and_contract_link', '4cfd19707162a69266f3adc6baf48591a6fd95290036fbfffdf010f97a555448'],
  ['20261113150000_wp3_batch_a_t2_t4_templates_and_formal_t4_guard', 'b15ab3fbcbb770b2f2051b4e824b49ee6e58b2f3e83cd8bf194664bd74dce3ce'],
  ['20261113160000_wp3_batch_a_audit_select_financial_guard', '5be3416bd1d8fbc8b63704f100681020717358692bacda99c61daa59a20c646f'],
  ['20261113170000_wp3_batch_b_t5_t7_templates_rls_and_formal_guards', '5efabd58b25f529e588244b67ac2496573d3516f2d716677390a0389353b896a'],
  ['20261113180000_wp3_batch_b_ir_historical_snapshot_and_inspection_guards', '10e045ba8a4686038b8dd4c709265d608abb63a03bf6d9b91c58b4bf2c634752'],
  ['20261113190000_wp3_batch_c_t8_t10_templates_and_commitment_cashflow_rls', '4e99b7ab8a22793316fd1e23bf0a47c6c7b345e597d0f7e5d40cf64578724c9b'],
  ['20261113200000_wp3_batch_c_ir_receipt_budget_and_export_audit_hardening', '0689880947acc2dc7cb973decf5ea4e2e45e63e9bec7e4d4f1b5cb5e01114735'],
  ['20261113210000_wp3_batch_c_r2_audit_receipt_and_budget_authority', '087f69d4edc1ca82126d4d4d059453eb3aac322a3fd84cd780b4fb49e58f57e3'],
  ['20261113220000_wp3_batch_d_signed_t0_t1_roundtrip_import', 'ab6209317fa5634f682610770daaae695f9ad47bc8b2110ef56328f74d6d2e33'],
  ['20261113230000_wp3_batch_d_d2_t11_t12_rls_and_formal_guards', 'ca25baee3da255c9cf624f38ceb8ddbda6358f5f2a7990946b384836a9d8a359'],
  ['20261114000000_wp3_batch_d_d2_r1_ir_rls_and_lineage_hardening', '416a397e531259641ead7bb8dc8a17c4be848884bc4dccdd220aea550501445e'],
  ['20261114010000_wp3_batch_d_d2_r1_subcon_vo_and_export_log_policy_scope', '69faed9e29874500c7a0fb9a19b80c0d0a36a4d088dd8045382ca6344d240288'],
  ['20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard', '39eb48330d27e4a3b4192f970c0156045577cc4fd15e92c91133bfc6dc1564ac'],
  ['20261116010000_wp3_batch_d_d2_r3_finished_timestamp_immutability', '749fd75245904e4f3284a2849b36092279f150e543d93232aaad7c103b715985'],
  ['20261116020000_uboq_release_readiness_m23_xid_rollover_hardening', '8a59460606809aa46a835f86ec82cffb076e7b727a60aa65622b4313376fce62'],
]);

function sha256Buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function readCanonicalGitBlobVerified(relPosixPath) {
  const blobBuf = execFileSync('git', ['show', `${PINNED_APPROVED_BASE_SHA}:${relPosixPath}`], {
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
  });
  const headBuf = execFileSync('git', ['show', `HEAD:${relPosixPath}`], {
    cwd: ROOT,
    maxBuffer: 32 * 1024 * 1024,
  });
  assert.equal(
    sha256Buf(headBuf),
    sha256Buf(blobBuf),
    `HEAD blob diverged from pinned approved commit ${PINNED_APPROVED_BASE_SHA}: ${relPosixPath}`
  );
  const diskBuf = fs.readFileSync(path.resolve(ROOT, relPosixPath));
  assert.equal(
    diskBuf.toString('utf8').replaceAll('\r\n', '\n'),
    blobBuf.toString('utf8').replaceAll('\r\n', '\n'),
    `Working-tree file drifted from pinned commit ${PINNED_APPROVED_BASE_SHA}: ${relPosixPath}`
  );
  return blobBuf;
}

function stageCanonical39RcBundle(targetDir) {
  const migsDir = path.join(targetDir, 'migrations');
  fs.mkdirSync(migsDir, { recursive: true });
  const rcSchemaBlob = readCanonicalGitBlobVerified('prisma/managed-pg18-rc-v1/schema.prisma');
  assert.equal(sha256Buf(rcSchemaBlob), PINNED_RC_SCHEMA_SHA256, 'RC schema SHA-256 mismatch');
  fs.writeFileSync(path.join(targetDir, 'schema.prisma'), rcSchemaBlob);

  const entries = fs
    .readdirSync(RC_MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  assert.equal(entries.length, PINNED_RC_V1_MIGRATIONS.length);
  const pinnedByName = new Map(PINNED_RC_V1_MIGRATIONS);

  for (const dirName of entries) {
    assert.ok(pinnedByName.has(dirName), `Unpinned RC migration directory: ${dirName}`);
    const rcRel = `prisma/managed-pg18-rc-v1/migrations/${dirName}/migration.sql`;
    const histRel = `prisma/migrations/${dirName}/migration.sql`;
    const rcBlob = readCanonicalGitBlobVerified(rcRel);
    const histBlob = readCanonicalGitBlobVerified(histRel);
    const rcSha = sha256Buf(rcBlob);
    const histSha = sha256Buf(histBlob);

    assert.equal(
      rcSha,
      pinnedByName.get(dirName),
      `RC migration ${dirName} SHA-256 diverged from pinned release manifest`
    );

    if (dirName === '20261104193000_add_uboq_engine_and_g01_exc_01') {
      assert.equal(rcSha, CANONICAL_MIG14_SHA256);
      assert.equal(histSha, CANONICAL_MIG14_SHA256);
    } else if (dirName === '20261104233000_uboq_g02_remediation_hardening') {
      assert.equal(histSha, HISTORICAL_MIG15_SHA256);
      assert.equal(rcSha, CANDIDATE_MIG15_SHA256);
    } else {
      assert.equal(
        rcBlob.toString('utf8').replaceAll('\r\n', '\n'),
        histBlob.toString('utf8').replaceAll('\r\n', '\n'),
        `Unexpected SQL content delta on ${dirName}`
      );
    }

    const dst = path.join(migsDir, dirName);
    fs.mkdirSync(dst, { recursive: true });
    fs.writeFileSync(path.join(dst, 'migration.sql'), rcBlob);
  }

  assert.equal(
    readCanonicalGitBlobVerified('prisma/schema.prisma').toString('utf8').replaceAll('\r\n', '\n'),
    rcSchemaBlob.toString('utf8').replaceAll('\r\n', '\n'),
    'RC schema.prisma diverged from canonical prisma/schema.prisma'
  );

  const rcDisk = loadRcDiskMigrations(migsDir);
  assert.deepEqual(
    rcDisk.map((m) => [m.migrationName, m.sha256]),
    PINNED_RC_V1_MIGRATIONS.map(([n, s]) => [n, s]),
    'Staged RC disk migrations diverged from pinned release manifest order/digests'
  );
  const rcAuthority = {
    releaseCandidateId: RC_ID,
    originMainCommit: 'd08740b50d2c0eee9110497f247e213c20d0e06e',
    originMainCount: 8,
    releaseBaselineCommit: 'e98f5dba487828e272a62890f545035e69ad8d8c',
    releaseBaselineCount: 13,
    historicalMig15Sha256: HISTORICAL_MIG15_SHA256,
    candidateMig15Sha256: CANDIDATE_MIG15_SHA256,
    approved: PINNED_RC_V1_MIGRATIONS.map(([migrationName, sha256], idx) => ({
      index: idx + 1,
      migrationName,
      relPath: `${migsDir}/${migrationName}/migration.sql`,
      sha256,
    })),
  };
  return { schemaPath: path.join(targetDir, 'schema.prisma'), migsDir, rcDisk, rcAuthority };
}

const ROOT = process.cwd();
const PG_BIN = process.env.PHASE9_PG_BIN || 'C:/Program Files/PostgreSQL/18/bin';
const PRISMA_CLI_JS = path.resolve(ROOT, 'node_modules/prisma/build/index.js');
const RC_SCHEMA_PATH = path.resolve(ROOT, 'prisma/managed-pg18-rc-v1/schema.prisma');
const RC_MIGRATIONS_DIR = path.resolve(ROOT, 'prisma/managed-pg18-rc-v1/migrations');
const PHASE9_MIGRATION_NAME = '20261118090000_phase9_project_creator_bootstrap';
const PHASE9_MIGRATION_REL = `prisma/migrations/${PHASE9_MIGRATION_NAME}/migration.sql`;
const PHASE9_MIGRATION_ABS = path.resolve(ROOT, PHASE9_MIGRATION_REL);
const INVENTORY_SQL_ABS = path.resolve(ROOT, 'scripts/uboq/phase9-cleanroom-inventory.sql');

const CLEANROOM_DB = 'oserp_uboq_cleanroom';
const RESTORED_DB = 'oserp_uboq_cleanroom_restored';

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function randomHex(bytes = 24) {
  return crypto.randomBytes(bytes).toString('hex');
}

function findFreeLoopbackPort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close((err) => (err ? reject(err) : resolve(port)));
    });
  });
}

function buildCleanChildEnv(extraEnv = {}) {
  const clean = {};
  for (const [key, val] of Object.entries(process.env)) {
    if (
      /^PG/i.test(key) ||
      /^(DATABASE_URL|DIRECT_URL|SHADOW_DATABASE_URL|COMPANY_PAYROLL_DATABASE_URL)$/i.test(key) ||
      /^(NEON_|VERCEL_)/i.test(key)
    ) {
      continue;
    }
    clean[key] = val;
  }
  return { ...clean, ...extraEnv };
}

function runPgBin(exeName, args, extraEnv = {}, timeoutMs = 120000, ignoreStdio = false) {
  const exePath = path.join(PG_BIN, process.platform === 'win32' ? `${exeName}.exe` : exeName);
  assert.ok(fs.existsSync(exePath), `Required PostgreSQL 18 binary missing: ${exePath}`);
  const sanitizedEnv = buildCleanChildEnv(extraEnv);
  if (ignoreStdio) {
    execFileSync(exePath, args, {
      env: sanitizedEnv,
      stdio: 'ignore',
      windowsHide: true,
      timeout: timeoutMs,
    });
    return '';
  }
  return execFileSync(exePath, args, {
    env: sanitizedEnv,
    encoding: 'utf8',
    windowsHide: true,
    timeout: timeoutMs,
    maxBuffer: 32 * 1024 * 1024,
  });
}

function runPrismaDeploy(schemaPath, databaseUrl, timeoutMs = 240000) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const child = spawn(
      process.execPath,
      [PRISMA_CLI_JS, 'migrate', 'deploy', `--schema=${schemaPath}`],
      {
        cwd: ROOT,
        env: buildCleanChildEnv({
          DATABASE_URL: databaseUrl,
          DIRECT_URL: databaseUrl,
        }),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        windowsHide: true,
      }
    );

    const timer = setTimeout(() => {
      try {
        child.kill('SIGKILL');
      } catch {}
      reject(new Error(`prisma migrate deploy timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    timer.unref();

    child.stdout.on('data', (d) => {
      stdout += d.toString('utf8');
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString('utf8');
    });
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        const redacted = `${stdout}\n${stderr}`.replace(/postgresql:\/\/[^\s"']+/gi, '[REDACTED_URL]');
        reject(new Error(`prisma migrate deploy exited ${code}:\n${redacted.slice(-2000)}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function loadTranspiledTsModule(relFile, deps, envVars = {}) {
  const absFile = path.resolve(ROOT, relFile);
  const source = fs.readFileSync(absFile, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const moduleExports = {};
  const sandboxModule = { exports: moduleExports };
  vm.runInNewContext(
    transpiled,
    {
      exports: moduleExports,
      module: sandboxModule,
      Buffer,
      FormData,
      URL,
      console,
      setTimeout,
      clearTimeout,
      globalThis: {},
      process: { env: envVars },
      require: (specifier) => {
        if (Object.prototype.hasOwnProperty.call(deps, specifier)) {
          return deps[specifier];
        }
        throw new Error(`Unallowlisted dependency in cleanroom VM: ${specifier}`);
      },
    },
    { filename: absFile }
  );
  return sandboxModule.exports;
}

async function queryCatalogSummary(client) {
  const counts = (
    await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')) AS public_tables,
        (SELECT COUNT(*)::int FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relforcerowsecurity) AS force_rls_tables,
        (SELECT COUNT(*)::int FROM pg_policy p JOIN pg_class c ON c.oid = p.polrelid
           JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public') AS public_rls_policies,
        (SELECT COUNT(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
           WHERE n.nspname = 'public' AND p.prosecdef) AS public_security_definer_functions,
        (SELECT COUNT(*)::int FROM public._prisma_migrations
           WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) AS completed_migrations,
        (SELECT COUNT(*)::int FROM public._prisma_migrations
           WHERE migration_name = $1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL) AS phase9_entries
    `, [PHASE9_MIGRATION_NAME])
  ).rows[0];
  return counts;
}

async function verifyPostPhase9RoleGraph(client) {
  const membershipEdges = (
    await client.query(`
      SELECT
        g.rolname AS group_name,
        m_role.rolname AS member_name,
        m.admin_option,
        m.inherit_option,
        m.set_option
      FROM pg_auth_members m
      JOIN pg_roles g ON g.oid = m.roleid
      JOIN pg_roles m_role ON m_role.oid = m.member
      ORDER BY g.rolname ASC, m_role.rolname ASC, m.admin_option DESC
    `)
  ).rows;

  const pgRoles = (
    await client.query(`
      SELECT
        rolname,
        rolsuper,
        rolinherit,
        rolcreaterole,
        rolcreatedb,
        rolcanlogin,
        rolreplication,
        rolbypassrls,
        rolconnlimit
      FROM pg_roles
      WHERE rolname !~ '^pg_'
         OR oid IN (SELECT roleid FROM pg_auth_members UNION SELECT member FROM pg_auth_members)
      ORDER BY rolname ASC
    `)
  ).rows;

  return evaluateRolePostureForManagedPg18Rc(
    pgRoles,
    40,
    {
      requireLockedMigrateAdmin: true,
      requireExplicitMembershipOptions: true,
      passwordNullCheckedViaPgAuthid: false,
    },
    membershipEdges
  );
}

async function main() {
  const startedAtIso = new Date().toISOString();
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-p9-cleanroom-pg18-'));
  if (process.platform === 'win32') {
    const currentUser = os.userInfo().username;
    execFileSync(
      'icacls',
      [runtimeDir, '/inheritance:r', '/grant:r', `${currentUser}:(OI)(CI)F`, '*S-1-5-18:(OI)(CI)F'],
      { stdio: 'ignore', windowsHide: true, timeout: 15000 }
    );
  } else {
    fs.chmodSync(runtimeDir, 0o700);
  }
  const dataDir = path.join(runtimeDir, 'data');
  const logPath = path.join(runtimeDir, 'postgres.log');
  const superPwFile = path.join(runtimeDir, 'bootstrap-super.pw');
  const backupDumpPath = path.join(runtimeDir, 'cleanroom-pre-phase9-39migs.dump');
  const stagedRc39Dir = path.join(runtimeDir, 'prisma-rc-39mig-bundle');
  const stagedBundleDir = path.join(runtimeDir, 'prisma-phase9-40mig-bundle');
  const phase9CanonicalBlob = readCanonicalGitBlobVerified(PHASE9_MIGRATION_REL);
  let stagedRc39 = null;

  // Ephemeral in-memory secrets (never logged or persisted)
  const secrets = {
    bootstrapSuperPw: randomHex(24),
    dbOwnerPw: randomHex(24),
    roleCreatorPw: randomHex(24),
    roPw: randomHex(24),
    migrateAdminInitialPw: randomHex(24),
    migrateAdminPhase9WindowPw: randomHex(24),
    runtimeAppPw: randomHex(24),
    directAppPw: randomHex(24),
    payrollAppPw: randomHex(24),
    uboqRlsSecretHex: randomHex(32),
    companyPayrollSecretHex: randomHex(32),
  };

  const checks = [];
  const recordCheck = async (name, fn) => {
    await fn();
    checks.push({ id: checks.length + 1, name, status: 'PASS' });
    console.log(`PASS [${checks.length}] ${name}`);
  };

  let clusterStarted = false;
  let port = null;
  let runtimePrisma = null;
  const openClients = [];

  const trackClient = (c) => {
    openClients.push(c);
    return c;
  };

  const connectAs = async (user, password, database = CLEANROOM_DB, extraOptions = '') => {
    const c = trackClient(
      new Client({
        host: '127.0.0.1',
        port,
        user,
        password,
        database,
        ssl: false,
        connectionTimeoutMillis: 15000,
        query_timeout: 30000,
        ...(extraOptions ? { options: extraOptions } : {}),
      })
    );
    await c.connect();
    return c;
  };

  const buildLocalUrl = (user, password, database = CLEANROOM_DB) => {
    const u = new URL(`postgresql://127.0.0.1:${port}/${database}`);
    u.username = user;
    u.password = password;
    u.searchParams.set('sslmode', 'disable');
    u.searchParams.set('schema', 'public');
    return u.toString();
  };

  const report = {
    suite: 'OSERP_PHASE9_CLEANROOM_LOCAL_PG18',
    startedAt: startedAtIso,
    completedAt: null,
    status: 'RUNNING',
    gitHeadSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(),
    phase9MigrationName: PHASE9_MIGRATION_NAME,
    phase9MigrationSha256: sha256Buf(phase9CanonicalBlob),
    postgresBinaryVersions: {},
    clusterIdentity: null,
    prePhase9Baseline: null,
    postPhase9State: null,
    restoredRollbackState: null,
    checks,
  };

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Verify local PostgreSQL 18 binaries & immutable Phase 9 SQL
    // -------------------------------------------------------------------------
    await recordCheck('PostgreSQL 18 local binaries and unmodified Phase 9 SQL verified', async () => {
      for (const binName of ['postgres', 'initdb', 'pg_ctl', 'psql', 'pg_dump', 'pg_restore']) {
        const ver = runPgBin(binName, ['--version']).trim();
        assert.match(ver, /\(PostgreSQL\)\s+18\./, `Expected PostgreSQL 18 for ${binName}, got: ${ver}`);
        report.postgresBinaryVersions[binName] = ver;
      }
      stagedRc39 = stageCanonical39RcBundle(stagedRc39Dir);
      assert.equal(stagedRc39.rcDisk.length, 39);
      assert.equal(stagedRc39.rcAuthority.approved.length, 39);
      assert.equal(
        report.phase9MigrationSha256,
        PINNED_PHASE9_MIGRATION_SHA256,
        'Phase 9 migration.sql SHA-256 diverged from pinned approved specification'
      );
    });

    // -------------------------------------------------------------------------
    // STEP 3: Initialize fresh isolated loopback PostgreSQL 18 cluster (SCRAM)
    // -------------------------------------------------------------------------
    port = await findFreeLoopbackPort();
    fs.writeFileSync(superPwFile, `${secrets.bootstrapSuperPw}\n`, { mode: 0o600 });

    runPgBin('initdb', [
      '-D',
      dataDir,
      '-U',
      'cleanroom_bootstrap_super',
      `--pwfile=${superPwFile}`,
      '--auth-local=scram-sha-256',
      '--auth-host=scram-sha-256',
      '--no-locale',
      '--encoding=UTF8',
    ]);
    fs.unlinkSync(superPwFile);

    clusterStarted = true;
    runPgBin(
      'pg_ctl',
      ['-D', dataDir, '-l', logPath, '-o', `-h 127.0.0.1 -p ${port}`, '-w', 'start'],
      {},
      60000,
      true
    );

    await recordCheck('Fresh loopback-only PostgreSQL 18 SCRAM cluster & non-superuser DB owner initialized', async () => {
      const superClient = await connectAs('cleanroom_bootstrap_super', secrets.bootstrapSuperPw, 'postgres');
      try {
        await superClient.query("SET password_encryption = 'scram-sha-256'");
        await superClient.query(
          `CREATE ROLE cleanroom_db_owner LOGIN NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS INHERIT PASSWORD '${secrets.dbOwnerPw}'`
        );
        await superClient.query(`GRANT pg_read_all_data TO cleanroom_db_owner`);
        await superClient.query(
          `CREATE ROLE prov_role_admin LOGIN NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS INHERIT PASSWORD '${secrets.roleCreatorPw}'`
        );
        await superClient.query(`CREATE DATABASE "${CLEANROOM_DB}" OWNER cleanroom_db_owner`);
        await superClient.query(`CREATE DATABASE "${RESTORED_DB}" OWNER cleanroom_db_owner`);
      } finally {
        await superClient.end();
      }

      const dbOwnerClient = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, CLEANROOM_DB);
      try {
        const idRow = (
          await dbOwnerClient.query(`
            SELECT
              current_database() AS db,
              current_user AS usr,
              host(inet_server_addr()) AS listen_host,
              inet_server_port()::int AS listen_port,
              current_setting('server_version_num')::int AS server_version_num,
              current_setting('password_encryption') AS password_encryption,
              r.rolsuper,
              r.rolcreaterole,
              r.rolbypassrls
            FROM pg_roles r
            WHERE r.rolname = current_user
          `)
        ).rows[0];
        assert.equal(idRow.db, CLEANROOM_DB);
        assert.equal(idRow.listen_host, '127.0.0.1');
        assert.equal(idRow.listen_port, port);
        assert.ok(idRow.server_version_num >= 180000 && idRow.server_version_num < 190000);
        assert.equal(idRow.rolsuper, false);
        assert.equal(idRow.rolcreaterole, true);
        assert.equal(idRow.rolbypassrls, true);
        report.clusterIdentity = {
          database: idRow.db,
          listenHost: idRow.listen_host,
          serverVersionNum: idRow.server_version_num,
          passwordEncryption: idRow.password_encryption,
          nonSuperuserDbOwner: idRow.usr,
        };
      } finally {
        await dbOwnerClient.end();
      }
    });

    // -------------------------------------------------------------------------
    // STEP 4 & 5: Reconstruct 5 operational roles + deploy all 39 RC migrations
    // -------------------------------------------------------------------------
    await recordCheck('Operational roles provisioned & empty-target MANAGED_PG18_RC_V1 preflight passed', async () => {
      const roleCreatorClient = await connectAs('prov_role_admin', secrets.roleCreatorPw, 'postgres');
      try {
        await roleCreatorClient.query('BEGIN');
        await roleCreatorClient.query("SET LOCAL password_encryption = 'scram-sha-256'");
        await roleCreatorClient.query(
          `CREATE ROLE oserp_preview_preflight_ro LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT PASSWORD '${secrets.roPw}'`
        );
        await roleCreatorClient.query(
          `CREATE ROLE oserp_preview_migrate_admin LOGIN NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS INHERIT PASSWORD '${secrets.migrateAdminInitialPw}'`
        );
        await roleCreatorClient.query(
          `CREATE ROLE oserp_preview_runtime_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT PASSWORD '${secrets.runtimeAppPw}'`
        );
        await roleCreatorClient.query(
          `CREATE ROLE oserp_preview_direct_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT CONNECTION LIMIT 10 PASSWORD '${secrets.directAppPw}'`
        );
        await roleCreatorClient.query(
          `CREATE ROLE oserp_preview_payroll_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT PASSWORD '${secrets.payrollAppPw}'`
        );
        await roleCreatorClient.query(`ALTER ROLE oserp_preview_preflight_ro SET default_transaction_read_only = on`);
        await roleCreatorClient.query(`ALTER ROLE oserp_preview_migrate_admin SET createrole_self_grant = 'set, inherit'`);
        await roleCreatorClient.query('COMMIT');
      } catch (err) {
        await roleCreatorClient.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        await roleCreatorClient.end();
      }

      const ownerClient = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, CLEANROOM_DB);
      try {
        await ownerClient.query('BEGIN');
        for (const rn of [
          'oserp_preview_preflight_ro',
          'oserp_preview_migrate_admin',
          'oserp_preview_runtime_app',
          'oserp_preview_direct_app',
          'oserp_preview_payroll_app',
        ]) {
          await ownerClient.query(`GRANT CONNECT ON DATABASE "${CLEANROOM_DB}" TO ${rn}`);
        }
        await ownerClient.query(`GRANT USAGE ON SCHEMA public TO oserp_preview_preflight_ro`);
        await ownerClient.query(`GRANT ALL ON SCHEMA public TO oserp_preview_migrate_admin`);
        await ownerClient.query(`GRANT CREATE ON SCHEMA public TO PUBLIC`);
        await ownerClient.query(`GRANT CREATE ON DATABASE "${CLEANROOM_DB}" TO oserp_preview_migrate_admin`);
        await ownerClient.query('COMMIT');
      } catch (err) {
        await ownerClient.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        await ownerClient.end();
      }

      const roClient = await connectAs('oserp_preview_preflight_ro', secrets.roPw, CLEANROOM_DB);
      try {
        const preVerdict = await inspectTargetForManagedPg18Rc(
          roClient,
          stagedRc39.rcDisk,
          stagedRc39.rcAuthority,
          { allowEmpty: true }
        );
        assert.equal(preVerdict.eligible, true, JSON.stringify(preVerdict));
        assert.equal(preVerdict.classification, 'ELIGIBLE_APPROVED_EMPTY_BASELINE');
      } finally {
        await roClient.end();
      }
    });

    await recordCheck('All 39 MANAGED_PG18_RC_V1 historical migrations reconciled & role lockdown verified', async () => {
      const migrateUrl = buildLocalUrl('oserp_preview_migrate_admin', secrets.migrateAdminInitialPw, CLEANROOM_DB);
      await runPrismaDeploy(stagedRc39.schemaPath, migrateUrl);

      // Apply Checkpoint 4 runtime grants & fresh cleanroom-only trust anchors
      const migClient = await connectAs(
        'oserp_preview_migrate_admin',
        secrets.migrateAdminInitialPw,
        CLEANROOM_DB
      );
      try {
        await migClient.query('BEGIN');
        await migClient.query(
          `GRANT SELECT ON TABLE public."_prisma_migrations" TO oserp_preview_preflight_ro, oserp_preview_direct_app`
        );
        await migClient.query(
          `REVOKE ALL ON TABLE public."_prisma_migrations" FROM oserp_preview_runtime_app, oserp_preview_payroll_app`
        );
        await migClient.query(
          `GRANT oserp_compat_app TO oserp_preview_runtime_app, oserp_preview_direct_app WITH INHERIT TRUE, SET TRUE, ADMIN FALSE`
        );
        await migClient.query(
          `GRANT oserp_company_payroll_app TO oserp_preview_payroll_app WITH INHERIT TRUE, SET TRUE, ADMIN FALSE`
        );
        await migClient.query(`SET LOCAL ROLE oserp_migrations_owner`);
        await migClient.query(
          `INSERT INTO public."_uboq_rls_trust_anchor" ("anchorId", "secretHex", "rotatedAt")
           VALUES ('PRIMARY', $1, NOW())
           ON CONFLICT ("anchorId") DO UPDATE SET "secretHex" = EXCLUDED."secretHex", "rotatedAt" = NOW()`,
          [secrets.uboqRlsSecretHex]
        );
        await migClient.query(`RESET ROLE`);
        await migClient.query(
          `INSERT INTO public._company_payroll_trust_anchor (id, secret_hex)
           VALUES (true, $1)
           ON CONFLICT (id) DO UPDATE SET secret_hex = EXCLUDED.secret_hex`,
          [secrets.companyPayrollSecretHex]
        );
        await migClient.query('COMMIT');
      } catch (err) {
        await migClient.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        await migClient.end();
      }

      // Lock `oserp_preview_migrate_admin` via `prov_role_admin`, revoke PUBLIC CREATE, and drop `prov_role_admin`
      // so zero residual ADMIN OPTION edges exist on `oserp_preview_migrate_admin` at rest (exact 9-edge parity).
      const provLockClient = await connectAs('prov_role_admin', secrets.roleCreatorPw, 'postgres');
      try {
        await provLockClient.query(
          `ALTER ROLE oserp_preview_migrate_admin NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0 PASSWORD NULL`
        );
      } finally {
        await provLockClient.end();
      }

      const lockClient = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, CLEANROOM_DB);
      try {
        await lockClient.query('BEGIN');
        await lockClient.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
        await lockClient.query(`REVOKE CREATE ON DATABASE "${CLEANROOM_DB}" FROM oserp_preview_migrate_admin`);
        await lockClient.query('COMMIT');
      } catch (err) {
        await lockClient.query('ROLLBACK').catch(() => {});
        throw err;
      } finally {
        await lockClient.end();
      }

      const dropProvClient = await connectAs('cleanroom_bootstrap_super', secrets.bootstrapSuperPw, 'postgres');
      try {
        await dropProvClient.query(`DROP ROLE prov_role_admin`);
      } finally {
        await dropProvClient.end();
      }

      // Verify 39/39 checksum parity, bidirectional role posture, and baseline object counts
      const roClient = await connectAs('oserp_preview_preflight_ro', secrets.roPw, CLEANROOM_DB);
      try {
        const post39Verdict = await inspectTargetForManagedPg18Rc(
          roClient,
          stagedRc39.rcDisk,
          stagedRc39.rcAuthority,
          { allowEmpty: false }
        );
        assert.equal(post39Verdict.eligible, true, JSON.stringify(post39Verdict));
        assert.equal(post39Verdict.classification, 'ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE');
        assert.equal(post39Verdict.verifiedMigrationCount, 39);
        assert.equal(post39Verdict.pendingMigrationCount, 0);
        assert.equal(post39Verdict.roleSecurityPosture.ok, true);
      } finally {
        await roClient.end();
      }

      // Run hardened `phase9-cleanroom-inventory.sql` via PG18 `psql` as `cleanroom_db_owner` (read-only enforced)
      const invOut = runPgBin(
        'psql',
        [
          '-X',
          '-P',
          'pager=off',
          '-v',
          'ON_ERROR_STOP=1',
          '-h',
          '127.0.0.1',
          '-p',
          String(port),
          '-U',
          'cleanroom_db_owner',
          '-d',
          CLEANROOM_DB,
          '-f',
          INVENTORY_SQL_ABS,
        ],
        {
          PGHOST: '127.0.0.1',
          PGHOSTADDR: '127.0.0.1',
          PGPORT: String(port),
          PGUSER: 'cleanroom_db_owner',
          PGPASSWORD: secrets.dbOwnerPw,
          PGSSLMODE: 'disable',
          PGOPTIONS: '-c default_transaction_read_only=on',
        }
      );
      assert.match(invOut, /READ_ONLY_ENFORCED/);
      assert.match(invOut, /LOCAL_LOOPBACK_127\.0\.0\.1/);

      const ownerAudit = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, CLEANROOM_DB);
      try {
        const summary39 = await queryCatalogSummary(ownerAudit);
        assert.equal(summary39.completed_migrations, 39);
        assert.equal(summary39.phase9_entries, 0);
        assert.equal(summary39.public_tables, 252);
        assert.equal(summary39.force_rls_tables, 88);
        assert.equal(summary39.public_rls_policies, 325);
        assert.equal(summary39.public_security_definer_functions, 110);
        report.prePhase9Baseline = summary39;
      } finally {
        await ownerAudit.end();
      }
    });

    // Capture pre-Phase-9 `pg_dump` backup archive before executing Migration #40
    await recordCheck('Pre-Phase-9 custom backup archive captured via PostgreSQL 18 pg_dump', async () => {
      runPgBin(
        'pg_dump',
        [
          '--format=custom',
          '-h',
          '127.0.0.1',
          '-p',
          String(port),
          '-U',
          'cleanroom_db_owner',
          '-d',
          CLEANROOM_DB,
          '-f',
          backupDumpPath,
        ],
        {
          PGHOST: '127.0.0.1',
          PGHOSTADDR: '127.0.0.1',
          PGPORT: String(port),
          PGUSER: 'cleanroom_db_owner',
          PGPASSWORD: secrets.dbOwnerPw,
          PGSSLMODE: 'disable',
        }
      );
      const st = fs.statSync(backupDumpPath);
      assert.ok(st.size > 50000, `Backup archive unexpectedly small: ${st.size}`);
    });

    // Verify pre-Phase-9 direct nested creation fails closed under runtime role
    await recordCheck('Pre-Phase-9 direct Project & ProjectUserAssignment INSERTs blocked by RLS / ACL', async () => {
      const rtPre = await connectAs('oserp_preview_runtime_app', secrets.runtimeAppPw, CLEANROOM_DB);
      try {
        await assert.rejects(
          () => rtPre.query(`INSERT INTO public."Project" (id, name, "updatedAt") VALUES ('pre-p9', 'Blocked', now())`),
          (err) => err.code === '42501'
        );
        await assert.rejects(
          () =>
            rtPre.query(
              `INSERT INTO public."ProjectUserAssignment" (id, "userId", "projectId", "projectRole", "accessLevel", "updatedAt")
               VALUES ('pre-pua', 'u1', 'pre-p9', 'PROJECT_MANAGER', 'FULL', now())`
            ),
          (err) => err.code === '42501'
        );
      } finally {
        await rtPre.end();
      }
    });

    // -------------------------------------------------------------------------
    // STEP 6: Execute unmodified approved Phase 9 migration (#40) via bounded window
    // -------------------------------------------------------------------------
    await recordCheck('Unmodified Phase 9 migration (#40) applied via bounded NOBYPASSRLS migration window & re-locked', async () => {
      // Stage temporary 40-migration Prisma bundle (exact 39 canonical RC blobs + unmodified Phase 9 #40)
      const stagedMigsDir = path.join(stagedBundleDir, 'migrations');
      fs.mkdirSync(stagedMigsDir, { recursive: true });
      fs.copyFileSync(stagedRc39.schemaPath, path.join(stagedBundleDir, 'schema.prisma'));
      for (const entry of fs.readdirSync(stagedRc39.migsDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const dstDir = path.join(stagedMigsDir, entry.name);
        fs.mkdirSync(dstDir, { recursive: true });
        fs.copyFileSync(
          path.join(stagedRc39.migsDir, entry.name, 'migration.sql'),
          path.join(dstDir, 'migration.sql')
        );
      }
      const dstPhase9Dir = path.join(stagedMigsDir, PHASE9_MIGRATION_NAME);
      fs.mkdirSync(dstPhase9Dir, { recursive: true });
      fs.writeFileSync(path.join(dstPhase9Dir, 'migration.sql'), phase9CanonicalBlob);
      assert.equal(sha256File(path.join(dstPhase9Dir, 'migration.sql')), report.phase9MigrationSha256);

      // Open tightly bounded LOGIN-only window on `oserp_preview_migrate_admin` (`NOBYPASSRLS NOCREATEROLE NOCREATEDB`)
      // and temporarily grant `CREATE ON SCHEMA public` ONLY to trusted NOLOGIN `oserp_migrations_owner`,
      // entering the cleanup scope BEFORE the first grant so BOTH success and failure paths revoke privileges,
      // terminate and poll residual sessions to 0, verify `/not permitted to log in/i` independently of cleared
      // password, clear `PASSWORD NULL`, and verify final pg_authid + schema ACL invariants.
      const windowAdmin = await connectAs('cleanroom_bootstrap_super', secrets.bootstrapSuperPw, 'postgres');
      const schemaOwnerWindow = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, CLEANROOM_DB);
      try {
        let primaryErr = null;
        const cleanupErrors = [];
        try {
          await schemaOwnerWindow.query(`GRANT CREATE ON SCHEMA public TO oserp_migrations_owner`);
          await windowAdmin.query('BEGIN');
          try {
            await windowAdmin.query("SET LOCAL password_encryption = 'scram-sha-256'");
            await windowAdmin.query(
              `ALTER ROLE oserp_preview_migrate_admin LOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 2 PASSWORD '${secrets.migrateAdminPhase9WindowPw}'`
            );
            await windowAdmin.query('COMMIT');
          } catch (openErr) {
            await windowAdmin.query('ROLLBACK').catch(() => {});
            throw openErr;
          }

          const phase9MigrateUrl = buildLocalUrl(
            'oserp_preview_migrate_admin',
            secrets.migrateAdminPhase9WindowPw,
            CLEANROOM_DB
          );
          await runPrismaDeploy(path.join(stagedBundleDir, 'schema.prisma'), phase9MigrateUrl);
        } catch (err) {
          primaryErr = err;
        } finally {
          // 1) Set NOLOGIN + CONNECTION LIMIT 0 first (retaining SCRAM verifier briefly to prove NOLOGIN rejection)
          try {
            await windowAdmin.query(
              `ALTER ROLE oserp_preview_migrate_admin NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0`
            );
          } catch (lockErr) {
            cleanupErrors.push(lockErr);
          }

          // 2) Signal all residual `oserp_preview_migrate_admin` backends and poll until active_sessions === 0
          try {
            await windowAdmin.query(
              `SELECT BOOL_AND(pg_terminate_backend(pid)) AS all_signaled
               FROM pg_stat_activity
               WHERE usename = 'oserp_preview_migrate_admin' AND pid <> pg_backend_pid()`
            );
            const deadline = Date.now() + 5000;
            let remaining = 1;
            while (Date.now() < deadline) {
              remaining = (
                await windowAdmin.query(
                  `SELECT COUNT(*)::int AS n FROM pg_stat_activity WHERE usename = 'oserp_preview_migrate_admin'`
                )
              ).rows[0].n;
              if (remaining === 0) break;
              await new Promise((r) => setTimeout(r, 50));
            }
            assert.equal(remaining, 0, `Residual oserp_preview_migrate_admin sessions remained: ${remaining}`);
          } catch (termErr) {
            cleanupErrors.push(termErr);
          }

          // 3) Exercise NOLOGIN rejection independently while SCRAM verifier is still set (if window password was applied)
          try {
            const hasVerifier = (
              await windowAdmin.query(
                `SELECT rolpassword IS NOT NULL AS hp FROM pg_catalog.pg_authid WHERE rolname = 'oserp_preview_migrate_admin'`
              )
            ).rows[0]?.hp;
            if (hasVerifier) {
              await assert.rejects(
                () =>
                  connectAs(
                    'oserp_preview_migrate_admin',
                    secrets.migrateAdminPhase9WindowPw,
                    CLEANROOM_DB
                  ),
                (err) => err.code === '28000' && /not permitted to log in/i.test(String(err.message || ''))
              );
            }
          } catch (nologinProbeErr) {
            cleanupErrors.push(nologinProbeErr);
          }

          // 4) Clear SCRAM password (`PASSWORD NULL`) and revoke temporary schema CREATE on `oserp_migrations_owner`
          try {
            await windowAdmin.query(`ALTER ROLE oserp_preview_migrate_admin PASSWORD NULL`);
          } catch (pwNullErr) {
            cleanupErrors.push(pwNullErr);
          }
          try {
            await schemaOwnerWindow.query(`REVOKE CREATE ON SCHEMA public FROM oserp_migrations_owner`);
          } catch (revErr) {
            cleanupErrors.push(revErr);
          }

          // 5) Audit post-cleanup state on BOTH success and failure paths before propagating any error
          try {
            const lockAudit = (
              await windowAdmin.query(`
                SELECT
                  rolcanlogin,
                  rolbypassrls,
                  rolcreaterole,
                  rolcreatedb,
                  rolconnlimit,
                  rolpassword IS NOT NULL AS has_password,
                  (SELECT COUNT(*)::int FROM pg_stat_activity WHERE usename = 'oserp_preview_migrate_admin') AS active_sessions
                FROM pg_catalog.pg_authid
                WHERE rolname = 'oserp_preview_migrate_admin'
              `)
            ).rows[0];
            assert.deepEqual(lockAudit, {
              rolcanlogin: false,
              rolbypassrls: false,
              rolcreaterole: false,
              rolcreatedb: false,
              rolconnlimit: 0,
              has_password: false,
              active_sessions: 0,
            });

            const schemaPrivAudit = (
              await schemaOwnerWindow.query(`
                SELECT
                  has_schema_privilege('oserp_migrations_owner', 'public', 'CREATE') AS mig_owner_create,
                  has_schema_privilege('public', 'public', 'CREATE') AS public_create
              `)
            ).rows[0];
            assert.deepEqual(schemaPrivAudit, {
              mig_owner_create: false,
              public_create: false,
            });
          } catch (auditErr) {
            cleanupErrors.push(auditErr);
          }
        }
        if (cleanupErrors.length > 0) {
          throw new AggregateError(
            primaryErr ? [primaryErr, ...cleanupErrors] : cleanupErrors,
            `Phase 9 migration window cleanup/verification encountered ${cleanupErrors.length} error(s)`
          );
        }
        if (primaryErr) {
          throw primaryErr;
        }
      } finally {
        await schemaOwnerWindow.end();
        await windowAdmin.end();
      }

      // Verify ledger state (40/40), exact Phase 9 SHA-256 checksum, function metadata, & role graph
      const auditClient = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, CLEANROOM_DB);
      try {
        const ledgerHealth = (
          await auditClient.query(`SELECT * FROM public.uboq_verify_prisma_migration_ledger_state()`)
        ).rows[0];
        assert.equal(Number(ledgerHealth.total_rows), 40);
        assert.equal(Number(ledgerHealth.finished_active_rows), 40);
        assert.equal(Number(ledgerHealth.unfinished_or_rolled_back_rows), 0);
        assert.equal(Number(ledgerHealth.invalid_checksum_rows), 0);
        assert.equal(Number(ledgerHealth.duplicate_name_groups), 0);

        const p9LedgerRow = (
          await auditClient.query(
            `SELECT checksum, applied_steps_count, finished_at IS NOT NULL AS finished, rolled_back_at
             FROM public._prisma_migrations WHERE migration_name = $1`,
            [PHASE9_MIGRATION_NAME]
          )
        ).rows[0];
        assert.ok(p9LedgerRow && p9LedgerRow.finished && p9LedgerRow.rolled_back_at === null);
        assert.equal(p9LedgerRow.checksum, report.phase9MigrationSha256);
        assert.equal(Number(p9LedgerRow.applied_steps_count), 1);

        const fnMeta = (
          await auditClient.query(`
            SELECT
              pg_get_userbyid(p.proowner) AS owner_name,
              p.prosecdef,
              COALESCE('search_path=pg_catalog' = ANY(p.proconfig), false) AS locked_search_path,
              has_function_privilege('public', p.oid, 'EXECUTE') AS pub_exec,
              has_function_privilege('oserp_compat_app', p.oid, 'EXECUTE') AS compat_exec,
              has_function_privilege('oserp_legacy_app', p.oid, 'EXECUTE') AS legacy_exec,
              has_function_privilege('oserp_maint_cleanup_role', p.oid, 'EXECUTE') AS maint_exec,
              has_function_privilege('oserp_preview_preflight_ro', p.oid, 'EXECUTE') AS ro_exec,
              has_function_privilege('oserp_preview_payroll_app', p.oid, 'EXECUTE') AS payroll_exec
            FROM pg_proc p
            JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = 'phase9_create_project_profile'
          `)
        ).rows[0];
        assert.deepEqual(fnMeta, {
          owner_name: 'oserp_migrations_owner',
          prosecdef: true,
          locked_search_path: true,
          pub_exec: false,
          compat_exec: true,
          legacy_exec: false,
          maint_exec: false,
          ro_exec: false,
          payroll_exec: false,
        });

        const roleVerdict40 = await verifyPostPhase9RoleGraph(auditClient);
        assert.equal(roleVerdict40.ok, true, JSON.stringify(roleVerdict40));

        const summary40 = await queryCatalogSummary(auditClient);
        assert.equal(summary40.completed_migrations, 40);
        assert.equal(summary40.phase9_entries, 1);
        assert.equal(summary40.public_tables, 252);
        assert.equal(summary40.force_rls_tables, 88);
        assert.equal(summary40.public_rls_policies, 325);
        assert.equal(summary40.public_security_definer_functions, 111);
        report.postPhase9State = {
          ...summary40,
          phase9RecordedChecksum: p9LedgerRow.checksum,
          functionMetadata: fnMeta,
          rolePostureClassification: roleVerdict40.classification,
        };
      } finally {
        await auditClient.end();
      }
    });

    // -------------------------------------------------------------------------
    // STEP 7: Functional, Signed RLS, RBAC, Negative, & Recovery Verification
    // -------------------------------------------------------------------------
    // Seed synthetic RBAC & user fixtures via test harness control plane (without altering any oserp_* role or ACL)
    const fixtureAdmin = await connectAs('cleanroom_bootstrap_super', secrets.bootstrapSuperPw, CLEANROOM_DB);
    await fixtureAdmin.query(`
      INSERT INTO public."Role" (id, "roleCode", "roleName", "isActive", "updatedAt") VALUES
        ('role-pm', 'PROJECT_MANAGER', 'Cleanroom Project Manager', true, now()),
        ('role-se', 'SITE_ENGINEER', 'Cleanroom Site Engineer', true, now()),
        ('role-sa', 'SUPER_ADMIN', 'Cleanroom Super Admin', true, now());
      INSERT INTO public."Module" (id, "moduleName", "updatedAt") VALUES
        ('mod-pm', 'PROJECT_MANAGEMENT', now());
      INSERT INTO public."RolePermission" (id, "roleId", "moduleId", "moduleName", "canCreate", "updatedAt") VALUES
        ('perm-pm', 'role-pm', 'mod-pm', 'PROJECT_MANAGEMENT', true, now()),
        ('perm-se', 'role-se', 'mod-pm', 'PROJECT_MANAGEMENT', false, now()),
        ('perm-sa', 'role-sa', 'mod-pm', 'PROJECT_MANAGEMENT', true, now());
      INSERT INTO public."User" (id, name, email, role, status, "sessionVersion", "mustChangePassword", "updatedAt") VALUES
        ('creator-pm', 'Synthetic PM Creator', 'creator-pm@cleanroom.invalid', 'PROJECT_MANAGER', 'ACTIVE', 7, false, now()),
        ('peer-pm', 'Synthetic PM Peer', 'peer-pm@cleanroom.invalid', 'PROJECT_MANAGER', 'ACTIVE', 7, false, now()),
        ('viewer-se', 'Synthetic SE Viewer', 'viewer-se@cleanroom.invalid', 'SITE_ENGINEER', 'ACTIVE', 7, false, now()),
        ('admin-sa', 'Synthetic Super Admin', 'admin-sa@cleanroom.invalid', 'SUPER_ADMIN', 'ACTIVE', 9, false, now());
    `);

    const ownershipMod = loadTranspiledTsModule(
      'src/lib/uboq/project-ownership.ts',
      {
        'node:async_hooks': require('node:async_hooks'),
        'node:crypto': crypto,
      },
      { UBOQ_RLS_CONTEXT_SECRET: secrets.uboqRlsSecretHex }
    );

    const runtimeClient = await connectAs('oserp_preview_runtime_app', secrets.runtimeAppPw, CLEANROOM_DB);
    const payrollClient = await connectAs('oserp_preview_payroll_app', secrets.payrollAppPw, CLEANROOM_DB);
    const roClient = await connectAs('oserp_preview_preflight_ro', secrets.roPw, CLEANROOM_DB);

    const inTx = async (client, fn) => {
      await client.query('BEGIN');
      try {
        const res = await fn();
        await client.query('COMMIT');
        return res;
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        throw err;
      }
    };

    const setSignedContext = async (client, projectId, actorId = 'creator-pm', sv = 7, customProof) => {
      const proof =
        customProof !== undefined
          ? customProof
          : ownershipMod.mintSignedRlsProof({
              projectId,
              userId: actorId,
              sessionVersion: sv,
            });
      await client.query(
        `SELECT
           set_config('app.enforce_project_rls', 'on', true),
           set_config('app.current_project_id', $1, true),
           set_config('app.current_user_id', $2, true),
           set_config('app.current_session_version', $3, true),
           set_config('app.current_rls_proof', $4, true)`,
        [projectId, actorId, String(sv), proof]
      );
    };

    const callBootstrapSql = (client, projectId, opts = {}) =>
      inTx(client, async () => {
        if (!opts.unsigned) {
          await setSignedContext(
            client,
            projectId,
            opts.actor || 'creator-pm',
            opts.sv ?? 7,
            opts.proof
          );
        }
        return client.query(
          `SELECT public.phase9_create_project_profile($1, $2, $3, $4, $5, $6, $7)`,
          [
            opts.targetProjectId ?? projectId,
            opts.name ?? 'Cleanroom Verified Workspace',
            opts.client ?? 'Cleanroom Client',
            opts.location ?? 'Metro Manila',
            opts.contractNumber ?? 'CN-2026-009',
            opts.sector ?? 'CORPORATE',
            opts.description ?? 'Synthetic cleanroom verification project',
          ]
        );
      });

    await recordCheck('Unsigned, malformed, tampered-HMAC, wrong-secret, expired, and cross-project proofs fail closed (42501)', async () => {
      await assert.rejects(() => callBootstrapSql(runtimeClient, 'neg-unsigned', { unsigned: true }), {
        code: '42501',
      });
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-malformed', { proof: '1700000000.deadbeef.forgedsig' }),
        { code: '42501' }
      );

      // Well-formed, current-timestamp proof with 1-nibble tampered HMAC signature (exercises cryptographic digest comparison)
      const freshValidProof = ownershipMod.mintSignedRlsProof({
        projectId: 'neg-tampered-hmac',
        userId: 'creator-pm',
        sessionVersion: 7,
      });
      assert.match(freshValidProof, /^\d+\.[0-9a-f]{24}\.[0-9a-f]{64}$/);
      const tamperedLastChar = freshValidProof.endsWith('0') ? '1' : '0';
      const tamperedHmacProof = freshValidProof.slice(0, -1) + tamperedLastChar;
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-tampered-hmac', { proof: tamperedHmacProof }),
        { code: '42501' }
      );

      // Well-formed, current-timestamp proof signed with an unauthorized 256-bit secret
      const wrongSecretOwnership = loadTranspiledTsModule(
        'src/lib/uboq/project-ownership.ts',
        {
          'node:async_hooks': require('node:async_hooks'),
          'node:crypto': crypto,
        },
        { UBOQ_RLS_CONTEXT_SECRET: randomHex(32) }
      );
      const wrongKeyProof = wrongSecretOwnership.mintSignedRlsProof({
        projectId: 'neg-wrong-secret',
        userId: 'creator-pm',
        sessionVersion: 7,
      });
      assert.match(wrongKeyProof, /^\d+\.[0-9a-f]{24}\.[0-9a-f]{64}$/);
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-wrong-secret', { proof: wrongKeyProof }),
        { code: '42501' }
      );

      const expiredProof = ownershipMod.mintSignedRlsProof({
        projectId: 'neg-expired',
        userId: 'creator-pm',
        sessionVersion: 7,
        issuedEpochSec: Math.floor(Date.now() / 1000) - 900,
      });
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-expired', { proof: expiredProof }),
        { code: '42501' }
      );
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-bound-a', { targetProjectId: 'neg-bound-b' }),
        { code: '42501' }
      );
    });

    await recordCheck('Non-compat logins (preflight RO & payroll app) cannot execute Phase 9 bootstrap (42501)', async () => {
      await assert.rejects(() => callBootstrapSql(roClient, 'neg-ro'), (e) => e.code === '42501' || e.code === '25006');
      await assert.rejects(() => callBootstrapSql(payrollClient, 'neg-payroll'), { code: '42501' });
    });

    await recordCheck('Stale sessionVersion, INACTIVE, locked, and mustChangePassword users fail closed (42501)', async () => {
      await assert.rejects(() => callBootstrapSql(runtimeClient, 'neg-stale-sv', { sv: 6 }), {
        code: '42501',
      });
      for (const [mutationSql, restoreSql] of [
        [`status = 'INACTIVE'`, `status = 'ACTIVE'`],
        [`"lockedUntil" = now() + interval '30 minutes'`, `"lockedUntil" = NULL`],
        [`"mustChangePassword" = true`, `"mustChangePassword" = false`],
      ]) {
        await fixtureAdmin.query(`UPDATE public."User" SET ${mutationSql} WHERE id = 'creator-pm'`);
        try {
          await assert.rejects(() => callBootstrapSql(runtimeClient, 'neg-user-state'), {
            code: '42501',
          });
        } finally {
          await fixtureAdmin.query(`UPDATE public."User" SET ${restoreSql} WHERE id = 'creator-pm'`);
        }
      }
    });

    await recordCheck('RBAC canCreate=false (SITE_ENGINEER) and inactive Role fail closed even with valid proof (42501)', async () => {
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-se-viewer', { actor: 'viewer-se', sv: 7 }),
        { code: '42501' }
      );
      await fixtureAdmin.query(`UPDATE public."Role" SET "isActive" = false WHERE id = 'role-pm'`);
      try {
        await assert.rejects(() => callBootstrapSql(runtimeClient, 'neg-inactive-role'), {
          code: '42501',
        });
      } finally {
        await fixtureAdmin.query(`UPDATE public."Role" SET "isActive" = true WHERE id = 'role-pm'`);
      }
    });

    await recordCheck('Database enforces profile length and sector constraints independently (22023)', async () => {
      await assert.rejects(() => callBootstrapSql(runtimeClient, 'neg-short-name', { name: 'ab' }), {
        code: '22023',
      });
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-bad-sector', { sector: 'RESIDENTIAL_INVALID' }),
        { code: '22023' }
      );
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, 'neg-long-desc', { description: 'x'.repeat(2001) }),
        { code: '22023' }
      );
    });

    // Real PrismaClient connected as `oserp_preview_runtime_app` (`NOBYPASSRLS`) executing `createProjectProfile`
    runtimePrisma = new PrismaClient({
      datasourceUrl: buildLocalUrl('oserp_preview_runtime_app', secrets.runtimeAppPw, CLEANROOM_DB),
    });
    let activeSession = { userId: 'creator-pm', role: 'PROJECT_MANAGER', sessionVersion: 7 };
    const intakeActionMod = loadTranspiledTsModule('src/app/actions/project-intake.ts', {
      '@/lib/prisma': { prisma: runtimePrisma },
      '@/lib/dal/auth': { verifyOperationalSession: async () => activeSession },
      'node:crypto': crypto,
      '@/lib/uboq/project-ownership': ownershipMod,
    });
    const { createProjectProfile } = intakeActionMod;

    const makeIntakeForm = (overrides = {}) => {
      const f = new FormData();
      f.set('name', overrides.name ?? 'Cleanroom Tower Intake Phase 9');
      f.set('client', overrides.client ?? 'Department of Cleanroom Infrastructure');
      f.set('location', overrides.location ?? 'Quezon City');
      f.set('contractNumber', overrides.contractNumber ?? 'DPWH-CR-2026-01');
      f.set('sector', overrides.sector ?? 'GOVERNMENT');
      f.set('description', overrides.description ?? 'Created via createProjectProfile on local PG18');
      // Attempted caller-supplied spoofing fields (must be ignored)
      f.set('userId', 'peer-pm');
      f.set('projectRole', 'SUPER_ADMIN');
      return f;
    };

    let createdProjectId = null;
    await recordCheck('Authenticated createProjectProfile creates PLANNING project + atomic creator assignment & zero BOQ/baseline rows', async () => {
      const res = await createProjectProfile(makeIntakeForm());
      assert.equal(res.error, undefined, `Unexpected error: ${res.error}`);
      assert.ok(res.projectId && /^[0-9a-f-]{36}$/i.test(res.projectId));
      createdProjectId = res.projectId;

      const projRow = (
        await fixtureAdmin.query(`SELECT * FROM public."Project" WHERE id = $1`, [createdProjectId])
      ).rows[0];
      assert.ok(projRow);
      assert.equal(projRow.name, 'Cleanroom Tower Intake Phase 9');
      assert.equal(projRow.projectCategory, 'GOVERNMENT');
      assert.equal(projRow.status, 'PLANNING');
      assert.equal(Number(projRow.contractAmount), 0);
      assert.equal(projRow.uboqGovernanceEnabled, false);

      const puaRows = (
        await fixtureAdmin.query(
          `SELECT "userId", "projectRole", "accessLevel", "assignedBy", "assignmentStatus"
           FROM public."ProjectUserAssignment" WHERE "projectId" = $1`,
          [createdProjectId]
        )
      ).rows;
      assert.equal(puaRows.length, 1);
      assert.deepEqual(puaRows[0], {
        userId: 'creator-pm',
        projectRole: 'PROJECT_MANAGER',
        accessLevel: 'FULL',
        assignedBy: 'creator-pm',
        assignmentStatus: 'active',
      });

      // Verify zero BOQ / financial baseline rows were implicitly created
      const sideEffects = (
        await fixtureAdmin.query(`
          SELECT
            (SELECT COUNT(*)::int FROM public."AwardedBOQItem" WHERE "projectId" = $1) AS awarded_boq,
            (SELECT COUNT(*)::int FROM public."ConsolidatedBOQItem" WHERE "projectId" = $1) AS consolidated_boq,
            (SELECT COUNT(*)::int FROM public."ProcurementBenchmarkItem" WHERE "projectId" = $1) AS benchmark_boq
        `, [createdProjectId])
      ).rows[0];
      assert.deepEqual(sideEffects, { awarded_boq: 0, consolidated_boq: 0, benchmark_boq: 0 });
    });

    await recordCheck('Signed RLS allows creator-pm to read new workspace while isolating peer-pm and unbound sessions', async () => {
      await inTx(runtimeClient, async () => {
        await setSignedContext(runtimeClient, createdProjectId, 'creator-pm', 7);
        assert.equal(
          (await runtimeClient.query(`SELECT id FROM public."Project" WHERE id = $1`, [createdProjectId])).rowCount,
          1
        );
        assert.equal(
          (
            await runtimeClient.query(
              `SELECT id FROM public."ProjectUserAssignment" WHERE "projectId" = $1`,
              [createdProjectId]
            )
          ).rowCount,
          1
        );
      });

      await inTx(runtimeClient, async () => {
        await setSignedContext(runtimeClient, createdProjectId, 'peer-pm', 7);
        assert.equal(
          (await runtimeClient.query(`SELECT id FROM public."Project" WHERE id = $1`, [createdProjectId])).rowCount,
          0
        );
        assert.equal(
          (
            await runtimeClient.query(
              `SELECT id FROM public."ProjectUserAssignment" WHERE "projectId" = $1`,
              [createdProjectId]
            )
          ).rowCount,
          0
        );
      });

      // Unbound runtime session sees 0 projects
      assert.equal((await runtimeClient.query(`SELECT id FROM public."Project"`)).rowCount, 0);
    });

    await recordCheck('Duplicate/replay projectId rejected (23505) without attaching second creator', async () => {
      await assert.rejects(
        () => callBootstrapSql(runtimeClient, createdProjectId, { actor: 'peer-pm', sv: 7 }),
        { code: '23505' }
      );
      const countAfter = (
        await fixtureAdmin.query(
          `SELECT COUNT(*)::int AS n FROM public."ProjectUserAssignment" WHERE "projectId" = $1`,
          [createdProjectId]
        )
      ).rows[0].n;
      assert.equal(countAfter, 1);
    });

    await recordCheck('Action-level validation & transactional rollback atomicity verified (zero orphan Project rows)', async () => {
      activeSession = null;
      assert.equal((await createProjectProfile(makeIntakeForm())).error, 'Please sign in again.');

      activeSession = { userId: 'viewer-se', role: 'SITE_ENGINEER', sessionVersion: 7 };
      assert.equal(
        (await createProjectProfile(makeIntakeForm())).error,
        'Your role cannot create projects.'
      );

      activeSession = { userId: 'creator-pm', role: 'PROJECT_MANAGER', sessionVersion: 7 };
      assert.match(
        (await createProjectProfile(makeIntakeForm({ name: 'x' }))).error,
        /3–180 characters/
      );

      const projectsBefore = (await fixtureAdmin.query(`SELECT COUNT(*)::int AS n FROM public."Project"`)).rows[0].n;
      await fixtureAdmin.query(`
        CREATE FUNCTION public.cleanroom_sim_pua_fail() RETURNS trigger LANGUAGE plpgsql AS $$
        BEGIN
          RAISE EXCEPTION 'simulatedcleanroom_pua_insert_failure';
        END $$;
        CREATE TRIGGER trg_cleanroom_sim_pua_fail
          BEFORE INSERT ON public."ProjectUserAssignment"
          FOR EACH ROW EXECUTE FUNCTION public.cleanroom_sim_pua_fail();
      `);
      try {
        await assert.rejects(
          () => createProjectProfile(makeIntakeForm({ name: 'Atomic Rollback Test Project' })),
          /simulatedcleanroom_pua_insert_failure/
        );
      } finally {
        await fixtureAdmin.query(`
          DROP TRIGGER IF EXISTS trg_cleanroom_sim_pua_fail ON public."ProjectUserAssignment";
          DROP FUNCTION IF EXISTS public.cleanroom_sim_pua_fail();
        `);
      }
      const projectsAfter = (await fixtureAdmin.query(`SELECT COUNT(*)::int AS n FROM public."Project"`)).rows[0].n;
      assert.equal(projectsAfter, projectsBefore);
    });

    await recordCheck('Direct ProjectUserAssignment DML and SET ROLE privilege escalation remain denied on runtime app', async () => {
      await assert.rejects(
        () => runtimeClient.query(`UPDATE public."ProjectUserAssignment" SET "userId" = 'peer-pm'`),
        { code: '42501' }
      );
      await assert.rejects(
        () => runtimeClient.query(`DELETE FROM public."ProjectUserAssignment"`),
        { code: '42501' }
      );
      await assert.rejects(
        () => runtimeClient.query(`SET ROLE oserp_migrations_owner`),
        { code: '42501' }
      );
      await assert.rejects(
        () => runtimeClient.query(`SET ROLE oserp_preview_migrate_admin`),
        { code: '42501' }
      );
      const privRow = (
        await runtimeClient.query(`
          SELECT
            has_table_privilege(current_user, 'public."ProjectUserAssignment"', 'INSERT') AS pua_insert,
            has_table_privilege(current_user, 'public."ProjectUserAssignment"', 'UPDATE') AS pua_update,
            has_table_privilege(current_user, 'public."ProjectUserAssignment"', 'DELETE') AS pua_delete,
            has_table_privilege(current_user, 'public."_prisma_migrations"', 'SELECT') AS ledger_select
        `)
      ).rows[0];
      assert.deepEqual(privRow, {
        pua_insert: false,
        pua_update: false,
        pua_delete: false,
        ledger_select: false,
      });
    });

    // Database-level backup/restore recovery verification into `oserp_uboq_cleanroom_restored`
    await recordCheck('Pre-Phase-9 pg_dump archive restores cleanly with full ownership, trust anchors, signed RLS, and 39/39 parity', async () => {
      runPgBin(
        'pg_restore',
        [
          '--exit-on-error',
          '-h',
          '127.0.0.1',
          '-p',
          String(port),
          '-U',
          'cleanroom_bootstrap_super',
          '-d',
          RESTORED_DB,
          backupDumpPath,
        ],
        {
          PGHOST: '127.0.0.1',
          PGHOSTADDR: '127.0.0.1',
          PGPORT: String(port),
          PGUSER: 'cleanroom_bootstrap_super',
          PGPASSWORD: secrets.bootstrapSuperPw,
          PGSSLMODE: 'disable',
        }
      );

      const restoredOwnerSetup = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, RESTORED_DB);
      try {
        await restoredOwnerSetup.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
        await restoredOwnerSetup.query(
          `GRANT CONNECT ON DATABASE "${RESTORED_DB}" TO oserp_preview_preflight_ro, oserp_preview_runtime_app`
        );
        await restoredOwnerSetup.query(`GRANT USAGE ON SCHEMA public TO oserp_preview_preflight_ro`);
      } finally {
        await restoredOwnerSetup.end();
      }

      const restoredRo = await connectAs('oserp_preview_preflight_ro', secrets.roPw, RESTORED_DB);
      try {
        const restoredVerdict = await inspectTargetForManagedPg18Rc(
          restoredRo,
          stagedRc39.rcDisk,
          stagedRc39.rcAuthority,
          { allowEmpty: false }
        );
        assert.equal(restoredVerdict.eligible, true, JSON.stringify(restoredVerdict));
        assert.equal(restoredVerdict.verifiedMigrationCount, 39);
        assert.equal(restoredVerdict.roleSecurityPosture.ok, true);
      } finally {
        await restoredRo.end();
      }

      const restoredClient = await connectAs('cleanroom_db_owner', secrets.dbOwnerPw, RESTORED_DB);
      try {
        const restoredSummary = await queryCatalogSummary(restoredClient);
        assert.equal(restoredSummary.completed_migrations, 39);
        assert.equal(restoredSummary.phase9_entries, 0);
        assert.equal(restoredSummary.public_tables, 252);
        assert.equal(restoredSummary.force_rls_tables, 88);
        assert.equal(restoredSummary.public_rls_policies, 325);
        assert.equal(restoredSummary.public_security_definer_functions, 110);

        const owners = (
          await restoredClient.query(`
            SELECT
              (SELECT pg_get_userbyid(c.relowner) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relname = 'Project') AS project_owner,
              (SELECT c.relrowsecurity AND c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relname = 'Project') AS project_force_rls,
              (SELECT pg_get_userbyid(c.relowner) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relname = 'ProjectUserAssignment') AS pua_owner,
              (SELECT c.relrowsecurity AND c.relforcerowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
                 WHERE n.nspname = 'public' AND c.relname = 'ProjectUserAssignment') AS pua_force_rls,
              (SELECT pg_get_userbyid(p.proowner) FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE n.nspname = 'public' AND p.proname = 'uboq_verify_signed_rls_proof') AS rls_verifier_owner,
              to_regprocedure('public.phase9_create_project_profile(text,text,text,text,text,text,text)') AS phase9_fn_7arg,
              (SELECT COUNT(*)::int FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
                 WHERE n.nspname = 'public' AND p.proname = 'phase9_create_project_profile') AS phase9_fn_any_overload
          `)
        ).rows[0];
        assert.deepEqual(owners, {
          project_owner: 'oserp_preview_migrate_admin',
          project_force_rls: true,
          pua_owner: 'oserp_preview_migrate_admin',
          pua_force_rls: true,
          rls_verifier_owner: 'oserp_migrations_owner',
          phase9_fn_7arg: null,
          phase9_fn_any_overload: 0,
        });
        report.restoredRollbackState = { ...restoredSummary, ownersPreserved: true, signedRlsRestored: true };
      } finally {
        await restoredClient.end();
      }

      // Seed a synthetic project + assignment on RESTORED_DB and prove live row-level `FORCE RLS` filtering
      // across unbound, peer, tampered-HMAC, and valid signed runtime sessions (not merely table ACLs).
      const restoredSeeder = await connectAs('cleanroom_bootstrap_super', secrets.bootstrapSuperPw, RESTORED_DB);
      try {
        await restoredSeeder.query(`
          INSERT INTO public."User" (id, name, email, role, status, "sessionVersion", "mustChangePassword", "updatedAt") VALUES
            ('restored-creator', 'Restored Creator', 'rc@cleanroom.invalid', 'PROJECT_MANAGER', 'ACTIVE', 5, false, now()),
            ('restored-peer', 'Restored Peer', 'rp@cleanroom.invalid', 'PROJECT_MANAGER', 'ACTIVE', 5, false, now());
          INSERT INTO public."Project" (id, name, status, "contractAmount", "uboqGovernanceEnabled", "updatedAt") VALUES
            ('restored-proj-1', 'Restored RLS Probe Project', 'PLANNING', 0, false, now());
          INSERT INTO public."ProjectUserAssignment" (id, "projectId", "userId", "projectRole", "accessLevel", "assignedBy", "assignmentStatus", "updatedAt") VALUES
            ('restored-pua-1', 'restored-proj-1', 'restored-creator', 'PROJECT_MANAGER', 'FULL', 'restored-creator', 'active', now());
        `);
      } finally {
        await restoredSeeder.end();
      }

      const restoredRuntime = await connectAs('oserp_preview_runtime_app', secrets.runtimeAppPw, RESTORED_DB);
      try {
        // 1) Unbound runtime session has SELECT ACL on Project/PUA, yet RLS filters seeded rows to 0
        assert.equal(
          (await restoredRuntime.query(`SELECT id FROM public."Project" WHERE id = 'restored-proj-1'`)).rowCount,
          0
        );
        assert.equal(
          (
            await restoredRuntime.query(
              `SELECT id FROM public."ProjectUserAssignment" WHERE "projectId" = 'restored-proj-1'`
            )
          ).rowCount,
          0
        );

        // 2) Unassigned peer with valid signed proof sees 0 rows
        await inTx(restoredRuntime, async () => {
          await setSignedContext(restoredRuntime, 'restored-proj-1', 'restored-peer', 5);
          assert.equal(
            (await restoredRuntime.query(`SELECT id FROM public."Project" WHERE id = 'restored-proj-1'`)).rowCount,
            0
          );
          assert.equal(
            (
              await restoredRuntime.query(
                `SELECT id FROM public."ProjectUserAssignment" WHERE "projectId" = 'restored-proj-1'`
              )
            ).rowCount,
            0
          );
        });

        // 3) Assigned creator with tampered-HMAC proof sees 0 rows
        const validRestoredCreatorProof = ownershipMod.mintSignedRlsProof({
          projectId: 'restored-proj-1',
          userId: 'restored-creator',
          sessionVersion: 5,
        });
        const tamperedRestoredCreatorProof =
          validRestoredCreatorProof.slice(0, -1) +
          (validRestoredCreatorProof.endsWith('0') ? '1' : '0');
        await inTx(restoredRuntime, async () => {
          await setSignedContext(
            restoredRuntime,
            'restored-proj-1',
            'restored-creator',
            5,
            tamperedRestoredCreatorProof
          );
          assert.equal(
            (await restoredRuntime.query(`SELECT id FROM public."Project" WHERE id = 'restored-proj-1'`)).rowCount,
            0
          );
          assert.equal(
            (
              await restoredRuntime.query(
                `SELECT id FROM public."ProjectUserAssignment" WHERE "projectId" = 'restored-proj-1'`
              )
            ).rowCount,
            0
          );
        });

        // 4) Assigned creator with valid signed proof sees 1 Project row and 1 PUA row
        await inTx(restoredRuntime, async () => {
          await setSignedContext(
            restoredRuntime,
            'restored-proj-1',
            'restored-creator',
            5,
            validRestoredCreatorProof
          );
          assert.equal(
            (await restoredRuntime.query(`SELECT id FROM public."Project" WHERE id = 'restored-proj-1'`)).rowCount,
            1
          );
          assert.equal(
            (
              await restoredRuntime.query(
                `SELECT id FROM public."ProjectUserAssignment" WHERE "projectId" = 'restored-proj-1'`
              )
            ).rowCount,
            1
          );
        });
      } finally {
        await restoredRuntime.end();
      }
    });

    report.completedAt = new Date().toISOString();
    report.status = 'PASS';

    const outReceiptPath = process.env.PHASE9_CLEANROOM_RECEIPT_OUT || '';
    if (outReceiptPath) {
      fs.mkdirSync(path.dirname(path.resolve(outReceiptPath)), { recursive: true });
      fs.writeFileSync(path.resolve(outReceiptPath), JSON.stringify(report, null, 2) + '\n', 'utf8');
    }

    console.log(
      JSON.stringify(
        {
          status: report.status,
          checksPassed: checks.length,
          gitHeadSha: report.gitHeadSha,
          phase9MigrationSha256: report.phase9MigrationSha256,
          prePhase9Baseline: report.prePhase9Baseline,
          postPhase9State: report.postPhase9State,
          restoredRollbackState: report.restoredRollbackState,
        },
        null,
        2
      )
    );
  } finally {
    if (runtimePrisma) {
      await runtimePrisma.$disconnect().catch(() => {});
    }
    for (const c of openClients) {
      await c.end().catch(() => {});
    }
    if (clusterStarted) {
      try {
        runPgBin('pg_ctl', ['-D', dataDir, '-m', 'fast', '-w', 'stop'], {}, 60000, true);
      } catch {}
    }
    try {
      fs.rmSync(runtimeDir, { recursive: true, force: true });
    } catch {}
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('PHASE9_CLEANROOM_LOCAL_PG18_FAILED:', err?.message || err);
    process.exitCode = 1;
  });
}

module.exports = { main };
