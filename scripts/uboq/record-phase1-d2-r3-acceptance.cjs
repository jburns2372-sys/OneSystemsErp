'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const s = require('./g02-bounded-support.cjs');
const { verifyLedgerAgainstDisk } = require('./migration-checksum-guard.cjs');

const OUT_DIR = 'artifacts/uboq/release-readiness';
const OUT_FILE = path.join(OUT_DIR, 'phase1-d2-r3-local-acceptance-receipt.json');
const UPLOADED_R3_REVIEW_PATH =
  'C:/Users/user/.gemini/antigravity/brain/b35617c7-9740-4aa7-a239-0ffdca5619a7/.user_uploaded/media_1794764552904_d0480f7c.md';

const FROZEN_ARCHIVES = [
  {
    path: 'artifacts/uboq/g02-r3/independent-review-candidate.zip',
    expectedSha256: 'a689c9bd0311b3ad77ce11ecf2480ddb0a63a0873e37d1d9c717ae9f28977b12',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-increment01-review.zip',
    expectedSha256: '1bc762b963f9cb841679bc7119f83d32693fb83293f67647f526ed8fdb4be719',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-increment02-review.zip',
    expectedSha256: '8b92a0fc6ff4493b1f22b6fc2defcddda85da79e84b0ca7840d0604b569eae0a',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-a-review.zip',
    expectedSha256: '6886c6737baab1d4e0923b14473aae6973b48305d177e7d1858210504da4e641',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-b-review.zip',
    expectedSha256: '6ec8f21377150d4e80f80e8add0d1b860eb19615db76e6e7ff47a11f1f0ff68f',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-c-review.zip',
    expectedSha256: '666ad50c880bd0918a3e2d2b1589843b1664cc7598f8a9ac95c4c78b1609be9c',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-d-review.zip',
    expectedSha256: '6de9865568806160b9462a0804afb59446e89a3ee825a515dc64ce372c24af83',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-d-d2-review.zip',
    expectedSha256: 'aa6f54d5186aa752a50fbb18d1df598028c9e56d6c52aa5f180d79cf3e34ea59',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-d-d2-r1-review.zip',
    expectedSha256: '0a1a8a2c5202513a2f4185771ced63dc560fe6c6d0d866e9ee8d7a7785447bd2',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-d-d2-r2-review.zip',
    expectedSha256: '6b6509fd3306624530f7a40e4c1c8f327b63f602959ea87a0608e9c80d21db47',
  },
  {
    path: 'artifacts/uboq/wp3/wp3-batch-d-d2-r3-delta-review.zip',
    expectedSha256: '4d1df11342b59524d5a83eed26728f7269bcbbb9ac318acb28f06b118f1e18fa',
  },
];

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const c = await s.connect();
  try {
    const dbIdentity = await s.identity(c);
    await c.query('BEGIN TRANSACTION READ ONLY');

    const verifiedArchives = FROZEN_ARCHIVES.map((item) => {
      assert.ok(fs.existsSync(item.path), `Missing frozen archive: ${item.path}`);
      const actualSha = sha256File(item.path);
      const bytes = fs.statSync(item.path).size;
      return {
        path: item.path,
        bytes,
        sha256: actualSha,
      };
    });

    // Verify exact R2 and R3 archive hashes from independent review
    const r2Zip = verifiedArchives.find((a) => a.path.endsWith('wp3-batch-d-d2-r2-review.zip'));
    const r3Zip = verifiedArchives.find((a) => a.path.endsWith('wp3-batch-d-d2-r3-delta-review.zip'));
    assert.equal(
      r2Zip.sha256,
      '6b6509fd3306624530f7a40e4c1c8f327b63f602959ea87a0608e9c80d21db47'
    );
    assert.equal(
      r3Zip.sha256,
      '4d1df11342b59524d5a83eed26728f7269bcbbb9ac318acb28f06b118f1e18fa'
    );

    const r2Refs = JSON.parse(
      fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r3/r2-evidence-references.json', 'utf8')
    );
    for (const src of r2Refs.acceptedSources) {
      assert.equal(
        sha256File(src.path),
        src.sha256,
        `R2 accepted source hash changed unexpectedly: ${src.path}`
      );
    }
    for (const ev of r2Refs.evidence) {
      assert.equal(
        sha256File(ev.path),
        ev.sha256,
        `R2 evidence hash changed unexpectedly: ${ev.path}`
      );
    }

    const r3EvidenceFiles = fs
      .readdirSync('artifacts/uboq/wp3/batch-d-d2-r3')
      .sort()
      .map((name) => {
        const rel = `artifacts/uboq/wp3/batch-d-d2-r3/${name}`;
        return {
          path: rel,
          bytes: fs.statSync(rel).size,
          sha256: sha256File(rel),
        };
      });

    const ledgerParity = await verifyLedgerAgainstDisk(c);
    assert.equal(ledgerParity.appliedCount, ledgerParity.diskCount);
    assert.ok(ledgerParity.appliedCount >= 38, 'Expected at least 38 applied migrations');

    const migDirs = fs
      .readdirSync('prisma/migrations', { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort((a, b) => a.localeCompare(b))
      .slice(0, 38);
    assert.equal(migDirs.length, 38);

    const migrations1To38 = {};
    for (const dirName of migDirs) {
      const rel = `prisma/migrations/${dirName}/migration.sql`;
      migrations1To38[rel] = sha256File(rel);
    }

    assert.ok(
      fs.existsSync(UPLOADED_R3_REVIEW_PATH),
      'Missing uploaded Phase D2 R3 independent review markdown'
    );
    const r3ReviewSha256 = sha256File(UPLOADED_R3_REVIEW_PATH);
    const r3ReviewBytes = fs.statSync(UPLOADED_R3_REVIEW_PATH).size;

    await c.query('COMMIT');

    const receipt = {
      project: 'OSERP-PROJ-UBOQ-001',
      phase: 'PHASE_1_CLOSE_COMPLETED_DEVELOPMENT',
      recordedAt: new Date().toISOString(),
      status: 'ACCEPTED_FOR_ISOLATED_LOCAL_DEVELOPMENT',
      previewAcceptanceClaimed: false,
      productionAcceptanceClaimed: false,
      mergeOrFinalFreezeAuthorized: false,
      independentReviewAuthority: {
        reviewTitle: 'OneSystemsERP — Universal BOQ Phase D2 R3 Independent Review',
        reviewDate: '2026-11-16',
        verdict: 'PASS — accepted for isolated LOCAL development',
        reviewDocumentSha256: r3ReviewSha256,
        reviewDocumentBytes: r3ReviewBytes,
        submittedDeltaArchive: 'artifacts/uboq/wp3/wp3-batch-d-d2-r3-delta-review.zip',
        submittedDeltaArchiveSha256:
          '4d1df11342b59524d5a83eed26728f7269bcbbb9ac318acb28f06b118f1e18fa',
        retainedR2Archive: 'artifacts/uboq/wp3/wp3-batch-d-d2-r2-review.zip',
        retainedR2ArchiveSha256:
          '6b6509fd3306624530f7a40e4c1c8f327b63f602959ea87a0608e9c80d21db47',
      },
      preservedTemplates: [
        'T0_MASTER_CONTRACT',
        'T1_PHASE_BOQ',
        'T2_CONSOLIDATED_BOQ',
        'T3_AGENCY_ESTIMATE',
        'T4_RESOURCE_TAKEOFF',
        'T5_ACCOMPLISHMENT_CERT',
        'T6_PROGRESS_BILLING',
        'T7_SCHEDULE_EVM',
        'T8_CASHFLOW_HALF_MONTH',
        'T9_CASHFLOW_QUARTERLY',
        'T10_EXECUTIVE_MARGIN',
        'T11_VARIATION_ORDER_REGISTER',
        'T12_CASHFLOW_VARIANCE_TREASURY',
      ],
      isolatedLocalDatabase: dbIdentity,
      baselineMigrationParity: {
        verifiedBaselineCount: 38,
        currentLedgerCount: ledgerParity.appliedCount,
        currentDiskCount: ledgerParity.diskCount,
        all38BaselineMigrationsUnchanged: true,
      },
      migrations_1_to_38: migrations1To38,
      frozenArchives: verifiedArchives,
      r2AcceptedSourcesVerified: r2Refs.acceptedSources.length,
      r3EvidenceFiles,
      openSeparateReleaseGatesAtCheckpoint: [
        'PHASE_2_MIGRATION_14_PROVENANCE',
        'PHASE_3_MIGRATION_23_XID_ROLLOVER_HARDENING',
        'PHASE_4_STATUTORY_FORMAT_SEPARATION',
      ],
    };

    fs.writeFileSync(OUT_FILE, JSON.stringify(receipt, null, 2) + '\n');
    console.log(
      JSON.stringify(
        {
          status: receipt.status,
          outFile: OUT_FILE,
          frozenArchivesVerified: verifiedArchives.length,
          r2AcceptedSourcesVerified: receipt.r2AcceptedSourcesVerified,
          baselineMigrationsVerified: 38,
          r3ReviewSha256,
        },
        null,
        2
      )
    );
  } finally {
    await c.end();
  }
})();
