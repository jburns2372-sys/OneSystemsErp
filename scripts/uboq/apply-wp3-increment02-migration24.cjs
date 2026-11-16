const s = require('./g02-bounded-support.cjs');

const MIGRATION_NAME = '20261113130000_wp3_increment02_saved_layouts_and_formal_exports';
const MIGRATION_PATH = `prisma/migrations/${MIGRATION_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/increment-02/migration24-apply.json';

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 24,
    migration_name: MIGRATION_NAME,
    migration_path: MIGRATION_PATH,
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
    report.migrations_1_to_23_verified = 23;

    const sqlBytes = s.fs.readFileSync(MIGRATION_PATH);
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION_NAME);
    if (alreadyApplied) {
      s.assert.equal(alreadyApplied.checksum, report.sha256, 'Applied migration #24 checksum mismatch');
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(ledgerRows.length, 23, `Expected 23 applied migrations prior to #24, got ${ledgerRows.length}`);

      // Step 1: Dry-run rollback preflight
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const colCheck = await c.query(
          `SELECT COUNT(*)::int AS cnt FROM information_schema.columns WHERE table_name = 'UboqTemplateDefinition' AND column_name IN ('layoutGroupId','supersedesId','duplicatedFromId','sharingScope','definitionHash','changeSummary')`
        );
        s.assert.equal(colCheck.rows[0].cnt, 6);
        const auditCheck = await c.query(`SELECT to_regclass('public."UboqTemplateAuditEvent"')::text AS reg`);
        s.assert.ok(auditCheck.rows[0].reg);
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
          [s.crypto.randomUUID(), report.sha256, MIGRATION_NAME]
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
    report.security_posture = postGrants.rows;
    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await c.end();
  }
})().catch((err) => {
  console.error(err.code || 'ERR', err.message);
  process.exitCode = 1;
});

