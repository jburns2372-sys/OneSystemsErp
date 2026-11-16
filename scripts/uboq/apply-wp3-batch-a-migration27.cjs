const s = require('./g02-bounded-support.cjs');

const MIGRATION24_NAME = '20261113130000_wp3_increment02_saved_layouts_and_formal_exports';
const MIGRATION24_PATH = `prisma/migrations/${MIGRATION24_NAME}/migration.sql`;
const MIGRATION24_EXPECTED_SHA = 'bfc43cdb1d4d638edf5d38d80451019b3eb925cf6f03c4ffe46143941018aac8';

const MIGRATION25_NAME = '20261113140000_wp3_increment02_audit_auth_and_contract_link';
const MIGRATION25_PATH = `prisma/migrations/${MIGRATION25_NAME}/migration.sql`;
const MIGRATION25_EXPECTED_SHA = '4cfd19707162a69266f3adc6baf48591a6fd95290036fbfffdf010f97a555448';

const MIGRATION26_NAME = '20261113150000_wp3_batch_a_t2_t4_templates_and_formal_t4_guard';
const MIGRATION26_PATH = `prisma/migrations/${MIGRATION26_NAME}/migration.sql`;
const MIGRATION26_EXPECTED_SHA = 'b15ab3fbcbb770b2f2051b4e824b49ee6e58b2f3e83cd8bf194664bd74dce3ce';

const MIGRATION27_NAME = '20261113160000_wp3_batch_a_audit_select_financial_guard';
const MIGRATION27_PATH = `prisma/migrations/${MIGRATION27_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-a/migration27-apply.json';

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 27,
    migration_name: MIGRATION27_NAME,
    migration_path: MIGRATION27_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(s.fs.readFileSync('artifacts/uboq/wp3/batch-a/baseline.json', 'utf8'));
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_25)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }
    s.assert.equal(s.hash(s.fs.readFileSync(MIGRATION24_PATH)), MIGRATION24_EXPECTED_SHA);
    s.assert.equal(s.hash(s.fs.readFileSync(MIGRATION25_PATH)), MIGRATION25_EXPECTED_SHA);
    s.assert.equal(s.hash(s.fs.readFileSync(MIGRATION26_PATH)), MIGRATION26_EXPECTED_SHA);

    const ledgerRows = (
      await c.query(
        'SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at ASC, migration_name ASC'
      )
    ).rows;

    for (const m of baseline.ledger_1_to_25) {
      const found = ledgerRows.find((r) => r.migration_name === m.migration_name);
      s.assert.ok(found, `Missing ledger row for ${m.migration_name}`);
      s.assert.equal(found.checksum, m.checksum, `Ledger checksum mismatch for ${m.migration_name}`);
    }
    const found26 = ledgerRows.find((r) => r.migration_name === MIGRATION26_NAME);
    s.assert.ok(found26, `Missing ledger row for ${MIGRATION26_NAME}`);
    s.assert.equal(found26.checksum, MIGRATION26_EXPECTED_SHA, `Ledger checksum mismatch for ${MIGRATION26_NAME}`);
    report.migrations_1_to_26_verified = 26;

    const sqlBytes = s.fs.readFileSync(MIGRATION27_PATH);
    report.bytes = sqlBytes.length;
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION27_NAME);
    if (alreadyApplied) {
      s.assert.equal(alreadyApplied.checksum, report.sha256, 'Applied migration #27 checksum mismatch');
      report.rollback_preflight = 'ALREADY_VERIFIED';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(ledgerRows.length, 26, `Expected 26 applied migrations prior to #27, got ${ledgerRows.length}`);

      // Step 1: Dry-run rollback preflight
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const polDef = await c.query(
          `SELECT pg_get_expr(polqual, polrelid) AS using_expr
             FROM pg_policy
            WHERE polname = 'rls_restrictive_uboq_tpl_audit_tenant'
              AND polrelid = 'public."UboqTemplateAuditEvent"'::regclass`
        );
        s.assert.equal(polDef.rows.length, 1);
        s.assert.ok(polDef.rows[0].using_expr.includes('uboq_can_read_template_audit_event'));
        const aclCheck = await c.query(
          `SELECT has_table_privilege('oserp_compat_app', '"UboqTemplateAuditEvent"'::regclass, 'INSERT') AS compat_insert,
                  has_table_privilege('oserp_compat_app', '"UboqTemplateAuditEvent"'::regclass, 'SELECT') AS compat_select`
        );
        s.assert.equal(aclCheck.rows[0].compat_insert, false);
        s.assert.equal(aclCheck.rows[0].compat_select, true);
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
          [s.crypto.randomUUID(), report.sha256, MIGRATION27_NAME]
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
    const policyPosture = await c.query(`
      SELECT polname,
             pg_get_expr(polqual, polrelid) AS using_expr,
             pg_get_expr(polwithcheck, polrelid) AS check_expr
      FROM pg_policy
      WHERE polrelid = 'public."UboqTemplateAuditEvent"'::regclass
      ORDER BY polname
    `);
    const fnGrants = await c.query(`
      SELECT p.proname,
             has_function_privilege('oserp_compat_app', p.oid, 'EXECUTE') AS compat_execute,
             has_function_privilege('oserp_legacy_app', p.oid, 'EXECUTE') AS legacy_execute,
             has_function_privilege('oserp_maint_cleanup_role', p.oid, 'EXECUTE') AS maint_execute
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN (
          'uboq_append_template_audit_event',
          'uboq_can_formal_export_template',
          'uboq_can_read_template_audit',
          'uboq_can_read_template_audit_event',
          'uboq_can_share_template_layout',
          'uboq_can_write_template_layout'
        )
      ORDER BY p.proname
    `);
    report.security_posture = postGrants.rows;
    report.policy_posture = policyPosture.rows;
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
