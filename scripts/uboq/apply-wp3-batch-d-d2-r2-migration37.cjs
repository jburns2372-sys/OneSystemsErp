const s = require('./g02-bounded-support.cjs');
const {
  assertForwardOnlyMigrationReady,
  verifyLedgerAgainstDisk,
} = require('./migration-checksum-guard.cjs');

const MIGRATION37_NAME =
  '20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard';
const MIGRATION37_PATH = `prisma/migrations/${MIGRATION37_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-d-d2-r2/migration37-apply.json';

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 37,
    migration_name: MIGRATION37_NAME,
    migration_path: MIGRATION37_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(
      s.fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r2/baseline.json', 'utf8')
    );

    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_36)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }

    const readiness = await assertForwardOnlyMigrationReady(c, {
      migrationName: MIGRATION37_NAME,
      migrationPath: MIGRATION37_PATH,
      expectedPriorCount: 36,
    });
    report.migrations_1_to_36_verified = 36;
    report.bytes = readiness.bytes;
    report.sha256 = readiness.sha256;

    if (readiness.status === 'ALREADY_APPLIED_AND_VERIFIED') {
      report.rollback_preflight = 'PASS';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      const sqlRaw = s.fs.readFileSync(MIGRATION37_PATH);
      s.assert.equal(
        sqlRaw.includes(Buffer.from('\r\n')),
        false,
        'Migration #37 must use LF line endings'
      );
      const sqlText = sqlRaw.toString('utf8');

      // Step 1: Rollback preflight dry-run + immutability trigger verification
      await c.query('BEGIN');
      try {
        await c.query(sqlText);

        const trgCheck = await c.query(
          `SELECT tgname
             FROM pg_trigger
            WHERE tgrelid = 'public."_prisma_migrations"'::regclass
              AND NOT tgisinternal
              AND tgname = 'trg_uboq_guard_prisma_migration_ledger'`
        );
        s.assert.equal(trgCheck.rows.length, 1, 'Missing trg_uboq_guard_prisma_migration_ledger trigger');

        // Verify trigger blocks checksum overwrite on an already-applied migration inside savepoint
        await c.query('SAVEPOINT sp_preflight_checksum_mut');
        let mutErrCode = '';
        try {
          await c.query(
            `UPDATE public."_prisma_migrations"
                SET checksum = repeat('0', 64)
              WHERE migration_name = '20261114010000_wp3_batch_d_d2_r1_subcon_vo_and_export_log_policy_scope'`
          );
        } catch (err) {
          mutErrCode = err.code || '';
          await c.query('ROLLBACK TO SAVEPOINT sp_preflight_checksum_mut');
        }
        s.assert.equal(
          mutErrCode,
          '42501',
          `Expected 42501 blocking checksum UPDATE, got ${mutErrCode || 'NO_ERROR'}`
        );

        report.rollback_preflight = 'PASS';
      } finally {
        await c.query('ROLLBACK');
      }

      // Step 2: Forward-only transactional apply + INSERT-only ledger registration
      const startedAt = new Date();
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const migId = s.crypto.randomUUID();
        await c.query(
          `INSERT INTO public."_prisma_migrations" (
             id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
           ) VALUES ($1, $2, $3, $4, NULL, NULL, $5, 1)`,
          [migId, report.sha256, new Date(), MIGRATION37_NAME, startedAt]
        );
        await c.query('COMMIT');
        report.result = 'APPLIED_AND_VERIFIED';
      } catch (err) {
        await c.query('ROLLBACK');
        throw err;
      }
    }

    // Verify 37/37 exact 1-to-1 SHA-256 parity between _prisma_migrations and prisma/migrations/*/migration.sql
    const postAudit = await verifyLedgerAgainstDisk(c);
    s.assert.equal(postAudit.appliedCount, 37, `Expected 37 applied migrations, got ${postAudit.appliedCount}`);
    s.assert.equal(postAudit.diskCount, 37, `Expected 37 disk migrations, got ${postAudit.diskCount}`);
    s.assert.equal(postAudit.verifiedMatchCount, 37);

    const stateRow = (
      await c.query('SELECT * FROM public.uboq_verify_prisma_migration_ledger_state()')
    ).rows[0];
    s.assert.deepEqual(stateRow, {
      total_rows: 37,
      finished_active_rows: 37,
      unfinished_or_rolled_back_rows: 0,
      invalid_checksum_rows: 0,
      duplicate_name_groups: 0,
    });

    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_36)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified post-apply: ${relPath}`);
    }

    report.post_apply_migration_count = 37;
    report.ledger_state = stateRow;
    report.historical_migrations_1_to_36_unchanged = true;

    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await c.end();
  }
})();
