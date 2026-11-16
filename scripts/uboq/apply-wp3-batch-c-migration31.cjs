const s = require('./g02-bounded-support.cjs');

const MIGRATION30_NAME =
  '20261113190000_wp3_batch_c_t8_t10_templates_and_commitment_cashflow_rls';
const MIGRATION30_PATH = `prisma/migrations/${MIGRATION30_NAME}/migration.sql`;
const EXPECTED_MIG30_SHA256 =
  '4e99b7ab8a22793316fd1e23bf0a47c6c7b345e597d0f7e5d40cf64578724c9b';

const MIGRATION31_NAME =
  '20261113200000_wp3_batch_c_ir_receipt_budget_and_export_audit_hardening';
const MIGRATION31_PATH = `prisma/migrations/${MIGRATION31_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-c/migration31-apply.json';

const MIG31_RLS_TABLES = [
  'UboqClientReceipt',
  'UboqClientReceiptAllocation',
  'UboqContractorTargetBudget',
  'SensitiveExportLog',
];

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 31,
    migration_name: MIGRATION31_NAME,
    migration_path: MIGRATION31_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(
      s.fs.readFileSync('artifacts/uboq/wp3/batch-c/baseline.json', 'utf8')
    );
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_29)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }
    const mig30ActualSha = s.hash(s.fs.readFileSync(MIGRATION30_PATH));
    s.assert.equal(mig30ActualSha, EXPECTED_MIG30_SHA256, 'Migration #30 modified on disk');

    const ledgerRows = (
      await c.query(
        'SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at ASC, migration_name ASC'
      )
    ).rows;

    for (const m of baseline.ledger_1_to_29) {
      const found = ledgerRows.find((r) => r.migration_name === m.migration_name);
      s.assert.ok(found, `Missing ledger row for ${m.migration_name}`);
      s.assert.equal(found.checksum, m.checksum, `Ledger checksum mismatch for ${m.migration_name}`);
    }
    const found30 = ledgerRows.find((r) => r.migration_name === MIGRATION30_NAME);
    s.assert.ok(found30, 'Missing ledger row for Migration #30');
    s.assert.equal(found30.checksum, EXPECTED_MIG30_SHA256, 'Ledger checksum mismatch for Migration #30');
    report.migrations_1_to_30_verified = 30;

    const sqlBytes = s.fs.readFileSync(MIGRATION31_PATH);
    report.bytes = sqlBytes.length;
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION31_NAME);
    if (alreadyApplied && alreadyApplied.checksum === report.sha256) {
      report.rollback_preflight = 'PASS';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(
        ledgerRows.length,
        alreadyApplied ? 31 : 30,
        `Unexpected applied migration count prior to #31: ${ledgerRows.length}`
      );

      // Step 1: Dry-run rollback preflight
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const rlsCheck = await c.query(
          `SELECT relname, relrowsecurity, relforcerowsecurity
             FROM pg_class c
             JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'public' AND relname = ANY($1)
            ORDER BY relname`,
          [MIG31_RLS_TABLES]
        );
        s.assert.equal(rlsCheck.rows.length, MIG31_RLS_TABLES.length);
        for (const r of rlsCheck.rows) {
          s.assert.equal(r.relrowsecurity, true, `RLS not enabled on ${r.relname}`);
          s.assert.equal(r.relforcerowsecurity, true, `FORCE RLS not enabled on ${r.relname}`);
        }
        const fnCheck = await c.query(
          `SELECT proname FROM pg_proc p
             JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND proname = 'uboq_append_sensitive_export_log'`
        );
        s.assert.equal(fnCheck.rows.length, 1);
        report.rollback_preflight = 'PASS';
      } finally {
        await c.query('ROLLBACK');
      }

      // Step 2: Transactional forward-only apply + _prisma_migrations ledger record
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        if (alreadyApplied) {
          await c.query(
            `UPDATE _prisma_migrations SET checksum = $1, finished_at = clock_timestamp() WHERE migration_name = $2`,
            [report.sha256, MIGRATION31_NAME]
          );
        } else {
          await c.query(
            `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
             VALUES ($1, $2, clock_timestamp(), $3, '', NULL, clock_timestamp(), 1)`,
            [s.crypto.randomUUID(), report.sha256, MIGRATION31_NAME]
          );
        }
        await c.query('COMMIT');
        report.result = 'APPLIED_AND_VERIFIED';
      } catch (err) {
        await c.query('ROLLBACK');
        throw err;
      }
    }

    const finalLedger = (
      await c.query(
        'SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at ASC, migration_name ASC'
      )
    ).rows;
    s.assert.equal(finalLedger.length, 31, `Expected 31 applied migrations, got ${finalLedger.length}`);
    report.final_ledger_count = finalLedger.length;

    const finalPolicies = await c.query(
      `SELECT c.relname AS table_name,
              c.relrowsecurity AS rls_enabled,
              c.relforcerowsecurity AS force_rls,
              p.polname AS policy_name,
              p.polpermissive AS permissive,
              p.polcmd AS cmd
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         LEFT JOIN pg_policy p ON p.polrelid = c.oid
        WHERE n.nspname = 'public' AND c.relname = ANY($1)
        ORDER BY c.relname, p.polname`,
      [MIG31_RLS_TABLES]
    );
    report.migration31_rls_policies = finalPolicies.rows;

    // Re-verify Migrations #1-#30 byte-for-byte post-apply
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_29)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified post-apply: ${relPath}`);
    }
    s.assert.equal(
      s.hash(s.fs.readFileSync(MIGRATION30_PATH)),
      EXPECTED_MIG30_SHA256,
      'Migration #30 modified post-apply'
    );
    report.migrations_1_to_30_preserved_post_apply = true;

    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log('Migration #31 applied and verified:', report.result, 'sha256=' + report.sha256);
  } finally {
    await c.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
