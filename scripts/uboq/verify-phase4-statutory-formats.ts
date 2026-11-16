/* eslint-disable @typescript-eslint/no-explicit-any */
import { createRequire } from 'node:module';
import { NextRequest } from 'next/server';

const require = createRequire(import.meta.url);
const s = require('./g02-bounded-support.cjs');
const { assert } = s;

const OUT_PATH = 'artifacts/uboq/release-readiness/phase4-statutory-format-readiness.json';

const report: Record<string, any> = {
  project: 'OSERP-PROJ-UBOQ-001',
  phase: 'PHASE_4_STATUTORY_FORMAT_READINESS',
  evaluatedAt: new Date().toISOString(),
  checks: [],
};

function save() {
  s.fs.writeFileSync(OUT_PATH, JSON.stringify(report, null, 2) + '\n');
}

async function check(name: string, fn: () => Promise<any>) {
  const start = Date.now();
  const detail = await fn();
  report.checks.push({
    name,
    result: 'PASS',
    milliseconds: Date.now() - start,
    detail,
  });
  save();
  console.log(`PASS ${name}`);
}

let admin: any;
let prisma: any;
let originalLoad: any;
let currentActor: { userId: string; role: string; sessionVersion: number } | null = null;

const prefix = 'SYNTH-UBOQ-TEST-P4-' + s.crypto.randomBytes(4).toString('hex').toUpperCase();
const p1 = `${prefix}-PROJ`;
const uExec = `${prefix}-EXEC`;
const uNarrowedViewer = `${prefix}-NARROW`;
const uOutsider = `${prefix}-OUT`;
const tax1 = `${prefix}-TAX1`;
const ca1 = `${prefix}-CA1`;
const snap1 = `${prefix}-SNAP1`;
const doc1 = `${prefix}-DOC1`;
const boq1 = `${prefix}-BOQ1`;
const line1 = `${prefix}-LINE1`;

(async () => {
  admin = await s.connect();
  report.identity = await s.identity(admin);

  const url = (user: string, pw: string) => {
    const u = new URL('postgresql://127.0.0.1');
    u.port = String(s.config.port);
    u.pathname = '/' + s.config.database;
    u.username = user;
    u.password = pw;
    return u.toString();
  };
  process.env.DATABASE_URL = url(s.f.projectLogin, s.f.projectPw);
  process.env.DIRECT_URL = process.env.DATABASE_URL;
  process.env.UBOQ_RLS_CONTEXT_SECRET = s.f.signing;

  const Module = require('node:module');
  originalLoad = Module._load;
  Module._load = function (request: string, parent: any, isMain: boolean) {
    if (request === '@/lib/dal/auth' || request.endsWith('/lib/dal/auth')) {
      return {
        verifyOperationalSession: async () => currentActor,
      };
    }
    return originalLoad.apply(this, [request, parent, isMain]);
  };

  prisma = (await import('../../src/lib/prisma')).prisma;
  const formalMod = await import('../../src/lib/uboq/templates/formal-t0-t1');
  const formalRoute = await import('../../src/app/api/uboq/templates/formal-export/route');
  const exportRoute = await import('../../src/app/api/uboq/export/route');

  // Seed minimal synthetic approved BOQ project for working & formal statutory separation checks
  await s.transaction(admin, async () => {
    await admin.query("SET LOCAL session_replication_role = 'replica'");
    await admin.query(
      `INSERT INTO public."User"(id, email, name, password, "passwordHash", role, status, "sessionVersion", "mustChangePassword", "failedLoginAttempts", "updatedAt")
       VALUES
         ($1, $4, 'Synth P4 Exec', 'synth-disabled-hash', 'synth-disabled-hash', 'FINANCE_DIRECTOR', 'ACTIVE', 7, false, 0, now()),
         ($2, $5, 'Synth P4 Narrowed', 'synth-disabled-hash', 'synth-disabled-hash', 'FINANCE_DIRECTOR', 'ACTIVE', 7, false, 0, now()),
         ($3, $6, 'Synth P4 Outsider', 'synth-disabled-hash', 'synth-disabled-hash', 'FINANCE_DIRECTOR', 'ACTIVE', 7, false, 0, now())`,
      [
        uExec,
        uNarrowedViewer,
        uOutsider,
        `${uExec.toLowerCase()}@synth.local`,
        `${uNarrowedViewer.toLowerCase()}@synth.local`,
        `${uOutsider.toLowerCase()}@synth.local`,
      ]
    );
    await admin.query(
      `INSERT INTO public."Project"(
         id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt"
       ) VALUES ($1, 'Synth P4 Statutory Check', true, false, now())`,
      [p1]
    );
    await admin.query(
      `INSERT INTO public."ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
       VALUES
         ($1, $4, $3, 'FINANCE_DIRECTOR', 'FULL', 'ACTIVE', now()),
         ($2, $5, $3, 'MEMBER', 'VIEWER', 'ACTIVE', now())`,
      [`${prefix}-PUA1`, `${prefix}-PUA2`, p1, uExec, uNarrowedViewer]
    );
    await admin.query(
      `INSERT INTO public."UboqTaxPricingProfile"(
         id, "projectId", "profileCode", "versionCode", "sectorType",
         "outputVatRate", "salesVatCategory", "contractVatInclusive",
         "retentionRate", "advanceRecoupmentRate", "ewtRate", "govVatWithholdingRate",
         "isImmutableApproved", "approvedById", "approvedAt"
       ) VALUES ($1, $2, 'GOV_INFRA_VAT12', 'v2026.1', 'GOVERNMENT', 0.120000, 'VATABLE_12', true, 0.100000, 0.150000, 0.020000, 0.050000, true, $3, '2026-10-01T00:00:00.000Z')`,
      [tax1, p1, uExec]
    );
    await admin.query(
      `INSERT INTO public."UboqContractAuthority"(
         id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef",
         "noaRef", "ntpRef", "pricingMethod", "contractVatBasis",
         "awardedRevenue", "awardedRevenueExVat", "currentContractValue",
         "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt"
       ) VALUES ($1, $2, $3, 'GOVERNMENT', 'Internal Test Client', 'CA-P4-01', 'NOA-P4-01', 'NTP-P4-01', 'UNIT_PRICE', 'VAT_INCLUSIVE', 125000.00, 111607.14, 125000.00, 90, '2026-10-01T00:00:00.000Z', 'APPROVED', $4, '2026-10-01T00:00:00.000Z', now())`,
      [ca1, p1, tax1, uExec]
    );
    await admin.query(
      `INSERT INTO public."UboqSourceDocument"(
         id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash",
         "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable"
       ) VALUES ($1, $2, 'p4_boq.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 1024, $3, '504b0304', $4, 'CONTRACT_BOQ', $5, true)`,
      [doc1, p1, 'a'.repeat(64), `memory://${p1}/p4_boq.xlsx`, uExec]
    );
    await admin.query(
      `INSERT INTO public."UboqOperationalSnapshot"(
         id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel",
         status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt"
       ) VALUES ($1, $2, $3, $4, 1, 'P4 Baseline v1', 'APPROVED', $5, $6, $7, $7, '2026-10-01T00:00:00.000Z')`,
      [snap1, p1, doc1, ca1, 'b'.repeat(64), 'a'.repeat(64), uExec]
    );
    await admin.query(
      `INSERT INTO public."AwardedBOQItem"(
         id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost",
         "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount",
         status, "projectId", "updatedAt"
       ) VALUES ($1, '100(1)', 'STRUCTURAL', 'Structural Concrete Class A', 'm3', 100, 1250, 125000, 0, 100, 1250, 125000, 'APPROVED', $2, now())`,
      [boq1, p1]
    );
    await admin.query(
      `INSERT INTO public."UboqAwardedPhaseLine"(
         id, "projectId", "snapshotId", "awardedBoqItemId", "sourceDocumentId", "phaseCode", "sectionCode", "itemCode",
         "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized", "uomDimensionFamily", "pricingType",
         "originalQty", "approvedQty", "contractUnitRate", "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, 'PH-01', 'SEC-A', '100(1)', 'Structural Concrete Class A', '28 MPa', $6, 'cu.m', 'm3', 'VOLUME', 'UNIT_PRICE', 100.0000, 100.0000, 1250.0000, 125000.00, 111607.14, 'SOURCE_NOT_PROVIDED', now())`,
      [line1, p1, snap1, boq1, doc1, 'c'.repeat(64)]
    );
  });

  await check(
    'P4-01 All 6 formal contracts retain internal ERP generic contract codes and reject DPWH/COA/BIR statutory contract codes fail-closed (409)',
    async () => {
      const contracts = Object.values(formalMod.FORMAL_EXPORT_CONTRACTS);
      assert.equal(contracts.length, 6);
      for (const spec of contracts) {
        assert.match(spec.contractCode, /^ERP_CANONICAL_T(?:0|1|4|5|6|11)_FORMAL_V1$/);
        assert.equal(
          spec.externalAgencySpecStatus,
          'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
        );
        assert.deepEqual(spec.inventedAgencyOrSignatoryFields, []);
        assert.ok(spec.missingExternalContracts.includes('EXTERNAL_AGENCY_FORM_LAYOUT'));
        assert.ok(spec.missingExternalContracts.includes('EXTERNAL_SIGNATORY_AND_APPROVAL_BLOCK'));
      }

      currentActor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      for (const disabled of exportRoute.DISABLED_EXTERNAL_STATUTORY_FORMATS) {
        const req = new NextRequest('http://localhost/api/uboq/templates/formal-export', {
          method: 'POST',
          body: JSON.stringify({
            projectId: p1,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: snap1,
            format: 'json',
            contractCode: disabled.code,
          }),
        });
        const res = await formalRoute.POST(req);
        assert.equal(res.status, 409, `Expected 409 for disabled statutory format ${disabled.code}`);
        const body = await res.json();
        assert.equal(body.error, 'FORMAL_SPECIFICATION_NOT_DEFINED');
        assert.equal(
          body.detail?.externalAgencySpecStatus,
          'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
        );
      }

      // Unsupported statutory option key on formal-export rejected 400
      const badOptRes = await formalRoute.POST(
        new NextRequest('http://localhost/api/uboq/templates/formal-export', {
          method: 'POST',
          body: JSON.stringify({
            projectId: p1,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: snap1,
            format: 'json',
            statutoryFormat: 'DPWH_POW',
          }),
        })
      );
      assert.equal(badOptRes.status, 400);
      assert.equal((await badOptRes.json()).error, 'FORMAL_UNSUPPORTED_OPTION');

      // Non-formal T3_AGENCY_ESTIMATE rejected 400 on formal-export
      const t3FormalRes = await formalRoute.POST(
        new NextRequest('http://localhost/api/uboq/templates/formal-export', {
          method: 'POST',
          body: JSON.stringify({
            projectId: p1,
            templateCode: 'T3_AGENCY_ESTIMATE',
            sourceId: snap1,
            format: 'json',
          }),
        })
      );
      assert.equal(t3FormalRes.status, 400);
      assert.equal((await t3FormalRes.json()).error, 'FORMAL_TEMPLATE_CODE_NOT_SUPPORTED');

      return {
        internalFormalContractsVerified: contracts.map((c: any) => c.contractCode),
        disabledStatutoryCodesRejected409: exportRoute.DISABLED_EXTERNAL_STATUTORY_FORMATS.length,
      };
    }
  );

  await check(
    'P4-02 Working export route (GET /api/uboq/export) rejects DPWH/COA/BIR statutory codes, statutory query params, formal=true bypass, and unauthenticated/unauthorized callers',
    async () => {
      currentActor = null;
      const unauth = await exportRoute.GET(
        new NextRequest(`http://localhost/api/uboq/export?projectId=${p1}&templateCode=T1_PHASE_BOQ&format=csv`)
      );
      assert.equal(unauth.status, 401);

      currentActor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };

      // 1) formal=true bypass rejected 409
      const formalBypass = await exportRoute.GET(
        new NextRequest(
          `http://localhost/api/uboq/export?projectId=${p1}&templateCode=T1_PHASE_BOQ&format=csv&formal=true`
        )
      );
      assert.equal(formalBypass.status, 409);
      const fbBody = await formalBypass.json();
      assert.equal(fbBody.error, 'WORKING_EXPORT_FORMAL_MODE_DISABLED');
      assert.equal(fbBody.statutoryCertificationClaimed, false);

      // 2) Statutory templateCode values rejected 409 (never silently falling back to T1_PHASE_BOQ!)
      for (const code of [
        'DPWH_POW_PROGRAM_OF_WORKS',
        'DPWH_DUPA_DETAILED_UNIT_PRICE_ANALYSIS',
        'DPWH_SWA_STATEMENT_OF_WORK_ACCOMPLISHED',
        'DPWH_VARIATION_ORDER_AGENCY_FORM',
        'COA_DISBURSEMENT_AND_INSPECTION_CERTIFICATE',
        'BIR_EXTERNAL_TAX_CERTIFICATE_FORM',
      ]) {
        const res = await exportRoute.GET(
          new NextRequest(
            `http://localhost/api/uboq/export?projectId=${p1}&templateCode=${code}&format=xlsx`
          )
        );
        assert.equal(res.status, 409, `Statutory code ${code} must be 409 disabled`);
        const body = await res.json();
        assert.equal(body.error, 'EXTERNAL_STATUTORY_EXPORT_DISABLED_SPEC_ABSENT');
        assert.equal(body.statutoryCertificationClaimed, false);
      }

      // 3) Statutory query params rejected 409
      for (const qp of ['statutoryFormat=DPWH_POW', 'coa=1', 'certification=COA_VERIFIED']) {
        const res = await exportRoute.GET(
          new NextRequest(
            `http://localhost/api/uboq/export?projectId=${p1}&templateCode=T1_PHASE_BOQ&format=csv&${qp}`
          )
        );
        assert.equal(res.status, 409);
        assert.equal((await res.json()).error, 'EXTERNAL_STATUTORY_EXPORT_DISABLED_SPEC_ABSENT');
      }

      // 4) Unknown non-statutory templateCode rejected 400
      const unk = await exportRoute.GET(
        new NextRequest(
          `http://localhost/api/uboq/export?projectId=${p1}&templateCode=UNKNOWN_TEMPLATE_99&format=csv`
        )
      );
      assert.equal(unk.status, 400);
      assert.equal((await unk.json()).error, 'TEMPLATE_CODE_NOT_SUPPORTED');

      // 5) Outsider denied 403
      currentActor = { userId: uOutsider, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const outRes = await exportRoute.GET(
        new NextRequest(
          `http://localhost/api/uboq/export?projectId=${p1}&templateCode=T1_PHASE_BOQ&format=csv`
        )
      );
      assert.equal(outRes.status, 403);

      return {
        unauthRejected401: true,
        formalBypassRejected409: true,
        statutoryTemplateCodesRejected409: 6,
        statutoryQueryParamsRejected409: 3,
        unknownTemplateRejected400: true,
        outsiderRejected403: true,
      };
    }
  );

  await check(
    'P4-03 Valid internal ERP working export stamps non-statutory headers, logs SensitiveExportLog for commercial roles, and redacts restricted fields for VIEWER-narrowed actors',
    async () => {
      // 1) Authorized COMMERCIAL_DIRECTOR working export
      currentActor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const okRes = await exportRoute.GET(
        new NextRequest(
          `http://localhost/api/uboq/export?projectId=${p1}&templateCode=T1_PHASE_BOQ&format=csv`
        )
      );
      assert.equal(okRes.status, 200);
      assert.equal(
        okRes.headers.get('X-OSERP-Export-Scope'),
        'INTERNAL_ERP_WORKING_EXPORT_ONLY'
      );
      assert.equal(
        okRes.headers.get('X-OSERP-External-Agency-Spec'),
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );
      assert.equal(
        okRes.headers.get('X-OSERP-Statutory-Certification'),
        'NONE_INTERNAL_ERP_ONLY'
      );
      assert.match(okRes.headers.get('Content-Disposition') || '', /_INTERNAL_WORKING\.csv"/);
      const csvText = await okRes.text();
      assert.match(csvText, /125000/);

      // Sensitive template export (T10_EXECUTIVE_MARGIN includes sensitive target_profit / forecast_profit) logs SensitiveExportLog
      const sensRes = await exportRoute.GET(
        new NextRequest(
          `http://localhost/api/uboq/export?projectId=${p1}&templateCode=T10_EXECUTIVE_MARGIN&format=csv`
        )
      );
      assert.equal(sensRes.status, 200);
      assert.equal(
        sensRes.headers.get('X-OSERP-Export-Scope'),
        'INTERNAL_ERP_WORKING_EXPORT_ONLY'
      );

      const sensCount = Number(
        (
          await admin.query(
            `SELECT COUNT(*)::int AS n FROM public."SensitiveExportLog" WHERE "projectId" = $1 AND "userId" = $2 AND approved = true`,
            [p1, uExec]
          )
        ).rows[0].n
      );
      assert.equal(sensCount, 1);

      // 2) Commercial actor narrowed to VIEWER assignment receives redacted public columns only
      currentActor = { userId: uNarrowedViewer, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const viewerRes = await exportRoute.GET(
        new NextRequest(
          `http://localhost/api/uboq/export?projectId=${p1}&templateCode=T1_PHASE_BOQ&format=csv`
        )
      );
      assert.equal(viewerRes.status, 200);
      const viewerCsv = await viewerRes.text();
      assert.doesNotMatch(viewerCsv, /contract_unit_rate|contract_line_amount|125000/);
      assert.match(viewerCsv, /Structural Concrete Class A/);

      // 3) Valid internal formal export on POST /api/uboq/templates/formal-export explicitly declares AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED
      currentActor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 7 };
      const formalOk = await formalRoute.POST(
        new NextRequest('http://localhost/api/uboq/templates/formal-export', {
          method: 'POST',
          body: JSON.stringify({
            projectId: p1,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: snap1,
            format: 'json',
          }),
        })
      );
      assert.equal(formalOk.status, 200);
      assert.equal(
        formalOk.headers.get('X-OSERP-External-Agency-Spec'),
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );
      const formalJson = await formalOk.json();
      assert.equal(
        formalJson.contract.externalAgencySpecStatus,
        'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED'
      );
      assert.deepEqual(formalJson.contract.inventedAgencyOrSignatoryFields, []);

      return {
        internalWorkingHeadersVerified: true,
        sensitiveExportAuditLogged: true,
        viewerAssignmentRedacted: true,
        internalFormalNonStatutoryProvenanceVerified: true,
      };
    }
  );

  // Verify all 13 R2 accepted source hashes remain 100% unchanged
  const r2Refs = JSON.parse(
    s.fs.readFileSync('artifacts/uboq/wp3/batch-d-d2-r3/r2-evidence-references.json', 'utf8')
  );
  for (const src of r2Refs.acceptedSources) {
    assert.equal(
      s.hash(s.fs.readFileSync(src.path)),
      src.sha256,
      `R2 accepted source modified unexpectedly: ${src.path}`
    );
  }

  report.overallDisposition = 'PASS_INTERNAL_ERP_SEPARATED_EXTERNAL_STATUTORY_DISABLED';
  report.statutoryCertificationClaimed = false;
  report.disabledExternalStatutoryFormats = exportRoute.DISABLED_EXTERNAL_STATUTORY_FORMATS;
  report.enabledInternalFormalContracts = Object.values(formalMod.FORMAL_EXPORT_CONTRACTS).map(
    (c: any) => ({
      templateCode: c.templateCode,
      contractCode: c.contractCode,
      externalAgencySpecStatus: c.externalAgencySpecStatus,
    })
  );
  report.r2AcceptedSourcesUnchanged = r2Refs.acceptedSources.length;
  save();
})()
  .catch((err) => {
    console.error(err);
    report.overallDisposition = 'FAIL';
    report.error = { message: err?.message || String(err) };
    save();
    process.exitCode = 1;
  })
  .finally(async () => {
    if (originalLoad) require('node:module')._load = originalLoad;
    if (prisma) await prisma.$disconnect();
    if (admin) {
      try {
        await s.transaction(admin, async () => {
          await admin.query("SET LOCAL session_replication_role = 'replica'");
          await admin.query(`DELETE FROM public."SensitiveExportLog" WHERE "projectId" = $1`, [p1]);
          await admin.query(
            `DELETE FROM public."AuditLog" WHERE "userId" = ANY($1::text[]) OR "newValue" LIKE $2`,
            [[uExec, uNarrowedViewer, uOutsider], `%${prefix}%`]
          );
          await admin.query(`DELETE FROM public."UboqTemplateAuditEvent" WHERE "projectId" = $1`, [
            p1,
          ]);
          await admin.query(`DELETE FROM public."UboqAwardedPhaseLine" WHERE "projectId" = $1`, [
            p1,
          ]);
          await admin.query(`DELETE FROM public."AwardedBOQItem" WHERE "projectId" = $1`, [p1]);
          await admin.query(`DELETE FROM public."UboqOperationalSnapshot" WHERE "projectId" = $1`, [
            p1,
          ]);
          await admin.query(`DELETE FROM public."UboqSourceDocument" WHERE "projectId" = $1`, [p1]);
          await admin.query(`DELETE FROM public."UboqContractAuthority" WHERE "projectId" = $1`, [
            p1,
          ]);
          await admin.query(`DELETE FROM public."UboqTaxPricingProfile" WHERE "projectId" = $1`, [
            p1,
          ]);
          await admin.query(`DELETE FROM public."ProjectUserAssignment" WHERE "projectId" = $1`, [
            p1,
          ]);
          await admin.query(`DELETE FROM public."Project" WHERE id = $1`, [p1]);
          await admin.query(`DELETE FROM public."User" WHERE id = ANY($1::text[])`, [
            [uExec, uNarrowedViewer, uOutsider],
          ]);
        });
        const residue = Number(
          (
            await admin.query(`SELECT COUNT(*)::int AS n FROM public."Project" WHERE id = $1`, [p1])
          ).rows[0].n
        );
        report.syntheticResidueCount = residue;
        save();
      } finally {
        await admin.end();
      }
    }
    setTimeout(() => process.exit(process.exitCode || 0), 100).unref();
  });
