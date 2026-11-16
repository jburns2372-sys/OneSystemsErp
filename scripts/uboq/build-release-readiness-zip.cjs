'use strict';

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const OUT_ZIP = 'artifacts/uboq/wp3/uboq-release-readiness-review.zip';
const OUT_MANIFEST = 'artifacts/uboq/release-readiness/release-readiness-review-manifest.json';

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

// CRC-32 table for standard PKZIP archive creation & verification
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
  // Fixed DOS timestamp (2026-11-16 00:00:00) for deterministic archive bytes
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

function verifyZipRoundTrip(zipBuf, expectedEntries) {
  let eocdOffset = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65558); i -= 1) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  assert.ok(eocdOffset >= 0, 'EOCD missing');
  const count = zipBuf.readUInt16LE(eocdOffset + 10);
  assert.equal(count, expectedEntries.length);

  let cdOffset = zipBuf.readUInt32LE(eocdOffset + 16);
  const byPath = new Map(expectedEntries.map((e) => [e.zipPath, e.data]));

  for (let idx = 0; idx < count; idx += 1) {
    assert.equal(zipBuf.readUInt32LE(cdOffset), 0x02014b50);
    const method = zipBuf.readUInt16LE(cdOffset + 10);
    const expectedCrc = zipBuf.readUInt32LE(cdOffset + 16);
    const compSize = zipBuf.readUInt32LE(cdOffset + 20);
    const uncompSize = zipBuf.readUInt32LE(cdOffset + 24);
    const nameLen = zipBuf.readUInt16LE(cdOffset + 28);
    const extraLen = zipBuf.readUInt16LE(cdOffset + 30);
    const commentLen = zipBuf.readUInt16LE(cdOffset + 32);
    const localOffset = zipBuf.readUInt32LE(cdOffset + 42);
    const name = zipBuf.subarray(cdOffset + 46, cdOffset + 46 + nameLen).toString('utf8');
    cdOffset += 46 + nameLen + extraLen + commentLen;

    assert.equal(zipBuf.readUInt32LE(localOffset), 0x04034b50);
    const localNameLen = zipBuf.readUInt16LE(localOffset + 26);
    const localExtraLen = zipBuf.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const slice = zipBuf.subarray(dataStart, dataStart + compSize);
    const inflated = method === 0 ? slice : zlib.inflateRawSync(slice);

    assert.equal(inflated.length, uncompSize);
    assert.equal(crc32(inflated), expectedCrc);
    const orig = byPath.get(name);
    assert.ok(orig, `Unexpected ZIP entry: ${name}`);
    assert.equal(sha256(inflated), sha256(orig), `Byte mismatch in ZIP entry: ${name}`);
  }
}

const INCLUDED_FILES = [
  'prisma/migrations/20261116020000_uboq_release_readiness_m23_xid_rollover_hardening/migration.sql',
  'src/app/api/uboq/export/route.ts',
  'docs/uboq/uboq-release-readiness.md',
  'scripts/uboq/record-phase1-d2-r3-acceptance.cjs',
  'scripts/uboq/verify-migration14-provenance-gate.cjs',
  'scripts/uboq/apply-release-readiness-migration39.cjs',
  'scripts/uboq/verify-phase3-migration23-xid-rollover.ts',
  'scripts/uboq/verify-phase4-statutory-formats.ts',
  'scripts/uboq/verify-phase5-release-readiness.cjs',
  'artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json',
  'artifacts/uboq/release-readiness/phase2-migration14-provenance.json',
  'artifacts/uboq/release-readiness/migration39-apply.json',
  'artifacts/uboq/release-readiness/phase3-migration23-xid-rollover.json',
  'artifacts/uboq/release-readiness/phase4-statutory-format-readiness.json',
  'artifacts/uboq/release-readiness/phase5-final-local-verification.json',
  'artifacts/uboq/release-readiness/release-readiness-checkpoint.json',
];

const entries = INCLUDED_FILES.map((relPath) => {
  assert.ok(fs.existsSync(relPath), `Missing required release-readiness file: ${relPath}`);
  const data = fs.readFileSync(relPath);
  return {
    zipPath: relPath,
    bytes: data.length,
    sha256: sha256(data),
    data,
  };
});

const manifestPayload = {
  project: 'OSERP-PROJ-UBOQ-001',
  package: 'uboq-release-readiness-review.zip',
  scope: 'PHASES_1_TO_5_RELEASE_READINESS_DELTA',
  entryCount: entries.length + 1,
  files: entries.map(({ zipPath, bytes, sha256: digest }) => ({
    path: zipPath,
    bytes,
    sha256: digest,
  })),
};

const manifestBuf = Buffer.from(JSON.stringify(manifestPayload, null, 2) + '\n', 'utf8');
const allEntries = [
  ...entries,
  {
    zipPath: 'MANIFEST.json',
    bytes: manifestBuf.length,
    sha256: sha256(manifestBuf),
    data: manifestBuf,
  },
];

const zipBuf = buildDeterministicZip(allEntries);
verifyZipRoundTrip(zipBuf, allEntries);

fs.mkdirSync(path.dirname(OUT_ZIP), { recursive: true });
fs.writeFileSync(OUT_ZIP, zipBuf);

// Verify all 11 prior frozen archives remain 100% untouched
const phase1 = JSON.parse(
  fs.readFileSync('artifacts/uboq/release-readiness/phase1-d2-r3-local-acceptance-receipt.json', 'utf8')
);
for (const frozen of phase1.frozenArchives) {
  assert.equal(
    sha256(fs.readFileSync(frozen.path)),
    frozen.sha256,
    `Frozen archive altered: ${frozen.path}`
  );
}

const finalManifest = {
  ...manifestPayload,
  archivePath: OUT_ZIP,
  archiveBytes: zipBuf.length,
  archiveSha256: sha256(zipBuf),
  priorFrozenArchivesVerifiedIntact: phase1.frozenArchives.length,
};
fs.writeFileSync(OUT_MANIFEST, JSON.stringify(finalManifest, null, 2) + '\n');

console.log(
  JSON.stringify(
    {
      archivePath: OUT_ZIP,
      archiveBytes: zipBuf.length,
      archiveSha256: finalManifest.archiveSha256,
      entriesVerified: allEntries.length,
      priorFrozenArchivesIntact: phase1.frozenArchives.length,
    },
    null,
    2
  )
);
