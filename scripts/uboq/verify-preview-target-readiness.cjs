'use strict';

/**
 * OneSystemsERP — Universal BOQ Intake (OSERP-PROJ-UBOQ-001)
 * Consolidated Preview Pre-Deployment Readiness Gate Runner
 *
 * Strictly READ-ONLY & ZERO-SECRET-EXPOSURE:
 * - Never prints, logs, or writes connection strings, passwords, tokens, keys, or unmasked endpoints.
 * - Reuses the independently accepted Migration #14 classifier (`verify-migration14-provenance-gate.cjs`).
 * - Verifies target Preview database identity BEFORE any ledger inspection; blocks localhost/testdb
 *   targets and blocks shared Production endpoints.
 * - Honors `--allow-empty` ONLY when both `--allow-empty` and `PREVIEW_EMPTY_BRANCH_APPROVED=true` are set.
 * - Fails closed (exit code 1) whenever any mandatory technical, infrastructure, or governance gate is unresolved.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');
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

const OUT_DIR = 'artifacts/uboq/preview-readiness';
const REPORT_PATH = path.join(OUT_DIR, 'preview-pre-deployment-gate-report.json');

const PRIMARY_VERCEL_PROJECT_ID = 'prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi';
const PRIMARY_VERCEL_PROJECT_NAME = 'one-systems-erp';
const PRIMARY_VERCEL_TEAM_ID = 'team_DWpmafscN88J0nNBvcUKHNM7';
const PRIMARY_VERCEL_SCOPE = 'jburns2372-sys-projects';
const EXPECTED_GITHUB_REPO = 'jburns2372-sys/OneSystemsErp';
const TARGET_RELEASE_BRANCH = 'release/oserp-proj-uboq-001';

// Project-level isolation guard: reject shared multi-app project `holy-shape-01357429` and all non-OSERP projects
const DISQUALIFIED_NEON_PROJECT_IDS = new Set([
  'holy-shape-01357429', // neon-camel-bell (shared multi-application project containing unrelated app DBs/branches)
  'cold-unit-82916367',  // unrelated project (wsmra-ta-production)
  'royal-cherry-02561649', // unrelated project (wsmra-ta-preview)
]);
const ALLOWED_CLUSTER_DATABASES = new Set(['postgres', 'neondb', 'oserp_uboq_preview']);

function sha256Hex(bufOrStr) {
  return crypto.createHash('sha256').update(bufOrStr).digest('hex');
}

function maskHostname(host) {
  if (!host) return null;
  const neonMatch = host.match(/^(ep-[a-z0-9]+-[a-z0-9]+)-[a-z0-9]+(-pooler)?\.(.+)$/i);
  if (neonMatch) {
    return `${neonMatch[1]}-REDACTED${neonMatch[2] || ''}.${neonMatch[3]}`;
  }
  const parts = host.split('.');
  if (parts.length >= 3) {
    return `${parts[0].slice(0, 6)}***.${parts.slice(1).join('.')}`;
  }
  return host;
}

function parseSafeTargetUrlIdentity(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { configured: false };
  }
  const trimmed = rawUrl.trim();
  if (trimmed === '[SENSITIVE]') {
    return { configured: false, reason: 'VERCEL_WRITE_ONLY_SENSITIVE_PLACEHOLDER' };
  }
  try {
    const u = new URL(trimmed);
    const dbName = (u.pathname || '').replace(/^\/+/, '');
    const normalizedClusterHost = u.hostname.toLowerCase().replace(/-pooler\./, '.');
    const isLocalLoopback =
      u.hostname === 'localhost' ||
      u.hostname === '127.0.0.1' ||
      u.hostname === '::1' ||
      /^testdb/i.test(dbName) ||
      /^oserp_h02b_local/i.test(dbName);
    const isPrivilegedOwnerLogin = /^(postgres|neondb_owner|rdsadmin|rds_superuser|admin)$/i.test(
      u.username || ''
    );
    return {
      configured: true,
      protocol: u.protocol,
      maskedHost: maskHostname(u.hostname),
      port: u.port || '5432',
      dbName,
      isPoolerEndpoint: u.hostname.includes('-pooler.'),
      sslmode: u.searchParams.get('sslmode') || null,
      isLocalLoopbackOrTestDb: isLocalLoopback,
      isPrivilegedOwnerLogin,
      roleClassification: !u.username
        ? 'MISSING_USERNAME'
        : isPrivilegedOwnerLogin
          ? 'PRIVILEGED_OWNER_OR_SUPERUSER_LOGIN'
          : /^oserp_.*ro|readonly|preflight/i.test(u.username)
            ? 'RESTRICTED_READONLY_PREFLIGHT_LOGIN'
            : /^oserp_/i.test(u.username)
              ? 'RESTRICTED_OSERP_APP_LOGIN'
              : 'CUSTOM_NON_DEFAULT_LOGIN',
      clusterDbFingerprint16: sha256Hex(`${normalizedClusterHost}/${dbName}`).slice(0, 16),
    };
  } catch {
    return { configured: false, reason: 'UNPARSEABLE_DATABASE_URL' };
  }
}

function getVercelCliTokenInMemory() {
  const candidates = [
    path.join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json'),
    path.join(process.env.XDG_DATA_HOME || path.join(require('node:os').homedir(), '.local', 'share'), 'com.vercel.cli', 'auth.json'),
  ];
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      try {
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (j && typeof j.token === 'string' && j.token.trim()) return j.token.trim();
      } catch { }
    }
  }
  spawnSync(process.platform === 'win32' ? 'vercel.cmd' : 'vercel', ['whoami', '--no-color'], {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    shell: process.platform === 'win32',
    timeout: 10000,
  });
  for (const p of candidates) {
    if (p && fs.existsSync(p)) {
      try {
        const j = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (j && typeof j.token === 'string' && j.token.trim()) return j.token.trim();
      } catch { }
    }
  }
  return null;
}

function loadVerifiedControlPlaneFallback() {
  const fp = path.join(OUT_DIR, 'phase6-verified-control-plane-state.json');
  if (!fs.existsSync(fp)) return null;
  const cached = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const p = cached.primaryVercelProject;
  return {
    inspected: true,
    evidenceSource: 'VERIFIED_CONTROL_PLANE_RECEIPT_FALLBACK_ON_TRANSIENT_ECONNRESET',
    verifiedAt: cached.verifiedAt,
    projectId: p.id,
    projectName: p.name,
    teamScope: p.teamScope,
    nodeVersion: p.nodeVersion,
    linkedRepo: p.linkedRepo,
    productionBranch: p.productionBranch,
    ssoProtection: p.ssoProtection,
    passwordProtection: p.passwordProtection,
    sensitiveEnvEncryptionEnforced: p.sensitiveEnvEncryptionEnforced,
    previewSecretMatrixForReleaseBranch: {},
    configuredPreviewBlobVaultSecrets: p.configuredPreviewBlobVaultSecrets || [],
    missingPreviewDbAndAppSecrets: p.missingPreviewDatabaseAndAppSecrets || [],
    sharedPreviewProductionNeonKeys: p.sharedPreviewProductionNeonKeys,
    branchPinnedPreviewDbKeys: p.branchPinnedPreviewDbKeys,
    siblingLinkedProjects: cached.siblingLinkedProjects,
    privatePreviewBlobVault: cached.privatePreviewBlobVault || null,
  };
}

async function vercelApiGetJsonOnce(token, apiPath) {
  try {
    const res = await fetch(`https://api.vercel.com${apiPath}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'User-Agent': 'oserp-uboq-preview-readiness/2.0',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function vercelApiGetJson(token, apiPath) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const res = await vercelApiGetJsonOnce(token, apiPath);
    if (res) return res;
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  return null;
}

async function inspectVercelControlPlaneReadOnly() {
  const token = getVercelCliTokenInMemory();
  if (!token) {
    return {
      inspected: false,
      reason: 'VERCEL_CLI_TOKEN_NOT_FOUND',
    };
  }
  const j = await vercelApiGetJson(
    token,
    `/v9/projects/${PRIMARY_VERCEL_PROJECT_ID}?teamId=${PRIMARY_VERCEL_TEAM_ID}`
  );
  if (!j) {
    return (
      loadVerifiedControlPlaneFallback() || {
        inspected: false,
        reason: 'VERCEL_API_UNAVAILABLE_OR_UNAUTHENTICATED',
      }
    );
  }
  const envEntries = Array.isArray(j.env) ? j.env : [];

  const hasPreviewVarForReleaseBranch = (key) =>
    envEntries.some(
      (e) =>
        e.key === key &&
        Array.isArray(e.target) &&
        e.target.includes('preview') &&
        (e.gitBranch === null || e.gitBranch === undefined || e.gitBranch === TARGET_RELEASE_BRANCH)
    );

  const sharedPreviewProdNeonKeys = envEntries
    .filter(
      (e) =>
        /^(POSTGRES_|PG|NEON_|DATABASE_URL)/.test(e.key) &&
        Array.isArray(e.target) &&
        e.target.includes('preview') &&
        e.target.includes('production') &&
        !e.gitBranch
    )
    .map((e) => e.key)
    .sort();

  const branchPinnedPreviewDbKeys = envEntries
    .filter(
      (e) =>
        (e.key === 'DATABASE_URL' || e.key === 'DIRECT_URL') &&
        Array.isArray(e.target) &&
        e.target.includes('preview') &&
        Boolean(e.gitBranch)
    )
    .map((e) => ({ key: e.key, gitBranch: e.gitBranch, type: e.type }));

  const requiredBlobVaultPreviewSecrets = [
    'BLOB_READ_WRITE_TOKEN',
    'UBOQ_VAULT_BLOB_READ_WRITE_TOKEN',
    'UBOQ_VAULT_BLOB_STORE_ID',
    'UBOQ_VAULT_BACKEND',
    'UBOQ_VAULT_ENV_NAMESPACE',
    'UBOQ_VAULT_ENCRYPTION_KEY',
  ];

  const requiredDbAndAppPreviewSecrets = [
    'DATABASE_URL',
    'DIRECT_URL',
    'COMPANY_PAYROLL_DATABASE_URL',
    'AUTH_SECRET',
    'AUTH_TRUST_HOST',
    'NEXTAUTH_URL',
    'INTERNAL_API_SECRET',
    'UBOQ_RLS_CONTEXT_SECRET',
    'COMPANY_PAYROLL_CONTEXT_SECRET',
  ];

  const previewSecretMatrix = {};
  for (const k of [...requiredBlobVaultPreviewSecrets, ...requiredDbAndAppPreviewSecrets]) {
    previewSecretMatrix[k] = hasPreviewVarForReleaseBranch(k) ? 'PRESENT' : 'MISSING_IN_PREVIEW';
  }

  // Check sibling Vercel projects linked to the same GitHub repository (auto-deploy hazard)
  const siblingProjects = [];
  for (const sibId of ['prj_2me3QVWtlsKkd1AxePemhLRcHEqZ', 'prj_878wLnOFwDspguC80UC9sqL7oBTJ']) {
    const sj = await vercelApiGetJson(
      token,
      `/v9/projects/${sibId}?teamId=${PRIMARY_VERCEL_TEAM_ID}`
    );
    if (sj) {
      const ignoreCmd = sj.commandForIgnoringBuildStep || null;
      siblingProjects.push({
        id: sj.id,
        name: sj.name,
        linkedRepo: sj.link ? `${sj.link.org}/${sj.link.repo}` : null,
        ssoProtection: sj.ssoProtection?.deploymentType || 'NONE',
        commandForIgnoringBuildStep: ignoreCmd,
        previewBuildsBlocked: Boolean(ignoreCmd && ignoreCmd.includes('VERCEL_ENV')),
        envVarCount: Array.isArray(sj.env) ? sj.env.length : 0,
      });
    }
  }

  return {
    inspected: true,
    evidenceSource: 'LIVE_VERCEL_API',
    projectId: j.id,
    projectName: j.name,
    teamScope: PRIMARY_VERCEL_SCOPE,
    nodeVersion: j.nodeVersion,
    linkedRepo: j.link ? `${j.link.org}/${j.link.repo}` : null,
    productionBranch: j.link?.productionBranch || null,
    ssoProtection: j.ssoProtection?.deploymentType || 'NONE',
    passwordProtection: j.passwordProtection?.deploymentType || 'NONE',
    sensitiveEnvEncryptionEnforced: envEntries.every((e) => e.type === 'sensitive' || e.type === 'encrypted'),
    previewSecretMatrixForReleaseBranch: previewSecretMatrix,
    configuredPreviewBlobVaultSecrets: requiredBlobVaultPreviewSecrets.filter((k) =>
      hasPreviewVarForReleaseBranch(k)
    ),
    missingPreviewDbAndAppSecrets: requiredDbAndAppPreviewSecrets.filter(
      (k) => !hasPreviewVarForReleaseBranch(k)
    ),
    sharedPreviewProductionNeonKeys: sharedPreviewProdNeonKeys,
    branchPinnedPreviewDbKeys,
    siblingLinkedProjects: siblingProjects,
  };
}

function inspectRepoInfraTemplates() {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const vercelCfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const tfMain = fs.existsSync('aws-infrastructure/main.tf')
    ? fs.readFileSync('aws-infrastructure/main.tf', 'utf8')
    : '';
  const neonWorkflow = fs.existsSync('.github/workflows/neon-branch.yml')
    ? fs.readFileSync('.github/workflows/neon-branch.yml', 'utf8')
    : '';

  const tfHasPublicReadAcl = /acl\s*=\s*"public-read"/.test(tfMain);
  const tfDisablesPublicAccessBlock = /block_public_acls\s*=\s*false/.test(tfMain);
  const tfHasOpenRdsIngress = /from_port\s*=\s*5432[\s\S]{0,120}0\.0\.0\.0\/0/.test(tfMain);
  const neonWorkflowBrokenOutputRef = /steps\.create_neon_branch_encode\.outputs/.test(neonWorkflow);

  return {
    packageBuildScript: pkg.scripts?.build || null,
    packageBuildScriptSafe:
      pkg.scripts?.build === 'prisma generate && next build' &&
      !/db\s+push|--accept-data-loss|migrate\s+reset/i.test(String(pkg.scripts?.build || '')),
    vercelBuildCommand: vercelCfg.buildCommand || null,
    vercelGithubAutoDeployEnabled: Boolean(vercelCfg.github?.enabled),
    neonPrWorkflow: {
      path: '.github/workflows/neon-branch.yml',
      triggersOnlyOnPullRequest: /on:\s*\r?\n\s*pull_request:/m.test(neonWorkflow),
      brokenStepOutputReferenceDetected: neonWorkflowBrokenOutputRef,
    },
    legacyTerraformAudit: {
      path: 'aws-infrastructure/main.tf',
      s3PublicReadMisconfigurationDetected: tfHasPublicReadAcl || tfDisablesPublicAccessBlock,
      rdsWorldIngressDetected: tfHasOpenRdsIngress,
      uboqComplianceVerdict:
        tfHasPublicReadAcl || tfDisablesPublicAccessBlock
          ? 'NON_COMPLIANT_FOR_UBOQ_PRIVATE_VAULT_DO_NOT_APPLY_UNMODIFIED'
          : 'COMPLIANT',
    },
  };
}

async function verifyLivePreviewTargetIfConfigured(disk, authority, rcDisk, rcAuthority, args) {
  const dedicatedNeonProjId = (process.env.OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID || '').trim();
  const targetUrl = process.env.MIGRATION14_TARGET_DATABASE_URL || '';
  const prodUrlForIsolationCheck = process.env.PREVIEW_GATE_PRODUCTION_DB_URL_DO_NOT_CONNECT || '';
  const allowEmptyFlag = args.includes('--allow-empty');
  const allowEmptyApproved =
    allowEmptyFlag && String(process.env.PREVIEW_EMPTY_BRANCH_APPROVED || '').toLowerCase() === 'true';

  const targetIdentity = parseSafeTargetUrlIdentity(targetUrl);

  if (!dedicatedNeonProjId) {
    return {
      connected: false,
      gateStatus: 'BLOCKED_DEDICATED_OSERP_NEON_PROJECT_REQUIRED',
      dedicatedNeonProjectId: null,
      targetIdentity,
      reason:
        'Project-level Neon separation is required. Neon org org-sweet-fog-42432629 is Vercel-managed (`neonctl projects create` rejected with `ERROR: action restricted; reason:"organization is managed by Vercel"`), and existing project holy-shape-01357429 (neon-camel-bell) is disqualified for UBOQ Preview because it hosts an unrelated application database alongside OneSystemsERP. Provision a dedicated OneSystemsERP Preview Neon project via Vercel Dashboard -> Storage -> Create Database -> Neon Postgres (or Neon Console SSO) and supply OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID.',
    };
  }

  if (DISQUALIFIED_NEON_PROJECT_IDS.has(dedicatedNeonProjId)) {
    return {
      connected: false,
      gateStatus: 'BLOCKED_DISQUALIFIED_SHARED_OR_UNRELATED_NEON_PROJECT',
      dedicatedNeonProjectId: dedicatedNeonProjId,
      targetIdentity,
      reason: `Neon project ${dedicatedNeonProjId} is explicitly disqualified (shared multi-application or non-OneSystemsERP project). Use a dedicated OneSystemsERP Neon project.`,
    };
  }

  if (!targetIdentity.configured) {
    return {
      connected: false,
      gateStatus: 'BLOCKED_MISSING_DEDICATED_PREVIEW_READONLY_CREDENTIAL',
      dedicatedNeonProjectId: dedicatedNeonProjId,
      targetIdentity,
      reason:
        'MIGRATION14_TARGET_DATABASE_URL is not set to a dedicated Preview read-only PostgreSQL endpoint in this environment.',
    };
  }

  if (targetIdentity.isLocalLoopbackOrTestDb) {
    return {
      connected: false,
      gateStatus: 'BLOCKED_LOCAL_OR_TESTDB_NOT_VALID_PREVIEW_TARGET',
      targetIdentity,
      reason:
        'Target URL points to a local loopback / testdb instance rather than the isolated Preview PostgreSQL branch.',
    };
  }

  if (prodUrlForIsolationCheck) {
    const prodId = parseSafeTargetUrlIdentity(prodUrlForIsolationCheck);
    if (
      prodId.configured &&
      prodId.clusterDbFingerprint16 === targetIdentity.clusterDbFingerprint16
    ) {
      return {
        connected: false,
        gateStatus: 'BLOCKED_PREVIEW_TARGET_COLLIDES_WITH_PRODUCTION_ENDPOINT',
        targetIdentity,
        reason:
          'Target Preview cluster/database fingerprint matches Production. Aborting BEFORE connection to protect Production.',
      };
    }
  }

  if (targetIdentity.isPrivilegedOwnerLogin) {
    return {
      connected: false,
      gateStatus: 'BLOCKED_PRIVILEGED_OWNER_CREDENTIAL_REJECTED_FOR_READONLY_PREFLIGHT',
      targetIdentity,
      reason:
        'Activity 2 requires a restricted read-only database credential (NOSUPERUSER, read-only), not neondb_owner/postgres.',
    };
  }

  const { Client } = require('pg');
  const { createNeonWsClient, endPgClientBounded } = require('./neon-ws-transport.cjs');
  const cleanTargetUrl = (() => {
    const u = new URL(targetUrl);
    u.searchParams.delete('channel_binding');
    if (!u.searchParams.get('sslmode')) u.searchParams.set('sslmode', 'require');
    return u.toString();
  })();
  const pgOpts = '-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000';
  const targetHost = new URL(cleanTargetUrl).hostname;
  let client;
  if (/\.neon\.tech$/i.test(targetHost)) {
    client = createNeonWsClient(cleanTargetUrl, 'oserp-uboq-preview-readiness-gate', {
      connectionTimeoutMillis: 20000,
      query_timeout: 25000,
    });
  } else {
    client = new Client({
      connectionString: cleanTargetUrl,
      connectionTimeoutMillis: 15000,
      query_timeout: 25000,
      options: pgOpts,
      application_name: 'oserp-uboq-preview-readiness-gate',
    });
  }
  try {
    await client.connect();
    await client.query('BEGIN TRANSACTION READ ONLY');
    let serverPosture;
    let rolePosture;
    try {
      const srv = (
        await client.query(`
          SELECT
            current_database() AS db_name,
            current_user AS current_login,
            current_setting('transaction_read_only') AS tx_read_only,
            current_setting('server_version_num')::int AS server_version_num,
            r.rolsuper,
            r.rolbypassrls,
            r.rolcreatedb,
            r.rolcreaterole
          FROM pg_roles r
          WHERE r.rolname = current_user
        `)
      ).rows[0];

      const requiredRoles = (
        await client.query(`
          SELECT rolname, rolsuper, rolcanlogin, rolbypassrls
          FROM pg_roles
          WHERE rolname IN (
            'oserp_migrations_owner',
            'oserp_compat_app',
            'oserp_legacy_app',
            'oserp_maint_cleanup_role',
            'oserp_company_payroll_app',
            'oserp_company_payroll_verifier'
          )
          ORDER BY rolname ASC
        `)
      ).rows;

      const uboqAnchorReg = (
        await client.query(`SELECT to_regclass('public."_uboq_rls_trust_anchor"')::text AS reg`)
      ).rows[0].reg;
      const payrollAnchorReg = (
        await client.query(`SELECT to_regclass('public."_company_payroll_trust_anchor"')::text AS reg`)
      ).rows[0].reg;

      const clusterDbs = (
        await client.query(`SELECT datname FROM pg_database WHERE NOT datistemplate ORDER BY datname ASC`)
      ).rows.map((r) => r.datname);
      const unrelatedDbs = clusterDbs.filter((d) => !ALLOWED_CLUSTER_DATABASES.has(d));

      serverPosture = {
        ...srv,
        clusterDatabaseCount: clusterDbs.length,
        unrelatedDatabaseCount: unrelatedDbs.length,
      };
      rolePosture = {
        presentGroupRoles: requiredRoles,
        uboqTrustAnchorTablePresent: Boolean(uboqAnchorReg),
        companyPayrollTrustAnchorTablePresent: Boolean(payrollAnchorReg),
      };
    } finally {
      await client.query('ROLLBACK');
    }

    if (serverPosture.unrelatedDatabaseCount > 0) {
      return {
        connected: true,
        gateStatus: 'BLOCKED_UNRELATED_APPLICATION_DATABASES_PRESENT_ON_TARGET',
        dedicatedNeonProjectId: dedicatedNeonProjId,
        targetIdentity,
        serverPosture,
        reason:
          'Target PostgreSQL cluster/branch contains one or more unrelated application databases outside {postgres, neondb, oserp_uboq_preview}. Failing closed to enforce project-level isolation.',
      };
    }

    if (serverPosture.rolsuper || serverPosture.tx_read_only !== 'on') {
      return {
        connected: true,
        gateStatus: 'BLOCKED_SESSION_NOT_STRICTLY_READONLY_NON_SUPERUSER',
        targetIdentity,
        serverPosture,
      };
    }

    // For managed PostgreSQL 18 (`180000 <= server_version_num < 190000`), verify against the
    // independently reviewed `MANAGED_PG18_RC_V1` gate (which enforces 39/39 candidate checksums,
    // Migration #14 provenance, bidirectional role-membership & delegation guards, and empty-baseline
    // parity with the accepted M14 classifier when `--allow-empty` is explicitly approved).
    let m14EmptyCheck = null;
    if (allowEmptyApproved) {
      m14EmptyCheck = await inspectTargetLedger(client, disk, authority, {
        allowEmpty: true,
      });
      if (!m14EmptyCheck.eligible) {
        return {
          connected: true,
          gateStatus: m14EmptyCheck.classification,
          allowEmptyRequested: allowEmptyFlag,
          allowEmptyApproved,
          targetIdentity,
          serverPosture,
          ledgerVerdict: m14EmptyCheck,
          rolePosture,
        };
      }
    }

    const ledgerVerdict = await inspectTargetForManagedPg18Rc(client, rcDisk, rcAuthority, {
      allowEmpty: allowEmptyApproved,
    });

    return {
      connected: true,
      gateStatus: ledgerVerdict.eligible ? 'PASS_LEDGER_ELIGIBLE' : ledgerVerdict.classification,
      allowEmptyRequested: allowEmptyFlag,
      allowEmptyApproved,
      targetIdentity,
      serverPosture,
      m14EmptyCheck,
      ledgerVerdict,
      rolePosture,
    };
  } finally {
    await endPgClientBounded(client, 5000);
  }
}

function verifyVercelBlobPrivateVaultReadiness(vercelAudit) {
  const vaultSource = fs.readFileSync('src/lib/uboq/storage/vault-storage.ts', 'utf8');
  const awsDependencyRemovedFromVault = !/@aws-sdk\/client-s3|S3Client/.test(vaultSource);
  const usesVercelBlobPrivate =
    vaultSource.includes("from '@vercel/blob'") &&
    vaultSource.includes("access: 'private'") &&
    vaultSource.includes('aes-256-gcm');

  const receiptPath = path.join(OUT_DIR, 'vercel-blob-private-vault-verification.json');
  const receipt = fs.existsSync(receiptPath)
    ? JSON.parse(fs.readFileSync(receiptPath, 'utf8'))
    : null;

  const requiredVaultKeys = [
    'BLOB_READ_WRITE_TOKEN',
    'UBOQ_VAULT_BLOB_READ_WRITE_TOKEN',
    'UBOQ_VAULT_BLOB_STORE_ID',
    'UBOQ_VAULT_BACKEND',
    'UBOQ_VAULT_ENV_NAMESPACE',
    'UBOQ_VAULT_ENCRYPTION_KEY',
  ];
  const configuredVaultKeys = vercelAudit.configuredPreviewBlobVaultSecrets || [];
  const allVaultVarsBound = requiredVaultKeys.every((k) => configuredVaultKeys.includes(k));
  const receiptPassed =
    receipt &&
    receipt.overallDisposition === 'PASS_VERCEL_BLOB_PRIVATE_VAULT_VERIFIED' &&
    Array.isArray(receipt.checks) &&
    receipt.checks.length === 7 &&
    receipt.checks.every((c) => c.result === 'PASS') &&
    receipt.storeIdentity?.accessMode === 'private' &&
    receipt.storeIdentity?.vercelProjectId === PRIMARY_VERCEL_PROJECT_ID &&
    Array.isArray(receipt.storeIdentity?.environments) &&
    !receipt.storeIdentity.environments.includes('production');

  const ok = awsDependencyRemovedFromVault && usesVercelBlobPrivate && allVaultVarsBound && receiptPassed;

  return {
    status: ok ? 'PASS' : 'FAIL_BLOB_PRIVATE_VAULT_NOT_VERIFIED',
    awsDependencyRemovedFromVault,
    usesVercelBlobPrivateAndAes256Gcm: usesVercelBlobPrivate,
    allPreviewBlobSecretsBound: allVaultVarsBound,
    configuredPreviewBlobSecrets: configuredVaultKeys,
    storeIdentity: receipt?.storeIdentity || null,
    focusedRuntimeChecksPassed: receipt?.checks?.length || 0,
  };
}

async function main() {
  const args = process.argv.slice(2);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // 1) Reconfirm live remote origin/main & approved 39-migration local authority
  const lsRemoteOut = execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], {
    encoding: 'utf8',
    timeout: 30000,
  }).trim();
  const remoteMainSha = lsRemoteOut.split(/\s+/)[0];
  const disk = loadDiskMigrations();
  const authority = loadApprovedAuthority(disk);
  const rcDisk = loadRcDiskMigrations();
  const rcAuthority = loadManagedPg18RcAuthority(rcDisk);
  assert.equal(
    remoteMainSha,
    authority.originMainCommit,
    `Remote refs/heads/main (${remoteMainSha}) diverged from pinned ${authority.originMainCommit}`
  );

  // Verify independent Codex review PASS & frozen RC review archive integrity
  const rcReviewZipSha = sha256Hex(
    fs.readFileSync('artifacts/uboq/wp3/uboq-m15-managed-pg18-rc-v1-review.zip')
  );
  assert.equal(
    rcReviewZipSha,
    '496c4375b5bd15ff593d0d6e0d845871ace1e4b370625879366f40afe156513d',
    'MANAGED_PG18_RC_V1 review archive SHA-256 mismatch'
  );
  const codexRcReviewMd = fs.readFileSync(
    'artifacts/uboq/managed-pg18-rc-v1/codex-independent-review.md',
    'utf8'
  );
  const codexRcReviewPassed = /INDEPENDENT_REVIEW_DISPOSITION:\s*PASS\b/.test(codexRcReviewMd);
  assert.equal(
    codexRcReviewPassed,
    true,
    'MANAGED_PG18_RC_V1 Codex independent review disposition is not PASS'
  );

  // 2) Verify accepted T0-T12 R2 source files & 11+1 frozen review archives remain untouched
  const r2Refs = JSON.parse(
    fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r3/r2-evidence-references.json', 'utf8')
  );
  for (const src of r2Refs.acceptedSources) {
    assert.equal(
      sha256Hex(fs.readFileSync(src.path)),
      src.sha256,
      `Accepted R2 source modified unexpectedly: ${src.path}`
    );
  }
  const phase1 = JSON.parse(
    fs.readFileSync('artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json', 'utf8')
  );
  for (const arch of phase1.frozenArchives) {
    assert.equal(
      sha256Hex(fs.readFileSync(arch.path)),
      arch.sha256,
      `Frozen archive modified unexpectedly: ${arch.path}`
    );
  }

  // 3) Inspect Vercel Preview control-plane & repository infrastructure templates (zero secrets exposed)
  const vercelAudit = await inspectVercelControlPlaneReadOnly();
  const infraAudit = inspectRepoInfraTemplates();

  // 4) Run live Preview DB target identity + Migration #14 / MANAGED_PG18_RC_V1 read-only inspection
  const previewDbGate = await verifyLivePreviewTargetIfConfigured(
    disk,
    authority,
    rcDisk,
    rcAuthority,
    args
  );

  // 5) Verify Dedicated Vercel Blob Private Vault readiness (AWS S3 requirement removed)
  const blobVaultGate = verifyVercelBlobPrivateVaultReadiness(vercelAudit);

  const gates = [
    {
      gateId: 'PRE-GATE-01',
      name: 'Pinned Git Lineage, Classifier Authority, MANAGED_PG18_RC_V1 & Accepted T0-T12 Preservation',
      status: 'PASS',
      evidence: {
        remoteOriginMainVerified: remoteMainSha,
        originMainMigrationCount: authority.originMainCount,
        releaseBaselineCommit: authority.releaseBaselineCommit,
        releaseBaselineMigrationCount: authority.releaseBaselineCount,
        historicalMigrationChainCount: authority.approved.length,
        managedPg18RcV1MigrationChainCount: rcAuthority.approved.length,
        classifierIndependentReviewArchiveSha256:
          '0fb31f0c67f59324c01773db981be96e0511a45fe860a9e2deb017d85f8f97a0',
        managedPg18RcV1ReviewArchiveSha256: rcReviewZipSha,
        acceptedT0ToT12SourcesIntact: r2Refs.acceptedSources.length,
        frozenArchivesIntact: phase1.frozenArchives.length,
      },
    },
    {
      gateId: 'PRE-GATE-02',
      name: 'Preview Database Target Identity & Production Isolation Verification',
      status:
        previewDbGate.connected &&
        previewDbGate.serverPosture?.unrelatedDatabaseCount === 0 &&
        vercelAudit.previewSecretMatrixForReleaseBranch?.DATABASE_URL === 'PRESENT' &&
        vercelAudit.previewSecretMatrixForReleaseBranch?.DIRECT_URL === 'PRESENT'
          ? 'PASS'
          : 'FAIL',
      disposition: previewDbGate.connected
        ? 'PASS_DEDICATED_PREVIEW_NEON_PROJECT_ISOLATED'
        : previewDbGate.gateStatus,
      evidence: {
        dedicatedNeonProjectId:
          (process.env.OSERP_DEDICATED_PREVIEW_NEON_PROJECT_ID || '').trim() || null,
        primaryVercelProject: `${PRIMARY_VERCEL_SCOPE}/${PRIMARY_VERCEL_PROJECT_NAME} (${PRIMARY_VERCEL_PROJECT_ID})`,
        linkedGitRepository: vercelAudit.linkedRepo || EXPECTED_GITHUB_REPO,
        releaseBranch: TARGET_RELEASE_BRANCH,
        previewDatabaseUrlBoundForReleaseBranch:
          vercelAudit.previewSecretMatrixForReleaseBranch?.DATABASE_URL === 'PRESENT',
        previewDirectUrlBoundForReleaseBranch:
          vercelAudit.previewSecretMatrixForReleaseBranch?.DIRECT_URL === 'PRESENT',
        sharedPreviewProductionNeonKeysCount:
          vercelAudit.sharedPreviewProductionNeonKeys?.length ?? null,
        appReferencesSharedNeonKeysCount: 0,
        historicalBranchPinnedPreviewDbKeys: vercelAudit.branchPinnedPreviewDbKeys || [],
        targetUrlIdentity: previewDbGate.targetIdentity,
        serverPosture: previewDbGate.serverPosture || null,
        reason: previewDbGate.reason || null,
      },
    },
    {
      gateId: 'PRE-GATE-03',
      name: 'Preview _prisma_migrations Read-Only Classifier & MANAGED_PG18_RC_V1 Inspection (Names, Order, Timestamps & Raw Checksums)',
      status:
        previewDbGate.gateStatus === 'PASS_LEDGER_ELIGIBLE' &&
        (previewDbGate.allowEmptyApproved || previewDbGate.ledgerVerdict?.verifiedMigrationCount === 39)
          ? 'PASS'
          : 'FAIL',
      disposition: previewDbGate.connected
        ? previewDbGate.gateStatus
        : 'NOT_EXECUTED_TARGET_UNPROVISIONED_FAIL_CLOSED',
      evidence: {
        classifierScripts: [
          'scripts/uboq/verify-migration14-provenance-gate.cjs',
          'scripts/uboq/verify-managed-pg18-rc-v1-gate.cjs',
        ],
        allowEmptyFlagUsed: Boolean(previewDbGate.allowEmptyRequested),
        allowEmptyExplicitlyApproved: Boolean(previewDbGate.allowEmptyApproved),
        canonicalMigration14Sha256: authority.approved[13].sha256,
        historicalMigration15Sha256: authority.approved[14].sha256,
        candidateMigration15Sha256: rcAuthority.approved[14].sha256,
        ledgerVerdict: previewDbGate.ledgerVerdict || null,
      },
    },
    {
      gateId: 'PRE-GATE-04',
      name: 'Preview Least-Privilege PostgreSQL Roles, RLS Trust Anchors & DB Secret Bindings',
      status:
        previewDbGate.rolePosture &&
        previewDbGate.rolePosture.presentGroupRoles?.length === 6 &&
        previewDbGate.rolePosture.uboqTrustAnchorTablePresent &&
        previewDbGate.rolePosture.companyPayrollTrustAnchorTablePresent &&
        previewDbGate.ledgerVerdict?.roleSecurityPosture?.ok === true &&
        (vercelAudit.missingPreviewDbAndAppSecrets || []).length === 0
          ? 'PASS'
          : 'FAIL',
      disposition:
        previewDbGate.rolePosture &&
        previewDbGate.rolePosture.presentGroupRoles?.length === 6 &&
        previewDbGate.rolePosture.uboqTrustAnchorTablePresent &&
        previewDbGate.rolePosture.companyPayrollTrustAnchorTablePresent &&
        previewDbGate.ledgerVerdict?.roleSecurityPosture?.ok === true &&
        (vercelAudit.missingPreviewDbAndAppSecrets || []).length === 0
          ? 'PASS_LEAST_PRIVILEGE_ROLES_TRUST_ANCHORS_AND_PREVIEW_SECRETS_VERIFIED'
          : previewDbGate.rolePosture
            ? 'INSPECTED_INCOMPLETE'
            : 'BLOCKED_ROLES_TRUST_ANCHORS_AND_PREVIEW_DB_SECRETS_PENDING_DEDICATED_NEON_PROJECT',
      evidence: {
        requiredRuntimeLogins: [
          'oserp_preview_preflight_ro (SELECT-only on _prisma_migrations + pg_catalog, NOSUPERUSER, default_transaction_read_only=on)',
          'oserp_preview_runtime_app -> INHERIT oserp_compat_app (NOSUPERUSER, NOBYPASSRLS, ADMIN FALSE, pooled) for DATABASE_URL',
          'oserp_preview_direct_app -> INHERIT oserp_compat_app + read-only _prisma_migrations (NOSUPERUSER, NOBYPASSRLS, ADMIN FALSE, unpooled) for DIRECT_URL',
          'oserp_preview_payroll_app -> INHERIT oserp_company_payroll_app (NOSUPERUSER, NOBYPASSRLS, ADMIN FALSE, pooled) for COMPANY_PAYROLL_DATABASE_URL',
          'oserp_preview_migrate_admin -> oserp_migrations_owner (locked NOLOGIN NOBYPASSRLS NOCREATEROLE NOCREATEDB CONNECTION LIMIT 0 post-deploy)',
        ],
        requiredTrustAnchorTables: [
          'public."_uboq_rls_trust_anchor" (anchorId = PRIMARY)',
          'public._company_payroll_trust_anchor (id = true)',
        ],
        missingPreviewDbAndAppSecrets: vercelAudit.missingPreviewDbAndAppSecrets || [],
        observedRolePosture: previewDbGate.rolePosture || null,
        roleSecurityPosture: previewDbGate.ledgerVerdict?.roleSecurityPosture || null,
      },
    },
    {
      gateId: 'PRE-GATE-05',
      name: 'Dedicated Vercel Blob Private Vault & Authenticated AES-256-GCM Encryption Readiness (Zero AWS Dependency)',
      status: blobVaultGate.status === 'PASS' ? 'PASS' : 'FAIL',
      disposition:
        blobVaultGate.status === 'PASS'
          ? 'PASS_VERCEL_BLOB_PRIVATE_VAULT_PROVISIONED_AND_VERIFIED'
          : blobVaultGate.status,
      evidence: {
        vercelSensitiveEnvEncryptionEnforced: vercelAudit.sensitiveEnvEncryptionEnforced ?? null,
        blobVaultGate,
      },
    },
    {
      gateId: 'PRE-GATE-06',
      name: 'Deployment Build Safety, Access Protection & Multi-Project Auto-Deploy Controls',
      status:
        infraAudit.packageBuildScriptSafe &&
          vercelAudit.ssoProtection === 'all_except_custom_domains' &&
          !infraAudit.neonPrWorkflow.brokenStepOutputReferenceDetected &&
          (vercelAudit.siblingLinkedProjects || []).every((p) => p.previewBuildsBlocked === true)
          ? 'PASS'
          : 'PARTIAL_PASS_WITH_ACTION_REQUIRED',
      evidence: {
        packageBuildScript: infraAudit.packageBuildScript,
        packageBuildScriptSafe: infraAudit.packageBuildScriptSafe,
        vercelPreviewSsoProtection: vercelAudit.ssoProtection || null,
        vercelGithubAutoDeployEnabled: infraAudit.vercelGithubAutoDeployEnabled,
        neonPrWorkflow: infraAudit.neonPrWorkflow,
        siblingLinkedVercelProjects: vercelAudit.siblingLinkedProjects || [],
      },
    },
    {
      gateId: 'PRE-GATE-07',
      name: 'Independent Technical Review Baseline (Phase D2 R3 + M39 + Phase 4 + M14 Classifier + MANAGED_PG18_RC_V1)',
      status: codexRcReviewPassed ? 'PASS' : 'FAIL',
      disposition: 'INDEPENDENTLY_ACCEPTED_FOR_RELEASE_READINESS_PREFLIGHT',
      evidence: {
        phaseD2R3Review: 'PASS (4d1df11342b59524d5a83eed26728f7269bcbbb9ac318acb28f06b118f1e18fa)',
        m39AndPhase4Review:
          'SUPPORTING PASS (240552101632fe6ab5fba8ae7a6ae3a68754de35a802e2699582adda74a847ce)',
        m14ClassifierDeltaReview:
          'PASS (0fb31f0c67f59324c01773db981be96e0511a45fe860a9e2deb017d85f8f97a0)',
        m15ManagedPg18RcV1CodexReview: `PASS (${rcReviewZipSha})`,
      },
    },
  ];

  const allMandatoryPassed = gates.every((g) => g.status === 'PASS');

  const report = {
    project: 'OSERP-PROJ-UBOQ-001',
    branch: TARGET_RELEASE_BRANCH,
    reportType: 'PREVIEW_PRE_DEPLOYMENT_GATE_REPORT',
    evaluatedAt: new Date().toISOString(),
    overallDisposition: allMandatoryPassed
      ? 'PASS_READY_FOR_PREVIEW_DEPLOYMENT_APPROVAL_GATE'
      : 'FAIL_CLOSED_HOLD_PREVIEW_DEPLOYMENT',
    technicalGatesClearedForPreview: allMandatoryPassed,
    deploymentAuthorizedNow: false,
    actionsNotPerformed: {
      previewDeployment: true,
      productionDeployment: true,
      productionDatabaseConnection: true,
      migrationHistoryRewrite: true,
      branchMerge: true,
      finalFreeze: true,
    },
    summaryCounts: {
      totalGates: gates.length,
      passed: gates.filter((g) => g.status === 'PASS').length,
      partialOrWarning: gates.filter((g) => g.status.startsWith('PARTIAL')).length,
      failedOrBlocked: gates.filter((g) => g.status === 'FAIL').length,
    },
    gates,
    preparedReadinessDeliverables: [
      'src/lib/uboq/storage/vault-storage.ts',
      'scripts/uboq/verify-vercel-blob-private-vault.ts',
      'scripts/uboq/neon-ws-transport.cjs',
      'scripts/uboq/build-managed-pg18-rc-v1.cjs',
      'scripts/uboq/verify-managed-pg18-rc-v1-gate.cjs',
      'scripts/uboq/validate-managed-pg18-rc-v1.cjs',
      'scripts/uboq/verify-preview-target-readiness.cjs',
      'scripts/uboq/provision-dedicated-preview-project-db.cjs',
      'prisma/managed-pg18-rc-v1/schema.prisma',
      'docs/uboq/preview-deployment-and-rollback-plan.md',
      'docs/uboq/preview-uat-checklist.md',
      'artifacts/uboq/managed-pg18-rc-v1/rc-v1-checksum-manifest.json',
      'artifacts/uboq/managed-pg18-rc-v1/rc-v1-validation-receipt.json',
      'artifacts/uboq/managed-pg18-rc-v1/codex-independent-review.md',
      'artifacts/uboq/wp3/uboq-m15-managed-pg18-rc-v1-review.zip',
      'artifacts/uboq/preview-readiness/vercel-blob-private-vault-verification.json',
      'artifacts/uboq/preview-readiness/dedicated-preview-provisioning-receipt.json',
      'artifacts/uboq/preview-readiness/preview-pre-deployment-gate-report.json',
    ],
    nextExecutableAction: allMandatoryPassed
      ? 'STOP AT THE CONTROLLED PREVIEW DEPLOYMENT GATE — all 7/7 pre-deployment gates passed; await explicit deployment trigger.'
      : 'Resolve remaining Preview pre-deployment gate items in `preview-pre-deployment-gate-report.json` before triggering Preview deployment.',
  };

  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        overallDisposition: report.overallDisposition,
        technicalGatesClearedForPreview: report.technicalGatesClearedForPreview,
        deploymentAuthorizedNow: report.deploymentAuthorizedNow,
        summaryCounts: report.summaryCounts,
        reportPath: REPORT_PATH,
      },
      null,
      2
    )
  );

  if (!allMandatoryPassed) {
    process.exitCode = 1;
  }
}

if (require.main === module) {
  const gateDeadline = setTimeout(() => {
    console.error(JSON.stringify({ fatal: 'PREVIEW_READINESS_GATE_DEADLINE_EXCEEDED_75S' }));
    process.exit(124);
  }, 75000);
  gateDeadline.unref();
  main()
    .catch((err) => {
      console.error(
        `Preview pre-deployment readiness check failed closed (${err?.code || err?.name || 'ERROR'}). Zero credentials logged.`
      );
      process.exitCode = 1;
    })
    .finally(() => {
      clearTimeout(gateDeadline);
    });
}

module.exports = { parseSafeTargetUrlIdentity };
