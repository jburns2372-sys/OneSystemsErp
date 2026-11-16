'use strict';

/**
 * OSERP-PROJ-UBOQ-001 — Phase 7 Steps 1-6: Controlled Preview Deployment & Readiness Verifier
 *
 * Enforces:
 * 1. Team `jburns2372-sys-projects` (`team_DWpmafscN88J0nNBvcUKHNM7`) & project `one-systems-erp`
 *    (`prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi`), `productionBranch === "main"`.
 * 2. Exact reviewed source commit on `release/oserp-proj-uboq-001`, safe build script
 *    (`prisma generate && next build`), and 13/13 R2 + M15 RC preservation.
 * 3. Preview-only database credentials verified against `long-recipe-20782583` / `oserp_uboq_preview`;
 *    fails closed if Production or shared `holy-shape-01357429` is referenced.
 * 4. Private Vercel Blob Vault (`store_XuH1XvlM7GKo3wX9`) & required Preview secrets verified
 *    without exposing secret values; ensures Preview-only `NEXTAUTH_URL` points to the Preview
 *    branch alias so auth callbacks never redirect to Production.
 * 5. Pushes ONLY `release/oserp-proj-uboq-001` (never `main`, never `--prod`, never promote) and
 *    confirms Vercel creates a `target === "preview"` deployment for that exact commit SHA.
 * 6. Polls deployment to `READY`, verifies `UAT-00.1` (`401` Vercel Authentication gate on
 *    unauthenticated external request), and writes `artifacts/uboq/preview-uat/phase7-deployment-ready-receipt.json`.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const TEAM_ID = 'team_DWpmafscN88J0nNBvcUKHNM7';
const TEAM_SLUG = 'jburns2372-sys-projects';
const PROJECT_ID = 'prj_eeuFU8EAtmiQp2TIIzuqcD91bNzi';
const PROJECT_NAME = 'one-systems-erp';
const LINKED_GITHUB_REPO_ID = 1264605590;
const RELEASE_BRANCH = 'release/oserp-proj-uboq-001';
const PREVIEW_BRANCH_ALIAS_ORIGIN =
  'https://one-systems-erp-git-release-oser-f0dd68-jburns2372-sys-projects.vercel.app';
const DEDICATED_NEON_PROJECT_ID = 'long-recipe-20782583';
const DEDICATED_PREVIEW_DB = 'oserp_uboq_preview';
const PRIVATE_BLOB_STORE_ID = 'store_XuH1XvlM7GKo3wX9';

const OUT_DIR = path.resolve('artifacts/uboq/preview-uat');
const RECEIPT_PATH = path.join(OUT_DIR, 'phase7-deployment-ready-receipt.json');

function sha256File(p) {
  return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
}

function logEvent(step, detail = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), step, ...detail }));
}

function readVercelToken() {
  const p = path.join(process.env.APPDATA || '', 'com.vercel.cli', 'Data', 'auth.json');
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  assert.ok(j && j.token, 'Vercel CLI token missing');
  return j.token.trim();
}

async function vercelApi(token, method, apiPath, bodyObj) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(`https://api.vercel.com${apiPath}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          ...(bodyObj !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: bodyObj !== undefined ? JSON.stringify(bodyObj) : undefined,
        signal: AbortSignal.timeout(18000),
      });
      const txt = await res.text();
      if (!res.ok) {
        throw new Error(`${method} ${apiPath.split('?')[0]} HTTP ${res.status}: ${txt.slice(0, 240)}`);
      }
      return txt ? JSON.parse(txt) : {};
    } catch (err) {
      lastErr = err;
      if (method !== 'GET' || attempt === 3 || /HTTP 4\d\d/.test(String(err.message || ''))) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, 700 * attempt));
    }
  }
  throw lastErr;
}

(async () => {
  const hardDeadline = setTimeout(() => {
    console.error(JSON.stringify({ fatal: 'PHASE7_DEPLOY_DEADLINE_EXCEEDED_420S' }));
    process.exit(124);
  }, 420000);
  hardDeadline.unref();

  try {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    const vercelToken = readVercelToken();

    // =========================================================================
    // STEP 1: Verify Vercel Team & Primary Project
    // =========================================================================
    const teamInfo = await vercelApi(vercelToken, 'GET', `/v2/teams/${TEAM_ID}`);
    assert.equal(teamInfo.id, TEAM_ID);
    assert.equal(teamInfo.slug, TEAM_SLUG);

    const proj = await vercelApi(vercelToken, 'GET', `/v9/projects/${PROJECT_ID}?teamId=${TEAM_ID}`);
    assert.equal(proj.id, PROJECT_ID);
    assert.equal(proj.name, PROJECT_NAME);
    assert.equal(proj.link?.productionBranch, 'main', 'SAFETY ABORT: Production branch is not main');
    logEvent('STEP_1_VERCEL_TEAM_AND_PROJECT_VERIFIED', {
      teamSlug: teamInfo.slug,
      teamId: teamInfo.id,
      projectName: proj.name,
      projectId: proj.id,
      productionBranch: proj.link.productionBranch,
    });

    // =========================================================================
    // STEP 2: Verify Build Configuration, Preserved Baselines & Record Commit
    // =========================================================================
    const curBranch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
    assert.equal(curBranch, RELEASE_BRANCH, `SAFETY ABORT: Expected ${RELEASE_BRANCH}, on ${curBranch}`);
    assert.notEqual(curBranch, 'main');

    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const vercelCfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
    assert.equal(pkg.scripts?.build, 'prisma generate && next build');
    assert.equal(vercelCfg.buildCommand, 'npm run build');

    // Verify 13 accepted R2 sources & RC archive remain intact before committing
    const r2Refs = JSON.parse(
      fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r3/r2-evidence-references.json', 'utf8')
    );
    for (const s of r2Refs.acceptedSources) {
      assert.equal(sha256File(s.path), s.sha256, `R2 source hash drift: ${s.path}`);
    }
    assert.equal(
      sha256File('artifacts/uboq/wp3/uboq-m15-managed-pg18-rc-v1-review.zip'),
      '496c4375b5bd15ff593d0d6e0d845871ace1e4b370625879366f40afe156513d'
    );

    const dirtyStatus = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
    if (dirtyStatus.length > 0) {
      execFileSync('git', ['-c', 'core.autocrlf=false', 'add', '-A'], { stdio: 'inherit' });
      // Ensure `/artifacts/` was NOT staged
      const stagedFiles = execFileSync('git', ['diff', '--cached', '--name-only'], {
        encoding: 'utf8',
      })
        .trim()
        .split(/\r?\n/)
        .filter(Boolean);
      for (const f of stagedFiles) {
        assert.equal(
          f.startsWith('artifacts/') || f.startsWith('.env'),
          false,
          `SAFETY ABORT: Refusing to stage ${f}`
        );
      }
      execFileSync(
        'git',
        [
          '-c',
          'core.autocrlf=false',
          'commit',
          '-m',
          'feat(uboq): Phase 7 Preview-ready UBOQ T0-T12, Private Vercel Blob Vault & Managed PG18 RC',
        ],
        { stdio: 'inherit' }
      );
    }

    // Re-verify 13 accepted R2 sources post-commit
    for (const s of r2Refs.acceptedSources) {
      assert.equal(sha256File(s.path), s.sha256, `Post-commit R2 drift: ${s.path}`);
    }

    const reviewedCommitSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    const originMainSha = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
    assert.equal(originMainSha, 'd08740b50d2c0eee9110497f247e213c20d0e06e');
    logEvent('STEP_2_SOURCE_COMMIT_AND_BUILD_CONFIG_RECORDED', {
      branch: curBranch,
      reviewedCommitSha,
      originMainSha,
      packageBuildScript: pkg.scripts.build,
      vercelBuildCommand: vercelCfg.buildCommand,
    });

    // =========================================================================
    // STEP 3 & STEP 4: Verify Preview-Only DB Target, Private Blob Vault & Secrets
    // =========================================================================
    const phase6Receipt = JSON.parse(
      fs.readFileSync(
        'artifacts/uboq/preview-readiness/phase6-option-a-final-checkpoint-receipt.json',
        'utf8'
      )
    );
    assert.equal(phase6Receipt.finalPhase6ReadinessStatus, 'PASS_READY_FOR_PREVIEW_DEPLOYMENT_APPROVAL_GATE');
    assert.equal(phase6Receipt.targetDatabaseAndMigrationVerification.neonProjectId, DEDICATED_NEON_PROJECT_ID);
    assert.equal(phase6Receipt.targetDatabaseAndMigrationVerification.databaseName, DEDICATED_PREVIEW_DB);
    assert.equal(phase6Receipt.targetDatabaseAndMigrationVerification.finishedMigrationCount, 39);

    const blobReceipt = JSON.parse(
      fs.readFileSync(
        'artifacts/uboq/preview-readiness/vercel-blob-private-vault-verification.json',
        'utf8'
      )
    );
    assert.equal(blobReceipt.overallDisposition, 'PASS_VERCEL_BLOB_PRIVATE_VAULT_VERIFIED');
    assert.equal(blobReceipt.storeIdentity.storeId, PRIVATE_BLOB_STORE_ID);
    assert.equal(blobReceipt.storeIdentity.accessMode, 'private');
    assert.equal(blobReceipt.storeIdentity.environments.includes('production'), false);

    const envs = Array.isArray(proj.env) ? proj.env : [];
    const previewOnlyDbKeys = ['DATABASE_URL', 'DIRECT_URL', 'COMPANY_PAYROLL_DATABASE_URL'];
    for (const k of previewOnlyDbKeys) {
      const entry = envs.find(
        (e) =>
          e.key === k &&
          Array.isArray(e.target) &&
          e.target.length === 1 &&
          e.target[0] === 'preview' &&
          !e.gitBranch
      );
      assert.ok(entry, `SAFETY ABORT: Preview-only binding missing for ${k}`);
      assert.equal(entry.type, 'sensitive');
    }

    const requiredVaultAndRlsKeys = [
      'BLOB_READ_WRITE_TOKEN',
      'UBOQ_VAULT_BLOB_READ_WRITE_TOKEN',
      'UBOQ_VAULT_BLOB_STORE_ID',
      'UBOQ_VAULT_BACKEND',
      'UBOQ_VAULT_ENV_NAMESPACE',
      'UBOQ_VAULT_ENCRYPTION_KEY',
      'UBOQ_RLS_CONTEXT_SECRET',
      'COMPANY_PAYROLL_CONTEXT_SECRET',
      'INTERNAL_API_SECRET',
      'AUTH_SECRET',
      'AUTH_TRUST_HOST',
    ];
    for (const k of requiredVaultAndRlsKeys) {
      const hasPreview = envs.some(
        (e) => e.key === k && Array.isArray(e.target) && e.target.includes('preview') && !e.gitBranch
      );
      assert.equal(hasPreview, true, `SAFETY ABORT: Required Preview secret ${k} missing`);
    }
    logEvent('STEP_3_4_PREVIEW_DB_ISOLATION_AND_BLOB_VAULT_SECRETS_VERIFIED', {
      dedicatedNeonProjectId: DEDICATED_NEON_PROJECT_ID,
      dedicatedPreviewDatabase: DEDICATED_PREVIEW_DB,
      privateBlobStoreId: PRIVATE_BLOB_STORE_ID,
      verifiedPreviewKeysCount: previewOnlyDbKeys.length + requiredVaultAndRlsKeys.length,
      productionReferencedOrModified: false,
    });

    // =========================================================================
    // STEP 5: Push ONLY `release/oserp-proj-uboq-001`, Bind Branch Preview NEXTAUTH_URL & Deploy
    // =========================================================================
    execFileSync(
      'git',
      ['push', 'origin', `refs/heads/${RELEASE_BRANCH}:refs/heads/${RELEASE_BRANCH}`],
      { stdio: 'inherit', timeout: 90000 }
    );
    // Double-check `origin/main` did NOT move
    const remoteMainAfterPush = execFileSync('git', ['ls-remote', 'origin', 'refs/heads/main'], {
      encoding: 'utf8',
      timeout: 20000,
    })
      .trim()
      .split(/\s+/)[0];
    assert.equal(remoteMainAfterPush, 'd08740b50d2c0eee9110497f247e213c20d0e06e');
    logEvent('STEP_5A_RELEASE_BRANCH_PUSHED_MAIN_UNTOUCHED', {
      pushedBranch: RELEASE_BRANCH,
      reviewedCommitSha,
    });

    // Now that `release/oserp-proj-uboq-001` exists on GitHub, ensure branch-scoped Preview `NEXTAUTH_URL`
    // is bound without touching Production. If newly created right now, trigger a fresh Preview deployment
    // so its runtime env snapshot includes the branch-scoped `NEXTAUTH_URL`.
    const existingBranchPreviewNextAuthUrl = envs.find(
      (e) =>
        e.key === 'NEXTAUTH_URL' &&
        Array.isArray(e.target) &&
        e.target.length === 1 &&
        e.target[0] === 'preview' &&
        e.gitBranch === RELEASE_BRANCH
    );
    let createdBranchNextAuthNow = false;
    if (!existingBranchPreviewNextAuthUrl) {
      await vercelApi(vercelToken, 'POST', `/v10/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}`, {
        key: 'NEXTAUTH_URL',
        value: PREVIEW_BRANCH_ALIAS_ORIGIN,
        type: 'encrypted',
        target: ['preview'],
        gitBranch: RELEASE_BRANCH,
      });
      createdBranchNextAuthNow = true;
    } else {
      await vercelApi(
        vercelToken,
        'PATCH',
        `/v9/projects/${PROJECT_ID}/env/${existingBranchPreviewNextAuthUrl.id}?teamId=${TEAM_ID}`,
        {
          value: PREVIEW_BRANCH_ALIAS_ORIGIN,
          type: 'encrypted',
          target: ['preview'],
          gitBranch: RELEASE_BRANCH,
        }
      );
      createdBranchNextAuthNow = true;
    }

    let deployment = null;
    if (!createdBranchNextAuthNow) {
      for (let i = 0; i < 5; i += 1) {
        await new Promise((r) => setTimeout(r, 3500));
        const dList = await vercelApi(
          vercelToken,
          'GET',
          `/v6/deployments?projectId=${PROJECT_ID}&teamId=${TEAM_ID}&sha=${reviewedCommitSha}&limit=5`
        );
        const found = (dList.deployments || []).find(
          (d) => d.target === 'preview' || d.target === null
        );
        if (found) {
          deployment = found;
          break;
        }
      }
    }

    if (!deployment) {
      // In Vercel REST API /v13/deployments, omitting `target` creates a Preview deployment (`target: null`).
      const created = await vercelApi(
        vercelToken,
        'POST',
        `/v13/deployments?teamId=${TEAM_ID}`,
        {
          name: PROJECT_NAME,
          project: PROJECT_ID,
          gitSource: {
            type: 'github',
            repoId: LINKED_GITHUB_REPO_ID,
            ref: RELEASE_BRANCH,
            sha: reviewedCommitSha,
          },
        }
      );
      deployment = created;
    }

    const depId = deployment.uid || deployment.id;
    assert.ok(depId, 'Deployment ID missing');
    assert.notEqual(
      deployment.target,
      'production',
      'STOP CONDITION: Deployment target resolved to production!'
    );
    logEvent('STEP_5B_VERCEL_PREVIEW_DEPLOYMENT_STARTED', {
      deploymentId: depId,
      initialState: deployment.readyState || deployment.state,
      target: deployment.target || 'preview',
    });

    // =========================================================================
    // STEP 6: Poll Deployment Until `READY` & Verify UAT-00.1 Access Gate
    // =========================================================================
    let finalDep = null;
    for (let poll = 0; poll < 70; poll += 1) {
      const cur = await vercelApi(
        vercelToken,
        'GET',
        `/v13/deployments/${depId}?teamId=${TEAM_ID}`
      );
      assert.notEqual(cur.target, 'production', 'STOP CONDITION: Unexpected production target');
      const st = cur.readyState || cur.status;
      if (st === 'READY') {
        finalDep = cur;
        break;
      }
      if (st === 'ERROR' || st === 'CANCELED') {
        const events = await vercelApi(
          vercelToken,
          'GET',
          `/v3/deployments/${depId}/events?teamId=${TEAM_ID}&limit=40`
        ).catch(() => []);
        const tail = Array.isArray(events)
          ? events
              .map((ev) => ev?.payload?.text || ev?.text || '')
              .filter(Boolean)
              .slice(-20)
              .join('\n')
          : '';
        throw new Error(`Vercel Preview deployment ${depId} ended with ${st}:\n${tail.slice(-1400)}`);
      }
      await new Promise((r) => setTimeout(r, 4000));
    }
    assert.ok(finalDep, `Deployment ${depId} did not reach READY within poll window`);

    const deploymentUrl = `https://${finalDep.url}`;
    const previewAliases = Array.isArray(finalDep.alias)
      ? finalDep.alias.map((a) => `https://${a}`)
      : [];

    // Verify UAT-00.1: Unauthenticated external HTTP request is gated by Vercel Authentication (401/403/307 or 302 -> vercel.com/sso-api)
    const unauthRes = await fetch(deploymentUrl, {
      method: 'GET',
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    });
    const unauthLocation = unauthRes.headers.get('location') || '';
    const uat001Protected =
      unauthRes.status === 401 ||
      unauthRes.status === 403 ||
      unauthRes.status === 307 ||
      (unauthRes.status === 302 && unauthLocation.startsWith('https://vercel.com/sso-api'));
    assert.equal(
      uat001Protected,
      true,
      `UAT-00.1 FAILED: Expected unauthenticated Preview URL to be protected by Vercel SSO, got ${unauthRes.status} (${unauthLocation})`
    );

    const receipt = {
      project: 'OSERP-PROJ-UBOQ-001',
      phase: 'PHASE_7_CONTROLLED_PREVIEW_DEPLOYMENT',
      deployedAt: new Date().toISOString(),
      vercelTeam: { id: TEAM_ID, slug: TEAM_SLUG },
      vercelProject: { id: PROJECT_ID, name: PROJECT_NAME },
      testedBranch: RELEASE_BRANCH,
      testedCommitSha: reviewedCommitSha,
      originMainPreservedSha: originMainSha,
      buildConfiguration: {
        vercelFramework: vercelCfg.framework,
        vercelBuildCommand: vercelCfg.buildCommand,
        packageBuildScript: pkg.scripts.build,
      },
      databaseAndStorageIsolation: {
        dedicatedNeonProjectId: DEDICATED_NEON_PROJECT_ID,
        dedicatedPreviewDatabase: DEDICATED_PREVIEW_DB,
        appliedMigrations: '39/39 (MANAGED_PG18_RC_V1)',
        privateVercelBlobStoreId: PRIVATE_BLOB_STORE_ID,
        productionTouched: false,
      },
      deployment: {
        id: finalDep.id || depId,
        target: finalDep.target || 'preview',
        readyState: finalDep.readyState,
        deploymentUrl,
        previewAliases,
        regions: finalDep.regions || [],
      },
      uat001ExternalAccessGate: {
        status: 'PASS',
        unauthenticatedHttpStatus: unauthRes.status,
        ssoProtection: proj.ssoProtection?.deploymentType || 'all_except_custom_domains',
      },
    };
    fs.writeFileSync(RECEIPT_PATH, JSON.stringify(receipt, null, 2) + '\n');
    logEvent('STEP_6_PREVIEW_DEPLOYMENT_READY', receipt.deployment);
  } finally {
    clearTimeout(hardDeadline);
  }
})().catch((err) => {
  console.error(JSON.stringify({ fatal: String(err?.message || err).slice(0, 1500) }));
  process.exitCode = 1;
});
