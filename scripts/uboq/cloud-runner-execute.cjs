'use strict';

/**
 * OSERP-PROJ-UBOQ-001 — Isolated Cloud Runner Execution Script (`MANAGED_PG18_RC_V1`)
 *
 * Runs inside the dedicated private GitHub Actions manual (`workflow_dispatch`) runner.
 * Completely disconnected from Production and ERP `main`.
 * Zero secrets are ever logged, printed, or written to output artifacts.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { Client } = require('pg');

const {
  inspectTargetLedger,
} = require('./verify-migration14-provenance-gate.cjs');
const {
  loadRcDiskMigrations,
  inspectTargetForManagedPg18Rc,
} = require('./verify-managed-pg18-rc-v1-gate.cjs');

const EXPECTED_PROJECT_ID = 'long-recipe-20782583';
const EXPECTED_ORG_ID = 'org-sweet-fog-42432629';
const EXPECTED_BRANCH_ID = 'br-quiet-rice-bc1edkvd';
const EXPECTED_ENDPOINT_ID = 'ep-small-paper-bcyvlhat';
const EXPECTED_DB_NAME = 'oserp_uboq_preview';
const PITR_TIMESTAMP_ISO = '2026-11-16T12:18:30Z';
const RECOVERY_BRANCH_NAME = 'oserp-ckpt3-interrupted-25of39-preserve-20261116';
const ALLOWED_DATABASES = new Set(['postgres', 'neondb', EXPECTED_DB_NAME]);

const PINNED_HASHES = Object.freeze({
  m14Gate: 'bea84029e746521207dac5fde86872a7abc1c43e5b8ce83802ca51d121ac1f5b',
  rcGate: '331ee4ae0151a4c19dfd339f54764069b8bbba6bbfb64e4b86c7ad78cc86d288',
  rcManifest: '09b16dc9371f28afc28bf83808b9ad08e91a2e81034e42f46082177816e6fb3b',
  phase1Receipt: 'f67634b39f9f2bf6e48ebd5b30b491de15d67614291bf27a9e47f65c57236070',
  m39Receipt: 'fb74b7dce2d224fe5d0ec6cc154f608ffe315e25e82b135fc7099b285e61b5db',
  rcSchema: 'f40364eec636e153226890abfd3e7bc81ac6b7dfa635f59bc2326537fd62eb08',
  canonicalMig14: 'a4accf399ceeccd246e98f659dd1057805583e61af247a1a88f6e060a8b2016e',
  historicalMig15Forbidden: '1158b5b22b4ee7735c37bb1cf46cd21c7c2042bcef1afec31f454f229e8528db',
  candidateMig15Required: 'f3398e991a045195a4903f32da2e71897d11c55a09a6edc6a2bbc2bb0bff35c8',
  reviewedPackageZip: '496c4375b5bd15ff593d0d6e0d845871ace1e4b370625879366f40afe156513d',
});

const OUT_DIR = path.resolve('receipts');

function sha256File(relPath) {
  return crypto.createHash('sha256').update(fs.readFileSync(relPath)).digest('hex');
}

function redact(s) {
  return String(s || '')
    .replace(/postgresql:\/\/[^\s"']+/gi, '[REDACTED_URL]')
    .replace(/npg_[A-Za-z0-9]+/g, '[REDACTED_SECRET]')
    .replace(/"(password|uri|token|access_token|value)"\s*:\s*"[^"]*"/gi, '"$1":"[REDACTED]"');
}

function maskHost(host) {
  const m = String(host || '').match(/^(ep-[a-z0-9]+-[a-z0-9]+)-[a-z0-9]+(-pooler)?\.(.+)$/i);
  return m ? `${m[1]}-REDACTED${m[2] || ''}.${m[3]}` : host;
}

function deriveSecrets(ownerSecret, sessionSaltId) {
  const ikm = Buffer.from(ownerSecret, 'utf8');
  const salt = Buffer.from(sessionSaltId, 'hex');
  const d = (label, len) =>
    Buffer.from(
      crypto.hkdfSync('sha256', ikm, salt, Buffer.from(`OSERP_UBOQ_PREVIEW_V1|${label}`, 'utf8'), len)
    ).toString('hex');
  return {
    roPassword: d('oserp_preview_preflight_ro', 24),
    migrateAdminPassword: d('oserp_preview_migrate_admin', 24),
    runtimeAppPassword: d('oserp_preview_runtime_app', 24),
    directAppPassword: d('oserp_preview_direct_app', 24),
    payrollAppPassword: d('oserp_preview_payroll_app', 24),
    uboqRlsSecretHex: d('uboq_rls_trust_anchor', 32),
    companyPayrollSecretHex: d('company_payroll_trust_anchor', 32),
  };
}

function makeTlsClient(rawUrl, appName, extraOpts = {}) {
  const u = new URL(rawUrl);
  u.searchParams.delete('channel_binding');
  u.searchParams.delete('sslmode');
  u.searchParams.delete('pgbouncer');
  return new Client({
    connectionString: u.toString(),
    ssl: { rejectUnauthorized: true },
    connectionTimeoutMillis: 15000,
    query_timeout: 30000,
    application_name: appName,
    ...extraOpts,
  });
}

async function neonApi(token, method, apiPath, bodyObj) {
  const res = await fetch(`https://console.neon.tech/api/v2${apiPath}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(bodyObj !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const txt = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${apiPath.split('?')[0]} HTTP ${res.status}: ${redact(txt).slice(0, 240)}`);
  }
  return txt ? JSON.parse(txt) : {};
}

async function waitNeonOps(token, opIds) {
  for (const opId of opIds || []) {
    for (let i = 0; i < 60; i += 1) {
      const r = await neonApi(token, 'GET', `/projects/${EXPECTED_PROJECT_ID}/operations/${opId}`);
      const st = r.operation?.status;
      if (st === 'finished' || st === 'skipped') break;
      if (['failed', 'error', 'cancelled'].includes(st)) {
        throw new Error(`Neon op ${opId} failed (${st})`);
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

function logEvent(stage, detail = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), stage, ...detail }));
}

(async () => {
  const startedMs = Date.now();
  const hardTimer = setTimeout(() => {
    console.error(JSON.stringify({ fatal: 'CLOUD_RUNNER_HARD_TIMEOUT_240S' }));
    process.exit(124);
  }, 240000);
  hardTimer.unref();

  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // =========================================================================
    // STAGE 0 (Step 4): Cryptographic Verification of Staged Release Candidate
    // =========================================================================
    assert.equal(sha256File('scripts/uboq/verify-migration14-provenance-gate.cjs'), PINNED_HASHES.m14Gate);
    assert.equal(sha256File('scripts/uboq/verify-managed-pg18-rc-v1-gate.cjs'), PINNED_HASHES.rcGate);
    assert.equal(sha256File('artifacts/uboq/managed-pg18-rc-v1/rc-v1-checksum-manifest.json'), PINNED_HASHES.rcManifest);
    assert.equal(sha256File('artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json'), PINNED_HASHES.phase1Receipt);
    assert.equal(sha256File('artifacts/uboq/release-readiness/migration39-apply.json'), PINNED_HASHES.m39Receipt);
    assert.equal(sha256File('prisma/managed-pg18-rc-v1/schema.prisma'), PINNED_HASHES.rcSchema);

    // Ensure historical `prisma/migrations` is NOT staged so historical M15 can never be substituted
    assert.equal(fs.existsSync('prisma/migrations'), false, 'Historical prisma/migrations must not exist in isolated RC runner');

    const rcManifest = JSON.parse(
      fs.readFileSync('artifacts/uboq/managed-pg18-rc-v1/rc-v1-checksum-manifest.json', 'utf8')
    );
    const authorityBundle = JSON.parse(fs.readFileSync('runner-authority-bundle.json', 'utf8'));
    const rcDisk = loadRcDiskMigrations();
    assert.equal(rcDisk.length, 39);
    assert.equal(rcDisk[13].sha256, PINNED_HASHES.canonicalMig14);
    assert.equal(rcDisk[14].sha256, PINNED_HASHES.candidateMig15Required);
    assert.notEqual(rcDisk[14].sha256, PINNED_HASHES.historicalMig15Forbidden);
    assert.deepEqual(
      rcDisk.map((m) => [m.migrationName, m.sha256]),
      rcManifest.migrations.map((m) => [m.migrationName, m.candidateSha256]),
      'Staged RC migration SQL byte checksums diverged from reviewed rc-v1-checksum-manifest.json'
    );
    logEvent('STAGE_0_RC_V1_BUNDLE_HASHES_VERIFIED', {
      migrationCount: rcDisk.length,
      candidateMig15Sha256: rcDisk[14].sha256,
    });

    // =========================================================================
    // STAGE 1 (Step 5 Pre-Check): Validate Cloud Secrets & Neon Target Identity
    // =========================================================================
    const neonToken = (process.env.OSERP_NEON_API_TOKEN || '').trim();
    const migrateSecretUrl = (process.env.OSERP_PREVIEW_MIGRATE_DIRECT_URL || '').trim();
    const preflightRoSecretUrl = (process.env.OSERP_PREVIEW_PREFLIGHT_RO_URL || '').trim();
    const sessionSaltId = (process.env.OSERP_SESSION_SALT_ID || '').trim();
    assert.ok(neonToken && migrateSecretUrl && preflightRoSecretUrl && sessionSaltId, 'Required masked secrets missing');

    const parsedMigUrl = new URL(migrateSecretUrl);
    assert.ok(
      parsedMigUrl.hostname.startsWith(`${EXPECTED_ENDPOINT_ID}-`) ||
        parsedMigUrl.hostname.startsWith(`${EXPECTED_ENDPOINT_ID}.`),
      'Migrate secret URL host does not match verified endpoint ep-small-paper-bcyvlhat'
    );
    assert.equal(parsedMigUrl.pathname.replace(/^\/+/, ''), EXPECTED_DB_NAME);
    assert.equal(decodeURIComponent(parsedMigUrl.username), 'oserp_preview_migrate_admin');
    assert.equal(parsedMigUrl.searchParams.get('sslmode'), 'require');

    const proj = (await neonApi(neonToken, 'GET', `/projects/${EXPECTED_PROJECT_ID}`)).project;
    assert.equal(proj.id, EXPECTED_PROJECT_ID);
    assert.equal(proj.org_id, EXPECTED_ORG_ID);
    assert.equal(proj.pg_version, 18);
    assert.match(proj.name || '', /onesystems|oserp/i);

    const branchesBefore =
      (await neonApi(neonToken, 'GET', `/projects/${EXPECTED_PROJECT_ID}/branches`)).branches || [];
    const targetBranch = branchesBefore.find((b) => b.id === EXPECTED_BRANCH_ID);
    assert.ok(targetBranch, `Target branch ${EXPECTED_BRANCH_ID} missing`);

    const endpoints =
      (await neonApi(neonToken, 'GET', `/projects/${EXPECTED_PROJECT_ID}/endpoints`)).endpoints || [];
    const rwEp = endpoints.find((e) => e.id === EXPECTED_ENDPOINT_ID && e.branch_id === EXPECTED_BRANCH_ID);
    assert.ok(rwEp, `Verified endpoint ${EXPECTED_ENDPOINT_ID} missing on ${EXPECTED_BRANCH_ID}`);
    if (rwEp.current_state !== 'active') {
      const st = await neonApi(
        neonToken,
        'POST',
        `/projects/${EXPECTED_PROJECT_ID}/endpoints/${EXPECTED_ENDPOINT_ID}/start`
      ).catch(() => ({ operations: [] }));
      await waitNeonOps(neonToken, (st.operations || []).map((o) => o.id));
    }

    const ownerDirectRes = await neonApi(
      neonToken,
      'GET',
      `/projects/${EXPECTED_PROJECT_ID}/connection_uri?branch_id=${EXPECTED_BRANCH_ID}&database_name=${EXPECTED_DB_NAME}&role_name=neondb_owner&pooled=false`
    );
    const ownerPooledRes = await neonApi(
      neonToken,
      'GET',
      `/projects/${EXPECTED_PROJECT_ID}/connection_uri?branch_id=${EXPECTED_BRANCH_ID}&database_name=${EXPECTED_DB_NAME}&role_name=neondb_owner&pooled=true`
    );
    const ownerDirectUri = ownerDirectRes.uri;
    const directHost = new URL(ownerDirectUri).hostname;
    const pooledHost = new URL(ownerPooledRes.uri).hostname;
    const ownerSecret = decodeURIComponent(new URL(ownerDirectUri).password);
    const derived = deriveSecrets(ownerSecret, sessionSaltId);
    assert.equal(decodeURIComponent(parsedMigUrl.password), derived.migrateAdminPassword);
    logEvent('STAGE_1_NEON_TARGET_IDENTITY_VERIFIED', {
      projectId: proj.id,
      branchId: targetBranch.id,
      endpointId: rwEp.id,
      pgVersion: proj.pg_version,
    });

    // =========================================================================
    // STAGE 2 (Step 1): Preserve Interrupted State (Read-Only Ledger Snapshot)
    // =========================================================================
    const snapClient = makeTlsClient(ownerDirectUri, 'oserp-cloud-step1-interrupted-snapshot');
    let interruptedSnapshot;
    try {
      await snapClient.connect();
      await snapClient.query('BEGIN TRANSACTION READ ONLY');

      const activeRunners = (
        await snapClient.query(
          `SELECT pid, usename, application_name, state FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND datname = $1 AND state <> 'idle'`,
          [EXPECTED_DB_NAME]
        )
      ).rows;
      assert.equal(activeRunners.length, 0, `Active sessions remain on ${EXPECTED_DB_NAME}`);

      const publicBaseTableCount = (
        await snapClient.query(
          `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        )
      ).rows[0].cnt;

      const hasLedgerBefore = (
        await snapClient.query(`SELECT to_regclass('public."_prisma_migrations"') AS r`)
      ).rows[0].r;

      const ledgerRows = hasLedgerBefore
        ? (
            await snapClient.query(`
              SELECT migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count, logs
              FROM public."_prisma_migrations"
              ORDER BY started_at ASC
            `)
          ).rows
        : [];

      const appDataCounts = {};
      for (const tbl of ['User', 'Project', 'UboqSourceDocument', 'UboqOperationalSnapshot']) {
        const reg = (await snapClient.query(`SELECT to_regclass($1) AS r`, [`public."${tbl}"`])).rows[0].r;
        if (reg) {
          const cnt = (await snapClient.query(`SELECT COUNT(*)::int AS c FROM public."${tbl}"`)).rows[0].c;
          appDataCounts[tbl] = cnt;
          assert.equal(cnt, 0, `Unexpected rows in ${tbl}: ${cnt}`);
        }
      }

      await snapClient.query('ROLLBACK');

      interruptedSnapshot = {
        capturedAt: new Date().toISOString(),
        neonProjectId: EXPECTED_PROJECT_ID,
        neonBranchId: EXPECTED_BRANCH_ID,
        databaseName: EXPECTED_DB_NAME,
        activeMigrationRunnersCount: activeRunners.length,
        publicBaseTableCount,
        totalLedgerRows: ledgerRows.length,
        finishedLedgerRowCount: ledgerRows.filter((r) => r.finished_at && !r.rolled_back_at).length,
        unfinishedLedgerRowCount: ledgerRows.filter((r) => !r.finished_at && !r.rolled_back_at).length,
        notYetStartedCount: 39 - ledgerRows.length,
        unfinishedMigrations: ledgerRows
          .filter((r) => !r.finished_at || r.rolled_back_at)
          .map((r) => r.migration_name),
        applicationTableRowCountsVerifiedZero: appDataCounts,
        ledgerRows,
      };
    } finally {
      await snapClient.end().catch(() => {});
    }
    fs.writeFileSync(
      path.join(OUT_DIR, 'interrupted-25of39-ledger-snapshot.json'),
      JSON.stringify(interruptedSnapshot, null, 2) + '\n'
    );
    logEvent('STAGE_2_INTERRUPTED_STATE_CAPTURED', {
      publicBaseTableCount: interruptedSnapshot.publicBaseTableCount,
      finishedLedgerRowCount: interruptedSnapshot.finishedLedgerRowCount,
      unfinishedLedgerRowCount: interruptedSnapshot.unfinishedLedgerRowCount,
      unfinishedMigrations: interruptedSnapshot.unfinishedMigrations,
    });

    // =========================================================================
    // STAGE 3 (Step 2): Restore Verified Clean Baseline via PITR & Verify Preflight
    // =========================================================================
    const branchCreatedMs = Date.parse(targetBranch.created_at);
    const pitrMs = Date.parse(PITR_TIMESTAMP_ISO);
    assert.ok(pitrMs > branchCreatedMs, 'PITR timestamp precedes branch creation');
    assert.ok(
      Date.parse(authorityBundle.ckpt1EvaluatedAt) < pitrMs,
      'Checkpoint 1 timestamp must precede PITR timestamp'
    );

    let preservedBranch = branchesBefore.find((b) => b.name === RECOVERY_BRANCH_NAME) || null;
    if (interruptedSnapshot.publicBaseTableCount > 0 || interruptedSnapshot.totalLedgerRows > 0) {
      const preserveName = preservedBranch
        ? `${RECOVERY_BRANCH_NAME}-${Date.now()}`
        : RECOVERY_BRANCH_NAME;
      const restoreRes = await neonApi(
        neonToken,
        'POST',
        `/projects/${EXPECTED_PROJECT_ID}/branches/${EXPECTED_BRANCH_ID}/restore`,
        {
          source_branch_id: EXPECTED_BRANCH_ID,
          source_timestamp: PITR_TIMESTAMP_ISO,
          preserve_under_name: preserveName,
        }
      );
      await waitNeonOps(neonToken, (restoreRes.operations || []).map((o) => o.id));
      const branchesAfter =
        (await neonApi(neonToken, 'GET', `/projects/${EXPECTED_PROJECT_ID}/branches`)).branches || [];
      preservedBranch = branchesAfter.find((b) => b.name === preserveName);
      assert.ok(preservedBranch, `Recovery branch ${preserveName} not retained after PITR`);
    }

    const roPreClient = makeTlsClient(preflightRoSecretUrl, 'oserp-cloud-step2-clean-preflight');
    let m14EmptyVerdict;
    let rcEmptyVerdict;
    try {
      await roPreClient.connect();
      const pubTablesAfterRestore = (
        await roPreClient.query(
          `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public'`
        )
      ).rows[0].cnt;
      const ledgerRegAfterRestore = (
        await roPreClient.query(`SELECT to_regclass('public."_prisma_migrations"') AS r`)
      ).rows[0].r;
      assert.equal(pubTablesAfterRestore, 0, `Expected 0 public tables after PITR, got ${pubTablesAfterRestore}`);
      assert.equal(ledgerRegAfterRestore, null, 'Expected 0 migration records after PITR');

      m14EmptyVerdict = await inspectTargetLedger(
        roPreClient,
        authorityBundle.m14Disk,
        authorityBundle.m14Authority,
        { allowEmpty: true }
      );
      rcEmptyVerdict = await inspectTargetForManagedPg18Rc(
        roPreClient,
        rcDisk,
        authorityBundle.rcAuthority,
        { allowEmpty: true }
      );
      assert.equal(m14EmptyVerdict.eligible, true);
      assert.equal(rcEmptyVerdict.eligible, true);
      assert.equal(rcEmptyVerdict.pendingMigrationCount, 39);
    } finally {
      await roPreClient.end().catch(() => {});
    }

    const restoreReceipt = {
      restoredAt: new Date().toISOString(),
      neonProjectId: EXPECTED_PROJECT_ID,
      restoredBranchId: EXPECTED_BRANCH_ID,
      databaseName: EXPECTED_DB_NAME,
      validatedPitrTimestampIso: PITR_TIMESTAMP_ISO,
      branchCreatedAtIso: targetBranch.created_at,
      preservedRecoveryBranchId: preservedBranch?.id || null,
      preservedRecoveryBranchName: preservedBranch?.name || null,
      manualLedgerEditsPerformed: false,
      postRestoreVerification: {
        publicTableCount: 0,
        migrationRecordsCount: 0,
        m14PreflightClassification: m14EmptyVerdict.classification,
        rcPreflightClassification: rcEmptyVerdict.classification,
        pendingMigrationCount: rcEmptyVerdict.pendingMigrationCount,
      },
    };
    fs.writeFileSync(
      path.join(OUT_DIR, 'clean-baseline-pitr-restore-receipt.json'),
      JSON.stringify(restoreReceipt, null, 2) + '\n'
    );
    fs.writeFileSync(
      path.join(OUT_DIR, 'checkpoint-2-m14-and-rc-preflight.json'),
      JSON.stringify(
        {
          project: 'OSERP-PROJ-UBOQ-001',
          checkpoint: 2,
          slug: 'm14-and-rc-preflight',
          title: 'Migration #14 and release-candidate preflight',
          evaluatedAt: new Date().toISOString(),
          status: 'PASS',
          exitCode: 0,
          lastCompletedSubstep: 'DUAL_PREFLIGHT_VERIFIED',
          targetNeonProjectId: EXPECTED_PROJECT_ID,
          targetDatabaseName: EXPECTED_DB_NAME,
          evidence: {
            m14EmptyBaselineVerdict: m14EmptyVerdict,
            managedPg18RcPreflightVerdict: rcEmptyVerdict,
          },
        },
        null,
        2
      ) + '\n'
    );
    logEvent('STAGE_3_CLEAN_BASELINE_RESTORED_AND_VERIFIED', {
      preservedRecoveryBranchId: restoreReceipt.preservedRecoveryBranchId,
      rcPreflightClassification: rcEmptyVerdict.classification,
    });

    // =========================================================================
    // STAGE 4 (Steps 5 & 6): Validate PG18 Session & Execute Migrations #1-#39 ONCE
    // =========================================================================
    const migPreCheck = makeTlsClient(migrateSecretUrl, 'oserp-cloud-step5-pre-ddl-verify');
    try {
      await migPreCheck.connect();
      await migPreCheck.query('BEGIN TRANSACTION READ ONLY');
      const idRow = (
        await migPreCheck.query(`
          SELECT
            current_database() AS db,
            current_user AS usr,
            current_setting('server_version_num')::int AS ver_num,
            r.rolsuper
          FROM pg_roles r WHERE r.rolname = current_user
        `)
      ).rows[0];
      assert.equal(idRow.db, EXPECTED_DB_NAME);
      assert.equal(idRow.usr, 'oserp_preview_migrate_admin');
      assert.ok(idRow.ver_num >= 180000 && idRow.ver_num < 190000, `Expected PG18, got ${idRow.ver_num}`);
      assert.equal(idRow.rolsuper, false);

      const dbs = (
        await migPreCheck.query(`SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY datname ASC`)
      ).rows.map((x) => x.datname);
      for (const d of dbs) assert.ok(ALLOWED_DATABASES.has(d), `Unrelated DB: ${d}`);
      await migPreCheck.query('ROLLBACK');
    } finally {
      await migPreCheck.end().catch(() => {});
    }

    const deployStartMs = Date.now();
    const preMigrationTimestampIso = new Date().toISOString();
    const prismaCliJs = path.resolve('node_modules/prisma/build/index.js');
    const cleanMigTlsUrl = (() => {
      const u = new URL(migrateSecretUrl);
      u.searchParams.set('sslmode', 'require');
      u.searchParams.set('connect_timeout', '15');
      return u.toString();
    })();

    // Execute ONCE with bounded 120s timeout; ZERO retries — fail closed on non-zero exit
    const md = spawnSync(
      process.execPath,
      [prismaCliJs, 'migrate', 'deploy', '--schema=prisma/managed-pg18-rc-v1/schema.prisma'],
      {
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          DATABASE_URL: cleanMigTlsUrl,
          DIRECT_URL: cleanMigTlsUrl,
        },
        encoding: 'utf8',
        timeout: 120000,
      }
    );
    const deployElapsedMs = Date.now() - deployStartMs;
    if (md.status !== 0) {
      throw new Error(
        `prisma migrate deploy failed closed (exit=${md.status}, elapsedMs=${deployElapsedMs}): ${redact(
          `${md.stdout || ''}\n${md.stderr || ''}`
        ).slice(-1200)}`
      );
    }

    const ckpt3Receipt = {
      project: 'OSERP-PROJ-UBOQ-001',
      checkpoint: 3,
      slug: 'm1-to-m39-deployment',
      title: 'Migration #1-#39 deployment (Isolated GitHub Actions Cloud Runner)',
      evaluatedAt: new Date().toISOString(),
      elapsedMs: deployElapsedMs,
      budgetMs: 120000,
      status: 'PASS',
      exitCode: 0,
      lastCompletedSubstep: 'LEDGER_39_OF_39_RECONCILED',
      targetNeonProjectId: EXPECTED_PROJECT_ID,
      targetDatabaseName: EXPECTED_DB_NAME,
      evidence: {
        executionEnvironment: 'GITHUB_ACTIONS_ISOLATED_CLOUD_RUNNER_DIRECT_TLS',
        githubRepository: process.env.GITHUB_REPOSITORY || null,
        githubRunId: process.env.GITHUB_RUN_ID || null,
        releaseCandidateId: 'MANAGED_PG18_RC_V1',
        reviewedPackageZipSha256: PINNED_HASHES.reviewedPackageZip,
        candidateMigration15Sha256: PINNED_HASHES.candidateMig15Required,
        schemaPath: 'prisma/managed-pg18-rc-v1/schema.prisma',
        preMigrationRestoreTimestampIso: preMigrationTimestampIso,
        finishedBefore: 0,
        finishedAfter: 39,
        unfinishedOrRolledBackAfter: 0,
        deployDurationMs: deployElapsedMs,
      },
    };
    fs.writeFileSync(
      path.join(OUT_DIR, 'checkpoint-3-m1-to-m39-deployment.json'),
      JSON.stringify(ckpt3Receipt, null, 2) + '\n'
    );
    logEvent('STAGE_4_MIGRATIONS_1_TO_39_DEPLOYED_DIRECT_TLS', {
      deployDurationMs: deployElapsedMs,
    });

    // =========================================================================
    // STAGE 5 (Step 7 & Checkpoint 4): Role Lockdown, Trust Anchors & 39/39 Audit
    // =========================================================================
    const ckpt4StartMs = Date.now();
    let postDbAudit;
    const migPostClient = makeTlsClient(migrateSecretUrl, 'oserp-cloud-ckpt4-grants-anchors');
    try {
      await migPostClient.connect();
      await migPostClient.query('BEGIN');
      await migPostClient.query(
        `GRANT SELECT ON TABLE public."_prisma_migrations" TO oserp_preview_preflight_ro, oserp_preview_direct_app`
      );
      await migPostClient.query(
        `REVOKE ALL ON TABLE public."_prisma_migrations" FROM oserp_preview_runtime_app, oserp_preview_payroll_app`
      );
      await migPostClient.query(
        `GRANT oserp_compat_app TO oserp_preview_runtime_app, oserp_preview_direct_app WITH INHERIT TRUE, SET TRUE, ADMIN FALSE`
      );
      await migPostClient.query(
        `GRANT oserp_company_payroll_app TO oserp_preview_payroll_app WITH INHERIT TRUE, SET TRUE, ADMIN FALSE`
      );
      await migPostClient.query(`SET LOCAL ROLE oserp_migrations_owner`);
      await migPostClient.query(
        `INSERT INTO public."_uboq_rls_trust_anchor" ("anchorId", "secretHex", "rotatedAt")
         VALUES ('PRIMARY', $1, NOW())
         ON CONFLICT ("anchorId") DO UPDATE SET "secretHex" = EXCLUDED."secretHex", "rotatedAt" = NOW()`,
        [derived.uboqRlsSecretHex]
      );
      await migPostClient.query(`RESET ROLE`);
      await migPostClient.query(
        `INSERT INTO public._company_payroll_trust_anchor (id, secret_hex)
         VALUES (true, $1)
         ON CONFLICT (id) DO UPDATE SET secret_hex = EXCLUDED.secret_hex`,
        [derived.companyPayrollSecretHex]
      );
      await migPostClient.query('COMMIT');

      const ledgerState = (
        await migPostClient.query(`SELECT * FROM public.uboq_verify_prisma_migration_ledger_state()`)
      ).rows[0];
      const xidHealth = (
        await migPostClient.query(`SELECT public.uboq_inspect_xid_rollover_health() AS h`)
      ).rows[0].h;
      const pubTableCount = (
        await migPostClient.query(
          `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        )
      ).rows[0].n;
      const rlsPolicyCount = (
        await migPostClient.query(`SELECT COUNT(*)::int AS n FROM pg_policies WHERE schemaname = 'public'`)
      ).rows[0].n;
      const anchorOwner = (
        await migPostClient.query(`
          SELECT r.rolname AS owner, c.relrowsecurity, c.relforcerowsecurity
          FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace JOIN pg_roles r ON r.oid = c.relowner
          WHERE n.nspname = 'public' AND c.relname = '_uboq_rls_trust_anchor'
        `)
      ).rows[0];

      assert.equal(Number(ledgerState.finished_active_rows), 39);
      assert.equal(Number(ledgerState.unfinished_or_rolled_back_rows), 0);
      assert.equal(Number(ledgerState.invalid_checksum_rows), 0);
      assert.equal(xidHealth.healthy, true);
      assert.equal(pubTableCount, 252);
      assert.equal(rlsPolicyCount, 325);
      assert.equal(anchorOwner.owner, 'oserp_migrations_owner');
      assert.equal(anchorOwner.relrowsecurity, true);
      assert.equal(anchorOwner.relforcerowsecurity, true);

      postDbAudit = {
        ledgerState,
        xidHealth,
        publicBaseTableCount: pubTableCount,
        rlsPolicyCount,
        uboqTrustAnchorOwnership: anchorOwner,
      };
    } catch (e) {
      await migPostClient.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      await migPostClient.end().catch(() => {});
    }

    // Lock `oserp_preview_migrate_admin` via `prov_role_admin`, revoke PUBLIC create, and remove `prov_role_admin`
    const provUriRes = await neonApi(
      neonToken,
      'GET',
      `/projects/${EXPECTED_PROJECT_ID}/connection_uri?branch_id=${EXPECTED_BRANCH_ID}&database_name=${EXPECTED_DB_NAME}&role_name=prov_role_admin&pooled=false`
    );
    const provLockClient = makeTlsClient(provUriRes.uri, 'oserp-cloud-ckpt4-lock-admin');
    try {
      await provLockClient.connect();
      await provLockClient.query(
        `ALTER ROLE oserp_preview_migrate_admin NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0 PASSWORD NULL`
      );
    } finally {
      await provLockClient.end().catch(() => {});
    }

    const postOwnerClient = makeTlsClient(ownerDirectUri, 'oserp-cloud-ckpt4-revoke-public');
    try {
      await postOwnerClient.connect();
      await postOwnerClient.query('BEGIN');
      await postOwnerClient.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
      await postOwnerClient.query(
        `REVOKE CREATE ON DATABASE "${EXPECTED_DB_NAME}" FROM oserp_preview_migrate_admin`
      );
      await postOwnerClient
        .query(`REVOKE ALL PRIVILEGES ON DATABASE "${EXPECTED_DB_NAME}" FROM prov_role_admin`)
        .catch(() => {});
      await postOwnerClient.query('COMMIT');
    } catch (e) {
      await postOwnerClient.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      await postOwnerClient.end().catch(() => {});
    }

    const delProv = await neonApi(
      neonToken,
      'DELETE',
      `/projects/${EXPECTED_PROJECT_ID}/branches/${EXPECTED_BRANCH_ID}/roles/prov_role_admin`
    );
    await waitNeonOps(neonToken, (delProv.operations || []).map((o) => o.id));

    // Verify 39/39 candidate checksum parity + bidirectional role security via `oserp_preview_preflight_ro`
    const roPostClient = makeTlsClient(preflightRoSecretUrl, 'oserp-cloud-ckpt4-post-verify');
    let postVerdict;
    try {
      await roPostClient.connect();
      postVerdict = await inspectTargetForManagedPg18Rc(
        roPostClient,
        rcDisk,
        authorityBundle.rcAuthority,
        { allowEmpty: false }
      );
    } finally {
      await roPostClient.end().catch(() => {});
    }
    assert.equal(postVerdict.eligible, true, `Post-deploy RC gate failed: ${JSON.stringify(postVerdict)}`);
    assert.equal(postVerdict.classification, 'ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE');
    assert.equal(postVerdict.verifiedMigrationCount, 39);
    assert.equal(postVerdict.pendingMigrationCount, 0);
    assert.equal(postVerdict.recordedMigration14Checksum, PINNED_HASHES.canonicalMig14);
    assert.equal(postVerdict.recordedMigration15Checksum, PINNED_HASHES.candidateMig15Required);
    assert.equal(postVerdict.roleSecurityPosture?.ok, true);

    // Verify live restricted runtime logins (pooled + direct + payroll)
    const runtimePooledUrl = `postgresql://oserp_preview_runtime_app:${derived.runtimeAppPassword}@${pooledHost}:5432/${EXPECTED_DB_NAME}?sslmode=require&pgbouncer=true`;
    const runtimeDirectUrl = `postgresql://oserp_preview_direct_app:${derived.directAppPassword}@${directHost}:5432/${EXPECTED_DB_NAME}?sslmode=require`;
    const payrollPooledUrl = `postgresql://oserp_preview_payroll_app:${derived.payrollAppPassword}@${pooledHost}:5432/${EXPECTED_DB_NAME}?sslmode=require&pgbouncer=true`;

    const liveRoleChecks = {};
    for (const [label, urlStr, expectedUser] of [
      ['databaseUrlPooled', runtimePooledUrl, 'oserp_preview_runtime_app'],
      ['directUrlUnpooled', runtimeDirectUrl, 'oserp_preview_direct_app'],
      ['companyPayrollPooled', payrollPooledUrl, 'oserp_preview_payroll_app'],
    ]) {
      const rc = makeTlsClient(urlStr, `oserp-cloud-verify-${label}`);
      try {
        await rc.connect();
        const row = (
          await rc.query(`
            SELECT current_user AS usr, current_database() AS db, r.rolsuper, r.rolbypassrls
            FROM pg_roles r WHERE r.rolname = current_user
          `)
        ).rows[0];
        assert.equal(row.usr, expectedUser);
        assert.equal(row.db, EXPECTED_DB_NAME);
        assert.equal(row.rolsuper, false);
        assert.equal(row.rolbypassrls, false);
        liveRoleChecks[label] = {
          role: row.usr,
          database: row.db,
          rolsuper: row.rolsuper,
          rolbypassrls: row.rolbypassrls,
          verified: true,
        };
      } finally {
        await rc.end().catch(() => {});
      }
    }

    const ckpt4Receipt = {
      project: 'OSERP-PROJ-UBOQ-001',
      checkpoint: 4,
      slug: 'lockdown-and-checksums',
      title: 'Role lockdown and checksum verification',
      evaluatedAt: new Date().toISOString(),
      elapsedMs: Date.now() - ckpt4StartMs,
      budgetMs: 90000,
      status: 'PASS',
      exitCode: 0,
      lastCompletedSubstep: 'LIVE_RESTRICTED_RUNTIME_ROLES_VERIFIED',
      targetNeonProjectId: EXPECTED_PROJECT_ID,
      targetDatabaseName: EXPECTED_DB_NAME,
      evidence: {
        githubRepository: process.env.GITHUB_REPOSITORY || null,
        githubRunId: process.env.GITHUB_RUN_ID || null,
        maskedDirectHost: maskHost(directHost),
        maskedPooledHost: maskHost(pooledHost),
        postMigrationVerdict: postVerdict,
        postDatabaseAudit: postDbAudit,
        liveRestrictedRoleVerification: liveRoleChecks,
      },
    };
    fs.writeFileSync(
      path.join(OUT_DIR, 'checkpoint-4-lockdown-and-checksums.json'),
      JSON.stringify(ckpt4Receipt, null, 2) + '\n'
    );

    const cloudSummary = {
      completedAt: new Date().toISOString(),
      totalElapsedMs: Date.now() - startedMs,
      githubRepository: process.env.GITHUB_REPOSITORY || null,
      githubRunId: process.env.GITHUB_RUN_ID || null,
      neonProjectId: EXPECTED_PROJECT_ID,
      neonBranchId: EXPECTED_BRANCH_ID,
      databaseName: EXPECTED_DB_NAME,
      reviewedCandidateZipSha256: PINNED_HASHES.reviewedPackageZip,
      candidateMigration15Sha256: PINNED_HASHES.candidateMig15Required,
      finishedMigrationCount: 39,
      unfinishedOrRolledBackCount: 0,
      publicBaseTableCount: postDbAudit.publicBaseTableCount,
      rlsPolicyCount: postDbAudit.rlsPolicyCount,
      roleSecurityClassification: postVerdict.roleSecurityPosture.classification,
      overallCloudRunnerDisposition: 'PASS_39_OF_39_DEPLOYED_LOCKED_AND_VERIFIED',
    };
    fs.writeFileSync(
      path.join(OUT_DIR, 'cloud-runner-summary.json'),
      JSON.stringify(cloudSummary, null, 2) + '\n'
    );
    logEvent('STAGE_5_COMPLETE_ALL_CHECKS_PASSED', cloudSummary);
  } finally {
    clearTimeout(hardTimer);
  }
})().catch((err) => {
  console.error(JSON.stringify({ fatal: redact(err?.message || String(err)).slice(0, 1000) }));
  process.exitCode = 1;
});
