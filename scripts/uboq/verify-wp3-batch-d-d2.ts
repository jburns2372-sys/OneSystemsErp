/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-d-d2';
const REPORT_PATH = OUT + '/runtime-tests.json';
const BRAIN_DIR = 'C:/Users/user/.gemini/antigravity/brain/b35617c7-9740-4aa7-a239-0ffdca5619a7';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch D Phase D2 consolidated runtime, Owner ratification provenance, T11_VARIATION_ORDER_REGISTER (VARIATION_ORDER_ITEM grain, 5 V2.1 R4 VO fields, strict Client Contract VO vs Subcontractor Commitment VO separation, approved source/BOQ/snapshot lineage, duplicate/conflict/tampering 409 fail-closed guards, internal ERP formal export ERP_CANONICAL_T11_FORMAL_V1), T12_CASHFLOW_VARIANCE_TREASURY (CASH_FLOW_PERIOD grain, forecast vs actual separation, unpaid commitments excluded from actual cash, 3 safe AST variance columns, NO_SUM period balance policy, formal export block, continuity/cutoff/duplicate 409 guards), RBAC/redaction, PostgreSQL FORCE RLS, SensitiveExportLog attestation, Phase D1 signed T0/T1 round-trip & T0–T10 non-regression, real headless Chromium E2E (1440x900 desktop & 390x844 mobile), and 251-table zero-residue rollback.',
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
const prefix = 'SYNTH-WP3-BDD2-' + hexId;

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

// Variation Orders (T11 positive baseline + excluded non-approved + mirror records)
const cvoApprovedNo = 'CVO-D2-APP-' + hexId.toUpperCase();
const cvoDraftNo = 'CVO-D2-DRF-' + hexId.toUpperCase();
const svoVoApprovedNo = 'SVO-VO-D2-APP-' + hexId.toUpperCase();
const svoApprovedNo = 'SVO-D2-RBR-APP-' + hexId.toUpperCase();
const svoPendingNo = 'SVO-D2-RBR-PND-' + hexId.toUpperCase();
const cvoPendingNo = 'CVO-D2-MIR-PND-' + hexId.toUpperCase();
const cvoForeignNo = 'CVO-D2-FOR-' + hexId.toUpperCase();

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
const payBatchNo = 'PAYBATCH-D2-' + hexId.toUpperCase();

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

    for (const [uid, role] of [
      [synthExecUser, 'FINANCE_DIRECTOR'],
      [synthNarrowedExecUser, 'FINANCE_DIRECTOR'],
      [synthPmUser, 'PROJECT_MANAGER'],
      [synthSiteEngUser, 'SITE_ENGINEER'],
      [synthViewerUser, 'PROJECT_MANAGER'],
      [synthForeignUser, 'FINANCE_DIRECTOR'],
    ]) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 7, now())`,
        [uid, `${uid.toLowerCase()}@synthetic.local`, role]
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
         ($1, $8,  $14, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($2, $8,  $15, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($3, $9,  $14, 'PROJECT_MANAGER',  'STANDARD', 'ACTIVE', now()),
         ($4, $10, $14, 'PROJECT_MANAGER',  'FULL',     'ACTIVE', now()),
         ($5, $11, $14, 'SITE_ENGINEER',    'STANDARD', 'ACTIVE', now()),
         ($6, $12, $14, 'MEMBER',           'VIEWER',   'ACTIVE', now()),
         ($7, $13, $16, 'FINANCE_DIRECTOR', 'FULL',     'ACTIVE', now())`,
      [
        prefix + '-ASN-EXEC-P1',
        prefix + '-ASN-EXEC-CORP',
        prefix + '-ASN-NARROW-P1',
        prefix + '-ASN-PM-P1',
        prefix + '-ASN-SITE-P1',
        prefix + '-ASN-VIEW-P1',
        prefix + '-ASN-FOR-PFOR',
        synthExecUser,
        synthNarrowedExecUser,
        synthPmUser,
        synthSiteEngUser,
        synthViewerUser,
        synthForeignUser,
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
         ($1, $4, $7,  'GOVERNMENT', 'DPWH Synthetic District', 'CA-BDD2-GOV-01',  'NOA-D2-01', 'NTP-D2-01', 'CPO-D2-01', $9,   'UNIT_PRICE', 'VAT_INCLUSIVE', 792000.00, 707142.86, 918400.00, 180, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($2, $5, $8,  'PRIVATE',    'Ayala Synthetic Corp',    'CA-BDD2-CORP-01', NULL,        NULL,        NULL,        NULL, 'UNIT_PRICE', 'VAT_EXCLUSIVE', 200000.00, 200000.00, 200000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($3, $6, NULL,'PRIVATE',    'Foreign Tenant Corp',     'CA-BDD2-FOR-01',  NULL,        NULL,        NULL,        NULL, 'UNIT_PRICE', 'VAT_EXCLUSIVE', 50000.00,  50000.00,  50000.00,  60,  '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now())`,
      [cGov, cCorp, cForeign, p1, pCorp, pForeign, taxGov, taxCorp, cvoApprovedNo, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'batch-d-d2-source.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8192, $3, '504b0304', 'memory://batch-d-d2', 'CONTRACT_BOQ', $4, true)`,
      [srcDoc, p1, s.hash(srcDoc), s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $4, $7,   $8,  1, 'Gov Baseline v1',    'APPROVED', $11, $12, $15, $15, '2026-08-05T00:00:00.000Z'),
         ($2, $5, NULL, $9,  1, 'Corp Baseline v1',   'APPROVED', $13, NULL,$15, $15, '2026-08-05T00:00:00.000Z'),
         ($3, $6, NULL, $10, 1, 'Foreign Baseline v1','APPROVED', $14, NULL,$15, $15, '2026-08-05T00:00:00.000Z')`,
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

    // AwardedBOQItems: boqConc has +20 m3 approved Client VO (100 -> 120, 632000 -> 758400);
    // boqRebar has 0 Client VO even though it has 2 approved Subcontractor VOs (+13,000 commitment)!
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
         ($1, 'CGRP-D2-1', 'UBOQ_CONSOLIDATED', 'Structural Concrete Class A', 'm3', 100,  4800, 480000, 'APPROVED', $3, true, now()),
         ($2, 'CGRP-D2-2', 'UBOQ_CONSOLIDATED', 'Deformed Reinforcing Steel',  'kg', 2000, 44,   88000,  'APPROVED', $3, true, now())`,
      [cboqConc, cboqRebar, p1]
    );
    await admin.query(
      `INSERT INTO "UboqConsolidationGroup"(id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription", specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily", "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt")
       VALUES
         ($1, $3, $4, 'CGRP-D2-1', 'Structural Concrete Class A', '3500 psi @ 28d',     $6, 'm3', 'VOLUME', 100.0000,  6320.0000, 632000.00, now()),
         ($2, $3, $5, 'CGRP-D2-2', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $7, 'kg', 'MASS',   2000.0000, 55.0000,   110000.00, now())`,
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
       VALUES ($1, $2, $3, 'MAT-CEM-D2', 'Portland Cement Type 1', '40kg Bag ASTM C150', $4, 'MATERIAL', 'SUPPLIER_PO', 'bag_40kg', 'PACK', $5, 900.0000, 100.0000, 0.0000, 500.0000, 0.0000, 0.0000, 0.0000, 100.0000, 300.0000, false, 0.0000, 230.0000, 1, now())`,
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
    const spkgRebarNo = 'SPKG-D2-' + hexId.toUpperCase();
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
        'JO-D2-' + hexId.toUpperCase(),
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

    const sbNumRebar = 'SBIL-D2-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "SubcontractBilling"(id, "billingNumber", "projectId", "subcontractorId", "packageId", "jobOrderId", "contractAmount", "previousGross", "currentGross", "totalGross", "remainingBalance", "netPayable", "accountingStatus", "approvalStatus", "paymentStatus", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 50000, 0, 25000, 25000, 25000, 22500, 'REVIEWED', 'APPROVED', 'PENDING', 'APPROVED_FOR_PAYMENT', '2026-09-18T00:00:00.000Z', now())`,
      [sbRebar1, sbNumRebar, p1, subconEntity, subPkgRebar, joRebarChild]
    );

    // 15,000 paid on 2026-09-20 (<= cutoff); remaining 35,000 subcontract commitment is UNPAID!
    await admin.query(
      `INSERT INTO "PaymentRecord"(id, "billingId", "amountPaid", "paymentDate", method, "referenceNumber", "updatedAt")
       VALUES ($1, $2, 15000.00, '2026-09-20T00:00:00.000Z', 'BANK_TRANSFER', 'SUBPAY-D2-001', now())`,
      [prRebarPaid, sbRebar1]
    );

    // VariationOrder + VariationOrderItem + Document + Approval + ClientVariationOrder mirrors + Foreign VO/AIV rows
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

    // Accomplishments, Inspections, Billings, Payments, Schedules
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
        'PB-D2-GOV1-' + hexId.toUpperCase(),
        'PB-D2-GOV2-' + hexId.toUpperCase(),
        'PB-D2-CORP-' + hexId.toUpperCase(),
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

    // 200,000 PAID on 2026-09-20 (in 2026-09-H2); 48,062.50 PENDING (excluded!)
    await admin.query(
      `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
       VALUES
         ($1, 385000, 385000, 264687.50, 200000.00, '2026-09-20T00:00:00.000Z', 'OR-D2-GOV-001',  'PAID',    $4, now()),
         ($2, 385000, 385000, 264687.50, 48062.50,  '2026-09-25T00:00:00.000Z', 'CHK-D2-PND-001', 'PENDING', $4, now()),
         ($3, 100000, 100000, 90000.00,  80000.00,  '2026-09-22T00:00:00.000Z', 'OR-D2-CORP-001', 'PAID',    $5, now())`,
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

    // Procurement: Approved PO (112,000 Gross / 100,000 Ex-VAT) with 67,200 Gross PAID AP + 22,400 Gross UNPAID AP + 22,400 open unbilled PO commitment
    await admin.query(
      `INSERT INTO "Supplier"(id, name, "isVatable", "updatedAt")
       VALUES ($1, 'Holcim Synthetic Cement Corp', true, now())`,
      [supplier1]
    );
    await admin.query(
      `INSERT INTO "MaterialRequest"(id, "mrNumber", status, "projectId", "requesterId", "approverId", "updatedAt")
       VALUES ($1, $2, 'APPROVED', $3, $4, $4, now())`,
      [mr1, 'MR-D2-' + hexId.toUpperCase(), p1, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "MaterialRequestItem"(id, quantity, "approvedQuantity", "mrId", "consolidatedBoqItemId", "canonicalResourceId", "uboqResourceRequirementId")
       VALUES ($1, 500, 500, $2, $3, $4, $5)`,
      [mriCement, mr1, cboqConc, acctCement, prrCement]
    );

    const poCementNo = 'PO-D2-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "PurchaseOrder"(id, "poNumber", status, "supplierId", "mrId", "totalAmount", "netAmount", "vatAmount", "dueDate", "approverId", "approvedAt", "createdAt", "updatedAt")
       VALUES
         ($1, $3, 'APPROVED', $5, $6, 112000.00, 100000.00, 12000.00, '2026-10-10T00:00:00.000Z', $7, '2026-09-05T00:00:00.000Z', '2026-09-05T00:00:00.000Z', now()),
         ($2, $4, 'DRAFT',    $5, $6, 560000.00, 500000.00, 60000.00, '2026-10-20T00:00:00.000Z', NULL, NULL,                      '2026-09-06T00:00:00.000Z', now())`,
      [
        poCement,
        poDraftIgnored,
        poCementNo,
        'PO-D2-DRF-' + hexId.toUpperCase(),
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
         ($1, 'DR-D2-1', '2026-09-10T00:00:00.000Z', 'RECEIVED', $3, now()),
         ($2, 'DR-D2-2', '2026-09-20T00:00:00.000Z', 'RECEIVED', $3, now())`,
      [deliv1, deliv2, poCement]
    );

    const apPaidVoucher = 'APV-D2-PAID-' + hexId.toUpperCase();
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
        'APV-D2-UNP-' + hexId.toUpperCase(),
      ]
    );

    // Direct Expenses: 8,960 Gross (8,000 Ex-VAT) PAID on 2026-09-10 + 4,000 ACCRUED UNPAID + 50,000 DRAFT ignored
    const expPaidRef = 'OR-EXP-D2-' + hexId.toUpperCase();
    await admin.query(
      `INSERT INTO "Expense"(id, amount, date, category, description, "receiptRef", "isAccrued", "netAmount", "vatAmount", status, "approvalStatus", "projectId", "loggedById", "approverId", "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, 8960.00,  '2026-09-10T00:00:00.000Z', 'SITE_SUPPLIES', 'Temporary power & water setup', $4,      false, 8000.00,  960.00, 'APPROVED', 'APPROVED', $5, $6, $6, $7, now()),
         ($2, 4000.00,  '2026-09-22T00:00:00.000Z', 'EQUIPMENT',     'Accrued crane rental',          'ACCR-1',true,  4000.00,  0.00,   'APPROVED', 'APPROVED', $5, $6, $6, $7, now()),
         ($3, 50000.00, '2026-09-25T00:00:00.000Z', 'OTHER',         'Unapproved draft expense',      NULL,    false, 50000.00, 0.00,   'DRAFT',    'PENDING',  $5, $6, NULL,$7, now())`,
      [expMobPaid, expMobAccrued, expDraftIgnored, expPaidRef, p1, s.f.ids.a, boqMob]
    );

    // Worker + Payroll (20,000 released on 2026-09-15)
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

    // Mirrored CommitmentLedger rows (including SVO:<svoApprovedNo> mirror — deduplicated in BOTH T11 and T10/T12!)
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
         ($5, $7, '2026-09-14T00:00:00.000Z', 'MATERIAL', 'AP_VOUCHER',     'CORP-AP-D2', 56000.00, 6000.00, 50000.00, 56000.00, 0.00, 'PAID', 'APPROVED', NULL, $15, NULL, now())`,
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

    // Persisted UboqCashFlowPeriod rows on p1 (6 contiguous half-months 2026-09-H1..2026-11-H2)
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

  // Helper to run an isolated negative DB mutation and guarantee cleanup even if an assertion throws
  async function withTempAdminMutation<T>(
    applySql: () => Promise<void>,
    revertSql: () => Promise<void>,
    testFn: () => Promise<T>
  ): Promise<T> {
    await applySql();
    try {
      return await testFn();
    } finally {
      await revertSql();
    }
  }

  // ==========================================================================
  // CHECK 1: WP3-BDD2-01 — Owner Ratification, 134-Field Catalog & T0–T12 Registry
  // ==========================================================================
  await check(
    'WP3-BDD2-01: Project Owner ratification provenance (zero fabricated signature), 134-field catalog (+5 V2.1 R4 VO fields), active T0–T12 registry, and T11 vs T12 formal boundary',
    async () => {
      const d0Spec = JSON.parse(
        s.fs.readFileSync('artifacts/uboq/wp3/batch-d/d0-t11-t12-contract-specifications.json', 'utf8')
      );
      const d2Spec = JSON.parse(
        s.fs.readFileSync(
          'artifacts/uboq/wp3/batch-d-d2/d0-t11-t12-contract-specifications-ratified.json',
          'utf8'
        )
      );
      for (const spec of [d0Spec, d2Spec]) {
        assert.equal(spec.ratification_status, 'RATIFIED_BY_PROJECT_OWNER_IN_CONVERSATION_2026_11_15');
        assert.equal(spec.project_owner_formal_approval_found, true);
        assert.equal(
          spec.owner_ratification_audit_provenance.electronic_signature_present,
          false,
          'Must never fabricate an electronic signature'
        );
        assert.equal(
          spec.owner_ratification_audit_provenance.approval_method,
          'Explicit Project Owner instruction in conversation; not a digital or electronic signature'
        );
        assert.equal(
          spec.proposed_contracts.T11_VARIATION_ORDER_REGISTER.implemented_in_runtime,
          true
        );
        assert.equal(
          spec.proposed_contracts.T12_CASHFLOW_VARIANCE_TREASURY.implemented_in_runtime,
          true
        );
      }

      const { getCanonicalCatalogStats, CANONICAL_FIELD_MAP } = require('../../src/lib/uboq/field-catalog');
      const stats = getCanonicalCatalogStats();
      assert.deepEqual(stats, {
        blueprintCount: 119,
        extensionCount: 10,
        v21R4VoExtensionCount: 5,
        totalCount: 134,
        uniqueCount: 134,
      });
      for (const voFieldId of [
        'vo_number',
        'vo_classification',
        'vo_approved_qty_delta',
        'vo_client_revenue_delta_amt',
        'vo_subcon_commitment_delta_amt',
      ]) {
        const fSpec = CANONICAL_FIELD_MAP.get(voFieldId);
        assert.ok(fSpec, `Missing VO field ${voFieldId}`);
        assert.equal(fSpec.origin, 'V2_1_R4_VO_EXTENSION');
      }

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
        'T11_VARIATION_ORDER_REGISTER',
        'T12_CASHFLOW_VARIANCE_TREASURY',
      ]);

      const fRes = await getFormal(p1);
      assert.equal(fRes.status, 200);
      const fBody = await fRes.json();
      const fCodes = fBody.contracts.map((c: any) => c.templateCode);
      assert.deepEqual(fCodes, [
        'T0_MASTER_CONTRACT',
        'T1_PHASE_BOQ',
        'T4_RESOURCE_TAKEOFF',
        'T5_ACCOMPLISHMENT_CERT',
        'T6_PROGRESS_BILLING',
        'T11_VARIATION_ORDER_REGISTER',
      ]);
      const t11Contract = fBody.contracts.find(
        (c: any) => c.templateCode === 'T11_VARIATION_ORDER_REGISTER'
      );
      assert.equal(t11Contract.contractCode, 'ERP_CANONICAL_T11_FORMAL_V1');
      assert.equal(
        t11Contract.externalAgencySpecStatus,
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );

      // T12 must reject formal export at API level AND unratified legacy aliases must fail closed
      const t12FormalReject = await postFormal({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t12FormalReject.status, 400);
      assert.equal((await t12FormalReject.json()).error, 'FORMAL_TEMPLATE_CODE_NOT_SUPPORTED');

      for (const unratified of ['T11_VARIATION_IMPACT', 'T12_CHANGE_REGISTER']) {
        const badRes = await postWorking({
          projectId: p1,
          templateCode: unratified,
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(badRes.status, 400);
      }

      return {
        totalCatalogFields: stats.totalCount,
        activeTemplatesCount: codes.length,
        formalCapableTemplatesCount: fCodes.length,
        electronicSignatureFabricated: false,
      };
    }
  );

  // ==========================================================================
  // CHECK 2: WP3-BDD2-02 — T11 Positive Reconciliation & Client vs Subcon Separation
  // ==========================================================================
  await check(
    'WP3-BDD2-02: T11_VARIATION_ORDER_REGISTER positive reconciliation, strict Client Contract VO vs Subcontractor Commitment VO separation, mirror deduplication, and zero canonical BOQ mutation',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const res = await postWorking({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.templateCode, 'T11_VARIATION_ORDER_REGISTER');
      assert.equal(body.rowGrain, 'VARIATION_ORDER_ITEM');
      assert.equal(body.rowCount, 3);
      assert.equal(body.approvedLineTotal, null);
      assert.deepEqual(body.summaryTotal, {
        fieldId: 'vo_client_revenue_delta_amt',
        basis: 'APPROVED_CLIENT_VO_REVENUE_DELTA',
        label: 'Approved client VO contract revenue delta',
        amount: '126400.00',
      });

      const vSum = body.variationRegisterSummary;
      assert.ok(vSum);
      assert.equal(vSum.originalContractAwardAmount, '792000.00');
      assert.equal(vSum.approvedClientVoCount, 1);
      assert.equal(vSum.approvedSubconVoCount, 2);
      assert.equal(vSum.approvedClientVoItemCount, 1);
      assert.equal(vSum.approvedSubconVoItemCount, 2);
      assert.equal(vSum.excludedNonApprovedVoCount, 3);
      assert.equal(vSum.deduplicatedClientVoMirrorsCount, 1);
      assert.equal(vSum.deduplicatedSubconVoLedgerMirrorsCount, 1);
      assert.equal(vSum.clientVoRevenueDeltaTotal, '126400.00');
      assert.equal(vSum.clientVoRevenueDeltaExVatTotal, '112857.14');
      assert.equal(vSum.revisedContractValueTotal, '918400.00');
      assert.equal(vSum.subconCommitmentVoDeltaTotal, '13000.00');

      const rows = body.projection.projectedRows;
      const clientRow = rows.find((r: any) => r.visible.vo_number === cvoApprovedNo);
      assert.ok(clientRow);
      assert.equal(clientRow.visible.vo_classification, 'CLIENT_CONTRACT_VO');
      assert.equal(clientRow.visible.item_code, '900(1)a');
      assert.equal(clientRow.visible.original_qty, '100.0000');
      assert.equal(clientRow.visible.vo_approved_qty_delta, '20.0000');
      assert.equal(clientRow.visible.approved_qty, '120.0000');
      assert.equal(clientRow.visible.vo_client_revenue_delta_amt, '126400.00');
      assert.equal(clientRow.visible.vo_subcon_commitment_delta_amt, '0.00');

      const subVoRow1 = rows.find((r: any) => r.visible.vo_number === svoVoApprovedNo);
      const subVoRow2 = rows.find((r: any) => r.visible.vo_number === svoApprovedNo);
      assert.ok(subVoRow1 && subVoRow2);
      for (const sRow of [subVoRow1, subVoRow2]) {
        assert.equal(sRow.visible.vo_classification, 'SUBCONTRACTOR_COMMITMENT_VO');
        assert.equal(sRow.visible.item_code, '902(1)a');
        assert.equal(
          sRow.visible.vo_client_revenue_delta_amt,
          '0.00',
          'Subcontractor VO must NEVER adjust client revenue'
        );
        assert.equal(
          sRow.visible.approved_qty,
          '2000.0000',
          'Subcontractor VO must NEVER adjust client approved BOQ quantity'
        );
      }
      assert.equal(subVoRow1.visible.vo_subcon_commitment_delta_amt, '3000.00');
      assert.equal(subVoRow2.visible.vo_subcon_commitment_delta_amt, '10000.00');

      // Working XLSX & CSV verification
      const xlsxRes = await postWorking({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(xlsxRes.status, 200);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(Buffer.from(await xlsxRes.arrayBuffer()));
      const ws = wb.getWorksheet('T11_VARIATION_ORDER_REGISTER');
      assert.ok(ws);
      assert.equal(ws.rowCount, 4);
      // Verify numeric cell encoding on quantities & currency columns (cols 7..12; col 6 is 'unit')
      for (let rIdx = 2; rIdx <= 4; rIdx += 1) {
        assert.equal(typeof ws.getRow(rIdx).getCell(6).value, 'string');
        for (const cIdx of [7, 8, 9, 10, 11, 12]) {
          assert.equal(typeof ws.getRow(rIdx).getCell(cIdx).value, 'number');
        }
      }

      const csvRes = await postWorking({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'csv',
      });
      assert.equal(csvRes.status, 200);
      const csvText = await csvRes.text();
      assert.ok(csvText.includes('CLIENT_CONTRACT_VO'));
      assert.ok(csvText.includes('SUBCONTRACTOR_COMMITMENT_VO'));

      assert.deepEqual(await canonicalSourceDigest(), sourceDigestBefore);
      return {
        rowCount: body.rowCount,
        clientVoRevenueDeltaTotal: vSum.clientVoRevenueDeltaTotal,
        subconCommitmentVoDeltaTotal: vSum.subconCommitmentVoDeltaTotal,
        revisedContractValueTotal: vSum.revisedContractValueTotal,
      };
    }
  );

  // ==========================================================================
  // CHECK 3: WP3-BDD2-03 — T11 Negative Fail-Closed Guardrails (409)
  // ==========================================================================
  await check(
    'WP3-BDD2-03: T11 fail-closed 409 rejection on missing VO source document/approval, unapproved line item, unverified BOQ/snapshot lineage, arithmetic mismatch, duplicate VO recognition, and unauthorized AwardedBOQItem mutation',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 3A. Missing VariationOrderDocument on approved VO -> 409 TEMPLATE_VO_SOURCE_DOCUMENT_MISSING
      await withTempAdminMutation(
        async () => {
          await admin.query(`UPDATE "VariationOrderDocument" SET "fileUrl" = '' WHERE id = $1`, [
            vodClientApproved,
          ]);
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderDocument" SET "fileUrl" = 'memory://cvo-01.pdf' WHERE id = $1`,
            [vodClientApproved]
          );
        },
        async () => {
          const r1 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(r1.status, 409);
          assert.equal((await r1.json()).error, 'TEMPLATE_VO_SOURCE_DOCUMENT_MISSING');

          const f1 = await postFormal({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(f1.status, 409);
          assert.equal((await f1.json()).error, 'FORMAL_VO_SOURCE_DOCUMENT_MISSING');
        }
      );

      // 3B. Approved VO containing an unapproved PENDING line item -> 409 TEMPLATE_VO_ITEM_APPROVAL_INCOMPLETE
      const tmpPendingVoi = prefix + '-TMP-VOI-PND';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "VariationOrderItem"(id, "voItemNumber", "itemClassification", description, unit, "originalQuantity", "currentProposedQuantity", "revisedQuantity", "approvalStatus", "variationOrderId", "originalBoqItemId", "updatedAt")
             VALUES ($1, 'VOI-099', 'ADDITIONAL_QTY', 'Unapproved item inside approved VO', 'm3', 100, 5, 105, 'PENDING', $2, $3, now())`,
            [tmpPendingVoi, voClientApproved, boqConc]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "VariationOrderItem" WHERE id = $1`, [tmpPendingVoi]);
        },
        async () => {
          const r2 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(r2.status, 409);
          assert.equal((await r2.json()).error, 'TEMPLATE_VO_ITEM_APPROVAL_INCOMPLETE');
        }
      );

      // 3C. Approved VO item referencing an AwardedBOQItem outside the approved snapshot lineage -> 409 TEMPLATE_VO_LINEAGE_UNVERIFIED
      const tmpUnlinkedBoq = prefix + '-TMP-ABOQ-UNLINKED';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", status, "projectId", "updatedAt")
             VALUES ($1, 'UNL-01', 'EXTRA', 'Unlinked BOQ outside snapshot', 'lot', 1, 1000, 1000, 'APPROVED', $2, now())`,
            [tmpUnlinkedBoq, p1]
          );
          await admin.query(
            `UPDATE "VariationOrderItem" SET "originalBoqItemId" = $1 WHERE id = $2`,
            [tmpUnlinkedBoq, voiSubconApproved]
          );
        },
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "originalBoqItemId" = $1 WHERE id = $2`,
            [boqRebar, voiSubconApproved]
          );
          await admin.query(`DELETE FROM "AwardedBOQItem" WHERE id = $1`, [tmpUnlinkedBoq]);
        },
        async () => {
          const r3 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(r3.status, 409);
          assert.equal((await r3.json()).error, 'TEMPLATE_VO_LINEAGE_UNVERIFIED');
        }
      );

      // 3D. VO arithmetic mismatch (item netAmount tampered) -> 409 TEMPLATE_VO_ARITHMETIC_MISMATCH
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `UPDATE "VariationOrderItem" SET "netAmount" = 99999.00 WHERE id = $1`,
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
          const r4 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(r4.status, 409);
          assert.equal((await r4.json()).error, 'TEMPLATE_VO_ARITHMETIC_MISMATCH');
        }
      );

      // 3E. Duplicate / conflicting VO recognition across ClientVariationOrder, SubcontractorVariationOrder, and CommitmentLedger -> 409 TEMPLATE_DUPLICATE_VO_RECOGNITION
      const tmpCvoLedger = prefix + '-TMP-CL-CVO';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "CommitmentLedger"(id, "projectId", "commitmentType", "approvedAmount", status, "awardedBoqItemId", "updatedAt")
             VALUES ($1, $2, $3, 126400.00, 'ACTIVE', $4, now())`,
            [tmpCvoLedger, p1, `CVO:${cvoApprovedNo}`, boqConc]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "CommitmentLedger" WHERE id = $1`, [tmpCvoLedger]);
        },
        async () => {
          const r5 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(r5.status, 409);
          assert.equal((await r5.json()).error, 'TEMPLATE_DUPLICATE_VO_RECOGNITION');
        }
      );

      const tmpConflictSvo = prefix + '-TMP-SVO-DUP';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "SubcontractorVariationOrder"(id, "svoNumber", "projectId", "originalSubcontractId", "originalSubcontractAmt", "proposedAdditionalAmt", "revisedSubcontractAmt", reason, "approvalStatus", "approvedById", "awardedBoqItemId", "updatedAt")
             VALUES ($1, $2, $3, $4, 40000, 9999, 49999, 'Conflicting duplicate SVO', 'APPROVED', $5, $6, now())`,
            [tmpConflictSvo, svoVoApprovedNo, p1, subPkgRebar, s.f.ids.a, boqRebar]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "SubcontractorVariationOrder" WHERE id = $1`, [
            tmpConflictSvo,
          ]);
        },
        async () => {
          const r6 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(r6.status, 409);
          assert.equal((await r6.json()).error, 'TEMPLATE_DUPLICATE_VO_RECOGNITION');
        }
      );

      // 3F. Unauthorized modification of AwardedBOQItem (e.g., injecting Subcon VO qty into AwardedBOQItem.approvedClientVoQuantity) -> 409 TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION
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
          const r7 = await postWorking({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(r7.status, 409);
          assert.equal((await r7.json()).error, 'TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION');

          const f7 = await postFormal({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(f7.status, 409);
          assert.equal((await f7.json()).error, 'FORMAL_UNAUTHORIZED_BOQ_VO_MUTATION');
        }
      );

      return {
        missingSourceDocStatus: 409,
        incompleteItemApprovalStatus: 409,
        unverifiedLineageStatus: 409,
        arithmeticMismatchStatus: 409,
        duplicateRecognitionStatus: 409,
        unauthorizedBoqMutationStatus: 409,
      };
    }
  );

  // ==========================================================================
  // CHECK 4: WP3-BDD2-04 — T11 Internal ERP Formal Export & OpenXML Inspection
  // ==========================================================================
  await check(
    'WP3-BDD2-04: T11 formal export (ERP_CANONICAL_T11_FORMAL_V1) in JSON/XLSX/CSV, OpenXML live SUM strictly on delta columns, zero statutory agency claims, executive saved-layoutSensitiveExportLog attestation, and blocking-exception / mandatory-field guards',
    async () => {
      // 4A. Commercial PM runs canonical T11 formal preset (JSON, XLSX, CSV)
      actor = { userId: synthPmUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
      const fJsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(fJsonRes.status, 200);
      assert.equal(fJsonRes.headers.get('X-OSERP-Formal-Contract'), 'ERP_CANONICAL_T11_FORMAL_V1');
      assert.equal(
        fJsonRes.headers.get('X-OSERP-External-Agency-Spec'),
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );
      const fJson = await fJsonRes.json();
      assert.equal(fJson.formalExport, true);
      assert.deepEqual(fJson.contract.inventedAgencyOrSignatoryFields, []);
      assert.equal(fJson.clientVoRevenueDeltaTotal, '126400.00');
      assert.equal(fJson.totals.currentApprovedContractValue, '918400.00');
      assert.equal(fJson.totals.subconCommitmentVoDeltaTotal, null);

      // External statutory agency spec claim must be rejected 409 FORMAL_SPECIFICATION_NOT_DEFINED
      const agencyReject = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'json',
        contractCode: 'DPWH_STATUTORY_VO_FORM_V1',
      });
      assert.equal(agencyReject.status, 409);
      assert.equal((await agencyReject.json()).error, 'FORMAL_SPECIFICATION_NOT_DEFINED');

      // Inspect PM formal XLSX: SUM formula ONLY on vo_client_revenue_delta_amt!
      const fXlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(fXlsxRes.status, 200);
      const wbPm = new ExcelJS.Workbook();
      await wbPm.xlsx.load(Buffer.from(await fXlsxRes.arrayBuffer()));
      const wsPm = wbPm.getWorksheet('T11_Formal_VO_Register');
      assert.ok(wsPm);
      const headerRowPm = wsPm.getRow(1);
      const totalRowPm = wsPm.getRow(5);
      let sumFormulaColCountPm = 0;
      for (let c = 1; c <= wsPm.columnCount; c += 1) {
        const hText = String(headerRowPm.getCell(c).value ?? '');
        const cellVal = totalRowPm.getCell(c).value as any;
        if (cellVal && typeof cellVal === 'object' && 'formula' in cellVal) {
          sumFormulaColCountPm += 1;
          assert.equal(hText, 'Approved Client VO Revenue Delta');
          assert.match(String(cellVal.formula), /^SUM\([A-Z]+2:[A-Z]+4\)$/);
          assert.equal(Number(cellVal.result), 126400);
        }
      }
      assert.equal(sumFormulaColCountPm, 1);

      const fCsvRes = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'csv',
      });
      assert.equal(fCsvRes.status, 200);
      const fCsvText = await fCsvRes.text();
      assert.ok(fCsvText.includes('TOTAL_APPROVED_VARIATION_REGISTER'));
      assert.ok(fCsvText.includes('126400.00'));
      assert.equal(fCsvText.includes('13000.00'), false);

      // 4B. Executive saved layout including vo_subcon_commitment_delta_amt -> logs SensitiveExportLog(approved=true), blocks PM with 403!
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const createExecLayoutRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        templateName: 'Executive Full VO & Commitment Register',
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
      const wbExec = new ExcelJS.Workbook();
      await wbExec.xlsx.load(Buffer.from(await execFormalXlsxRes.arrayBuffer()));
      const wsExec = wbExec.getWorksheet('T11_Formal_VO_Register');
      assert.ok(wsExec);
      const totalRowExec = wsExec.getRow(5);
      const formulaHeadingsExec: string[] = [];
      for (let c = 1; c <= wsExec.columnCount; c += 1) {
        const cellVal = totalRowExec.getCell(c).value as any;
        if (cellVal && typeof cellVal === 'object' && 'formula' in cellVal) {
          formulaHeadingsExec.push(String(wsExec.getRow(1).getCell(c).value ?? ''));
        }
      }
      assert.deepEqual(formulaHeadingsExec, [
        'Approved Client VO Revenue Delta',
        'Approved Subcontract VO Commitment Delta',
      ]);

      // PM attempting formal export of executive layout with vo_subcon_commitment_delta_amt -> 403
      actor = { userId: synthPmUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
      const pmExecFormalReject = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        layoutRevisionId: execLayoutRevId,
        format: 'json',
      });
      assert.equal(pmExecFormalReject.status, 403);

      // Saved layout missing mandatory vo_client_revenue_delta_amt -> 409 FORMAL_MANDATORY_FIELD_MISSING
      const createIncompleteRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        templateName: 'Incomplete T11 Scope Layout',
        sharingScope: 'PRIVATE',
        selectedFields: ['vo_number', 'vo_classification', 'item_code', 'work_description', 'unit'],
      });
      assert.equal(createIncompleteRes.status, 201);
      const incompleteRevId = (await createIncompleteRes.json()).revision.id;
      const missingMandatoryRes = await postFormal({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        layoutRevisionId: incompleteRevId,
        format: 'json',
      });
      assert.equal(missingMandatoryRes.status, 409);
      assert.equal((await missingMandatoryRes.json()).error, 'FORMAL_MANDATORY_FIELD_MISSING');

      // Open BLOCKING validation exception -> 409 FORMAL_OPEN_BLOCKING_EXCEPTIONS
      const tmpExcId = prefix + '-TMP-EXC-BLK';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "UboqValidationException"(id, "projectId", "snapshotId", "ruleCode", severity, "entityType", message, status)
             VALUES ($1, $2, $3, 'VO_TEST_BLOCK', 'BLOCKING', 'VARIATION_ORDER', 'Open blocking test', 'OPEN')`,
            [tmpExcId, p1, snap1]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "UboqValidationException" WHERE id = $1`, [tmpExcId]);
        },
        async () => {
          const blkRes = await postFormal({
            projectId: p1,
            templateCode: 'T11_VARIATION_ORDER_REGISTER',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(blkRes.status, 409);
          assert.equal((await blkRes.json()).error, 'FORMAL_OPEN_BLOCKING_EXCEPTIONS');
        }
      );

      return {
        pmFormalSumColumns: 1,
        execFormalSumColumns: 2,
        statutoryClaimRejectedStatus: 409,
        missingMandatoryRejectedStatus: 409,
        openBlockingExceptionRejectedStatus: 409,
      };
    }
  );

  // ==========================================================================
  // CHECK 5: WP3-BDD2-05 — T12 Treasury Cash-Flow Variance & Negative Guards
  // ==========================================================================
  await check(
    'WP3-BDD2-05: T12_CASHFLOW_VARIANCE_TREASURY reconciliation (persisted & schedule-derived), unpaid commitments excluded from actual cash, 3 safe AST variance columns, NO_SUM balance policy, and 409 fail-closed continuity/cutoff/duplicate guards',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 5A. Persisted half-month schedule on p1 (6 periods, pure baseline forecast preserved)
      const t12Res = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t12Res.status, 200);
      const t12Body = await t12Res.json();
      assert.equal(t12Body.templateCode, 'T12_CASHFLOW_VARIANCE_TREASURY');
      assert.equal(t12Body.rowGrain, 'CASH_FLOW_PERIOD');
      assert.equal(t12Body.rowCount, 6);

      const tv = t12Body.treasuryVarianceSummary;
      assert.ok(tv);
      assert.equal(tv.scheduleSourceBasis, 'PERSISTED_CASHFLOW_PERIODS');
      assert.equal(tv.balanceAggregationPolicy, 'NO_SUM_PERIOD_ENDING_AND_PEAK_ONLY');
      assert.equal(tv.actualCashReceiptsTotal, '200000.00');
      // Actual cash paid: H1 = 67,200 (paid AP gross) + 8,960 (paid Expense gross) + 20,000 (released Payroll) = 96,160.00;
      // H2 = 15,000.00 (paid Subcon PaymentRecord); H3..H6 = 0.00 -> Total = 111,160.00!
      // Unpaid AP (22,400), accrued unpaid Expense (4,000), open PO commitment, and unpaid Subcontract commitment (35,000) contribute 0.00!
      assert.equal(tv.actualCashPaidTotal, '111160.00');
      assert.equal(tv.totalForecastCashOutTotal, '668000.00');
      assert.equal(tv.disbursementVarianceTotal, '-556840.00');
      // Running actual treasury cash: H1 = 0 - 96,160 = -96,160.00 (peak gap 96,160.00); H2 = -96,160 + 200,000 - 15,000 = +88,840.00; H3..H6 = +88,840.00!
      assert.equal(tv.endingActualTreasuryClosingCash, '88840.00');
      assert.equal(tv.peakActualTreasuryLiquidityGap, '96160.00');

      const pRows = t12Body.projection.projectedRows;
      assert.equal(pRows[0].visible.actual_cash_receipts_amt, '0.00');
      assert.equal(pRows[0].visible.actual_cash_paid_amt, '96160.00');
      assert.equal(pRows[0].visible.total_forecast_cash_out_amt, '165000.00');
      assert.equal(pRows[0].visible.disbursement_variance_amt, '-68840.00');
      assert.equal(pRows[0].visible.quarterly_closing_cash, '-96160.00');
      assert.equal(pRows[0].visible.quarterly_liquidity_gap, '96160.00');

      assert.equal(pRows[1].visible.actual_cash_receipts_amt, '200000.00');
      assert.equal(pRows[1].visible.actual_cash_paid_amt, '15000.00');
      assert.equal(pRows[1].visible.total_forecast_cash_out_amt, '145000.00');
      assert.equal(pRows[1].visible.disbursement_variance_amt, '-130000.00');
      assert.equal(pRows[1].visible.quarterly_closing_cash, '88840.00');
      assert.equal(pRows[1].visible.quarterly_liquidity_gap, '0.00');

      // Verify NO_SUM headings & zero formula tags in T12 XLSX export
      const colHeadings = Object.fromEntries(
        t12Body.projection.visibleColumns.map((c: any) => [c.fieldId, c.heading])
      );
      assert.equal(colHeadings.quarterly_closing_cash, 'Period Closing Cash (NO_SUM)');
      assert.equal(colHeadings.quarterly_liquidity_gap, 'Period Liquidity Gap (NO_SUM)');

      const t12XlsxRes = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(t12XlsxRes.status, 200);
      const wb12 = new ExcelJS.Workbook();
      await wb12.xlsx.load(Buffer.from(await t12XlsxRes.arrayBuffer()));
      const ws12 = wb12.getWorksheet('T12_CASHFLOW_VARIANCE_TREASURY');
      assert.ok(ws12);
      assert.equal(ws12.rowCount, 7);
      for (let r = 1; r <= ws12.rowCount; r += 1) {
        for (let c = 1; c <= ws12.columnCount; c += 1) {
          assert.equal(ws12.getRow(r).getCell(c).formula, undefined);
        }
      }

      // 5B. Baseline-schedule-derived fallback mode on pCorp
      const t12CorpRes = await postWorking({
        projectId: pCorp,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snapCorp,
        format: 'json',
      });
      assert.equal(t12CorpRes.status, 200);
      const t12CorpBody = await t12CorpRes.json();
      assert.equal(
        t12CorpBody.treasuryVarianceSummary.scheduleSourceBasis,
        'BASELINE_SCHEDULE_DERIVED'
      );
      assert.equal(t12CorpBody.treasuryVarianceSummary.actualCashReceiptsTotal, '80000.00');

      // 5C. Negative: Period gap / discontinuity -> 409 TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID
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

      // 5D. Negative: Post-cutoff actual disbursement mismatch -> 409 TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH
      const tmpPostCutoffExp = prefix + '-TMP-EXP-FUT';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "Expense"(id, amount, date, category, description, "isAccrued", "netAmount", "vatAmount", status, "approvalStatus", "projectId", "loggedById", "approverId", "awardedBoqItemId", "updatedAt")
             VALUES ($1, 5000.00, '2027-05-01T00:00:00.000Z', 'OTHER', 'Post-cutoff paid expense', false, 5000.00, 0.00, 'PAID', 'APPROVED', $2, $3, $3, $4, now())`,
            [tmpPostCutoffExp, p1, s.f.ids.a, boqMob]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "Expense" WHERE id = $1`, [tmpPostCutoffExp]);
        },
        async () => {
          const cutRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(cutRes.status, 409);
          assert.equal((await cutRes.json()).error, 'TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH');
        }
      );

      // 5E. Negative: Duplicate client collection reference across two billings without UboqClientReceipt -> 409 TEMPLATE_DUPLICATE_COLLECTION_REFERENCE
      const tmpDupPay = prefix + '-TMP-PAY-DUP';
      await withTempAdminMutation(
        async () => {
          await admin.query(
            `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
             VALUES ($1, 150000, 150000, 130000, 50000.00, '2026-10-20T00:00:00.000Z', 'OR-D2-GOV-001', 'PAID', $2, now())`,
            [tmpDupPay, bilGovSecond]
          );
        },
        async () => {
          await admin.query(`DELETE FROM "Payment" WHERE id = $1`, [tmpDupPay]);
        },
        async () => {
          const dupRes = await postWorking({
            projectId: p1,
            templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
            sourceId: snap1,
            format: 'json',
          });
          assert.equal(dupRes.status, 409);
          assert.equal((await dupRes.json()).error, 'TEMPLATE_DUPLICATE_COLLECTION_REFERENCE');
        }
      );

      return {
        persistedPeriodCount: t12Body.rowCount,
        actualCashReceiptsTotal: tv.actualCashReceiptsTotal,
        actualCashPaidTotal: tv.actualCashPaidTotal,
        disbursementVarianceTotal: tv.disbursementVarianceTotal,
        endingActualTreasuryClosingCash: tv.endingActualTreasuryClosingCash,
        periodGapRejectedStatus: 409,
        cutoffMismatchRejectedStatus: 409,
        duplicateCollectionRejectedStatus: 409,
      };
    }
  );

  // ==========================================================================
  // CHECK 6: WP3-BDD2-06 — RBAC, Redaction, PostgreSQL FORCE RLS & SensitiveExportLog
  // ==========================================================================
  await check(
    'WP3-BDD2-06: Role-based financial redaction (narrowed executive, SITE_ENGINEER, VIEWER), cross-project isolation, PostgreSQL FORCE RLS on VO tables, formal-audit T12 trigger block, and SensitiveExportLog attestation',
    async () => {
      // 6A. Executive narrowed to PROJECT_MANAGER on p1: sensitive fields stripped & explicit request rejected 403 + logged to SensitiveExportLog(approved=false)
      actor = { userId: synthNarrowedExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const narrowT11 = await postWorking({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(narrowT11.status, 200);
      const narrowT11Body = await narrowT11.json();
      const narrowT11Cols = narrowT11Body.projection.visibleColumns.map((c: any) => c.fieldId);
      assert.ok(narrowT11Cols.includes('vo_client_revenue_delta_amt'));
      assert.equal(narrowT11Cols.includes('vo_subcon_commitment_delta_amt'), false);
      assert.equal(narrowT11Body.variationRegisterSummary.subconCommitmentVoDeltaTotal, null);
      assert.equal(
        'vo_subcon_commitment_delta_amt' in narrowT11Body.projection.projectedRows[0].__oserpMeta,
        false
      );

      const narrowT12 = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(narrowT12.status, 200);
      const narrowT12Body = await narrowT12.json();
      const narrowT12Cols = narrowT12Body.projection.visibleColumns.map((c: any) => c.fieldId);
      assert.ok(narrowT12Cols.includes('receipts_variance_amt'));
      for (const sensCol of [
        'procurement_cash_out_amt',
        'payroll_subcon_cash_out_amt',
        'other_cash_out_amt',
        'total_forecast_cash_out_amt',
        'actual_cash_paid_amt',
        'disbursement_variance_amt',
        'quarterly_closing_cash',
        'quarterly_liquidity_gap',
      ]) {
        assert.equal(narrowT12Cols.includes(sensCol), false, `Sensitive ${sensCol} leaked`);
      }

      const narrowForbidden = await postWorking({
        projectId: p1,
        templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
        sourceId: snap1,
        selectedFields: ['cash_quarter_label', 'disbursement_variance_amt'],
        format: 'json',
      });
      assert.equal(narrowForbidden.status, 403);

      // 6B. SITE_ENGINEER: scope fields only on T11 & T12; zero financial totals in JSON, CSV, XLSX, __OSERP_META, or shared layout auditTrail
      actor = { userId: synthSiteEngUser, role: 'SITE_ENGINEER', sessionVersion: 7 };
      const siteT11 = await postWorking({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(siteT11.status, 200);
      const siteT11Body = await siteT11.json();
      const siteT11Cols = siteT11Body.projection.visibleColumns.map((c: any) => c.fieldId);
      assert.deepEqual(siteT11Cols, [
        'vo_number',
        'vo_classification',
        'phase_code',
        'item_code',
        'work_description',
        'unit',
        'original_qty',
        'vo_approved_qty_delta',
        'approved_qty',
      ]);
      assert.equal(siteT11Body.summaryTotal, null);
      assert.equal('variationRegisterSummary' in siteT11Body, false);

      // Shared T11 layout auditTrail redaction for SITE_ENGINEER
      const listSharedRes = await getLayouts(`projectId=${encodeURIComponent(p1)}`);
      assert.equal(listSharedRes.status, 200);
      const sharedGroups = (await listSharedRes.json()).groups.filter(
        (g: any) => g.latest.templateCode === 'T11_VARIATION_ORDER_REGISTER'
      );
      assert.equal(sharedGroups.length, 1);
      const loadSharedRes = await getLayouts(
        `projectId=${encodeURIComponent(p1)}&layoutRevisionId=${encodeURIComponent(sharedGroups[0].latest.id)}`
      );
      assert.equal(loadSharedRes.status, 200);
      const loadedShared = await loadSharedRes.json();
      assert.equal(
        loadedShared.revision.selectedFields.includes('vo_subcon_commitment_delta_amt'),
        false
      );
      assert.equal(
        loadedShared.revision.selectedFields.includes('vo_client_revenue_delta_amt'),
        false
      );
      assert.equal(
        loadedShared.auditTrail.some((ev: any) => ev.eventType === 'FORMAL_EXPORT_GENERATED'),
        false,
        'SITE_ENGINEER must never receive FORMAL_EXPORT_GENERATED events'
      );

      // 6C. VIEWER: public columns only on T11 & layout creation blocked 403
      actor = { userId: synthViewerUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
      const viewerT11 = await postWorking({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(viewerT11.status, 200);
      const viewerCols = (await viewerT11.json()).projection.visibleColumns.map(
        (c: any) => c.fieldId
      );
      assert.deepEqual(viewerCols, [
        'phase_code',
        'item_code',
        'work_description',
        'unit',
        'original_qty',
        'approved_qty',
      ]);
      const viewerSaveReject = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        templateName: 'Viewer Forbidden Layout',
        sharingScope: 'PRIVATE',
        selectedFields: ['vo_number', 'item_code'],
      });
      assert.equal(viewerSaveReject.status, 403);

      // 6D. Cross-project HTTP & PostgreSQL FORCE RLS + SQL trigger guards
      actor = { userId: synthForeignUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const foreignAccessRes = await getWorking(p1);
      assert.equal(foreignAccessRes.status, 403);

      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const crossSourceRes = await postWorking({
        projectId: p1,
        templateCode: 'T11_VARIATION_ORDER_REGISTER',
        sourceId: snapForeign,
        format: 'json',
      });
      assert.equal(crossSourceRes.status, 404);

      await withSignedRestrictedTx(p1, synthExecUser, 7, async () => {
        // Cross-project SELECT isolation on ClientVariationOrder, SubcontractorVariationOrder, VariationOrder, AIVariationOrderValidation
        const cvoRows = (
          await restrictedClient.query(
            `SELECT id, "projectId" FROM "ClientVariationOrder" WHERE id = ANY($1::text[])`,
            [[cvoMirrorApproved, cvoForeignRow]]
          )
        ).rows;
        assert.equal(cvoRows.length, 1);
        assert.equal(cvoRows[0].id, cvoMirrorApproved);

        const aivRows = (
          await restrictedClient.query(
            `SELECT id FROM "AIVariationOrderValidation" WHERE id = $1`,
            [aivForeignRow]
          )
        ).rows;
        assert.equal(aivRows.length, 0);

        // Cross-project BOQ FK INSERT into ClientVariationOrder must fail RLS WITH CHECK (42501)
        await restrictedClient.query('SAVEPOINT sp_cvo_fk');
        let cvoFkErr = '';
        try {
          await restrictedClient.query(
            `INSERT INTO "ClientVariationOrder"(id, "cvoNumber", "projectId", status, "awardedBoqItemId", "updatedAt")
             VALUES ($1, $2, $3, 'PENDING', $4, now())`,
            [prefix + '-BAD-CVO', 'BAD-CVO-' + hexId, p1, boqForeign]
          );
        } catch (err: any) {
          cvoFkErr = err.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_cvo_fk');
        }
        assert.equal(cvoFkErr, '42501');

        // Direct DELETE on ClientVariationOrder denied (42501)
        await restrictedClient.query('SAVEPOINT sp_cvo_del');
        let cvoDelErr = '';
        try {
          await restrictedClient.query(`DELETE FROM "ClientVariationOrder" WHERE id = $1`, [
            cvoMirrorApproved,
          ]);
        } catch (err: any) {
          cvoDelErr = err.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_cvo_del');
        }
        assert.equal(cvoDelErr, '42501');

        // Direct SQL attempt to log FORMAL_EXPORT_GENERATED on T12_CASHFLOW_VARIANCE_TREASURY blocked by uboq_guard_template_audit_event()
        await restrictedClient.query('SAVEPOINT sp_t12_formal_sql');
        let t12AuditErr = '';
        try {
          await restrictedClient.query(
            `INSERT INTO "UboqTemplateAuditEvent"(id, "projectId", "sharingScope", "templateCode", "eventType", "actorUserId", "actorRole", "sourceId", "sourceVersion", "contractCode", "exportFormat", "outputSha256")
             VALUES ($1, $2, 'SYSTEM_FORMAL_PRESET', 'T12_CASHFLOW_VARIANCE_TREASURY', 'FORMAL_EXPORT_GENERATED', $3, 'FINANCE_DIRECTOR', $4, 'v1', 'ERP_CANONICAL_T11_FORMAL_V1', 'json', repeat('a', 64))`,
            [prefix + '-BAD-AUD-T12', p1, synthExecUser, snap1]
          );
        } catch (err: any) {
          t12AuditErr = err.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_t12_formal_sql');
        }
        assert.ok(['23514', 'P0001', '42501'].includes(t12AuditErr));

        // Direct SQL attempt by signed executive to forge SensitiveExportLog (both direct INSERT and 14-arg function with manual GUC!) blocked
        await restrictedClient.query('SAVEPOINT sp_direct_sel');
        let directSelErr = '';
        try {
          await restrictedClient.query(
            `SELECT set_config('app.uboq_sensitive_export_audit_context', 'on', true)`
          );
          await restrictedClient.query(
            `INSERT INTO "SensitiveExportLog"(id, "userId", "userEmail", role, "projectId", module, "exportType", "recordCount", "dataClassification", approved, blocked)
             VALUES ($1, $2, 'exec@local', 'FINANCE_DIRECTOR', $3, 'UBOQ_EXECUTIVE_TEMPLATES', 'T12_CASHFLOW_VARIANCE_TREASURY:json', 6, 'SENSITIVE', true, false)`,
            [prefix + '-BAD-SEL-INS', synthExecUser, p1]
          );
        } catch (err: any) {
          directSelErr = err.code;
          await restrictedClient.query('ROLLBACK TO SAVEPOINT sp_direct_sel');
        }
        assert.equal(directSelErr, '42501');

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

      // Verify legitimate SensitiveExportLog rows recorded for T11 & T12
      const selRows = (
        await admin.query(
          `SELECT "exportType", approved, count(*)::int AS cnt
           FROM "SensitiveExportLog"
           WHERE "projectId" = $1
           GROUP BY "exportType", approved`,
          [p1]
        )
      ).rows;
      assert.ok(
        selRows.some(
          (r: any) => String(r.exportType).includes('T11_VARIATION_ORDER_REGISTER') && r.approved === true
        )
      );
      assert.ok(
        selRows.some(
          (r: any) => String(r.exportType).includes('T12_CASHFLOW_VARIANCE_TREASURY') && r.approved === true
        )
      );
      assert.ok(selRows.some((r: any) => r.approved === false));

      return {
        narrowedExecSensitiveStripped: true,
        siteEngScopeOnlyVerified: true,
        viewerPublicOnlyVerified: true,
        rlsCrossProjectBlocked: '42501',
        sensitiveExportLogsRecorded: selRows.length,
      };
    }
  );

  // ==========================================================================
  // CHECK 7: WP3-BDD2-07 — Phase D1 Round-Trip & T0–T10 Non-Regression + Chromium E2E
  // ==========================================================================
  await check(
    'WP3-BDD2-07: Phase D1 signed T0/T1 round-trip & T0–T10 non-regression, plus real headless Chromium E2E for T11 working/formal & T12 treasury variance at 1440x900 desktop & 390x844 mobile',
    async () => {
      actor = { userId: synthExecUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 7A. Verify Round-Trip workspace reflects Owner ratification & T11/T12 return ROUNDTRIP_TEMPLATE_NOT_SUPPORTED while signed T1 round-trip still works
      const rtWsRes = await getRoundTrip(p1);
      assert.equal(rtWsRes.status, 200);
      const rtWs = await rtWsRes.json();
      assert.deepEqual(rtWs.reservedPendingContracts, []);
      assert.equal(rtWs.ratifiedPhaseD2Templates.length, 2);
      assert.equal(rtWs.ratifiedPhaseD2Templates[0].electronicSignaturePresent, false);

      for (const tc of ['T11_VARIATION_ORDER_REGISTER', 'T12_CASHFLOW_VARIANCE_TREASURY']) {
        const rtUnsupported = await postRoundTripJson({
          action: 'issue',
          projectId: p1,
          templateCode: tc,
          sourceId: snap1,
          format: 'json',
          layoutMode: 'WORKING_PRESET',
        });
        assert.equal(rtUnsupported.status, 400);
        assert.equal((await rtUnsupported.json()).error, 'ROUNDTRIP_TEMPLATE_NOT_SUPPORTED');
      }

      const rtIssueT1 = await postRoundTripJson({
        action: 'issue',
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        format: 'xlsx',
        layoutMode: 'FORMAL_CONTRACT',
      });
      assert.equal(rtIssueT1.status, 200);
      const t1XlsxBuf = Buffer.from(await rtIssueT1.arrayBuffer());
      const wbT1Rt = new ExcelJS.Workbook();
      await wbT1Rt.xlsx.load(t1XlsxBuf);
      const wsT1Rt = wbT1Rt.getWorksheet('T1_PHASE_BOQ');
      assert.ok(wsT1Rt);
      wsT1Rt.getRow(2).getCell(5).value = '3500 psi @ 28d (Phase D2 RT Non-Regression)';
      const t1EditedBuf = Buffer.from(await wbT1Rt.xlsx.writeBuffer());
      const fd = new FormData();
      fd.append('action', 'verify_import');
      fd.append('projectId', p1);
      fd.append('templateCode', 'T1_PHASE_BOQ');
      fd.append('idempotencyKey', `d2-rt-${hexId}`);
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

      // 7B. T0–T10 smoke non-regression on p1
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

      // 7C. Real Headless Chromium E2E (1440x900 desktop + 390x844 mobile)
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
          '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui;margin:0;padding:16px}*{box-sizing:border-box}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}button,input,select{font:inherit}</style></head><body><h1>Universal BOQ templates (Batch D Phase D2 — T11 &amp; T12)</h1><div id="root"></div><script src="/bundle.js"></script></body></html>'
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

        // Verify ratified governance notice (no pending unratified message!)
        assert.equal(
          await page
            .getByText(
              /T11_VARIATION_ORDER_REGISTER \(RATIFIED_BY_PROJECT_OWNER_2026_11_15\) and T12_CASHFLOW_VARIANCE_TREASURY \(RATIFIED_BY_PROJECT_OWNER_2026_11_15\)/
            )
            .count(),
          1
        );

        // 1. Select T11_VARIATION_ORDER_REGISTER, run working preview & formal preview + download formal XLSX
        await page.getByLabel('Template', { exact: true }).selectOption('T11_VARIATION_ORDER_REGISTER');
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByText(/Approved Client VOs: 1 \| Approved Subcon VOs: 2/).waitFor();

        await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
        await page
          .getByLabel('Formal export preview')
          .getByText('ERP_CANONICAL_T11_FORMAL_V1', { exact: true })
          .waitFor();
        assert.ok((await page.getByText(/Approved client VO delta: 126400\.00/).count()) >= 1);

        const pngT11Desktop = OUT + '/browser-d2-t11-formal-desktop.png';
        await page.screenshot({ path: pngT11Desktop, fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T11 formal desktop overflows 1440px viewport'
        );

        // 390x844 mobile viewport check WITH live rendered T11 formal table on screen
        await page.setViewportSize({ width: 390, height: 844 });
        const pngMobile = OUT + '/browser-d2-t11-t12-mobile.png';
        await page.screenshot({ path: pngMobile, fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T11 mobile overflows 390px viewport'
        );

        await page.setViewportSize({ width: 1440, height: 900 });
        const [dlT11Formal] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: 'Download formal XLSX', exact: true }).click(),
        ]);
        const t11FormalPath = OUT + '/browser-d2-t11-formal.xlsx';
        await dlT11Formal.saveAs(t11FormalPath);

        // 2. Switch to T12_CASHFLOW_VARIANCE_TREASURY on 1440x900 desktop, preview & screenshot live table, then download working XLSX
        await page.getByLabel('Template', { exact: true }).selectOption('T12_CASHFLOW_VARIANCE_TREASURY');
        await page
          .getByText(
            /Internal ERP formal compliance export contracts apply to T0, T1, T4, T5, T6, and T11/
          )
          .waitFor();
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page
          .getByText(/Ending actual treasury cash \(NO_SUM\): 88840\.00/)
          .waitFor();

        const pngT12Desktop = OUT + '/browser-d2-t12-desktop.png';
        await page.screenshot({ path: pngT12Desktop, fullPage: true });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T12 desktop overflows 1440px viewport'
        );

        // Also check 390x844 mobile no-overflow WITH live rendered 16-column T12 table!
        await page.setViewportSize({ width: 390, height: 844 });
        assert.ok(
          await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
          'T12 mobile overflows 390px viewport'
        );

        await page.setViewportSize({ width: 1440, height: 900 });
        const [dlT12Working] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: 'Download working XLSX', exact: true }).click(),
        ]);
        const t12WorkingPath = OUT + '/browser-d2-t12-working.xlsx';
        await dlT12Working.saveAs(t12WorkingPath);

        // Copy screenshots to brain artifact directory for review handoff embedding
        for (const fName of [
          'browser-d2-t11-formal-desktop.png',
          'browser-d2-t12-desktop.png',
          'browser-d2-t11-t12-mobile.png',
        ]) {
          s.fs.copyFileSync(`${OUT}/${fName}`, `${BRAIN_DIR}/${fName}`);
        }

        assert.deepEqual(consoleErrors, []);
        assert.deepEqual(await canonicalSourceDigest(), sourceDigestBefore);

        return {
          browser: 'Chromium headless',
          clientBundleExcludesServerModules: true,
          consoleErrors,
          desktopViewportWidth: 1440,
          mobileViewportWidth: 390,
          t0ToT10SmokeCount: smokeSources.length,
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
          const allProjects = [p1, pCorp, pForeign];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS', 'UBOQ_ROUNDTRIP_IMPORT') AND ("newValue" LIKE $1 OR "newValue" LIKE $2 OR "newValue" LIKE $3)`,
            [`%${p1}%`, `%${pCorp}%`, `%${pForeign}%`]
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
          await admin.query(`DELETE FROM "User" WHERE id = ANY($1::text[])`, [
            [
              synthExecUser,
              synthNarrowedExecUser,
              synthPmUser,
              synthSiteEngUser,
              synthViewerUser,
              synthForeignUser,
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
