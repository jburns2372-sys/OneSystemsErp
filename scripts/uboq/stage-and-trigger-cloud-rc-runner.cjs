'use strict';

/**
 * OSERP-PROJ-UBOQ-001 — Stage & Trigger Isolated Private GitHub Actions Cloud Runner (Steps 3-7)
 *
 * - Creates/uses dedicated PRIVATE repository `jburns2372-sys/oserp-uboq-preview-rc-runner`
 *   (100% disconnected from Vercel, Production, and `jburns2372-sys/OneSystemsErp`).
 * - Never touches or pushes to ERP `main` or any `OneSystemsErp` remote branch.
 * - Enforces `* -text` / binary `.gitattributes` so all 39 `MANAGED_PG18_RC_V1` SQL files retain
 *   exact byte-for-byte SHA-256 fingerprints across Windows -> Linux checkout.
 * - Stores credentials strictly as masked GitHub Actions secrets via stdin (`gh secret set`);
 *   zero secrets ever appear in CLI arguments, git files, stdout, or receipts.
 * - Triggers manual-only (`workflow_dispatch`) run ONCE, monitors to completion, and downloads
 *   the verified receipts into `artifacts/uboq/preview-readiness/`.
 */

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync, spawnSync } = require('node:child_process');

const {
  loadDiskMigrations,
  loadApprovedAuthority,
} = require('./verify-migration14-provenance-gate.cjs');
const {
  loadRcDiskMigrations,
  loadManagedPg18RcAuthority,
} = require('./verify-managed-pg18-rc-v1-gate.cjs');

const RUNNER_REPO = 'jburns2372-sys/oserp-uboq-preview-rc-runner';
const WORKFLOW_FILE = 'deploy-uboq-preview-rc-v1.yml';
const TARGET_PROJECT_ID = 'long-recipe-20782583';
const TARGET_BRANCH_ID = 'br-quiet-rice-bc1edkvd';
const TARGET_DB_NAME = 'oserp_uboq_preview';

function sha256Buf(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function runGh(args, opts = {}) {
  const res = spawnSync('gh', args, {
    stdio: [opts.input !== undefined ? 'pipe' : 'ignore', 'pipe', 'pipe'],
    input: opts.input,
    encoding: 'utf8',
    timeout: opts.timeout || 30000,
    windowsHide: true,
  });
  if (res.status !== 0 && !opts.allowNonZero) {
    throw new Error(`gh ${args.slice(0, 3).join(' ')} exited ${res.status}: ${(res.stderr || res.stdout || '').slice(0, 300)}`);
  }
  return res;
}

function logStep(step, detail = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), step, ...detail }));
}

(async () => {
  const hardTimer = setTimeout(() => {
    console.error(JSON.stringify({ fatal: 'STAGE_AND_TRIGGER_TIMEOUT_300S' }));
    process.exit(124);
  }, 300000);
  hardTimer.unref();

  let tmpDir = null;
  let dlDir = null;
  try {
    // 1) Verify frozen local authorities & reviewed RC ZIP before staging
    assert.equal(
      sha256Buf(fs.readFileSync('artifacts/uboq/wp3/uboq-m15-managed-pg18-rc-v1-review.zip')),
      '496c4375b5bd15ff593d0d6e0d845871ace1e4b370625879366f40afe156513d'
    );
    const codexMd = fs.readFileSync('artifacts/uboq/managed-pg18-rc-v1/codex-independent-review.md', 'utf8');
    assert.match(codexMd, /INDEPENDENT_REVIEW_DISPOSITION:\s*PASS\b/);

    const m14Disk = loadDiskMigrations();
    const m14Authority = loadApprovedAuthority(m14Disk);
    const rcDisk = loadRcDiskMigrations();
    const rcAuthority = loadManagedPg18RcAuthority(rcDisk);

    const ckpt1 = JSON.parse(
      fs.readFileSync('artifacts/uboq/preview-readiness/checkpoints/checkpoint-1-db-identity-and-roles.json', 'utf8')
    );
    assert.equal(ckpt1.status, 'PASS');
    const sessionSaltId = ckpt1.evidence.sessionSaltId;
    logStep('LOCAL_AUTHORITY_VERIFIED', { rcMigrationCount: rcDisk.length });

    // 2) Ensure dedicated PRIVATE GitHub repository exists (`jburns2372-sys/oserp-uboq-preview-rc-runner`)
    const checkRepo = runGh(['api', `repos/${RUNNER_REPO}`], { allowNonZero: true });
    if (checkRepo.status !== 0) {
      runGh([
        'repo',
        'create',
        RUNNER_REPO,
        '--private',
        '--description',
        'Isolated manual-only UBOQ Preview RC migration runner (disconnected from Production)',
      ]);
    }
    const repoMeta = JSON.parse(runGh(['api', `repos/${RUNNER_REPO}`]).stdout);
    assert.equal(repoMeta.full_name, RUNNER_REPO);
    assert.equal(repoMeta.private, true, 'SAFETY ABORT: Cloud runner repository MUST be private');
    logStep('ISOLATED_PRIVATE_REPO_CONFIRMED', {
      repo: repoMeta.full_name,
      private: repoMeta.private,
    });

    // 3) Stage exact `MANAGED_PG18_RC_V1` bundle into clean ephemeral directory with binary `.gitattributes`
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-rc-cloud-stage-'));
    fs.writeFileSync(
      path.join(tmpDir, '.gitattributes'),
      '* -text\n*.sql binary\n*.prisma binary\n*.json binary\n*.cjs binary\n*.yml binary\n',
      'utf8'
    );
    fs.writeFileSync(
      path.join(tmpDir, 'package.json'),
      JSON.stringify(
        {
          name: 'oserp-uboq-preview-rc-runner',
          version: '1.0.0',
          private: true,
          dependencies: {
            pg: '8.22.0',
            prisma: '6.19.3',
          },
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    const wfDir = path.join(tmpDir, '.github', 'workflows');
    fs.mkdirSync(wfDir, { recursive: true });
    const workflowYaml = `name: UBOQ Preview MANAGED_PG18_RC_V1 Isolated Migration Runner

on:
  workflow_dispatch:

permissions:
  contents: read

concurrency:
  group: uboq-preview-rc-v1-isolated-single
  cancel-in-progress: false

jobs:
  deploy-managed-pg18-rc-v1:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Checkout staged MANAGED_PG18_RC_V1 bundle
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install pinned pg and prisma CLI
        run: npm install --no-audit --no-fund

      - name: Execute single bounded PITR + Preflight + 39-Migration Deploy + Lockdown + Verification
        env:
          OSERP_NEON_API_TOKEN: \${{ secrets.OSERP_NEON_API_TOKEN }}
          OSERP_PREVIEW_MIGRATE_DIRECT_URL: \${{ secrets.OSERP_PREVIEW_MIGRATE_DIRECT_URL }}
          OSERP_PREVIEW_PREFLIGHT_RO_URL: \${{ secrets.OSERP_PREVIEW_PREFLIGHT_RO_URL }}
          OSERP_SESSION_SALT_ID: \${{ secrets.OSERP_SESSION_SALT_ID }}
        run: node scripts/uboq/cloud-runner-execute.cjs

      - name: Upload sanitized verification receipts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: uboq-preview-rc-v1-receipts
          path: receipts/*.json
          if-no-files-found: error
`;
    fs.writeFileSync(path.join(wfDir, WORKFLOW_FILE), workflowYaml, 'utf8');

    const copyExact = (relPath) => {
      const dst = path.join(tmpDir, relPath);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.writeFileSync(dst, fs.readFileSync(relPath));
    };

    copyExact('prisma/managed-pg18-rc-v1/schema.prisma');
    for (const m of rcDisk) {
      copyExact(`prisma/managed-pg18-rc-v1/migrations/${m.migrationName}/migration.sql`);
    }
    if (fs.existsSync('prisma/managed-pg18-rc-v1/migrations/migration_lock.toml')) {
      copyExact('prisma/managed-pg18-rc-v1/migrations/migration_lock.toml');
    }
    copyExact('artifacts/uboq/managed-pg18-rc-v1/rc-v1-checksum-manifest.json');
    copyExact('artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json');
    copyExact('artifacts/uboq/release-readiness/migration39-apply.json');
    copyExact('scripts/uboq/verify-migration14-provenance-gate.cjs');
    copyExact('scripts/uboq/verify-managed-pg18-rc-v1-gate.cjs');
    copyExact('scripts/uboq/cloud-runner-execute.cjs');

    fs.writeFileSync(
      path.join(tmpDir, 'runner-authority-bundle.json'),
      JSON.stringify(
        {
          ckpt1EvaluatedAt: ckpt1.evaluatedAt,
          m14Disk,
          m14Authority,
          rcAuthority,
        },
        null,
        2
      ) + '\n',
      'utf8'
    );

    // Verify staged RC hashes & assert ZERO secrets exist in staged files before git push
    for (const m of rcDisk) {
      const stagedPath = path.join(
        tmpDir,
        'prisma/managed-pg18-rc-v1/migrations',
        m.migrationName,
        'migration.sql'
      );
      assert.equal(sha256Buf(fs.readFileSync(stagedPath)), m.sha256);
    }
    assert.equal(
      rcDisk[14].sha256,
      'f3398e991a045195a4903f32da2e71897d11c55a09a6edc6a2bbc2bb0bff35c8'
    );

    const scanNoSecrets = (dir) => {
      for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
        if (ent.name === '.git') continue;
        const full = path.join(dir, ent.name);
        if (ent.isDirectory()) scanNoSecrets(full);
        else {
          const s = fs.readFileSync(full, 'utf8');
          assert.equal(/npg_[A-Za-z0-9]{8,}|gho_[A-Za-z0-9]{8,}|vercel_blob_rw_/i.test(s), false, `Secret pattern in ${full}`);
        }
      }
    };
    scanNoSecrets(tmpDir);

    // Commit & push ONLY to isolated private `jburns2372-sys/oserp-uboq-preview-rc-runner`
    const gitInTmp = (gArgs) =>
      execFileSync('git', gArgs, { cwd: tmpDir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8' });
    gitInTmp(['init', '-b', 'main']);
    gitInTmp(['config', 'core.autocrlf', 'false']);
    gitInTmp(['config', 'user.name', 'oserp-uboq-automation']);
    gitInTmp(['config', 'user.email', 'automation@onesystemserp.local']);
    gitInTmp(['add', '.gitattributes']);
    gitInTmp(['add', '.']);
    gitInTmp(['commit', '-m', 'Stage verified MANAGED_PG18_RC_V1 bundle for isolated Preview deploy']);
    const stagedCommitSha = gitInTmp(['rev-parse', 'HEAD']).trim();
    gitInTmp(['remote', 'add', 'isolated', `https://github.com/${RUNNER_REPO}.git`]);
    gitInTmp(['push', '--force', 'isolated', 'main']);
    logStep('STAGED_BUNDLE_PUSHED_TO_ISOLATED_PRIVATE_REPO', {
      repo: RUNNER_REPO,
      stagedCommitSha,
    });

    // 4) Derive migration & preflight URLs in memory and store as masked GitHub Actions secrets
    const neonCred = JSON.parse(
      fs.readFileSync(path.join(os.homedir(), '.config', 'neonctl', 'credentials.json'), 'utf8')
    );
    const neonToken = neonCred.access_token.trim();
    const uriRes = await fetch(
      `https://console.neon.tech/api/v2/projects/${TARGET_PROJECT_ID}/connection_uri?branch_id=${TARGET_BRANCH_ID}&database_name=${TARGET_DB_NAME}&role_name=neondb_owner&pooled=false`,
      {
        headers: { Authorization: `Bearer ${neonToken}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
      }
    );
    assert.equal(uriRes.ok, true, `Neon connection_uri HTTP ${uriRes.status}`);
    const ownerUri = (await uriRes.json()).uri;
    const directHost = new URL(ownerUri).hostname;
    const ownerSecret = decodeURIComponent(new URL(ownerUri).password);

    const deriveHex = (label, len) =>
      Buffer.from(
        crypto.hkdfSync(
          'sha256',
          Buffer.from(ownerSecret, 'utf8'),
          Buffer.from(sessionSaltId, 'hex'),
          Buffer.from(`OSERP_UBOQ_PREVIEW_V1|${label}`, 'utf8'),
          len
        )
      ).toString('hex');

    const migrateAdminPw = deriveHex('oserp_preview_migrate_admin', 24);
    const roPw = deriveHex('oserp_preview_preflight_ro', 24);
    const migrateDirectUrl = `postgresql://oserp_preview_migrate_admin:${migrateAdminPw}@${directHost}:5432/${TARGET_DB_NAME}?sslmode=require`;
    const preflightRoUrl = `postgresql://oserp_preview_preflight_ro:${roPw}@${directHost}:5432/${TARGET_DB_NAME}?sslmode=require`;

    runGh(['secret', 'set', 'OSERP_NEON_API_TOKEN', '--repo', RUNNER_REPO], { input: neonToken });
    runGh(['secret', 'set', 'OSERP_PREVIEW_MIGRATE_DIRECT_URL', '--repo', RUNNER_REPO], { input: migrateDirectUrl });
    runGh(['secret', 'set', 'OSERP_PREVIEW_PREFLIGHT_RO_URL', '--repo', RUNNER_REPO], { input: preflightRoUrl });
    runGh(['secret', 'set', 'OSERP_SESSION_SALT_ID', '--repo', RUNNER_REPO], { input: sessionSaltId });
    logStep('MASKED_SECRETS_STORED_IN_ISOLATED_RUNNER_REPO', {
      secretNames: [
        'OSERP_NEON_API_TOKEN',
        'OSERP_PREVIEW_MIGRATE_DIRECT_URL',
        'OSERP_PREVIEW_PREFLIGHT_RO_URL',
        'OSERP_SESSION_SALT_ID',
      ],
    });

    // 5) Trigger manual `workflow_dispatch` ONCE and poll until completion
    const triggerEpochMs = Date.now() - 5000;
    runGh(['workflow', 'run', WORKFLOW_FILE, '--repo', RUNNER_REPO, '--ref', 'main']);
    logStep('WORKFLOW_DISPATCH_TRIGGERED_ONCE', { workflow: WORKFLOW_FILE });

    let runRecord = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      await new Promise((r) => setTimeout(r, 4000));
      const listOut = runGh([
        'run',
        'list',
        '--repo',
        RUNNER_REPO,
        '--workflow',
        WORKFLOW_FILE,
        '--limit',
        '3',
        '--json',
        'databaseId,status,conclusion,url,createdAt,headSha',
      ]).stdout;
      const runs = JSON.parse(listOut || '[]');
      const match = runs.find(
        (x) => x.headSha === stagedCommitSha || Date.parse(x.createdAt) >= triggerEpochMs
      );
      if (!match) continue;
      runRecord = match;
      if (match.status === 'completed') break;
    }

    assert.ok(runRecord, 'Cloud workflow run was not observed within timeout');
    logStep('WORKFLOW_RUN_COMPLETED', {
      runId: runRecord.databaseId,
      status: runRecord.status,
      conclusion: runRecord.conclusion,
      url: runRecord.url,
    });

    if (runRecord.conclusion !== 'success') {
      const logTail = runGh(
        ['run', 'view', String(runRecord.databaseId), '--repo', RUNNER_REPO, '--log-failed'],
        { allowNonZero: true }
      ).stdout;
      throw new Error(
        `Cloud workflow run ${runRecord.databaseId} concluded with "${runRecord.conclusion}": ${(logTail || '').slice(-1200)}`
      );
    }

    // 6) Download sanitized verification receipts into workspace artifacts
    dlDir = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-rc-cloud-dl-'));
    runGh([
      'run',
      'download',
      String(runRecord.databaseId),
      '--repo',
      RUNNER_REPO,
      '--name',
      'uboq-preview-rc-v1-receipts',
      '--dir',
      dlDir,
    ]);

    const prDir = path.resolve('artifacts/uboq/preview-readiness');
    const ckDir = path.resolve('artifacts/uboq/preview-readiness/checkpoints');
    fs.mkdirSync(prDir, { recursive: true });
    fs.mkdirSync(ckDir, { recursive: true });

    for (const f of [
      'interrupted-25of39-ledger-snapshot.json',
      'clean-baseline-pitr-restore-receipt.json',
      'cloud-runner-summary.json',
    ]) {
      fs.copyFileSync(path.join(dlDir, f), path.join(prDir, f));
    }
    for (const f of [
      'checkpoint-2-m14-and-rc-preflight.json',
      'checkpoint-3-m1-to-m39-deployment.json',
      'checkpoint-4-lockdown-and-checksums.json',
    ]) {
      fs.copyFileSync(path.join(dlDir, f), path.join(ckDir, f));
    }

    const summary = JSON.parse(fs.readFileSync(path.join(prDir, 'cloud-runner-summary.json'), 'utf8'));
    logStep('CLOUD_RECEIPTS_DOWNLOADED_AND_VERIFIED', summary);
  } finally {
    clearTimeout(hardTimer);
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    if (dlDir) fs.rmSync(dlDir, { recursive: true, force: true });
  }
})().catch((err) => {
  console.error(JSON.stringify({ fatal: String(err?.message || err).slice(0, 1200) }));
  process.exitCode = 1;
});
