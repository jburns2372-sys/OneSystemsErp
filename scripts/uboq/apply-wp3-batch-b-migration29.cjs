const s = require('./g02-bounded-support.cjs');

const MIGRATION28_NAME = '20261113170000_wp3_batch_b_t5_t7_templates_rls_and_formal_guards';
const MIGRATION28_PATH = `prisma/migrations/${MIGRATION28_NAME}/migration.sql`;
const MIGRATION28_EXPECTED_SHA256 =
  '5efabd58b25f529e588244b67ac2496573d3516f2d716677390a0389353b896a';

const MIGRATION29_NAME =
  '20261113180000_wp3_batch_b_ir_historical_snapshot_and_inspection_guards';
const MIGRATION29_PATH = `prisma/migrations/${MIGRATION29_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-b/migration29-apply.json';

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 29,
    migration_name: MIGRATION29_NAME,
    migration_path: MIGRATION29_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(
      s.fs.readFileSync('artifacts/uboq/wp3/batch-b/baseline.json', 'utf8')
    );
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_27)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }
    const mig28DiskSha = s.hash(s.fs.readFileSync(MIGRATION28_PATH));
    s.assert.equal(
      mig28DiskSha,
      MIGRATION28_EXPECTED_SHA256,
      `Historical migration #28 modified: ${MIGRATION28_PATH}`
    );

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
    const found28 = ledgerRows.find((r) => r.migration_name === MIGRATION28_NAME);
    s.assert.ok(found28, `Missing ledger row for ${MIGRATION28_NAME}`);
    s.assert.equal(
      found28.checksum,
      MIGRATION28_EXPECTED_SHA256,
      `Ledger checksum mismatch for ${MIGRATION28_NAME}`
    );
    report.migrations_1_to_28_verified = 28;

    const sqlBytes = s.fs.readFileSync(MIGRATION29_PATH);
    report.bytes = sqlBytes.length;
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION29_NAME);
    if (alreadyApplied) {
      s.assert.equal(alreadyApplied.checksum, report.sha256, 'Applied migration #29 checksum mismatch');
      report.rollback_preflight = 'ALREADY_VERIFIED';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(
        ledgerRows.length,
        28,
        `Expected 28 applied migrations prior to #29, got ${ledgerRows.length}`
      );

      // Step 1: Dry-run rollback preflight
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const fnCheck = await c.query(`
          SELECT p.proname,
                 pg_get_userbyid(p.proowner) AS owner_name,
                 p.prosecdef,
                 has_function_privilege('public', p.oid, 'EXECUTE') AS public_execute,
                 pg_get_functiondef(p.oid) AS def_text
          FROM pg_proc p
          JOIN pg_namespace n ON n.oid = p.pronamespace
          WHERE n.nspname = 'public'
            AND p.proname = 'uboq_guard_template_audit_event'
        `);
        s.assert.equal(fnCheck.rows.length, 1);
        s.assert.equal(fnCheck.rows[0].owner_name, 'oserp_migrations_owner');
        s.assert.equal(fnCheck.rows[0].prosecdef, true);
        s.assert.equal(fnCheck.rows[0].public_execute, false);
        s.assert.ok(
          fnCheck.rows[0].def_text.includes('UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_POSTDATED')
        );
        s.assert.ok(
          fnCheck.rows[0].def_text.includes('UBOQ_TEMPLATE_AUDIT_INSPECTION_QTY_INSUFFICIENT')
        );
        s.assert.ok(
          fnCheck.rows[0].def_text.includes('UBOQ_TEMPLATE_AUDIT_DUPLICATE_INSPECTION_LINKAGE')
        );
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
          [s.crypto.randomUUID(), report.sha256, MIGRATION29_NAME]
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

    const fnPosture = await c.query(`
      SELECT p.proname,
             pg_get_userbyid(p.proowner) AS owner_name,
             p.prosecdef,
             has_function_privilege('public', p.oid, 'EXECUTE') AS public_execute,
             has_function_privilege('oserp_compat_app', p.oid, 'EXECUTE') AS compat_execute
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname IN ('uboq_guard_template_audit_event', 'uboq_append_template_audit_event')
      ORDER BY p.proname
    `);

    const auditTablePosture = await c.query(`
      SELECT c.relname,
             c.relrowsecurity,
             c.relforcerowsecurity,
             has_table_privilege('oserp_compat_app', c.oid, 'SELECT') AS compat_select,
             has_table_privilege('oserp_compat_app', c.oid, 'INSERT') AS compat_insert,
             has_table_privilege('oserp_compat_app', c.oid, 'UPDATE') AS compat_update,
             has_table_privilege('oserp_compat_app', c.oid, 'DELETE') AS compat_delete
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = 'UboqTemplateAuditEvent'
    `);

    const totalApplied = (
      await c.query(
        'SELECT count(*)::int AS cnt FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'
      )
    ).rows[0].cnt;

    report.post_apply_function_posture = fnPosture.rows;
    report.post_apply_audit_table_posture = auditTablePosture.rows;
    report.total_applied_migrations = totalApplied;

    s.fs.mkdirSync('artifacts/uboq/wp3/batch-b', { recursive: true });
    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(
      'APPLIED MIGRATION #29:',
      JSON.stringify({
        result: report.result,
        sha256: report.sha256,
        bytes: report.bytes,
        totalApplied,
      })
    );
  } finally {
    await c.end();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
