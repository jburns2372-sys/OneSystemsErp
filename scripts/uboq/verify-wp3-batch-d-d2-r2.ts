/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { spawn, execFileSync } = require('node:child_process');
const net = require('node:net');
const zlib = require('node:zlib');
const {
  MigrationChecksumIntegrityError,
  verifyLedgerAgainstDisk,
  assertForwardOnlyMigrationReady,
} = require('./migration-checksum-guard.cjs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-d-d2-r2';
const REPORT_PATH = OUT + '/runtime-tests.json';
const BRAIN_DIR = 'C:/Users/user/.gemini/antigravity/brain/b35617c7-9740-4aa7-a239-0ffdca5619a7';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch D Phase D2 R2 Independent Review Remediation consolidated verification: D2-R1-IR-01 (Migration #37 _prisma_migrations ledger immutability trigger, zero app/maint privileges, 37/37 SHA-256 disk-to-ledger parity, and fail-closed forward-only apply guard), D2-R1-IR-02 (unconditional zero & non-zero VO header, item, UNIT_PRICE rate, and SubcontractorVariationOrder arithmetic reconciliation + positive balanced zero-net, zero-delta spec clarification, and 100% deductive SVO proofs), D2-R1-IR-03 (unambiguous VO revised-quantity reconciliation across single/multi-VO chains, genuine 100% deductive scope cancellation to 0.0000, SubcontractorVO & AwardedBOQItem zero-revised-qty disambiguation, T11 scope-qualified column headings & misleading-alias blocks), plus consolidated regression of D2-IR-01..D2-IR-05, T11 formal OpenXML, Phase D1 signed T1 round-trip, T0–T10 smoke, esbuild+Express Chromium E2E, bounded native Next.js 16 server stack E2E, and 252-table zero-residue rollback.',
};

let admin: any;
let restrictedClient: any;
let prisma: any;
let withUboqRlsContext: any;
let loadT11VariationOrderRegisterCanonicalData: any;
let workingRoute: any;
let layoutsRoute: any;
let formalRoute: any;
let roundTripRoute: any;
let NextRequest: any;
let actor: any;
let originalLoad: any;
let beforeTables: any;

const hexId = s.crypto.randomBytes(5).toString('hex');
const prefix = 'SYNTH-WP3-D2R2-' + hexId;
const synthPlainPw = 'SynthD2R2#' + hexId + '!Aa9';
const synthPasswordHash = bcrypt.hashSync(synthPlainPw, 10);

// Synthetic projects
const p1 = prefix + '-P1-GOV';
const pCorp = prefix + '-P2-CORP';
const pForeign = prefix + '-P3-FOREIGN';

// Synthetic users
const synthExecUser = prefix + '-USR-EXEC';
const synthNarrowedExecUser = prefix + '-USR-EXEC-NARROW';
const synthPmUser = prefix + '-USR-PM';
const synthSiteEngUser = prefix + '-USR-SITE';
const synthViewerUser = prefix + '-USR-VIEWER';
const synthForeignUser = prefix + '-USR-FOREIGN';
const synthMustChangePwUser = prefix + '-USR-MUSTCHG';

// Tax profiles & Contract authorities
const taxGov = prefix + '-TAX-GOV12';
const taxCorp = prefix + '-TAX-CORP12';
const cGov = prefix + '-CA-GOV';
const cCorp = prefix + '-CA-CORP';
const cForeign = prefix + '-CA-FOREIGN';
const srcDoc = prefix + '-DOC1';

// Snapshots
const snap1 = prefix + '-SNAP-GOV1';
const snapCorp = prefix + '-SNAP-CORP1';
const snapForeign = prefix + '-SNAP-FOREIGN';

// AwardedBOQItems & Phase Lines
const boqConc = prefix + '-ABOQ-CONC';
const boqRebar = prefix + '-ABOQ-RBR';
const boqMob = prefix + '-ABOQ-MOB';
const boqCorp = prefix + '-ABOQ-CORP';
const boqForeign = prefix + '-ABOQ-FOR';

const plConcP1 = prefix + '-PL-CONC-1';
const plRebarP1 = prefix + '-PL-RBR-1';
const plMobP1 = prefix + '-PL-MOB-1';
const plCorp1 = prefix + '-PL-CORP-1';
const plForeign1 = prefix + '-PL-FOR-1';

// Consolidated BOQ, Agency Estimates, PRRs, Contractor Target Budgets
const cboqConc = prefix + '-CBOQ-CONC';
const cboqRebar = prefix + '-CBOQ-RBR';
const cgrpConc = prefix + '-CGRP-CONC';
const cgrpRebar = prefix + '-CGRP-RBR';
const clnkConc = prefix + '-CLNK-CONC';
const clnkRebar = prefix + '-CLNK-RBR';

const estConc1 = prefix + '-EST-CONC1';
const estRebar1 = prefix + '-EST-RBR1';
const estMob1 = prefix + '-EST-MOB1';

const acctCement = prefix + '-ACCT-CEM';
const prrCement = prefix + '-PRR-CEM';

const tbConc1 = prefix + '-TB-CONC1';
const tbRebar1 = prefix + '-TB-RBR1';
const tbMob1 = prefix + '-TB-MOB1';

// Subcontractors, SubcontractPackage, SVO, Child JobOrder, SubcontractBilling, PaymentRecord
const subconEntity = prefix + '-SUBCON-1';
const subPkgRebar = prefix + '-SPKG-RBR';
const subPkgForeign = prefix + '-SPKG-FOR';
const svoRebarApproved = prefix + '-SVO-RBR-APP';
const svoRebarPending = prefix + '-SVO-RBR-PND';
const svoForeign = prefix + '-SVO-FOR';
const joRebarChild = prefix + '-JO-RBR-1';
const subAccRebar = prefix + '-SACC-RBR-1';
const sbRebar1 = prefix + '-SBIL-RBR-1';
const prRebarPaid = prefix + '-SPR-RBR-PAID';

// Variation Orders
const cvoApprovedNo = 'CVO-D2R2-APP-' + hexId.toUpperCase();
const cvoDraftNo = 'CVO-D2R2-DRF-' + hexId.toUpperCase();
const svoVoApprovedNo = 'SVO-VO-D2R2-APP-' + hexId.toUpperCase();
const svoApprovedNo = 'SVO-D2R2-RBR-APP-' + hexId.toUpperCase();
const svoPendingNo = 'SVO-D2R2-RBR-PND-' + hexId.toUpperCase();
const cvoPendingNo = 'CVO-D2R2-MIR-PND-' + hexId.toUpperCase();
const cvoForeignNo = 'CVO-D2R2-FOR-' + hexId.toUpperCase();

const voClientApproved = prefix + '-VO-CLI-APP';
const voiClientApproved = prefix + '-VOI-CLI-APP';
const vodClientApproved = prefix + '-VOD-CLI-APP';
const voaClientApproved = prefix + '-VOA-CLI-APP';

const voClientDraft = prefix + '-VO-CLI-DRF';
const voiClientDraft = prefix + '-VOI-CLI-DRF';

const voSubconApproved = prefix + '-VO-SUB-APP';
const voiSubconApproved = prefix + '-VOI-SUB-APP';
const vodSubconApproved = prefix + '-VOD-SUB-APP';
const voaSubconApproved = prefix + '-VOA-SUB-APP';

const cvoMirrorApproved = prefix + '-CVOM-APP';
const cvoMirrorPending = prefix + '-CVOM-PND';
const cvoForeignRow = prefix + '-CVOM-FOR';

const voForeignRow = prefix + '-VO-FOR';
const aivForeignRow = prefix + '-AIV-FOR';

// Accomplishments, Inspections, Billings, Payments, Schedules
const accApproved = prefix + '-ACC-APP';
const accItemConc = prefix + '-ACCI-CONC';
const accItemRebar = prefix + '-ACCI-RBR';
const accItemMob = prefix + '-ACCI-MOB';
const inspConc = prefix + '-INSP-CONC';
const inspRebar = prefix + '-INSP-RBR';
const inspMob = prefix + '-INSP-MOB';

const bilGovApproved = prefix + '-BIL-GOV-APP';
const bilGovSecond = prefix + '-BIL-GOV-2';
const biGovConc = prefix + '-BI-GOV-CONC';
const biGovRebar = prefix + '-BI-GOV-RBR';
const biGovMob = prefix + '-BI-GOV-MOB';
const bdGov = prefix + '-BD-GOV';
const payGovCleared = prefix + '-PAY-GOV-CLR';
const payGovPending = prefix + '-PAY-GOV-PND';

const bilCorpApproved = prefix + '-BIL-CORP-APP';
const biCorp1 = prefix + '-BI-CORP-1';
const payCorpCleared = prefix + '-PAY-CORP-CLR';

const schedBaseline = prefix + '-SCH-BASE';
const schedCorpBaseline = prefix + '-SCH-CORP-BASE';
const wbs1 = prefix + '-WBS-1';
const act100 = prefix + '-ACT-100';
const act200 = prefix + '-ACT-200';
const act300 = prefix + '-ACT-300';
const actCorp1 = prefix + '-ACT-CORP-1';
const actCorp2 = prefix + '-ACT-CORP-2';
const dep1 = prefix + '-DEP-1';
const dep2 = prefix + '-DEP-2';
const ulnk1 = prefix + '-ULNK-1';
const ulnk2 = prefix + '-ULNK-2';
const ulnk3 = prefix + '-ULNK-3';
const spu100 = prefix + '-SPU-100';
const spu200 = prefix + '-SPU-200';
const spu300 = prefix + '-SPU-300';

// Procurement, Expenses, Payroll, Ledgers, Persisted Cash-Flow Periods
const supplier1 = prefix + '-SUP-1';
const mr1 = prefix + '-MR-1';
const mriCement = prefix + '-MRI-CEM';
const poCement = prefix + '-PO-CEM-APP';
const poiCement = prefix + '-POI-CEM';
const poDraftIgnored = prefix + '-PO-DRF';
const deliv1 = prefix + '-DEL-1';
const deliv2 = prefix + '-DEL-2';
const apCementPaid = prefix + '-AP-CEM-PAID';
const apCementUnpaid = prefix + '-AP-CEM-UNPAID';

const expMobPaid = prefix + '-EXP-MOB-PAID';
const expMobAccrued = prefix + '-EXP-MOB-ACCR';
const expDraftIgnored = prefix + '-EXP-DRF';

const synthWorker = prefix + '-WRK-1';
const payPeriod1 = prefix + '-PAYPER-1';
const payrollRow1 = prefix + '-PAYROW-1';
const payBatchNo = 'PAYBATCH-D2R2-' + hexId.toUpperCase();

const clMirrorPoCement = prefix + '-CL-MIR-PO';
const clMirrorSubPkg = prefix + '-CL-MIR-SUB';
const clMirrorSvo = prefix + '-CL-MIR-SVO';
const clForeign = prefix + '-CL-FOR';

const pclMirrorPoCement = prefix + '-PCL-MIR-PO';
const pclMirrorSbRebar = prefix + '-PCL-MIR-SB';
const pclMirrorExpMob = prefix + '-PCL-MIR-EXP';
const pclMirrorPayroll = prefix + '-PCL-MIR-PAY';
const pclCorpApproved = prefix + '-PCL-CORP-APP';

const cfpIds = [1, 2, 3, 4, 5, 6].map((idx) => `${prefix}-CFP-${idx}`);
const cfpForeign = prefix + '-CFP-FOR';

const save = () => {
  s.fs.mkdirSync(OUT, { recursive: true });
  s.fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
};

async function check(name: string, fn: () => Promise<any>) {
  const start = Date.now();
  const detail = await fn();
  report.checks.push({
    name,
    result: 'PASS',
    milliseconds: Date.now() - start,
    ...(detail ? { detail } : {}),
  });
  save();
  console.log('PASS ' + name);
}

async function tableHashes() {
  const rows = (
    await admin.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
  ).rows;
  const result: Record<string, { n: string; digest: string }> = {};
  for (const { tablename } of rows) {
    const qName = 'public."' + tablename.replaceAll('"', '""') + '"';
    result[tablename] = (
      await admin.query(
        "SELECT count(*)::text n, md5(coalesce(string_agg(to_jsonb(t)::text, '' ORDER BY to_jsonb(t)::text), '')) digest FROM " +
          qName +
          ' t'
      )
    ).rows[0];
  }
  return result;
}

async function canonicalSourceDigest() {
  const res: Record<string, any> = {};
  for (const tbl of [
    'UboqContractAuthority',
    'UboqOperationalSnapshot',
    'UboqAwardedPhaseLine',
    'AwardedBOQItem',
    'ConsolidatedBOQItem',
    'VariationOrder',
    'VariationOrderItem',
    'ClientVariationOrder',
    'SubcontractorVariationOrder',
    'UboqCashFlowPeriod',
    'UboqTreasuryOpeningBalance',
    'CommitmentLedger',
    'ProjectCostLedger',
  ]) {
    res[tbl] = (
      await admin.query(
        `SELECT count(*)::int AS cnt, md5(coalesce(string_agg(to_jsonb(t)::text, '' ORDER BY id), '')) AS md5 FROM "${tbl}" t WHERE id LIKE $1`,
        [`${prefix}%`]
      )
    ).rows[0];
  }
  return res;
}

function mintRlsProof(projectId: string, userId: string, sessionVersion: number): string {
  const epochSec = Math.floor(Date.now() / 1000);
  const nonceHex = s.crypto.randomBytes(16).toString('hex');
  const payload = `${s.f.signing}|UBOQ_RLS_V1|${projectId}|${userId}|${sessionVersion}|${epochSec}|${nonceHex}`;
  const mac = s.crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  return `${epochSec}.${nonceHex}.${mac}`;
}

async function withSignedRestrictedTx<T>(
  projectId: string,
  userId: string,
  sessionVersion: number,
  fn: () => Promise<T>
): Promise<T> {
  return s.transaction(restrictedClient, async () => {
    const proof = mintRlsProof(projectId, userId, sessionVersion);
    await restrictedClient.query(`SELECT set_config('app.enforce_project_rls', 'on', true)`);
    await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [
      projectId,
    ]);
    await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    await restrictedClient.query(`SELECT set_config('app.current_session_version', $1, true)`, [
      String(sessionVersion),
    ]);
    await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proof]);
    return fn();
  });
}

function readZipEntriesFromBuffer(buf: Buffer): Record<string, string> {
  const entries: Record<string, string> = {};
  let eocdOffset = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65558); i -= 1) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  assert.ok(eocdOffset >= 0, 'ZIP EOCD signature not found');
  const entryCount = buf.readUInt16LE(eocdOffset + 10);
  let cdOffset = buf.readUInt32LE(eocdOffset + 16);
  for (let idx = 0; idx < entryCount; idx += 1) {
    assert.equal(buf.readUInt32LE(cdOffset), 0x02014b50);
    const compMethod = buf.readUInt16LE(cdOffset + 10);
    const compSize = buf.readUInt32LE(cdOffset + 20);
    const fileNameLen = buf.readUInt16LE(cdOffset + 28);
    const extraLen = buf.readUInt16LE(cdOffset + 30);
    const commentLen = buf.readUInt16LE(cdOffset + 32);
    const localHeaderOffset = buf.readUInt32LE(cdOffset + 42);
    const name = buf.subarray(cdOffset + 46, cdOffset + 46 + fileNameLen).toString('utf8');
    cdOffset += 46 + fileNameLen + extraLen + commentLen;
    if (name.endsWith('.xml') || name.endsWith('.rels')) {
      assert.equal(buf.readUInt32LE(localHeaderOffset), 0x04034b50);
      const localNameLen = buf.readUInt16LE(localHeaderOffset + 26);
      const localExtraLen = buf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
      const compSlice = buf.subarray(dataStart, dataStart + compSize);
      const rawBuf = compMethod === 0 ? compSlice : zlib.inflateRawSync(compSlice);
      entries[name] = rawBuf.toString('utf8');
    }
  }
  return entries;
}

async function getEphemeralPort(): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      const p = typeof addr === 'object' && addr ? addr.port : 0;
      srv.close(() => resolve(p));
    });
  });
}

(async () => {
  admin = await s.connect();
  await admin.query("SET TIME ZONE 'UTC'");
  report.database = await s.identity(admin);
  assert.equal(
    report.database.data_directory.replaceAll('\\', '/').toLowerCase(),
    (s.receipt.runtime_directory + '/data').replaceAll('\\', '/').toLowerCase()
  );

  beforeTables = await tableHashes();

  const url = new URL('postgresql://127.0.0.1');
  url.port = String(s.config.port);
  url.pathname = '/' + s.config.database;
  url.username = s.f.projectLogin;
  url.password = s.f.projectPw;
  process.env.DATABASE_URL = url.toString();
  process.env.DIRECT_URL = url.toString();
  process.env.UBOQ_RLS_CONTEXT_SECRET = s.f.signing;

  restrictedClient = await s.connect({ user: s.f.projectLogin, password: s.f.projectPw });
  await restrictedClient.query("SET TIME ZONE 'UTC'");

  const { computeSpecSignatureHash } = require('../../src/lib/uboq/validation-engine');
  const concSig = computeSpecSignatureHash('Structural Concrete Class A', '3500 psi @ 28d');
  const rbrSig = computeSpecSignatureHash('Deformed Reinforcing Steel', 'ASTM A615 Grade 60');
  const mobSig = computeSpecSignatureHash(
    'Mobilization & Temporary Facilities',
    'General Requirements'
  );
  const cemResSig = computeSpecSignatureHash('Portland Cement Type 1', '40kg Bag ASTM C150');

  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    for (const [uid, role, mustChange] of [
      [synthExecUser, 'FINANCE_DIRECTOR', false],
      [synthNarrowedExecUser, 'FINANCE_DIRECTOR', false],
      [synthPmUser, 'PROJECT_MANAGER', false],
      [synthSiteEngUser, 'SITE_ENGINEER', false],
      [synthViewerUser, 'PROJECT_MANAGER', false],
      [synthForeignUser, 'FINANCE_DIRECTOR', false],
      [synthMustChangePwUser, 'FINANCE_DIRECTOR', true],
    ] as Array<[string, string, boolean]>) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, "passwordHash", role, status, "sessionVersion", "mustChangePassword", "failedLoginAttempts", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, $4, 'ACTIVE', 7, $5, 0, now())`,
        [uid, `${uid.toLowerCase()}@synthetic.local`, synthPasswordHash, role, mustChange]
      );
    }

    for (const p of [p1, pCorp, pForeign]) {
      await admin.query(
        'INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt") VALUES ($1, $1, true, false, now())',
        [p]
      );
    }

    await admin.query(
      `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES
         ($1, $9,  $16, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($2, $9,  $17, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($3, $10, $16, 'PROJECT_MANAGER',  'STANDARD', 'ACTIVE', now()),
         ($4, $11, $16, 'PROJECT_MANAGER',  'FULL',     'ACTIVE', now()),
         ($5, $12, $16, 'SITE_ENGINEER',    'STANDARD', 'ACTIVE', now()),
         ($6, $13, $16, 'MEMBER',           'VIEWER',   'ACTIVE', now()),
         ($7, $14, $18, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($8, $15, $16, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now())`,
      [
        prefix + '-ASN-EXEC-P1',
        prefix + '-ASN-EXEC-CORP',
        prefix + '-ASN-NARROW-P1',
        prefix + '-ASN-PM-P1',
        prefix + '-ASN-SITE-P1',
        prefix + '-ASN-VIEW-P1',
        prefix + '-ASN-FOR-PFOR',
        prefix + '-ASN-MUSTCHG-P1',
        synthExecUser,
        synthNarrowedExecUser,
        synthPmUser,
        synthSiteEngUser,
        synthViewerUser,
        synthForeignUser,
        synthMustChangePwUser,
        p1,
        pCorp,
        pForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES
         ($1, $3, 'GOV_INFRA_VAT12',     'v2026.1', 'GOVERNMENT', 0.120000, 'VATABLE_12', true,  0.100000, 0.150000, 0.020000, 0.050000, true, $5, '2026-08-01T00:00:00.000Z'),
         ($2, $4, 'CORP_PH_VAT_EXCL_12', 'v2026.1', 'PRIVATE',    0.120000, 'VATABLE_12', false, 0.100000, 0.100000, 0.020000, 0.000000, true, $5, '2026-08-01T00:00:00.000Z')`,
      [taxGov, taxCorp, p1, pCorp, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "noaRef", "ntpRef", "clientPoRef", "voReference", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $4, $7,  'GOVERNMENT', 'DPWH Synthetic District', 'CA-D2R2-GOV-01',  'NOA-D2R2-01', 'NTP-D2R2-01', 'CPO-D2R2-01', $9,   'UNIT_PRICE', 'VAT_INCLUSIVE', 792000.00, 707142.86, 918400.00, 180, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($2, $5, $8,  'PRIVATE',    'Ayala Synthetic Corp',    'CA-D2R2-CORP-01', NULL,          NULL,          NULL,          NULL, 'UNIT_PRICE', 'VAT_EXCLUSIVE', 200000.00, 200000.00, 200000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($3, $6, NULL,'PRIVATE',    'Foreign Tenant Corp',     'CA-D2R2-FOR-01',  NULL,          NULL,          NULL,          NULL, 'UNIT_PRICE', 'VAT_EXCLUSIVE', 50000.00,  50000.00,  50000.00,  60,  '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now())`,
      [cGov, cCorp, cForeign, p1, pCorp, pForeign, taxGov, taxCorp, cvoApprovedNo, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'batch-d-d2-r2-source.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8192, $3, '504b0304', 'memory://batch-d-d2-r2', 'CONTRACT_BOQ', $4, true)`,
      [srcDoc, p1, s.hash(srcDoc), s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $4, $7,   $8,  1, 'Gov Baseline v1',     'APPROVED', $11, $12, $15, $15, '2026-08-05T00:00:00.000Z'),
         ($2, $5, NULL, $9,  1, 'Corp Baseline v1',    'APPROVED', $13, NULL,$15, $15, '2026-08-05T00:00:00.000Z'),
         ($3, $6, NULL, $10, 1, 'Foreign Baseline v1', 'APPROVED', $14, NULL,$15, $15, '2026-08-05T00:00:00.000Z')`,
      [
        snap1,
        snapCorp,
        snapForeign,
        p1,
        pCorp,
        pForeign,
        srcDoc,
        cGov,
        cCorp,
        cForeign,
        s.hash(snap1),
        s.hash(srcDoc),
        s.hash(snapCorp),
        s.hash(snapForeign),
        s.f.ids.a,
      ]
    );

    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
       VALUES
         ($1, '900(1)a', 'STRUCTURAL', 'Structural Concrete Class A',        'm3',  100,  6320,  632000, 20, 120,  6320,  758400, 'APPROVED', $6, now()),
         ($2, '902(1)a', 'STRUCTURAL', 'Deformed Reinforcing Steel',         'kg',  2000, 55,    110000, 0,  2000, 55,    110000, 'APPROVED', $6, now()),
         ($3, 'B.9',     'GENERAL',    'Mobilization & Temporary Facilities','lot', 1,    50000, 50000,  0,  1,    50000, 50000,  'APPROVED', $6, now()),
         ($4, 'C-100',   'CIVIL',      'Corporate Concrete Slab',            'm3',  40,   5000,  200000, 0,  40,   5000,  200000, 'APPROVED', $7, now()),
         ($5, 'F-100',   'CIVIL',      'Foreign Tenant Scope',               'm3',  10,   5000,  50000,  0,  10,   5000,  50000,  'APPROVED', $8, now())`,
      [boqConc, boqRebar, boqMob, boqCorp, boqForeign, p1, pCorp, pForeign]
    );

    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "awardedBoqItemId", "sourceDocumentId", "itemCode", "phaseCode", "sectionCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
         "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
         "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       )
       VALUES
         ($1, $6, $9,  $12, $17, '900(1)a', 'PHASE-01', 'BLDG-A', 'Structural Concrete Class A', '3500 psi @ 28d',     $18, 'm3',  'm3',  'VOLUME',     'UNIT_PRICE', 100.0000,  100.0000,  6320.0000,  632000.00, 564285.71, 'SOURCE_EVIDENCED',    now()),
         ($2, $6, $9,  $13, $17, '902(1)a', 'PHASE-01', 'BLDG-A', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $19, 'kg',  'kg',  'MASS',       'UNIT_PRICE', 2000.0000, 2000.0000, 55.0000,    110000.00, 98214.29,  'SOURCE_EVIDENCED',    now()),
         ($3, $6, $9,  $14, $17, 'B.9',     'PHASE-01', 'GEN',    'Mobilization & Temporary Facilities', 'General Requirements', $20, 'lot', 'lot', 'LUMP_SCOPE', 'LUMP_SUM', 1.0000, 1.0000, 50000.0000, 50000.00, 44642.86, 'SOURCE_EVIDENCED', now()),
         ($4, $7, $10, $15, NULL,'C-100',   'PHASE-01', 'CORP',   'Corporate Concrete Slab',     '3500 psi @ 28d',     $18, 'm3',  'm3',  'VOLUME',     'UNIT_PRICE', 40.0000,   40.0000,   5000.0000,  200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($5, $8, $11, $16, NULL,'F-100',   'PHASE-01', 'FOR',    'Foreign Tenant Scope',        '3500 psi @ 28d',     $18, 'm3',  'm3',  'VOLUME',     'UNIT_PRICE', 10.0000,   10.0000,   5000.0000,  50000.00,  50000.00,  'SOURCE_NOT_PROVIDED', now())`,
      [
        plConcP1,
        plRebarP1,
        plMobP1,
        plCorp1,
        plForeign1,
        p1,
        pCorp,
        pForeign,
        snap1,
        snapCorp,
        snapForeign,
        boqConc,
        boqRebar,
        boqMob,
        boqCorp,
        boqForeign,
        srcDoc,
        concSig,
        rbrSig,
        mobSig,
      ]
    );

    await admin.query(
      `INSERT INTO "ConsolidatedBOQItem"(id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId", "isUboqResourceGoverned", "updatedAt")
       VALUES
         ($1, 'CGRP-D2R2-1', 'UBOQ_CONSOLIDATED', 'Structural Concrete Class A', 'm3', 100,  4800, 480000, 'APPROVED', $3, true, now()),
         ($2, 'CGRP-D2R2-2', 'UBOQ_CONSOLIDATED', 'Deformed Reinforcing Steel',  'kg', 2000, 44,   88000,  'APPROVED', $3, true, now())`,
      [cboqConc, cboqRebar, p1]
    );
    await admin.query(
      `INSERT INTO "UboqConsolidationGroup"(id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription", specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily", "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt")
       VALUES
         ($1, $3, $4, 'CGRP-D2R2-1', 'Structural Concrete Class A', '3500 psi @ 28d',     $6, 'm3', 'VOLUME', 100.0000,  6320.0000, 632000.00, now()),
         ($2, $3, $5, 'CGRP-D2R2-2', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $7, 'kg', 'MASS',   2000.0000, 55.0000,   110000.00, now())`,
      [cgrpConc, cgrpRebar, p1, cboqConc, cboqRebar, concSig, rbrSig]
    );
    await admin.query(
      `INSERT INTO "UboqConsolidationLink"(id, "consolidationGroupId", "phaseLineId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $3, $5, 100.0000,  1.000000),
         ($2, $4, $6, 2000.0000, 1.000000)`,
      [clnkConc, clnkRebar, cgrpConc, cgrpRebar, plConcP1, plRebarP1]
    );

    await admin.query(
      `INSERT INTO "UboqAgencyEstimateBaseline"(id, "projectId", "phaseLineId", "agencyEdcAmt", "agencyAbcAmt", "estimateMaterialCost", "estimateLaborCost", "estimateEquipmentCost", "estimatedDirectCost", "ocmAmount", "contingencyOcm", "contractorProfitAmt", "estimateVatAmt", "estimatedIndirectCost", "estimatedTotalUnitCost", "estimatedTotalAmount")
       VALUES
         ($1, $4, $5, 450000.00, 600000.00, 275000.00, 112500.00, 62500.00, 450000.00, 54000.00, 0.00, 36000.00, 27000.00, 117000.00, 5670.0000, 567000.00),
         ($2, $4, $6, 75000.00,  105000.00, 50000.00,  20000.00,  5000.00,  75000.00,  9000.00,  0.00, 6000.00,  4500.00,  19500.00,  47.2500,   94500.00),
         ($3, $4, $7, 32000.00,  45000.00,  12000.00,  15000.00,  5000.00,  32000.00,  3840.00,  0.00, 2560.00,  1920.00,  8320.00,   40320.0000,40320.00)`,
      [estConc1, estRebar1, estMob1, p1, plConcP1, plRebarP1, plMobP1]
    );

    await admin.query(
      `INSERT INTO "UboqCanonicalResourceAccount"(id, "projectId", "consolidatedBoqItemId", "resourceCode", "resourceDescription", "resourceSpec", "specSignatureHash", "resourceClass", "fulfillmentChannel", "resourceUomNormalized", "uomDimensionFamily", "activeApprovedPrId", "activeApprovedQty", "allocatedUsableStockQty", "openMrReservedQty", "openCommittedPoQty", "deliveredReceivedQty", "consumedIssuedQty", "damagedReturnedQty", "availablePhysicalStockQty", "remainingProcurementQty", "isOvercommittedByRevision", "overcommittedQty", "targetResourceUnitCost", "rowVersion", "updatedAt")
       VALUES ($1, $2, $3, 'MAT-CEM-D2R2', 'Portland Cement Type 1', '40kg Bag ASTM C150', $4, 'MATERIAL', 'SUPPLIER_PO', 'bag_40kg', 'PACK', $5, 900.0000, 100.0000, 0.0000, 500.0000, 0.0000, 0.0000, 0.0000, 100.0000, 300.0000, false, 0.0000, 230.0000, 1, now())`,
      [acctCement, p1, cboqConc, cemResSig, prrCement]
    );
    await admin.query(
      `INSERT INTO "UboqProcurementResourceRequirement"(id, "canonicalResourceId", "projectId", "consolidatedBoqItemId", "snapshotId", "versionNumber", status, "takeoffBasis", "resourceCoeff", "workQuantityBasis", "requiredQty", "benchmarkUnitCost", "procurementBudget", "sourceDocumentId", "preparedById", "approvedById", "approvedAt")
       VALUES ($1, $2, $3, $4, $5, 1, 'APPROVED', 'CONTRACTOR_DETAILED_DUPA', 9.000000, 100.0000, 900.0000, 230.0000, 207000.00, $6, $7, $7, '2026-08-06T00:00:00.000Z')`,
      [prrCement, acctCement, p1, cboqConc, snap1, srcDoc, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "phaseLineId", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $4, $5, 400000.00, 485000.00, 192142.86, 0.283755, 10000.00, 230000.00, 375000.00, 302142.86, $8, '2026-08-10T00:00:00.000Z', now()),
         ($2, $4, $6, 62000.00,  72000.00,  26214.29,  0.266909, 25000.00, 18000.00,  68000.00,  30214.29,  $8, '2026-08-10T00:00:00.000Z', now()),
         ($3, $4, $7, 25000.00,  30000.00,  14642.86,  0.328000, 0.00,     5000.00,   17000.00,  27642.86,  $8, '2026-08-10T00:00:00.000Z', now())`,
      [tbConc1, tbRebar1, tbMob1, p1, plConcP1, plRebarP1, plMobP1, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "Subcontractor"(id, name, "businessType", accreditation, "contactPerson", "contactNumber", "updatedAt")
       VALUES ($1, 'Synthetic Rebar Subcon Corp', 'CORPORATION', 'APPROVED', 'Engr. Cruz', '09170000000', now())`,
      [subconEntity]
    );
    const spkgRebarNo = 'SPKG-D2R2-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "SubcontractPackage"(id, "packageNumber", "projectId", "subcontractorId", "awardedBoqItemId", "workCategory", "contractType", "scopeOfWork", location, quantity, unit, "unitCost", "contractAmount", "costType", "paymentTerms", "targetCompletion", status, "updatedAt")
       VALUES
         ($1, $3, $5, $7, $8, 'STRUCTURAL', 'LABOR_ONLY', 'Rebar cutting & installation', 'BLDG-A', 2000, 'kg', 20, 40000, 'DIRECT', 'PROGRESS', '2026-10-20T00:00:00.000Z', 'APPROVED', now()),
         ($2, $4, $6, $7, $9, 'CIVIL',      'LABOR_ONLY', 'Foreign subcon scope',         'FOR',    10,   'm3', 1000, 10000, 'DIRECT', 'PROGRESS', '2026-10-20T00:00:00.000Z', 'APPROVED', now())`,
      [
        subPkgRebar,
        subPkgForeign,
        spkgRebarNo,
        'SPKG-FOR-' + hexId.toUpperCase(),
        p1,
        pForeign,
        subconEntity,
        boqRebar,
        boqForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "SubcontractorVariationOrder"(id, "svoNumber", "projectId", "originalSubcontractId", "originalSubcontractQty", "proposedAdditionalQty", "revisedSubcontractQty", "originalSubcontractAmt", "proposedAdditionalAmt", "revisedSubcontractAmt", reason, "approvalStatus", "approvedById", "awardedBoqItemId", "createdAt", "updatedAt")
       VALUES
         ($1, $4, $7, $9,  2000, 500, 2500, 40000, 10000, 50000, 'Approved rebar splice scope increase', 'APPROVED', $11, $12, '2026-09-08T00:00:00.000Z', now()),
         ($2, $5, $7, $9,  2500, 250, 2750, 50000, 5000,  55000, 'Pending extra rebar scope',            'PENDING',  NULL,$12, '2026-09-09T00:00:00.000Z', now()),
         ($3, $6, $8, $10, 10,   2,   12,   10000, 2000,  12000, 'Foreign approved SVO',                 'APPROVED', $11, $13, '2026-09-08T00:00:00.000Z', now())`,
      [
        svoRebarApproved,
        svoRebarPending,
        svoForeign,
        svoApprovedNo,
        svoPendingNo,
        'SVO-FOR-' + hexId.toUpperCase(),
        p1,
        pForeign,
        subPkgRebar,
        subPkgForeign,
        s.f.ids.a,
        boqRebar,
        boqForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "JobOrder"(id, "jobNumber", "projectId", "subcontractorId", "packageId", description, "boqReferenceId", location, "contractAmount", "paymentBasis", "completionDate", "materialResponsibility", "approvedBy", status, "updatedAt")
       VALUES ($1, $2, $3, $4, $5, 'Phase 1 Rebar Installation JO', $6, 'BLDG-A', 30000, 'PROGRESS', '2026-10-15T00:00:00.000Z', 'COMPANY_SUPPLIED', $7, 'APPROVED', now())`,
      [
        joRebarChild,
        'JO-D2R2-' + hexId.toUpperCase(),
        p1,
        subconEntity,
        subPkgRebar,
        boqRebar,
        s.f.ids.a,
      ]
    );

    await admin.query(
      `INSERT INTO "SubcontractAccomplishment"(id, "packageId", "jobOrderId", "workDescription", location, "prevPercent", "currentPercent", "cumulativePercent", "prevQty", "currentQty", "totalQty", "remainingQty", status, "updatedAt")
       VALUES ($1, $2, $3, 'Rebar 50% complete', 'BLDG-A', 0, 50, 50, 0, 1000, 1000, 1000, 'APPROVED', now())`,
      [subAccRebar, subPkgRebar, joRebarChild]
    );

    const sbNumRebar = 'SBIL-D2R2-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "SubcontractBilling"(id, "billingNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", "contractAmount", "previousGross", "currentGross", "totalGross", "remainingBalance", "netPayable", "accountingStatus", "approvalStatus", "paymentStatus", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 50000, 0, 25000, 25000, 25000, 22500, 'REVIEWED', 'APPROVED', 'PENDING', 'APPROVED_FOR_PAYMENT', '2026-09-18T00:00:00.000Z', now())`,
      [sbRebar1, sbNumRebar, p1, subconEntity, subPkgRebar, joRebarChild]
    );

    await admin.query(
      `INSERT INTO "PaymentRecord"(id, "billingId", "amountPaid", "paymentDate", method, "referenceNumber", "updatedAt")
       VALUES ($1, $2, 15000.00, '2026-09-20T00:00:00.000Z', 'BANK_TRANSFER', 'SUBPAY-D2R2-001', now())`,
      [prRebarPaid, sbRebar1]
    );

    await admin.query(
      `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "approvedForBilling", "createdAt", "updatedAt")
       VALUES
         ($1, $5, 'ADDITIVE', 'APPROVED', NULL, $9,  126400.00, 0.00, 126400.00, true,  '2026-09-02T00:00:00.000Z', now()),
         ($2, $6, 'ADDITIVE', 'DRAFT',    NULL, $9,  316000.00, 0.00, 316000.00, false, '2026-09-03T00:00:00.000Z', now()),
         ($3, $7, 'ADDITIVE', 'APPROVED', $11,  $9,  3000.00,   0.00, 3000.00,   false, '2026-09-04T00:00:00.000Z', now()),
         ($4, $8, 'ADDITIVE', 'APPROVED', NULL, $10, 5000.00,   0.00, 5000.00,   true,  '2026-09-04T00:00:00.000Z', now())`,
      [
        voClientApproved,
        voClientDraft,
        voSubconApproved,
        voForeignRow,
        cvoApprovedNo,
        cvoDraftNo,
        svoVoApprovedNo,
        'VO-FOR-' + hexId.toUpperCase(),
        p1,
        pForeign,
        subPkgRebar,
      ]
    );

    await admin.query(
      `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "currentProposedQuantity", "revisedQuantity", "approvedUnitCost", "additionalAmount", "deductiveAmount", "netAmount", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
       VALUES
         ($1, 'VOI-001', 'ADDITIONAL_QTY', 'Approved Client VO +20m3 Structural Concrete', 'm3', 100,  20,  120,  6320.00, 126400.00, 0.00, 126400.00, 'APPROVED', $4, $7, now()),
         ($2, 'VOI-001', 'ADDITIONAL_QTY', 'Draft Client VO +50m3 Structural Concrete',    'm3', 120,  50,  170,  6320.00, 316000.00, 0.00, 316000.00, 'PENDING',  $5, $7, now()),
         ($3, 'VOI-001', 'ADDITIONAL_QTY', 'Approved Subcon VO +150kg Rebar Tying',        'kg', 2000, 150, 2150, 20.00,   3000.00,   0.00, 3000.00,   'APPROVED', $6, $8, now())`,
      [
        voiClientApproved,
        voiClientDraft,
        voiSubconApproved,
        voClientApproved,
        voClientDraft,
        voSubconApproved,
        boqConc,
        boqRebar,
      ]
    );

    await admin.query(
      `INSERT INTO "VariationOrderDocument"(id, "fileName", "fileType", "fileUrl", "documentCategory", "uploadedById", "variationOrderId", "updatedAt")
       VALUES
         ($1, 'Signed-Client-VO-01.pdf', 'application/pdf', 'memory://cvo-01.pdf', 'APPROVED_VO_ORDER', $3, $4, now()),
         ($2, 'Signed-Subcon-VO-01.pdf', 'application/pdf', 'memory://svo-01.pdf', 'APPROVED_SUBCON_VO',$3, $5, now())`,
      [vodClientApproved, vodSubconApproved, s.f.ids.a, voClientApproved, voSubconApproved]
    );

    await admin.query(
      `INSERT INTO "VariationOrderApproval"(id, stage, action, "actionById", remarks, "variationOrderId", "updatedAt")
       VALUES
         ($1, 'EXECUTIVE_APPROVAL', 'APPROVED', $3, 'Ratified client contract variation',       $4, now()),
         ($2, 'COMMERCIAL_REVIEW',  'APPROVED', $3, 'Ratified subcontractor commitment change', $5, now())`,
      [voaClientApproved, voaSubconApproved, s.f.ids.a, voClientApproved, voSubconApproved]
    );

    await admin.query(
      `INSERT INTO "ClientVariationOrder"(id, "cvoNumber", "projectId", status, description, "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, $4, $7, 'APPROVED', 'Mirrored approved Client VO', $9,  now()),
         ($2, $5, $7, 'PENDING',  'Pending Client VO proposal',  $9,  now()),
         ($3, $6, $8, 'APPROVED', 'Foreign Client VO',           $10, now())`,
      [
        cvoMirrorApproved,
        cvoMirrorPending,
        cvoForeignRow,
        cvoApprovedNo,
        cvoPendingNo,
        cvoForeignNo,
        p1,
        pForeign,
        boqConc,
        boqForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "AIVariationOrderValidation"(id, "validationType", result, "confidenceLevel", "riskLevel", "variationOrderId", "updatedAt")
       VALUES ($1, 'DUPLICATE_CHECK', 'PASS', 'HIGH', 'LOW', $2, now())`,
      [aivForeignRow, voForeignRow]
    );

    await admin.query(
      `INSERT INTO "Accomplishment"(id, "billingPeriod", "accomplishmentDate", "preparedById", status, "approvedAmount", "projectId", "updatedAt")
       VALUES ($1, 'SWA-2026-09', '2026-09-15T00:00:00.000Z', $2, 'APPROVED', 484200.00, $3, now())`,
      [accApproved, s.f.ids.a, p1]
    );
    await admin.query(
      `INSERT INTO "AccomplishmentItem"(id, "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "inspectionStatus", "approvalStatus", "accomplishmentId", "boqItemId")
       VALUES
         ($1, 0.0000, 60.0000,  60.0000,  60.0000,  120.0000,  'APPROVED', 'APPROVED', $4, $5),
         ($2, 0.0000, 1000.0000,1000.0000,1000.0000,2000.0000, 'APPROVED', 'APPROVED', $4, $6),
         ($3, 0.0000, 1.0000,   1.0000,   1.0000,   1.0000,    'APPROVED', 'APPROVED', $4, $7)`,
      [accItemConc, accItemRebar, accItemMob, accApproved, boqConc, boqRebar, boqMob]
    );
    await admin.query(
      `INSERT INTO "Inspection"(id, "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectorName", "dateInspected", "approvalStatus", "accomplishmentItemId")
       VALUES
         ($1, 60.0000,   60.0000,   50.0000,  'QA Engr. Santos', '2026-09-15T00:00:00.000Z', 'APPROVED', $4),
         ($2, 1000.0000, 1000.0000, 50.0000,  'QA Engr. Santos', '2026-09-15T00:00:00.000Z', 'APPROVED', $5),
         ($3, 1.0000,    1.0000,    100.0000, 'QA Engr. Santos', '2026-09-15T00:00:00.000Z', 'APPROVED', $6)`,
      [inspConc, inspRebar, inspMob, accItemConc, accItemRebar, accItemMob]
    );

    await admin.query(
      `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
       VALUES
         ($1, $4, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 792000, 918400, 385000, 'APPROVED_FOR_PAYMENT', $7, $7, $8, now()),
         ($2, $5, '2026-10-01T00:00:00.000Z', '2026-10-15T00:00:00.000Z', '2026-10-16T00:00:00.000Z', 'PROGRESS', 792000, 918400, 150000, 'APPROVED',             $7, $7, $8, now()),
         ($3, $6, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED',             $7, $7, $9, now())`,
      [
        bilGovApproved,
        bilGovSecond,
        bilCorpApproved,
        'PB-D2R2-GOV1-' + hexId.toUpperCase(),
        'PB-D2R2-GOV2-' + hexId.toUpperCase(),
        'PB-D2R2-CORP-' + hexId.toUpperCase(),
        s.f.ids.a,
        p1,
        pCorp,
      ]
    );
    await admin.query(
      `INSERT INTO "BillingItem"(id, "contractQuantity", "unitCost", "contractAmount", "previousQuantityBilled", "currentQuantityForBilling", "totalQuantityBilledToDate", "billingId", "boqItemId")
       VALUES
         ($1, 120,  6320,  758400, 0.0000, 50.0000,  50.0000,  $5, $7),
         ($2, 2000, 55,    110000, 0.0000, 800.0000, 800.0000, $5, $8),
         ($3, 1,    50000, 50000,  0.0000, 0.5000,   0.5000,   $5, $9),
         ($4, 40,   5000,  200000, 0.0000, 20.0000,  20.0000,  $6, $10)`,
      [
        biGovConc,
        biGovRebar,
        biGovMob,
        biCorp1,
        bilGovApproved,
        bilCorpApproved,
        boqConc,
        boqRebar,
        boqMob,
        boqCorp,
      ]
    );
    await admin.query(
      `INSERT INTO "BillingDeduction"(id, "grossBilling", retention, "withholdingTax", vat, "mobilizationAdvanceRecoupment", "liquidatedDamages", "netAmountDue", "billingId")
       VALUES ($1, 385000, 38500, 24062.50, 41250.00, 57750.00, 0.00, 264687.50, $2)`,
      [bdGov, bilGovApproved]
    );

    await admin.query(
      `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
       VALUES
         ($1, 385000, 385000, 264687.50, 200000.00, '2026-09-20T00:00:00.000Z', 'OR-D2R2-GOV-001',  'PAID',    $4, now()),
         ($2, 385000, 385000, 264687.50, 48062.50,  '2026-09-25T00:00:00.000Z', 'CHK-D2R2-PND-001', 'PENDING', $4, now()),
         ($3, 100000, 100000, 90000.00,  80000.00,  '2026-09-22T00:00:00.000Z', 'OR-D2R2-CORP-001', 'PAID',    $5, now())`,
      [payGovCleared, payGovPending, payCorpCleared, bilGovApproved, bilCorpApproved]
    );

    await admin.query(
      `INSERT INTO "ProjectSchedule"(id, "projectId", name, status, "workflowStatus", "baselineRevision", "projectStartDate", "baselineStartDate", "baselineFinishDate", "workDaysConfig", "approvedBy", "approvedAt", "activatedById", "activatedAt", "activationSnapshotHash", "updatedAt")
       VALUES
         ($1, $3, 'Master Baseline Schedule Rev 1', 'BASELINE', 'ACTIVE_BASELINE', 1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $5, '2026-08-25T00:00:00.000Z', $5, '2026-08-25T00:00:00.000Z', $6, now()),
         ($2, $4, 'Corp Baseline Schedule Rev 1',   'BASELINE', 'ACTIVE_BASELINE', 1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-10-20T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $5, '2026-08-25T00:00:00.000Z', $5, '2026-08-25T00:00:00.000Z', $7, now())`,
      [
        schedBaseline,
        schedCorpBaseline,
        p1,
        pCorp,
        s.f.ids.a,
        s.hash(schedBaseline),
        s.hash(schedCorpBaseline),
      ]
    );
    await admin.query(
      `INSERT INTO "ScheduleWBS"(id, "scheduleId", code, name, level, "orderIndex", "updatedAt")
       VALUES ($1, $2, 'WBS-01', 'Substructure & Structural Works', 1, 1, now())`,
      [wbs1, schedBaseline]
    );
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", status, "updatedAt")
       VALUES
         ($1, $6, $8,  'ACT-100',  'Site Mobilization & Layout',    '2026-09-01T00:00:00.000Z', '2026-09-07T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-07T00:00:00.000Z', 5,  1,    'lot', 50000.00,  'COMPLETED',   now()),
         ($2, $6, $8,  'ACT-200',  'Structural Concrete Phase 1',   '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 100,  'm3',  632000.00, 'IN_PROGRESS', now()),
         ($3, $6, $8,  'ACT-300',  'Reinforcing Steel Fabrication', '2026-09-05T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 4,  2000, 'kg',  110000.00, 'IN_PROGRESS', now()),
         ($4, $7, NULL,'CORP-100', 'Corp Slab Excavation & Pour',   '2026-09-01T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 15, 20,   'm3',  100000.00, 'COMPLETED',   now()),
         ($5, $7, NULL,'CORP-200', 'Corp Slab Finishing',           '2026-09-26T00:00:00.000Z', '2026-10-20T00:00:00.000Z', '2026-09-26T00:00:00.000Z', '2026-10-20T00:00:00.000Z', 15, 20,   'm3',  100000.00, 'IN_PROGRESS', now())`,
      [act100, act200, act300, actCorp1, actCorp2, schedBaseline, schedCorpBaseline, wbs1]
    );
    await admin.query(
      `INSERT INTO "ScheduleDependency"(id, "scheduleId", "predecessorId", "successorId", type, "lagDays")
       VALUES
         ($1, $3, $4, $5, 'FS', 0),
         ($2, $3, $4, $6, 'SS', 2)`,
      [dep1, dep2, schedBaseline, act100, act200, act300]
    );
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $4, $7, 1.0000,    100.000000),
         ($2, $5, $8, 100.0000,  100.000000),
         ($3, $6, $9, 2000.0000, 100.000000)`,
      [ulnk1, ulnk2, ulnk3, plMobP1, plConcP1, plRebarP1, act100, act200, act300]
    );
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $4, $5, '2026-09-15T00:00:00.000Z', 100, 1,    $8, $9),
         ($2, $4, $6, '2026-09-15T00:00:00.000Z', 50,  50,   $8, $9),
         ($3, $4, $7, '2026-09-15T00:00:00.000Z', 50,  1000, $8, $9)`,
      [spu100, spu200, spu300, schedBaseline, act100, act200, act300, s.f.ids.a, accApproved]
    );

    await admin.query(
      `INSERT INTO "Supplier"(id, name, "isVatable", "updatedAt")
       VALUES ($1, 'Holcim Synthetic Cement Corp', true, now())`,
      [supplier1]
    );
    await admin.query(
      `INSERT INTO "MaterialRequest"(id, "mrNumber", status, "projectId", "requesterId", "approverId", "updatedAt")
       VALUES ($1, $2, 'APPROVED', $3, $4, $4, now())`,
      [mr1, 'MR-D2R2-' + hexId.toUpperCase(), p1, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "MaterialRequestItem"(id, quantity, "approvedQuantity", "mrId", "consolidatedBoqItemId", "canonicalResourceId", "uboqResourceRequirementId")
       VALUES ($1, 500, 500, $2, $3, $4, $5)`,
      [mriCement, mr1, cboqConc, acctCement, prrCement]
    );

    const poCementNo = 'PO-D2R2-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "PurchaseOrder"(id, "poNumber", status, "supplierId", "mrId", "totalAmount", "netAmount", "vatAmount", "dueDate", "approverId", "approvedAt", "createdAt", "updatedAt")
       VALUES
         ($1, $3, 'APPROVED', $5, $6, 112000.00, 100000.00, 12000.00, '2026-10-10T00:00:00.000Z', $7, '2026-09-05T00:00:00.000Z', '2026-09-05T00:00:00.000Z', now()),
         ($2, $4, 'DRAFT',    $5, $6, 560000.00, 500000.00, 60000.00, '2026-10-20T00:00:00.000Z', NULL, NULL,                      '2026-09-06T00:00:00.000Z', now())`,
      [
        poCement,
        poDraftIgnored,
        poCementNo,
        'PO-D2R2-DRF-' + hexId.toUpperCase(),
        supplier1,
        mr1,
        s.f.ids.a,
      ]
    );
    await admin.query(
      `INSERT INTO "PurchaseOrderItem"(id, quantity, "unitCost", "poId", "consolidatedBoqItemId", "canonicalResourceId", "uboqResourceRequirementId", "mrItemId")
       VALUES ($1, 500, 200.00, $2, $3, $4, $5, $6)`,
      [poiCement, poCement, cboqConc, acctCement, prrCement, mriCement]
    );

    await admin.query(
      `INSERT INTO "Delivery"(id, "receiptNumber", date, status, "poId", "updatedAt")
       VALUES
         ($1, 'DR-D2R2-1', '2026-09-10T00:00:00.000Z', 'RECEIVED', $3, now()),
         ($2, 'DR-D2R2-2', '2026-09-20T00:00:00.000Z', 'RECEIVED', $3, now())`,
      [deliv1, deliv2, poCement]
    );

    const apPaidVoucher = 'APV-D2R2-PAID-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "AccountsPayable"(id, amount, "dueDate", status, "paidAt", "paidAmount", "netAmount", "vatAmount", "deliveryId", "poId", "supplierId", "voucherNumber", "createdAt", "updatedAt")
       VALUES
         ($1, 67200.00, '2026-09-25T00:00:00.000Z', 'PAID',     '2026-09-12T00:00:00.000Z', 67200.00, 60000.00, 7200.00, $3, $5, $6, $7, '2026-09-10T00:00:00.000Z', now()),
         ($2, 22400.00, '2026-10-10T00:00:00.000Z', 'APPROVED', NULL,                       0.00,     20000.00, 2400.00, $4, $5, $6, $8, '2026-09-20T00:00:00.000Z', now())`,
      [
        apCementPaid,
        apCementUnpaid,
        deliv1,
        deliv2,
        poCement,
        supplier1,
        apPaidVoucher,
        'APV-D2R2-UNP-' + hexId.toUpperCase(),
      ]
    );

    const expPaidRef = 'OR-EXP-D2R2-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "Expense"(id, amount, date, category, description, "receiptRef", "isAccrued", "netAmount", "vatAmount", status, "approvalStatus", "projectId", "loggedById", "approverId", "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, 8960.00,  '2026-09-10T00:00:00.000Z', 'SITE_SUPPLIES', 'Temporary power & water setup', $4,      false, 8000.00,  960.00, 'APPROVED', 'APPROVED', $5, $6, $6, $7, now()),
         ($2, 4000.00,  '2026-09-22T00:00:00.000Z', 'EQUIPMENT',     'Accrued crane rental',          'ACCR-1',true,  4000.00,  0.00,   'APPROVED', 'APPROVED', $5, $6, $6, $7, now()),
         ($3, 50000.00, '2026-09-25T00:00:00.000Z', 'OTHER',         'Unapproved draft expense',      NULL,    false, 50000.00, 0.00,   'DRAFT',    'PENDING',  $5, $6, NULL,$7, now())`,
      [expMobPaid, expMobAccrued, expDraftIgnored, expPaidRef, p1, s.f.ids.a, boqMob]
    );

    await admin.query(
      `INSERT INTO "Worker"(id, "firstName", "lastName", "projectId", "updatedAt")
       VALUES ($1, 'Juan', 'Dela Cruz', $2, now())`,
      [synthWorker, p1]
    );
    await admin.query(
      `INSERT INTO "PayrollPeriod"(id, "payrollBatchNumber", month, year, "periodType", "startDate", "endDate", "payrollDate", status, "projectId", "approvedById", "dateApproved", "dateReleased", "updatedAt")
       VALUES ($1, $2, 9, 2026, 'FIRST_HALF', '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 'RELEASED', $3, $4, '2026-09-15T00:00:00.000Z', '2026-09-15T00:00:00.000Z', now())`,
      [payPeriod1, payBatchNo, p1, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "Payroll"(id, "workerId", "payrollPeriodId", "projectId", "grossPay", "sssEmployerShare", "philhealthEmployerShare", "pagibigEmployerShare", "netPay", "paymentStatus", "transactionReference", "updatedAt")
       VALUES ($1, $2, $3, $4, 18500.00, 900.00, 400.00, 200.00, 17200.00, 'PAID', $5, now())`,
      [payrollRow1, synthWorker, payPeriod1, p1, payBatchNo]
    );

    await admin.query(
      `INSERT INTO "CommitmentLedger"(id, "projectId", "commitmentType", "supplierName", "subcontractorName", "approvedAmount", "billedAmount", "paidAmount", "remainingCommitment", status, "consolidatedBoqItemId", "awardedBoqItemId", "createdAt", "updatedAt")
       VALUES
         ($1, $5, 'PURCHASE_ORDER', 'Holcim Synthetic Cement Corp', NULL,                          100000.00, 60000.00, 60000.00, 40000.00, 'ACTIVE', $7,   NULL, '2026-09-05T00:00:00.000Z', now()),
         ($2, $5, 'SUBCONTRACT',    NULL,                           'Synthetic Rebar Subcon Corp', 50000.00,  25000.00, 15000.00, 25000.00, 'ACTIVE', NULL, $8,   '2026-09-06T00:00:00.000Z', now()),
         ($3, $5, $10,              NULL,                           'Synthetic Rebar Subcon Corp', 10000.00,  0.00,     0.00,     10000.00, 'ACTIVE', NULL, $8,   '2026-09-08T00:00:00.000Z', now()),
         ($4, $6, 'PURCHASE_ORDER', 'Foreign Supplier',             NULL,                          30000.00,  10000.00, 10000.00, 20000.00, 'ACTIVE', NULL, $9,   '2026-09-05T00:00:00.000Z', now())`,
      [
        clMirrorPoCement,
        clMirrorSubPkg,
        clMirrorSvo,
        clForeign,
        p1,
        pForeign,
        cboqConc,
        boqRebar,
        boqForeign,
        `SVO:${svoApprovedNo}`,
      ]
    );

    await admin.query(
      `INSERT INTO "ProjectCostLedger"(id, "projectId", "costDate", "costCategory", "referenceDocumentType", "referenceDocumentNo", "grossAmount", "vatAmount", "netAmount", "paidAmount", "unpaidBalance", "paymentStatus", "approvalStatus", "consolidatedBoqItemId", "awardedBoqItemId", "poItemId", "updatedAt")
       VALUES
         ($1, $6, '2026-09-12T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     $8,  67200.00, 7200.00, 60000.00, 67200.00, 0.00,     'PAID', 'APPROVED', $12,  NULL, $16,  now()),
         ($2, $6, '2026-09-18T00:00:00.000Z', 'SUBCON',   'SUBCON_BILLING', $9,  25000.00, 0.00,    25000.00, 15000.00, 10000.00, 'PAID', 'APPROVED', NULL, $13,  NULL, now()),
         ($3, $6, '2026-09-10T00:00:00.000Z', 'EXPENSE',  'OR_RECEIPT',     $10, 8960.00,  960.00,  8000.00,  8960.00,  0.00,     'PAID', 'APPROVED', NULL, $14,  NULL, now()),
         ($4, $6, '2026-09-15T00:00:00.000Z', 'PAYROLL',  'PAYROLL_BATCH',  $11, 20000.00, 0.00,    20000.00, 20000.00, 0.00,     'PAID', 'APPROVED', NULL, NULL, NULL, now()),
         ($5, $7, '2026-09-14T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     'CORP-AP-D2R2', 56000.00, 6000.00, 50000.00, 56000.00, 0.00, 'PAID', 'APPROVED', NULL, $15, NULL, now())`,
      [
        pclMirrorPoCement,
        pclMirrorSbRebar,
        pclMirrorExpMob,
        pclMirrorPayroll,
        pclCorpApproved,
        p1,
        pCorp,
        apPaidVoucher,
        sbNumRebar,
        expPaidRef,
        payBatchNo,
        cboqConc,
        boqRebar,
        boqMob,
        boqCorp,
        poiCement,
      ]
    );

    await admin.query(
      `INSERT INTO "UboqCashFlowPeriod"(
         id, "projectId", "snapshotId", "periodType", "periodIndex", "periodLabel", "quarterLabel",
         "periodStart", "periodEnd", "plannedValueWeightAmt", "procurementCashOutAmt", "payrollSubconCashOutAmt", "otherCashOutAmt"
       )
       VALUES
         ($1, $8, $10, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 150000.00, 90000.00, 60000.00, 15000.00),
         ($2, $8, $10, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-16T00:00:00.000Z', '2026-09-30T23:59:59.999Z', 200000.00, 80000.00, 55000.00, 10000.00),
         ($3, $8, $10, 'HALF_MONTH', 3, '2026-10-H1', '2026-Q4', '2026-10-01T00:00:00.000Z', '2026-10-15T23:59:59.999Z', 200000.00, 70000.00, 50000.00, 10000.00),
         ($4, $8, $10, 'HALF_MONTH', 4, '2026-10-H2', '2026-Q4', '2026-10-16T00:00:00.000Z', '2026-10-31T23:59:59.999Z', 150000.00, 50000.00, 40000.00, 8000.00),
         ($5, $8, $10, 'HALF_MONTH', 5, '2026-11-H1', '2026-Q4', '2026-11-01T00:00:00.000Z', '2026-11-15T23:59:59.999Z', 118400.00, 40000.00, 30000.00, 5000.00),
         ($6, $8, $10, 'HALF_MONTH', 6, '2026-11-H2', '2026-Q4', '2026-11-16T00:00:00.000Z', '2026-11-30T23:59:59.999Z', 99999.97,  30000.00, 20000.00, 5000.00),
         ($7, $9, $11, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 50000.00,  20000.00, 10000.00, 2000.00)`,
      [...cfpIds, cfpForeign, p1, pForeign, snap1, snapForeign]
    );
  });

  const sourceDigestBefore = await canonicalSourceDigest();

  actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
  const Module = require('node:module');
  originalLoad = Module._load;
  Module._load = function (request: string, ...args: any[]) {
    if (request === '@/lib/dal/auth') {
      return { verifyOperationalSession: async () => actor };
    }
    return originalLoad.call(this, request, ...args);
  };
  try {
    workingRoute = require('../../src/app/api/uboq/templates/route');
    layoutsRoute = require('../../src/app/api/uboq/templates/layouts/route');
    formalRoute = require('../../src/app/api/uboq/templates/formal-export/route');
    roundTripRoute = require('../../src/app/api/uboq/templates/round-trip/route');
    prisma = require('../../src/lib/prisma').prisma;
    withUboqRlsContext = require('../../src/lib/uboq/project-ownership').withUboqRlsContext;
    loadT11VariationOrderRegisterCanonicalData =
      require('../../src/lib/uboq/templates/canonical-source-adapters').loadT11VariationOrderRegisterCanonicalData;
  } finally {
    Module._load = originalLoad;
    originalLoad = null;
  }
  NextRequest = require('next/server').NextRequest;

  const getWorking = (proj = p1) =>
    workingRoute.GET(new NextRequest(`http://localhost/api/uboq/templates?projectId=${proj}`));
  const postWorking = (body: any) =>
    workingRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );
  const postLayouts = (body: any) =>
    layoutsRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );
  const getFormal = (proj = p1) =>
    formalRoute.GET(
      new NextRequest(`http://localhost/api/uboq/templates/formal-export?projectId=${proj}`)
    );
  const postFormal = (body: any) =>
    formalRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/formal-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );
  const getRoundTrip = (proj = p1) =>
    roundTripRoute.GET(
      new NextRequest(`http://localhost/api/uboq/templates/round-trip?projectId=${proj}`)
    );
  const postRoundTripJson = (body: any) =>
    roundTripRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/round-trip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
  const postRoundTripMultipart = (formData: FormData) =>
    roundTripRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/round-trip', {
        method: 'POST',
        body: formData,
      })
    );

  async function adminReplica(fn: () => Promise<void>): Promise<void> {
    await s.transaction(admin, async () => {
      await admin.query("SET LOCAL session_replication_role='replica'");
      await fn();
    });
  }

  async function withTempAdminMutation<T>(
    applySql: () => Promise<void>,
    revertSql: () => Promise<void>,
    testFn: () => Promise<T>,
    runApplyInReplica = true
  ): Promise<T> {
    if (runApplyInReplica) {
      await adminReplica(applySql);
    } else {
      await applySql();
    }
    try {
      return await testFn();
    } finally {
      await adminReplica(revertSql);
    }
  }

  // ==========================================================================
  // CHECK 1: WP3-BDD2-R2-01 — D2-R1-IR-01 Migration Checksum Integrity
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-01 (D2-R1-IR-01): Forward-only Migration #37 enforces _prisma_migrations ledger immutability (blocking checksum UPDATE 42501, in-place rollback 42501, DELETE 42501, duplicate finished INSERT 23505, and malformed checksum 23514), revokes PUBLIC/app/maint grants, verifies 37/37 SHA-256 disk-to-ledger parity, and fails closed on modified migration checksums',
    async () => {
      // 1A. Verify 37/37 exact SHA-256 disk-to-ledger parity via migration-checksum-guard.cjs
      const ledgerAudit = await verifyLedgerAgainstDisk(admin);
      assert.equal(ledgerAudit.diskCount, 37);
      assert.equal(ledgerAudit.appliedCount, 37);
      assert.equal(ledgerAudit.verifiedMatchCount, 37);

      // 1B. Verify database-side state function uboq_verify_prisma_migration_ledger_state()
      const dbLedgerState = (
        await admin.query(`SELECT * FROM public.uboq_verify_prisma_migration_ledger_state()`)
      ).rows[0];
      assert.deepEqual(dbLedgerState, {
        total_rows: 37,
        finished_active_rows: 37,
        unfinished_or_rolled_back_rows: 0,
        invalid_checksum_rows: 0,
        duplicate_name_groups: 0,
      });

      // 1C. Verify zero privileges on public."_prisma_migrations" for PUBLIC, oserp_compat_app, and oserp_maint_cleanup_role
      const migGrants = (
        await admin.query(
          `SELECT grantee::text AS grantee, privilege_type::text AS privilege_type
             FROM information_schema.role_table_grants
            WHERE table_schema = 'public'
              AND table_name = '_prisma_migrations'
              AND grantee IN ('PUBLIC', 'oserp_compat_app', 'oserp_maint_cleanup_role')`
        )
      ).rows;
      assert.deepEqual(
        migGrants,
        [],
        `Expected zero _prisma_migrations grants for PUBLIC/app/maint, got ${JSON.stringify(migGrants)}`
      );

      // Verify restricted app client cannot read or mutate _prisma_migrations (42501)
      let appLedgerSelectErr = '';
      await restrictedClient.query('BEGIN');
      try {
        await restrictedClient.query(`SELECT count(*) FROM public."_prisma_migrations"`);
      } catch (e: any) {
        appLedgerSelectErr = e.code;
      } finally {
        await restrictedClient.query('ROLLBACK');
      }
      assert.equal(appLedgerSelectErr, '42501');

      // 1D. Verify trigger trg_uboq_guard_prisma_migration_ledger blocks checksum overwrite, rollback, delete, duplicate finished insert, and invalid checksum
      const targetMigName = '20261114000000_wp3_batch_d_d2_r1_ir_rls_and_lineage_hardening';
      let checksumOverwriteErr = '';
      let rollbackInPlaceErr = '';
      let ledgerDeleteErr = '';
      let duplicateInsertErr = '';
      let invalidChecksumInsertErr = '';

      await s.transaction(admin, async () => {
        await admin.query('SAVEPOINT sp_chk_upd');
        try {
          await admin.query(
            `UPDATE public."_prisma_migrations" SET checksum = repeat('0', 64) WHERE migration_name = $1`,
            [targetMigName]
          );
        } catch (e: any) {
          checksumOverwriteErr = `${e.code}:${e.message}`;
          await admin.query('ROLLBACK TO SAVEPOINT sp_chk_upd');
        }

        await admin.query('SAVEPOINT sp_chk_rb');
        try {
          await admin.query(
            `UPDATE public."_prisma_migrations" SET rolled_back_at = now() WHERE migration_name = $1`,
            [targetMigName]
          );
        } catch (e: any) {
          rollbackInPlaceErr = `${e.code}:${e.message}`;
          await admin.query('ROLLBACK TO SAVEPOINT sp_chk_rb');
        }

        await admin.query('SAVEPOINT sp_chk_del');
        try {
          await admin.query(
            `DELETE FROM public."_prisma_migrations" WHERE migration_name = $1`,
            ['20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard']
          );
        } catch (e: any) {
          ledgerDeleteErr = `${e.code}:${e.message}`;
          await admin.query('ROLLBACK TO SAVEPOINT sp_chk_del');
        }

        await admin.query('SAVEPOINT sp_chk_dup');
        try {
          await admin.query(
            `INSERT INTO public."_prisma_migrations"(id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
             VALUES ($1, repeat('a', 64), now(), $2, NULL, NULL, now(), 1)`,
            [s.crypto.randomUUID(), targetMigName]
          );
        } catch (e: any) {
          duplicateInsertErr = `${e.code}:${e.message}`;
          await admin.query('ROLLBACK TO SAVEPOINT sp_chk_dup');
        }

        await admin.query('SAVEPOINT sp_chk_fmt');
        try {
          await admin.query(
            `INSERT INTO public."_prisma_migrations"(id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
             VALUES ($1, 'NOT-A-VALID-SHA256', now(), '20990101000000_invalid_checksum_test', NULL, NULL, now(), 1)`,
            [s.crypto.randomUUID()]
          );
        } catch (e: any) {
          invalidChecksumInsertErr = `${e.code}:${e.message}`;
          await admin.query('ROLLBACK TO SAVEPOINT sp_chk_fmt');
        }
      });

      assert.match(checksumOverwriteErr, /^42501:.*UBOQ_APPLIED_MIGRATION_CHECKSUM_IMMUTABLE/);
      assert.match(rollbackInPlaceErr, /^42501:.*UBOQ_APPLIED_MIGRATION_CHECKSUM_IMMUTABLE/);
      assert.match(ledgerDeleteErr, /^42501:.*UBOQ_APPLIED_MIGRATION_DELETE_FORBIDDEN/);
      assert.match(duplicateInsertErr, /^23505:.*UBOQ_APPLIED_MIGRATION_DUPLICATE_FORBIDDEN/);
      assert.match(invalidChecksumInsertErr, /^23514:.*UBOQ_MIGRATION_CHECKSUM_FORMAT_INVALID/);

      // 1E. Verify assertForwardOnlyMigrationReady fails closed on simulated post-apply file edit without mutating ledger
      let guardErrCode = '';
      try {
        await assertForwardOnlyMigrationReady(admin, {
          migrationName: targetMigName,
          migrationPath: `prisma/migrations/${targetMigName}/migration.sql`,
          expectedPriorCount: 34,
          simulatedSha256Override: 'f'.repeat(64),
        });
      } catch (err: any) {
        assert.ok(err instanceof MigrationChecksumIntegrityError);
        guardErrCode = err.code;
      }
      assert.equal(guardErrCode, 'MIGRATION_CHECKSUM_MISMATCH');

      // Verify idempotent re-check with true on-disk hash returns ALREADY_APPLIED_AND_VERIFIED
      const cleanReVerify = await assertForwardOnlyMigrationReady(admin, {
        migrationName: '20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard',
        migrationPath:
          'prisma/migrations/20261114020000_wp3_batch_d_d2_r2_migration_checksum_immutability_guard/migration.sql',
        expectedPriorCount: 36,
      });
      assert.equal(cleanReVerify.status, 'ALREADY_APPLIED_AND_VERIFIED');

      // 1F. Verify zero _prisma_migrations UPDATE/DELETE statements in apply scripts #35 & #36,
      //     and zero parameterized checksum-overwrite SQL (SET checksum = $...) across #35, #36, and #37
      for (const scriptRel of [
        'scripts/uboq/apply-wp3-batch-d-d2-r1-migration35.cjs',
        'scripts/uboq/apply-wp3-batch-d-d2-r1-migration36.cjs',
      ]) {
        const scriptSrc = s.fs.readFileSync(scriptRel, 'utf8');
        assert.equal(
          /(?:UPDATE|DELETE\s+FROM)\s+(?:public\.)?"?_prisma_migrations"?/i.test(scriptSrc),
          false,
          `Forbidden _prisma_migrations mutation SQL found in ${scriptRel}`
        );
      }
      for (const scriptRel of [
        'scripts/uboq/apply-wp3-batch-d-d2-r1-migration35.cjs',
        'scripts/uboq/apply-wp3-batch-d-d2-r1-migration36.cjs',
        'scripts/uboq/apply-wp3-batch-d-d2-r2-migration37.cjs',
      ]) {
        const scriptSrc = s.fs.readFileSync(scriptRel, 'utf8');
        assert.equal(
          /SET\s+checksum\s*=\s*\$/i.test(scriptSrc),
          false,
          `Forbidden parameterized checksum overwrite found in ${scriptRel}`
        );
      }

      // 1G. Verify npx prisma migrate status exits 0 cleanly against all 37 applied migrations
      const migrateStatusOut = execFileSync(
        process.execPath,
        ['node_modules/prisma/build/index.js', 'migrate', 'status'],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            DATABASE_URL: s.adminDatabaseUrl
              ? s.adminDatabaseUrl()
              : (() => {
                  const u = new URL('postgresql://127.0.0.1');
                  u.port = String(s.config.port);
                  u.pathname = '/' + s.config.database;
                  u.username = s.config.user;
                  u.password = s.config.password;
                  return u.toString();
                })(),
            DIRECT_URL: (() => {
              const u = new URL('postgresql://127.0.0.1');
              u.port = String(s.config.port);
              u.pathname = '/' + s.config.database;
              u.username = s.config.user;
              u.password = s.config.password;
              return u.toString();
            })(),
          },
          encoding: 'utf8',
        }
      );
      assert.match(migrateStatusOut, /37 migrations found in prisma\/migrations/);
      assert.match(migrateStatusOut, /Database schema is up to date!/);

      return {
        appliedMigrationCount: ledgerAudit.appliedCount,
        verifiedSha256MatchCount: ledgerAudit.verifiedMatchCount,
        restrictedSelectDeniedSqlState: appLedgerSelectErr,
        checksumOverwriteBlocked: true,
        rollbackInPlaceBlocked: true,
        ledgerDeleteBlocked: true,
        duplicateFinishedInsertBlocked: true,
        modifiedDiskChecksumFailsClosed: guardErrCode,
        prismaMigrateStatusUpToDate: true,
      };
    }
  );

  async function assertT11AdapterReason(
    expectedCode: string,
    expectedReasonSubstring: string
  ): Promise<void> {
    let caught: any = null;
    try {
      await withUboqRlsContext(
        { userId: synthExecUser, sessionVersion: 7, projectId: p1 },
        () =>
          prisma.$transaction((tx: any) =>
            loadT11VariationOrderRegisterCanonicalData(tx, p1, snap1, {
              effectiveRole: 'FINANCE_DIRECTOR',
              fieldAccessRole: 'FINANCE_DIRECTOR',
            })
          )
      );
    } catch (err: any) {
      caught = err;
    }
    assert.ok(
      caught,
      `Expected T11 canonical adapter to throw ${expectedCode} (${expectedReasonSubstring})`
    );
    assert.equal(caught.code, expectedCode);
    assert.equal(caught.status, 409);
    assert.match(String(caught.detail?.reason || ''), new RegExp(expectedReasonSubstring));
  }

  // ==========================================================================
  // CHECK 2: WP3-BDD2-R2-02 — D2-R1-IR-02 Zero-Value VO Arithmetic Reconciliation
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-02 (D2-R1-IR-02): Unconditional zero & non-zero VO arithmetic reconciliation blocks zero-header/zero-component/zero-net-item/UNIT_PRICE-zero-delta/SVO-zero-amount mismatches (409) while accepting genuine balanced zero-net amendments, zero-delta spec clarifications, and 100% deductive SVOs (200)',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      const assertT11WorkingAndFormal409 = async (expectedReasonSubstring?: string) => {
        const wRes = await postWorking({
          projectId: p1,
          templateCode: 'T11_VARIATION_ORDER_REGISTER',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(wRes.status, 409);
        const wBody = await wRes.json();
        assert.equal(wBody.error, 'TEMPLATE_VO_ARITHMETIC_MISMATCH');
        assert.equal(wBody.details, undefined);
        if (expectedReasonSubstring) {
          await assertT11AdapterReason('TEMPLATE_VO_ARITHMETIC_MISMATCH', expectedReasonSubstring);
        }

        const fRes = await postFormal({
          projectId: p1,
          templateCode: 'T11_VARIATION_ORDER_REGISTER',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(fRes.status, 409);
        assert.equal((await fRes.json()).error, 'FORMAL_VO_ARITHMETIC_MISMATCH');
      };

      // 2A. Zero header (0 / 0 / 0) vs non-zero approved item (+126,400.00) -> 409
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrder" SET "additionalAmount" = 0.00, "deductiveAmount" = 0.00, "netVariationAmount" = 0.00 WHERE id = $1`,
            [voClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrder" SET "additionalAmount" = 126400.00, "deductiveAmount" = 0.00, "netVariationAmount" = 126400.00 WHERE id = $1`,
            [voClientApproved]
          );
        },
        async () => {
          await assertT11WorkingAndFormal409('VO_HEADER_NET_AMOUNT_DISAGREES_WITH_APPROVED_ITEMS_SUM');
        }
      );

      // 2B. Zero header components (additionalAmount=0, deductiveAmount=0) with non-zero header netVariationAmount=126,400.00 -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrder" SET "additionalAmount" = 0.00, "deductiveAmount" = 0.00, "netVariationAmount" = 126400.00 WHERE id = $1`,
            [voClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrder" SET "additionalAmount" = 126400.00, "deductiveAmount" = 0.00, "netVariationAmount" = 126400.00 WHERE id = $1`,
            [voClientApproved]
          );
        },
        async () => {
          await assertT11WorkingAndFormal409('VO_HEADER_ADDITIVE_MINUS_DEDUCTIVE_DISAGREES_WITH_NET_AMOUNT');
        }
      );

      // 2C. VariationOrderItem zero-net bypass (additionalAmount=126400, deductiveAmount=0, netAmount=0.00!) -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "netAmount" = 0.00 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "netAmount" = 126400.00 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await assertT11WorkingAndFormal409('VO_ITEM_ADDITIVE_MINUS_DEDUCTIVE_DISAGREES_WITH_NET_AMOUNT');
        }
      );

      // 2D. VariationOrderItem zero components (additionalAmount=0, deductiveAmount=0) with non-zero netAmount=126400.00 -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "additionalAmount" = 0.00, "deductiveAmount" = 0.00, "netAmount" = 126400.00 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "additionalAmount" = 126400.00, "deductiveAmount" = 0.00, "netAmount" = 126400.00 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await assertT11WorkingAndFormal409('VO_ITEM_ADDITIVE_MINUS_DEDUCTIVE_DISAGREES_WITH_NET_AMOUNT');
        }
      );

      // 2E. UNIT_PRICE item zero quantity delta (orig=100, prop=0, rev=100) with non-zero amount (126400.00) -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "currentProposedQuantity" = 0, "revisedQuantity" = 100 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "currentProposedQuantity" = 20, "revisedQuantity" = 120 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await assertT11WorkingAndFormal409('VO_ITEM_NET_AMOUNT_DISAGREES_WITH_QTY_DELTA_TIMES_RATE');
        }
      );

      // 2F. UNIT_PRICE item non-zero quantity delta (+20) with zero item & header amounts (0/0/0) -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrder" SET "additionalAmount" = 0.00, "deductiveAmount" = 0.00, "netVariationAmount" = 0.00 WHERE id = $1`,
            [voClientApproved]
          );
          await admin.query(
            `UPDATE "VariationOrderItem" SET "additionalAmount" = 0.00, "deductiveAmount" = 0.00, "netAmount" = 0.00 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrder" SET "additionalAmount" = 126400.00, "deductiveAmount" = 0.00, "netVariationAmount" = 126400.00 WHERE id = $1`,
            [voClientApproved]
          );
          await admin.query(
            `UPDATE "VariationOrderItem" SET "additionalAmount" = 126400.00, "deductiveAmount" = 0.00, "netAmount" = 126400.00 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await assertT11WorkingAndFormal409('VO_ITEM_NET_AMOUNT_DISAGREES_WITH_QTY_DELTA_TIMES_RATE');
        }
      );

      // 2G. SubcontractorVariationOrder zero-value bypass matrix:
      //     (1) orig=40000, prop=0, rev=50000 -> 409
      //     (2) orig=40000, prop=10000, rev=0 -> 409
      //     (3) orig=0, prop=10000, rev=25000 -> 409
      //     (4) non-zero qty delta (+500) with zero amount delta (orig=40000, prop=0, rev=40000) -> 409
      for (const [oAmt, pAmt, rAmt, expectedReason] of [
        [40000, 0, 50000, 'SUBCONTRACTOR_VO_REVISED_AMOUNT_CONFLICTS_WITH_PROPOSED_DELTA'],
        [40000, 10000, 0, 'SUBCONTRACTOR_VO_REVISED_AMOUNT_CONFLICTS_WITH_PROPOSED_DELTA'],
        [0, 10000, 25000, 'SUBCONTRACTOR_VO_REVISED_AMOUNT_CONFLICTS_WITH_PROPOSED_DELTA'],
        [40000, 0, 40000, 'SUBCONTRACTOR_VO_NON_ZERO_QUANTITY_DELTA_WITH_ZERO_AMOUNT'],
      ] as Array<[number, number, number, string]>) {
        await withTempAdminMutation(
          async () => {
            await admin.query(
              `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractAmt" = $1, "proposedAdditionalAmt" = $2, "revisedSubcontractAmt" = $3 WHERE id = $4`,
              [oAmt, pAmt, rAmt, svoRebarApproved]
            );
          },
          async () => {
            await admin.query(
              `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractAmt" = 40000, "proposedAdditionalAmt" = 10000, "revisedSubcontractAmt" = 50000 WHERE id = $1`,
              [svoRebarApproved]
            );
          },
          async () => {
            await assertT11WorkingAndFormal409(expectedReason);
          }
        );
      }

      // 2H. Balanced zero-net VO header with mismatched gross components (header add=10000, ded=10000, net=0 vs items +27500/-27500)
      //     -> 409 first, then fix header to add=27500, ded=27500, net=0 -> 200!
      const voBalZero = prefix + '-TMP-VO-BAL0';
      const voiBalPlus = prefix + '-TMP-VOI-BALP';
      const voiBalMinus = prefix + '-TMP-VOI-BALM';
      const vodBal = prefix + '-TMP-VOD-BAL0';
      const voaBal = prefix + '-TMP-VOA-BAL0';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "approvedForBilling", "createdAt", "updatedAt")
             VALUES ($1, $2, 'COMBINED', 'APPROVED', NULL, $3, 10000.00, 10000.00, 0.00, true, '2026-09-07T00:00:00.000Z', now())`,
            [voBalZero, 'CVO-BAL-ZERO-' + hexId.toUpperCase(), p1]
          );
          await admin.query(
            `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "currentProposedQuantity", "revisedQuantity", "approvedUnitCost", "additionalAmount", "deductiveAmount", "netAmount", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
             VALUES
               ($1, 'VOI-001', 'ADDITIONAL_QTY', 'Balanced +500kg Rebar',  'kg',  2000, 500,   2500, 55.00,    27500.00, 0.00,     27500.00,  'APPROVED', $3, $4, now()),
               ($2, 'VOI-002', 'DEDUCTIVE_QTY',  'Balanced -0.55lot Mob', 'lot', 1,    -0.55, 0.45, 50000.00, 0.00,     27500.00, -27500.00, 'APPROVED', $3, $5, now())`,
            [voiBalPlus, voiBalMinus, voBalZero, boqRebar, boqMob]
          );
          await admin.query(
            `INSERT INTO "VariationOrderDocument"(id, "fileName", "fileType", "fileUrl", "documentCategory", "uploadedById", "variationOrderId", "updatedAt")
             VALUES ($1, 'Signed-Balanced-Zero-VO.pdf', 'application/pdf', 'memory://bal0.pdf', 'APPROVED_VO_ORDER', $2, $3, now())`,
            [vodBal, s.f.ids.a, voBalZero]
          );
          await admin.query(
            `INSERT INTO "VariationOrderApproval"(id, stage, action, "actionById", remarks, "variationOrderId", "updatedAt")
             VALUES ($1, 'EXECUTIVE_APPROVAL', 'APPROVED', $2, 'Balanced zero-net scope reallocation', $3, now())`,
            [voaBal, s.f.ids.a, voBalZero]
          );
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 500, "revisedContractQuantity" = 2500, "revisedContractAmount" = 137500 WHERE id = $1`,
            [boqRebar]
          );
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = -0.55, "revisedContractQuantity" = 0.45, "revisedContractAmount" = 22500 WHERE id = $1`,
            [boqMob]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 0, "revisedContractQuantity" = 2000, "revisedContractAmount" = 110000 WHERE id = $1`,
            [boqRebar]
          );
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 0, "revisedContractQuantity" = 1, "revisedContractAmount" = 50000 WHERE id = $1`,
            [boqMob]
          );
          await admin.query(`DELETE FROM "VariationOrderApproval" WHERE id = $1`, [voaBal]);
          await admin.query(`DELETE FROM "VariationOrderDocument" WHERE id = $1`, [vodBal]);
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id = ANY($1::text[])`, [
            [voiBalPlus, voiBalMinus],
          ]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE id = $1`, [voBalZero]);
        },
        async () => {
          // Gross component mismatch (10000 != 27500) despite net 0 == 0 -> 409!
          await assertT11WorkingAndFormal409('VO_HEADER_ADDITIONAL_AMOUNT_DISAGREES_WITH_APPROVED_ITEMS_SUM');

          // Fix header gross components to 27500 / 27500 / 0 -> 200!
          await adminReplica(async () => {
            await admin.query(
              `UPDATE "VariationOrder" SET "additionalAmount" = 27500.00, "deductiveAmount" = 27500.00, "netVariationAmount" = 0.00 WHERE id = $1`,
              [voBalZero]
            );
          });
          const wBal = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(wBal.status, 200);
          const wBalBody = await wBal.json();
          assert.equal(wBalBody.rowCount, 5);
          assert.equal(wBalBody.variationRegisterSummary.clientVoRevenueDeltaTotal, '126400.00');
          assert.equal(wBalBody.variationRegisterSummary.revisedContractValueTotal, '918400.00');
        }
      );

      // 2I. Genuine zero-delta / zero-amount administrative spec clarification VO on boqMob (0/0/0 header & 0/0/0 item, orig=1, prop=0, rev=1)
      //     AND genuine 100% deductive SubcontractorVariationOrder (orig=40000, prop=-40000, rev=0, origQty=2000, propQty=-2000, revQty=0) -> 200!
      const voSpecZero = prefix + '-TMP-VO-SPEC0';
      const voiSpecZero = prefix + '-TMP-VOI-SPEC0';
      const vodSpecZero = prefix + '-TMP-VOD-SPEC0';
      const voaSpecZero = prefix + '-TMP-VOA-SPEC0';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "approvedForBilling", "createdAt", "updatedAt")
             VALUES ($1, $2, 'SPEC_CLARIFICATION', 'APPROVED', NULL, $3, 0.00, 0.00, 0.00, true, '2026-09-07T00:00:00.000Z', now())`,
            [voSpecZero, 'CVO-SPEC-ZERO-' + hexId.toUpperCase(), p1]
          );
          await admin.query(
            `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "currentProposedQuantity", "revisedQuantity", "approvedUnitCost", "additionalAmount", "deductiveAmount", "netAmount", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
             VALUES ($1, 'VOI-001', 'SPEC_CHANGE', 'Zero-cost site office layout clarification', 'lot', 1, 0, 1, 50000.00, 0.00, 0.00, 0.00, 'APPROVED', $2, $3, now())`,
            [voiSpecZero, voSpecZero, boqMob]
          );
          await admin.query(
            `INSERT INTO "VariationOrderDocument"(id, "fileName", "fileType", "fileUrl", "documentCategory", "uploadedById", "variationOrderId", "updatedAt")
             VALUES ($1, 'Signed-Spec-Clarification.pdf', 'application/pdf', 'memory://spec0.pdf', 'APPROVED_VO_ORDER', $2, $3, now())`,
            [vodSpecZero, s.f.ids.a, voSpecZero]
          );
          await admin.query(
            `INSERT INTO "VariationOrderApproval"(id, stage, action, "actionById", remarks, "variationOrderId", "updatedAt")
             VALUES ($1, 'EXECUTIVE_APPROVAL', 'APPROVED', $2, 'Zero-cost specification clarification', $3, now())`,
            [voaSpecZero, s.f.ids.a, voSpecZero]
          );
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractQty" = 2000, "proposedAdditionalQty" = -2000, "revisedSubcontractQty" = 0, "originalSubcontractAmt" = 40000, "proposedAdditionalAmt" = -40000, "revisedSubcontractAmt" = 0 WHERE id = $1`,
            [svoRebarApproved]
          );
          await admin.query(
            `UPDATE "CommitmentLedger" SET "approvedAmount" = -40000.00, "remainingCommitment" = -40000.00 WHERE id = $1`,
            [clMirrorSvo]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "CommitmentLedger" SET "approvedAmount" = 10000.00, "remainingCommitment" = 10000.00 WHERE id = $1`,
            [clMirrorSvo]
          );
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractQty" = 2000, "proposedAdditionalQty" = 500, "revisedSubcontractQty" = 2500, "originalSubcontractAmt" = 40000, "proposedAdditionalAmt" = 10000, "revisedSubcontractAmt" = 50000 WHERE id = $1`,
            [svoRebarApproved]
          );
          await admin.query(`DELETE FROM "VariationOrderApproval" WHERE id = $1`, [voaSpecZero]);
          await admin.query(`DELETE FROM "VariationOrderDocument" WHERE id = $1`, [vodSpecZero]);
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id = $1`, [voiSpecZero]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE id = $1`, [voSpecZero]);
        },
        async () => {
          const wSpec = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(wSpec.status, 200);
          const wSpecBody = await wSpec.json();
          assert.equal(wSpecBody.rowCount, 4);
          // Subcon total = +3000 (voSubconApproved) + (-40000) (100% deductive SVO) = -37000.00
          assert.equal(wSpecBody.variationRegisterSummary.subconCommitmentVoDeltaTotal, '-37000.00');
          assert.equal(wSpecBody.variationRegisterSummary.clientVoRevenueDeltaTotal, '126400.00');
        }
      );

      return {
        zeroHeaderMismatchRejected: 409,
        zeroHeaderComponentsWithNonZeroNetRejected: 409,
        zeroNetItemWithNonZeroComponentsRejected: 409,
        unitPriceZeroQtyNonZeroAmtRejected: 409,
        unitPriceNonZeroQtyZeroAmtRejected: 409,
        svoZeroValueBypassesRejectedCount: 4,
        balancedZeroNetGrossMismatchRejected: 409,
        validBalancedZeroNetAccepted: 200,
        validZeroDeltaSpecClarificationAndFullDeductiveSvoAccepted: 200,
      };
    }
  );

  // ==========================================================================
  // CHECK 3: WP3-BDD2-R2-03 — D2-R1-IR-03 Revised Quantity Ambiguity
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-03 (D2-R1-IR-03): Unambiguous VO revised-quantity reconciliation rejects unpopulated 0 revisedQuantity on additive VOs (409 across T11, formal T11, T6 & T8), baseline/delta/direction/SVO/AwardedBOQItem quantity ambiguities (409), and misleading T11 aliases (409), while accurately projecting 100% deductive cancellations to 0.0000 and multi-VO sequential chains with scope-qualified headings (200)',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 3A. Unpopulated @default(0) revisedQuantity=0 on additive VO (orig=100, prop=20, rev=0)
      //     MUST fail closed 409 in T11 working, T11 formal, T6 Progress Billing, AND T8 Cash Flow!
      const origVoaCreatedAt = (
        await admin.query(`SELECT "createdAt" FROM "VariationOrderApproval" WHERE id = $1`, [
          voaClientApproved,
        ])
      ).rows[0].createdAt;
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderApproval" SET "createdAt" = '2026-09-02T00:00:00.000Z' WHERE id = $1`,
            [voaClientApproved]
          );
          await admin.query(
            `UPDATE "VariationOrderItem" SET "revisedQuantity" = 0 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "revisedQuantity" = 120 WHERE id = $1`,
            [voiClientApproved]
          );
          await admin.query(
            `UPDATE "VariationOrderApproval" SET "createdAt" = $1 WHERE id = $2`,
            [origVoaCreatedAt, voaClientApproved]
          );
        },
        async () => {
          const wT11 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(wT11.status, 409);
          const wT11Body = await wT11.json();
          assert.equal(wT11Body.error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');
          await assertT11AdapterReason(
            'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS',
            'VO_ITEM_REVISED_QUANTITY_DISAGREES_WITH_PRE_VO_PLUS_PROPOSED_DELTA'
          );

          const fT11 = await postFormal({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(fT11.status, 409);
          assert.equal((await fT11.json()).error, 'FORMAL_VO_REVISED_QUANTITY_AMBIGUOUS');

          const wT6 = await postWorking({
            projectId: p1,
            templateCode: 'T6_PROGRESS_BILLING',
            sourceId: bilGovApproved,
            format: 'json',
          });
          assert.equal(wT6.status, 409);
          assert.equal((await wT6.json()).error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');

          const wT8 = await postWorking({
            projectId: p1,
            templateCode: 'T8_CASHFLOW_HALF_MONTH',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(wT8.status, 409);
          assert.equal((await wT8.json()).error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');
        }
      );

      // 3B. Delta stored in revisedQuantity (orig=100, prop=20, rev=20) -> 409 TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "revisedQuantity" = 20 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "revisedQuantity" = 120 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          const res = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(res.status, 409);
          assert.equal((await res.json()).error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');
        }
      );

      // 3C. Baseline originalQuantity mismatch (orig=0, prop=120, rev=120 on 100 m3 BOQ item) -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "originalQuantity" = 0, "currentProposedQuantity" = 120, "revisedQuantity" = 120 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "originalQuantity" = 100, "currentProposedQuantity" = 20, "revisedQuantity" = 120 WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          const res = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(res.status, 409);
          const body = await res.json();
          assert.equal(body.error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');
          await assertT11AdapterReason(
            'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS',
            'VO_ITEM_ORIGINAL_QUANTITY_CONFLICTS_WITH_CANONICAL_BOQ_BASELINE'
          );
        }
      );

      // 3D. DEDUCTIVE classification direction conflict (itemClassification='DEDUCTIVE_QTY', orig=100, prop=20, rev=120) -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "itemClassification" = 'DEDUCTIVE_QTY' WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "itemClassification" = 'ADDITIONAL_QTY' WHERE id = $1`,
            [voiClientApproved]
          );
        },
        async () => {
          const res = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(res.status, 409);
          assert.equal((await res.json()).error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');
        }
      );

      // 3E. SubcontractorVariationOrder unpopulated revisedSubcontractQty=0 on additive SVO (orig=2000, prop=500, rev=0) -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "revisedSubcontractQty" = 0 WHERE id = $1`,
            [svoRebarApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "revisedSubcontractQty" = 2500 WHERE id = $1`,
            [svoRebarApproved]
          );
        },
        async () => {
          const res = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(res.status, 409);
          const body = await res.json();
          assert.equal(body.error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');
          await assertT11AdapterReason(
            'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS',
            'SUBCONTRACTOR_VO_REVISED_QUANTITY_CONFLICTS_WITH_PROPOSED_DELTA'
          );
        }
      );

      // 3F. Partial/zeroed AwardedBOQItem revisedContractQuantity=0 when approvedClientVoQuantity=20, revisedContractAmount=758400 -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "revisedContractQuantity" = 0 WHERE id = $1`,
            [boqConc]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "revisedContractQuantity" = 120 WHERE id = $1`,
            [boqConc]
          );
        },
        async () => {
          const res = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(res.status, 409);
          const body = await res.json();
          assert.equal(body.error, 'TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION');
          await assertT11AdapterReason(
            'TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION',
            'UNAUTHORIZED_AWARDED_BOQ_REVISED_QUANTITY_MODIFICATION'
          );
        }
      );

      // 3G. Misleading T11 approved_qty / vo_approved_qty_delta aliases & saved layouts blocked 409!
      for (const badAliases of [
        { approved_qty: 'Subcontract Revised Quantity' },
        { approved_qty: 'VO Item Post Quantity' },
        { approved_qty: 'Revised Quantity' },
        { vo_approved_qty_delta: 'Revised Contract Quantity' },
      ]) {
        const wAlias = await postWorking({
          projectId: p1,
          templateCode: 'T11_VARIATION_ORDER_REGISTER',
          sourceId: snap1,
          headingAliases: badAliases,
          format: 'json',
        });
        assert.equal(wAlias.status, 409);
        assert.equal((await wAlias.json()).error, 'TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS');
      }

      const badLayoutRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        templateName: 'Ambiguous Subcon Qty Alias Layout',
        sharingScope: 'PRIVATE',
        selectedFields: ['vo_number', 'item_code', 'approved_qty'],
        headingAliases: { approved_qty: 'Subcontract Revised Quantity' },
      });
      assert.equal(badLayoutRes.status, 409);
      assert.equal((await badLayoutRes.json()).error, 'LAYOUT_VO_REVISED_QUANTITY_AMBIGUOUS');

      // 3H. Positive Proof #1: Genuine 100% deductive Client VO scope cancellation to 0.0000 on boqMob
      //     (including unsigned UI deductive convention currentProposedQuantity=1, itemClassification='DEDUCTIVE_QTY', revisedQuantity=0!)
      const voCancelMob = prefix + '-TMP-VO-CNCL';
      const voiCancelMob = prefix + '-TMP-VOI-CNCL';
      const vodCancelMob = prefix + '-TMP-VOD-CNCL';
      const voaCancelMob = prefix + '-TMP-VOA-CNCL';
      const cancelVoNo = 'CVO-CANCEL-MOB-' + hexId.toUpperCase();
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "approvedForBilling", "createdAt", "updatedAt")
             VALUES ($1, $2, 'DEDUCTIVE', 'APPROVED', NULL, $3, 0.00, 50000.00, -50000.00, true, '2026-09-09T00:00:00.000Z', now())`,
            [voCancelMob, cancelVoNo, p1]
          );
          await admin.query(
            `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "currentProposedQuantity", "revisedQuantity", "approvedUnitCost", "additionalAmount", "deductiveAmount", "netAmount", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
             VALUES ($1, 'VOI-001', 'DEDUCTIVE_QTY', '100% Deductive Scope Cancellation of Mobilization', 'lot', 1, 1, 0, 50000.00, 0.00, 50000.00, -50000.00, 'APPROVED', $2, $3, now())`,
            [voiCancelMob, voCancelMob, boqMob]
          );
          await admin.query(
            `INSERT INTO "VariationOrderDocument"(id, "fileName", "fileType", "fileUrl", "documentCategory", "uploadedById", "variationOrderId", "updatedAt")
             VALUES ($1, 'Signed-100Pct-Deductive-VO.pdf', 'application/pdf', 'memory://cncl.pdf', 'APPROVED_VO_ORDER', $2, $3, now())`,
            [vodCancelMob, s.f.ids.a, voCancelMob]
          );
          await admin.query(
            `INSERT INTO "VariationOrderApproval"(id, stage, action, "actionById", remarks, "variationOrderId", "updatedAt")
             VALUES ($1, 'EXECUTIVE_APPROVAL', 'APPROVED', $2, '100% scope cancellation', $3, now())`,
            [voaCancelMob, s.f.ids.a, voCancelMob]
          );
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = -1, "revisedContractQuantity" = 0, "revisedContractAmount" = 0 WHERE id = $1`,
            [boqMob]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 0, "revisedContractQuantity" = 1, "revisedContractAmount" = 50000 WHERE id = $1`,
            [boqMob]
          );
          await admin.query(`DELETE FROM "VariationOrderApproval" WHERE id = $1`, [voaCancelMob]);
          await admin.query(`DELETE FROM "VariationOrderDocument" WHERE id = $1`, [vodCancelMob]);
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id = $1`, [voiCancelMob]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE id = $1`, [voCancelMob]);
        },
        async () => {
          const cnclRes = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(cnclRes.status, 200);
          const cnclBody = await cnclRes.json();
          assert.equal(cnclBody.rowCount, 4);
          // 126,400.00 - 50,000.00 = +76,400.00; revised contract = 792,000 + 76,400 = 868,400.00
          assert.equal(cnclBody.variationRegisterSummary.clientVoRevenueDeltaTotal, '76400.00');
          assert.equal(cnclBody.variationRegisterSummary.revisedContractValueTotal, '868400.00');

          const cnclProjRow = cnclBody.projection.projectedRows.find(
            (r: any) => r.visible.vo_number === cancelVoNo
          );
          assert.ok(cnclProjRow, 'Expected cancelled mobilization VO row in T11');
          assert.equal(cnclProjRow.visible.original_qty, '1.0000');
          assert.equal(cnclProjRow.visible.vo_approved_qty_delta, '-1.0000');
          assert.equal(cnclProjRow.visible.approved_qty, '0.0000');
          assert.equal(cnclProjRow.visible.vo_client_revenue_delta_amt, '-50000.00');
          assert.equal(cnclProjRow.__oserpMeta.vo_qty_scope_basis, 'CLIENT_CONTRACT_BOQ');
          assert.equal(cnclProjRow.__oserpMeta.vo_item_pre_qty, '1.0000');
          assert.equal(cnclProjRow.__oserpMeta.vo_item_post_qty, '0.0000');
        }
      );

      // 3I. Positive Proof #2: Sequential two-VO chain on boqConc (VO-1: 100 -> 120, VO-2: 120 -> 135)
      //     + Subcon VO rows on boqRebar, verifying explicit T11 scope-qualified column headings & per-item pre/post quantities!
      const voChain2 = prefix + '-TMP-VO-CHN2';
      const voiChain2 = prefix + '-TMP-VOI-CHN2';
      const vodChain2 = prefix + '-TMP-VOD-CHN2';
      const voaChain2 = prefix + '-TMP-VOA-CHN2';
      const chain2VoNo = 'CVO-D2R2-ZZZ-CHN2-' + hexId.toUpperCase();
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "approvedForBilling", "createdAt", "updatedAt")
             VALUES ($1, $2, 'ADDITIVE', 'APPROVED', NULL, $3, 94800.00, 0.00, 94800.00, true, '2026-09-10T00:00:00.000Z', now())`,
            [voChain2, chain2VoNo, p1]
          );
          await admin.query(
            `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "previouslyApprovedQuantity", "currentProposedQuantity", "revisedQuantity", "approvedUnitCost", "additionalAmount", "deductiveAmount", "netAmount", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
             VALUES ($1, 'VOI-001', 'ADDITIONAL_QTY', 'Sequential Client VO #2 +15m3 Concrete (120 -> 135)', 'm3', 100, 20, 15, 135, 6320.00, 94800.00, 0.00, 94800.00, 'APPROVED', $2, $3, now())`,
            [voiChain2, voChain2, boqConc]
          );
          await admin.query(
            `INSERT INTO "VariationOrderDocument"(id, "fileName", "fileType", "fileUrl", "documentCategory", "uploadedById", "variationOrderId", "updatedAt")
             VALUES ($1, 'Signed-Client-VO-02.pdf', 'application/pdf', 'memory://chn2.pdf', 'APPROVED_VO_ORDER', $2, $3, now())`,
            [vodChain2, s.f.ids.a, voChain2]
          );
          await admin.query(
            `INSERT INTO "VariationOrderApproval"(id, stage, action, "actionById", remarks, "variationOrderId", "updatedAt")
             VALUES ($1, 'EXECUTIVE_APPROVAL', 'APPROVED', $2, 'Second concrete VO ratified', $3, now())`,
            [voaChain2, s.f.ids.a, voChain2]
          );
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 35, "revisedContractQuantity" = 135, "revisedContractAmount" = 853200 WHERE id = $1`,
            [boqConc]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 20, "revisedContractQuantity" = 120, "revisedContractAmount" = 758400 WHERE id = $1`,
            [boqConc]
          );
          await admin.query(`DELETE FROM "VariationOrderApproval" WHERE id = $1`, [voaChain2]);
          await admin.query(`DELETE FROM "VariationOrderDocument" WHERE id = $1`, [vodChain2]);
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id = $1`, [voiChain2]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE id = $1`, [voChain2]);
        },
        async () => {
          const chnRes = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(chnRes.status, 200);
          const chnBody = await chnRes.json();
          const colHeadings = Object.fromEntries(
            chnBody.projection.visibleColumns.map((c: any) => [c.fieldId, c.heading])
          );
          assert.equal(colHeadings.original_qty, 'Baseline Awarded BOQ Qty (NO_SUM)');
          assert.equal(colHeadings.vo_approved_qty_delta, 'Approved VO Item Qty Delta (NO_SUM)');
          assert.equal(
            colHeadings.approved_qty,
            'Client Contract Revised BOQ Qty (Excl. Subcon VOs, NO_SUM)'
          );

          const rowVo1 = chnBody.projection.projectedRows.find(
            (r: any) => r.visible.vo_number === cvoApprovedNo
          );
          const rowVo2 = chnBody.projection.projectedRows.find(
            (r: any) => r.visible.vo_number === chain2VoNo
          );
          const rowSvo = chnBody.projection.projectedRows.find(
            (r: any) => r.visible.vo_number === svoApprovedNo
          );
          assert.ok(rowVo1 && rowVo2 && rowSvo);

          // VO-1: item step 100 -> 120 (+20); cumulative client contract BOQ qty = 135.0000
          assert.equal(rowVo1.visible.original_qty, '100.0000');
          assert.equal(rowVo1.visible.vo_approved_qty_delta, '20.0000');
          assert.equal(rowVo1.visible.approved_qty, '135.0000');
          assert.equal(rowVo1.__oserpMeta.vo_qty_scope_basis, 'CLIENT_CONTRACT_BOQ');
          assert.equal(rowVo1.__oserpMeta.vo_item_pre_qty, '100.0000');
          assert.equal(rowVo1.__oserpMeta.vo_item_post_qty, '120.0000');

          // VO-2: item step 120 -> 135 (+15); cumulative client contract BOQ qty = 135.0000
          assert.equal(rowVo2.visible.original_qty, '100.0000');
          assert.equal(rowVo2.visible.vo_approved_qty_delta, '15.0000');
          assert.equal(rowVo2.visible.approved_qty, '135.0000');
          assert.equal(rowVo2.__oserpMeta.vo_qty_scope_basis, 'CLIENT_CONTRACT_BOQ');
          assert.equal(rowVo2.__oserpMeta.vo_item_pre_qty, '120.0000');
          assert.equal(rowVo2.__oserpMeta.vo_item_post_qty, '135.0000');

          // Subcon VO: subcontract package step 2000 -> 2500 (+500); client BOQ qty stays 2000.0000!
          assert.equal(rowSvo.visible.original_qty, '2000.0000');
          assert.equal(rowSvo.visible.vo_approved_qty_delta, '500.0000');
          assert.equal(rowSvo.visible.approved_qty, '2000.0000');
          assert.equal(rowSvo.__oserpMeta.vo_qty_scope_basis, 'SUBCONTRACT_COMMITMENT_PACKAGE');
          assert.equal(rowSvo.__oserpMeta.vo_item_pre_qty, '2000.0000');
          assert.equal(rowSvo.__oserpMeta.vo_item_post_qty, '2500.0000');
        }
      );

      return {
        unpopulatedZeroRevisedQtyRejectedT11T6T8: 409,
        deltaStoredInRevisedQtyRejected: 409,
        baselineOriginalQtyMismatchRejected: 409,
        deductiveDirectionConflictRejected: 409,
        svoZeroRevisedQtyMismatchRejected: 409,
        partialAwardedBoqZeroRevisedQtyRejected: 409,
        misleadingT11AliasesAndLayoutsBlocked: 409,
        genuine100PctDeductiveCancellationToZeroAccepted: 200,
        sequentialTwoVoChainAndSubconScopeDisambiguated: 200,
      };
    }
  );

  // ==========================================================================
  // CHECK 4: WP3-BDD2-R2-04 — Regression: D2-IR-01 Maintenance-Role RLS Cleanup
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-04 (D2-IR-01 Regression): Permissive PUBLIC USING(true) policies remain absent, cryptographic _uboq_rls_trust_anchor synthetic-cleanup proof blocks unset/spoofed/non-synthetic cleanup under oserp_maint_cleanup_role, and single-project synthetic cleanup succeeds',
    async () => {
      const permissivePublic = (
        await admin.query(
          `SELECT tablename, policyname
             FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename IN ('ClientVariationOrder', 'AIVariationOrderValidation', 'SubcontractorVariationOrder', 'UboqTreasuryOpeningBalance')
              AND permissive = 'PERMISSIVE'
              AND 'public' = ANY(roles::text[])`
        )
      ).rows;
      assert.deepEqual(permissivePublic, []);

      const maint = await s.connect();
      const mTag = s.crypto.randomBytes(4).toString('hex');
      const synthA = `SYNTH-UBOQ-TEST-R2A-${mTag}`;
      const nonSynthC = `NONSYNTH-R2C-${mTag}`;
      const cvoA = `${synthA}-CVO1`;
      const cvoC = `${nonSynthC}-CVO1`;
      try {
        await adminReplica(async () => {
          await admin.query(
            `INSERT INTO "Project" (id, name, status, "isSyntheticTestFixture", "uboqGovernanceEnabled", "updatedAt")
             VALUES
               ($1, 'Synth Cleanup R2A', 'ACTIVE', true,  true, NOW()),
               ($2, 'Real NonSynth R2C', 'ACTIVE', false, true, NOW())`,
            [synthA, nonSynthC]
          );
          await admin.query(
            `INSERT INTO "ClientVariationOrder" (id, "cvoNumber", "projectId", status, description, "updatedAt")
             VALUES
               ($1, $2, $3, 'DRAFT', 'CVO A', NOW()),
               ($4, $5, $6, 'DRAFT', 'CVO C', NOW())`,
            [cvoA, `CVO-R2A-${mTag}`, synthA, cvoC, `CVO-R2C-${mTag}`, nonSynthC]
          );
        });

        await maint.query(`SET SESSION AUTHORIZATION 'g02_m01_3cf812825aac'`);
        const delUnset = await maint.query(
          `DELETE FROM "ClientVariationOrder" WHERE id = ANY($1::text[])`,
          [[cvoA, cvoC]]
        );
        assert.equal(delUnset.rowCount, 0);

        const manifestA = (
          await maint.query(`SELECT public.uboq_build_synthetic_cleanup_manifest($1) AS m`, [synthA])
        ).rows[0].m;
        assert.equal(manifestA.eligible, true);
        await maint.query(`SELECT public.uboq_execute_verified_synthetic_cleanup($1, $2)`, [
          synthA,
          manifestA.manifestSha256,
        ]);

        const countsAfter = (
          await admin.query(
            `SELECT
               (SELECT count(*)::int FROM "ClientVariationOrder" WHERE id = $1) AS a_cnt,
               (SELECT count(*)::int FROM "ClientVariationOrder" WHERE id = $2) AS c_cnt`,
            [cvoA, cvoC]
          )
        ).rows[0];
        assert.deepEqual(countsAfter, { a_cnt: 0, c_cnt: 1 });

        return {
          permissivePublicPolicies: 0,
          unsetDeleteRows: 0,
          authorizedCleanupPreservedNonSynthetic: true,
        };
      } finally {
        await maint.query('RESET SESSION AUTHORIZATION').catch(() => {});
        await maint.end();
        await adminReplica(async () => {
          await admin.query(`DELETE FROM "ClientVariationOrder" WHERE id = ANY($1::text[])`, [
            [cvoA, cvoC],
          ]);
          await admin.query(`DELETE FROM "Project" WHERE id = ANY($1::text[])`, [
            [synthA, nonSynthC],
          ]);
        });
      }
    }
  );

  // ==========================================================================
  // CHECK 5: WP3-BDD2-R2-05 — Regression: D2-IR-03 Subcontract Lineage & Multi-Line Package
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-05 (D2-IR-03 Regression): Subcontract VO package authority, package-to-BOQ consistency across executive & non-executive roles (409), cross-project RLS WITH CHECK (42501), and multi-line consolidated package allocation remain intact',
    async () => {
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractId" = NULL WHERE id = $1`,
            [svoRebarApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractId" = $1 WHERE id = $2`,
            [subPkgRebar, svoRebarApproved]
          );
        },
        async () => {
          for (const [uid, rName] of [
            [synthExecUser, 'FINANCE_DIRECTOR'],
            [synthPmUser, 'PROJECT_MANAGER'],
            [synthSiteEngUser, 'SITE_ENGINEER'],
            [synthViewerUser, 'PROJECT_MANAGER'],
          ] as Array<[string, string]>) {
            actor = { userId: uid, role: rName, sessionVersion: 7 };
            const res = await postWorking({
              projectId: p1,
              templateCode: 'T11_VARIATION_ORDER_REGISTER',
              sourceId: snap1,
              format: 'json',
            });
            assert.equal(res.status, 409);
            assert.equal((await res.json()).error, 'TEMPLATE_VO_LINEAGE_UNVERIFIED');
          }
          actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
        }
      );

      // Multi-line consolidated package lump-sum SVO (origQty=0, propQty=0, revQty=0, origAmt=50000, propAmt=4000, revAmt=54000) -> 409 when null, 200 when explicit boqRebar!
      const cboqMulti = prefix + '-TMP-CBOQ-MULTI';
      const cgrpMulti = prefix + '-TMP-CGRP-MULTI';
      const clnkMulti1 = prefix + '-TMP-CLNK-M1';
      const clnkMulti2 = prefix + '-TMP-CLNK-M2';
      const spkgMulti = prefix + '-TMP-SPKG-MULTI';
      const svoMulti = prefix + '-TMP-SVO-MULTI';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "ConsolidatedBOQItem"(id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId", "isUboqResourceGoverned", "updatedAt")
             VALUES ($1, 'CGRP-MULTI', 'UBOQ_CONSOLIDATED', 'Combined Structural Package', 'lot', 1, 50000, 50000, 'APPROVED', $2, false, now())`,
            [cboqMulti, p1]
          );
          await admin.query(
            `INSERT INTO "UboqConsolidationGroup"(id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription", specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily", "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt")
             VALUES ($1, $2, $3, 'CGRP-MULTI', 'Combined Structural Package', 'Combined', $4, 'lot', 'LUMP_SCOPE', 1.0000, 50000.0000, 50000.00, now())`,
            [cgrpMulti, p1, cboqMulti, mobSig]
          );
          await admin.query(
            `INSERT INTO "UboqConsolidationLink"(id, "consolidationGroupId", "phaseLineId", "allocatedQty", "allocationWeightPct")
             VALUES
               ($1, $3, $4, 50.0000,  0.500000),
               ($2, $3, $5, 500.0000, 0.500000)`,
            [clnkMulti1, clnkMulti2, cgrpMulti, plConcP1, plRebarP1]
          );
          await admin.query(
            `INSERT INTO "SubcontractPackage"(id, "packageNumber", "projectId", "subcontractorId", "consolidatedBoqItemId", "awardedBoqItemId", "workCategory", "contractType", "scopeOfWork", location, quantity, unit, "unitCost", "contractAmount", "costType", "paymentTerms", "targetCompletion", status, "updatedAt")
             VALUES ($1, $2, $3, $4, $5, NULL, 'STRUCTURAL', 'LABOR_ONLY', 'Multi-line structural subcon', 'BLDG-A', 1, 'lot', 50000, 50000, 'DIRECT', 'PROGRESS', '2026-10-20T00:00:00.000Z', 'APPROVED', now())`,
            [spkgMulti, 'SPKG-MULTI-' + hexId.toUpperCase(), p1, subconEntity, cboqMulti]
          );
          await admin.query(
            `INSERT INTO "SubcontractorVariationOrder"(id, "svoNumber", "projectId", "originalSubcontractId", "originalSubcontractAmt", "proposedAdditionalAmt", "revisedSubcontractAmt", reason, "approvalStatus", "approvedById", "awardedBoqItemId", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, 50000, 4000, 54000, 'Multi-line package SVO', 'APPROVED', $5, NULL, '2026-09-10T00:00:00.000Z', now())`,
            [svoMulti, 'SVO-MULTI-' + hexId.toUpperCase(), p1, spkgMulti, s.f.ids.a]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "SubcontractorVariationOrder" WHERE id = $1`, [svoMulti]);
          await admin.query(`DELETE FROM "SubcontractPackage" WHERE id = $1`, [spkgMulti]);
          await admin.query(`DELETE FROM "UboqConsolidationLink" WHERE id = ANY($1::text[])`, [
            [clnkMulti1, clnkMulti2],
          ]);
          await admin.query(`DELETE FROM "UboqConsolidationGroup" WHERE id = $1`, [cgrpMulti]);
          await admin.query(`DELETE FROM "ConsolidatedBOQItem" WHERE id = $1`, [cboqMulti]);
        },
        async () => {
          const rNull = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(rNull.status, 409);

          await adminReplica(async () => {
            await admin.query(
              `UPDATE "SubcontractorVariationOrder" SET "awardedBoqItemId" = $1 WHERE id = $2`,
              [boqRebar, svoMulti]
            );
          });
          const rValid = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(rValid.status, 200);
          assert.equal((await rValid.json()).variationRegisterSummary.subconCommitmentVoDeltaTotal, '17000.00');
        }
      );

      return {
        allRolesRejectMissingPackageAuthority: 409,
        multiLineLumpSumSvoReconciled: 200,
      };
    }
  );

  // ==========================================================================
  // CHECK 6: WP3-BDD2-R2-06 — Consolidated T12 Treasury, Formal T11 OpenXML, D1 Round-Trip & T0–T10
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-06: Consolidated T12 zero-basis & verified opening cash semantics, T11 formal OpenXML inspection (scope-qualified headings, SUM strictly on delta columns, __OSERP_META veryHidden), T12 nonformal block, SensitiveExportLog anti-forgery, Phase D1 signed T1 round-trip, and T0–T10 non-regression',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 6A. T12 zero-basis default & XLSX sample
      const zbRes = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(zbRes.status, 200);
      const zbBody = await zbRes.json();
      assert.equal(zbBody.treasuryVarianceSummary.actualTreasuryLiquidityVerified, false);
      assert.equal(
        zbBody.treasuryVarianceSummary.endingCumulativeNetCashMovementZeroBasis,
        '88840.00'
      );

      const zbXlsxRes = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(zbXlsxRes.status, 200);
      const zbXlsxBuf = Buffer.from(await zbXlsxRes.arrayBuffer());
      s.fs.writeFileSync(`${OUT}/t12-zero-basis-sample.xlsx`, zbXlsxBuf);
      assert.equal(
        ((readZipEntriesFromBuffer(zbXlsxBuf)['xl/worksheets/sheet1.xml'] || '').match(
          /<f[\s>]/g
        ) || []).length,
        0
      );

      // 6B. T12 verified positive opening balance (+150,000.00) & XLSX sample + non-executive redaction
      const tobId = prefix + '-TOB-P1';
      await withTempAdminMutation(
        async () => {
          await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
            await restrictedClient.query(
              `INSERT INTO "UboqTreasuryOpeningBalance"(id, "projectId", "snapshotId", "openingEffectiveDate", "openingCashAmt", "bankStatementEvidenceRef", "verificationStatus", "preparedById", "verifiedById", "verifiedAt", "updatedAt")
               VALUES ($1, $2, $3, '2026-09-01T00:00:00.000Z', 150000.00, 'BPI-STMT-2026-09-01', 'VERIFIED', $4, $4, '2026-09-01T08:00:00.000Z', now())`,
              [tobId, p1, snap1, synthExecUser]
            );
          });
        },
        async () => {
          await admin.query(`DELETE FROM "UboqTreasuryOpeningBalance" WHERE id = $1`, [tobId]);
        },
        async () => {
          const posRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(posRes.status, 200);
          const posBody = await posRes.json();
          assert.equal(posBody.treasuryVarianceSummary.endingActualTreasuryClosingCash, '238840.00');

          const posXlsxRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'xlsx',
          });
          assert.equal(posXlsxRes.status, 200);
          s.fs.writeFileSync(
            `${OUT}/t12-verified-opening-sample.xlsx`,
            Buffer.from(await posXlsxRes.arrayBuffer())
          );

          actor = { userId: synthPmUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
          const pmRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(pmRes.status, 200);
          const pmJson = JSON.stringify(await pmRes.json());
          assert.equal(pmJson.includes('BPI-STMT-2026-09-01'), false);
          assert.equal(pmJson.includes('238840.00'), false);
          actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
        },
        false
      );

      // 6C. T11 Formal OpenXML sample (verifying disambiguated headings in sharedStrings/sheet1 + exact 2 SUM formulas + __OSERP_META veryHidden)
      const wList = await (await getWorking(p1)).json();
      assert.equal(wList.templates.length, 13);
      const fList = await (await getFormal(p1)).json();
      assert.equal(fList.contracts.length, 6);

      const createExecLayoutRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        templateName: 'Executive Full VO & Commitment Register R2',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'vo_number',
          'vo_classification',
          'phase_code',
          'item_code',
          'work_description',
          'unit',
          'original_qty',
          'vo_approved_qty_delta',
          'approved_qty',
          'contract_unit_rate',
          'vo_client_revenue_delta_amt',
          'vo_subcon_commitment_delta_amt',
          'current_contract_value',
        ],
      });
      assert.equal(createExecLayoutRes.status, 201);
      const execLayoutRevId = (await createExecLayoutRes.json()).revision.id;

      const execFormalXlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        layoutRevisionId: execLayoutRevId,
        format: 'xlsx',
      });
      assert.equal(execFormalXlsxRes.status, 200);
      const t11FormalBuf = Buffer.from(await execFormalXlsxRes.arrayBuffer());
      s.fs.writeFileSync(`${OUT}/t11-formal-sample.xlsx`, t11FormalBuf);
      const t11Xml = readZipEntriesFromBuffer(t11FormalBuf);
      assert.match(t11Xml['xl/workbook.xml'] || '', /name="__OSERP_META"[^>]*state="veryHidden"/);
      const t11Sheet1 = t11Xml['xl/worksheets/sheet1.xml'] || '';
      const t11Shared = t11Xml['xl/sharedStrings.xml'] || '';
      const formulaTags = t11Sheet1.match(/<f>SUM\([A-Z]+2:[A-Z]+4\)<\/f>/g) || [];
      assert.equal(formulaTags.length, 2);
      assert.ok(
        (t11Sheet1 + t11Shared).includes(
          'Client Contract Revised BOQ Qty (Excl. Subcon VOs, NO_SUM)'
        )
      );

      // 6D. T12 formal export block (400) & Phase D1 signed T1 round-trip + T0–T10 smoke
      const t12FormalReject = await postFormal({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t12FormalReject.status, 400);

      const rtWs = await (await getRoundTrip(p1)).json();
      assert.deepEqual(rtWs.reservedPendingContracts, []);
      assert.equal(rtWs.ratifiedPhaseD2Templates.length, 2);

      const rtIssueT1 = await postRoundTripJson({
        action: 'issue',
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        format: 'xlsx',
        layoutMode: 'FORMAL_CONTRACT',
      });
      assert.equal(rtIssueT1.status, 200);
      const wbT1Rt = new ExcelJS.Workbook();
      await wbT1Rt.xlsx.load(Buffer.from(await rtIssueT1.arrayBuffer()));
      const wsT1Rt = wbT1Rt.getWorksheet('T1_PHASE_BOQ');
      assert.ok(wsT1Rt);
      wsT1Rt.getRow(2).getCell(5).value = '3500 psi @ 28d (Phase D2 R2 RT Non-Regression)';
      const t1EditedBuf = Buffer.from(await wbT1Rt.xlsx.writeBuffer());
      const fd = new FormData();
      fd.append('action', 'verify_import');
      fd.append('projectId', p1);
      fd.append('templateCode', 'T1_PHASE_BOQ');
      fd.append('idempotencyKey', `d2-r2-rt-${hexId}`);
      fd.append('conflictResolutionMode', 'STAGE_GOVERNED_CHANGE_PROPOSAL');
      fd.append(
        'file',
        new File([new Uint8Array(t1EditedBuf)], 'T1_edited.xlsx', {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        })
      );
      const rtVerifyRes = await postRoundTripMultipart(fd);
      assert.equal(rtVerifyRes.status, 200);
      const rtVerified = await rtVerifyRes.json();
      assert.equal(rtVerified.verificationStatus, 'STAGED_PENDING_APPROVAL');
      assert.equal(rtVerified.canonicalRecordsMutated, 0);

      const smokeSources: Array<[string, string]> = [
        ['T0_MASTER_CONTRACT', cGov],
        ['T1_PHASE_BOQ', snap1],
        ['T2_CONSOLIDATED_BOQ', snap1],
        ['T3_AGENCY_ESTIMATE', snap1],
        ['T4_RESOURCE_TAKEOFF', snap1],
        ['T5_ACCOMPLISHMENT_CERT', accApproved],
        ['T6_PROGRESS_BILLING', bilGovApproved],
        ['T7_SCHEDULE_EVM', schedBaseline],
        ['T8_CASHFLOW_HALF_MONTH', snap1],
        ['T9_CASHFLOW_QUARTERLY', snap1],
        ['T10_EXECUTIVE_MARGIN', snap1],
      ];
      for (const [tc, sid] of smokeSources) {
        const sRes = await postWorking({
          projectId: p1,
          templateCode: tc,
          sourceId: sid,
          format: 'json',
        });
        assert.equal(sRes.status, 200, `Smoke check failed for ${tc}`);
        assert.ok((await sRes.json()).rowCount >= 1);
      }

      assert.deepEqual(await canonicalSourceDigest(), sourceDigestBefore);
      return {
        t12ZeroBasisEndingMovement: '88840.00',
        t12VerifiedOpeningEndingCash: '238840.00',
        t11FormalSumFormulaCount: formulaTags.length,
        t11FormalScopeQualifiedHeadingEmbedded: true,
        roundTripVerificationStatus: rtVerified.verificationStatus,
        t0ToT10SmokeCount: smokeSources.length,
        canonicalSourcesUnmutated: true,
      };
    }
  );

  // ==========================================================================
  // CHECK 7: WP3-BDD2-R2-07 — Preserved esbuild + Express Headless Chromium E2E
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-07: Preserved esbuild + Express headless Chromium E2E harness (zero server-module client leakage, scope-qualified T11 headings & T12 zero-basis rendering at 1440x900 desktop & 390x844 mobile)',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const esbuild = require('esbuild');
      const express = require('express');
      const { chromium } = require('playwright');

      const bundled = await esbuild.build({
        stdin: {
          contents: `
            import React from 'react';
            import { createRoot } from 'react-dom/client';
            import TemplateBuilder from './src/app/projects/[id]/uboq/templates/TemplateBuilder';
            createRoot(document.getElementById('root')!).render(<TemplateBuilder projectId=${JSON.stringify(p1)} />);
          `,
          resolveDir: process.cwd(),
          loader: 'tsx',
        },
        bundle: true,
        platform: 'browser',
        write: false,
        format: 'iife',
        jsx: 'automatic',
        metafile: true,
        define: { 'process.env.NODE_ENV': '"production"' },
      });

      const serverInputs = Object.keys(bundled.metafile.inputs).filter((x: string) =>
        /template-builder\.ts|canonical-source-adapters\.ts|templates\/t0-t1\.ts|templates\/saved-layouts\.ts|templates\/formal-t0-t1\.ts|templates\/round-trip-import\.ts|exceljs|prisma/.test(
          x
        )
      );
      assert.deepEqual(serverInputs, [], 'Server-only modules entered browser bundle');

      const app = express();
      app.use(express.raw({ type: '*/*', limit: '10mb' }));
      app.get('/', (_req: any, res: any) =>
        res.send(
          '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui;margin:0;padding:16px}*{box-sizing:border-box}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}button,input,select{font:inherit}</style></head><body><h1>Universal BOQ templates (Express Harness — T0–T12)</h1><div id="root"></div><script src="/bundle.js"></script></body></html>'
        )
      );
      app.get('/bundle.js', (_req: any, res: any) =>
        res.type('js').send(bundled.outputFiles[0].text)
      );

      const mountRoute = (urlPath: string, handlerMod: any) => {
        app.all(urlPath, async (req: any, res: any) => {
          try {
            const headers: Record<string, string> = {};
            if (req.headers['content-type']) {
              headers['content-type'] = String(req.headers['content-type']);
            }
            const nextReq = new NextRequest('http://localhost' + req.originalUrl, {
              method: req.method,
              headers,
              ...(req.method === 'POST' && Buffer.isBuffer(req.body) && req.body.length > 0
                ? { body: new Uint8Array(req.body) }
                : {}),
            });
            const out = await (req.method === 'POST'
              ? handlerMod.POST(nextReq)
              : handlerMod.GET(nextReq));
            res.status(out.status);
            out.headers.forEach((v: string, k: string) => res.setHeader(k, v));
            res.send(Buffer.from(await out.arrayBuffer()));
          } catch (err: any) {
            res.status(500).send(err.message);
          }
        });
      };
      mountRoute('/api/uboq/templates', workingRoute);
      mountRoute('/api/uboq/templates/layouts', layoutsRoute);
      mountRoute('/api/uboq/templates/formal-export', formalRoute);
      mountRoute('/api/uboq/templates/round-trip', roundTripRoute);

      const server = await new Promise<any>((resolve) => {
        const srv = app.listen(0, '127.0.0.1', () => resolve(srv));
      });
      let browser: any;
      try {
        browser = await chromium.launch({ headless: true });
        const page = await browser.newPage({
          viewport: { width: 1440, height: 900 },
          acceptDownloads: true,
        });
        const consoleErrors: string[] = [];
        page.on('pageerror', (e: Error) => consoleErrors.push(e.message));
        page.on('console', (msg: any) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.getByLabel('Approved source', { exact: true }).waitFor();

        await page.getByLabel('Template', { exact: true }).selectOption('T11_VARIATION_ORDER_REGISTER');
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page
          .getByText('Client Contract Revised BOQ Qty (Excl. Subcon VOs, NO_SUM)', { exact: true })
          .waitFor();
        await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
        await page
          .getByLabel('Formal export preview')
          .getByText('ERP_CANONICAL_T11_FORMAL_V1', { exact: true })
          .waitFor();
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
        );

        await page.getByLabel('Template', { exact: true }).selectOption('T12_CASHFLOW_VARIANCE_TREASURY');
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page
          .getByText(/Ending cumulative net cash movement \(zero basis, NO_SUM\): 88840\.00/)
          .waitFor();
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
        );
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
        );
        assert.deepEqual(consoleErrors, []);

        return {
          harness: 'esbuild + Express + Chromium headless',
          clientBundleExcludesServerModules: true,
          t11ScopeQualifiedHeadingRendered: true,
          consoleErrors,
        };
      } finally {
        if (browser) await browser.close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  );

  // ==========================================================================
  // CHECK 8: WP3-BDD2-R2-08 — Bounded Native Next.js 16 Server Stack E2E
  // ==========================================================================
  await check(
    'WP3-BDD2-R2-08: Bounded native Next.js 16 server stack E2E (src/proxy.ts unauthenticated 401/307 & mustChangePassword 403/307, NextAuth Credentials JWE login, RSC page.tsx rendering, scope-qualified T11 headings & formal XLSX download, T12 nonformal 400 block, and live 403 rejection for VIEWER & foreign-project actors)',
    async () => {
      const nextPort = await getEphemeralPort();
      const baseUrl = `http://127.0.0.1:${nextPort}`;
      const authSecret = s.crypto.randomBytes(32).toString('hex');

      const nextLogs: string[] = [];
      const nextProc = spawn(
        process.execPath,
        ['node_modules/next/dist/bin/next', 'dev', '--webpack', '-H', '127.0.0.1', '-p', String(nextPort)],
        {
          cwd: process.cwd(),
          env: {
            ...process.env,
            NODE_ENV: 'development',
            NEXT_TELEMETRY_DISABLED: '1',
            DATABASE_URL: process.env.DATABASE_URL,
            DIRECT_URL: process.env.DIRECT_URL,
            UBOQ_RLS_CONTEXT_SECRET: s.f.signing,
            AUTH_SECRET: authSecret,
            NEXTAUTH_SECRET: authSecret,
            AUTH_URL: baseUrl,
            NEXTAUTH_URL: baseUrl,
            AUTH_TRUST_HOST: 'true',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        }
      );
      nextProc.stdout.on('data', (chunk: Buffer) => nextLogs.push(chunk.toString('utf8')));
      nextProc.stderr.on('data', (chunk: Buffer) => nextLogs.push(chunk.toString('utf8')));

      let browser: any;
      try {
        const deadline = Date.now() + 120000;
        let ready = false;
        while (Date.now() < deadline) {
          if (nextProc.exitCode !== null) {
            throw new Error(
              `next dev exited prematurely (${nextProc.exitCode}):\n${nextLogs.slice(-30).join('')}`
            );
          }
          try {
            const probe = await fetch(`${baseUrl}/login`, { redirect: 'manual' });
            if (probe.status === 200) {
              ready = true;
              break;
            }
          } catch {
            // Still starting up
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
        assert.ok(
          ready,
          `Timed out waiting for native Next.js 16 server at ${baseUrl}:\n${nextLogs.slice(-30).join('')}`
        );

        const unauthApi = await fetch(
          `${baseUrl}/api/uboq/templates?projectId=${encodeURIComponent(p1)}`,
          { redirect: 'manual' }
        );
        assert.equal(unauthApi.status, 401);

        const unauthPage = await fetch(
          `${baseUrl}/projects/${encodeURIComponent(p1)}/uboq/templates`,
          { redirect: 'manual' }
        );
        assert.ok([307, 308, 302].includes(unauthPage.status));
        assert.match(String(unauthPage.headers.get('location') || ''), /\/login$/);

        const { chromium } = require('playwright');
        browser = await chromium.launch({ headless: true });

        const loginNextAuthContext = async (ctx: any, userId: string) => {
          const email = `${userId.toLowerCase()}@synthetic.local`;
          const csrfRes = await ctx.request.get(`${baseUrl}/api/auth/csrf`);
          assert.equal(csrfRes.status(), 200);
          const { csrfToken } = await csrfRes.json();
          assert.ok(csrfToken, 'Missing NextAuth csrfToken');

          const cbRes = await ctx.request.post(`${baseUrl}/api/auth/callback/credentials`, {
            form: {
              csrfToken,
              email,
              password: synthPlainPw,
              callbackUrl: `${baseUrl}/projects/${encodeURIComponent(p1)}/uboq/templates`,
            },
            maxRedirects: 0,
          });
          assert.ok([200, 302, 303].includes(cbRes.status()));

          const sessRes = await ctx.request.get(`${baseUrl}/api/auth/session`);
          assert.equal(sessRes.status(), 200);
          const sessJson = await sessRes.json();
          assert.equal(sessJson?.user?.id, userId);
          return sessJson;
        };

        const mustChangeCtx = await browser.newContext();
        try {
          const mcSess = await loginNextAuthContext(mustChangeCtx, synthMustChangePwUser);
          assert.equal(mcSess.user.mustChangePassword, true);

          const mcApi = await mustChangeCtx.request.get(
            `${baseUrl}/api/uboq/templates?projectId=${encodeURIComponent(p1)}`
          );
          assert.equal(mcApi.status(), 403);
          assert.equal((await mcApi.json()).error, 'PASSWORD_CHANGE_REQUIRED');
        } finally {
          await mustChangeCtx.close();
        }

        const execCtx = await browser.newContext({
          viewport: { width: 1440, height: 900 },
          acceptDownloads: true,
        });
        try {
          const page = await execCtx.newPage();
          const consoleErrors: string[] = [];
          page.on('pageerror', (e: Error) => consoleErrors.push(e.message));
          page.on('console', (msg: any) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
          });

          await page.goto(`${baseUrl}/projects/${encodeURIComponent(p1)}/uboq/templates`);
          await page.waitForURL(/\/login$/);
          await page.getByText('JEJORS CONSTRUCTION').waitFor();

          await loginNextAuthContext(execCtx, synthExecUser);

          const navRes = await page.goto(
            `${baseUrl}/projects/${encodeURIComponent(p1)}/uboq/templates`
          );
          assert.ok(navRes);
          assert.equal(navRes.status(), 200);
          const respHeaders = navRes.headers();
          assert.equal(respHeaders['x-frame-options'], 'SAMEORIGIN');
          assert.equal(respHeaders['x-content-type-options'], 'nosniff');

          await page
            .getByRole('heading', { name: 'Universal BOQ templates (T0–T12)', exact: true })
            .waitFor();
          await page.getByLabel('Approved source', { exact: true }).waitFor();

          await page
            .getByLabel('Template', { exact: true })
            .selectOption('T11_VARIATION_ORDER_REGISTER');
          await page.getByRole('button', { name: 'Preview', exact: true }).click();
          await page.getByText(/Approved Client VOs: 1 \| Approved Subcon VOs: 2/).waitFor();
          await page
            .getByText('Client Contract Revised BOQ Qty (Excl. Subcon VOs, NO_SUM)', {
              exact: true,
            })
            .waitFor();

          await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
          await page
            .getByLabel('Formal export preview')
            .getByText('ERP_CANONICAL_T11_FORMAL_V1', { exact: true })
            .waitFor();

          const pngNextT11Desktop = `${OUT}/browser-d2-r2-nextjs-t11-desktop.png`;
          await page.screenshot({ path: pngNextT11Desktop, fullPage: true });

          const [dlNextT11Formal] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Download formal XLSX', exact: true }).click(),
          ]);
          const nextT11FormalPath = `${OUT}/browser-d2-r2-nextjs-t11-formal.xlsx`;
          await dlNextT11Formal.saveAs(nextT11FormalPath);
          const nextT11Xml = readZipEntriesFromBuffer(s.fs.readFileSync(nextT11FormalPath));
          assert.match(
            nextT11Xml['xl/workbook.xml'] || '',
            /name="__OSERP_META"[^>]*state="veryHidden"/
          );
          assert.ok(
            ((nextT11Xml['xl/worksheets/sheet1.xml'] || '').match(/<f>SUM\(/g) || []).length >= 1
          );

          await page.setViewportSize({ width: 390, height: 844 });
          const pngNextMobile = `${OUT}/browser-d2-r2-nextjs-mobile.png`;
          await page.screenshot({ path: pngNextMobile, fullPage: false });
          await page.setViewportSize({ width: 1440, height: 900 });

          await page
            .getByLabel('Template', { exact: true })
            .selectOption('T12_CASHFLOW_VARIANCE_TREASURY');
          await page.getByRole('button', { name: 'Preview', exact: true }).click();
          await page
            .getByText(/Ending cumulative net cash movement \(zero basis, NO_SUM\): 88840\.00/)
            .waitFor();

          const pngNextT12Desktop = `${OUT}/browser-d2-r2-nextjs-t12-desktop.png`;
          await page.screenshot({ path: pngNextT12Desktop, fullPage: true });

          const liveT12FormalReject = await execCtx.request.post(
            `${baseUrl}/api/uboq/templates/formal-export`,
            {
              data: {
                projectId: p1,
                templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
                sourceId: snap1,
                format: 'json',
              },
            }
          );
          assert.equal(liveT12FormalReject.status(), 400);

          for (const fName of [
            'browser-d2-r2-nextjs-t11-desktop.png',
            'browser-d2-r2-nextjs-t12-desktop.png',
            'browser-d2-r2-nextjs-mobile.png',
          ]) {
            s.fs.copyFileSync(`${OUT}/${fName}`, `${BRAIN_DIR}/${fName}`);
          }

          assert.deepEqual(consoleErrors, []);
        } finally {
          await execCtx.close();
        }

        const viewerCtx = await browser.newContext();
        try {
          await loginNextAuthContext(viewerCtx, synthViewerUser);
          const vFormal = await viewerCtx.request.post(
            `${baseUrl}/api/uboq/templates/formal-export`,
            {
              data: {
                projectId: p1,
                templateCode: 'T11_VARIATION_ORDER_REGISTER',
                sourceId: snap1,
                format: 'json',
              },
            }
          );
          assert.equal(vFormal.status(), 403);
        } finally {
          await viewerCtx.close();
        }

        const foreignCtx = await browser.newContext();
        try {
          await loginNextAuthContext(foreignCtx, synthForeignUser);
          const fWorking = await foreignCtx.request.get(
            `${baseUrl}/api/uboq/templates?projectId=${encodeURIComponent(p1)}`
          );
          assert.equal(fWorking.status(), 403);
        } finally {
          await foreignCtx.close();
        }

        return {
          serverStack: 'Native Next.js 16 (next dev --webpack) + src/proxy.ts + NextAuth v5 JWE',
          boundHost: `127.0.0.1:${nextPort}`,
          unauthenticatedApiStatus: 401,
          mustChangePasswordApiStatus: 403,
          t11ScopeQualifiedHeadingVerifiedLive: true,
          t11FormalXlsxDownloadedAndVerified: true,
          t12NonFormalRejectedStatus: 400,
          viewerAndForeignRejectedStatus: 403,
        };
      } finally {
        if (browser) await browser.close();
        if (nextProc && nextProc.pid) {
          try {
            if (process.platform === 'win32') {
              execFileSync('taskkill', ['/PID', String(nextProc.pid), '/T', '/F'], {
                stdio: 'ignore',
              });
            } else {
              nextProc.kill('SIGKILL');
            }
          } catch {
            // Process already exited
          }
        }
      }
    }
  );

  report.status = 'PASS';
})()
  .catch((e: any) => {
    report.status = 'FAIL';
    report.error = { message: e.message, code: e.code, stack: e.stack };
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (originalLoad) require('node:module')._load = originalLoad;
    if (restrictedClient) await restrictedClient.end();
    if (admin) {
      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          const allProjects = [p1, pCorp, pForeign];
          const allUsers = [
            synthExecUser,
            synthNarrowedExecUser,
            synthPmUser,
            synthSiteEngUser,
            synthViewerUser,
            synthForeignUser,
            synthMustChangePwUser,
          ];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "userId" = ANY($1::text[]) OR ("moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS', 'UBOQ_ROUNDTRIP_IMPORT') AND ("newValue" LIKE $2 OR "newValue" LIKE $3 OR "newValue" LIKE $4))`,
            [allUsers, `%${p1}%`, `%${pCorp}%`, `%${pForeign}%`]
          );
          await admin.query(
            `DELETE FROM "UboqTreasuryOpeningBalance" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqRoundTripImportSubmission" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqSignedRoundTripPackage" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqTemplateDefinition" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqValidationException" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqCashFlowPeriod" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "ProjectCostLedger" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "CommitmentLedger" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "Payroll" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "PayrollPeriod" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "Worker" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "Expense" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "AccountsPayable" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Delivery" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "PurchaseOrderItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "PurchaseOrder" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "MaterialRequestItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "MaterialRequest" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "Supplier" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "AIVariationOrderValidation" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(
            `DELETE FROM "ClientVariationOrder" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "VariationOrderApproval" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(`DELETE FROM "VariationOrderDocument" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "PaymentRecord" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(
            `DELETE FROM "SubcontractBilling" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "SubcontractAccomplishment" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(`DELETE FROM "JobOrder" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(
            `DELETE FROM "SubcontractorVariationOrder" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "SubcontractPackage" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "Subcontractor" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(
            `DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "ScheduleProgressUpdate" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(`DELETE FROM "UboqScheduleActivityLink" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(`DELETE FROM "ScheduleDependency" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "ScheduleActivity" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "ScheduleWBS" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "ProjectSchedule" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "Payment" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "BillingDeduction" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "BillingItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Billing" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "Inspection" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "AccomplishmentItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Accomplishment" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(
            `DELETE FROM "UboqProcurementResourceRequirement" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqCanonicalResourceAccount" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqAgencyEstimateBaseline" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "UboqConsolidationLink" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(
            `DELETE FROM "UboqConsolidationGroup" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "ConsolidatedBOQItem" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AwardedBOQItem" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqSourceDocument" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqContractAuthority" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqTaxPricingProfile" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "ProjectUserAssignment" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "Project" WHERE id = ANY($1::text[])`, [allProjects]);
          await admin.query(`DELETE FROM "User" WHERE id = ANY($1::text[])`, [allUsers]);
        });
        const afterTables = await tableHashes();
        assert.deepEqual(afterTables, beforeTables);
        report.all_public_table_rows_preserved = true;
        report.public_table_count = Object.keys(afterTables).length;
        report.database_before_sha256 = s.hash(JSON.stringify(beforeTables));
        report.database_after_sha256 = s.hash(JSON.stringify(afterTables));
        report.synthetic_fixture_cleanup = 'EXACT_PREFIX_OWNED_ROWS_REMOVED';
      } catch (e: any) {
        report.status = 'FAIL';
        report.cleanup_error = e.message;
        console.error(e);
        process.exitCode = 1;
      }
      save();
      await admin.end();
    }
    if (prisma) await prisma.$disconnect();
  });
