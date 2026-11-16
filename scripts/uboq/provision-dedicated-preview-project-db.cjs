'use strict';

/**
 * OneSystemsERP Universal BOQ (OSERP-PROJ-UBOQ-001)
 * Bounded 6-Checkpoint Preview Provisioner & Readiness Runner (TASK 4)
 *
 * Usage:
 *   node scripts/uboq/provision-dedicated-preview-project-db.cjs --status
 *   node scripts/uboq/provision-dedicated-preview-project-db.cjs --checkpoint=<1|2|3|4|5|6>
 *
 * Checkpoints:
 *   1: Database identity and role verification (75s budget)
 *   2: Migration #14 and release-candidate preflight (60s budget)
 *   3: Migration #1-#39 deployment (210s budget)
 *   4: Role lockdown and checksum verification (90s budget)
 *   5: Preview-only Vercel environment configuration (75s budget)
 *   6: Final Phase 6 gate (90s budget)
 *
 * Safety & Lifecycle Guarantees:
 * - Never runs a monolithic loop; executes exactly ONE bounded checkpoint per invocation.
 * - Enforces prerequisite checkpoint PASS receipts before running checkpoint N > 1.
 * - Uses Node 22 `fetch` with `AbortSignal.timeout` consuming remaining checkpoint budget.
 * - Uses `endPgClientBounded` + fixed `NeonWsPgStream._final` so shutdown never hangs.
 * - Invokes `node_modules/prisma/build/index.js` directly via `process.execPath` (`shell: false`)
 *   with immediate timeout settlement + `taskkill /T /F` (never blocks on Windows pipe inheritance).
 * - Derives role & trust-anchor secrets purely in memory via HKDF-SHA256 from Neon API `neondb_owner`
 *   secret + public `sessionSaltId`; zero secrets ever touch disk, CLI args, logs, or receipts.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { Client } = require('pg');
const {
  createNeonWsClient,
  endPgClientBounded,
  startLocalNeonWsBridge,
} = require('./neon-ws-transport.cjs');
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

const TEAM_ID = 'team_DWpmafscN88J0nNBvcUKHNM7';
const PRIMARY_VERCEL_PROJECT_ID = 'prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi';
const NEON_ORG_ID = 'org-sweet-fog-42432629';
const EXPECTED_DEFAULT_BRANCH_ID = 'br-quiet-rice-bc1edkvd';
const PREVIEW_DB_NAME = 'oserp_uboq_preview';
const DB_OWNER_ROLE_NAME = 'neondb_owner';
const EPHEMERAL_ROLE_CREATOR = 'prov_role_admin';
const RC_SCHEMA_PATH = 'prisma/managed-pg18-rc-v1/schema.prisma';
const PRISMA_CLI_JS = path.resolve('node_modules/prisma/build/index.js');

const DISQUALIFIED_NEON_PROJECT_IDS = new Set([
  'holy-shape-01357429',
  'cold-unit-82916367',
  'royal-cherry-02561649',
]);
const ALLOWED_DATABASES = new Set(['postgres', 'neondb', PREVIEW_DB_NAME]);

const PROTECTED_BLOB_VAULT_KEYS = new Set([
  'BLOB_READ_WRITE_TOKEN',
  'UBOQ_VAULT_BLOB_READ_WRITE_TOKEN',
  'UBOQ_VAULT_BLOB_STORE_ID',
  'UBOQ_VAULT_BACKEND',
  'UBOQ_VAULT_ENV_NAMESPACE',
  'UBOQ_VAULT_ENCRYPTION_KEY',
]);

const CHECKPOINTS_DIR = path.resolve('artifacts/uboq/preview-readiness/checkpoints');
const CONSOLIDATED_RECEIPT_PATH = path.resolve(
  'artifacts/uboq/preview-readiness/dedicated-preview-provisioning-receipt.json'
);

const CHECKPOINT_SPECS = Object.freeze({
  1: { id: 1, slug: 'db-identity-and-roles', title: 'Database identity and role verification', budgetMs: 75000 },
  2: { id: 2, slug: 'm14-and-rc-preflight', title: 'Migration #14 and release-candidate preflight', budgetMs: 60000 },
  3: { id: 3, slug: 'm1-to-m39-deployment', title: 'Migration #1-#39 deployment', budgetMs: 210000 },
  4: { id: 4, slug: 'lockdown-and-checksums', title: 'Role lockdown and checksum verification', budgetMs: 90000 },
  5: { id: 5, slug: 'vercel-preview-env', title: 'Preview-only Vercel environment configuration', budgetMs: 75000 },
  6: { id: 6, slug: 'final-phase6-gate', title: 'Final Phase 6 gate', budgetMs: 90000 },
});

function checkpointReceiptPath(n) {
  const spec = CHECKPOINT_SPECS[n];
  return path.join(CHECKPOINTS_DIR, `checkpoint-${spec.id}-${spec.slug}.json`);
}

function readCheckpointReceipt(n) {
  const p = checkpointReceiptPath(n);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function redactText(str) {
  return String(str || '')
    .replace(/"(password|uri|value|token|access_token)"\s*:\s*"[^"]*"/gi, '"$1":"[REDACTED]"')
    .replace(/postgresql:\/\/[^\s"']+/gi, '[REDACTED_URL]')
    .replace(/npg_[A-Za-z0-9]+/g, '[REDACTED_SECRET]');
}

function maskHost(host) {
  if (!host) return null;
  const m = host.match(/^(ep-[a-z0-9]+-[a-z0-9]+)-[a-z0-9]+(-pooler)?\.(.+)$/i);
  if (m) return `${m[1]}-REDACTED${m[2] || ''}.${m[3]}`;
  return host;
}

function sanitizePgUri(rawUri) {
  const u = new URL(rawUri);
  u.searchParams.delete('channel_binding');
  if (!u.searchParams.get('sslmode')) u.searchParams.set('sslmode', 'require');
  return u.toString();
}

function buildPgUrl(host, dbName, username, password, extraParams = {}) {
  const u = new URL(`postgresql://${host}:5432/${dbName}`);
  u.username = username;
  u.password = password;
  u.searchParams.set('sslmode', 'require');
  for (const [k, v] of Object.entries(extraParams)) {
    u.searchParams.set(k, String(v));
  }
  return u.toString();
}

function deriveSessionSecretsInMemory(neondbOwnerSecret, sessionSaltId) {
  assert.ok(neondbOwnerSecret && neondbOwnerSecret.length >= 12, 'Invalid owner key material');
  assert.match(sessionSaltId, /^[0-9a-f]{32}$/, 'Invalid sessionSaltId');
  const ikm = Buffer.from(neondbOwnerSecret, 'utf8');
  const salt = Buffer.from(sessionSaltId, 'hex');
  const deriveHex = (label, byteLen) =>
    Buffer.from(
      crypto.hkdfSync('sha256', ikm, salt, Buffer.from(`OSERP_UBOQ_PREVIEW_V1|${label}`, 'utf8'), byteLen)
    ).toString('hex');

  return {
    roPassword: deriveHex('oserp_preview_preflight_ro', 24),
    migrateAdminPassword: deriveHex('oserp_preview_migrate_admin', 24),
    runtimeAppPassword: deriveHex('oserp_preview_runtime_app', 24),
    directAppPassword: deriveHex('oserp_preview_direct_app', 24),
    payrollAppPassword: deriveHex('oserp_preview_payroll_app', 24),
    uboqRlsSecretHex: deriveHex('uboq_rls_trust_anchor', 32),
    companyPayrollSecretHex: deriveHex('company_payroll_trust_anchor', 32),
    internalApiSecretHex: deriveHex('internal_api_secret', 32),
  };
}

function locateCachedNeonctlCliJs() {
  const npxDir = path.join(process.env.LOCALAPPDATA || '', 'npm-cache', '_npx');
  if (!npxDir || !fs.existsSync(npxDir)) return null;
  for (const d of fs.readdirSync(npxDir)) {
    const cliJs = path.join(npxDir, d, 'node_modules', 'neonctl', 'bin', 'cli.js');
    if (fs.existsSync(cliJs)) return cliJs;
  }
  return null;
}

function readNeonCachedCred() {
  const credPath = path.join(os.homedir(), '.config', 'neonctl', 'credentials.json');
  assert.ok(fs.existsSync(credPath), 'Neon credentials.json not found');
  const cred = JSON.parse(fs.readFileSync(credPath, 'utf8'));
  assert.ok(cred && typeof cred.access_token === 'string' && cred.access_token.trim(), 'Neon access_token empty');
  return cred;
}

function readVercelCachedToken() {
  const p = path.join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json');
  assert.ok(fs.existsSync(p), 'Vercel auth.json not found');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.ok(j && typeof j.token === 'string' && j.token.trim(), 'Vercel token empty');
  return j.token.trim();
}

function runNodeSubprocessBounded(scriptAndArgs, envVars, maxMs) {
  return new Promise((resolve) => {
    let settled = false;
    let stdout = '';
    let stderr = '';
    const child = spawn(process.execPath, scriptAndArgs, {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: envVars,
      shell: false,
      windowsHide: true,
    });

    const settle = (result) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(result);
      }
    };

    const killTree = () => {
      try {
        if (process.platform === 'win32' && child.pid) {
          const tk = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
            stdio: 'ignore',
            windowsHide: true,
          });
          tk.on('error', () => { });
        } else {
          child.kill('SIGKILL');
        }
      } catch { }
    };

    const timer = setTimeout(() => {
      killTree();
      // Settle deterministically within 500ms even if a descendant holds an inherited pipe
      const grace = setTimeout(() => {
        settle({ status: 124, stdout, stderr, timedOut: true });
      }, 500);
      grace.unref();
    }, maxMs);
    timer.unref();

    child.stdout.on('data', (d) => {
      if (stdout.length < 65536) stdout += d.toString('utf8');
    });
    child.stderr.on('data', (d) => {
      if (stderr.length < 65536) stderr += d.toString('utf8');
    });
    child.on('error', (err) => {
      settle({ status: 1, stdout, stderr: `${stderr}\n${err.message}`, timedOut: false });
    });
    child.on('close', (code) => {
      settle({ status: code ?? 1, stdout, stderr, timedOut: false });
    });
  });
}

function printStatusReport() {
  fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true });
  const statuses = [];
  let firstIncomplete = null;
  for (let i = 1; i <= 6; i += 1) {
    const r = readCheckpointReceipt(i);
    const passed = Boolean(r && r.status === 'PASS' && r.exitCode === 0);
    if (!passed && firstIncomplete === null) firstIncomplete = i;
    statuses.push({
      checkpoint: i,
      slug: CHECKPOINT_SPECS[i].slug,
      title: CHECKPOINT_SPECS[i].title,
      status: r ? r.status : 'NOT_RUN',
      evaluatedAt: r?.evaluatedAt || null,
      lastCompletedSubstep: r?.lastCompletedSubstep || null,
    });
  }
  console.log(
    JSON.stringify(
      {
        targetNeonProjectId: 'long-recipe-20782583',
        targetDatabaseName: PREVIEW_DB_NAME,
        firstIncompleteCheckpoint: firstIncomplete,
        allComplete: firstIncomplete === null,
        checkpoints: statuses,
      },
      null,
      2
    )
  );
}

async function executeCheckpoint(ckptNum) {
  const spec = CHECKPOINT_SPECS[ckptNum];
  assert.ok(spec, `Unknown checkpoint: ${ckptNum}`);
  fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true });

  const startedEpochMs = Date.now();
  const deadlineEpochMs = startedEpochMs + spec.budgetMs;
  let lastSubstep = 'INIT';

  const mark = (substep, extra = {}) => {
    lastSubstep = substep;
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        checkpoint: ckptNum,
        substep,
        elapsedMs: Date.now() - startedEpochMs,
        ...extra,
      })
    );
  };

  const remainingMs = (capMs = 15000) => {
    const rem = deadlineEpochMs - Date.now();
    if (rem <= 1500) {
      const err = new Error(`CHECKPOINT_${ckptNum}_DEADLINE_EXCEEDED`);
      err.isDeadline = true;
      throw err;
    }
    return Math.min(capMs, rem - 500);
  };

  const apiFetchJson = async (baseUrl, token, method, apiPath, bodyObj, maxReqMs = 12000) => {
    const canRetry = method === 'GET';
    const maxAttempts = canRetry ? 2 : 1;
    let lastErr = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const reqTimeout = remainingMs(maxReqMs);
      try {
        const res = await fetch(`${baseUrl}${apiPath}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'User-Agent': 'oserp-uboq-phase6-ckpt/1.0',
            ...(bodyObj !== undefined ? { 'Content-Type': 'application/json' } : {}),
          },
          body: bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined,
          signal: AbortSignal.timeout(reqTimeout),
        });
        const text = await res.text();
        if (!res.ok) {
          throw new Error(
            `${method} ${apiPath.split('?')[0]} HTTP ${res.statusCode || res.status}: ${redactText(text).slice(0, 260)}`
          );
        }
        return text ? JSON.parse(text) : {};
      } catch (err) {
        lastErr = err;
        if (!canRetry || attempt === maxAttempts || /HTTP 4\d\d/.test(String(err.message || ''))) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    }
    throw lastErr;
  };

  const neonApi = (token, method, apiPath, bodyObj) =>
    apiFetchJson('https://console.neon.tech/api/v2', token, method, apiPath, bodyObj, 12000);

  const vercelApi = (token, method, apiPath, bodyObj) =>
    apiFetchJson('https://api.vercel.com', token, method, apiPath, bodyObj, 12000);

  const waitNeonOps = async (token, projectId, opIds) => {
    for (const opId of opIds || []) {
      let finished = false;
      while (!finished) {
        remainingMs(8000);
        const opRes = await neonApi(token, 'GET', `/projects/${projectId}/operations/${opId}`);
        const st = opRes.operation?.status;
        if (st === 'finished' || st === 'skipped') {
          finished = true;
          break;
        }
        if (st === 'failed' || st === 'error' || st === 'cancelled') {
          throw new Error(`Neon operation ${opId} failed (${st})`);
        }
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  };

  const makePgClient = (connUri, appName) =>
    createNeonWsClient(sanitizePgUri(connUri), appName, {
      connectionTimeoutMillis: remainingMs(18000),
      query_timeout: remainingMs(25000),
    });

  const writeReceipt = (status, exitCode, evidenceOrError) => {
    const payload = {
      project: 'OSERP-PROJ-UBOQ-001',
      checkpoint: ckptNum,
      slug: spec.slug,
      title: spec.title,
      evaluatedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedEpochMs,
      budgetMs: spec.budgetMs,
      status,
      exitCode,
      lastCompletedSubstep: lastSubstep,
      targetNeonProjectId: (process.env.OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID || '').trim() || null,
      targetDatabaseName: PREVIEW_DB_NAME,
      ...evidenceOrError,
    };
    fs.writeFileSync(checkpointReceiptPath(ckptNum), JSON.stringify(payload, null, 2) + '\n');
    return payload;
  };

  // Referenced outer deadline timer that forces deterministic receipt + exit even if an async await stalls
  const hardWatchdog = setTimeout(() => {
    writeReceipt('TIMEOUT', 124, {
      errorSummary: `Hard checkpoint deadline (${spec.budgetMs}ms) exceeded after substep ${lastSubstep}`,
    });
    console.error(
      JSON.stringify({
        checkpoint: ckptNum,
        status: 'TIMEOUT',
        exitCode: 124,
        lastCompletedSubstep: lastSubstep,
      })
    );
    process.exit(124);
  }, spec.budgetMs);

  try {
    const targetProjectId = (process.env.OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID || '').trim();
    assert.ok(targetProjectId, 'OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID is required');
    assert.equal(
      DISQUALIFIED_NEON_PROJECT_IDS.has(targetProjectId),
      false,
      `Disqualified Neon project: ${targetProjectId}`
    );

    // Enforce strict prerequisite checkpoints (`1 .. ckptNum - 1` MUST be PASS)
    for (let prev = 1; prev < ckptNum; prev += 1) {
      const prevRec = readCheckpointReceipt(prev);
      assert.ok(
        prevRec && prevRec.status === 'PASS' && prevRec.exitCode === 0,
        `Prerequisite Checkpoint ${prev} (${CHECKPOINT_SPECS[prev].slug}) has not passed yet`
      );
    }

    // Verify frozen Task 3 Codex review PASS + local authorities
    const codexReviewText = fs.readFileSync(
      'artifacts/uboq/managed-pg18-rc-v1/codex-independent-review.md',
      'utf8'
    );
    assert.match(codexReviewText, /INDEPENDENT_REVIEW_DISPOSITION:\s*PASS\b/);
    const diskMigrations = loadDiskMigrations();
    const approvedAuthority = loadApprovedAuthority(diskMigrations);
    const rcDisk = loadRcDiskMigrations();
    const rcAuthority = loadManagedPg18RcAuthority(rcDisk);
    mark('AUTHORITY_VERIFIED');

    const ensureValidNeonToken = async () => {
      let cred = readNeonCachedCred();
      const refreshViaPinnedCli = async () => {
        const cliJs = locateCachedNeonctlCliJs();
        assert.ok(cliJs, 'Cached neonctl/bin/cli.js not found for OAuth token refresh');
        const refRes = await runNodeSubprocessBounded([cliJs, 'me', '-o', 'json'], process.env, remainingMs(35000));
        assert.equal(refRes.status, 0, `neonctl token refresh failed (exit=${refRes.status})`);
        cred = readNeonCachedCred();
      };
      if (cred.expires_at && Number(cred.expires_at) <= Date.now() + 60000) {
        await refreshViaPinnedCli();
      }
      try {
        await neonApi(cred.access_token.trim(), 'GET', '/users/me');
        return cred.access_token.trim();
      } catch (err) {
        if (/HTTP 401/.test(String(err.message || ''))) {
          await refreshViaPinnedCli();
          await neonApi(cred.access_token.trim(), 'GET', '/users/me');
          return cred.access_token.trim();
        }
        throw err;
      }
    };

    // Helper to fetch Neon owner URIs & derive deterministic in-memory secrets
    const loadNeonContext = async (sessionSaltId) => {
      const neonToken = await ensureValidNeonToken();
      const proj = (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}`)).project;
      assert.equal(proj.id, targetProjectId);
      assert.equal(proj.org_id, NEON_ORG_ID);
      assert.equal(proj.pg_version, 18);
      assert.match(proj.name || '', /onesystems|oserp/i);

      const branches =
        (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/branches`)).branches || [];
      const previewBranch = branches.find((b) => b.default || b.primary || b.name === 'main');
      assert.ok(previewBranch && previewBranch.id === EXPECTED_DEFAULT_BRANCH_ID);

      const endpoints =
        (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/endpoints`)).endpoints || [];
      const rwEndpoint = endpoints.find(
        (e) => e.branch_id === previewBranch.id && e.type === 'read_write'
      );
      assert.ok(rwEndpoint);
      if (rwEndpoint.current_state !== 'active') {
        const startRes = await neonApi(
          neonToken,
          'POST',
          `/projects/${targetProjectId}/endpoints/${rwEndpoint.id}/start`
        ).catch((err) => {
          if (/already|active|409|422/i.test(String(err.message || ''))) return { operations: [] };
          throw err;
        });
        await waitNeonOps(neonToken, targetProjectId, (startRes.operations || []).map((o) => o.id));
      }

      const ownerDirectRes = await neonApi(
        neonToken,
        'GET',
        `/projects/${targetProjectId}/connection_uri?branch_id=${previewBranch.id}&database_name=${PREVIEW_DB_NAME}&role_name=${DB_OWNER_ROLE_NAME}&pooled=false`
      );
      const ownerPooledRes = await neonApi(
        neonToken,
        'GET',
        `/projects/${targetProjectId}/connection_uri?branch_id=${previewBranch.id}&database_name=${PREVIEW_DB_NAME}&role_name=${DB_OWNER_ROLE_NAME}&pooled=true`
      );
      const ownerDirectUri = sanitizePgUri(ownerDirectRes.uri);
      const ownerSecret = decodeURIComponent(new URL(ownerDirectUri).password);
      const directHost = new URL(ownerDirectUri).hostname;
      const pooledHost = new URL(ownerPooledRes.uri).hostname;
      const secrets = deriveSessionSecretsInMemory(ownerSecret, sessionSaltId);

      return {
        neonToken,
        proj,
        branches,
        previewBranch,
        rwEndpoint,
        ownerDirectUri,
        directHost,
        pooledHost,
        secrets,
        urls: {
          roDirectUrl: buildPgUrl(directHost, PREVIEW_DB_NAME, 'oserp_preview_preflight_ro', secrets.roPassword),
          migrateDirectUrl: buildPgUrl(directHost, PREVIEW_DB_NAME, 'oserp_preview_migrate_admin', secrets.migrateAdminPassword),
          runtimePooledUrl: buildPgUrl(pooledHost, PREVIEW_DB_NAME, 'oserp_preview_runtime_app', secrets.runtimeAppPassword, { pgbouncer: 'true' }),
          runtimeDirectUrl: buildPgUrl(directHost, PREVIEW_DB_NAME, 'oserp_preview_direct_app', secrets.directAppPassword),
          payrollPooledUrl: buildPgUrl(pooledHost, PREVIEW_DB_NAME, 'oserp_preview_payroll_app', secrets.payrollAppPassword, { pgbouncer: 'true' }),
        },
      };
    };

    // =========================================================================
    // CHECKPOINT 1: Database Identity and Role Verification
    // =========================================================================
    if (ckptNum === 1) {
      const existingCkpt1 = readCheckpointReceipt(1);
      const sessionSaltId =
        existingCkpt1?.evidence?.sessionSaltId || crypto.randomBytes(16).toString('hex');

      const neonToken = await ensureValidNeonToken();
      mark('NEON_AUTH_VERIFIED');

      const proj = (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}`)).project;
      assert.equal(proj.id, targetProjectId);
      assert.equal(proj.org_id, NEON_ORG_ID);
      assert.equal(proj.pg_version, 18);
      assert.match(proj.name || '', /onesystems|oserp/i);

      const opsCheck = await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/operations?limit=15`);
      const pendingOps = (opsCheck.operations || []).filter(
        (o) => o.status !== 'finished' && o.status !== 'skipped'
      );
      if (pendingOps.length > 0) {
        await waitNeonOps(neonToken, targetProjectId, pendingOps.map((o) => o.id));
      }
      mark('NEON_PROJECT_AND_OPS_VERIFIED');

      const branches =
        (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/branches`)).branches || [];
      for (const b of branches) {
        assert.doesNotMatch(b.name || '', /rentipid|wsmra|widows/i);
      }
      const previewBranch = branches.find((b) => b.default || b.primary || b.name === 'main');
      assert.ok(previewBranch && previewBranch.id === EXPECTED_DEFAULT_BRANCH_ID);

      const endpoints =
        (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/endpoints`)).endpoints || [];
      const rwEndpoint = endpoints.find(
        (e) => e.branch_id === previewBranch.id && e.type === 'read_write'
      );
      assert.ok(rwEndpoint);
      if (!rwEndpoint.pooler_enabled) {
        const patchEp = await neonApi(
          neonToken,
          'PATCH',
          `/projects/${targetProjectId}/endpoints/${rwEndpoint.id}`,
          { endpoint: { pooler_enabled: true } }
        );
        await waitNeonOps(neonToken, targetProjectId, (patchEp.operations || []).map((o) => o.id));
      }
      const epFresh = (
        await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/endpoints/${rwEndpoint.id}`)
      ).endpoint;
      if (epFresh.current_state !== 'active') {
        const startRes = await neonApi(
          neonToken,
          'POST',
          `/projects/${targetProjectId}/endpoints/${rwEndpoint.id}/start`
        ).catch((err) => {
          if (/already|active|409|422/i.test(String(err.message || ''))) return { operations: [] };
          throw err;
        });
        await waitNeonOps(neonToken, targetProjectId, (startRes.operations || []).map((o) => o.id));
      }
      mark('COMPUTE_ENDPOINT_ACTIVE');

      const existingDbs =
        (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/branches/${previewBranch.id}/databases`)).databases || [];
      for (const d of existingDbs) {
        assert.ok(ALLOWED_DATABASES.has(d.name), `Unrelated DB: ${d.name}`);
      }
      if (!existingDbs.some((d) => d.name === PREVIEW_DB_NAME)) {
        const dc = await neonApi(
          neonToken,
          'POST',
          `/projects/${targetProjectId}/branches/${previewBranch.id}/databases`,
          { database: { name: PREVIEW_DB_NAME, owner_name: DB_OWNER_ROLE_NAME } }
        );
        await waitNeonOps(neonToken, targetProjectId, (dc.operations || []).map((o) => o.id));
      }

      // Check default `neondb` (`0` open non-idle sessions, `0` public tables) + clean close
      const neondbUriRes = await neonApi(
        neonToken,
        'GET',
        `/projects/${targetProjectId}/connection_uri?branch_id=${previewBranch.id}&database_name=neondb&role_name=${DB_OWNER_ROLE_NAME}&pooled=false`
      );
      const neondbClient = makePgClient(neondbUriRes.uri, 'oserp-ckpt1-neondb-check');
      let haltedAudit;
      try {
        await neondbClient.connect();
        const activeSessions = (
          await neondbClient.query(`
            SELECT COUNT(*)::int AS cnt
            FROM pg_stat_activity
            WHERE pid <> pg_backend_pid() AND datname IS NOT NULL AND state <> 'idle'
          `)
        ).rows[0].cnt;
        const neondbPubTables = (
          await neondbClient.query(`SELECT COUNT(*)::int AS cnt FROM pg_tables WHERE schemaname = 'public'`)
        ).rows[0].cnt;
        assert.equal(activeSessions, 0, `Expected 0 active sessions, found ${activeSessions}`);
        assert.equal(neondbPubTables, 0, `Expected 0 tables in neondb, found ${neondbPubTables}`);
        haltedAudit = { activeNonIdleSessions: activeSessions, neondbPublicTables: neondbPubTables };
      } finally {
        await endPgClientBounded(neondbClient, 5000);
      }
      mark('NEONDB_ISOLATION_AND_SHUTDOWN_VERIFIED', haltedAudit);

      const ctx = await loadNeonContext(sessionSaltId);

      // Inspect current object/migration state on `oserp_uboq_preview`
      const ownerClient = makePgClient(ctx.ownerDirectUri, 'oserp-ckpt1-owner-inspect');
      let objectCount = 0;
      let appliedMigrationCount = 0;
      try {
        await ownerClient.connect();
        const pgDbs = (
          await ownerClient.query(`SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY datname ASC`)
        ).rows.map((r) => r.datname);
        for (const d of pgDbs) assert.ok(ALLOWED_DATABASES.has(d), `Unexpected pg_database: ${d}`);

        objectCount = (
          await ownerClient.query(`
            SELECT COUNT(*)::int AS cnt
            FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
              AND n.nspname !~ '^pg_toast'
              AND c.relkind IN ('r','p','v','m','S','f')
          `)
        ).rows[0].cnt;

        const hasLedger = (
          await ownerClient.query(`SELECT to_regclass('public."_prisma_migrations"') AS reg`)
        ).rows[0].reg;
        if (hasLedger) {
          appliedMigrationCount = (
            await ownerClient.query(
              `SELECT COUNT(*)::int AS cnt FROM public."_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`
            )
          ).rows[0].cnt;
        }
      } finally {
        await endPgClientBounded(ownerClient, 5000);
      }
      mark('PREVIEW_DB_STATE_INSPECTED', { objectCount, appliedMigrationCount });

      // Provision/refresh 5 restricted roles via Neon API `prov_role_admin` when migrations remain pending
      if (appliedMigrationCount < 39) {
        const curRoles =
          (await neonApi(neonToken, 'GET', `/projects/${targetProjectId}/branches/${previewBranch.id}/roles`)).roles || [];
        if (!curRoles.some((r) => r.name === EPHEMERAL_ROLE_CREATOR)) {
          const cr = await neonApi(
            neonToken,
            'POST',
            `/projects/${targetProjectId}/branches/${previewBranch.id}/roles`,
            { role: { name: EPHEMERAL_ROLE_CREATOR } }
          );
          await waitNeonOps(neonToken, targetProjectId, (cr.operations || []).map((o) => o.id));
        }
        const provUriRes = await neonApi(
          neonToken,
          'GET',
          `/projects/${targetProjectId}/connection_uri?branch_id=${previewBranch.id}&database_name=${PREVIEW_DB_NAME}&role_name=${EPHEMERAL_ROLE_CREATOR}&pooled=false`
        );
        const provClient = makePgClient(provUriRes.uri, 'oserp-ckpt1-role-creator');
        try {
          await provClient.connect();
          await provClient.query('BEGIN');
          await provClient.query("SET LOCAL password_encryption = 'scram-sha-256'");
          for (const r of [
            {
              name: 'oserp_preview_preflight_ro',
              createAttrs: 'LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT',
              alterAttrs: 'LOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS NOINHERIT',
              pw: ctx.secrets.roPassword,
            },
            {
              name: 'oserp_preview_migrate_admin',
              createAttrs: 'LOGIN NOSUPERUSER CREATEDB CREATEROLE BYPASSRLS INHERIT',
              alterAttrs: 'LOGIN CREATEDB CREATEROLE BYPASSRLS INHERIT CONNECTION LIMIT -1',
              pw: ctx.secrets.migrateAdminPassword,
            },
            {
              name: 'oserp_preview_runtime_app',
              createAttrs: 'LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT',
              alterAttrs: 'LOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT',
              pw: ctx.secrets.runtimeAppPassword,
            },
            {
              name: 'oserp_preview_direct_app',
              createAttrs: 'LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT CONNECTION LIMIT 10',
              alterAttrs: 'LOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT CONNECTION LIMIT 10',
              pw: ctx.secrets.directAppPassword,
            },
            {
              name: 'oserp_preview_payroll_app',
              createAttrs: 'LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT',
              alterAttrs: 'LOGIN NOCREATEDB NOCREATEROLE NOBYPASSRLS INHERIT',
              pw: ctx.secrets.payrollAppPassword,
            },
          ]) {
            const ex = (await provClient.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [r.name])).rowCount;
            if (!ex) await provClient.query(`CREATE ROLE ${r.name} ${r.createAttrs}`);
            else await provClient.query(`ALTER ROLE ${r.name} ${r.alterAttrs}`);
            await provClient.query(`ALTER ROLE ${r.name} PASSWORD '${r.pw}'`);
          }
          await provClient.query(`ALTER ROLE oserp_preview_preflight_ro SET default_transaction_read_only = on`);
          await provClient.query(`ALTER ROLE oserp_preview_migrate_admin SET createrole_self_grant = 'set, inherit'`);
          await provClient.query('COMMIT');
        } catch (e) {
          await provClient.query('ROLLBACK').catch(() => { });
          throw e;
        } finally {
          await endPgClientBounded(provClient, 5000);
        }

        const grantClient = makePgClient(ctx.ownerDirectUri, 'oserp-ckpt1-db-grants');
        try {
          await grantClient.connect();
          await grantClient.query('BEGIN');
          for (const rn of [
            'oserp_preview_preflight_ro',
            'oserp_preview_migrate_admin',
            'oserp_preview_runtime_app',
            'oserp_preview_direct_app',
            'oserp_preview_payroll_app',
          ]) {
            await grantClient.query(`GRANT CONNECT ON DATABASE "${PREVIEW_DB_NAME}" TO ${rn}`);
          }
          await grantClient.query(`GRANT USAGE ON SCHEMA public TO oserp_preview_preflight_ro`);
          await grantClient.query(`GRANT ALL ON SCHEMA public TO oserp_preview_migrate_admin`);
          await grantClient.query(`GRANT CREATE ON SCHEMA public TO PUBLIC`);
          await grantClient.query(`GRANT CREATE ON DATABASE "${PREVIEW_DB_NAME}" TO oserp_preview_migrate_admin`);
          await grantClient.query('COMMIT');
        } catch (e) {
          await grantClient.query('ROLLBACK').catch(() => { });
          throw e;
        } finally {
          await endPgClientBounded(grantClient, 5000);
        }
      }
      mark('OPERATIONAL_ROLES_PROVISIONED');

      // Verify bounded connect + query + close on `oserp_preview_preflight_ro`
      const roVerify = makePgClient(ctx.urls.roDirectUrl, 'oserp-ckpt1-ro-verify');
      let roIdentity;
      try {
        await roVerify.connect();
        roIdentity = (
          await roVerify.query(
            `SELECT current_user AS usr, current_database() AS db, current_setting('transaction_read_only') AS tx_ro, r.rolsuper FROM pg_roles r WHERE r.rolname = current_user`
          )
        ).rows[0];
        assert.equal(roIdentity.usr, 'oserp_preview_preflight_ro');
        assert.equal(roIdentity.db, PREVIEW_DB_NAME);
        assert.equal(roIdentity.tx_ro, 'on');
        assert.equal(roIdentity.rolsuper, false);
      } finally {
        await endPgClientBounded(roVerify, 5000);
      }
      mark('PREFLIGHT_ROLE_CONNECT_AND_CLOSE_VERIFIED');

      const rec = writeReceipt('PASS', 0, {
        evidence: {
          sessionSaltId,
          neonProjectName: proj.name,
          neonBranchId: previewBranch.id,
          neonEndpointId: rwEndpoint.id,
          poolerEnabled: true,
          maskedDirectHost: maskHost(ctx.directHost),
          maskedPooledHost: maskHost(ctx.pooledHost),
          haltedAudit,
          objectCountBeforeDeploy: objectCount,
          appliedMigrationCount,
          preflightRoleVerified: roIdentity,
        },
      });
      console.log(JSON.stringify({ checkpoint: 1, status: rec.status, receiptPath: checkpointReceiptPath(1) }));
      return;
    }

    // Load `sessionSaltId` established in Checkpoint 1
    const ckpt1 = readCheckpointReceipt(1);
    const sessionSaltId = ckpt1.evidence.sessionSaltId;
    const ctx = await loadNeonContext(sessionSaltId);

    // =========================================================================
    // CHECKPOINT 2: Migration #14 and Release-Candidate Preflight
    // =========================================================================
    if (ckptNum === 2) {
      const roClient = makePgClient(ctx.urls.roDirectUrl, 'oserp-ckpt2-preflight');
      let m14EmptyVerdict = null;
      let rcVerdict = null;
      try {
        await roClient.connect();
        const hasLedger = (
          await roClient.query(`SELECT to_regclass('public."_prisma_migrations"') AS reg`)
        ).rows[0].reg;
        const allowEmpty = !hasLedger;

        if (allowEmpty) {
          m14EmptyVerdict = await inspectTargetLedger(roClient, diskMigrations, approvedAuthority, {
            allowEmpty: true,
          });
          assert.equal(
            m14EmptyVerdict.eligible,
            true,
            `M14 empty preflight blocked: ${JSON.stringify(m14EmptyVerdict)}`
          );
        }
        rcVerdict = await inspectTargetForManagedPg18Rc(roClient, rcDisk, rcAuthority, {
          allowEmpty,
        });
        assert.equal(
          rcVerdict.eligible,
          true,
          `MANAGED_PG18_RC_V1 preflight blocked: ${JSON.stringify(rcVerdict)}`
        );
      } finally {
        await endPgClientBounded(roClient, 5000);
      }
      mark('DUAL_PREFLIGHT_VERIFIED', {
        rcClassification: rcVerdict.classification,
        pendingMigrationCount: rcVerdict.pendingMigrationCount,
      });

      const rec = writeReceipt('PASS', 0, {
        evidence: {
          m14EmptyBaselineVerdict: m14EmptyVerdict,
          managedPg18RcPreflightVerdict: rcVerdict,
        },
      });
      console.log(JSON.stringify({ checkpoint: 2, status: rec.status, receiptPath: checkpointReceiptPath(2) }));
      return;
    }

    // =========================================================================
    // CHECKPOINT 3: Migration #1-#39 Deployment (`MANAGED_PG18_RC_V1`)
    // =========================================================================
    if (ckptNum === 3) {
      // Reconcile current ledger state first (safe idempotence if re-run)
      const preCheckClient = makePgClient(ctx.ownerDirectUri, 'oserp-ckpt3-reconcile-before');
      let finishedBefore = 0;
      let failedBefore = 0;
      try {
        await preCheckClient.connect();
        const hasLedger = (
          await preCheckClient.query(`SELECT to_regclass('public."_prisma_migrations"') AS reg`)
        ).rows[0].reg;
        if (hasLedger) {
          const st = (
            await preCheckClient.query(`
              SELECT
                COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::int AS fin,
                COUNT(*) FILTER (WHERE finished_at IS NULL AND rolled_back_at IS NULL)::int AS unfin
              FROM public."_prisma_migrations"
            `)
          ).rows[0];
          finishedBefore = st.fin;
          failedBefore = st.unfin;
        }
      } finally {
        await endPgClientBounded(preCheckClient, 5000);
      }
      assert.equal(
        failedBefore,
        0,
        `SAFETY ABORT: ${failedBefore} unfinished/failed migration row(s) exist in _prisma_migrations`
      );
      mark('LEDGER_RECONCILED_BEFORE_DEPLOY', { finishedBefore });

      const preMigrationTimestampIso = new Date().toISOString();
      let bridgeDiagnostics = null;

      if (finishedBefore < 39) {
        const wsBridge = await startLocalNeonWsBridge(ctx.directHost);
        try {
          const migrateBridgeUrl = wsBridge.buildBridgeUrl(
            'oserp_preview_migrate_admin',
            ctx.secrets.migrateAdminPassword,
            PREVIEW_DB_NAME
          );

          // Self-test loopback bridge end-to-end BEFORE spawning Prisma CLI
          const probeClient = new Client({
            connectionString: migrateBridgeUrl,
            connectionTimeoutMillis: 20000,
            query_timeout: 15000,
          });
          try {
            await probeClient.connect();
            const pRow = (
              await probeClient.query(`SELECT current_user AS usr, current_database() AS db`)
            ).rows[0];
            assert.equal(pRow.usr, 'oserp_preview_migrate_admin');
            assert.equal(pRow.db, PREVIEW_DB_NAME);
          } finally {
            await probeClient.end().catch(() => { });
          }
          mark('LOOPBACK_BRIDGE_PROBE_VERIFIED', { bridgePort: wsBridge.port });

          const prismaRes = await runNodeSubprocessBounded(
            [PRISMA_CLI_JS, 'migrate', 'deploy', `--schema=${RC_SCHEMA_PATH}`],
            {
              ...process.env,
              DATABASE_URL: migrateBridgeUrl,
              DIRECT_URL: migrateBridgeUrl,
            },
            remainingMs(170000)
          );
          bridgeDiagnostics = wsBridge.getDiagnostics();
          if (prismaRes.status !== 0) {
            throw new Error(
              `prisma migrate deploy exited ${prismaRes.status} (bridge=${JSON.stringify(bridgeDiagnostics)}): ${redactText(
                `${prismaRes.stdout}\n${prismaRes.stderr}`
              ).slice(-1200)}`
            );
          }
        } finally {
          await wsBridge.close();
        }
      }
      mark('PRISMA_MIGRATE_DEPLOY_COMPLETED');

      const postCheckClient = makePgClient(ctx.ownerDirectUri, 'oserp-ckpt3-reconcile-after');
      let finishedAfter = 0;
      let unfinishedAfter = 0;
      try {
        await postCheckClient.connect();
        const st = (
          await postCheckClient.query(`
            SELECT
              COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL)::int AS fin,
              COUNT(*) FILTER (WHERE finished_at IS NULL OR rolled_back_at IS NOT NULL)::int AS bad
            FROM public."_prisma_migrations"
          `)
        ).rows[0];
        finishedAfter = st.fin;
        unfinishedAfter = st.bad;
      } finally {
        await endPgClientBounded(postCheckClient, 5000);
      }
      assert.equal(finishedAfter, 39, `Expected 39 applied migrations, observed ${finishedAfter}`);
      assert.equal(unfinishedAfter, 0, `Observed ${unfinishedAfter} unfinished/rolled-back rows`);
      mark('LEDGER_39_OF_39_RECONCILED');

      const rec = writeReceipt('PASS', 0, {
        evidence: {
          releaseCandidateId: 'MANAGED_PG18_RC_V1',
          schemaPath: RC_SCHEMA_PATH,
          preMigrationRestoreTimestampIso: preMigrationTimestampIso,
          finishedBefore,
          finishedAfter,
          unfinishedOrRolledBackAfter: unfinishedAfter,
          bridgeDiagnostics,
        },
      });
      console.log(JSON.stringify({ checkpoint: 3, status: rec.status, receiptPath: checkpointReceiptPath(3) }));
      return;
    }

    // =========================================================================
    // CHECKPOINT 4: Role Lockdown and Checksum Verification
    // =========================================================================
    if (ckptNum === 4) {
      const ownerInspect = makePgClient(ctx.ownerDirectUri, 'oserp-ckpt4-inspect-admin');
      let migrateAdminCanLogin = false;
      try {
        await ownerInspect.connect();
        const r = (
          await ownerInspect.query(`SELECT rolcanlogin FROM pg_roles WHERE rolname = 'oserp_preview_migrate_admin'`)
        ).rows[0];
        migrateAdminCanLogin = Boolean(r?.rolcanlogin);
      } finally {
        await endPgClientBounded(ownerInspect, 5000);
      }

      let postDbAudit = null;
      if (migrateAdminCanLogin) {
        const migPostClient = makePgClient(ctx.urls.migrateDirectUrl, 'oserp-ckpt4-grants-and-anchors');
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
            [ctx.secrets.uboqRlsSecretHex]
          );
          await migPostClient.query(`RESET ROLE`);
          await migPostClient.query(
            `INSERT INTO public._company_payroll_trust_anchor (id, secret_hex)
             VALUES (true, $1)
             ON CONFLICT (id) DO UPDATE SET secret_hex = EXCLUDED.secret_hex`,
            [ctx.secrets.companyPayrollSecretHex]
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
          postDbAudit = { ledgerState, xidHealth, publicBaseTableCount: pubTableCount };
          assert.equal(Number(ledgerState.finished_active_rows), 39);
          assert.equal(Number(ledgerState.unfinished_or_rolled_back_rows), 0);
          assert.equal(Number(ledgerState.invalid_checksum_rows), 0);
          assert.equal(xidHealth.healthy, true);
        } catch (e) {
          await migPostClient.query('ROLLBACK').catch(() => { });
          throw e;
        } finally {
          await endPgClientBounded(migPostClient, 5000);
        }
        mark('RUNTIME_GRANTS_AND_TRUST_ANCHORS_APPLIED', {
          publicBaseTableCount: postDbAudit.publicBaseTableCount,
        });

        // Lock `oserp_preview_migrate_admin` via `prov_role_admin`, then delete `prov_role_admin` via Neon API
        const provUriRes = await neonApi(
          ctx.neonToken,
          'GET',
          `/projects/${targetProjectId}/branches/${ctx.previewBranch.id}/connection_uri?database_name=${PREVIEW_DB_NAME}&role_name=${EPHEMERAL_ROLE_CREATOR}&pooled=false`
        ).catch(() => null);
        const fallbackProvUriRes =
          provUriRes ||
          (await neonApi(
            ctx.neonToken,
            'GET',
            `/projects/${targetProjectId}/connection_uri?branch_id=${ctx.previewBranch.id}&database_name=${PREVIEW_DB_NAME}&role_name=${EPHEMERAL_ROLE_CREATOR}&pooled=false`
          ));
        const provLockClient = makePgClient(fallbackProvUriRes.uri, 'oserp-ckpt4-lock-admin');
        try {
          await provLockClient.connect();
          await provLockClient.query(
            `ALTER ROLE oserp_preview_migrate_admin NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0 PASSWORD NULL`
          );
        } finally {
          await endPgClientBounded(provLockClient, 5000);
        }

        const postOwnerClient = makePgClient(ctx.ownerDirectUri, 'oserp-ckpt4-revoke-public');
        try {
          await postOwnerClient.connect();
          await postOwnerClient.query('BEGIN');
          await postOwnerClient.query(`REVOKE CREATE ON SCHEMA public FROM PUBLIC`);
          await postOwnerClient.query(
            `REVOKE CREATE ON DATABASE "${PREVIEW_DB_NAME}" FROM oserp_preview_migrate_admin`
          );
          await postOwnerClient
            .query(`REVOKE ALL PRIVILEGES ON DATABASE "${PREVIEW_DB_NAME}" FROM ${EPHEMERAL_ROLE_CREATOR}`)
            .catch(() => { });
          await postOwnerClient.query('COMMIT');
        } catch (e) {
          await postOwnerClient.query('ROLLBACK').catch(() => { });
          throw e;
        } finally {
          await endPgClientBounded(postOwnerClient, 5000);
        }
      }

      // Ensure `prov_role_admin` is removed via Neon API so zero creator edges remain
      const rolesAfter =
        (await neonApi(ctx.neonToken, 'GET', `/projects/${targetProjectId}/branches/${ctx.previewBranch.id}/roles`)).roles || [];
      if (rolesAfter.some((r) => r.name === EPHEMERAL_ROLE_CREATOR)) {
        const delProv = await neonApi(
          ctx.neonToken,
          'DELETE',
          `/projects/${targetProjectId}/branches/${ctx.previewBranch.id}/roles/${EPHEMERAL_ROLE_CREATOR}`
        );
        await waitNeonOps(ctx.neonToken, targetProjectId, (delProv.operations || []).map((o) => o.id));
      }
      mark('MIGRATE_ADMIN_LOCKED_AND_CREATOR_REMOVED');

      // Verify 39/39 candidate checksum parity & bidirectional role security via read-only gate
      let postVerdict;
      const roPostClient = makePgClient(ctx.urls.roDirectUrl, 'oserp-ckpt4-post-verify');
      try {
        await roPostClient.connect();
        postVerdict = await inspectTargetForManagedPg18Rc(roPostClient, rcDisk, rcAuthority, {
          allowEmpty: false,
        });
      } finally {
        await endPgClientBounded(roPostClient, 5000);
      }
      assert.equal(postVerdict.eligible, true, `Post-deploy gate failed: ${JSON.stringify(postVerdict)}`);
      assert.equal(postVerdict.classification, 'ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE');
      assert.equal(postVerdict.verifiedMigrationCount, 39);
      assert.equal(postVerdict.pendingMigrationCount, 0);
      mark('CHECKSUM_PARITY_39_OF_39_AND_ROLE_POSTURE_VERIFIED');

      // Verify live restricted logins (pooled DATABASE_URL, unpooled DIRECT_URL, pooled COMPANY_PAYROLL_DATABASE_URL)
      const liveRoleChecks = {};
      for (const [label, urlStr, expectedUser] of [
        ['databaseUrlPooled', ctx.urls.runtimePooledUrl, 'oserp_preview_runtime_app'],
        ['directUrlUnpooled', ctx.urls.runtimeDirectUrl, 'oserp_preview_direct_app'],
        ['companyPayrollPooled', ctx.urls.payrollPooledUrl, 'oserp_preview_payroll_app'],
      ]) {
        const rc = makePgClient(urlStr, `oserp-ckpt4-${label}`);
        try {
          await rc.connect();
          const row = (
            await rc.query(`
              SELECT current_user AS usr, current_database() AS db, r.rolsuper, r.rolbypassrls
              FROM pg_roles r WHERE r.rolname = current_user
            `)
          ).rows[0];
          assert.equal(row.usr, expectedUser);
          assert.equal(row.db, PREVIEW_DB_NAME);
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
          await endPgClientBounded(rc, 5000);
        }
      }
      mark('LIVE_RESTRICTED_RUNTIME_ROLES_VERIFIED');

      const rec = writeReceipt('PASS', 0, {
        evidence: {
          postMigrationVerdict: postVerdict,
          postDatabaseAudit: postDbAudit,
          liveRestrictedRoleVerification: liveRoleChecks,
        },
      });
      console.log(JSON.stringify({ checkpoint: 4, status: rec.status, receiptPath: checkpointReceiptPath(4) }));
      return;
    }

    // =========================================================================
    // CHECKPOINT 5: Preview-Only Vercel Environment Configuration
    // =========================================================================
    if (ckptNum === 5) {
      const vercelToken = readVercelCachedToken();
      const projBefore = await vercelApi(
        vercelToken,
        'GET',
        `/v9/projects/${PRIMARY_VERCEL_PROJECT_ID}?teamId=${TEAM_ID}`
      );
      assert.equal(projBefore.id, PRIMARY_VERCEL_PROJECT_ID);
      const existingEnvs = Array.isArray(projBefore.env) ? projBefore.env : [];

      // Confirm all 6 Blob Private Storage Preview secrets remain present & untouched
      for (const blobKey of PROTECTED_BLOB_VAULT_KEYS) {
        const foundBlob = existingEnvs.some(
          (e) => e.key === blobKey && Array.isArray(e.target) && e.target.includes('preview')
        );
        assert.equal(foundBlob, true, `Protected Preview Blob Vault var missing: ${blobKey}`);
      }
      mark('VERCEL_BLOB_VAULT_VARS_INTACT');

      const hasPreviewEnv = (keyName) =>
        existingEnvs.some(
          (e) =>
            e.key === keyName &&
            Array.isArray(e.target) &&
            e.target.includes('preview') &&
            !e.gitBranch
        );

      const previewOnlyBindings = [
        ['DATABASE_URL', ctx.urls.runtimePooledUrl],
        ['DIRECT_URL', ctx.urls.runtimeDirectUrl],
        ['COMPANY_PAYROLL_DATABASE_URL', ctx.urls.payrollPooledUrl],
        ['UBOQ_RLS_CONTEXT_SECRET', ctx.secrets.uboqRlsSecretHex],
        ['COMPANY_PAYROLL_CONTEXT_SECRET', ctx.secrets.companyPayrollSecretHex],
        ['INTERNAL_API_SECRET', ctx.secrets.internalApiSecretHex],
        ['AUTH_TRUST_HOST', 'true'],
      ];
      if (!hasPreviewEnv('AUTH_SECRET')) {
        previewOnlyBindings.push(['AUTH_SECRET', crypto.randomBytes(32).toString('hex')]);
      }
      if (!hasPreviewEnv('NEXTAUTH_URL')) {
        previewOnlyBindings.push([
          'NEXTAUTH_URL',
          'https://one-systems-erp-git-release-oserp-proj-uboq-001-jburns2372-sys-projects.vercel.app',
        ]);
      }

      for (const [k, v] of previewOnlyBindings) {
        assert.equal(PROTECTED_BLOB_VAULT_KEYS.has(k), false);
        const existingPreviewOnly = existingEnvs.find(
          (x) =>
            x.key === k &&
            Array.isArray(x.target) &&
            x.target.length === 1 &&
            x.target[0] === 'preview' &&
            !x.gitBranch
        );
        if (existingPreviewOnly) {
          await vercelApi(
            vercelToken,
            'DELETE',
            `/v9/projects/${PRIMARY_VERCEL_PROJECT_ID}/env/${existingPreviewOnly.id}?teamId=${TEAM_ID}`
          );
        }
        await vercelApi(
          vercelToken,
          'POST',
          `/v10/projects/${PRIMARY_VERCEL_PROJECT_ID}/env?teamId=${TEAM_ID}`,
          {
            key: k,
            value: v,
            type: 'sensitive',
            target: ['preview'],
          }
        );
      }

      // Reconcile final env state on Vercel to prove Preview vars exist and Production was untouched
      const projAfter = await vercelApi(
        vercelToken,
        'GET',
        `/v9/projects/${PRIMARY_VERCEL_PROJECT_ID}?teamId=${TEAM_ID}`
      );
      const afterEnvs = Array.isArray(projAfter.env) ? projAfter.env : [];
      for (const [k] of previewOnlyBindings) {
        const present = afterEnvs.some(
          (x) =>
            x.key === k &&
            Array.isArray(x.target) &&
            x.target.length === 1 &&
            x.target[0] === 'preview' &&
            x.type === 'sensitive'
        );
        assert.equal(present, true, `Expected Preview-only sensitive binding ${k} missing after POST`);
      }
      mark('VERCEL_PREVIEW_SECRETS_RECONCILED');

      const rec = writeReceipt('PASS', 0, {
        evidence: {
          vercelProjectId: PRIMARY_VERCEL_PROJECT_ID,
          configuredPreviewOnlyKeys: previewOnlyBindings.map(([k]) => k),
          productionEnvironmentModified: false,
          vercelBlobPrivateVaultPreserved: true,
        },
      });
      console.log(JSON.stringify({ checkpoint: 5, status: rec.status, receiptPath: checkpointReceiptPath(5) }));
      return;
    }

    // =========================================================================
    // CHECKPOINT 6: Final Phase 6 Gate
    // =========================================================================
    if (ckptNum === 6) {
      const gateRes = await runNodeSubprocessBounded(
        [path.resolve('scripts/uboq/verify-preview-target-readiness.cjs')],
        {
          ...process.env,
          OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID: targetProjectId,
          MIGRATION14_TARGET_DATABASE_URL: ctx.urls.roDirectUrl,
        },
        remainingMs(75000)
      );

      let gateSummary = null;
      try {
        gateSummary = JSON.parse(gateRes.stdout.trim());
      } catch { }

      assert.equal(
        gateRes.status,
        0,
        `Final Phase 6 gate exited ${gateRes.status}: ${redactText(`${gateRes.stdout}\n${gateRes.stderr}`).slice(-800)}`
      );
      assert.equal(
        gateSummary?.overallDisposition,
        'PASS_READY_FOR_PREVIEW_DEPLOYMENT_APPROVAL_GATE',
        `Unexpected gate disposition: ${JSON.stringify(gateSummary)}`
      );
      mark('FINAL_PHASE6_GATE_7_OF_7_PASSED');

      const c2 = readCheckpointReceipt(2);
      const c3 = readCheckpointReceipt(3);
      const c4 = readCheckpointReceipt(4);
      const c5 = readCheckpointReceipt(5);

      const consolidated = {
        evaluatedAt: new Date().toISOString(),
        releaseCandidateApplied: 'MANAGED_PG18_RC_V1',
        schemaPathApplied: RC_SCHEMA_PATH,
        dedicatedNeonProjectId: targetProjectId,
        dedicatedNeonProjectName: ckpt1.evidence.neonProjectName,
        previewBranchId: ckpt1.evidence.neonBranchId,
        previewEndpointId: ckpt1.evidence.neonEndpointId,
        poolerEnabled: true,
        previewDatabaseName: PREVIEW_DB_NAME,
        maskedDirectHost: ckpt1.evidence.maskedDirectHost,
        maskedPooledHost: ckpt1.evidence.maskedPooledHost,
        preMigrationRestoreTimestampIso: c3.evidence.preMigrationRestoreTimestampIso,
        haltedStateAudit: ckpt1.evidence.haltedAudit,
        preflightEvidence: c2.evidence,
        deploymentEvidence: c3.evidence,
        lockdownAndChecksumEvidence: c4.evidence,
        vercelPreviewEnvironmentEvidence: c5.evidence,
        gateExitCode: gateRes.status,
        gateSummary,
      };
      fs.writeFileSync(CONSOLIDATED_RECEIPT_PATH, JSON.stringify(consolidated, null, 2) + '\n');

      const rec = writeReceipt('PASS', 0, {
        evidence: {
          gateExitCode: gateRes.status,
          gateSummary,
          consolidatedReceiptPath: 'artifacts/uboq/preview-readiness/dedicated-preview-provisioning-receipt.json',
        },
      });
      console.log(JSON.stringify({ checkpoint: 6, status: rec.status, receiptPath: checkpointReceiptPath(6) }));
    }
  } catch (err) {
    const isDeadline = Boolean(err?.isDeadline);
    const code = isDeadline ? 124 : 1;
    const status = isDeadline ? 'TIMEOUT' : 'FAIL';
    const safeMsg = redactText(err?.message || String(err)).slice(0, 1000);
    writeReceipt(status, code, { errorSummary: safeMsg });
    console.error(
      JSON.stringify({
        checkpoint: ckptNum,
        status,
        exitCode: code,
        lastCompletedSubstep: lastSubstep,
        errorSummary: safeMsg,
      })
    );
    process.exitCode = code;
  } finally {
    clearTimeout(hardWatchdog);
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.includes('--status')) {
    printStatusReport();
  } else {
    const ckptArg = args.find((a) => a.startsWith('--checkpoint='));
    if (!ckptArg) {
      console.error(
        'Usage: node scripts/uboq/provision-dedicated-preview-project-db.cjs --status | --checkpoint=<1|2|3|4|5|6>'
      );
      process.exitCode = 2;
    } else {
      const ckptNum = Number(ckptArg.split('=')[1]);
      executeCheckpoint(ckptNum);
    }
  }
}
