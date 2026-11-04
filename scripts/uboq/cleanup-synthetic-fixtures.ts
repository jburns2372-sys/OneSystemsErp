/**
 * Privileged Synthetic UBOQ Test Fixture Cleanup Utility (G01-EXC-01 / I-03)
 *
 * Connects strictly via `oserp_maint_cleanup_role` (or reports dry-run candidates)
 * and invokes `uboq_execute_verified_synthetic_cleanup(p_project_id)`, which enforces:
 *   1. ID prefix `SYNTH-UBOQ-TEST-%`
 *   2. Zero non-synthetic financial/billing/payroll records
 */
import 'dotenv/config';
import pg from 'pg';

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const projectIdArg = args.find((a) => !a.startsWith('--'));

  if (!projectIdArg) {
    console.error('Usage: npx tsx scripts/uboq/cleanup-synthetic-fixtures.ts <SYNTH-UBOQ-TEST-...> [--dry-run]');
    process.exit(1);
  }

  const connUrl = process.env.MAINT_CLEANUP_DATABASE_URL || process.env.DATABASE_URL;
  if (!connUrl) {
    throw new Error('DATABASE_URL or MAINT_CLEANUP_DATABASE_URL is required');
  }

  const client = new pg.Client({ connectionString: connUrl });
  await client.connect();
  try {
    if (dryRun) {
      const check = await client.query(
        `SELECT id, name, "uboqGovernanceEnabled" FROM "Project" WHERE id = $1`,
        [projectIdArg]
      );
      console.log(JSON.stringify({ mode: 'DRY_RUN', found: check.rowCount, project: check.rows[0] ?? null }, null, 2));
      return;
    }

    await client.query(`SET ROLE oserp_maint_cleanup_role`);
    const res = await client.query(`SELECT uboq_execute_verified_synthetic_cleanup($1) AS result`, [projectIdArg]);
    console.log(JSON.stringify({ mode: 'EXECUTED', result: res.rows[0]?.result }, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Synthetic cleanup failed:', err.message);
  process.exit(1);
});

