const s = require('./g02-bounded-support.cjs');
const {
  assertForwardOnlyMigrationReady,
  verifyLedgerAgainstDisk,
} = require('./migration-checksum-guard.cjs');

const MIGRATION35_NAME =
  '20261114000000_wp3_batch_d_d2_r1_ir_rls_and_lineage_hardening';
const MIGRATION35_PATH = `prisma/migrations/${MIGRATION35_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-d-d2-r1/migration35-apply.json';

const MIG35_RLS_TABLES = [
  'AIVariationOrderValidation',
  'ClientVariationOrder',
  'SubcontractorVariationOrder',
  'UboqTreasuryOpeningBalance',
  'VariationOrder',
];

const MIG35_FUNCTIONS = [
  'uboq_authorize_verified_synthetic_cleanup_tx',
  'uboq_build_synthetic_cleanup_manifest',
  'uboq_detect_project_vo_cross_tenant_anomalies',
  'uboq_execute_verified_synthetic_cleanup',
  'uboq_guard_d2_vo_aux_cleanup',
  'uboq_guard_treasury_opening_balance',
  'uboq_is_verified_synthetic_cleanup_row',
  'uboq_read_project_subcontract_package_lineage',
  'uboq_resolve_variation_order_full_project',
];

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 35,
    migration_name: MIGRATION35_NAME,
    migration_path: MIGRATION35_PATH,
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
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_34)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }

    // D2-R1-IR-01: Fail closed on any checksum mismatch across _prisma_migrations;
    // NEVER overwrite _prisma_migrations.checksum via UPDATE on an already-applied migration.
    const readiness = await assertForwardOnlyMigrationReady(c, {
      migrationName: MIGRATION35_NAME,
      migrationPath: MIGRATION35_PATH,
      expectedPriorCount: 34,
    });
    report.migrations_1_to_34_verified = 34;
    report.bytes = readiness.bytes;
    report.sha256 = readiness.sha256;

    if (readiness.status === 'ALREADY_APPLIED_AND_VERIFIED') {
      report.rollback_preflight = 'PASS';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      const sqlText = s.fs.readFileSync(MIGRATION35_PATH, 'utf8');

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
          [MIG35_RLS_TABLES]
        );
        s.assert.equal(rlsCheck.rows.length, MIG35_RLS_TABLES.length);
        for (const r of rlsCheck.rows) {
          s.assert.equal(r.relrowsecurity, true, `RLS not enabled on ${r.relname}`);
          s.assert.equal(r.relforcerowsecurity, true, `FORCE RLS not enabled on ${r.relname}`);
        }

        const publicPols = await c.query(
          `SELECT tablename, policyname, roles::text AS roles_txt
             FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN (
                'ClientVariationOrder',
                'AIVariationOrderValidation',
                'SubcontractorVariationOrder',
                'UboqTreasuryOpeningBalance'
              )
              AND permissive = 'PERMISSIVE'
              AND roles::text LIKE '%public%'`
        );
        s.assert.equal(
          publicPols.rows.length,
          0,
          `Unexpected permissive PUBLIC policies remaining: ${JSON.stringify(publicPols.rows)}`
        );

        const fnCheck = await c.query(
          `SELECT DISTINCT proname
             FROM pg_proc p
             JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND proname = ANY($1)
            ORDER BY proname`,
          [MIG35_FUNCTIONS]
        );
        s.assert.equal(fnCheck.rows.length, MIG35_FUNCTIONS.length, 'Missing Migration #35 functions');
        report.rollback_preflight = 'PASS';
      } finally {
        await c.query('ROLLBACK');
      }

      // Step 2: Forward-only transactional apply + INSERT-only Prisma migration ledger registration
      const startedAt = new Date();
      await c.query('BEGIN');
      try {
        await c.query(sqlText);
        const migId = s.crypto.randomUUID();
        await c.query(
          `INSERT INTO _prisma_migrations (
             id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count
           ) VALUES ($1, $2, $3, $4, NULL, NULL, $5, 1)`,
          [migId, report.sha256, new Date(), MIGRATION35_NAME, startedAt]
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
        '20261114010000_wp3_batch_d_d2_r1_subcon_vo_and_export_log_policy_scope',
        '20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard',
      ],
    });
    s.assert.ok(postAudit.appliedCount >= 35, `Expected >= 35 applied migrations after #35, got ${postAudit.appliedCount}`);
    report.post_apply_migration_count = postAudit.appliedCount;

    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_34)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified post-apply: ${relPath}`);
    }
    report.historical_migrations_1_to_34_unchanged = true;

    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await c.end();
  }
})();
