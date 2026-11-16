/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-b';
const REPORT_PATH = OUT + '/runtime-tests.json';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch B consolidated runtime, security, SQL/RLS, decimal-accuracy, formal-export, saved-layout, and real Chromium browser E2E verification across T5_ACCOMPLISHMENT_CERT, T6_PROGRESS_BILLING, T7_SCHEDULE_EVM + T0–T4 non-regression.',
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
const prefix = 'SYNTH-WP3-BB-' + hexId;

const p1 = prefix + '-P1-GOV';
const pCorp = prefix + '-P2-CORP';
const pPeza = prefix + '-P3-PEZA';
const pForeign = prefix + '-P4-FOREIGN';

const synthBillingEngUser = prefix + '-USR-BILL-ENG';
const synthSiteEngUser = prefix + '-USR-SITE-ENG';
const synthViewerUser = prefix + '-USR-VIEWER';

const taxGov = prefix + '-TAX-GOV12';
const taxCorp = prefix + '-TAX-CORP12';
const taxPeza = prefix + '-TAX-PEZA0';

const cGov = prefix + '-CA-GOV';
const cCorp = prefix + '-CA-CORP';
const cPeza = prefix + '-CA-PEZA';

const srcDoc = prefix + '-DOC1';

const snap1 = prefix + '-SNAP-GOV1';
const snapCorp = prefix + '-SNAP-CORP1';
const snapPeza = prefix + '-SNAP-PEZA1';
const snapForeign = prefix + '-SNAP-FOREIGN';

// AwardedBOQItems
const boqConc = prefix + '-ABOQ-CONC';
const boqRebar = prefix + '-ABOQ-RBR';
const boqMob = prefix + '-ABOQ-MOB';
const boqCorp = prefix + '-ABOQ-CORP';
const boqPeza = prefix + '-ABOQ-PEZA';
const boqForeign = prefix + '-ABOQ-FOR';

// Snapshot Phase Lines
const plConcP1 = prefix + '-PL-CONC-P1';
const plConcP2 = prefix + '-PL-CONC-P2';
const plRebarP1 = prefix + '-PL-RBR-P1';
const plMobP1 = prefix + '-PL-MOB-P1';
const plCorp1 = prefix + '-PL-CORP-1';
const plPeza1 = prefix + '-PL-PEZA-1';
const plForeign1 = prefix + '-PL-FOR-1';

// Consolidated & PRR smoke for T0-T4 non-regression on p1
const cboqConc = prefix + '-CBOQ-CONC';
const cboqRebar = prefix + '-CBOQ-RBR';
const cgrpConc = prefix + '-CGRP-CONC';
const cgrpRebar = prefix + '-CGRP-RBR';
const clnk1 = prefix + '-CLNK-1';
const clnk2 = prefix + '-CLNK-2';
const clnk3 = prefix + '-CLNK-3';
const est1 = prefix + '-EST-1';
const acctCement = prefix + '-ACCT-CEM';
const prrCement = prefix + '-PRR-CEM';

// Subcontractor + SubcontractPackage (for Subcontractor VO exclusion proof)
const subconEntity = prefix + '-SUBCON-1';
const subPkg1 = prefix + '-SUBPKG-1';

// Variation Orders on p1
const voClientApproved = prefix + '-VO-CLI-APP';
const voiClientApproved = prefix + '-VOI-CLI-APP';
const voClientDraft = prefix + '-VO-CLI-DRF';
const voiClientDraft = prefix + '-VOI-CLI-DRF';
const voSubconApproved = prefix + '-VO-SUB-APP';
const voiSubconApproved = prefix + '-VOI-SUB-APP';

// Accomplishments & Inspections
const accApproved = prefix + '-ACC-APP';
const accItemConc = prefix + '-ACCI-CONC';
const accItemRebar = prefix + '-ACCI-RBR';
const accItemMob = prefix + '-ACCI-MOB';
const inspConc = prefix + '-INSP-CONC';
const inspRebar = prefix + '-INSP-RBR';
const inspMob = prefix + '-INSP-MOB';

const accNoInsp = prefix + '-ACC-NOINSP';
const accItemNoInsp = prefix + '-ACCI-NOINSP';
const inspPending = prefix + '-INSP-PEND';

const accOverCeiling = prefix + '-ACC-OVER';
const accItemOver = prefix + '-ACCI-OVER';
const inspOver = prefix + '-INSP-OVER';

const accDraft = prefix + '-ACC-DRAFT';
const accForeign = prefix + '-ACC-FOR';
const accItemForeign = prefix + '-ACCI-FOR';
const inspForeign = prefix + '-INSP-FOR';

// Billings, BillingItems, Deductions, Payments
const bilGovApproved = prefix + '-BIL-GOV-APP';
const biGovConc = prefix + '-BI-GOV-CONC';
const biGovRebar = prefix + '-BI-GOV-RBR';
const biGovMob = prefix + '-BI-GOV-MOB';
const bdGov = prefix + '-BD-GOV';
const payGovCleared = prefix + '-PAY-GOV-CLR';
const payGovPending = prefix + '-PAY-GOV-PND';

const bilCorpApproved = prefix + '-BIL-CORP-APP';
const biCorp1 = prefix + '-BI-CORP-1';

const bilPezaApproved = prefix + '-BIL-PEZA-APP';
const biPeza1 = prefix + '-BI-PEZA-1';

const bilOverCeiling = prefix + '-BIL-OVER';
const biOver1 = prefix + '-BI-OVER-1';

const bilDraft = prefix + '-BIL-DRAFT';
const bilForeign = prefix + '-BIL-FOR';
const biForeign = prefix + '-BI-FOR';
const bdForeign = prefix + '-BD-FOR';
const payForeign = prefix + '-PAY-FOR';

// Schedules, WBS, Activities, Dependencies, Links, Progress Updates, Cost Ledgers
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
const salloc1 = prefix + '-SALLOC-1';
const spu100 = prefix + '-SPU-100';
const spu200 = prefix + '-SPU-200';
const spu300 = prefix + '-SPU-300';

const schedCyclic = prefix + '-SCH-CYC';
const actC1 = prefix + '-ACT-C1';
const actC2 = prefix + '-ACT-C2';
const depC1 = prefix + '-DEP-C1';
const depC2 = prefix + '-DEP-C2';

const schedDraft = prefix + '-SCH-DRAFT';

const schedForeign = prefix + '-SCH-FOR';
const wbsForeign = prefix + '-WBS-FOR';
const actForeign = prefix + '-ACT-FOR';
const depForeign = prefix + '-DEP-FOR';
const sallocForeign = prefix + '-SALLOC-FOR';
const spuForeign = prefix + '-SPU-FOR';

const pclConcApproved = prefix + '-PCL-CONC-APP';
const pclRebarApproved = prefix + '-PCL-RBR-APP';
const pclRebarPending = prefix + '-PCL-RBR-PND';
const pclForeign = prefix + '-PCL-FOR';

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
    'VariationOrder',
    'VariationOrderItem',
    'Accomplishment',
    'AccomplishmentItem',
    'Inspection',
    'Billing',
    'BillingItem',
    'BillingDeduction',
    'Payment',
    'ProjectSchedule',
    'ScheduleActivity',
    'ScheduleDependency',
    'ScheduleProgressUpdate',
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

function sha256Hex(buf: Buffer | string): string {
  return s.crypto.createHash('sha256').update(buf).digest('hex');
}

(async () => {
  admin = await s.connect();
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

  const { computeSpecSignatureHash } = require('../../src/lib/uboq/validation-engine');
  const concSig = computeSpecSignatureHash('Structural Concrete Class A', '3500 psi @ 28d');
  const rbrSig = computeSpecSignatureHash('Deformed Reinforcing Steel', 'ASTM A615 Grade 60');
  const mobSig = computeSpecSignatureHash('Mobilization & Temporary Facilities', 'General Requirements');
  const cemResSig = computeSpecSignatureHash('Portland Cement Type 1', '40kg Bag ASTM C150');

  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    for (const [uid, role] of [
      [synthBillingEngUser, 'BILLING_ENGINEER'],
      [synthSiteEngUser, 'SITE_ENGINEER'],
      [synthViewerUser, 'PROJECT_MANAGER'],
    ]) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 7, now())`,
        [uid, `${uid.toLowerCase()}@synthetic.local`, role]
      );
    }

    for (const p of [p1, pCorp, pPeza, pForeign]) {
      await admin.query(
        'INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt") VALUES ($1, $1, true, false, now())',
        [p]
      );
    }

    await admin.query(
      `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES
         ($1, $5, $9,  'BILLING_ENGINEER', 'FULL',     'ACTIVE', now()),
         ($2, $6, $9,  'SITE_ENGINEER',    'STANDARD', 'ACTIVE', now()),
         ($3, $7, $9,  'MEMBER',           'VIEWER',   'ACTIVE', now()),
         ($4, $8, $9,  'MEMBER',           'VIEWER',   'ACTIVE', now())`,
      [
        prefix + '-ASN-BILL',
        prefix + '-ASN-SITE',
        prefix + '-ASN-VIEW',
        prefix + '-ASN-LOW',
        synthBillingEngUser,
        synthSiteEngUser,
        synthViewerUser,
        s.f.ids.low,
        p1,
      ]
    );

    // Tax profiles: Gov 12% VAT-inclusive + 5% VAT WHT + 2% EWT; Corporate 12% VAT-exclusive; PEZA 0% Zero-rated
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
         ($1, $4, $7, 'GOVERNMENT', 'DPWH Synthetic District', 'CA-BB-GOV-01',  'NOA-BB-01', 'NTP-BB-01', 'CPO-BB-01', 'CVO-BB-01', 'UNIT_PRICE', 'VAT_INCLUSIVE', 792000.00, 707142.86, 918400.00, 180, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($2, $5, $8, 'PRIVATE',    'Ayala Synthetic Corp',    'CA-BB-CORP-01', NULL,        NULL,        NULL,        NULL,        'UNIT_PRICE', 'VAT_EXCLUSIVE', 200000.00, 200000.00, 200000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now()),
         ($3, $6, $9, 'PRIVATE',    'PEZA Export Manufacturing','CA-BB-PEZA-01', NULL,       NULL,        NULL,        NULL,        'UNIT_PRICE', 'ZERO_RATED',    200000.00, 200000.00, 200000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $10, '2026-08-02T00:00:00.000Z', now())`,
      [cGov, cCorp, cPeza, p1, pCorp, pPeza, taxGov, taxCorp, taxPeza, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'batch-b-source.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8192, $3, '504b0304', 'memory://batch-b', 'CONTRACT_BOQ', $4, true)`,
      [srcDoc, p1, s.hash(srcDoc), s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $5, $9,   $10,  1, 'Gov Baseline v1',    'APPROVED', $13, $14, $17, $17, '2026-08-05T00:00:00.000Z'),
         ($2, $6, NULL, $11,  1, 'Corp Baseline v1',   'APPROVED', $15, NULL, $17, $17, '2026-08-05T00:00:00.000Z'),
         ($3, $7, NULL, $12,  1, 'PEZA Baseline v1',   'APPROVED', $16, NULL, $17, $17, '2026-08-05T00:00:00.000Z'),
         ($4, $8, NULL, NULL, 1, 'Foreign Baseline v1','APPROVED', $18, NULL, $17, $17, '2026-08-05T00:00:00.000Z')`,
      [
        snap1,
        snapCorp,
        snapPeza,
        snapForeign,
        p1,
        pCorp,
        pPeza,
        pForeign,
        srcDoc,
        cGov,
        cCorp,
        cPeza,
        s.hash(snap1),
        s.hash(srcDoc),
        s.hash(snapCorp),
        s.hash(snapPeza),
        s.f.ids.a,
        s.hash(snapForeign),
      ]
    );

    // Canonical AwardedBOQItems
    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
       VALUES
         ($1, '900(1)a', 'STRUCTURAL', 'Structural Concrete Class A',        'm3',  100,  6320,  632000, 20, 120, 6320,  758400, 'APPROVED', $7,  now()),
         ($2, '902(1)a', 'STRUCTURAL', 'Deformed Reinforcing Steel',         'kg',  2000, 55,    110000, 0,  2000, 55,   110000, 'APPROVED', $7,  now()),
         ($3, 'B.9',     'GENERAL',    'Mobilization & Temporary Facilities','lot', 1,    50000, 50000,  0,  1,   50000, 50000,  'APPROVED', $7,  now()),
         ($4, 'C-100',   'CIVIL',      'Corporate Concrete Slab',            'm3',  40,   5000,  200000, 0,  40,  5000,  200000, 'APPROVED', $8,  now()),
         ($5, 'P-100',   'CIVIL',      'PEZA Warehouse Foundation',          'm3',  40,   5000,  200000, 0,  40,  5000,  200000, 'APPROVED', $9,  now()),
         ($6, 'F-100',   'CIVIL',      'Foreign Tenant Scope',               'm3',  10,   5000,  50000,  0,  10,  5000,  50000,  'APPROVED', $10, now())`,
      [boqConc, boqRebar, boqMob, boqCorp, boqPeza, boqForeign, p1, pCorp, pPeza, pForeign]
    );

    // Snapshot Awarded Phase Lines (boqConc spans PHASE-01 [40 m3 @ 6200] & PHASE-02 [60 m3 @ 6400])
    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "awardedBoqItemId", "sourceDocumentId", "itemCode", "phaseCode", "sectionCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
         "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
         "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       )
       VALUES
         ($1, $8,  $12, $16, $22, '900(1)a', 'PHASE-01', 'BLDG-A', 'Structural Concrete Class A', '3500 psi @ 28d',     $23, 'cu.m', 'm3',  'VOLUME',     'UNIT_PRICE', 40.0000,   40.0000,   6200.0000,  248000.00, 221428.57, 'SOURCE_EVIDENCED',    now()),
         ($2, $8,  $12, $16, $22, '900(1)a', 'PHASE-02', 'BLDG-B', 'Structural Concrete Class A', '3500 psi @ 28d',     $23, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 60.0000,   60.0000,   6400.0000,  384000.00, 342857.14, 'SOURCE_NOT_PROVIDED', now()),
         ($3, $8,  $12, $17, $22, '902(1)a', 'PHASE-01', 'BLDG-A', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $24, 'kg',   'kg',  'MASS',       'UNIT_PRICE', 2000.0000, 2000.0000, 55.0000,    110000.00, 98214.29,  'SOURCE_NOT_PROVIDED', now()),
         ($4, $8,  $12, $18, $22, 'B.9',     'PHASE-01', 'GEN',    'Mobilization & Temporary Facilities', 'General Requirements', $25, 'lot', 'lot', 'LUMP_SCOPE', 'LUMP_SUM', 1.0000, 1.0000, 50000.0000, 50000.00, 44642.86, 'SOURCE_NOT_PROVIDED', now()),
         ($5, $9,  $13, $19, NULL,'C-100',   'PHASE-01', 'CORP',   'Corporate Concrete Slab',     '3500 psi @ 28d',     $23, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 40.0000,   40.0000,   5000.0000,  200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($6, $10, $14, $20, NULL,'P-100',   'PHASE-01', 'PEZA',   'PEZA Warehouse Foundation',   '3500 psi @ 28d',     $23, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 40.0000,   40.0000,   5000.0000,  200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($7, $11, $15, $21, NULL,'F-100',   'PHASE-01', 'FOR',    'Foreign Tenant Scope',        '3500 psi @ 28d',     $23, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 10.0000,   10.0000,   5000.0000,  50000.00,  50000.00,  'SOURCE_NOT_PROVIDED', now())`,
      [
        plConcP1,
        plConcP2,
        plRebarP1,
        plMobP1,
        plCorp1,
        plPeza1,
        plForeign1,
        p1,
        pCorp,
        pPeza,
        pForeign,
        snap1,
        snapCorp,
        snapPeza,
        snapForeign,
        boqConc,
        boqRebar,
        boqMob,
        boqCorp,
        boqPeza,
        boqForeign,
        srcDoc,
        concSig,
        rbrSig,
        mobSig,
      ]
    );

    // Minimal T2/T3/T4 fixtures on p1 for non-regression check
    await admin.query(
      `INSERT INTO "ConsolidatedBOQItem"(id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId", "isUboqResourceGoverned", "updatedAt")
       VALUES
         ($1, 'CGRP-BB-1', 'UBOQ_CONSOLIDATED', 'Structural Concrete Class A', 'm3', 100,  4800, 480000, 'APPROVED', $3, true, now()),
         ($2, 'CGRP-BB-2', 'UBOQ_CONSOLIDATED', 'Deformed Reinforcing Steel',  'kg', 2000, 44,   88000,  'APPROVED', $3, true, now())`,
      [cboqConc, cboqRebar, p1]
    );
    await admin.query(
      `INSERT INTO "UboqConsolidationGroup"(id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription", specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily", "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt")
       VALUES
         ($1, $3, $4, 'CGRP-BB-1', 'Structural Concrete Class A', '3500 psi @ 28d',     $6, 'm3', 'VOLUME', 100.0000,  6320.0000, 632000.00, now()),
         ($2, $3, $5, 'CGRP-BB-2', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $7, 'kg', 'MASS',   2000.0000, 55.0000,   110000.00, now())`,
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
       VALUES ($1, $2, $3, 180000.00, 240000.00, 110000.00, 45000.00, 25000.00, 180000.00, 21600.00, 0.00, 14400.00, 10800.00, 46800.00, 5670.0000, 226800.00)`,
      [est1, p1, plConcP1]
    );
    await admin.query(
      `INSERT INTO "UboqCanonicalResourceAccount"(id, "projectId", "consolidatedBoqItemId", "resourceCode", "resourceDescription", "resourceSpec", "specSignatureHash", "resourceClass", "fulfillmentChannel", "resourceUomNormalized", "uomDimensionFamily", "activeApprovedPrId", "activeApprovedQty", "allocatedUsableStockQty", "openMrReservedQty", "openCommittedPoQty", "deliveredReceivedQty", "consumedIssuedQty", "damagedReturnedQty", "availablePhysicalStockQty", "remainingProcurementQty", "isOvercommittedByRevision", "overcommittedQty", "targetResourceUnitCost", "rowVersion", "updatedAt")
       VALUES ($1, $2, $3, 'MAT-CEM-BB', 'Portland Cement Type 1', '40kg Bag ASTM C150', $4, 'MATERIAL', 'SUPPLIER_PO', 'bag_40kg', 'PACK', $5, 900.0000, 100.0000, 0.0000, 200.0000, 0.0000, 0.0000, 0.0000, 100.0000, 600.0000, false, 0.0000, 230.0000, 1, now())`,
      [acctCement, p1, cboqConc, cemResSig, prrCement]
    );
    await admin.query(
      `INSERT INTO "UboqProcurementResourceRequirement"(id, "canonicalResourceId", "projectId", "consolidatedBoqItemId", "snapshotId", "versionNumber", status, "takeoffBasis", "resourceCoeff", "workQuantityBasis", "requiredQty", "benchmarkUnitCost", "procurementBudget", "sourceDocumentId", "preparedById", "approvedById", "approvedAt")
       VALUES ($1, $2, $3, $4, $5, 1, 'APPROVED', 'CONTRACTOR_DETAILED_DUPA', 9.000000, 100.0000, 900.0000, 230.0000, 207000.00, $6, $7, $7, '2026-08-06T00:00:00.000Z')`,
      [prrCement, acctCement, p1, cboqConc, snap1, srcDoc, s.f.ids.a]
    );

    // Subcontractor + SubcontractPackage + Variation Orders (Approved Client VO +20 m3, Draft Client VO +50 m3, Approved Subcon VO +30 m3)
    await admin.query(
      `INSERT INTO "Subcontractor"(id, name, "businessType", accreditation, "contactPerson", "contactNumber", "updatedAt")
       VALUES ($1, 'Synthetic Rebar Subcon Corp', 'CORPORATION', 'APPROVED', 'Engr. Cruz', '09170000000', now())`,
      [subconEntity]
    );
    await admin.query(
      `INSERT INTO "SubcontractPackage"(id, "packageNumber", "projectId", "subcontractorId", "workCategory", "contractType", "scopeOfWork", location, quantity, unit, "unitCost", "contractAmount", "costType", "paymentTerms", status, "updatedAt")
       VALUES ($1, $2, $3, $4, 'CIVIL', 'LABOR_ONLY', 'Pouring only', 'BLDG-A', 100, 'm3', 1500, 150000, 'DIRECT', 'PROGRESS', 'APPROVED', now())`,
      [subPkg1, 'SPKG-' + hexId.toUpperCase(), p1, subconEntity]
    );

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
        'CVO-APP-' + hexId.toUpperCase(),
        'CVO-DRF-' + hexId.toUpperCase(),
        'SVO-APP-' + hexId.toUpperCase(),
        p1,
        subPkg1,
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

    // Accomplishments & Inspections (T5)
    await admin.query(
      `INSERT INTO "Accomplishment"(id, "billingPeriod", "accomplishmentDate", "preparedById", status, "approvedAmount", "projectId", "updatedAt")
       VALUES
         ($1, 'SWA-2026-09', '2026-09-15T00:00:00.000Z', $6, 'APPROVED', 431700.00, $7, now()),
         ($2, 'SWA-NO-INSP', '2026-09-16T00:00:00.000Z', $6, 'APPROVED', 550.00,    $7, now()),
         ($3, 'SWA-OVER',    '2026-09-17T00:00:00.000Z', $6, 'APPROVED', 190000.00, $7, now()),
         ($4, 'SWA-DRAFT',   '2026-09-18T00:00:00.000Z', $6, 'DRAFT',    0.00,      $7, now()),
         ($5, 'SWA-FOREIGN', '2026-09-15T00:00:00.000Z', $6, 'APPROVED', 25000.00,  $8, now())`,
      [accApproved, accNoInsp, accOverCeiling, accDraft, accForeign, s.f.ids.a, p1, pForeign]
    );

    await admin.query(
      `INSERT INTO "AccomplishmentItem"(id, "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "inspectionStatus", "approvalStatus", "accomplishmentId", "boqItemId")
       VALUES
         ($1, 50.0000,  60.0000,  60.0000,  110.0000, 120.0000,  'APPROVED', 'APPROVED', $7,  $11),
         ($2, 500.0000, 500.0000, 500.0000, 1000.0000,2000.0000, 'APPROVED', 'APPROVED', $7,  $12),
         ($3, 0.5000,   0.5000,   0.5000,   1.0000,   1.0000,    'APPROVED', 'APPROVED', $7,  $13),
         ($4, 0.0000,   10.0000,  10.0000,  10.0000,  2000.0000, 'PENDING',  'APPROVED', $8,  $12),
         ($5, 100.0000, 30.0000,  30.0000,  130.0000, 120.0000,  'APPROVED', 'APPROVED', $9,  $11),
         ($6, 0.0000,   5.0000,   5.0000,   5.0000,   10.0000,   'APPROVED', 'APPROVED', $10, $14)`,
      [
        accItemConc,
        accItemRebar,
        accItemMob,
        accItemNoInsp,
        accItemOver,
        accItemForeign,
        accApproved,
        accNoInsp,
        accOverCeiling,
        accForeign,
        boqConc,
        boqRebar,
        boqMob,
        boqForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "Inspection"(id, "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectorName", "dateInspected", "approvalStatus", "accomplishmentItemId")
       VALUES
         ($1, 62.0000,  60.0000,  50.0000,  'QA Engr. Santos', '2026-09-15T00:00:00.000Z', 'APPROVED', $7),
         ($2, 500.0000, 500.0000, 25.0000,  'QA Engr. Santos', '2026-09-15T00:00:00.000Z', 'APPROVED', $8),
         ($3, 0.5000,   0.5000,   50.0000,  'QA Engr. Santos', '2026-09-15T00:00:00.000Z', 'APPROVED', $9),
         ($4, 10.0000,  0.0000,   0.0000,   'QA Engr. Santos', NULL,                       'PENDING',  $10),
         ($5, 30.0000,  30.0000,  25.0000,  'QA Engr. Santos', '2026-09-17T00:00:00.000Z', 'APPROVED', $11),
         ($6, 5.0000,   5.0000,   50.0000,  'Foreign QA',      '2026-09-15T00:00:00.000Z', 'APPROVED', $12)`,
      [
        inspConc,
        inspRebar,
        inspMob,
        inspPending,
        inspOver,
        inspForeign,
        accItemConc,
        accItemRebar,
        accItemMob,
        accItemNoInsp,
        accItemOver,
        accItemForeign,
      ]
    );

    // Progress Billings, Deductions, Payments (T6)
    await admin.query(
      `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
       VALUES
         ($1, $7,  '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 792000, 918400, 363000, 'APPROVED_FOR_PAYMENT', $13, $13, $14, now()),
         ($2, $8,  '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED',             $13, $13, $15, now()),
         ($3, $9,  '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'PAID',                 $13, $13, $16, now()),
         ($4, $10, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-17T00:00:00.000Z', 'PROGRESS', 792000, 918400, 800000, 'APPROVED',             $13, $13, $14, now()),
         ($5, $11, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-18T00:00:00.000Z', 'PROGRESS', 792000, 918400, 100000, 'SUBMITTED',            $13, NULL,$14, now()),
         ($6, $12, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 50000,  50000,  25000,  'APPROVED',             $13, $13, $17, now())`,
      [
        bilGovApproved,
        bilCorpApproved,
        bilPezaApproved,
        bilOverCeiling,
        bilDraft,
        bilForeign,
        'PB-GOV-' + hexId.toUpperCase(),
        'PB-CORP-' + hexId.toUpperCase(),
        'PB-PEZA-' + hexId.toUpperCase(),
        'PB-OVER-' + hexId.toUpperCase(),
        'PB-DRF-' + hexId.toUpperCase(),
        'PB-FOR-' + hexId.toUpperCase(),
        s.f.ids.a,
        p1,
        pCorp,
        pPeza,
        pForeign,
      ]
    );

    // Note: unitCost in BillingItem on biGovConc is intentionally set to 999999.00 to prove T6 strictly enforces Awarded BOQ UboqAwardedPhaseLine.contractUnitRate (6200 / 6400)!
    await admin.query(
      `INSERT INTO "BillingItem"(id, "contractQuantity", "unitCost", "contractAmount", "previousQuantityBilled", "currentQuantityForBilling", "totalQuantityBilledToDate", "billingId", "boqItemId")
       VALUES
         ($1, 120,  999999, 758400, 50.0000,  50.0000,  100.0000, $8,  $13),
         ($2, 2000, 999999, 110000, 500.0000, 400.0000, 900.0000, $8,  $14),
         ($3, 1,    999999, 50000,  0.5000,   0.5000,   1.0000,   $8,  $15),
         ($4, 40,   5000,   200000, 0.0000,   20.0000,  20.0000,  $9,  $16),
         ($5, 40,   5000,   200000, 0.0000,   20.0000,  20.0000,  $10, $17),
         ($6, 120,  6320,   758400, 100.0000, 30.0000,  130.0000, $11, $13),
         ($7, 10,   5000,   50000,  0.0000,   5.0000,   5.0000,   $12, $18)`,
      [
        biGovConc,
        biGovRebar,
        biGovMob,
        biCorp1,
        biPeza1,
        biOver1,
        biForeign,
        bilGovApproved,
        bilCorpApproved,
        bilPezaApproved,
        bilOverCeiling,
        bilForeign,
        boqConc,
        boqRebar,
        boqMob,
        boqCorp,
        boqPeza,
        boqForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "BillingDeduction"(id, "grossBilling", retention, "withholdingTax", vat, "mobilizationAdvanceRecoupment", "liquidatedDamages", "netAmountDue", "billingId")
       VALUES
         ($1, 363000, 36300, 22687.50, 38892.86, 54450, 1500.00, 248062.50, $3),
         ($2, 25000,  2500,  500,      0,        0,     0,       22000,     $4)`,
      [bdGov, bdForeign, bilGovApproved, bilForeign]
    );

    await admin.query(
      `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
       VALUES
         ($1, 363000, 363000, 248062.50, 200000.00, '2026-09-20T00:00:00.000Z', 'OR-GOV-001', 'PAID',    $4, now()),
         ($2, 363000, 363000, 248062.50, 48062.50,  '2026-09-25T00:00:00.000Z', 'CHK-PND-01', 'PENDING', $4, now()),
         ($3, 25000,  25000,  22000.00,  22000.00,  '2026-09-20T00:00:00.000Z', 'OR-FOR-001', 'PAID',    $5, now())`,
      [payGovCleared, payGovPending, payForeign, bilGovApproved, bilForeign]
    );

    // Schedules, WBS, Activities, Dependencies, Allocations, Progress Updates, Cost Ledgers (T7)
    await admin.query(
      `INSERT INTO "ProjectSchedule"(id, "projectId", name, status, "workflowStatus", "baselineRevision", "projectStartDate", "baselineStartDate", "baselineFinishDate", "workDaysConfig", "approvedBy", "approvedAt", "activatedById", "activatedAt", "activationSnapshotHash", "updatedAt")
       VALUES
         ($1, $5, 'Master Baseline Schedule Rev 1', 'BASELINE', 'ACTIVE_BASELINE',     1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $7, '2026-08-25T00:00:00.000Z', $7, '2026-08-25T00:00:00.000Z', $8,  now()),
         ($2, $5, 'Superseded Cyclic Schedule',     'REVISED',  'SUPERSEDED_BASELINE', 0, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-20T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $7, '2026-08-10T00:00:00.000Z', $7, '2026-08-10T00:00:00.000Z', $9,  now()),
         ($3, $5, 'AI Draft Schedule Unapproved',   'DRAFT',    'AI_GENERATED_DRAFT',  2, '2026-09-01T00:00:00.000Z', NULL,                       NULL,                       NULL,                                    NULL, NULL,                     NULL, NULL,                     NULL, now()),
         ($4, $6, 'Foreign Baseline Schedule',      'BASELINE', 'ACTIVE_BASELINE',     1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-20T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $7, '2026-08-25T00:00:00.000Z', $7, '2026-08-25T00:00:00.000Z', $10, now())`,
      [
        schedBaseline,
        schedCyclic,
        schedDraft,
        schedForeign,
        p1,
        pForeign,
        s.f.ids.a,
        s.hash(schedBaseline),
        s.hash(schedCyclic),
        s.hash(schedForeign),
      ]
    );

    await admin.query(
      `INSERT INTO "ScheduleWBS"(id, "scheduleId", code, name, level, "orderIndex", "updatedAt")
       VALUES
         ($1, $3, 'WBS-01',  'Substructure & Structural Works', 1, 1, now()),
         ($2, $4, 'WBS-FOR', 'Foreign WBS',                     1, 1, now())`,
      [wbs1, wbsForeign, schedBaseline, schedForeign]
    );

    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", status, "updatedAt")
       VALUES
         ($1, $7,  $10, 'ACT-100', 'Site Mobilization & Layout',     '2026-09-01T00:00:00.000Z', '2026-09-07T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-07T00:00:00.000Z', 5,  1,    'lot', 50000.00,  'COMPLETED',   now()),
         ($2, $7,  $10, 'ACT-200', 'Structural Concrete Phase 1',    '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 40,   'm3',  248000.00, 'IN_PROGRESS', now()),
         ($3, $7,  $10, 'ACT-300', 'Reinforcing Steel Fabrication',  '2026-09-05T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 4,  2000, 'kg',  110000.00, 'IN_PROGRESS', now()),
         ($4, $8,  NULL,'CYC-1',   'Cyclic Node A',                  '2026-09-01T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-05T00:00:00.000Z', 4,  1,    'lot', 10000.00,  'NOT_STARTED', now()),
         ($5, $8,  NULL,'CYC-2',   'Cyclic Node B',                  '2026-09-05T00:00:00.000Z', '2026-09-10T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-10T00:00:00.000Z', 4,  1,    'lot', 10000.00,  'NOT_STARTED', now()),
         ($6, $9,  $11, 'FOR-1',   'Foreign Activity',               '2026-09-01T00:00:00.000Z', '2026-09-10T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-10T00:00:00.000Z', 5,  10,   'm3',  50000.00,  'IN_PROGRESS', now())`,
      [
        act100,
        act200,
        act300,
        actC1,
        actC2,
        actForeign,
        schedBaseline,
        schedCyclic,
        schedForeign,
        wbs1,
        wbsForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "ScheduleDependency"(id, "scheduleId", "predecessorId", "successorId", type, "lagDays")
       VALUES
         ($1, $6, $9,  $10, 'FS', 0),
         ($2, $6, $9,  $11, 'SS', 2),
         ($3, $7, $12, $13, 'FS', 0),
         ($4, $7, $13, $12, 'FS', 0),
         ($5, $8, $14, $14, 'FS', 0)`,
      [
        dep1,
        dep2,
        depC1,
        depC2,
        depForeign,
        schedBaseline,
        schedCyclic,
        schedForeign,
        act100,
        act200,
        act300,
        actC1,
        actC2,
        actForeign,
      ]
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
      `INSERT INTO "ScheduleBOQAllocation"(id, "activityId", "awardedBoqItemId", "scheduleId", "projectId", "mappedQuantity", "allocatedAmount")
       VALUES
         ($1, $3, $5, $7, $9,  40, 248000.00),
         ($2, $4, $6, $8, $10, 10, 50000.00)`,
      [salloc1, sallocForeign, act200, actForeign, boqConc, boqForeign, schedBaseline, schedForeign, p1, pForeign]
    );

    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $5, $7,  '2026-09-15T00:00:00.000Z', 100, 1,    $11, $12),
         ($2, $5, $8,  '2026-09-15T00:00:00.000Z', 60,  24,   $11, $12),
         ($3, $5, $9,  '2026-09-15T00:00:00.000Z', 50,  1000, $11, $12),
         ($4, $6, $10, '2026-09-15T00:00:00.000Z', 50,  5,    $11, $13)`,
      [
        spu100,
        spu200,
        spu300,
        spuForeign,
        schedBaseline,
        schedForeign,
        act100,
        act200,
        act300,
        actForeign,
        s.f.ids.a,
        accApproved,
        accForeign,
      ]
    );

    await admin.query(
      `INSERT INTO "ProjectCostLedger"(id, "projectId", "costDate", "costCategory", "grossAmount", "netAmount", "approvalStatus", "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, $5, '2026-09-12T00:00:00.000Z', 'MATERIAL', 134400.00, 120000.00, 'APPROVED', $7, now()),
         ($2, $5, '2026-09-13T00:00:00.000Z', 'MATERIAL', 61600.00,  55000.00,  'APPROVED', $8, now()),
         ($3, $5, '2026-09-14T00:00:00.000Z', 'MATERIAL', 99999.00,  99999.00,  'PENDING',  $8, now()),
         ($4, $6, '2026-09-12T00:00:00.000Z', 'MATERIAL', 20000.00,  20000.00,  'APPROVED', $9, now())`,
      [pclConcApproved, pclRebarApproved, pclRebarPending, pclForeign, p1, pForeign, boqConc, boqRebar, boqForeign]
    );
  });

  const sourceDigestBefore = await canonicalSourceDigest();

  actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };
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
  // CHECK 1: Catalog & Formal Contract Discovery + Gating (T0–T7 active, T8–T12 gated)
  // ==========================================================================
  await check(
    'WP3-BB-01 source & formal catalogs expose T0-T7 in order, filter T5/T6/T7 to approved/baseline sources, and gate T8-T12',
    async () => {
      const catRes = await getWorking(p1);
      assert.equal(catRes.status, 200);
      const cat = await catRes.json();
      assert.deepEqual(
        cat.templates.map((t: any) => t.code),
        [
          'T0_MASTER_CONTRACT',
          'T1_PHASE_BOQ',
          'T2_CONSOLIDATED_BOQ',
          'T3_AGENCY_ESTIMATE',
          'T4_RESOURCE_TAKEOFF',
          'T5_ACCOMPLISHMENT_CERT',
          'T6_PROGRESS_BILLING',
          'T7_SCHEDULE_EVM',
        ]
      );

      // Draft accomplishment, submitted/unapproved billing, and AI draft schedule must NOT appear in catalog
      const t5Sources = cat.templates[5].sources.map((x: any) => x.id);
      const t6Sources = cat.templates[6].sources.map((x: any) => x.id);
      const t7Sources = cat.templates[7].sources.map((x: any) => x.id);
      assert.ok(t5Sources.includes(accApproved));
      assert.ok(!t5Sources.includes(accDraft));
      assert.ok(!t5Sources.includes(accForeign));
      assert.ok(t6Sources.includes(bilGovApproved));
      assert.ok(!t6Sources.includes(bilDraft));
      assert.ok(!t6Sources.includes(bilForeign));
      assert.ok(t7Sources.includes(schedBaseline));
      assert.ok(!t7Sources.includes(schedDraft));
      assert.ok(!t7Sources.includes(schedForeign));

      const formalCatRes = await getFormal(p1);
      assert.equal(formalCatRes.status, 200);
      const formalCat = await formalCatRes.json();
      assert.deepEqual(
        formalCat.contracts.map((c: any) => c.contractCode),
        [
          'ERP_CANONICAL_T0_FORMAL_V1',
          'ERP_CANONICAL_T1_FORMAL_V1',
          'ERP_CANONICAL_T4_FORMAL_V1',
          'ERP_CANONICAL_T5_FORMAL_V1',
          'ERP_CANONICAL_T6_FORMAL_V1',
        ]
      );

      // T8–T12 remain gated across all three APIs
      for (const deferredCode of [
        'T8_COST_COMMITMENT',
        'T9_CASH_FLOW_FORECAST',
        'T10_EXECUTIVE_SUMMARY',
        'T11_SPECIALIZED_EXT_A',
        'T12_SPECIALIZED_EXT_B',
      ]) {
        assert.equal(
          (
            await postWorking({
              projectId: p1,
              templateCode: deferredCode,
              sourceId: snap1,
              format: 'json',
            })
          ).status,
          400
        );
        assert.equal(
          (
            await postLayouts({
              action: 'create',
              projectId: p1,
              templateCode: deferredCode,
              templateName: 'Deferred ' + deferredCode,
              selectedFields: ['phase_code'],
            })
          ).status,
          400
        );
        assert.equal(
          (
            await postFormal({
              projectId: p1,
              templateCode: deferredCode,
              sourceId: snap1,
              format: 'json',
            })
          ).status,
          400
        );
      }

      // Unapproved sources rejected 404
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T5_ACCOMPLISHMENT_CERT',
            sourceId: accDraft,
            format: 'json',
          })
        ).status,
        404
      );
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T6_PROGRESS_BILLING',
            sourceId: bilDraft,
            format: 'json',
          })
        ).status,
        404
      );
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T7_SCHEDULE_EVM',
            sourceId: schedDraft,
            format: 'json',
          })
        ).status,
        404
      );

      return {
        activeTemplates: cat.templates.length,
        formalContracts: formalCat.contracts.length,
        t5ApprovedSourceCount: t5Sources.length,
        t6ApprovedSourceCount: t6Sources.length,
        t7BaselineSourceCount: t7Sources.length,
      };
    }
  );

  // ==========================================================================
  // CHECK 2: T5_ACCOMPLISHMENT_CERT Working & Formal SWA (Multi-Phase Pro-Rata, Client VO vs Subcon VO, Inspection VAL-13, Overcertification VAL-14, Exact Output Hashes)
  // ==========================================================================
  await check(
    'WP3-BB-02 T5_ACCOMPLISHMENT_CERT SWA multi-phase pro-rata allocation, Client VO inclusion / Subcon VO exclusion, weighted progress %, VAL-13/14 blocks, and exact JSON/XLSX/CSV formal SHA-256',
    async () => {
      // Working preview with monetary columns included
      const workRes = await postWorking({
        projectId: p1,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accApproved,
        selectedFields: [
          'phase_code',
          'item_code',
          'work_description',
          'unit',
          'vo_reference',
          'approved_qty',
          'prev_certified_qty',
          'current_measured_qty',
          'certified_curr_qty',
          'cum_certified_qty',
          'remaining_qty',
          'physical_progress_pct',
          'contract_unit_rate',
          'prior_certified_amt',
          'certified_curr_amt',
        ],
        format: 'json',
      });
      assert.equal(workRes.status, 200);
      const workJson = await workRes.json();
      assert.equal(workJson.rowCount, 4);
      assert.equal(workJson.approvedLineTotal, null);
      assert.deepEqual(workJson.summaryTotal, {
        fieldId: 'certified_curr_amt',
        basis: 'AWARDED_CONTRACT_REVENUE',
        label: 'Certified current SWA amount',
        amount: '431700.00',
      });

      const p1Conc = workJson.projection.projectedRows.find(
        (r: any) => r.visible.phase_code === 'PHASE-01' && r.visible.item_code === '900(1)a'
      );
      const p2Conc = workJson.projection.projectedRows.find(
        (r: any) => r.visible.phase_code === 'PHASE-02' && r.visible.item_code === '900(1)a'
      );
      assert.ok(p1Conc && p2Conc);
      // Multi-phase pro-rata allocation (40:60): Client VO +20m3 -> +8m3 P1 (48) & +12m3 P2 (72); certified 60m3 -> 24m3 P1 & 36m3 P2 (zero double counting!)
      assert.equal(p1Conc.visible.approved_qty, '48.0000');
      assert.equal(p2Conc.visible.approved_qty, '72.0000');
      assert.equal(p1Conc.visible.certified_curr_qty, '24.0000');
      assert.equal(p2Conc.visible.certified_curr_qty, '36.0000');
      assert.equal(p1Conc.visible.cum_certified_qty, '44.0000');
      assert.equal(p2Conc.visible.cum_certified_qty, '66.0000');
      assert.equal(p1Conc.visible.remaining_qty, '4.0000');
      assert.equal(p2Conc.visible.remaining_qty, '6.0000');
      assert.equal(p1Conc.visible.physical_progress_pct, '91.6667');
      assert.equal(p1Conc.visible.certified_curr_amt, '148800.00');
      assert.equal(p2Conc.visible.certified_curr_amt, '230400.00');

      // Formal T5 JSON export — verify exact HTTP response bytes SHA-256 == header == stored audit row
      const fJsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accApproved,
        format: 'json',
      });
      assert.equal(fJsonRes.status, 200);
      const fJsonBytes = Buffer.from(await fJsonRes.arrayBuffer());
      const fJsonSha = sha256Hex(fJsonBytes);
      assert.equal(fJsonRes.headers.get('X-OSERP-Output-Sha256'), fJsonSha);
      s.fs.mkdirSync(OUT, { recursive: true });
      s.fs.writeFileSync(OUT + '/t5-formal-export.json', fJsonBytes);

      const fJsonBody = JSON.parse(fJsonBytes.toString('utf8'));
      assert.equal(fJsonBody.contract.contractCode, 'ERP_CANONICAL_T5_FORMAL_V1');
      assert.equal(fJsonBody.certifiedCurrentAmountTotal, '431700.00');
      assert.equal(fJsonBody.totals.priorCertifiedAmountTotal, '368500.00');
      assert.equal(fJsonBody.totals.cumulativeCertifiedAmountTotal, '800200.00');
      assert.equal(fJsonBody.totals.revisedContractLineTotal, '918400.00');
      assert.equal(fJsonBody.totals.weightedPhysicalProgressPct, '87.1298');

      const auditT5Json = (
        await admin.query(
          `SELECT "outputSha256", "contractCode", "sourceVersion" FROM "UboqTemplateAuditEvent" WHERE id = $1`,
          [fJsonBody.provenance.auditEventId]
        )
      ).rows[0];
      assert.equal(auditT5Json.outputSha256, fJsonSha);
      assert.equal(auditT5Json.contractCode, 'ERP_CANONICAL_T5_FORMAL_V1');
      assert.equal(auditT5Json.sourceVersion, `${accApproved}@v1`);

      // Formal T5 XLSX export — verify formulas, NO_SUM unit rate, weighted progress %, and SHA-256
      const fXlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accApproved,
        format: 'xlsx',
      });
      assert.equal(fXlsxRes.status, 200);
      const fXlsxBytes = Buffer.from(await fXlsxRes.arrayBuffer());
      const fXlsxSha = sha256Hex(fXlsxBytes);
      assert.equal(fXlsxRes.headers.get('X-OSERP-Output-Sha256'), fXlsxSha);
      s.fs.writeFileSync(OUT + '/t5-formal-export.xlsx', fXlsxBytes);

      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(fXlsxBytes);
      const ws = wb.getWorksheet('T5_Formal_Accomplishment_SWA');
      assert.ok(ws);
      assert.ok(wb.getWorksheet('Formal_Contract_Summary'));
      assert.ok(wb.getWorksheet('__OSERP_META'));
      const totalRow = ws.getRow(6); // 1 header + 4 data rows + 1 total row
      // presetFields: [11 defaults..., vo_reference(12), contract_unit_rate(13), prior_certified_amt(14), certified_curr_amt(15)]
      assert.equal(totalRow.getCell(11).value, 87.1298); // weighted physical_progress_pct (not SUM!)
      assert.equal(totalRow.getCell(13).value, ''); // contract_unit_rate strictly NO_SUM
      assert.deepEqual(totalRow.getCell(15).value, {
        formula: 'SUM(O2:O5)',
        result: 431700,
      });

      // Formal T5 CSV export
      const fCsvRes = await postFormal({
        projectId: p1,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accApproved,
        format: 'csv',
      });
      assert.equal(fCsvRes.status, 200);
      const fCsvBytes = Buffer.from(await fCsvRes.arrayBuffer());
      const fCsvSha = sha256Hex(fCsvBytes);
      assert.equal(fCsvRes.headers.get('X-OSERP-Output-Sha256'), fCsvSha);
      s.fs.writeFileSync(OUT + '/t5-formal-export.csv', fCsvBytes);
      assert.ok(fCsvBytes.toString('utf8').includes('TOTAL_CERTIFIED_ACCOMPLISHMENT_SWA'));

      // VAL-13 negative: missing approved QA/QC Inspection rejected 409 on both working & formal routes
      const noInspWork = await postWorking({
        projectId: p1,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accNoInsp,
        format: 'json',
      });
      assert.equal(noInspWork.status, 409);
      assert.equal((await noInspWork.json()).error, 'TEMPLATE_MISSING_INSPECTION_EVIDENCE');

      const noInspFormal = await postFormal({
        projectId: p1,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accNoInsp,
        format: 'json',
      });
      assert.equal(noInspFormal.status, 409);
      assert.equal((await noInspFormal.json()).error, 'FORMAL_MISSING_INSPECTION_EVIDENCE');

      // VAL-14 negative: cumulative 130 > 120 Client VO ceiling rejected 409 (proving Subcon VO +30 is NOT added!)
      const overCeilingFormal = await postFormal({
        projectId: p1,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accOverCeiling,
        format: 'json',
      });
      assert.equal(overCeilingFormal.status, 409);
      assert.equal((await overCeilingFormal.json()).error, 'FORMAL_OVERBILLING_CEILING_EXCEEDED');

      return {
        certifiedCurrentAmountTotal: '431700.00',
        weightedPhysicalProgressPct: '87.1298',
        jsonSha256: fJsonSha,
        xlsxSha256: fXlsxSha,
        csvSha256: fCsvSha,
      };
    }
  );

  // ==========================================================================
  // CHECK 3: T6_PROGRESS_BILLING Working & Formal Certificate (Awarded BOQ Rate Invariant, Gov/Corp/PEZA Tax Profiles, Penny Reconciliation, VAL-14 & VAL-19)
  // ==========================================================================
  await check(
    'WP3-BB-03 T6_PROGRESS_BILLING Awarded BOQ billing rate invariant, Gov 5%+2% / Corporate 12% ex-VAT / 0% PEZA tax profiles, 0.00 penny reconciliation, Payment collection, VAL-14 & VAL-19',
    async () => {
      // 1. Government 12% VAT-inclusive + 5% Gov VAT WHT + 2% EWT + 10% Retention + 15% Recoupment + 1500 LD
      const fGovJsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilGovApproved,
        format: 'json',
      });
      assert.equal(fGovJsonRes.status, 200);
      const fGovBytes = Buffer.from(await fGovJsonRes.arrayBuffer());
      const fGovSha = sha256Hex(fGovBytes);
      assert.equal(fGovJsonRes.headers.get('X-OSERP-Output-Sha256'), fGovSha);
      s.fs.writeFileSync(OUT + '/t6-formal-export.json', fGovBytes);

      const fGov = JSON.parse(fGovBytes.toString('utf8'));
      assert.equal(fGov.contract.contractCode, 'ERP_CANONICAL_T6_FORMAL_V1');
      // Proves tampered BillingItem.unitCost=999999 was ignored in favor of Awarded BOQ 6200/6400/55/50000!
      assert.equal(fGov.totals.certifiedCurrentAmountTotal, '363000.00');
      assert.equal(fGov.totals.exVatBaseTotal, '324107.14');
      assert.equal(fGov.totals.outputVatTotal, '38892.86');
      assert.equal(fGov.totals.grossBillingTotal, '363000.00');
      assert.equal(fGov.totals.vatWithholdingTotal, '16205.36');
      assert.equal(fGov.totals.ewtWithholdingTotal, '6482.14');
      assert.equal(fGov.totals.withholdingTotal, '22687.50');
      assert.equal(fGov.totals.retentionTotal, '36300.00');
      assert.equal(fGov.totals.advanceRecoupmentTotal, '54450.00');
      assert.equal(fGov.totals.otherDeductionsTotal, '1500.00');
      assert.equal(fGov.totals.netCertifiedDueTotal, '248062.50');
      assert.equal(fGov.totals.paymentReceivedTotal, '200000.00'); // PENDING payment excluded

      // Verify exact column-vertical AND row-horizontal penny reconciliation (0.00 variance)
      const { Prisma } = require('@prisma/client');
      let sumGross = new Prisma.Decimal(0);
      let sumRet = new Prisma.Decimal(0);
      let sumRecoup = new Prisma.Decimal(0);
      let sumWht = new Prisma.Decimal(0);
      let sumNet = new Prisma.Decimal(0);
      for (const r of fGov.projection.projectedRows) {
        const g = new Prisma.Decimal(r.visible.gross_billing);
        const ret = new Prisma.Decimal(r.visible.retention_amt);
        const rec = new Prisma.Decimal(r.visible.advance_recoup);
        const wht = new Prisma.Decimal(r.visible.withholding_amt);
        const oth = new Prisma.Decimal(r.__oserpMeta.other_deductions_exact);
        const net = new Prisma.Decimal(r.visible.net_certified_due);
        assert.equal(
          g.minus(ret).minus(rec).minus(wht).minus(oth).toFixed(2),
          net.toFixed(2),
          'Horizontal billing line equation must hold to 0.00 penny'
        );
        sumGross = sumGross.plus(g);
        sumRet = sumRet.plus(ret);
        sumRecoup = sumRecoup.plus(rec);
        sumWht = sumWht.plus(wht);
        sumNet = sumNet.plus(net);
      }
      assert.equal(sumGross.toFixed(2), '363000.00');
      assert.equal(sumRet.toFixed(2), '36300.00');
      assert.equal(sumRecoup.toFixed(2), '54450.00');
      assert.equal(sumWht.toFixed(2), '22687.50');
      assert.equal(sumNet.toFixed(2), '248062.50');

      // Formal T6 XLSX & CSV exports
      const fGovXlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilGovApproved,
        format: 'xlsx',
      });
      assert.equal(fGovXlsxRes.status, 200);
      const fGovXlsxBytes = Buffer.from(await fGovXlsxRes.arrayBuffer());
      const fGovXlsxSha = sha256Hex(fGovXlsxBytes);
      assert.equal(fGovXlsxRes.headers.get('X-OSERP-Output-Sha256'), fGovXlsxSha);
      s.fs.writeFileSync(OUT + '/t6-formal-export.xlsx', fGovXlsxBytes);

      const wb6 = new ExcelJS.Workbook();
      await wb6.xlsx.load(fGovXlsxBytes);
      const ws6 = wb6.getWorksheet('T6_Formal_Progress_Billing');
      assert.ok(ws6);
      const total6 = ws6.getRow(6);
      // T6 defaultFields: 1:phase_code, 2:item_code, 3:work_description, 4:unit, 5:certified_curr_qty,
      // 6:contract_unit_rate(NO_SUM), 7:certified_curr_amt, 8:gross_billing, 9:retention_amt, 10:advance_recoup, 11:withholding_amt, 12:net_certified_due
      assert.equal(total6.getCell(6).value, ''); // contract_unit_rate NO_SUM
      assert.deepEqual(total6.getCell(7).value, { formula: 'SUM(G2:G5)', result: 363000 });
      assert.deepEqual(total6.getCell(8).value, { formula: 'SUM(H2:H5)', result: 363000 });
      assert.deepEqual(total6.getCell(9).value, { formula: 'SUM(I2:I5)', result: 36300 });
      assert.deepEqual(total6.getCell(10).value, { formula: 'SUM(J2:J5)', result: 54450 });
      assert.deepEqual(total6.getCell(11).value, { formula: 'SUM(K2:K5)', result: 22687.5 });
      assert.deepEqual(total6.getCell(12).value, { formula: 'SUM(L2:L5)', result: 248062.5 });

      const fGovCsvRes = await postFormal({
        projectId: p1,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilGovApproved,
        format: 'csv',
      });
      assert.equal(fGovCsvRes.status, 200);
      const fGovCsvBytes = Buffer.from(await fGovCsvRes.arrayBuffer());
      const fGovCsvSha = sha256Hex(fGovCsvBytes);
      assert.equal(fGovCsvRes.headers.get('X-OSERP-Output-Sha256'), fGovCsvSha);
      s.fs.writeFileSync(OUT + '/t6-formal-export.csv', fGovCsvBytes);
      assert.ok(fGovCsvBytes.toString('utf8').includes('TOTAL_CERTIFIED_PROGRESS_BILLING'));

      // 2. Corporate 12% VAT-Exclusive profile proof (100000 ex-VAT + 12000 VAT = 112000 gross - 2000 EWT - 10000 ret - 10000 recoup = 90000.00)
      const fCorpRes = await postFormal({
        projectId: pCorp,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilCorpApproved,
        format: 'json',
      });
      assert.equal(fCorpRes.status, 200);
      const fCorp = await fCorpRes.json();
      assert.equal(fCorp.totals.exVatBaseTotal, '100000.00');
      assert.equal(fCorp.totals.outputVatTotal, '12000.00');
      assert.equal(fCorp.totals.grossBillingTotal, '112000.00');
      assert.equal(fCorp.totals.withholdingTotal, '2000.00');
      assert.equal(fCorp.totals.netCertifiedDueTotal, '90000.00');

      // 3. PEZA 0% Zero-Rated profile proof (100000 ex-VAT + 0 VAT = 100000 gross - 2000 EWT - 10000 ret = 88000.00)
      const fPezaRes = await postFormal({
        projectId: pPeza,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilPezaApproved,
        format: 'json',
      });
      assert.equal(fPezaRes.status, 200);
      const fPeza = await fPezaRes.json();
      assert.equal(fPeza.totals.outputVatTotal, '0.00');
      assert.equal(fPeza.totals.grossBillingTotal, '100000.00');
      assert.equal(fPeza.totals.netCertifiedDueTotal, '88000.00');

      // 4. VAL-14 Overbilling ceiling rejected 409
      const overBillRes = await postFormal({
        projectId: p1,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilOverCeiling,
        format: 'json',
      });
      assert.equal(overBillRes.status, 409);
      assert.equal((await overBillRes.json()).error, 'FORMAL_OVERBILLING_CEILING_EXCEEDED');

      // 5. VAL-19 Open BLOCKING UboqValidationException blocks formal T5 & T6 exports
      const tempExcId = prefix + '-EXC-BLK';
      await admin.query(
        `INSERT INTO "UboqValidationException"(id, "projectId", "ruleCode", severity, "entityType", message, status)
         VALUES ($1, $2, 'VAL-14', 'BLOCKING', 'Billing', 'Synthetic open blocking exception', 'OPEN')`,
        [tempExcId, p1]
      );
      try {
        const blkT5 = await postFormal({
          projectId: p1,
          templateCode: 'T5_ACCOMPLISHMENT_CERT',
          sourceId: accApproved,
          format: 'json',
        });
        assert.equal(blkT5.status, 409);
        assert.equal((await blkT5.json()).error, 'FORMAL_OPEN_BLOCKING_EXCEPTIONS');

        const blkT6 = await postFormal({
          projectId: p1,
          templateCode: 'T6_PROGRESS_BILLING',
          sourceId: bilGovApproved,
          format: 'json',
        });
        assert.equal(blkT6.status, 409);
        assert.equal((await blkT6.json()).error, 'FORMAL_OPEN_BLOCKING_EXCEPTIONS');
      } finally {
        await admin.query(`DELETE FROM "UboqValidationException" WHERE id = $1`, [tempExcId]);
      }

      return {
        govNetCertifiedDue: '248062.50',
        corpNetCertifiedDue: '90000.00',
        pezaNetCertifiedDue: '88000.00',
        jsonSha256: fGovSha,
        xlsxSha256: fGovXlsxSha,
        csvSha256: fGovCsvSha,
      };
    }
  );

  // ==========================================================================
  // CHECK 4: T7_SCHEDULE_EVM CPM Network, PV/EV/AC/SPI/CPI, Cycle Rejection (VAL-16), and Non-Formal Enforcement
  // ==========================================================================
  await check(
    'WP3-BB-04 T7_SCHEDULE_EVM frozen CPM float & predecessor formatting, PV/EV/AC/SPI/CPI accuracy, pending cost exclusion, VAL-16 cycle rejection, and non-formal gate',
    async () => {
      const t7JsonRes = await postWorking({
        projectId: p1,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedBaseline,
        format: 'json',
      });
      assert.equal(t7JsonRes.status, 200);
      const t7 = await t7JsonRes.json();
      assert.equal(t7.rowGrain, 'SCHEDULE_ACTIVITY');
      assert.equal(t7.rowCount, 3);
      // EV total = 50000.00 + 148800.00 + 55000.00 = 253800.00
      assert.deepEqual(t7.summaryTotal, {
        fieldId: 'earned_value',
        basis: 'AWARDED_CONTRACT_REVENUE',
        label: 'Schedule earned value (EV)',
        amount: '253800.00',
      });

      const r100 = t7.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-100'
      );
      const r200 = t7.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-200'
      );
      const r300 = t7.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-300'
      );
      assert.ok(r100 && r200 && r300);

      assert.equal(r100.visible.predecessors, 'NONE');
      assert.equal(r100.visible.cpm_total_float, 0);
      assert.equal(r100.visible.planned_value, '50000.00');
      assert.equal(r100.visible.earned_value, '50000.00');
      assert.equal(r100.visible.spi, '1.0000');

      assert.equal(r200.visible.predecessors, 'ACT-100(FS)');
      assert.equal(r200.visible.cpm_total_float, 0);
      assert.equal(r200.visible.planned_progress_pct, '50.0000');
      assert.equal(r200.visible.actual_progress_pct, '60.0000');
      assert.equal(r200.visible.planned_value, '124000.00');
      assert.equal(r200.visible.earned_value, '148800.00');
      assert.equal(r200.visible.actual_cost, '120000.00');
      assert.equal(r200.visible.spi, '1.2000');
      assert.equal(r200.visible.cpi, '1.2400');

      assert.equal(r300.visible.predecessors, 'ACT-100(SS+2d)');
      assert.equal(r300.visible.cpm_total_float, 9);
      assert.equal(r300.visible.planned_value, '110000.00');
      assert.equal(r300.visible.earned_value, '55000.00');
      assert.equal(r300.visible.actual_cost, '55000.00'); // PENDING 99999.00 excluded!
      assert.equal(r300.visible.spi, '0.5000');
      assert.equal(r300.visible.cpi, '1.0000');

      // T7 working XLSX & CSV exports succeed
      const t7Xlsx = await postWorking({
        projectId: p1,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedBaseline,
        format: 'xlsx',
      });
      assert.equal(t7Xlsx.status, 200);
      const t7Csv = await postWorking({
        projectId: p1,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedBaseline,
        format: 'csv',
      });
      assert.equal(t7Csv.status, 200);

      // VAL-16 Circular CPM dependency rejected 409
      const cycRes = await postWorking({
        projectId: p1,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedCyclic,
        format: 'json',
      });
      assert.equal(cycRes.status, 409);
      assert.equal((await cycRes.json()).error, 'TEMPLATE_CPM_CIRCULAR_DEPENDENCY');

      // T7 is non-formal (isFormalComplianceOutput: false) -> formal route fails closed 400
      const t7Formal = await postFormal({
        projectId: p1,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedBaseline,
        format: 'json',
      });
      assert.equal(t7Formal.status, 400);
      assert.equal((await t7Formal.json()).error, 'FORMAL_TEMPLATE_CODE_NOT_SUPPORTED');

      return {
        earnedValueTotal: '253800.00',
        act200Spi: '1.2000',
        act200Cpi: '1.2400',
        act300FloatDays: 9,
      };
    }
  );

  // ==========================================================================
  // CHECK 5: Saved Layouts on T5/T6/T7 + Field-Level RBAC + WP3-BA-IR-01 Formal Financial Audit Redaction
  // ==========================================================================
  await check(
    'WP3-BB-05 saved layouts lifecycle (create/version/409 stale/duplicate/load/preview) across T5/T6/T7 + SITE_ENGINEER/VIEWER RBAC & WP3-BA-IR-01 formal audit protection',
    async () => {
      // Create shared T6 layout v1 as SUPER_ADMIN
      const c6Res = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T6_PROGRESS_BILLING',
        templateName: 'Shared Monthly Progress Billing',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'phase_code',
          'item_code',
          'work_description',
          'unit',
          'certified_curr_qty',
          'contract_unit_rate',
          'certified_curr_amt',
          'gross_billing',
          'retention_amt',
          'advance_recoup',
          'withholding_amt',
          'net_certified_due',
        ],
        headingAliases: { net_certified_due: 'Net Certified Amount Payable' },
      });
      assert.equal(c6Res.status, 201);
      const c6 = (await c6Res.json()).revision;

      // Version to v2 (adding payment_received) + verify stale expectedVersionNumber=1 fails 409
      const v6Res = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: c6.layoutGroupId,
        expectedVersionNumber: 1,
        selectedFields: [...c6.selectedFields, 'payment_received'],
        headingAliases: { net_certified_due: 'Net Certified Amount Payable' },
        changeSummary: 'Added collected payment column',
      });
      assert.equal(v6Res.status, 201);
      const v6 = (await v6Res.json()).revision;
      assert.equal(v6.versionNumber, 2);

      const staleRes = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: c6.layoutGroupId,
        expectedVersionNumber: 1,
        selectedFields: c6.selectedFields,
      });
      assert.equal(staleRes.status, 409);

      // Generate formal T6 export using saved layout v2 -> writes FORMAL_EXPORT_GENERATED audit event with T6 financial totals
      const fSavedRes = await postFormal({
        projectId: p1,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilGovApproved,
        layoutRevisionId: v6.id,
        expectedVersionNumber: 2,
        format: 'json',
      });
      assert.equal(fSavedRes.status, 200);

      // Create & duplicate shared T7 layout
      const c7Res = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T7_SCHEDULE_EVM',
        templateName: 'Shared CPM & EVM View',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'activity_id',
          'predecessors',
          'planned_start',
          'planned_finish',
          'cpm_total_float',
          'actual_progress_pct',
          'planned_value',
          'earned_value',
          'actual_cost',
          'spi',
          'cpi',
        ],
      });
      assert.equal(c7Res.status, 201);
      const c7 = (await c7Res.json()).revision;

      const dup7Res = await postLayouts({
        action: 'duplicate',
        projectId: p1,
        sourceRevisionId: c7.id,
        templateName: 'Cloned CPM & EVM View',
      });
      assert.equal(dup7Res.status, 201);

      // Authorized BILLING_ENGINEER can read formal financial audit trail on shared T6 layout
      const prevActor = actor;
      try {
        actor = { userId: synthBillingEngUser, role: 'BILLING_ENGINEER', sessionVersion: 7 };
        const billLoadRes = await getLayouts(
          `projectId=${p1}&layoutGroupId=${c6.layoutGroupId}`
        );
        assert.equal(billLoadRes.status, 200);
        const billLoaded = await billLoadRes.json();
        const billFormalEvents = billLoaded.auditTrail.filter(
          (e: any) => e.eventType === 'FORMAL_EXPORT_GENERATED'
        );
        assert.equal(billFormalEvents.length, 1);
        assert.equal(billFormalEvents[0].details.netCertifiedDueTotal, '248062.50');

        // SITE_ENGINEER RBAC & WP3-BA-IR-01 audit protection:
        // - Can preview physical SWA T5 quantities (summaryTotal=null; commercial rate/amount forbidden 403)
        // - Previewing shared T6 layout strips all 8 restricted monetary columns (retaining only 5 public/internal cols)
        // - Previewing shared T7 layout retains schedule dates/float/progress % while stripping PV/EV/AC/SPI/CPI
        // - Denied formal T5 & T6 exports (403)
        // - Loading shared T6 layout returns ZERO FORMAL_EXPORT_GENERATED audit events & ZERO financial totals (API + DB RLS!)
        actor = { userId: synthSiteEngUser, role: 'SITE_ENGINEER', sessionVersion: 7 };
        const siteT5Work = await postWorking({
          projectId: p1,
          templateCode: 'T5_ACCOMPLISHMENT_CERT',
          sourceId: accApproved,
          format: 'json',
        });
        assert.equal(siteT5Work.status, 200);
        const siteT5Body = await siteT5Work.json();
        assert.equal(siteT5Body.summaryTotal, null);
        assert.equal(siteT5Body.projection.visibleColumns.length, 11);

        const siteT5ForbiddenCol = await postWorking({
          projectId: p1,
          templateCode: 'T5_ACCOMPLISHMENT_CERT',
          sourceId: accApproved,
          selectedFields: ['phase_code', 'item_code', 'certified_curr_amt'],
          format: 'json',
        });
        assert.equal(siteT5ForbiddenCol.status, 403);

        const sitePrevT6 = await postLayouts({
          action: 'preview',
          projectId: p1,
          sourceId: bilGovApproved,
          layoutGroupId: c6.layoutGroupId,
        });
        assert.equal(sitePrevT6.status, 200);
        const sitePrevT6Body = await sitePrevT6.json();
        assert.equal(sitePrevT6Body.summaryTotal, null);
        assert.deepEqual(
          sitePrevT6Body.projection.visibleColumns.map((c: any) => c.fieldId),
          ['phase_code', 'item_code', 'work_description', 'unit', 'certified_curr_qty']
        );

        const sitePrevT7 = await postLayouts({
          action: 'preview',
          projectId: p1,
          sourceId: schedBaseline,
          layoutGroupId: c7.layoutGroupId,
        });
        assert.equal(sitePrevT7.status, 200);
        const sitePrevT7Body = await sitePrevT7.json();
        assert.equal(sitePrevT7Body.summaryTotal, null);
        assert.deepEqual(
          sitePrevT7Body.projection.visibleColumns.map((c: any) => c.fieldId),
          [
            'activity_id',
            'predecessors',
            'planned_start',
            'planned_finish',
            'cpm_total_float',
            'actual_progress_pct',
          ]
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
          403
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
          403
        );

        const siteLoadT6 = await (
          await getLayouts(`projectId=${p1}&layoutGroupId=${c6.layoutGroupId}`)
        ).json();
        assert.equal(
          siteLoadT6.auditTrail.filter((e: any) => e.eventType === 'FORMAL_EXPORT_GENERATED')
            .length,
          0
        );
        assert.ok(!JSON.stringify(siteLoadT6).includes('248062.50'));

        // VIEWER (EXTERNAL_VIEWER fieldAccessRole) sees only public columns & 0 formal audit events
        actor = { userId: synthViewerUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
        const viewerLoadT6 = await (
          await getLayouts(`projectId=${p1}&layoutGroupId=${c6.layoutGroupId}`)
        ).json();
        assert.equal(
          viewerLoadT6.auditTrail.filter((e: any) => e.eventType === 'FORMAL_EXPORT_GENERATED')
            .length,
          0
        );
        assert.ok(!JSON.stringify(viewerLoadT6).includes('248062.50'));
      } finally {
        actor = prevActor;
      }

      // Direct SQL SELECT on UboqTemplateAuditEvent as SITE_ENGINEER & VIEWER returns 0 FORMAL_EXPORT_GENERATED rows
      await withSignedRestrictedTx(p1, synthSiteEngUser, 7, async () => {
        const rows = (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1 AND "eventType" = 'FORMAL_EXPORT_GENERATED'`,
            [p1]
          )
        ).rows;
        assert.equal(rows.length, 0);
      });
      await withSignedRestrictedTx(p1, synthViewerUser, 7, async () => {
        const rows = (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1 AND "eventType" = 'FORMAL_EXPORT_GENERATED'`,
            [p1]
          )
        ).rows;
        assert.equal(rows.length, 0);
      });

      return {
        t6SavedLayoutGroupId: c6.layoutGroupId,
        t7SavedLayoutGroupId: c7.layoutGroupId,
        siteEngineerFormalAuditRows: 0,
        viewerFormalAuditRows: 0,
      };
    }
  );

  // ==========================================================================
  // CHECK 6: Restricted PostgreSQL Role (oserp_compat_app) RLS, Cross-Project Isolation, and Trigger Guards Across All 15 Batch B Tables
  // ==========================================================================
  await check(
    'WP3-BB-06 restricted PostgreSQL role (oserp_compat_app) cross-project RLS isolation across all 15 Batch B tables, unsigned context denial, and Migration #28 trigger guards',
    async () => {
      const batchBTablesWithProjectId = [
        'AwardedBOQItem',
        'Accomplishment',
        'Billing',
        'ProjectSchedule',
        'ScheduleBOQAllocation',
        'ProjectCostLedger',
      ];
      const batchBChildTables = [
        ['AccomplishmentItem', accItemForeign],
        ['Inspection', inspForeign],
        ['BillingItem', biForeign],
        ['BillingDeduction', bdForeign],
        ['Payment', payForeign],
        ['ScheduleWBS', wbsForeign],
        ['ScheduleActivity', actForeign],
        ['ScheduleDependency', depForeign],
        ['ScheduleProgressUpdate', spuForeign],
      ] as const;

      // 1. Signed p1 session attempting to SELECT pForeign rows across all 15 Batch B tables -> 0 rows!
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        for (const tbl of batchBTablesWithProjectId) {
          const r = await restrictedClient.query(
            `SELECT count(*)::int AS cnt FROM "${tbl}" WHERE "projectId" = $1`,
            [pForeign]
          );
          assert.equal(r.rows[0].cnt, 0, `Cross-project leak on ${tbl}`);
        }
        for (const [tbl, foreignId] of batchBChildTables) {
          const r = await restrictedClient.query(
            `SELECT count(*)::int AS cnt FROM "${tbl}" WHERE id = $1`,
            [foreignId]
          );
          assert.equal(r.rows[0].cnt, 0, `Cross-project leak on child table ${tbl}`);
        }
      });

      // 2. Unsigned / forged context returns 0 rows on Batch B tables
      await s.transaction(restrictedClient, async () => {
        await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
        await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [
          s.f.ids.a,
        ]);
        await restrictedClient.query(
          `SELECT set_config('app.current_rls_proof', '0.deadbeef.forged', true)`
        );
        for (const tbl of ['Accomplishment', 'Billing', 'ProjectSchedule', 'AwardedBOQItem']) {
          const r = await restrictedClient.query(`SELECT count(*)::int AS cnt FROM "${tbl}"`);
          assert.equal(r.rows[0].cnt, 0, `Unsigned context leaked rows on ${tbl}`);
        }
      });

      const sqlCodes: Record<string, string> = {};

      // 3. Direct INSERT of deferred T8_COST_COMMITMENT into UboqTemplateDefinition rejected 22023
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(id, "projectId", "layoutGroupId", "sharingScope", "definitionHash", "templateCode", "templateName", "rowGrain", "selectedFieldsJson", "isSystemPreset", "versionNumber", "createdById", "updatedAt")
               VALUES ($1, $2, $3, 'PRIVATE', $4, 'T8_COST_COMMITMENT', 'Deferred T8', 'PHASE_BOQ_LINE', '["phase_code"]'::jsonb, false, 1, $5, now())`,
              [prefix + '-BAD-T8', p1, prefix + '-GRP-T8', 'b'.repeat(64), s.f.ids.a]
            ),
          (err: any) => {
            sqlCodes.deferredT8Layout = err.code;
            return err.code === '22023' && /UBOQ_TEMPLATE_CODE_NOT_ENABLED/.test(err.message);
          }
        );
      });

      // 4. Direct INSERT of grain mismatch (T7_SCHEDULE_EVM + PHASE_BOQ_LINE) rejected 22023
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(id, "projectId", "layoutGroupId", "sharingScope", "definitionHash", "templateCode", "templateName", "rowGrain", "selectedFieldsJson", "isSystemPreset", "versionNumber", "createdById", "updatedAt")
               VALUES ($1, $2, $3, 'PRIVATE', $4, 'T7_SCHEDULE_EVM', 'Bad T7 Grain', 'PHASE_BOQ_LINE', '["activity_id"]'::jsonb, false, 1, $5, now())`,
              [prefix + '-BAD-T7G', p1, prefix + '-GRP-T7G', 'c'.repeat(64), s.f.ids.a]
            ),
          (err: any) => {
            sqlCodes.mismatchedT7Grain = err.code;
            return err.code === '22023' && /UBOQ_TEMPLATE_GRAIN_MISMATCH/.test(err.message);
          }
        );
      });

      // 5. Direct uboq_append_template_audit_event FORMAL_EXPORT_GENERATED for non-formal T7 rejected 22023
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T7_SCHEDULE_EVM','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,'rev1','ERP_CANONICAL_T7_FAKE','json',$5,'{}'::jsonb)`,
              [prefix + '-BAD-T7-AUD', p1, s.f.ids.a, schedBaseline, 'd'.repeat(64)]
            ),
          (err: any) => {
            sqlCodes.nonFormalT7Audit = err.code;
            return err.code === '22023' && /UBOQ_TEMPLATE_AUDIT_NON_FORMAL_TEMPLATE/.test(err.message);
          }
        );
      });

      // 6. Direct uboq_append_template_audit_event FORMAL_EXPORT_GENERATED for uninspected T5 SWA rejected P0001
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T5_ACCOMPLISHMENT_CERT','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T5_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [prefix + '-BAD-T5-INSP', p1, s.f.ids.a, accNoInsp, `${accNoInsp}@v1`, 'e'.repeat(64)]
            ),
          (err: any) => {
            sqlCodes.uninspectedT5Audit = err.code;
            return err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_MISSING_INSPECTION/.test(err.message);
          }
        );
      });

      // 7. Direct uboq_append_template_audit_event FORMAL_EXPORT_GENERATED for unapproved T6 Billing rejected P0001
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T6_PROGRESS_BILLING','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T6_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [prefix + '-BAD-T6-DRF', p1, s.f.ids.a, bilDraft, `${bilDraft}@v1`, 'f'.repeat(64)]
            ),
          (err: any) => {
            sqlCodes.unapprovedT6Audit = err.code;
            return err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE/.test(err.message);
          }
        );
      });

      // 8. Direct table INSERT & DELETE on UboqTemplateAuditEvent rejected 42501
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateAuditEvent"(id, "projectId", "sharingScope", "templateCode", "eventType", "actorUserId", "actorRole")
               VALUES ($1, $2, 'PRIVATE', 'T5_ACCOMPLISHMENT_CERT', 'LAYOUT_CREATED', $3, 'SUPER_ADMIN')`,
              [prefix + '-DIR-INS', p1, s.f.ids.a]
            ),
          (err: any) => {
            sqlCodes.directAuditInsert = err.code;
            return err.code === '42501';
          }
        );
      });
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(`DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1`, [
              p1,
            ]),
          (err: any) => {
            sqlCodes.directAuditDelete = err.code;
            return err.code === '42501';
          }
        );
      });

      return {
        isolatedTablesVerified: batchBTablesWithProjectId.length + batchBChildTables.length,
        sqlCodes,
      };
    }
  );

  // ==========================================================================
  // CHECK 7: T0–T4 Non-Regression Smoke, Source Immutability, and Real Headless Chromium E2E (1440px Desktop & 390px Mobile)
  // ==========================================================================
  await check(
    'WP3-BB-07 T0-T4 non-regression smoke, canonical source immutability, and real headless Chromium E2E across T5/T6/T7 (1440px desktop & 390px mobile)',
    async () => {
      // T0–T4 non-regression smoke
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
      app.use(express.text({ type: '*/*', limit: '32kb' }));
      app.get('/', (_req: any, res: any) =>
        res.send(
          '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui;margin:0;padding:16px}*{box-sizing:border-box}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}button,input,select{font:inherit}</style></head><body><h1>Universal BOQ templates (T0–T7)</h1><div id="root"></div><script src="/bundle.js"></script></body></html>'
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

        // 1. T5_ACCOMPLISHMENT_CERT formal preview on 1440px desktop
        await page.getByLabel('Template', { exact: true }).selectOption('T5_ACCOMPLISHMENT_CERT');
        await page.getByLabel('Approved source', { exact: true }).selectOption(accApproved);
        await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
        await page.getByRole('heading', { name: 'Formal export preview', exact: true }).waitFor();
        assert.equal(await page.getByText(/Certified current work: 431700\.00/).count(), 1);
        assert.equal(await page.getByText(/Weighted physical progress: 87\.1298%/).count(), 1);
        await page.screenshot({ path: OUT + '/browser-t5-formal-desktop.png', fullPage: true });

        // 2. T6_PROGRESS_BILLING formal preview & XLSX download on 1440px desktop + 390px mobile
        await page.getByLabel('Template', { exact: true }).selectOption('T6_PROGRESS_BILLING');
        await page.getByLabel('Approved source', { exact: true }).selectOption(bilGovApproved);
        await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
        await page.getByRole('heading', { name: 'Formal export preview', exact: true }).waitFor();
        assert.equal(await page.getByText(/Net certified due: 248062\.50/).count(), 1);
        assert.equal(await page.getByText(/ERP_CANONICAL_T6_FORMAL_V1/).count() >= 1, true);

        const [dlT6] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: 'Download formal XLSX', exact: true }).click(),
        ]);
        const dlT6Path = OUT + '/browser-t6-formal.xlsx';
        await dlT6.saveAs(dlT6Path);
        const wbBrowser = new ExcelJS.Workbook();
        await wbBrowser.xlsx.readFile(dlT6Path);
        assert.ok(wbBrowser.getWorksheet('T6_Formal_Progress_Billing'));

        await page.screenshot({ path: OUT + '/browser-t6-formal-desktop.png', fullPage: true });
        const fitsDesktopT6 = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        );
        assert.ok(fitsDesktopT6, 'T6 formal preview overflows 1440px desktop viewport');

        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: OUT + '/browser-t6-formal-mobile.png', fullPage: true });
        const fitsMobileT6 = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        );
        assert.ok(fitsMobileT6, 'T6 formal preview overflows 390px mobile viewport');

        // 3. T7_SCHEDULE_EVM working preview & saved layout on 1440px desktop
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.getByLabel('Template', { exact: true }).selectOption('T7_SCHEDULE_EVM');
        await page.getByLabel('Approved source', { exact: true }).selectOption(schedBaseline);
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor();
        assert.equal(
          await page.getByText(/Schedule earned value \(EV\): 253800\.00/).count(),
          1
        );
        assert.equal(await page.getByText(/isFormalComplianceOutput: false/).count(), 1);
        await page.getByLabel('Layout name', { exact: true }).fill('Browser T7 CPM EVM');
        await page.getByRole('button', { name: 'Save new layout', exact: true }).click();
        await page.getByText(/Saved layout "Browser T7 CPM EVM" v1/).waitFor();
        await page.screenshot({ path: OUT + '/browser-t7-desktop.png', fullPage: true });

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
          const allProjects = [p1, pCorp, pPeza, pForeign];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND ("newValue" LIKE $1 OR "newValue" LIKE $2 OR "newValue" LIKE $3 OR "newValue" LIKE $4)`,
            [`%${p1}%`, `%${pCorp}%`, `%${pPeza}%`, `%${pForeign}%`]
          );
          await admin.query(
            `DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqTemplateDefinition" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "ProjectCostLedger" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "ScheduleProgressUpdate" WHERE id LIKE $1`, [
            `${prefix}%`,
          ]);
          await admin.query(`DELETE FROM "ScheduleBOQAllocation" WHERE id LIKE $1`, [`${prefix}%`]);
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
            `DELETE FROM "UboqValidationException" WHERE "projectId" = ANY($1::text[])`,
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
            [synthBillingEngUser, synthSiteEngUser, synthViewerUser],
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
        console.error('CLEANUP ERROR:', e.message);
        process.exitCode = 1;
      } finally {
        await admin.end();
      }
    }
    if (prisma) await prisma.$disconnect();
    save();
  });
