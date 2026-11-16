const s = require('./g02-bounded-support.cjs');

const MIGRATION24_NAME = '20261113130000_wp3_increment02_saved_layouts_and_formal_exports';
const MIGRATION24_PATH = `prisma/migrations/${MIGRATION24_NAME}/migration.sql`;
const MIGRATION24_EXPECTED_SHA = 'bfc43cdb1d4d638edf5d38d80451019b3eb925cf6f03c4ffe46143941018aac8';

const MIGRATION25_NAME = '20261113140000_wp3_increment02_audit_auth_and_contract_link';
const MIGRATION25_PATH = `prisma/migrations/${MIGRATION25_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/increment-02/migration25-apply.json';

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 25,
    migration_name: MIGRATION25_NAME,
    migration_path: MIGRATION25_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(s.fs.readFileSync('artifacts/uboq/wp3/increment-02/baseline.json', 'utf8'));
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_23)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }
    const mig24DiskSha = s.hash(s.fs.readFileSync(MIGRATION24_PATH));
    s.assert.equal(mig24DiskSha, MIGRATION24_EXPECTED_SHA, 'Migration #24 modified on disk');

    const ledgerRows = (
      await c.query(
        'SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at ASC, migration_name ASC'
      )
    ).rows;

    for (const m of baseline.ledger_1_to_23) {
      const found = ledgerRows.find((r) => r.migration_name === m.migration_name);
      s.assert.ok(found, `Missing ledger row for ${m.migration_name}`);
      s.assert.equal(found.checksum, m.checksum, `Ledger checksum mismatch for ${m.migration_name}`);
    }
    const found24 = ledgerRows.find((r) => r.migration_name === MIGRATION24_NAME);
    s.assert.ok(found24, 'Missing applied ledger row for migration #24');
    s.assert.equal(found24.checksum, MIGRATION24_EXPECTED_SHA, 'Ledger checksum mismatch for migration #24');
    report.migrations_1_to_24_verified = 24;

    const sqlBytes = s.fs.readFileSync(MIGRATION25_PATH);
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION25_NAME);
    if (alreadyApplied) {
      s.assert.equal(alreadyApplied.checksum, report.sha256, 'Applied migration #25 checksum mismatch');
      report.rollback_preflight = 'ALREADY_VERIFIED';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(ledgerRows.length, 24, `Expected 24 applied migrations prior to #25, got ${ledgerRows.length}`);

      // Step 1: Dry-run rollback preflight
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const colCheck = await c.query(
          `SELECT COUNT(*)::int AS cnt FROM information_schema.columns WHERE table_name = 'UboqOperationalSnapshot' AND column_name = 'contractAuthorityId'`
        );
        s.assert.equal(colCheck.rows[0].cnt, 1);
        const aclCheck = await c.query(
          `SELECT has_table_privilege('oserp_compat_app', '"UboqTemplateAuditEvent"'::regclass, 'INSERT') AS compat_insert`
        );
        s.assert.equal(aclCheck.rows[0].compat_insert, false);
        report.rollback_preflight = 'PASS';
      } finally {
        await c.query('ROLLBACK');
      }

      // Step 2: Atomic forward-only execution + _prisma_migrations recording
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        await c.query(
          'INSERT INTO _prisma_migrations(id, checksum, migration_name, finished_at, applied_steps_count) VALUES ($1, $2, $3, now(), 1)',
          [s.crypto.randomUUID(), report.sha256, MIGRATION25_NAME]
        );
        await c.query('COMMIT');
        report.result = 'PASS_ACTUAL_SQL_EXECUTION';
      } catch (err) {
        await c.query('ROLLBACK');
        report.result = 'FAIL_ROLLED_BACK';
        report.sqlstate = err.code;
        report.error = err.message;
        throw err;
      }
    }

    const postGrants = await c.query(`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
             has_table_privilege('oserp_compat_app', c.oid, 'SELECT') AS compat_select,
             has_table_privilege('oserp_compat_app', c.oid, 'INSERT') AS compat_insert,
             has_table_privilege('oserp_compat_app', c.oid, 'UPDATE') AS compat_update,
             has_table_privilege('oserp_compat_app', c.oid, 'DELETE') AS compat_delete,
             has_table_privilege('oserp_legacy_app', c.oid, 'SELECT') AS legacy_select,
             has_table_privilege('oserp_legacy_app', c.oid, 'INSERT') AS legacy_insert
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname IN ('UboqTemplateDefinition', 'UboqTemplateAuditEvent')
      ORDER BY c.relname
    `);
    const fnGrants = await c.query(`
      SELECT p.proname,
             has_function_privilege('oserp_compat_app', p.oid, 'EXECUTE') AS compat_execute,
             has_function_privilege('oserp_legacy_app', p.oid, 'EXECUTE') AS legacy_execute,
             has_function_privilege('oserp_maint_cleanup_role', p.oid, 'EXECUTE') AS maint_execute
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname IN ('uboq_append_template_audit_event', 'uboq_can_formal_export_template')
      ORDER BY p.proname
    `);
    report.security_posture = postGrants.rows;
    report.function_posture = fnGrants.rows;
    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await c.end();
  }
})().catch((err) => {
  console.error(err.code || 'ERR', err.message);
  process.exitCode = 1;
});

