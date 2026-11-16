/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-b';
const REPORT_PATH = OUT + '/review-corrections-runtime.json';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Batch B Independent Review Targeted Remediation Suite covering IR-01 (financial metadata exposure across JSON, XLSX __OSERP_META, saved-layout previews, and narrowed assignments), IR-02 (historical snapshot/contract-rate authority, sequential billings, carried-forward reconciliation, cumulative overbilling prevention, and Migration #29 SQL guards), IR-03 (inspection quantity <, ==, > certified claim and multi-inspection anti-duplicate linkage), IR-04 (unified T7 EVM as-of cutoff, future/unrelated cost & progress exclusions, and certified vs self-reported progress separation), WP3-BB-IR2-01 (non-skipping prior approved certificate reconciliation, cumulative overbilling defense on broken priors, and audit-safe 409 diagnostics), and WP3-BB-IR2-02 (EVM activity-specific BOQ certification, verified quantity bounding, and out-of-schedule cutoff isolation).',
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
const prefix = 'SYNTH-WP3-BBIR-' + hexId;

// Synthetic Projects
const pHist = prefix + '-P-HIST'; // IR-01 + IR-02 + IR-03 valid sequential project (2 snapshots, 2 contracts, 4 valid SWAs, 3 valid Billings)
const pHistOver = prefix + '-P-HIST-OVR'; // IR-02 understated-previous cumulative overbilling negative project
const pNegPreSnap = prefix + '-P-NEG-PRE'; // IR-02 pre-snapshot certificate negative project
const pNegHdr = prefix + '-P-NEG-HDR'; // IR-02 mismatched billing header contract baseline negative project
const pNegInspLt = prefix + '-P-NEG-ILT'; // IR-03 inspection < claim standalone negative project
const pNegMulDup = prefix + '-P-NEG-MDUP'; // IR-03 duplicate multi-lot standalone negative project
const pNegMulBlk = prefix + '-P-NEG-MBLK'; // IR-03 blank multi-lot standalone negative project
const pUnlinked = prefix + '-P-UNLINKED'; // IR-02 unlinked snapshot negative project
const pAmbig = prefix + '-P-AMBIG'; // IR-02 ambiguous parallel snapshots negative project
const pEvm = prefix + '-P-EVM'; // IR-04 unified EVM cutoff & certified vs self-reported project

// IR2-01 & IR2-02 Dedicated Synthetic Projects
const pIr2BilMis = prefix + '-P-IR2-BMIS'; // IR2-01 earlier approved billing with mismatched previousQuantityBilled followed by new cert
const pIr2BilMisOver = prefix + '-P-IR2-BMOV'; // IR2-01 earlier mismatched billing followed by cert that overbills unless prior is retained
const pIr2BilOver1 = prefix + '-P-IR2-BOV1'; // IR2-01 earlier over-ceiling billing followed by new cert on same BOQ
const pIr2BilOver2 = prefix + '-P-IR2-BOV2'; // IR2-01 earlier over-ceiling billing followed by new cert on different BOQ
const pIr2AccIns = prefix + '-P-IR2-AINS'; // IR2-01 earlier approved SWA with insufficient inspection followed by new cert
const pIr2AccInsOver = prefix + '-P-IR2-AIOV'; // IR2-01 earlier insufficient-inspection SWA followed by cert that overbills unless prior is retained
const pIr2AccBrk = prefix + '-P-IR2-ABRK'; // IR2-01 earlier approved SWA with broken history followed by new cert
const pIr2Evm = prefix + '-P-IR2-EVM'; // IR2-02 EVM activity-specific certification, 10% cap vs 100% claim, and out-of-schedule cutoff isolation
const pIr3Evm = prefix + '-P-IR3-EVM'; // IR3-01 T7 shared per-BOQ certified quantity budget across link methods & snapshot versions

// Synthetic Users for IR-01 role matrix
const usrSiteEng = prefix + '-USR-SITE';
const usrNarrowedSite = prefix + '-USR-NAR-SITE'; // Global PROJECT_MANAGER narrowed to SITE_ENGINEER on project
const usrNarrowedViewer = prefix + '-USR-NAR-VIEW'; // Global PROJECT_MANAGER narrowed to VIEWER on project
const usrExternalViewer = prefix + '-USR-EXT-VIEW'; // Global EXTERNAL_VIEWER
const usrBillingEng = prefix + '-USR-BILLING'; // Authorized commercial role
const usrFinanceDir = prefix + '-USR-FINDIR'; // Authorized executive/finance role

// Tax & Contract Authorities on pHist
const taxHist = prefix + '-TAX-GOV12';
const caV1 = prefix + '-CA-V1'; // Approved 2026-08-01: 600,000.00 (100 m3 @ 6,000.00)
const caV2 = prefix + '-CA-V2'; // Approved 2026-10-01: 780,000.00 (120 m3 @ 6,500.00)
const caPostDated = prefix + '-CA-POST'; // Approved 2026-12-01 (for post-dated contract negative)

// Snapshots
const snapV1 = prefix + '-SNAP-V1'; // Approved 2026-08-05, status SUPERSEDED (superseded by snapV2 on 2026-10-01)
const snapV2 = prefix + '-SNAP-V2'; // Approved 2026-10-01, supersedesSnapshotId = snapV1, status APPROVED
const snapUnlinked = prefix + '-SNAP-UNL'; // contractAuthorityId = NULL
const snapAmbA = prefix + '-SNAP-AMBA'; // Approved 2026-08-05, supersedesSnapshotId = NULL
const snapAmbB = prefix + '-SNAP-AMBB'; // Approved 2026-08-10, supersedesSnapshotId = NULL
const snapEvm = prefix + '-SNAP-EVM';

// AwardedBOQItems & PhaseLines
const boqHistConc = prefix + '-ABOQ-HCONC';
const plHistV1 = prefix + '-PL-HV1';
const plHistV2 = prefix + '-PL-HV2';

const boqUnl = prefix + '-ABOQ-UNL';
const plUnl = prefix + '-PL-UNL';

const boqAmb = prefix + '-ABOQ-AMB';
const plAmbA = prefix + '-PL-AMBA';
const plAmbB = prefix + '-PL-AMBB';

const caEvm = prefix + '-CA-EVM';
const boqEvmCert = prefix + '-ABOQ-EVMC';
const boqEvmSelf = prefix + '-ABOQ-EVMS';
const boqEvmFut = prefix + '-ABOQ-EVMF';
const boqEvmUnrel = prefix + '-ABOQ-EVMU';
const plEvmCert = prefix + '-PL-EVMC';
const plEvmSelf = prefix + '-PL-EVMS';
const plEvmFut = prefix + '-PL-EVMF';

// T5 Accomplishments & Inspections (IR-02 + IR-03)
const accP1V1 = prefix + '-ACC-P1V1'; // 2026-08-31 (governed by snapV1 @ 6,000; prev=0, curr=40)
const accP2V2 = prefix + '-ACC-P2V2'; // 2026-10-31 (governed by snapV2 @ 6,500; prev=40, curr=50 -> cum=90)
const accPreSnap = prefix + '-ACC-PRESNAP'; // 2026-07-15 (before snapV1 2026-08-05 -> 409)
const accBadPrev = prefix + '-ACC-BADPREV'; // 2026-11-10 (prev=10 instead of 90, curr=10 -> 409 mismatch)
const accUnderPrevOver = prefix + '-ACC-UPOVER'; // 2026-11-12 (prev=10 understated, curr=40 -> true cum 90+40=130 > 120 -> 409 overbilling)
const accInspBelow = prefix + '-ACC-INSP-LT'; // 2026-08-20 (claim=30, approved insp=20 -> 409 insufficient)
const accInspExceed = prefix + '-ACC-INSP-GT'; // 2026-08-25 (claim=40, approved insp=52, verified=55 -> 200 capped at 40)
const accMultiValid = prefix + '-ACC-MUL-OK'; // 2026-08-28 (claim=40, 2 distinct lots 15 + 25 = 40 -> 200)
const accMultiDupLot = prefix + '-ACC-MUL-DUP'; // 2026-08-29 (claim=40, 2 duplicate lots 'LOT-A' 25 + 25 -> 409 duplicate linkage)
const accMultiBlank = prefix + '-ACC-MUL-BLK'; // 2026-08-30 (claim=40, 2 blank-scope inspections -> 409 duplicate linkage)
const accUnlinked = prefix + '-ACC-UNL';
const accAmbig = prefix + '-ACC-AMB';

// T6 Billings (IR-01 + IR-02)
const bilP1V1 = prefix + '-BIL-P1V1'; // PeriodTo 2026-08-31 (governed by snapV1 @ 6,000; prev=0, curr=40; LD=1850.00)
const bilP2V2 = prefix + '-BIL-P2V2'; // PeriodTo 2026-10-31 (governed by snapV2 @ 6,500; prev=40, curr=50)
const bilP3V2 = prefix + '-BIL-P3V2'; // PeriodTo 2026-11-06 (governed by snapV2 @ 6,500; prev=90, curr=20 -> cum=110)
const bilPreSnap = prefix + '-BIL-PRESNAP'; // PeriodTo 2026-07-15 -> 409
const bilUnderPrevOver = prefix + '-BIL-UPOVER'; // PeriodTo 2026-11-15 (prev=10 understated, curr=40 -> 90+40=130 > 120 -> 409 overbilling)
const bilBadPrev = prefix + '-BIL-BADPREV'; // PeriodTo 2026-11-16 (prev=20 instead of 110, curr=5 -> 409 reconciliation mismatch)
const bilBadHeaderAmt = prefix + '-BIL-BADHDR'; // PeriodTo 2026-10-31 (contractAmount=9999999 -> 409 contract baseline mismatch)
const bilUnlinked = prefix + '-BIL-UNL';
const bilAmbig = prefix + '-BIL-AMB';

// IR2-01 Certificates (Prior Approved Certificate Reconciliation)
const bilIr2Mis1 = prefix + '-BIL-IR2M1';
const bilIr2Mis2 = prefix + '-BIL-IR2M2'; // broken prior (prev=10 != 40)
const bilIr2Mis3 = prefix + '-BIL-IR2M3'; // subsequent current cert (prev=40, curr=20 -> must 409, NOT output!)
const bilIr2MisOv1 = prefix + '-BIL-IR2MO1';
const bilIr2MisOv2 = prefix + '-BIL-IR2MO2'; // broken prior (prev=10 != 40, curr=50 -> true cum=90)
const bilIr2MisOv3 = prefix + '-BIL-IR2MO3'; // subsequent current cert (prev=40, curr=40 -> 90+40=130 > 120 -> 409 overbilling!)
const bilIr2Ov1a = prefix + '-BIL-IR2OA1'; // prior over-ceiling (110 > 100)
const bilIr2Ov1b = prefix + '-BIL-IR2OA2'; // subsequent cert on same BOQ (prev=0, curr=20 -> 409!)
const bilIr2Ov2a = prefix + '-BIL-IR2OB1'; // prior over-ceiling on BOQ-A (110 > 100)
const bilIr2Ov2b = prefix + '-BIL-IR2OB2'; // subsequent cert billing ONLY BOQ-B (prev=0, curr=10 -> 409, prior over-ceiling cannot be skipped!)
const accIr2Ins1 = prefix + '-ACC-IR2I1'; // prior SWA with insufficient inspection (claim=80, insp=50)
const accIr2Ins2 = prefix + '-ACC-IR2I2'; // subsequent SWA within ceiling (prev=80, curr=20 -> 409 unresolved prior!)
const accIr2InsOv1 = prefix + '-ACC-IR2IO1'; // prior SWA with insufficient inspection (claim=80, insp=50)
const accIr2InsOv2 = prefix + '-ACC-IR2IO2'; // subsequent SWA (prev=0, curr=50 -> 80+50=130 > 120 -> 409 overbilling!)
const accIr2Brk1 = prefix + '-ACC-IR2B1'; // valid prior #1 (0 -> 40)
const accIr2Brk2 = prefix + '-ACC-IR2B2'; // broken prior #2 (prev=5 != 40, curr=30)
const accIr2Brk3 = prefix + '-ACC-IR2B3'; // subsequent SWA #3 (prev=40, curr=20 -> 409 unresolved prior!)

// IR2-02 EVM Schedule & Activities (Activity-Specific Certification & Quantity Bounding)
const schedIr2Evm = prefix + '-SCHED-IR2';
const wbsIr2Evm = prefix + '-WBS-IR2';
const actIr2Good = prefix + '-ACT-IR2-GOOD';
const actIr2Cross = prefix + '-ACT-IR2-CROS';
const actIr2Cap10 = prefix + '-ACT-IR2-CAP';
const actIr2Unl = prefix + '-ACT-IR2-UNL';
const accIr2Good = prefix + '-ACC-IR2-GOOD'; // 2026-09-15 certifies 40/100 on boqIr2Good ONLY
const accIr2Cap10 = prefix + '-ACC-IR2-CAP'; // 2026-09-15 certifies 10/100 on boqIr2Cap ONLY
const accIr2OffSched = prefix + '-ACC-IR2-OFF'; // 2026-09-25 valid SWA certifying off-schedule BOQ ONLY (must NOT shift cutoff!)
const accIr2Future = prefix + '-ACC-IR2-FUT'; // 2099-01-15 future SWA (must NOT shift cutoff!)

// IR3-01 EVM Shared Certified-Quantity Budget & Multi-Snapshot / Mixed-Link Deduplication
const schedIr3MixSplit = prefix + '-SCHED-IR3-MSPL'; // Test A1: 20-unit BOQ w/ 10 certified units split 10+10 across UboqScheduleActivityLink + ScheduleBOQAllocation -> 5+5=10 units!
const schedIr3MixOver = prefix + '-SCHED-IR3-MOVR'; // Test A2: 10-unit BOQ w/ 10 certified units mapped 10+10 across UboqScheduleActivityLink + ScheduleBOQAllocation -> 409!
const schedIr3IntraConf = prefix + '-SCHED-IR3-ICON'; // Test A3: Intra-activity conflicting UboqScheduleActivityLink (10) vs ScheduleBOQAllocation (6) -> 409!
const schedIr3SnapSplit = prefix + '-SCHED-IR3-SSPL'; // Test B1: 20-unit BOQ w/ 10 certified units mapped 10 via v1 + 10 via v2 -> 5+5=10 units (no pool replenishment)!
const schedIr3SnapOver = prefix + '-SCHED-IR3-SOVR'; // Test B2: 10-unit BOQ w/ 10 certified units mapped 10 via v1 + 10 via v2 -> 409!
const schedIr3LegitSplit = prefix + '-SCHED-IR3-LEGT'; // Test C: Legitimate split (60+40 w/ 30+30 certified) + distinct BOQ (50 w/ 25 certified) -> accurate EV!

// T7 Schedule & EVM (IR-01 + IR-04)
const schedEvm = prefix + '-SCHED-EVM';
const wbsEvm = prefix + '-WBS-EVM';
const actCert = prefix + '-ACT-CERT'; // 2026-09-05..2026-09-25, BAC = 310,000.00
const actSelf = prefix + '-ACT-SELF'; // 2026-09-01..2026-09-15, BAC = 100,000.00 (unverified self-reported 80% ONLY)
const actFuture = prefix + '-ACT-FUT'; // 2026-10-05..2026-10-20, BAC = 150,000.00 (starts after 2026-09-15 cutoff)
const accEvmCert = prefix + '-ACC-EVMCERT'; // 2026-09-15 valid certified SWA
const accEvmFuture = prefix + '-ACC-EVMFUT'; // 2099-01-15 future-dated SWA (must NOT shift cutoff or inflate EV!)

async function tableHashes() {
  const tables = (
    await admin.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
    )
  ).rows.map((r: any) => r.tablename);
  const out: Record<string, string> = {};
  for (const t of tables) {
    const q = await admin.query(
      `SELECT coalesce(md5(string_agg(md5(row_to_json(x)::text), '' ORDER BY ctid)), 'empty') AS h, count(*)::int AS n FROM "${t}" x`
    );
    out[t] = `${q.rows[0].n}:${q.rows[0].h}`;
  }
  return out;
}

async function check(id: string, fn: () => Promise<any>) {
  const started = Date.now();
  try {
    const detail = await fn();
    report.checks.push({ id, status: 'PASS', duration_ms: Date.now() - started, detail });
  } catch (error: any) {
    report.checks.push({
      id,
      status: 'FAIL',
      duration_ms: Date.now() - started,
      error: String(error?.stack || error),
    });
    throw error;
  }
}

async function cleanupSynthetic() {
  if (!admin) return;
  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");
    await admin.query(`DELETE FROM "SensitiveExportLog" WHERE "projectId" LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(
      `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND "newValue" LIKE $1`,
      ['%' + prefix + '%']
    );
    await admin.query(
      `DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(
      `DELETE FROM "UboqTemplateDefinition" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(`DELETE FROM "ProjectCostLedger" WHERE "projectId" LIKE $1 OR id LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(
      `DELETE FROM "ScheduleProgressUpdate" WHERE "scheduleId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(
      `DELETE FROM "ScheduleBOQAllocation" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(`DELETE FROM "UboqScheduleActivityLink" WHERE id LIKE $1`, [prefix + '%']);
    await admin.query(
      `DELETE FROM "ScheduleDependency" WHERE "scheduleId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(`DELETE FROM "ScheduleActivity" WHERE "scheduleId" LIKE $1 OR id LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(`DELETE FROM "ScheduleWBS" WHERE "scheduleId" LIKE $1 OR id LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(`DELETE FROM "ProjectSchedule" WHERE "projectId" LIKE $1 OR id LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(`DELETE FROM "Payment" WHERE id LIKE $1`, [prefix + '%']);
    await admin.query(`DELETE FROM "BillingDeduction" WHERE id LIKE $1`, [prefix + '%']);
    await admin.query(`DELETE FROM "BillingItem" WHERE id LIKE $1`, [prefix + '%']);
    await admin.query(`DELETE FROM "Billing" WHERE "projectId" LIKE $1 OR id LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(`DELETE FROM "Inspection" WHERE id LIKE $1`, [prefix + '%']);
    await admin.query(`DELETE FROM "AccomplishmentItem" WHERE id LIKE $1`, [prefix + '%']);
    await admin.query(`DELETE FROM "Accomplishment" WHERE "projectId" LIKE $1 OR id LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(
      `DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(`DELETE FROM "AwardedBOQItem" WHERE "projectId" LIKE $1 OR id LIKE $1`, [
      prefix + '%',
    ]);
    await admin.query(
      `DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(
      `DELETE FROM "UboqContractAuthority" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(
      `DELETE FROM "UboqTaxPricingProfile" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(
      `DELETE FROM "ProjectUserAssignment" WHERE "projectId" LIKE $1 OR id LIKE $1`,
      [prefix + '%']
    );
    await admin.query(`DELETE FROM "Project" WHERE id LIKE $1`, [prefix + '%']);
    await admin.query(`DELETE FROM "User" WHERE id LIKE $1`, [prefix + '%']);
  });
}

async function getWorking(qs: string) {
  return workingRoute.GET(new NextRequest('http://localhost/api/uboq/templates?' + qs));
}
async function postWorking(body: unknown) {
  return workingRoute.POST(
    new NextRequest('http://localhost/api/uboq/templates', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}
async function postLayouts(body: unknown) {
  return layoutsRoute.POST(
    new NextRequest('http://localhost/api/uboq/templates/layouts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}
async function postFormal(body: unknown) {
  return formalRoute.POST(
    new NextRequest('http://localhost/api/uboq/templates/formal-export', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  );
}

function mintRlsProof(projectId: string, userId: string, sessionVersion: number): string {
  const epochSec = Math.floor(Date.now() / 1000);
  const nonceHex = s.crypto.randomBytes(16).toString('hex');
  const payload = `${s.f.signing}|UBOQ_RLS_V1|${projectId}|${userId}|${sessionVersion}|${epochSec}|${nonceHex}`;
  const mac = s.crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  return `${epochSec}.${nonceHex}.${mac}`;
}

async function withSignedRestrictedTx(
  projectId: string,
  userId: string,
  sessionVersion: number,
  fn: () => Promise<any>
) {
  return s.transaction(restrictedClient, async () => {
    const proof = mintRlsProof(projectId, userId, sessionVersion);
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

async function extractXlsxMetaSheetDump(xlsxBytes: Buffer): Promise<{
  headers: string[];
  allCellText: string;
}> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(xlsxBytes);
  const metaWs = wb.getWorksheet('__OSERP_META');
  assert.ok(metaWs, 'Missing __OSERP_META worksheet');
  const headers: string[] = [];
  const allValues: string[] = [];
  metaWs.eachRow((row: any, rowNumber: number) => {
    row.eachCell({ includeEmpty: false }, (cell: any) => {
      const txt = cell.value === null || cell.value === undefined ? '' : String(cell.value);
      if (rowNumber === 1) headers.push(txt);
      allValues.push(txt);
    });
  });
  return { headers, allCellText: allValues.join(' | ') };
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
  const concSig = computeSpecSignatureHash('Structural Concrete Class A', '4000 psi');

  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    // 1. Seed Users covering SITE_ENGINEER, narrowed SITE_ENGINEER, narrowed VIEWER, EXTERNAL_VIEWER, BILLING_ENGINEER, FINANCE_DIRECTOR
    for (const [uid, role] of [
      [usrSiteEng, 'SITE_ENGINEER'],
      [usrNarrowedSite, 'PROJECT_MANAGER'],
      [usrNarrowedViewer, 'PROJECT_MANAGER'],
      [usrExternalViewer, 'EXTERNAL_VIEWER'],
      [usrBillingEng, 'BILLING_ENGINEER'],
      [usrFinanceDir, 'FINANCE_DIRECTOR'],
    ]) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 7, now())`,
        [uid, `${uid.toLowerCase()}@synthetic.local`, role]
      );
    }

    // 2. Seed Synthetic Projects
    for (const p of [
      pHist,
      pHistOver,
      pNegPreSnap,
      pNegHdr,
      pNegInspLt,
      pNegMulDup,
      pNegMulBlk,
      pUnlinked,
      pAmbig,
      pEvm,
      pIr2BilMis,
      pIr2BilMisOver,
      pIr2BilOver1,
      pIr2BilOver2,
      pIr2AccIns,
      pIr2AccInsOver,
      pIr2AccBrk,
      pIr2Evm,
      pIr3Evm,
    ]) {
      await admin.query(
        'INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt") VALUES ($1, $1, true, false, now())',
        [p]
      );
    }

    // Assignments on pHist, pEvm & pIr3Evm
    let asnSeq = 1;
    for (const proj of [pHist, pEvm, pIr3Evm]) {
      for (const [uid, projRole, accessLvl] of [
        [usrSiteEng, 'SITE_ENGINEER', 'STANDARD'],
        [usrNarrowedSite, 'SITE_ENGINEER', 'STANDARD'],
        [usrNarrowedViewer, 'MEMBER', 'VIEWER'],
        [usrExternalViewer, 'EXTERNAL_VIEWER', 'VIEWER'],
        [usrBillingEng, 'BILLING_ENGINEER', 'FULL'],
        [usrFinanceDir, 'FINANCE_DIRECTOR', 'FULL'],
      ]) {
        await admin.query(
          `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE', now())`,
          [`${prefix}-ASN-${asnSeq++}`, uid, proj, projRole, accessLvl]
        );
      }
    }

    // 3. Tax & Contract Authorities
    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES ($1, $2, 'GOV_INFRA_VAT12', 'v2026.2', 'GOVERNMENT', 0.120000, 'VATABLE_12', true, 0.100000, 0.100000, 0.020000, 0.050000, true, $3, '2026-08-01T00:00:00.000Z')`,
      [taxHist, pHist, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $5, $7,   'GOVERNMENT', 'DPWH Hist V1', 'CA-HIST-V1',   'UNIT_PRICE', 'VAT_INCLUSIVE', 600000.00, 535714.29, 600000.00, 180, '2026-08-01T00:00:00.000Z', 'APPROVED', $8, '2026-08-01T00:00:00.000Z', now()),
         ($2, $5, $7,   'GOVERNMENT', 'DPWH Hist V2', 'CA-HIST-V2',   'UNIT_PRICE', 'VAT_INCLUSIVE', 780000.00, 696428.57, 780000.00, 210, '2026-08-01T00:00:00.000Z', 'APPROVED', $8, '2026-10-01T00:00:00.000Z', now()),
         ($3, $5, $7,   'GOVERNMENT', 'DPWH PostDate','CA-HIST-POST', 'UNIT_PRICE', 'VAT_INCLUSIVE', 600000.00, 535714.29, 600000.00, 180, '2026-08-01T00:00:00.000Z', 'APPROVED', $8, '2026-12-01T00:00:00.000Z', now()),
         ($4, $6, NULL, 'PRIVATE',    'EVM Client',   'CA-EVM-01',    'UNIT_PRICE', 'VAT_INCLUSIVE', 560000.00, 500000.00, 560000.00, 120, '2026-09-01T00:00:00.000Z', 'APPROVED', $8, '2026-08-15T00:00:00.000Z', now())`,
      [caV1, caV2, caPostDated, caEvm, pHist, pEvm, taxHist, s.f.ids.a]
    );

    // 4. Snapshots:
    // - pHist: snapV1 (approved 2026-08-05, rate 6000, status SUPERSEDED) -> snapV2 (approved 2026-10-01, supersedes snapV1, rate 6500, status APPROVED)
    // - pUnlinked: snapUnlinked (contractAuthorityId = NULL)
    // - pAmbig: snapAmbA & snapAmbB (both approved <= 2026-09-15 WITHOUT supersedesSnapshotId)
    // - pEvm: snapEvm
    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "contractAuthorityId", "supersedesSnapshotId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $7,  $11, NULL, 1, 'Hist Baseline v1 (6000/m3)', 'SUPERSEDED', $13, $19, $19, '2026-08-05T00:00:00.000Z'),
         ($2, $7,  $12, $1,   2, 'Hist Revised v2 (6500/m3)',  'APPROVED',   $14, $19, $19, '2026-10-01T00:00:00.000Z'),
         ($3, $8,  NULL,NULL, 1, 'Unlinked Snapshot v1',       'APPROVED',   $15, $19, $19, '2026-08-05T00:00:00.000Z'),
         ($4, $9,  NULL,NULL, 1, 'Parallel Ambiguous A',       'APPROVED',   $16, $19, $19, '2026-08-05T00:00:00.000Z'),
         ($5, $9,  NULL,NULL, 2, 'Parallel Ambiguous B',       'APPROVED',   $17, $19, $19, '2026-08-10T00:00:00.000Z'),
         ($6, $10, $20, NULL, 1, 'EVM Baseline v1',            'APPROVED',   $18, $19, $19, '2026-08-20T00:00:00.000Z')`,
      [
        snapV1,
        snapV2,
        snapUnlinked,
        snapAmbA,
        snapAmbB,
        snapEvm,
        pHist,
        pUnlinked,
        pAmbig,
        pEvm,
        caV1,
        caV2,
        s.hash(snapV1),
        s.hash(snapV2),
        s.hash(snapUnlinked),
        s.hash(snapAmbA),
        s.hash(snapAmbB),
        s.hash(snapEvm),
        s.f.ids.a,
        caEvm,
      ]
    );

    // 5. AwardedBOQItems & UboqAwardedPhaseLines
    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
       VALUES
         ($1, '900-H', 'STRUCTURAL', 'Historical Concrete Foundation', 'm3', 100, 6500, 650000, 20, 120, 6500, 780000, 'APPROVED', $8,  now()),
         ($2, '900-U', 'STRUCTURAL', 'Unlinked Concrete Scope',        'm3', 50,  5000, 250000, 0,  50,  5000, 250000, 'APPROVED', $9,  now()),
         ($3, '900-A', 'STRUCTURAL', 'Ambiguous Concrete Scope',       'm3', 50,  5000, 250000, 0,  50,  5000, 250000, 'APPROVED', $10, now()),
         ($4, 'EVM-C', 'STRUCTURAL', 'EVM Certified Concrete',         'm3', 100, 3100, 310000, 0,  100, 3100, 310000, 'APPROVED', $11, now()),
         ($5, 'EVM-S', 'ARCHITECT',  'EVM Self-Reported Masonry',      'm2', 100, 1000, 100000, 0,  100, 1000, 100000, 'APPROVED', $11, now()),
         ($6, 'EVM-F', 'FINISHING',  'EVM Future Roofing',             'm2', 100, 1500, 150000, 0,  100, 1500, 150000, 'APPROVED', $11, now()),
         ($7, 'EVM-U', 'OTHER',      'Unrelated Off-Schedule Scope',   'lot',1,   50000,50000,  0,  1,   50000,50000,  'APPROVED', $11, now())`,
      [
        boqHistConc,
        boqUnl,
        boqAmb,
        boqEvmCert,
        boqEvmSelf,
        boqEvmFut,
        boqEvmUnrel,
        pHist,
        pUnlinked,
        pAmbig,
        pEvm,
      ]
    );

    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "awardedBoqItemId", "itemCode", "phaseCode", "sectionCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
         "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
         "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       )
       VALUES
         ($1, $9,  $13, $19, '900-H', 'PHASE-01', 'FDN', 'Historical Concrete Foundation', '4000 psi', $25, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 100.0000, 6000.0000, 600000.00, 535714.29, 'SOURCE_NOT_PROVIDED', now()),
         ($2, $9,  $14, $19, '900-H', 'PHASE-01', 'FDN', 'Historical Concrete Foundation', '4000 psi', $25, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 120.0000, 6500.0000, 780000.00, 696428.57, 'SOURCE_NOT_PROVIDED', now()),
         ($3, $10, $15, $20, '900-U', 'PHASE-01', 'UNL', 'Unlinked Concrete Scope',        '4000 psi', $25, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 50.0000,  50.0000,  5000.0000, 250000.00, 250000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($4, $11, $16, $21, '900-A', 'PHASE-01', 'AMB', 'Ambiguous Concrete Scope',       '4000 psi', $25, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 50.0000,  50.0000,  5000.0000, 250000.00, 250000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($5, $11, $17, $21, '900-A', 'PHASE-01', 'AMB', 'Ambiguous Concrete Scope',       '4000 psi', $25, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 50.0000,  50.0000,  5500.0000, 275000.00, 275000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($6, $12, $18, $22, 'EVM-C', 'PHASE-01', 'STR', 'EVM Certified Concrete',         '4000 psi', $25, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 100.0000, 3100.0000, 310000.00, 276785.71, 'SOURCE_NOT_PROVIDED', now()),
         ($7, $12, $18, $23, 'EVM-S', 'PHASE-01', 'ARC', 'EVM Self-Reported Masonry',      'CHB 150',  $25, 'm2', 'm2', 'AREA',   'UNIT_PRICE', 100.0000, 100.0000, 1000.0000, 100000.00, 89285.71,  'SOURCE_NOT_PROVIDED', now()),
         ($8, $12, $18, $24, 'EVM-F', 'PHASE-02', 'FIN', 'EVM Future Roofing',             'Rib-Type', $25, 'm2', 'm2', 'AREA',   'UNIT_PRICE', 100.0000, 100.0000, 1500.0000, 150000.00, 133928.57, 'SOURCE_NOT_PROVIDED', now())`,
      [
        plHistV1,
        plHistV2,
        plUnl,
        plAmbA,
        plAmbB,
        plEvmCert,
        plEvmSelf,
        plEvmFut,
        pHist,
        pUnlinked,
        pAmbig,
        pEvm,
        snapV1,
        snapV2,
        snapUnlinked,
        snapAmbA,
        snapAmbB,
        snapEvm,
        boqHistConc,
        boqUnl,
        boqAmb,
        boqEvmCert,
        boqEvmSelf,
        boqEvmFut,
        concSig,
      ]
    );

    // Helper to seed an isolated project with approved ContractAuthority + Snapshot(v1 @ 2026-08-05) + 1 or 2 AwardedBOQItems & PhaseLines
    let isoSeq = 1;
    async function seedIsolatedBoqProject(
      projId: string,
      opts: {
        ceilingQty?: number;
        unitRate?: number;
        secondBoq?: boolean;
      } = {}
    ) {
      const idx = isoSeq++;
      const qty = opts.ceilingQty ?? 120;
      const rate = opts.unitRate ?? 6000;
      const totalItems = opts.secondBoq ? 2 : 1;
      const contractValue = qty * rate * totalItems;
      const caId = `${prefix}-ISO-CA-${idx}`;
      const snapId = `${prefix}-ISO-SNAP-${idx}`;
      const boqIdA = `${prefix}-ISO-BOQA-${idx}`;
      const plIdA = `${prefix}-ISO-PLA-${idx}`;
      const boqIdB = opts.secondBoq ? `${prefix}-ISO-BOQB-${idx}` : null;
      const plIdB = opts.secondBoq ? `${prefix}-ISO-PLB-${idx}` : null;

      await admin.query(
        `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
         VALUES ($1, $2, NULL, 'PRIVATE', 'Isolated Client', $3, 'UNIT_PRICE', 'VAT_INCLUSIVE', $4, $4, $4, 180, '2026-08-01T00:00:00.000Z', 'APPROVED', $5, '2026-08-01T00:00:00.000Z', now())`,
        [caId, projId, `CA-ISO-${idx}`, contractValue, s.f.ids.a]
      );
      await admin.query(
        `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "contractAuthorityId", "supersedesSnapshotId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
         VALUES ($1, $2, $3, NULL, 1, 'Isolated Baseline v1', 'APPROVED', $4, $5, $5, '2026-08-05T00:00:00.000Z')`,
        [snapId, projId, caId, s.hash(snapId), s.f.ids.a]
      );
      await admin.query(
        `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
         VALUES ($1, 'ISO-A', 'STRUCTURAL', 'Isolated Concrete A', 'm3', $2, $3, $4, 0, $2, $3, $4, 'APPROVED', $5, now())`,
        [boqIdA, qty, rate, qty * rate, projId]
      );
      await admin.query(
        `INSERT INTO "UboqAwardedPhaseLine"(id, "projectId", "snapshotId", "awardedBoqItemId", "itemCode", "phaseCode", "sectionCode", "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt")
         VALUES ($1, $2, $3, $4, 'ISO-A', 'PHASE-01', 'FDN', 'Isolated Concrete A', '4000 psi', $5, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', $6, $6, $7, $8, $8, 'SOURCE_NOT_PROVIDED', now())`,
        [plIdA, projId, snapId, boqIdA, concSig, qty, rate, qty * rate]
      );
      if (boqIdB && plIdB) {
        await admin.query(
          `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
           VALUES ($1, 'ISO-B', 'STRUCTURAL', 'Isolated Concrete B', 'm3', $2, $3, $4, 0, $2, $3, $4, 'APPROVED', $5, now())`,
          [boqIdB, qty, rate, qty * rate, projId]
        );
        await admin.query(
          `INSERT INTO "UboqAwardedPhaseLine"(id, "projectId", "snapshotId", "awardedBoqItemId", "itemCode", "phaseCode", "sectionCode", "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt")
           VALUES ($1, $2, $3, $4, 'ISO-B', 'PHASE-01', 'FDN', 'Isolated Concrete B', '4000 psi', $5, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', $6, $6, $7, $8, $8, 'SOURCE_NOT_PROVIDED', now())`,
          [plIdB, projId, snapId, boqIdB, concSig, qty, rate, qty * rate]
        );
      }
      return { caId, snapId, boqIdA, plIdA, boqIdB, plIdB, qty, rate, contractValue };
    }

    const isoHistOver = await seedIsolatedBoqProject(pHistOver, { ceilingQty: 120, unitRate: 6500 });
    const isoPreSnap = await seedIsolatedBoqProject(pNegPreSnap, { ceilingQty: 100, unitRate: 6000 });
    const isoHdr = await seedIsolatedBoqProject(pNegHdr, { ceilingQty: 120, unitRate: 6500 });
    const isoInspLt = await seedIsolatedBoqProject(pNegInspLt, { ceilingQty: 100, unitRate: 6000 });
    const isoMulDup = await seedIsolatedBoqProject(pNegMulDup, { ceilingQty: 100, unitRate: 6000 });
    const isoMulBlk = await seedIsolatedBoqProject(pNegMulBlk, { ceilingQty: 100, unitRate: 6000 });

    // Valid sequential history on pHist:
    // - Accomplishments: accP1V1 (0->40, 2026-08-31) -> accP2V2 (40->90, 2026-10-31) -> accInspExceed (90->100, 2026-11-05) -> accMultiValid (100->110, 2026-11-08)
    //   followed by tail negative accBadPrev (prev=10 != 110, curr=5, 2026-11-14)
    // - Plus valid 0->90 prior SWA on pHistOver followed by accUnderPrevOver (prev=10, curr=40 -> 90+40=130 > 120)
    const accOverPrior = prefix + '-ACC-OVR-PRIOR';
    const bilOverPrior = prefix + '-BIL-OVR-PRIOR';

    await admin.query(
      `INSERT INTO "Accomplishment"(id, "billingPeriod", "accomplishmentDate", "preparedById", status, "approvedAmount", "projectId", "updatedAt")
       VALUES
         ($1,  'SWA-P1-AUG',   '2026-08-31T00:00:00.000Z', $14, 'APPROVED', 240000.00, $15, now()),
         ($2,  'SWA-P2-OCT',   '2026-10-31T00:00:00.000Z', $14, 'APPROVED', 325000.00, $15, now()),
         ($3,  'SWA-INSP-GT',  '2026-11-05T00:00:00.000Z', $14, 'APPROVED', 65000.00,  $15, now()),
         ($4,  'SWA-MUL-OK',   '2026-11-08T00:00:00.000Z', $14, 'APPROVED', 65000.00,  $15, now()),
         ($5,  'SWA-BAD-PREV', '2026-11-14T00:00:00.000Z', $14, 'APPROVED', 32500.00,  $15, now()),
         ($6,  'SWA-OVR-PRI',  '2026-10-31T00:00:00.000Z', $14, 'APPROVED', 585000.00, $16, now()),
         ($7,  'SWA-UP-OVER',  '2026-11-10T00:00:00.000Z', $14, 'APPROVED', 260000.00, $16, now()),
         ($8,  'SWA-PRE-SNAP', '2026-07-15T00:00:00.000Z', $14, 'APPROVED', 60000.00,  $17, now()),
         ($9,  'SWA-INSP-LT',  '2026-08-20T00:00:00.000Z', $14, 'APPROVED', 180000.00, $18, now()),
         ($10, 'SWA-MUL-DUP',  '2026-08-22T00:00:00.000Z', $14, 'APPROVED', 240000.00, $19, now()),
         ($11, 'SWA-MUL-BLK',  '2026-08-23T00:00:00.000Z', $14, 'APPROVED', 240000.00, $20, now()),
         ($12, 'SWA-UNLINKED', '2026-09-15T00:00:00.000Z', $14, 'APPROVED', 50000.00,  $21, now()),
         ($13, 'SWA-AMBIG',    '2026-09-15T00:00:00.000Z', $14, 'APPROVED', 50000.00,  $22, now())`,
      [
        accP1V1,
        accP2V2,
        accInspExceed,
        accMultiValid,
        accBadPrev,
        accOverPrior,
        accUnderPrevOver,
        accPreSnap,
        accInspBelow,
        accMultiDupLot,
        accMultiBlank,
        accUnlinked,
        accAmbig,
        s.f.ids.a,
        pHist,
        pHistOver,
        pNegPreSnap,
        pNegInspLt,
        pNegMulDup,
        pNegMulBlk,
        pUnlinked,
        pAmbig,
      ]
    );

    const aiP1 = prefix + '-AI-P1';
    const aiP2 = prefix + '-AI-P2';
    const aiInspGt = prefix + '-AI-IGT';
    const aiMulOk = prefix + '-AI-MOK';
    const aiBadPrev = prefix + '-AI-BADPREV';
    const aiOverPrior = prefix + '-AI-OVRPRI';
    const aiUpOver = prefix + '-AI-UPOVER';
    const aiPre = prefix + '-AI-PRE';
    const aiInspLt = prefix + '-AI-ILT';
    const aiMulDup = prefix + '-AI-MDUP';
    const aiMulBlk = prefix + '-AI-MBLK';
    const aiUnl = prefix + '-AI-UNL';
    const aiAmb = prefix + '-AI-AMB';

    await admin.query(
      `INSERT INTO "AccomplishmentItem"(id, "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "inspectionStatus", "approvalStatus", "accomplishmentId", "boqItemId")
       VALUES
         ($1,  0.0000,   40.0000, 40.0000, 40.0000,  100.0000, 'APPROVED', 'APPROVED', $14, $27),
         ($2,  40.0000,  50.0000, 50.0000, 90.0000,  120.0000, 'APPROVED', 'APPROVED', $15, $27),
         ($3,  90.0000,  10.0000, 10.0000, 100.0000, 120.0000, 'APPROVED', 'APPROVED', $16, $27),
         ($4,  100.0000, 10.0000, 10.0000, 110.0000, 120.0000, 'APPROVED', 'APPROVED', $17, $27),
         ($5,  10.0000,  5.0000,  5.0000,  15.0000,  120.0000, 'APPROVED', 'APPROVED', $18, $27),
         ($6,  0.0000,   90.0000, 90.0000, 90.0000,  120.0000, 'APPROVED', 'APPROVED', $19, $28),
         ($7,  10.0000,  40.0000, 40.0000, 50.0000,  120.0000, 'APPROVED', 'APPROVED', $20, $28),
         ($8,  0.0000,   10.0000, 10.0000, 10.0000,  100.0000, 'APPROVED', 'APPROVED', $21, $29),
         ($9,  0.0000,   30.0000, 30.0000, 30.0000,  100.0000, 'APPROVED', 'APPROVED', $22, $30),
         ($10, 0.0000,   40.0000, 40.0000, 40.0000,  100.0000, 'APPROVED', 'APPROVED', $23, $31),
         ($11, 0.0000,   40.0000, 40.0000, 40.0000,  100.0000, 'APPROVED', 'APPROVED', $24, $32),
         ($12, 0.0000,   10.0000, 10.0000, 10.0000,  50.0000,  'APPROVED', 'APPROVED', $25, $33),
         ($13, 0.0000,   10.0000, 10.0000, 10.0000,  50.0000,  'APPROVED', 'APPROVED', $26, $34)`,
      [
        aiP1,
        aiP2,
        aiInspGt,
        aiMulOk,
        aiBadPrev,
        aiOverPrior,
        aiUpOver,
        aiPre,
        aiInspLt,
        aiMulDup,
        aiMulBlk,
        aiUnl,
        aiAmb,
        accP1V1,
        accP2V2,
        accInspExceed,
        accMultiValid,
        accBadPrev,
        accOverPrior,
        accUnderPrevOver,
        accPreSnap,
        accInspBelow,
        accMultiDupLot,
        accMultiBlank,
        accUnlinked,
        accAmbig,
        boqHistConc,
        isoHistOver.boqIdA,
        isoPreSnap.boqIdA,
        isoInspLt.boqIdA,
        isoMulDup.boqIdA,
        isoMulBlk.boqIdA,
        boqUnl,
        boqAmb,
      ]
    );

    await admin.query(
      `INSERT INTO "Inspection"(id, "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectorName", "dateInspected", "approvalStatus", remarks, "inspectionFindings", "accomplishmentItemId")
       VALUES
         ($1,  40.0000, 40.0000, 40.0, 'QA Santos', '2026-08-31T00:00:00.000Z', 'APPROVED', 'LOT-AUG-FULL',    NULL, $17),
         ($2,  50.0000, 50.0000, 41.7, 'QA Santos', '2026-10-31T00:00:00.000Z', 'APPROVED', 'LOT-OCT-FULL',    NULL, $18),
         ($3,  32.0000, 28.0000, 23.3, 'QA Santos', '2026-11-05T00:00:00.000Z', 'APPROVED', 'LOT-EXCEED-CAP',  NULL, $19),
         ($4,  4.0000,  4.0000,  3.3,  'QA Santos', '2026-11-08T00:00:00.000Z', 'APPROVED', 'LOT-NORTH-GRID1', NULL, $20),
         ($5,  6.0000,  6.0000,  5.0,  'QA Reyes',  '2026-11-08T00:00:00.000Z', 'APPROVED', 'LOT-SOUTH-GRID2', NULL, $20),
         ($6,  5.0000,  5.0000,  4.2,  'QA Santos', '2026-11-14T00:00:00.000Z', 'APPROVED', 'LOT-BADPREV',     NULL, $21),
         ($7,  90.0000, 90.0000, 75.0, 'QA Santos', '2026-10-31T00:00:00.000Z', 'APPROVED', 'LOT-OVR-PRIOR',   NULL, $22),
         ($8,  40.0000, 40.0000, 33.3, 'QA Santos', '2026-11-10T00:00:00.000Z', 'APPROVED', 'LOT-UPOVER',      NULL, $23),
         ($9,  10.0000, 10.0000, 10.0, 'QA Santos', '2026-07-15T00:00:00.000Z', 'APPROVED', 'LOT-PRE',         NULL, $24),
         ($10, 25.0000, 20.0000, 20.0, 'QA Santos', '2026-08-20T00:00:00.000Z', 'APPROVED', 'LOT-PARTIAL-ONLY',NULL, $25),
         ($11, 25.0000, 25.0000, 25.0, 'QA Santos', '2026-08-22T00:00:00.000Z', 'APPROVED', 'LOT-DUP-POUR-A',  NULL, $26),
         ($12, 25.0000, 25.0000, 25.0, 'QA Reyes',  '2026-08-22T00:00:00.000Z', 'APPROVED', 'lot-dup-pour-a',  NULL, $26),
         ($13, 20.0000, 20.0000, 20.0, 'QA Santos', '2026-08-23T00:00:00.000Z', 'APPROVED', NULL,              NULL, $27),
         ($14, 20.0000, 20.0000, 20.0, 'QA Reyes',  '2026-08-23T00:00:00.000Z', 'APPROVED', '   ',             '',   $27),
         ($15, 10.0000, 10.0000, 20.0, 'QA Unl',    '2026-09-15T00:00:00.000Z', 'APPROVED', 'LOT-UNL',         NULL, $28),
         ($16, 10.0000, 10.0000, 20.0, 'QA Amb',    '2026-09-15T00:00:00.000Z', 'APPROVED', 'LOT-AMB',         NULL, $29)`,
      [
        prefix + '-INSP-1',
        prefix + '-INSP-2',
        prefix + '-INSP-7',
        prefix + '-INSP-8A',
        prefix + '-INSP-8B',
        prefix + '-INSP-4',
        prefix + '-INSP-OVRPRI',
        prefix + '-INSP-5',
        prefix + '-INSP-3',
        prefix + '-INSP-6',
        prefix + '-INSP-9A',
        prefix + '-INSP-9B',
        prefix + '-INSP-10A',
        prefix + '-INSP-10B',
        prefix + '-INSP-11',
        prefix + '-INSP-12',
        aiP1,
        aiP2,
        aiInspGt,
        aiMulOk,
        aiBadPrev,
        aiOverPrior,
        aiUpOver,
        aiPre,
        aiInspLt,
        aiMulDup,
        aiMulBlk,
        aiUnl,
        aiAmb,
      ]
    );

    // 7. Progress Billings on pHist (3 sequential valid bills + tail mismatch), pHistOver, pNegPreSnap, pNegHdr, pUnlinked, pAmbig
    await admin.query(
      `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
       VALUES
         ($1,  $11, '2026-08-01T00:00:00.000Z', '2026-08-31T00:00:00.000Z', '2026-09-02T00:00:00.000Z', 'PROGRESS', 600000,  600000,  240000, 'APPROVED_FOR_PAYMENT', $21, $21, $22, now()),
         ($2,  $12, '2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z', '2026-11-02T00:00:00.000Z', 'PROGRESS', 780000,  780000,  325000, 'APPROVED',             $21, $21, $22, now()),
         ($3,  $13, '2026-11-01T00:00:00.000Z', '2026-11-06T00:00:00.000Z', '2026-11-07T00:00:00.000Z', 'PROGRESS', 780000,  780000,  130000, 'APPROVED',             $21, $21, $22, now()),
         ($4,  $14, '2026-11-07T00:00:00.000Z', '2026-11-15T00:00:00.000Z', '2026-11-16T00:00:00.000Z', 'PROGRESS', 780000,  780000,  32500,  'APPROVED',             $21, $21, $22, now()),
         ($5,  $15, '2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z', '2026-11-01T00:00:00.000Z', 'PROGRESS', 780000,  780000,  585000, 'APPROVED',             $21, $21, $23, now()),
         ($6,  $16, '2026-11-01T00:00:00.000Z', '2026-11-10T00:00:00.000Z', '2026-11-11T00:00:00.000Z', 'PROGRESS', 780000,  780000,  260000, 'APPROVED',             $21, $21, $23, now()),
         ($7,  $17, '2026-07-01T00:00:00.000Z', '2026-07-15T00:00:00.000Z', '2026-07-16T00:00:00.000Z', 'PROGRESS', 600000,  600000,  60000,  'APPROVED',             $21, $21, $24, now()),
         ($8,  $18, '2026-10-01T00:00:00.000Z', '2026-10-31T00:00:00.000Z', '2026-11-03T00:00:00.000Z', 'PROGRESS', 9999999, 9999999, 325000, 'APPROVED',             $21, $21, $25, now()),
         ($9,  $19, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 250000,  250000,  50000,  'APPROVED',             $21, $21, $26, now()),
         ($10, $20, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-16T00:00:00.000Z', 'PROGRESS', 250000,  250000,  50000,  'APPROVED',             $21, $21, $27, now())`,
      [
        bilP1V1,
        bilP2V2,
        bilP3V2,
        bilBadPrev,
        bilOverPrior,
        bilUnderPrevOver,
        bilPreSnap,
        bilBadHeaderAmt,
        bilUnlinked,
        bilAmbig,
        'PB-IR-P1-' + hexId.toUpperCase(),
        'PB-IR-P2-' + hexId.toUpperCase(),
        'PB-IR-P3-' + hexId.toUpperCase(),
        'PB-IR-BPR-' + hexId.toUpperCase(),
        'PB-IR-OPR-' + hexId.toUpperCase(),
        'PB-IR-UPO-' + hexId.toUpperCase(),
        'PB-IR-PRE-' + hexId.toUpperCase(),
        'PB-IR-HDR-' + hexId.toUpperCase(),
        'PB-IR-UNL-' + hexId.toUpperCase(),
        'PB-IR-AMB-' + hexId.toUpperCase(),
        s.f.ids.a,
        pHist,
        pHistOver,
        pNegPreSnap,
        pNegHdr,
        pUnlinked,
        pAmbig,
      ]
    );

    await admin.query(
      `INSERT INTO "BillingItem"(id, "contractQuantity", "unitCost", "contractAmount", "previousQuantityBilled", "currentQuantityForBilling", "totalQuantityBilledToDate", "billingId", "boqItemId")
       VALUES
         ($1,  100, 6000, 600000, 0.0000,  40.0000, 40.0000,  $11, $21),
         ($2,  120, 6500, 780000, 40.0000, 50.0000, 90.0000,  $12, $21),
         ($3,  120, 6500, 780000, 90.0000, 20.0000, 110.0000, $13, $21),
         ($4,  120, 6500, 780000, 20.0000, 5.0000,  25.0000,  $14, $21),
         ($5,  120, 6500, 780000, 0.0000,  90.0000, 90.0000,  $15, $22),
         ($6,  120, 6500, 780000, 10.0000, 40.0000, 50.0000,  $16, $22),
         ($7,  100, 6000, 600000, 0.0000,  10.0000, 10.0000,  $17, $23),
         ($8,  120, 6500, 780000, 0.0000,  50.0000, 50.0000,  $18, $24),
         ($9,  50,  5000, 250000, 0.0000,  10.0000, 10.0000,  $19, $25),
         ($10, 50,  5000, 250000, 0.0000,  10.0000, 10.0000,  $20, $26)`,
      [
        prefix + '-BI-1',
        prefix + '-BI-2',
        prefix + '-BI-3SEQ',
        prefix + '-BI-5',
        prefix + '-BI-OPR',
        prefix + '-BI-4',
        prefix + '-BI-3',
        prefix + '-BI-6',
        prefix + '-BI-7',
        prefix + '-BI-8',
        bilP1V1,
        bilP2V2,
        bilP3V2,
        bilBadPrev,
        bilOverPrior,
        bilUnderPrevOver,
        bilPreSnap,
        bilBadHeaderAmt,
        bilUnlinked,
        bilAmbig,
        boqHistConc,
        isoHistOver.boqIdA,
        isoPreSnap.boqIdA,
        isoHdr.boqIdA,
        boqUnl,
        boqAmb,
      ]
    );

    // Distinct restricted liquidatedDamages = 1850.00 on bilP1V1 to test IR-01 other_deductions_exact redaction
    await admin.query(
      `INSERT INTO "BillingDeduction"(id, "grossBilling", retention, "withholdingTax", vat, "mobilizationAdvanceRecoupment", "liquidatedDamages", "netAmountDue", "billingId")
       VALUES ($1, 240000, 24000, 15000, 25714.29, 24000, 1850.00, 175150.00, $2)`,
      [prefix + '-BD-1', bilP1V1]
    );

    // 8. Seed T7 EVM Project (pEvm) for IR-01 (bac_allocated_amount = 310000.00) & IR-04 (unified 2026-09-15 cutoff)
    await admin.query(
      `INSERT INTO "ProjectSchedule"(id, "projectId", name, status, "workflowStatus", "baselineRevision", "projectStartDate", "baselineStartDate", "baselineFinishDate", "workDaysConfig", "approvedBy", "approvedAt", "activatedById", "activatedAt", "activationSnapshotHash", "updatedAt")
       VALUES ($1, $2, 'EVM IR-04 Unified Cutoff Baseline', 'BASELINE', 'ACTIVE_BASELINE', 1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-10-20T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $3, '2026-08-25T00:00:00.000Z', $3, '2026-08-25T00:00:00.000Z', $4, now())`,
      [schedEvm, pEvm, s.f.ids.a, s.hash(schedEvm)]
    );

    await admin.query(
      `INSERT INTO "ScheduleWBS"(id, "scheduleId", code, name, level, "orderIndex", "updatedAt")
       VALUES ($1, $2, 'WBS-EVM-1', 'Main Works', 1, 1, now())`,
      [wbsEvm, schedEvm]
    );

    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES
         ($1, $4, $5, 'ACT-CERT',   'Certified Concrete Works',    '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 100, 'm3', 310000.00, 95, 'IN_PROGRESS', now()),
         ($2, $4, $5, 'ACT-SELF',   'Self-Reported Masonry Works', '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 8,  100, 'm2', 100000.00, 80, 'IN_PROGRESS', now()),
         ($3, $4, $5, 'ACT-FUTURE', 'Future October Roofing',      '2026-10-05T00:00:00.000Z', '2026-10-20T00:00:00.000Z', '2026-10-05T00:00:00.000Z', '2026-10-20T00:00:00.000Z', 8,  100, 'm2', 150000.00, 0,  'NOT_STARTED', now())`,
      [actCert, actSelf, actFuture, schedEvm, wbsEvm]
    );

    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $4, $7, 100.0000, 100.000000),
         ($2, $5, $8, 100.0000, 100.000000),
         ($3, $6, $9, 100.0000, 100.000000)`,
      [
        prefix + '-EUL-1',
        prefix + '-EUL-2',
        prefix + '-EUL-3',
        plEvmCert,
        plEvmSelf,
        plEvmFut,
        actCert,
        actSelf,
        actFuture,
      ]
    );

    // Certified SWA on 2026-09-15 (50% = 50 m3) + Future SWA on 2099-01-15 (must be excluded!)
    const aiEvmCert = prefix + '-AI-EVMC';
    const aiEvmFut = prefix + '-AI-EVMF';
    await admin.query(
      `INSERT INTO "Accomplishment"(id, "billingPeriod", "accomplishmentDate", "preparedById", status, "approvedAmount", "projectId", "updatedAt")
       VALUES
         ($1, 'SWA-EVM-SEP', '2026-09-15T00:00:00.000Z', $3, 'APPROVED', 155000.00, $4, now()),
         ($2, 'SWA-EVM-FUT', '2099-01-15T00:00:00.000Z', $3, 'APPROVED', 155000.00, $4, now())`,
      [accEvmCert, accEvmFuture, s.f.ids.a, pEvm]
    );
    await admin.query(
      `INSERT INTO "AccomplishmentItem"(id, "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "inspectionStatus", "approvalStatus", "accomplishmentId", "boqItemId")
       VALUES
         ($1, 0.0000, 50.0000, 50.0000, 50.0000,  100.0000, 'APPROVED', 'APPROVED', $3, $5),
         ($2, 50.0000,50.0000, 50.0000, 100.0000, 100.0000, 'APPROVED', 'APPROVED', $4, $5)`,
      [aiEvmCert, aiEvmFut, accEvmCert, accEvmFuture, boqEvmCert]
    );
    await admin.query(
      `INSERT INTO "Inspection"(id, "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectorName", "dateInspected", "approvalStatus", remarks, "accomplishmentItemId")
       VALUES
         ($1, 50.0000, 50.0000, 50.0, 'QA EVM', '2026-09-15T00:00:00.000Z', 'APPROVED', 'LOT-EVM-SEP', $3),
         ($2, 50.0000, 50.0000, 50.0, 'QA EVM', '2099-01-15T00:00:00.000Z', 'APPROVED', 'LOT-EVM-FUT', $4)`,
      [prefix + '-INSP-EVMC', prefix + '-INSP-EVMF', aiEvmCert, aiEvmFut]
    );

    // Progress updates on schedEvm:
    // - ACT-CERT: certified update on 2026-09-15 (50%) + uncertified self-reported update on 2026-09-22 (95%) + future update on 2099-01-15 (100%)
    // - ACT-SELF: uncertified self-reported update on 2026-09-14 (80%, accomplishmentId = NULL)
    // - ACT-FUTURE: future self-reported update on 2099-02-01 (60%)
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $6, $7, '2026-09-15T00:00:00.000Z', 50,  50,  $10, $11),
         ($2, $6, $7, '2026-09-22T00:00:00.000Z', 95,  95,  $10, NULL),
         ($3, $6, $7, '2099-01-15T00:00:00.000Z', 100, 100, $10, $12),
         ($4, $6, $8, '2026-09-14T00:00:00.000Z', 80,  80,  $10, NULL),
         ($5, $6, $9, '2099-02-01T00:00:00.000Z', 60,  60,  $10, NULL)`,
      [
        prefix + '-SPU-1',
        prefix + '-SPU-2',
        prefix + '-SPU-3',
        prefix + '-SPU-4',
        prefix + '-SPU-5',
        schedEvm,
        actCert,
        actSelf,
        actFuture,
        s.f.ids.a,
        accEvmCert,
        accEvmFuture,
      ]
    );

    // ProjectCostLedger on pEvm:
    // 1. Valid direct MATERIAL cost on 2026-09-10 (<= 2026-09-15 cutoff) on boqEvmCert: 124,000.00 -> INCLUDED
    // 2. Post-cutoff direct MATERIAL cost on 2026-09-20 (> 2026-09-15 cutoff) on boqEvmCert: 45,000.00 -> EXCLUDED
    // 3. Future-dated direct MATERIAL cost on 2099-01-10 on boqEvmCert: 70,000.00 -> EXCLUDED
    // 4. INDIRECT overhead cost on 2026-09-10 on boqEvmCert: 30,000.00 -> EXCLUDED
    // 5. Unrelated off-schedule BOQ item direct cost on 2026-09-10 (boqEvmUnrel): 25,000.00 -> EXCLUDED
    await admin.query(
      `INSERT INTO "ProjectCostLedger"(id, "projectId", "costDate", "costCategory", "grossAmount", "netAmount", "approvalStatus", "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, $6, '2026-09-10T00:00:00.000Z', 'MATERIAL', 138880.00, 124000.00, 'APPROVED', $7, now()),
         ($2, $6, '2026-09-20T00:00:00.000Z', 'MATERIAL', 50400.00,  45000.00,  'APPROVED', $7, now()),
         ($3, $6, '2099-01-10T00:00:00.000Z', 'MATERIAL', 78400.00,  70000.00,  'APPROVED', $7, now()),
         ($4, $6, '2026-09-10T00:00:00.000Z', 'INDIRECT', 33600.00,  30000.00,  'APPROVED', $7, now()),
         ($5, $6, '2026-09-10T00:00:00.000Z', 'MATERIAL', 28000.00,  25000.00,  'APPROVED', $8, now())`,
      [
        prefix + '-PCL-VALID',
        prefix + '-PCL-POSTCUT',
        prefix + '-PCL-FUTURE',
        prefix + '-PCL-INDIRECT',
        prefix + '-PCL-UNREL',
        pEvm,
        boqEvmCert,
        boqEvmUnrel,
      ]
    );

    // 9. Seed WP3-BB-IR2-01 Projects (Non-Skipping Prior Approved Certificate Reconciliation)
    const ir2BMis = await seedIsolatedBoqProject(pIr2BilMis, { ceilingQty: 120, unitRate: 6000 });
    const ir2BMisOv = await seedIsolatedBoqProject(pIr2BilMisOver, { ceilingQty: 120, unitRate: 6000 });
    const ir2BOv1 = await seedIsolatedBoqProject(pIr2BilOver1, { ceilingQty: 100, unitRate: 5000 });
    const ir2BOv2 = await seedIsolatedBoqProject(pIr2BilOver2, {
      ceilingQty: 100,
      unitRate: 5000,
      secondBoq: true,
    });
    const ir2AIns = await seedIsolatedBoqProject(pIr2AccIns, { ceilingQty: 120, unitRate: 6000 });
    const ir2AInsOv = await seedIsolatedBoqProject(pIr2AccInsOver, { ceilingQty: 120, unitRate: 6000 });
    const ir2ABrk = await seedIsolatedBoqProject(pIr2AccBrk, { ceilingQty: 120, unitRate: 6000 });

    // 9a. Billings for IR2-01:
    // - pIr2BilMis: bilIr2Mis1 (0->40) -> bilIr2Mis2 (prev=10 != 40, curr=30) -> bilIr2Mis3 (prev=40, curr=20 -> would pass if bilIr2Mis2 skipped, must 409!)
    // - pIr2BilMisOver: bilIr2MisOv1 (0->40) -> bilIr2MisOv2 (prev=10 != 40, curr=50 -> true cum=90) -> bilIr2MisOv3 (prev=40, curr=40 -> 90+40=130 > 120 -> 409!)
    // - pIr2BilOver1: bilIr2Ov1a (0->110 > 100) -> bilIr2Ov1b (prev=0, curr=20 -> 110+20=130 > 100 -> 409!)
    // - pIr2BilOver2: bilIr2Ov2a (BOQ-A 0->110 > 100) -> bilIr2Ov2b (bills ONLY BOQ-B 0->10 -> must 409, cannot skip over-ceiling prior!)
    let ir2BiSeq = 1;
    async function insertIr2Billing(
      bId: string,
      projId: string,
      periodTo: string,
      billDate: string,
      contractVal: number,
      boqId: string,
      contractQty: number,
      rate: number,
      prevQty: number,
      currQty: number
    ) {
      await admin.query(
        `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
         VALUES ($1, $2, '2026-08-06T00:00:00.000Z', $3, $4, 'PROGRESS', $5, $5, $6, 'APPROVED', $7, $7, $8, now())`,
        [
          bId,
          `PB-IR2-${hexId.toUpperCase()}-${ir2BiSeq}`,
          periodTo,
          billDate,
          contractVal,
          currQty * rate,
          s.f.ids.a,
          projId,
        ]
      );
      await admin.query(
        `INSERT INTO "BillingItem"(id, "contractQuantity", "unitCost", "contractAmount", "previousQuantityBilled", "currentQuantityForBilling", "totalQuantityBilledToDate", "billingId", "boqItemId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          `${prefix}-IR2-BI-${ir2BiSeq++}`,
          contractQty,
          rate,
          contractQty * rate,
          prevQty,
          currQty,
          prevQty + currQty,
          bId,
          boqId,
        ]
      );
    }

    await insertIr2Billing(bilIr2Mis1, pIr2BilMis, '2026-08-31T00:00:00.000Z', '2026-09-01T00:00:00.000Z', ir2BMis.contractValue, ir2BMis.boqIdA, 120, 6000, 0, 40);
    await insertIr2Billing(bilIr2Mis2, pIr2BilMis, '2026-09-30T00:00:00.000Z', '2026-10-01T00:00:00.000Z', ir2BMis.contractValue, ir2BMis.boqIdA, 120, 6000, 10, 30);
    await insertIr2Billing(bilIr2Mis3, pIr2BilMis, '2026-10-31T00:00:00.000Z', '2026-11-01T00:00:00.000Z', ir2BMis.contractValue, ir2BMis.boqIdA, 120, 6000, 40, 20);

    await insertIr2Billing(bilIr2MisOv1, pIr2BilMisOver, '2026-08-31T00:00:00.000Z', '2026-09-01T00:00:00.000Z', ir2BMisOv.contractValue, ir2BMisOv.boqIdA, 120, 6000, 0, 40);
    await insertIr2Billing(bilIr2MisOv2, pIr2BilMisOver, '2026-09-30T00:00:00.000Z', '2026-10-01T00:00:00.000Z', ir2BMisOv.contractValue, ir2BMisOv.boqIdA, 120, 6000, 10, 50);
    await insertIr2Billing(bilIr2MisOv3, pIr2BilMisOver, '2026-10-31T00:00:00.000Z', '2026-11-01T00:00:00.000Z', ir2BMisOv.contractValue, ir2BMisOv.boqIdA, 120, 6000, 40, 40);

    await insertIr2Billing(bilIr2Ov1a, pIr2BilOver1, '2026-08-31T00:00:00.000Z', '2026-09-01T00:00:00.000Z', ir2BOv1.contractValue, ir2BOv1.boqIdA, 100, 5000, 0, 110);
    await insertIr2Billing(bilIr2Ov1b, pIr2BilOver1, '2026-09-30T00:00:00.000Z', '2026-10-01T00:00:00.000Z', ir2BOv1.contractValue, ir2BOv1.boqIdA, 100, 5000, 0, 20);

    await insertIr2Billing(bilIr2Ov2a, pIr2BilOver2, '2026-08-31T00:00:00.000Z', '2026-09-01T00:00:00.000Z', ir2BOv2.contractValue, ir2BOv2.boqIdA, 100, 5000, 0, 110);
    await insertIr2Billing(bilIr2Ov2b, pIr2BilOver2, '2026-09-30T00:00:00.000Z', '2026-10-01T00:00:00.000Z', ir2BOv2.contractValue, ir2BOv2.boqIdB!, 100, 5000, 0, 10);

    // 9b. Accomplishments for IR2-01:
    let ir2AiSeq = 1;
    async function insertIr2Accomplishment(
      aId: string,
      projId: string,
      accDate: string,
      boqId: string,
      contractQty: number,
      rate: number,
      prevQty: number,
      claimQty: number,
      inspApprovedQty: number
    ) {
      const itemId = `${prefix}-IR2-AI-${ir2AiSeq}`;
      const inspId = `${prefix}-IR2-INSP-${ir2AiSeq++}`;
      await admin.query(
        `INSERT INTO "Accomplishment"(id, "billingPeriod", "accomplishmentDate", "preparedById", status, "approvedAmount", "projectId", "updatedAt")
         VALUES ($1, $2, $3, $4, 'APPROVED', $5, $6, now())`,
        [aId, `SWA-IR2-${ir2AiSeq}`, accDate, s.f.ids.a, claimQty * rate, projId]
      );
      await admin.query(
        `INSERT INTO "AccomplishmentItem"(id, "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "inspectionStatus", "approvalStatus", "accomplishmentId", "boqItemId")
         VALUES ($1, $2, $3, $3, $4, $5, 'APPROVED', 'APPROVED', $6, $7)`,
        [itemId, prevQty, claimQty, prevQty + claimQty, contractQty, aId, boqId]
      );
      await admin.query(
        `INSERT INTO "Inspection"(id, "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectorName", "dateInspected", "approvalStatus", remarks, "accomplishmentItemId")
         VALUES ($1, $2, $2, 50.0, 'QA IR2', $3, 'APPROVED', $4, $5)`,
        [inspId, inspApprovedQty, accDate, `LOT-IR2-${ir2AiSeq}`, itemId]
      );
    }

    await insertIr2Accomplishment(accIr2Ins1, pIr2AccIns, '2026-08-31T00:00:00.000Z', ir2AIns.boqIdA, 120, 6000, 0, 80, 50); // insufficient inspection 50 < 80
    await insertIr2Accomplishment(accIr2Ins2, pIr2AccIns, '2026-09-30T00:00:00.000Z', ir2AIns.boqIdA, 120, 6000, 80, 20, 20); // valid 20, must 409 due to unresolved prior!

    await insertIr2Accomplishment(accIr2InsOv1, pIr2AccInsOver, '2026-08-31T00:00:00.000Z', ir2AInsOv.boqIdA, 120, 6000, 0, 80, 50); // insufficient inspection 50 < 80
    await insertIr2Accomplishment(accIr2InsOv2, pIr2AccInsOver, '2026-09-30T00:00:00.000Z', ir2AInsOv.boqIdA, 120, 6000, 0, 50, 50); // 0+50<=120 if prior dropped, 80+50=130>120 retained!

    await insertIr2Accomplishment(accIr2Brk1, pIr2AccBrk, '2026-08-31T00:00:00.000Z', ir2ABrk.boqIdA, 120, 6000, 0, 40, 40);
    await insertIr2Accomplishment(accIr2Brk2, pIr2AccBrk, '2026-09-30T00:00:00.000Z', ir2ABrk.boqIdA, 120, 6000, 5, 30, 30); // broken prev=5 != 40
    await insertIr2Accomplishment(accIr2Brk3, pIr2AccBrk, '2026-10-31T00:00:00.000Z', ir2ABrk.boqIdA, 120, 6000, 40, 20, 20); // would pass if accIr2Brk2 skipped, must 409!

    // 10. Seed WP3-BB-IR2-02 Project (EVM Activity-Specific Certification, 10% Cap vs 100% Claim, and Out-of-Schedule Cutoff Isolation)
    const caIr2Evm = prefix + '-CA-IR2EVM';
    const snapIr2Evm = prefix + '-SNAP-IR2EVM';
    const boqIr2Good = prefix + '-BOQ-IR2G'; // 100 m3 @ 1500 = 150,000.00
    const boqIr2Cross = prefix + '-BOQ-IR2X'; // 100 m2 @ 1000 = 100,000.00 (0 certified!)
    const boqIr2Cap = prefix + '-BOQ-IR2C'; // 100 m3 @ 2000 = 200,000.00 (10 m3 = 10% certified!)
    const boqIr2Off = prefix + '-BOQ-IR2OFF'; // 1 lot @ 50000 = 50,000.00 (NOT mapped to schedule!)
    const plIr2Good = prefix + '-PL-IR2G';
    const plIr2Cross = prefix + '-PL-IR2X';
    const plIr2Cap = prefix + '-PL-IR2C';

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES ($1, $2, NULL, 'PRIVATE', 'IR2 EVM Client', 'CA-IR2-EVM', 'UNIT_PRICE', 'VAT_INCLUSIVE', 500000.00, 500000.00, 500000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $3, '2026-08-15T00:00:00.000Z', now())`,
      [caIr2Evm, pIr2Evm, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "contractAuthorityId", "supersedesSnapshotId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
       VALUES ($1, $2, $3, NULL, 1, 'IR2 EVM Snapshot v1', 'APPROVED', $4, $5, $5, '2026-08-20T00:00:00.000Z')`,
      [snapIr2Evm, pIr2Evm, caIr2Evm, s.hash(snapIr2Evm), s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
       VALUES
         ($1, 'IR2-G', 'STRUCTURAL', 'IR2 Good Activity Scope',       'm3',  100, 1500,  150000, 0, 100, 1500,  150000, 'APPROVED', $5, now()),
         ($2, 'IR2-X', 'ARCHITECT',  'IR2 Cross-Claim Masonry Scope', 'm2',  100, 1000,  100000, 0, 100, 1000,  100000, 'APPROVED', $5, now()),
         ($3, 'IR2-C', 'STRUCTURAL', 'IR2 10Pct Capped Slab Scope',   'm3',  100, 2000,  200000, 0, 100, 2000,  200000, 'APPROVED', $5, now()),
         ($4, 'IR2-O', 'OTHER',      'IR2 Off-Schedule Ancillary',    'lot', 1,   50000, 50000,  0, 1,   50000, 50000,  'APPROVED', $5, now())`,
      [boqIr2Good, boqIr2Cross, boqIr2Cap, boqIr2Off, pIr2Evm]
    );
    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(id, "projectId", "snapshotId", "awardedBoqItemId", "itemCode", "phaseCode", "sectionCode", "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt")
       VALUES
         ($1, $4, $5, $6, 'IR2-G', 'PHASE-01', 'STR', 'IR2 Good Activity Scope',       '4000 psi', $9, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 100.0000, 1500.0000, 150000.00, 150000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($2, $4, $5, $7, 'IR2-X', 'PHASE-01', 'ARC', 'IR2 Cross-Claim Masonry Scope', 'CHB 150',  $9, 'm2', 'm2', 'AREA',   'UNIT_PRICE', 100.0000, 100.0000, 1000.0000, 100000.00, 100000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($3, $4, $5, $8, 'IR2-C', 'PHASE-01', 'STR', 'IR2 10Pct Capped Slab Scope',   '4000 psi', $9, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 100.0000, 2000.0000, 200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now())`,
      [plIr2Good, plIr2Cross, plIr2Cap, pIr2Evm, snapIr2Evm, boqIr2Good, boqIr2Cross, boqIr2Cap, concSig]
    );

    await admin.query(
      `INSERT INTO "ProjectSchedule"(id, "projectId", name, status, "workflowStatus", "baselineRevision", "projectStartDate", "baselineStartDate", "baselineFinishDate", "workDaysConfig", "approvedBy", "approvedAt", "activatedById", "activatedAt", "activationSnapshotHash", "updatedAt")
       VALUES ($1, $2, 'IR2-02 Activity Certification Schedule', 'BASELINE', 'ACTIVE_BASELINE', 1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-30T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $3, '2026-08-25T00:00:00.000Z', $3, '2026-08-25T00:00:00.000Z', $4, now())`,
      [schedIr2Evm, pIr2Evm, s.f.ids.a, s.hash(schedIr2Evm)]
    );
    await admin.query(
      `INSERT INTO "ScheduleWBS"(id, "scheduleId", code, name, level, "orderIndex", "updatedAt")
       VALUES ($1, $2, 'WBS-IR2-1', 'IR2 Main Works', 1, 1, now())`,
      [wbsIr2Evm, schedIr2Evm]
    );
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES
         ($1, $5, $6, 'ACT-GOOD',     'Activity B Valid 40Pct Certified',    '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 100, 'm3', 150000.00, 40,  'IN_PROGRESS', now()),
         ($2, $5, $6, 'ACT-CROSS',    'Activity A Cross-Claiming Acc B 100', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 100, 'm2', 100000.00, 100, 'IN_PROGRESS', now()),
         ($3, $5, $6, 'ACT-CAP10',    'Activity C 10Pct Cert vs 100 Claim',  '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 100, 'm3', 200000.00, 100, 'IN_PROGRESS', now()),
         ($4, $5, $6, 'ACT-UNLINKED', 'Unlinked Activity Claiming Acc B',    '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 5,  1,   'lot',80000.00,  100, 'IN_PROGRESS', now())`,
      [actIr2Good, actIr2Cross, actIr2Cap10, actIr2Unl, schedIr2Evm, wbsIr2Evm]
    );

    // Note: ACT-UNLINKED intentionally has NO UboqScheduleActivityLink and NO ScheduleBOQAllocation!
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $4, $7, 100.0000, 100.000000),
         ($2, $5, $8, 100.0000, 100.000000),
         ($3, $6, $9, 100.0000, 100.000000)`,
      [
        prefix + '-IR2-UL1',
        prefix + '-IR2-UL2',
        prefix + '-IR2-UL3',
        plIr2Good,
        plIr2Cross,
        plIr2Cap,
        actIr2Good,
        actIr2Cross,
        actIr2Cap10,
      ]
    );

    // Seed Accomplishments on pIr2Evm:
    // - accIr2Good (2026-09-15): certifies 40/100 on boqIr2Good
    // - accIr2Cap10 (2026-09-15): certifies 10/100 on boqIr2Cap
    // - accIr2OffSched (2026-09-25, <= wall clock!): certifies 1/1 on boqIr2Off (NOT mapped to schedule -> must NOT shift 2026-09-15 cutoff!)
    // - accIr2Future (2099-01-15): certifies remaining 60/100 on boqIr2Good (future -> must NOT shift cutoff!)
    await insertIr2Accomplishment(accIr2Good, pIr2Evm, '2026-09-15T00:00:00.000Z', boqIr2Good, 100, 1500, 0, 40, 40);
    await insertIr2Accomplishment(accIr2Cap10, pIr2Evm, '2026-09-15T00:00:00.000Z', boqIr2Cap, 100, 2000, 0, 10, 10);
    await insertIr2Accomplishment(accIr2OffSched, pIr2Evm, '2026-09-25T00:00:00.000Z', boqIr2Off, 1, 50000, 0, 1, 1);
    await insertIr2Accomplishment(accIr2Future, pIr2Evm, '2099-01-15T00:00:00.000Z', boqIr2Good, 100, 1500, 40, 60, 60);

    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $6, $7,  '2026-09-15T00:00:00.000Z', 40,  40,  $11, $12),
         ($2, $6, $8,  '2026-09-15T00:00:00.000Z', 100, 100, $11, $12),
         ($3, $6, $8,  '2026-09-24T00:00:00.000Z', 100, 100, $11, $12),
         ($4, $6, $9,  '2026-09-15T00:00:00.000Z', 100, 100, $11, $13),
         ($5, $6, $10, '2026-09-15T00:00:00.000Z', 100, 1,   $11, $12)`,
      [
        prefix + '-IR2-SPU1',
        prefix + '-IR2-SPU2',
        prefix + '-IR2-SPU3',
        prefix + '-IR2-SPU4',
        prefix + '-IR2-SPU5',
        schedIr2Evm,
        actIr2Good,
        actIr2Cross,
        actIr2Cap10,
        actIr2Unl,
        s.f.ids.a,
        accIr2Good,
        accIr2Cap10,
      ]
    );

    // Seed pre-cutoff (2026-09-12: 50,000) and post-cutoff (2026-09-20: 30,000) direct costs on boqIr2Good:
    // If out-of-schedule accIr2OffSched (2026-09-25) or cross-activity SPU3 (2026-09-24) shifted cutoff, AC would become 80000 instead of 50000!
    await admin.query(
      `INSERT INTO "ProjectCostLedger"(id, "projectId", "costDate", "costCategory", "grossAmount", "netAmount", "approvalStatus", "awardedBoqItemId", "updatedAt")
       VALUES
         ($1, $3, '2026-09-12T00:00:00.000Z', 'MATERIAL', 56000.00, 50000.00, 'APPROVED', $4, now()),
         ($2, $3, '2026-09-20T00:00:00.000Z', 'MATERIAL', 33600.00, 30000.00, 'APPROVED', $4, now())`,
      [prefix + '-IR2-PCL1', prefix + '-IR2-PCL2', pIr2Evm, boqIr2Good]
    );

    // 11. Seed WP3-BB-IR3-01 Project (Single Shared Per-BOQ Certified Budget Across Link Representations & Snapshot Versions)
    const caIr3Evm = prefix + '-CA-IR3EVM';
    const snapIr3V1 = prefix + '-SNAP-IR3V1'; // SUPERSEDED (v1, approved 2026-08-20)
    const snapIr3V2 = prefix + '-SNAP-IR3V2'; // APPROVED (v2, supersedes v1, approved 2026-09-01)
    const boqIr3Mix20 = prefix + '-BOQ-IR3M20'; // 20 m3 @ 1000 = 20,000.00 (10.0000 units certified!)
    const boqIr3Mix10 = prefix + '-BOQ-IR3M10'; // 10 m3 @ 1000 = 10,000.00 (10.0000 units certified!)
    const boqIr3Snap20 = prefix + '-BOQ-IR3S20'; // 20 m3 @ 1500 = 30,000.00 (10.0000 units certified!)
    const boqIr3Snap10 = prefix + '-BOQ-IR3S10'; // 10 m3 @ 1500 = 15,000.00 (10.0000 units certified!)
    const boqIr3SplitA = prefix + '-BOQ-IR3SPA'; // 100 m3 @ 1000 = 100,000.00 (60.0000 units certified!)
    const boqIr3DistB = prefix + '-BOQ-IR3DSB'; // 50 m2 @ 2000 = 100,000.00 (25.0000 units certified!)

    const plIr3Mix20V1 = prefix + '-PL-IR3M20-V1';
    const plIr3Mix10V1 = prefix + '-PL-IR3M10-V1';
    const plIr3Snap20V1 = prefix + '-PL-IR3S20-V1';
    const plIr3Snap10V1 = prefix + '-PL-IR3S10-V1';
    const plIr3SplitAV1 = prefix + '-PL-IR3SPA-V1';

    const plIr3Mix20V2 = prefix + '-PL-IR3M20-V2';
    const plIr3Mix10V2 = prefix + '-PL-IR3M10-V2';
    const plIr3Snap20V2 = prefix + '-PL-IR3S20-V2';
    const plIr3Snap10V2 = prefix + '-PL-IR3S10-V2';
    const plIr3SplitAV2 = prefix + '-PL-IR3SPA-V2';

    const accIr3Cert = prefix + '-ACC-IR3-CERT';

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES ($1, $2, NULL, 'PRIVATE', 'IR3 EVM Deduplication Client', 'CA-IR3-EVM', 'UNIT_PRICE', 'VAT_INCLUSIVE', 275000.00, 275000.00, 275000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $3, '2026-08-15T00:00:00.000Z', now())`,
      [caIr3Evm, pIr3Evm, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "contractAuthorityId", "supersedesSnapshotId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $3, $4, NULL, 1, 'IR3 EVM Snapshot v1', 'SUPERSEDED', $5, $7, $7, '2026-08-20T00:00:00.000Z'),
         ($2, $3, $4, $1,   2, 'IR3 EVM Snapshot v2', 'APPROVED',   $6, $7, $7, '2026-09-01T00:00:00.000Z')`,
      [snapIr3V1, snapIr3V2, pIr3Evm, caIr3Evm, s.hash(snapIr3V1), s.hash(snapIr3V2), s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
       VALUES
         ($1, 'IR3-M20', 'STRUCTURAL', 'IR3 Mixed-Link 20m3 BOQ (10 Cert)',   'm3', 20,  1000, 20000,  0, 20,  1000, 20000,  'APPROVED', $7, now()),
         ($2, 'IR3-M10', 'STRUCTURAL', 'IR3 Mixed-Link 10m3 BOQ (10 Cert)',   'm3', 10,  1000, 10000,  0, 10,  1000, 10000,  'APPROVED', $7, now()),
         ($3, 'IR3-S20', 'STRUCTURAL', 'IR3 Multi-Snap 20m3 BOQ (10 Cert)',   'm3', 20,  1500, 30000,  0, 20,  1500, 30000,  'APPROVED', $7, now()),
         ($4, 'IR3-S10', 'STRUCTURAL', 'IR3 Multi-Snap 10m3 BOQ (10 Cert)',   'm3', 10,  1500, 15000,  0, 10,  1500, 15000,  'APPROVED', $7, now()),
         ($5, 'IR3-SPA', 'STRUCTURAL', 'IR3 Legit Split 100m3 BOQ (60 Cert)', 'm3', 100, 1000, 100000, 0, 100, 1000, 100000, 'APPROVED', $7, now()),
         ($6, 'IR3-DSB', 'ARCHITECT',  'IR3 Distinct 50m2 BOQ (25 Cert)',     'm2', 50,  2000, 100000, 0, 50,  2000, 100000, 'APPROVED', $7, now())`,
      [boqIr3Mix20, boqIr3Mix10, boqIr3Snap20, boqIr3Snap10, boqIr3SplitA, boqIr3DistB, pIr3Evm]
    );
    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(id, "projectId", "snapshotId", "awardedBoqItemId", "itemCode", "phaseCode", "sectionCode", "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt")
       VALUES
         ($1,  $11, $12, $14, 'IR3-M20', 'PHASE-01', 'STR', 'IR3 Mixed-Link 20m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 20.0000,  20.0000,  1000.0000, 20000.00,  20000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($2,  $11, $12, $15, 'IR3-M10', 'PHASE-01', 'STR', 'IR3 Mixed-Link 10m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 10.0000,  10.0000,  1000.0000, 10000.00,  10000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($3,  $11, $12, $16, 'IR3-S20', 'PHASE-01', 'STR', 'IR3 Multi-Snap 20m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 20.0000,  20.0000,  1500.0000, 30000.00,  30000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($4,  $11, $12, $17, 'IR3-S10', 'PHASE-01', 'STR', 'IR3 Multi-Snap 10m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 10.0000,  10.0000,  1500.0000, 15000.00,  15000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($5,  $11, $12, $18, 'IR3-SPA', 'PHASE-01', 'STR', 'IR3 Legit Split 100m3 BOQ', '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 100.0000, 1000.0000, 100000.00, 100000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($6,  $11, $13, $14, 'IR3-M20', 'PHASE-01', 'STR', 'IR3 Mixed-Link 20m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 20.0000,  20.0000,  1000.0000, 20000.00,  20000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($7,  $11, $13, $15, 'IR3-M10', 'PHASE-01', 'STR', 'IR3 Mixed-Link 10m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 10.0000,  10.0000,  1000.0000, 10000.00,  10000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($8,  $11, $13, $16, 'IR3-S20', 'PHASE-01', 'STR', 'IR3 Multi-Snap 20m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 20.0000,  20.0000,  1500.0000, 30000.00,  30000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($9,  $11, $13, $17, 'IR3-S10', 'PHASE-01', 'STR', 'IR3 Multi-Snap 10m3 BOQ',   '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 10.0000,  10.0000,  1500.0000, 15000.00,  15000.00,  'SOURCE_NOT_PROVIDED', now()),
         ($10, $11, $13, $18, 'IR3-SPA', 'PHASE-01', 'STR', 'IR3 Legit Split 100m3 BOQ', '4000 psi', $19, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 100.0000, 1000.0000, 100000.00, 100000.00, 'SOURCE_NOT_PROVIDED', now())`,
      [
        plIr3Mix20V1,
        plIr3Mix10V1,
        plIr3Snap20V1,
        plIr3Snap10V1,
        plIr3SplitAV1,
        plIr3Mix20V2,
        plIr3Mix10V2,
        plIr3Snap20V2,
        plIr3Snap10V2,
        plIr3SplitAV2,
        pIr3Evm,
        snapIr3V1,
        snapIr3V2,
        boqIr3Mix20,
        boqIr3Mix10,
        boqIr3Snap20,
        boqIr3Snap10,
        boqIr3SplitA,
        concSig,
      ]
    );

    // Approved certified Accomplishment on 2026-09-15 certifying exact quantities across all 6 BOQ items:
    // - boqIr3Mix20: 10 / 20 certified
    // - boqIr3Mix10: 10 / 10 certified
    // - boqIr3Snap20: 10 / 20 certified
    // - boqIr3Snap10: 10 / 10 certified
    // - boqIr3SplitA: 60 / 100 certified
    // - boqIr3DistB: 25 / 50 certified
    await admin.query(
      `INSERT INTO "Accomplishment"(id, "billingPeriod", "accomplishmentDate", "preparedById", status, "approvedAmount", "projectId", "updatedAt")
       VALUES ($1, 'SWA-IR3-01', '2026-09-15T00:00:00.000Z', $2, 'APPROVED', 160000.00, $3, now())`,
      [accIr3Cert, s.f.ids.a, pIr3Evm]
    );
    let ir3ItemSeq = 1;
    for (const [bId, cQty, certQty] of [
      [boqIr3Mix20, 20, 10],
      [boqIr3Mix10, 10, 10],
      [boqIr3Snap20, 20, 10],
      [boqIr3Snap10, 10, 10],
      [boqIr3SplitA, 100, 60],
      [boqIr3DistB, 50, 25],
    ] as Array<[string, number, number]>) {
      const itId = `${prefix}-IR3-AI-${ir3ItemSeq}`;
      const inId = `${prefix}-IR3-INSP-${ir3ItemSeq++}`;
      await admin.query(
        `INSERT INTO "AccomplishmentItem"(id, "previousQuantity", "currentQuantityClaimed", "approvedQuantity", "totalQuantityToDate", "contractQuantity", "inspectionStatus", "approvalStatus", "accomplishmentId", "boqItemId")
         VALUES ($1, 0, $2, $2, $2, $3, 'APPROVED', 'APPROVED', $4, $5)`,
        [itId, certQty, cQty, accIr3Cert, bId]
      );
      await admin.query(
        `INSERT INTO "Inspection"(id, "actualQuantityVerified", "approvedQuantity", "approvedPercentage", "inspectorName", "dateInspected", "approvalStatus", remarks, "accomplishmentItemId")
         VALUES ($1, $2, $2, 100.0, 'QA IR3', '2026-09-15T00:00:00.000Z', 'APPROVED', $3, $4)`,
        [inId, certQty, `LOT-IR3-${ir3ItemSeq}`, itId]
      );
    }

    // Seed all 6 IR3-01 schedules + WBS roots on pIr3Evm
    let ir3SchedSeq = 1;
    for (const [scId, scName] of [
      [schedIr3MixSplit, 'IR3 Test A1 Mixed Link Split (20 BOQ / 10 Cert)'],
      [schedIr3MixOver, 'IR3 Test A2 Mixed Link Overlap (10 BOQ / 10+10 Mapped)'],
      [schedIr3IntraConf, 'IR3 Test A3 Intra-Activity Conflicting Links'],
      [schedIr3SnapSplit, 'IR3 Test B1 Multi-Snapshot Split (v1 + v2 / 10 Cert)'],
      [schedIr3SnapOver, 'IR3 Test B2 Multi-Snapshot Overlap (v1 + v2 > 10 Ceiling)'],
      [schedIr3LegitSplit, 'IR3 Test C Legitimate Split & Distinct BOQ'],
    ]) {
      const revNum = ir3SchedSeq;
      const wfStatus = revNum === 6 ? 'ACTIVE_BASELINE' : 'SUPERSEDED_BASELINE';
      const wId = `${prefix}-IR3-WBS-${ir3SchedSeq++}`;
      await admin.query(
        `INSERT INTO "ProjectSchedule"(id, "projectId", name, status, "workflowStatus", "baselineRevision", "projectStartDate", "baselineStartDate", "baselineFinishDate", "workDaysConfig", "approvedBy", "approvedAt", "activatedById", "activatedAt", "activationSnapshotHash", "updatedAt")
         VALUES ($1, $2, $3, 'BASELINE', $6, $7, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-30T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $4, '2026-08-25T00:00:00.000Z', $4, '2026-08-25T00:00:00.000Z', $5, now())`,
        [scId, pIr3Evm, scName, s.f.ids.a, s.hash(scId), wfStatus, revNum]
      );
      await admin.query(
        `INSERT INTO "ScheduleWBS"(id, "scheduleId", code, name, level, "orderIndex", "updatedAt")
         VALUES ($1, $2, 'WBS-1', 'Main Works', 1, 1, now())`,
        [wId, scId]
      );
    }

    // Schedule 1 (schedIr3MixSplit - Test A1): One 20-unit BOQ w/ 10 certified units linked to ACT-MIX-ULNK (10 via UboqScheduleActivityLink) & ACT-MIX-ALLOC (10 via ScheduleBOQAllocation), both claiming 100%
    const actIr3MixU = prefix + '-ACT-IR3-MU';
    const actIr3MixA = prefix + '-ACT-IR3-MA';
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES
         ($1, $3, $4, 'ACT-MIX-ULNK',  'Mixed Link Activity via PhaseLine (10 m3)', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 10000.00, 100, 'IN_PROGRESS', now()),
         ($2, $3, $4, 'ACT-MIX-ALLOC', 'Mixed Link Activity via BOQAlloc (10 m3)',  '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 10000.00, 100, 'IN_PROGRESS', now())`,
      [actIr3MixU, actIr3MixA, schedIr3MixSplit, prefix + '-IR3-WBS-1']
    );
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES ($1, $2, $3, 10.0000, 50.000000)`,
      [prefix + '-IR3-UL-M1', plIr3Mix20V2, actIr3MixU]
    );
    await admin.query(
      `INSERT INTO "ScheduleBOQAllocation"(id, "activityId", "awardedBoqItemId", "scheduleId", "projectId", "mappedQuantity", "allocatedAmount")
       VALUES ($1, $2, $3, $4, $5, 10, 10000.00)`,
      [prefix + '-IR3-AL-M1', actIr3MixA, boqIr3Mix20, schedIr3MixSplit, pIr3Evm]
    );
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $3, $4, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7),
         ($2, $3, $5, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7)`,
      [prefix + '-IR3-SPU-M1', prefix + '-IR3-SPU-M2', schedIr3MixSplit, actIr3MixU, actIr3MixA, s.f.ids.a, accIr3Cert]
    );

    // Schedule 2 (schedIr3MixOver - Test A2 exact conditional_repro): One 10-unit BOQ w/ 10 certified units mapped 10 via UboqScheduleActivityLink + 10 via ScheduleBOQAllocation (20 > 10 ceiling -> 409!)
    const actIr3OvU = prefix + '-ACT-IR3-OVU';
    const actIr3OvA = prefix + '-ACT-IR3-OVA';
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES
         ($1, $3, $4, 'ACT-OVR-ULNK',  'Overlapping PhaseLine 10m3 on 10m3 BOQ', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 10000.00, 100, 'IN_PROGRESS', now()),
         ($2, $3, $4, 'ACT-OVR-ALLOC', 'Overlapping BOQAlloc 10m3 on 10m3 BOQ',  '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 10000.00, 100, 'IN_PROGRESS', now())`,
      [actIr3OvU, actIr3OvA, schedIr3MixOver, prefix + '-IR3-WBS-2']
    );
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES ($1, $2, $3, 10.0000, 100.000000)`,
      [prefix + '-IR3-UL-OV1', plIr3Mix10V2, actIr3OvU]
    );
    await admin.query(
      `INSERT INTO "ScheduleBOQAllocation"(id, "activityId", "awardedBoqItemId", "scheduleId", "projectId", "mappedQuantity", "allocatedAmount")
       VALUES ($1, $2, $3, $4, $5, 10, 10000.00)`,
      [prefix + '-IR3-AL-OV1', actIr3OvA, boqIr3Mix10, schedIr3MixOver, pIr3Evm]
    );
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $3, $4, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7),
         ($2, $3, $5, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7)`,
      [prefix + '-IR3-SPU-OV1', prefix + '-IR3-SPU-OV2', schedIr3MixOver, actIr3OvU, actIr3OvA, s.f.ids.a, accIr3Cert]
    );

    // Schedule 3 (schedIr3IntraConf - Test A3): Single activity carrying conflicting UboqScheduleActivityLink (10 m3) and ScheduleBOQAllocation (6 m3) -> 409!
    const actIr3Intra = prefix + '-ACT-IR3-INT';
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES ($1, $2, $3, 'ACT-INTRA-CONFLICT', 'Conflicting Dual Link on Same Activity', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 10000.00, 100, 'IN_PROGRESS', now())`,
      [actIr3Intra, schedIr3IntraConf, prefix + '-IR3-WBS-3']
    );
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES ($1, $2, $3, 10.0000, 50.000000)`,
      [prefix + '-IR3-UL-IC1', plIr3Mix20V2, actIr3Intra]
    );
    await admin.query(
      `INSERT INTO "ScheduleBOQAllocation"(id, "activityId", "awardedBoqItemId", "scheduleId", "projectId", "mappedQuantity", "allocatedAmount")
       VALUES ($1, $2, $3, $4, $5, 6, 6000.00)`,
      [prefix + '-IR3-AL-IC1', actIr3Intra, boqIr3Mix20, schedIr3IntraConf, pIr3Evm]
    );

    // Schedule 4 (schedIr3SnapSplit - Test B1): Same 20-unit BOQ (10 certified) referenced across Snapshot v1 (10 m3) and Snapshot v2 (10 m3), both claiming 100% -> 5+5=10 units (no pool replenishment!)
    const actIr3SnV1 = prefix + '-ACT-IR3-SV1';
    const actIr3SnV2 = prefix + '-ACT-IR3-SV2';
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES
         ($1, $3, $4, 'ACT-SNAP-V1', 'Activity Linked via Snapshot v1 (10 m3)', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 15000.00, 100, 'IN_PROGRESS', now()),
         ($2, $3, $4, 'ACT-SNAP-V2', 'Activity Linked via Snapshot v2 (10 m3)', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 15000.00, 100, 'IN_PROGRESS', now())`,
      [actIr3SnV1, actIr3SnV2, schedIr3SnapSplit, prefix + '-IR3-WBS-4']
    );
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $3, $5, 10.0000, 50.000000),
         ($2, $4, $6, 10.0000, 50.000000)`,
      [prefix + '-IR3-UL-SV1', prefix + '-IR3-UL-SV2', plIr3Snap20V1, plIr3Snap20V2, actIr3SnV1, actIr3SnV2]
    );
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $3, $4, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7),
         ($2, $3, $5, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7)`,
      [prefix + '-IR3-SPU-SV1', prefix + '-IR3-SPU-SV2', schedIr3SnapSplit, actIr3SnV1, actIr3SnV2, s.f.ids.a, accIr3Cert]
    );

    // Schedule 5 (schedIr3SnapOver - Test B2): Same 10-unit BOQ (10 certified) mapped 10 via v1 + 10 via v2 (20 > 10 ceiling -> 409!)
    const actIr3SoV1 = prefix + '-ACT-IR3-SOV1';
    const actIr3SoV2 = prefix + '-ACT-IR3-SOV2';
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES
         ($1, $3, $4, 'ACT-SOVR-V1', 'Overlapping v1 10m3 on 10m3 BOQ', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 15000.00, 100, 'IN_PROGRESS', now()),
         ($2, $3, $4, 'ACT-SOVR-V2', 'Overlapping v2 10m3 on 10m3 BOQ', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 10, 'm3', 15000.00, 100, 'IN_PROGRESS', now())`,
      [actIr3SoV1, actIr3SoV2, schedIr3SnapOver, prefix + '-IR3-WBS-5']
    );
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $3, $5, 10.0000, 100.000000),
         ($2, $4, $6, 10.0000, 100.000000)`,
      [prefix + '-IR3-UL-SOV1', prefix + '-IR3-UL-SOV2', plIr3Snap10V1, plIr3Snap10V2, actIr3SoV1, actIr3SoV2]
    );
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $3, $4, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7),
         ($2, $3, $5, '2026-09-15T00:00:00.000Z', 100, 10, $6, $7)`,
      [prefix + '-IR3-SPU-SO1', prefix + '-IR3-SPU-SO2', schedIr3SnapOver, actIr3SoV1, actIr3SoV2, s.f.ids.a, accIr3Cert]
    );

    // Schedule 6 (schedIr3LegitSplit - Test C): Legitimate split (60 + 40 on boqIr3SplitA w/ 30 + 30 = 60 certified) + distinct BOQ (50 on boqIr3DistB w/ 25 certified)
    const actIr3LegA1 = prefix + '-ACT-IR3-LA1';
    const actIr3LegA2 = prefix + '-ACT-IR3-LA2';
    const actIr3LegB1 = prefix + '-ACT-IR3-LB1';
    await admin.query(
      `INSERT INTO "ScheduleActivity"(id, "scheduleId", "wbsId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", "actualProgressPercent", status, "updatedAt")
       VALUES
         ($1, $4, $5, 'ACT-SPLIT-A1', 'Legit Split Zone 1 (60m3 @ 50% = 30m3)', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 60, 'm3', 60000.00,  50, 'IN_PROGRESS', now()),
         ($2, $4, $5, 'ACT-SPLIT-A2', 'Legit Split Zone 2 (40m3 @ 75% = 30m3)', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 40, 'm3', 40000.00,  75, 'IN_PROGRESS', now()),
         ($3, $4, $5, 'ACT-DIST-B1',  'Distinct BOQ Masonry (50m2 @ 50% = 25m2)','2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', '2026-09-05T00:00:00.000Z', '2026-09-25T00:00:00.000Z', 10, 50, 'm2', 100000.00, 50, 'IN_PROGRESS', now())`,
      [actIr3LegA1, actIr3LegA2, actIr3LegB1, schedIr3LegitSplit, prefix + '-IR3-WBS-6']
    );
    await admin.query(
      `INSERT INTO "UboqScheduleActivityLink"(id, "phaseLineId", "activityId", "allocatedQty", "allocationWeightPct")
       VALUES
         ($1, $3, $4, 60.0000, 60.000000),
         ($2, $3, $5, 40.0000, 40.000000)`,
      [prefix + '-IR3-UL-LA1', prefix + '-IR3-UL-LA2', plIr3SplitAV2, actIr3LegA1, actIr3LegA2]
    );
    await admin.query(
      `INSERT INTO "ScheduleBOQAllocation"(id, "activityId", "awardedBoqItemId", "scheduleId", "projectId", "mappedQuantity", "allocatedAmount")
       VALUES ($1, $2, $3, $4, $5, 50, 100000.00)`,
      [prefix + '-IR3-AL-LB1', actIr3LegB1, boqIr3DistB, schedIr3LegitSplit, pIr3Evm]
    );
    await admin.query(
      `INSERT INTO "ScheduleProgressUpdate"(id, "scheduleId", "activityId", "updateDate", "progressPercent", "actualQuantity", "reportedById", "accomplishmentId")
       VALUES
         ($1, $4, $5, '2026-09-15T00:00:00.000Z', 50, 30, $8, $9),
         ($2, $4, $6, '2026-09-15T00:00:00.000Z', 75, 30, $8, $9),
         ($3, $4, $7, '2026-09-15T00:00:00.000Z', 50, 25, $8, $9)`,
      [
        prefix + '-IR3-SPU-LA1',
        prefix + '-IR3-SPU-LA2',
        prefix + '-IR3-SPU-LB1',
        schedIr3LegitSplit,
        actIr3LegA1,
        actIr3LegA2,
        actIr3LegB1,
        s.f.ids.a,
        accIr3Cert,
      ]
    );
  });

  actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };
  const Module = require('node:module');
  originalLoad = Module._load;
  Module._load = function (request: string, ...args: any[]) {
    if (request === '@/lib/dal/auth') {
      return { verifyOperationalSession: async () => actor };
    }
    if (request === 'next/server') {
      const mod = originalLoad.call(this, request, ...args);
      NextRequest = mod.NextRequest;
      return mod;
    }
    return originalLoad.call(this, request, ...args);
  };
  try {
    workingRoute = require('../../src/app/api/uboq/templates/route');
    layoutsRoute = require('../../src/app/api/uboq/templates/layouts/route');
    formalRoute = require('../../src/app/api/uboq/templates/formal-export/route');
    prisma = require('../../src/lib/prisma').prisma;
    if (!NextRequest) {
      NextRequest = require('next/server').NextRequest;
    }
  } finally {
    Module._load = originalLoad;
    originalLoad = null;
  }

  // ==========================================================================
  // CHECK 1 (IR-01): Financial Metadata Exposure Closure Across JSON, XLSX __OSERP_META, Saved Layouts & Narrowed Roles
  // ==========================================================================
  await check(
    'WP3-BB-IR-01 financial metadata exposure blocked across working JSON, XLSX __OSERP_META, and saved-layout previews for SITE_ENGINEER, narrowed SITE_ENGINEER, narrowed VIEWER, and EXTERNAL_VIEWER while preserved for authorized Finance/Commercial roles',
    async () => {
      // Create shared T6 & T7 layouts as SUPER_ADMIN containing mixed public + internal + restricted columns
      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };
      const sharedT6Create = await postLayouts({
        action: 'create',
        projectId: pHist,
        templateCode: 'T6_PROGRESS_BILLING',
        templateName: 'IR01 Shared T6 Layout',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'phase_code',
          'item_code',
          'work_description',
          'unit',
          'certified_curr_qty',
          'contract_unit_rate',
          'gross_billing',
          'net_certified_due',
        ],
      });
      assert.equal(sharedT6Create.status, 201);
      const sharedT6GroupId = (await sharedT6Create.json()).revision.layoutGroupId;

      const sharedT7Create = await postLayouts({
        action: 'create',
        projectId: pEvm,
        templateCode: 'T7_SCHEDULE_EVM',
        templateName: 'IR01 Shared T7 Layout',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: [
          'activity_id',
          'planned_start',
          'planned_finish',
          'cpm_total_float',
          'actual_progress_pct',
          'planned_value',
          'earned_value',
          'actual_cost',
        ],
      });
      assert.equal(sharedT7Create.status, 201);
      const sharedT7GroupId = (await sharedT7Create.json()).revision.layoutGroupId;

      const nonFinancialActors = [
        { label: 'SITE_ENGINEER', userId: usrSiteEng, role: 'SITE_ENGINEER', isViewerOnly: false },
        {
          label: 'NARROWED_SITE_ENGINEER',
          userId: usrNarrowedSite,
          role: 'PROJECT_MANAGER',
          isViewerOnly: false,
        },
        {
          label: 'NARROWED_VIEWER',
          userId: usrNarrowedViewer,
          role: 'PROJECT_MANAGER',
          isViewerOnly: true,
        },
        {
          label: 'EXTERNAL_VIEWER',
          userId: usrExternalViewer,
          role: 'EXTERNAL_VIEWER',
          isViewerOnly: true,
        },
      ];

      for (const nf of nonFinancialActors) {
        actor = { userId: nf.userId, role: nf.role, sessionVersion: 7 };

        // 1a. Catalog GET check: restricted fields stripped even for narrowed PROJECT_MANAGER!
        const catRes = await getWorking(`projectId=${pHist}`);
        assert.equal(catRes.status, 200);
        const catBody = await catRes.json();
        const t6Cat = catBody.templates.find((t: any) => t.code === 'T6_PROGRESS_BILLING');
        assert.ok(t6Cat);
        assert.ok(
          !t6Cat.fields.some((f: any) =>
            ['contract_unit_rate', 'gross_billing', 'net_certified_due'].includes(f.id)
          ),
          `Restricted T6 catalog field leaked to ${nf.label}`
        );

        // 1b. T6 Working JSON check
        const wT6JsonRes = await postWorking({
          projectId: pHist,
          templateCode: 'T6_PROGRESS_BILLING',
          sourceId: bilP1V1,
          format: 'json',
        });
        assert.equal(wT6JsonRes.status, 200);
        const wT6Json = await wT6JsonRes.json();
        const wT6Dump = JSON.stringify(wT6Json);
        assert.ok(!wT6Json.projection.systemMetaFields.includes('other_deductions_exact'));
        assert.ok(!wT6Json.projection.systemMetaFields.includes('tax_profile_version'));
        assert.ok(!wT6Dump.includes('other_deductions_exact'), `T6 JSON key leak for ${nf.label}`);
        assert.ok(!wT6Dump.includes('1850.00'), `T6 LD deduction value leaked to ${nf.label}`);
        assert.ok(!wT6Dump.includes('GOV_INFRA_VAT12'), `T6 tax profile leaked to ${nf.label}`);
        if (nf.isViewerOnly) {
          assert.ok(
            !wT6Json.projection.systemMetaFields.includes('snapshot_approved_qty_pre_vo'),
            `Internal T6 meta leaked to viewer ${nf.label}`
          );
        }

        // 1c. T6 Working XLSX __OSERP_META check
        const wT6XlsxRes = await postWorking({
          projectId: pHist,
          templateCode: 'T6_PROGRESS_BILLING',
          sourceId: bilP1V1,
          format: 'xlsx',
        });
        assert.equal(wT6XlsxRes.status, 200);
        const wT6XlsxMeta = await extractXlsxMetaSheetDump(
          Buffer.from(await wT6XlsxRes.arrayBuffer())
        );
        assert.ok(!wT6XlsxMeta.headers.includes('other_deductions_exact'));
        assert.ok(!wT6XlsxMeta.headers.includes('tax_profile_version'));
        assert.ok(!wT6XlsxMeta.allCellText.includes('1850.00'));
        assert.ok(!wT6XlsxMeta.allCellText.includes('GOV_INFRA_VAT12'));

        // 1d. T6 Saved-Layout Preview check
        const sPrevT6Res = await postLayouts({
          action: 'preview',
          projectId: pHist,
          sourceId: bilP1V1,
          layoutGroupId: sharedT6GroupId,
        });
        assert.equal(sPrevT6Res.status, 200);
        const sPrevT6 = await sPrevT6Res.json();
        const sPrevT6Dump = JSON.stringify(sPrevT6);
        assert.ok(!sPrevT6.projection.systemMetaFields.includes('other_deductions_exact'));
        assert.ok(!sPrevT6.projection.systemMetaFields.includes('tax_profile_version'));
        assert.ok(!sPrevT6Dump.includes('1850.00'));
        assert.ok(!sPrevT6Dump.includes('240000.00'));
        assert.ok(!sPrevT6Dump.includes('175150.00'));

        // 1e. T7 Working JSON, XLSX __OSERP_META & Saved-Layout Preview checks
        const wT7JsonRes = await postWorking({
          projectId: pEvm,
          templateCode: 'T7_SCHEDULE_EVM',
          sourceId: schedEvm,
          format: 'json',
        });
        assert.equal(wT7JsonRes.status, 200);
        const wT7Json = await wT7JsonRes.json();
        const wT7Dump = JSON.stringify(wT7Json);
        assert.ok(!wT7Json.projection.systemMetaFields.includes('bac_allocated_amount'));
        assert.ok(!wT7Dump.includes('bac_allocated_amount'), `T7 BAC key leaked to ${nf.label}`);
        assert.ok(!wT7Dump.includes('310000.00'), `T7 BAC amount leaked to ${nf.label}`);
        if (nf.isViewerOnly) {
          assert.ok(!wT7Json.projection.systemMetaFields.includes('early_start_day'));
          assert.ok(!wT7Json.projection.systemMetaFields.includes('as_of_cutoff_date'));
        } else {
          // SITE_ENGINEER retains operational schedule metadata (non-financial)
          assert.ok(wT7Json.projection.systemMetaFields.includes('as_of_cutoff_date'));
          assert.ok(wT7Json.projection.systemMetaFields.includes('progress_verification_basis'));
        }

        const wT7XlsxRes = await postWorking({
          projectId: pEvm,
          templateCode: 'T7_SCHEDULE_EVM',
          sourceId: schedEvm,
          format: 'xlsx',
        });
        assert.equal(wT7XlsxRes.status, 200);
        const wT7XlsxMeta = await extractXlsxMetaSheetDump(
          Buffer.from(await wT7XlsxRes.arrayBuffer())
        );
        assert.ok(!wT7XlsxMeta.headers.includes('bac_allocated_amount'));
        assert.ok(!wT7XlsxMeta.allCellText.includes('310000.00'));

        const sPrevT7Res = await postLayouts({
          action: 'preview',
          projectId: pEvm,
          sourceId: schedEvm,
          layoutGroupId: sharedT7GroupId,
        });
        assert.equal(sPrevT7Res.status, 200);
        const sPrevT7 = await sPrevT7Res.json();
        const sPrevT7Dump = JSON.stringify(sPrevT7);
        assert.ok(!sPrevT7.projection.systemMetaFields.includes('bac_allocated_amount'));
        assert.ok(!sPrevT7Dump.includes('310000.00'));
        assert.ok(!sPrevT7Dump.includes('155000.00'));
      }

      // 1f. Positive proof: Authorized BILLING_ENGINEER & FINANCE_DIRECTOR DO receive financial metadata across JSON, XLSX __OSERP_META & saved-layout preview
      for (const fin of [
        { userId: usrBillingEng, role: 'BILLING_ENGINEER' },
        { userId: usrFinanceDir, role: 'FINANCE_DIRECTOR' },
      ]) {
        actor = { userId: fin.userId, role: fin.role, sessionVersion: 7 };
        const finT6Res = await postWorking({
          projectId: pHist,
          templateCode: 'T6_PROGRESS_BILLING',
          sourceId: bilP1V1,
          format: 'json',
        });
        assert.equal(finT6Res.status, 200);
        const finT6 = await finT6Res.json();
        assert.ok(finT6.projection.systemMetaFields.includes('other_deductions_exact'));
        assert.ok(finT6.projection.systemMetaFields.includes('tax_profile_version'));
        assert.equal(
          finT6.projection.projectedRows[0].__oserpMeta.other_deductions_exact,
          '1850.00'
        );

        const finT6Xlsx = await postWorking({
          projectId: pHist,
          templateCode: 'T6_PROGRESS_BILLING',
          sourceId: bilP1V1,
          format: 'xlsx',
        });
        const finMetaSheet = await extractXlsxMetaSheetDump(
          Buffer.from(await finT6Xlsx.arrayBuffer())
        );
        assert.ok(finMetaSheet.headers.includes('other_deductions_exact'));
        assert.ok(finMetaSheet.allCellText.includes('1850.00'));

        const finT7Prev = await (
          await postLayouts({
            action: 'preview',
            projectId: pEvm,
            sourceId: schedEvm,
            layoutGroupId: sharedT7GroupId,
          })
        ).json();
        assert.ok(finT7Prev.projection.systemMetaFields.includes('bac_allocated_amount'));
        const certRow = finT7Prev.projection.projectedRows.find(
          (r: any) => r.visible.activity_id === 'ACT-CERT'
        );
        assert.equal(certRow.__oserpMeta.bac_allocated_amount, '310000.00');
      }

      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };
      return {
        nonFinancialRolesVerified: nonFinancialActors.map((x) => x.label),
        authorizedFinanceRolesVerified: ['BILLING_ENGINEER', 'FINANCE_DIRECTOR'],
      };
    }
  );

  // ==========================================================================
  // CHECK 2 (IR-02): Historical Billing Authority, 2-Snapshot Rate Lineage, Sequential Certificates & SQL Guards
  // ==========================================================================
  await check(
    'WP3-BB-IR-02 historical snapshot & contract-rate authority (v1 @ 6000 vs v2 @ 6500), two sequential certificates, understated previous billed overbilling & mismatch rejection, unverified/ambiguous failure closed, and Migration #29 SQL trigger guards',
    async () => {
      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };

      // (a) Historical Period 1 (2026-08-31) exported AFTER Snapshot v2 (2026-10-01 @ 6500) exists:
      // Must bind strictly to Snapshot v1 (@v1, rate 6000.00, CA-V1 600000.00) on BOTH T5 and T6!
      const fT5P1Res = await postFormal({
        projectId: pHist,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accP1V1,
        format: 'json',
      });
      assert.equal(fT5P1Res.status, 200);
      const fT5P1 = await fT5P1Res.json();
      assert.equal(fT5P1.source.sourceVersion, `${accP1V1}@v1`);
      assert.equal(fT5P1.pricingAndBillingBasis.linkedContractAuthorityId, caV1);
      assert.equal(fT5P1.projection.projectedRows[0].visible.contract_unit_rate, '6000.0000');
      assert.equal(fT5P1.totals.certifiedCurrentAmountTotal, '240000.00'); // 40 * 6000 (NOT 260000 @ 6500!)

      const fT6P1Res = await postFormal({
        projectId: pHist,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilP1V1,
        format: 'json',
      });
      assert.equal(fT6P1Res.status, 200);
      const fT6P1 = await fT6P1Res.json();
      assert.equal(fT6P1.source.sourceVersion, `${bilP1V1}@v1`);
      assert.equal(fT6P1.pricingAndBillingBasis.linkedContractAuthorityId, caV1);
      assert.equal(fT6P1.projection.projectedRows[0].visible.contract_unit_rate, '6000.0000');
      assert.equal(fT6P1.totals.certifiedCurrentAmountTotal, '240000.00');

      // (b) Sequential Period 2 (2026-10-31) certificate binds to Snapshot v2 (@v2, rate 6500.00, CA-V2 780000.00)
      // and reconciles previous=40.0000 from Period 1 + current=50.0000 -> cum=90.0000
      const fT5P2Res = await postFormal({
        projectId: pHist,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accP2V2,
        format: 'json',
      });
      assert.equal(fT5P2Res.status, 200);
      const fT5P2 = await fT5P2Res.json();
      assert.equal(fT5P2.source.sourceVersion, `${accP2V2}@v2`);
      assert.equal(fT5P2.pricingAndBillingBasis.linkedContractAuthorityId, caV2);
      assert.equal(fT5P2.projection.projectedRows[0].visible.contract_unit_rate, '6500.0000');
      assert.equal(fT5P2.projection.projectedRows[0].visible.prev_certified_qty, '40.0000');
      assert.equal(fT5P2.projection.projectedRows[0].visible.cum_certified_qty, '90.0000');
      assert.equal(fT5P2.totals.certifiedCurrentAmountTotal, '325000.00'); // 50 * 6500

      const fT6P2Res = await postFormal({
        projectId: pHist,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilP2V2,
        format: 'json',
      });
      assert.equal(fT6P2Res.status, 200);
      const fT6P2 = await fT6P2Res.json();
      assert.equal(fT6P2.source.sourceVersion, `${bilP2V2}@v2`);
      assert.equal(fT6P2.pricingAndBillingBasis.linkedContractAuthorityId, caV2);
      assert.equal(fT6P2.projection.projectedRows[0].visible.contract_unit_rate, '6500.0000');
      assert.equal(fT6P2.totals.certifiedCurrentAmountTotal, '325000.00');
      assert.equal(fT6P2.totals.priorCertifiedAmountTotal, '260000.00');

      // (c) Understated / incorrect previous billed quantity regressions:
      // C1: Understated previous=10 + current=40 (visually 50 <= 120, but authoritative prior=90 -> 90+40=130 > 120!) -> 409 OVERBILLING!
      const upOverT6Work = await postWorking({
        projectId: pHistOver,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilUnderPrevOver,
        format: 'json',
      });
      assert.equal(upOverT6Work.status, 409);
      assert.equal((await upOverT6Work.json()).error, 'TEMPLATE_OVERBILLING_CEILING_EXCEEDED');

      const upOverT6Formal = await postFormal({
        projectId: pHistOver,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilUnderPrevOver,
        format: 'json',
      });
      assert.equal(upOverT6Formal.status, 409);
      assert.equal((await upOverT6Formal.json()).error, 'FORMAL_OVERBILLING_CEILING_EXCEEDED');

      const upOverT5Formal = await postFormal({
        projectId: pHistOver,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accUnderPrevOver,
        format: 'json',
      });
      assert.equal(upOverT5Formal.status, 409);
      assert.equal((await upOverT5Formal.json()).error, 'FORMAL_OVERBILLING_CEILING_EXCEEDED');

      // C2: Incorrect carried-forward previous=20 (authoritative prior=110) with current=5 (within 120 ceiling) -> 409 RECONCILIATION_MISMATCH!
      const badPrevT6Formal = await postFormal({
        projectId: pHist,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilBadPrev,
        format: 'json',
      });
      assert.equal(badPrevT6Formal.status, 409);
      assert.equal(
        (await badPrevT6Formal.json()).error,
        'FORMAL_PREVIOUS_BILLING_RECONCILIATION_MISMATCH'
      );

      const badPrevT5Formal = await postFormal({
        projectId: pHist,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accBadPrev,
        format: 'json',
      });
      assert.equal(badPrevT5Formal.status, 409);
      assert.equal(
        (await badPrevT5Formal.json()).error,
        'FORMAL_PREVIOUS_BILLING_RECONCILIATION_MISMATCH'
      );

      // (d) Post-dated / unverified / ambiguous / mismatched baseline failures (fail closed 409):
      const preSnapT5 = await postFormal({
        projectId: pNegPreSnap,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accPreSnap,
        format: 'json',
      });
      assert.equal(preSnapT5.status, 409);
      assert.equal((await preSnapT5.json()).error, 'FORMAL_HISTORICAL_SNAPSHOT_NOT_FOUND');

      const preSnapT6 = await postFormal({
        projectId: pNegPreSnap,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilPreSnap,
        format: 'json',
      });
      assert.equal(preSnapT6.status, 409);
      assert.equal((await preSnapT6.json()).error, 'FORMAL_HISTORICAL_SNAPSHOT_NOT_FOUND');

      const unlinkedT5 = await postFormal({
        projectId: pUnlinked,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accUnlinked,
        format: 'json',
      });
      assert.equal(unlinkedT5.status, 409);
      assert.equal((await unlinkedT5.json()).error, 'FORMAL_CONTRACT_RATE_ASSOCIATION_UNVERIFIED');

      const unlinkedT6 = await postFormal({
        projectId: pUnlinked,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilUnlinked,
        format: 'json',
      });
      assert.equal(unlinkedT6.status, 409);
      assert.equal((await unlinkedT6.json()).error, 'FORMAL_CONTRACT_RATE_ASSOCIATION_UNVERIFIED');

      const badHdrT6 = await postFormal({
        projectId: pNegHdr,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilBadHeaderAmt,
        format: 'json',
      });
      assert.equal(badHdrT6.status, 409);
      assert.equal((await badHdrT6.json()).error, 'FORMAL_CONTRACT_RATE_ASSOCIATION_UNVERIFIED');

      const ambigT5 = await postFormal({
        projectId: pAmbig,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accAmbig,
        format: 'json',
      });
      assert.equal(ambigT5.status, 409);
      assert.equal((await ambigT5.json()).error, 'FORMAL_HISTORICAL_SNAPSHOT_AMBIGUOUS');

      const ambigT6 = await postFormal({
        projectId: pAmbig,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilAmbig,
        format: 'json',
      });
      assert.equal(ambigT6.status, 409);
      assert.equal((await ambigT6.json()).error, 'FORMAL_HISTORICAL_SNAPSHOT_AMBIGUOUS');

      // Migration #29 direct SQL trigger guards via restricted role (oserp_compat_app)
      // SQL Guard 1: Forging Period 1 billing (2026-08-31) against post-dated @v2 (approved 2026-10-01) -> P0001 POSTDATED
      await withSignedRestrictedTx(pHist, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T6_PROGRESS_BILLING','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T6_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [prefix + '-AUD-POST', pHist, s.f.ids.a, bilP1V1, `${bilP1V1}@v2`, 'a'.repeat(64)]
            ),
          (err: any) =>
            err.code === 'P0001' &&
            /UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_POSTDATED/.test(err.message)
        );
      });

      // SQL Guard 2: Forging Period 2 billing (2026-10-31) against already-superseded @v1 -> P0001 SUPERSEDED
      await withSignedRestrictedTx(pHist, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T6_PROGRESS_BILLING','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T6_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [prefix + '-AUD-SUP', pHist, s.f.ids.a, bilP2V2, `${bilP2V2}@v1`, 'b'.repeat(64)]
            ),
          (err: any) =>
            err.code === 'P0001' &&
            /UBOQ_TEMPLATE_AUDIT_HISTORICAL_SNAPSHOT_SUPERSEDED/.test(err.message)
        );
      });

      // SQL Guard 3: Forging formal export on unlinked snapshot (contractAuthorityId IS NULL) -> P0001 UNVERIFIED
      await withSignedRestrictedTx(pUnlinked, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T6_PROGRESS_BILLING','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T6_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [
                prefix + '-AUD-UNL',
                pUnlinked,
                s.f.ids.a,
                bilUnlinked,
                `${bilUnlinked}@v1`,
                'c'.repeat(64),
              ]
            ),
          (err: any) =>
            err.code === 'P0001' &&
            /UBOQ_TEMPLATE_AUDIT_CONTRACT_RATE_ASSOCIATION_UNVERIFIED/.test(err.message)
        );
      });

      return {
        period1SnapshotVersion: fT6P1.source.sourceVersion,
        period1UnitRate: '6000.0000',
        period1CertifiedTotal: '240000.00',
        period2SnapshotVersion: fT6P2.source.sourceVersion,
        period2UnitRate: '6500.0000',
        period2CertifiedTotal: '325000.00',
      };
    }
  );

  // ==========================================================================
  // CHECK 3 (IR-03): Inspection Quantity Integrity (<, ==, > Claim) & Multi-Inspection Deduplication
  // ==========================================================================
  await check(
    'WP3-BB-IR-03 inspection quantity below claim rejected (409 + SQL P0001), equal to claim accepted (200), exceeding claim accepted & capped at approved claim (200), distinct multi-lot inspections summed without double counting (200), and duplicate/blank multi-inspection linkage rejected (409 + SQL P0001)',
    async () => {
      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };

      // 1. Inspection approvedQuantity (20) < certified claim (30) -> 409 on working & formal + P0001 on SQL
      const ltWork = await postWorking({
        projectId: pNegInspLt,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accInspBelow,
        format: 'json',
      });
      assert.equal(ltWork.status, 409);
      assert.equal((await ltWork.json()).error, 'TEMPLATE_INSPECTION_QUANTITY_INSUFFICIENT');

      const ltFormal = await postFormal({
        projectId: pNegInspLt,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accInspBelow,
        format: 'json',
      });
      assert.equal(ltFormal.status, 409);
      assert.equal((await ltFormal.json()).error, 'FORMAL_INSPECTION_QUANTITY_INSUFFICIENT');

      await withSignedRestrictedTx(pNegInspLt, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T5_ACCOMPLISHMENT_CERT','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T5_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [
                prefix + '-AUD-ILT',
                pNegInspLt,
                s.f.ids.a,
                accInspBelow,
                `${accInspBelow}@v1`,
                'd'.repeat(64),
              ]
            ),
          (err: any) =>
            err.code === 'P0001' &&
            /UBOQ_TEMPLATE_AUDIT_INSPECTION_QTY_INSUFFICIENT/.test(err.message)
        );
      });

      // 2. Inspection approvedQuantity (40) == certified claim (40) -> 200 OK (already proven on accP1V1, verify row fields)
      const eqWork = await (
        await postWorking({
          projectId: pHist,
          templateCode: 'T5_ACCOMPLISHMENT_CERT',
          sourceId: accP1V1,
          format: 'json',
        })
      ).json();
      assert.equal(eqWork.projection.projectedRows[0].visible.certified_curr_qty, '40.0000');

      // 3. Inspection approvedQuantity (28, verified 32) > certified claim (10) -> 200 OK, certified_curr_qty strictly capped at 10.0000!
      const gtFormalRes = await postFormal({
        projectId: pHist,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accInspExceed,
        format: 'json',
      });
      assert.equal(gtFormalRes.status, 200);
      const gtFormal = await gtFormalRes.json();
      const gtRow = gtFormal.projection.projectedRows[0];
      assert.equal(gtRow.visible.current_measured_qty, '32.0000');
      assert.equal(gtRow.visible.certified_curr_qty, '10.0000'); // Capped at 10, NOT 28 or 32!
      assert.equal(gtFormal.totals.certifiedCurrentAmountTotal, '65000.00'); // 10 * 6500

      // 4. Multiple approved inspections with DISTINCT lot/scope linkage (4 + 6 = 10 == 10 claim) -> 200 OK
      const mulOkRes = await postFormal({
        projectId: pHist,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accMultiValid,
        format: 'json',
      });
      assert.equal(mulOkRes.status, 200);
      const mulOk = await mulOkRes.json();
      assert.equal(mulOk.projection.projectedRows[0].visible.certified_curr_qty, '10.0000');
      assert.equal(mulOk.totals.certifiedCurrentAmountTotal, '65000.00');
      assert.ok(
        String(mulOk.projection.projectedRows[0].__oserpMeta.inspection_id).includes(','),
        'Expected joined distinct inspection IDs in lineage metadata'
      );

      // 5. Multiple approved inspections with DUPLICATE lot key ('LOT-DUP-POUR-A' vs 'lot-dup-pour-a') -> 409 + SQL P0001
      const mulDupFormal = await postFormal({
        projectId: pNegMulDup,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accMultiDupLot,
        format: 'json',
      });
      assert.equal(mulDupFormal.status, 409);
      assert.equal((await mulDupFormal.json()).error, 'FORMAL_DUPLICATE_INSPECTION_LINKAGE');

      await withSignedRestrictedTx(pNegMulDup, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T5_ACCOMPLISHMENT_CERT','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T5_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [
                prefix + '-AUD-MDUP',
                pNegMulDup,
                s.f.ids.a,
                accMultiDupLot,
                `${accMultiDupLot}@v1`,
                'e'.repeat(64),
              ]
            ),
          (err: any) =>
            err.code === 'P0001' &&
            /UBOQ_TEMPLATE_AUDIT_DUPLICATE_INSPECTION_LINKAGE/.test(err.message)
        );
      });

      // 6. Multiple approved inspections with BLANK lot/scope linkage -> 409 + SQL P0001
      const mulBlkFormal = await postFormal({
        projectId: pNegMulBlk,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accMultiBlank,
        format: 'json',
      });
      assert.equal(mulBlkFormal.status, 409);
      assert.equal((await mulBlkFormal.json()).error, 'FORMAL_DUPLICATE_INSPECTION_LINKAGE');

      await withSignedRestrictedTx(pNegMulBlk, s.f.ids.a, 7, async () => {
        await assert.rejects(
          () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event($1,$2,NULL,NULL,1,NULL,'SYSTEM_FORMAL_PRESET','T5_ACCOMPLISHMENT_CERT','FORMAL_EXPORT_GENERATED',$3,'SUPER_ADMIN',$4,$5,'ERP_CANONICAL_T5_FORMAL_V1','json',$6,'{}'::jsonb)`,
              [
                prefix + '-AUD-MBLK',
                pNegMulBlk,
                s.f.ids.a,
                accMultiBlank,
                `${accMultiBlank}@v1`,
                'f'.repeat(64),
              ]
            ),
          (err: any) =>
            err.code === 'P0001' &&
            /UBOQ_TEMPLATE_AUDIT_DUPLICATE_INSPECTION_LINKAGE/.test(err.message)
        );
      });

      return {
        belowClaimStatus: 409,
        equalClaimCertifiedQty: '40.0000',
        exceedingClaimCappedQty: '10.0000',
        multiDistinctLotCertifiedQty: '10.0000',
        duplicateMultiLotStatus: 409,
        blankMultiLotStatus: 409,
      };
    }
  );

  // ==========================================================================
  // CHECK 4 (IR-04): T7 EVM Unified As-Of Cutoff, Future/Unrelated Exclusions & Certified vs Self-Reported Separation
  // ==========================================================================
  await check(
    'WP3-BB-IR-04 T7_SCHEDULE_EVM unified reporting cutoff (2026-09-15) across PV/EV/AC, exclusion of future-dated & unrelated/indirect progress and cost records, and strict separation of certified accomplishment vs unverified self-reported %',
    async () => {
      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };
      const res = await postWorking({
        projectId: pEvm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedEvm,
        format: 'json',
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.rowCount, 3);

      const rCert = body.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-CERT'
      );
      const rSelf = body.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-SELF'
      );
      const rFut = body.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-FUTURE'
      );
      assert.ok(rCert && rSelf && rFut);

      // 1. Unified as-of cutoff is strictly 2026-09-15 across all rows (NOT shifted to 2026-09-22 self-report or 2099-01-15 future SWA!)
      assert.equal(rCert.__oserpMeta.as_of_cutoff_date, '2026-09-15');
      assert.equal(rSelf.__oserpMeta.as_of_cutoff_date, '2026-09-15');
      assert.equal(rFut.__oserpMeta.as_of_cutoff_date, '2026-09-15');

      // 2. ACT-CERT (2026-09-05..2026-09-25, BAC=310000.00):
      // - PV as of 2026-09-15 = 50% = 155000.00
      // - EV as of 2026-09-15 = 50% certified SWA = 155000.00 (95% self-reported on Sep 22 & 100% future SWA on 2099-01-15 EXCLUDED!)
      // - AC as of 2026-09-15 = 124000.00 ONLY (45000 Sep 20 post-cutoff, 70000 2099 future, 30000 INDIRECT, and 25000 unrelated BOQ ALL EXCLUDED!)
      assert.equal(rCert.visible.planned_progress_pct, '50.0000');
      assert.equal(rCert.visible.actual_progress_pct, '50.0000');
      assert.equal(rCert.visible.planned_value, '155000.00');
      assert.equal(rCert.visible.earned_value, '155000.00');
      assert.equal(rCert.visible.actual_cost, '124000.00');
      assert.equal(rCert.visible.spi, '1.0000');
      assert.equal(rCert.visible.cpi, '1.2500');
      assert.equal(
        rCert.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_LINKED_UPDATE'
      );

      // 3. ACT-SELF (2026-09-01..2026-09-15, BAC=100000.00, 80% unverified self-reported ONLY):
      // - PV as of 2026-09-15 = 100% = 100000.00
      // - Unverified self-reported 80% is explicitly excluded from EV (actual_progress_pct = 0.0000, earned_value = 0.00, spi = 0.0000)
      //   and classified in metadata (UNVERIFIED_SELF_REPORTED_EXCLUDED_FROM_EV, self_reported_progress_pct = 80.0000)!
      assert.equal(rSelf.visible.planned_progress_pct, '100.0000');
      assert.equal(rSelf.visible.planned_value, '100000.00');
      assert.equal(rSelf.visible.actual_progress_pct, '0.0000');
      assert.equal(rSelf.visible.earned_value, '0.00');
      assert.equal(rSelf.visible.spi, '0.0000');
      assert.equal(
        rSelf.__oserpMeta.progress_verification_basis,
        'UNVERIFIED_SELF_REPORTED_EXCLUDED_FROM_EV'
      );
      assert.equal(rSelf.__oserpMeta.self_reported_progress_pct, '80.0000');

      // 4. ACT-FUTURE (2026-10-05..2026-10-20, starting AFTER 2026-09-15 cutoff):
      // - PV = 0.00, EV = 0.00, AC = 0.00 (future 2099 self-reported update ignored!)
      assert.equal(rFut.visible.planned_progress_pct, '0.0000');
      assert.equal(rFut.visible.actual_progress_pct, '0.0000');
      assert.equal(rFut.visible.planned_value, '0.00');
      assert.equal(rFut.visible.earned_value, '0.00');
      assert.equal(rFut.visible.actual_cost, '0.00');
      assert.equal(rFut.visible.spi, null);
      assert.equal(rFut.visible.cpi, null);

      // Summary EV total = 155000.00 + 0.00 + 0.00 = 155000.00
      assert.equal(body.summaryTotal.amount, '155000.00');

      return {
        unifiedAsOfCutoffDate: '2026-09-15',
        actCertPvEvAc: ['155000.00', '155000.00', '124000.00'],
        actSelfEv: '0.00',
        actSelfReportedMetaPct: '80.0000',
        actFuturePvEvAc: ['0.00', '0.00', '0.00'],
      };
    }
  );

  // ==========================================================================
  // CHECK 5 (IR2-01): Non-Skipping Prior Approved Certificate Reconciliation (T5 & T6)
  // ==========================================================================
  await check(
    'WP3-BB-IR2-01 invalid earlier approved accomplishments and billings never silently disappear from cumulative reconciliation (409 unresolved prior & over-ceiling enforcement, audit-safe non-financial diagnostics, valid multi-certificate continuity, and cross-project isolation)',
    async () => {
      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };

      // 1a. Earlier approved billing with mismatched previousQuantityBilled (bilIr2Mis2: prev=10 != 40) followed by bilIr2Mis3 (prev=40, curr=20):
      // Would pass if bilIr2Mis2 were silently skipped; MUST fail 409 on both working and formal!
      const misWork = await postWorking({
        projectId: pIr2BilMis,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilIr2Mis3,
        format: 'json',
      });
      assert.equal(misWork.status, 409);
      const misWorkBody = await misWork.json();
      assert.equal(misWorkBody.error, 'TEMPLATE_PRIOR_CERTIFICATE_UNRESOLVED');
      assert.ok(!JSON.stringify(misWorkBody).includes('6000'));

      const misFormal = await postFormal({
        projectId: pIr2BilMis,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilIr2Mis3,
        format: 'json',
      });
      assert.equal(misFormal.status, 409);
      const misFormalBody = await misFormal.json();
      assert.equal(misFormalBody.error, 'FORMAL_PRIOR_CERTIFICATE_UNRESOLVED');
      assert.equal(misFormalBody.detail.unresolvedPriorIssues[0].priorBillingId, bilIr2Mis2);
      assert.equal(
        misFormalBody.detail.unresolvedPriorIssues[0].reason,
        'PRIOR_BILLING_HISTORY_MISMATCH'
      );
      // Verify audit-safe non-financial diagnostic payload (zero unit rates or currency amounts leaked)
      const misFormalDump = JSON.stringify(misFormalBody);
      assert.ok(!misFormalDump.includes('6000'), 'Unit rate leaked in 409 reconciliation detail');
      assert.ok(!misFormalDump.includes('240000'), 'Billing amount leaked in 409 detail');
      assert.ok(!misFormalDump.includes('180000'), 'Prior billing amount leaked in 409 detail');

      // 1b. Earlier approved billing with mismatched previousQuantityBilled (bilIr2MisOv2: prev=10 != 40, curr=50 -> true cum=90)
      // followed by bilIr2MisOv3 (prev=40, curr=40): skipping bilIr2MisOv2 would give 40+40=80 <= 120 (PASS), whereas retaining gives 90+40=130 > 120 -> 409 OVERBILLING!
      const misOvWork = await postWorking({
        projectId: pIr2BilMisOver,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilIr2MisOv3,
        format: 'json',
      });
      assert.equal(misOvWork.status, 409);
      assert.equal((await misOvWork.json()).error, 'TEMPLATE_OVERBILLING_CEILING_EXCEEDED');

      const misOvFormal = await postFormal({
        projectId: pIr2BilMisOver,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilIr2MisOv3,
        format: 'json',
      });
      assert.equal(misOvFormal.status, 409);
      assert.equal((await misOvFormal.json()).error, 'FORMAL_OVERBILLING_CEILING_EXCEEDED');

      // 2a. Earlier approved billing with over-ceiling quantity (bilIr2Ov1a: 110 > 100) followed by bilIr2Ov1b on same BOQ -> 409 OVERBILLING!
      const ov1Formal = await postFormal({
        projectId: pIr2BilOver1,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilIr2Ov1b,
        format: 'json',
      });
      assert.equal(ov1Formal.status, 409);
      assert.equal((await ov1Formal.json()).error, 'FORMAL_OVERBILLING_CEILING_EXCEEDED');

      // 2b. Earlier approved billing with over-ceiling quantity on BOQ-A (bilIr2Ov2a: 110 > 100) followed by bilIr2Ov2b billing ONLY BOQ-B (0->10 <= 100):
      // Cannot skip over-ceiling prior even when current bill touches a different BOQ item!
      const ov2Work = await postWorking({
        projectId: pIr2BilOver2,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilIr2Ov2b,
        format: 'json',
      });
      assert.equal(ov2Work.status, 409);
      assert.equal((await ov2Work.json()).error, 'TEMPLATE_PRIOR_CERTIFICATE_UNRESOLVED');

      const ov2Formal = await postFormal({
        projectId: pIr2BilOver2,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilIr2Ov2b,
        format: 'json',
      });
      assert.equal(ov2Formal.status, 409);
      const ov2FormalBody = await ov2Formal.json();
      assert.equal(ov2FormalBody.error, 'FORMAL_PRIOR_CERTIFICATE_UNRESOLVED');
      assert.equal(ov2FormalBody.detail.unresolvedPriorIssues[0].priorBillingId, bilIr2Ov2a);
      assert.equal(
        ov2FormalBody.detail.unresolvedPriorIssues[0].reason,
        'PRIOR_BILLING_OVER_CEILING'
      );

      // 3a. Earlier approved accomplishment with insufficient inspection (accIr2Ins1: insp 50 < claim 80) followed by valid accIr2Ins2 (80->100) -> 409 UNRESOLVED!
      const insWork = await postWorking({
        projectId: pIr2AccIns,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accIr2Ins2,
        format: 'json',
      });
      assert.equal(insWork.status, 409);
      assert.equal((await insWork.json()).error, 'TEMPLATE_PRIOR_CERTIFICATE_UNRESOLVED');

      const insFormal = await postFormal({
        projectId: pIr2AccIns,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accIr2Ins2,
        format: 'json',
      });
      assert.equal(insFormal.status, 409);
      const insFormalBody = await insFormal.json();
      assert.equal(insFormalBody.error, 'FORMAL_PRIOR_CERTIFICATE_UNRESOLVED');
      assert.equal(insFormalBody.detail.unresolvedPriorIssues[0].priorAccomplishmentId, accIr2Ins1);
      assert.equal(
        insFormalBody.detail.unresolvedPriorIssues[0].reason,
        'TEMPLATE_INSPECTION_QUANTITY_INSUFFICIENT'
      );

      // 3b. Earlier approved accomplishment with insufficient inspection (accIr2InsOv1: 80 claimed, 50 inspected) followed by accIr2InsOv2 (prev=0, claim=50):
      // Silently dropping accIr2InsOv1 would allow 0+50=50 <= 120 to pass; retaining 80 pushes 80+50=130 > 120 -> 409 OVERBILLING!
      const insOvWork = await postWorking({
        projectId: pIr2AccInsOver,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accIr2InsOv2,
        format: 'json',
      });
      assert.equal(insOvWork.status, 409);
      assert.equal((await insOvWork.json()).error, 'TEMPLATE_OVERBILLING_CEILING_EXCEEDED');

      const insOvFormal = await postFormal({
        projectId: pIr2AccInsOver,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accIr2InsOv2,
        format: 'json',
      });
      assert.equal(insOvFormal.status, 409);
      assert.equal((await insOvFormal.json()).error, 'FORMAL_OVERBILLING_CEILING_EXCEEDED');

      // 3c. Earlier approved accomplishment with broken history (accIr2Brk2: prev=5 != 40) followed by accIr2Brk3 (prev=40, claim=20) -> 409 UNRESOLVED!
      const brkFormal = await postFormal({
        projectId: pIr2AccBrk,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accIr2Brk3,
        format: 'json',
      });
      assert.equal(brkFormal.status, 409);
      const brkFormalBody = await brkFormal.json();
      assert.equal(brkFormalBody.error, 'FORMAL_PRIOR_CERTIFICATE_UNRESOLVED');
      assert.equal(brkFormalBody.detail.unresolvedPriorIssues[0].priorAccomplishmentId, accIr2Brk2);
      assert.equal(
        brkFormalBody.detail.unresolvedPriorIssues[0].reason,
        'PRIOR_ACCOMPLISHMENT_HISTORY_MISMATCH'
      );

      // 4 & 5. Positive proof: Valid multi-certificate sequences on pHist (3 sequential billings & 4 sequential accomplishments)
      // continue to reconcile cleanly (200 OK) while all 7 broken projects exist concurrently in the database!
      const p3BilRes = await postFormal({
        projectId: pHist,
        templateCode: 'T6_PROGRESS_BILLING',
        sourceId: bilP3V2,
        format: 'json',
      });
      assert.equal(p3BilRes.status, 200);
      const p3Bil = await p3BilRes.json();
      assert.equal(p3Bil.projection.projectedRows[0].visible.certified_curr_qty, '20.0000');
      assert.equal(p3Bil.totals.priorCertifiedAmountTotal, '585000.00'); // 90 * 6500
      assert.equal(p3Bil.totals.certifiedCurrentAmountTotal, '130000.00'); // 20 * 6500

      const p4AccRes = await postFormal({
        projectId: pHist,
        templateCode: 'T5_ACCOMPLISHMENT_CERT',
        sourceId: accMultiValid,
        format: 'json',
      });
      assert.equal(p4AccRes.status, 200);
      const p4Acc = await p4AccRes.json();
      assert.equal(p4Acc.projection.projectedRows[0].visible.prev_certified_qty, '100.0000');
      assert.equal(p4Acc.projection.projectedRows[0].visible.certified_curr_qty, '10.0000');
      assert.equal(p4Acc.projection.projectedRows[0].visible.cum_certified_qty, '110.0000');
      assert.equal(p4Acc.totals.certifiedCurrentAmountTotal, '65000.00');

      return {
        mismatchedPriorBillingStatus: 409,
        mismatchedPriorBillingOverCeilingStatus: 409,
        overCeilingPriorBillingCrossBoqStatus: 409,
        insufficientInspectionPriorAccStatus: 409,
        insufficientInspectionPriorAccOverCeilingStatus: 409,
        brokenHistoryPriorAccStatus: 409,
        validSequential3rdBillingTotal: '130000.00',
        validSequential4thAccCumQty: '110.0000',
      };
    }
  );

  // ==========================================================================
  // CHECK 6 (IR2-02): EVM Activity-Specific Certification, Verified Quantity Cap & Out-of-Schedule Cutoff Isolation
  // ==========================================================================
  await check(
    'WP3-BB-IR2-02 T7_SCHEDULE_EVM rejects cross-activity & unlinked accomplishment claims (EV=0), caps 100% progress claims at 10% verified certified BOQ quantity, preserves valid activity-specific EV, and prevents out-of-schedule/future approvals from shifting PV/EV/AC cutoff',
    async () => {
      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };
      const res = await postWorking({
        projectId: pIr2Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr2Evm,
        format: 'json',
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.rowCount, 4);

      const rGood = body.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-GOOD'
      );
      const rCross = body.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-CROSS'
      );
      const rCap10 = body.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-CAP10'
      );
      const rUnl = body.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-UNLINKED'
      );
      assert.ok(rGood && rCross && rCap10 && rUnl);

      // 1. Out-of-schedule approval (accIr2OffSched on 2026-09-25 <= wall clock), cross-activity update (IR2-SPU3 on 2026-09-24),
      //    and future SWA (accIr2Future on 2099-01-15) MUST NOT shift unified cutoff away from 2026-09-15!
      for (const r of [rGood, rCross, rCap10, rUnl]) {
        assert.equal(r.__oserpMeta.as_of_cutoff_date, '2026-09-15');
      }

      // 2. ACT-GOOD: valid activity-specific certified quantity (40/100 = 40%, BAC=150000, PV@50%=75000, EV@40%=60000, AC<=Sep15=50000):
      //    Post-cutoff Sep 20 direct cost (30,000) is strictly excluded because cutoff remained 2026-09-15!
      assert.equal(rGood.visible.planned_progress_pct, '50.0000');
      assert.equal(rGood.visible.planned_value, '75000.00');
      assert.equal(rGood.visible.actual_progress_pct, '40.0000');
      assert.equal(rGood.visible.earned_value, '60000.00');
      assert.equal(rGood.visible.actual_cost, '50000.00');
      assert.equal(rGood.visible.spi, '0.8000');
      assert.equal(rGood.visible.cpi, '1.2000');
      assert.equal(
        rGood.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_LINKED_UPDATE'
      );

      // 3. ACT-CROSS: references accIr2Good (valid for ACT-GOOD ONLY) and claims 100% -> EV MUST be 0.00!
      assert.equal(rCross.visible.actual_progress_pct, '0.0000');
      assert.equal(rCross.visible.earned_value, '0.00');
      assert.equal(rCross.visible.spi, '0.0000');
      assert.equal(
        rCross.__oserpMeta.progress_verification_basis,
        'UNVERIFIED_UNRELATED_ACCOMPLISHMENT_EXCLUDED_FROM_EV'
      );
      assert.equal(rCross.__oserpMeta.self_reported_progress_pct, '100.0000');

      // 4. ACT-CAP10: 10% certified inspected BOQ quantity (10/100 m3) vs 100% progressPercent -> EV strictly capped at 10% (20,000.00 of 200,000.00)!
      assert.equal(rCap10.visible.actual_progress_pct, '10.0000');
      assert.equal(rCap10.visible.earned_value, '20000.00');
      assert.equal(rCap10.visible.spi, '0.2000');
      assert.equal(
        rCap10.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_CAPPED_BY_VERIFIED_BOQ_QTY'
      );
      assert.equal(rCap10.__oserpMeta.self_reported_progress_pct, '100.0000');

      // 5. ACT-UNLINKED: no BOQ linkage, claims 100% referencing accIr2Good -> fails closed EV = 0.00!
      assert.equal(rUnl.visible.actual_progress_pct, '0.0000');
      assert.equal(rUnl.visible.earned_value, '0.00');
      assert.equal(
        rUnl.__oserpMeta.progress_verification_basis,
        'UNVERIFIED_NO_ACTIVITY_BOQ_LINKAGE_EXCLUDED_FROM_EV'
      );
      assert.equal(rUnl.__oserpMeta.self_reported_progress_pct, '100.0000');

      // Summary EV total = 60,000.00 + 0.00 + 20,000.00 + 0.00 = 80,000.00
      assert.equal(body.summaryTotal.amount, '80000.00');

      return {
        unifiedAsOfCutoffDate: '2026-09-15',
        actGoodEv: '60000.00',
        actGoodAc: '50000.00',
        actCrossClaim100Ev: '0.00',
        actCap10Claim100Pct: '10.0000',
        actCap10Claim100Ev: '20000.00',
        actUnlinkedClaim100Ev: '0.00',
        scheduleTotalEv: '80000.00',
      };
    }
  );

  // ==========================================================================
  // CHECK 7 (IR3-01): Shared Per-BOQ Certified-Quantity Budget & Multi-Snapshot / Mixed-Link Deduplication
  // ==========================================================================
  await check(
    'WP3-BB-IR3-01 T7_SCHEDULE_EVM enforces one authoritative per-BOQ certified quantity budget across UboqScheduleActivityLink & ScheduleBOQAllocation and across multiple approved snapshot versions, fails closed (409) on irreconcilable overlapping mappings, and preserves legitimate split & distinct BOQ EV',
    async () => {
      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };

      // TEST A1: Mixed link representations within contractual ceiling (20-unit BOQ w/ 10 certified units):
      // ACT-MIX-ULNK (10 units via UboqScheduleActivityLink) + ACT-MIX-ALLOC (10 units via ScheduleBOQAllocation) both claiming 100%
      // MUST share the single 10-unit certified budget -> 5.0000 units (50.0000%, EV=5000.00) each = 10.0000 units (10000.00) total, NEVER 20 units (20000.00)!
      const mixSplitRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3MixSplit,
        format: 'json',
      });
      assert.equal(mixSplitRes.status, 200);
      const mixSplit = await mixSplitRes.json();
      assert.equal(mixSplit.rowCount, 2);
      const rMixU = mixSplit.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-MIX-ULNK'
      );
      const rMixA = mixSplit.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-MIX-ALLOC'
      );
      assert.ok(rMixU && rMixA);
      assert.equal(rMixU.visible.actual_progress_pct, '50.0000');
      assert.equal(rMixU.visible.earned_value, '5000.00');
      assert.equal(
        rMixU.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_CAPPED_BY_VERIFIED_BOQ_QTY'
      );
      assert.equal(rMixA.visible.actual_progress_pct, '50.0000');
      assert.equal(rMixA.visible.earned_value, '5000.00');
      assert.equal(
        rMixA.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_CAPPED_BY_VERIFIED_BOQ_QTY'
      );
      assert.equal(mixSplit.summaryTotal.amount, '10000.00');

      // TEST A2 (Exact conditional_repro): One 10-unit BOQ w/ 10 certified units mapped 10 units via UboqScheduleActivityLink AND 10 units via ScheduleBOQAllocation (20 > 10 ceiling):
      // Fails closed with HTTP 409 TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING across both working export and saved-layout preview!
      const mixOverRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3MixOver,
        format: 'json',
      });
      assert.equal(mixOverRes.status, 409);
      assert.equal((await mixOverRes.json()).error, 'TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING');

      const ir3LayoutCreate = await postLayouts({
        action: 'create',
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        templateName: 'IR3 Overlap Preview Guard Layout',
        sharingScope: 'PROJECT_SHARED',
        selectedFields: ['activity_id', 'actual_progress_pct', 'earned_value'],
      });
      assert.equal(ir3LayoutCreate.status, 201);
      const ir3LayoutGroupId = (await ir3LayoutCreate.json()).revision.layoutGroupId;

      const mixOverPreview = await postLayouts({
        action: 'preview',
        projectId: pIr3Evm,
        layoutGroupId: ir3LayoutGroupId,
        sourceId: schedIr3MixOver,
      });
      assert.equal(mixOverPreview.status, 409);
      assert.equal((await mixOverPreview.json()).error, 'LAYOUT_OVERLAPPING_EVM_BOQ_MAPPING');

      // TEST A3: Intra-activity conflicting dual link representations (10 m3 via PhaseLine vs 6 m3 via BOQAllocation) -> fails closed 409!
      const intraConfRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3IntraConf,
        format: 'json',
      });
      assert.equal(intraConfRes.status, 409);
      assert.equal((await intraConfRes.json()).error, 'TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING');

      // TEST B1: Same 20-unit BOQ w/ 10 certified units referenced by two approved snapshot versions (v1 SUPERSEDED + v2 APPROVED), 10 m3 each @ 100% claim:
      // Second snapshot MUST NOT replenish certified pool -> 5.0000 units (50.0000%, EV=7500.00) each = 10.0000 units (15000.00) total!
      const snapSplitRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3SnapSplit,
        format: 'json',
      });
      assert.equal(snapSplitRes.status, 200);
      const snapSplit = await snapSplitRes.json();
      assert.equal(snapSplit.rowCount, 2);
      const rSnV1 = snapSplit.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-SNAP-V1'
      );
      const rSnV2 = snapSplit.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-SNAP-V2'
      );
      assert.ok(rSnV1 && rSnV2);
      assert.equal(rSnV1.visible.actual_progress_pct, '50.0000');
      assert.equal(rSnV1.visible.earned_value, '7500.00');
      assert.equal(rSnV2.visible.actual_progress_pct, '50.0000');
      assert.equal(rSnV2.visible.earned_value, '7500.00');
      assert.equal(snapSplit.summaryTotal.amount, '15000.00');

      // TEST B2: Same 10-unit BOQ w/ 10 certified units mapped 10 via v1 + 10 via v2 (20 > 10 ceiling) -> fails closed 409!
      const snapOverRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3SnapOver,
        format: 'json',
      });
      assert.equal(snapOverRes.status, 409);
      assert.equal((await snapOverRes.json()).error, 'TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING');

      // TEST C: Legitimate split allocations (60 @ 50%=30 + 40 @ 75%=30 on 100-unit BOQ w/ 60 certified) + distinct BOQ (50 @ 50%=25 on 50-unit BOQ w/ 25 certified)
      const legitRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3LegitSplit,
        format: 'json',
      });
      assert.equal(legitRes.status, 200);
      const legit = await legitRes.json();
      assert.equal(legit.rowCount, 3);
      const rLegA1 = legit.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-SPLIT-A1'
      );
      const rLegA2 = legit.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-SPLIT-A2'
      );
      const rLegB1 = legit.projection.projectedRows.find(
        (r: any) => r.visible.activity_id === 'ACT-DIST-B1'
      );
      assert.ok(rLegA1 && rLegA2 && rLegB1);
      assert.equal(rLegA1.visible.actual_progress_pct, '50.0000');
      assert.equal(rLegA1.visible.earned_value, '30000.00');
      assert.equal(
        rLegA1.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_LINKED_UPDATE'
      );
      assert.equal(rLegA2.visible.actual_progress_pct, '75.0000');
      assert.equal(rLegA2.visible.earned_value, '30000.00');
      assert.equal(
        rLegA2.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_LINKED_UPDATE'
      );
      assert.equal(rLegB1.visible.actual_progress_pct, '50.0000');
      assert.equal(rLegB1.visible.earned_value, '50000.00');
      assert.equal(
        rLegB1.__oserpMeta.progress_verification_basis,
        'CERTIFIED_ACCOMPLISHMENT_LINKED_UPDATE'
      );
      assert.equal(legit.summaryTotal.amount, '110000.00');

      // TEST D: Cross-project isolation + non-financial SITE_ENGINEER financial stripping on deduplicated T7 schedule
      // D1: Unassigned PM from another project blocked (403)
      actor = { userId: s.f.ids.pm, role: 'PROJECT_MANAGER', sessionVersion: 7 };
      const crossProjRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3MixSplit,
        format: 'json',
      });
      assert.equal(crossProjRes.status, 403);

      // D2: Assigned SITE_ENGINEER sees deduplicated 50.0000% progress on both mixed-link rows with zero financial leakage
      actor = { userId: usrSiteEng, role: 'SITE_ENGINEER', sessionVersion: 7 };
      const siteMixRes = await postWorking({
        projectId: pIr3Evm,
        templateCode: 'T7_SCHEDULE_EVM',
        sourceId: schedIr3MixSplit,
        format: 'json',
      });
      assert.equal(siteMixRes.status, 200);
      const siteMix = await siteMixRes.json();
      assert.equal(siteMix.summaryTotal, null);
      for (const row of siteMix.projection.projectedRows) {
        assert.equal(row.visible.actual_progress_pct, '50.0000');
        assert.equal('earned_value' in row.visible, false);
        assert.equal('bac_allocated_amount' in row.__oserpMeta, false);
      }

      actor = { userId: s.f.ids.a, role: 'SUPER_ADMIN', sessionVersion: 7 };
      return {
        mixedLinkSplitCreditedUnitsEach: '5.0000',
        mixedLinkSplitTotalEv: '10000.00',
        mixedLinkOverlapStatus: 409,
        intraActivityConflictingLinksStatus: 409,
        multiSnapshotSplitCreditedUnitsEach: '5.0000',
        multiSnapshotSplitTotalEv: '15000.00',
        multiSnapshotOverlapStatus: 409,
        legitimateSplitAndDistinctTotalEv: '110000.00',
        crossProjectStatus: 403,
        siteEngineerFinancialRedactionVerified: true,
      };
    }
  );

  await cleanupSynthetic();
  const afterTables = await tableHashes();
  const changedTables = Object.keys(beforeTables).filter((k) => beforeTables[k] !== afterTables[k]);
  assert.deepEqual(
    changedTables,
    [],
    `Synthetic cleanup left residual diff in tables: ${changedTables.join(', ')}`
  );
  report.clean_state_restored = {
    verified_tables: Object.keys(beforeTables).length,
    residual_changed_tables: changedTables.length,
  };
  report.summary = {
    total: report.checks.length,
    passed: report.checks.filter((c: any) => c.status === 'PASS').length,
    failed: report.checks.filter((c: any) => c.status !== 'PASS').length,
  };

  s.fs.mkdirSync(OUT, { recursive: true });
  s.fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
  console.log('BATCH_B_CORRECTIONS_SUITE_PASS', JSON.stringify(report.summary));

  if (prisma) await prisma.$disconnect();
  if (restrictedClient) await restrictedClient.end();
  if (admin) await admin.end();
})().catch(async (err) => {
  console.error('BATCH_B_CORRECTIONS_SUITE_FAIL', err);
  try {
    await cleanupSynthetic();
  } catch (cleanupErr) {
    console.error('CLEANUP_ERR', cleanupErr);
  }
  if (prisma) await prisma.$disconnect().catch(() => {});
  if (restrictedClient) await restrictedClient.end().catch(() => {});
  if (admin) await admin.end().catch(() => {});
  process.exit(1);
});
