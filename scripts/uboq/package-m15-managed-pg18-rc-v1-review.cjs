'use strict';

/**
 * TASK 3 — Build Focused Compatibility-Review Package for `MANAGED_PG18_RC_V1`
 *
 * Produces:
 * - `artifacts/uboq/managed-pg18-rc-v1/README_COMPATIBILITY_REVIEW.md`
 * - `artifacts/uboq/wp3/uboq-m15-managed-pg18-rc-v1-review.zip`
 * - `artifacts/uboq/managed-pg18-rc-v1/rc-v1-review-package-manifest.json`
 */

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const OUT_DIR = 'artifacts/uboq/managed-pg18-rc-v1';
const README_PATH = `${OUT_DIR}/README_COMPATIBILITY_REVIEW.md`;
const OUT_ZIP = 'artifacts/uboq/wp3/uboq-m15-managed-pg18-rc-v1-review.zip';
const OUT_MANIFEST = `${OUT_DIR}/rc-v1-review-package-manifest.json`;

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function buildDeterministicZip(entries) {
  const dosTime = 0x0000;
  const dosDate = ((2026 - 1980) << 9) | (11 << 5) | 16;
  const localParts = [];
  const centralParts = [];
  let localOffset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.zipPath, 'utf8');
    const rawBuf = e.data;
    const rawCrc = crc32(rawBuf);
    const deflated = zlib.deflateRawSync(rawBuf, { level: 9 });
    const useDeflate = deflated.length < rawBuf.length;
    const compMethod = useDeflate ? 8 : 0;
    const compBuf = useDeflate ? deflated : rawBuf;

    const localHdr = Buffer.alloc(30);
    localHdr.writeUInt32LE(0x04034b50, 0);
    localHdr.writeUInt16LE(20, 4);
    localHdr.writeUInt16LE(0, 6);
    localHdr.writeUInt16LE(compMethod, 8);
    localHdr.writeUInt16LE(dosTime, 10);
    localHdr.writeUInt16LE(dosDate, 12);
    localHdr.writeUInt32LE(rawCrc, 14);
    localHdr.writeUInt32LE(compBuf.length, 18);
    localHdr.writeUInt32LE(rawBuf.length, 22);
    localHdr.writeUInt16LE(nameBuf.length, 26);
    localHdr.writeUInt16LE(0, 28);
    localParts.push(localHdr, nameBuf, compBuf);

    const centralHdr = Buffer.alloc(46);
    centralHdr.writeUInt32LE(0x02014b50, 0);
    centralHdr.writeUInt16LE(20, 4);
    centralHdr.writeUInt16LE(20, 6);
    centralHdr.writeUInt16LE(0, 8);
    centralHdr.writeUInt16LE(compMethod, 10);
    centralHdr.writeUInt16LE(dosTime, 12);
    centralHdr.writeUInt16LE(dosDate, 14);
    centralHdr.writeUInt32LE(rawCrc, 16);
    centralHdr.writeUInt32LE(compBuf.length, 20);
    centralHdr.writeUInt32LE(rawBuf.length, 24);
    centralHdr.writeUInt16LE(nameBuf.length, 28);
    centralHdr.writeUInt16LE(0, 30);
    centralHdr.writeUInt16LE(0, 32);
    centralHdr.writeUInt16LE(0, 34);
    centralHdr.writeUInt16LE(0, 36);
    centralHdr.writeUInt32LE(0, 38);
    centralHdr.writeUInt32LE(localOffset, 42);
    centralParts.push(centralHdr, nameBuf);

    localOffset += localHdr.length + nameBuf.length + compBuf.length;
  }

  const centralBuf = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuf.length, 12);
  eocd.writeUInt32LE(localOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuf, eocd]);
}

function main() {
  const rcManifest = JSON.parse(fs.readFileSync(`${OUT_DIR}/rc-v1-checksum-manifest.json`, 'utf8'));
  const valReceipt = JSON.parse(fs.readFileSync(`${OUT_DIR}/rc-v1-validation-receipt.json`, 'utf8'));
  assert.equal(valReceipt.overallDisposition, 'PASS_MANAGED_PG18_RC_V1_VALIDATED');

  const readme = `# OSERP-PROJ-UBOQ-001 — Migration #15 Managed PostgreSQL 18 Compatibility Review Package (\`MANAGED_PG18_RC_V1\`)

## 1. Scope & Historical Preservation
- **Original Historical Migration #15 (Preserved Unchanged):** \`prisma/migrations/20261104233000_uboq_g02_remediation_hardening/migration.sql\`
  - **SHA-256:** \`${rcManifest.migration15DeltaReconciliation.historicalSha256}\` (\`${rcManifest.migration15DeltaReconciliation.historicalBytes}\` bytes)
- **Candidate Migration #15 (\`MANAGED_PG18_RC_V1\`):** \`prisma/managed-pg18-rc-v1/migrations/20261104233000_uboq_g02_remediation_hardening/migration.sql\`
  - **SHA-256:** \`${rcManifest.migration15DeltaReconciliation.candidateSha256}\` (\`${rcManifest.migration15DeltaReconciliation.candidateBytes}\` bytes, \`-48\` byte delta)
- **All Other 38 Migrations (\`#1\`–\`#14\` & \`#16\`–\`#39\`):** 100% byte-identical between \`prisma/migrations/\` and \`prisma/managed-pg18-rc-v1/migrations/\`.
- **Historical Receipts & Local Ledger:** \`phase1-d2-r3-local-acceptance-receipt.json\`, \`migration39-apply.json\`, \`verify-migration14-provenance-gate.cjs\` (\`SHA-256: bea84029e746521207dac5fde86872a7abc1c43e5b8ce83802ca51d121ac1f5b\`, byte-verified by inflating \`scripts/uboq/verify-migration14-provenance-gate.cjs\` directly from frozen \`artifacts/uboq/wp3/uboq-m14-classifier-final-review.zip\` \`0fb31f0c67f59324c01773db981be96e0511a45fe860a9e2deb017d85f8f97a0\`), \`oserp_h02b_local_e5e20dc14c\`, and all frozen review ZIPs remain 100% untouched.
- **Git \`origin/main\` Non-Contamination:** \`origin/main\` (\`d08740b50d2c0eee9110497f247e213c20d0e06e\`) contains only Migrations \`#1\`–\`#8\`; Git \`origin/main\` does not contain Migration \`#15\` or \`MANAGED_PG18_RC_V1\`.

## 2. Why the Candidate Differs from Accepted Local History
PostgreSQL 16–18 \`AlterRole()\` (\`src/backend/commands/user.c\`) unconditionally rejects \`ALTER ROLE\` statements containing the \`NOSUPERUSER\` or \`SUPERUSER\` keyword when \`current_user\` has \`rolsuper = false\` (\`SQLSTATE 42501: Only roles with the SUPERUSER attribute may change the SUPERUSER attribute\`). Local acceptance executed as \`rolsuper = true\`; managed Neon PostgreSQL 18 enforces \`rolsuper = false\` on all tenant owner roles. Removing **only** \`NOSUPERUSER \` from lines 29–32 of Migration \`#15\` resolves \`42501\` without changing any table, policy, trigger, function, grant, or \`NOLOGIN\`/\`PASSWORD NULL\`/\`NOBYPASSRLS\` attribute.

## 3. Role-Security & Fail-Closed Controls (\`scripts/uboq/verify-managed-pg18-rc-v1-gate.cjs\`)
- Hard-pins historical receipt hashes, frozen \`uboq-m14-classifier-final-review.zip\` + \`verify-migration14-provenance-gate.cjs\`, canonical Migration \`#14\`, historical Migration \`#15\`, and candidate Migration \`#15\`, plus verifies line-by-line equality outside lines 29–32.
- Enforces PostgreSQL 18 (\`180000 <= server_version_num < 190000\`) and explicitly blocks mixed historical-vs-candidate Migration \`#15\` lineages (\`BLOCKED_HISTORICAL_LOCAL_MIG15_LINEAGE\`).
- Queries all non-\`pg_*\` roles and all \`pg_auth_members\` edges including \`admin_option\`, \`inherit_option\`, and \`set_option\`; enforces a case-insensitive exact-name allowlist across \`/^oserp_/i\` roles (blocking uppercase \`OSERP_*\` or unrecognized \`oserp_app\` roles), blocks any preexisting governed group role before \`#14\`/\`#18\`, rejects administrative membership delegation (\`admin_option = true\`) on restricted runtime/preflight roles or non-admin governed group members and rejects disabled inheritance (\`inherit_option = false\`) on runtime roles, computes full bidirectional transitive group-membership closure with **zero** exemptions (blocking non-\`oserp_*\` members, nested members, privileged ancestor/parent roles, and \`postgres\`/\`neondb_owner\`/\`oserp_preview_bootstrap_owner\` in \`oserp_migrations_owner\`), unconditionally locks \`oserp_preview_migrate_admin\` at count \`39\`, and queries \`pg_catalog.pg_authid\` when readable (\`passwordNullCheckedViaPgAuthid: true/false\` recorded transparently).

## 4. Disposable Isolated PostgreSQL 18 Validation (\`RC-VAL-01\` – \`RC-VAL-05\`)
- Executed full \`npx prisma migrate deploy --schema=prisma/managed-pg18-rc-v1/schema.prisma\` (\`39/39\` migrations) as a \`rolsuper = false\` role on a strictly PostgreSQL 18 \`initdb\` cluster (\`server_version_num >= 180000\`).
- Verified \`rolsuper = false\`, \`rolcanlogin = false\`, and \`rolpassword IS NULL\` in \`pg_authid\` across all 6 group roles, verified live rejection of \`WITH ADMIN OPTION\` on runtime roles, and verified comprehensive equivalence against \`oserp_h02b_local_e5e20dc14c\` across \`252\` tables, \`3865\` columns (including \`column_default\` & precision/scale), \`3021\` constraints, \`431\` indexes, \`325\` RLS policies, \`57\` triggers + \`tgenabled\`, column \`attacl\`s, custom type \`typacl\`s/enums, extensions, \`123\` functions (including full \`pg_get_functiondef\` SQL bodies, config, and \`proacl\`), relation/sequence \`relacl\`s, complete \`public\` schema \`nspacl\`, \`pg_default_acl\`, \`2489\` table grants, and governed role memberships including \`admin_option\`, \`inherit_option\`, and \`set_option\`.
`;

  fs.writeFileSync(README_PATH, readme, 'utf8');

  const filesToPack = [
    README_PATH,
    `${OUT_DIR}/migration15-rc-v1.diff`,
    `${OUT_DIR}/rc-v1-checksum-manifest.json`,
    `${OUT_DIR}/rc-v1-validation-receipt.json`,
    'prisma/migrations/20261104233000_uboq_g02_remediation_hardening/migration.sql',
    'prisma/managed-pg18-rc-v1/migrations/20261104233000_uboq_g02_remediation_hardening/migration.sql',
    'scripts/uboq/build-managed-pg18-rc-v1.cjs',
    'scripts/uboq/verify-managed-pg18-rc-v1-gate.cjs',
    'scripts/uboq/validate-managed-pg18-rc-v1.cjs',
  ];

  const entries = filesToPack.map((relPath) => {
    const data = fs.readFileSync(relPath);
    return {
      zipPath: relPath,
      bytes: data.length,
      sha256: sha256(data),
      data,
    };
  });

  fs.mkdirSync(path.dirname(OUT_ZIP), { recursive: true });
  const zipBuf = buildDeterministicZip(entries);
  fs.writeFileSync(OUT_ZIP, zipBuf);
  const zipSha256 = sha256(fs.readFileSync(OUT_ZIP));

  const pkgManifest = {
    project: 'OSERP-PROJ-UBOQ-001',
    releaseCandidateId: 'MANAGED_PG18_RC_V1',
    generatedAt: new Date().toISOString(),
    archivePath: OUT_ZIP,
    archiveBytes: zipBuf.length,
    archiveSha256: zipSha256,
    entryCount: entries.length,
    entries: entries.map(({ zipPath, bytes, sha256: s }) => ({ path: zipPath, bytes, sha256: s })),
  };
  fs.writeFileSync(OUT_MANIFEST, JSON.stringify(pkgManifest, null, 2) + '\n');
  console.log(JSON.stringify({ archivePath: OUT_ZIP, archiveSha256: zipSha256, bytes: zipBuf.length }, null, 2));
}

main();
