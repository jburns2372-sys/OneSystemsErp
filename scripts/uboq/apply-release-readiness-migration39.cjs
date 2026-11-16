'use strict';

const s = require('./g02-bounded-support.cjs');
const {
  assertForwardOnlyMigrationReady,
  verifyLedgerAgainstDisk,
} = require('./migration-checksum-guard.cjs');

const MIGRATION39_NAME =
  '20261116020000_uboq_release_readiness_m23_xid_rollover_hardening';
const MIGRATION39_PATH = `prisma/migrations/${MIGRATION39_NAME}/migration.sql`;
const PHASE1_RECEIPT_PATH =
  'artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json';
const OUT_PATH = 'artifacts/uboq/release-readiness/migration39-apply.json';

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 39,
    migration_name: MIGRATION39_NAME,
    migration_path: MIGRATION39_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const phase1Receipt = JSON.parse(s.fs.readFileSync(PHASE1_RECEIPT_PATH, 'utf8'));
    for (const [relPath, expectedSha] of Object.entries(phase1Receipt.migrations_1_to_38)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration #1-#38 modified: ${relPath}`);
    }

    const readiness = await assertForwardOnlyMigrationReady(c, {
      migrationName: MIGRATION39_NAME,
      migrationPath: MIGRATION39_PATH,
      expectedPriorCount: 38,
    });
    report.migrations_1_to_38_verified = 38;
    report.bytes = readiness.bytes;
    report.sha256 = readiness.sha256;

    if (readiness.status === 'ALREADY_APPLIED_AND_VERIFIED') {
      report.rollback_preflight = 'PASS';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      const sqlRaw = s.fs.readFileSync(MIGRATION39_PATH);
      s.assert.equal(
        sqlRaw.includes(Buffer.from('\r\n')),
        false,
        'Migration #39 must use LF line endings'
      );
      const sqlText = sqlRaw.toString('utf8');

      // Step 1: Rollback-contained preflight dry run
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const health = (await c.query('SELECT public.uboq_inspect_xid_rollover_health() AS h'))
          .rows[0].h;
        s.assert.equal(health.healthy, true);
        s.assert.equal(health.legacyXminBigintPolicyCount, 0);
        report.rollback_preflight = 'PASS';
      } finally {
        await c.query('ROLLBACK');
      }

      // Step 2: Two-step Prisma-standard ledger lifecycle (started_at -> finished_at)
      // verifying Migration #38 completion-timestamp immutability remains intact
      const startedAt = new Date();
      await c.query('BEGIN');
      try {
        const migId = s.crypto.randomUUID();
        await c.query(
          `INSERT INTO public."_prisma_migrations" (
             id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
           ) VALUES ($1, $2, NULL, $3, NULL, NULL, $4, 0)`,
          [migId, report.sha256, MIGRATION39_NAME, startedAt]
        );
        await c.query(sqlText);
        await c.query(
          `UPDATE public."_prisma_migrations"
              SET finished_at = $2,
                  applied_steps_count = 1
            WHERE id = $1`,
          [migId, new Date()]
        );
        await c.query('COMMIT');
        report.result = 'APPLIED_AND_VERIFIED';
      } catch (err) {
        await c.query('ROLLBACK');
        throw err;
      }
    }

    const postAudit = await verifyLedgerAgainstDisk(c);
    s.assert.equal(postAudit.appliedCount, 39, `Expected 39 applied migrations, got ${postAudit.appliedCount}`);
    s.assert.equal(postAudit.diskCount, 39, `Expected 39 disk migrations, got ${postAudit.diskCount}`);
    s.assert.equal(postAudit.verifiedMatchCount, 39);

    const stateRow = (
      await c.query('SELECT * FROM public.uboq_verify_prisma_migration_ledger_state()')
    ).rows[0];
    s.assert.deepEqual(stateRow, {
      total_rows: 39,
      finished_active_rows: 39,
      unfinished_or_rolled_back_rows: 0,
      invalid_checksum_rows: 0,
      duplicate_name_groups: 0,
    });

    const publicTableCount = Number(
      (
        await c.query(
          `SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
        )
      ).rows[0].n
    );
    s.assert.equal(publicTableCount, 252, 'Public base table count must remain 252');

    for (const [relPath, expectedSha] of Object.entries(phase1Receipt.migrations_1_to_38)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified post-apply: ${relPath}`);
    }

    report.post_apply_migration_count = 39;
    report.public_table_count = publicTableCount;
    report.ledger_state = stateRow;
    report.historical_migrations_1_to_38_unchanged = true;

    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await c.end();
  }
})();
