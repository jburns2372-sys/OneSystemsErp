// Focused LOCAL-only Migration #38 application and rollback-contained verification.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const { Client } = require('pg');
const guard = require('./migration-checksum-guard.cjs');
const name = '20261116010000_wp3_batch_d_d2_r3_finished_timestamp_immutability';
const migrationPath = `prisma/migrations/${name}/migration.sql`;
const out = 'artifacts/uboq/wp3/batch-d-d2-r3';
const hash = (b) => crypto.createHash('sha256').update(b).digest('hex');
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
const save = (p, v) => fs.writeFileSync(`${out}/${p}`, JSON.stringify(v, null, 2) + '\n', { flag: 'wx' });

async function main() {
  assert(!fs.existsSync(`${out}/test-results.json`), 'Preserve existing evidence');
  const r2 = readJson('artifacts/uboq/wp3/batch-d-d2-r2/review-package.json');
  const historical = r2.preservation.migration_hashes;
  assert.equal(Object.keys(historical).length, 37);
  function verifyFiles() {
    for (const [p, sha] of Object.entries(historical)) assert.equal(hash(fs.readFileSync(p)), sha, p);
    for (const r of r2.source_manifest) assert.equal(hash(fs.readFileSync(r.path)), r.sha256, r.path);
    assert.equal(hash(fs.readFileSync('artifacts/uboq/wp3/wp3-batch-d-d2-r2-review.zip')),
      '6b6509fd3306624530f7a40e4c1c8f327b63f602959ea87a0608e9c80d21db47');
  }
  verifyFiles();
  const priorSql = fs.readFileSync('prisma/migrations/20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard/migration.sql', 'utf8');
  const start = priorSql.indexOf('CREATE OR REPLACE FUNCTION public.uboq_guard_prisma_migration_ledger()');
  const end = priorSql.indexOf('\nDROP TRIGGER', start);
  const oldFunction = priorSql.slice(start, end).trim();
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const newFunction = sql.slice(sql.indexOf('CREATE OR REPLACE FUNCTION')).trim();
  assert.equal(newFunction, oldFunction.replace('OR NEW.finished_at IS NULL', 'OR NEW.finished_at IS DISTINCT FROM OLD.finished_at'),
    'Only the completed timestamp comparison may change');

  const receipt = readJson('artifacts/uboq/g02-r3/h02-b-implementation/local-database.json');
  const config = readJson(path.join(receipt.runtime_directory, 'connection.json'));
  assert.equal(config.host, '127.0.0.1');
  assert.equal(config.port, 55483);
  assert.equal(config.database, receipt.target_database);
  assert.match(config.database, /^oserp_h02b_local_[0-9a-f]+$/);
  const c = new Client(config);
  const checks = [];
  const ledger = async () => (await c.query('SELECT * FROM public."_prisma_migrations" ORDER BY id')).rows;
  const digest = (v) => hash(Buffer.from(JSON.stringify(v)));
  async function focusedTests(stage) {
    const before = await ledger();
    const prefix = `uboq_r3_${crypto.randomUUID()}`;
    const id = crypto.randomUUID();
    await c.query('BEGIN');
    try {
      // Synthetic rows only: no historical row is ever targeted by these tests.
      await c.query(`INSERT INTO public."_prisma_migrations"
        (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
        VALUES ($1, $2, $3, now(), now(), 1)`, [id, 'a'.repeat(64), prefix]);
      async function rejected(label, sqlText, params, code) {
        await c.query('SAVEPOINT probe');
        let caught;
        try { await c.query(sqlText, params); } catch (e) { caught = e; }
        await c.query('ROLLBACK TO SAVEPOINT probe');
        assert.equal(caught?.code, code, label);
        checks.push({ stage, name: label, result: 'PASS', sqlstate: caught.code });
      }
      await rejected('completed timestamp changed to non-NULL',
        `UPDATE public."_prisma_migrations" SET finished_at=finished_at + interval '1 second' WHERE id=$1`, [id], '42501');
      await rejected('completed timestamp changed to NULL',
        'UPDATE public."_prisma_migrations" SET finished_at=NULL WHERE id=$1', [id], '42501');
      const same = await c.query('UPDATE public."_prisma_migrations" SET finished_at=finished_at WHERE id=$1', [id]);
      assert.equal(same.rowCount, 1);
      checks.push({ stage, name: 'unchanged timestamp permitted', result: 'PASS' });
      const pendingId = crypto.randomUUID();
      await c.query(`INSERT INTO public."_prisma_migrations"
        (id, checksum, migration_name, started_at, applied_steps_count)
        VALUES ($1,$2,$3,now(),0)`, [pendingId, 'b'.repeat(64), `${prefix}_pending`]);
      await rejected('in-flight checksum mutation',
        'UPDATE public."_prisma_migrations" SET checksum=$2 WHERE id=$1', [pendingId, 'c'.repeat(64)], '42501');
      const completed = await c.query(`UPDATE public."_prisma_migrations" SET finished_at=now(), applied_steps_count=1
        WHERE id=$1 RETURNING finished_at`, [pendingId]);
      assert(completed.rows[0].finished_at);
      checks.push({ stage, name: 'initial NULL-to-non-NULL completion permitted', result: 'PASS' });
      await rejected('checksum mutation', 'UPDATE public."_prisma_migrations" SET checksum=$2 WHERE id=$1', [id, 'c'.repeat(64)], '42501');
      await rejected('completed deletion', 'DELETE FROM public."_prisma_migrations" WHERE id=$1', [id], '42501');
      await rejected('in-place rollback', 'UPDATE public."_prisma_migrations" SET rolled_back_at=now() WHERE id=$1', [id], '42501');
      for (const column of ['id', 'migration_name', 'started_at']) {
        const expression = column === 'started_at' ? "started_at + interval '1 second'" : "'changed'";
        await rejected(`completed ${column} mutation`, `UPDATE public."_prisma_migrations" SET ${column}=${expression} WHERE id=$1`, [id], '42501');
      }
      await rejected('duplicate applied name', `INSERT INTO public."_prisma_migrations"
        (id,checksum,migration_name,started_at,finished_at) VALUES ($1,$2,$3,now(),now())`,
        [crypto.randomUUID(), 'd'.repeat(64), prefix], '23505');
      await rejected('malformed checksum', `INSERT INTO public."_prisma_migrations"
        (id,checksum,migration_name,started_at) VALUES ($1,'bad',$2,now())`,
        [crypto.randomUUID(), `${prefix}_bad`], '23514');
    } finally { await c.query('ROLLBACK'); }
    const after = await ledger();
    assert.deepEqual(after, before, 'No synthetic residue or ledger mutations after rollback');
    return { beforeSha256: digest(before), afterSha256: digest(after), exactRowsPreserved: true };
  }
  try {
    await c.connect();
    await c.query("SET statement_timeout='15s'; SET lock_timeout='3s'");
    const identity = (await c.query("SELECT current_database() db, current_setting('data_directory') data_directory")).rows[0];
    assert.equal(identity.db, config.database);
    assert.equal(identity.data_directory.replaceAll('\\', '/').toLowerCase(), (receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase());
    const before = await ledger();
    const ready = await guard.assertForwardOnlyMigrationReady(c, { migrationName: name, migrationPath, expectedPriorCount: 37 });
    assert.equal(ready.status, 'READY_TO_APPLY_FORWARD_ONLY');
    // Compile and inspect the replacement in a rollback-only preflight.
    await c.query('BEGIN');
    try {
      await c.query(sql);
      const definition = (await c.query("SELECT pg_get_functiondef('public.uboq_guard_prisma_migration_ledger()'::regprocedure) AS definition")).rows[0].definition;
      assert.match(definition, /NEW.finished_at IS DISTINCT FROM OLD.finished_at/);
    } finally { await c.query('ROLLBACK'); }
    await c.query('BEGIN');
    try {
      await c.query(sql);
      await c.query(`INSERT INTO public."_prisma_migrations"
        (id,checksum,migration_name,started_at,finished_at,applied_steps_count)
        VALUES ($1,$2,$3,now(),now(),1)`, [crypto.randomUUID(), ready.sha256, name]);
      await c.query('COMMIT');
    } catch (e) { await c.query('ROLLBACK'); throw e; }
    const preservation = await focusedTests('post-apply');
    const audit = await guard.verifyLedgerAgainstDisk(c);
    assert.equal(audit.appliedCount, 38);
    assert.equal(audit.diskCount, 38);
    assert.equal(audit.verifiedMatchCount, 38);
    assert.deepEqual((await ledger()).filter((r) => r.migration_name !== name), before);
    verifyFiles();
    fs.mkdirSync(out, { recursive: true });
    save('test-results.json', { status: 'PASS', created_at: new Date().toISOString(), identity, checks,
      preservation, historicalLedgerRowsUnchanged: 37, syntheticResidue: 0,
      acceptedR2SourcesUnchanged: r2.source_manifest.length, fullR2SuiteRerun: false });
    save('migration-checksums.json', { appliedCount: audit.appliedCount, diskCount: audit.diskCount,
      verifiedMatchCount: audit.verifiedMatchCount, historicalMigrationsUnchanged: 37,
      migration38: { path: migrationPath, sha256: ready.sha256 },
      migrations: audit.diskEntries, ledger: audit.ledgerRows });
    console.log(JSON.stringify({ status: 'PASS', focusedChecks: checks.length, checksumParity: '38/38', syntheticResidue: 0 }));
  } finally { await c.end(); }
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
