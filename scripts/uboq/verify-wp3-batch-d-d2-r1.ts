/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const bcrypt = require('bcryptjs');
const { spawn, execFileSync } = require('node:child_process');
const net = require('node:net');
const zlib = require('node:zlib');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-d-d2-r1';
const REPORT_PATH = OUT + '/runtime-tests.json';
const BRAIN_DIR = 'C:/Users/user/.gemini/antigravity/brain/b35617c7-9740-4aa7-a239-0ffdca5619a7';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch D Phase D2 R1 Independent Review Remediation consolidated verification: D2-IR-01 (Migration #35 forward-only RLS & maintenance-role synthetic-cleanup cryptographic proof), D2-IR-02 (approved T11 header-vs-items arithmetic reconciliation including zero header & balanced zero-net amendments), D2-IR-03 (approved subcontract package & consolidated BOQ/snapshot lineage across all actor roles + cross-project write/read fail-closed guards), D2-IR-04 (T12 verified opening treasury balance vs zero-basis cumulative net project cash movement & anti-misrepresentation guards), D2-IR-05 (bounded native Next.js 16 server stack E2E with src/proxy.ts middleware, NextAuth Credentials login, RSC page rendering, T11 formal XLSX download, T12 nonformal 400 block, and unauthorized 403 rejections), preserved esbuild+Express Chromium E2E, preserved D2/D1/T0–T10 non-regression, and 252-table zero-residue rollback.',
};

let admin: any;
let restrictedClient: any;
let prisma: any;
let workingRoute: any;
let layoutsRoute: any;
let formalRoute: any;
let roundTripRoute: any;
let NextRequest: any;
let actor: any;
let originalLoad: any;
let beforeTables: any;

const hexId = s.crypto.randomBytes(5).toString('hex');
const prefix = 'SYNTH-WP3-D2R1-' + hexId;
const synthPlainPw = 'SynthD2R1#' + hexId + '!Aa9';
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
const cvoApprovedNo = 'CVO-D2R1-APP-' + hexId.toUpperCase();
const cvoDraftNo = 'CVO-D2R1-DRF-' + hexId.toUpperCase();
const svoVoApprovedNo = 'SVO-VO-D2R1-APP-' + hexId.toUpperCase();
const svoApprovedNo = 'SVO-D2R1-RBR-APP-' + hexId.toUpperCase();
const svoPendingNo = 'SVO-D2R1-RBR-PND-' + hexId.toUpperCase();
const cvoPendingNo = 'CVO-D2R1-MIR-PND-' + hexId.toUpperCase();
const cvoForeignNo = 'CVO-D2R1-FOR-' + hexId.toUpperCase();

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
const payBatchNo = 'PAYBATCH-D2R1-' + hexId.toUpperCase();

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
         ($1, $4, $7,  'GOVERNMENT', 'DPWH Synthetic District', 'CA-D2R1-GOV-01',  'NOA-D2R1-01', 'NTP-D2R1-01', 'CPO-D2R1-01', $9,   'UNIT_PRICE', 'VAT_INCLUSIVE', 792000.00, 707142.86, 918400.00, 180, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($2, $5, $8,  'PRIVATE',    'Ayala Synthetic Corp',    'CA-D2R1-CORP-01', NULL,          NULL,          NULL,          NULL, 'UNIT_PRICE', 'VAT_EXCLUSIVE', 200000.00, 200000.00, 200000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($3, $6, NULL,'PRIVATE',    'Foreign Tenant Corp',     'CA-D2R1-FOR-01',  NULL,          NULL,          NULL,          NULL, 'UNIT_PRICE', 'VAT_EXCLUSIVE', 50000.00,  50000.00,  50000.00,  60,  '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now())`,
      [cGov, cCorp, cForeign, p1, pCorp, pForeign, taxGov, taxCorp, cvoApprovedNo, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'batch-d-d2-r1-source.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8192, $3, '504b0304', 'memory://batch-d-d2-r1', 'CONTRACT_BOQ', $4, true)`,
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
         ($1, 'CGRP-D2R1-1', 'UBOQ_CONSOLIDATED', 'Structural Concrete Class A', 'm3', 100,  4800, 480000, 'APPROVED', $3, true, now()),
         ($2, 'CGRP-D2R1-2', 'UBOQ_CONSOLIDATED', 'Deformed Reinforcing Steel',  'kg', 2000, 44,   88000,  'APPROVED', $3, true, now())`,
      [cboqConc, cboqRebar, p1]
    );
    await admin.query(
      `INSERT INTO "UboqConsolidationGroup"(id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription", specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily", "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt")
       VALUES
         ($1, $3, $4, 'CGRP-D2R1-1', 'Structural Concrete Class A', '3500 psi @ 28d',     $6, 'm3', 'VOLUME', 100.0000,  6320.0000, 632000.00, now()),
         ($2, $3, $5, 'CGRP-D2R1-2', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $7, 'kg', 'MASS',   2000.0000, 55.0000,   110000.00, now())`,
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
       VALUES ($1, $2, $3, 'MAT-CEM-D2R1', 'Portland Cement Type 1', '40kg Bag ASTM C150', $4, 'MATERIAL', 'SUPPLIER_PO', 'bag_40kg', 'PACK', $5, 900.0000, 100.0000, 0.0000, 500.0000, 0.0000, 0.0000, 0.0000, 100.0000, 300.0000, false, 0.0000, 230.0000, 1, now())`,
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

    // SubcontractPackage (40k base + 10k SVO = 50k revised commitment on boqRebar)
    await admin.query(
      `INSERT INTO "Subcontractor"(id, name, "businessType", accreditation, "contactPerson", "contactNumber", "updatedAt")
       VALUES ($1, 'Synthetic Rebar Subcon Corp', 'CORPORATION', 'APPROVED', 'Engr. Cruz', '09170000000', now())`,
      [subconEntity]
    );
    const spkgRebarNo = 'SPKG-D2R1-' + hexId.toUpperCase();
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
        'JO-D2R1-' + hexId.toUpperCase(),
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

    const sbNumRebar = 'SBIL-D2R1-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "SubcontractBilling"(id, "billingNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", "contractAmount", "previousGross", "currentGross", "totalGross", "remainingBalance", "netPayable", "accountingStatus", "approvalStatus", "paymentStatus", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 50000, 0, 25000, 25000, 25000, 22500, 'REVIEWED', 'APPROVED', 'PENDING', 'APPROVED_FOR_PAYMENT', '2026-09-18T00:00:00.000Z', now())`,
      [sbRebar1, sbNumRebar, p1, subconEntity, subPkgRebar, joRebarChild]
    );

    await admin.query(
      `INSERT INTO "PaymentRecord"(id, "billingId", "amountPaid", "paymentDate", method, "referenceNumber", "updatedAt")
       VALUES ($1, $2, 15000.00, '2026-09-20T00:00:00.000Z', 'BANK_TRANSFER', 'SUBPAY-D2R1-001', now())`,
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
        'PB-D2R1-GOV1-' + hexId.toUpperCase(),
        'PB-D2R1-GOV2-' + hexId.toUpperCase(),
        'PB-D2R1-CORP-' + hexId.toUpperCase(),
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
         ($1, 385000, 385000, 264687.50, 200000.00, '2026-09-20T00:00:00.000Z', 'OR-D2R1-GOV-001',  'PAID',    $4, now()),
         ($2, 385000, 385000, 264687.50, 48062.50,  '2026-09-25T00:00:00.000Z', 'CHK-D2R1-PND-001', 'PENDING', $4, now()),
         ($3, 100000, 100000, 90000.00,  80000.00,  '2026-09-22T00:00:00.000Z', 'OR-D2R1-CORP-001', 'PAID',    $5, now())`,
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
      [mr1, 'MR-D2R1-' + hexId.toUpperCase(), p1, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "MaterialRequestItem"(id, quantity, "approvedQuantity", "mrId", "consolidatedBoqItemId", "canonicalResourceId", "uboqResourceRequirementId")
       VALUES ($1, 500, 500, $2, $3, $4, $5)`,
      [mriCement, mr1, cboqConc, acctCement, prrCement]
    );

    const poCementNo = 'PO-D2R1-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "PurchaseOrder"(id, "poNumber", status, "supplierId", "mrId", "totalAmount", "netAmount", "vatAmount", "dueDate", "approverId", "approvedAt", "createdAt", "updatedAt")
       VALUES
         ($1, $3, 'APPROVED', $5, $6, 112000.00, 100000.00, 12000.00, '2026-10-10T00:00:00.000Z', $7, '2026-09-05T00:00:00.000Z', '2026-09-05T00:00:00.000Z', now()),
         ($2, $4, 'DRAFT',    $5, $6, 560000.00, 500000.00, 60000.00, '2026-10-20T00:00:00.000Z', NULL, NULL,                      '2026-09-06T00:00:00.000Z', now())`,
      [
        poCement,
        poDraftIgnored,
        poCementNo,
        'PO-D2R1-DRF-' + hexId.toUpperCase(),
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
         ($1, 'DR-D2R1-1', '2026-09-10T00:00:00.000Z', 'RECEIVED', $3, now()),
         ($2, 'DR-D2R1-2', '2026-09-20T00:00:00.000Z', 'RECEIVED', $3, now())`,
      [deliv1, deliv2, poCement]
    );

    const apPaidVoucher = 'APV-D2R1-PAID-' + hexId.toUpperCase();
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
        'APV-D2R1-UNP-' + hexId.toUpperCase(),
      ]
    );

    const expPaidRef = 'OR-EXP-D2R1-' + hexId.toUpperCase();
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
         ($5, $7, '2026-09-14T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     'CORP-AP-D2R1', 56000.00, 6000.00, 50000.00, 56000.00, 0.00, 'PAID', 'APPROVED', NULL, $15, NULL, now())`,
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
  const getLayouts = (qs: string) =>
    layoutsRoute.GET(new NextRequest(`http://localhost/api/uboq/templates/layouts?${qs}`));
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
  // CHECK 1: WP3-BDD2-R1-01 — D2-IR-01 Maintenance-Role RLS & Unspoofable Cleanup
  // ==========================================================================
  await check(
    'WP3-BDD2-R1-01 (D2-IR-01): Forward-only Migrations #35 & #36 remove permissive PUBLIC USING(true) policies, enforce cryptographic _uboq_rls_trust_anchor synthetic-cleanup proof, block unauthorized/caller-spoofed/cross-project SELECT & DELETE under oserp_maint_cleanup_role, and preserve legitimate synthetic cleanup',
    async () => {
      // 1A. Inspect pg_policies and role_table_grants on target tables
      const permissivePublic = (
        await admin.query(
          `SELECT tablename, policyname, roles::text[] AS roles, qual
           FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename IN ('ClientVariationOrder', 'AIVariationOrderValidation', 'SubcontractorVariationOrder', 'UboqTreasuryOpeningBalance')
             AND permissive = 'PERMISSIVE'
             AND 'public' = ANY(roles::text[])`
        )
      ).rows;
      assert.deepEqual(
        permissivePublic,
        [],
        `Expected zero permissive PUBLIC policies, found: ${JSON.stringify(permissivePublic)}`
      );

      const maintGrants = (
        await admin.query(
          `SELECT table_name::text AS table_name, array_agg(privilege_type::text ORDER BY privilege_type::text) AS privs
           FROM information_schema.role_table_grants
           WHERE table_schema = 'public'
             AND grantee = 'oserp_maint_cleanup_role'
             AND table_name IN ('ClientVariationOrder', 'AIVariationOrderValidation', 'SubcontractorVariationOrder', 'UboqTreasuryOpeningBalance', '_uboq_rls_trust_anchor')
           GROUP BY table_name
           ORDER BY table_name`
        )
      ).rows;
      const grantMap = Object.fromEntries(maintGrants.map((r: any) => [r.table_name, r.privs]));
      assert.equal(grantMap._uboq_rls_trust_anchor, undefined, 'Maint role must have zero grants on _uboq_rls_trust_anchor');
      for (const tName of [
        'AIVariationOrderValidation',
        'ClientVariationOrder',
        'SubcontractorVariationOrder',
        'UboqTreasuryOpeningBalance',
      ]) {
        assert.deepEqual(grantMap[tName], ['DELETE', 'SELECT']);
      }

      // 1B. Live SQL tests under genuine login role g02_m01_3cf812825aac (member of oserp_maint_cleanup_role)
      const maint = await s.connect();
      const mTag = s.crypto.randomBytes(4).toString('hex');
      const synthA = `SYNTH-UBOQ-TEST-R1A-${mTag}`;
      const synthB = `SYNTH-UBOQ-TEST-R1B-${mTag}`;
      const nonSynthC = `NONSYNTH-R1C-${mTag}`;
      const voA = `${synthA}-VO1`;
      const voB = `${synthB}-VO1`;
      const voC = `${nonSynthC}-VO1`;
      const aivA = `${synthA}-AIV1`;
      const aivB = `${synthB}-AIV1`;
      const aivC = `${nonSynthC}-AIV1`;
      const cvoA = `${synthA}-CVO1`;
      const cvoB = `${synthB}-CVO1`;
      const cvoC = `${nonSynthC}-CVO1`;
      const svoA = `${synthA}-SVO1`;
      const svoB = `${synthB}-SVO1`;
      const svoC = `${nonSynthC}-SVO1`;
      const tobA = `${synthA}-TOB1`;
      const tobB = `${synthB}-TOB1`;
      const tobC = `${nonSynthC}-TOB1`;
      const caA = `${synthA}-CA1`;
      const caB = `${synthB}-CA1`;
      const caC = `${nonSynthC}-CA1`;
      const snA = `${synthA}-SN1`;
      const snB = `${synthB}-SN1`;
      const snC = `${nonSynthC}-SN1`;

      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "Project" (id, name, status, "isSyntheticTestFixture", "uboqGovernanceEnabled", "updatedAt")
             VALUES
               ($1, 'Synth Cleanup A', 'ACTIVE', true,  true, NOW()),
               ($2, 'Synth Cleanup B', 'ACTIVE', true,  true, NOW()),
               ($3, 'Real NonSynth C', 'ACTIVE', false, true, NOW())`,
            [synthA, synthB, nonSynthC]
          );
          await admin.query(
            `INSERT INTO "UboqContractAuthority" (id, "projectId", "sectorType", "clientName", "contractRef", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
             VALUES
               ($1, $4, 'PRIVATE', 'Client A', 'CA-A', 'UNIT_PRICE', 'VAT_EXCLUSIVE', 10000, 10000, 10000, 30, '2026-09-01T00:00:00.000Z', 'APPROVED', $7, '2026-08-01T00:00:00.000Z', NOW()),
               ($2, $5, 'PRIVATE', 'Client B', 'CA-B', 'UNIT_PRICE', 'VAT_EXCLUSIVE', 10000, 10000, 10000, 30, '2026-09-01T00:00:00.000Z', 'APPROVED', $7, '2026-08-01T00:00:00.000Z', NOW()),
               ($3, $6, 'PRIVATE', 'Client C', 'CA-C', 'UNIT_PRICE', 'VAT_EXCLUSIVE', 10000, 10000, 10000, 30, '2026-09-01T00:00:00.000Z', 'APPROVED', $7, '2026-08-01T00:00:00.000Z', NOW())`,
            [caA, caB, caC, synthA, synthB, nonSynthC, synthExecUser]
          );
          await admin.query(
            `INSERT INTO "UboqOperationalSnapshot" (id, "projectId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
             VALUES
               ($1, $4, $7, 1, 'v1', 'APPROVED', repeat('1', 64), $10, $10, '2026-08-02T00:00:00.000Z'),
               ($2, $5, $8, 1, 'v1', 'APPROVED', repeat('2', 64), $10, $10, '2026-08-02T00:00:00.000Z'),
               ($3, $6, $9, 1, 'v1', 'APPROVED', repeat('3', 64), $10, $10, '2026-08-02T00:00:00.000Z')`,
            [snA, snB, snC, synthA, synthB, nonSynthC, caA, caB, caC, synthExecUser]
          );
          await admin.query(
            `INSERT INTO "VariationOrder" (id, "voNumber", "variationType", "currentStatus", "projectId", "updatedAt")
             VALUES
               ($1, $2, 'ADDITIVE', 'DRAFT', $3, NOW()),
               ($4, $5, 'ADDITIVE', 'DRAFT', $6, NOW()),
               ($7, $8, 'ADDITIVE', 'DRAFT', $9, NOW())`,
            [voA, `VO-A-${mTag}`, synthA, voB, `VO-B-${mTag}`, synthB, voC, `VO-C-${mTag}`, nonSynthC]
          );
          await admin.query(
            `INSERT INTO "AIVariationOrderValidation" (id, "validationType", result, "confidenceLevel", "riskLevel", "variationOrderId", "updatedAt")
             VALUES
               ($1, 'ARITH', 'PASS', 'HIGH', 'LOW', $2, NOW()),
               ($3, 'ARITH', 'PASS', 'HIGH', 'LOW', $4, NOW()),
               ($5, 'ARITH', 'PASS', 'HIGH', 'LOW', $6, NOW())`,
            [aivA, voA, aivB, voB, aivC, voC]
          );
          await admin.query(
            `INSERT INTO "ClientVariationOrder" (id, "cvoNumber", "projectId", status, description, "updatedAt")
             VALUES
               ($1, $2, $3, 'DRAFT', 'CVO A', NOW()),
               ($4, $5, $6, 'DRAFT', 'CVO B', NOW()),
               ($7, $8, $9, 'DRAFT', 'CVO C', NOW())`,
            [cvoA, `CVO-A-${mTag}`, synthA, cvoB, `CVO-B-${mTag}`, synthB, cvoC, `CVO-C-${mTag}`, nonSynthC]
          );
          await admin.query(
            `INSERT INTO "SubcontractorVariationOrder" (id, "svoNumber", "projectId", "originalSubcontractAmt", "proposedAdditionalAmt", "revisedSubcontractAmt", reason, "approvalStatus", "updatedAt")
             VALUES
               ($1, $2, $3, 1000, 100, 1100, 'SVO A', 'PENDING', NOW()),
               ($4, $5, $6, 1000, 100, 1100, 'SVO B', 'PENDING', NOW()),
               ($7, $8, $9, 1000, 100, 1100, 'SVO C', 'PENDING', NOW())`,
            [svoA, `SVO-A-${mTag}`, synthA, svoB, `SVO-B-${mTag}`, synthB, svoC, `SVO-C-${mTag}`, nonSynthC]
          );
          await admin.query(
            `INSERT INTO "UboqTreasuryOpeningBalance" (id, "projectId", "snapshotId", "openingEffectiveDate", "openingCashAmt", "bankStatementEvidenceRef", "verificationStatus", "preparedById", "updatedAt")
             VALUES
               ($1, $2, $3,  '2026-09-01T00:00:00.000Z', 10000.00, 'STMT-A', 'DRAFT', $10, NOW()),
               ($4, $5, $6,  '2026-09-01T00:00:00.000Z', 10000.00, 'STMT-B', 'DRAFT', $10, NOW()),
               ($7, $8, $9,  '2026-09-01T00:00:00.000Z', 10000.00, 'STMT-C', 'DRAFT', $10, NOW())`,
            [tobA, synthA, snA, tobB, synthB, snB, tobC, nonSynthC, snC, synthExecUser]
          );
        });

        await maint.query(`SET SESSION AUTHORIZATION 'g02_m01_3cf812825aac'`);
        const who = (
          await maint.query(
            `SELECT session_user, current_user,
                    (SELECT rolsuper FROM pg_roles WHERE rolname = session_user) AS is_super,
                    (SELECT rolbypassrls FROM pg_roles WHERE rolname = session_user) AS bypass_rls,
                    pg_has_role(session_user, 'oserp_maint_cleanup_role', 'MEMBER') AS is_maint`
          )
        ).rows[0];
        assert.equal(who.is_super, false);
        assert.equal(who.bypass_rls, false);
        assert.equal(who.is_maint, true);

        // Case 1: Cleanup authorization UNSET/OFF -> 0 visible, 0 deleted across all 4 tables & all 3 projects
        for (const [tbl, ids] of [
          ['ClientVariationOrder', [cvoA, cvoB, cvoC]],
          ['AIVariationOrderValidation', [aivA, aivB, aivC]],
          ['SubcontractorVariationOrder', [svoA, svoB, svoC]],
          ['UboqTreasuryOpeningBalance', [tobA, tobB, tobC]],
        ] as Array<[string, string[]]>) {
          const selOff = await maint.query(`SELECT id FROM "${tbl}" WHERE id = ANY($1::text[])`, [ids]);
          const delOff = await maint.query(`DELETE FROM "${tbl}" WHERE id = ANY($1::text[])`, [ids]);
          assert.equal(selOff.rowCount, 0, `${tbl} SELECT must be 0 when cleanup auth unset`);
          assert.equal(delOff.rowCount, 0, `${tbl} DELETE must be 0 when cleanup auth unset`);
        }

        // Case 2: Caller-SPOOFED session GUCs (app.synthetic_cleanup_authorized='on' + forged proof) -> 0 visible, 0 deleted, direct helper EXECUTE denied 42501
        let directHelperErr = '';
        await s.transaction(maint, async () => {
          await maint.query(
            `SELECT set_config('app.synthetic_cleanup_authorized', 'on', true),
                    set_config('app.synthetic_cleanup_project_id', $1, true),
                    set_config('app.synthetic_cleanup_proof', $2, true)`,
            [synthA, 'f'.repeat(64)]
          );
          for (const [tbl, ids] of [
            ['ClientVariationOrder', [cvoA, cvoB, cvoC]],
            ['AIVariationOrderValidation', [aivA, aivB, aivC]],
            ['SubcontractorVariationOrder', [svoA, svoB, svoC]],
            ['UboqTreasuryOpeningBalance', [tobA, tobB, tobC]],
          ] as Array<[string, string[]]>) {
            const selSpoof = await maint.query(`SELECT id FROM "${tbl}" WHERE id = ANY($1::text[])`, [ids]);
            const delSpoof = await maint.query(`DELETE FROM "${tbl}" WHERE id = ANY($1::text[])`, [ids]);
            assert.equal(selSpoof.rowCount, 0, `${tbl} SELECT must be 0 under spoofed GUC`);
            assert.equal(delSpoof.rowCount, 0, `${tbl} DELETE must be 0 under spoofed GUC`);
          }

          await maint.query('SAVEPOINT sp_direct_auth_tx');
          try {
            await maint.query(
              `SELECT public.uboq_authorize_verified_synthetic_cleanup_tx($1, repeat('a', 64))`,
              [synthA]
            );
          } catch (e: any) {
            directHelperErr = e.code;
            await maint.query('ROLLBACK TO SAVEPOINT sp_direct_auth_tx');
          }
        });
        assert.equal(directHelperErr, '42501');

        // Case 3: Non-synthetic project C rejected by uboq_execute_verified_synthetic_cleanup (P0001)
        const manifestC = (
          await maint.query(`SELECT public.uboq_build_synthetic_cleanup_manifest($1) AS m`, [nonSynthC])
        ).rows[0].m;
        assert.equal(manifestC.eligible, false);
        let nonSynthExecErr = '';
        await maint.query('BEGIN');
        try {
          await maint.query(`SELECT public.uboq_execute_verified_synthetic_cleanup($1, $2)`, [
            nonSynthC,
            manifestC.manifestSha256,
          ]);
        } catch (e: any) {
          nonSynthExecErr = e.code;
        } finally {
          await maint.query('ROLLBACK');
        }
        assert.equal(nonSynthExecErr, 'P0001');

        // Case 4: Legitimate verified synthetic cleanup on synthA removes synthA ONLY; synthB & nonSynthC remain 100% intact
        const manifestA = (
          await maint.query(`SELECT public.uboq_build_synthetic_cleanup_manifest($1) AS m`, [synthA])
        ).rows[0].m;
        assert.equal(manifestA.eligible, true);
        const execA = (
          await maint.query(`SELECT public.uboq_execute_verified_synthetic_cleanup($1, $2) AS res`, [
            synthA,
            manifestA.manifestSha256,
          ])
        ).rows[0].res;
        assert.equal(execA.cleanedProjectId, synthA);

        const postA = (
          await admin.query(
            `SELECT
               (SELECT count(*)::int FROM "ClientVariationOrder" WHERE id = $1) AS a_cvo,
               (SELECT count(*)::int FROM "AIVariationOrderValidation" WHERE id = $2) AS a_aiv,
               (SELECT count(*)::int FROM "SubcontractorVariationOrder" WHERE id = $3) AS a_svo,
               (SELECT count(*)::int FROM "UboqTreasuryOpeningBalance" WHERE id = $4) AS a_tob,
               (SELECT count(*)::int FROM "ClientVariationOrder" WHERE id = ANY($5::text[])) AS bc_cvo,
               (SELECT count(*)::int FROM "AIVariationOrderValidation" WHERE id = ANY($6::text[])) AS bc_aiv,
               (SELECT count(*)::int FROM "SubcontractorVariationOrder" WHERE id = ANY($7::text[])) AS bc_svo,
               (SELECT count(*)::int FROM "UboqTreasuryOpeningBalance" WHERE id = ANY($8::text[])) AS bc_tob`,
            [cvoA, aivA, svoA, tobA, [cvoB, cvoC], [aivB, aivC], [svoB, svoC], [tobB, tobC]]
          )
        ).rows[0];
        assert.deepEqual(postA, {
          a_cvo: 0,
          a_aiv: 0,
          a_svo: 0,
          a_tob: 0,
          bc_cvo: 2,
          bc_aiv: 2,
          bc_svo: 2,
          bc_tob: 2,
        });

        // Clean synthB via legitimate maintenance procedure too
        const manifestB = (
          await maint.query(`SELECT public.uboq_build_synthetic_cleanup_manifest($1) AS m`, [synthB])
        ).rows[0].m;
        assert.equal(manifestB.eligible, true);
        await maint.query(`SELECT public.uboq_execute_verified_synthetic_cleanup($1, $2)`, [
          synthB,
          manifestB.manifestSha256,
        ]);

        return {
          permissivePublicPoliciesRemaining: 0,
          maintLoginRole: who.session_user,
          unsetAuthBlocked: true,
          callerSpoofedGucBlocked: true,
          directHelperExecuteBlocked: directHelperErr,
          nonSyntheticCleanupBlocked: nonSynthExecErr,
          authorizedSingleProjectCleanupVerified: true,
        };
      } finally {
        await maint.query('RESET SESSION AUTHORIZATION').catch(() => {});
        await maint.end();
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(`DELETE FROM "UboqTreasuryOpeningBalance" WHERE id = ANY($1::text[])`, [
            [tobA, tobB, tobC],
          ]);
          await admin.query(`DELETE FROM "SubcontractorVariationOrder" WHERE id = ANY($1::text[])`, [
            [svoA, svoB, svoC],
          ]);
          await admin.query(`DELETE FROM "AIVariationOrderValidation" WHERE id = ANY($1::text[])`, [
            [aivA, aivB, aivC],
          ]);
          await admin.query(`DELETE FROM "ClientVariationOrder" WHERE id = ANY($1::text[])`, [
            [cvoA, cvoB, cvoC],
          ]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE id = ANY($1::text[])`, [
            [voA, voB, voC],
          ]);
          await admin.query(`DELETE FROM "UboqOperationalSnapshot" WHERE id = ANY($1::text[])`, [
            [snA, snB, snC],
          ]);
          await admin.query(`DELETE FROM "UboqContractAuthority" WHERE id = ANY($1::text[])`, [
            [caA, caB, caC],
          ]);
          await admin.query(`DELETE FROM "Project" WHERE id = ANY($1::text[])`, [
            [synthA, synthB, nonSynthC],
          ]);
        });
      }
    }
  );

  // ==========================================================================
  // CHECK 2: WP3-BDD2-R1-02 — D2-IR-02 Approved VO Arithmetic (Including Zero Header)
  // ==========================================================================
  await check(
    'WP3-BDD2-R1-02 (D2-IR-02): Approved T11 VariationOrder header-vs-items arithmetic reconciliation unconditionally enforces zero-header mismatches (409), nonzero-header vs zero-items mismatches (409), header add/deduct inconsistency (409), and permits genuine balanced zero-net amendments (200)',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 2A. Header netVariationAmount = 0.00 (additionalAmount=0, deductiveAmount=0) while approved item = +126,400.00 -> 409!
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
          const wZeroHdr = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(wZeroHdr.status, 409);
          const wErr = await wZeroHdr.json();
          assert.equal(wErr.error, 'TEMPLATE_VO_ARITHMETIC_MISMATCH');

          const fZeroHdr = await postFormal({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(fZeroHdr.status, 409);
          assert.equal((await fZeroHdr.json()).error, 'FORMAL_VO_ARITHMETIC_MISMATCH');
        }
      );

      // 2B. Header netVariationAmount = 50,000.00 while approved items sum to 0.00 -> 409!
      const voNonZeroHdrZeroItems = prefix + '-TMP-VO-NZH-ZI';
      const voiPlus = prefix + '-TMP-VOI-PLUS';
      const voiMinus = prefix + '-TMP-VOI-MINUS';
      const vodTmp = prefix + '-TMP-VOD-NZH';
      const voaTmp = prefix + '-TMP-VOA-NZH';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "approvedForBilling", "createdAt", "updatedAt")
             VALUES ($1, $2, 'COMBINED', 'APPROVED', NULL, $3, 50000.00, 0.00, 50000.00, true, '2026-09-06T00:00:00.000Z', now())`,
            [voNonZeroHdrZeroItems, 'CVO-NZH-ZI-' + hexId.toUpperCase(), p1]
          );
          await admin.query(
            `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "currentProposedQuantity", "revisedQuantity", "approvedUnitCost", "additionalAmount", "deductiveAmount", "netAmount", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
             VALUES
               ($1, 'VOI-A', 'ADDITIONAL_QTY', '+500kg Rebar', 'kg',  2000, 500,   2500, 55.00,    27500.00, 0.00,     27500.00,  'APPROVED', $3, $4, now()),
               ($2, 'VOI-B', 'DEDUCTIVE_QTY',  '-0.55lot Mob', 'lot', 1,    -0.55, 0.45, 50000.00, 0.00,     27500.00, -27500.00, 'APPROVED', $3, $5, now())`,
            [voiPlus, voiMinus, voNonZeroHdrZeroItems, boqRebar, boqMob]
          );
          await admin.query(
            `INSERT INTO "VariationOrderDocument"(id, "fileName", "fileType", "fileUrl", "documentCategory", "uploadedById", "variationOrderId", "updatedAt")
             VALUES ($1, 'Signed-NZH.pdf', 'application/pdf', 'memory://nzh.pdf', 'APPROVED_VO_ORDER', $2, $3, now())`,
            [vodTmp, s.f.ids.a, voNonZeroHdrZeroItems]
          );
          await admin.query(
            `INSERT INTO "VariationOrderApproval"(id, stage, action, "actionById", remarks, "variationOrderId", "updatedAt")
             VALUES ($1, 'EXECUTIVE_APPROVAL', 'APPROVED', $2, 'Test', $3, now())`,
            [voaTmp, s.f.ids.a, voNonZeroHdrZeroItems]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "VariationOrderApproval" WHERE id = $1`, [voaTmp]);
          await admin.query(`DELETE FROM "VariationOrderDocument" WHERE id = $1`, [vodTmp]);
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id = ANY($1::text[])`, [
            [voiPlus, voiMinus],
          ]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE id = $1`, [voNonZeroHdrZeroItems]);
        },
        async () => {
          const rNzh = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(rNzh.status, 409);
          assert.equal((await rNzh.json()).error, 'TEMPLATE_VO_ARITHMETIC_MISMATCH');
        }
      );

      // 2C. Header additionalAmount - deductiveAmount != netVariationAmount -> 409!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrder" SET "additionalAmount" = 150000.00, "deductiveAmount" = 10000.00, "netVariationAmount" = 126400.00 WHERE id = $1`,
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
          const rHdrComp = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(rHdrComp.status, 409);
          assert.equal((await rHdrComp.json()).error, 'TEMPLATE_VO_ARITHMETIC_MISMATCH');
        }
      );

      // 2D. Genuine balanced zero-net APPROVED Client VO (+27,500.00 rebar & -27,500.00 mob; header additional=27500, deductive=27500, net=0.00) -> 200!
      const voBalZero = prefix + '-TMP-VO-BAL0';
      const voiBalPlus = prefix + '-TMP-VOI-BALP';
      const voiBalMinus = prefix + '-TMP-VOI-BALM';
      const vodBal = prefix + '-TMP-VOD-BAL0';
      const voaBal = prefix + '-TMP-VOA-BAL0';
      const balVoNo = 'CVO-BAL-ZERO-' + hexId.toUpperCase();
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "approvedForBilling", "createdAt", "updatedAt")
             VALUES ($1, $2, 'COMBINED', 'APPROVED', NULL, $3, 27500.00, 27500.00, 0.00, true, '2026-09-07T00:00:00.000Z', now())`,
            [voBalZero, balVoNo, p1]
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
          const wBal = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(wBal.status, 200);
          const wBalBody = await wBal.json();
          assert.equal(wBalBody.rowCount, 5);
          assert.equal(wBalBody.variationRegisterSummary.approvedClientVoCount, 2);
          assert.equal(wBalBody.variationRegisterSummary.clientVoRevenueDeltaTotal, '126400.00');
          assert.equal(wBalBody.variationRegisterSummary.revisedContractValueTotal, '918400.00');

          const fBal = await postFormal({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(fBal.status, 200);
          const fBalBody = await fBal.json();
          assert.equal(fBalBody.rowCount, 5);
          assert.equal(fBalBody.clientVoRevenueDeltaTotal, '126400.00');
        }
      );

      return {
        zeroHeaderMismatchRejected: 409,
        nonZeroHeaderZeroItemsRejected: 409,
        headerAddDeductMismatchRejected: 409,
        validBalancedZeroNetAmendmentAccepted: 200,
      };
    }
  );

  // ==========================================================================
  // CHECK 3: WP3-BDD2-R1-03 — D2-IR-03 Subcontract Package & Lineage Binding
  // ==========================================================================
  await check(
    'WP3-BDD2-R1-03 (D2-IR-03): Subcontract VO requires verified APPROVED SubcontractPackage authority (free-text reason never substitutes), enforces package-to-AwardedBOQItem/consolidated allocation across executive AND non-executive roles, and blocks cross-project associations at both SQL WITH CHECK (42501) and adapter read time (409)',
    async () => {
      const testAllRolesReject409 = async (expectedError: string) => {
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
          assert.equal(
            res.status,
            409,
            `Expected 409 for actor ${uid} (${rName}), got ${res.status}`
          );
          assert.equal((await res.json()).error, expectedError);
        }
        actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      };

      // 3A. Missing originalSubcontractId despite non-empty reason + valid snapshot BOQ item -> 409 across ALL roles!
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
          await testAllRolesReject409('TEMPLATE_VO_LINEAGE_UNVERIFIED');
          const fRes = await postFormal({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(fRes.status, 409);
          assert.equal((await fRes.json()).error, 'FORMAL_VO_LINEAGE_UNVERIFIED');
        }
      );

      // 3B. Unapproved (DRAFT) SubcontractPackage referenced by APPROVED SVO -> 409 across ALL roles!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "SubcontractPackage" SET status = 'DRAFT' WHERE id = $1`,
            [subPkgRebar]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "SubcontractPackage" SET status = 'APPROVED' WHERE id = $1`,
            [subPkgRebar]
          );
        },
        async () => {
          await testAllRolesReject409('TEMPLATE_VO_LINEAGE_UNVERIFIED');
        }
      );

      // 3C. Package-to-BOQ mismatch on SubcontractorVariationOrder (subPkgRebar -> boqRebar, but svo -> boqConc) -> 409 across ALL roles!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "awardedBoqItemId" = $1 WHERE id = $2`,
            [boqConc, svoRebarApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "awardedBoqItemId" = $1 WHERE id = $2`,
            [boqRebar, svoRebarApproved]
          );
        },
        async () => {
          await testAllRolesReject409('TEMPLATE_VO_LINEAGE_UNVERIFIED');
        }
      );

      // 3D. Package-to-BOQ mismatch on VariationOrder subcontract item (subPkgRebar -> boqRebar, but voiSubconApproved -> boqConc) -> 409 across ALL roles!
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "originalBoqItemId" = $1 WHERE id = $2`,
            [boqConc, voiSubconApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "originalBoqItemId" = $1 WHERE id = $2`,
            [boqRebar, voiSubconApproved]
          );
        },
        async () => {
          await testAllRolesReject409('TEMPLATE_VO_LINEAGE_UNVERIFIED');
        }
      );

      // 3E. Cross-project associations:
      //     (1) Direct SQL INSERT/UPDATE as oserp_compat_app rejected by RLS WITH CHECK (42501) on BOTH SubcontractorVariationOrder AND VariationOrder!
      await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
        await restrictedClient.query('SAVEPOINT sp_svo_xproj_pkg');
        let svoXprojErr = '';
        try {
          await restrictedClient.query(
            `INSERT INTO "SubcontractorVariationOrder"(id, "svoNumber", "projectId", "originalSubcontractId", "originalSubcontractAmt", "proposedAdditionalAmt", "revisedSubcontractAmt", reason, "approvalStatus", "awardedBoqItemId", "updatedAt")
             VALUES ($1, $2, $3, $4, 10000, 1000, 11000, 'Cross-project pkg attempt', 'APPROVED', $5, now())`,
            [prefix + '-BAD-SVO-XP', 'BAD-SVO-XP-' + hexId, p1, subPkgForeign, boqRebar]
          );
        } catch (e: any) {
          svoXprojErr = e.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_svo_xproj_pkg');
        }
        assert.equal(svoXprojErr, '42501');

        await restrictedClient.query('SAVEPOINT sp_vo_xproj_pkg');
        let voXprojErr = '';
        try {
          await restrictedClient.query(
            `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "additionalAmount", "deductiveAmount", "netVariationAmount", "updatedAt")
             VALUES ($1, $2, 'ADDITIVE', 'APPROVED', $3, $4, 1000.00, 0.00, 1000.00, now())`,
            [prefix + '-BAD-VO-XP', 'BAD-VO-XP-' + hexId, subPkgForeign, p1]
          );
        } catch (e: any) {
          voXprojErr = e.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_vo_xproj_pkg');
        }
        assert.equal(voXprojErr, '42501');
      });

      //     (2) Pre-existing/admin-seeded cross-project SVO package association fails closed with 409 TEMPLATE_VO_LINEAGE_UNVERIFIED across all roles (not silently hidden by SELECT RLS!)
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractId" = $1 WHERE id = $2`,
            [subPkgForeign, svoRebarApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "SubcontractorVariationOrder" SET "originalSubcontractId" = $1 WHERE id = $2`,
            [subPkgRebar, svoRebarApproved]
          );
        },
        async () => {
          await testAllRolesReject409('TEMPLATE_VO_LINEAGE_UNVERIFIED');
        }
      );

      // 3F. Multi-line consolidated SubcontractPackage:
      //     - Omitted awardedBoqItemId on SVO -> 409 (ambiguous multi-line consolidated package)
      //     - Disjoint awardedBoqItemId (boqMob outside cboqMulti) -> 409
      //     - Explicit authorized awardedBoqItemId (boqRebar inside cboqMulti) -> 200!
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
          // Ambiguous null awardedBoqItemId -> 409
          const rNull = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(rNull.status, 409);
          assert.equal((await rNull.json()).error, 'TEMPLATE_VO_LINEAGE_UNVERIFIED');

          // Disjoint boqMob (not in cboqMulti) -> 409
          await adminReplica(async () => {
            await admin.query(
              `UPDATE "SubcontractorVariationOrder" SET "awardedBoqItemId" = $1 WHERE id = $2`,
              [boqMob, svoMulti]
            );
          });
          const rDisjoint = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(rDisjoint.status, 409);
          assert.equal((await rDisjoint.json()).error, 'TEMPLATE_VO_LINEAGE_UNVERIFIED');

          // Explicit authorized boqRebar (linked to cboqMulti) -> 200!
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
          const validBody = await rValid.json();
          assert.equal(validBody.rowCount, 4);
          assert.equal(validBody.variationRegisterSummary.subconCommitmentVoDeltaTotal, '17000.00');
        }
      );

      return {
        missingPackageAuthorityRejectedAllRoles: 409,
        unapprovedPackageRejectedAllRoles: 409,
        packageBoqMismatchRejectedAllRoles: 409,
        crossProjectWriteBlockedSql: '42501',
        crossProjectSeededAnomalyRejectedAllRoles: 409,
        multiLineConsolidatedAllocationVerified: 200,
      };
    }
  );

  // ==========================================================================
  // CHECK 4: WP3-BDD2-R1-04 — D2-IR-04 Treasury Opening Balance & Zero-Basis Semantics
  // ==========================================================================
  await check(
    'WP3-BDD2-R1-04 (D2-IR-04): T12 treasury opening balance reconciliation enforces zero-basis cumulative net movement labels & anti-misrepresentation (409) when opening cash is absent, fails closed on DRAFT or boundary-misaligned opening rows (409), reconciles positive & negative verified opening cash accurately, and strips all treasury fields for non-executives',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 4A. Default p1 (NO UboqTreasuryOpeningBalance row): zero-basis cumulative net movement semantics
      const zeroBasisRes = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(zeroBasisRes.status, 200);
      const zbBody = await zeroBasisRes.json();
      const zbTv = zbBody.treasuryVarianceSummary;
      assert.equal(zbTv.actualTreasuryLiquidityVerified, false);
      assert.equal(zbTv.openingBalanceBasis, 'UNVERIFIED_ZERO_BASIS_CUMULATIVE_NET_MOVEMENT');
      assert.equal(zbTv.openingTreasuryCashAmt, null);
      assert.equal(zbTv.endingActualTreasuryClosingCash, null);
      assert.equal(zbTv.peakActualTreasuryLiquidityGap, null);
      assert.equal(zbTv.endingCumulativeNetCashMovementZeroBasis, '88840.00');
      assert.equal(zbTv.peakCumulativeNetCashDeficitZeroBasis, '96160.00');

      const zbHeadings = Object.fromEntries(
        zbBody.projection.visibleColumns.map((c: any) => [c.fieldId, c.heading])
      );
      assert.equal(
        zbHeadings.quarterly_closing_cash,
        'Cumulative Net Project Cash Movement (Zero Opening Basis — Not Available Liquidity, NO_SUM)'
      );
      assert.equal(
        zbHeadings.quarterly_liquidity_gap,
        'Cumulative Net Cash Outflow Deficit (Zero Opening Basis — Not Available Liquidity, NO_SUM)'
      );

      // Save t12-zero-basis-sample.xlsx & verify 0 <f> tags in OpenXML
      const zbXlsxRes = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(zbXlsxRes.status, 200);
      const zbXlsxBuf = Buffer.from(await zbXlsxRes.arrayBuffer());
      s.fs.writeFileSync(`${OUT}/t12-zero-basis-sample.xlsx`, zbXlsxBuf);
      const zbXml = readZipEntriesFromBuffer(zbXlsxBuf);
      const zbSheetXml = zbXml['xl/worksheets/sheet1.xml'] || '';
      const zbSharedXml = zbXml['xl/sharedStrings.xml'] || '';
      assert.equal((zbSheetXml.match(/<f[\s>]/g) || []).length, 0);
      assert.ok(
        (zbSheetXml + zbSharedXml).includes(
          'Cumulative Net Project Cash Movement (Zero Opening Basis — Not Available Liquidity, NO_SUM)'
        )
      );

      // Misleading headingAliases & saved layout names MUST be blocked 409 when opening cash is absent!
      for (const badAliases of [
        { quarterly_closing_cash: 'Actual Closing Cash' },
        { quarterly_liquidity_gap: 'Available Treasury Liquidity' },
      ]) {
        const misAliasRes = await postWorking({
          projectId: p1,
          templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
          sourceId: snap1,
          headingAliases: badAliases,
          format: 'json',
        });
        assert.equal(misAliasRes.status, 409);
        assert.equal(
          (await misAliasRes.json()).error,
          'TEMPLATE_TREASURY_LIQUIDITY_MISREPRESENTATION_BLOCKED'
        );
      }

      const misLayoutRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        templateName: 'Verified Actual Closing Cash Treasury Report',
        sharingScope: 'PRIVATE',
        selectedFields: ['cash_quarter_label', 'quarterly_closing_cash', 'quarterly_liquidity_gap'],
      });
      assert.equal(misLayoutRes.status, 409);
      assert.equal(
        (await misLayoutRes.json()).error,
        'LAYOUT_TREASURY_LIQUIDITY_MISREPRESENTATION_BLOCKED'
      );

      // 4B. RLS write guard on UboqTreasuryOpeningBalance: SITE_ENGINEER denied 42501; FINANCE_DIRECTOR allowed
      const tobId = prefix + '-TOB-P1';
      await withSignedRestrictedTx(p1, synthSiteEngUser, 7, async () => {
        await restrictedClient.query('SAVEPOINT sp_site_tob');
        let siteTobErr = '';
        try {
          await restrictedClient.query(
            `INSERT INTO "UboqTreasuryOpeningBalance"(id, "projectId", "snapshotId", "openingEffectiveDate", "openingCashAmt", "bankStatementEvidenceRef", "verificationStatus", "preparedById", "verifiedById", "verifiedAt", "updatedAt")
             VALUES ($1, $2, $3, '2026-09-01T00:00:00.000Z', 150000.00, 'BPI-STMT-001', 'VERIFIED', $4, $4, '2026-09-01T00:00:00.000Z', now())`,
            [tobId, p1, snap1, synthSiteEngUser]
          );
        } catch (e: any) {
          siteTobErr = e.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_site_tob');
        }
        assert.equal(siteTobErr, '42501');
      });

      // 4C. Unverified DRAFT opening row -> 409 TEMPLATE_TREASURY_OPENING_BALANCE_UNVERIFIED
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "UboqTreasuryOpeningBalance"(id, "projectId", "snapshotId", "openingEffectiveDate", "openingCashAmt", "bankStatementEvidenceRef", "verificationStatus", "preparedById", "updatedAt")
             VALUES ($1, $2, $3, '2026-09-01T00:00:00.000Z', 150000.00, 'BPI-STMT-DRAFT', 'DRAFT', $4, now())`,
            [tobId, p1, snap1, synthExecUser]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "UboqTreasuryOpeningBalance" WHERE id = $1`, [tobId]);
        },
        async () => {
          const draftTobRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(draftTobRes.status, 409);
          assert.equal(
            (await draftTobRes.json()).error,
            'TEMPLATE_TREASURY_OPENING_BALANCE_UNVERIFIED'
          );
        }
      );

      // 4D. Misaligned openingEffectiveDate (2026-09-05 != 2026-09-01 first period start) -> 409 TEMPLATE_TREASURY_OPENING_BOUNDARY_MISMATCH
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "UboqTreasuryOpeningBalance"(id, "projectId", "snapshotId", "openingEffectiveDate", "openingCashAmt", "bankStatementEvidenceRef", "verificationStatus", "preparedById", "verifiedById", "verifiedAt", "updatedAt")
             VALUES ($1, $2, $3, '2026-09-05T00:00:00.000Z', 150000.00, 'BPI-STMT-MISALIGNED', 'VERIFIED', $4, $4, '2026-09-05T00:00:00.000Z', now())`,
            [tobId, p1, snap1, synthExecUser]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "UboqTreasuryOpeningBalance" WHERE id = $1`, [tobId]);
        },
        async () => {
          const misBoundaryRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(misBoundaryRes.status, 409);
          assert.equal(
            (await misBoundaryRes.json()).error,
            'TEMPLATE_TREASURY_OPENING_BOUNDARY_MISMATCH'
          );
        }
      );

      // 4E. Verified positive opening cash (+150,000.00 inserted via signed restricted executive tx!) + Verified negative starting cash (-250,000.00) + Non-executive redaction
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
          const posTv = posBody.treasuryVarianceSummary;
          assert.equal(posTv.actualTreasuryLiquidityVerified, true);
          assert.equal(posTv.openingBalanceBasis, 'VERIFIED_TREASURY_OPENING_CASH');
          assert.equal(posTv.openingTreasuryCashAmt, '150000.00');
          // H1: 150,000 + 0 - 96,160 = +53,840.00 (gap 0.00); H2..H6: +53,840 + 200,000 - 15,000 = +238,840.00
          assert.equal(posTv.endingActualTreasuryClosingCash, '238840.00');
          assert.equal(posTv.peakActualTreasuryLiquidityGap, '0.00');
          assert.equal(posTv.endingCumulativeNetCashMovementZeroBasis, '88840.00');
          assert.equal(posTv.peakCumulativeNetCashDeficitZeroBasis, '96160.00');
          assert.equal(posBody.projection.projectedRows[0].visible.quarterly_closing_cash, '53840.00');
          assert.equal(posBody.projection.projectedRows[0].visible.quarterly_liquidity_gap, '0.00');
          assert.equal(posBody.projection.projectedRows[1].visible.quarterly_closing_cash, '238840.00');

          const posHeadings = Object.fromEntries(
            posBody.projection.visibleColumns.map((c: any) => [c.fieldId, c.heading])
          );
          assert.equal(
            posHeadings.quarterly_closing_cash,
            'Actual Treasury Closing Cash (Verified Opening Basis, NO_SUM)'
          );
          assert.equal(
            posHeadings.quarterly_liquidity_gap,
            'Actual Treasury Liquidity Gap (Verified Opening Basis, NO_SUM)'
          );

          // Save t12-verified-opening-sample.xlsx & verify 0 <f> tags
          const posXlsxRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'xlsx',
          });
          assert.equal(posXlsxRes.status, 200);
          const posXlsxBuf = Buffer.from(await posXlsxRes.arrayBuffer());
          s.fs.writeFileSync(`${OUT}/t12-verified-opening-sample.xlsx`, posXlsxBuf);
          const posXml = readZipEntriesFromBuffer(posXlsxBuf);
          assert.equal(
            ((posXml['xl/worksheets/sheet1.xml'] || '').match(/<f[\s>]/g) || []).length,
            0
          );

          // Custom alias 'Actual Closing Cash (NO_SUM)' is now permitted because verified opening cash exists!
          const allowedAliasRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            headingAliases: { quarterly_closing_cash: 'Actual Closing Cash (NO_SUM)' },
            format: 'json',
          });
          assert.equal(allowedAliasRes.status, 200);

          // Verify sealed VERIFIED row immutability under signed executive session (42501)
          await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
            await restrictedClient.query('SAVEPOINT sp_tob_immut');
            let tobImmutErr = '';
            try {
              await restrictedClient.query(
                `UPDATE "UboqTreasuryOpeningBalance" SET "openingCashAmt" = -250000.00 WHERE id = $1`,
                [tobId]
              );
            } catch (e: any) {
              tobImmutErr = e.code;
              await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_tob_immut');
            }
            assert.equal(tobImmutErr, '42501');
          });

          // Negative/overdrawn verified starting cash (-250,000.00)
          await adminReplica(async () => {
            await admin.query(
              `UPDATE "UboqTreasuryOpeningBalance" SET "openingCashAmt" = -250000.00 WHERE id = $1`,
              [tobId]
            );
          });
          const negRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(negRes.status, 200);
          const negBody = await negRes.json();
          const negTv = negBody.treasuryVarianceSummary;
          // H1: -250,000 - 96,160 = -346,160.00 (peak gap 346,160.00); H2..H6: -346,160 + 185,000 = -161,160.00
          assert.equal(negTv.openingTreasuryCashAmt, '-250000.00');
          assert.equal(negTv.endingActualTreasuryClosingCash, '-161160.00');
          assert.equal(negTv.peakActualTreasuryLiquidityGap, '346160.00');
          assert.equal(
            negBody.projection.projectedRows[0].visible.quarterly_closing_cash,
            '-346160.00'
          );
          assert.equal(
            negBody.projection.projectedRows[0].visible.quarterly_liquidity_gap,
            '346160.00'
          );

          // Non-executive PROJECT_MANAGER (commercial/restricted) & SITE_ENGINEER (internal) redaction checks
          actor = { userId: synthPmUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
          const pmRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(pmRes.status, 200);
          const pmBody = await pmRes.json();
          assert.equal(
            pmBody.treasuryVarianceSummary.receiptsVarianceTotal,
            posTv.receiptsVarianceTotal
          );
          assert.equal(pmBody.treasuryVarianceSummary.actualTreasuryLiquidityVerified, false);
          assert.equal(pmBody.treasuryVarianceSummary.openingBalanceBasis, 'REDACTED_NON_EXECUTIVE');
          assert.equal(pmBody.treasuryVarianceSummary.openingEffectiveDateIso, null);
          assert.equal(pmBody.treasuryVarianceSummary.bankStatementEvidenceRef, null);
          assert.equal(pmBody.treasuryVarianceSummary.openingTreasuryCashAmt, null);
          assert.equal(pmBody.treasuryVarianceSummary.endingActualTreasuryClosingCash, null);
          assert.equal(pmBody.treasuryVarianceSummary.peakActualTreasuryLiquidityGap, null);
          assert.equal(pmBody.treasuryVarianceSummary.endingCumulativeNetCashMovementZeroBasis, null);
          assert.equal(pmBody.treasuryVarianceSummary.peakCumulativeNetCashDeficitZeroBasis, null);
          assert.equal(pmBody.treasuryVarianceSummary.disbursementVarianceTotal, null);
          const pmRawJson = JSON.stringify(pmBody);
          for (const forbiddenToken of [
            'BPI-STMT-2026-09-01',
            'quarterly_closing_cash',
            'quarterly_liquidity_gap',
            'actual_treasury_closing_cash',
            'cumulative_net_cash_movement_zero_basis',
            '-250000.00',
            '-346160.00',
            '-161160.00',
            '346160.00',
            '88840.00',
            '96160.00',
          ]) {
            assert.equal(
              pmRawJson.includes(forbiddenToken),
              false,
              `Forbidden executive treasury token leaked to PM: ${forbiddenToken}`
            );
          }

          actor = { userId: synthSiteEngUser, role: 'SITE_ENGINEER', sessionVersion: 7 };
          const seRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(seRes.status, 200);
          const seBody = await seRes.json();
          assert.equal('treasuryVarianceSummary' in seBody, false);
          actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
        },
        false
      );

      return {
        zeroBasisDefaultVerified: true,
        misrepresentationAliasAndLayoutBlocked: 409,
        draftOpeningRejected: 409,
        boundaryMismatchOpeningRejected: 409,
        positiveVerifiedOpeningEndingCash: '238840.00',
        negativeVerifiedOpeningEndingCash: '-161160.00',
        nonExecutiveRedactionVerified: true,
      };
    }
  );

  // ==========================================================================
  // CHECK 5: WP3-BDD2-R1-05 — Preserved D2 Core, Formal T11 OpenXML, RBAC/RLS & D1/T0–T10
  // ==========================================================================
  await check(
    'WP3-BDD2-R1-05: Preserved Owner ratification provenance, 134-field catalog, T11 formal OpenXML inspection (SUM strictly on delta columns & __OSERP_META veryHidden), T12 nonformal block, preserved 409 guards, RBAC/FORCE RLS/SensitiveExportLog attestation, and Phase D1 signed T1 round-trip + T0–T10 non-regression',
    async () => {
      const d2Spec = JSON.parse(
        s.fs.readFileSync(
          'artifacts/uboq/wp3/batch-d-d2/d0-t11-t12-contract-specifications-ratified.json',
          'utf8'
        )
      );
      assert.equal(d2Spec.owner_ratification_audit_provenance.electronic_signature_present, false);

      const { getCanonicalCatalogStats } = require('../../src/lib/uboq/field-catalog');
      assert.equal(getCanonicalCatalogStats().totalCount, 134);

      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const wRes = await getWorking(p1);
      assert.equal(wRes.status, 200);
      assert.equal((await wRes.json()).templates.length, 13);

      const fListRes = await getFormal(p1);
      assert.equal(fListRes.status, 200);
      assert.equal((await fListRes.json()).contracts.length, 6);

      // T12 formal export rejected 400
      const t12FormalReject = await postFormal({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t12FormalReject.status, 400);
      assert.equal((await t12FormalReject.json()).error, 'FORMAL_TEMPLATE_CODE_NOT_SUPPORTED');

      // Statutory claim on T11 rejected 409
      const statReject = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        contractCode: 'DPWH_STATUTORY_VO_FORM_V1',
        format: 'json',
      });
      assert.equal(statReject.status, 409);

      // Save Executive T11 formal XLSX & inspect raw OpenXML
      const createExecLayoutRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        templateName: 'Executive Full VO & Commitment Register R1',
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
      const formulaTags = t11Sheet1.match(/<f>SUM\([A-Z]+2:[A-Z]+4\)<\/f>/g) || [];
      assert.equal(formulaTags.length, 2, 'Expected exact 2 SUM formulas on Client & Subcon VO delta columns');

      // Preserved T11 & T12 409 guards (unauthorized BOQ mutation & period discontinuity)
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 500, "revisedContractQuantity" = 2500 WHERE id = $1`,
            [boqRebar]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 0, "revisedContractQuantity" = 2000 WHERE id = $1`,
            [boqRebar]
          );
        },
        async () => {
          const boqMutRes = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(boqMutRes.status, 409);
          assert.equal((await boqMutRes.json()).error, 'TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION');
        }
      );

      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "UboqCashFlowPeriod" SET "periodStart" = '2026-10-05T00:00:00.000Z' WHERE id = $1`,
            [cfpIds[2]]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "UboqCashFlowPeriod" SET "periodStart" = '2026-10-01T00:00:00.000Z' WHERE id = $1`,
            [cfpIds[2]]
          );
        },
        async () => {
          const gapRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(gapRes.status, 409);
          assert.equal((await gapRes.json()).error, 'TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID');
        }
      );

      // Direct SQL SensitiveExportLog anti-forgery & T12 formal audit trigger block
      await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
        await restrictedClient.query('SAVEPOINT sp_forged_sel');
        let forgedSelErr = '';
        try {
          await restrictedClient.query(
            `SELECT set_config('app.uboq_sensitive_export_audit_context', 'on', true)`
          );
          await restrictedClient.query(
            `SELECT public.uboq_append_sensitive_export_log($1::text, $2::text, 'exec@local'::text, $3::text, 'T12_CASHFLOW_VARIANCE_TREASURY'::text, 'json'::text, $4::text, 6, '127.0.0.1'::text, true, false, 'forged'::text, repeat('a', 64), 'not-a-valid-hmac'::text)`,
            [prefix + '-BAD-SEL', synthExecUser, p1, snap1]
          );
        } catch (err: any) {
          forgedSelErr = err.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_forged_sel');
        }
        assert.equal(forgedSelErr, '42501');
      });

      // Phase D1 signed T1 round-trip + T0–T10 smoke non-regression
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
      wsT1Rt.getRow(2).getCell(5).value = '3500 psi @ 28d (Phase D2 R1 RT Non-Regression)';
      const t1EditedBuf = Buffer.from(await wbT1Rt.xlsx.writeBuffer());
      const fd = new FormData();
      fd.append('action', 'verify_import');
      fd.append('projectId', p1);
      fd.append('templateCode', 'T1_PHASE_BOQ');
      fd.append('idempotencyKey', `d2-r1-rt-${hexId}`);
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
        t11FormalSumFormulaCount: formulaTags.length,
        roundTripVerificationStatus: rtVerified.verificationStatus,
        t0ToT10SmokeCount: smokeSources.length,
        canonicalSourcesUnmutated: true,
      };
    }
  );

  // ==========================================================================
  // CHECK 6: WP3-BDD2-R1-06 — Preserved esbuild + Express Headless Chromium E2E
  // ==========================================================================
  await check(
    'WP3-BDD2-R1-06: Preserved esbuild + Express headless Chromium E2E harness (zero server-module client leakage, T11 formal & T12 zero-basis rendering at 1440x900 desktop & 390x844 mobile)',
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
          consoleErrors,
        };
      } finally {
        if (browser) await browser.close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
    }
  );

  // ==========================================================================
  // CHECK 7: WP3-BDD2-R1-07 — D2-IR-05 Bounded Native Next.js 16 Server Stack E2E
  // ==========================================================================
  await check(
    'WP3-BDD2-R1-07 (D2-IR-05): Bounded native Next.js 16 server stack E2E (src/proxy.ts unauthenticated 401/307 & mustChangePassword 403/307, real NextAuth Credentials JWE login, RSC page.tsx rendering, T11 formal XLSX download, T12 nonformal 400 block, and live 403 rejection for VIEWER & foreign-project actors)',
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
        // Wait for Next.js 16 dev server readiness on /login
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

        // 7A. Verify src/proxy.ts middleware blocks unauthenticated API (401) and redirects unauthenticated page (307 -> /login)
        const unauthApi = await fetch(
          `${baseUrl}/api/uboq/templates?projectId=${encodeURIComponent(p1)}`,
          { redirect: 'manual' }
        );
        assert.equal(unauthApi.status, 401);
        const unauthApiJson: any = await unauthApi.json();
        assert.match(String(unauthApiJson.error || ''), /Unauthorized Access/i);

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
          assert.ok(
            [200, 302, 303].includes(cbRes.status()),
            `Unexpected NextAuth callback status ${cbRes.status()}`
          );

          const sessRes = await ctx.request.get(`${baseUrl}/api/auth/session`);
          assert.equal(sessRes.status(), 200);
          const sessJson = await sessRes.json();
          assert.equal(sessJson?.user?.id, userId);
          return sessJson;
        };

        // 7B. Verify mustChangePassword=true user is blocked by src/proxy.ts (403 PASSWORD_CHANGE_REQUIRED on API & redirect to /change-password on page)
        const mustChangeCtx = await browser.newContext();
        try {
          const mcSess = await loginNextAuthContext(mustChangeCtx, synthMustChangePwUser);
          assert.equal(mcSess.user.mustChangePassword, true);

          const mcApi = await mustChangeCtx.request.get(
            `${baseUrl}/api/uboq/templates?projectId=${encodeURIComponent(p1)}`
          );
          assert.equal(mcApi.status(), 403);
          assert.equal((await mcApi.json()).error, 'PASSWORD_CHANGE_REQUIRED');

          const mcPage = await mustChangeCtx.request.get(
            `${baseUrl}/projects/${encodeURIComponent(p1)}/uboq/templates`,
            { maxRedirects: 0 }
          );
          assert.ok([307, 308, 302].includes(mcPage.status()));
          assert.match(String(mcPage.headers()['location'] || ''), /\/change-password$/);
        } finally {
          await mustChangeCtx.close();
        }

        // 7C. Authorized FINANCE_DIRECTOR full browser E2E on native Next.js 16 server
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

          // First verify unauthenticated browser navigation lands on /login via src/proxy.ts
          await page.goto(`${baseUrl}/projects/${encodeURIComponent(p1)}/uboq/templates`);
          await page.waitForURL(/\/login$/);
          await page.getByText('JEJORS CONSTRUCTION').waitFor();

          // Authenticate via real NextAuth Credentials endpoint in the same browser context
          await loginNextAuthContext(execCtx, synthExecUser);

          const navRes = await page.goto(
            `${baseUrl}/projects/${encodeURIComponent(p1)}/uboq/templates`
          );
          assert.ok(navRes);
          assert.equal(navRes.status(), 200);
          // Verify security headers injected by src/proxy.ts!
          const respHeaders = navRes.headers();
          assert.equal(respHeaders['x-frame-options'], 'SAMEORIGIN');
          assert.equal(respHeaders['x-content-type-options'], 'nosniff');

          // Verify RSC page.tsx heading + Client Component hydration
          await page
            .getByRole('heading', { name: 'Universal BOQ templates (T0–T12)', exact: true })
            .waitFor();
          await page.getByLabel('Approved source', { exact: true }).waitFor();

          // Select T11, preview formal output, verify ERP_CANONICAL_T11_FORMAL_V1 & download formal XLSX
          await page
            .getByLabel('Template', { exact: true })
            .selectOption('T11_VARIATION_ORDER_REGISTER');
          await page.getByRole('button', { name: 'Preview', exact: true }).click();
          await page.getByText(/Approved Client VOs: 1 \| Approved Subcon VOs: 2/).waitFor();

          await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
          await page
            .getByLabel('Formal export preview')
            .getByText('ERP_CANONICAL_T11_FORMAL_V1', { exact: true })
            .waitFor();

          const pngNextT11Desktop = `${OUT}/browser-d2-r1-nextjs-t11-desktop.png`;
          await page.screenshot({ path: pngNextT11Desktop, fullPage: true });

          const [dlNextT11Formal] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Download formal XLSX', exact: true }).click(),
          ]);
          const nextT11FormalPath = `${OUT}/browser-d2-r1-nextjs-t11-formal.xlsx`;
          await dlNextT11Formal.saveAs(nextT11FormalPath);
          const nextT11Xml = readZipEntriesFromBuffer(s.fs.readFileSync(nextT11FormalPath));
          assert.match(
            nextT11Xml['xl/workbook.xml'] || '',
            /name="__OSERP_META"[^>]*state="veryHidden"/
          );
          assert.ok(
            ((nextT11Xml['xl/worksheets/sheet1.xml'] || '').match(/<f>SUM\(/g) || []).length >= 1
          );

          // Mobile 390x844 screenshot on native Next.js page
          await page.setViewportSize({ width: 390, height: 844 });
          const pngNextMobile = `${OUT}/browser-d2-r1-nextjs-mobile.png`;
          await page.screenshot({ path: pngNextMobile, fullPage: false });
          await page.setViewportSize({ width: 1440, height: 900 });

          // Switch to T12, verify zero-basis labels in UI & verify live POST /api/uboq/templates/formal-export rejects T12 with 400!
          await page
            .getByLabel('Template', { exact: true })
            .selectOption('T12_CASHFLOW_VARIANCE_TREASURY');
          await page.getByRole('button', { name: 'Preview', exact: true }).click();
          await page
            .getByText(/Ending cumulative net cash movement \(zero basis, NO_SUM\): 88840\.00/)
            .waitFor();

          const pngNextT12Desktop = `${OUT}/browser-d2-r1-nextjs-t12-desktop.png`;
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
          assert.equal(
            (await liveT12FormalReject.json()).error,
            'FORMAL_TEMPLATE_CODE_NOT_SUPPORTED'
          );

          for (const fName of [
            'browser-d2-r1-nextjs-t11-desktop.png',
            'browser-d2-r1-nextjs-t12-desktop.png',
            'browser-d2-r1-nextjs-mobile.png',
          ]) {
            s.fs.copyFileSync(`${OUT}/${fName}`, `${BRAIN_DIR}/${fName}`);
          }

          assert.deepEqual(consoleErrors, []);
        } finally {
          await execCtx.close();
        }

        // 7D. Unauthorized actors over live Next.js 16 HTTP stack:
        //     - Read-only VIEWER on p1: 403 on formal export & 403 on layout save
        //     - Foreign-project FINANCE_DIRECTOR: 403 on p1 working/formal routes
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

          const vSave = await viewerCtx.request.post(`${baseUrl}/api/uboq/templates/layouts`, {
            data: {
              action: 'create',
              projectId: p1,
              templateCode: 'T11_VARIATION_ORDER_REGISTER',
              templateName: 'Viewer Live Forbidden',
              sharingScope: 'PRIVATE',
              selectedFields: ['vo_number', 'item_code'],
            },
          });
          assert.equal(vSave.status(), 403);
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
          unauthenticatedPageRedirectStatus: unauthPage.status,
          mustChangePasswordApiStatus: 403,
          proxySecurityHeadersVerified: true,
          t11FormalXlsxDownloadedAndVerified: true,
          t12NonFormalRejectedStatus: 400,
          viewerFormalAndSaveRejectedStatus: 403,
          foreignActorRejectedStatus: 403,
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
