/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-c';
const REPORT_PATH = OUT + '/runtime-tests.json';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch C consolidated runtime, financial-integrity, commitment-lifecycle separation, anti-double-counting, cash-flow NO_SUM & cutoff consistency, executive RBAC/redaction, SensitiveExportLog audit, PostgreSQL RLS, saved-layout, T0–T7 non-regression, and real Chromium browser E2E verification across T8_CASHFLOW_HALF_MONTH, T9_CASHFLOW_QUARTERLY, and T10_EXECUTIVE_MARGIN.',
};

let admin: any;
let restrictedClient: any;
let prisma: any;
let workingRoute: any;
let layoutsRoute: any;
let formalRoute: any;
let NextRequest: any;
let actor: any;
let originalLoad: any;
let beforeTables: any;

const hexId = s.crypto.randomBytes(5).toString('hex');
const prefix = 'SYNTH-WP3-BC-' + hexId;

// Synthetic projects
const p1 = prefix + '-P1-GOV';
const pCorp = prefix + '-P2-CORP';
const pPeza = prefix + '-P3-PEZA';
const pNoCf = prefix + '-P4-NOCF';
const pForeign = prefix + '-P5-FOREIGN';

// Synthetic users
const synthExecUser = prefix + '-USR-EXEC';
const synthNarrowedExecUser = prefix + '-USR-EXEC-NARROW';
const synthPmUser = prefix + '-USR-PM';
const synthSiteEngUser = prefix + '-USR-SITE';
const synthViewerUser = prefix + '-USR-VIEWER';

// Tax profiles & Contract authorities
const taxGov = prefix + '-TAX-GOV12';
const taxCorp = prefix + '-TAX-CORP12';
const taxPeza = prefix + '-TAX-PEZA0';

const cGov = prefix + '-CA-GOV';
const cCorp = prefix + '-CA-CORP';
const cPeza = prefix + '-CA-PEZA';
const cNoCf = prefix + '-CA-NOCF';

const srcDoc = prefix + '-DOC1';

// Snapshots
const snap1 = prefix + '-SNAP-GOV1';
const snapCorp = prefix + '-SNAP-CORP1';
const snapPeza = prefix + '-SNAP-PEZA1';
const snapNoCf = prefix + '-SNAP-NOCF';
const snapForeign = prefix + '-SNAP-FOREIGN';

// AwardedBOQItems
const boqConc = prefix + '-ABOQ-CONC';
const boqRebar = prefix + '-ABOQ-RBR';
const boqMob = prefix + '-ABOQ-MOB';
const boqCorp = prefix + '-ABOQ-CORP';
const boqPeza = prefix + '-ABOQ-PEZA';
const boqNoCf = prefix + '-ABOQ-NOCF';
const boqForeign = prefix + '-ABOQ-FOR';

// Snapshot Phase Lines
const plConcP1 = prefix + '-PL-CONC-P1';
const plConcP2 = prefix + '-PL-CONC-P2';
const plRebarP1 = prefix + '-PL-RBR-P1';
const plMobP1 = prefix + '-PL-MOB-P1';
const plCorp1 = prefix + '-PL-CORP-1';
const plPeza1 = prefix + '-PL-PEZA-1';
const plNoCf1 = prefix + '-PL-NOCF-1';
const plForeign1 = prefix + '-PL-FOR-1';

// Consolidated BOQ, Agency Estimates, PRRs, Target Budgets
const cboqConc = prefix + '-CBOQ-CONC';
const cboqRebar = prefix + '-CBOQ-RBR';
const cgrpConc = prefix + '-CGRP-CONC';
const cgrpRebar = prefix + '-CGRP-RBR';
const clnk1 = prefix + '-CLNK-1';
const clnk2 = prefix + '-CLNK-2';
const clnk3 = prefix + '-CLNK-3';

const estConc1 = prefix + '-EST-CONC1';
const estConc2 = prefix + '-EST-CONC2';
const estRebar1 = prefix + '-EST-RBR1';
const estMob1 = prefix + '-EST-MOB1';

const acctCement = prefix + '-ACCT-CEM';
const prrCement = prefix + '-PRR-CEM';

const tbConc1 = prefix + '-TB-CONC1';
const tbConc2 = prefix + '-TB-CONC2';
const tbRebar1 = prefix + '-TB-RBR1';
const tbMob1 = prefix + '-TB-MOB1';
const tbForeign = prefix + '-TB-FOR';

// Subcontractor, Packages, SVO, JobOrder, SubcontractBilling, PaymentRecord
const subconEntity = prefix + '-SUBCON-1';
const subPkgRebar = prefix + '-SPKG-RBR';
const subPkgForeign = prefix + '-SPKG-FOR';
const svoRebarApproved = prefix + '-SVO-RBR-APP';
const svoRebarPending = prefix + '-SVO-RBR-PND';
const svoForeign = prefix + '-SVO-FOR';
const joRebarChild = prefix + '-JO-RBR-1';
const subAccRebar = prefix + '-SACC-RBR-1';
const subAccForeign = prefix + '-SACC-FOR-1';
const sbRebar1 = prefix + '-SBIL-RBR-1';
const sbForeign = prefix + '-SBIL-FOR-1';
const prRebarPaid = prefix + '-SPR-RBR-PAID';
const prRebarFuture = prefix + '-SPR-RBR-FUT';
const prForeign = prefix + '-SPR-FOR-1';

// Variation Orders (Client Approved +20 m3, Client Draft +50 m3, Subcon VO +30 m3)
const voClientApproved = prefix + '-VO-CLI-APP';
const voiClientApproved = prefix + '-VOI-CLI-APP';
const voClientDraft = prefix + '-VO-CLI-DRF';
const voiClientDraft = prefix + '-VOI-CLI-DRF';
const voSubconApproved = prefix + '-VO-SUB-APP';
const voiSubconApproved = prefix + '-VOI-SUB-APP';

// Accomplishments & Inspections (T5 + T10 Earned Value)
const accApproved = prefix + '-ACC-APP';
const accItemConc = prefix + '-ACCI-CONC';
const accItemRebar = prefix + '-ACCI-RBR';
const accItemMob = prefix + '-ACCI-MOB';
const inspConc = prefix + '-INSP-CONC';
const inspRebar = prefix + '-INSP-RBR';
const inspMob = prefix + '-INSP-MOB';

// Billings & Payments (T6 + T8/T9 Actual Collections)
const bilGovApproved = prefix + '-BIL-GOV-APP';
const biGovConc = prefix + '-BI-GOV-CONC';
const biGovRebar = prefix + '-BI-GOV-RBR';
const biGovMob = prefix + '-BI-GOV-MOB';
const bdGov = prefix + '-BD-GOV';
const payGovCleared = prefix + '-PAY-GOV-CLR';
const payGovPending = prefix + '-PAY-GOV-PND';
const payGovFuture = prefix + '-PAY-GOV-FUT';
const bilGovUncollected = prefix + '-BIL-GOV-UNCOLL';

const bilCorpApproved = prefix + '-BIL-CORP-APP';
const biCorp1 = prefix + '-BI-CORP-1';
const payCorpCleared = prefix + '-PAY-CORP-CLR';

// Schedules (T7 + T8/T9 Fallback + T10 PV)
const schedBaseline = prefix + '-SCH-BASE';
const wbs1 = prefix + '-WBS-1';
const act100 = prefix + '-ACT-100';
const act200 = prefix + '-ACT-200';
const act300 = prefix + '-ACT-300';
const dep1 = prefix + '-DEP-1';
const dep2 = prefix + '-DEP-2';
const ulnk1 = prefix + '-ULNK-1';
const ulnk2 = prefix + '-ULNK-2';
const ulnk3 = prefix + '-ULNK-3';
const spu100 = prefix + '-SPU-100';
const spu200 = prefix + '-SPU-200';
const spu300 = prefix + '-SPU-300';

const schedCorpBaseline = prefix + '-SCH-CORP-BASE';
const actCorp1 = prefix + '-ACT-CORP-1';
const actCorp2 = prefix + '-ACT-CORP-2';

// Procurement: Supplier, MR, PO, Delivery, AP
const supplier1 = prefix + '-SUP-1';
const mr1 = prefix + '-MR-1';
const mriCement = prefix + '-MRI-CEM';
const poCement = prefix + '-PO-CEM-APP';
const poiCement = prefix + '-POI-CEM';
const poDraftIgnored = prefix + '-PO-DRF';
const deliv1 = prefix + '-DEL-1';
const deliv2 = prefix + '-DEL-2';
const deliv3 = prefix + '-DEL-3';
const apCementPaid = prefix + '-AP-CEM-PAID';
const apCementUnpaid = prefix + '-AP-CEM-UNPAID';
const apCementFuturePaid = prefix + '-AP-CEM-FUT';

// Commitment Ledgers, Cost Ledgers, Expenses, Worker & Payroll
const clMirrorPoCement = prefix + '-CL-MIR-PO';
const clMirrorSubPkg = prefix + '-CL-MIR-SUB';
const clForeign = prefix + '-CL-FOR';

const pclMirrorPoCement = prefix + '-PCL-MIR-PO';
const pclMirrorSbRebar = prefix + '-PCL-MIR-SB';
const pclMirrorExpMob = prefix + '-PCL-MIR-EXP';
const pclMirrorPayroll = prefix + '-PCL-MIR-PAY';
const pclPendingIgnored = prefix + '-PCL-PND';
const pclCorpApproved = prefix + '-PCL-CORP-APP';
const pclPezaApproved = prefix + '-PCL-PEZA-APP';
const pclForeign = prefix + '-PCL-FOR';

const expMobPaid = prefix + '-EXP-MOB-PAID';
const expMobAccrued = prefix + '-EXP-MOB-ACCR';
const expDraftIgnored = prefix + '-EXP-DRF';

const synthWorker = prefix + '-WRK-1';
const payPeriod1 = prefix + '-PAYPER-1';
const payrollRow1 = prefix + '-PAYROW-1';
const payBatchNo = 'PAYBATCH-' + hexId.toUpperCase();

// Persisted UboqCashFlowPeriod rows (6 half-months across 2026-Q3 and 2026-Q4 on p1 + 1 on pForeign)
const cfpIds = [1, 2, 3, 4, 5, 6].map((idx) => `${prefix}-CFP-${idx}`);
const cfpForeign = prefix + '-CFP-FOR';

const save = () => {
  s.fs.mkdirSync(OUT, { recursive: true });
  s.fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
};

async function check(name: string, fn: () => Promise<any>) {
  const detail = await fn();
  report.checks.push({ name, result: 'PASS', ...(detail ? { detail } : {}) });
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
    'UboqCashFlowPeriod',
    'UboqContractorTargetBudget',
    'PurchaseOrder',
    'PurchaseOrderItem',
    'AccountsPayable',
    'SubcontractPackage',
    'JobOrder',
    'SubcontractBilling',
    'PaymentRecord',
    'SubcontractorVariationOrder',
    'CommitmentLedger',
    'ProjectCostLedger',
    'Expense',
    'PayrollPeriod',
    'Payroll',
    'Billing',
    'Payment',
    'ProjectSchedule',
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
    await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [projectId]);
    await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    await restrictedClient.query(
      `SELECT set_config('app.current_session_version', $1, true)`,
      [String(sessionVersion)]
    );
    await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proof]);
    return fn();
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
  const mobSig = computeSpecSignatureHash('Mobilization & Temporary Facilities', 'General Requirements');
  const cemResSig = computeSpecSignatureHash('Portland Cement Type 1', '40kg Bag ASTM C150');

  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    // Users
    for (const [uid, role] of [
      [synthExecUser, 'FINANCE_DIRECTOR'],
      [synthNarrowedExecUser, 'FINANCE_DIRECTOR'],
      [synthPmUser, 'PROJECT_MANAGER'],
      [synthSiteEngUser, 'SITE_ENGINEER'],
      [synthViewerUser, 'PROJECT_MANAGER'],
    ]) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 7, now())`,
        [uid, `${uid.toLowerCase()}@synthetic.local`, role]
      );
    }

    // Projects
    for (const p of [p1, pCorp, pPeza, pNoCf, pForeign]) {
      await admin.query(
        'INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt") VALUES ($1, $1, true, false, now())',
        [p]
      );
    }

    // Project assignments (including FINANCE_DIRECTOR narrowed to PROJECT_MANAGER on p1!)
    await admin.query(
      `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES
         ($1, $10, $15, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($2, $10, $16, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($3, $10, $17, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($4, $10, $18, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($5, $11, $15, 'PROJECT_MANAGER',  'STANDARD', 'ACTIVE', now()),
         ($6, $12, $15, 'PROJECT_MANAGER',  'FULL',     'ACTIVE', now()),
         ($7, $13, $15, 'SITE_ENGINEER',    'STANDARD', 'ACTIVE', now()),
         ($8, $14, $15, 'MEMBER',           'VIEWER',   'ACTIVE', now()),
         ($9, $19, $15, 'MEMBER',           'VIEWER',   'ACTIVE', now())`,
      [
        prefix + '-ASN-EXEC-P1',
        prefix + '-ASN-EXEC-CORP',
        prefix + '-ASN-EXEC-PEZA',
        prefix + '-ASN-EXEC-NOCF',
        prefix + '-ASN-NARROW-P1',
        prefix + '-ASN-PM-P1',
        prefix + '-ASN-SITE-P1',
        prefix + '-ASN-VIEW-P1',
        prefix + '-ASN-LOW-P1',
        synthExecUser,
        synthNarrowedExecUser,
        synthPmUser,
        synthSiteEngUser,
        synthViewerUser,
        p1,
        pCorp,
        pPeza,
        pNoCf,
        s.f.ids.low,
      ]
    );

    // Tax profiles: Gov 12% VAT-inclusive; Corporate 12% VAT-exclusive; PEZA 0% Zero-rated
    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES
         ($1, $4, 'GOV_INFRA_VAT12',     'v2026.1', 'GOVERNMENT', 0.120000, 'VATABLE_12', true,  0.100000, 0.150000, 0.020000, 0.050000, true, $7, '2026-08-01T00:00:00.000Z'),
         ($2, $5, 'CORP_PH_VAT_EXCL_12', 'v2026.1', 'PRIVATE',    0.120000, 'VATABLE_12', false, 0.100000, 0.100000, 0.020000, 0.000000, true, $7, '2026-08-01T00:00:00.000Z'),
         ($3, $6, 'PEZA_ZERO_RATED_0',   'v2026.1', 'PRIVATE',    0.000000, 'ZERO_RATED', false, 0.100000, 0.000000, 0.020000, 0.000000, true, $7, '2026-08-01T00:00:00.000Z')`,
      [taxGov, taxCorp, taxPeza, p1, pCorp, pPeza, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "noaRef", "ntpRef", "clientPoRef", "voReference", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $5, $9,  'GOVERNMENT', 'DPWH Synthetic District',  'CA-BC-GOV-01',  'NOA-BC-01', 'NTP-BC-01', 'CPO-BC-01', 'CVO-BC-01', 'UNIT_PRICE', 'VAT_INCLUSIVE', 792000.00, 707142.86, 918400.00, 180, '2026-09-01T00:00:00.000Z', 'APPROVED', $12, '2026-08-02T00:00:00.000Z', now()),
         ($2, $6, $10, 'PRIVATE',    'Ayala Synthetic Corp',     'CA-BC-CORP-01', NULL,        NULL,        NULL,        NULL,        'UNIT_PRICE', 'VAT_EXCLUSIVE', 200000.00, 200000.00, 200000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $12, '2026-08-02T00:00:00.000Z', now()),
         ($3, $7, $11, 'PRIVATE',    'PEZA Export Manufacturing','CA-BC-PEZA-01', NULL,        NULL,        NULL,        NULL,        'UNIT_PRICE', 'ZERO_RATED',    200000.00, 200000.00, 200000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $12, '2026-08-02T00:00:00.000Z', now()),
         ($4, $8, NULL,'PRIVATE',    'NoCF Client Corp',         'CA-BC-NOCF-01', NULL,        NULL,        NULL,        NULL,        'UNIT_PRICE', 'VAT_EXCLUSIVE', 50000.00,  50000.00,  50000.00,  60,  '2026-09-01T00:00:00.000Z', 'APPROVED', $12, '2026-08-02T00:00:00.000Z', now())`,
      [cGov, cCorp, cPeza, cNoCf, p1, pCorp, pPeza, pNoCf, taxGov, taxCorp, taxPeza, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'batch-c-source.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8192, $3, '504b0304', 'memory://batch-c', 'CONTRACT_BOQ', $4, true)`,
      [srcDoc, p1, s.hash(srcDoc), s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $6,  $11,  $12,  1, 'Gov Baseline v1',    'APPROVED', $16, $17, $21, $21, '2026-08-05T00:00:00.000Z'),
         ($2, $7,  NULL, $13,  1, 'Corp Baseline v1',   'APPROVED', $18, NULL, $21, $21, '2026-08-05T00:00:00.000Z'),
         ($3, $8,  NULL, $14,  1, 'PEZA Baseline v1',   'APPROVED', $19, NULL, $21, $21, '2026-08-05T00:00:00.000Z'),
         ($4, $9,  NULL, $15,  1, 'NoCF Baseline v1',   'APPROVED', $20, NULL, $21, $21, '2026-08-05T00:00:00.000Z'),
         ($5, $10, NULL, NULL, 1, 'Foreign Baseline v1','APPROVED', $22, NULL, $21, $21, '2026-08-05T00:00:00.000Z')`,
      [
        snap1,
        snapCorp,
        snapPeza,
        snapNoCf,
        snapForeign,
        p1,
        pCorp,
        pPeza,
        pNoCf,
        pForeign,
        srcDoc,
        cGov,
        cCorp,
        cPeza,
        cNoCf,
        s.hash(snap1),
        s.hash(srcDoc),
        s.hash(snapCorp),
        s.hash(snapPeza),
        s.hash(snapNoCf),
        s.f.ids.a,
        s.hash(snapForeign),
      ]
    );

    // AwardedBOQItems
    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
       VALUES
         ($1, '900(1)a', 'STRUCTURAL', 'Structural Concrete Class A',        'm3',  100,  6320,  632000, 20, 120,  6320,  758400, 'APPROVED', $8,  now()),
         ($2, '902(1)a', 'STRUCTURAL', 'Deformed Reinforcing Steel',         'kg',  2000, 55,    110000, 0,  2000, 55,    110000, 'APPROVED', $8,  now()),
         ($3, 'B.9',     'GENERAL',    'Mobilization & Temporary Facilities','lot', 1,    50000, 50000,  0,  1,    50000, 50000,  'APPROVED', $8,  now()),
         ($4, 'C-100',   'CIVIL',      'Corporate Concrete Slab',            'm3',  40,   5000,  200000, 0,  40,   5000,  200000, 'APPROVED', $9,  now()),
         ($5, 'P-100',   'CIVIL',      'PEZA Warehouse Foundation',          'm3',  40,   5000,  200000, 0,  40,   5000,  200000, 'APPROVED', $10, now()),
         ($6, 'N-100',   'CIVIL',      'No Cashflow Scope',                  'm3',  10,   5000,  50000,  0,  10,   5000,  50000,  'APPROVED', $11, now()),
         ($7, 'F-100',   'CIVIL',      'Foreign Tenant Scope',               'm3',  10,   5000,  50000,  0,  10,   5000,  50000,  'APPROVED', $12, now())`,
      [
        boqConc,
        boqRebar,
        boqMob,
        boqCorp,
        boqPeza,
        boqNoCf,
        boqForeign,
        p1,
        pCorp,
        pPeza,
        pNoCf,
        pForeign,
      ]
    );

    // Snapshot Phase Lines
    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "awardedBoqItemId", "sourceDocumentId", "itemCode", "phaseCode", "sectionCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
         "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
         "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       )
       VALUES
         ($1, $9,  $14, $19, $26, '900(1)a', 'PHASE-01', 'BLDG-A', 'Structural Concrete Class A', '3500 psi @ 28d',     $27, 'cu.m', 'm3',  'VOLUME',     'UNIT_PRICE', 40.0000,   40.0000,   6200.0000,  248000.00, 221428.57, 'SOURCE_EVIDENCED',    now()),
         ($2, $9,  $14, $19, $26, '900(1)a', 'PHASE-02', 'BLDG-B', 'Structural Concrete Class A', '3500 psi @ 28d',     $27, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 60.0000,   60.0000,   6400.0000,  384000.00, 342857.14, 'SOURCE_EVIDENCED',    now()),
         ($3, $9,  $14, $20, $26, '902(1)a', 'PHASE-01', 'BLDG-A', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $28, 'kg',   'kg',  'MASS',       'UNIT_PRICE', 2000.0000, 2000.0000, 55.0000,    110000.00, 98214.29,  'SOURCE_EVIDENCED',    now()),
         ($4, $9,  $14, $21, $26, 'B.9',     'PHASE-01', 'GEN',    'Mobilization & Temporary Facilities', 'General Requirements', $29, 'lot', 'lot', 'LUMP_SCOPE', 'LUMP_SUM', 1.0000, 1.0000, 50000.0000, 50000.00, 44642.86, 'SOURCE_EVIDENCED', now()),
         ($5, $10, $15, $22, NULL,'C-100',   'PHASE-01', 'CORP',   'Corporate Concrete Slab',     '3500 psi @ 28d',     $27, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 40.0000,   40.0000,   5000.0000,  200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($6, $11, $16, $23, NULL,'P-100',   'PHASE-01', 'PEZA',   'PEZA Warehouse Foundation',   '3500 psi @ 28d',     $27, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 40.0000,   40.0000,   5000.0000,  200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($7, $12, $17, $24, NULL,'N-100',   'PHASE-01', 'NOCF',   'No Cashflow Scope',           '3500 psi @ 28d',     $27, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 10.0000,   10.0000,   5000.0000,  50000.00,  50000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($8, $13, $18, $25, NULL,'F-100',   'PHASE-01', 'FOR',    'Foreign Tenant Scope',        '3500 psi @ 28d',     $27, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 10.0000,   10.0000,   5000.0000,  50000.00,  50000.00,  'SOURCE_NOT_PROVIDED', now())`,
      [
        plConcP1,
        plConcP2,
        plRebarP1,
        plMobP1,
        plCorp1,
        plPeza1,
        plNoCf1,
        plForeign1,
        p1,
        pCorp,
        pPeza,
        pNoCf,
        pForeign,
        snap1,
        snapCorp,
        snapPeza,
        snapNoCf,
        snapForeign,
        boqConc,
        boqRebar,
        boqMob,
        boqCorp,
        boqPeza,
        boqNoCf,
        boqForeign,
        srcDoc,
        concSig,
        rbrSig,
        mobSig,
      ]
    );

    // Consolidated BOQ, Groups, Links, Agency Estimates, PRR, Contractor Target Budgets
    await admin.query(
      `INSERT INTO "ConsolidatedBOQItem"(id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId", "isUboqResourceGoverned", "updatedAt")
       VALUES
         ($1, 'CGRP-BC-1', 'UBOQ_CONSOLIDATED', 'Structural Concrete Class A', 'm3', 100,  4800, 480000, 'APPROVED', $3, true, now()),
         ($2, 'CGRP-BC-2', 'UBOQ_CONSOLIDATED', 'Deformed Reinforcing Steel',  'kg', 2000, 44,   88000,  'APPROVED', $3, true, now())`,
      [cboqConc, cboqRebar, p1]
    );
    await admin.query(
      `INSERT INTO "UboqConsolidationGroup"(id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription", specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily", "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt")
       VALUES
         ($1, $3, $4, 'CGRP-BC-1', 'Structural Concrete Class A', '3500 psi @ 28d',     $6, 'm3', 'VOLUME', 100.0000,  6320.0000, 632000.00, now()),
         ($2, $3, $5, 'CGRP-BC-2', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $7, 'kg', 'MASS',   2000.0000, 55.0000,   110000.00, now())`,
      [cgrpConc, cgrpRebar, p1, cboqConc, cboqRebar, concSig, rbrSig]
    );
    await admin.query(
      `INSERT INTO "UboqConsolidationLink"(id, "consolidationGroupId", "phaseLineId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $4, $6, 40.0000,   0.400000),
         ($2, $4, $7, 60.0000,   0.600000),
         ($3, $5, $8, 2000.0000, 1.000000)`,
      [clnk1, clnk2, clnk3, cgrpConc, cgrpRebar, plConcP1, plConcP2, plRebarP1]
    );

    await admin.query(
      `INSERT INTO "UboqAgencyEstimateBaseline"(id, "projectId", "phaseLineId", "agencyEdcAmt", "agencyAbcAmt", "estimateMaterialCost", "estimateLaborCost", "estimateEquipmentCost", "estimatedDirectCost", "ocmAmount", "contingencyOcm", "contractorProfitAmt", "estimateVatAmt", "estimatedIndirectCost", "estimatedTotalUnitCost", "estimatedTotalAmount")
       VALUES
         ($1, $5, $6, 180000.00, 240000.00, 110000.00, 45000.00, 25000.00, 180000.00, 21600.00, 0.00, 14400.00, 10800.00, 46800.00, 5670.0000, 226800.00),
         ($2, $5, $7, 270000.00, 360000.00, 165000.00, 67500.00, 37500.00, 270000.00, 32400.00, 0.00, 21600.00, 16200.00, 70200.00, 5670.0000, 340200.00),
         ($3, $5, $8, 75000.00,  105000.00, 50000.00,  20000.00, 5000.00,  75000.00,  9000.00,  0.00, 6000.00,  4500.00,  19500.00, 47.2500,   94500.00),
         ($4, $5, $9, 32000.00,  45000.00,  12000.00,  15000.00, 5000.00,  32000.00,  3840.00,  0.00, 2560.00,  1920.00,  8320.00,  40320.0000,40320.00)`,
      [estConc1, estConc2, estRebar1, estMob1, p1, plConcP1, plConcP2, plRebarP1, plMobP1]
    );

    await admin.query(
      `INSERT INTO "UboqCanonicalResourceAccount"(id, "projectId", "consolidatedBoqItemId", "resourceCode", "resourceDescription", "resourceSpec", "specSignatureHash", "resourceClass", "fulfillmentChannel", "resourceUomNormalized", "uomDimensionFamily", "activeApprovedPrId", "activeApprovedQty", "allocatedUsableStockQty", "openMrReservedQty", "openCommittedPoQty", "deliveredReceivedQty", "consumedIssuedQty", "damagedReturnedQty", "availablePhysicalStockQty", "remainingProcurementQty", "isOvercommittedByRevision", "overcommittedQty", "targetResourceUnitCost", "rowVersion", "updatedAt")
       VALUES ($1, $2, $3, 'MAT-CEM-BC', 'Portland Cement Type 1', '40kg Bag ASTM C150', $4, 'MATERIAL', 'SUPPLIER_PO', 'bag_40kg', 'PACK', $5, 900.0000, 100.0000, 0.0000, 500.0000, 0.0000, 0.0000, 0.0000, 100.0000, 300.0000, false, 0.0000, 230.0000, 1, now())`,
      [acctCement, p1, cboqConc, cemResSig, prrCement]
    );
    await admin.query(
      `INSERT INTO "UboqProcurementResourceRequirement"(id, "canonicalResourceId", "projectId", "consolidatedBoqItemId", "snapshotId", "versionNumber", status, "takeoffBasis", "resourceCoeff", "workQuantityBasis", "requiredQty", "benchmarkUnitCost", "procurementBudget", "sourceDocumentId", "preparedById", "approvedById", "approvedAt")
       VALUES ($1, $2, $3, $4, $5, 1, 'APPROVED', 'CONTRACTOR_DETAILED_DUPA', 9.000000, 100.0000, 900.0000, 230.0000, 207000.00, $6, $7, $7, '2026-08-06T00:00:00.000Z')`,
      [prrCement, acctCement, p1, cboqConc, snap1, srcDoc, s.f.ids.a]
    );

    // Executive-only UboqContractorTargetBudget rows (p1 + pForeign)
    await admin.query(
      `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "phaseLineId", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $6, $8,  160000.00, 195000.00, 70714.29,  0.266129, 4000.00,  90000.00,  150000.00, 115714.29, $13, '2026-08-10T00:00:00.000Z', now()),
         ($2, $6, $9,  240000.00, 290000.00, 121428.57, 0.295139, 6000.00,  140000.00, 225000.00, 186428.57, $13, '2026-08-10T00:00:00.000Z', now()),
         ($3, $6, $10, 62000.00,  72000.00,  26214.29,  0.266909, 25000.00, 18000.00,  68000.00,  30214.29,  $13, '2026-08-10T00:00:00.000Z', now()),
         ($4, $6, $11, 25000.00,  30000.00,  14642.86,  0.328000, 0.00,     5000.00,   17000.00,  27642.86,  $13, '2026-08-10T00:00:00.000Z', now()),
         ($5, $7, $12, 30000.00,  35000.00,  15000.00,  0.300000, 0.00,     10000.00,  35000.00,  15000.00,  $13, '2026-08-10T00:00:00.000Z', now())`,
      [
        tbConc1,
        tbConc2,
        tbRebar1,
        tbMob1,
        tbForeign,
        p1,
        pForeign,
        plConcP1,
        plConcP2,
        plRebarP1,
        plMobP1,
        plForeign1,
        s.f.ids.a,
      ]
    );

    // Subcontractor, SubcontractPackage (40k base + 10k approved SVO = 50k revised commitment on boqRebar),
    // Child JobOrder (30k within 50k ceiling — must NOT double-count!), SubcontractBilling (25k incurred), PaymentRecords (15k paid <= cutoff, 5k future > cutoff)
    await admin.query(
      `INSERT INTO "Subcontractor"(id, name, "businessType", accreditation, "contactPerson", "contactNumber", "updatedAt")
       VALUES ($1, 'Synthetic Rebar Subcon Corp', 'CORPORATION', 'APPROVED', 'Engr. Cruz', '09170000000', now())`,
      [subconEntity]
    );
    await admin.query(
      `INSERT INTO "SubcontractPackage"(id, "packageNumber", "projectId", "subcontractorId", "awardedBoqItemId", "workCategory", "contractType", "scopeOfWork", location, quantity, unit, "unitCost", "contractAmount", "costType", "paymentTerms", "targetCompletion", status, "updatedAt")
       VALUES
         ($1, $3, $5, $7, $8, 'STRUCTURAL', 'LABOR_ONLY', 'Rebar cutting & installation', 'BLDG-A', 2000, 'kg', 20, 40000, 'DIRECT', 'PROGRESS', '2026-10-20T00:00:00.000Z', 'APPROVED', now()),
         ($2, $4, $6, $7, $9, 'CIVIL',      'LABOR_ONLY', 'Foreign subcon scope',         'FOR',    10,   'm3', 1000, 10000, 'DIRECT', 'PROGRESS', '2026-10-20T00:00:00.000Z', 'APPROVED', now())`,
      [
        subPkgRebar,
        subPkgForeign,
        'SPKG-BC-' + hexId.toUpperCase(),
        'SPKG-FOR-' + hexId.toUpperCase(),
        p1,
        pForeign,
        subconEntity,
        boqRebar,
        boqForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "SubcontractorVariationOrder"(id, "svoNumber", "projectId", "originalSubcontractId", "originalSubcontractAmt", "proposedAdditionalAmt", "revisedSubcontractAmt", "approvalStatus", "approvedById", "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, $4, $7, $9,  40000, 10000, 50000, 'APPROVED', $11, $12, now()),
         ($2, $5, $7, $9,  50000, 25000, 75000, 'PENDING',  NULL,$12, now()),
         ($3, $6, $8, $10, 10000, 2000,  12000, 'APPROVED', $11, $13, now())`,
      [
        svoRebarApproved,
        svoRebarPending,
        svoForeign,
        'SVO-BC-APP-' + hexId.toUpperCase(),
        'SVO-BC-PND-' + hexId.toUpperCase(),
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
        'JO-BC-' + hexId.toUpperCase(),
        p1,
        subconEntity,
        subPkgRebar,
        boqRebar,
        s.f.ids.a,
      ]
    );

    await admin.query(
      `INSERT INTO "SubcontractAccomplishment"(id, "packageId", "jobOrderId", "workDescription", location, "prevPercent", "currentPercent", "cumulativePercent", "prevQty", "currentQty", "totalQty", "remainingQty", status, "updatedAt")
       VALUES
         ($1, $3, $5, 'Rebar 50% complete', 'BLDG-A', 0, 50, 50, 0, 1000, 1000, 1000, 'APPROVED', now()),
         ($2, $4, NULL,'Foreign subcon acc', 'FOR',    0, 50, 50, 0, 5,    5,    5,    'APPROVED', now())`,
      [subAccRebar, subAccForeign, subPkgRebar, subPkgForeign, joRebarChild]
    );

    const sbNumRebar = 'SBIL-BC-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "SubcontractBilling"(id, "billingNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", "contractAmount", "previousGross", "currentGross", "totalGross", "remainingBalance", "netPayable", "accountingStatus", "approvalStatus", "paymentStatus", status, "createdAt", "updatedAt")
       VALUES
         ($1, $3, $5, $7, $8,  $10, 50000, 0, 25000, 25000, 25000, 22500, 'REVIEWED', 'APPROVED', 'PENDING', 'APPROVED_FOR_PAYMENT', '2026-09-18T00:00:00.000Z', now()),
         ($2, $4, $6, $7, $9,  NULL,12000, 0, 6000,  6000,  6000,  5400,  'REVIEWED', 'APPROVED', 'PAID',    'PAID',                 '2026-09-18T00:00:00.000Z', now())`,
      [
        sbRebar1,
        sbForeign,
        sbNumRebar,
        'SBIL-FOR-' + hexId.toUpperCase(),
        p1,
        pForeign,
        subconEntity,
        subPkgRebar,
        subPkgForeign,
        joRebarChild,
      ]
    );

    await admin.query(
      `INSERT INTO "PaymentRecord"(id, "billingId", "amountPaid", "paymentDate", method, "referenceNumber", "updatedAt")
       VALUES
         ($1, $4, 15000.00, '2026-09-20T00:00:00.000Z', 'BANK_TRANSFER', 'SUBPAY-001',     now()),
         ($2, $4, 5000.00,  '2027-04-01T00:00:00.000Z', 'BANK_TRANSFER', 'SUBPAY-FUT-001', now()),
         ($3, $5, 5400.00,  '2026-09-20T00:00:00.000Z', 'BANK_TRANSFER', 'SUBPAY-FOR-001', now())`,
      [prRebarPaid, prRebarFuture, prForeign, sbRebar1, sbForeign]
    );

    // Client & Subcon VariationOrder records (prove Client VO +20m3 increases Awarded revenue to 820,000 Ex-VAT while Subcon VO never touches revenue!)
    await admin.query(
      `INSERT INTO "VariationOrder"(id, "voNumber", "variationType", "currentStatus", "subcontractPackageId", "projectId", "approvedForBilling", "updatedAt")
       VALUES
         ($1, $4, 'ADDITIVE', 'APPROVED', NULL, $7, true,  now()),
         ($2, $5, 'ADDITIVE', 'DRAFT',    NULL, $7, false, now()),
         ($3, $6, 'ADDITIVE', 'APPROVED', $8,   $7, false, now())`,
      [
        voClientApproved,
        voClientDraft,
        voSubconApproved,
        'CVO-BC-APP-' + hexId.toUpperCase(),
        'CVO-BC-DRF-' + hexId.toUpperCase(),
        'SVO-VO-APP-' + hexId.toUpperCase(),
        p1,
        subPkgRebar,
      ]
    );
    await admin.query(
      `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "currentProposedQuantity", "revisedQuantity", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
       VALUES
         ($1, 'VOI-1', 'ADDITIONAL_QTY', 'Client VO +20m3 Concrete', 'm3', 100, 20, 120, 'APPROVED', $4, $7, now()),
         ($2, 'VOI-2', 'ADDITIONAL_QTY', 'Draft VO +50m3 Concrete',  'm3', 120, 50, 170, 'PENDING',  $5, $7, now()),
         ($3, 'VOI-3', 'ADDITIONAL_QTY', 'Subcon VO +30m3 Concrete', 'm3', 100, 30, 130, 'APPROVED', $6, $7, now())`,
      [
        voiClientApproved,
        voiClientDraft,
        voiSubconApproved,
        voClientApproved,
        voClientDraft,
        voSubconApproved,
        boqConc,
      ]
    );

    // Accomplishments & Inspections (T5 + T10 Earned Value)
    await admin.query(
      `INSERT INTO "Accomplishment"(id, "billingPeriod", "accomplishmentDate", "preparedById", status, "approvedAmount", "projectId", "updatedAt")
       VALUES ($1, 'SWA-2026-09', '2026-09-15T00:00:00.000Z', $2, 'APPROVED', 431700.00, $3, now())`,
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

    // Billings & Payments (p1 + pCorp)
    await admin.query(
      `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
       VALUES
         ($1, $4, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 792000, 918400, 363000, 'APPROVED_FOR_PAYMENT', $7, $7, $8, now()),
         ($2, $5, '2026-10-01T00:00:00.000Z', '2026-10-15T00:00:00.000Z', '2026-10-16T00:00:00.000Z', 'PROGRESS', 792000, 918400, 150000, 'APPROVED',             $7, $7, $8, now()),
         ($3, $6, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED',             $7, $7, $9, now())`,
      [
        bilGovApproved,
        bilGovUncollected,
        bilCorpApproved,
        'PB-BC-GOV1-' + hexId.toUpperCase(),
        'PB-BC-GOV2-' + hexId.toUpperCase(),
        'PB-BC-CORP-' + hexId.toUpperCase(),
        s.f.ids.a,
        p1,
        pCorp,
      ]
    );
    await admin.query(
      `INSERT INTO "BillingItem"(id, "contractQuantity", "unitCost", "contractAmount", "previousQuantityBilled", "currentQuantityForBilling", "totalQuantityBilledToDate", "billingId", "boqItemId")
       VALUES
         ($1, 120,  6320,  758400, 0.0000, 50.0000,   50.0000,   $5, $7),
         ($2, 2000, 55,    110000, 0.0000, 800.0000,  800.0000,  $5, $8),
         ($3, 1,    50000, 50000,  0.0000, 0.5000,    0.5000,    $5, $9),
         ($4, 40,   5000,  200000, 0.0000, 20.0000,   20.0000,   $6, $10)`,
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
       VALUES ($1, 339500, 33950, 21218.75, 36375.00, 50925.00, 0.00, 233406.25, $2)`,
      [bdGov, bilGovApproved]
    );

    // Client Payments: 200,000 PAID on 2026-09-20 (<= cutoff), 48,062.50 PENDING (excluded), 99,000 PAID on 2027-02-15 (> cutoff, excluded!)
    await admin.query(
      `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
       VALUES
         ($1, 363000, 363000, 233406.25, 200000.00, '2026-09-20T00:00:00.000Z', 'OR-GOV-001',     'PAID',    $5, now()),
         ($2, 363000, 363000, 233406.25, 48062.50,  '2026-09-25T00:00:00.000Z', 'CHK-PND-001',    'PENDING', $5, now()),
         ($3, 363000, 363000, 233406.25, 99000.00,  '2027-02-15T00:00:00.000Z', 'OR-GOV-FUT-001', 'PAID',    $5, now()),
         ($4, 100000, 100000, 90000.00,  80000.00,  '2026-09-22T00:00:00.000Z', 'OR-CORP-001',    'PAID',    $6, now())`,
      [payGovCleared, payGovPending, payGovFuture, payCorpCleared, bilGovApproved, bilCorpApproved]
    );

    // Schedules on p1 (T7 + T10 PV) and pCorp (Baseline-Schedule-Derived Cash Flow Fallback!)
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
         ($1, $6, $8,  'ACT-100',  'Site Mobilization & Layout',     '2026-09-01T00:00:00.000Z', '2026-09-07T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-07T00:00:00.000Z', 5,  1,    'lot', 50000.00,  'COMPLETED',   now()),
         ($2, $6, $8,  'ACT-200',  'Structural Concrete Phase 1',    '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 40,   'm3',  248000.00, 'IN_PROGRESS', now()),
         ($3, $6, $8,  'ACT-300',  'Reinforcing Steel Fabrication',  '2026-09-05T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 4,  2000, 'kg',  110000.00, 'IN_PROGRESS', now()),
         ($4, $7, NULL,'CORP-100', 'Corp Slab Excavation & Pour',    '2026-09-01T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 15, 20,   'm3',  100000.00, 'COMPLETED',   now()),
         ($5, $7, NULL,'CORP-200', 'Corp Slab Finishing',            '2026-09-26T00:00:00.000Z', '2026-10-20T00:00:00.000Z', '2026-09-26T00:00:00.000Z', '2026-10-20T00:00:00.000Z', 15, 20,   'm3',  100000.00, 'IN_PROGRESS', now())`,
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
         ($2, $5, $8, 40.0000,   100.000000),
         ($3, $6, $9, 2000.0000, 100.000000)`,
      [ulnk1, ulnk2, ulnk3, plMobP1, plConcP1, plRebarP1, act100, act200, act300]
    );
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $4, $5, '2026-09-15T00:00:00.000Z', 100, 1,    $8, $9),
         ($2, $4, $6, '2026-09-15T00:00:00.000Z', 60,  24,   $8, $9),
         ($3, $4, $7, '2026-09-15T00:00:00.000Z', 50,  1000, $8, $9)`,
      [spu100, spu200, spu300, schedBaseline, act100, act200, act300, s.f.ids.a, accApproved]
    );

    // Procurement: Supplier, MR, Approved PO (100k Ex-VAT / 112k Gross), Draft PO (ignored), Deliveries & 3 APs (60k paid, 20k unpaid, 10k future-paid > cutoff)
    await admin.query(
      `INSERT INTO "Supplier"(id, name, "isVatable", "updatedAt")
       VALUES ($1, 'Holcim Synthetic Cement Corp', true, now())`,
      [supplier1]
    );
    await admin.query(
      `INSERT INTO "MaterialRequest"(id, "mrNumber", status, "projectId", "requesterId", "approverId", "updatedAt")
       VALUES ($1, $2, 'APPROVED', $3, $4, $4, now())`,
      [mr1, 'MR-BC-' + hexId.toUpperCase(), p1, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "MaterialRequestItem"(id, quantity, "approvedQuantity", "mrId", "consolidatedBoqItemId", "canonicalResourceId", "uboqResourceRequirementId")
       VALUES ($1, 500, 500, $2, $3, $4, $5)`,
      [mriCement, mr1, cboqConc, acctCement, prrCement]
    );

    const poCementNo = 'PO-BC-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "PurchaseOrder"(id, "poNumber", status, "supplierId", "mrId", "totalAmount", "netAmount", "vatAmount", "dueDate", "approverId", "approvedAt", "createdAt", "updatedAt")
       VALUES
         ($1, $3, 'APPROVED', $5, $6, 112000.00, 100000.00, 12000.00, '2026-10-10T00:00:00.000Z', $7, '2026-09-05T00:00:00.000Z', '2026-09-05T00:00:00.000Z', now()),
         ($2, $4, 'DRAFT',    $5, $6, 560000.00, 500000.00, 60000.00, '2026-10-20T00:00:00.000Z', NULL, NULL,                      '2026-09-06T00:00:00.000Z', now())`,
      [
        poCement,
        poDraftIgnored,
        poCementNo,
        'PO-DRF-' + hexId.toUpperCase(),
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
         ($1, 'DR-BC-1', '2026-09-10T00:00:00.000Z', 'RECEIVED', $4, now()),
         ($2, 'DR-BC-2', '2026-09-20T00:00:00.000Z', 'RECEIVED', $4, now()),
         ($3, 'DR-BC-3', '2026-09-25T00:00:00.000Z', 'RECEIVED', $4, now())`,
      [deliv1, deliv2, deliv3, poCement]
    );

    const apPaidVoucher = 'APV-PAID-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "AccountsPayable"(id, amount, "dueDate", status, "paidAt", "paidAmount", "netAmount", "vatAmount", "deliveryId", "poId", "supplierId", "voucherNumber", "createdAt", "updatedAt")
       VALUES
         ($1, 67200.00, '2026-09-25T00:00:00.000Z', 'PAID',     '2026-09-12T00:00:00.000Z', 67200.00, 60000.00, 7200.00, $4, $7, $8, $9,  '2026-09-10T00:00:00.000Z', now()),
         ($2, 22400.00, '2026-10-10T00:00:00.000Z', 'APPROVED', NULL,                       0.00,     20000.00, 2400.00, $5, $7, $8, $10, '2026-09-20T00:00:00.000Z', now()),
         ($3, 11200.00, '2026-10-25T00:00:00.000Z', 'PAID',     '2027-03-15T00:00:00.000Z', 11200.00, 10000.00, 1200.00, $6, $7, $8, $11, '2026-09-25T00:00:00.000Z', now())`,
      [
        apCementPaid,
        apCementUnpaid,
        apCementFuturePaid,
        deliv1,
        deliv2,
        deliv3,
        poCement,
        supplier1,
        apPaidVoucher,
        'APV-UNP-' + hexId.toUpperCase(),
        'APV-FUT-' + hexId.toUpperCase(),
      ]
    );

    // Direct Expenses (8,000 Ex-VAT paid + 4,000 Ex-VAT accrued unpaid; plus 50,000 DRAFT ignored)
    const expPaidRef = 'OR-EXP-MOB-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "Expense"(id, amount, date, category, description, "receiptRef", "isAccrued", "netAmount", "vatAmount", status, "approvalStatus", "projectId", "loggedById", "approverId", "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, 8960.00,  '2026-09-10T00:00:00.000Z', 'SITE_SUPPLIES', 'Temporary power & water setup', $4,   false, 8000.00,  960.00,  'APPROVED', 'APPROVED', $5, $6, $6, $7, now()),
         ($2, 4000.00,  '2026-09-22T00:00:00.000Z', 'EQUIPMENT',     'Accrued crane rental',          'ACCR-01', true, 4000.00, 0.00, 'APPROVED', 'APPROVED', $5, $6, $6, $7, now()),
         ($3, 50000.00, '2026-09-25T00:00:00.000Z', 'OTHER',         'Unapproved draft expense',      NULL, false, 50000.00, 0.00,  'DRAFT',    'PENDING',  $5, $6, NULL, $7, now())`,
      [expMobPaid, expMobAccrued, expDraftIgnored, expPaidRef, p1, s.f.ids.a, boqMob]
    );

    // Worker + PayrollPeriod + Payroll (20,000 total employer cost released 2026-09-15, mirrored by pclMirrorPayroll!)
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

    // Mirrored CommitmentLedger rows (must be deduplicated against poCement=100k & subPkgRebar=50k!) + foreign row
    await admin.query(
      `INSERT INTO "CommitmentLedger"(id, "projectId", "commitmentType", "supplierName", "subcontractorName", "approvedAmount", "billedAmount", "paidAmount", "remainingCommitment", status, "consolidatedBoqItemId", "awardedBoqItemId", "createdAt", "updatedAt")
       VALUES
         ($1, $4, 'PURCHASE_ORDER', 'Holcim Synthetic Cement Corp', NULL,                           100000.00, 60000.00, 60000.00, 40000.00, 'ACTIVE', $6,   NULL, '2026-09-05T00:00:00.000Z', now()),
         ($2, $4, 'SUBCONTRACT',    NULL,                           'Synthetic Rebar Subcon Corp',  50000.00,  25000.00, 15000.00, 25000.00, 'ACTIVE', NULL, $7,   '2026-09-06T00:00:00.000Z', now()),
         ($3, $5, 'PURCHASE_ORDER', 'Foreign Supplier',             NULL,                           30000.00,  10000.00, 10000.00, 20000.00, 'ACTIVE', NULL, $8,   '2026-09-05T00:00:00.000Z', now())`,
      [clMirrorPoCement, clMirrorSubPkg, clForeign, p1, pForeign, cboqConc, boqRebar, boqForeign]
    );

    // Mirrored ProjectCostLedger rows (all 4 on p1 mirror operational records and MUST be deduplicated once!) + pCorp, pPeza, pForeign
    await admin.query(
      `INSERT INTO "ProjectCostLedger"(id, "projectId", "costDate", "costCategory", "referenceDocumentType", "referenceDocumentNo", "grossAmount", "vatAmount", "netAmount", "paidAmount", "unpaidBalance", "paymentStatus", "approvalStatus", "consolidatedBoqItemId", "awardedBoqItemId", "poItemId", "updatedAt")
       VALUES
         ($1, $9,  '2026-09-12T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     $13, 67200.00, 7200.00, 60000.00, 67200.00, 0.00,     'PAID',   'APPROVED', $17,  NULL, $22,  now()),
         ($2, $9,  '2026-09-18T00:00:00.000Z', 'SUBCON',   'SUBCON_BILLING', $14, 25000.00, 0.00,    25000.00, 15000.00, 10000.00, 'PAID',   'APPROVED', NULL, $18,  NULL, now()),
         ($3, $9,  '2026-09-10T00:00:00.000Z', 'EXPENSE',  'OR_RECEIPT',     $15, 8960.00,  960.00,  8000.00,  8960.00,  0.00,     'PAID',   'APPROVED', NULL, $19,  NULL, now()),
         ($4, $9,  '2026-09-15T00:00:00.000Z', 'PAYROLL',  'PAYROLL_BATCH',  $16, 20000.00, 0.00,    20000.00, 20000.00, 0.00,     'PAID',   'APPROVED', NULL, NULL, NULL, now()),
         ($5, $9,  '2026-09-16T00:00:00.000Z', 'MATERIAL', 'PENDING_DOC',    'PND-99', 99999.00, 0.00, 99999.00, 0.00,   99999.00, 'UNPAID', 'PENDING',  NULL, $18,  NULL, now()),
         ($6, $10, '2026-09-14T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     'CORP-AP-1', 56000.00, 6000.00, 50000.00, 56000.00, 0.00, 'PAID', 'APPROVED', NULL, $20, NULL, now()),
         ($7, $11, '2026-09-14T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     'PEZA-AP-1', 50000.00, 0.00,    50000.00, 50000.00, 0.00, 'PAID', 'APPROVED', NULL, $21, NULL, now()),
         ($8, $12, '2026-09-12T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     'FOR-AP-1',  20000.00, 0.00,    20000.00, 20000.00, 0.00, 'PAID', 'APPROVED', NULL, $23, NULL, now())`,
      [
        pclMirrorPoCement,
        pclMirrorSbRebar,
        pclMirrorExpMob,
        pclMirrorPayroll,
        pclPendingIgnored,
        pclCorpApproved,
        pclPezaApproved,
        pclForeign,
        p1,
        pCorp,
        pPeza,
        pForeign,
        apPaidVoucher,
        sbNumRebar,
        expPaidRef,
        payBatchNo,
        cboqConc,
        boqRebar,
        boqMob,
        boqCorp,
        boqPeza,
        poiCement,
        boqForeign,
      ]
    );

    // Persisted UboqCashFlowPeriod rows on p1 (6 contiguous half-month periods across 2026-Q3 and 2026-Q4; sum PV = 918,399.97 -> +0.03 rounding delta vs 918,400.00!)
    await admin.query(
      `INSERT INTO "UboqCashFlowPeriod"(
         id, "projectId", "snapshotId", "periodType", "periodIndex", "periodLabel", "quarterLabel",
         "periodStart", "periodEnd", "plannedValueWeightAmt", "procurementCashOutAmt", "payrollSubconCashOutAmt", "otherCashOutAmt"
       )
       VALUES
         ($1, $8,  $10, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 150000.00, 90000.00, 60000.00, 15000.00),
         ($2, $8,  $10, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-16T00:00:00.000Z', '2026-09-30T23:59:59.999Z', 200000.00, 80000.00, 55000.00, 10000.00),
         ($3, $8,  $10, 'HALF_MONTH', 3, '2026-10-H1', '2026-Q4', '2026-10-01T00:00:00.000Z', '2026-10-15T23:59:59.999Z', 200000.00, 70000.00, 50000.00, 10000.00),
         ($4, $8,  $10, 'HALF_MONTH', 4, '2026-10-H2', '2026-Q4', '2026-10-16T00:00:00.000Z', '2026-10-31T23:59:59.999Z', 150000.00, 50000.00, 40000.00, 8000.00),
         ($5, $8,  $10, 'HALF_MONTH', 5, '2026-11-H1', '2026-Q4', '2026-11-01T00:00:00.000Z', '2026-11-15T23:59:59.999Z', 118400.00, 40000.00, 30000.00, 5000.00),
         ($6, $8,  $10, 'HALF_MONTH', 6, '2026-11-H2', '2026-Q4', '2026-11-16T00:00:00.000Z', '2026-11-30T23:59:59.999Z', 99999.97,  30000.00, 20000.00, 5000.00),
         ($7, $9,  $11, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 50000.00,  20000.00, 10000.00, 2000.00)`,
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

  // ==========================================================================
  // CHECK 1: Preserved Template IDs (T0–T10 Active, T11–T12 Gated) & Formal Compliance Boundary
  // ==========================================================================
  await check(
    'WP3-BC-01 Preserved template IDs (T0-T10 active, T11-T12 gated) and strict non-statutory boundary on T8/T9/T10',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const wRes = await getWorking(p1);
      assert.equal(wRes.status, 200);
      const wBody = await wRes.json();
      const codes = wBody.templates.map((t: any) => t.code);
      assert.deepEqual(codes, [
        'T0_MASTER_CONTRACT',
        'T1_PHASE_BOQ',
        'T2_CONSOLIDATED_BOQ',
        'T3_AGENCY_ESTIMATE',
        'T4_RESOURCE_TAKEOFF',
        'T5_ACCOMPLISHMENT_CERT',
        'T6_PROGRESS_BILLING',
        'T7_SCHEDULE_EVM',
        'T8_CASHFLOW_HALF_MONTH',
        'T9_CASHFLOW_QUARTERLY',
        'T10_EXECUTIVE_MARGIN',
      ]);

      for (const tc of ['T8_CASHFLOW_HALF_MONTH', 'T9_CASHFLOW_QUARTERLY', 'T10_EXECUTIVE_MARGIN']) {
        const tpl = wBody.templates.find((t: any) => t.code === tc);
        assert.ok(tpl, `Missing ${tc} in catalog`);
        assert.equal(tpl.sources.length, 1);
        assert.equal(tpl.sources[0].id, snap1);

        const fReject = await postFormal({
          projectId: p1,
          templateCode: tc,
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(fReject.status, 400);
        assert.equal((await fReject.json()).error, 'FORMAL_TEMPLATE_CODE_NOT_SUPPORTED');
      }

      for (const gated of ['T11_VARIATION_IMPACT', 'T12_FINAL_RECONCILIATION']) {
        const gRes = await postWorking({
          projectId: p1,
          templateCode: gated,
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(gRes.status, 400);
        assert.equal((await gRes.json()).error, 'TEMPLATE_CODE_NOT_IN_INCREMENT');
      }

      const fCatRes = await getFormal(p1);
      assert.equal(fCatRes.status, 200);
      const fCat = await fCatRes.json();
      assert.deepEqual(
        fCat.contracts.map((t: any) => t.templateCode),
        [
          'T0_MASTER_CONTRACT',
          'T1_PHASE_BOQ',
          'T4_RESOURCE_TAKEOFF',
          'T5_ACCOMPLISHMENT_CERT',
          'T6_PROGRESS_BILLING',
        ]
      );

      return { activeTemplates: codes, formalContractsCount: fCat.contracts.length };
    }
  );

  // ==========================================================================
  // CHECK 2: T8 & T9 Cash Flow Arithmetic, Unified Cutoff, NO_SUM Rollups, Fallback & Fail-Closed Guards
  // ==========================================================================
  await check(
    'WP3-BC-02 T8 & T9 cash-flow forecast vs actual cash, unified cutoff exclusion, NO_SUM quarterly closing/gap, schedule fallback, and 409 guards',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 1. T8_CASHFLOW_HALF_MONTH on p1 (persisted 6 half-months across 2026-Q3 and 2026-Q4)
      const t8Res = await postWorking({
        projectId: p1,
        templateCode: 'T8_CASHFLOW_HALF_MONTH',
        sourceId: snap1,
        format: 'json',
        selectedFields: [
          'cash_quarter_label',
          'cash_period_start',
          'cash_period_end',
          'planned_value_weight_amt',
          'expected_billings_amt',
          'forecast_receipts_amt',
          'procurement_cash_out_amt',
          'payroll_subcon_cash_out_amt',
          'other_cash_out_amt',
          'actual_cash_receipts_amt',
          'actual_cash_paid_amt',
        ],
      });
      assert.equal(t8Res.status, 200);
      const t8 = await t8Res.json();
      assert.equal(t8.rowCount, 6);
      assert.equal(t8.approvedLineTotal, null);
      assert.equal(t8.summaryTotal.fieldId, 'forecast_receipts_amt');
      assert.ok(t8.cashFlowSummary);
      assert.equal(t8.cashFlowSummary.scheduleSourceBasis, 'PERSISTED_CASHFLOW_PERIODS');
      assert.equal(t8.cashFlowSummary.explicitRoundingDelta, '0.03');

      // Verify period PV weights were NOT mutated by +0.03 rounding delta
      assert.equal(t8.projection.projectedRows[5].visible.planned_value_weight_amt, '99999.97');

      // Verify unified cutoff & actual cash vs uncollected billing separation:
      // - Client actual cash receipts: ONLY payGovCleared (200,000.00 on 2026-09-20 -> 2026-09-H2);
      //   payGovPending (48,062.50), payGovFuture (99,000.00 in 2027), and bilGovUncollected (150,000.00) are EXCLUDED!
      assert.equal(t8.cashFlowSummary.actualCashReceiptsTotal, '200000.00');
      assert.equal(t8.projection.projectedRows[0].visible.actual_cash_receipts_amt, '0.00');
      assert.equal(t8.projection.projectedRows[1].visible.actual_cash_receipts_amt, '200000.00');

      // - Actual cash paid (<= cutoff, deduplicated across operational + mirrored ProjectCostLedger!):
      //   2026-09-H1 (Sep 1..15): apCementPaid (67,200.00 gross) + expMobPaid (8,960.00 gross) + payrollRow1 (20,000.00) = 96,160.00
      //   2026-09-H2 (Sep 16..30): prRebarPaid (15,000.00 gross) = 15,000.00
      //   apCementFuturePaid (11,200 in 2027), prRebarFuture (5,000 in 2027), apCementUnpaid (22,400 unpaid), expMobAccrued (4,000 accrued) are EXCLUDED!
      assert.equal(t8.projection.projectedRows[0].visible.actual_cash_paid_amt, '96160.00');
      assert.equal(t8.projection.projectedRows[1].visible.actual_cash_paid_amt, '15000.00');
      assert.equal(t8.cashFlowSummary.actualCashPaidTotal, '111160.00');

      // 2. T9_CASHFLOW_QUARTERLY on p1: prove NO_SUM rules on quarterly_closing_cash & quarterly_liquidity_gap!
      const t9Res = await postWorking({
        projectId: p1,
        templateCode: 'T9_CASHFLOW_QUARTERLY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t9Res.status, 200);
      const t9 = await t9Res.json();
      assert.equal(t9.rowCount, 2);
      assert.equal(t9.approvedLineTotal, null);
      assert.equal(t9.summaryTotal.fieldId, 'forecast_receipts_amt');
      assert.equal(t9.summaryTotal.amount, t8.summaryTotal.amount);

      const q3Row = t9.projection.projectedRows[0].visible;
      const q4Row = t9.projection.projectedRows[1].visible;
      assert.equal(q3Row.cash_quarter_label, '2026-Q3');
      assert.equal(q4Row.cash_quarter_label, '2026-Q4');

      const h1Closing = String(t8.projection.projectedRows[0].__oserpMeta.closing_cash_amt);
      const h2Closing = String(t8.projection.projectedRows[1].__oserpMeta.closing_cash_amt);
      const h6Closing = String(t8.projection.projectedRows[5].__oserpMeta.closing_cash_amt);

      // NO_SUM Proof 1: Q3 closing cash MUST equal 2026-09-H2 closing_cash_amt, NOT H1 + H2!
      assert.equal(q3Row.quarterly_closing_cash, h2Closing);
      assert.notEqual(
        Number(q3Row.quarterly_closing_cash),
        Number(h1Closing) + Number(h2Closing)
      );
      // Q4 closing cash MUST equal 2026-11-H2 closing_cash_amt (H6), NOT sum of H3..H6!
      assert.equal(q4Row.quarterly_closing_cash, h6Closing);
      assert.equal(t9.cashFlowSummary.endingClosingCash, h6Closing);

      // NO_SUM Proof 2: quarterly_liquidity_gap MUST equal peak deficit (max liquidity_gap_amt in quarter), NOT sum!
      const expectedQ3PeakGap = Math.max(
        Number(t8.projection.projectedRows[0].__oserpMeta.liquidity_gap_amt),
        Number(t8.projection.projectedRows[1].__oserpMeta.liquidity_gap_amt)
      ).toFixed(2);
      assert.equal(q3Row.quarterly_liquidity_gap, expectedQ3PeakGap);

      // 3. Baseline-Schedule-Derived Cash Flow Fallback on pCorp (no UboqCashFlowPeriod rows, uses schedCorpBaseline!)
      const t8CorpRes = await postWorking({
        projectId: pCorp,
        templateCode: 'T8_CASHFLOW_HALF_MONTH',
        sourceId: snapCorp,
        format: 'json',
      });
      assert.equal(t8CorpRes.status, 200);
      const t8Corp = await t8CorpRes.json();
      assert.equal(t8Corp.cashFlowSummary.scheduleSourceBasis, 'BASELINE_SCHEDULE_DERIVED');
      assert.ok(t8Corp.rowCount >= 3);
      assert.equal(t8Corp.cashFlowSummary.actualCashReceiptsTotal, '80000.00');

      // 4. Fail-closed 409: Missing both UboqCashFlowPeriod and baseline ProjectSchedule on pNoCf
      const noCfRes = await postWorking({
        projectId: pNoCf,
        templateCode: 'T8_CASHFLOW_HALF_MONTH',
        sourceId: snapNoCf,
        format: 'json',
      });
      assert.equal(noCfRes.status, 409);
      assert.equal((await noCfRes.json()).error, 'TEMPLATE_CASHFLOW_SOURCE_INCOMPLETE');

      // 5. Fail-closed 409: Overlapping UboqCashFlowPeriod dates on pNoCf
      const ov1 = prefix + '-CFP-OV1';
      const ov2 = prefix + '-CFP-OV2';
      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqCashFlowPeriod"(id, "projectId", "snapshotId", "periodType", "periodIndex", "periodLabel", "quarterLabel", "periodStart", "periodEnd", "plannedValueWeightAmt")
             VALUES
               ($1, $3, $4, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-18T00:00:00.000Z', 25000.00),
               ($2, $3, $4, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-15T00:00:00.000Z', '2026-09-30T00:00:00.000Z', 25000.00)`,
            [ov1, ov2, pNoCf, snapNoCf]
          );
        });
        const ovRes = await postWorking({
          projectId: pNoCf,
          templateCode: 'T9_CASHFLOW_QUARTERLY',
          sourceId: snapNoCf,
          format: 'json',
        });
        assert.equal(ovRes.status, 409);
        assert.equal((await ovRes.json()).error, 'TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID');
      } finally {
        await admin.query(`DELETE FROM "UboqCashFlowPeriod" WHERE id = ANY($1::text[])`, [
          [ov1, ov2],
        ]);
      }

      // 6. Fail-closed 409: Duplicate payment reference number on Billing
      const dupPayId = prefix + '-PAY-DUP';
      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
             VALUES ($1, 363000, 363000, 233406.25, 10000.00, '2026-09-21T00:00:00.000Z', 'OR-GOV-001', 'PAID', $2, now())`,
            [dupPayId, bilGovApproved]
          );
        });
        const dupRes = await postWorking({
          projectId: p1,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(dupRes.status, 409);
        assert.equal((await dupRes.json()).error, 'TEMPLATE_DUPLICATE_COLLECTION_REFERENCE');
      } finally {
        await admin.query(`DELETE FROM "Payment" WHERE id = $1`, [dupPayId]);
      }

      return {
        t8RowCount: t8.rowCount,
        t9RowCount: t9.rowCount,
        explicitRoundingDelta: t8.cashFlowSummary.explicitRoundingDelta,
        actualCashReceiptsTotal: t8.cashFlowSummary.actualCashReceiptsTotal,
        actualCashPaidTotal: t8.cashFlowSummary.actualCashPaidTotal,
        q3ClosingCashNoSum: q3Row.quarterly_closing_cash,
        q4ClosingCashNoSum: q4Row.quarterly_closing_cash,
      };
    }
  );

  // ==========================================================================
  // CHECK 3: T10 Cost Commitment Lifecycle Separation, Anti-Double-Counting, Ex-VAT Five-Baseline & Fail-Closed 409s
  // ==========================================================================
  await check(
    'WP3-BC-03 T10 cost commitment lifecycle separation, anti-double-counting across PO/AP/Subcon/CostLedger/CommitmentLedger, Ex-VAT multi-tax normalization, and 409 conflict guards',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      const t10Res = await postWorking({
        projectId: p1,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t10Res.status, 200);
      const t10 = await t10Res.json();
      assert.equal(t10.rowCount, 4);
      assert.equal(t10.approvedLineTotal, null);
      assert.equal(t10.summaryTotal.fieldId, 'forecast_profit');

      const exec = t10.executiveMarginSummary;
      assert.ok(exec);

      // 1. Verify Awarded BOQ Ex-VAT revenue includes Approved Client VO (+20 m3) and NEVER Subcontractor VO (+10k / +30m3):
      //    plConcP1: 48 * 6200 = 297,600 / 1.12 = 265,714.29
      //    plConcP2: 72 * 6400 = 460,800 / 1.12 = 411,428.57
      //    plRebarP1: 2000 * 55 = 110,000 / 1.12 = 98,214.29
      //    plMobP1: 1 * 50000 = 50,000 / 1.12 = 44,642.86
      //    Sum = 820,000.01
      assert.equal(exec.awardedContractTotalExVat, '820000.01');

      // 2. Verify Exact Commitment & Cost Lifecycle Separation + Mirror Deduplication:
      //    - Committed Total Ex-VAT: poCement (100,000) + subPkgRebar w/ approved SVO (50,000) = 150,000.00
      //      (joRebarChild 30k, clMirrorPoCement 100k, clMirrorSubPkg 50k, poDraftIgnored 500k, svoRebarPending 25k NOT double-counted!)
      //    - Incurred Against Commitment Ex-VAT: apCementPaid (60k) + apCementUnpaid (20k) + apCementFuturePaid (10k) + sbRebar1 (25k) = 115,000.00
      //    - Open Commitment Ex-VAT: (100k - 90k) + (50k - 25k) = 35,000.00
      //    - Uncommitted Direct Incurred Ex-VAT: expMobPaid (8k) + expMobAccrued (4k) + payrollRow1 (20k) = 32,000.00
      //      (pclMirrorPoCement 60k, pclMirrorSbRebar 25k, pclMirrorExpMob 8k, pclMirrorPayroll 20k ALL deduplicated!)
      //    - Total Incurred Actual Cost Ex-VAT: 115,000.00 + 32,000.00 = 147,000.00
      //    - Paid Disbursed Ex-VAT (<= cutoff): apCementPaid (60k) + prRebarPaid (15k) + expMobPaid (8k) + payrollRow1 (20k) = 103,000.00
      //    - Unpaid Incurred Payable Ex-VAT: 147,000.00 - 103,000.00 = 44,000.00 (20k unpaid AP + 10k future-paid AP + 10k unpaid subcon billing + 4k accrued expense)
      //    - Outstanding Total Obligation Ex-VAT: 35,000.00 (open commitment) + 44,000.00 (unpaid payable) = 79,000.00
      assert.equal(exec.committedTotalExVat, '150000.00');
      assert.equal(exec.incurredAgainstCommitmentTotalExVat, '115000.00');
      assert.equal(exec.commitmentOpenTotalExVat, '35000.00');
      assert.equal(exec.uncommittedDirectIncurredTotalExVat, '32000.00');
      assert.equal(exec.incurredActualCostTotalExVat, '147000.00');
      assert.equal(exec.paidDisbursedTotalExVat, '103000.00');
      assert.equal(exec.unpaidIncurredPayableTotalExVat, '44000.00');
      assert.equal(exec.outstandingTotalObligationExVat, '79000.00');
      assert.equal(exec.deduplicatedMirrorCommitmentsCount, 3);
      assert.equal(exec.deduplicatedMirroredExpensesCount, 4);

      // 3. Verify Forecast EAC never double-counts expensed POs:
      //    forecastEacTotalExVat = incurredActualCost (147,000.00) + commitmentOpen (35,000.00) + etcUncommitted (90k + 140k + 18k + 5k = 253,000.00) = 435,000.00
      assert.equal(exec.forecastEacTotalExVat, '435000.00');
      assert.equal(exec.forecastProfitTotalExVat, '385000.01');

      // 4. Verify Corporate 12% VAT-exclusive (200k Ex-VAT, 50k Ex-VAT incurred from 56k gross) & PEZA 0% Zero-rated (200k Ex-VAT, 50k incurred)
      const corpRes = await postWorking({
        projectId: pCorp,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        sourceId: snapCorp,
        format: 'json',
      });
      assert.equal(corpRes.status, 200);
      const corpT10 = await corpRes.json();
      assert.equal(corpT10.executiveMarginSummary.awardedContractTotalExVat, '200000.00');
      assert.equal(corpT10.executiveMarginSummary.incurredActualCostTotalExVat, '50000.00');

      const pezaRes = await postWorking({
        projectId: pPeza,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        sourceId: snapPeza,
        format: 'json',
      });
      assert.equal(pezaRes.status, 200);
      const pezaT10 = await pezaRes.json();
      assert.equal(pezaT10.executiveMarginSummary.awardedContractTotalExVat, '200000.00');
      assert.equal(pezaT10.executiveMarginSummary.incurredActualCostTotalExVat, '50000.00');

      // 5. Negative 409: Child JobOrder exceeding parent SubcontractPackage revised commitment ceiling (30k + 35k = 65k > 50k)
      const joExceedId = prefix + '-JO-EXCEED';
      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "JobOrder"(id, "jobNumber", "projectId", "subcontractorId", "packageId", description, location, "contractAmount", "paymentBasis", "materialResponsibility", "approvedBy", status, "updatedAt")
             VALUES ($1, $2, $3, $4, $5, 'Over-ceiling JO', 'BLDG-A', 35000, 'PROGRESS', 'COMPANY_SUPPLIED', $6, 'APPROVED', now())`,
            [
              joExceedId,
              'JO-EXC-' + hexId.toUpperCase(),
              p1,
              subconEntity,
              subPkgRebar,
              s.f.ids.a,
            ]
          );
        });
        const excRes = await postWorking({
          projectId: p1,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(excRes.status, 409);
        assert.equal((await excRes.json()).error, 'TEMPLATE_SUBCONTRACT_COMMITMENT_EXCEEDED');
      } finally {
        await admin.query(`DELETE FROM "JobOrder" WHERE id = $1`, [joExceedId]);
      }

      // 6. Negative 409: Conflicting duplicate CommitmentLedger explicit reference
      const clDup1 = prefix + '-CL-DUP1';
      const clDup2 = prefix + '-CL-DUP2';
      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "CommitmentLedger"(id, "projectId", "commitmentType", "approvedAmount", status, "awardedBoqItemId", "createdAt", "updatedAt")
             VALUES
               ($1, $3, 'PO:DUP-REF-999', 10000.00, 'ACTIVE', $4, '2026-09-10T00:00:00.000Z', now()),
               ($2, $3, 'PO:DUP-REF-999', 15000.00, 'ACTIVE', $4, '2026-09-11T00:00:00.000Z', now())`,
            [clDup1, clDup2, p1, boqMob]
          );
        });
        const dupClRes = await postWorking({
          projectId: p1,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(dupClRes.status, 409);
        assert.equal((await dupClRes.json()).error, 'TEMPLATE_DUPLICATE_COMMITMENT_CONFLICT');
      } finally {
        await admin.query(`DELETE FROM "CommitmentLedger" WHERE id = ANY($1::text[])`, [
          [clDup1, clDup2],
        ]);
      }

      return {
        awardedContractTotalExVat: exec.awardedContractTotalExVat,
        committedTotalExVat: exec.committedTotalExVat,
        incurredAgainstCommitmentTotalExVat: exec.incurredAgainstCommitmentTotalExVat,
        uncommittedDirectIncurredTotalExVat: exec.uncommittedDirectIncurredTotalExVat,
        incurredActualCostTotalExVat: exec.incurredActualCostTotalExVat,
        paidDisbursedTotalExVat: exec.paidDisbursedTotalExVat,
        unpaidIncurredPayableTotalExVat: exec.unpaidIncurredPayableTotalExVat,
        outstandingTotalObligationExVat: exec.outstandingTotalObligationExVat,
        forecastEacTotalExVat: exec.forecastEacTotalExVat,
        deduplicatedMirrorCommitmentsCount: exec.deduplicatedMirrorCommitmentsCount,
        deduplicatedMirroredExpensesCount: exec.deduplicatedMirroredExpensesCount,
      };
    }
  );

  // ==========================================================================
  // CHECK 4: Executive RBAC, Role-Narrowing Redaction (JSON/CSV/XLSX/__OSERP_META) & SensitiveExportLog Audit
  // ==========================================================================
  await check(
    'WP3-BC-04 Executive RBAC, role-narrowing redaction across JSON/CSV/XLSX/__OSERP_META, shared-layout redaction, and SensitiveExportLog audit (approved + blocked)',
    async () => {
      // 1. FINANCE_DIRECTOR exports T10 XLSX -> verify __OSERP_META contains executive summary & SensitiveExportLog records approved=true, blocked=false
      actor = {
        userId: synthExecUser,
        email: `${synthExecUser.toLowerCase()}@synthetic.local`,
        role: 'FINANCE_DIRECTOR',
        sessionVersion: 7,
      };
      const execXlsxRes = await postWorking({
        projectId: p1,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(execXlsxRes.status, 200);
      const wbExec = new ExcelJS.Workbook();
      await wbExec.xlsx.load(Buffer.from(await execXlsxRes.arrayBuffer()));
      const execMetaSheet = wbExec.getWorksheet('__OSERP_META')!;
      assert.ok(execMetaSheet);
      const execMetaHeaders: string[] = [];
      execMetaSheet.getRow(1).eachCell((cell: any, colNum: number) => {
        execMetaHeaders[colNum] = String(cell.value ?? '');
      });
      assert.ok(execMetaHeaders.includes('committed_total_ex_vat'));
      assert.ok(execMetaHeaders.includes('paid_disbursed_ex_vat'));
      assert.ok(execMetaHeaders.includes('outstanding_total_obligation_ex_vat'));
      const committedColIdx = execMetaHeaders.indexOf('committed_total_ex_vat');
      let committedMetaSum = 0;
      for (let r = 2; r <= execMetaSheet.rowCount; r++) {
        committedMetaSum += Number(execMetaSheet.getRow(r).getCell(committedColIdx).value ?? 0);
      }
      assert.equal(committedMetaSum.toFixed(2), '150000.00');

      const approvedLogCount = (
        await admin.query(
          `SELECT count(*)::int AS cnt FROM "SensitiveExportLog" WHERE "projectId" = $1 AND "userId" = $2 AND approved = true AND blocked = false AND "exportType" = 'T10_EXECUTIVE_MARGIN:XLSX'`,
          [p1, synthExecUser]
        )
      ).rows[0].cnt;
      assert.ok(approvedLogCount >= 1, 'Expected approved SensitiveExportLog entry for FINANCE_DIRECTOR XLSX export');

      // 2. PROJECT_MANAGER explicitly requesting a sensitive column ('target_profit') -> 403 TEMPLATE_FIELD_FORBIDDEN + SensitiveExportLog blocked=true!
      actor = {
        userId: synthPmUser,
        email: `${synthPmUser.toLowerCase()}@synthetic.local`,
        role: 'PROJECT_MANAGER',
        sessionVersion: 7,
      };
      const pmBlockedRes = await postWorking({
        projectId: p1,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        sourceId: snap1,
        format: 'json',
        selectedFields: ['item_code', 'target_profit'],
      });
      assert.equal(pmBlockedRes.status, 403);
      assert.equal((await pmBlockedRes.json()).error, 'TEMPLATE_FIELD_FORBIDDEN');

      const blockedLogCount = (
        await admin.query(
          `SELECT count(*)::int AS cnt FROM "SensitiveExportLog" WHERE "projectId" = $1 AND "userId" = $2 AND approved = false AND blocked = true`,
          [p1, synthPmUser]
        )
      ).rows[0].cnt;
      assert.equal(blockedLogCount, 1);

      // 3. PROJECT_MANAGER default T10 JSON & XLSX projection -> strips ALL sensitive columns AND sensitive __OSERP_META keys!
      const pmDefaultRes = await postWorking({
        projectId: p1,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(pmDefaultRes.status, 200);
      const pmT10 = await pmDefaultRes.json();
      const pmColIds = pmT10.projection.visibleColumns.map((c: any) => c.fieldId);
      assert.ok(pmColIds.includes('contract_line_amount'));
      for (const sensCol of [
        'target_direct_cost_amt',
        'target_total_cost',
        'target_profit',
        'target_margin',
        'commitment_open_amt',
        'etc_uncommitted',
        'forecast_eac',
        'forecast_profit',
      ]) {
        assert.ok(!pmColIds.includes(sensCol), `Sensitive column ${sensCol} leaked to PROJECT_MANAGER`);
        assert.equal(pmT10.projection.projectedRows[0].visible[sensCol], undefined);
      }
      assert.equal(pmT10.projection.projectedRows[0].__oserpMeta.committed_total_ex_vat, undefined);
      assert.equal(pmT10.executiveMarginSummary.committedTotalExVat, null);
      assert.equal(pmT10.executiveMarginSummary.forecastEacTotalExVat, null);
      assert.equal(pmT10.executiveMarginSummary.forecastProfitTotalExVat, null);

      const pmXlsxRes = await postWorking({
        projectId: p1,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(pmXlsxRes.status, 200);
      const wbPm = new ExcelJS.Workbook();
      await wbPm.xlsx.load(Buffer.from(await pmXlsxRes.arrayBuffer()));
      const pmMetaHeaders = new Set<string>();
      wbPm.getWorksheet('__OSERP_META')!.getRow(1).eachCell((cell: any) => {
        pmMetaHeaders.add(String(cell.value ?? ''));
      });
      for (const sensMeta of [
        'committed_total_ex_vat',
        'incurred_against_commitment_ex_vat',
        'uncommitted_direct_incurred_ex_vat',
        'paid_disbursed_ex_vat',
        'unpaid_incurred_payable_ex_vat',
        'outstanding_total_obligation_ex_vat',
        'target_indirect_cost_ex_vat',
      ]) {
        assert.ok(!pmMetaHeaders.has(sensMeta), `Sensitive __OSERP_META header ${sensMeta} leaked to PM`);
      }

      // 4. Role-Narrowed FINANCE_DIRECTOR (assigned as PROJECT_MANAGER on p1) -> also stripped of all sensitive fields on T8/T9/T10!
      actor = {
        userId: synthNarrowedExecUser,
        role: 'FINANCE_DIRECTOR',
        sessionVersion: 7,
      };
      const narrowT9Res = await postWorking({
        projectId: p1,
        templateCode: 'T9_CASHFLOW_QUARTERLY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(narrowT9Res.status, 200);
      const narrowT9 = await narrowT9Res.json();
      const narrowT9Cols = narrowT9.projection.visibleColumns.map((c: any) => c.fieldId);
      assert.ok(!narrowT9Cols.includes('quarterly_closing_cash'));
      assert.ok(!narrowT9Cols.includes('quarterly_liquidity_gap'));
      assert.equal(narrowT9.cashFlowSummary.endingClosingCash, null);
      assert.equal(narrowT9.cashFlowSummary.peakLiquidityGap, null);

      // 5. SITE_ENGINEER & VIEWER redaction + Shared T10 Layout defense-in-depth redaction
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const createSharedRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T10_EXECUTIVE_MARGIN',
        templateName: 'Exec Shared Margin Board',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'item_code',
          'phase_code',
          'work_description',
          'contract_line_amount',
          'target_profit',
          'forecast_eac',
          'forecast_profit',
        ],
        headingAliases: {
          item_code: 'BOQ Item',
          target_profit: 'Board Confidential Target Profit',
          forecast_eac: 'Board Confidential EAC',
        },
        changeSummary: 'Initial executive margin layout',
      });
      assert.equal(createSharedRes.status, 201);
      const sharedRev = (await createSharedRes.json()).revision;

      // SITE_ENGINEER loads & previews the shared T10 layout -> restricted AND sensitive columns/aliases stripped!
      actor = { userId: synthSiteEngUser, role: 'SITE_ENGINEER', sessionVersion: 7 };
      const siteLoadRes = await getLayouts(`projectId=${p1}&layoutRevisionId=${sharedRev.id}`);
      assert.equal(siteLoadRes.status, 200);
      const siteLoaded = await siteLoadRes.json();
      assert.deepEqual(siteLoaded.revision.selectedFields, [
        'item_code',
        'phase_code',
        'work_description',
      ]);
      const loadedAliases = siteLoaded.revision.headingAliases ?? siteLoaded.revision.columnAliases ?? {};
      assert.equal(loadedAliases.target_profit, undefined);
      assert.equal(loadedAliases.forecast_eac, undefined);
      assert.ok(
        !JSON.stringify(siteLoaded.auditTrail).includes('target_profit'),
        'Audit trail leaked sensitive field to SITE_ENGINEER'
      );

      const sitePrevRes = await postLayouts({
        action: 'preview',
        projectId: p1,
        layoutRevisionId: sharedRev.id,
        sourceId: snap1,
      });
      assert.equal(sitePrevRes.status, 200);
      const sitePrev = await sitePrevRes.json();
      assert.equal(sitePrev.executiveMarginSummary, undefined);
      assert.equal(sitePrev.summaryTotal, null);

      // EXTERNAL VIEWER cannot create layouts (403) and sees only public fields
      actor = { userId: synthViewerUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
      const viewerSaveRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T8_CASHFLOW_HALF_MONTH',
        templateName: 'Viewer Attempt',
        sharingScope: 'PRIVATE',
        selectedFields: ['cash_quarter_label'],
      });
      assert.equal(viewerSaveRes.status, 403);

      return {
        execApprovedAuditLogged: approvedLogCount >= 1,
        pmBlockedAuditLogged: blockedLogCount === 1,
        pmSensitiveMetaStripped: true,
        narrowedExecSensitiveStripped: true,
        siteEngineerSharedLayoutRedacted: true,
      };
    }
  );

  // ==========================================================================
  // CHECK 5: Direct PostgreSQL RLS, Executive Target-Budget Policy, SensitiveExportLog Append-Only Trigger & SQL Layout Guards
  // ==========================================================================
  await check(
    'WP3-BC-05 Direct PostgreSQL RLS isolation, executive-only UboqContractorTargetBudget policy, SensitiveExportLog immutability/anti-forgery, and SQL sensitive-field layout guard',
    async () => {
      // 1. Cross-project RLS isolation on p1 signed session: 0 rows from pForeign across all Batch C tables!
      const foreignCounts = await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
        const counts: Record<string, number> = {};
        for (const [tbl, idVal] of [
          ['CommitmentLedger', clForeign],
          ['SubcontractBilling', sbForeign],
          ['SubcontractAccomplishment', subAccForeign],
          ['PaymentRecord', prForeign],
          ['SubcontractorVariationOrder', svoForeign],
          ['UboqCashFlowPeriod', cfpForeign],
          ['UboqContractorTargetBudget', tbForeign],
        ]) {
          counts[tbl] = (
            await restrictedClient.query(`SELECT count(*)::int AS cnt FROM "${tbl}" WHERE id = $1`, [
              idVal,
            ])
          ).rows[0].cnt;
        }
        return counts;
      });
      for (const [tbl, cnt] of Object.entries(foreignCounts)) {
        assert.equal(cnt, 0, `Cross-project row leaked on ${tbl}`);
      }

      // 2. UboqContractorTargetBudget restrictive executive policy:
      //    - FINANCE_DIRECTOR on p1 sees 4 rows
      //    - PROJECT_MANAGER on p1 sees 0 rows
      //    - Role-narrowed FINANCE_DIRECTOR on p1 sees 0 rows!
      const execTbCount = await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT count(*)::int AS cnt FROM "UboqContractorTargetBudget" WHERE "projectId" = $1`,
            [p1]
          )
        ).rows[0].cnt;
      });
      assert.equal(execTbCount, 4);

      const pmTbCount = await withSignedRestrictedTx(p1, synthPmUser, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT count(*)::int AS cnt FROM "UboqContractorTargetBudget" WHERE "projectId" = $1`,
            [p1]
          )
        ).rows[0].cnt;
      });
      assert.equal(pmTbCount, 0);

      const narrowedTbCount = await withSignedRestrictedTx(
        p1,
        synthNarrowedExecUser,
        7,
        async () => {
          return (
            await restrictedClient.query(
              `SELECT count(*)::int AS cnt FROM "UboqContractorTargetBudget" WHERE "projectId" = $1`,
              [p1]
            )
          ).rows[0].cnt;
        }
      );
      assert.equal(narrowedTbCount, 0);

      // 3. Legacy DB role (oserp_legacy_app) blocked from governed Batch C tables
      const legacyCnt = await s.transaction(admin, async () => {
        await admin.query('SET LOCAL ROLE oserp_legacy_app');
        return (
          await admin.query(`SELECT count(*)::int AS cnt FROM "CommitmentLedger" WHERE "projectId" = $1`, [
            p1,
          ])
        ).rows[0].cnt;
      });
      assert.equal(legacyCnt, 0, 'oserp_legacy_app leaked governed CommitmentLedger rows');

      // 4. SensitiveExportLog: direct INSERT & unattested function calls rejected, UPDATE/DELETE rejected, non-executive sees only own rows
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthPmUser, 7, () =>
            restrictedClient.query(
              `INSERT INTO "SensitiveExportLog"(id, "userId", role, "projectId", module, "exportType", "recordCount", "dataClassification", approved, blocked)
               VALUES ($1, $2, 'FINANCE_DIRECTOR', $3, 'UBOQ_EXECUTIVE_TEMPLATES', 'T10_EXECUTIVE_MARGIN:JSON', 4, 'SENSITIVE_EXECUTIVE_FINANCIAL', true, false)`,
              [prefix + '-SEL-FORGE', synthPmUser, p1]
            )
          ),
        /permission denied|UBOQ_SENSITIVE_EXPORT_LOG_ROLE_FORGED|UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED/i
      );

      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
            await restrictedClient.query(
              `SELECT set_config('app.uboq_sensitive_export_fn_active', 'on', true)`
            );
            await restrictedClient.query(
              `INSERT INTO "SensitiveExportLog"(id, "userId", "projectId", module, "exportType", "recordCount", "dataClassification", approved, blocked)
               VALUES ($1, $2, $3, 'UBOQ_EXECUTIVE_TEMPLATES', 'T10_EXECUTIVE_MARGIN:JSON', 4, 'SENSITIVE_EXECUTIVE_FINANCIAL', true, false)`,
              [prefix + '-SEL-EXEC-GUC', synthExecUser, p1]
            );
          }),
        /permission denied|UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED/i
      );

      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthExecUser, 7, () =>
            restrictedClient.query(
              `DELETE FROM "SensitiveExportLog" WHERE "projectId" = $1`,
              [p1]
            )
          ),
        /permission denied|UBOQ_SENSITIVE_EXPORT_LOG_IMMUTABLE/i
      );

      const pmVisibleLogs = await withSignedRestrictedTx(p1, synthPmUser, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT DISTINCT "userId" FROM "SensitiveExportLog" WHERE "projectId" = $1`,
            [p1]
          )
        ).rows.map((r: any) => r.userId);
      });
      assert.deepEqual(pmVisibleLogs, [synthPmUser]);

      const execVisibleLogs = await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT DISTINCT "userId" FROM "SensitiveExportLog" WHERE "projectId" = $1 ORDER BY "userId"`,
            [p1]
          )
        ).rows.map((r: any) => r.userId);
      });
      assert.ok(execVisibleLogs.includes(synthExecUser) && execVisibleLogs.includes(synthPmUser));

      // 5. SQL trigger guards on UboqTemplateDefinition & UboqTemplateAuditEvent:
      //    - Direct SQL INSERT of sensitive column ('actual_cash_paid_amt') by PROJECT_MANAGER rejected!
      //    - Direct SQL INSERT of gated T11_VARIATION_IMPACT rejected!
      //    - FORMAL_EXPORT_GENERATED on T8_CASHFLOW_HALF_MONTH rejected!
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthPmUser, 7, () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(
                 id, "projectId", "layoutGroupId", "templateCode", "templateName", "rowGrain",
                 "sharingScope", "selectedFieldsJson", "headingAliasesJson", "versionNumber", "definitionHash", "createdById", "updatedAt"
               ) VALUES (
                 $1, $2, $3, 'T8_CASHFLOW_HALF_MONTH', 'PM Unauthorized Sensitive SQL Insert', 'CASH_FLOW_PERIOD',
                 'PRIVATE', '["cash_quarter_label","actual_cash_paid_amt"]'::jsonb, '{}'::jsonb, 1, $5, $4, now()
               )`,
              [prefix + '-SQL-SENS-DENY', p1, prefix + '-GRP-DENY', synthPmUser, 'b'.repeat(64)]
            )
          ),
        /UBOQ_TEMPLATE_SENSITIVE_FIELD_DENIED/
      );

      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthExecUser, 7, () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(
                 id, "projectId", "layoutGroupId", "templateCode", "templateName", "rowGrain",
                 "sharingScope", "selectedFieldsJson", "headingAliasesJson", "versionNumber", "definitionHash", "createdById", "updatedAt"
               ) VALUES (
                 $1, $2, $3, 'T11_VARIATION_IMPACT', 'Gated T11 Insert', 'PHASE_BOQ_LINE',
                 'PRIVATE', '["item_code"]'::jsonb, '{}'::jsonb, 1, $5, $4, now()
               )`,
              [prefix + '-SQL-T11-DENY', p1, prefix + '-GRP-T11', synthExecUser, 'c'.repeat(64)]
            )
          ),
        /UBOQ_TEMPLATE_CODE_NOT_ENABLED/
      );

      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthExecUser, 7, () =>
            restrictedClient.query(
              `SELECT * FROM public.uboq_append_template_audit_event(
                 $1::text, $2::text, NULL::text, NULL::text, 1::integer, NULL::text, 'SYSTEM_FORMAL_PRESET'::text,
                 'T8_CASHFLOW_HALF_MONTH'::text, 'FORMAL_EXPORT_GENERATED'::text, $3::text, 'FINANCE_DIRECTOR'::text,
                 $4::text, '1'::text, 'ERP_CANONICAL_T8'::text, 'JSON'::text, $5::text, '{}'::jsonb
               )`,
              [prefix + '-AUD-T8-DENY', p1, synthExecUser, snap1, 'a'.repeat(64)]
            )
          ),
        /UBOQ_TEMPLATE_AUDIT_NON_FORMAL_TEMPLATE/
      );

      return {
        crossProjectLeakCounts: foreignCounts,
        execTargetBudgetRows: execTbCount,
        pmTargetBudgetRows: pmTbCount,
        narrowedExecTargetBudgetRows: narrowedTbCount,
        sqlSensitiveLayoutGuardVerified: true,
      };
    }
  );

  // ==========================================================================
  // CHECK 6: Saved Layouts Lifecycle Across T8, T9 & T10 (Create, Version, 409 Stale Conflict, Duplicate, Load & Preview)
  // ==========================================================================
  await check(
    'WP3-BC-06 Saved layouts full lifecycle across T8, T9 & T10 (create, version, 409 stale conflict, duplicate, load, preview)',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // T8 create -> version v2 -> stale v1 conflict (409) -> duplicate -> preview
      const cT8 = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T8_CASHFLOW_HALF_MONTH',
        templateName: 'Treasury Half-Month Schedule',
        sharingScope: 'PRIVATE',
        selectedFields: [
          'cash_quarter_label',
          'cash_period_start',
          'cash_period_end',
          'forecast_receipts_amt',
          'actual_cash_receipts_amt',
          'actual_cash_paid_amt',
        ],
        headingAliases: { actual_cash_paid_amt: 'Verified Bank Cash Out' },
      });
      assert.equal(cT8.status, 201);
      const t8v1 = (await cT8.json()).revision;

      const vT8 = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: t8v1.layoutGroupId,
        expectedVersionNumber: 1,
        templateName: 'Treasury Half-Month Schedule',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'cash_quarter_label',
          'cash_period_start',
          'cash_period_end',
          'forecast_receipts_amt',
          'procurement_cash_out_amt',
          'actual_cash_receipts_amt',
          'actual_cash_paid_amt',
        ],
        headingAliases: { actual_cash_paid_amt: 'Verified Bank Cash Out' },
        changeSummary: 'Added procurement cash out & shared',
      });
      assert.equal(vT8.status, 201);
      const t8v2 = (await vT8.json()).revision;
      assert.equal(t8v2.versionNumber, 2);

      const staleT8 = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: t8v1.layoutGroupId,
        expectedVersionNumber: 1,
        templateName: 'Stale Overwrite',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: ['cash_quarter_label'],
      });
      assert.equal(staleT8.status, 409);

      const dupT8 = await postLayouts({
        action: 'duplicate',
        projectId: p1,
        sourceRevisionId: t8v2.id,
        templateName: 'Treasury Half-Month Copy',
        sharingScope: 'PRIVATE',
      });
      assert.equal(dupT8.status, 201);

      const prevT8 = await postLayouts({
        action: 'preview',
        projectId: p1,
        layoutRevisionId: t8v2.id,
        sourceId: snap1,
      });
      assert.equal(prevT8.status, 200);
      const prevT8Body = await prevT8.json();
      assert.equal(prevT8Body.rowCount, 6);
      assert.equal(prevT8Body.cashFlowSummary.actualCashReceiptsTotal, '200000.00');

      // T9 create & preview
      const cT9 = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T9_CASHFLOW_QUARTERLY',
        templateName: 'Board Quarterly Liquidity Rollup',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'cash_quarter_label',
          'forecast_receipts_amt',
          'actual_cash_receipts_amt',
          'quarterly_closing_cash',
          'quarterly_liquidity_gap',
        ],
      });
      assert.equal(cT9.status, 201);
      const t9v1 = (await cT9.json()).revision;
      const prevT9 = await postLayouts({
        action: 'preview',
        projectId: p1,
        layoutRevisionId: t9v1.id,
        sourceId: snap1,
      });
      assert.equal(prevT9.status, 200);
      assert.equal((await prevT9.json()).rowCount, 2);

      return {
        t8LayoutGroupId: t8v1.layoutGroupId,
        t8LatestVersion: t8v2.versionNumber,
        t9LayoutGroupId: t9v1.layoutGroupId,
      };
    }
  );

  // ==========================================================================
  // CHECK 7: T0–T7 Non-Regression Smoke, Canonical Source Immutability & Real Headless Chromium E2E (1440px Desktop & 390px Mobile)
  // ==========================================================================
  await check(
    'WP3-BC-07 T0-T7 non-regression smoke, canonical source immutability, and real headless Chromium E2E across T8/T9/T10 (1440px desktop & 390px mobile)',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // T0–T7 non-regression smoke
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T0_MASTER_CONTRACT',
            sourceId: cGov,
            format: 'json',
          })
        ).status,
        200
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: snap1,
            format: 'json',
          })
        ).status,
        200
      );
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T2_CONSOLIDATED_BOQ',
            sourceId: snap1,
            format: 'json',
          })
        ).status,
        200
      );
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T3_AGENCY_ESTIMATE',
            sourceId: snap1,
            format: 'json',
          })
        ).status,
        200
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T4_RESOURCE_TAKEOFF',
            sourceId: snap1,
            format: 'json',
          })
        ).status,
        200
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T5_ACCOMPLISHMENT_CERT',
            sourceId: accApproved,
            format: 'json',
          })
        ).status,
        200
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T6_PROGRESS_BILLING',
            sourceId: bilGovApproved,
            format: 'json',
          })
        ).status,
        200
      );
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T7_SCHEDULE_EVM',
            sourceId: schedBaseline,
            format: 'json',
          })
        ).status,
        200
      );

      const esbuild = require('esbuild');
      const express = require('express');
      const { chromium } = require('playwright');

      const bundled = await esbuild.build({
        stdin: {
          contents: `import React from 'react';import {createRoot} from 'react-dom/client';import TemplateBuilder from './src/app/projects/[id]/uboq/templates/TemplateBuilder';createRoot(document.getElementById('root')).render(<TemplateBuilder projectId="${p1}"/>);`,
          loader: 'tsx',
          resolveDir: process.cwd(),
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
        /template-builder\.ts|canonical-source-adapters\.ts|templates\/t0-t1\.ts|templates\/saved-layouts\.ts|templates\/formal-t0-t1\.ts|exceljs|prisma/.test(
          x
        )
      );
      assert.deepEqual(serverInputs, [], 'Server-only modules entered browser bundle');

      const app = express();
      app.use(express.text({ type: '*/*', limit: '64kb' }));
      app.get('/', (_req: any, res: any) =>
        res.send(
          '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui;margin:0;padding:16px}*{box-sizing:border-box}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}button,input,select{font:inherit}</style></head><body><h1>Universal BOQ templates (T0–T10)</h1><div id="root"></div><script src="/bundle.js"></script></body></html>'
        )
      );
      app.get('/bundle.js', (_req: any, res: any) =>
        res.type('js').send(bundled.outputFiles[0].text)
      );

      const mountRoute = (urlPath: string, handlerMod: any) => {
        app.all(urlPath, async (req: any, res: any) => {
          try {
            const nextReq = new NextRequest('http://localhost' + req.originalUrl, {
              method: req.method,
              ...(req.method === 'POST'
                ? { headers: { 'Content-Type': 'application/json' }, body: req.body }
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

        // 1. T8_CASHFLOW_HALF_MONTH on 1440px desktop
        await page.getByLabel('Template', { exact: true }).selectOption('T8_CASHFLOW_HALF_MONTH');
        await page.getByLabel('Approved source', { exact: true }).selectOption(snap1);
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor();
        assert.equal(await page.getByText(/Actual receipts: 200000\.00/).count(), 1);
        assert.equal(await page.getByText(/isFormalComplianceOutput: false/).count(), 1);
        await page.screenshot({ path: OUT + '/browser-t8-desktop.png', fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T8 preview overflows 1440px desktop viewport'
        );

        // 2. T9_CASHFLOW_QUARTERLY on 1440px desktop
        await page.getByLabel('Template', { exact: true }).selectOption('T9_CASHFLOW_QUARTERLY');
        await page.getByLabel('Approved source', { exact: true }).selectOption(snap1);
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor();
        assert.equal(await page.getByText(/Ending closing cash \(NO_SUM\):/).count(), 1);
        await page.screenshot({ path: OUT + '/browser-t9-desktop.png', fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T9 preview overflows 1440px desktop viewport'
        );

        // 3. T10_EXECUTIVE_MARGIN on 1440px desktop + XLSX download + Saved Layout + 390px mobile
        await page.getByLabel('Template', { exact: true }).selectOption('T10_EXECUTIVE_MARGIN');
        await page.getByLabel('Approved source', { exact: true }).selectOption(snap1);
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor();
        assert.equal(await page.getByText(/Committed Ex-VAT: 150000\.00/).count(), 1);
        assert.equal(await page.getByText(/Forecast EAC Ex-VAT: 435000\.00/).count(), 1);

        const [dlT10] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: 'Download working XLSX', exact: true }).click(),
        ]);
        const dlT10Path = OUT + '/browser-t10-working.xlsx';
        await dlT10.saveAs(dlT10Path);
        const wbBrowser = new ExcelJS.Workbook();
        await wbBrowser.xlsx.readFile(dlT10Path);
        assert.ok(wbBrowser.getWorksheet('__OSERP_META'));
        const wsMain = wbBrowser.getWorksheet('T10_EXECUTIVE_MARGIN');
        assert.ok(wsMain, 'Expected T10_EXECUTIVE_MARGIN worksheet');
        let sumColL = 0;
        for (let rIdx = 2; rIdx <= 5; rIdx += 1) {
          for (let cIdx = 4; cIdx <= 12; cIdx += 1) {
            const c = wsMain!.getRow(rIdx).getCell(cIdx);
            assert.equal(typeof c.value, 'number', `Expected numeric cell at R${rIdx}C${cIdx}`);
            assert.equal(c.formula, undefined, `Unexpected formula at R${rIdx}C${cIdx}`);
            assert.ok(Boolean(c.numFmt), `Expected explicit numFmt at R${rIdx}C${cIdx}`);
          }
          sumColL += Number(wsMain!.getRow(rIdx).getCell(12).value);
        }
        assert.equal(sumColL.toFixed(2), '385000.01');

        await page.getByLabel('Layout name', { exact: true }).fill('Browser T10 Executive View');
        await page.getByRole('button', { name: 'Save new layout', exact: true }).click();
        await page.getByText(/Saved layout "Browser T10 Executive View" v1/).waitFor();

        // Re-open preview so desktop & mobile screenshots capture full T10 table + executive summary
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor();
        await page.screenshot({ path: OUT + '/browser-t10-desktop.png', fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T10 preview overflows 1440px desktop viewport'
        );

        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: OUT + '/browser-t10-mobile.png', fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T10 preview overflows 390px mobile viewport'
        );

        assert.deepEqual(consoleErrors, []);

        const sourceDigestAfter = await canonicalSourceDigest();
        assert.deepEqual(sourceDigestAfter, sourceDigestBefore);

        return {
          browser: 'Chromium headless',
          clientBundleExcludesServerModules: true,
          consoleErrors,
          desktopViewportWidth: 1440,
          mobileViewportWidth: 390,
          canonicalSourcesUnmutated: true,
        };
      } finally {
        if (browser) await browser.close();
        await new Promise<void>((resolve) => server.close(() => resolve()));
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
          const allProjects = [p1, pCorp, pPeza, pNoCf, pForeign];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND ("newValue" LIKE $1 OR "newValue" LIKE $2 OR "newValue" LIKE $3 OR "newValue" LIKE $4 OR "newValue" LIKE $5)`,
            [`%${p1}%`, `%${pCorp}%`, `%${pPeza}%`, `%${pNoCf}%`, `%${pForeign}%`]
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
            `DELETE FROM "UboqCashFlowPeriod" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "ProjectCostLedger" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "CommitmentLedger" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Payroll" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "PayrollPeriod" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Worker" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Expense" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "AccountsPayable" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Delivery" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "PurchaseOrderItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "PurchaseOrder" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "MaterialRequestItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "MaterialRequest" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Supplier" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "PaymentRecord" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "SubcontractBilling" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "SubcontractAccomplishment" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(`DELETE FROM "JobOrder" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "SubcontractorVariationOrder" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
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
          await admin.query(
            `DELETE FROM "UboqClientReceiptAllocation" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqClientReceipt" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
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
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "VariationOrder" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(
            `DELETE FROM "SubcontractPackage" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "Subcontractor" WHERE id = $1`, [subconEntity]);
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
          await admin.query(`DELETE FROM "User" WHERE id = ANY($1::text[])`, [
            [
              synthExecUser,
              synthNarrowedExecUser,
              synthPmUser,
              synthSiteEngUser,
              synthViewerUser,
            ],
          ]);
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
