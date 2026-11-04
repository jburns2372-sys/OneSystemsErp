/**
 * Privileged Synthetic UBOQ Test Fixture Cleanup Utility (G01-EXC-01 / I-03 / R1-H03)
 *
 * Enforces mandatory two-step transitive dependency-closure verification:
 *   1. `--dry-run` (Read-Only): Connects via `oserp_maint_cleanup_role` in READ ONLY mode,
 *      executes `uboq_build_synthetic_cleanup_manifest(project_id)`, enumerates the full
 *      transitive descendant closure across all ERP & UBOQ tables, detects any disqualifier
 *      (non-synthetic prefix, `isSyntheticTestFixture=false`, paid/posted AP or Expense,
 *      out-of-scope descendants, cross-project links), and outputs deterministic `manifestSha256`.
 *   2. `--execute --manifest-sha256=<64-hex>`: Requires explicit `--execute` flag AND the exact
 *      64-character SHA-256 digest produced by `--dry-run`. Recomputes the live closure inside
 *      a locked transaction immediately prior to deletion and rolls back on any drift or disqualifier.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

export async function buildSyntheticCleanupDryRunManifest(
  connUrl: string,
  projectId: string,
  useSetRole = false
): Promise<Record<string, unknown>> {
  const client = new pg.Client({ connectionString: connUrl });
  await client.connect();
  try {
    await client.query('BEGIN READ ONLY');
    if (useSetRole) {
      await client.query(`SET LOCAL ROLE oserp_maint_cleanup_role`);
    }
    const res = await client.query<{ manifest: Record<string, unknown> }>(
      `SELECT uboq_build_synthetic_cleanup_manifest($1) AS manifest`,
      [projectId]
    );
    await client.query('COMMIT');
    return res.rows[0]?.manifest ?? {};
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    await client.end();
  }
}

export async function executeManifestVerifiedSyntheticCleanup(
  connUrl: string,
  projectId: string,
  expectedManifestSha256: string,
  useSetRole = false
): Promise<Record<string, unknown>> {
  if (!expectedManifestSha256 || !/^[0-9a-f]{64}$/i.test(expectedManifestSha256.trim())) {
    throw new Error(
      'UBOQ_CLEANUP_MANIFEST_REQUIRED: --manifest-sha256=<64-hex> from --dry-run is mandatory before destructive execution'
    );
  }

  const client = new pg.Client({ connectionString: connUrl });
  await client.connect();
  try {
    await client.query('BEGIN');
    if (useSetRole) {
      await client.query(`SET LOCAL ROLE oserp_maint_cleanup_role`);
    }
    const res = await client.query<{ result: Record<string, unknown> }>(
      `SELECT uboq_execute_verified_synthetic_cleanup($1, $2) AS result`,
      [projectId, expectedManifestSha256.trim().toLowerCase()]
    );
    await client.query('COMMIT');
    return res.rows[0]?.result ?? {};
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw err;
  } finally {
    await client.end();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const execute = args.includes('--execute');
  const manifestFlag = args.find((a) => a.startsWith('--manifest-sha256='));
  const expectedManifestSha256 = manifestFlag ? manifestFlag.slice('--manifest-sha256='.length).trim() : '';
  const projectIdArg = args.find((a) => !a.startsWith('--'));

  if (!projectIdArg || (dryRun === execute)) {
    console.error(
      'Usage:\n' +
        '  Dry-Run Closure Proof: npx tsx scripts/uboq/cleanup-synthetic-fixtures.ts <SYNTH-UBOQ-TEST-...> --dry-run\n' +
        '  Verified Execution:    npx tsx scripts/uboq/cleanup-synthetic-fixtures.ts <SYNTH-UBOQ-TEST-...> --execute --manifest-sha256=<64-hex>'
    );
    process.exit(1);
  }

  const connUrl = process.env.MAINT_CLEANUP_DATABASE_URL || process.env.DATABASE_URL;
  if (!connUrl) {
    throw new Error('MAINT_CLEANUP_DATABASE_URL or DATABASE_URL is required');
  }
  const useSetRole = !process.env.MAINT_CLEANUP_DATABASE_URL;

  if (dryRun) {
    const manifest = await buildSyntheticCleanupDryRunManifest(connUrl, projectIdArg, useSetRole);
    console.log(JSON.stringify({ mode: 'DRY_RUN_CLOSURE_PROOF', manifest }, null, 2));
    if (!manifest.eligible) {
      process.exit(2);
    }
    return;
  }

  const result = await executeManifestVerifiedSyntheticCleanup(
    connUrl,
    projectIdArg,
    expectedManifestSha256,
    useSetRole
  );
  console.log(JSON.stringify({ mode: 'VERIFIED_MANIFEST_EXECUTED', result }, null, 2));
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution) {
  main().catch((err) => {
    console.error('Synthetic cleanup failed:', err.message || err);
    process.exit(1);
  });
}
