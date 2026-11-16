/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const { assert } = s;

const OUT = 'artifacts/uboq/wp3/increment-02';
const report: any = {
  checks: [],
  created_at: new Date().toISOString(),
  scope:
    'WP-3 Increment 02 runtime, restricted PostgreSQL RLS/trigger security, saved-layout versioning/sharing/audit, formal T0/T1 XLSX/CSV/JSON contracts, and headless Chromium E2E.',
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
const prefix = 'SYNTH-WP3-T02-' + hexId;
const synthCleanupProj = 'SYNTH-UBOQ-TEST-WP302-' + hexId;
const p1 = prefix + '-P1';
const p2 = prefix + '-P2';
const tax1 = prefix + '-TAX1';
const c1 = prefix + '-C1';
const draftContract = prefix + '-CD';
const foreignContract = prefix + '-CF';
const srcDoc1 = prefix + '-DOC1';
const sec1 = prefix + '-SEC1';
const cand1 = prefix + '-CAND1';
const cand2 = prefix + '-CAND2';
const awardItem1 = prefix + '-ABI1';
const awardItem2 = prefix + '-ABI2';
const snap1 = prefix + '-S1';
const draftSnap = prefix + '-SD';
const foreignSnap = prefix + '-SF';
const line1 = prefix + '-L1';
const line2 = prefix + '-L2';
const assignViewer = prefix + '-ASN-VIEWER';
const assignCollaborator = prefix + '-ASN-COLLAB';

const save = () =>
  s.fs.writeFileSync(OUT + '/runtime-tests.json', JSON.stringify(report, null, 2) + '\n');

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
        `SELECT count(*)::int AS cnt, md5(coalesce(string_agg(to_jsonb(t)::text, '' ORDER BY id), '')) AS md5 FROM "${tbl}" t WHERE "projectId" IN ($1, $2)`,
        [p1, p2]
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

  // Seed synthetic projects & canonical approved BOQ/contract fixtures
  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role='replica'");
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

    // Assignments on p1: s.f.ids.low starts as VIEWER
    await admin.query(
      `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES ($1, $2, $3, 'MEMBER', 'VIEWER', 'ACTIVE', now())`,
      [assignViewer, s.f.ids.low, p1]
    );
    await admin.query(
      `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES ($1, $2, $3, 'FULL', 'FULL', 'ACTIVE', now())`,
      [assignCollaborator, s.f.ids.b, p1]
    );

    // Tax profile & approved contract authority on p1 + draft + foreign contract on p2
    await admin.query(
      `INSERT INTO "UboqTaxPricingProfile"(id, "projectId", "profileCode", "versionCode", "sectorType", "outputVatRate", "salesVatCategory", "contractVatInclusive", "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate", "isImmutableApproved", "approvedById", "approvedAt")
       VALUES ($1, $2, 'GOV_INFRA_VAT12', 'v2026.1', 'GOVERNMENT', 0.120000, 'VATABLE_12', true, 0.100000, 0.150000, 0.020000, 0.050000, true, $3, now())`,
      [tax1, p1, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "noaRef", "ntpRef", "clientPoRef", "voReference", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
       VALUES ($1, $2, $3, 'GOVERNMENT', 'Synthetic Infrastructure Client', 'CA-2026-009', 'NOA-2026-009', 'NTP-2026-009', 'CPO-2026-009', 'VO-01', 'UNIT_PRICE', 'VAT_INCLUSIVE', 560000.01, 500000.01, 585000.01, 240, '2026-07-01T00:00:00.000Z', 'APPROVED', $4, now(), now())`,
      [c1, p1, tax1, s.f.ids.a]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "sectorType", "clientName", "contractRef", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", status, "updatedAt")
       VALUES ($1, $2, 'PRIVATE', 'Draft Client', 'DRAFT-CA', 1000, 1000, 1000, 'DRAFT', now())`,
      [draftContract, p1]
    );

    await admin.query(
      `INSERT INTO "UboqContractAuthority"(id, "projectId", "sectorType", "clientName", "contractRef", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", status, "approvedById", "approvedAt", "updatedAt")
       VALUES ($1, $2, 'PRIVATE', 'Foreign Project Client', 'FOREIGN-CA', 9000, 9000, 9000, 'APPROVED', $3, now(), now())`,
      [foreignContract, p2, s.f.ids.b]
    );

    // Source document, section, extraction candidates, awarded BOQ items, snapshots, and phase lines
    const docSha = s.hash(srcDoc1 + '-bytes');
    await admin.query(
      `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
       VALUES ($1, $2, 'synthetic-boq.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 4096, $3, '504b0304', 'memory://synthetic-boq.xlsx', 'CONTRACT_BOQ', $4, true)`,
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

    await admin.query(
      `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "sourceEvidenceHash", "versionNumber", "versionLabel", status, "canonicalHash", "preparedById", "approvedById", "approvedAt")
       VALUES ($1, $2, $3, $4, 1, 'Approved Baseline v1', 'APPROVED', $5, $6, $7, now()),
              ($8, $2, $3, $4, 2, 'Draft Revision v2', 'DRAFT', $9, $6, NULL, NULL),
              ($10, $11, NULL, NULL, 1, 'Foreign Approved v1', 'APPROVED', $12, $7, $7, now())`,
      [
        snap1,
        p1,
        srcDoc1,
        s.hash('ev-' + snap1),
        s.hash('canon-' + snap1),
        s.f.ids.b,
        s.f.ids.a,
        draftSnap,
        s.hash('canon-' + draftSnap),
        foreignSnap,
        p2,
        s.hash('canon-' + foreignSnap),
      ]
    );

    // Line 1: exact product 40.0000 * 5000.0000 = 200000.00, formula-like description '=SUM(1,2)'
    // Line 2: originalQty=35.0000, approvedQty=33.3333, rate=3000.0000 -> rate*qty=99999.90, authoritative contractLineAmount=100000.01 (11-cent contractual lump rounding preserved!)
    await admin.query(
      `INSERT INTO "UboqAwardedPhaseLine"(id, "projectId", "snapshotId", "awardedBoqItemId", "sourceDocumentId", "extractionCandidateId", "sourceSheetName", "sourceCellRef", "itemCode", "phaseCode", "sectionCode", "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "updatedAt")
       VALUES
         ($1, $2, $3, $4, $5, $6, 'BOQ_MAIN', 'BOQ_MAIN!A12:H12', '101(1)', 'PHASE-01', 'BLDG-A', '=SUM(1,2)', 'ASTM D1557 Class A', $7, 'cu.m.', 'm3', 'VOLUME', 'UNIT_PRICE', 40.0000, 40.0000, 5000.0000, 200000.00, 178571.43, now()),
         ($8, $2, $3, $9, $5, $10, 'BOQ_MAIN', 'BOQ_MAIN!A13:H13', '101(2)', 'PHASE-02', 'BLDG-B', 'Embankment Compaction', 'DPWH Item 104 Grade B', $11, 'cu.m.', 'm3', 'VOLUME', 'UNIT_PRICE', 35.0000, 33.3333, 3000.0000, 100000.01, 89285.72, now())`,
      [
        line1,
        p1,
        snap1,
        awardItem1,
        srcDoc1,
        cand1,
        s.hash('spec-1'),
        line2,
        awardItem2,
        cand2,
        s.hash('spec-2'),
      ]
    );
  });

  const sourceDigestBefore = await canonicalSourceDigest();

  // Load real Next route handlers with ONLY @/lib/dal/auth stubbed
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

  const getLayouts = (qs: string) =>
    layoutsRoute.GET(new NextRequest('http://localhost/api/uboq/templates/layouts?' + qs));
  const postLayouts = (body: any) =>
    layoutsRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/layouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );
  const getFormal = (qs: string) =>
    formalRoute.GET(new NextRequest('http://localhost/api/uboq/templates/formal-export?' + qs));
  const postFormal = (body: any) =>
    formalRoute.POST(
      new NextRequest('http://localhost/api/uboq/templates/formal-export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: typeof body === 'string' ? body : JSON.stringify(body),
      })
    );

  let t1GroupId = '';
  let t1Rev1Id = '';
  let t1Rev2Id = '';
  let t1Rev3Id = '';
  let t0SharedGroupId = '';
  let t0SharedRev1Id = '';

  await check(
    'WP3-02-01 anonymous stale-session and revoked-assignment requests denied across layouts and formal export',
    async () => {
      const keep = actor;
      actor = null;
      try {
        assert.equal((await getLayouts(`projectId=${p1}`)).status, 401);
        assert.equal(
          (
            await postLayouts({
              action: 'create',
              projectId: p1,
              templateCode: 'T1_PHASE_BOQ',
              templateName: 'Anon',
              selectedFields: ['phase_code'],
            })
          ).status,
          401
        );
        assert.equal((await getFormal(`projectId=${p1}`)).status, 401);
        assert.equal(
          (
            await postFormal({
              projectId: p1,
              templateCode: 'T1_PHASE_BOQ',
              sourceId: snap1,
              format: 'json',
            })
          ).status,
          401
        );
      } finally {
        actor = keep;
      }

      // Stale sessionVersion (6 vs DB 7)
      actor = { ...keep, sessionVersion: 6 };
      try {
        assert.equal((await getLayouts(`projectId=${p1}`)).status, 403);
        assert.equal(
          (
            await postFormal({
              projectId: p1,
              templateCode: 'T1_PHASE_BOQ',
              sourceId: snap1,
              format: 'json',
            })
          ).status,
          403
        );
      } finally {
        actor = keep;
      }

      // Revoked assignment for non-global user s.f.ids.low
      await admin.query(
        `UPDATE "ProjectUserAssignment" SET "assignmentStatus" = 'INACTIVE' WHERE id = $1`,
        [assignViewer]
      );
      actor = { userId: s.f.ids.low, role: 'ADMIN', sessionVersion: 7 };
      try {
        assert.equal((await getLayouts(`projectId=${p1}`)).status, 403);
        assert.equal((await getFormal(`projectId=${p1}`)).status, 403);
      } finally {
        actor = keep;
        await admin.query(
          `UPDATE "ProjectUserAssignment" SET "assignmentStatus" = 'ACTIVE' WHERE id = $1`,
          [assignViewer]
        );
      }
    }
  );

  await check(
    'WP3-02-02 create and persist project-scoped T1 private layout and T0 shared layout with audit provenance',
    async () => {
      const r1 = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        templateName: 'Commercial Phase BOQ Layout',
        selectedFields: [
          'phase_code',
          'item_code',
          'work_description',
          'specification',
          'unit',
          'original_qty',
          'approved_qty',
          'contract_unit_rate',
          'contract_line_amount',
        ],
        headingAliases: { approved_qty: 'Contract Approved Qty' },
        sharingScope: 'PRIVATE',
        changeSummary: 'Initial commercial BOQ layout',
      });
      assert.equal(r1.status, 201, await r1.clone().text());
      const j1 = await r1.json();
      assert.equal(j1.revision.versionNumber, 1);
      assert.equal(j1.revision.sharingScope, 'PRIVATE');
      assert.equal(j1.revision.supersedesId, null);
      assert.match(j1.revision.definitionHash, /^[0-9a-f]{64}$/);
      t1GroupId = j1.revision.layoutGroupId;
      t1Rev1Id = j1.revision.id;

      const r2 = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        templateName: 'Shared Executive Contract Header',
        selectedFields: [
          'client_name',
          'contract_ref',
          'noa_ref',
          'ntp_ref',
          'client_po_ref',
          'vo_reference',
          'pricing_method',
          'contract_vat_basis',
          'awarded_revenue',
          'current_contract_value',
        ],
        sharingScope: 'PROJECT_SHARED',
        changeSummary: 'Shared contract header layout',
      });
      assert.equal(r2.status, 201, await r2.clone().text());
      const j2 = await r2.json();
      assert.equal(j2.revision.versionNumber, 1);
      assert.equal(j2.revision.sharingScope, 'PROJECT_SHARED');
      t0SharedGroupId = j2.revision.layoutGroupId;
      t0SharedRev1Id = j2.revision.id;

      const auditCnt = (
        await admin.query(
          `SELECT count(*)::int AS cnt FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1 AND "eventType" = 'LAYOUT_CREATED'`,
          [p1]
        )
      ).rows[0].cnt;
      assert.equal(auditCnt, 2);
      return { t1GroupId, t1Rev1Id, t0SharedGroupId, t0SharedRev1Id };
    }
  );

  await check(
    'WP3-02-03 edit and version saved layout (v1 -> v2 -> v3) preserves historical revisions and rejects stale expectedVersionNumber',
    async () => {
      const rV2 = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: t1GroupId,
        expectedVersionNumber: 1,
        templateName: 'Commercial Phase BOQ Layout',
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
          approved_qty: 'Verified Approved Qty',
          contract_line_amount: 'Approved Contract Amount',
        },
        sharingScope: 'PROJECT_SHARED',
        changeSummary: 'Added section_code, pricing_type and shared with project team',
      });
      assert.equal(rV2.status, 201, await rV2.clone().text());
      const jV2 = await rV2.json();
      assert.equal(jV2.revision.versionNumber, 2);
      assert.equal(jV2.revision.supersedesId, t1Rev1Id);
      assert.equal(jV2.revision.sharingScope, 'PROJECT_SHARED');
      t1Rev2Id = jV2.revision.id;

      // Stale expectedVersionNumber: 1 when head is now 2 -> 409 conflict
      const staleRes = await postLayouts({
        action: 'version',
        projectId: p1,
        layoutGroupId: t1GroupId,
        expectedVersionNumber: 1,
        selectedFields: ['phase_code', 'item_code'],
      });
      assert.equal(staleRes.status, 409);

      // Collaborator (s.f.ids.b, SUPER_ADMIN assigned to p1) creates v3 working subset on PROJECT_SHARED group
      const keep = actor;
      actor = { userId: s.f.ids.b, role: 'SUPER_ADMIN', sessionVersion: 7 };
      try {
        // Collaborator cannot privatize Actor A's shared layout group
        const privAttempt = await postLayouts({
          action: 'version',
          projectId: p1,
          layoutGroupId: t1GroupId,
          expectedVersionNumber: 2,
          selectedFields: ['phase_code', 'item_code', 'approved_qty'],
          sharingScope: 'PRIVATE',
        });
        assert.equal(privAttempt.status, 403);

        const rV3 = await postLayouts({
          action: 'version',
          projectId: p1,
          layoutGroupId: t1GroupId,
          expectedVersionNumber: 2,
          selectedFields: ['phase_code', 'item_code', 'work_description', 'approved_qty'],
          headingAliases: { approved_qty: 'Field Quantity' },
          sharingScope: 'PROJECT_SHARED',
          changeSummary: 'Compact working field revision v3',
        });
        assert.equal(rV3.status, 201, await rV3.clone().text());
        t1Rev3Id = (await rV3.json()).revision.id;
      } finally {
        actor = keep;
      }

      // Load historical v1 by ID and verify its exact original fields, PRIVATE scope, and heading alias remain untouched
      const loadV1 = await (
        await getLayouts(`projectId=${p1}&layoutRevisionId=${t1Rev1Id}`)
      ).json();
      assert.equal(loadV1.revision.versionNumber, 1);
      assert.equal(loadV1.revision.sharingScope, 'PRIVATE');
      assert.equal(loadV1.revision.headingAliases.approved_qty, 'Contract Approved Qty');
      assert.equal(loadV1.revisions.length, 3);
      assert.equal(loadV1.auditTrail.length, 3);

      // Preview historical v1 against snap1
      const prevV1Res = await postLayouts({
        action: 'preview',
        projectId: p1,
        sourceId: snap1,
        layoutRevisionId: t1Rev1Id,
      });
      assert.equal(prevV1Res.status, 200);
      const prevV1 = await prevV1Res.json();
      assert.equal(prevV1.layout.versionNumber, 1);
      assert.equal(prevV1.approvedLineTotal, '300000.01');
      return { t1Rev2Id, t1Rev3Id, preservedRevisions: loadV1.revisions.length };
    }
  );

  await check(
    'WP3-02-04 duplicate saved layout creates independent v1 group with duplicatedFromId provenance',
    async () => {
      const dupRes = await postLayouts({
        action: 'duplicate',
        projectId: p1,
        sourceRevisionId: t1Rev2Id,
        templateName: 'Duplicated Commercial Phase BOQ',
        sharingScope: 'PRIVATE',
        changeSummary: 'Cloned from v2 for private scenario review',
      });
      assert.equal(dupRes.status, 201, await dupRes.clone().text());
      const dupJson = await dupRes.json();
      assert.equal(dupJson.revision.versionNumber, 1);
      assert.notEqual(dupJson.revision.layoutGroupId, t1GroupId);
      assert.equal(dupJson.revision.duplicatedFromId, t1Rev2Id);
      assert.equal(dupJson.revision.supersedesId, null);
      assert.equal(dupJson.revision.sharingScope, 'PRIVATE');
      return { duplicatedLayoutId: dupJson.revision.id, duplicatedGroupId: dupJson.revision.layoutGroupId };
    }
  );

  await check(
    'WP3-02-05 controlled sharing, private isolation, viewer write denial, and role-redacted shared layout loading',
    async () => {
      // Actor A creates a strictly PRIVATE layout
      const privRes = await postLayouts({
        action: 'create',
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        templateName: 'Actor A Strictly Private Layout',
        selectedFields: ['phase_code', 'item_code', 'contract_line_amount'],
        sharingScope: 'PRIVATE',
      });
      assert.equal(privRes.status, 201);
      const privRev = (await privRes.json()).revision;

      // Actor B (even though SUPER_ADMIN on p1) cannot see, load, or duplicate Actor A's PRIVATE layout
      const keep = actor;
      actor = { userId: s.f.ids.b, role: 'SUPER_ADMIN', sessionVersion: 7 };
      try {
        assert.equal(
          (await getLayouts(`projectId=${p1}&layoutRevisionId=${privRev.id}`)).status,
          404
        );
        assert.equal(
          (
            await postLayouts({
              action: 'duplicate',
              projectId: p1,
              sourceRevisionId: privRev.id,
            })
          ).status,
          404
        );
        const listB = await (await getLayouts(`projectId=${p1}`)).json();
        assert.ok(!listB.groups.some((g: any) => g.layoutGroupId === privRev.layoutGroupId));
        // Historical v1 of t1GroupId was PRIVATE, while v2 and v3 were PROJECT_SHARED -> Actor B sees only v2 and v3!
        const sharedGrpForB = listB.groups.find((g: any) => g.layoutGroupId === t1GroupId);
        assert.ok(sharedGrpForB);
        assert.deepEqual(
          sharedGrpForB.revisions.map((r: any) => r.versionNumber),
          [3, 2]
        );
      } finally {
        actor = keep;
      }

      // s.f.ids.low as VIEWER on p1: cannot create/version/duplicate, CAN load/preview PROJECT_SHARED v2 with financial fields redacted!
      actor = { userId: s.f.ids.low, role: 'ADMIN', sessionVersion: 7 };
      try {
        const listViewer = await (await getLayouts(`projectId=${p1}`)).json();
        assert.equal(listViewer.capabilities.canWritePrivate, false);
        assert.equal(listViewer.capabilities.canShareProject, false);

        assert.equal(
          (
            await postLayouts({
              action: 'create',
              projectId: p1,
              templateCode: 'T1_PHASE_BOQ',
              templateName: 'Viewer Blocked',
              selectedFields: ['phase_code'],
            })
          ).status,
          403
        );
        assert.equal(
          (
            await postLayouts({
              action: 'duplicate',
              projectId: p1,
              sourceRevisionId: t1Rev2Id,
            })
          ).status,
          403
        );

        const loadedV2ForViewer = await (
          await getLayouts(`projectId=${p1}&layoutRevisionId=${t1Rev2Id}`)
        ).json();
        assert.ok(loadedV2ForViewer.revision.redactedFieldCount >= 2);
        assert.ok(!loadedV2ForViewer.revision.selectedFields.includes('contract_unit_rate'));
        assert.ok(!loadedV2ForViewer.revision.selectedFields.includes('contract_line_amount'));

        const prevV2Viewer = await (
          await postLayouts({
            action: 'preview',
            projectId: p1,
            sourceId: snap1,
            layoutRevisionId: t1Rev2Id,
          })
        ).json();
        assert.equal(prevV2Viewer.approvedLineTotal, null);
        assert.ok(!JSON.stringify(prevV2Viewer).includes('200000.00'));
        assert.ok(!JSON.stringify(prevV2Viewer).includes('100000.01'));
      } finally {
        actor = keep;
      }

      // Upgrade s.f.ids.low on p1 temporarily to SITE_ENGINEER (FULL accessLevel, SITE_ENGINEER projectRole):
      // Can create PRIVATE layout & duplicate shared layout as PRIVATE, but CANNOT share (PROJECT_SHARED -> 403)!
      await admin.query(
        `UPDATE "ProjectUserAssignment" SET "projectRole" = 'SITE_ENGINEER', "accessLevel" = 'STANDARD' WHERE id = $1`,
        [assignViewer]
      );
      actor = { userId: s.f.ids.low, role: 'ADMIN', sessionVersion: 7 };
      try {
        const privSiteRes = await postLayouts({
          action: 'create',
          projectId: p1,
          templateCode: 'T1_PHASE_BOQ',
          templateName: 'Site Engineer Private Layout',
          selectedFields: ['phase_code', 'item_code', 'work_description', 'approved_qty'],
          sharingScope: 'PRIVATE',
        });
        assert.equal(privSiteRes.status, 201, await privSiteRes.clone().text());

        const shareAttempt = await postLayouts({
          action: 'create',
          projectId: p1,
          templateCode: 'T1_PHASE_BOQ',
          templateName: 'Site Engineer Unauthorized Share',
          selectedFields: ['phase_code', 'item_code'],
          sharingScope: 'PROJECT_SHARED',
        });
        assert.equal(shareAttempt.status, 403);

        const editSharedAttempt = await postLayouts({
          action: 'version',
          projectId: p1,
          layoutGroupId: t1GroupId,
          expectedVersionNumber: 3,
          selectedFields: ['phase_code', 'item_code'],
          sharingScope: 'PROJECT_SHARED',
        });
        assert.equal(editSharedAttempt.status, 403);
      } finally {
        actor = keep;
        await admin.query(
          `UPDATE "ProjectUserAssignment" SET "projectRole" = 'MEMBER', "accessLevel" = 'VIEWER' WHERE id = $1`,
          [assignViewer]
        );
      }
    }
  );

  await check(
    'WP3-02-06 restricted PostgreSQL RLS and trigger enforcement blocks forged GUC, system-preset injection, UPDATE/DELETE, private leaks, and unauthorized SQL sharing',
    async () => {
      // 1. Forged GUC without valid signed proof -> 0 visible rows & INSERT rejected
      await s.transaction(restrictedClient, async () => {
        await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
        await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [s.f.ids.a]);
        await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`, []);
        await restrictedClient.query(`SELECT set_config('app.current_rls_proof', 'forged', true)`, []);
        const rows = (
          await restrictedClient.query(`SELECT id FROM "UboqTemplateDefinition" WHERE "projectId" = $1`, [p1])
        ).rows;
        assert.equal(rows.length, 0);
      });

      // 2. Signed RLS context for Actor A: UPDATE, DELETE, and isSystemPreset=true INSERT all fail with 42501
      await assert.rejects(
        () =>
          s.transaction(restrictedClient, async () => {
            const proof = mintRlsProof(p1, s.f.ids.a, 7);
            await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
            await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [s.f.ids.a]);
            await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`, []);
            await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proof]);
            await restrictedClient.query(
              `UPDATE "UboqTemplateDefinition" SET "templateName" = 'Tampered' WHERE id = $1`,
              [t1Rev2Id]
            );
          }),
        (err: any) => err.code === '42501'
      );

      await assert.rejects(
        () =>
          s.transaction(restrictedClient, async () => {
            const proof = mintRlsProof(p1, s.f.ids.a, 7);
            await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
            await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [s.f.ids.a]);
            await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`, []);
            await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proof]);
            await restrictedClient.query(`DELETE FROM "UboqTemplateDefinition" WHERE id = $1`, [t1Rev2Id]);
          }),
        (err: any) => err.code === '42501'
      );

      await assert.rejects(
        () =>
          s.transaction(restrictedClient, async () => {
            const proof = mintRlsProof(p1, s.f.ids.a, 7);
            await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
            await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [s.f.ids.a]);
            await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`, []);
            await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proof]);
            await restrictedClient.query(`DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1`, [p1]);
          }),
        (err: any) => err.code === '42501'
      );

      await assert.rejects(
        () =>
          s.transaction(restrictedClient, async () => {
            const proof = mintRlsProof(p1, s.f.ids.a, 7);
            await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
            await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [s.f.ids.a]);
            await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`, []);
            await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proof]);
            await restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(id, "projectId", "sharingScope", "templateCode", "templateName", "rowGrain", "selectedFieldsJson", "isSystemPreset", "versionNumber", "updatedAt")
               VALUES ($1, NULL, 'SYSTEM_PRESET', 'T1_PHASE_BOQ', 'Injected Preset', 'PHASE_BOQ_LINE', '["phase_code"]'::jsonb, true, 1, now())`,
              [prefix + '-INJECT-PRESET']
            );
          }),
        (err: any) => err.code === '42501'
      );

      // 3. Direct SQL SELECT as Actor B under valid signed RLS proof sees ZERO PRIVATE layouts/audits of Actor A
      await s.transaction(restrictedClient, async () => {
        const proofB = mintRlsProof(p1, s.f.ids.b, 7);
        await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
        await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [s.f.ids.b]);
        await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`, []);
        await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proofB]);
        const privDefs = (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateDefinition" WHERE "projectId" = $1 AND "sharingScope" = 'PRIVATE' AND "createdById" = $2`,
            [p1, s.f.ids.a]
          )
        ).rows;
        assert.equal(privDefs.length, 0);
        const privAudits = (
          await restrictedClient.query(
            `SELECT id FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1 AND "sharingScope" = 'PRIVATE' AND "actorUserId" = $2`,
            [p1, s.f.ids.a]
          )
        ).rows;
        assert.equal(privAudits.length, 0);
      });

      // 4. Direct SQL INSERT by VIEWER user (s.f.ids.low) is blocked by RLS WITH CHECK (42501)
      await assert.rejects(
        () =>
          s.transaction(restrictedClient, async () => {
            const proofLow = mintRlsProof(p1, s.f.ids.low, 7);
            await restrictedClient.query(`SELECT set_config('app.current_project_id', $1, true)`, [p1]);
            await restrictedClient.query(`SELECT set_config('app.current_user_id', $1, true)`, [s.f.ids.low]);
            await restrictedClient.query(`SELECT set_config('app.current_session_version', '7', true)`, []);
            await restrictedClient.query(`SELECT set_config('app.current_rls_proof', $1, true)`, [proofLow]);
            await restrictedClient.query(
              `INSERT INTO "UboqTemplateDefinition"(id, "projectId", "layoutGroupId", "sharingScope", "definitionHash", "templateCode", "templateName", "rowGrain", "selectedFieldsJson", "isSystemPreset", "versionNumber", "createdById", "updatedAt")
               VALUES ($1, $2, $3, 'PRIVATE', $4, 'T1_PHASE_BOQ', 'SQL Viewer Bypass', 'PHASE_BOQ_LINE', '["phase_code"]'::jsonb, false, 1, $5, now())`,
              [prefix + '-SQL-VIEWER', p1, prefix + '-GRP-V', s.hash('v'), s.f.ids.low]
            );
          }),
        (err: any) => err.code === '42501'
      );
    }
  );

  await check(
    'WP3-02-07 cross-project authorization negatives fail closed across layouts and formal exports',
    async () => {
      const keep = actor;
      actor = { userId: s.f.ids.low, role: 'ADMIN', sessionVersion: 7 };
      try {
        assert.equal((await getLayouts(`projectId=${p2}`)).status, 403);
        assert.equal((await getFormal(`projectId=${p2}`)).status, 403);
        assert.equal(
          (
            await postFormal({
              projectId: p2,
              templateCode: 'T1_PHASE_BOQ',
              sourceId: foreignSnap,
              format: 'json',
            })
          ).status,
          403
        );
      } finally {
        actor = keep;
      }

      // Even for SUPER_ADMIN on p1, supplying p2's sourceId or p1's layoutId against p2 fails closed (404)
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: foreignSnap,
            format: 'json',
          })
        ).status,
        404
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T0_MASTER_CONTRACT',
            sourceId: foreignContract,
            format: 'json',
          })
        ).status,
        404
      );
      assert.equal(
        (
          await postFormal({
            projectId: p2,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: foreignSnap,
            layoutRevisionId: t1Rev2Id,
            format: 'json',
          })
        ).status,
        404
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: draftSnap,
            format: 'json',
          })
        ).status,
        404
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T0_MASTER_CONTRACT',
            sourceId: draftContract,
            format: 'json',
          })
        ).status,
        404
      );
    }
  );

  await check(
    'WP3-02-08 formal T0 export contract preserves contractual pricing/VAT/amounts, records missing external agency specs, and rejects unverified agency codes',
    async () => {
      // Reject invented/unverified agency format code with 409 FORMAL_SPECIFICATION_NOT_DEFINED
      const badAgencyRes = await postFormal({
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        sourceId: c1,
        contractCode: 'DPWH_STATUTORY_AGENCY_FORM_2026',
        format: 'json',
      });
      assert.equal(badAgencyRes.status, 409);
      const badAgencyBody = await badAgencyRes.json();
      assert.equal(badAgencyBody.error, 'FORMAL_SPECIFICATION_NOT_DEFINED');
      assert.equal(
        badAgencyBody.detail.externalAgencySpecStatus,
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );

      // Validated generic ERP T0 formal JSON export using saved shared layout t0SharedRev1Id
      const t0JsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        sourceId: c1,
        layoutRevisionId: t0SharedRev1Id,
        format: 'json',
      });
      assert.equal(t0JsonRes.status, 200, await t0JsonRes.clone().text());
      assert.equal(t0JsonRes.headers.get('X-OSERP-Formal-Contract'), 'ERP_CANONICAL_T0_FORMAL_V1');
      assert.equal(
        t0JsonRes.headers.get('X-OSERP-External-Agency-Spec'),
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );
      const t0Body = await t0JsonRes.json();
      assert.equal(t0Body.formalExport, true);
      assert.deepEqual(t0Body.contract.inventedAgencyOrSignatoryFields, []);
      assert.deepEqual(t0Body.contract.missingExternalContracts, [
        'EXTERNAL_AGENCY_FORM_LAYOUT',
        'EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK',
      ]);
      assert.equal(t0Body.layout.layoutDefinitionId, t0SharedRev1Id);
      assert.equal(t0Body.layout.layoutVersionNumber, 1);
      assert.equal(t0Body.totals.originalContractAwardAmount, '560000.01');
      assert.equal(t0Body.totals.awardedRevenueExVat, '500000.01');
      assert.equal(t0Body.totals.currentApprovedContractValue, '585000.01');
      assert.equal(t0Body.pricingAndBillingBasis.pricingMethod, 'UNIT_PRICE');
      assert.equal(t0Body.pricingAndBillingBasis.contractVatBasis, 'VAT_INCLUSIVE');
      assert.equal(t0Body.pricingAndBillingBasis.taxProfileVersion, 'GOV_INFRA_VAT12@v2026.1');

      // Formal T0 XLSX & CSV
      const t0XlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        sourceId: c1,
        layoutRevisionId: t0SharedRev1Id,
        format: 'xlsx',
      });
      assert.equal(t0XlsxRes.status, 200);
      const t0XlsxBytes = Buffer.from(await t0XlsxRes.arrayBuffer());
      s.fs.writeFileSync(OUT + '/t0-formal-contract.xlsx', t0XlsxBytes);

      const t0CsvRes = await postFormal({
        projectId: p1,
        templateCode: 'T0_MASTER_CONTRACT',
        sourceId: c1,
        layoutRevisionId: t0SharedRev1Id,
        format: 'csv',
      });
      assert.equal(t0CsvRes.status, 200);
      const t0CsvText = await t0CsvRes.text();
      assert.ok(t0CsvText.includes('560000.01'));
      assert.ok(t0CsvText.includes('585000.01'));
      s.fs.writeFileSync(OUT + '/t0-formal-contract.csv', t0CsvText);

      return {
        t0XlsxSha256: s.hash(t0XlsxBytes),
        t0CsvSha256: s.hash(t0CsvText),
      };
    }
  );

  await check(
    'WP3-02-09 formal T1 export contract preserves multi-phase lines, original contractual quantities/pricing, source traceability, live SUM formula, and audit provenance',
    async () => {
      // Export using saved layout revision v2 (which includes all mandatory T1 formal fields + custom headings)
      const t1JsonRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        layoutRevisionId: t1Rev2Id,
        format: 'json',
      });
      assert.equal(t1JsonRes.status, 200, await t1JsonRes.clone().text());
      const t1Json = await t1JsonRes.json();
      assert.equal(t1Json.contract.contractCode, 'ERP_CANONICAL_T1_FORMAL_V1');
      assert.equal(t1Json.layout.layoutDefinitionId, t1Rev2Id);
      assert.equal(t1Json.layout.layoutVersionNumber, 2);
      assert.equal(t1Json.rowCount, 2);
      // Authoritative sum: 200000.00 + 100000.01 = 300000.01 (NOT overwritten by rate*qty = 299999.90!)
      assert.equal(t1Json.approvedLineTotal, '300000.01');
      assert.equal(t1Json.totals.diagnosticRateTimesApprovedQtySum, '299999.90');
      assert.equal(t1Json.totals.diagnosticLineVarianceCount, 1);
      assert.equal(t1Json.totals.phaseSubtotals.length, 2);
      assert.deepEqual(
        t1Json.projection.projectedRows.map((r: any) => r.visible.original_qty),
        ['40.0000', '35.0000']
      );
      assert.deepEqual(
        t1Json.projection.projectedRows.map((r: any) => r.visible.approved_qty),
        ['40.0000', '33.3333']
      );
      assert.deepEqual(
        t1Json.projection.projectedRows.map((r: any) => r.visible.contract_line_amount),
        ['200000.00', '100000.01']
      );

      // Export XLSX and verify worksheets, numeric cells, SUM formula, Formal_Contract_Summary, and __OSERP_META
      const t1XlsxRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        layoutRevisionId: t1Rev2Id,
        format: 'xlsx',
      });
      assert.equal(t1XlsxRes.status, 200);
      const headerSha = t1XlsxRes.headers.get('X-OSERP-Output-Sha256');
      const t1XlsxBytes = Buffer.from(await t1XlsxRes.arrayBuffer());
      assert.equal(s.hash(t1XlsxBytes), headerSha);
      s.fs.writeFileSync(OUT + '/t1-formal-boq.xlsx', t1XlsxBytes);

      const ExcelJS = require('exceljs');
      const wb = new ExcelJS.Workbook();
      await wb.xlsx.load(t1XlsxBytes);
      const mainWs = wb.getWorksheet('T1_Formal_Phase_BOQ');
      const summaryWs = wb.getWorksheet('Formal_Contract_Summary');
      const metaWs = wb.getWorksheet('__OSERP_META');
      assert.ok(mainWs && summaryWs && metaWs);
      assert.equal(metaWs.state, 'veryHidden');

      // Row 1 headings include custom alias 'Verified Approved Qty' and 'Approved Contract Amount'
      const headers = mainWs.getRow(1).values.slice(1);
      const amtColIdx = headers.indexOf('Approved Contract Amount') + 1;
      const descColIdx = headers.indexOf('Work Description') + 1;
      assert.ok(amtColIdx > 0 && descColIdx > 0);
      // Formula-like text in source ('=SUM(1,2)') is neutralized on main worksheet, NOT executable
      assert.equal(mainWs.getRow(2).getCell(descColIdx).formula, undefined);
      assert.equal(mainWs.getRow(2).getCell(descColIdx).value, "'=SUM(1,2)");
      // Numeric values on rows 2 and 3 + live SUM formula on row 4
      assert.equal(mainWs.getRow(2).getCell(amtColIdx).value, 200000);
      assert.equal(mainWs.getRow(3).getCell(amtColIdx).value, 100000.01);
      const totalCell = mainWs.getRow(4).getCell(amtColIdx);
      assert.match(String(totalCell.formula), /^SUM\([A-Z]+2:[A-Z]+3\)$/);
      assert.equal(totalCell.result, 300000.01);

      // Summary sheet records missing external agency specifications explicitly
      const summaryMap = new Map<string, string>();
      summaryWs.eachRow((row: any, idx: number) => {
        if (idx > 1) summaryMap.set(String(row.getCell(1).value), String(row.getCell(2).value));
      });
      assert.equal(
        summaryMap.get('external_agency_specification_status'),
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );
      assert.equal(summaryMap.get('invented_agency_or_signatory_fields'), 'NONE');
      assert.equal(summaryMap.get('layout_definition_id'), t1Rev2Id);
      assert.equal(summaryMap.get('layout_version_number'), '2');
      assert.equal(summaryMap.get('approved_line_total_exact'), '300000.01');

      // __OSERP_META preserves full source-field lineage
      const metaHeaders = metaWs.getRow(1).values.slice(1);
      const docCol = metaHeaders.indexOf('source_document_id') + 1;
      const cellRefCol = metaHeaders.indexOf('source_cell_ref') + 1;
      const candCol = metaHeaders.indexOf('extraction_candidate_id') + 1;
      const abiCol = metaHeaders.indexOf('awarded_boq_item_id') + 1;
      assert.equal(metaWs.getRow(2).getCell(docCol).value, srcDoc1);
      assert.equal(metaWs.getRow(2).getCell(cellRefCol).value, 'BOQ_MAIN!A12:H12');
      assert.equal(metaWs.getRow(2).getCell(candCol).value, cand1);
      assert.equal(metaWs.getRow(2).getCell(abiCol).value, awardItem1);

      // Formal T1 CSV
      const t1CsvRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        layoutRevisionId: t1Rev2Id,
        format: 'csv',
      });
      assert.equal(t1CsvRes.status, 200);
      const t1CsvText = await t1CsvRes.text();
      assert.ok(t1CsvText.includes("'=SUM(1,2)"));
      assert.ok(t1CsvText.includes('TOTAL_APPROVED_CONTRACT_BOQ'));
      assert.ok(t1CsvText.includes('300000.01'));
      s.fs.writeFileSync(OUT + '/t1-formal-boq.csv', t1CsvText);

      // Verify SensitiveExportLog + UboqTemplateAuditEvent recorded the formal exports
      const formalAuditCnt = (
        await admin.query(
          `SELECT count(*)::int AS cnt FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1 AND "eventType" = 'FORMAL_EXPORT_GENERATED'`,
          [p1]
        )
      ).rows[0].cnt;
      const sensCnt = (
        await admin.query(
          `SELECT count(*)::int AS cnt FROM "SensitiveExportLog" WHERE "projectId" = $1 AND module = 'UBOQ_FORMAL_TEMPLATES'`,
          [p1]
        )
      ).rows[0].cnt;
      assert.ok(formalAuditCnt >= 6 && sensCnt >= 6);

      return {
        t1XlsxSha256: headerSha,
        t1CsvSha256: s.hash(t1CsvText),
        formalAuditRecords: formalAuditCnt,
      };
    }
  );

  await check(
    'WP3-02-10 formal export compliance gates block open BLOCKING exceptions (VAL-19), stripped mandatory fields, version mismatches, and non-financial roles',
    async () => {
      // 1. Revision v3 omitted mandatory formal fields (original_qty, contract_unit_rate, contract_line_amount, specification) -> 409 FORMAL_MANDATORY_FIELD_MISSING
      const strippedRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        layoutRevisionId: t1Rev3Id,
        format: 'json',
      });
      assert.equal(strippedRes.status, 409);
      assert.equal((await strippedRes.json()).error, 'FORMAL_MANDATORY_FIELD_MISSING');

      // 2. Layout version mismatch (layoutGroupId=t1GroupId has head v3, requesting expectedVersionNumber=99 -> 404/409)
      const mismatchRes = await postFormal({
        projectId: p1,
        templateCode: 'T1_PHASE_BOQ',
        sourceId: snap1,
        layoutGroupId: t1GroupId,
        expectedVersionNumber: 99,
        format: 'json',
      });
      assert.ok([404, 409].includes(mismatchRes.status));

      // 3. Open BLOCKING UboqValidationException blocks formal export (409 FORMAL_OPEN_BLOCKING_EXCEPTIONS)
      const excId = prefix + '-EXC-BLOCK';
      await admin.query(
        `INSERT INTO "UboqValidationException"(id, "projectId", "snapshotId", "ruleCode", severity, "entityType", message, status)
         VALUES ($1, $2, $3, 'VAL-19-TEST', 'BLOCKING', 'SNAPSHOT', 'Synthetic open blocker', 'OPEN')`,
        [excId, p1, snap1]
      );
      try {
        const blockedRes = await postFormal({
          projectId: p1,
          templateCode: 'T1_PHASE_BOQ',
          sourceId: snap1,
          format: 'json',
        });
        assert.equal(blockedRes.status, 409);
        assert.equal((await blockedRes.json()).error, 'FORMAL_OPEN_BLOCKING_EXCEPTIONS');
      } finally {
        await admin.query(`DELETE FROM "UboqValidationException" WHERE id = $1`, [excId]);
      }

      // 4. Non-financial viewer (s.f.ids.low) denied formal export (403)
      const keep = actor;
      actor = { userId: s.f.ids.low, role: 'ADMIN', sessionVersion: 7 };
      try {
        assert.equal(
          (
            await postFormal({
              projectId: p1,
              templateCode: 'T1_PHASE_BOQ',
              sourceId: snap1,
              format: 'json',
            })
          ).status,
          403
        );
      } finally {
        actor = keep;
      }
    }
  );

  await check(
    'WP3-02-11 future T2-T12 architecture contracts, Increment 01 working-copy route, and manifest-verified synthetic cleanup remain intact',
    async () => {
      const tb = require('../../src/lib/uboq/template-builder');
      const fc = require('../../src/lib/uboq/field-catalog');
      assert.equal(Object.keys(tb.SYSTEM_TEMPLATE_PRESETS).length, 11);
      assert.equal(fc.CANONICAL_FIELD_MAP.size, 129);

      // T2 rejected on Increment 02 saved-layout & formal-export endpoints
      assert.equal(
        (
          await postLayouts({
            action: 'create',
            projectId: p1,
            templateCode: 'T2_CONSOLIDATED_BOQ',
            templateName: 'Deferred T2',
            selectedFields: ['group_code'],
          })
        ).status,
        400
      );
      assert.equal(
        (
          await postFormal({
            projectId: p1,
            templateCode: 'T2_CONSOLIDATED_BOQ',
            sourceId: snap1,
            format: 'json',
          })
        ).status,
        400
      );

      // Increment 01 working-copy endpoint still works identically
      const wRes = await workingRoute.POST(
        new NextRequest('http://localhost/api/uboq/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId: p1,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: snap1,
            format: 'json',
          }),
        })
      );
      assert.equal(wRes.status, 200);
      assert.equal((await wRes.json()).workingCopyOnly, true);

      // Verify manifest-bound synthetic cleanup (migration #17) succeeds cleanly on a synthetic project containing UboqTemplateDefinition + UboqTemplateAuditEvent rows!
      const createSynthLayout = await postLayouts({
        action: 'create',
        projectId: synthCleanupProj,
        templateCode: 'T1_PHASE_BOQ',
        templateName: 'Synthetic Cleanup Verification Layout',
        selectedFields: ['phase_code', 'item_code'],
        sharingScope: 'PRIVATE',
      });
      assert.equal(createSynthLayout.status, 201);

      const manifestRow = (
        await admin.query(`SELECT public.uboq_build_synthetic_cleanup_manifest($1) AS m`, [
          synthCleanupProj,
        ])
      ).rows[0].m;
      assert.equal(manifestRow.eligible, true, JSON.stringify(manifestRow.disqualifiers));
      assert.equal(manifestRow.closureCounts.UboqTemplateDefinition, 1);

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
      const remAudit = (
        await admin.query(
          `SELECT count(*)::int AS cnt FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1`,
          [synthCleanupProj]
        )
      ).rows[0].cnt;
      assert.equal(remAudit, 0);
      await admin.query(
        `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND "newValue" LIKE $1`,
        [`%${synthCleanupProj}%`]
      );
    }
  );

  await check(
    'WP3-02-12 canonical BOQ snapshots and contract authorities remain 100% unmutated and malformed/oversized payloads fail closed',
    async () => {
      assert.equal((await postLayouts('{')).status, 400);
      assert.equal((await postFormal('{')).status, 400);
      assert.equal((await postLayouts({ action: 'create', projectId: p1, pad: 'x'.repeat(17000) })).status, 413);
      assert.equal((await postFormal({ projectId: p1, pad: 'x'.repeat(17000) })).status, 413);

      const sourceDigestAfter = await canonicalSourceDigest();
      assert.deepEqual(sourceDigestAfter, sourceDigestBefore);
      return { canonicalSourcesUnmutated: true, sourceDigestAfter };
    }
  );

  if (process.env.WP3_BROWSER === '1') {
    await check(
      'WP3-02-13 real headless Chromium E2E verifies saved layout create/version/load/preview, formal XLSX/JSON export, client bundle isolation, and 390px mobile layout',
      async () => {
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
          /template-builder\.ts|templates\/t0-t1\.ts|templates\/saved-layouts\.ts|templates\/formal-t0-t1\.ts|exceljs|prisma/.test(
            x
          )
        );
        assert.deepEqual(serverInputs, [], 'Server-only modules entered browser bundle');

        const app = express();
        app.use(express.text({ type: '*/*', limit: '32kb' }));
        app.get('/', (_req: any, res: any) =>
          res.send(
            '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui;margin:0;padding:16px}*{box-sizing:border-box}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd}button,input,select{font:inherit}</style></head><body><h1>Contract and awarded BOQ templates</h1><div id="root"></div><script src="/bundle.js"></script></body></html>'
          )
        );
        app.get('/bundle.js', (_req: any, res: any) =>
          res.type('js').send(bundled.outputFiles[0].text)
        );

        const requests: Array<{ path: string; method: string; status: number }> = [];
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
              requests.push({ path: urlPath, method: req.method, status: out.status });
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
            viewport: { width: 1280, height: 1000 },
            acceptDownloads: true,
          });
          const consoleErrors: string[] = [];
          page.on('pageerror', (e: Error) => consoleErrors.push(e.message));
          page.on('console', (msg: any) => {
            if (msg.type() === 'error') consoleErrors.push(msg.text());
          });

          await page.goto('http://127.0.0.1:' + server.address().port);
          await page.getByLabel('Approved source', { exact: true }).waitFor();

          // Select all formal columns, customize heading, save new layout v1
          await page
            .getByRole('button', { name: 'Select all formal contract columns', exact: true })
            .click();
          await page
            .getByRole('textbox', { name: 'Approved Work Quantity', exact: true })
            .fill('Browser Approved Qty v1');
          await page.getByLabel('Layout name', { exact: true }).fill('Browser E2E Formal Layout');
          await page.getByLabel('Sharing scope', { exact: true }).selectOption('PROJECT_SHARED');
          await page.getByLabel('Revision note', { exact: true }).fill('Browser v1');
          await page.getByRole('button', { name: 'Save new layout', exact: true }).click();
          await page.getByText(/Saved layout "Browser E2E Formal Layout" v1/).waitFor();

          // Create revision v2
          await page
            .getByRole('textbox', { name: 'Approved Work Quantity', exact: true })
            .fill('Browser Approved Qty v2');
          await page.getByLabel('Revision note', { exact: true }).fill('Browser v2');
          await page
            .getByRole('button', { name: 'Save new revision (v2)', exact: true })
            .click();
          await page.getByText(/Saved revision v2 of "Browser E2E Formal Layout"/).waitFor();

          // Verify historical v1 can still be selected and loaded
          const revSelect = page.getByLabel('Revision', { exact: true });
          const options = await revSelect.locator('option').allInnerTexts();
          assert.equal(options.length, 2);
          const v1Val = await revSelect.locator('option').nth(1).getAttribute('value');
          await revSelect.selectOption(v1Val!);
          await page.getByRole('button', { name: 'Load revision', exact: true }).click();
          await page.getByText(/Loaded "Browser E2E Formal Layout" v1/).waitFor();
          assert.equal(
            await page
              .getByRole('textbox', { name: 'Approved Work Quantity', exact: true })
              .inputValue(),
            'Browser Approved Qty v1'
          );

          // Reload v2 and run Formal Preview + Formal XLSX Download
          const v2Val = await revSelect.locator('option').nth(0).getAttribute('value');
          await revSelect.selectOption(v2Val!);
          await page.getByRole('button', { name: 'Load revision', exact: true }).click();
          await page.getByText(/Loaded "Browser E2E Formal Layout" v2/).waitFor();

          await page
            .getByLabel('Formal layout identity', { exact: true })
            .selectOption('LOADED_LAYOUT');
          await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
          await page.getByRole('heading', { name: 'Formal export preview', exact: true }).waitFor();
          assert.equal(
            await page.getByText(/Approved BOQ total: 300000\.01/).count(),
            1
          );

          const [formalDl] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Download formal XLSX', exact: true }).click(),
          ]);
          const dlPath = OUT + '/browser-t1-formal.xlsx';
          await formalDl.saveAs(dlPath);
          const ExcelJS = require('exceljs');
          const wb = new ExcelJS.Workbook();
          await wb.xlsx.readFile(dlPath);
          const ws = wb.getWorksheet('T1_Formal_Phase_BOQ');
          assert.ok(ws);
          assert.ok(ws.getRow(1).values.includes('Browser Approved Qty v2'));

          await page.screenshot({ path: OUT + '/browser-t1-formal-desktop.png', fullPage: true });

          // Switch to T0_MASTER_CONTRACT, preview formal output, and verify 390px mobile responsiveness
          await page.getByLabel('Template', { exact: true }).selectOption('T0_MASTER_CONTRACT');
          await page.getByRole('button', { name: 'Preview formal output', exact: true }).click();
          await page.getByRole('heading', { name: 'Formal export preview', exact: true }).waitFor();
          await page.screenshot({ path: OUT + '/browser-t0-formal-desktop.png', fullPage: true });

          await page.setViewportSize({ width: 390, height: 844 });
          await page.screenshot({ path: OUT + '/browser-t0-formal-mobile.png', fullPage: true });
          const fitsMobile = await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1
          );
          assert.ok(fitsMobile, 'Builder overflows 390px mobile viewport');
          assert.deepEqual(consoleErrors, []);

          return {
            browser: 'Chromium headless',
            requestsCount: requests.length,
            clientBundleExcludesServerModules: true,
            consoleErrors,
            mobileViewportWidth: 390,
          };
        } finally {
          if (browser) await browser.close();
          await new Promise<void>((resolve) => server.close(() => resolve()));
        }
      }
    );
  }

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
          await admin.query(
            `DELETE FROM "SensitiveExportLog" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "AuditLog" WHERE "moduleName" IN ('UBOQ_SAVED_LAYOUTS', 'UBOQ_FORMAL_EXPORTS') AND ("newValue" LIKE $1 OR "newValue" LIKE $2 OR "newValue" LIKE $3)`,
            [`%${p1}%`, `%${p2}%`, `%${synthCleanupProj}%`]
          );
          await admin.query(
            `DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "UboqTemplateDefinition" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "UboqValidationException" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "AwardedBOQItem" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
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
            `DELETE FROM "UboqSourceDocument" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "UboqContractAuthority" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "UboqTaxPricingProfile" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(
            `DELETE FROM "ProjectUserAssignment" WHERE "projectId" IN ($1, $2, $3)`,
            [p1, p2, synthCleanupProj]
          );
          await admin.query(`DELETE FROM "Project" WHERE id IN ($1, $2, $3)`, [
            p1,
            p2,
            synthCleanupProj,
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
