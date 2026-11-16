'use strict';

/**
 * Managed PostgreSQL 18 Release-Candidate Gate (`MANAGED_PG18_RC_V1`)
 *
 * Strictly READ-ONLY & FAIL-CLOSED:
 * - Never modifies historical `prisma/migrations/**` or retained acceptance receipts.
 * - Cryptographically pins historical receipts, the independently accepted M14 classifier script
 *   (cross-verified against frozen `uboq-m14-classifier-final-review.zip`), canonical Migration #14,
 *   historical Migration #15, and candidate Migration #15.
 * - Enforces strict ledger provenance, order, timestamp, and checksum rules for `MANAGED_PG18_RC_V1`,
 *   explicitly blocking mixed historical-vs-candidate Migration #15 lineages.
 * - Enforces strict case-insensitive allowlist role-security and recursive `pg_auth_members` checks:
 *   * Rejects any unrecognized `/^oserp_/i` role (any casing).
 *   * Rejects `rolsuper = true` or `rolreplication = true` on any `/^oserp_/i` role or group member.
 *   * Rejects preexisting governed group roles before their creation migration (#14 / #18).
 *   * Rejects any non-allowlisted role (or any privileged role) holding direct or nested membership
 *     in any of the 6 governed group roles.
 *   * Rejects ANY login-capable role (`rolcanlogin = true`, zero exemptions) holding direct or nested
 *     membership in `oserp_migrations_owner` when post-deploy lockdown applies.
 *   * When `pg_catalog.pg_authid` is readable, additionally verifies `rolpassword IS NULL` on all
 *     governed group roles (and records `passwordNullCheckedViaPgAuthid: true/false` transparently).
 */

const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const RC_ID = 'MANAGED_PG18_RC_V1';
const RC_PRISMA_DIR = 'prisma/managed-pg18-rc-v1';
const RC_MIGRATIONS_DIR = `${RC_PRISMA_DIR}/migrations`;
const RC_MANIFEST_PATH = 'artifacts/uboq/managed-pg18-rc-v1/rc-v1-checksum-manifest.json';

const ORIGIN_MAIN_COMMIT = 'd08740b50d2c0eee9110497f247e213c20d0e06e';
const RELEASE_BASELINE_COMMIT = 'e98f5dba487828e272a62890f545035e69ad8d8c';
const PHASE1_RECEIPT_PATH = 'artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json';
const PHASE1_RECEIPT_SHA256 = 'f67634b39f9f2bf6e48ebd5b30b491de15d67614291bf27a9e47f65c57236070';
const M39_RECEIPT_PATH = 'artifacts/uboq/release-readiness/migration39-apply.json';
const M39_RECEIPT_SHA256 = 'fb74b7dce2d224fe5d0ec6cc154f608ffe315e25e82b135fc7099b285e61b5db';

const M14_CLASSIFIER_PATH = 'scripts/uboq/verify-migration14-provenance-gate.cjs';
const M14_CLASSIFIER_SHA256 = 'bea84029e746521207dac5fde86872a7abc1c43e5b8ce83802ca51d121ac1f5b';
const M14_CLASSIFIER_ARCHIVE_PATH = 'artifacts/uboq/wp3/uboq-m14-classifier-final-review.zip';
const M14_CLASSIFIER_ARCHIVE_SHA256 = '0fb31f0c67f59324c01773db981be96e0511a45fe860a9e2deb017d85f8f97a0';

const MIG14_NAME = '20261104193000_add_uboq_engine_and_g01_exc_01';
const CANONICAL_MIG14_SHA256 =
  'a4accf399ceeccd246e98f659dd1057805583e61af247a1a88f6e060a8b2016e';

const MIG15_NAME = '20261104233000_uboq_g02_remediation_hardening';
const HISTORICAL_MIG15_SHA256 =
  '1158b5b22b4ee7735c37bb1cf46cd21c7c2042bcef1afec31f454f229e8528db';
const CANDIDATE_MIG15_SHA256 =
  'f3398e991a045195a4903f32da2e71897d11c55a09a6edc6a2bbc2bb0bff35c8';

const EXPECTED_GROUP_ROLES = Object.freeze({
  oserp_migrations_owner: Object.freeze({
    minMigrationCount: 14,
    rolsuper: false,
    rolcanlogin: false,
    rolcreatedb: false,
    rolcreaterole: false,
    rolreplication: false,
    rolbypassrls: true,
  }),
  oserp_compat_app: Object.freeze({
    minMigrationCount: 14,
    rolsuper: false,
    rolcanlogin: false,
    rolcreatedb: false,
    rolcreaterole: false,
    rolreplication: false,
    rolbypassrls: false,
  }),
  oserp_legacy_app: Object.freeze({
    minMigrationCount: 14,
    rolsuper: false,
    rolcanlogin: false,
    rolcreatedb: false,
    rolcreaterole: false,
    rolreplication: false,
    rolbypassrls: false,
  }),
  oserp_maint_cleanup_role: Object.freeze({
    minMigrationCount: 14,
    rolsuper: false,
    rolcanlogin: false,
    rolcreatedb: false,
    rolcreaterole: false,
    rolreplication: false,
    rolbypassrls: false,
  }),
  oserp_company_payroll_app: Object.freeze({
    minMigrationCount: 18,
    rolsuper: false,
    rolcanlogin: false,
    rolcreatedb: false,
    rolcreaterole: false,
    rolreplication: false,
    rolbypassrls: false,
  }),
  oserp_company_payroll_verifier: Object.freeze({
    minMigrationCount: 18,
    rolsuper: false,
    rolcanlogin: false,
    rolcreatedb: false,
    rolcreaterole: false,
    rolreplication: false,
    rolbypassrls: false,
  }),
});

// Explicit exact-case allowlist of operational `oserp_*` roles permitted outside the 6 group roles.
// Any other `/^oserp_/i` role (including uppercase variants or ad-hoc `oserp_app`) fails closed.
const ALLOWED_OPERATIONAL_OSERP_ROLES = Object.freeze({
  oserp_preview_preflight_ro: Object.freeze({
    kind: 'READONLY_PREFLIGHT_LOGIN',
    allowedGroupMemberships: Object.freeze([]),
    allowedParentRoles: Object.freeze([]),
  }),
  oserp_preview_runtime_app: Object.freeze({
    kind: 'RESTRICTED_RUNTIME_LOGIN',
    allowedGroupMemberships: Object.freeze(['oserp_compat_app']),
    allowedParentRoles: Object.freeze(['oserp_compat_app']),
  }),
  oserp_preview_direct_app: Object.freeze({
    kind: 'RESTRICTED_RUNTIME_LOGIN',
    allowedGroupMemberships: Object.freeze(['oserp_compat_app']),
    allowedParentRoles: Object.freeze(['oserp_compat_app']),
  }),
  oserp_preview_payroll_app: Object.freeze({
    kind: 'RESTRICTED_RUNTIME_LOGIN',
    allowedGroupMemberships: Object.freeze(['oserp_company_payroll_app']),
    allowedParentRoles: Object.freeze(['oserp_company_payroll_app']),
  }),
  oserp_preview_migrate_admin: Object.freeze({
    kind: 'CONTROLLED_MIGRATE_ADMIN',
    allowedGroupMemberships: Object.freeze([
      'oserp_migrations_owner',
      'oserp_compat_app',
      'oserp_legacy_app',
      'oserp_maint_cleanup_role',
      'oserp_company_payroll_app',
      'oserp_company_payroll_verifier',
    ]),
    allowedParentRoles: Object.freeze([
      'oserp_migrations_owner',
      'oserp_compat_app',
      'oserp_legacy_app',
      'oserp_maint_cleanup_role',
      'oserp_company_payroll_app',
      'oserp_company_payroll_verifier',
    ]),
  }),
  oserp_preview_bootstrap_owner: Object.freeze({
    kind: 'DEDICATED_DB_BOOTSTRAP_OWNER',
    allowedGroupMemberships: Object.freeze([]),
    allowedParentRoles: Object.freeze(['neon_superuser']),
  }),
});

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function comparePrismaMigrationNames(aName, bName) {
  const aPrefix = aName.split('_')[0];
  const bPrefix = bName.split('_')[0];
  if (aPrefix !== bPrefix) return aPrefix < bPrefix ? -1 : 1;
  if (aName === bName) return 0;
  return aName < bName ? -1 : 1;
}

function parsePgTimestampMicros(val) {
  if (val instanceof Date) {
    const ms = val.getTime();
    return Number.isFinite(ms) ? BigInt(ms) * 1000n : null;
  }
  if (typeof val !== 'string' || !val.trim()) return null;
  const iso = val.trim().replace(' ', 'T').replace(/([+-]\d{2})$/, '$1:00');
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return null;
  const fracMatch = iso.match(/\.(\d+)/);
  const frac6 = fracMatch ? (fracMatch[1] + '000000').slice(0, 6) : '000000';
  const subMsMicros = BigInt(frac6.slice(3, 6));
  const secEpochMs = BigInt(d.getTime()) - BigInt(Number(frac6.slice(0, 3)));
  return (secEpochMs + BigInt(Number(frac6.slice(0, 3)))) * 1000n + subMsMicros;
}

function extractZipEntryBytes(zipBuf, targetEntryPath) {
  let offset = 0;
  while (offset + 30 <= zipBuf.length) {
    const sig = zipBuf.readUInt32LE(offset);
    if (sig !== 0x04034b50) break;
    const compMethod = zipBuf.readUInt16LE(offset + 8);
    const compSize = zipBuf.readUInt32LE(offset + 18);
    const nameLen = zipBuf.readUInt16LE(offset + 26);
    const extraLen = zipBuf.readUInt16LE(offset + 28);
    const name = zipBuf.slice(offset + 30, offset + 30 + nameLen).toString('utf8');
    const dataStart = offset + 30 + nameLen + extraLen;
    const compSlice = zipBuf.slice(dataStart, dataStart + compSize);
    if (name === targetEntryPath) {
      if (compMethod === 0) return compSlice;
      if (compMethod === 8) return zlib.inflateRawSync(compSlice);
      throw new Error(`Unsupported ZIP compression method ${compMethod}`);
    }
    offset = dataStart + compSize;
  }
  return null;
}

function git(args, encoding = 'utf8') {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding,
    stdio: ['ignore', 'pipe', 'pipe'],
    maxBuffer: 32 * 1024 * 1024,
  });
}

function loadRcDiskMigrations(migrationsRoot = RC_MIGRATIONS_DIR) {
  const dirs = fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort(comparePrismaMigrationNames);
  return dirs.map((name, idx) => {
    const rel = `${migrationsRoot}/${name}/migration.sql`;
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

function loadManagedPg18RcAuthority(rcDisk = loadRcDiskMigrations()) {
  assert.equal(
    git(['rev-parse', 'origin/main']).trim(),
    ORIGIN_MAIN_COMMIT,
    'origin/main diverged from pinned commit'
  );
  const originPaths = git([
    'ls-tree',
    '-r',
    '--name-only',
    ORIGIN_MAIN_COMMIT,
    '--',
    'prisma/migrations',
  ])
    .trim()
    .split(/\r?\n/)
    .filter((p) => p.endsWith('/migration.sql'))
    .sort();
  assert.equal(originPaths.length, 8);
  assert.equal(
    originPaths.some((p) => p.includes(MIG15_NAME)),
    false,
    'Production origin/main must not contain Migration #15'
  );

  // Verify historical receipts AND frozen M14 classifier archive + script bytes remain untouched
  assert.equal(sha256(fs.readFileSync(PHASE1_RECEIPT_PATH)), PHASE1_RECEIPT_SHA256);
  assert.equal(sha256(fs.readFileSync(M39_RECEIPT_PATH)), M39_RECEIPT_SHA256);
  const m14ZipBuf = fs.readFileSync(M14_CLASSIFIER_ARCHIVE_PATH);
  assert.equal(sha256(m14ZipBuf), M14_CLASSIFIER_ARCHIVE_SHA256);
  const archivedClassifierBytes = extractZipEntryBytes(m14ZipBuf, M14_CLASSIFIER_PATH);
  assert.ok(archivedClassifierBytes, 'M14 classifier entry missing in frozen review archive');
  assert.equal(sha256(archivedClassifierBytes), M14_CLASSIFIER_SHA256);
  assert.equal(
    sha256(fs.readFileSync(M14_CLASSIFIER_PATH)),
    M14_CLASSIFIER_SHA256,
    'Historical M14 classifier script modified on disk'
  );

  const accepted = JSON.parse(fs.readFileSync(PHASE1_RECEIPT_PATH, 'utf8'));
  const m39 = JSON.parse(fs.readFileSync(M39_RECEIPT_PATH, 'utf8'));
  const historicalMap = { ...accepted.migrations_1_to_38, [m39.migration_path]: m39.sha256 };
  const historicalSorted = Object.keys(historicalMap)
    .sort((a, b) => comparePrismaMigrationNames(a.split('/')[2], b.split('/')[2]))
    .map((relPath, i) => ({
      index: i + 1,
      relPath,
      migrationName: relPath.split('/')[2],
      sha256: historicalMap[relPath],
    }));

  assert.equal(historicalSorted.length, 39);
  assert.equal(historicalSorted[13].migrationName, MIG14_NAME);
  assert.equal(historicalSorted[13].sha256, CANONICAL_MIG14_SHA256);
  assert.equal(historicalSorted[14].migrationName, MIG15_NAME);
  assert.equal(historicalSorted[14].sha256, HISTORICAL_MIG15_SHA256);

  // Verify all 39 historical SQL files in `prisma/migrations` remain untouched on disk
  for (const h of historicalSorted) {
    assert.equal(
      sha256(fs.readFileSync(h.relPath)),
      h.sha256,
      `Historical migration file modified: ${h.relPath}`
    );
  }

  // Verify RC schema matches canonical Prisma schema
  const rootSchemaSha = sha256(fs.readFileSync('prisma/schema.prisma'));
  const rcSchemaSha = sha256(fs.readFileSync(`${RC_PRISMA_DIR}/schema.prisma`));
  assert.equal(rcSchemaSha, rootSchemaSha, 'RC schema.prisma diverged from prisma/schema.prisma');

  // Verify line-by-line delta between historical Migration #15 and RC Migration #15
  const origM15Raw = fs.readFileSync(`prisma/migrations/${MIG15_NAME}/migration.sql`);
  const rcM15Raw = fs.readFileSync(`${RC_MIGRATIONS_DIR}/${MIG15_NAME}/migration.sql`);
  assert.equal(sha256(origM15Raw), HISTORICAL_MIG15_SHA256);
  assert.equal(sha256(rcM15Raw), CANDIDATE_MIG15_SHA256);
  assert.equal(rcM15Raw.includes(Buffer.from('\r\n')), false);
  const origLines = origM15Raw.toString('utf8').split('\n');
  const rcLines = rcM15Raw.toString('utf8').split('\n');
  assert.equal(rcLines.length, origLines.length);
  for (let idx = 0; idx < origLines.length; idx += 1) {
    if (idx >= 28 && idx <= 31) {
      assert.equal(origLines[idx].replace('NOSUPERUSER ', ''), rcLines[idx]);
    } else {
      assert.equal(rcLines[idx], origLines[idx]);
    }
  }

  const approvedCandidate = historicalSorted.map((h) => ({
    index: h.index,
    migrationName: h.migrationName,
    relPath: `${RC_MIGRATIONS_DIR}/${h.migrationName}/migration.sql`,
    historicalSha256: h.sha256,
    sha256: h.migrationName === MIG15_NAME ? CANDIDATE_MIG15_SHA256 : h.sha256,
  }));

  assert.deepEqual(
    rcDisk.map((m) => [m.migrationName, m.sha256]),
    approvedCandidate.map((m) => [m.migrationName, m.sha256]),
    'RC disk migrations differ from pinned MANAGED_PG18_RC_V1 authority'
  );

  // Cross-verify `rc-v1-checksum-manifest.json` matches the pinned authority
  const manifest = JSON.parse(fs.readFileSync(RC_MANIFEST_PATH, 'utf8'));
  assert.equal(manifest.releaseCandidateId, RC_ID);
  assert.equal(manifest.schemaSha256, rootSchemaSha);
  assert.equal(manifest.migration15DeltaReconciliation.historicalSha256, HISTORICAL_MIG15_SHA256);
  assert.equal(manifest.migration15DeltaReconciliation.candidateSha256, CANDIDATE_MIG15_SHA256);
  assert.deepEqual(
    manifest.migrations.map((m) => [m.migrationName, m.historicalSha256, m.candidateSha256]),
    approvedCandidate.map((m) => [m.migrationName, m.historicalSha256, m.sha256]),
    'RC checksum manifest drifted from pinned MANAGED_PG18_RC_V1 authority'
  );

  return {
    releaseCandidateId: RC_ID,
    originMainCommit: ORIGIN_MAIN_COMMIT,
    originMainCount: 8,
    releaseBaselineCommit: RELEASE_BASELINE_COMMIT,
    releaseBaselineCount: 13,
    historicalMig15Sha256: HISTORICAL_MIG15_SHA256,
    candidateMig15Sha256: CANDIDATE_MIG15_SHA256,
    m14ClassifierVerifiedAgainstFrozenArchive: M14_CLASSIFIER_SHA256,
    approved: approvedCandidate,
  };
}

function evaluateTargetLedgerForManagedPg18Rc(ledgerRows, rcDisk, authority, options = {}) {
  const blocked = (classification, evidence = {}) => ({
    eligible: false,
    classification,
    evidence,
  });

  const approved = authority?.approved;
  if (
    !Array.isArray(approved) ||
    approved.length !== 39 ||
    authority.releaseCandidateId !== RC_ID ||
    authority.originMainCommit !== ORIGIN_MAIN_COMMIT ||
    authority.originMainCount !== 8 ||
    authority.releaseBaselineCount !== 13 ||
    approved[13]?.migrationName !== MIG14_NAME ||
    approved[13]?.sha256 !== CANONICAL_MIG14_SHA256 ||
    approved[14]?.migrationName !== MIG15_NAME ||
    approved[14]?.sha256 !== CANDIDATE_MIG15_SHA256 ||
    authority.historicalMig15Sha256 !== HISTORICAL_MIG15_SHA256 ||
    new Set(approved.map((m) => m.migrationName)).size !== approved.length ||
    JSON.stringify(rcDisk.map((m) => [m.migrationName, m.sha256])) !==
      JSON.stringify(approved.map((m) => [m.migrationName, m.sha256]))
  ) {
    return blocked('BLOCKED_UNVERIFIED_RC_AUTHORITY');
  }

  const byName = new Map(approved.map((m, i) => [m.migrationName, { ...m, index: i }]));
  const seen = new Set();
  const rows = [];

  for (const r of ledgerRows) {
    const m = byName.get(r.migration_name);
    if (!m) {
      return blocked('BLOCKED_UNKNOWN_APPLIED_MIGRATION', { migrationName: r.migration_name });
    }
    if (seen.has(r.migration_name)) {
      return blocked('BLOCKED_DUPLICATE_LEDGER_ROW', { migrationName: r.migration_name });
    }
    seen.add(r.migration_name);

    if (
      r.rolled_back_at !== null ||
      !r.finished_at ||
      !r.started_at ||
      !Number.isInteger(r.applied_steps_count) ||
      r.applied_steps_count < 1 ||
      (r.logs !== null && r.logs !== undefined && r.logs !== '')
    ) {
      return blocked('BLOCKED_INCOMPLETE_ROLLED_BACK_OR_FAILED_MIGRATION', {
        migrationName: r.migration_name,
      });
    }

    const start = parsePgTimestampMicros(r.started_at_iso || r.started_at);
    const finish = parsePgTimestampMicros(r.finished_at_iso || r.finished_at);
    if (start === null || finish === null || finish < start) {
      return blocked('BLOCKED_INVALID_APPLICATION_TIMESTAMPS', {
        migrationName: r.migration_name,
      });
    }

    if (r.checksum !== m.sha256) {
      if (r.migration_name === MIG14_NAME) {
        return blocked('BLOCKED_DIVERGENT_MIGRATION14_PROVENANCE', {
          migrationName: r.migration_name,
          expectedChecksum: m.sha256,
          recordedChecksum: r.checksum,
        });
      }
      if (r.migration_name === MIG15_NAME && r.checksum === HISTORICAL_MIG15_SHA256) {
        return blocked('BLOCKED_HISTORICAL_LOCAL_MIG15_LINEAGE', {
          migrationName: r.migration_name,
          expectedCandidateChecksum: CANDIDATE_MIG15_SHA256,
          recordedHistoricalChecksum: r.checksum,
        });
      }
      return blocked('BLOCKED_CHECKSUM_DRIFT', {
        migrationName: r.migration_name,
        expectedChecksum: m.sha256,
        recordedChecksum: r.checksum,
      });
    }

    rows.push({ ...m, start, finish });
  }

  rows.sort((a, b) => a.index - b.index);
  for (let i = 0; i < rows.length; i += 1) {
    if (rows[i].index !== i) {
      return blocked('BLOCKED_MIGRATION_HISTORY_GAP', {
        missingMigration: approved[i].migrationName,
        encounteredMigration: rows[i].migrationName,
      });
    }
    if (
      i > 0 &&
      (rows[i].start < rows[i - 1].start ||
        rows[i].start < rows[i - 1].finish ||
        (rows[i].start === rows[i - 1].start && rows[i - 1].finish > rows[i - 1].start))
    ) {
      return blocked('BLOCKED_APPLICATION_ORDER', {
        predecessor: rows[i - 1].migrationName,
        migrationName: rows[i].migrationName,
      });
    }
  }

  const n = rows.length;
  if (n === 0 && options.allowEmpty !== true) {
    return blocked('BLOCKED_EMPTY_BASELINE_REQUIRES_EXPLICIT_APPROVAL');
  }
  if (n !== 0 && n !== 8 && n !== 13 && n < 14) {
    return blocked('BLOCKED_UNAPPROVED_BASELINE_PREFIX', { count: n });
  }

  return {
    eligible: true,
    releaseCandidateId: RC_ID,
    classification:
      n === 0
        ? 'ELIGIBLE_APPROVED_EMPTY_BASELINE'
        : n < 14
          ? 'ELIGIBLE_PRE_UBOQ_BASELINE'
          : 'ELIGIBLE_MANAGED_PG18_RC_V1_LINEAGE',
    baseline:
      n === 0
        ? 'EXPLICIT_EMPTY'
        : n === 8
          ? 'ORIGIN_MAIN_8_REVIEWED_LOCAL_BYTES'
          : n === 13
            ? 'RELEASE_PRE_UBOQ_13'
            : 'MANAGED_PG18_RC_V1_PREFIX',
    verifiedMigrationCount: n,
    recordedMigration14Checksum: n >= 14 ? CANONICAL_MIG14_SHA256 : undefined,
    recordedMigration15Checksum: n >= 15 ? CANDIDATE_MIG15_SHA256 : undefined,
    pendingMigrationCount: approved.length - n,
  };
}

/**
 * Compute transitive `(groupName -> Set<memberRoleName>)` closure over `membershipEdges`
 * (`Array<{ group_name: string, member_name: string }>`).
 */
function computeRecursiveGroupMemberships(membershipEdges = []) {
  const directGroupToMembers = new Map();
  const directMemberToParents = new Map();
  for (const edge of membershipEdges) {
    if (!edge || typeof edge.group_name !== 'string' || typeof edge.member_name !== 'string') {
      continue;
    }
    if (!directGroupToMembers.has(edge.group_name)) {
      directGroupToMembers.set(edge.group_name, new Set());
    }
    directGroupToMembers.get(edge.group_name).add(edge.member_name);

    if (!directMemberToParents.has(edge.member_name)) {
      directMemberToParents.set(edge.member_name, new Set());
    }
    directMemberToParents.get(edge.member_name).add(edge.group_name);
  }

  const transitiveDescendantsByGroup = new Map();
  for (const groupName of Object.keys(EXPECTED_GROUP_ROLES)) {
    const visited = new Set();
    const queue = [...(directGroupToMembers.get(groupName) || [])];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const sub of directGroupToMembers.get(cur) || []) {
        if (!visited.has(sub)) queue.push(sub);
      }
    }
    transitiveDescendantsByGroup.set(groupName, visited);
  }

  function getTransitiveAncestors(roleName) {
    const visited = new Set();
    const queue = [...(directMemberToParents.get(roleName) || [])];
    while (queue.length > 0) {
      const cur = queue.shift();
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const parent of directMemberToParents.get(cur) || []) {
        if (!visited.has(parent)) queue.push(parent);
      }
    }
    return visited;
  }

  return { transitiveDescendantsByGroup, getTransitiveAncestors };
}

function evaluateRolePostureForManagedPg18Rc(
  pgRolesRows,
  verifiedMigrationCount,
  options = {},
  membershipEdges = []
) {
  const blocked = (classification, evidence = {}) => ({
    ok: false,
    classification,
    evidence,
  });

  if (!Array.isArray(pgRolesRows) || !Array.isArray(membershipEdges)) {
    return blocked('BLOCKED_UNVERIFIED_ROLE_CATALOG');
  }

  // Post-deploy lockdown is unconditionally mandatory once all 39 migrations are present;
  // callers may opt in early (`< 39`), never opt out at `>= 39`.
  const requireLockedMigrateAdmin =
    verifiedMigrationCount >= 39 || Boolean(options.requireLockedMigrateAdmin);

  const byRole = new Map();
  for (const r of pgRolesRows) {
    if (!r || typeof r.rolname !== 'string') continue;
    if (byRole.has(r.rolname)) {
      return blocked('BLOCKED_DUPLICATE_ROLE_ROW', { rolname: r.rolname });
    }
    byRole.set(r.rolname, r);

    // 1) Case-insensitive check for ANY `/^oserp_/i` role:
    //    - Must NEVER have `rolsuper` or `rolreplication`.
    //    - Must belong to the exact-case allowlist (`EXPECTED_GROUP_ROLES` or `ALLOWED_OPERATIONAL_OSERP_ROLES`).
    if (/^oserp_/i.test(r.rolname)) {
      if (Boolean(r.rolsuper) || Boolean(r.rolreplication)) {
        return blocked('BLOCKED_PRIVILEGED_OSERP_ROLE_DETECTED', {
          rolname: r.rolname,
          rolsuper: Boolean(r.rolsuper),
          rolreplication: Boolean(r.rolreplication),
        });
      }
      const isKnownGroup = Object.prototype.hasOwnProperty.call(EXPECTED_GROUP_ROLES, r.rolname);
      const isKnownOperational = Object.prototype.hasOwnProperty.call(
        ALLOWED_OPERATIONAL_OSERP_ROLES,
        r.rolname
      );
      if (!isKnownGroup && !isKnownOperational) {
        return blocked('BLOCKED_UNRECOGNIZED_OSERP_ROLE', {
          rolname: r.rolname,
          rolcanlogin: Boolean(r.rolcanlogin),
          rolbypassrls: Boolean(r.rolbypassrls),
          rolcreatedb: Boolean(r.rolcreatedb),
          rolcreaterole: Boolean(r.rolcreaterole),
        });
      }
    }
  }

  // 2) Governed migration-created group roles: forbid preexistence before creation migration,
  //    and enforce exact attribute vectors at/after creation migration.
  for (const [roleName, spec] of Object.entries(EXPECTED_GROUP_ROLES)) {
    const row = byRole.get(roleName);
    if (verifiedMigrationCount < spec.minMigrationCount) {
      if (row) {
        return blocked('BLOCKED_PREEXISTING_GOVERNED_GROUP_ROLE', {
          rolname: roleName,
          verifiedMigrationCount,
          expectedCreationMigrationIndex: spec.minMigrationCount,
          observedAttributes: {
            rolsuper: Boolean(row.rolsuper),
            rolcanlogin: Boolean(row.rolcanlogin),
            rolbypassrls: Boolean(row.rolbypassrls),
          },
        });
      }
      continue;
    }

    if (!row) {
      return blocked('BLOCKED_MISSING_GOVERNED_GROUP_ROLE', {
        rolname: roleName,
        verifiedMigrationCount,
      });
    }

    for (const attr of [
      'rolsuper',
      'rolcanlogin',
      'rolcreatedb',
      'rolcreaterole',
      'rolreplication',
      'rolbypassrls',
    ]) {
      if (Boolean(row[attr]) !== spec[attr]) {
        return blocked('BLOCKED_UNEXPECTED_GROUP_ROLE_ATTRIBUTES', {
          rolname: roleName,
          attribute: attr,
          expected: spec[attr],
          observed: Boolean(row[attr]),
        });
      }
    }

    if (row.has_password === true) {
      return blocked('BLOCKED_GROUP_ROLE_HAS_STATIC_PASSWORD', { rolname: roleName });
    }
  }

  // 3) Check all present allowlisted operational `oserp_preview_*` roles
  for (const [roleName, opSpec] of Object.entries(ALLOWED_OPERATIONAL_OSERP_ROLES)) {
    const row = byRole.get(roleName);
    if (!row) continue;

    if (
      opSpec.kind === 'READONLY_PREFLIGHT_LOGIN' ||
      opSpec.kind === 'RESTRICTED_RUNTIME_LOGIN'
    ) {
      if (
        Boolean(row.rolsuper) ||
        Boolean(row.rolreplication) ||
        Boolean(row.rolbypassrls) ||
        Boolean(row.rolcreatedb) ||
        Boolean(row.rolcreaterole)
      ) {
        return blocked('BLOCKED_OVERPRIVILEGED_RUNTIME_OR_PREFLIGHT_LOGIN', {
          rolname: roleName,
          rolsuper: Boolean(row.rolsuper),
          rolbypassrls: Boolean(row.rolbypassrls),
          rolcreatedb: Boolean(row.rolcreatedb),
          rolcreaterole: Boolean(row.rolcreaterole),
        });
      }
      if (opSpec.kind === 'READONLY_PREFLIGHT_LOGIN' && Boolean(row.rolinherit)) {
        return blocked('BLOCKED_PREFLIGHT_LOGIN_MUST_BE_NOINHERIT', { rolname: roleName });
      }
    } else if (opSpec.kind === 'CONTROLLED_MIGRATE_ADMIN' && requireLockedMigrateAdmin) {
      if (
        Boolean(row.rolcanlogin) ||
        Boolean(row.rolbypassrls) ||
        Boolean(row.rolcreatedb) ||
        Boolean(row.rolcreaterole)
      ) {
        return blocked('BLOCKED_UNLOCKED_MIGRATE_ADMIN_ROLE', {
          rolname: roleName,
          rolcanlogin: Boolean(row.rolcanlogin),
          rolbypassrls: Boolean(row.rolbypassrls),
          rolcreatedb: Boolean(row.rolcreatedb),
          rolcreaterole: Boolean(row.rolcreaterole),
        });
      }
    }
  }

  // 4) Bidirectional transitive `pg_auth_members` & delegation-option (`admin_option` / `inherit_option` / `set_option`) audit:
  const { transitiveDescendantsByGroup, getTransitiveAncestors } =
    computeRecursiveGroupMemberships(membershipEdges);

  //    (4.0) Edge structure & delegation-authority (`admin_option`) enforcement:
  //          - Every edge must have valid string `group_name` and `member_name` (and explicit booleans
  //            for `admin_option`, `inherit_option`, `set_option` when queried from PostgreSQL).
  //          - Restricted runtime logins and read-only preflight logins MUST NEVER hold `admin_option = true`
  //            on ANY role membership edge (preventing post-approval membership delegation despite `NOCREATEROLE`),
  //            and restricted runtime logins MUST NOT have `inherit_option = false`.
  //          - Across all 6 governed group roles (and any transitive descendant role inside them), NO role
  //            other than `oserp_preview_migrate_admin` (which is enforced locked `NOLOGIN` post-deploy)
  //            may hold `admin_option = true`.
  const allGovernedAndSubgroupNames = new Set(Object.keys(EXPECTED_GROUP_ROLES));
  for (const members of transitiveDescendantsByGroup.values()) {
    for (const mName of members) {
      const mRow = byRole.get(mName);
      if (mRow && !Boolean(mRow.rolcanlogin)) {
        allGovernedAndSubgroupNames.add(mName);
      }
    }
  }

  for (const edge of membershipEdges) {
    if (!edge || typeof edge !== 'object' || typeof edge.group_name !== 'string' || typeof edge.member_name !== 'string') {
      return blocked('BLOCKED_MALFORMED_MEMBERSHIP_EDGE', { edge: edge ?? null });
    }
    if (
      options.requireExplicitMembershipOptions &&
      (typeof edge.admin_option !== 'boolean' ||
        typeof edge.inherit_option !== 'boolean' ||
        typeof edge.set_option !== 'boolean')
    ) {
      return blocked('BLOCKED_MISSING_MEMBERSHIP_OPTIONS', {
        groupName: edge.group_name,
        memberName: edge.member_name,
      });
    }

    const memberOpSpec = ALLOWED_OPERATIONAL_OSERP_ROLES[edge.member_name];
    if (
      memberOpSpec &&
      (memberOpSpec.kind === 'RESTRICTED_RUNTIME_LOGIN' ||
        memberOpSpec.kind === 'READONLY_PREFLIGHT_LOGIN')
    ) {
      if (Boolean(edge.admin_option)) {
        return blocked('BLOCKED_RUNTIME_ROLE_MEMBERSHIP_ADMIN_OPTION_FORBIDDEN', {
          groupName: edge.group_name,
          memberName: edge.member_name,
          adminOption: true,
        });
      }
      if (memberOpSpec.kind === 'RESTRICTED_RUNTIME_LOGIN' && edge.inherit_option === false) {
        return blocked('BLOCKED_RUNTIME_ROLE_MEMBERSHIP_INHERIT_DISABLED', {
          groupName: edge.group_name,
          memberName: edge.member_name,
          inheritOption: false,
        });
      }
    }

    if (Boolean(edge.admin_option) && allGovernedAndSubgroupNames.has(edge.group_name)) {
      if (edge.member_name !== 'oserp_preview_migrate_admin') {
        return blocked('BLOCKED_UNAUTHORIZED_GOVERNED_GROUP_ADMIN_OPTION', {
          groupName: edge.group_name,
          memberName: edge.member_name,
          adminOption: true,
        });
      }
      const migrateRow = byRole.get('oserp_preview_migrate_admin');
      if (requireLockedMigrateAdmin && migrateRow && Boolean(migrateRow.rolcanlogin)) {
        return blocked('BLOCKED_ACTIVE_LOGIN_ADMIN_OPTION_ON_GOVERNED_GROUP', {
          groupName: edge.group_name,
          memberName: edge.member_name,
        });
      }
    }
  }

  //    (4a) Descendant audit across ALL 6 governed group roles (zero exemptions):
  for (const [groupName, members] of transitiveDescendantsByGroup.entries()) {
    for (const memberName of members) {
      const memberRow = byRole.get(memberName);
      if (!memberRow) {
        return blocked('BLOCKED_UNINSPECTED_GOVERNED_GROUP_MEMBER', {
          groupName,
          memberName,
        });
      }

      if (Boolean(memberRow.rolsuper) || Boolean(memberRow.rolreplication)) {
        return blocked('BLOCKED_PRIVILEGED_GOVERNED_GROUP_MEMBER', {
          groupName,
          memberName,
          rolsuper: Boolean(memberRow.rolsuper),
          rolreplication: Boolean(memberRow.rolreplication),
        });
      }

      const opSpec = ALLOWED_OPERATIONAL_OSERP_ROLES[memberName];
      if (!opSpec || !opSpec.allowedGroupMemberships.includes(groupName)) {
        return blocked('BLOCKED_UNAUTHORIZED_GOVERNED_GROUP_MEMBER', {
          groupName,
          memberName,
        });
      }

      if (
        groupName === 'oserp_migrations_owner' &&
        requireLockedMigrateAdmin &&
        Boolean(memberRow.rolcanlogin)
      ) {
        return blocked('BLOCKED_ACTIVE_LOGIN_MEMBER_OF_MIGRATIONS_OWNER', {
          groupName,
          memberName,
        });
      }
    }
  }

  //    (4b) Ancestor (parent-role) audit:
  //         - Governed group roles MUST NOT belong to ANY parent role (`0` ancestors), blocking
  //           privilege escalation via `GRANT privileged_role TO oserp_compat_app` (`SET ROLE` / inherit).
  for (const groupName of Object.keys(EXPECTED_GROUP_ROLES)) {
    const ancestors = getTransitiveAncestors(groupName);
    if (ancestors.size > 0) {
      return blocked('BLOCKED_UNEXPECTED_PARENT_ROLE_ON_GOVERNED_GROUP', {
        groupName,
        parentRoles: [...ancestors].sort(),
      });
    }
  }

  //         - Operational `oserp_preview_*` roles MUST ONLY hold transitive parent roles in their
  //           explicit `allowedParentRoles` list (e.g., `oserp_preview_runtime_app` may ONLY have
  //           `oserp_compat_app` as a parent; granting `external_rls_owner` (`BYPASSRLS`) or
  //           `pg_read_all_data` or `neon_superuser` to any runtime/preflight login fails closed).
  for (const [roleName, opSpec] of Object.entries(ALLOWED_OPERATIONAL_OSERP_ROLES)) {
    if (!byRole.has(roleName)) continue;
    const ancestors = getTransitiveAncestors(roleName);
    for (const parentName of ancestors) {
      const parentRow = byRole.get(parentName);
      if (!parentRow) {
        return blocked('BLOCKED_UNINSPECTED_PARENT_ROLE', {
          rolname: roleName,
          parentName,
        });
      }
      if (!opSpec.allowedParentRoles.includes(parentName)) {
        return blocked('BLOCKED_UNAUTHORIZED_PARENT_ROLE_ON_OPERATIONAL_ROLE', {
          rolname: roleName,
          parentName,
          parentBypassRls: Boolean(parentRow.rolbypassrls),
          parentSuper: Boolean(parentRow.rolsuper),
        });
      }
      if (
        (opSpec.kind === 'READONLY_PREFLIGHT_LOGIN' ||
          opSpec.kind === 'RESTRICTED_RUNTIME_LOGIN') &&
        (Boolean(parentRow.rolsuper) ||
          Boolean(parentRow.rolreplication) ||
          Boolean(parentRow.rolbypassrls) ||
          Boolean(parentRow.rolcreatedb) ||
          Boolean(parentRow.rolcreaterole))
      ) {
        return blocked('BLOCKED_PRIVILEGED_PARENT_ROLE_ON_RUNTIME_OR_PREFLIGHT_LOGIN', {
          rolname: roleName,
          parentName,
        });
      }
    }
  }

  return {
    ok: true,
    classification: 'PASS_ROLE_POSTURE_VERIFIED',
    allOserpRolesNonSuperuser: true,
    passwordNullCheckedViaPgAuthid: Boolean(options.passwordNullCheckedViaPgAuthid),
    inspectedOserpRoleCount: [...byRole.keys()].filter((k) => /^oserp_/i.test(k)).length,
    verifiedGroupRoles: Object.keys(EXPECTED_GROUP_ROLES).filter((k) => byRole.has(k)),
  };
}

async function inspectTargetForManagedPg18Rc(
  client,
  rcDisk = loadRcDiskMigrations(),
  authority = loadManagedPg18RcAuthority(rcDisk),
  options = {}
) {
  await client.query('BEGIN TRANSACTION READ ONLY');
  try {
    const sess = (
      await client.query(`
        SELECT
          current_user AS usr,
          current_setting('transaction_read_only') AS tx_ro,
          current_setting('server_version_num')::int AS server_version_num,
          r.rolsuper AS is_super,
          has_table_privilege(current_user, 'pg_catalog.pg_authid', 'SELECT') AS can_read_pg_authid
        FROM pg_roles r
        WHERE r.rolname = current_user
      `)
    ).rows[0];

    if (sess.tx_ro !== 'on') {
      return {
        eligible: false,
        classification: 'BLOCKED_SESSION_NOT_READ_ONLY',
      };
    }
    if (sess.server_version_num < 180000 || sess.server_version_num >= 190000) {
      return {
        eligible: false,
        classification: 'BLOCKED_UNSUPPORTED_POSTGRES_MAJOR_VERSION',
        evidence: { serverVersionNum: sess.server_version_num },
      };
    }
    if (sess.is_super && options.allowSuperuserInspection !== true) {
      return {
        eligible: false,
        classification: 'BLOCKED_SUPERUSER_INSPECTION_SESSION_FORBIDDEN',
      };
    }

    const ledgerExists = (
      await client.query(`SELECT to_regclass('public."_prisma_migrations"') AS ledger`)
    ).rows[0].ledger;
    let rows = [];
    if (ledgerExists) {
      rows = (
        await client.query(`
          SELECT
            migration_name,
            checksum,
            started_at,
            finished_at,
            to_char(started_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS started_at_iso,
            to_char(finished_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS finished_at_iso,
            rolled_back_at,
            applied_steps_count,
            logs
          FROM public."_prisma_migrations"
        `)
      ).rows;
    }

    if (!rows.length) {
      const objects = (
        await client.query(`
          SELECT n.nspname, c.relname
          FROM pg_class c
          JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname NOT IN ('pg_catalog', 'information_schema')
            AND n.nspname !~ '^pg_toast'
            AND c.relkind IN ('r','p','v','m','S','f')
            AND c.relname <> '_prisma_migrations'
        `)
      ).rows;
      if (objects.length > 0) {
        return {
          eligible: false,
          classification: 'BLOCKED_EMPTY_LEDGER_WITH_EXISTING_OBJECTS',
          evidence: { objectCount: objects.length },
        };
      }
    }

    const ledgerVerdict = evaluateTargetLedgerForManagedPg18Rc(rows, rcDisk, authority, options);
    if (!ledgerVerdict.eligible) {
      return ledgerVerdict;
    }

    // Fetch ALL role-membership edges across the cluster AND all case-insensitive `^oserp_` roles
    // plus every role participating in any membership edge, so nested and non-`oserp_*` members
    // are guaranteed present in `pgRoles`.
    const membershipEdges = (
      await client.query(`
        SELECT
          g.rolname AS group_name,
          m_role.rolname AS member_name,
          m.admin_option,
          m.inherit_option,
          m.set_option
        FROM pg_auth_members m
        JOIN pg_roles g ON g.oid = m.roleid
        JOIN pg_roles m_role ON m_role.oid = m.member
        ORDER BY g.rolname ASC, m_role.rolname ASC, m.admin_option DESC
      `)
    ).rows;

    let pgRoles;
    if (sess.can_read_pg_authid) {
      pgRoles = (
        await client.query(`
          SELECT
            rolname,
            rolsuper,
            rolinherit,
            rolcreaterole,
            rolcreatedb,
            rolcanlogin,
            rolreplication,
            rolbypassrls,
            rolconnlimit,
            rolpassword IS NOT NULL AS has_password
          FROM pg_catalog.pg_authid
          WHERE rolname !~ '^pg_'
             OR oid IN (SELECT roleid FROM pg_auth_members UNION SELECT member FROM pg_auth_members)
          ORDER BY rolname ASC
        `)
      ).rows;
    } else {
      pgRoles = (
        await client.query(`
          SELECT
            rolname,
            rolsuper,
            rolinherit,
            rolcreaterole,
            rolcreatedb,
            rolcanlogin,
            rolreplication,
            rolbypassrls,
            rolconnlimit
          FROM pg_roles
          WHERE rolname !~ '^pg_'
             OR oid IN (SELECT roleid FROM pg_auth_members UNION SELECT member FROM pg_auth_members)
          ORDER BY rolname ASC
        `)
      ).rows;
    }

    const roleVerdict = evaluateRolePostureForManagedPg18Rc(
      pgRoles,
      ledgerVerdict.verifiedMigrationCount,
      {
        ...options,
        requireExplicitMembershipOptions: true,
        passwordNullCheckedViaPgAuthid: Boolean(sess.can_read_pg_authid),
      },
      membershipEdges
    );
    if (!roleVerdict.ok) {
      return {
        eligible: false,
        classification: roleVerdict.classification,
        evidence: roleVerdict.evidence,
      };
    }

    return {
      ...ledgerVerdict,
      serverVersionNum: sess.server_version_num,
      roleSecurityPosture: roleVerdict,
    };
  } finally {
    await client.query('ROLLBACK');
  }
}

if (require.main === module) {
  (async () => {
    const args = process.argv.slice(2);
    assert(
      args.every((a) => ['--target-read-only', '--allow-empty'].includes(a)) &&
        args.includes('--target-read-only'),
      'Usage: node scripts/uboq/verify-managed-pg18-rc-v1-gate.cjs --target-read-only [--allow-empty]'
    );
    const rawUrl = process.env.MIGRATION14_TARGET_DATABASE_URL || '';
    assert(rawUrl, 'Set MIGRATION14_TARGET_DATABASE_URL securely in the process environment');
    const rcDisk = loadRcDiskMigrations();
    const authority = loadManagedPg18RcAuthority(rcDisk);
    const { Client } = require('pg');
    const { createNeonWsClient } = require('./neon-ws-transport.cjs');
    const u = new URL(rawUrl);
    u.searchParams.delete('channel_binding');
    const cleanUrl = u.toString();
    const c = /\.neon\.tech$/i.test(u.hostname)
      ? createNeonWsClient(cleanUrl, 'oserp-managed-pg18-rc-v1-preflight')
      : new Client({
          connectionString: cleanUrl,
          connectionTimeoutMillis: 15000,
          query_timeout: 20000,
          options: '-c default_transaction_read_only=on -c statement_timeout=15000 -c lock_timeout=3000',
          application_name: 'oserp-managed-pg18-rc-v1-preflight',
        });
    await c.connect();
    try {
      const verdict = await inspectTargetForManagedPg18Rc(c, rcDisk, authority, {
        allowEmpty: args.includes('--allow-empty'),
      });
      console.log(JSON.stringify(verdict, null, 2));
      if (!verdict.eligible) process.exitCode = 1;
    } finally {
      await c.end();
    }
  })().catch(() => {
    console.error(
      'Managed PG18 RC preflight failed closed; inspect target access, role attributes, and approved RC manifest.'
    );
    process.exitCode = 1;
  });
}

module.exports = {
  RC_ID,
  RC_PRISMA_DIR,
  RC_MIGRATIONS_DIR,
  RC_MANIFEST_PATH,
  M14_CLASSIFIER_PATH,
  M14_CLASSIFIER_SHA256,
  M14_CLASSIFIER_ARCHIVE_PATH,
  M14_CLASSIFIER_ARCHIVE_SHA256,
  HISTORICAL_MIG15_SHA256,
  CANDIDATE_MIG15_SHA256,
  CANONICAL_MIG14_SHA256,
  EXPECTED_GROUP_ROLES,
  ALLOWED_OPERATIONAL_OSERP_ROLES,
  loadRcDiskMigrations,
  loadManagedPg18RcAuthority,
  computeRecursiveGroupMemberships,
  evaluateTargetLedgerForManagedPg18Rc,
  evaluateRolePostureForManagedPg18Rc,
  inspectTargetForManagedPg18Rc,
};
