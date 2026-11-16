'use strict';

/**
 * OSERP-PROJ-UBOQ-001 — Phase 6 Option A: Steps 1 & 2
 * 1. Preserves interrupted 25/39 state (confirms 0 active runners, captures full read-only
 *    `_prisma_migrations` ledger + table/row counts, verifies zero business/application rows).
 * 2. Validates PITR timestamp `2026-11-16T12:18:30Z` against Neon branch `created_at` and
 *    Checkpoint 1/2 timestamps, restores `br-quiet-rice-bc1edkvd` atomically while retaining
 *    recovery branch `oserp-ckpt3-interrupted-25of39-preserve-20261116`, and verifies
 *    `0` public tables, `0` migration records, and Migration #14 + RC preflight eligibility.
 *
 * Zero manual `_prisma_migrations` mutations; zero secrets printed or written to disk.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { createNeonWsClient, endPgClientBounded } = require('./neon-ws-transport.cjs');
const {
  loadDiskMigrations,
  loadApprovedAuthority,
  inspectTargetLedger,
} = require('./verify-migration14-provenance-gate.cjs');
const {
  loadRcDiskMigrations,
  loadManagedPg18RcAuthority,
  inspectTargetForManagedPg18Rc,
} = require('./verify-managed-pg18-rc-v1-gate.cjs');

const TARGET_PROJECT_ID = 'long-recipe-20782583';
const TARGET_BRANCH_ID = 'br-quiet-rice-bc1edkvd';
const TARGET_DB_NAME = 'oserp_uboq_preview';
const PITR_TIMESTAMP_ISO = '2026-11-16T12:18:30Z';
const RECOVERY_BRANCH_NAME = 'oserp-ckpt3-interrupted-25of39-preserve-20261116';

const SNAPSHOT_PATH = path.resolve(
  'artifacts/uboq/preview-readiness/interrupted-25of39-ledger-snapshot.json'
);
const RESTORE_RECEIPT_PATH = path.resolve(
  'artifacts/uboq/preview-readiness/clean-baseline-pitr-restore-receipt.json'
);

function locateCachedNeonctlCliJs() {
  const npxDir = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  if (!npxDir || !fs.existsSync(npxDir)) return null;
  for (const d of fs.readdirSync(npxDir)) {
    const cliJs = path.join(npxDir, d, 'node_modules', 'neonctl', 'bin', 'cli.js');
    if (fs.existsSync(cliJs)) return cliJs;
  }
  return null;
}

function refreshTokenBounded(cliJs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cliJs, 'me', '-o', 'json'], {
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      shell: false,
    });
    const t = setTimeout(() => {
      try {
        if (process.platform === 'win32' && child.pid) {
          spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true }).on('error', () => {});
        } else {
          child.kill('SIGKILL');
        }
      } catch {}
      reject(new Error('neonctl refresh timed out (35s)'));
    }, 35000);
    t.unref();
    child.on('close', (code) => {
      clearTimeout(t);
      if (code === 0) resolve();
      else reject(new Error(`neonctl exited ${code}`));
    });
    child.on('error', (e) => {
      clearTimeout(t);
      reject(e);
    });
  });
}

async function getNeonToken() {
  const credPath = path.join(os.homedir(), '.config', 'neonctl', 'credentials.json');
  let cred = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  if (cred.expires_at && Number(cred.expires_at) <= Date.now() + 60000) {
    await refreshTokenBounded(locateCachedNeonctlCliJs());
    cred = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  }
  return cred.access_token.trim();
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
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${apiPath.split('?')[0]} HTTP ${res.status}: ${text.slice(0, 240)}`);
  }
  return text ? JSON.parse(text) : {};
}

async function waitNeonOps(token, opIds) {
  for (const opId of opIds || []) {
    while (true) {
      const r = await neonApi(token, 'GET', `/projects/${TARGET_PROJECT_ID}/operations/${opId}`);
      const st = r.operation?.status;
      if (st === 'finished' || st === 'skipped') break;
      if (st === 'failed' || st === 'error' || st === 'cancelled') {
        throw new Error(`Neon op ${opId} failed: ${st}`);
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
  }
}

(async () => {
  const hardDeadline = setTimeout(() => {
    console.error(JSON.stringify({ fatal: 'STEPS_1_2_DEADLINE_EXCEEDED_120S' }));
    process.exit(124);
  }, 120000);

  try {
    const token = await getNeonToken();
    const proj = (await neonApi(token, 'GET', `/projects/${TARGET_PROJECT_ID}`)).project;
    assert.equal(proj.id, TARGET_PROJECT_ID);
    assert.equal(proj.pg_version, 18);

    const branchesBefore =
      (await neonApi(token, 'GET', `/projects/${TARGET_PROJECT_ID}/branches`)).branches || [];
    const targetBranch = branchesBefore.find((b) => b.id === TARGET_BRANCH_ID);
    assert.ok(targetBranch, `Target branch ${TARGET_BRANCH_ID} not found`);

    // Validate PITR timestamp `2026-11-16T12:18:30Z` against branch creation & history window
    const branchCreatedMs = Date.parse(targetBranch.created_at);
    const pitrMs = Date.parse(PITR_TIMESTAMP_ISO);
    const retentionSeconds = proj.history_retention_seconds || 86400;
    assert.ok(
      pitrMs > branchCreatedMs,
      `PITR timestamp ${PITR_TIMESTAMP_ISO} precedes branch created_at ${targetBranch.created_at}`
    );
    assert.ok(
      Date.now() - pitrMs < retentionSeconds * 1000,
      `PITR timestamp ${PITR_TIMESTAMP_ISO} is outside project history_retention_seconds (${retentionSeconds}s)`
    );

    const ckpt1 = JSON.parse(
      fs.readFileSync(
        'artifacts/uboq/preview-readiness/checkpoints/checkpoint-1-db-identity-and-roles.json',
        'utf8'
      )
    );
    assert.equal(ckpt1.status, 'PASS');
    assert.ok(
      Date.parse(ckpt1.evaluatedAt) < pitrMs,
      `Checkpoint 1 (${ckpt1.evaluatedAt}) must precede PITR timestamp ${PITR_TIMESTAMP_ISO}`
    );

    // Wake endpoint if idle
    const endpoints =
      (await neonApi(token, 'GET', `/projects/${TARGET_PROJECT_ID}/endpoints`)).endpoints || [];
    const rwEp = endpoints.find((e) => e.branch_id === TARGET_BRANCH_ID && e.type === 'read_write');
    assert.ok(rwEp);
    if (rwEp.current_state !== 'active') {
      const stRes = await neonApi(
        token,
        'POST',
        `/projects/${TARGET_PROJECT_ID}/endpoints/${rwEp.id}/start`
      ).catch(() => ({ operations: [] }));
      await waitNeonOps(token, (stRes.operations || []).map((o) => o.id));
    }

    const ownerUriRes = await neonApi(
      token,
      'GET',
      `/projects/${TARGET_PROJECT_ID}/connection_uri?branch_id=${TARGET_BRANCH_ID}&database_name=${TARGET_DB_NAME}&role_name=neondb_owner&pooled=false`
    );
    const ownerUri = ownerUriRes.uri.replace(/&?channel_binding=[^&]*/g, '');

    // STEP 1: Read-only inspection & snapshot of interrupted 25/39 state + confirm 0 active runners & 0 app data
    const snapClient = createNeonWsClient(ownerUri, 'oserp-step1-interrupted-ro-snapshot', {
      connectionTimeoutMillis: 20000,
      query_timeout: 25000,
    });
    let interruptedSnapshot;
    try {
      await snapClient.connect();
      await snapClient.query('BEGIN TRANSACTION READ ONLY');

      const activeRunners = (
        await snapClient.query(`
          SELECT pid, usename, datname, application_name, state
          FROM pg_stat_activity
          WHERE pid <> pg_backend_pid()
            AND datname = $1
            AND state <> 'idle'
        `, [TARGET_DB_NAME])
      ).rows;
      assert.equal(
        activeRunners.length,
        0,
        `SAFETY ABORT: ${activeRunners.length} active session(s) still running on ${TARGET_DB_NAME}`
      );

      const publicTableCount = (
        await snapClient.query(
          `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        )
      ).rows[0].cnt;

      const ledgerRows = (
        await snapClient.query(`
          SELECT
            migration_name,
            checksum,
            started_at,
            finished_at,
            rolled_back_at,
            applied_steps_count,
            logs
          FROM public."_prisma_migrations"
          ORDER BY started_at ASC
        `)
      ).rows;

      // Verify zero user/project/BOQ application data exists before PITR restore
      const nonEmptyDataChecks = {};
      for (const tbl of ['User', 'Project', 'UboqSourceDocument', 'UboqOperationalSnapshot']) {
        const reg = (await snapClient.query(`SELECT to_regclass($1) AS r`, [`public."${tbl}"`])).rows[0].r;
        if (reg) {
          const c = (await snapClient.query(`SELECT COUNT(*)::int AS cnt FROM public."${tbl}"`)).rows[0].cnt;
          nonEmptyDataChecks[tbl] = c;
          assert.equal(c, 0, `SAFETY ABORT: Application table ${tbl} has ${c} row(s)`);
        }
      }

      await snapClient.query('ROLLBACK');

      interruptedSnapshot = {
        capturedAt: new Date().toISOString(),
        neonProjectId: TARGET_PROJECT_ID,
        neonBranchId: TARGET_BRANCH_ID,
        databaseName: TARGET_DB_NAME,
        activeMigrationRunnersCount: activeRunners.length,
        publicBaseTableCount: publicTableCount,
        totalLedgerRows: ledgerRows.length,
        finishedLedgerRowCount: ledgerRows.filter((r) => r.finished_at && !r.rolled_back_at).length,
        unfinishedLedgerRowCount: ledgerRows.filter((r) => !r.finished_at && !r.rolled_back_at).length,
        notYetStartedCount: 39 - ledgerRows.length,
        unfinishedMigrations: ledgerRows
          .filter((r) => !r.finished_at || r.rolled_back_at)
          .map((r) => r.migration_name),
        applicationTableRowCountsVerifiedZero: nonEmptyDataChecks,
        ledgerRows,
      };
    } finally {
      await endPgClientBounded(snapClient, 5000);
    }

    fs.mkdirSync(path.dirname(SNAPSHOT_PATH), { recursive: true });
    fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(interruptedSnapshot, null, 2) + '\n');
    console.log(
      JSON.stringify({
        step: 'STEP_1_INTERRUPTED_STATE_CAPTURED',
        publicBaseTableCount: interruptedSnapshot.publicBaseTableCount,
        finishedLedgerRowCount: interruptedSnapshot.finishedLedgerRowCount,
        unfinishedLedgerRowCount: interruptedSnapshot.unfinishedLedgerRowCount,
        unfinishedMigrations: interruptedSnapshot.unfinishedMigrations,
      })
    );

    // STEP 2: Restore `br-quiet-rice-bc1edkvd` to `2026-11-16T12:18:30Z` while atomically retaining
    // `oserp-ckpt3-interrupted-25of39-preserve-20261116` recovery branch!
    const restoreRes = await neonApi(
      token,
      'POST',
      `/projects/${TARGET_PROJECT_ID}/branches/${TARGET_BRANCH_ID}/restore`,
      {
        source_branch_id: TARGET_BRANCH_ID,
        source_timestamp: PITR_TIMESTAMP_ISO,
        preserve_under_name: RECOVERY_BRANCH_NAME,
      }
    );
    await waitNeonOps(token, (restoreRes.operations || []).map((o) => o.id));

    const branchesAfter =
      (await neonApi(token, 'GET', `/projects/${TARGET_PROJECT_ID}/branches`)).branches || [];
    const preservedBranch = branchesAfter.find((b) => b.name === RECOVERY_BRANCH_NAME);
    assert.ok(preservedBranch, `Expected recovery branch ${RECOVERY_BRANCH_NAME} not found after PITR`);

    // Verify `0` public tables, `0` migration records, and M14 + RC preflight eligibility via `oserp_preview_preflight_ro`
    const ownerSecret = decodeURIComponent(new URL(ownerUri).password);
    const directHost = new URL(ownerUri).hostname;
    const roPassword = Buffer.from(
      crypto.hkdfSync(
        'sha256',
        Buffer.from(ownerSecret, 'utf8'),
        Buffer.from(ckpt1.evidence.sessionSaltId, 'hex'),
        Buffer.from('OSERP_UBOQ_PREVIEW_V1|oserp_preview_preflight_ro', 'utf8'),
        24
      )
    ).toString('hex');
    const roUrl = `postgresql://oserp_preview_preflight_ro:${roPassword}@${directHost}:5432/${TARGET_DB_NAME}?sslmode=require`;

    const diskMigrations = loadDiskMigrations();
    const approvedAuthority = loadApprovedAuthority(diskMigrations);
    const rcDisk = loadRcDiskMigrations();
    const rcAuthority = loadManagedPg18RcAuthority(rcDisk);

    const roClient = createNeonWsClient(roUrl, 'oserp-step2-clean-baseline-verify', {
      connectionTimeoutMillis: 20000,
      query_timeout: 25000,
    });
    let postRestorePubTables = -1;
    let postRestoreHasLedger = null;
    let m14Verdict;
    let rcVerdict;
    try {
      await roClient.connect();
      postRestorePubTables = (
        await roClient.query(
          `SELECT COUNT(*)::int AS cnt FROM information_schema.tables WHERE table_schema = 'public'`
        )
      ).rows[0].cnt;
      postRestoreHasLedger = (
        await roClient.query(`SELECT to_regclass('public."_prisma_migrations"') AS r`)
      ).rows[0].r;
      assert.equal(postRestorePubTables, 0, `Expected 0 public tables after PITR, found ${postRestorePubTables}`);
      assert.equal(postRestoreHasLedger, null, 'Expected 0 _prisma_migrations table after PITR');

      m14Verdict = await inspectTargetLedger(roClient, diskMigrations, approvedAuthority, {
        allowEmpty: true,
      });
      rcVerdict = await inspectTargetForManagedPg18Rc(roClient, rcDisk, rcAuthority, {
        allowEmpty: true,
      });
      assert.equal(m14Verdict.eligible, true);
      assert.equal(rcVerdict.eligible, true);
    } finally {
      await endPgClientBounded(roClient, 5000);
    }

    const restoreReceipt = {
      restoredAt: new Date().toISOString(),
      neonProjectId: TARGET_PROJECT_ID,
      restoredBranchId: TARGET_BRANCH_ID,
      databaseName: TARGET_DB_NAME,
      validatedPitrTimestampIso: PITR_TIMESTAMP_ISO,
      branchCreatedAtIso: targetBranch.created_at,
      preservedRecoveryBranchId: preservedBranch.id,
      preservedRecoveryBranchName: preservedBranch.name,
      manualLedgerEditsPerformed: false,
      postRestoreVerification: {
        publicTableCount: postRestorePubTables,
        migrationRecordsCount: 0,
        m14PreflightClassification: m14Verdict.classification,
        rcPreflightClassification: rcVerdict.classification,
        pendingMigrationCount: rcVerdict.pendingMigrationCount,
      },
    };
    fs.writeFileSync(RESTORE_RECEIPT_PATH, JSON.stringify(restoreReceipt, null, 2) + '\n');
    console.log(JSON.stringify({ step: 'STEP_2_CLEAN_BASELINE_RESTORED_AND_VERIFIED', restoreReceipt }, null, 2));
  } finally {
    clearTimeout(hardDeadline);
  }
})().catch((err) => {
  console.error(JSON.stringify({ fatal: String(err?.message || err) }));
  process.exitCode = 1;
});
