'use strict';

/**
 * TASK 1 — Build Separately Versioned Managed-PG18 Release-Candidate Migration Set (`managed-pg18-rc-v1`)
 *
 * Strictly preserves:
 * - Original `prisma/migrations/**` (including original Migration #15 bytes & SHA-256)
 * - `artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json`
 * - `artifacts/uboq/release-readiness/migration39-apply.json`
 * - `scripts/uboq/verify-migration14-provenance-gate.cjs`
 * - All frozen review ZIP archives
 *
 * Materializes `prisma/managed-pg18-rc-v1/` (`schema.prisma` + 39 migrations) where ONLY
 * lines 29-32 of Migration #15 omit the redundant `NOSUPERUSER` keyword rejected by
 * PostgreSQL 16-18 `AlterRole()` when `rolsuper = false` on managed cloud PostgreSQL.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const ORIGIN_MAIN_COMMIT = 'd08740b50d2c0eee9110497f247e213c20d0e06e';
const PHASE1_RECEIPT_PATH = 'artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json';
const PHASE1_RECEIPT_SHA256 = 'f67634b39f9f2bf6e48ebd5b30b491de15d67614291bf27a9e47f65c57236070';
const M39_RECEIPT_PATH = 'artifacts/uboq/release-readiness/migration39-apply.json';
const M39_RECEIPT_SHA256 = 'fb74b7dce2d224fe5d0ec6cc154f608ffe315e25e82b135fc7099b285e61b5db';
const M14_CLASSIFIER_PATH = 'scripts/uboq/verify-migration14-provenance-gate.cjs';
const M14_CLASSIFIER_SHA256 = 'bea84029e746521207dac5fde86872a7abc1c43e5b8ce83802ca51d121ac1f5b';
const M14_CLASSIFIER_ARCHIVE_PATH = 'artifacts/uboq/wp3/uboq-m14-classifier-final-review.zip';
const M14_CLASSIFIER_ARCHIVE_SHA256 = '0fb31f0c67f59324c01773db981be96e0511a45fe860a9e2deb017d85f8f97a0';

const MIG15_NAME = '20261104233000_uboq_g02_remediation_hardening';
const RC_VERSION = 'MANAGED_PG18_RC_V1';
const RC_PRISMA_DIR = 'prisma/managed-pg18-rc-v1';
const RC_MIGRATIONS_DIR = `${RC_PRISMA_DIR}/migrations`;
const OUT_DIR = 'artifacts/uboq/managed-pg18-rc-v1';
const MANIFEST_PATH = `${OUT_DIR}/rc-v1-checksum-manifest.json`;
const DIFF_PATH = `${OUT_DIR}/migration15-rc-v1.diff`;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function comparePrismaMigrationNames(aName, bName) {
  const aPrefix = aName.split('_')[0];
  const bPrefix = bName.split('_')[0];
  if (aPrefix !== bPrefix) return aPrefix < bPrefix ? -1 : 1;
  if (aName === bName) return 0;
  return aName < bName ? -1 : 1;
}

function main() {
  // 1) Verify historical receipts and frozen archives are 100% untouched before building RC
  assert.equal(sha256(fs.readFileSync(PHASE1_RECEIPT_PATH)), PHASE1_RECEIPT_SHA256);
  assert.equal(sha256(fs.readFileSync(M39_RECEIPT_PATH)), M39_RECEIPT_SHA256);
  assert.equal(sha256(fs.readFileSync(M14_CLASSIFIER_PATH)), M14_CLASSIFIER_SHA256);
  assert.equal(sha256(fs.readFileSync(M14_CLASSIFIER_ARCHIVE_PATH)), M14_CLASSIFIER_ARCHIVE_SHA256);

  const phase1 = JSON.parse(fs.readFileSync(PHASE1_RECEIPT_PATH, 'utf8'));
  const m39 = JSON.parse(fs.readFileSync(M39_RECEIPT_PATH, 'utf8'));
  for (const arch of phase1.frozenArchives) {
    assert.equal(sha256(fs.readFileSync(arch.path)), arch.sha256, `Frozen archive modified: ${arch.path}`);
  }

  const originMainHead = execFileSync('git', ['rev-parse', 'origin/main'], { encoding: 'utf8' }).trim();
  assert.equal(originMainHead, ORIGIN_MAIN_COMMIT);
  const originMigrations = execFileSync(
    'git',
    ['ls-tree', '-r', '--name-only', ORIGIN_MAIN_COMMIT, '--', 'prisma/migrations'],
    { encoding: 'utf8' }
  )
    .trim()
    .split(/\r?\n/)
    .filter((p) => p.endsWith('/migration.sql'))
    .sort();
  assert.equal(originMigrations.length, 8);
  assert.equal(
    originMigrations.some((p) => p.includes(MIG15_NAME)),
    false,
    'Origin/main must not contain Migration #15'
  );

  const historicalHashes = {
    ...phase1.migrations_1_to_38,
    [m39.migration_path]: m39.sha256,
  };
  const sortedRelPaths = Object.keys(historicalHashes).sort((a, b) =>
    comparePrismaMigrationNames(a.split('/')[2], b.split('/')[2])
  );
  assert.equal(sortedRelPaths.length, 39);

  // Verify every single file in `prisma/migrations` is unchanged
  for (const rel of sortedRelPaths) {
    assert.equal(
      sha256(fs.readFileSync(rel)),
      historicalHashes[rel],
      `Historical migration modified unexpectedly: ${rel}`
    );
  }

  // 2) Materialize `prisma/managed-pg18-rc-v1/` cleanly
  if (fs.existsSync(RC_PRISMA_DIR)) {
    fs.rmSync(RC_PRISMA_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(RC_MIGRATIONS_DIR, { recursive: true });
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const schemaBytes = fs.readFileSync('prisma/schema.prisma');
  fs.writeFileSync(`${RC_PRISMA_DIR}/schema.prisma`, schemaBytes);

  if (fs.existsSync('prisma/migrations/migration_lock.toml')) {
    fs.copyFileSync(
      'prisma/migrations/migration_lock.toml',
      `${RC_MIGRATIONS_DIR}/migration_lock.toml`
    );
  }

  const expectedOrigLines29To32 = [
    'ALTER ROLE oserp_migrations_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE BYPASSRLS;',
    'ALTER ROLE oserp_compat_app NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;',
    'ALTER ROLE oserp_legacy_app NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;',
    'ALTER ROLE oserp_maint_cleanup_role NOLOGIN PASSWORD NULL NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;',
  ];
  const candidateLines29To32 = [
    'ALTER ROLE oserp_migrations_owner NOLOGIN NOCREATEDB NOCREATEROLE BYPASSRLS;',
    'ALTER ROLE oserp_compat_app NOLOGIN PASSWORD NULL NOCREATEDB NOCREATEROLE NOBYPASSRLS;',
    'ALTER ROLE oserp_legacy_app NOLOGIN PASSWORD NULL NOCREATEDB NOCREATEROLE NOBYPASSRLS;',
    'ALTER ROLE oserp_maint_cleanup_role NOLOGIN PASSWORD NULL NOCREATEDB NOCREATEROLE NOBYPASSRLS;',
  ];

  const manifestEntries = [];
  let origM15Sha256 = null;
  let rcM15Sha256 = null;
  let origM15Bytes = 0;
  let rcM15Bytes = 0;

  for (let i = 0; i < sortedRelPaths.length; i += 1) {
    const origRel = sortedRelPaths[i];
    const migName = origRel.split('/')[2];
    const rcRel = `${RC_MIGRATIONS_DIR}/${migName}/migration.sql`;
    fs.mkdirSync(path.dirname(rcRel), { recursive: true });

    const origBytes = fs.readFileSync(origRel);
    const origSha = sha256(origBytes);
    assert.equal(origSha, historicalHashes[origRel]);

    if (migName !== MIG15_NAME) {
      fs.writeFileSync(rcRel, origBytes);
      const rcSha = sha256(fs.readFileSync(rcRel));
      assert.equal(rcSha, origSha);
      manifestEntries.push({
        index: i + 1,
        migrationName: migName,
        historicalPath: origRel,
        candidatePath: rcRel,
        historicalSha256: origSha,
        candidateSha256: rcSha,
        modifiedInCandidate: false,
        bytes: origBytes.length,
      });
    } else {
      assert.equal(origBytes.includes(Buffer.from('\r\n')), false, 'Original M15 expected LF');
      const origLines = origBytes.toString('utf8').split('\n');
      assert.deepEqual(
        origLines.slice(28, 32),
        expectedOrigLines29To32,
        'Unexpected lines 29-32 in original Migration #15'
      );

      const rcLines = [...origLines];
      for (let k = 0; k < 4; k += 1) {
        rcLines[28 + k] = candidateLines29To32[k];
      }

      // Prove every other line is 100% identical
      assert.deepEqual(rcLines.slice(0, 28), origLines.slice(0, 28));
      assert.deepEqual(rcLines.slice(32), origLines.slice(32));

      const rcBuf = Buffer.from(rcLines.join('\n'), 'utf8');
      assert.equal(rcBuf.includes(Buffer.from('\r\n')), false, 'Candidate M15 must use LF');
      fs.writeFileSync(rcRel, rcBuf);

      const rcSha = sha256(fs.readFileSync(rcRel));
      assert.notEqual(rcSha, origSha);
      origM15Sha256 = origSha;
      rcM15Sha256 = rcSha;
      origM15Bytes = origBytes.length;
      rcM15Bytes = rcBuf.length;

      manifestEntries.push({
        index: i + 1,
        migrationName: migName,
        historicalPath: origRel,
        candidatePath: rcRel,
        historicalSha256: origSha,
        candidateSha256: rcSha,
        modifiedInCandidate: true,
        historicalBytes: origBytes.length,
        bytes: rcBuf.length,
        changedLineRange: '29-32',
        removedTokensPerLine: 'NOSUPERUSER ',
      });
    }
  }

  // Generate unified diff (`git diff --no-index` returns exit 1 when files differ)
  let diffText = '';
  try {
    execFileSync(
      'git',
      [
        'diff',
        '--no-index',
        '--unified=5',
        `prisma/migrations/${MIG15_NAME}/migration.sql`,
        `${RC_MIGRATIONS_DIR}/${MIG15_NAME}/migration.sql`,
      ],
      { encoding: 'utf8' }
    );
  } catch (diffErr) {
    if (diffErr.status === 1 && diffErr.stdout) {
      diffText = diffErr.stdout;
    } else {
      throw diffErr;
    }
  }
  fs.writeFileSync(DIFF_PATH, diffText);

  // Re-verify historical Migration #15 and receipts remain 100% untouched after build
  assert.equal(
    sha256(fs.readFileSync(`prisma/migrations/${MIG15_NAME}/migration.sql`)),
    origM15Sha256
  );
  assert.equal(sha256(fs.readFileSync(PHASE1_RECEIPT_PATH)), PHASE1_RECEIPT_SHA256);
  assert.equal(sha256(fs.readFileSync(M39_RECEIPT_PATH)), M39_RECEIPT_SHA256);

  const manifest = {
    project: 'OSERP-PROJ-UBOQ-001',
    releaseCandidateId: RC_VERSION,
    generatedAt: new Date().toISOString(),
    schemaPath: `${RC_PRISMA_DIR}/schema.prisma`,
    schemaSha256: sha256(schemaBytes),
    migrationsDirectory: RC_MIGRATIONS_DIR,
    totalMigrations: 39,
    unchangedMigrationCount: 38,
    modifiedMigrationCount: 1,
    originMainCommitPinned: ORIGIN_MAIN_COMMIT,
    originMainMigrationCount: 8,
    productionContainsMigration15OrCandidateLineage: false,
    preservedHistoricalReceipts: {
      phase1D2R3AcceptanceReceipt: {
        path: PHASE1_RECEIPT_PATH,
        sha256: PHASE1_RECEIPT_SHA256,
        unchanged: true,
      },
      migration39ApplyReceipt: {
        path: M39_RECEIPT_PATH,
        sha256: M39_RECEIPT_SHA256,
        unchanged: true,
      },
      m14ClassifierScript: {
        path: M14_CLASSIFIER_PATH,
        sha256: M14_CLASSIFIER_SHA256,
        verifiedAgainstFrozenArchive: M14_CLASSIFIER_ARCHIVE_PATH,
        unchanged: true,
      },
      m14ClassifierIndependentReviewArchive: {
        path: M14_CLASSIFIER_ARCHIVE_PATH,
        sha256: M14_CLASSIFIER_ARCHIVE_SHA256,
        unchanged: true,
      },
    },
    migration15DeltaReconciliation: {
      migrationIndex: 15,
      migrationName: MIG15_NAME,
      historicalPath: `prisma/migrations/${MIG15_NAME}/migration.sql`,
      historicalSha256: origM15Sha256,
      historicalBytes: origM15Bytes,
      candidatePath: `${RC_MIGRATIONS_DIR}/${MIG15_NAME}/migration.sql`,
      candidateSha256: rcM15Sha256,
      candidateBytes: rcM15Bytes,
      byteDelta: rcM15Bytes - origM15Bytes,
      changedLines: '29-32',
      diffFile: DIFF_PATH,
      diffSha256: sha256(Buffer.from(diffText, 'utf8')),
      whyCandidateDiffersFromLocalHistory:
        'PostgreSQL 16-18 AlterRole() (src/backend/commands/user.c) unconditionally rejects ALTER ROLE statements containing the NOSUPERUSER or SUPERUSER keyword when the executing role has rolsuper = false (SQLSTATE 42501: "Only roles with the SUPERUSER attribute may change the SUPERUSER attribute"). Local acceptance ran against a disposable self-hosted PostgreSQL 18.4 superuser (rolsuper = true), whereas managed Neon PostgreSQL 18 (and all managed cloud PostgreSQL services) enforce rolsuper = false on tenant owner roles. Removing ONLY the redundant NOSUPERUSER keyword on lines 29-32 allows clean execution under rolsuper = false while Migration #14 CREATE ROLE ... NOSUPERUSER and pre/post pg_roles fail-closed checks guarantee rolsuper = false on all governed roles.',
    },
    requiredGroupRolePosture: {
      oserp_migrations_owner: {
        minMigrationIndex: 14,
        rolsuper: false,
        rolcanlogin: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: true,
      },
      oserp_compat_app: {
        minMigrationIndex: 14,
        rolsuper: false,
        rolcanlogin: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false,
      },
      oserp_legacy_app: {
        minMigrationIndex: 14,
        rolsuper: false,
        rolcanlogin: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false,
      },
      oserp_maint_cleanup_role: {
        minMigrationIndex: 14,
        rolsuper: false,
        rolcanlogin: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false,
      },
      oserp_company_payroll_app: {
        minMigrationIndex: 18,
        rolsuper: false,
        rolcanlogin: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false,
      },
      oserp_company_payroll_verifier: {
        minMigrationIndex: 18,
        rolsuper: false,
        rolcanlogin: false,
        rolcreatedb: false,
        rolcreaterole: false,
        rolreplication: false,
        rolbypassrls: false,
      },
    },
    migrations: manifestEntries,
  };

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n');
  console.log(
    JSON.stringify(
      {
        releaseCandidateId: RC_VERSION,
        manifestPath: MANIFEST_PATH,
        historicalM15Sha256: origM15Sha256,
        candidateM15Sha256: rcM15Sha256,
        byteDelta: rcM15Bytes - origM15Bytes,
      },
      null,
      2
    )
  );
}

main();
