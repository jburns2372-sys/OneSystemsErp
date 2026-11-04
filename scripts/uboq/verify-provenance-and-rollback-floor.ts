/**
 * Provenance & Rollback-Floor Readiness Verifier (G07-PROV / G10-PROV / RLB-LEG-01..03)
 *
 * Inspects active database UBOQ resource-governed records and determines whether:
 *   - Legacy `oserp_legacy_app` rollback is permissible (0 governed projects/accounts), OR
 *   - Compatibility-floor rollback (`oserp_compat_app` + triggers + RLS active) is mandatory
 *     because resource-governed POs, Deliveries, AP, or Ledger entries exist in the database.
 */
import 'dotenv/config';
import pg from 'pg';

async function main() {
  const connUrl = process.env.DATABASE_URL;
  if (!connUrl) throw new Error('DATABASE_URL is required');

  const client = new pg.Client({ connectionString: connUrl });
  await client.connect();
  try {
    const govProjects = await client.query(`SELECT COUNT(*)::int AS cnt FROM "Project" WHERE "uboqGovernanceEnabled" = true`);
    const accounts = await client.query(`SELECT COUNT(*)::int AS cnt FROM "UboqCanonicalResourceAccount"`);
    const ledgerRows = await client.query(`SELECT COUNT(*)::int AS cnt FROM "UboqResourceLedgerEntry"`);
    const govPos = await client.query(`SELECT COUNT(*)::int AS cnt FROM "PurchaseOrderItem" WHERE "canonicalResourceId" IS NOT NULL`);
    const pghContamination = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM "Project" WHERE UPPER(COALESCE(name,'')) LIKE '%PGH%' OR UPPER(COALESCE("contractNumber",'')) LIKE '%PGH%'`
    );
    const rlsTables = await client.query(
      `SELECT COUNT(*)::int AS cnt FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relrowsecurity = true AND c.relforcerowsecurity = true`
    );

    const hasGovernedHistory =
      govProjects.rows[0].cnt > 0 || accounts.rows[0].cnt > 0 || ledgerRows.rows[0].cnt > 0 || govPos.rows[0].cnt > 0;

    const report = {
      timestamp: new Date().toISOString(),
      governedProjectsCount: govProjects.rows[0].cnt,
      canonicalResourceAccountsCount: accounts.rows[0].cnt,
      resourceLedgerEntriesCount: ledgerRows.rows[0].cnt,
      governedPoItemsCount: govPos.rows[0].cnt,
      pghRecordCount: pghContamination.rows[0].cnt,
      forceRlsEnabledTableCount: rlsTables.rows[0].cnt,
      minimumSafeRollbackFloor: hasGovernedHistory
        ? 'COMPATIBILITY_FLOOR_REQUIRED (oserp_compat_app + G01-EXC-01 DB triggers & RLS MUST remain active; oserp_legacy_app blocked on governed rows)'
        : 'PRE_GOVERNANCE_FLOOR_ELIGIBLE',
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Provenance/rollback check failed:', err.message);
  process.exit(1);
});

