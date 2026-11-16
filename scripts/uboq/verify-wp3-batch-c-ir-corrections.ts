/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';
import zlib from 'node:zlib';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/batch-c';
const REPORT_PATH = OUT + '/ir-targeted-tests.json';

const report: any = {
  review_id: 'OSERP-PROJ-UBOQ-001-WP3-BATCH-C-INDEPENDENT-2026-11-15',
  created_at: new Date().toISOString(),
  scope:
    'Targeted negative and positive verification for WP3-BC-IR-01 through WP3-BC-IR-05 on isolated local PostgreSQL.',
  checks: [],
};

let admin: any;
let restrictedClient: any;
let workingRoute: any;
let NextRequest: any;
let actor: any;
let originalLoad: any;
let beforeTables: any;

const hexId = s.crypto.randomBytes(5).toString('hex');
const prefix = 'SYNTH-WP3-BCIR-' + hexId;

// Synthetic isolated test projects
const pIrCash = prefix + '-P-CASH';
const pIrSched = prefix + '-P-SCHED';
const pIrExec = prefix + '-P-EXEC';
const pIrForeign = prefix + '-P-FOR';

// Synthetic users
const uExec = prefix + '-U-EXEC';
const uPm = prefix + '-U-PM';
const uSite = prefix + '-U-SITE';

// Tax profiles, Contracts, Snapshots
const taxZero = prefix + '-TAX-ZERO';
const caCash = prefix + '-CA-CASH';
const caSched = prefix + '-CA-SCHED';
const caExec = prefix + '-CA-EXEC';

const snapCash = prefix + '-SNAP-CASH';
const snapSched = prefix + '-SNAP-SCHED';
const snapExec = prefix + '-SNAP-EXEC';
const snapExecOther = prefix + '-SNAP-EXEC-OLD';
const snapForeign = prefix + '-SNAP-FOR';

// AwardedBOQItems & Phase lines
const boqCash = prefix + '-BOQ-CASH';
const boqSched = prefix + '-BOQ-SCHED';
const boqExec1 = prefix + '-BOQ-EXEC1';
const boqExec2 = prefix + '-BOQ-EXEC2';
const boqFor = prefix + '-BOQ-FOR';

const plCash = prefix + '-PL-CASH';
const plSched = prefix + '-PL-SCHED';
const plExec1 = prefix + '-PL-EXEC1';
const plExec2 = prefix + '-PL-EXEC2';
const plExecOld = prefix + '-PL-EXEC-OLD';
const plFor = prefix + '-PL-FOR';

const save = () => {
  s.fs.mkdirSync(OUT, { recursive: true });
  s.fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');
};

async function check(findingId: string, name: string, fn: () => Promise<any>) {
  const detail = await fn();
  report.checks.push({ findingId, name, result: 'PASS', ...(detail ? { detail } : {}) });
  save();
  console.log(`PASS [${findingId}] ${name}`);
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

function extractZipEntryText(zipBuf: Buffer, targetName: string): string {
  // Parse ZIP central directory from end-of-central-directory record
  let eocdOffset = -1;
  for (let i = zipBuf.length - 22; i >= Math.max(0, zipBuf.length - 65557); i -= 1) {
    if (zipBuf.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  assert.ok(eocdOffset >= 0, 'Valid ZIP EOCD required');
  const cdCount = zipBuf.readUInt16LE(eocdOffset + 10);
  let ptr = zipBuf.readUInt32LE(eocdOffset + 16);
  for (let idx = 0; idx < cdCount; idx += 1) {
    assert.equal(zipBuf.readUInt32LE(ptr), 0x02014b50, 'Valid CD header required');
    const method = zipBuf.readUInt16LE(ptr + 10);
    const compSize = zipBuf.readUInt32LE(ptr + 20);
    const nameLen = zipBuf.readUInt16LE(ptr + 28);
    const extraLen = zipBuf.readUInt16LE(ptr + 30);
    const commentLen = zipBuf.readUInt16LE(ptr + 32);
    const localHeaderOffset = zipBuf.readUInt32LE(ptr + 42);
    const name = zipBuf.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');
    if (name === targetName) {
      const lfhNameLen = zipBuf.readUInt16LE(localHeaderOffset + 26);
      const lfhExtraLen = zipBuf.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lfhNameLen + lfhExtraLen;
      const compSlice = zipBuf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return compSlice.toString('utf8');
      if (method === 8) return zlib.inflateRawSync(compSlice).toString('utf8');
      throw new Error(`Unsupported ZIP compression method: ${method}`);
    }
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  throw new Error(`ZIP entry not found: ${targetName}`);
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
  const sigA = computeSpecSignatureHash('Concrete Works', '3500 psi');
  const sigB = computeSpecSignatureHash('=SUM(D2:D3) Grade 60 Rebar', 'ASTM A615');

  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    for (const [uid, role] of [
      [uExec, 'FINANCE_DIRECTOR'],
      [uPm, 'PROJECT_MANAGER'],
      [uSite, 'SITE_ENGINEER'],
    ]) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 9, now())`,
        [uid, `${uid.toLowerCase()}@synthetic.local`, role]
      );
    }

    for (const p of [pIrCash, pIrSched, pIrExec, pIrForeign]) {
      await admin.query(
        'INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt") VALUES ($1, $1, true, false, now())',
        [p]
      );
    }

    const assigns = [
      [prefix + '-ASN-1', uExec, pIrCash, 'FINANCE_DIRECTOR', 'FULL'],
      [prefix + '-ASN-2', uExec, pIrSched, 'FINANCE_DIRECTOR', 'FULL'],
      [prefix + '-ASN-3', uExec, pIrExec, 'FINANCE_DIRECTOR', 'FULL'],
      [prefix + '-ASN-4', uPm, pIrExec, 'PROJECT_MANAGER', 'FULL'],
      [prefix + '-ASN-5', uSite, pIrExec, 'SITE_ENGINEER', 'STANDARD'],
      [prefix + '-ASN-6', uPm, pIrCash, 'PROJECT_MANAGER', 'FULL'],
    ];
    for (const [id, uid, pid, pRole, accLvl] of assigns) {
      await admin.query(
        `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, 'ACTIVE', now())`,
        [id, uid, pid, pRole, accLvl]
      );
    }

    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES ($1, $2, 'PEZA_ZERO_RATED_0', 'v2026.1', 'PRIVATE', 0.000000, 'ZERO_RATED', false, 0.100000, 0.000000, 0.020000, 0.000000, true, $3, '2026-08-01T00:00:00.000Z')`,
      [taxZero, pIrSched, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $4, NULL, 'PRIVATE', 'IR Cash Client',  'CA-IR-CASH',  'UNIT_PRICE', 'ZERO_RATED', 200000.00, 200000.00, 200000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $8, '2026-08-02T00:00:00.000Z', now()),
         ($2, $5, $7,   'PRIVATE', 'IR Sched Client', 'CA-IR-SCHED', 'UNIT_PRICE', 'ZERO_RATED', 200000.00, 200000.00, 200000.00, 60, '2026-09-01T00:00:00.000Z', 'APPROVED', $8, '2026-08-02T00:00:00.000Z', now()),
         ($3, $6, NULL, 'PRIVATE', 'IR Exec Client',  'CA-IR-EXEC',  'UNIT_PRICE', 'ZERO_RATED', 300000.00, 300000.00, 300000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $8, '2026-08-02T00:00:00.000Z', now())`,
      [caCash, caSched, caExec, pIrCash, pIrSched, pIrExec, taxZero, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $6, NULL, $10, 1, 'IR Cash v1',     'APPROVED',   $13, $18, $18, '2026-08-05T00:00:00.000Z'),
         ($2, $7, NULL, $11, 1, 'IR Sched v1',    'APPROVED',   $14, $18, $18, '2026-08-05T00:00:00.000Z'),
         ($3, $8, NULL, $12, 2, 'IR Exec v2',     'APPROVED',   $15, $18, $18, '2026-08-06T00:00:00.000Z'),
         ($4, $8, NULL, $12, 1, 'IR Exec Old v1', 'SUPERSEDED', $16, $18, $18, '2026-08-04T00:00:00.000Z'),
         ($5, $9, NULL, NULL,1, 'IR Foreign v1',  'APPROVED',   $17, $18, $18, '2026-08-05T00:00:00.000Z')`,
      [
        snapCash,
        snapSched,
        snapExec,
        snapExecOther,
        snapForeign,
        pIrCash,
        pIrSched,
        pIrExec,
        pIrForeign,
        caCash,
        caSched,
        caExec,
        s.hash(snapCash),
        s.hash(snapSched),
        s.hash(snapExec),
        s.hash(snapExecOther),
        s.hash(snapForeign),
        s.f.ids.a,
      ]
    );

    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
       VALUES
         ($1, 'C-01', 'CIVIL', 'Cash Scope',                   'm3', 40,   5000, 200000, 0, 40,   5000, 200000, 'APPROVED', $6, now()),
         ($2, 'S-01', 'CIVIL', 'Sched Scope',                  'm3', 40,   5000, 200000, 0, 40,   5000, 200000, 'APPROVED', $7, now()),
         ($3, 'E-01', 'CIVIL', 'Concrete Works',               'm3', 36,   5000, 180000, 0, 36,   5000, 180000, 'APPROVED', $8, now()),
         ($4, 'E-02', 'STEEL', '=SUM(D2:D3) Grade 60 Rebar',   'kg', 2000, 60,   120000, 0, 2000, 60,   120000, 'APPROVED', $8, now()),
         ($5, 'F-01', 'CIVIL', 'Foreign Scope',                'm3', 10,   5000, 50000,  0, 10,   5000, 50000,  'APPROVED', $9, now())`,
      [boqCash, boqSched, boqExec1, boqExec2, boqFor, pIrCash, pIrSched, pIrExec, pIrForeign]
    );

    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "awardedBoqItemId", "itemCode", "phaseCode", "sectionCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
         "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
         "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       )
       VALUES
         ($1, $7,  $11, $16, 'C-01', 'PH-1', 'SEC', 'Cash Scope',                 '3500 psi',  $21, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 40,   40,   5000, 200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($2, $8,  $12, $17, 'S-01', 'PH-1', 'SEC', 'Sched Scope',                '3500 psi',  $21, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 40,   40,   5000, 200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($3, $9,  $13, $18, 'E-01', 'PH-1', 'SEC', 'Concrete Works',             '3500 psi',  $21, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 36,   36,   5000, 180000.00, 180000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($4, $9,  $13, $19, 'E-02', 'PH-1', 'SEC', '=SUM(D2:D3) Grade 60 Rebar', 'ASTM A615', $22, 'kg', 'kg', 'MASS',   'UNIT_PRICE', 2000, 2000, 60,   120000.00, 120000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($5, $9,  $14, $18, 'E-01', 'PH-1', 'SEC', 'Concrete Works Old',         '3500 psi',  $21, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 36,   36,   5000, 180000.00, 180000.00, 'SOURCE_NOT_PROVIDED', now()),
         ($6, $10, $15, $20, 'F-01', 'PH-1', 'SEC', 'Foreign Scope',              '3500 psi',  $21, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 10,   10,   5000, 50000.00,  50000.00,  'SOURCE_NOT_PROVIDED', now())`,
      [
        plCash,
        plSched,
        plExec1,
        plExec2,
        plExecOld,
        plFor,
        pIrCash,
        pIrSched,
        pIrExec,
        pIrForeign,
        snapCash,
        snapSched,
        snapExec,
        snapExecOther,
        snapForeign,
        boqCash,
        boqSched,
        boqExec1,
        boqExec2,
        boqFor,
        sigA,
        sigB,
      ]
    );
  });

  actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 9 };
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
  } finally {
    Module._load = originalLoad;
    originalLoad = null;
  }
  NextRequest = require('next/server').NextRequest;

  const postWorking = (body: any) =>
    workingRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
        body: JSON.stringify(body),
      })
    );

  // =========================================================================
  // 1. WP3-BC-IR-01: Project-Wide Cash Receipt Reconciliation & Allocations
  // =========================================================================
  await check(
    'WP3-BC-IR-01',
    'Duplicate OR across billings fails closed without proof; verified split recognized once; distinct receipts summed accurately',
    async () => {
      const cfp1 = prefix + '-IR1-CFP1';
      const cfp2 = prefix + '-IR1-CFP2';
      const bil1 = prefix + '-IR1-BIL1';
      const bil2 = prefix + '-IR1-BIL2';
      const pay1 = prefix + '-IR1-PAY1';
      const pay2 = prefix + '-IR1-PAY2';
      const rcpt1 = prefix + '-IR1-RCPT1';
      const rcptFor = prefix + '-IR1-RCPT-FOR';
      const alloc1 = prefix + '-IR1-ALC1';
      const alloc2 = prefix + '-IR1-ALC2';

      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqCashFlowPeriod"(id, "projectId", "snapshotId", "periodType", "periodIndex", "periodLabel", "quarterLabel", "periodStart", "periodEnd", "plannedValueWeightAmt")
             VALUES
               ($1, $3, $4, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 100000.00),
               ($2, $3, $4, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-16T00:00:00.000Z', '2026-09-30T23:59:59.999Z', 100000.00)`,
            [cfp1, cfp2, pIrCash, snapCash]
          );
          await admin.query(
            `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
             VALUES
               ($1, $3, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED', $5, $5, $6, now()),
               ($2, $4, '2026-09-16T00:00:00.000Z', '2026-09-30T00:00:00.000Z', '2026-09-30T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED', $5, $5, $6, now())`,
            [bil1, bil2, 'BIL-IR1-A-' + hexId, 'BIL-IR1-B-' + hexId, s.f.ids.a, pIrCash]
          );
          // Two DIFFERENT approved billings sharing 'OR-SHARED-900' with NO verified allocation proof
          await admin.query(
            `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
             VALUES
               ($1, 100000, 100000, 88000, 60000.00, '2026-09-20T00:00:00.000Z', 'OR-SHARED-900', 'PAID', $3, now()),
               ($2, 100000, 100000, 88000, 40000.00, '2026-09-20T00:00:00.000Z', 'OR-SHARED-900', 'PAID', $4, now())`,
            [pay1, pay2, bil1, bil2]
          );
          await admin.query(
            `INSERT INTO "UboqClientReceipt"(id, "projectId", "receiptReference", "receiptDate", "totalReceiptAmount", status, "verifiedById", "verifiedAt", "updatedAt")
             VALUES ($1, $2, 'OR-FOR-01', '2026-09-20T00:00:00.000Z', 50000.00, 'VERIFIED', $3, '2026-09-20T00:00:00.000Z', now())`,
            [rcptFor, pIrForeign, uExec]
          );
        });

        // Negative 1A: Shared OR across two billings without allocation proof => 409 TEMPLATE_DUPLICATE_COLLECTION_REFERENCE
        const dupRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(dupRes.status, 409);
        assert.equal((await dupRes.json()).error, 'TEMPLATE_DUPLICATE_COLLECTION_REFERENCE');

        // Negative 1B: Imbalanced UboqClientReceipt (total=120,000 vs allocations=60,000+40,000=100,000) => SQL seal rejected & T8 returns 409
        await withSignedRestrictedTx(pIrCash, uExec, 9, async () => {
          await restrictedClient.query(
            `INSERT INTO "UboqClientReceipt"(id, "projectId", "receiptReference", "receiptDate", "totalReceiptAmount", status)
             VALUES ($1, $2, 'OR-SHARED-900', '2026-09-20T00:00:00.000Z', 120000.00, 'DRAFT')`,
            [rcpt1, pIrCash]
          );
          await restrictedClient.query(
            `INSERT INTO "UboqClientReceiptAllocation"(id, "projectId", "receiptId", "billingId", "paymentId", "allocatedAmount")
             VALUES
               ($1, $3, $4, $5, $7, 60000.00),
               ($2, $3, $4, $6, $8, 40000.00)`,
            [alloc1, alloc2, pIrCash, rcpt1, bil1, bil2, pay1, pay2]
          );
        });

        await assert.rejects(
          () =>
            withSignedRestrictedTx(pIrCash, uExec, 9, async () => {
              await restrictedClient.query(
                `UPDATE "UboqClientReceipt" SET status = 'VERIFIED' WHERE id = $1`,
                [rcpt1]
              );
            }),
          /UBOQ_CLIENT_RECEIPT_ALLOCATION_SUM_MISMATCH/
        );

        const imbRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(imbRes.status, 409);
        assert.equal((await imbRes.json()).error, 'TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED');

        // Positive 1C: Verified receipt totalReceiptAmount = 100,000.00 allocated 60k + 40k => sealed by signed FINANCE_DIRECTOR & recognized ONCE at 100,000.00!
        await withSignedRestrictedTx(pIrCash, uExec, 9, async () => {
          await restrictedClient.query(
            `UPDATE "UboqClientReceipt" SET "totalReceiptAmount" = 100000.00, status = 'VERIFIED' WHERE id = $1`,
            [rcpt1]
          );
        });
        const okSplitRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          selectedFields: [
            'cash_quarter_label',
            'cash_period_start',
            'cash_period_end',
            'forecast_receipts_amt',
            'actual_cash_receipts_amt',
          ],
          format: 'json',
        });
        assert.equal(okSplitRes.status, 200);
        const okSplit = await okSplitRes.json();
        assert.equal(okSplit.cashFlowSummary.actualCashReceiptsTotal, '100000.00');
        assert.equal(
          okSplit.cashFlowSummary.actualsReconciliation.verifiedClientReceiptsCount,
          1
        );
        assert.equal(
          okSplit.cashFlowSummary.actualsReconciliation.allocatedMultiBillingReceiptsCount,
          1
        );
        assert.equal(okSplit.projection.projectedRows[1].visible.actual_cash_receipts_amt, '100000.00');

        // Verify RLS tenant isolation on UboqClientReceipt
        await withSignedRestrictedTx(pIrCash, uExec, 9, async () => {
          const vis = await restrictedClient.query(`SELECT id FROM "UboqClientReceipt"`);
          assert.deepEqual(
            vis.rows.map((r: any) => r.id),
            [rcpt1]
          );
        });

        // Positive 1D: Different verified receipts across billings => unchanged exact sum (60,000 + 45,000 = 105,000.00)
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(`DELETE FROM "UboqClientReceiptAllocation" WHERE "receiptId" = $1`, [
            rcpt1,
          ]);
          await admin.query(`DELETE FROM "UboqClientReceipt" WHERE id = $1`, [rcpt1]);
          await admin.query(
            `UPDATE "Payment" SET "paymentReferenceNumber" = 'OR-DISTINCT-1', "amountPaid" = 60000.00 WHERE id = $1`,
            [pay1]
          );
          await admin.query(
            `UPDATE "Payment" SET "paymentReferenceNumber" = 'OR-DISTINCT-2', "amountPaid" = 45000.00 WHERE id = $1`,
            [pay2]
          );
        });

        const distRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T9_CASHFLOW_QUARTERLY',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(distRes.status, 200);
        const distBody = await distRes.json();
        assert.equal(distBody.cashFlowSummary.actualCashReceiptsTotal, '105000.00');
        assert.equal(
          distBody.cashFlowSummary.actualsReconciliation.verifiedClientReceiptsCount,
          2
        );

        return {
          unprovenSharedOrStatus: 409,
          imbalancedSplitStatus: 409,
          verifiedSplitRecognizedOnce: okSplit.cashFlowSummary.actualCashReceiptsTotal,
          distinctReceiptsSum: distBody.cashFlowSummary.actualCashReceiptsTotal,
        };
      } finally {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `DELETE FROM "UboqClientReceiptAllocation" WHERE "projectId" = ANY($1::text[])`,
            [[pIrCash, pIrForeign]]
          );
          await admin.query(`DELETE FROM "UboqClientReceipt" WHERE "projectId" = ANY($1::text[])`, [
            [pIrCash, pIrForeign],
          ]);
          await admin.query(`DELETE FROM "Payment" WHERE id = ANY($1::text[])`, [[pay1, pay2]]);
          await admin.query(`DELETE FROM "Billing" WHERE id = ANY($1::text[])`, [[bil1, bil2]]);
          await admin.query(`DELETE FROM "UboqCashFlowPeriod" WHERE id = ANY($1::text[])`, [
            [cfp1, cfp2],
          ]);
        });
      }
    }
  );

  // =========================================================================
  // 2. WP3-BC-IR-02: Period Attribution, Gap-Free Continuity & Actuals Reconciliation
  // =========================================================================
  await check(
    'WP3-BC-IR-02',
    'Out-of-horizon & gap-dated cash flows fail closed; verified historical persisted actuals preserved alongside operational actuals',
    async () => {
      const cfp1 = prefix + '-IR2-CFP1';
      const cfp2 = prefix + '-IR2-CFP2';
      const cfp3 = prefix + '-IR2-CFP3';
      const bil = prefix + '-IR2-BIL';
      const pay = prefix + '-IR2-PAY';
      const exp = prefix + '-IR2-EXP';

      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqCashFlowPeriod"(
               id, "projectId", "snapshotId", "periodType", "periodIndex", "periodLabel", "quarterLabel",
               "periodStart", "periodEnd", "plannedValueWeightAmt", "actualCashReceiptsAmt", "actualCashPaidAmt"
             )
             VALUES
               ($1, $4, $5, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 70000.00, 50000.00, 30000.00),
               ($2, $4, $5, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-16T00:00:00.000Z', '2026-09-30T23:59:59.999Z', 70000.00, 0.00,     0.00),
               ($3, $4, $5, 'HALF_MONTH', 3, '2026-10-H1', '2026-Q4', '2026-10-01T00:00:00.000Z', '2026-10-15T23:59:59.999Z', 60000.00, 0.00,     0.00)`,
            [cfp1, cfp2, cfp3, pIrCash, snapCash]
          );
          await admin.query(
            `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
             VALUES ($1, $2, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED', $3, $3, $4, now())`,
            [bil, 'BIL-IR2-' + hexId, s.f.ids.a, pIrCash]
          );
          // Payment BEFORE first period (2026-08-20 < 2026-09-01)
          await admin.query(
            `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
             VALUES ($1, 100000, 100000, 88000, 80000.00, '2026-08-20T00:00:00.000Z', 'OR-IR2-001', 'PAID', $2, now())`,
            [pay, bil]
          );
        });

        // Negative 2A: Payment before first period => 409 TEMPLATE_CASHFLOW_OUT_OF_HORIZON_TRANSACTION
        const beforeRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(beforeRes.status, 409);
        assert.equal((await beforeRes.json()).error, 'TEMPLATE_CASHFLOW_OUT_OF_HORIZON_TRANSACTION');

        // Negative 2B: Payment after last period (2026-10-25 > 2026-10-15, <= cutoff) => 409 TEMPLATE_CASHFLOW_OUT_OF_HORIZON_TRANSACTION
        await admin.query(
          `UPDATE "Payment" SET "paymentDate" = '2026-10-25T00:00:00.000Z' WHERE id = $1`,
          [pay]
        );
        const afterRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(afterRes.status, 409);
        assert.equal((await afterRes.json()).error, 'TEMPLATE_CASHFLOW_OUT_OF_HORIZON_TRANSACTION');

        // Negative 2C: Missing half-month gap (delete Period 2 2026-09-H2, date payment in gap 2026-09-20) => 409 TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID
        await admin.query(
          `UPDATE "Payment" SET "paymentDate" = '2026-09-20T00:00:00.000Z' WHERE id = $1`,
          [pay]
        );
        await admin.query(`DELETE FROM "UboqCashFlowPeriod" WHERE id = $1`, [cfp2]);
        const gapRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(gapRes.status, 409);
        assert.equal((await gapRes.json()).error, 'TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID');

        // Restore Period 2 (continuous 3 half-months) + operational Expense in Period 2 (12,000.00)
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqCashFlowPeriod"(
               id, "projectId", "snapshotId", "periodType", "periodIndex", "periodLabel", "quarterLabel",
               "periodStart", "periodEnd", "plannedValueWeightAmt", "actualCashReceiptsAmt", "actualCashPaidAmt"
             )
             VALUES ($1, $2, $3, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-16T00:00:00.000Z', '2026-09-30T23:59:59.999Z', 70000.00, 0.00, 0.00)`,
            [cfp2, pIrCash, snapCash]
          );
          await admin.query(
            `INSERT INTO "Expense"(id, amount, date, category, description, "receiptRef", "isAccrued", "netAmount", "vatAmount", status, "approvalStatus", "projectId", "loggedById", "approverId", "awardedBoqItemId", "updatedAt")
             VALUES ($1, 12000.00, '2026-09-22T00:00:00.000Z', 'SUPPLIES', 'Site consumables', 'EXP-IR2-1', false, 12000.00, 0.00, 'APPROVED', 'APPROVED', $2, $3, $3, $4, now())`,
            [exp, pIrCash, s.f.ids.a, boqCash]
          );
        });

        // Positive 2D: Period 1 historical persisted actuals (50k receipts, 30k paid) preserved while Period 2 operational actuals (80k receipts, 12k paid) recognized!
        const okRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          selectedFields: [
            'cash_quarter_label',
            'cash_period_start',
            'cash_period_end',
            'forecast_receipts_amt',
            'actual_cash_receipts_amt',
            'actual_cash_paid_amt',
          ],
          format: 'json',
        });
        assert.equal(okRes.status, 200);
        const okBody = await okRes.json();
        assert.equal(okBody.projection.projectedRows[0].visible.actual_cash_receipts_amt, '50000.00');
        assert.equal(okBody.projection.projectedRows[0].visible.actual_cash_paid_amt, '30000.00');
        assert.equal(okBody.projection.projectedRows[1].visible.actual_cash_receipts_amt, '80000.00');
        assert.equal(okBody.projection.projectedRows[1].visible.actual_cash_paid_amt, '12000.00');
        assert.equal(okBody.cashFlowSummary.actualCashReceiptsTotal, '130000.00');
        assert.equal(okBody.cashFlowSummary.actualCashPaidTotal, '42000.00');
        assert.equal(
          okBody.cashFlowSummary.actualsReconciliation.persistedHistoricalReceiptPeriodsPreservedCount,
          1
        );
        assert.equal(
          okBody.cashFlowSummary.actualsReconciliation.operationalReceiptPeriodsCount,
          1
        );

        // Positive 2E: Identical same-period persisted mirror (80,000.00 in Period 2) deduplicates once without double-counting
        await admin.query(
          `UPDATE "UboqCashFlowPeriod" SET "actualCashReceiptsAmt" = 80000.00 WHERE id = $1`,
          [cfp2]
        );
        const mirRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(mirRes.status, 200);
        const mirBody = await mirRes.json();
        assert.equal(mirBody.cashFlowSummary.actualCashReceiptsTotal, '130000.00');
        assert.equal(
          mirBody.cashFlowSummary.actualsReconciliation
            .deduplicatedIdenticalReceiptMirrorPeriodsCount,
          1
        );

        // Negative 2F: Conflicting same-period persisted vs operational actuals (65k vs 80k) => 409 TEMPLATE_CASHFLOW_ACTUALS_RECONCILIATION_CONFLICT
        await admin.query(
          `UPDATE "UboqCashFlowPeriod" SET "actualCashReceiptsAmt" = 65000.00 WHERE id = $1`,
          [cfp2]
        );
        const confRes = await postWorking({
          projectId: pIrCash,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapCash,
          format: 'json',
        });
        assert.equal(confRes.status, 409);
        assert.equal(
          (await confRes.json()).error,
          'TEMPLATE_CASHFLOW_ACTUALS_RECONCILIATION_CONFLICT'
        );

        return {
          beforeHorizonStatus: 409,
          afterHorizonStatus: 409,
          periodGapStatus: 409,
          reconciledHistoricalPlusOperationalReceipts: '130000.00',
          reconciledHistoricalPlusOperationalPaid: '42000.00',
          conflictingSamePeriodActualsStatus: 409,
        };
      } finally {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(`DELETE FROM "Expense" WHERE id = $1`, [exp]);
          await admin.query(`DELETE FROM "Payment" WHERE id = $1`, [pay]);
          await admin.query(`DELETE FROM "Billing" WHERE id = $1`, [bil]);
          await admin.query(`DELETE FROM "UboqCashFlowPeriod" WHERE id = ANY($1::text[])`, [
            [cfp1, cfp2, cfp3],
          ]);
        });
      }
    }
  );

  // =========================================================================
  // 3. WP3-BC-IR-03: Baseline-Derived Billing Forecast Aggregation
  // =========================================================================
  await check(
    'WP3-BC-IR-03',
    'Two 80k approved claims in a 100k PV period aggregate to 160k expected billings; cancelled/draft excluded; duplicate claim rejected',
    async () => {
      const sch = prefix + '-IR3-SCH';
      const act1 = prefix + '-IR3-ACT1';
      const act2 = prefix + '-IR3-ACT2';
      const dep = prefix + '-IR3-DEP';
      const b1 = prefix + '-IR3-B1';
      const b2 = prefix + '-IR3-B2';
      const bCanc = prefix + '-IR3-BCANC';
      const bDrf = prefix + '-IR3-BDRF';
      const bDup = prefix + '-IR3-BDUP';
      const payPart = prefix + '-IR3-PAY1';

      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "ProjectSchedule"(id, "projectId", name, status, "workflowStatus", "baselineRevision", "projectStartDate", "baselineStartDate", "baselineFinishDate", "workDaysConfig", "approvedBy", "approvedAt", "activatedById", "activatedAt", "activationSnapshotHash", "updatedAt")
             VALUES ($1, $2, 'IR3 Schedule', 'BASELINE', 'ACTIVE_BASELINE', 1, '2026-09-01T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-30T00:00:00.000Z', '["Mon","Tue","Wed","Thu","Fri","Sat"]', $3, '2026-08-25T00:00:00.000Z', $3, '2026-08-25T00:00:00.000Z', $4, now())`,
            [sch, pIrSched, s.f.ids.a, s.hash(sch)]
          );
          await admin.query(
            `INSERT INTO "ScheduleActivity"(id, "scheduleId", "activityCode", name, "plannedStartDate", "plannedFinishDate", "baselineStartDate", "baselineFinishDate", "plannedDuration", "plannedQuantity", unit, "allocatedAmount", status, "updatedAt")
             VALUES
               ($1, $3, 'A-10', 'Phase H1 Work', '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 12, 20, 'm3', 100000.00, 'COMPLETED', now()),
               ($2, $3, 'A-20', 'Phase H2 Work', '2026-09-16T00:00:00.000Z', '2026-09-30T00:00:00.000Z', '2026-09-16T00:00:00.000Z', '2026-09-30T00:00:00.000Z', 12, 20, 'm3', 100000.00, 'COMPLETED', now())`,
            [act1, act2, sch]
          );
          await admin.query(
            `INSERT INTO "ScheduleDependency"(id, "scheduleId", "predecessorId", "successorId", type, "lagDays")
             VALUES ($1, $2, $3, $4, 'FS', 1)`,
            [dep, sch, act1, act2]
          );
        });

        // Baseline check with NO claims: 200k PV across Sep-H1 (100k) + Sep-H2 (100k), plus Oct-H1 lag collection bucket (3 buckets)
        const zeroClaimRes = await postWorking({
          projectId: pIrSched,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapSched,
          format: 'json',
        });
        assert.equal(zeroClaimRes.status, 200);
        const zeroClaim = await zeroClaimRes.json();
        assert.equal(zeroClaim.rowCount, 3);
        assert.equal(zeroClaim.projection.projectedRows[0].visible.planned_value_weight_amt, '100000.00');
        assert.equal(zeroClaim.projection.projectedRows[0].visible.expected_billings_amt, '100000.00');
        assert.equal(zeroClaim.projection.projectedRows[1].visible.planned_value_weight_amt, '100000.00');
        assert.equal(zeroClaim.projection.projectedRows[2].visible.planned_value_weight_amt, '0.00');
        // Lagged 88% (PEZA 0% VAT, 10% retention, 2% EWT) on Sep-H2 100k lands in Oct-H1 (88,000.00), NOT clamped to Sep-H2!
        assert.equal(zeroClaim.projection.projectedRows[2].visible.forecast_receipts_amt, '88000.00');

        // Insert TWO distinct approved claims of 80,000.00 each in Sep-H1 + 1 CANCELLED (95k) + 1 DRAFT (90k)
        const claimNo1 = 'PB-IR3-1-' + hexId.toUpperCase();
        const claimNo2 = 'PB-IR3-2-' + hexId.toUpperCase();
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
             VALUES
               ($1, $5, '2026-09-01T00:00:00.000Z', '2026-09-08T00:00:00.000Z', '2026-09-08T00:00:00.000Z', 'PROGRESS', 200000, 200000, 80000.00, 'APPROVED',             $9,  $9,   $10, now()),
               ($2, $6, '2026-09-09T00:00:00.000Z', '2026-09-14T00:00:00.000Z', '2026-09-14T00:00:00.000Z', 'PROGRESS', 200000, 200000, 80000.00, 'APPROVED_FOR_PAYMENT', $9,  $9,   $10, now()),
               ($3, $7, '2026-09-01T00:00:00.000Z', '2026-09-12T00:00:00.000Z', '2026-09-12T00:00:00.000Z', 'PROGRESS', 200000, 200000, 95000.00, 'CANCELLED',            $9,  $9,   $10, now()),
               ($4, $8, '2026-09-01T00:00:00.000Z', '2026-09-13T00:00:00.000Z', '2026-09-13T00:00:00.000Z', 'PROGRESS', 200000, 200000, 90000.00, 'DRAFT',                $9,  NULL, $10, now())`,
            [
              b1,
              b2,
              bCanc,
              bDrf,
              claimNo1,
              claimNo2,
              'PB-IR3-CANC-' + hexId,
              'PB-IR3-DRF-' + hexId,
              s.f.ids.a,
              pIrSched,
            ]
          );
        });

        const twoClaimsRes = await postWorking({
          projectId: pIrSched,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapSched,
          format: 'json',
        });
        assert.equal(twoClaimsRes.status, 200);
        const twoClaims = await twoClaimsRes.json();
        // Sep-H1 expected billings MUST be 80k + 80k = 160,000.00 (neither 100,000.00 nor 260,000.00)!
        assert.equal(twoClaims.projection.projectedRows[0].visible.expected_billings_amt, '160000.00');
        // Lagged net due of 160,000 * 0.88 = 140,800.00 lands in Sep-H2!
        assert.equal(twoClaims.projection.projectedRows[1].visible.forecast_receipts_amt, '140800.00');
        assert.equal(
          twoClaims.cashFlowSummary.billingForecastReconciliation.approvedClaimsEvaluatedCount,
          2
        );
        assert.equal(
          twoClaims.cashFlowSummary.billingForecastReconciliation
            .periodsDominatedByApprovedClaimsCount,
          1
        );

        // Partial realized payment of 50,000.00 on 2026-09-12 offsets lagged forecast without double-counting!
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
             VALUES ($1, 80000, 80000, 70400, 50000.00, '2026-09-12T00:00:00.000Z', 'OR-IR3-PART', 'PAID', $2, now())`,
            [payPart, b1]
          );
        });
        const offsetRes = await postWorking({
          projectId: pIrSched,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapSched,
          format: 'json',
        });
        assert.equal(offsetRes.status, 200);
        const offsetBody = await offsetRes.json();
        // 50,000 realized in Sep-H1 + remaining (140,800 - 50,000 = 90,800) lagged in Sep-H2 = 140,800 total (zero double-counting!)
        assert.equal(offsetBody.projection.projectedRows[0].visible.forecast_receipts_amt, '50000.00');
        assert.equal(offsetBody.projection.projectedRows[1].visible.forecast_receipts_amt, '90800.00');
        assert.equal(
          offsetBody.cashFlowSummary.billingForecastReconciliation.alreadyCollectedOffsetTotal,
          '50000.00'
        );

        // Negative: Duplicate approved billingNumber (lowercase variant of claimNo1) => 409 TEMPLATE_DUPLICATE_BILLING_CLAIM
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
             VALUES ($1, $2, '2026-09-10T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 'PROGRESS', 200000, 200000, 20000.00, 'APPROVED', $3, $3, $4, now())`,
            [bDup, '  ' + claimNo1.toLowerCase() + ' ', s.f.ids.a, pIrSched]
          );
        });
        const dupClaimRes = await postWorking({
          projectId: pIrSched,
          templateCode: 'T8_CASHFLOW_HALF_MONTH',
          sourceId: snapSched,
          format: 'json',
        });
        assert.equal(dupClaimRes.status, 409);
        assert.equal((await dupClaimRes.json()).error, 'TEMPLATE_DUPLICATE_BILLING_CLAIM');

        return {
          zeroClaimsPeriod1Expected: '100000.00',
          two80kClaimsPeriod1Expected: '160000.00',
          laggedNetForecastAfter50kCollection: '90800.00',
          duplicateApprovedBillingNumberStatus: 409,
        };
      } finally {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(`DELETE FROM "Payment" WHERE id = $1`, [payPart]);
          await admin.query(`DELETE FROM "Billing" WHERE id = ANY($1::text[])`, [
            [b1, b2, bCanc, bDrf, bDup],
          ]);
          await admin.query(`DELETE FROM "ScheduleDependency" WHERE id = $1`, [dep]);
          await admin.query(`DELETE FROM "ScheduleActivity" WHERE id = ANY($1::text[])`, [
            [act1, act2],
          ]);
          await admin.query(`DELETE FROM "ProjectSchedule" WHERE id = $1`, [sch]);
        });
      }
    }
  );

  // =========================================================================
  // 4. WP3-BC-IR-04: Executive Target Budget Approval, Lineage & Reconciliation
  // =========================================================================
  await check(
    'WP3-BC-IR-04',
    'Unapproved target never overrides approved baseline; supersedesId chain verified; ambiguous or conflicting project-wide + line budgets fail closed',
    async () => {
      const tb1Rev1 = prefix + '-IR4-TB1-R1';
      const tb2Rev1 = prefix + '-IR4-TB2-R1';
      const tb1DraftNewer = prefix + '-IR4-TB1-DRF';
      const tb1Amb = prefix + '-IR4-TB1-AMB';
      const tbPw = prefix + '-IR4-TBPW';
      const tbOldSnapOnly = prefix + '-IR4-TB-OLDSNAP';

      try {
        // 4A. Zero approved budgets on pIrExec initially => UNAVAILABLE_NO_APPROVED_BUDGET with null target cost/profit/margin
        const emptyRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'json',
        });
        assert.equal(emptyRes.status, 200);
        const emptyBody = await emptyRes.json();
        assert.equal(
          emptyBody.executiveMarginSummary.targetBudgetStatus,
          'UNAVAILABLE_NO_APPROVED_BUDGET'
        );
        assert.equal(emptyBody.executiveMarginSummary.targetTotalCostExVat, null);
        assert.equal(emptyBody.executiveMarginSummary.targetProfitTotalExVat, null);
        assert.equal(emptyBody.executiveMarginSummary.targetMarginPctOverall, null);
        assert.equal(emptyBody.projection.projectedRows[0].visible.target_total_cost, null);

        // 4B. Approved budget bound ONLY to superseded snapExecOther => 409 TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, 1, 100000.00, 120000.00, 60000.00, 0.333333, 0.00, 120000.00, 120000.00, 60000.00, $5, '2026-08-05T00:00:00.000Z', '2026-08-05T00:00:00.000Z', now())`,
            [tbOldSnapOnly, pIrExec, snapExecOther, plExecOld, s.f.ids.a]
          );
        });
        const wrongSnapRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'json',
        });
        assert.equal(wrongSnapRes.status, 409);
        assert.equal(
          (await wrongSnapRes.json()).error,
          'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS'
        );
        await admin.query(`DELETE FROM "UboqContractorTargetBudget" WHERE id = $1`, [tbOldSnapOnly]);

        // 4C. Older approved rev 1 (120k + 80k = 200k) + NEWER unapproved draft rev 2 (50k) => approved rev 1 wins!
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "supersedesId", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "createdAt", "updatedAt")
             VALUES
               ($1, $4, $5, $6, 1, NULL, 100000.00, 120000.00, 60000.00, 0.333333, 0.00, 120000.00, 120000.00, 60000.00,  $8, '2026-08-10T00:00:00.000Z', '2026-08-10T00:00:00.000Z', now()),
               ($2, $4, $5, $7, 1, NULL, 70000.00,  80000.00,  40000.00, 0.333333, 0.00, 80000.00,  80000.00,  40000.00,  $8, '2026-08-10T00:00:00.000Z', '2026-08-10T00:00:00.000Z', now()),
               ($3, $4, $5, $6, 2, $1,   40000.00,  50000.00,  130000.00,0.722222, 0.00, 50000.00,  50000.00,  130000.00, NULL, NULL,                     '2026-09-25T00:00:00.000Z', now())`,
            [tb1Rev1, tb2Rev1, tb1DraftNewer, pIrExec, snapExec, plExec1, plExec2, s.f.ids.a]
          );
        });

        const draftIgnoredRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'json',
        });
        assert.equal(draftIgnoredRes.status, 200);
        const draftIgnored = await draftIgnoredRes.json();
        assert.equal(
          draftIgnored.executiveMarginSummary.targetBudgetStatus,
          'VERIFIED_APPROVED_LINE_BUDGETS'
        );
        assert.equal(draftIgnored.executiveMarginSummary.targetTotalCostExVat, '200000.00');
        assert.equal(draftIgnored.executiveMarginSummary.targetProfitTotalExVat, '100000.00');

        // 4D. Approve rev 2 (supersedesId = tb1Rev1, targetTotalCost = 110,000.00) => verified rev 2 head wins (110k + 80k = 190,000.00)!
        await admin.query(
          `UPDATE "UboqContractorTargetBudget"
              SET "targetDirectCostAmt" = 95000.00,
                  "targetTotalCost" = 110000.00,
                  "etcUncommitted" = 110000.00,
                  "approvedById" = $2,
                  "approvedAt" = '2026-09-26T00:00:00.000Z'
            WHERE id = $1`,
          [tb1DraftNewer, s.f.ids.a]
        );
        const rev2Res = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'json',
        });
        assert.equal(rev2Res.status, 200);
        const rev2Body = await rev2Res.json();
        assert.equal(rev2Body.executiveMarginSummary.targetTotalCostExVat, '190000.00');
        assert.equal(rev2Body.executiveMarginSummary.targetDirectCostTotalExVat, '165000.00');

        // 4E. Multiple approved revisions without supersedesId binding => 409 TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "supersedesId", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, 3, NULL, 90000.00, 105000.00, 75000.00, 0.416667, 0.00, 105000.00, 105000.00, 75000.00, $5, '2026-09-27T00:00:00.000Z', '2026-09-27T00:00:00.000Z', now())`,
            [tb1Amb, pIrExec, snapExec, plExec1, s.f.ids.a]
          );
        });
        const ambRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'json',
        });
        assert.equal(ambRes.status, 409);
        assert.equal((await ambRes.json()).error, 'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS');
        await admin.query(`DELETE FROM "UboqContractorTargetBudget" WHERE id = $1`, [tb1Amb]);

        // 4F. Conflicting project-wide budget (250k vs line sum 190k) => 409 (never double-counted or silently omitted!)
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "supersedesId", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, NULL, 1, NULL, 210000.00, 250000.00, 50000.00, 0.166667, 0.00, 250000.00, 250000.00, 50000.00, $4, '2026-09-27T00:00:00.000Z', '2026-09-27T00:00:00.000Z', now())`,
            [tbPw, pIrExec, snapExec, s.f.ids.a]
          );
        });
        const pwConflictRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'json',
        });
        assert.equal(pwConflictRes.status, 409);
        assert.equal(
          (await pwConflictRes.json()).error,
          'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS'
        );

        // 4G. Reconciled project-wide budget matching exact line totals (direct=165k, total=190k) => 200 OK without double-counting (190k, NOT 380k!)
        await admin.query(
          `UPDATE "UboqContractorTargetBudget"
              SET "targetDirectCostAmt" = 165000.00,
                  "targetTotalCost" = 190000.00
            WHERE id = $1`,
          [tbPw]
        );
        const pwRecRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'json',
        });
        assert.equal(pwRecRes.status, 200);
        const pwRecBody = await pwRecRes.json();
        assert.equal(
          pwRecBody.executiveMarginSummary.targetBudgetStatus,
          'VERIFIED_RECONCILED_PROJECT_AND_LINE_BUDGETS'
        );
        assert.equal(pwRecBody.executiveMarginSummary.targetTotalCostExVat, '190000.00');

        return {
          olderApprovedBeatNewerUnapproved: '200000.00',
          verifiedSupersedesRev2Total: '190000.00',
          ambiguousRevisionStatus: 409,
          conflictingProjectWideStatus: 409,
          reconciledProjectWidePlusLinesTotal: '190000.00',
        };
      } finally {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(`DELETE FROM "SensitiveExportLog" WHERE "projectId" = $1`, [pIrExec]);
          await admin.query(`DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = $1`, [
            pIrExec,
          ]);
        });
      }
    }
  );

  // =========================================================================
  // 5. WP3-BC-IR-05: SensitiveExportLog Guard + Numeric XLSX & Formula Safety
  // =========================================================================
  await check(
    'WP3-BC-IR-05',
    'Direct SQL approved=true sensitive export log denied; authorized T10 XLSX creates 1 audit event & numeric D:L cells with formula neutralization',
    async () => {
      const tbA = prefix + '-IR5-TBA';
      const tbB = prefix + '-IR5-TBB';

      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(
            `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "updatedAt")
             VALUES
               ($1, $3, $4, $5, 1, 100000.00, 120000.00, 60000.00, 0.333333, 10000.00, 90000.00, 100000.00, 80000.00, $7, '2026-08-10T00:00:00.000Z', now()),
               ($2, $3, $4, $6, 1, 70000.00,  80000.00,  40000.00, 0.333333, 5000.00,  60000.00, 65000.00,  55000.00, $7, '2026-08-10T00:00:00.000Z', now())`,
            [tbA, tbB, pIrExec, snapExec, plExec1, plExec2, s.f.ids.a]
          );
        });

        // Negative 5A: Signed non-executive (PROJECT_MANAGER & SITE_ENGINEER) direct SQL INSERT & function call => denied!
        const fakeDigest = '0'.repeat(64);
        const forgedExportProof = `${Math.floor(Date.now() / 1000)}.${'a'.repeat(24)}.${'f'.repeat(64)}`;
        for (const nonExecId of [uPm, uSite]) {
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pIrExec, nonExecId, 9, async () => {
                await restrictedClient.query(
                  `INSERT INTO "SensitiveExportLog"(id, "userId", "projectId", module, "exportType", "recordCount", "dataClassification", approved, blocked, reason)
                   VALUES ($1, $2, $3, 'UBOQ_EXECUTIVE_TEMPLATES', 'T10_EXECUTIVE_MARGIN:XLSX', 2, 'SENSITIVE_EXECUTIVE_FINANCIAL', true, false, 'FORGED_APPROVED_EXPORT')`,
                  [prefix + '-FORGE-SEL-' + nonExecId.slice(-4), nonExecId, pIrExec]
                );
              }),
            /permission denied for table SensitiveExportLog|UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL/i
          );

          await assert.rejects(
            () =>
              withSignedRestrictedTx(pIrExec, nonExecId, 9, async () => {
                await restrictedClient.query(
                  `SELECT public.uboq_append_sensitive_export_log($1, $2, NULL, $3, 'T10_EXECUTIVE_MARGIN', 'XLSX', $4, 2, '127.0.0.1', true, false, 'FORGED_FN_CALL', $5, $6)`,
                  [
                    'sel_forged_' + nonExecId.slice(-4),
                    nonExecId,
                    pIrExec,
                    snapExec,
                    fakeDigest,
                    forgedExportProof,
                  ]
                );
              }),
            /UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL/
          );
        }

        // Negative 5B: Even signed FINANCE_DIRECTOR setting custom GUC cannot direct-INSERT or call uboq_append_sensitive_export_log without cryptographic server attestation!
        await assert.rejects(
          () =>
            withSignedRestrictedTx(pIrExec, uExec, 9, async () => {
              await restrictedClient.query(
                `SELECT set_config('app.uboq_sensitive_export_fn_active', 'on', true)`
              );
              await restrictedClient.query(
                `INSERT INTO "SensitiveExportLog"(id, "userId", "projectId", module, "exportType", "recordCount", "dataClassification", approved, blocked, reason)
                 VALUES ($1, $2, $3, 'UBOQ_EXECUTIVE_TEMPLATES', 'T10_EXECUTIVE_MARGIN:XLSX', 2, 'SENSITIVE_EXECUTIVE_FINANCIAL', true, false, 'RAW_EXEC_BYPASS')`,
                [prefix + '-RAW-EXEC-SEL', uExec, pIrExec]
              );
            }),
          /permission denied for table SensitiveExportLog|UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED/i
        );

        await assert.rejects(
          () =>
            withSignedRestrictedTx(pIrExec, uExec, 9, async () => {
              await restrictedClient.query(
                `SELECT set_config('app.uboq_sensitive_export_fn_active', 'on', true)`
              );
              await restrictedClient.query(
                `SELECT public.uboq_append_sensitive_export_log($1, $2, NULL, $3, 'T10_EXECUTIVE_MARGIN', 'XLSX', $4, 2, '127.0.0.1', true, false, 'RAW_EXEC_FN_FORGE', $5, $6)`,
                ['sel_raw_exec_fn_' + hexId, uExec, pIrExec, snapExec, fakeDigest, forgedExportProof]
              );
            }),
          /UBOQ_SENSITIVE_EXPORT_LOG_UNATTESTED_CALL/
        );

        // Positive 5C: Authorized FINANCE_DIRECTOR T10 XLSX export creates exactly 1 verifiable SensitiveExportLog row!
        actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 9 };
        const xlsxRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'xlsx',
        });
        assert.equal(xlsxRes.status, 200);
        const xlsxBuf = Buffer.from(await xlsxRes.arrayBuffer());

        const selRows = (
          await admin.query(
            `SELECT id, "userId", role, module, "exportType", "recordCount", approved, blocked, reason
               FROM "SensitiveExportLog"
              WHERE "projectId" = $1`,
            [pIrExec]
          )
        ).rows;
        assert.equal(selRows.length, 1, 'Expected exactly 1 SensitiveExportLog record');
        assert.equal(selRows[0].userId, uExec);
        assert.equal(selRows[0].role, 'FINANCE_DIRECTOR');
        assert.equal(selRows[0].exportType, 'T10_EXECUTIVE_MARGIN:XLSX');
        assert.equal(selRows[0].recordCount, 2);
        assert.equal(selRows[0].approved, true);
        assert.equal(selRows[0].blocked, false);
        assert.ok(String(selRows[0].reason).includes(`[source=${snapExec}]`));

        // Positive 5D: Verify Excel numeric columns D:L (data_type=n in OpenXML & typeof number in ExcelJS, SUM-ready, zero formula injection)
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(xlsxBuf);
        const ws = wb.getWorksheet('T10_EXECUTIVE_MARGIN');
        assert.ok(ws, 'Expected T10_EXECUTIVE_MARGIN worksheet');

        // Row 3 work_description started with '=SUM(D2:D3) Grade 60 Rebar' -> MUST be neutralized text with leading "'" and NO formula!
        const descRow3 = ws.getRow(3).getCell(3);
        assert.equal(typeof descRow3.value, 'string');
        assert.equal(descRow3.formula, undefined);
        assert.ok(String(descRow3.value).startsWith("'=SUM(D2:D3)"));

        let sumContractD = 0;
        let sumTargetTotalF = 0;
        let sumForecastProfitL = 0;
        for (const rIdx of [2, 3]) {
          for (let cIdx = 4; cIdx <= 12; cIdx += 1) {
            const cell = ws.getRow(rIdx).getCell(cIdx);
            assert.equal(typeof cell.value, 'number', `Cell R${rIdx}C${cIdx} must be numeric`);
            assert.equal(cell.formula, undefined);
            assert.equal(cell.numFmt, cIdx === 8 ? '0.0000"%"' : '#,##0.00');
          }
          sumContractD += Number(ws.getRow(rIdx).getCell(4).value);
          sumTargetTotalF += Number(ws.getRow(rIdx).getCell(6).value);
          sumForecastProfitL += Number(ws.getRow(rIdx).getCell(12).value);
        }
        assert.equal(sumContractD.toFixed(2), '300000.00');
        assert.equal(sumTargetTotalF.toFixed(2), '200000.00');
        assert.equal(sumForecastProfitL.toFixed(2), '135000.00');

        // Inspect raw OpenXML xl/worksheets/sheet1.xml to prove D2:L3 cells have NO t="s"/t="inlineStr" and NO <f> formula elements!
        const sheetXml = extractZipEntryText(xlsxBuf, 'xl/worksheets/sheet1.xml');
        assert.equal(/<f[\s>]/.test(sheetXml), false, 'Worksheet XML must contain zero formulas');
        for (const colLetter of ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']) {
          for (const rowNo of [2, 3]) {
            const cellRegex = new RegExp(`<c\\b[^>]*\\br="${colLetter}${rowNo}"[^>]*>[\\s\\S]*?<\\/c>`);
            const m = cellRegex.exec(sheetXml);
            assert.ok(m, `Expected OpenXML cell ${colLetter}${rowNo}`);
            assert.equal(
              /\bt="(?:s|str|inlineStr)"/.test(m[0]),
              false,
              `Cell ${colLetter}${rowNo} must not be serialized as text: ${m[0]}`
            );
            assert.ok(/<v>-?\d+(?:\.\d+)?<\/v>/.test(m[0]), `Expected numeric <v> in ${colLetter}${rowNo}`);
          }
        }

        // Verify CSV & non-executive redaction + provenance preservation
        const csvRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'csv',
        });
        assert.equal(csvRes.status, 200);
        const csvText = await csvRes.text();
        assert.ok(csvText.includes("'=SUM(D2:D3) Grade 60 Rebar"));
        assert.ok(csvText.includes('180000.00'));

        actor = { userId: uPm, role: 'PROJECT_MANAGER', sessionVersion: 9 };
        const pmXlsxRes = await postWorking({
          projectId: pIrExec,
          templateCode: 'T10_EXECUTIVE_MARGIN',
          sourceId: snapExec,
          format: 'xlsx',
        });
        assert.equal(pmXlsxRes.status, 200);
        const pmWb = new ExcelJS.Workbook();
        await pmWb.xlsx.load(Buffer.from(await pmXlsxRes.arrayBuffer()));
        const pmWs = pmWb.getWorksheet('T10_EXECUTIVE_MARGIN');
        // PM sees only 4 non-sensitive default columns (phase_code, item_code, work_description, contract_line_amount)
        assert.equal(pmWs.getRow(1).cellCount, 4);
        assert.equal(typeof pmWs.getRow(2).getCell(4).value, 'number');
        assert.equal(pmWs.getRow(2).getCell(4).value, 180000);
        assert.ok(pmWb.getWorksheet('__OSERP_META'));

        return {
          nonExecDirectSqlApprovedDenied: true,
          rawExecBypassDenied: true,
          authorizedAuditEventCount: 1,
          sumContractColD: sumContractD.toFixed(2),
          sumForecastProfitColL: sumForecastProfitL.toFixed(2),
          formulaNeutralizedInXlsxAndCsv: true,
          pmRedactedVisibleColCount: 4,
        };
      } finally {
        actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 9 };
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role='replica'");
          await admin.query(`DELETE FROM "SensitiveExportLog" WHERE "projectId" = $1`, [pIrExec]);
          await admin.query(`DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = $1`, [
            pIrExec,
          ]);
        });
      }
    }
  );
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
          const allProjects = [pIrCash, pIrSched, pIrExec, pIrForeign];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqClientReceiptAllocation" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqClientReceipt" WHERE "projectId" = ANY($1::text[])`,
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
          await admin.query(`DELETE FROM "Expense" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "Payment" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "Billing" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(`DELETE FROM "ScheduleDependency" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "ScheduleActivity" WHERE id LIKE $1`, [`${prefix}%`]);
          await admin.query(`DELETE FROM "ProjectSchedule" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(
            `DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(`DELETE FROM "AwardedBOQItem" WHERE "projectId" = ANY($1::text[])`, [
            allProjects,
          ]);
          await admin.query(
            `DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" = ANY($1::text[])`,
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
            [uExec, uPm, uSite],
          ]);
        });

        const afterTables = await tableHashes();
        const tableNames = Object.keys(beforeTables);
        assert.deepEqual(Object.keys(afterTables), tableNames);
        const diffs: string[] = [];
        for (const t of tableNames) {
          if (
            beforeTables[t].n !== afterTables[t].n ||
            beforeTables[t].digest !== afterTables[t].digest
          ) {
            diffs.push(
              `${t}: before(${beforeTables[t].n},${beforeTables[t].digest}) != after(${afterTables[t].n},${afterTables[t].digest})`
            );
          }
        }
        assert.deepEqual(diffs, [], `Post-test database residue detected: ${diffs.join('; ')}`);
        report.public_table_count = tableNames.length;
        report.zero_residue_verified = true;
        if (!report.status) {
          report.status = 'PASS';
          console.log(
            `ALL 5 IR TARGETED SUITES PASSED — ${tableNames.length}/${tableNames.length} public tables byte-preserved.`
          );
        }
        save();
      } finally {
        await admin.end();
      }
    }
  });
