/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-a';
const REPORT_PATH = OUT + '/review-corrections-runtime.json';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch A targeted independent-review remediation (WP3-BA-IR-01): PostgreSQL SELECT RLS financial-role gating on UboqTemplateAuditEvent (PROJECT_SHARED, SYSTEM_FORMAL_PRESET, and PRIVATE FORMAL_EXPORT_GENERATED rows via Migration #27) + defense-in-depth auditTrail/details redaction in saved-layouts API + authorized Finance/Commercial/Procurement positives + T0–T4 output integrity smoke.',
};

let admin: any;
let restrictedClient: any;
let prisma: any;
let workingRoute: any;
let layoutsRoute: any;
let formalRoute: any;
let savedLayoutsMod: any;
let NextRequest: any;
let actor: any;
let originalLoad: any;
let beforeTables: any;

const hexId = s.crypto.randomBytes(5).toString('hex');
const prefix = 'SYNTH-WP3-BAIR-' + hexId;

const p1 = prefix + '-P1';
const p2 = prefix + '-P2';

const synthFinDirUser = prefix + '-USR-FIN-DIR';
const synthCommDirUser = prefix + '-USR-COMM-DIR';
const synthProcMgrUser = prefix + '-USR-PROC-MGR';
const synthSiteEngUser = prefix + '-USR-SITE-ENG';
const synthViewerUser = prefix + '-USR-EXT-VIEW';
const synthNarrowedViewerUser = prefix + '-USR-QS-VIEWER';
const synthDowngradedUser = prefix + '-USR-DOWNGRADED';
const synthForeignFinUser = prefix + '-USR-FOREIGN-FIN';

const assignFinDir = prefix + '-ASN-FIN';
const assignCommDir = prefix + '-ASN-COMM';
const assignProcMgr = prefix + '-ASN-PROC';
const assignSiteEng = prefix + '-ASN-SITE';
const assignExtViewer = prefix + '-ASN-EXTVIEW';
const assignNarrowedViewer = prefix + '-ASN-NARROWVIEW';
const assignDowngraded = prefix + '-ASN-DOWNGRADED';
const assignForeignFin = prefix + '-ASN-FOREIGNFIN';

const taxGov = prefix + '-TAX-GOV12';
const c1 = prefix + '-CA-APPROVED';
const srcDoc = prefix + '-DOC1';
const snap1 = prefix + '-S1';

const plConcP1 = prefix + '-PL-CONC-P1';
const plConcP2 = prefix + '-PL-CONC-P2';
const plRebarP1 = prefix + '-PL-RBR-P1';

const cboqConc = prefix + '-CBOQ-CONC';
const cboqRebar = prefix + '-CBOQ-RBR';
const cgrpConc = prefix + '-CGRP-CONC';
const cgrpRebar = prefix + '-CGRP-RBR';
const clnk1 = prefix + '-CLNK-1';
const clnk2 = prefix + '-CLNK-2';
const clnk3 = prefix + '-CLNK-3';

const estEvidenced = prefix + '-EST-1';
const acctCement = prefix + '-ACCT-CEM';
const acctRebar = prefix + '-ACCT-RBR';
const prrCement = prefix + '-PRR-CEM';
const prrRebar = prefix + '-PRR-RBR';

// Distinct high-entropy numeric totals so string-scan leak assertions have zero false positives/negatives:
// T0 Contract Value = 18765432.10 (awardedRevenueExVat = 16754850.09)
// T1 & T2 Approved BOQ Line Total = 249550.00 + 382400.00 + 110000.00 = 741950.00
// T3 Agency Estimate Total = 256200.00 (sourced ABC = 260000.00)
// T4 Internal Procurement Budget Ceiling = 235500.00 + 22125.00 = 257625.00

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
    await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [
      projectId,
    ]);
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

function assertNoFinancialAuditLeak(serializedJson: string, contextLabel: string) {
  const forbiddenSubstrings = [
    'FORMAL_EXPORT_GENERATED',
    'SYSTEM_FORMAL_PRESET',
    'procurementBudgetTotal',
    'approvedLineTotal',
    'currentApprovedContractValue',
    'pricingMethod',
    'contractVatBasis',
    'procurement_budget',
    'target_resource_cost',
    'contract_unit_rate',
    'contract_line_amount',
    'current_contract_value',
    'awarded_revenue',
    '257625',
    '235500',
    '22125',
    '741950',
    '18765432',
    '16754850',
    'Confidential Budget Ceiling Alias',
    'Confidential Contract Value Alias',
    'Confidential Line Amount Alias',
  ];
  for (const token of forbiddenSubstrings) {
    assert.ok(
      !serializedJson.includes(token),
      `[${contextLabel}] Leaked forbidden financial token "${token}" in payload: ${serializedJson}`
    );
  }
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
  const cemResSig = computeSpecSignatureHash(
    'Portland Cement Type 1',
    '40kg Commercial Bag ASTM C150'
  );
  const rbrResSig = computeSpecSignatureHash(
    'Deformed Steel Bar 16mm',
    'Grade 60 6m Commercial Length'
  );

  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    for (const [uid, role] of [
      [synthFinDirUser, 'FINANCE_DIRECTOR'],
      [synthCommDirUser, 'COMMERCIAL_DIRECTOR'],
      [synthProcMgrUser, 'PROCUREMENT_MANAGER'],
      [synthSiteEngUser, 'SITE_ENGINEER'],
      [synthViewerUser, 'EXTERNAL_VIEWER'],
      [synthNarrowedViewerUser, 'QUANTITY_SURVEYOR'],
      [synthDowngradedUser, 'PROCUREMENT_MANAGER'],
      [synthForeignFinUser, 'FINANCE_DIRECTOR'],
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
      `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES
         ($1,  $2,  $17, 'FINANCE_DIRECTOR',    'FULL',     'ACTIVE', now()),
         ($3,  $4,  $17, 'COMMERCIAL_DIRECTOR', 'FULL',     'ACTIVE', now()),
         ($5,  $6,  $17, 'PROCUREMENT_MANAGER', 'FULL',     'ACTIVE', now()),
         ($7,  $8,  $17, 'SITE_ENGINEER',       'STANDARD', 'ACTIVE', now()),
         ($9,  $10, $17, 'EXTERNAL_VIEWER',     'VIEWER',   'ACTIVE', now()),
         ($11, $12, $17, 'VIEWER',              'VIEWER',   'ACTIVE', now()),
         ($13, $14, $17, 'PROCUREMENT_MANAGER', 'FULL',     'ACTIVE', now()),
         ($15, $16, $18, 'FINANCE_DIRECTOR',    'FULL',     'ACTIVE', now())`,
      [
        assignFinDir,
        synthFinDirUser,
        assignCommDir,
        synthCommDirUser,
        assignProcMgr,
        synthProcMgrUser,
        assignSiteEng,
        synthSiteEngUser,
        assignExtViewer,
        synthViewerUser,
        assignNarrowedViewer,
        synthNarrowedViewerUser,
        assignDowngraded,
        synthDowngradedUser,
        assignForeignFin,
        synthForeignFinUser,
        p1,
        p2,
      ]
    );

    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES ($1, $2, 'GOV_INFRA_VAT12', 'v2026.1', 'GOVERNMENT', 0.120000, 'VATABLE_12', true, 0.100000, 0.150000, 0.020000, 0.050000, true, $3, '2026-08-01T00:00:00.000Z')`,
      [taxGov, p1, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "noaRef", "ntpRef", "clientPoRef", "voReference", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES ($1, $2, $3, 'GOVERNMENT', 'DPWH Synthetic District', 'CA-BAIR-2026-01', 'NOA-BAIR-01', 'NTP-BAIR-01', 'CPO-BAIR-01', 'VO-BAIR-01', 'UNIT_PRICE', 'VAT_INCLUSIVE', 18765432.10, 16754850.09, 18765432.10, 300, '2026-08-15T00:00:00.000Z', 'APPROVED', $4, '2026-08-02T00:00:00.000Z', now())`,
      [c1, p1, taxGov, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'batch-a-ir.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 8192, $3, '504b0304', 'memory://batch-a-ir', 'CONTRACT_BOQ', $4, true)`,
      [srcDoc, p1, s.hash(srcDoc), s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt")
       VALUES ($1, $2, $3, $4, 1, 'Baseline v1 with Takeoff', 'APPROVED', $5, $6, $7, $7, '2026-08-03T00:00:00.000Z')`,
      [snap1, p1, srcDoc, c1, s.hash(snap1), s.hash(srcDoc), s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "sourceDocumentId", "itemCode", "phaseCode", "sectionCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
         "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
         "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       )
       VALUES
         ($1, $4, $5, $6, '900(1)a', 'PHASE-01', 'BLDG-A', 'Structural Concrete Class A', '3500 psi @ 28d', $7, 'cu.m', 'm3', 'VOLUME', 'UNIT_PRICE', 40.2500,   40.2500,   6200.0000, 249550.00, 222812.50, 'SOURCE_EVIDENCED', now()),
         ($2, $4, $5, $6, '900(1)a', 'PHASE-02', 'BLDG-B', 'Structural Concrete Class A', '3500 psi @ 28d', $7, 'm3',   'm3', 'VOLUME', 'UNIT_PRICE', 59.7500,   59.7500,   6400.0000, 382400.00, 341428.57, 'SOURCE_NOT_PROVIDED', now()),
         ($3, $4, $5, $6, '902(1)a', 'PHASE-01', 'BLDG-A', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $8, 'kg', 'kg', 'MASS',   'UNIT_PRICE', 2000.0000, 2000.0000, 55.0000,   110000.00, 98214.29,  'SOURCE_NOT_PROVIDED', now())`,
      [plConcP1, plConcP2, plRebarP1, p1, snap1, srcDoc, concSig, rbrSig]
    );

    await admin.query(
      `INSERT INTO "ConsolidatedBOQItem"(id, "itemCode", category, description, unit, quantity, "unitCost", "totalCost", status, "projectId", "isUboqResourceGoverned", "updatedAt")
       VALUES
         ($1, 'CGRP-001', 'UBOQ_CONSOLIDATED', 'Structural Concrete Class A', 'm3', 100,  4800,  480000, 'APPROVED', $3, true, now()),
         ($2, 'CGRP-002', 'UBOQ_CONSOLIDATED', 'Deformed Reinforcing Steel',  'kg', 2000, 44.25, 88500,  'APPROVED', $3, true, now())`,
      [cboqConc, cboqRebar, p1]
    );

    await admin.query(
      `INSERT INTO "UboqConsolidationGroup"(
         id, "projectId", "consolidatedBoqItemId", "groupCode", "canonicalDescription",
         specification, "specSignatureHash", "unitNormalized", "uomDimensionFamily",
         "totalApprovedQty", "weightedUnitRate", "totalContractAmount", "updatedAt"
       )
       VALUES
         ($1, $3, $4, 'CGRP-001', 'Structural Concrete Class A', '3500 psi @ 28d',     $6, 'm3', 'VOLUME', 100.0000,  6319.5000, 631950.00, now()),
         ($2, $3, $5, 'CGRP-002', 'Deformed Reinforcing Steel',  'ASTM A615 Grade 60', $7, 'kg', 'MASS',   2000.0000, 55.0000,   110000.00, now())`,
      [cgrpConc, cgrpRebar, p1, cboqConc, cboqRebar, concSig, rbrSig]
    );

    await admin.query(
      `INSERT INTO "UboqConsolidationLink"(id, "consolidationGroupId", "phaseLineId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $4, $6, 40.2500,   0.402500),
         ($2, $4, $7, 59.7500,   0.597500),
         ($3, $5, $8, 2000.0000, 1.000000)`,
      [clnk1, clnk2, clnk3, cgrpConc, cgrpRebar, plConcP1, plConcP2, plRebarP1]
    );

    await admin.query(
      `INSERT INTO "UboqAgencyEstimateBaseline"(
         id, "projectId", "phaseLineId", "agencyEdcAmt", "agencyAbcAmt",
         "estimateMaterialCost", "estimateLaborCost", "estimateEquipmentCost",
         "estimatedDirectCost", "ocmAmount", "contingencyOcm", "contractorProfitAmt",
         "estimateVatAmt", "estimatedIndirectCost", "estimatedTotalUnitCost", "estimatedTotalAmount"
       )
       VALUES ($1, $2, $3, 200000.00, 260000.00, 120000.00, 50000.00, 30000.00, 200000.00, 24000.00, 4000.00, 16000.00, 12200.00, 56200.00, 6365.2174, 256200.00)`,
      [estEvidenced, p1, plConcP1]
    );

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
         ($1, $3, $4, 'MAT-CEM-40KG', 'Portland Cement Type 1',  '40kg Commercial Bag ASTM C150', $6, 'MATERIAL', 'SUPPLIER_PO', 'bag_40kg', 'PACK', $8, 1000.0000, 150.0000, 200.0000, 300.0000, 100.0000, 80.0000, 0.0000, 170.0000, 250.0000, false, 0.0000, 235.5000, 1, now()),
         ($2, $3, $5, 'MAT-RBR-16MM', 'Deformed Steel Bar 16mm', 'Grade 60 6m Commercial Length', $7, 'MATERIAL', 'SUPPLIER_PO', 'kg',       'MASS', $9, 500.0000,  0.0000,   0.0000,   400.0000, 180.0000, 50.0000, 0.0000, 130.0000, 0.0000,   true,  80.0000, 44.2500,  2, now())`,
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
      [prrCement, prrRebar, acctCement, acctRebar, p1, cboqConc, cboqRebar, snap1, srcDoc, s.f.ids.a]
    );
  });

  const sourceDigestBefore = await canonicalSourceDigest();

  actor = { userId: synthFinDirUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
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
    savedLayoutsMod = require('../../src/lib/uboq/templates/saved-layouts');
    prisma = require('../../src/lib/prisma').prisma;
  } finally {
    Module._load = originalLoad;
    originalLoad = null;
  }
  NextRequest = require('next/server').NextRequest;

  const postWorking = (body: any) =>
    workingRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
  const getLayouts = (qs: string) =>
    layoutsRoute.GET(new NextRequest(`http://localhost/api/uboq/templates/layouts?${qs}`));
  const postLayouts = (body: any) =>
    layoutsRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
  const postFormal = (body: any) =>
    formalRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/formal-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );

  let sharedT4GroupId = '';
  let sharedT4RevId = '';
  let sharedT1GroupId = '';
  let sharedT0GroupId = '';
  let t4SharedFormalAuditId = '';
  let t4SystemFormalAuditId = '';
  let t1SharedFormalAuditId = '';
  let t0SharedFormalAuditId = '';

  await check(
    'WP3-BA-IR-01A authorized Finance/Commercial/Procurement actors generate PROJECT_SHARED & SYSTEM_FORMAL_PRESET formal exports (T0, T1, T4) and retain full immutable audit provenance',
    async () => {
      // 1. PROCUREMENT_MANAGER creates PROJECT_SHARED T4 layout with restricted fields & custom alias
      actor = { userId: synthProcMgrUser, role: 'PROCUREMENT_MANAGER', sessionVersion: 7 };
      const cT4Res = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T4_RESOURCE_TAKEOFF',
        templateName: 'Shared T4 Takeoff & Budget',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'resource_id',
          'group_code',
          'resource_description',
          'resource_spec',
          'resource_unit',
          'resource_qty_basis',
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
        ],
        headingAliases: {
          procurement_budget: 'Confidential Budget Ceiling Alias',
        },
        changeSummary: 'Shared T4 formal layout v1',
      });
      assert.equal(cT4Res.status, 201);
      const cT4 = (await cT4Res.json()).revision;
      sharedT4GroupId = cT4.layoutGroupId;
      sharedT4RevId = cT4.id;

      // Export T4 via PROJECT_SHARED layout & via SYSTEM_FORMAL_PRESET
      const expT4Shared = await postFormal({
        projectId: p1,
        templateCode: 'T4_RESOURCE_TAKEOFF',
        sourceId: snap1,
        layoutRevisionId: sharedT4RevId,
        format: 'json',
      });
      assert.equal(expT4Shared.status, 200);
      const t4SharedBytes = Buffer.from(await expT4Shared.arrayBuffer());
      t4SharedFormalAuditId = expT4Shared.headers.get('X-OSERP-Audit-Event-Id')!;
      assert.equal(expT4Shared.headers.get('X-OSERP-Output-Sha256'), sha256Hex(t4SharedBytes));

      const expT4System = await postFormal({
        projectId: p1,
        templateCode: 'T4_RESOURCE_TAKEOFF',
        sourceId: snap1,
        format: 'json',
      });
      assert.equal(expT4System.status, 200);
      t4SystemFormalAuditId = expT4System.headers.get('X-OSERP-Audit-Event-Id')!;

      // 2. COMMERCIAL_DIRECTOR creates PROJECT_SHARED T1 & T0 layouts and runs formal exports
      actor = { userId: synthCommDirUser, role: 'COMMERCIAL_DIRECTOR', sessionVersion: 7 };
      const cT1Res = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        templateName: 'Shared T1 Contract BOQ',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'phase_code',
          'section_code',
          'item_code',
          'work_description',
          'specification',
          'unit',
          'pricing_type',
          'original_qty',
          'approved_qty',
          'contract_unit_rate',
          'contract_line_amount',
        ],
        headingAliases: {
          contract_line_amount: 'Confidential Line Amount Alias',
        },
      });
      assert.equal(cT1Res.status, 201);
      const cT1 = (await cT1Res.json()).revision;
      sharedT1GroupId = cT1.layoutGroupId;

      const expT1Shared = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        layoutRevisionId: cT1.id,
        format: 'json',
      });
      assert.equal(expT1Shared.status, 200);
      t1SharedFormalAuditId = expT1Shared.headers.get('X-OSERP-Audit-Event-Id')!;

      const cT0Res = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        templateName: 'Shared T0 Master Contract',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'client_name',
          'contract_ref',
          'pricing_method',
          'contract_vat_basis',
          'awarded_revenue',
          'current_contract_value',
        ],
        headingAliases: {
          current_contract_value: 'Confidential Contract Value Alias',
        },
      });
      assert.equal(cT0Res.status, 201);
      const cT0 = (await cT0Res.json()).revision;
      sharedT0GroupId = cT0.layoutGroupId;

      const expT0Shared = await postFormal({
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        sourceId: c1,
        layoutRevisionId: cT0.id,
        format: 'json',
      });
      assert.equal(expT0Shared.status, 200);
      t0SharedFormalAuditId = expT0Shared.headers.get('X-OSERP-Audit-Event-Id')!;

      // Also generate a SYSTEM_FORMAL_PRESET T0 & T1 export
      assert.equal(
        (await postFormal({ projectId: p1, templateCode: 'T0_MASTER_CONTRACT', sourceId: c1, format: 'csv' })).status,
        200
      );
      assert.equal(
        (await postFormal({ projectId: p1, templateCode: 'T1_PHASE_BOQ', sourceId: snap1, format: 'csv' })).status,
        200
      );

      // 3. FINANCE_DIRECTOR & PROCUREMENT_MANAGER verify full audit visibility via API & restricted SQL
      actor = { userId: synthFinDirUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const finLoadT4 = await (
        await getLayouts(`projectId=${p1}&layoutGroupId=${sharedT4GroupId}`)
      ).json();
      const finFormalEv = finLoadT4.auditTrail.find(
        (e: any) => e.eventType === 'FORMAL_EXPORT_GENERATED'
      );
      assert.ok(finFormalEv, 'FINANCE_DIRECTOR must see FORMAL_EXPORT_GENERATED on shared T4');
      assert.equal(finFormalEv.details.procurementBudgetTotal, '257625.00');

      const finSqlRows = await withSignedRestrictedTx(p1, synthFinDirUser, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT id, "eventType", "sharingScope", "detailsJson"
               FROM "UboqTemplateAuditEvent"
              WHERE "projectId" = $1
                AND "eventType" = 'FORMAL_EXPORT_GENERATED'
              ORDER BY "createdAt" ASC`,
            [p1]
          )
        ).rows;
      });
      assert.equal(finSqlRows.length, 6);

      const procSqlRows = await withSignedRestrictedTx(p1, synthProcMgrUser, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1 AND "eventType" = 'FORMAL_EXPORT_GENERATED'`,
            [p1]
          )
        ).rows;
      });
      assert.equal(procSqlRows.length, 6);

      return {
        formalExportEventsCreated: 6,
        t4SharedFormalAuditId,
        t4SystemFormalAuditId,
        t1SharedFormalAuditId,
        t0SharedFormalAuditId,
      };
    }
  );

  await check(
    'WP3-BA-IR-01B SITE_ENGINEER shared T4 audit history and restricted SQL SELECT expose zero financial totals, budget fields, or FORMAL_EXPORT_GENERATED records',
    async () => {
      actor = { userId: synthSiteEngUser, role: 'SITE_ENGINEER', sessionVersion: 7 };
      const res = await getLayouts(`projectId=${p1}&layoutGroupId=${sharedT4GroupId}`);
      assert.equal(res.status, 200);
      const rawText = await res.text();
      const body = JSON.parse(rawText);

      // Physical/internal fields remain accessible on the shared layout
      assert.ok(body.revision.selectedFields.includes('resource_required_qty'));
      assert.ok(body.revision.selectedFields.includes('resource_to_procure'));
      assert.ok(!body.revision.selectedFields.includes('procurement_budget'));
      assert.ok(!body.revision.selectedFields.includes('target_resource_cost'));

      // Non-formal LAYOUT_CREATED remains visible with restricted fields/aliases redacted,
      // while FORMAL_EXPORT_GENERATED is completely absent!
      assert.equal(body.auditTrail.length, 1);
      assert.equal(body.auditTrail[0].eventType, 'LAYOUT_CREATED');
      assert.ok(!body.auditTrail[0].details.selectedFields.includes('procurement_budget'));
      assert.ok(!body.auditTrail[0].details.selectedFields.includes('target_resource_cost'));
      assert.equal(body.auditTrail[0].details.headingAliases.procurement_budget, undefined);

      // Comprehensive token scan across entire serialized GET response
      assertNoFinancialAuditLeak(rawText, 'SITE_ENGINEER GET shared T4 layout');

      // Direct restricted PostgreSQL SELECT as signed SITE_ENGINEER returns 0 FORMAL_EXPORT_GENERATED rows
      const siteFormalSql = await withSignedRestrictedTx(p1, synthSiteEngUser, 7, async () => {
        const rows = (
          await restrictedClient.query(
            `SELECT id, "eventType", "sharingScope", "detailsJson"
               FROM "UboqTemplateAuditEvent"
              WHERE "projectId" = $1
                AND ("eventType" = 'FORMAL_EXPORT_GENERATED' OR "sharingScope" = 'SYSTEM_FORMAL_PRESET')`,
            [p1]
          )
        ).rows;
        return rows;
      });
      assert.equal(siteFormalSql.length, 0);

      return {
        siteEngineerVisibleAuditEvents: body.auditTrail.map((e: any) => e.eventType),
        siteEngineerFormalSqlRows: siteFormalSql.length,
      };
    }
  );

  await check(
    'WP3-BA-IR-01C VIEWER (both EXTERNAL_VIEWER and commercial user narrowed to VIEWER assignment) cannot read shared T4 or SYSTEM_FORMAL_PRESET formal audit rows via API or raw SQL',
    async () => {
      for (const [uid, role, label] of [
        [synthViewerUser, 'EXTERNAL_VIEWER', 'EXTERNAL_VIEWER'],
        [synthNarrowedViewerUser, 'QUANTITY_SURVEYOR', 'QS_NARROWED_TO_VIEWER'],
      ] as const) {
        actor = { userId: uid, role, sessionVersion: 7 };
        const res = await getLayouts(`projectId=${p1}&layoutGroupId=${sharedT4GroupId}`);
        assert.equal(res.status, 200);
        const rawText = await res.text();
        assertNoFinancialAuditLeak(rawText, `${label} GET shared T4 layout`);

        const sqlCheck = await withSignedRestrictedTx(p1, uid, 7, async () => {
          const formalRows = (
            await restrictedClient.query(
              `SELECT id, "eventType", "sharingScope", "detailsJson"
                 FROM "UboqTemplateAuditEvent"
                WHERE "projectId" = $1
                  AND ("eventType" = 'FORMAL_EXPORT_GENERATED' OR "sharingScope" = 'SYSTEM_FORMAL_PRESET')`,
              [p1]
            )
          ).rows;
          const fnCheck = (
            await restrictedClient.query(
              `SELECT
                 public.uboq_can_read_template_audit($1, 'SYSTEM_FORMAL_PRESET', $2, NULL) AS legacy_preset_fn,
                 public.uboq_can_read_template_audit_event($1, 'FORMAL_EXPORT_GENERATED', 'PROJECT_SHARED', $2, $2) AS shared_formal_fn,
                 public.uboq_can_read_template_audit_event($1, 'FORMAL_EXPORT_GENERATED', 'SYSTEM_FORMAL_PRESET', $2, NULL) AS system_formal_fn`,
              [p1, synthProcMgrUser]
            )
          ).rows[0];
          return { formalRowCount: formalRows.length, fnCheck };
        });

        assert.equal(sqlCheck.formalRowCount, 0);
        assert.equal(sqlCheck.fnCheck.legacy_preset_fn, false);
        assert.equal(sqlCheck.fnCheck.shared_formal_fn, false);
        assert.equal(sqlCheck.fnCheck.system_formal_fn, false);
      }

      // Pure unit-level defense-in-depth proof: pass synthetic unredacted FORMAL_EXPORT_GENERATED + LAYOUT_CREATED
      // rows directly into sanitizeLayoutAuditTrailForActor & redactLayoutAuditDetailsForActor for non-financial caps
      const nonFinCaps = {
        effectiveRole: 'SITE_ENGINEER',
        fieldAccessRole: 'SITE_ENGINEER',
        canWritePrivate: true,
        canShareProject: false,
        canReadFormalFinancialAudit: false,
      };
      const inMemorySanitized = savedLayoutsMod.sanitizeLayoutAuditTrailForActor(
        [
          {
            id: 'mock_formal_1',
            eventType: 'FORMAL_EXPORT_GENERATED',
            layoutDefinitionId: sharedT4RevId,
            layoutVersionNumber: 1,
            sharingScope: 'PROJECT_SHARED',
            actorUserId: synthProcMgrUser,
            actorRole: 'PROCUREMENT_MANAGER',
            sourceId: snap1,
            sourceVersion: '1',
            contractCode: 'ERP_CANONICAL_T4_FORMAL_V1',
            exportFormat: 'json',
            outputSha256: 'a'.repeat(64),
            detailsJson: {
              procurementBudgetTotal: '257625.00',
              approvedLineTotal: '741950.00',
              currentApprovedContractValue: '18765432.10',
            },
            createdAt: new Date(),
          },
          {
            id: 'mock_layout_1',
            eventType: 'LAYOUT_CREATED',
            layoutDefinitionId: sharedT4RevId,
            layoutVersionNumber: 1,
            sharingScope: 'PROJECT_SHARED',
            actorUserId: synthProcMgrUser,
            actorRole: 'PROCUREMENT_MANAGER',
            sourceId: null,
            sourceVersion: null,
            contractCode: null,
            exportFormat: null,
            outputSha256: null,
            detailsJson: {
              selectedFields: ['resource_id', 'procurement_budget', 'target_resource_cost'],
              headingAliases: {
                resource_id: 'Res Code',
                procurement_budget: 'Confidential Budget Ceiling Alias',
              },
              procurementBudgetTotal: '257625.00',
            },
            createdAt: new Date(),
          },
        ],
        nonFinCaps
      );
      assert.equal(inMemorySanitized.length, 1);
      assertNoFinancialAuditLeak(JSON.stringify(inMemorySanitized), 'In-memory defense-in-depth');

      return {
        externalViewerFormalRows: 0,
        narrowedQsViewerFormalRows: 0,
        inMemoryDefenseInDepthVerified: true,
      };
    }
  );

  await check(
    'WP3-BA-IR-01D T0/T1 contractual total disclosure regression + downgraded-actor formal audit protection',
    async () => {
      // 1. SITE_ENGINEER & VIEWER load shared T0 and T1 layouts: zero contractual totals leak
      for (const [uid, role, label] of [
        [synthSiteEngUser, 'SITE_ENGINEER', 'SITE_ENGINEER'],
        [synthViewerUser, 'EXTERNAL_VIEWER', 'EXTERNAL_VIEWER'],
        [synthNarrowedViewerUser, 'QUANTITY_SURVEYOR', 'QS_NARROWED_TO_VIEWER'],
      ] as const) {
        actor = { userId: uid, role, sessionVersion: 7 };
        for (const [tplLabel, grpId] of [
          ['T0', sharedT0GroupId],
          ['T1', sharedT1GroupId],
        ] as const) {
          const res = await getLayouts(`projectId=${p1}&layoutGroupId=${grpId}`);
          assert.equal(res.status, 200);
          const rawText = await res.text();
          assertNoFinancialAuditLeak(rawText, `${label} GET shared ${tplLabel} layout`);
        }
      }

      // 2. Role-downgrade edge case: synthDowngradedUser exports T4 while PROCUREMENT_MANAGER (so actorUserId == synthDowngradedUser),
      //    then is downgraded to SITE_ENGINEER -> must NO LONGER read even their own prior FORMAL_EXPORT_GENERATED row!
      actor = { userId: synthDowngradedUser, role: 'PROCUREMENT_MANAGER', sessionVersion: 7 };
      const preDowngradeExport = await postFormal({
        projectId: p1,
        templateCode: 'T4_RESOURCE_TAKEOFF',
        sourceId: snap1,
        layoutRevisionId: sharedT4RevId,
        format: 'csv',
      });
      assert.equal(preDowngradeExport.status, 200);
      const downgradedExportAuditId = preDowngradeExport.headers.get('X-OSERP-Audit-Event-Id')!;

      await admin.query(`UPDATE "User" SET role = 'SITE_ENGINEER' WHERE id = $1`, [
        synthDowngradedUser,
      ]);
      await admin.query(
        `UPDATE "ProjectUserAssignment" SET "projectRole" = 'SITE_ENGINEER', "accessLevel" = 'STANDARD' WHERE id = $1`,
        [assignDowngraded]
      );

      actor = { userId: synthDowngradedUser, role: 'SITE_ENGINEER', sessionVersion: 7 };
      const postDowngradeLoad = await getLayouts(
        `projectId=${p1}&layoutGroupId=${sharedT4GroupId}`
      );
      assert.equal(postDowngradeLoad.status, 200);
      assertNoFinancialAuditLeak(await postDowngradeLoad.text(), 'Downgraded actor GET shared T4');

      const postDowngradeSqlRows = await withSignedRestrictedTx(
        p1,
        synthDowngradedUser,
        7,
        async () => {
          return (
            await restrictedClient.query(
              `SELECT id FROM "UboqTemplateAuditEvent" WHERE id = $1 OR ("projectId" = $2 AND "eventType" = 'FORMAL_EXPORT_GENERATED')`,
              [downgradedExportAuditId, p1]
            )
          ).rows;
        }
      );
      assert.equal(postDowngradeSqlRows.length, 0);

      return {
        t0AndT1SharedAuditProtected: true,
        downgradedActorSelfFormalAuditRows: postDowngradeSqlRows.length,
      };
    }
  );

  await check(
    'WP3-BA-IR-01E cross-project, unsigned/forged SQL context, unauthorized formal export, and audit immutability negatives remain enforced',
    async () => {
      // 1. Cross-project FINANCE_DIRECTOR (signed for p2) querying p1 audit rows via SQL and API
      const crossProjSql = await withSignedRestrictedTx(p2, synthForeignFinUser, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1`,
            [p1]
          )
        ).rows;
      });
      assert.equal(crossProjSql.length, 0);

      actor = { userId: synthForeignFinUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const crossProjApi = await getLayouts(`projectId=${p1}&layoutGroupId=${sharedT4GroupId}`);
      assert.equal(crossProjApi.status, 403);

      // 2. Unsigned context & forged MAC proof under restricted oserp_compat_app return 0 rows
      const unsignedRows = await s.transaction(restrictedClient, async () => {
        return (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1`,
            [p1]
          )
        ).rows;
      });
      assert.equal(unsignedRows.length, 0);

      const forgedMacRows = await s.transaction(restrictedClient, async () => {
        const nowSec = Math.floor(Date.now() / 1000);
        await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
        await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [
          synthFinDirUser,
        ]);
        await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`);
        await restrictedClient.query(
          `SELECT set_config('app.current_rls_proof', $1, true)`,
          [`${nowSec}.${'b'.repeat(32)}.${'c'.repeat(64)}`]
        );
        return (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1`,
            [p1]
          )
        ).rows;
      });
      assert.equal(forgedMacRows.length, 0);

      // 3. Unauthorized formal export attempts by SITE_ENGINEER & VIEWER remain 403
      for (const [uid, role] of [
        [synthSiteEngUser, 'SITE_ENGINEER'],
        [synthViewerUser, 'EXTERNAL_VIEWER'],
        [synthNarrowedViewerUser, 'QUANTITY_SURVEYOR'],
      ] as const) {
        actor = { userId: uid, role, sessionVersion: 7 };
        const deniedRes = await postFormal({
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(deniedRes.status, 403);
      }

      // 4. Direct INSERT / UPDATE / DELETE on UboqTemplateAuditEvent under oserp_compat_app denied 42501
      const immutabilityCodes: Record<string, string> = {};
      for (const [op, sql] of [
        [
          'insert',
          `INSERT INTO "UboqTemplateAuditEvent"(id, "projectId", "sharingScope", "templateCode", "eventType", "actorUserId", "actorRole") VALUES ('${prefix}-BAD', $1, 'SYSTEM_FORMAL_PRESET', 'T4_RESOURCE_TAKEOFF', 'FORMAL_EXPORT_GENERATED', $2, 'FINANCE_DIRECTOR')`,
        ],
        [
          'update',
          `UPDATE "UboqTemplateAuditEvent" SET "detailsJson" = '{}'::jsonb WHERE "projectId" = $1 AND "actorUserId" = $2`,
        ],
        [
          'delete',
          `DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1 AND "actorUserId" = $2`,
        ],
      ] as const) {
        try {
          await withSignedRestrictedTx(p1, synthProcMgrUser, 7, async () => {
            await restrictedClient.query(sql, [p1, synthProcMgrUser]);
          });
          assert.fail(`Expected ${op} on UboqTemplateAuditEvent to fail with 42501`);
        } catch (err: any) {
          assert.equal(err.code, '42501');
          immutabilityCodes[op] = err.code;
        }
      }

      return {
        crossProjectRows: crossProjSql.length,
        unsignedRows: unsignedRows.length,
        forgedMacRows: forgedMacRows.length,
        immutabilityCodes,
      };
    }
  );

  await check(
    'WP3-BA-IR-01F saved-layout versioning/duplication, T0–T4 canonical output totals, and canonical source immutability remain intact',
    async () => {
      actor = { userId: synthProcMgrUser, role: 'PROCUREMENT_MANAGER', sessionVersion: 7 };

      // Saved-layout version v1 -> v2 + stale version conflict 409 + duplicate
      const v2Res = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: sharedT4GroupId,
        expectedVersionNumber: 1,
        templateName: 'Shared T4 Takeoff & Budget v2',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'resource_id',
          'group_code',
          'resource_description',
          'resource_unit',
          'resource_required_qty',
          'stock_available_qty',
          'resource_to_procure',
          'target_resource_cost',
          'procurement_budget',
        ],
        changeSummary: 'Added streamlined v2 columns',
      });
      assert.equal(v2Res.status, 201);
      const v2Rev = (await v2Res.json()).revision;
      assert.equal(v2Rev.versionNumber, 2);

      const staleRes = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: sharedT4GroupId,
        expectedVersionNumber: 1,
        selectedFields: ['resource_id', 'procurement_budget'],
      });
      assert.equal(staleRes.status, 409);

      const dupRes = await postLayouts({
        action: 'duplicate',
        projectId: p1,
        sourceRevisionId: v2Rev.id,
        sharingScope: 'PRIVATE',
      });
      assert.equal(dupRes.status, 201);

      // Verify T0–T4 working output integrity
      actor = { userId: synthFinDirUser, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const t0Body = await (
        await postWorking({
          projectId: p1,
          templateCode: 'T0_MASTER_CONTRACT',
          sourceId: c1,
          format: 'json',
        })
      ).json();
      assert.equal(
        Number(t0Body.projection.projectedRows[0].visible.current_contract_value).toFixed(2),
        '18765432.10'
      );
      assert.equal(t0Body.summaryTotal, null);

      const t1Body = await (
        await postWorking({
          projectId: p1,
          templateCode: 'T1_PHASE_BOQ',
          sourceId: snap1,
          format: 'json',
        })
      ).json();
      const t2Body = await (
        await postWorking({
          projectId: p1,
          templateCode: 'T2_CONSOLIDATED_BOQ',
          sourceId: snap1,
          format: 'json',
        })
      ).json();
      const t3Body = await (
        await postWorking({
          projectId: p1,
          templateCode: 'T3_AGENCY_ESTIMATE',
          sourceId: snap1,
          format: 'json',
        })
      ).json();
      const t4Body = await (
        await postWorking({
          projectId: p1,
          templateCode: 'T4_RESOURCE_TAKEOFF',
          sourceId: snap1,
          format: 'json',
        })
      ).json();

      assert.equal(t1Body.approvedLineTotal, '741950.00');
      assert.equal(t2Body.approvedLineTotal, '741950.00');
      assert.equal(t3Body.approvedLineTotal, null);
      assert.equal(t3Body.summaryTotal.amount, '256200.00');
      assert.equal(t4Body.approvedLineTotal, null);
      assert.equal(t4Body.summaryTotal.amount, '257625.00');

      const sourceDigestAfter = await canonicalSourceDigest();
      assert.deepEqual(sourceDigestAfter, sourceDigestBefore);

      return {
        t0CurrentContractValue: '18765432.10',
        t1Total: t1Body.approvedLineTotal,
        t2Total: t2Body.approvedLineTotal,
        t3Total: t3Body.summaryTotal.amount,
        t4ProcurementBudgetTotal: t4Body.summaryTotal.amount,
        canonicalSourcesUnmutated: true,
      };
    }
  );
})()
  .catch((err) => {
    console.error(err);
    report.status = 'FAIL';
    report.error = err?.message || String(err);
    save();
    process.exitCode = 1;
  })
  .finally(async () => {
    if (originalLoad) require('node:module')._load = originalLoad;
    if (restrictedClient) await restrictedClient.end();
    if (prisma) await prisma.$disconnect();
    if (admin) {
      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          const allProjects = [p1, p2];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND ("newValue" LIKE $1 OR "newValue" LIKE $2)`,
            [`%${p1}%`, `%${p2}%`]
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
            `DELETE FROM "ProjectUserAssignment" WHERE id LIKE $1`,
            [`${prefix}%`]
          );
          await admin.query(`DELETE FROM "Project" WHERE id = ANY($1::text[])`, [allProjects]);
          await admin.query(`DELETE FROM "User" WHERE id LIKE $1`, [`${prefix}%`]);
        });

        const afterTables = await tableHashes();
        const beforeSha = sha256Hex(JSON.stringify(beforeTables));
        const afterSha = sha256Hex(JSON.stringify(afterTables));
        assert.equal(afterSha, beforeSha, 'Public table digest drifted after synthetic cleanup!');
        if (report.status !== 'FAIL') {
          report.status = 'PASS';
        }
        report.all_public_table_rows_preserved = true;
        report.public_table_count = Object.keys(afterTables).length;
        report.database_before_sha256 = beforeSha;
        report.database_after_sha256 = afterSha;
        report.synthetic_fixture_cleanup = 'EXACT_PREFIX_OWNED_ROWS_REMOVED';
        save();
      } finally {
        await admin.end();
      }
    }
  });
