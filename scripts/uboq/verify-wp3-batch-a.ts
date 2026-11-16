/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-a';
const REPORT_PATH = OUT + '/runtime-tests.json';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch A consolidated runtime, security, SQL/RLS, decimal-accuracy, formal-export, saved-layout, and real Chromium browser E2E verification across T0–T4 (T2_CONSOLIDATED_BOQ, T3_AGENCY_ESTIMATE, T4_RESOURCE_TAKEOFF + T0/T1 non-regression).',
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
const prefix = 'SYNTH-WP3-BA-' + hexId;
const synthCleanupProj = 'SYNTH-UBOQ-TEST-WP3BA-' + hexId;

const p1 = prefix + '-P1';
const p2 = prefix + '-P2';

const synthProcMgrUser = prefix + '-USR-PROC-MGR';
const synthEstimatorUser = prefix + '-USR-CHIEF-EST';
const synthSiteEngUser = prefix + '-USR-SITE-ENG';
const synthViewerUser = prefix + '-USR-VIEWER';

const assignProcMgr = prefix + '-ASN-PROC';
const assignEstimator = prefix + '-ASN-EST';
const assignSiteEng = prefix + '-ASN-SITE';
const assignViewer = prefix + '-ASN-VIEW';
const assignLowViewer = prefix + '-ASN-LOW';

const taxGov = prefix + '-TAX-GOV12';
const c1 = prefix + '-CA-APPROVED';
const draftContract = prefix + '-CA-DRAFT';

const srcDoc = prefix + '-DOC1';

const snap1 = prefix + '-S1-WITH-PRR';
const snapNoPrr = prefix + '-S2-NO-PRR';
const draftSnap = prefix + '-S3-DRAFT';
const foreignSnap = prefix + '-S4-FOREIGN';

// Phase lines on snap1:
// 1 & 2: Structural Concrete 3500psi across PHASE-01 (40.25 m3 @ 6200 = 249550.00) & PHASE-02 (59.75 m3 @ 6400 = 382400.00)
//        -> Consolidated CGRP-001: 100.0000 m3, total = 631950.00, weighted rate = 6319.5000
// 3 & 4: Rebar Grade 60 across PHASE-01 (2000.0000 kg @ 55.00 = 110000.00) & PHASE-02 (1.5000 ton = 1500.0000 kg @ 56000.00 = 84000.00)
//        -> Consolidated CGRP-002: 3500.0000 kg, total = 194000.00, weighted rate = 55.4286
// 5 & 6: Distinct Lump Sum Mobilization in PHASE-01 (1 lot = 45000.00) & PHASE-02 (1 lot = 30000.00)
//        -> Must remain UNMERGED (CGRP-003 & CGRP-004)!
// Total T1 & T2 Contract Amount on snap1 = 249550 + 382400 + 110000 + 84000 + 45000 + 30000 = 900950.00
const plConcP1 = prefix + '-PL-CONC-P1';
const plConcP2 = prefix + '-PL-CONC-P2';
const plRebarP1 = prefix + '-PL-RBR-P1';
const plRebarP2 = prefix + '-PL-RBR-P2';
const plLumpP1 = prefix + '-PL-LUMP-P1';
const plLumpP2 = prefix + '-PL-LUMP-P2';
const plNoPrr = prefix + '-PL-NOPRR-1';

const cboqConc = prefix + '-CBOQ-CONC';
const cboqRebar = prefix + '-CBOQ-RBR';
const cboqLump1 = prefix + '-CBOQ-LUMP1';
const cboqLump2 = prefix + '-CBOQ-LUMP2';

const cgrpConc = prefix + '-CGRP-CONC';
const cgrpRebar = prefix + '-CGRP-RBR';
const cgrpLump1 = prefix + '-CGRP-LUMP1';
const cgrpLump2 = prefix + '-CGRP-LUMP2';

const clnk1 = prefix + '-CLNK-1';
const clnk2 = prefix + '-CLNK-2';
const clnk3 = prefix + '-CLNK-3';
const clnk4 = prefix + '-CLNK-4';
const clnk5 = prefix + '-CLNK-5';
const clnk6 = prefix + '-CLNK-6';

// Agency Estimates on snap1 (T3):
// plConcP1: SOURCE_EVIDENCED (Mat 120000 + Lab 50000 + Eq 30000 = EDC 200000; OCM 24000 [12%]; Contingency 4000 [separate, non-double]; Profit 16000 [8%]; 5% DUPA VAT on 244000 = 12200; Indirect = 56200; Total = 256200.00; Sourced ABC = 260000.00)
// plConcP2: DIRECT_COST_ONLY_DERIVED (EDC 100000; OCM 10000; Contingency 0; Profit 6000; 5% DUPA VAT on 116000 = 5800; Indirect = 21800; Total = 121800.00; agencyAbcAmt = NULL -> must stay NULL!)
// plRebarP1..plLumpP2: SOURCE_NOT_PROVIDED (no UboqAgencyEstimateBaseline row -> all 16 estimate fields MUST be NULL!)
const estEvidenced = prefix + '-EST-1';
const estDerivedNoAbc = prefix + '-EST-2';

// Canonical Resources & Approved PRRs on snap1 (T4):
// acctCement (bag_40kg): required=1000, allocStock=150, openMr=200, openPo=300, delivered=100, consumed=80
//   -> stock_available_qty = 150 + 100 - 80 = 170.0000
//   -> resource_to_procure = 1000 - (150 + 200 + 300 + 100) = 250.0000
//   -> internal benchmarkUnitCost = 235.5000, procurementBudget = 235500.00
// acctRebar (kg): required=500, allocStock=0, openMr=0, openPo=400, delivered=180, consumed=50 (overcommitted by 80.0000!)
//   -> stock_available_qty = 0 + 180 - 50 = 130.0000
//   -> resource_to_procure = max(0, 500 - 580) = 0.0000 (overcommitted_qty_exact = 80.0000)
//   -> internal benchmarkUnitCost = 44.2500, procurementBudget = 22125.00
// Total T4 internal procurement budget ceiling = 235500.00 + 22125.00 = 257625.00 (strictly separate from 900950.00 contract BOQ!)
const acctCement = prefix + '-ACCT-CEM';
const acctRebar = prefix + '-ACCT-RBR';
const prrCement = prefix + '-PRR-CEM';
const prrRebar = prefix + '-PRR-RBR';

const synthSupplier = prefix + '-SUP-1';
const synthMr = prefix + '-MR-1';
const synthMrNumber = 'MRF-' + hexId.toUpperCase();
const synthMrItem = prefix + '-MRI-1';
const synthPo = prefix + '-PO-1';
const synthPoNumber = 'PO-' + hexId.toUpperCase();
const synthPoItem = prefix + '-POI-1';

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
    'UboqConsolidationGroup',
    'UboqConsolidationLink',
    'UboqAgencyEstimateBaseline',
    'UboqCanonicalResourceAccount',
    'UboqProcurementResourceRequirement',
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
  const lumpSig = computeSpecSignatureHash('Mobilization & Temporary Facilities', 'General Requirements');
  const cemResSig = computeSpecSignatureHash('Portland Cement Type 1', '40kg Commercial Bag ASTM C150');
  const rbrResSig = computeSpecSignatureHash('Deformed Steel Bar 16mm', 'Grade 60 6m Commercial Length');

  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    for (const [uid, role] of [
      [synthProcMgrUser, 'PROCUREMENT_MANAGER'],
      [synthEstimatorUser, 'CHIEF_ESTIMATOR'],
      [synthSiteEngUser, 'SITE_ENGINEER'],
      [synthViewerUser, 'PROJECT_MANAGER'],
    ]) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 7, now())`,
        [uid, `${uid.toLowerCase()}@synthetic.local`, role]
      );
    }

    for (const p of [p1, p2]) {
      await admin.query(
        'INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt") VALUES ($1, $1, true, false, now())',
        [p]
      );
    }
    await admin.query(
      'INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt") VALUES ($1, $1, true, true, now())',
      [synthCleanupProj]
    );

    await admin.query(
      `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES
         ($1, $2, $11, 'PROCUREMENT_MANAGER', 'FULL', 'ACTIVE', now()),
         ($3, $4, $11, 'CHIEF_ESTIMATOR', 'FULL', 'ACTIVE', now()),
         ($5, $6, $11, 'SITE_ENGINEER', 'STANDARD', 'ACTIVE', now()),
         ($7, $8, $11, 'MEMBER', 'VIEWER', 'ACTIVE', now()),
         ($9, $10, $11, 'MEMBER', 'VIEWER', 'ACTIVE', now())`,
      [
        assignProcMgr,
        synthProcMgrUser,
        assignEstimator,
        synthEstimatorUser,
        assignSiteEng,
        synthSiteEngUser,
        assignViewer,
        synthViewerUser,
        assignLowViewer,
        s.f.ids.low,
        p1,
      ]
    );

    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES ($1, $2, 'GOV_INFRA_VAT12', 'v2026.1', 'GOVERNMENT', 0.120000, 'VATABLE_12', true, 0.100000, 0.150000, 0.020000, 0.050000, true, $3, '2026-08-01T00:00:00.000Z')`,
      [taxGov, p1, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "noaRef", "ntpRef", "clientPoRef", "voReference", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $3, $4, 'GOVERNMENT', 'DPWH Synthetic District', 'CA-BA-2026-01', 'NOA-BA-01', 'NTP-BA-01', 'CPO-BA-01', 'VO-BA-01', 'UNIT_PRICE', 'VAT_INCLUSIVE', 900950.00, 804419.64, 900950.00, 300, '2026-08-15T00:00:00.000Z', 'APPROVED', $5, '2026-08-02T00:00:00.000Z', now()),
         ($2, $3, NULL, 'PRIVATE', 'Draft Client', 'CA-DRAFT', NULL, NULL, NULL, NULL, 'UNIT_PRICE', 'VAT_INCLUSIVE', 1000, 1000, 1000, 30, NULL, 'DRAFT', NULL, NULL, now())`,
      [c1, draftContract, p1, taxGov, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'batch-a-source.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8192, $3, '504b0304', 'memory://batch-a', 'CONTRACT_BOQ', $4, true)`,
      [srcDoc, p1, s.hash(srcDoc), s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $5, $7, $8, 1, 'Baseline v1 with Takeoff', 'APPROVED', $9, $10, $11, $11, '2026-08-03T00:00:00.000Z'),
         ($2, $5, $7, $8, 2, 'Snapshot v2 without PRR', 'APPROVED', $12, $10, $11, $11, '2026-08-04T00:00:00.000Z'),
         ($3, $5, $7, NULL, 3, 'Draft v3', 'DRAFT', $13, NULL, $11, NULL, NULL),
         ($4, $6, NULL, NULL, 1, 'Foreign Project Snapshot', 'APPROVED', $14, NULL, $11, $11, '2026-08-05T00:00:00.000Z')`,
      [
        snap1,
        snapNoPrr,
        draftSnap,
        foreignSnap,
        p1,
        p2,
        srcDoc,
        c1,
        s.hash(snap1),
        s.hash(srcDoc),
        s.f.ids.a,
        s.hash(snapNoPrr),
        s.hash(draftSnap),
        s.hash(foreignSnap),
      ]
    );

    const lumpSig2 = computeSpecSignatureHash(
      'Mobilization & Temporary Facilities',
      'General Requirements Phase 2'
    );

    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "sourceDocumentId", "itemCode", "phaseCode", "sectionCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
         "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
         "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       )
       VALUES
         ($1,  $8, $9,  $11, '900(1)a', 'PHASE-01', 'BLDG-A', 'Structural Concrete Class A', '3500 psi @ 28d', $12, 'cu.m', 'm3',  'VOLUME',     'UNIT_PRICE', 40.2500,   40.2500,   6200.0000,  249550.00, 222812.50, 'SOURCE_EVIDENCED', now()),
         ($2,  $8, $9,  $11, '900(1)a', 'PHASE-02', 'BLDG-B', 'Structural Concrete Class A', '3500 psi @ 28d', $12, 'm3',   'm3',  'VOLUME',     'UNIT_PRICE', 59.7500,   59.7500,   6400.0000,  382400.00, 341428.57, 'DIRECT_COST_ONLY_DERIVED', now()),
         ($3,  $8, $9,  $11, '902(1)a', 'PHASE-01', 'BLDG-A', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $13, 'kg', 'kg',  'MASS',       'UNIT_PRICE', 2000.0000, 2000.0000, 55.0000,    110000.00, 98214.29,  'SOURCE_NOT_PROVIDED', now()),
         ($4,  $8, $9,  $11, '902(1)b', 'PHASE-02', 'BLDG-B', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $13, 'mt', 'ton', 'MASS',       'UNIT_PRICE', 1.5000,    1.5000,    56000.0000, 84000.00,  75000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($5,  $8, $9,  $11, 'B.9',     'PHASE-01', 'GEN',    'Mobilization & Temporary Facilities', 'General Requirements', $14, 'lot', 'lot', 'LUMP_SCOPE', 'LUMP_SUM', 1.0000, 1.0000, 45000.0000, 45000.00, 40178.57, 'SOURCE_NOT_PROVIDED', now()),
         ($6,  $8, $9,  $11, 'B.9',     'PHASE-02', 'GEN',    'Mobilization & Temporary Facilities', 'General Requirements Phase 2', $15, 'lot', 'lot', 'LUMP_SCOPE', 'LUMP_SUM', 1.0000, 1.0000, 30000.0000, 30000.00, 26785.71, 'SOURCE_NOT_PROVIDED', now()),
         ($7,  $8, $10, $11, '100(1)',  'PHASE-01', 'SITE',   '=CMD|Clearing Scope',         'Standard',           $14, 'm2',  'm2',  'AREA',       'UNIT_PRICE', 10.0000,   10.0000,   500.0000,   5000.00,   4464.29,   'SOURCE_NOT_PROVIDED', now())`,
      [
        plConcP1,
        plConcP2,
        plRebarP1,
        plRebarP2,
        plLumpP1,
        plLumpP2,
        plNoPrr,
        p1,
        snap1,
        snapNoPrr,
        srcDoc,
        concSig,
        rbrSig,
        lumpSig,
        lumpSig2,
      ]
    );

    // ConsolidatedBOQItem + UboqConsolidationGroup + UboqConsolidationLink on snap1
    // Note: Intentionally set UboqConsolidationGroup header totalApprovedQty on cgrpConc to 999.0000
    // to prove T2 computes snapshot-scoped quantities from UboqConsolidationLink (40.25 + 59.75 = 100.0000) rather than drifting on later snapshot promotions!
    await admin.query(
      `INSERT INTO "ConsolidatedBOQItem"(id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId", "isUboqResourceGoverned", "updatedAt")
       VALUES
         ($1, 'CGRP-001', 'UBOQ_CONSOLIDATED', 'Structural Concrete Class A', 'm3',  100,  4800, 480000, 'APPROVED', $5, true,  now()),
         ($2, 'CGRP-002', 'UBOQ_CONSOLIDATED', 'Deformed Reinforcing Steel',  'kg',  3500, 44.25, 154875, 'APPROVED', $5, true,  now()),
         ($3, 'CGRP-003', 'UBOQ_CONSOLIDATED', 'Mobilization Phase 1',        'lot', 1,    35000, 35000,  'APPROVED', $5, false, now()),
         ($4, 'CGRP-004', 'UBOQ_CONSOLIDATED', 'Mobilization Phase 2',        'lot', 1,    24000, 24000,  'APPROVED', $5, false, now())`,
      [cboqConc, cboqRebar, cboqLump1, cboqLump2, p1]
    );

    await admin.query(
      `INSERT INTO "UboqConsolidationGroup"(
         id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription",
         specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily",
         "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt"
       )
       VALUES
         ($1, $5, $6, 'CGRP-001', 'Structural Concrete Class A', '3500 psi @ 28d',       $10, 'm3',  'VOLUME',     999.0000,  6319.5000, 999999.00, now()),
         ($2, $5, $7, 'CGRP-002', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60',   $11, 'kg',  'MASS',       3500.0000, 55.4286,   194000.00, now()),
         ($3, $5, $8, 'CGRP-003', 'Mobilization & Temporary Facilities (P1)', 'General Requirements', $12, 'lot', 'LUMP_SCOPE', 1.0000, 45000.0000, 45000.00, now()),
         ($4, $5, $9, 'CGRP-004', 'Mobilization & Temporary Facilities (P2)', 'General Requirements Phase 2', $13, 'lot', 'LUMP_SCOPE', 1.0000, 30000.0000, 30000.00, now())`,
      [
        cgrpConc,
        cgrpRebar,
        cgrpLump1,
        cgrpLump2,
        p1,
        cboqConc,
        cboqRebar,
        cboqLump1,
        cboqLump2,
        concSig,
        rbrSig,
        lumpSig,
        lumpSig2,
      ]
    );

    await admin.query(
      `INSERT INTO "UboqConsolidationLink"(id, "consolidationGroupId", "phaseLineId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $7,  $11, 40.2500,   0.402500),
         ($2, $7,  $12, 59.7500,   0.597500),
         ($3, $8,  $13, 2000.0000, 0.571429),
         ($4, $8,  $14, 1500.0000, 0.428571),
         ($5, $9,  $15, 1.0000,    1.000000),
         ($6, $10, $16, 1.0000,    1.000000)`,
      [
        clnk1,
        clnk2,
        clnk3,
        clnk4,
        clnk5,
        clnk6,
        cgrpConc,
        cgrpRebar,
        cgrpLump1,
        cgrpLump2,
        plConcP1,
        plConcP2,
        plRebarP1,
        plRebarP2,
        plLumpP1,
        plLumpP2,
      ]
    );

    // Agency Estimate Baselines (T3)
    await admin.query(
      `INSERT INTO "UboqAgencyEstimateBaseline"(
         id, "projectId", "phaseLineId", "agencyEdcAmt", "agencyAbcAmt",
         "estimateMaterialCost", "estimateLaborCost", "estimateEquipmentCost",
         "estimatedDirectCost", "ocmAmount", "contingencyOcm", "contractorProfitAmt",
         "estimateVatAmt", "estimatedIndirectCost", "estimatedTotalUnitCost", "estimatedTotalAmount"
       )
       VALUES
         ($1, $3, $4, 200000.00, 260000.00, 120000.00, 50000.00, 30000.00, 200000.00, 24000.00, 4000.00, 16000.00, 12200.00, 56200.00, 6365.2174, 256200.00),
         ($2, $3, $5, 100000.00, NULL,      60000.00,  25000.00, 15000.00, 100000.00, 10000.00, 0.00,    6000.00,  5800.00,  21800.00, 2038.4937, 121800.00)`,
      [estEvidenced, estDerivedNoAbc, p1, plConcP1, plConcP2]
    );

    // Canonical Resource Accounts & Approved PRRs (T4)
    await admin.query(
      `INSERT INTO "UboqCanonicalResourceAccount"(
         id, "projectId", "consolidatedBoqItemId", "resourceCode", "resourceDescription",
         "resourceSpec", "specSignatureHash", "resourceClass", "fulfillmentChannel",
         "resourceUomNormalized", "uomDimensionFamily", "activeApprovedPrId", "activeApprovedQty",
         "allocatedUsableStockQty", "openMrReservedQty", "openCommittedPoQty",
         "deliveredReceivedQty", "consumedIssuedQty", "damagedReturnedQty",
         "availablePhysicalStockQty", "remainingProcurementQty",
         "isOvercommittedByRevision", "overcommittedQty", "targetResourceUnitCost", "rowVersion", "updatedAt"
       )
       VALUES
         ($1, $3, $4, 'MAT-CEM-40KG', 'Portland Cement Type 1', '40kg Commercial Bag ASTM C150', $6, 'MATERIAL', 'SUPPLIER_PO', 'bag_40kg', 'PACK', $8,  1000.0000, 150.0000, 200.0000, 300.0000, 100.0000, 80.0000, 0.0000, 170.0000, 250.0000, false, 0.0000,  235.5000, 1, now()),
         ($2, $3, $5, 'MAT-RBR-16MM', 'Deformed Steel Bar 16mm', 'Grade 60 6m Commercial Length', $7, 'MATERIAL', 'SUPPLIER_PO', 'kg',       'MASS', $9,  500.0000,  0.0000,   0.0000,   400.0000, 180.0000, 50.0000, 0.0000, 130.0000, 0.0000,   true,  80.0000, 44.2500,  2, now())`,
      [acctCement, acctRebar, p1, cboqConc, cboqRebar, cemResSig, rbrResSig, prrCement, prrRebar]
    );

    await admin.query(
      `INSERT INTO "UboqProcurementResourceRequirement"(
         id, "canonicalResourceId", "projectId", "consolidatedBoqItemId", "snapshotId",
         "versionNumber", status, "takeoffBasis", "resourceCoeff", "workQuantityBasis",
         "summaryVerifiedQty", "requiredQty", "benchmarkUnitCost", "procurementBudget",
         "sourceDocumentId", "sourceSheetName", "sourceCellRef", "preparedById", "approvedById", "approvedAt"
       )
       VALUES
         ($1, $3, $5, $6, $8, 1, 'APPROVED', 'CONTRACTOR_DETAILED_DUPA', 10.000000, 100.0000, NULL,     1000.0000, 235.5000, 235500.00, $9, 'DUPA_Takeoff', 'D12', $10, $10, '2026-08-03T02:00:00.000Z'),
         ($2, $4, $5, $7, $8, 1, 'APPROVED', 'SUMMARY_ONLY_VERIFIED',    NULL,      NULL,     500.0000, 500.0000,  44.2500,  22125.00,  $9, 'PRR_Summary',  'F08', $10, $10, '2026-08-03T02:00:00.000Z')`,
      [
        prrCement,
        prrRebar,
        acctCement,
        acctRebar,
        p1,
        cboqConc,
        cboqRebar,
        snap1,
        srcDoc,
        s.f.ids.a,
      ]
    );

    // Seed MRF & Supplier PO linked to prrCement for lineage reference verification
    await admin.query(
      `INSERT INTO "Supplier"(id, name, "isVatable", "isSeedData", "updatedAt") VALUES ($1, 'Synthetic Cement Supplier Inc.', true, false, now())`,
      [synthSupplier]
    );
    await admin.query(
      `INSERT INTO "MaterialRequest"(id, "mrNumber", status, "projectId", "requesterId", "updatedAt")
       VALUES ($1, $2, 'APPROVED', $3, $4, now())`,
      [synthMr, synthMrNumber, p1, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "MaterialRequestItem"(id, quantity, "approvedQuantity", "mrId", "consolidatedBoqItemId", "canonicalResourceId", "uboqResourceRequirementId", "resourceUnit")
       VALUES ($1, 200, 200, $2, $3, $4, $5, 'bag_40kg')`,
      [synthMrItem, synthMr, cboqConc, acctCement, prrCement]
    );
    await admin.query(
      `INSERT INTO "PurchaseOrder"(id, "poNumber", status, "supplierId", "mrId", "totalAmount", "netAmount", "vatAmount", "updatedAt")
       VALUES ($1, $2, 'APPROVED', $3, $4, 70650, 63080.36, 7569.64, now())`,
      [synthPo, synthPoNumber, synthSupplier, synthMr]
    );
    await admin.query(
      `INSERT INTO "PurchaseOrderItem"(id, quantity, "unitCost", "poId", "consolidatedBoqItemId", "canonicalResourceId", "uboqResourceRequirementId", "resourceUnit", "mrItemId")
       VALUES ($1, 300, 235.50, $2, $3, $4, $5, 'bag_40kg', $6)`,
      [synthPoItem, synthPo, cboqConc, acctCement, prrCement, synthMrItem]
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

  await check(
    'WP3-BA-01 source & formal catalogs expose T0-T4 in order, filter T4 sources to PRR-backed approved snapshots, and gate T5-T12',
    async () => {
      const keep = actor;
      actor = null;
      try {
        assert.equal((await getWorking()).status, 401);
        assert.equal((await getLayouts(`projectId=${p1}`)).status, 401);
        assert.equal((await getFormal()).status, 401);
      } finally {
        actor = keep;
      }

      const catRes = await getWorking();
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
        ]
      );
      // T1, T2, T3 see both approved snapshots (snapNoPrr v2 and snap1 v1); T4 sees ONLY snap1 (backed by approved PRRs)
      assert.deepEqual(
        cat.templates[2].sources.map((x: any) => x.id),
        [snapNoPrr, snap1]
      );
      assert.deepEqual(
        cat.templates[3].sources.map((x: any) => x.id),
        [snapNoPrr, snap1]
      );
      assert.deepEqual(
        cat.templates[4].sources.map((x: any) => x.id),
        [snap1]
      );

      const formalCatRes = await getFormal();
      assert.equal(formalCatRes.status, 200);
      const formalCat = await formalCatRes.json();
      assert.deepEqual(
        formalCat.contracts.map((c: any) => c.contractCode),
        [
          'ERP_CANONICAL_T0_FORMAL_V1',
          'ERP_CANONICAL_T1_FORMAL_V1',
          'ERP_CANONICAL_T4_FORMAL_V1',
        ]
      );

      // T5+ remain gated across all three routes
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T5_ACCOMPLISHMENT_CERT',
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
            templateCode: 'T5_ACCOMPLISHMENT_CERT',
            templateName: 'Deferred T5',
            selectedFields: ['phase_code'],
          })
        ).status,
        400
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T5_ACCOMPLISHMENT_CERT',
            sourceId: snap1,
            format: 'json',
          })
        ).status,
        400
      );
      return {
        templateCodes: cat.templates.map((t: any) => t.code),
        formalContracts: formalCat.contracts.map((c: any) => c.contractCode),
      };
    }
  );

  await check(
    'WP3-BA-02 T2_CONSOLIDATED_BOQ merges compatible multi-phase UOMs, keeps LUMP_SCOPE unmerged, isolates snapshot-scoped quantities, and reconciles 0.00 variance with T1',
    async () => {
      const t1Res = await postWorking({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t1Res.status, 200);
      const t1Body = await t1Res.json();
      assert.equal(t1Body.rowCount, 6);
      assert.equal(t1Body.approvedLineTotal, '900950.00');

      const t2Res = await postWorking({
        projectId: p1,
        templateCode: 'T2_CONSOLIDATED_BOQ',
        sourceId: snap1,
        selectedFields: [
          'group_code',
          'work_description',
          'specification',
          'unit',
          'uom_dimension_family',
          'original_qty',
          'approved_qty',
          'contract_unit_rate',
          'contract_line_amount',
        ],
        format: 'json',
      });
      assert.equal(t2Res.status, 200);
      const t2Body = await t2Res.json();
      assert.equal(t2Body.rowGrain, 'CONSOLIDATED_WORK_ITEM');
      assert.equal(t2Body.rowCount, 4);
      // Zero variance against T1 snapshot total!
      assert.equal(t2Body.approvedLineTotal, t1Body.approvedLineTotal);
      assert.equal(t2Body.summaryTotal.amount, '900950.00');
      assert.equal(t2Body.summaryTotal.basis, 'AWARDED_CONTRACT_REVENUE');

      const byGroup = new Map<string, any>(
        t2Body.projection.projectedRows.map((r: any) => [r.visible.group_code, r])
      );
      // CGRP-001: 40.25 + 59.75 = 100.0000 m3 (NOT 999.0000 from group header!), amount 631950.00, weighted rate 6319.5000
      const g1 = byGroup.get('CGRP-001');
      assert.equal(g1.visible.approved_qty, '100.0000');
      assert.equal(g1.visible.original_qty, '100.0000');
      assert.equal(g1.visible.contract_line_amount, '631950.00');
      assert.equal(g1.visible.contract_unit_rate, '6319.5000');
      assert.equal(g1.__oserpMeta.member_phase_line_count, 2);
      assert.equal(g1.__oserpMeta.member_phase_codes, 'PHASE-01,PHASE-02');

      // CGRP-002: 2000 kg + 1.5 ton (1500 kg) = 3500.0000 kg, amount 194000.00, weighted rate 55.4286
      const g2 = byGroup.get('CGRP-002');
      assert.equal(g2.visible.unit, 'kg');
      assert.equal(g2.visible.approved_qty, '3500.0000');
      assert.equal(g2.visible.original_qty, '3500.0000');
      assert.equal(g2.visible.contract_line_amount, '194000.00');
      assert.equal(g2.visible.contract_unit_rate, '55.4286');

      // LUMP_SCOPE lines stay unmerged
      assert.equal(byGroup.get('CGRP-003').visible.contract_line_amount, '45000.00');
      assert.equal(byGroup.get('CGRP-004').visible.contract_line_amount, '30000.00');

      // Verify fallback consolidation on snapNoPrr (no persisted UboqConsolidationLink rows) + CSV formula neutralization
      const t2FallbackCsv = await postWorking({
        projectId: p1,
        templateCode: 'T2_CONSOLIDATED_BOQ',
        sourceId: snapNoPrr,
        format: 'csv',
      });
      assert.equal(t2FallbackCsv.status, 200);
      const csvText = await t2FallbackCsv.text();
      assert.ok(csvText.includes("'=CMD|Clearing Scope"));

      const t2Xlsx = await postWorking({
        projectId: p1,
        templateCode: 'T2_CONSOLIDATED_BOQ',
        sourceId: snap1,
        format: 'xlsx',
      });
      assert.equal(t2Xlsx.status, 200);
      const t2Bytes = Buffer.from(await t2Xlsx.arrayBuffer());
      s.fs.writeFileSync(OUT + '/t2-consolidated-working.xlsx', t2Bytes);
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(t2Bytes);
      assert.equal(wb.getWorksheet('__OSERP_META').state, 'veryHidden');

      return {
        t1Total: t1Body.approvedLineTotal,
        t2Total: t2Body.approvedLineTotal,
        variance: '0.00',
        xlsxSha256: sha256Hex(t2Bytes),
      };
    }
  );

  await check(
    'WP3-BA-03 T3_AGENCY_ESTIMATE enforces R1-M02 sourced agency_abc integrity, TAX-01 5% DUPA estimate VAT separation from 12% output VAT, and VAL-10 non-double contingency',
    async () => {
      const t3Res = await postWorking({
        projectId: p1,
        templateCode: 'T3_AGENCY_ESTIMATE',
        sourceId: snap1,
        selectedFields: [
          'phase_code',
          'item_code',
          'work_description',
          'unit',
          'approved_qty',
          'agency_edc_amt',
          'agency_abc',
          'estimate_material_cost',
          'estimate_labor_cost',
          'estimate_equipment_cost',
          'estimated_direct_cost',
          'ocm_rate',
          'ocm_amount',
          'contingency_ocm',
          'contractor_profit_rate',
          'contractor_profit_amt',
          'estimate_vat_rate',
          'estimate_vat_amt',
          'estimated_indirect_cost',
          'estimated_total_unit_cost',
          'estimated_total_amount',
          'estimate_vat_component_rate',
          'estimate_vat_component_base',
        ],
        format: 'json',
      });
      assert.equal(t3Res.status, 200);
      const t3Body = await t3Res.json();
      assert.equal(t3Body.rowCount, 6);
      // T3 is NOT an Awarded Contract BOQ -> approvedLineTotal must be null; summaryTotal carries Agency POW/DUPA basis
      assert.equal(t3Body.approvedLineTotal, null);
      assert.equal(t3Body.summaryTotal.basis, 'AGENCY_POW_DUPA_ESTIMATE');
      assert.equal(t3Body.summaryTotal.amount, '378000.00'); // 256200.00 + 121800.00

      const byLineId = new Map<string, any>(
        t3Body.projection.projectedRows.map((r: any) => [r.__oserpMeta.boq_line_id, r])
      );

      // Line 1: SOURCE_EVIDENCED
      const r1 = byLineId.get(plConcP1);
      assert.equal(r1.__oserpMeta.agency_estimate_status, 'SOURCE_EVIDENCED');
      assert.equal(r1.visible.estimated_direct_cost, '200000.00');
      assert.equal(r1.visible.agency_abc, '260000.00');
      assert.equal(r1.visible.ocm_rate, '12.0000');
      assert.equal(r1.visible.contingency_ocm, '4000.00');
      assert.equal(r1.visible.contractor_profit_rate, '8.0000');
      // TAX-01: 5.0000% DUPA estimate VAT component on 244,000.00 base (NOT 12% statutory output VAT!)
      assert.equal(r1.visible.estimate_vat_component_base, '244000.00');
      assert.equal(r1.visible.estimate_vat_component_rate, '5.0000');
      assert.equal(r1.visible.estimate_vat_amt, '12200.00');
      // VAL-10: Indirect = 24000 + 4000 + 16000 + 12200 = 56200.00 (contingency counted once)
      assert.equal(r1.visible.estimated_indirect_cost, '56200.00');
      assert.equal(r1.visible.estimated_total_amount, '256200.00');

      // Line 2: DIRECT_COST_ONLY_DERIVED (agencyAbcAmt is NULL -> R1-M02 forbids fabricating agency_abc!)
      const r2 = byLineId.get(plConcP2);
      assert.equal(r2.__oserpMeta.agency_estimate_status, 'DIRECT_COST_ONLY_DERIVED');
      assert.equal(r2.visible.agency_abc, null);
      assert.equal(r2.visible.estimated_total_amount, '121800.00');

      // Line 3: SOURCE_NOT_PROVIDED (R1-M02 / H06: all 16 estimate fields strictly null!)
      const r3 = byLineId.get(plRebarP1);
      assert.equal(r3.__oserpMeta.agency_estimate_status, 'SOURCE_NOT_PROVIDED');
      assert.equal(r3.visible.estimated_direct_cost, null);
      assert.equal(r3.visible.estimated_total_amount, null);
      assert.equal(r3.visible.agency_abc, null);

      const t3CsvRes = await postWorking({
        projectId: p1,
        templateCode: 'T3_AGENCY_ESTIMATE',
        sourceId: snap1,
        format: 'csv',
      });
      assert.equal(t3CsvRes.status, 200);
      const t3Csv = await t3CsvRes.text();
      s.fs.writeFileSync(OUT + '/t3-agency-estimate-working.csv', t3Csv);

      return {
        estimatedTotal: t3Body.summaryTotal.amount,
        sourcedAbcPreserved: r1.visible.agency_abc,
        missingAbcRemainsNull: r2.visible.agency_abc === null,
        sourceNotProvidedRemainsNull: r3.visible.estimated_total_amount === null,
        csvSha256: sha256Hex(t3Csv),
      };
    }
  );

  await check(
    'WP3-BA-04 T4_RESOURCE_TAKEOFF computes exact 4dp stock/procurement balances, surfaces MRF/PO lineage, flags overcommitments, and strictly isolates Benchmark/PRR ceilings from Awarded BOQ revenue',
    async () => {
      const t4Res = await postWorking({
        projectId: p1,
        templateCode: 'T4_RESOURCE_TAKEOFF',
        sourceId: snap1,
        selectedFields: [
          'resource_id',
          'group_code',
          'resource_description',
          'resource_spec',
          'resource_unit',
          'resource_qty_basis',
          'resource_coeff',
          'resource_summary_qty',
          'resource_required_qty',
          'allocated_usable_stock_qty',
          'open_mr_reserved_qty',
          'committed_qty',
          'delivered_received_qty',
          'consumed_issued_qty',
          'stock_available_qty',
          'resource_to_procure',
          'target_resource_cost',
          'procurement_budget',
          'mrf_id',
          'supplier_po_id',
        ],
        format: 'json',
      });
      assert.equal(t4Res.status, 200);
      const t4Body = await t4Res.json();
      assert.equal(t4Body.rowGrain, 'CANONICAL_RESOURCE');
      assert.equal(t4Body.rowCount, 2);
      assert.equal(t4Body.approvedLineTotal, null);
      assert.equal(t4Body.summaryTotal.basis, 'INTERNAL_PRR_BENCHMARK_COST');
      assert.equal(t4Body.summaryTotal.amount, '257625.00');

      const serializedT4 = JSON.stringify(t4Body);
      // Strict separation: Awarded BOQ contract rates/amounts (6200, 6400, 900950.00) and fields never appear in T4!
      assert.ok(!serializedT4.includes('contract_unit_rate'));
      assert.ok(!serializedT4.includes('contract_line_amount'));
      assert.ok(!serializedT4.includes('900950'));

      const byResCode = new Map<string, any>(
        t4Body.projection.projectedRows.map((r: any) => [r.visible.resource_id, r])
      );
      const cem = byResCode.get('MAT-CEM-40KG');
      assert.equal(cem.visible.group_code, 'CGRP-001');
      assert.equal(cem.visible.stock_available_qty, '170.0000');
      assert.equal(cem.visible.resource_to_procure, '250.0000');
      assert.equal(cem.visible.target_resource_cost, '235.5000');
      assert.equal(cem.visible.procurement_budget, '235500.00');
      assert.equal(cem.visible.mrf_id, synthMrNumber);
      assert.equal(cem.visible.supplier_po_id, synthPoNumber);
      assert.equal(cem.__oserpMeta.is_overcommitted_by_revision, false);

      const rbr = byResCode.get('MAT-RBR-16MM');
      assert.equal(rbr.visible.group_code, 'CGRP-002');
      assert.equal(rbr.visible.stock_available_qty, '130.0000');
      assert.equal(rbr.visible.resource_to_procure, '0.0000');
      assert.equal(rbr.visible.target_resource_cost, '44.2500');
      assert.equal(rbr.visible.procurement_budget, '22125.00');
      assert.equal(rbr.__oserpMeta.is_overcommitted_by_revision, true);
      assert.equal(rbr.__oserpMeta.overcommitted_qty_exact, '80.0000');

      // Snapshot without PRRs returns 404 on T4 working copy
      assert.equal(
        (
          await postWorking({
            projectId: p1,
            templateCode: 'T4_RESOURCE_TAKEOFF',
            sourceId: snapNoPrr,
            format: 'json',
          })
        ).status,
        404
      );

      return {
        procurementBudgetTotal: t4Body.summaryTotal.amount,
        cementStockAvailable: cem.visible.stock_available_qty,
        cementToProcure: cem.visible.resource_to_procure,
        rebarOvercommittedQty: rbr.__oserpMeta.overcommitted_qty_exact,
      };
    }
  );

  await check(
    'WP3-BA-05 formal ERP_CANONICAL_T4_FORMAL_V1 enforces exact-byte SHA-256 across JSON/XLSX/CSV, live Excel SUM formula (NO_SUM on unit cost), VAL-19 blocking gate, and rejects non-formal T2/T3',
    async () => {
      // Non-formal T2 and T3 rejected on formal-export
      for (const nonFormal of ['T2_CONSOLIDATED_BOQ', 'T3_AGENCY_ESTIMATE']) {
        const nfRes = await postFormal({
          projectId: p1,
          templateCode: nonFormal,
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(nfRes.status, 400);
        assert.equal((await nfRes.json()).error, 'FORMAL_TEMPLATE_CODE_NOT_SUPPORTED');
      }

      // Empty-PRR snapshot rejected on T4 formal export with 409 FORMAL_EMPTY_RESOURCE_TAKEOFF
      const emptyPrrFormal = await postFormal({
        projectId: p1,
        templateCode: 'T4_RESOURCE_TAKEOFF',
        sourceId: snapNoPrr,
        format: 'json',
      });
      assert.equal(emptyPrrFormal.status, 409);
      assert.equal((await emptyPrrFormal.json()).error, 'FORMAL_EMPTY_RESOURCE_TAKEOFF');

      // Positive T4 formal exports across JSON, XLSX, and CSV: verify exact-byte SHA-256 == header == stored audit record
      const digests: Record<string, string> = {};
      for (const format of ['json', 'xlsx', 'csv'] as const) {
        const res = await postFormal({
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          sourceId: snap1,
          format,
        });
        assert.equal(res.status, 200, await res.clone().text());
        const rawBytes = Buffer.from(await res.arrayBuffer());
        const computedSha = sha256Hex(rawBytes);
        const headerSha = res.headers.get('X-OSERP-Output-Sha256');
        const auditId = res.headers.get('X-OSERP-Audit-Event-Id');
        assert.equal(res.headers.get('X-OSERP-Formal-Contract'), 'ERP_CANONICAL_T4_FORMAL_V1');
        assert.equal(headerSha, computedSha);

        const dbAudit = (
          await admin.query(
            `SELECT "contractCode", "exportFormat", "outputSha256", "sourceVersion" FROM "UboqTemplateAuditEvent" WHERE id = $1`,
            [auditId]
          )
        ).rows[0];
        assert.equal(dbAudit.contractCode, 'ERP_CANONICAL_T4_FORMAL_V1');
        assert.equal(dbAudit.exportFormat, format);
        assert.equal(dbAudit.outputSha256, computedSha);
        assert.equal(dbAudit.sourceVersion, '1');
        digests[format] = computedSha;

        if (format === 'json') {
          const parsed = JSON.parse(rawBytes.toString('utf8'));
          assert.equal(parsed.provenance.auditEventId, auditId);
          assert.equal(parsed.approvedLineTotal, null);
          assert.equal(parsed.procurementBudgetTotal, '257625.00');
          assert.equal(
            parsed.pricingAndBillingBasis.contractAssociationStatus,
            'INTERNAL_BENCHMARK_PRR_PROCUREMENT_BASIS'
          );
          s.fs.writeFileSync(OUT + '/t4-formal-export.json', rawBytes);
        } else if (format === 'xlsx') {
          s.fs.writeFileSync(OUT + '/t4-formal-export.xlsx', rawBytes);
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.load(rawBytes);
          const ws = wb.getWorksheet('T4_Formal_Resource_Takeoff');
          const sumWs = wb.getWorksheet('Formal_Contract_Summary');
          const metaWs = wb.getWorksheet('__OSERP_META');
          assert.ok(ws && sumWs && metaWs);
          assert.equal(metaWs.state, 'veryHidden');
          // Row 4 is total row: column 13 = target_resource_cost (must NOT have formula!), column 14 (N) = procurement_budget (SUM(N2:N3) = 257625)
          const totalRow = ws.getRow(4);
          assert.equal(totalRow.getCell(1).value, 'TOTAL PROCUREMENT BUDGET CEILING');
          assert.equal(totalRow.getCell(13).formula, undefined);
          assert.equal(totalRow.getCell(13).value, '');
          assert.equal(totalRow.getCell(14).formula, 'SUM(N2:N3)');
          assert.equal(totalRow.getCell(14).result, 257625);
        } else {
          s.fs.writeFileSync(OUT + '/t4-formal-export.csv', rawBytes);
          const csvStr = rawBytes.toString('utf8');
          assert.ok(csvStr.includes('TOTAL_PROCUREMENT_BUDGET_CEILING'));
          assert.ok(csvStr.includes('257625.00'));
        }
      }

      // VAL-19 open BLOCKING exception blocks T4 formal export with 409
      const excId = prefix + '-EXC-VAL19';
      await admin.query(
        `INSERT INTO "UboqValidationException"(id, "projectId", "snapshotId", "ruleCode", severity, "entityType", message, status)
         VALUES ($1, $2, $3, 'VAL-07', 'BLOCKING', 'PRR', 'Synthetic open blocking exception', 'OPEN')`,
        [excId, p1, snap1]
      );
      try {
        const blockedRes = await postFormal({
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(blockedRes.status, 409);
        assert.equal((await blockedRes.json()).error, 'FORMAL_OPEN_BLOCKING_EXCEPTIONS');
      } finally {
        await admin.query(`DELETE FROM "UboqValidationException" WHERE id = $1`, [excId]);
      }

      return { digests };
    }
  );

  await check(
    'WP3-BA-06 saved layouts support create, version, optimistic lock, duplicate, historical load, preview, controlled sharing, and Procurement/Estimator role parity across T2, T3, and T4',
    async () => {
      const keep = actor;
      try {
        // Chief Estimator creates & versions a shared T3 layout
        actor = { userId: synthEstimatorUser, role: 'CHIEF_ESTIMATOR', sessionVersion: 7 };
        const cT3 = await postLayouts({
          action: 'create',
          projectId: p1,
          templateCode: 'T3_AGENCY_ESTIMATE',
          templateName: 'DUPA Executive Summary',
          selectedFields: [
            'phase_code',
            'item_code',
            'work_description',
            'estimated_direct_cost',
            'estimated_indirect_cost',
            'estimated_total_amount',
            'agency_abc',
          ],
          headingAliases: { agency_abc: 'Sourced DPWH ABC' },
          sharingScope: 'PROJECT_SHARED',
          changeSummary: 'Initial T3 layout v1',
        });
        assert.equal(cT3.status, 201, await cT3.clone().text());
        const t3Rev1 = (await cT3.json()).revision;

        const vT3 = await postLayouts({
          action: 'version',
          projectId: p1,
          layoutGroupId: t3Rev1.layoutGroupId,
          expectedVersionNumber: 1,
          selectedFields: [
            'phase_code',
            'item_code',
            'work_description',
            'estimated_direct_cost',
            'estimate_vat_amt',
            'estimated_total_amount',
          ],
          changeSummary: 'Added 5% DUPA VAT column in v2',
        });
        assert.equal(vT3.status, 201);
        assert.equal((await vT3.json()).revision.versionNumber, 2);

        // Stale expectedVersionNumber=1 fails closed with 409
        const staleT3 = await postLayouts({
          action: 'version',
          projectId: p1,
          layoutGroupId: t3Rev1.layoutGroupId,
          expectedVersionNumber: 1,
          selectedFields: ['phase_code', 'item_code'],
        });
        assert.equal(staleT3.status, 409);

        // Historical v1 remains loadable & previewable
        const loadV1 = await getLayouts(
          `projectId=${p1}&layoutRevisionId=${encodeURIComponent(t3Rev1.id)}`
        );
        assert.equal(loadV1.status, 200);
        assert.equal((await loadV1.json()).revision.headingAliases.agency_abc, 'Sourced DPWH ABC');

        const prevT3 = await postLayouts({
          action: 'preview',
          projectId: p1,
          sourceId: snap1,
          layoutRevisionId: t3Rev1.id,
        });
        assert.equal(prevT3.status, 200);
        const prevT3Json = await prevT3.json();
        assert.equal(prevT3Json.summaryTotal.amount, '378000.00');

        // Procurement Manager creates a T4 layout, duplicates it, and exports formal T4!
        actor = { userId: synthProcMgrUser, role: 'PROCUREMENT_MANAGER', sessionVersion: 7 };
        const cT4 = await postLayouts({
          action: 'create',
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          templateName: 'Procurement Formal Takeoff Layout',
          selectedFields: [
            'resource_id',
            'resource_description',
            'resource_spec',
            'resource_unit',
            'resource_required_qty',
            'allocated_usable_stock_qty',
            'open_mr_reserved_qty',
            'committed_qty',
            'delivered_received_qty',
            'consumed_issued_qty',
            'stock_available_qty',
            'resource_to_procure',
            'target_resource_cost',
            'procurement_budget',
            'mrf_id',
            'supplier_po_id',
          ],
          headingAliases: { procurement_budget: 'Approved PRR Budget Ceiling' },
          sharingScope: 'PROJECT_SHARED',
        });
        assert.equal(cT4.status, 201, await cT4.clone().text());
        const t4Rev1 = (await cT4.json()).revision;

        const dupT4 = await postLayouts({
          action: 'duplicate',
          projectId: p1,
          sourceRevisionId: t4Rev1.id,
          templateName: 'Procurement Working Shortlist',
          sharingScope: 'PRIVATE',
        });
        assert.equal(dupT4.status, 201);

        const procFormal = await postFormal({
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          sourceId: snap1,
          layoutRevisionId: t4Rev1.id,
          format: 'json',
        });
        assert.equal(procFormal.status, 200, await procFormal.clone().text());
        const procFormalJson = await procFormal.json();
        assert.equal(procFormalJson.layout.layoutDefinitionId, t4Rev1.id);

        // Partial T4 layout missing mandatory formal field fails closed with 409 FORMAL_MANDATORY_FIELD_MISSING
        const cPartialT4 = await postLayouts({
          action: 'create',
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          templateName: 'Warehouse Stock Only',
          selectedFields: ['resource_id', 'resource_description', 'stock_available_qty'],
          sharingScope: 'PRIVATE',
        });
        assert.equal(cPartialT4.status, 201);
        const partialId = (await cPartialT4.json()).revision.id;
        const missingMandRes = await postFormal({
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          sourceId: snap1,
          layoutRevisionId: partialId,
          format: 'json',
        });
        assert.equal(missingMandRes.status, 409);
        assert.equal((await missingMandRes.json()).error, 'FORMAL_MANDATORY_FIELD_MISSING');

        // T2 saved layout + synthetic cleanup compatibility check on synthCleanupProj
        actor = keep;
        const cSynthT2 = await postLayouts({
          action: 'create',
          projectId: synthCleanupProj,
          templateCode: 'T2_CONSOLIDATED_BOQ',
          templateName: 'Synthetic Cleanup T2 Layout',
          selectedFields: ['group_code', 'work_description', 'approved_qty'],
          sharingScope: 'PRIVATE',
        });
        assert.equal(cSynthT2.status, 201);

        const manifestRow = (
          await admin.query(`SELECT public.uboq_build_synthetic_cleanup_manifest($1) AS m`, [
            synthCleanupProj,
          ])
        ).rows[0].m;
        assert.equal(manifestRow.eligible, true, JSON.stringify(manifestRow.disqualifiers));
        await s.transaction(admin, async () => {
          await admin.query(`SET LOCAL ROLE oserp_maint_cleanup_role`);
          await admin.query(`SELECT public.uboq_execute_verified_synthetic_cleanup($1, $2)`, [
            synthCleanupProj,
            manifestRow.manifestSha256,
          ]);
        });
        await admin.query(
          `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND "newValue" LIKE $1`,
          [`%${synthCleanupProj}%`]
        );

        return {
          t3LayoutGroupId: t3Rev1.layoutGroupId,
          t4FormalLayoutId: t4Rev1.id,
          syntheticCleanupManifestVerified: true,
        };
      } finally {
        actor = keep;
      }
    }
  );

  await check(
    'WP3-BA-07 restricted PostgreSQL oserp_compat_app RLS, ACL, trigger & RBAC/PBAC negatives block cross-project reads, redact commercial fields for Site/Viewer roles, and block direct-SQL fabrication',
    async () => {
      const keep = actor;
      try {
        // Site Engineer RBAC/PBAC verification across T2, T3, T4
        actor = { userId: synthSiteEngUser, role: 'SITE_ENGINEER', sessionVersion: 7 };

        // Cross-project p2 denied 403
        assert.equal((await getWorking(p2)).status, 403);
        assert.equal((await getLayouts(`projectId=${p2}`)).status, 403);
        assert.equal((await getFormal(p2)).status, 403);

        // Site Engineer T2 default preview strips contract_unit_rate & contract_line_amount
        const seT2 = await postWorking({
          projectId: p1,
          templateCode: 'T2_CONSOLIDATED_BOQ',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(seT2.status, 200);
        const seT2Json = await seT2.json();
        assert.equal(seT2Json.approvedLineTotal, null);
        assert.equal(seT2Json.summaryTotal, null);
        assert.ok(!JSON.stringify(seT2Json).includes('631950'));
        assert.equal(
          (
            await postWorking({
              projectId: p1,
              templateCode: 'T2_CONSOLIDATED_BOQ',
              sourceId: snap1,
              selectedFields: ['group_code', 'contract_line_amount'],
              format: 'json',
            })
          ).status,
          403
        );

        // Site Engineer T3 default preview returns only the 5 public scope columns; explicit cost column denied 403
        const seT3 = await postWorking({
          projectId: p1,
          templateCode: 'T3_AGENCY_ESTIMATE',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(seT3.status, 200);
        const seT3Json = await seT3.json();
        assert.deepEqual(
          seT3Json.projection.visibleColumns.map((c: any) => c.fieldId),
          ['phase_code', 'item_code', 'work_description', 'unit', 'approved_qty']
        );
        assert.ok(!JSON.stringify(seT3Json).includes('256200'));
        assert.equal(
          (
            await postWorking({
              projectId: p1,
              templateCode: 'T3_AGENCY_ESTIMATE',
              sourceId: snap1,
              selectedFields: ['phase_code', 'estimated_direct_cost'],
              format: 'json',
            })
          ).status,
          403
        );

        // Site Engineer T4 default preview sees physical stock & MRF qty, but NOT target_resource_cost, procurement_budget, committed_qty
        const seT4 = await postWorking({
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(seT4.status, 200);
        const seT4Json = await seT4.json();
        assert.equal(seT4Json.summaryTotal, null);
        assert.ok(!JSON.stringify(seT4Json).includes('235500'));
        assert.ok(
          seT4Json.projection.visibleColumns.some((c: any) => c.fieldId === 'stock_available_qty')
        );
        assert.ok(
          !seT4Json.projection.visibleColumns.some((c: any) => c.fieldId === 'procurement_budget')
        );
        // Site Engineer denied formal export 403
        assert.equal(
          (
            await postFormal({
              projectId: p1,
              templateCode: 'T4_RESOURCE_TAKEOFF',
              sourceId: snap1,
              format: 'json',
            })
          ).status,
          403
        );

        // Viewer assignment denied layout creation & formal export even if global role is PROJECT_MANAGER
        actor = { userId: synthViewerUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
        assert.equal(
          (
            await postLayouts({
              action: 'create',
              projectId: p1,
              templateCode: 'T2_CONSOLIDATED_BOQ',
              templateName: 'Viewer Forbidden Layout',
              selectedFields: ['group_code'],
            })
          ).status,
          403
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
          403
        );
      } finally {
        actor = keep;
      }

      // Direct-SQL restricted role (oserp_compat_app) negative checks
      const sqlCodes: Record<string, string> = {};

      // 1. Cross-project RLS read returns 0 rows
      const crossProjectCount = await withSignedRestrictedTx(p2, synthProcMgrUser, 7, async () => {
        const r = await restrictedClient.query(
          `SELECT count(*)::int AS cnt FROM "UboqProcurementResourceRequirement" WHERE "projectId" = $1`,
          [p1]
        );
        return r.rows[0].cnt;
      });
      assert.equal(crossProjectCount, 0);

      // 2. Direct INSERT into UboqTemplateAuditEvent denied 42501
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateAuditEvent"(id, "projectId", "sharingScope", "templateCode", "eventType", "actorUserId", "actorRole", "sourceId", "sourceVersion", "contractCode", "exportFormat", "outputSha256")
               VALUES ($1, $2, 'SYSTEM_FORMAL_PRESET', 'T4_RESOURCE_TAKEOFF', 'FORMAL_EXPORT_GENERATED', $3, 'SUPER_ADMIN', $4, '1', 'ERP_CANONICAL_T4_FORMAL_V1', 'json', $5)`,
              [prefix + '-BAD-AUD1', p1, s.f.ids.a, snap1, 'a'.repeat(64)]
            ),
          (err: any) => {
            sqlCodes.directAuditInsert = err.code;
            return err.code === '42501';
          }
        );
      });

      // 3. Direct INSERT of T5_ACCOMPLISHMENT_CERT into UboqTemplateDefinition denied 22023
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(id, "projectId", "layoutGroupId", "sharingScope", "definitionHash", "templateCode", "templateName", "rowGrain", "selectedFieldsJson", "isSystemPreset", "versionNumber", "createdById")
               VALUES ($1, $2, $3, 'PRIVATE', $4, 'T5_ACCOMPLISHMENT_CERT', 'Bad T5', 'PHASE_BOQ_LINE', '["phase_code"]'::jsonb, false, 1, $5)`,
              [prefix + '-BAD-T5', p1, prefix + '-GRP-T5', 'b'.repeat(64), s.f.ids.a]
            ),
          (err: any) => {
            sqlCodes.deferredT5Layout = err.code;
            return err.code === '22023' && /UBOQ_TEMPLATE_CODE_NOT_ENABLED/.test(err.message);
          }
        );
      });

      // 4. Direct INSERT of grain mismatch (T4_RESOURCE_TAKEOFF + PHASE_BOQ_LINE) denied 22023
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(id, "projectId", "layoutGroupId", "sharingScope", "definitionHash", "templateCode", "templateName", "rowGrain", "selectedFieldsJson", "isSystemPreset", "versionNumber", "createdById")
               VALUES ($1, $2, $3, 'PRIVATE', $4, 'T4_RESOURCE_TAKEOFF', 'Bad Grain', 'PHASE_BOQ_LINE', '["resource_id"]'::jsonb, false, 1, $5)`,
              [prefix + '-BAD-GRAIN', p1, prefix + '-GRP-GRN', 'c'.repeat(64), s.f.ids.a]
            ),
          (err: any) => {
            sqlCodes.mismatchedGrain = err.code;
            return err.code === '22023' && /UBOQ_TEMPLATE_GRAIN_MISMATCH/.test(err.message);
          }
        );
      });

      // 5. Direct uboq_append_template_audit_event FORMAL_EXPORT_GENERATED for non-formal T2 denied 22023
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T2_CONSOLIDATED_BOQ','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,'1','ERP_CANONICAL_T2_FAKE','json',$5,'{}'::jsonb)`,
              [prefix + '-BAD-T2-AUD', p1, s.f.ids.a, snap1, 'd'.repeat(64)]
            ),
          (err: any) => {
            sqlCodes.nonFormalT2Audit = err.code;
            return err.code === '22023' && /UBOQ_TEMPLATE_AUDIT_NON_FORMAL_TEMPLATE/.test(err.message);
          }
        );
      });

      // 6. Direct uboq_append_template_audit_event FORMAL_EXPORT_GENERATED for T4 on snapshot with 0 PRRs denied P0001
      await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T4_RESOURCE_TAKEOFF','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,'2','ERP_CANONICAL_T4_FORMAL_V1','json',$5,'{}'::jsonb)`,
              [prefix + '-BAD-T4-EMPTY', p1, s.f.ids.a, snapNoPrr, 'e'.repeat(64)]
            ),
          (err: any) => {
            sqlCodes.emptyPrrT4Audit = err.code;
            return err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_EMPTY_RESOURCE_TAKEOFF/.test(err.message);
          }
        );
      });

      // 7. Direct uboq_append_template_audit_event FORMAL_EXPORT_GENERATED by SITE_ENGINEER denied 42501
      await withSignedRestrictedTx(p1, synthSiteEngUser, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T4_RESOURCE_TAKEOFF','FORMAL_EXPORT_GENERATED',$3,'SITE_ENGINEER',$4,'1','ERP_CANONICAL_T4_FORMAL_V1','json',$5,'{}'::jsonb)`,
              [prefix + '-BAD-T4-ROLE', p1, synthSiteEngUser, snap1, 'f'.repeat(64)]
            ),
          (err: any) => {
            sqlCodes.siteEngineerFormalAudit = err.code;
            return err.code === '42501' && /UBOQ_TEMPLATE_AUDIT_FORMAL_EXPORT_DENIED/.test(err.message);
          }
        );
      });

      return { crossProjectCount, sqlCodes };
    }
  );

  await check(
    'WP3-BA-08 T0/T1 non-regression smoke, canonical source immutability, and real headless Chromium E2E across T2/T3/T4 (1440px desktop & 390px mobile)',
    async () => {
      // T0 & T1 formal export smoke
      const t0Formal = await postFormal({
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        sourceId: c1,
        format: 'json',
      });
      assert.equal(t0Formal.status, 200);
      const t1Formal = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(t1Formal.status, 200);
      assert.equal((await t1Formal.json()).approvedLineTotal, '900950.00');

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
          '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui;margin:0;padding:16px}*{box-sizing:border-box}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}button,input,select{font:inherit}</style></head><body><h1>Universal BOQ templates (T0–T4)</h1><div id="root"></div><script src="/bundle.js"></script></body></html>'
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
          viewport: { width: 1440, height: 1000 },
          acceptDownloads: true,
        });
        const consoleErrors: string[] = [];
        page.on('pageerror', (e: Error) => consoleErrors.push(e.message));
        page.on('console', (msg: any) => {
          if (msg.type() === 'error') consoleErrors.push(msg.text());
        });

        await page.goto('http://127.0.0.1:' + server.address().port);
        await page.getByLabel('Approved source', { exact: true }).waitFor();

        // 1. Switch to T2_CONSOLIDATED_BOQ, select snap1, preview & save layout
        await page.getByLabel('Template', { exact: true }).selectOption('T2_CONSOLIDATED_BOQ');
        await page.getByLabel('Approved source', { exact: true }).selectOption(snap1);
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor();
        assert.equal(await page.getByText(/Approved line total: 900950\.00/).count(), 1);
        assert.equal(await page.getByText(/isFormalComplianceOutput: false/).count(), 1);
        await page.getByLabel('Layout name', { exact: true }).fill('Browser T2 Consolidated');
        await page.getByRole('button', { name: 'Save new layout', exact: true }).click();
        await page.getByText(/Saved layout "Browser T2 Consolidated" v1/).waitFor();
        await page.screenshot({ path: OUT + '/browser-t2-desktop.png', fullPage: true });

        // 2. Switch to T3_AGENCY_ESTIMATE, select snap1, preview
        await page.getByLabel('Template', { exact: true }).selectOption('T3_AGENCY_ESTIMATE');
        await page.getByLabel('Approved source', { exact: true }).selectOption(snap1);
        await page.getByRole('button', { name: 'Preview', exact: true }).click();
        await page.getByRole('heading', { name: 'Preview', exact: true }).waitFor();
        assert.equal(
          await page.getByText(/Agency POW \/ DUPA estimated total: 378000\.00/).count(),
          1
        );
        await page.screenshot({ path: OUT + '/browser-t3-desktop.png', fullPage: true });

        // 3. Switch to T4_RESOURCE_TAKEOFF, preview formal output & download formal XLSX
        await page.getByLabel('Template', { exact: true }).selectOption('T4_RESOURCE_TAKEOFF');
        await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
        await page.getByRole('heading', { name: 'Formal export preview', exact: true }).waitFor();
        assert.equal(
          await page.getByText(/Procurement budget ceiling: 257625\.00/).count(),
          1
        );
        assert.equal(await page.getByText(/ERP_CANONICAL_T4_FORMAL_V1/).count() >= 1, true);

        const [formalDl] = await Promise.all([
          page.waitForEvent('download'),
          page.getByRole('button', { name: 'Download formal XLSX', exact: true }).click(),
        ]);
        const dlPath = OUT + '/browser-t4-formal.xlsx';
        await formalDl.saveAs(dlPath);
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.readFile(dlPath);
        assert.ok(wb.getWorksheet('T4_Formal_Resource_Takeoff'));

        await page.screenshot({ path: OUT + '/browser-t4-formal-desktop.png', fullPage: true });

        const fitsDesktop = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        );
        assert.ok(fitsDesktop, 'Builder overflows 1440px desktop viewport');

        // 4. Verify 390px mobile responsiveness with T4 formal preview rendered
        await page.setViewportSize({ width: 390, height: 844 });
        await page.screenshot({ path: OUT + '/browser-t4-formal-mobile.png', fullPage: true });
        const fitsMobile = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1
        );
        assert.ok(fitsMobile, 'Builder overflows 390px mobile viewport');
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
          const allProjects = [p1, p2, synthCleanupProj];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND ("newValue" LIKE $1 OR "newValue" LIKE $2 OR "newValue" LIKE $3)`,
            [`%${p1}%`, `%${p2}%`, `%${synthCleanupProj}%`]
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
            `DELETE FROM "PurchaseOrderItem" WHERE id = $1`,
            [synthPoItem]
          );
          await admin.query(
            `DELETE FROM "PurchaseOrder" WHERE id = $1`,
            [synthPo]
          );
          await admin.query(
            `DELETE FROM "MaterialRequestItem" WHERE id = $1`,
            [synthMrItem]
          );
          await admin.query(
            `DELETE FROM "MaterialRequest" WHERE id = $1`,
            [synthMr]
          );
          await admin.query(
            `DELETE FROM "Supplier" WHERE id = $1`,
            [synthSupplier]
          );
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
          await admin.query(
            `DELETE FROM "UboqConsolidationLink" WHERE id LIKE $1`,
            [`${prefix}%`]
          );
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
            [synthProcMgrUser, synthEstimatorUser, synthSiteEngUser, synthViewerUser],
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
