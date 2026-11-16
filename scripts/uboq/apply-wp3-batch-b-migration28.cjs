const s = require('./g02-bounded-support.cjs');

const MIGRATION28_NAME = '20261113170000_wp3_batch_b_t5_t7_templates_rls_and_formal_guards';
const MIGRATION28_PATH = `prisma/migrations/${MIGRATION28_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-b/migration28-apply.json';

const BATCH_B_RLS_TABLES = [
  'AwardedBOQItem',
  'Accomplishment',
  'AccomplishmentItem',
  'Inspection',
  'Billing',
  'BillingItem',
  'BillingDeduction',
  'Payment',
  'ScheduleWBS',
  'ScheduleActivity',
  'ScheduleDependency',
  'ScheduleBOQAllocation',
  'ScheduleProgressUpdate',
];

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 28,
    migration_name: MIGRATION28_NAME,
    migration_path: MIGRATION28_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(s.fs.readFileSync('artifacts/uboq/wp3/batch-b/baseline.json', 'utf8'));
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_27)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }

    const ledgerRows = (
      await c.query(
        'SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at ASC, migration_name ASC'
      )
    ).rows;

    for (const m of baseline.ledger_1_to_27) {
      const found = ledgerRows.find((r) => r.migration_name === m.migration_name);
      s.assert.ok(found, `Missing ledger row for ${m.migration_name}`);
      s.assert.equal(found.checksum, m.checksum, `Ledger checksum mismatch for ${m.migration_name}`);
    }
    report.migrations_1_to_27_verified = 27;

    const sqlBytes = s.fs.readFileSync(MIGRATION28_PATH);
    report.bytes = sqlBytes.length;
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION28_NAME);
    if (alreadyApplied) {
      s.assert.equal(alreadyApplied.checksum, report.sha256, 'Applied migration #28 checksum mismatch');
      report.rollback_preflight = 'ALREADY_VERIFIED';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(ledgerRows.length, 27, `Expected 27 applied migrations prior to #28, got ${ledgerRows.length}`);

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
          [BATCH_B_RLS_TABLES]
        );
        s.assert.equal(rlsCheck.rows.length, BATCH_B_RLS_TABLES.length);
        for (const r of rlsCheck.rows) {
          s.assert.equal(r.relrowsecurity, true, `RLS not enabled on ${r.relname}`);
          s.assert.equal(r.relforcerowsecurity, true, `FORCE RLS not enabled on ${r.relname}`);
        }
        const conCheck = await c.query(
          `SELECT pg_get_constraintdef(oid) AS def
             FROM pg_constraint
            WHERE conname = 'chk_uboq_tpl_audit_template_code'
              AND conrelid = 'public."UboqTemplateAuditEvent"'::regclass`
        );
        s.assert.equal(conCheck.rows.length, 1);
        s.assert.ok(conCheck.rows[0].def.includes('T7_SCHEDULE_EVM'));
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
          [s.crypto.randomUUID(), report.sha256, MIGRATION28_NAME]
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

    const batchBRlsPosture = await c.query(
      `SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity,
              has_table_privilege('oserp_compat_app', c.oid, 'SELECT') AS compat_select
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relname = ANY($1)
        ORDER BY c.relname`,
      [[...BATCH_B_RLS_TABLES, 'ProjectSchedule', 'VariationOrder', 'VariationOrderItem', 'ProjectCostLedger', 'UboqTemplateDefinition', 'UboqTemplateAuditEvent']]
    );

    const auditPolicyPosture = await c.query(`
      SELECT polname,
             pg_get_expr(polqual, polrelid) AS using_expr,
             pg_get_expr(polwithcheck, polrelid) AS check_expr
      FROM pg_policy
      WHERE polrelid = 'public."UboqTemplateAuditEvent"'::regclass
      ORDER BY polname
    `);

    const resolverGrants = await c.query(`
      SELECT p.proname,
             has_function_privilege('oserp_compat_app', p.oid, 'EXECUTE') AS compat_execute,
             has_function_privilege('oserp_legacy_app', p.oid, 'EXECUTE') AS legacy_execute,
             has_function_privilege('oserp_maint_cleanup_role', p.oid, 'EXECUTE') AS maint_execute
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN (
          'uboq_resolve_accomplishment_item_project',
          'uboq_resolve_inspection_project',
          'uboq_resolve_billing_project',
          'uboq_resolve_billing_item_project',
          'uboq_resolve_schedule_project',
          'uboq_resolve_schedule_dependency_project',
          'uboq_resolve_schedule_boq_allocation_project',
          'uboq_resolve_schedule_progress_project',
          'uboq_can_read_template_audit_event',
          'uboq_can_formal_export_template'
        )
      ORDER BY p.proname
    `);

    report.post_apply_batch_b_rls_posture = batchBRlsPosture.rows;
    report.post_apply_audit_policies = auditPolicyPosture.rows;
    report.post_apply_resolver_grants = resolverGrants.rows;

    s.fs.mkdirSync('artifacts/uboq/wp3/batch-b', { recursive: true });
    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log('APPLIED MIGRATION #28:', JSON.stringify({ result: report.result, sha256: report.sha256, bytes: report.bytes }));
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
