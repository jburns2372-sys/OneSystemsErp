'use strict';

/**
 * Phase 2 — Migration #14 Provenance Audit & Fail-Closed Target Ledger Gate
 *
 * Strictly READ-ONLY:
 * - Never modifies migration SQL files on disk.
 * - Never writes to `_prisma_migrations` (`BEGIN TRANSACTION READ ONLY` + `default_transaction_read_only = on`).
 * - Connections require an explicit CLI target; import performs no connections or writes.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const MIG14_NAME = '20261104193000_add_uboq_engine_and_g01_exc_01';
const MIG14_REL_PATH = `prisma/migrations/${MIG14_NAME}/migration.sql`;
const CANONICAL_MIG14_SHA256 =
  'a4accf399ceeccd246e98f659dd1057805583e61af247a1a88f6e060a8b2016e';
const REPORTED_DIVERGENT_CHECKSUMS = [
  '2b26be208ef667ceb135b97a664a40f0ba73cea0f45c0f5413698d5ce55daa17',
  '8f8603862f262272e3a42573d2fd335efdc990af510539590924258c0c13e036',
  '8f8603862478f0b8d49086dc19d6b1f2d9e8258a2bfabc8b8457cc46547a790a',
  '636898acfa84073f9934e1977fed41940cda0244758c66d4b6ff7668278ca5d7',
  '05e0da3ca18f64f61e4c5c9152ef4c97be683dbceffd3c69a8d13e9abcbd01e0',
];

const ORIGIN_MAIN_COMMIT = 'd08740b50d2c0eee9110497f247e213c20d0e06e';

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function loadDiskMigrations() {
  const dirs = fs
    .readdirSync('prisma/migrations', { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
  return dirs.map((name, idx) => {
    const rel = `prisma/migrations/${name}/migration.sql`;
    const bytes = fs.readFileSync(rel);
    return {
      index: idx + 1,
      migrationName: name,
      relPath: rel,
      bytes: bytes.length,
      sha256: sha256(bytes),
    };
  });
}

function git(args, encoding = 'utf8') {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  });
}


/** Verify approved names and raw SQL hashes from Git and retained acceptance receipts.
 * origin/main has 8 migrations; the release branch adds 5 before UBOQ #14.
 * No network, connection, directory creation, or evidence writes occur on import.
 */
function loadApprovedAuthority(diskMigrations = loadDiskMigrations()) {
  assert.equal(git(['rev-parse', 'origin/main']).trim(), ORIGIN_MAIN_COMMIT, 'origin/main changed: baseline review required');
  const originPaths = git(['ls-tree', '-r', '--name-only', ORIGIN_MAIN_COMMIT, '--', 'prisma/migrations'])
    .trim().split(/\r?\n/).filter(p => p.endsWith('/migration.sql')).sort();
  assert.equal(originPaths.length, 8);
  // Pin retained reviewed receipts: a changed local receipt cannot silently authorize new SQL.
  assert.equal(sha256(fs.readFileSync('artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json')), 'f67634b39f9f2bf6e48ebd5b30b491de15d67614291bf27a9e47f65c57236070');
  assert.equal(sha256(fs.readFileSync('artifacts/uboq/release-readiness/migration39-apply.json')), 'fb74b7dce2d224fe5d0ec6cc154f608ffe315e25e82b135fc7099b285e61b5db');
  const accepted = JSON.parse(fs.readFileSync('artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json', 'utf8'));
  const m39 = JSON.parse(fs.readFileSync('artifacts/uboq/release-readiness/migration39-apply.json', 'utf8'));
  const approvedHashes = { ...accepted.migrations_1_to_38, [m39.migration_path]: m39.sha256 };
  const approved = Object.keys(approvedHashes).sort().map(relPath => ({
    relPath, migrationName: relPath.split('/')[2], sha256: approvedHashes[relPath]
  }));
  assert.equal(approved.length, 39);
  assert.equal(approved[13].migrationName, MIG14_NAME);
  assert.equal(approved[13].sha256, CANONICAL_MIG14_SHA256);
  assert.deepEqual(diskMigrations.map(m => [m.migrationName, m.sha256]), approved.map(m => [m.migrationName, m.sha256]), 'Disk differs from accepted migration set');
  const gitEvidence = [];
  for (const [i, rel] of originPaths.entries()) {
    assert.equal(rel, approved[i].relPath, 'origin/main is not the exact initial 8-migration prefix');
    const raw = git(['show', ORIGIN_MAIN_COMMIT + ':' + rel], 'buffer');
    assert.equal(raw.toString('utf8').replace(/\r\n/g, '\n'), fs.readFileSync(rel, 'utf8').replace(/\r\n/g, '\n'));
    gitEvidence.push({ path: rel, gitSha256: sha256(raw), approvedDiskSha256: approved[i].sha256,
      sameContentAfterLineEndingNormalization: true });
  }
  // Prove all 13 pre-UBOQ SQL files are in release Git history, not just local disk.
  const releaseBaselineCommit = 'e98f5dba487828e272a62890f545035e69ad8d8c';
  const releasePaths = git(['ls-tree', '-r', '--name-only', releaseBaselineCommit, '--', 'prisma/migrations'])
    .trim().split(/\r?\n/).filter(p => p.endsWith('/migration.sql')).sort();
  assert.deepEqual(releasePaths, approved.slice(0, 13).map(m => m.relPath));
  for (const m of approved.slice(0, 13)) {
    const raw = git(['show', releaseBaselineCommit + ':' + m.relPath], 'buffer');
    assert.equal(raw.toString('utf8').replace(/\r\n/g, '\n'), fs.readFileSync(m.relPath, 'utf8').replace(/\r\n/g, '\n'));
  }
  return { approved, originMainCommit: ORIGIN_MAIN_COMMIT, originMainCount: 8,
    releaseBaselineCommit, releaseBaselineCount: 13, gitEvidence };
}

/** Pure classifier: ledger result order is irrelevant; recorded application times establish order. */
function evaluateTargetLedgerForMigration14(ledgerRows, diskMigrations, authority, options = {}) {
  const blocked = (classification, evidence = {}) => ({ eligible: false, classification, evidence });
  const approved = authority?.approved;
  if (!Array.isArray(approved) || approved.length !== 39 ||
      approved[13]?.migrationName !== MIG14_NAME || approved[13]?.sha256 !== CANONICAL_MIG14_SHA256 ||
      authority.originMainCount !== 8 || authority.releaseBaselineCount !== 13 ||
      authority.originMainCommit !== ORIGIN_MAIN_COMMIT ||
      new Set(approved.map(m => m.migrationName)).size !== approved.length ||
      JSON.stringify(diskMigrations.map(m => [m.migrationName, m.sha256])) !==
      JSON.stringify(approved.map(m => [m.migrationName, m.sha256]))) {
    return blocked('BLOCKED_UNVERIFIED_AUTHORITY');
  }
  const byName = new Map(approved.map((m, i) => [m.migrationName, { ...m, index: i }]));
  const seen = new Set();
  const rows = [];
  for (const r of ledgerRows) {
    const m = byName.get(r.migration_name);
    if (!m) return blocked('BLOCKED_UNKNOWN_APPLIED_MIGRATION', { migrationName: r.migration_name });
    if (seen.has(r.migration_name)) return blocked('BLOCKED_DUPLICATE_LEDGER_ROW', { migrationName: r.migration_name });
    seen.add(r.migration_name);
    if (r.rolled_back_at !== null || !r.finished_at || !r.started_at ||
        !Number.isInteger(r.applied_steps_count) || r.applied_steps_count < 1 ||
        (r.logs !== null && r.logs !== undefined && r.logs !== '')) {
      return blocked('BLOCKED_INCOMPLETE_ROLLED_BACK_OR_FAILED_MIGRATION', { migrationName: r.migration_name });
    }
    const start = new Date(r.started_at).getTime(), finish = new Date(r.finished_at).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(finish) || finish < start) {
      return blocked('BLOCKED_INVALID_APPLICATION_TIMESTAMPS', { migrationName: r.migration_name });
    }
    if (r.checksum !== m.sha256) return blocked(
      r.migration_name === MIG14_NAME ? 'BLOCKED_DIVERGENT_MIGRATION14_PROVENANCE' : 'BLOCKED_CHECKSUM_DRIFT',
      { migrationName: r.migration_name, expectedChecksum: m.sha256, recordedChecksum: r.checksum,
        knownHistoricalDivergence: REPORTED_DIVERGENT_CHECKSUMS.includes(r.checksum) });
    rows.push({ ...m, start, finish });
  }
  rows.sort((a, b) => a.index - b.index);
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].index !== i) return blocked('BLOCKED_MIGRATION_HISTORY_GAP',
      { missingMigration: approved[i].migrationName, encounteredMigration: rows[i].migrationName });
    if (i && (rows[i].start <= rows[i - 1].start || rows[i].start < rows[i - 1].finish)) return blocked('BLOCKED_APPLICATION_ORDER',
      { predecessor: rows[i - 1].migrationName, migrationName: rows[i].migrationName });
  }
  const n = rows.length;
  if (n === 0 && options.allowEmpty !== true) return blocked('BLOCKED_EMPTY_BASELINE_REQUIRES_EXPLICIT_APPROVAL');
  if (n !== 0 && n !== 8 && n !== 13 && n < 14) return blocked('BLOCKED_UNAPPROVED_BASELINE_PREFIX', { count: n });
  return { eligible: true, classification: n === 0 ? 'ELIGIBLE_APPROVED_EMPTY_BASELINE' :
    n < 14 ? 'ELIGIBLE_PRE_UBOQ_BASELINE' : 'ELIGIBLE_CANONICAL_REVIEWED_LINEAGE',
    baseline: n === 0 ? 'EXPLICIT_EMPTY' : n === 8 ? 'ORIGIN_MAIN_8_REVIEWED_LOCAL_BYTES' : n === 13 ? 'RELEASE_PRE_UBOQ_13' : 'CANONICAL_RELEASE_PREFIX',
    verifiedMigrationCount: n, recordedChecksum: n >= 14 ? CANONICAL_MIG14_SHA256 : undefined,
    pendingMigrationCount: approved.length - n };
}

/** Actual target preflight: only SELECTs in a read-only transaction; no local file writes.
 * Pass an already-configured pg client. Credentials never enter the output.
 */
async function inspectTargetLedger(client, disk, authority, options = {}) {
  await client.query('BEGIN TRANSACTION READ ONLY');
  try {
    const ledgerExists = (await client.query("SELECT to_regclass('public.\"_prisma_migrations\"') AS ledger")).rows[0].ledger;
    let rows = [];
    if (ledgerExists) {
      rows = (await client.query('SELECT migration_name, checksum, started_at, finished_at, rolled_back_at, applied_steps_count, logs FROM public."_prisma_migrations"')).rows;
    }
    if (!rows.length) {
      const objects = (await client.query(
        "SELECT n.nspname, c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace " +
        "WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname !~ '^pg_toast' " +
        "AND c.relkind IN ('r','p','v','m','S','f') AND c.relname <> '_prisma_migrations'"
      )).rows;
      if (objects.length) return { eligible: false, classification: 'BLOCKED_EMPTY_LEDGER_WITH_EXISTING_OBJECTS', evidence: { objectCount: objects.length } };
    }
    return evaluateTargetLedgerForMigration14(rows, disk, authority, options);
  } finally { await client.query('ROLLBACK'); }
}

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    assert(args.every(a => ['--target-read-only', '--allow-empty'].includes(a)) && args.includes('--target-read-only'),
      'Usage: node scripts/uboq/verify-migration14-provenance-gate.cjs --target-read-only [--allow-empty]');
    assert(process.env.MIGRATION14_TARGET_DATABASE_URL, 'Set MIGRATION14_TARGET_DATABASE_URL securely in the process environment');
    const disk = loadDiskMigrations(), authority = loadApprovedAuthority(disk);
    const { Client } = require('pg');
    const c = new Client({ connectionString: process.env.MIGRATION14_TARGET_DATABASE_URL,
      options: '-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000',
      application_name: 'oserp-migration14-read-only-preflight' });
    try {
      await c.connect();
      const verdict = await inspectTargetLedger(c, disk, authority, { allowEmpty: args.includes('--allow-empty') });
      console.log(JSON.stringify(verdict, null, 2));
      if (!verdict.eligible) process.exitCode = 1;
    } finally { await c.end(); }
  })().catch(() => { console.error('Preflight failed closed; inspect target access and approved baseline. No deployment clearance issued.'); process.exitCode = 1; });
}
module.exports = { evaluateTargetLedgerForMigration14, loadDiskMigrations, loadApprovedAuthority, inspectTargetLedger };
