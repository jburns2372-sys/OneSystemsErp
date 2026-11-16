'use strict';
// Offline tests only; never opens a PostgreSQL connection.
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const gate = require('./verify-migration14-provenance-gate.cjs');
const disk = gate.loadDiskMigrations();
const authority = gate.loadApprovedAuthority(disk);
const results = [];
const baseline = (n) => authority.approved.slice(0, n).map((m, i) => ({
  migration_name: m.migrationName, checksum: m.sha256,
  started_at: new Date(Date.UTC(2026, 0, 1, 0, 0, i * 2)).toISOString(),
  finished_at: new Date(Date.UTC(2026, 0, 1, 0, 0, i * 2 + 1)).toISOString(),
  rolled_back_at: null, applied_steps_count: 1, logs: null,
}));
function check(name, rows, expected, options, auth = authority, migrations = disk) {
  const outcome = gate.evaluateTargetLedgerForMigration14(rows, migrations, auth, options);
  assert.equal(outcome.classification, expected, name);
  assert.equal(outcome.eligible, expected.startsWith('ELIGIBLE_'), name);
  results.push({ name, result: 'PASS', outcome });
}
async function main() {
  for (const n of [8, 13, 14, 16, 39]) check(`exact approved prefix ${n}`, baseline(n),
    n < 14 ? 'ELIGIBLE_PRE_UBOQ_BASELINE' : 'ELIGIBLE_CANONICAL_REVIEWED_LINEAGE');
  check('SQL result order irrelevant', baseline(16).reverse(), 'ELIGIBLE_CANONICAL_REVIEWED_LINEAGE');
  check('empty without explicit approval', [], 'BLOCKED_EMPTY_BASELINE_REQUIRES_EXPLICIT_APPROVAL');
  check('explicit approved clean new branch', [], 'ELIGIBLE_APPROVED_EMPTY_BASELINE', { allowEmpty: true });
  for (const n of [1, 7, 9, 12]) check(`unapproved partial baseline ${n}`, baseline(n), 'BLOCKED_UNAPPROVED_BASELINE_PREFIX');
  for (const n of [8, 13, 16]) check(`unknown extra at ${n}`, [...baseline(n), {
    ...baseline(1)[0], migration_name: '20261101222222_unknown_schema_change',
  }], 'BLOCKED_UNKNOWN_APPLIED_MIGRATION');
  check('canonical 14 then 16 without 15', baseline(16).filter((_, i) => i !== 14), 'BLOCKED_MIGRATION_HISTORY_GAP');
  check('post14 without 14', baseline(16).filter((_, i) => i !== 13), 'BLOCKED_MIGRATION_HISTORY_GAP');
  check('baseline gap', baseline(13).filter((_, i) => i !== 4), 'BLOCKED_MIGRATION_HISTORY_GAP');
  const reordered = baseline(16);
  [reordered[14].started_at, reordered[15].started_at] = [reordered[15].started_at, reordered[14].started_at];
  [reordered[14].finished_at, reordered[15].finished_at] = [reordered[15].finished_at, reordered[14].finished_at];
  check('future migration applied before predecessor', reordered, 'BLOCKED_APPLICATION_ORDER');
  for (const i of [0, 12, 13, 15]) {
    const rows = baseline(16); rows[i].checksum = 'f'.repeat(64);
    check(`checksum drift ${i + 1}`, rows, i === 13 ? 'BLOCKED_DIVERGENT_MIGRATION14_PROVENANCE' : 'BLOCKED_CHECKSUM_DRIFT');
  }
  const gitBytes = baseline(8);
  gitBytes[0].checksum = authority.gitEvidence[0].gitSha256;
  check('Git LF hash cannot masquerade as accepted local CRLF hash', gitBytes, 'BLOCKED_CHECKSUM_DRIFT');
  for (const [label, patch] of Object.entries({
    rolledBack: { rolled_back_at: '2026-02-01T00:00:00Z' }, unfinished: { finished_at: null },
    failed: { logs: 'migration error', applied_steps_count: 0 }, noSteps: { applied_steps_count: 0 },
    missingStatus: { rolled_back_at: undefined }, missingStart: { started_at: null },
  })) {
    const rows = baseline(16); Object.assign(rows[15], patch);
    check(label, rows, 'BLOCKED_INCOMPLETE_ROLLED_BACK_OR_FAILED_MIGRATION');
  }
  for (const n of [13, 16]) check(`duplicate ledger row ${n}`, [...baseline(n), baseline(n)[0]], 'BLOCKED_DUPLICATE_LEDGER_ROW');
  const tied = baseline(13); tied[1].started_at = tied[0].started_at;
  check('ambiguous tied application starts', tied, 'BLOCKED_APPLICATION_ORDER');
  const invalid = baseline(13); invalid[0].finished_at = 'invalid';
  check('invalid timestamp', invalid, 'BLOCKED_INVALID_APPLICATION_TIMESTAMPS');
  check('no authority', baseline(13), 'BLOCKED_UNVERIFIED_AUTHORITY', {}, null);
  const changedDisk = structuredClone(disk); changedDisk[0].sha256 = 'e'.repeat(64);
  check('disk drift against authority', baseline(13), 'BLOCKED_UNVERIFIED_AUTHORITY', {}, authority, changedDisk);
  // Prove importing the gate does not load the old local support helper or pg, or write files.
  execFileSync(process.execPath, ['-e', `
    const fs=require('fs'), Module=require('module');
    for(const k of ['writeFileSync','mkdirSync','appendFileSync'])fs[k]=()=>{throw Error('Import wrote files')};
    const original=Module._load;
    Module._load=function(id,...rest){if(id==='pg'||id.includes('g02-bounded-support'))throw Error('Import loaded DB helper');return original.call(this,id,...rest)};
    require('./scripts/uboq/verify-migration14-provenance-gate.cjs');
  `]);
  results.push({ name: 'side-effect-free import', result: 'PASS' });
  for (const [label, rows, objects, expected] of [
    ['existing ledger', baseline(13), [], 'ELIGIBLE_PRE_UBOQ_BASELINE'],
    ['new empty target', [], [], 'ELIGIBLE_APPROVED_EMPTY_BASELINE'],
    ['empty ledger with existing tables', [], [{ relname: 'Contract' }], 'BLOCKED_EMPTY_LEDGER_WITH_EXISTING_OBJECTS'],
  ]) {
    const queries = [];
    const client = { query: async (sql) => {
      queries.push(sql);
      if (sql.includes('to_regclass')) return { rows: [{ ledger: rows.length ? '_prisma_migrations' : null }] };
      if (sql.startsWith('SELECT migration_name')) return { rows };
      if (sql.includes('FROM pg_class')) return { rows: objects };
      return { rows: [] };
    } };
    const v = await gate.inspectTargetLedger(client, disk, authority, { allowEmpty: true });
    assert.equal(v.classification, expected);
    assert.equal(queries[0], 'BEGIN TRANSACTION READ ONLY');
    assert.equal(queries.at(-1), 'ROLLBACK');
    assert(queries.slice(1, -1).every(q => q.startsWith('SELECT ')));
    results.push({ name: `read-only adapter: ${label}`, result: 'PASS', queries });
  }
  const queries = [];
  await assert.rejects(gate.inspectTargetLedger({ query: async q => {
    queries.push(q); if (q.startsWith('SELECT')) throw Error('simulated query failure'); return { rows: [] };
  } }, disk, authority));
  assert.equal(queries.at(-1), 'ROLLBACK');
  results.push({ name: 'read-only adapter rolls back on query error', result: 'PASS' });
  console.log(JSON.stringify({ status: 'PASS', total: results.length, liveDatabaseConnections: 0,
    authority, results }, null, 2));
}
main().catch(e => { console.error(e); process.exitCode = 1; });
