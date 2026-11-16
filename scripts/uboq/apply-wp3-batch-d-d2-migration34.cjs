const s = require('./g02-bounded-support.cjs');

const MIGRATION34_NAME =
  '20261113230000_wp3_batch_d_d2_t11_t12_rls_and_formal_guards';
const MIGRATION34_PATH = `prisma/migrations/${MIGRATION34_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-d-d2/migration34-apply.json';

const MIG34_RLS_TABLES = [
  'AIVariationOrderValidation',
  'ClientVariationOrder',
  'SubcontractorVariationOrder',
  'VariationOrder',
  'VariationOrderItem',
];

const MIG34_FUNCTIONS = [
  'uboq_append_sensitive_export_log',
  'uboq_guard_template_audit_event',
  'uboq_guard_template_definition',
  'uboq_resolve_ai_vo_validation_project',
  'uboq_resolve_client_vo_project',
  'uboq_resolve_subcontractor_vo_full_project',
  'uboq_resolve_variation_order_item_full_project',
];

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 34,
    migration_name: MIGRATION34_NAME,
    migration_path: MIGRATION34_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(
      s.fs.readFileSync('artifacts/uboq/wp3/batch-d-d2/baseline.json', 'utf8')
    );
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_33)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }

    const ledgerRows = (
      await c.query(
        'SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at ASC, migration_name ASC'
      )
    ).rows;

    for (const m of baseline.ledger_1_to_33) {
      const found = ledgerRows.find((r) => r.migration_name === m.migration_name);
      s.assert.ok(found, `Missing ledger row for ${m.migration_name}`);
      s.assert.equal(found.checksum, m.checksum, `Ledger checksum mismatch for ${m.migration_name}`);
    }
    report.migrations_1_to_33_verified = 33;

    const sqlBytes = s.fs.readFileSync(MIGRATION34_PATH);
    report.bytes = sqlBytes.length;
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION34_NAME);
    if (alreadyApplied && alreadyApplied.checksum === report.sha256) {
      report.rollback_preflight = 'PASS';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(
        ledgerRows.length,
        alreadyApplied ? 34 : 33,
        `Unexpected applied migration count prior to #34: ${ledgerRows.length}`
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
          [MIG34_RLS_TABLES]
        );
        s.assert.equal(rlsCheck.rows.length, MIG34_RLS_TABLES.length);
        for (const r of rlsCheck.rows) {
          s.assert.equal(r.relrowsecurity, true, `RLS not enabled on ${r.relname}`);
          s.assert.equal(r.relforcerowsecurity, true, `FORCE RLS not enabled on ${r.relname}`);
        }

        const privs = await c.query(
          `SELECT
             has_table_privilege('oserp_compat_app', 'public."ClientVariationOrder"', 'SELECT') AS cvo_select,
             has_table_privilege('oserp_compat_app', 'public."ClientVariationOrder"', 'INSERT') AS cvo_insert,
             has_table_privilege('oserp_compat_app', 'public."ClientVariationOrder"', 'DELETE') AS cvo_delete,
             has_table_privilege('oserp_compat_app', 'public."SensitiveExportLog"', 'INSERT') AS sel_insert,
             has_table_privilege('oserp_compat_app', 'public."UboqTemplateAuditEvent"', 'INSERT') AS utae_insert`
        );
        s.assert.equal(privs.rows[0].cvo_select, true, 'Expected SELECT on ClientVariationOrder');
        s.assert.equal(privs.rows[0].cvo_insert, true, 'Expected INSERT on ClientVariationOrder');
        s.assert.equal(privs.rows[0].cvo_delete, false, 'Direct DELETE must be revoked on ClientVariationOrder');
        s.assert.equal(privs.rows[0].sel_insert, false, 'Direct INSERT must remain revoked on SensitiveExportLog');
        s.assert.equal(privs.rows[0].utae_insert, false, 'Direct INSERT must remain revoked on UboqTemplateAuditEvent');

        const fnCheck = await c.query(
          `SELECT proname, pronargs
             FROM pg_proc p
             JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND proname = ANY($1)
            ORDER BY proname`,
          [MIG34_FUNCTIONS]
        );
        s.assert.equal(fnCheck.rows.length, MIG34_FUNCTIONS.length, 'Missing Migration #34 functions');
        report.rollback_preflight = 'PASS';
      } finally {
        await c.query('ROLLBACK');
      }

      // Step 2: Transactional apply + Prisma migration ledger registration
      const startedAt = new Date();
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const migId = s.crypto.randomUUID();
        if (alreadyApplied) {
          await c.query(
            `UPDATE _prisma_migrations
                SET checksum = $1,
                    finished_at = $2,
                    applied_steps_count = 1,
                    logs = NULL
              WHERE migration_name = $3`,
            [report.sha256, new Date(), MIGRATION34_NAME]
          );
        } else {
          await c.query(
            `INSERT INTO _prisma_migrations (
               id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
             ) VALUES ($1, $2, $3, $4, NULL, NULL, $5, 1)`,
            [migId, report.sha256, new Date(), MIGRATION34_NAME, startedAt]
          );
        }
        await c.query('COMMIT');
        report.result = 'APPLIED_AND_VERIFIED';
      } catch (err) {
        await c.query('ROLLBACK');
        throw err;
      }
    }

    const postLedger = (
      await c.query(
        'SELECT count(*)::int AS cnt FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL'
      )
    ).rows[0].cnt;
    s.assert.equal(postLedger, 34, `Expected 34 applied migrations after #34, got ${postLedger}`);
    report.post_apply_migration_count = postLedger;

    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_33)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified post-apply: ${relPath}`);
    }
    report.historical_migrations_1_to_33_unchanged = true;

    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await c.end();
  }
})();
