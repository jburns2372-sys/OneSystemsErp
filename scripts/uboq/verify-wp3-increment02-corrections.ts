/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const ExcelJS = require('exceljs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/increment-02';
const REPORT_PATH = OUT + '/review-corrections-runtime.json';

const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Increment 02 final independent review targeted regressions and directly affected positives: WP3-02-IR-01 (least-privilege UboqTemplateAuditEvent SQL authorization over restricted LOCAL role), WP3-02-IR-02 (exact-byte HTTP JSON/XLSX/CSV SHA-256 matching header and stored audit record without recursive self-hash), and WP3-02-IR-03 (evidence-backed T1 contract association vs UNLINKED classification across two approved project contracts).',
};

let admin: any;
let restrictedClient: any;
let prisma: any;
let layoutsRoute: any;
let formalRoute: any;
let NextRequest: any;
let actor: any;
let originalLoad: any;
let beforeTables: any;

const hexId = s.crypto.randomBytes(5).toString('hex');
const prefix = 'SYNTH-WP3-IR02-' + hexId;
const synthCleanupProj = 'SYNTH-UBOQ-TEST-WP3IR02-' + hexId;

const p1 = prefix + '-P1';
const p2 = prefix + '-P2';
const pSingle = prefix + '-PSINGLE';

const synthPmFullUser = prefix + '-USR-PM-FULL';
const synthPmViewerUser = prefix + '-USR-PM-VIEW';
const synthSiteEngUser = prefix + '-USR-SITE-ENG';

const assignLowViewer = prefix + '-ASN-LOW-VIEW';
const assignCollabB = prefix + '-ASN-COLLAB-B';
const assignPmFull = prefix + '-ASN-PM-FULL';
const assignPmViewer = prefix + '-ASN-PM-VIEW';
const assignSiteEng = prefix + '-ASN-SITE-ENG';

const tax1 = prefix + '-TAX1';
const tax2 = prefix + '-TAX2';
const c1 = prefix + '-C1-OLDER';
const c2 = prefix + '-C2-NEWER';
const cSingle = prefix + '-CSINGLE';
const draftContract = prefix + '-CDRAFT';
const foreignContract = prefix + '-CFOREIGN';

const srcDoc1 = prefix + '-DOC1';
const sec1 = prefix + '-SEC1';
const cand1 = prefix + '-CAND1';
const cand2 = prefix + '-CAND2';
const awardItem1 = prefix + '-ABI1';
const awardItem2 = prefix + '-ABI2';

const snapUnlinked = prefix + '-S1-UNLINKED';
const snapLinkedC1 = prefix + '-S2-LINKED-C1';
const snapSingleUnlinked = prefix + '-S3-SINGLE-UNLINKED';
const draftSnap = prefix + '-S4-DRAFT';
const foreignSnap = prefix + '-S5-FOREIGN';
const snapCorruptDraftLink = prefix + '-S6-DRAFTLINK';

const lineU1 = prefix + '-LU1';
const lineU2 = prefix + '-LU2';
const lineL1 = prefix + '-LL1';
const lineL2 = prefix + '-LL2';
const lineS1 = prefix + '-LS1';
const lineC1 = prefix + '-LC1';

const save = () =>
  s.fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

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
  for (const tbl of ['UboqContractAuthority', 'UboqOperationalSnapshot', 'UboqAwardedPhaseLine']) {
    res[tbl] = (
      await admin.query(
        `SELECT count(*)::int AS cnt, md5(coalesce(string_agg(to_jsonb(t)::text, '' ORDER BY id), '')) AS md5 FROM "${tbl}" t WHERE "projectId" IN ($1, $2, $3)`,
        [p1, p2, pSingle]
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

  // Seed synthetic users, projects, two approved contracts on p1, unlinked & linked snapshots
  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");

    for (const [uid, email, role] of [
      [synthPmFullUser, `${synthPmFullUser.toLowerCase()}@synthetic.local`, 'PROJECT_MANAGER'],
      [synthPmViewerUser, `${synthPmViewerUser.toLowerCase()}@synthetic.local`, 'PROJECT_MANAGER'],
      [synthSiteEngUser, `${synthSiteEngUser.toLowerCase()}@synthetic.local`, 'SITE_ENGINEER'],
    ]) {
      await admin.query(
        `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
         VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 7, now())`,
        [uid, email, role]
      );
    }

    for (const p of [p1, p2, pSingle]) {
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
         ($1, $2, $3, 'MEMBER', 'VIEWER', 'ACTIVE', now()),
         ($4, $5, $3, 'FULL', 'FULL', 'ACTIVE', now()),
         ($6, $7, $3, 'PROJECT_MANAGER', 'FULL', 'ACTIVE', now()),
         ($8, $9, $3, 'MEMBER', 'VIEWER', 'ACTIVE', now()),
         ($10, $11, $3, 'SITE_ENGINEER', 'STANDARD', 'ACTIVE', now())`,
      [
        assignLowViewer,
        s.f.ids.low,
        p1,
        assignCollabB,
        s.f.ids.b,
        assignPmFull,
        synthPmFullUser,
        assignPmViewer,
        synthPmViewerUser,
        assignSiteEng,
        synthSiteEngUser,
      ]
    );

    // Two distinct approved tax profiles + two distinct approved UboqContractAuthority rows on p1
    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES
         ($1, $3, 'GOV_INFRA_VAT12', 'v2026.1', 'GOVERNMENT', 0.120000, 'VATABLE_12', true, 0.100000, 0.150000, 0.020000, 0.050000, true, $4, '2026-07-01T00:00:00.000Z'),
         ($2, $3, 'PEZA_ZERO', 'v2026.2', 'PRIVATE', 0.000000, 'ZERO_RATED', false, 0.050000, 0.100000, 0.010000, 0.000000, true, $4, '2026-10-15T00:00:00.000Z')`,
      [tax1, tax2, p1, s.f.ids.a]
    );

    // c1 (OLDER): UNIT_PRICE / VAT_INCLUSIVE / currentContractValue = 585000.01
    // c2 (NEWER): LUMP_SUM / VAT_ZERO_RATED / currentContractValue = 999999.99
    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "noaRef", "ntpRef", "clientPoRef", "voReference", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "createdAt", "updatedAt")
       VALUES
         ($1, $3, $4, 'GOVERNMENT', 'Synthetic Infrastructure Client Phase 1', 'CA-2026-009-A', 'NOA-2026-009-A', 'NTP-2026-009-A', 'CPO-2026-009-A', 'VO-01', 'UNIT_PRICE', 'VAT_INCLUSIVE', 560000.01, 500000.01, 585000.01, 240, '2026-07-01T00:00:00.000Z', 'APPROVED', $6, '2026-07-01T01:00:00.000Z', '2026-07-01T01:00:00.000Z', '2026-07-01T01:00:00.000Z'),
         ($2, $3, $5, 'PRIVATE', 'Synthetic Industrial Expansion Phase 2', 'CA-2026-099-B', 'NOA-2026-099-B', 'NTP-2026-099-B', 'CPO-2026-099-B', 'VO-02', 'LUMP_SUM', 'VAT_ZERO_RATED', 920000.00, 920000.00, 999999.99, 365, '2026-10-15T00:00:00.000Z', 'APPROVED', $6, '2026-10-15T01:00:00.000Z', '2026-10-15T01:00:00.000Z', '2026-10-15T01:00:00.000Z')`,
      [c1, c2, p1, tax1, tax2, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "sectorType", "clientName", "contractRef", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", status, "updatedAt")
       VALUES ($1, $2, 'PRIVATE', 'Draft Client', 'DRAFT-CA', 1000, 1000, 1000, 'DRAFT', now())`,
      [draftContract, p1]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "sectorType", "clientName", "contractRef", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", status, "approvedById", "approvedAt", "updatedAt")
       VALUES
         ($1, $2, 'PRIVATE', 'Foreign Project Client', 'FOREIGN-CA', 9000, 9000, 9000, 'APPROVED', $3, now(), now()),
         ($4, $5, 'PRIVATE', 'Single Contract Project Client', 'SINGLE-CA', 450000.00, 401785.71, 450000.00, 'APPROVED', $3, now(), now())`,
      [foreignContract, p2, s.f.ids.a, cSingle, pSingle]
    );

    const docSha = s.hash(srcDoc1 + '-bytes');
    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'synthetic-boq-ir.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 4096, $3, '504b0304', 'memory://synthetic-boq-ir.xlsx', 'CONTRACT_BOQ', $4, true)`,
      [srcDoc1, p1, docSha, s.f.ids.a]
    );
    await admin.query(
      `INSERT INTO "UboqDocumentSection"(id, "sourceDocumentId", "sectionType", "sheetOrPageRef", "sectionTitle", "displayOrder")
       VALUES ($1, $2, 'WORKSHEET', 'BOQ_MAIN', 'Main BOQ Sheet', 1)`,
      [sec1, srcDoc1]
    );
    await admin.query(
      `INSERT INTO "UboqExtractionCandidate"(id, "sourceDocumentId", "sectionId", "sourceRowNumber", "sourceCellRef", "reviewDecision", "reviewedById", "reviewedAt")
       VALUES ($1, $2, $3, 12, 'BOQ_MAIN!A12:H12', 'HUMAN_VERIFIED', $4, now()),
              ($5, $2, $3, 13, 'BOQ_MAIN!A13:H13', 'AUTO_VERIFIED_DETERMINISTIC', $4, now())`,
      [cand1, srcDoc1, sec1, s.f.ids.a, cand2]
    );
    await admin.query(
      `INSERT INTO "AwardedBOQItem"(id, "projectId", "itemCode", description, unit, quantity, "combinedUnitCost", "totalCost", "updatedAt")
       VALUES ($1, $2, '101(1)', 'Structural Excavation', 'm3', 40, 5000, 200000, now()),
              ($3, $2, '101(2)', 'Embankment Compaction', 'm3', 33.3333, 3000, 100000.01, now())`,
      [awardItem1, p1, awardItem2]
    );

    // Snapshots:
    // - snapUnlinked (v1 on p1): APPROVED, contractAuthorityId = NULL
    // - snapLinkedC1 (v2 on p1): APPROVED, contractAuthorityId = c1 (OLDER contract, while newer c2 exists!)
    // - draftSnap (v3 on p1): DRAFT
    // - snapCorruptDraftLink (v4 on p1): APPROVED under replica with contractAuthorityId = draftContract (tests defense-in-depth route 409 + SQL audit trigger P0001)
    // - snapSingleUnlinked (v1 on pSingle): APPROVED, contractAuthorityId = NULL on a 1-contract project
    // - foreignSnap (v1 on p2): APPROVED
    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "contractAuthorityId", "sourceDocumentId", "sourceEvidenceHash", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
       VALUES
         ($1, $2, NULL, $3, $4, 1, 'Approved Unlinked Baseline v1', 'APPROVED', $5, $6, $7, now()),
         ($8, $2, $9,   $3, $4, 2, 'Approved C1-Linked Baseline v2', 'APPROVED', $10, $6, $7, now()),
         ($11, $2, NULL, $3, $4, 3, 'Draft Revision v3', 'DRAFT', $12, $6, NULL, NULL),
         ($13, $2, $14,  $3, $4, 4, 'Legacy Unapproved Contract Link v4', 'APPROVED', $15, $6, $7, now()),
         ($16, $17, NULL, NULL, NULL, 1, 'Single Contract Unlinked v1', 'APPROVED', $18, $7, $7, now()),
         ($19, $20, NULL, NULL, NULL, 1, 'Foreign Approved v1', 'APPROVED', $21, $7, $7, now())`,
      [
        snapUnlinked,
        p1,
        srcDoc1,
        s.hash('ev-ir-' + snapUnlinked),
        s.hash('canon-ir-' + snapUnlinked),
        s.f.ids.b,
        s.f.ids.a,
        snapLinkedC1,
        c1,
        s.hash('canon-ir-' + snapLinkedC1),
        draftSnap,
        s.hash('canon-ir-' + draftSnap),
        snapCorruptDraftLink,
        draftContract,
        s.hash('canon-ir-' + snapCorruptDraftLink),
        snapSingleUnlinked,
        pSingle,
        s.hash('canon-ir-' + snapSingleUnlinked),
        foreignSnap,
        p2,
        s.hash('canon-ir-' + foreignSnap),
      ]
    );

    const insertTwoLines = async (snapId: string, idA: string, idB: string) => {
      await admin.query(
        `INSERT INTO "UboqAwardedPhaseLine"(id, "projectId", "snapshotId", "awardedBoqItemId", "sourceDocumentId", "extractionCandidateId", "sourceSheetName", "sourceCellRef", "itemCode", "phaseCode", "sectionCode", "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "updatedAt")
         VALUES
           ($1, $2, $3, $4, $5, $6, 'BOQ_MAIN', 'BOQ_MAIN!A12:H12', '101(1)', 'PHASE-01', 'BLDG-A', 'Structural Excavation', 'ASTM D1557 Class A', $7, 'cu.m.', 'm3', 'VOLUME', 'UNIT_PRICE', 40.0000, 40.0000, 5000.0000, 200000.00, 178571.43, now()),
           ($8, $2, $3, $9, $5, $10, 'BOQ_MAIN', 'BOQ_MAIN!A13:H13', '101(2)', 'PHASE-02', 'BLDG-B', 'Embankment Compaction', 'DPWH Item 104 Grade B', $11, 'cu.m.', 'm3', 'VOLUME', 'UNIT_PRICE', 35.0000, 33.3333, 3000.0000, 100000.01, 89285.72, now())`,
        [
          idA,
          p1,
          snapId,
          awardItem1,
          srcDoc1,
          cand1,
          s.hash('spec-ir-1'),
          idB,
          awardItem2,
          cand2,
          s.hash('spec-ir-2'),
        ]
      );
    };

    await insertTwoLines(snapUnlinked, lineU1, lineU2);
    await insertTwoLines(snapLinkedC1, lineL1, lineL2);

    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(id, "projectId", "snapshotId", "itemCode", "phaseCode", "sectionCode", "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "updatedAt")
       VALUES
         ($1, $2, $3, '200(1)', 'PHASE-01', 'MAIN', 'Aggregate Subbase', 'DPWH 200', $4, 'cu.m.', 'm3', 'VOLUME', 'UNIT_PRICE', 10.0000, 10.0000, 1500.0000, 15000.00, 13392.86, now()),
         ($5, $6, $7, '300(1)', 'PHASE-01', 'MAIN', 'Corrupt Link Test Line', 'Spec', $4, 'cu.m.', 'm3', 'VOLUME', 'UNIT_PRICE', 5.0000, 5.0000, 1000.0000, 5000.00, 4464.29, now())`,
      [lineS1, pSingle, snapSingleUnlinked, s.hash('spec-ir-single'), lineC1, p1, snapCorruptDraftLink]
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
    layoutsRoute = require('../../src/app/api/uboq/templates/layouts/route');
    formalRoute = require('../../src/app/api/uboq/templates/formal-export/route');
    prisma = require('../../src/lib/prisma').prisma;
  } finally {
    Module._load = originalLoad;
    originalLoad = null;
  }
  NextRequest = require('next/server').NextRequest;

  const postLayouts = (body: any) =>
    layoutsRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );
  const postFormal = (body: any) =>
    formalRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/formal-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );

  let sharedGroupId = '';
  let sharedRev1Id = '';
  let sharedRev2Id = '';
  let privatePmRev1Id = '';

  await check(
    'WP3-02-IR-01A restricted LOCAL role blocks direct UboqTemplateAuditEvent INSERT and blocks viewer/forged-role/unapproved-source audit fabrication',
    async () => {
      // 1. Verify actual PostgreSQL privileges under restricted LOCAL runtime role
      const privs = (
        await restrictedClient.query(`
          SELECT
            current_user AS login_role,
            r.rolsuper,
            r.rolbypassrls,
            pg_has_role(current_user, 'oserp_compat_app', 'USAGE') AS is_compat_member,
            has_table_privilege(current_user, 'public."UboqTemplateAuditEvent"', 'SELECT') AS can_select_audit,
            has_table_privilege(current_user, 'public."UboqTemplateAuditEvent"', 'INSERT') AS can_insert_audit,
            has_table_privilege(current_user, 'public."UboqTemplateAuditEvent"', 'UPDATE') AS can_update_audit,
            has_table_privilege(current_user, 'public."UboqTemplateAuditEvent"', 'DELETE') AS can_delete_audit,
            has_function_privilege(
              current_user,
              'public.uboq_append_template_audit_event(text,text,text,text,integer,text,text,text,text,text,text,text,text,text,text,text,jsonb)',
              'EXECUTE'
            ) AS can_exec_append_fn
          FROM pg_roles r
          WHERE r.rolname = current_user
        `)
      ).rows[0];

      assert.equal(privs.rolsuper, false);
      assert.equal(privs.rolbypassrls, false);
      assert.equal(privs.is_compat_member, true);
      assert.equal(privs.can_select_audit, true);
      assert.equal(privs.can_insert_audit, false);
      assert.equal(privs.can_update_audit, false);
      assert.equal(privs.can_delete_audit, false);
      assert.equal(privs.can_exec_append_fn, true);

      // 2. Direct table INSERT rejected for signed project viewer (42501) AND signed SUPER_ADMIN (42501), even if caller spoofs app.uboq_audit_fn_active = 'on'
      for (const [uid, claimedRole] of [
        [s.f.ids.low, 'ADMIN'],
        [s.f.ids.a, 'SUPER_ADMIN'],
      ]) {
        await assert.rejects(
          () =>
            withSignedRestrictedTx(p1, uid, 7, async () => {
              await restrictedClient.query(
                `SELECT set_config('app.uboq_audit_fn_active', 'on', true)`
              );
              await restrictedClient.query(
                `INSERT INTO "UboqTemplateAuditEvent"(
                   id, "projectId", "layoutVersionNumber", "sharingScope", "templateCode",
                   "eventType", "actorUserId", "actorRole", "sourceId", "sourceVersion",
                   "contractCode", "exportFormat", "outputSha256"
                 ) VALUES ($1, $2, 1, 'SYSTEM_FORMAL_PRESET', 'T0_MASTER_CONTRACT',
                   'FORMAL_EXPORT_GENERATED', $3, $4, $5, $5,
                   'ERP_CANONICAL_T0_FORMAL_V1', 'json', $6)`,
                ['utae_direct_' + hexId, p1, uid, claimedRole, c1, 'a'.repeat(64)]
              );
            }),
          (err: any) => err.code === '42501'
        );
      }

      // 3. Signed project viewers & non-commercial roles calling uboq_append_template_audit_event to fabricate FORMAL_EXPORT_GENERATED -> 42501
      const callAppendFn = (args: {
        id: string;
        proj: string;
        group?: string | null;
        defId?: string | null;
        ver?: number;
        owner?: string | null;
        scope?: string;
        tpl: string;
        ev: string;
        actorId: string;
        actorRole: string;
        srcId?: string | null;
        srcVer?: string | null;
        contractCode?: string | null;
        fmt?: string | null;
        sha?: string | null;
      }) =>
        restrictedClient.query(
          `SELECT id FROM public.uboq_append_template_audit_event(
             $1::text, $2::text, $3::text, $4::text, $5::integer, $6::text, $7::text,
             $8::text, $9::text, $10::text, $11::text, $12::text, $13::text, $14::text,
             $15::text, $16::text, '{}'::jsonb
           )`,
          [
            args.id,
            args.proj,
            args.group ?? null,
            args.defId ?? null,
            args.ver ?? 1,
            args.owner ?? null,
            args.scope ?? 'SYSTEM_FORMAL_PRESET',
            args.tpl,
            args.ev,
            args.actorId,
            args.actorRole,
            args.srcId ?? null,
            args.srcVer ?? null,
            args.contractCode ?? null,
            args.fmt ?? null,
            args.sha ?? null,
          ]
        );

      // 3a. Signed ADMIN with VIEWER assignment (s.f.ids.low) -> 42501
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.low, 7, () =>
            callAppendFn({
              id: 'utae_forged_low_' + hexId,
              proj: p1,
              tpl: 'T0_MASTER_CONTRACT',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: s.f.ids.low,
              actorRole: 'ADMIN',
              srcId: c1,
              srcVer: c1,
              contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
              fmt: 'json',
              sha: 'b'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === '42501' && /UBOQ_TEMPLATE_AUDIT_FORMAL_EXPORT_DENIED/.test(err.message)
      );

      // 3b. Signed PROJECT_MANAGER with VIEWER assignment (synthPmViewerUser) -> 42501 (assignment accessLevel enforced!)
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthPmViewerUser, 7, () =>
            callAppendFn({
              id: 'utae_forged_pmview_' + hexId,
              proj: p1,
              tpl: 'T0_MASTER_CONTRACT',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: synthPmViewerUser,
              actorRole: 'PROJECT_MANAGER',
              srcId: c1,
              srcVer: c1,
              contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
              fmt: 'json',
              sha: 'b'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === '42501' && /UBOQ_TEMPLATE_AUDIT_FORMAL_EXPORT_DENIED/.test(err.message)
      );

      // 3c. Signed SITE_ENGINEER with STANDARD assignment (synthSiteEngUser) -> 42501 (non-commercial role denied!)
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthSiteEngUser, 7, () =>
            callAppendFn({
              id: 'utae_forged_site_' + hexId,
              proj: p1,
              tpl: 'T1_PHASE_BOQ',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: synthSiteEngUser,
              actorRole: 'SITE_ENGINEER',
              srcId: snapLinkedC1,
              srcVer: '2',
              contractCode: 'ERP_CANONICAL_T1_FORMAL_V1',
              fmt: 'xlsx',
              sha: 'b'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === '42501' && /UBOQ_TEMPLATE_AUDIT_FORMAL_EXPORT_DENIED/.test(err.message)
      );

      // 4. False actorRole forgery rejected even when caller IS authorized for formal export!
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, synthPmFullUser, 7, () =>
            callAppendFn({
              id: 'utae_forged_role1_' + hexId,
              proj: p1,
              tpl: 'T0_MASTER_CONTRACT',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: synthPmFullUser,
              actorRole: 'SUPER_ADMIN', // forged escalation! real DB role is PROJECT_MANAGER
              srcId: c1,
              srcVer: c1,
              contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
              fmt: 'json',
              sha: 'c'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === '42501' && /UBOQ_TEMPLATE_AUDIT_ACTOR_ROLE_FORGED/.test(err.message)
      );

      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            callAppendFn({
              id: 'utae_forged_role2_' + hexId,
              proj: p1,
              tpl: 'T0_MASTER_CONTRACT',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: s.f.ids.a,
              actorRole: 'QUANTITY_SURVEYOR', // forged impersonation! real DB role is SUPER_ADMIN
              srcId: c1,
              srcVer: c1,
              contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
              fmt: 'json',
              sha: 'c'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === '42501' && /UBOQ_TEMPLATE_AUDIT_ACTOR_ROLE_FORGED/.test(err.message)
      );

      // 5. Unapproved / foreign / wrong-version source fabrication when layoutDefinitionId IS NULL -> rejected!
      // 5a. Draft contract on T0
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            callAppendFn({
              id: 'utae_draft_c_' + hexId,
              proj: p1,
              tpl: 'T0_MASTER_CONTRACT',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: s.f.ids.a,
              actorRole: 'SUPER_ADMIN',
              srcId: draftContract,
              srcVer: draftContract,
              contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
              fmt: 'json',
              sha: 'd'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE/.test(err.message)
      );

      // 5b. Draft snapshot on T1
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            callAppendFn({
              id: 'utae_draft_s_' + hexId,
              proj: p1,
              tpl: 'T1_PHASE_BOQ',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: s.f.ids.a,
              actorRole: 'SUPER_ADMIN',
              srcId: draftSnap,
              srcVer: '3',
              contractCode: 'ERP_CANONICAL_T1_FORMAL_V1',
              fmt: 'json',
              sha: 'd'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE/.test(err.message)
      );

      // 5c. Foreign project approved contract claimed on p1
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            callAppendFn({
              id: 'utae_foreign_c_' + hexId,
              proj: p1,
              tpl: 'T0_MASTER_CONTRACT',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: s.f.ids.a,
              actorRole: 'SUPER_ADMIN',
              srcId: foreignContract,
              srcVer: foreignContract,
              contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
              fmt: 'json',
              sha: 'd'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_UNAPPROVED_SOURCE/.test(err.message)
      );

      // 5d. Forged sourceVersion on approved snapshot
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            callAppendFn({
              id: 'utae_bad_ver_' + hexId,
              proj: p1,
              tpl: 'T1_PHASE_BOQ',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: s.f.ids.a,
              actorRole: 'SUPER_ADMIN',
              srcId: snapLinkedC1,
              srcVer: '999',
              contractCode: 'ERP_CANONICAL_T1_FORMAL_V1',
              fmt: 'json',
              sha: 'd'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === '22023' && /UBOQ_TEMPLATE_AUDIT_SOURCE_VERSION_MISMATCH/.test(err.message)
      );

      // 5e. Snapshot linked to unapproved contract rejected in SQL audit guard
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            callAppendFn({
              id: 'utae_bad_link_' + hexId,
              proj: p1,
              tpl: 'T1_PHASE_BOQ',
              ev: 'FORMAL_EXPORT_GENERATED',
              actorId: s.f.ids.a,
              actorRole: 'SUPER_ADMIN',
              srcId: snapCorruptDraftLink,
              srcVer: '4',
              contractCode: 'ERP_CANONICAL_T1_FORMAL_V1',
              fmt: 'json',
              sha: 'd'.repeat(64),
            })
          ),
        (err: any) =>
          err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_UNAPPROVED_LINKED_CONTRACT/.test(err.message)
      );

      // 5f. Open BLOCKING UboqValidationException blocks direct SQL formal-export audit creation too
      const blkId = prefix + '-VAL19-BLK';
      await admin.query(
        `INSERT INTO "UboqValidationException"(id, "projectId", "snapshotId", "ruleCode", severity, "entityType", message, status)
         VALUES ($1, $2, $3, 'VAL-19-TEST', 'BLOCKING', 'SNAPSHOT', 'Synthetic open blocker', 'OPEN')`,
        [blkId, p1, snapLinkedC1]
      );
      try {
        await assert.rejects(
          () =>
            withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
              callAppendFn({
                id: 'utae_val19_' + hexId,
                proj: p1,
                tpl: 'T0_MASTER_CONTRACT',
                ev: 'FORMAL_EXPORT_GENERATED',
                actorId: s.f.ids.a,
                actorRole: 'SUPER_ADMIN',
                srcId: c1,
                srcVer: c1,
                contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
                fmt: 'json',
                sha: 'e'.repeat(64),
              })
            ),
          (err: any) =>
            err.code === 'P0001' && /UBOQ_TEMPLATE_AUDIT_BLOCKING_EXCEPTIONS/.test(err.message)
        );
      } finally {
        await admin.query(`DELETE FROM "UboqValidationException" WHERE id = $1`, [blkId]);
      }

      return {
        restrictedRole: privs.login_role,
        directInsertGranted: privs.can_insert_audit,
        appendFnGranted: privs.can_exec_append_fn,
        negativeCasesRejected: 11,
      };
    }
  );

  await check(
    'WP3-02-IR-01B legitimate saved-layout lifecycle operations append verified audit events and reject duplicate/foreign-private audit tampering',
    async () => {
      // 1. Create PROJECT_SHARED T1 layout v1 as SUPER_ADMIN
      const createRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        templateName: 'IR Verified Formal BOQ Layout',
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
        headingAliases: { contract_line_amount: 'Contract Line Total (PHP)' },
      });
      assert.equal(createRes.status, 201, await createRes.clone().text());
      const created = await createRes.json();
      sharedGroupId = created.revision.layoutGroupId;
      sharedRev1Id = created.revision.id;

      // 2. Version v1 -> v2
      const verRes = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: sharedGroupId,
        expectedVersionNumber: 1,
        sharingScope: 'PROJECT_SHARED',
        selectedFields: created.revision.selectedFields,
        headingAliases: {
          contract_line_amount: 'Approved Contract Line Amount',
          original_qty: 'Original Award Qty',
        },
        changeSummary: 'Clarify original award quantity heading',
      });
      assert.equal(verRes.status, 201, await verRes.clone().text());
      sharedRev2Id = (await verRes.json()).revision.id;

      // 3. Duplicate v2 and create a PRIVATE layout owned by synthPmFullUser
      const dupRes = await postLayouts({
        action: 'duplicate',
        projectId: p1,
        sourceRevisionId: sharedRev2Id,
        templateName: 'IR Duplicated BOQ Layout',
        sharingScope: 'PRIVATE',
      });
      assert.equal(dupRes.status, 201, await dupRes.clone().text());

      const keepActor = actor;
      actor = { userId: synthPmFullUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
      try {
        const pmPrivRes = await postLayouts({
          action: 'create',
          projectId: p1,
          templateCode: 'T1_PHASE_BOQ',
          templateName: 'PM Private BOQ Layout',
          sharingScope: 'PRIVATE',
          selectedFields: created.revision.selectedFields,
        });
        assert.equal(pmPrivRes.status, 201, await pmPrivRes.clone().text());
        privatePmRev1Id = (await pmPrivRes.json()).revision.id;
      } finally {
        actor = keepActor;
      }

      // 4. Duplicate lifecycle event replay on sharedRev1Id is rejected by SQL guard (23505)
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event(
                 $1::text, $2::text, $3::text, $4::text, 1, $5::text, 'PROJECT_SHARED',
                 'T1_PHASE_BOQ', 'LAYOUT_CREATED', $5::text, 'SUPER_ADMIN',
                 NULL, NULL, NULL, NULL, NULL, '{}'::jsonb
               )`,
              ['utae_dup_life_' + hexId, p1, sharedGroupId, sharedRev1Id, s.f.ids.a]
            )
          ),
        (err: any) =>
          err.code === '23505' && /UBOQ_TEMPLATE_AUDIT_DUPLICATE_LIFECYCLE_EVENT/.test(err.message)
      );

      // 5. Exporting another user's PRIVATE layout via uboq_append_template_audit_event is rejected (42501)
      await assert.rejects(
        () =>
          withSignedRestrictedTx(p1, s.f.ids.a, 7, () =>
            restrictedClient.query(
              `SELECT id FROM public.uboq_append_template_audit_event(
                 $1::text, $2::text, $3::text, $4::text, 1, $5::text, 'PRIVATE',
                 'T1_PHASE_BOQ', 'FORMAL_EXPORT_GENERATED', $6::text, 'SUPER_ADMIN',
                 $7::text, '2', 'ERP_CANONICAL_T1_FORMAL_V1', 'json', $8::text, '{}'::jsonb
               )`,
              [
                'utae_priv_steal_' + hexId,
                p1,
                'forged_grp',
                privatePmRev1Id,
                synthPmFullUser,
                s.f.ids.a,
                snapLinkedC1,
                'f'.repeat(64),
              ]
            )
          ),
        (err: any) => err.code === '42501' || err.code === '22023'
      );

      // 6. Verify persisted lifecycle audit events via restricted LOCAL role under signed RLS
      const rows = await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT "eventType", "actorRole", "layoutVersionNumber"
             FROM "UboqTemplateAuditEvent"
             WHERE "projectId" = $1 AND "actorUserId" = $2
             ORDER BY "createdAt" ASC`,
            [p1, s.f.ids.a]
          )
        ).rows;
      });
      assert.deepEqual(
        rows.map((r: any) => r.eventType),
        ['LAYOUT_CREATED', 'LAYOUT_VERSIONED', 'LAYOUT_DUPLICATED']
      );
      assert.ok(rows.every((r: any) => r.actorRole === 'SUPER_ADMIN'));

      return { sharedGroupId, sharedRev1Id, sharedRev2Id, verifiedLifecycleEvents: rows.length };
    }
  );

  await check(
    'WP3-02-IR-02 formal export JSON (and XLSX/CSV) SHA-256 matches exact delivered HTTP response bytes, header, and stored audit record without recursive hash',
    async () => {
      // 1. T0 JSON formal export (system preset)
      const t0JsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        sourceId: c1,
        format: 'json',
        contractCode: 'ERP_CANONICAL_T0_FORMAL_V1',
      });
      assert.equal(t0JsonRes.status, 200, await t0JsonRes.clone().text());
      const t0RawBytes = Buffer.from(await t0JsonRes.arrayBuffer());
      s.fs.writeFileSync(OUT + '/t0-formal-contract-ir.json', t0RawBytes);

      const t0ActualSha256 = sha256Hex(t0RawBytes);
      const t0HeaderSha256 = t0JsonRes.headers.get('X-OSERP-Output-Sha256');
      const t0HeaderAuditId = t0JsonRes.headers.get('X-OSERP-Audit-Event-Id');
      assert.equal(t0ActualSha256, t0HeaderSha256, 'T0 HTTP body SHA-256 must match X-OSERP-Output-Sha256');
      assert.ok(t0HeaderAuditId && t0HeaderAuditId.startsWith('utae_'));

      const t0BodyText = t0RawBytes.toString('utf8');
      assert.equal(
        t0BodyText.includes(t0ActualSha256),
        false,
        'Delivered JSON must not embed recursive outputSha256 inside its own hashed bytes'
      );
      const t0Parsed = JSON.parse(t0BodyText);
      assert.deepEqual(t0Parsed.provenance, {
        auditEventId: t0HeaderAuditId,
        digestAlgorithm: 'SHA-256',
        digestHeader: 'X-OSERP-Output-Sha256',
      });
      assert.equal('outputSha256' in t0Parsed.provenance, false);

      // Verify stored UboqTemplateAuditEvent under restricted LOCAL role
      const t0AuditRow = await withSignedRestrictedTx(p1, s.f.ids.a, 7, async () => {
        return (
          await restrictedClient.query(
            `SELECT id, "eventType", "exportFormat", "outputSha256", "sourceId", "actorRole"
             FROM "UboqTemplateAuditEvent" WHERE id = $1`,
            [t0HeaderAuditId]
          )
        ).rows[0];
      });
      assert.ok(t0AuditRow, 'Stored T0 audit event must be readable via restricted RLS');
      assert.equal(t0AuditRow.outputSha256, t0ActualSha256);
      assert.equal(t0AuditRow.exportFormat, 'json');
      assert.equal(t0AuditRow.sourceId, c1);
      assert.equal(t0AuditRow.actorRole, 'SUPER_ADMIN');

      // 2. T1 JSON formal export (saved layout v2, authorized PROJECT_MANAGER synthPmFullUser)
      const keepActor = actor;
      actor = { userId: synthPmFullUser, role: 'PROJECT_MANAGER', sessionVersion: 7 };
      let t1ActualSha256 = '';
      let t1HeaderAuditId: string | null = null;
      try {
        const t1JsonRes = await postFormal({
          projectId: p1,
          templateCode: 'T1_PHASE_BOQ',
          sourceId: snapLinkedC1,
          layoutRevisionId: sharedRev2Id,
          expectedVersionNumber: 2,
          format: 'json',
        });
        assert.equal(t1JsonRes.status, 200, await t1JsonRes.clone().text());
        const t1RawBytes = Buffer.from(await t1JsonRes.arrayBuffer());
        s.fs.writeFileSync(OUT + '/t1-formal-boq-linked-ir.json', t1RawBytes);

        t1ActualSha256 = sha256Hex(t1RawBytes);
        const t1HeaderSha256 = t1JsonRes.headers.get('X-OSERP-Output-Sha256');
        t1HeaderAuditId = t1JsonRes.headers.get('X-OSERP-Audit-Event-Id');
        assert.equal(
          t1ActualSha256,
          t1HeaderSha256,
          'T1 HTTP body SHA-256 must match X-OSERP-Output-Sha256'
        );
        assert.equal(t1RawBytes.toString('utf8').includes(t1ActualSha256), false);

        const t1Parsed = JSON.parse(t1RawBytes.toString('utf8'));
        assert.equal(t1Parsed.provenance.auditEventId, t1HeaderAuditId);
        assert.equal('outputSha256' in t1Parsed.provenance, false);

        const t1AuditRow = await withSignedRestrictedTx(p1, synthPmFullUser, 7, async () => {
          return (
            await restrictedClient.query(
              `SELECT id, "actorRole", "exportFormat", "outputSha256", "layoutDefinitionId", "layoutVersionNumber"
               FROM "UboqTemplateAuditEvent" WHERE id = $1`,
              [t1HeaderAuditId]
            )
          ).rows[0];
        });
        assert.ok(t1AuditRow);
        assert.equal(t1AuditRow.outputSha256, t1ActualSha256);
        assert.equal(t1AuditRow.actorRole, 'PROJECT_MANAGER');
        assert.equal(t1AuditRow.layoutDefinitionId, sharedRev2Id);
        assert.equal(t1AuditRow.layoutVersionNumber, 2);

        // Verify AuditLog and SensitiveExportLog also recorded the exact delivered JSON SHA-256
        const corpAudit = (
          await admin.query(
            `SELECT "newValue" FROM "AuditLog" WHERE "moduleName" = 'UBOQ_FORMAL_EXPORTS' AND "transactionId" = $1`,
            [t1HeaderAuditId]
          )
        ).rows[0];
        assert.equal(JSON.parse(corpAudit.newValue).outputSha256, t1ActualSha256);
      } finally {
        actor = keepActor;
      }

      // 3. Confirm XLSX and CSV delivered HTTP bytes also match header & stored audit record
      for (const fmt of ['xlsx', 'csv'] as const) {
        const binRes = await postFormal({
          projectId: p1,
          templateCode: 'T0_MASTER_CONTRACT',
          sourceId: c1,
          format: fmt,
        });
        assert.equal(binRes.status, 200);
        const raw = Buffer.from(await binRes.arrayBuffer());
        const digest = sha256Hex(raw);
        const evId = binRes.headers.get('X-OSERP-Audit-Event-Id');
        assert.equal(digest, binRes.headers.get('X-OSERP-Output-Sha256'));
        const dbRow = (
          await admin.query(`SELECT "outputSha256" FROM "UboqTemplateAuditEvent" WHERE id = $1`, [
            evId,
          ])
        ).rows[0];
        assert.equal(dbRow.outputSha256, digest);
      }

      return {
        t0JsonAuditEventId: t0HeaderAuditId,
        t0JsonDeliveredSha256: t0ActualSha256,
        t1JsonAuditEventId: t1HeaderAuditId,
        t1JsonDeliveredSha256: t1ActualSha256,
        recursiveHashInJsonBody: false,
      };
    }
  );

  await check(
    'WP3-02-IR-03A two-contract T1 regression classifies unlinked snapshots as UNLINKED without guessing and binds older c1 only when explicitly linked',
    async () => {
      // 1. Unlinked snapshot (snapUnlinked, contractAuthorityId = NULL) on project p1 with TWO approved contracts (older c1=585000.01, newer c2=999999.99)
      const unlinkedJsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapUnlinked,
        format: 'json',
      });
      assert.equal(unlinkedJsonRes.status, 200, await unlinkedJsonRes.clone().text());
      const unlinkedBytes = Buffer.from(await unlinkedJsonRes.arrayBuffer());
      s.fs.writeFileSync(OUT + '/t1-formal-boq-unlinked-ir.json', unlinkedBytes);
      assert.equal(sha256Hex(unlinkedBytes), unlinkedJsonRes.headers.get('X-OSERP-Output-Sha256'));

      const unlinkedBody = JSON.parse(unlinkedBytes.toString('utf8'));
      assert.equal(
        unlinkedBody.pricingAndBillingBasis.contractAssociationStatus,
        'UNLINKED_MULTIPLE_PROJECT_CONTRACTS'
      );
      assert.equal(unlinkedBody.pricingAndBillingBasis.linkedContractAuthorityId, null);
      assert.equal(unlinkedBody.pricingAndBillingBasis.projectApprovedContractCount, 2);
      assert.equal(unlinkedBody.pricingAndBillingBasis.pricingMethod, 'LINE_PRICING_TYPE_GOVERNED');
      assert.equal(
        unlinkedBody.pricingAndBillingBasis.contractVatBasis,
        'UNLINKED_TO_CONTRACT_AUTHORITY'
      );
      assert.equal(unlinkedBody.pricingAndBillingBasis.taxProfileVersion, null);
      assert.equal(unlinkedBody.pricingAndBillingBasis.sectorType, null);
      assert.equal(unlinkedBody.pricingAndBillingBasis.outputVatRate, null);
      assert.equal(unlinkedBody.totals.originalContractAwardAmount, null);
      assert.equal(unlinkedBody.totals.awardedRevenueExVat, null);
      assert.equal(unlinkedBody.totals.currentApprovedContractValue, null);
      // BOQ line quantities & totals remain 100% preserved!
      assert.equal(unlinkedBody.totals.approvedLineTotal, '300000.01');
      assert.ok(!unlinkedBytes.toString('utf8').includes('999999.99'));
      assert.ok(!unlinkedBytes.toString('utf8').includes('585000.01'));

      // Verify unlinked XLSX Formal_Contract_Summary sheet
      const unlinkedXlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapUnlinked,
        format: 'xlsx',
      });
      assert.equal(unlinkedXlsxRes.status, 200);
      const unlinkedXlsxBytes = Buffer.from(await unlinkedXlsxRes.arrayBuffer());
      s.fs.writeFileSync(OUT + '/t1-formal-boq-unlinked-ir.xlsx', unlinkedXlsxBytes);
      assert.equal(
        sha256Hex(unlinkedXlsxBytes),
        unlinkedXlsxRes.headers.get('X-OSERP-Output-Sha256')
      );

      const wbUnlinked = new ExcelJS.Workbook();
      await wbUnlinked.xlsx.load(unlinkedXlsxBytes);
      const summaryUnlinked = wbUnlinked.getWorksheet('Formal_Contract_Summary');
      const unlinkedMap = new Map<string, string>();
      summaryUnlinked.eachRow((r: any) => {
        unlinkedMap.set(String(r.getCell(1).value ?? ''), String(r.getCell(2).value ?? ''));
      });
      assert.equal(
        unlinkedMap.get('contract_association_status'),
        'UNLINKED_MULTIPLE_PROJECT_CONTRACTS'
      );
      assert.equal(unlinkedMap.get('linked_contract_authority_id'), 'NONE_UNLINKED');
      assert.equal(unlinkedMap.get('project_approved_contract_count'), '2');
      assert.equal(unlinkedMap.get('current_approved_contract_value_exact'), 'N/A');
      assert.equal(unlinkedMap.get('original_contract_award_amount_exact'), 'N/A');

      // 2. Explicitly linked snapshot (snapLinkedC1 -> older c1) while newer c2 (999999.99 / LUMP_SUM / VAT_ZERO_RATED) exists on p1!
      const linkedJsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapLinkedC1,
        contractAuthorityId: c1,
        format: 'json',
      });
      assert.equal(linkedJsonRes.status, 200, await linkedJsonRes.clone().text());
      const linkedBytes = Buffer.from(await linkedJsonRes.arrayBuffer());
      assert.equal(sha256Hex(linkedBytes), linkedJsonRes.headers.get('X-OSERP-Output-Sha256'));

      const linkedBody = JSON.parse(linkedBytes.toString('utf8'));
      assert.equal(
        linkedBody.pricingAndBillingBasis.contractAssociationStatus,
        'VERIFIED_SNAPSHOT_CONTRACT_AUTHORITY'
      );
      assert.equal(linkedBody.pricingAndBillingBasis.linkedContractAuthorityId, c1);
      assert.equal(linkedBody.pricingAndBillingBasis.projectApprovedContractCount, 2);
      assert.equal(linkedBody.pricingAndBillingBasis.pricingMethod, 'UNIT_PRICE');
      assert.equal(linkedBody.pricingAndBillingBasis.contractVatBasis, 'VAT_INCLUSIVE');
      assert.equal(linkedBody.pricingAndBillingBasis.taxProfileVersion, 'GOV_INFRA_VAT12@v2026.1');
      assert.equal(linkedBody.totals.originalContractAwardAmount, '560000.01');
      assert.equal(linkedBody.totals.currentApprovedContractValue, '585000.01');
      assert.equal(linkedBody.totals.approvedLineTotal, '300000.01');
      assert.ok(!linkedBytes.toString('utf8').includes('999999.99'));

      const linkedXlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapLinkedC1,
        format: 'xlsx',
      });
      assert.equal(linkedXlsxRes.status, 200);
      const linkedXlsxBytes = Buffer.from(await linkedXlsxRes.arrayBuffer());
      s.fs.writeFileSync(OUT + '/t1-formal-boq-linked-ir.xlsx', linkedXlsxBytes);

      const wbLinked = new ExcelJS.Workbook();
      await wbLinked.xlsx.load(linkedXlsxBytes);
      const summaryLinked = wbLinked.getWorksheet('Formal_Contract_Summary');
      const linkedMap = new Map<string, string>();
      summaryLinked.eachRow((r: any) => {
        linkedMap.set(String(r.getCell(1).value ?? ''), String(r.getCell(2).value ?? ''));
      });
      assert.equal(
        linkedMap.get('contract_association_status'),
        'VERIFIED_SNAPSHOT_CONTRACT_AUTHORITY'
      );
      assert.equal(linkedMap.get('linked_contract_authority_id'), c1);
      assert.equal(linkedMap.get('current_approved_contract_value_exact'), '585000.01');
      assert.equal(linkedMap.get('original_contract_award_amount_exact'), '560000.01');

      // 3. Single-contract project with unlinked snapshot also classifies as UNLINKED_NO_SNAPSHOT_CONTRACT_BINDING without assuming linkage
      const singleRes = await postFormal({
        projectId: pSingle,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapSingleUnlinked,
        format: 'json',
      });
      assert.equal(singleRes.status, 200, await singleRes.clone().text());
      const singleBody = await singleRes.json();
      assert.equal(
        singleBody.pricingAndBillingBasis.contractAssociationStatus,
        'UNLINKED_NO_SNAPSHOT_CONTRACT_BINDING'
      );
      assert.equal(singleBody.pricingAndBillingBasis.linkedContractAuthorityId, null);
      assert.equal(singleBody.pricingAndBillingBasis.projectApprovedContractCount, 1);
      assert.equal(singleBody.totals.currentApprovedContractValue, null);
      assert.equal(singleBody.totals.approvedLineTotal, '15000.00');

      return {
        unlinkedStatus: unlinkedBody.pricingAndBillingBasis.contractAssociationStatus,
        linkedStatus: linkedBody.pricingAndBillingBasis.contractAssociationStatus,
        linkedContractSelected: linkedBody.pricingAndBillingBasis.linkedContractAuthorityId,
        newerContractGuessed: false,
        singleProjectUnlinkedStatus: singleBody.pricingAndBillingBasis.contractAssociationStatus,
      };
    }
  );

  await check(
    'WP3-02-IR-03B unverified, mismatched, cross-project, and unapproved T1 contract associations fail closed across API and DB triggers',
    async () => {
      // 1. Requesting newer contract c2 against unlinked snapshot -> 409 FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED
      const unverifiedRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapUnlinked,
        contractAuthorityId: c2,
        format: 'json',
      });
      assert.equal(unverifiedRes.status, 409);
      assert.equal((await unverifiedRes.json()).error, 'FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED');

      // 2. Requesting newer contract c2 against c1-linked snapshot -> 409 FORMAL_CONTRACT_ASSOCIATION_MISMATCH
      const mismatchRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapLinkedC1,
        contractAuthorityId: c2,
        format: 'json',
      });
      assert.equal(mismatchRes.status, 409);
      assert.equal((await mismatchRes.json()).error, 'FORMAL_CONTRACT_ASSOCIATION_MISMATCH');

      // 3. Exporting snapshot whose linked contract is DRAFT -> 409 FORMAL_LINKED_CONTRACT_NOT_APPROVED
      const draftLinkRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snapCorruptDraftLink,
        format: 'json',
      });
      assert.equal(draftLinkRes.status, 409);
      assert.equal((await draftLinkRes.json()).error, 'FORMAL_LINKED_CONTRACT_NOT_APPROVED');

      // 4. DB trigger a01_uboq_snapshot_contract_authority_scope blocks cross-project contract binding (42501)
      await assert.rejects(
        () =>
          s.transaction(admin, async () => {
            await admin.query(
              `UPDATE "UboqOperationalSnapshot" SET "contractAuthorityId" = $1 WHERE id = $2`,
              [foreignContract, draftSnap]
            );
          }),
        (err: any) =>
          err.code === '42501' && /UBOQ_CROSS_PROJECT_CONTRACT_AUTHORITY_DENIED/.test(err.message)
      );

      // 5. DB trigger a01_uboq_snapshot_contract_authority_scope blocks binding DRAFT contract onto APPROVED snapshot (P0001)
      await assert.rejects(
        () =>
          s.transaction(admin, async () => {
            await admin.query(
              `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
               VALUES ($1, $2, $3, 99, 'Invalid Draft Contract Link', 'APPROVED', $4, $5, $5, now())`,
              [prefix + '-S-BAD-DRAFT', p1, draftContract, s.hash('bad-draft'), s.f.ids.a]
            );
          }),
        (err: any) =>
          err.code === 'P0001' && /UBOQ_UNAPPROVED_CONTRACT_AUTHORITY_DENIED/.test(err.message)
      );

      // 6. Existing snapshot seal trigger blocks post-approval mutation of contractAuthorityId on APPROVED snapshot
      await assert.rejects(
        () =>
          s.transaction(admin, async () => {
            await admin.query(
              `UPDATE "UboqOperationalSnapshot" SET "contractAuthorityId" = $1 WHERE id = $2`,
              [c2, snapLinkedC1]
            );
          }),
        (err: any) => err.code === 'P0001' || err.code === '42501'
      );

      return {
        apiFailClosedCodes: [
          'FORMAL_CONTRACT_ASSOCIATION_UNVERIFIED',
          'FORMAL_CONTRACT_ASSOCIATION_MISMATCH',
          'FORMAL_LINKED_CONTRACT_NOT_APPROVED',
        ],
        dbTriggersEnforced: [
          'a01_uboq_snapshot_contract_authority_scope',
          'g02_r3_snapshot_seal',
        ],
      };
    }
  );

  await check(
    'WP3-02-IR-04 updated TemplateBuilder client bundle excludes server modules, synthetic cleanup handles contractAuthorityId FK, and canonical sources remain unmutated',
    async () => {
      const esbuild = require('esbuild');
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
        /template-builder\.ts|templates\/t0-t1\.ts|templates\/saved-layouts\.ts|templates\/formal-t0-t1\.ts|exceljs|prisma/.test(
          x
        )
      );
      assert.deepEqual(serverInputs, [], 'Server-only modules entered browser bundle');

      // Verify manifest-verified synthetic cleanup cleanly deletes snapshot with contractAuthorityId FK before UboqContractAuthority
      const scContract = prefix + '-SC-CA';
      const scSnap = prefix + '-SC-SNAP';
      const scLayout = prefix + '-SC-TPL';
      await s.transaction(admin, async () => {
        await admin.query("SET LOCAL session_replication_role='replica'");
        await admin.query(
          `INSERT INTO "UboqContractAuthority"(id, "projectId", "sectorType", "clientName", "contractRef", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", status, "approvedById", "approvedAt", "updatedAt")
           VALUES ($1, $2, 'PRIVATE', 'Synth Cleanup Client', 'SC-CA-1', 1000, 1000, 1000, 'APPROVED', $3, now(), now())`,
          [scContract, synthCleanupProj, s.f.ids.a]
        );
        await admin.query(
          `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
           VALUES ($1, $2, $3, 1, 'Synth Cleanup Linked v1', 'APPROVED', $4, $5, $5, now())`,
          [scSnap, synthCleanupProj, scContract, s.hash('sc-snap'), s.f.ids.a]
        );
        await admin.query(
          `INSERT INTO "UboqTemplateDefinition"(id, "projectId", "layoutGroupId", "sharingScope", "definitionHash", "templateCode", "templateName", "rowGrain", "selectedFieldsJson", "isSystemPreset", "versionNumber", "createdById", "updatedAt")
           VALUES ($1, $2, $3, 'PRIVATE', $4, 'T0_MASTER_CONTRACT', 'Synth Cleanup Layout', 'CONTRACT_HEADER', '["client_name"]'::jsonb, false, 1, $5, now())`,
          [scLayout, synthCleanupProj, 'tplgrp_sc_' + hexId, s.hash('sc-tpl'), s.f.ids.a]
        );
      });

      const manifestRow = (
        await admin.query(`SELECT public.uboq_build_synthetic_cleanup_manifest($1) AS m`, [
          synthCleanupProj,
        ])
      ).rows[0].m;
      assert.equal(manifestRow.eligible, true, JSON.stringify(manifestRow.disqualifiers));

      await s.transaction(admin, async () => {
        await admin.query(`SET LOCAL ROLE oserp_maint_cleanup_role`);
        const cleanupRes = (
          await admin.query(
            `SELECT public.uboq_execute_verified_synthetic_cleanup($1, $2) AS r`,
            [synthCleanupProj, manifestRow.manifestSha256]
          )
        ).rows[0].r;
        assert.equal(cleanupRes.cleanedProjectId, synthCleanupProj);
      });

      const sourceDigestAfter = await canonicalSourceDigest();
      assert.deepEqual(sourceDigestAfter, sourceDigestBefore);
      return {
        clientBundleExcludesServerModules: true,
        syntheticCleanupWithContractLink: 'PASS',
        canonicalSourcesUnmutated: true,
      };
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
          const allProjects = [p1, p2, pSingle, synthCleanupProj];
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND ("newValue" LIKE $1 OR "newValue" LIKE $2 OR "newValue" LIKE $3 OR "newValue" LIKE $4)`,
            [`%${p1}%`, `%${p2}%`, `%${pSingle}%`, `%${synthCleanupProj}%`]
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
            `DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "AwardedBOQItem" WHERE "projectId" = ANY($1::text[])`,
            [allProjects]
          );
          await admin.query(
            `DELETE FROM "UboqExtractionCandidate" WHERE "sourceDocumentId" = $1`,
            [srcDoc1]
          );
          await admin.query(
            `DELETE FROM "UboqDocumentSection" WHERE "sourceDocumentId" = $1`,
            [srcDoc1]
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
            [synthPmFullUser, synthPmViewerUser, synthSiteEngUser],
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
