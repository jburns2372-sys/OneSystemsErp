const s = require('./g02-bounded-support.cjs');
const {
  assertForwardOnlyMigrationReady,
  verifyLedgerAgainstDisk,
} = require('./migration-checksum-guard.cjs');

const MIGRATION35_NAME =
  '20261114000000_wp3_batch_d_d2_r1_ir_rls_and_lineage_hardening';
const MIGRATION35_PATH = `prisma/migrations/${MIGRATION35_NAME}/migration.sql`;
const MIGRATION36_NAME =
  '20261114010000_wp3_batch_d_d2_r1_subcon_vo_and_export_log_policy_scope';
const MIGRATION36_PATH = `prisma/migrations/${MIGRATION36_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-d-d2-r1/migration36-apply.json';

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 36,
    migration_name: MIGRATION36_NAME,
    migration_path: MIGRATION36_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(
      s.fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r1/baseline.json', 'utf8')
    );
    const mig35Receipt = JSON.parse(
      s.fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r1/migration35-apply.json', 'utf8')
    );

    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_34)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }
    s.assert.equal(
      s.hash(s.fs.readFileSync(MIGRATION35_PATH)),
      mig35Receipt.sha256,
      'Migration #35 modified on disk'
    );

    // D2-R1-IR-01: Enforce 1-to-1 SHA-256 checksum parity across _prisma_migrations and fail closed on drift
    const readiness = await assertForwardOnlyMigrationReady(c, {
      migrationName: MIGRATION36_NAME,
      migrationPath: MIGRATION36_PATH,
      expectedPriorCount: 35,
    });
    report.migrations_1_to_35_verified = 35;
    report.bytes = readiness.bytes;
    report.sha256 = readiness.sha256;

    if (readiness.status === 'ALREADY_APPLIED_AND_VERIFIED') {
      report.rollback_preflight = 'PASS';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      const sqlText = s.fs.readFileSync(MIGRATION36_PATH, 'utf8');

      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const pubCheck = await c.query(
          `SELECT tablename, policyname
             FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN ('SubcontractorVariationOrder', 'ClientVariationOrder', 'AIVariationOrderValidation', 'UboqTreasuryOpeningBalance', 'SensitiveExportLog')
              AND 'public' = ANY(roles::text[])`
        );
        s.assert.equal(
          pubCheck.rows.length,
          0,
          `Unexpected PUBLIC policies remaining: ${JSON.stringify(pubCheck.rows)}`
        );
        report.rollback_preflight = 'PASS';
      } finally {
        await c.query('ROLLBACK');
      }

      const startedAt = new Date();
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const migId = s.crypto.randomUUID();
        await c.query(
          `INSERT INTO _prisma_migrations (
             id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
           ) VALUES ($1, $2, $3, $4, NULL, NULL, $5, 1)`,
          [migId, report.sha256, new Date(), MIGRATION36_NAME, startedAt]
        );
        await c.query('COMMIT');
        report.result = 'APPLIED_AND_VERIFIED';
      } catch (err) {
        await c.query('ROLLBACK');
        throw err;
      }
    }

    const postAudit = await verifyLedgerAgainstDisk(c, {
      allowPendingNames: [
        '20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard',
      ],
    });
    s.assert.ok(postAudit.appliedCount >= 36, `Expected >= 36 applied migrations after #36, got ${postAudit.appliedCount}`);
    report.post_apply_migration_count = postAudit.appliedCount;
    report.historical_migrations_1_to_35_unchanged = true;

    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await c.end();
  }
})();
