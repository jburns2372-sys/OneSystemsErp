const s = require('./g02-bounded-support.cjs');

const MIGRATION33_NAME =
  '20261113220000_wp3_batch_d_signed_t0_t1_roundtrip_import';
const MIGRATION33_PATH = `prisma/migrations/${MIGRATION33_NAME}/migration.sql`;
const OUT_PATH = 'artifacts/uboq/wp3/batch-d/migration33-apply.json';

const MIG33_RLS_TABLES = [
  'UboqSignedRoundTripPackage',
  'UboqRoundTripImportSubmission',
];

const MIG33_FUNCTIONS = [
  'uboq_actor_can_stage_roundtrip_import',
  'uboq_actor_has_commercial_roundtrip_access',
  'uboq_verify_roundtrip_manifest_signature',
  'uboq_verify_roundtrip_call_attestation',
  'uboq_issue_signed_roundtrip_package',
  'uboq_record_roundtrip_import_submission',
];

(async () => {
  const c = await s.connect();
  const report = {
    created_at: new Date().toISOString(),
    migration_number: 33,
    migration_name: MIGRATION33_NAME,
    migration_path: MIGRATION33_PATH,
  };
  try {
    report.identity = await s.identity(c);
    s.assert.equal(
      report.identity.data_directory.replaceAll('\\', '/').toLowerCase(),
      (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase(),
      'Refusing to run outside isolated local PostgreSQL cluster'
    );

    const baseline = JSON.parse(
      s.fs.readFileSync('artifacts/uboq/wp3/batch-d/baseline.json', 'utf8')
    );
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_32)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified: ${relPath}`);
    }

    const ledgerRows = (
      await c.query(
        'SELECT migration_name, checksum FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL ORDER BY finished_at ASC, migration_name ASC'
      )
    ).rows;

    for (const m of baseline.ledger_1_to_32) {
      const found = ledgerRows.find((r) => r.migration_name === m.migration_name);
      s.assert.ok(found, `Missing ledger row for ${m.migration_name}`);
      s.assert.equal(found.checksum, m.checksum, `Ledger checksum mismatch for ${m.migration_name}`);
    }
    report.migrations_1_to_32_verified = 32;

    const sqlBytes = s.fs.readFileSync(MIGRATION33_PATH);
    report.bytes = sqlBytes.length;
    report.sha256 = s.hash(sqlBytes);
    const sqlText = sqlBytes.toString('utf8');

    const alreadyApplied = ledgerRows.find((r) => r.migration_name === MIGRATION33_NAME);
    if (alreadyApplied && alreadyApplied.checksum === report.sha256) {
      report.rollback_preflight = 'PASS';
      report.result = 'ALREADY_APPLIED_AND_VERIFIED';
    } else {
      s.assert.equal(
        ledgerRows.length,
        alreadyApplied ? 33 : 32,
        `Unexpected applied migration count prior to #33: ${ledgerRows.length}`
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
          [MIG33_RLS_TABLES]
        );
        s.assert.equal(rlsCheck.rows.length, MIG33_RLS_TABLES.length);
        for (const r of rlsCheck.rows) {
          s.assert.equal(r.relrowsecurity, true, `RLS not enabled on ${r.relname}`);
          s.assert.equal(r.relforcerowsecurity, true, `FORCE RLS not enabled on ${r.relname}`);
        }

        for (const tbl of MIG33_RLS_TABLES) {
          const privs = await c.query(
            `SELECT
               has_table_privilege('oserp_compat_app', $1, 'SELECT') AS can_select,
               has_table_privilege('oserp_compat_app', $1, 'INSERT') AS can_insert,
               has_table_privilege('oserp_compat_app', $1, 'UPDATE') AS can_update,
               has_table_privilege('oserp_compat_app', $1, 'DELETE') AS can_delete`,
            [`public."${tbl}"`]
          );
          s.assert.equal(privs.rows[0].can_select, true, `Expected SELECT on ${tbl}`);
          s.assert.equal(privs.rows[0].can_insert, false, `Direct INSERT must be revoked on ${tbl}`);
          s.assert.equal(privs.rows[0].can_update, false, `Direct UPDATE must be revoked on ${tbl}`);
          s.assert.equal(privs.rows[0].can_delete, false, `Direct DELETE must be revoked on ${tbl}`);
        }

        const fnCheck = await c.query(
          `SELECT proname, pronargs
             FROM pg_proc p
             JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public'
              AND proname = ANY($1)
            ORDER BY proname`,
          [MIG33_FUNCTIONS]
        );
        s.assert.equal(fnCheck.rows.length, MIG33_FUNCTIONS.length, 'Missing Migration #33 functions');
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
            [report.sha256, MIGRATION33_NAME]
          );
        } else {
          await c.query(
            `INSERT INTO _prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
             VALUES ($1, $2, clock_timestamp(), $3, '', NULL, clock_timestamp(), 1)`,
            [s.crypto.randomUUID(), report.sha256, MIGRATION33_NAME]
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
    s.assert.equal(finalLedger.length, 33, `Expected 33 applied migrations, got ${finalLedger.length}`);
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
      [MIG33_RLS_TABLES]
    );
    report.migration33_rls_policies = finalPolicies.rows;

    report.compat_direct_write_privileges = {};
    for (const tbl of MIG33_RLS_TABLES) {
      const privs = (
        await c.query(
          `SELECT
             has_table_privilege('oserp_compat_app', $1, 'INSERT') AS can_insert,
             has_table_privilege('oserp_compat_app', $1, 'UPDATE') AS can_update,
             has_table_privilege('oserp_compat_app', $1, 'DELETE') AS can_delete`,
          [`public."${tbl}"`]
        )
      ).rows[0];
      s.assert.equal(privs.can_insert, false);
      s.assert.equal(privs.can_update, false);
      s.assert.equal(privs.can_delete, false);
      report.compat_direct_write_privileges[tbl] = privs;
    }

    // Re-verify Migrations #1-#32 byte-for-byte post-apply
    for (const [relPath, expectedSha] of Object.entries(baseline.migrations_1_to_32)) {
      const actualSha = s.hash(s.fs.readFileSync(relPath));
      s.assert.equal(actualSha, expectedSha, `Historical migration modified post-apply: ${relPath}`);
    }
    report.migrations_1_to_32_preserved_post_apply = true;

    s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
    console.log('Migration #33 applied and verified:', report.result, 'sha256=' + report.sha256);
  } finally {
    await c.end();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
