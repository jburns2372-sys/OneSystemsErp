/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-require-imports */
/**
 * WP-3 Batch C — R2 Final Control Hardening Verification Suite
 * Covers:
 *   - WP3-BC-IR-R2-01: SensitiveExportLog non-spoofable function-only authority + cryptographic payload attestation + T0/T1 formal & T8-T10 working preservation
 *   - WP3-BC-IR-R2-02: UboqClientReceipt & UboqClientReceiptAllocation finance verifier authority, anti-forgery, and post-seal immutability
 *   - WP3-BC-IR-R2-03: Unbound project-wide UboqContractorTargetBudget ambiguity rejection across multiple approved snapshots
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const s = require('./g02-bounded-support.cjs');

const OUT_DIR = path.resolve(process.cwd(), 'artifacts/uboq/wp3/batch-c');
const OUT_JSON = path.join(OUT_DIR, 'r2-targeted-tests.json');

interface FindingCheckResult {
  findingId: string;
  title: string;
  result: 'PASS' | 'FAIL';
  durationMs: number;
  detail?: Record<string, unknown>;
  error?: string;
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const admin = await s.connect();
  let restrictedClient: any = null;
  let originalLoad: any = null;
  let workingRoute: any = null;
  let formalRoute: any = null;
  let NextRequest: any = null;
  let actor: { userId: string; role: string; sessionVersion: number } | null = null;

  const hexId = crypto.randomBytes(3).toString('hex');
  const prefix = `SYNTH-WP3-BCR2-${hexId}`;

  const uExec = `${prefix}-USR-EXEC`;
  const uAcct = `${prefix}-USR-ACCT`;
  const uPm = `${prefix}-USR-PM`;
  const uSite = `${prefix}-USR-SITE`;
  const uViewer = `${prefix}-USR-VIEW`;
  const uNarrowExec = `${prefix}-USR-NARROW`;

  const pAudit = `${prefix}-PRJ-AUDIT`;
  const pRcpt = `${prefix}-PRJ-RCPT`;
  const pSingle = `${prefix}-PRJ-SINGLE`;
  const pMulti = `${prefix}-PRJ-MULTI`;

  const caAudit = `${prefix}-CA-AUDIT`;
  const caRcpt = `${prefix}-CA-RCPT`;
  const caSingle = `${prefix}-CA-SINGLE`;
  const caMulti = `${prefix}-CA-MULTI`;

  const srcDocAudit = `${prefix}-DOC-AUDIT`;

  const snapAudit = `${prefix}-SNAP-AUDIT`;
  const snapRcpt = `${prefix}-SNAP-RCPT`;
  const snapSingle = `${prefix}-SNAP-SINGLE`;
  const snapMultiV1 = `${prefix}-SNAP-MULTI-V1`;
  const snapMultiV2 = `${prefix}-SNAP-MULTI-V2`;

  const boqAudit = `${prefix}-BOQ-AUDIT`;
  const boqRcpt = `${prefix}-BOQ-RCPT`;
  const boqSingle = `${prefix}-BOQ-SINGLE`;
  const boqMulti1 = `${prefix}-BOQ-MULTI-1`;
  const boqMulti2 = `${prefix}-BOQ-MULTI-2`;

  const plAudit = `${prefix}-PL-AUDIT`;
  const plRcpt = `${prefix}-PL-RCPT`;
  const plSingle = `${prefix}-PL-SINGLE`;
  const plMultiV1 = `${prefix}-PL-MULTI-V1`;
  const plMultiV2A = `${prefix}-PL-MULTI-V2A`;
  const plMultiV2B = `${prefix}-PL-MULTI-V2B`;

  const cfpAudit1 = `${prefix}-CFP-AUD1`;
  const cfpAudit2 = `${prefix}-CFP-AUD2`;
  const cfpRcpt1 = `${prefix}-CFP-RCP1`;
  const cfpRcpt2 = `${prefix}-CFP-RCP2`;

  const checks: FindingCheckResult[] = [];
  const check = async (
    findingId: string,
    title: string,
    fn: () => Promise<Record<string, unknown>>
  ) => {
    const t0 = Date.now();
    try {
      const detail = await fn();
      const durationMs = Date.now() - t0;
      checks.push({ findingId, title, result: 'PASS', durationMs, detail });
      console.log(`PASS [${findingId}] ${title} (${durationMs}ms)`);
    } catch (err: any) {
      const durationMs = Date.now() - t0;
      const msg = err instanceof Error ? err.stack || err.message : String(err);
      checks.push({ findingId, title, result: 'FAIL', durationMs, error: msg });
      console.error(`FAIL [${findingId}] ${title}: ${msg}`);
    }
  };

  const tableHashes = async (): Promise<Record<string, string>> => {
    const tbls = (
      await admin.query(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename ASC`
      )
    ).rows.map((r: any) => r.tablename as string);
    const out: Record<string, string> = {};
    for (const t of tbls) {
      const rows = (
        await admin.query(`SELECT row_to_json(x)::text AS j FROM public."${t}" x ORDER BY 1 ASC`)
      ).rows;
      const h = crypto.createHash('sha256');
      for (const r of rows) h.update(r.j + '\n');
      out[t] = `${rows.length}:${h.digest('hex')}`;
    }
    return out;
  };

  const withSignedRestrictedTx = async <T>(
    projectId: string,
    userId: string,
    sv: number,
    fn: () => Promise<T>
  ): Promise<T> => {
    await restrictedClient.query('BEGIN');
    try {
      await s.project(restrictedClient, projectId, userId, sv);
      const res = await fn();
      await restrictedClient.query('COMMIT');
      return res;
    } catch (err) {
      await restrictedClient.query('ROLLBACK');
      throw err;
    }
  };

  let beforeTables: Record<string, string> = {};
  let afterTables: Record<string, string> = {};
  let identity: any = null;

  try {
    identity = await s.identity(admin);
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
    const sigConcrete = computeSpecSignatureHash('Concrete Works', '3500 psi');
    const sigSteel = computeSpecSignatureHash('Grade 60 Rebar', 'ASTM A615');

    await s.transaction(admin, async () => {
      await admin.query("SET LOCAL session_replication_role='replica'");

      for (const [uid, role] of [
        [uExec, 'FINANCE_DIRECTOR'],
        [uAcct, 'ACCOUNTANT'],
        [uPm, 'PROJECT_MANAGER'],
        [uSite, 'SITE_ENGINEER'],
        [uViewer, 'EXTERNAL_VIEWER'],
        [uNarrowExec, 'FINANCE_DIRECTOR'],
      ]) {
        await admin.query(
          `INSERT INTO "User"(id, email, name, password, role, status, "sessionVersion", "updatedAt")
           VALUES ($1, $2, $1, 'synth-disabled-hash', $3, 'ACTIVE', 11, now())`,
          [uid, `${uid.toLowerCase()}@synthetic.local`, role]
        );
      }

      for (const p of [pAudit, pRcpt, pSingle, pMulti]) {
        await admin.query(
          `INSERT INTO "Project"(id, name, "uboqGovernanceEnabled", "isSyntheticTestFixture", "updatedAt")
           VALUES ($1, $1, true, false, now())`,
          [p]
        );
      }

      const assignments = [
        [prefix + '-ASN-1', uExec, pAudit, 'FINANCE_DIRECTOR', 'FULL'],
        [prefix + '-ASN-2', uPm, pAudit, 'PROJECT_MANAGER', 'FULL'],
        [prefix + '-ASN-3', uSite, pAudit, 'SITE_ENGINEER', 'STANDARD'],
        [prefix + '-ASN-4', uExec, pRcpt, 'FINANCE_DIRECTOR', 'FULL'],
        [prefix + '-ASN-5', uAcct, pRcpt, 'ACCOUNTANT', 'FULL'],
        [prefix + '-ASN-6', uPm, pRcpt, 'PROJECT_MANAGER', 'FULL'],
        [prefix + '-ASN-7', uSite, pRcpt, 'SITE_ENGINEER', 'STANDARD'],
        [prefix + '-ASN-8', uViewer, pRcpt, 'VIEWER', 'VIEW_ONLY'],
        [prefix + '-ASN-9', uNarrowExec, pRcpt, 'VIEWER', 'VIEW_ONLY'],
        [prefix + '-ASN-10', uExec, pSingle, 'FINANCE_DIRECTOR', 'FULL'],
        [prefix + '-ASN-11', uExec, pMulti, 'FINANCE_DIRECTOR', 'FULL'],
      ];
      for (const [id, uid, pid, pRole, accLvl] of assignments) {
        await admin.query(
          `INSERT INTO "ProjectUserAssignment"(id, "userId", "projectId", "projectRole", "accessLevel", "assignmentStatus", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, 'ACTIVE', now())`,
          [id, uid, pid, pRole, accLvl]
        );
      }

      await admin.query(
        `INSERT INTO "UboqSourceDocument"(id, "projectId", "fileName", "mimeType", "byteSize", "sha256Hash", "magicSignature", "storageUri", "documentRole", "uploadedById", "isLockedImmutable")
         VALUES ($1, $2, 'r2-audit-boq.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 4096, $3, '504b0304', 'memory://r2-audit', 'CONTRACT_BOQ', $4, true)`,
        [srcDocAudit, pAudit, s.hash(srcDocAudit), uExec]
      );

      await admin.query(
        `INSERT INTO "UboqContractAuthority"(id, "projectId", "taxProfileId", "sectorType", "clientName", "contractRef", "pricingMethod", "contractVatBasis", "awardedRevenue", "awardedRevenueExVat", "currentContractValue", "contractDurationDays", "commencementDate", status, "approvedById", "approvedAt", "updatedAt")
         VALUES
           ($1, $5, NULL, 'PRIVATE', 'R2 Audit Client',  'CA-R2-AUD',    'UNIT_PRICE', 'ZERO_RATED', 200000.00, 200000.00, 200000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $9, '2026-08-02T00:00:00.000Z', now()),
           ($2, $6, NULL, 'PRIVATE', 'R2 Rcpt Client',   'CA-R2-RCPT',   'UNIT_PRICE', 'ZERO_RATED', 200000.00, 200000.00, 200000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $9, '2026-08-02T00:00:00.000Z', now()),
           ($3, $7, NULL, 'PRIVATE', 'R2 Single Client', 'CA-R2-SINGLE', 'UNIT_PRICE', 'ZERO_RATED', 200000.00, 200000.00, 200000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $9, '2026-08-02T00:00:00.000Z', now()),
           ($4, $8, NULL, 'PRIVATE', 'R2 Multi Client',  'CA-R2-MULTI',  'UNIT_PRICE', 'ZERO_RATED', 300000.00, 300000.00, 300000.00, 90, '2026-09-01T00:00:00.000Z', 'APPROVED', $9, '2026-08-02T00:00:00.000Z', now())`,
        [caAudit, caRcpt, caSingle, caMulti, pAudit, pRcpt, pSingle, pMulti, uExec]
      );

      await admin.query(
        `INSERT INTO "UboqOperationalSnapshot"(id, "projectId", "sourceDocumentId", "contractAuthorityId", "versionNumber", "versionLabel", status, "canonicalHash", "sourceEvidenceHash", "preparedById", "approvedById", "approvedAt")
         VALUES
           ($1, $6, $10, $11, 1, 'R2 Audit v1',  'APPROVED', $15, $20, $21, $21, '2026-08-05T00:00:00.000Z'),
           ($2, $7, NULL,$12, 1, 'R2 Rcpt v1',   'APPROVED', $16, NULL,$21, $21, '2026-08-05T00:00:00.000Z'),
           ($3, $8, NULL,$13, 1, 'R2 Single v1', 'APPROVED', $17, NULL,$21, $21, '2026-08-05T00:00:00.000Z'),
           ($4, $9, NULL,$14, 1, 'R2 Multi v1',  'APPROVED', $18, NULL,$21, $21, '2026-08-04T00:00:00.000Z'),
           ($5, $9, NULL,$14, 2, 'R2 Multi v2',  'APPROVED', $19, NULL,$21, $21, '2026-08-06T00:00:00.000Z')`,
        [
          snapAudit,
          snapRcpt,
          snapSingle,
          snapMultiV1,
          snapMultiV2,
          pAudit,
          pRcpt,
          pSingle,
          pMulti,
          srcDocAudit,
          caAudit,
          caRcpt,
          caSingle,
          caMulti,
          s.hash(snapAudit),
          s.hash(snapRcpt),
          s.hash(snapSingle),
          s.hash(snapMultiV1),
          s.hash(snapMultiV2),
          s.hash(srcDocAudit),
          uExec,
        ]
      );

      await admin.query(
        `INSERT INTO "AwardedBOQItem"(id, "itemCode", category, description, unit, quantity, "combinedUnitCost", "totalCost", "approvedClientVoQuantity", "revisedContractQuantity", "revisedContractUnitPrice", "revisedContractAmount", status, "projectId", "updatedAt")
         VALUES
           ($1, 'A-01', 'CIVIL', 'Audit Concrete Works', 'm3', 40,   5000, 200000, 0, 40,   5000, 200000, 'APPROVED', $6, now()),
           ($2, 'R-01', 'CIVIL', 'Rcpt Concrete Works',  'm3', 40,   5000, 200000, 0, 40,   5000, 200000, 'APPROVED', $7, now()),
           ($3, 'S-01', 'CIVIL', 'Single Concrete Works','m3', 40,   5000, 200000, 0, 40,   5000, 200000, 'APPROVED', $8, now()),
           ($4, 'M-01', 'CIVIL', 'Multi Concrete Works', 'm3', 36,   5000, 180000, 0, 36,   5000, 180000, 'APPROVED', $9, now()),
           ($5, 'M-02', 'STEEL', 'Grade 60 Rebar',       'kg', 2000, 60,   120000, 0, 2000, 60,   120000, 'APPROVED', $9, now())`,
        [boqAudit, boqRcpt, boqSingle, boqMulti1, boqMulti2, pAudit, pRcpt, pSingle, pMulti]
      );

      await admin.query(
        `INSERT INTO "UboqAwardedPhaseLine"(
           id, "projectId", "snapshotId", "awardedBoqItemId", "sourceDocumentId", "itemCode", "phaseCode", "sectionCode",
           "workDescription", specification, "specSignatureHash", "unitRaw", "unitNormalized",
           "uomDimensionFamily", "pricingType", "originalQty", "approvedQty", "contractUnitRate",
           "contractLineAmount", "contractAmountExVat", "agencyEstimateStatus", "updatedAt"
         )
         VALUES
           ($1, $7,  $11, $16, $21,  'A-01', 'PH-1', 'SEC', 'Concrete Works', '3500 psi',  $22, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 40,   40,   5000, 200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
           ($2, $8,  $12, $17, NULL, 'R-01', 'PH-1', 'SEC', 'Concrete Works', '3500 psi',  $22, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 40,   40,   5000, 200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
           ($3, $9,  $13, $18, NULL, 'S-01', 'PH-1', 'SEC', 'Concrete Works', '3500 psi',  $22, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 40,   40,   5000, 200000.00, 200000.00, 'SOURCE_NOT_PROVIDED', now()),
           ($4, $10, $14, $19, NULL, 'M-01', 'PH-1', 'SEC', 'Concrete Works', '3500 psi',  $22, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 36,   36,   5000, 180000.00, 180000.00, 'SOURCE_NOT_PROVIDED', now()),
           ($5, $10, $15, $19, NULL, 'M-01', 'PH-1', 'SEC', 'Concrete Works', '3500 psi',  $22, 'm3', 'm3', 'VOLUME', 'UNIT_PRICE', 36,   36,   5000, 180000.00, 180000.00, 'SOURCE_NOT_PROVIDED', now()),
           ($6, $10, $15, $20, NULL, 'M-02', 'PH-1', 'SEC', 'Grade 60 Rebar', 'ASTM A615', $23, 'kg', 'kg', 'MASS',   'UNIT_PRICE', 2000, 2000, 60,   120000.00, 120000.00, 'SOURCE_NOT_PROVIDED', now())`,
        [
          plAudit,
          plRcpt,
          plSingle,
          plMultiV1,
          plMultiV2A,
          plMultiV2B,
          pAudit,
          pRcpt,
          pSingle,
          pMulti,
          snapAudit,
          snapRcpt,
          snapSingle,
          snapMultiV1,
          snapMultiV2,
          boqAudit,
          boqRcpt,
          boqSingle,
          boqMulti1,
          boqMulti2,
          srcDocAudit,
          sigConcrete,
          sigSteel,
        ]
      );

      await admin.query(
        `INSERT INTO "UboqCashFlowPeriod"(id, "projectId", "snapshotId", "periodType", "periodIndex", "periodLabel", "quarterLabel", "periodStart", "periodEnd", "plannedValueWeightAmt")
         VALUES
           ($1, $5, $7, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 100000.00),
           ($2, $5, $7, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-16T00:00:00.000Z', '2026-09-30T23:59:59.999Z', 100000.00),
           ($3, $6, $8, 'HALF_MONTH', 1, '2026-09-H1', '2026-Q3', '2026-09-01T00:00:00.000Z', '2026-09-15T23:59:59.999Z', 100000.00),
           ($4, $6, $8, 'HALF_MONTH', 2, '2026-09-H2', '2026-Q3', '2026-09-16T00:00:00.000Z', '2026-09-30T23:59:59.999Z', 100000.00)`,
        [cfpAudit1, cfpAudit2, cfpRcpt1, cfpRcpt2, pAudit, pRcpt, snapAudit, snapRcpt]
      );
    });

    actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 11 };
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
      formalRoute = require('../../src/app/api/uboq/templates/formal-export/route');
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

    const postFormal = (body: any) =>
      formalRoute.POST(
        new NextRequest('http://localhost/api/uboq/templates/formal-export', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
          body: JSON.stringify(body),
        })
      );

    // =========================================================================
    // 1. WP3-BC-IR-R2-01: SensitiveExportLog Audit Authority
    // =========================================================================
    await check(
      'WP3-BC-IR-R2-01',
      'Signed executive raw SQL INSERT (even with custom GUC set) & unattested SQL function calls denied; legitimate T0/T1 formal and T8-T10 working exports succeed with cryptographic SHA-256 provenance',
      async () => {
        const tbAudit = `${prefix}-TB-AUD`;
        try {
          await s.transaction(admin, async () => {
            await admin.query("SET LOCAL session_replication_role='replica'");
            await admin.query(
              `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "updatedAt")
               VALUES ($1, $2, $3, $4, 1, 130000.00, 150000.00, 50000.00, 0.250000, 0.00, 150000.00, 150000.00, 50000.00, $5, '2026-08-10T00:00:00.000Z', now())`,
              [tbAudit, pAudit, snapAudit, plAudit, uExec]
            );
          });

          // Verify table ACL: oserp_compat_app holds ZERO direct INSERT/UPDATE/DELETE privileges
          const aclRow = (
            await admin.query(
              `SELECT
                 has_table_privilege('oserp_compat_app', 'public."SensitiveExportLog"', 'SELECT') AS can_select,
                 has_table_privilege('oserp_compat_app', 'public."SensitiveExportLog"', 'INSERT') AS can_insert,
                 has_table_privilege('oserp_compat_app', 'public."SensitiveExportLog"', 'UPDATE') AS can_update,
                 has_table_privilege('oserp_compat_app', 'public."SensitiveExportLog"', 'DELETE') AS can_delete`
            )
          ).rows[0];
          assert.equal(aclRow.can_select, true);
          assert.equal(aclRow.can_insert, false);
          assert.equal(aclRow.can_update, false);
          assert.equal(aclRow.can_delete, false);

          // Negative 1A: Signed FINANCE_DIRECTOR sets custom session GUC manually + attempts direct SQL INSERT -> DENIED!
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pAudit, uExec, 11, async () => {
                await restrictedClient.query(
                  `SELECT set_config('app.uboq_sensitive_export_fn_active', 'on', true)`
                );
                await restrictedClient.query(
                  `INSERT INTO "SensitiveExportLog"(id, "userId", "projectId", module, "exportType", "recordCount", "dataClassification", approved, blocked, reason)
                   VALUES ($1, $2, $3, 'UBOQ_EXECUTIVE_TEMPLATES', 'T10_EXECUTIVE_MARGIN:XLSX', 1, 'SENSITIVE_EXECUTIVE_FINANCIAL', true, false, 'GUC_SPOOF_ATTEMPT')`,
                  [prefix + '-GUC-SPOOF-EXEC', uExec, pAudit]
                );
              }),
            /permission denied for table SensitiveExportLog|UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED/i
          );

          await assert.rejects(
            () =>
              withSignedRestrictedTx(pAudit, uExec, 11, async () => {
                await restrictedClient.query(
                  `SELECT set_config('app.uboq_sensitive_export_fn_active', 'on', true)`
                );
                await restrictedClient.query(
                  `INSERT INTO "SensitiveExportLog"(id, "userId", "projectId", module, "exportType", "recordCount", "dataClassification", approved, blocked, reason)
                   VALUES ($1, $2, $3, 'UBOQ_FORMAL_TEMPLATES', 'ERP_CANONICAL_T0_FORMAL_V1:JSON', 1, 'RESTRICTED_CONTRACTUAL', true, false, 'GUC_SPOOF_FORMAL')`,
                  [prefix + '-GUC-SPOOF-FORMAL', uExec, pAudit]
                );
              }),
            /permission denied for table SensitiveExportLog|UBOQ_SENSITIVE_EXPORT_LOG_DIRECT_INSERT_DENIED/i
          );

          // Negative 1B: Signed FINANCE_DIRECTOR raw SQL call to uboq_append_sensitive_export_log with forged/missing exportProof -> DENIED!
          const fakeSha = 'a'.repeat(64);
          const forgedProof = `${Math.floor(Date.now() / 1000)}.${'b'.repeat(24)}.${'c'.repeat(64)}`;
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pAudit, uExec, 11, async () => {
                await restrictedClient.query(
                  `SELECT set_config('app.uboq_sensitive_export_fn_active', 'on', true)`
                );
                await restrictedClient.query(
                  `SELECT public.uboq_append_sensitive_export_log($1, $2, NULL, $3, 'T10_EXECUTIVE_MARGIN', 'XLSX', $4, 1, '127.0.0.1', true, false, 'RAW_SQL_FABRICATION', $5, $6)`,
                  ['sel_raw_exec_' + hexId, uExec, pAudit, snapAudit, fakeSha, forgedProof]
                );
              }),
            /UBOQ_SENSITIVE_EXPORT_LOG_UNATTESTED_CALL/
          );

          // Negative 1C: Signed non-executive (PROJECT_MANAGER) raw SQL call -> UNAUTHORIZED_APPROVAL
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pAudit, uPm, 11, async () => {
                await restrictedClient.query(
                  `SELECT public.uboq_append_sensitive_export_log($1, $2, NULL, $3, 'T10_EXECUTIVE_MARGIN', 'XLSX', $4, 1, '127.0.0.1', true, false, 'PM_FORGE', $5, $6)`,
                  ['sel_pm_forge_' + hexId, uPm, pAudit, snapAudit, fakeSha, forgedProof]
                );
              }),
            /UBOQ_SENSITIVE_EXPORT_LOG_UNAUTHORIZED_APPROVAL/
          );

          // Positive 1D: Legitimate T0 (JSON) & T1 (XLSX) formal exports succeed and record verified 1-to-1 SensitiveExportLog + UboqTemplateAuditEvent!
          actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 11 };
          const t0FormalRes = await postFormal({
            projectId: pAudit,
            templateCode: 'T0_MASTER_CONTRACT',
            sourceId: caAudit,
            format: 'json',
          });
          assert.equal(t0FormalRes.status, 200, 'T0 formal export failed');
          const t0Bytes = Buffer.from(await t0FormalRes.arrayBuffer());
          const t0Sha = crypto.createHash('sha256').update(t0Bytes).digest('hex');
          assert.equal(t0FormalRes.headers.get('X-OSERP-Output-Sha256'), t0Sha);
          const t0AuditId = t0FormalRes.headers.get('X-OSERP-Audit-Event-Id')!;
          assert.ok(t0AuditId.startsWith('utae_'));

          const t1FormalRes = await postFormal({
            projectId: pAudit,
            templateCode: 'T1_PHASE_BOQ',
            sourceId: snapAudit,
            format: 'xlsx',
          });
          assert.equal(t1FormalRes.status, 200, 'T1 formal export failed');
          const t1Bytes = Buffer.from(await t1FormalRes.arrayBuffer());
          const t1Sha = crypto.createHash('sha256').update(t1Bytes).digest('hex');
          assert.equal(t1FormalRes.headers.get('X-OSERP-Output-Sha256'), t1Sha);

          // Negative 1E: Signed FINANCE_DIRECTOR cannot call uboq_append_formal_sensitive_export_log directly with forged proof on real auditEventId
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pAudit, uExec, 11, async () => {
                await restrictedClient.query(
                  `SELECT public.uboq_append_formal_sensitive_export_log($1, $2, 'RESTRICTED_CONTRACTUAL', $3)`,
                  ['sel_formal_replay_' + hexId, t0AuditId, forgedProof]
                );
              }),
            /UBOQ_SENSITIVE_EXPORT_LOG_UNATTESTED_CALL/
          );

          // Positive 1F: Legitimate T8 (JSON), T9 (CSV), and T10 (XLSX) sensitive working exports succeed and bind exact HTTP SHA-256!
          const t8Res = await postWorking({
            projectId: pAudit,
            templateCode: 'T8_CASHFLOW_HALF_MONTH',
            sourceId: snapAudit,
            selectedFields: [
              'cash_quarter_label',
              'cash_period_start',
              'cash_period_end',
              'forecast_receipts_amt',
              'actual_cash_paid_amt',
            ],
            format: 'json',
          });
          assert.equal(t8Res.status, 200);
          const t8Sha = crypto
            .createHash('sha256')
            .update(Buffer.from(await t8Res.arrayBuffer()))
            .digest('hex');

          const t9Res = await postWorking({
            projectId: pAudit,
            templateCode: 'T9_CASHFLOW_QUARTERLY',
            sourceId: snapAudit,
            format: 'csv',
          });
          assert.equal(t9Res.status, 200);
          const t9Sha = crypto
            .createHash('sha256')
            .update(Buffer.from(await t9Res.arrayBuffer()))
            .digest('hex');

          const t10Res = await postWorking({
            projectId: pAudit,
            templateCode: 'T10_EXECUTIVE_MARGIN',
            sourceId: snapAudit,
            format: 'xlsx',
          });
          assert.equal(t10Res.status, 200);
          const t10Sha = crypto
            .createHash('sha256')
            .update(Buffer.from(await t10Res.arrayBuffer()))
            .digest('hex');

          const logs = (
            await admin.query(
              `SELECT module, "exportType", approved, blocked, reason
                 FROM "SensitiveExportLog"
                WHERE "projectId" = $1
                ORDER BY "createdAt" ASC, id ASC`,
              [pAudit]
            )
          ).rows;
          assert.equal(
            logs.length,
            5,
            'Expected exactly 5 genuine SensitiveExportLog rows (T0, T1, T8, T9, T10)'
          );
          assert.ok(
            logs.some(
              (r: any) =>
                r.module === 'UBOQ_FORMAL_TEMPLATES' &&
                r.exportType === 'ERP_CANONICAL_T0_FORMAL_V1:JSON' &&
                String(r.reason).includes(`sha256=${t0Sha}`)
            )
          );
          assert.ok(
            logs.some(
              (r: any) =>
                r.module === 'UBOQ_FORMAL_TEMPLATES' &&
                r.exportType === 'ERP_CANONICAL_T1_FORMAL_V1:XLSX' &&
                String(r.reason).includes(`sha256=${t1Sha}`)
            )
          );
          assert.ok(
            logs.some(
              (r: any) =>
                r.module === 'UBOQ_EXECUTIVE_TEMPLATES' &&
                r.exportType === 'T8_CASHFLOW_HALF_MONTH:JSON' &&
                String(r.reason).includes(`[sha256=${t8Sha}]`)
            )
          );
          assert.ok(
            logs.some(
              (r: any) =>
                r.module === 'UBOQ_EXECUTIVE_TEMPLATES' &&
                r.exportType === 'T9_CASHFLOW_QUARTERLY:CSV' &&
                String(r.reason).includes(`[sha256=${t9Sha}]`)
            )
          );
          assert.ok(
            logs.some(
              (r: any) =>
                r.module === 'UBOQ_EXECUTIVE_TEMPLATES' &&
                r.exportType === 'T10_EXECUTIVE_MARGIN:XLSX' &&
                String(r.reason).includes(`[sha256=${t10Sha}]`)
            )
          );

          return {
            compatDirectInsertPrivilege: aclRow.can_insert,
            signedExecWithGucSpoofDenied: true,
            signedExecUnattestedSqlFnDenied: true,
            legitimateFormalExportsVerified: ['T0_MASTER_CONTRACT:JSON', 'T1_PHASE_BOQ:XLSX'],
            legitimateSensitiveWorkingExportsVerified: [
              'T8_CASHFLOW_HALF_MONTH:JSON',
              'T9_CASHFLOW_QUARTERLY:CSV',
              'T10_EXECUTIVE_MARGIN:XLSX',
            ],
          };
        } finally {
          await s.transaction(admin, async () => {
            await admin.query("SET LOCAL session_replication_role='replica'");
            await admin.query(`DELETE FROM "AuditLog" WHERE "moduleName" = 'UBOQ_FORMAL_EXPORTS' AND "userId" = $1`, [
              uExec,
            ]);
            await admin.query(`DELETE FROM "SensitiveExportLog" WHERE "projectId" = $1`, [pAudit]);
            await admin.query(`DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" = $1`, [
              pAudit,
            ]);
            await admin.query(`DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = $1`, [
              pAudit,
            ]);
          });
        }
      }
    );

    // =========================================================================
    // 2. WP3-BC-IR-R2-02: Verified Client Receipt Authority & Sealed Immutability
    // =========================================================================
    await check(
      'WP3-BC-IR-R2-02',
      'Viewer/Site-Engineer/PM & narrowed-role receipt writes rejected; forged verifiedById and post-seal mutations rejected; authorized finance split allocation preserved',
      async () => {
        const bil1 = `${prefix}-RCPT-BIL1`;
        const bil2 = `${prefix}-RCPT-BIL2`;
        const pay1 = `${prefix}-RCPT-PAY1`;
        const pay2 = `${prefix}-RCPT-PAY2`;
        const rcptId = `${prefix}-RCPT-MAIN`;
        const alloc1 = `${prefix}-RCPT-ALC1`;
        const alloc2 = `${prefix}-RCPT-ALC2`;

        try {
          await s.transaction(admin, async () => {
            await admin.query("SET LOCAL session_replication_role='replica'");
            await admin.query(
              `INSERT INTO "Billing"(id, "billingNumber", "billingPeriodFrom", "billingPeriodTo", "billingDate", "billingType", "contractAmount", "revisedContractAmount", "currentBillingAmount", status, "preparedById", "approvedById", "projectId", "updatedAt")
               VALUES
                 ($1, $3, '2026-09-01T00:00:00.000Z', '2026-09-15T00:00:00.000Z', '2026-09-15T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED', $5, $5, $6, now()),
                 ($2, $4, '2026-09-16T00:00:00.000Z', '2026-09-30T00:00:00.000Z', '2026-09-30T00:00:00.000Z', 'PROGRESS', 200000, 200000, 100000, 'APPROVED', $5, $5, $6, now())`,
              [bil1, bil2, `BIL-R2-A-${hexId}`, `BIL-R2-B-${hexId}`, uExec, pRcpt]
            );
            await admin.query(
              `INSERT INTO "Payment"(id, "billingAmount", "approvedAmount", "netAmountDue", "amountPaid", "paymentDate", "paymentReferenceNumber", "paymentStatus", "billingId", "updatedAt")
               VALUES
                 ($1, 100000, 100000, 88000, 60000.00, '2026-09-20T00:00:00.000Z', 'OR-R2-SPLIT-77', 'PAID', $3, now()),
                 ($2, 100000, 100000, 88000, 40000.00, '2026-09-20T00:00:00.000Z', 'OR-R2-SPLIT-77', 'PAID', $4, now())`,
              [pay1, pay2, bil1, bil2]
            );
          });

          // Negative 2A: Signed VIEWER, SITE_ENGINEER, PROJECT_MANAGER, and narrowed FINANCE_DIRECTOR->VIEWER cannot INSERT UboqClientReceipt!
          for (const unauthUid of [uViewer, uSite, uPm, uNarrowExec]) {
            await assert.rejects(
              () =>
                withSignedRestrictedTx(pRcpt, unauthUid, 11, async () => {
                  await restrictedClient.query(
                    `INSERT INTO "UboqClientReceipt"(id, "projectId", "receiptReference", "receiptDate", "totalReceiptAmount")
                     VALUES ($1, $2, 'OR-UNAUTH-1', '2026-09-20T00:00:00.000Z', 100000.00)`,
                    [`${prefix}-UNAUTH-${unauthUid.slice(-4)}`, pRcpt]
                  );
                }),
              /row-level security policy|UBOQ_CLIENT_RECEIPT_UNAUTHORIZED_ACTOR/i
            );
          }

          // Negative 2B: Even authorized FINANCE_DIRECTOR cannot INSERT directly in VERIFIED status before allocations exist
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
                await restrictedClient.query(
                  `INSERT INTO "UboqClientReceipt"(id, "projectId", "receiptReference", "receiptDate", "totalReceiptAmount", status, "verifiedById", "verifiedAt")
                   VALUES ($1, $2, 'OR-R2-SPLIT-77', '2026-09-20T00:00:00.000Z', 100000.00, 'VERIFIED', $3, now())`,
                  [rcptId, pRcpt, uExec]
                );
              }),
            /UBOQ_CLIENT_RECEIPT_ALLOCATION_SUM_MISMATCH/
          );

          // Step 2C: Authorized FINANCE_DIRECTOR inserts receipt without explicit status -> defaults to DRAFT (never auto-VERIFIED!)
          const insertedStatus = await withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
            const r = await restrictedClient.query(
              `INSERT INTO "UboqClientReceipt"(id, "projectId", "receiptReference", "receiptDate", "totalReceiptAmount")
               VALUES ($1, $2, 'OR-R2-SPLIT-77', '2026-09-20T00:00:00.000Z', 100000.00)
               RETURNING status, "verifiedById", "verifiedAt"`,
              [rcptId, pRcpt]
            );
            return r.rows[0];
          });
          assert.equal(insertedStatus.status, 'DRAFT');
          assert.equal(insertedStatus.verifiedById, null);
          assert.equal(insertedStatus.verifiedAt, null);

          // Unverified DRAFT receipt is rejected by T8 adapter (409 TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED)
          actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 11 };
          const draftT8Res = await postWorking({
            projectId: pRcpt,
            templateCode: 'T8_CASHFLOW_HALF_MONTH',
            sourceId: snapRcpt,
            format: 'json',
          });
          assert.equal(draftT8Res.status, 409);
          assert.equal((await draftT8Res.json()).error, 'TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED');

          // Negative 2D: Signed VIEWER & SITE_ENGINEER cannot UPDATE DRAFT receipt or INSERT allocations
          for (const unauthUid of [uViewer, uSite, uPm]) {
            await assert.rejects(
              () =>
                withSignedRestrictedTx(pRcpt, unauthUid, 11, async () => {
                  await restrictedClient.query(
                    `INSERT INTO "UboqClientReceiptAllocation"(id, "projectId", "receiptId", "billingId", "paymentId", "allocatedAmount")
                     VALUES ($1, $2, $3, $4, $5, 60000.00)`,
                    [`${prefix}-ALC-BAD-${unauthUid.slice(-4)}`, pRcpt, rcptId, bil1, pay1]
                  );
                }),
              /row-level security policy|UBOQ_CLIENT_RECEIPT_UNAUTHORIZED_ACTOR/i
            );

            await assert.rejects(
              () =>
                withSignedRestrictedTx(pRcpt, unauthUid, 11, async () => {
                  const upd = await restrictedClient.query(
                    `UPDATE "UboqClientReceipt" SET remarks = 'tampered' WHERE id = $1`,
                    [rcptId]
                  );
                  assert.equal(upd.rowCount, 1, 'Expected RLS to block unauthorized UPDATE');
                }),
              /Expected RLS to block|row-level security|UBOQ_CLIENT_RECEIPT_UNAUTHORIZED_ACTOR/i
            );
          }

          // Authorized ACCOUNTANT inserts first allocation (60k); sealing while incomplete (60k != 100k) fails closed!
          await withSignedRestrictedTx(pRcpt, uAcct, 11, async () => {
            await restrictedClient.query(
              `INSERT INTO "UboqClientReceiptAllocation"(id, "projectId", "receiptId", "billingId", "paymentId", "allocatedAmount")
               VALUES ($1, $2, $3, $4, $5, 60000.00)`,
              [alloc1, pRcpt, rcptId, bil1, pay1]
            );
          });

          await assert.rejects(
            () =>
              withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
                await restrictedClient.query(
                  `UPDATE "UboqClientReceipt" SET status = 'VERIFIED' WHERE id = $1`,
                  [rcptId]
                );
              }),
            /UBOQ_CLIENT_RECEIPT_ALLOCATION_SUM_MISMATCH/
          );

          // Insert second matching allocation (40k -> total 100k)
          await withSignedRestrictedTx(pRcpt, uAcct, 11, async () => {
            await restrictedClient.query(
              `INSERT INTO "UboqClientReceiptAllocation"(id, "projectId", "receiptId", "billingId", "paymentId", "allocatedAmount")
               VALUES ($1, $2, $3, $4, $5, 40000.00)`,
              [alloc2, pRcpt, rcptId, bil2, pay2]
            );
          });

          // Negative 2E: Signed FINANCE_DIRECTOR cannot forge verifiedById to another user (uAcct or uSite)!
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
                await restrictedClient.query(
                  `UPDATE "UboqClientReceipt" SET status = 'VERIFIED', "verifiedById" = $2 WHERE id = $1`,
                  [rcptId, uAcct]
                );
              }),
            /UBOQ_CLIENT_RECEIPT_VERIFIER_FORGED/
          );

          // Positive 2F: Signed FINANCE_DIRECTOR seals receipt as VERIFIED -> binds verifiedById = uExec!
          const sealedRow = await withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
            const r = await restrictedClient.query(
              `UPDATE "UboqClientReceipt" SET status = 'VERIFIED' WHERE id = $1 RETURNING status, "verifiedById", "verifiedAt"`,
              [rcptId]
            );
            return r.rows[0];
          });
          assert.equal(sealedRow.status, 'VERIFIED');
          assert.equal(sealedRow.verifiedById, uExec);
          assert.ok(sealedRow.verifiedAt);

          // Negative 2G: Post-verification mutation attempts (even by signed FINANCE_DIRECTOR!) are strictly blocked!
          await assert.rejects(
            () =>
              withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
                await restrictedClient.query(
                  `UPDATE "UboqClientReceipt" SET "totalReceiptAmount" = 120000.00 WHERE id = $1`,
                  [rcptId]
                );
              }),
            /UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE/
          );

          await assert.rejects(
            () =>
              withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
                await restrictedClient.query(
                  `UPDATE "UboqClientReceipt" SET status = 'DRAFT', "verifiedById" = NULL, "verifiedAt" = NULL WHERE id = $1`,
                  [rcptId]
                );
              }),
            /UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE/
          );

          await assert.rejects(
            () =>
              withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
                await restrictedClient.query(
                  `UPDATE "UboqClientReceiptAllocation" SET "allocatedAmount" = 50000.00 WHERE id = $1`,
                  [alloc1]
                );
              }),
            /UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE/
          );

          await assert.rejects(
            () =>
              withSignedRestrictedTx(pRcpt, uExec, 11, async () => {
                await restrictedClient.query(
                  `DELETE FROM "UboqClientReceiptAllocation" WHERE id = $1`,
                  [alloc1]
                );
              }),
            /permission denied|UBOQ_CLIENT_RECEIPT_SEALED_IMMUTABLE/i
          );

          // Positive 2H: T8 & T9 recognize the verified split receipt ONCE (100,000.00)!
          const okT8 = await postWorking({
            projectId: pRcpt,
            templateCode: 'T8_CASHFLOW_HALF_MONTH',
            sourceId: snapRcpt,
            selectedFields: [
              'cash_quarter_label',
              'cash_period_start',
              'cash_period_end',
              'forecast_receipts_amt',
              'actual_cash_receipts_amt',
            ],
            format: 'json',
          });
          assert.equal(okT8.status, 200);
          const okT8Body = await okT8.json();
          assert.equal(okT8Body.cashFlowSummary.actualCashReceiptsTotal, '100000.00');
          assert.equal(
            okT8Body.cashFlowSummary.actualsReconciliation.allocatedMultiBillingReceiptsCount,
            1
          );

          // SITE_ENGINEER loading T8 public columns also succeeds (200 OK) with actual_cash_receipts_amt redacted!
          actor = { userId: uSite, role: 'SITE_ENGINEER', sessionVersion: 11 };
          const siteT8 = await postWorking({
            projectId: pRcpt,
            templateCode: 'T8_CASHFLOW_HALF_MONTH',
            sourceId: snapRcpt,
            format: 'json',
          });
          assert.equal(siteT8.status, 200);
          const siteT8Body = await siteT8.json();
          assert.equal(siteT8Body.cashFlowSummary, undefined);

          // Defense-in-depth adapter verifier check: if historical row's verifiedById holds SITE_ENGINEER role, T8 rejects with 409!
          await s.transaction(admin, async () => {
            await admin.query("SET LOCAL session_replication_role='replica'");
            await admin.query(`UPDATE "UboqClientReceipt" SET "verifiedById" = $2 WHERE id = $1`, [
              rcptId,
              uSite,
            ]);
          });
          actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 11 };
          const badVerifierRes = await postWorking({
            projectId: pRcpt,
            templateCode: 'T8_CASHFLOW_HALF_MONTH',
            sourceId: snapRcpt,
            format: 'json',
          });
          assert.equal(badVerifierRes.status, 409);
          assert.equal(
            (await badVerifierRes.json()).error,
            'TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED'
          );

          return {
            defaultStatusVerifiedAs: insertedStatus.status,
            unauthorizedRolesRejected: ['EXTERNAL_VIEWER', 'SITE_ENGINEER', 'PROJECT_MANAGER', 'NARROWED_VIEWER'],
            forgedVerifiedByIdRejected: true,
            postVerificationMutationRejected: true,
            verifiedSplitTotalRecognizedOnce: okT8Body.cashFlowSummary.actualCashReceiptsTotal,
          };
        } finally {
          await s.transaction(admin, async () => {
            await admin.query("SET LOCAL session_replication_role='replica'");
            await admin.query(`DELETE FROM "SensitiveExportLog" WHERE "projectId" = $1`, [pRcpt]);
            await admin.query(`DELETE FROM "UboqClientReceiptAllocation" WHERE "projectId" = $1`, [
              pRcpt,
            ]);
            await admin.query(`DELETE FROM "UboqClientReceipt" WHERE "projectId" = $1`, [pRcpt]);
            await admin.query(`DELETE FROM "Payment" WHERE id = ANY($1::text[])`, [[pay1, pay2]]);
            await admin.query(`DELETE FROM "Billing" WHERE id = ANY($1::text[])`, [[bil1, bil2]]);
          });
        }
      }
    );

    // =========================================================================
    // 3. WP3-BC-IR-R2-03: Executive Budget Snapshot Linkage
    // =========================================================================
    await check(
      'WP3-BC-IR-R2-03',
      'Two approved snapshots with one unbound project-wide target budget fail closed (409); single-snapshot unbound budget and explicit snapshot-bound revision succeed',
      async () => {
        const tbSingleUnbound = `${prefix}-TB-SINGLE-PW`;
        const tbMultiUnbound = `${prefix}-TB-MULTI-UNBOUND`;
        const tbMultiV2Bound = `${prefix}-TB-MULTI-V2-BOUND`;

        try {
          await s.transaction(admin, async () => {
            await admin.query("SET LOCAL session_replication_role='replica'");
            await admin.query(
              `INSERT INTO "UboqContractorTargetBudget"(id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "supersedesId", "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct", "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit", "approvedById", "approvedAt", "updatedAt")
               VALUES
                 ($1, $3, NULL, NULL, 1, NULL, 120000.00, 140000.00, 60000.00, 0.300000, 0.00, 140000.00, 140000.00, 60000.00, $5, '2026-08-10T00:00:00.000Z', now()),
                 ($2, $4, NULL, NULL, 1, NULL, 100000.00, 120000.00, 60000.00, 0.333333, 0.00, 120000.00, 120000.00, 60000.00, $5, '2026-08-10T00:00:00.000Z', now())`,
              [tbSingleUnbound, tbMultiUnbound, pSingle, pMulti, uExec]
            );
          });

          actor = { userId: uExec, role: 'FINANCE_DIRECTOR', sessionVersion: 11 };

          // Positive 3A: Single-snapshot project (pSingle has ONLY snapSingle) -> unique snapshot proven -> 200 OK!
          const singleRes = await postWorking({
            projectId: pSingle,
            templateCode: 'T10_EXECUTIVE_MARGIN',
            sourceId: snapSingle,
            format: 'json',
          });
          assert.equal(singleRes.status, 200);
          const singleBody = await singleRes.json();
          assert.equal(
            singleBody.executiveMarginSummary.targetBudgetStatus,
            'VERIFIED_APPROVED_PROJECT_BUDGET'
          );
          assert.equal(singleBody.executiveMarginSummary.targetTotalCostExVat, '140000.00');

          // Negative 3B: Two APPROVED snapshots (snapMultiV1 & snapMultiV2) + ONE unbound project-wide budget -> BOTH fail closed (409)!
          const multiV1Amb = await postWorking({
            projectId: pMulti,
            templateCode: 'T10_EXECUTIVE_MARGIN',
            sourceId: snapMultiV1,
            format: 'json',
          });
          assert.equal(multiV1Amb.status, 409);
          assert.equal(
            (await multiV1Amb.json()).error,
            'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS'
          );

          const multiV2Amb = await postWorking({
            projectId: pMulti,
            templateCode: 'T10_EXECUTIVE_MARGIN',
            sourceId: snapMultiV2,
            format: 'json',
          });
          assert.equal(multiV2Amb.status, 409);
          assert.equal(
            (await multiV2Amb.json()).error,
            'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS'
          );

          // Positive 3C: Superseding rev 2 explicitly bound to snapMultiV2 -> snapMultiV2 succeeds (200 OK) while snapMultiV1 stays protected (409)!
          await withSignedRestrictedTx(pMulti, uExec, 11, async () => {
            await restrictedClient.query(
              `INSERT INTO "UboqContractorTargetBudget"(
                 id, "projectId", "snapshotId", "phaseLineId", "revisionNumber", "supersedesId",
                 "targetDirectCostAmt", "targetTotalCost", "targetProfit", "targetMarginPct",
                 "commitmentOpenAmt", "etcUncommitted", "forecastEac", "forecastProfit",
                 "approvedById", "approvedAt", "updatedAt"
               ) VALUES (
                 $1, $2, $3, NULL, 2, $4,
                 180000.00, 210000.00, 90000.00, 0.300000,
                 0.00, 210000.00, 210000.00, 90000.00,
                 $5, '2026-08-12T00:00:00.000Z', now()
               )`,
              [tbMultiV2Bound, pMulti, snapMultiV2, tbMultiUnbound, uExec]
            );
          });

          const multiV2Ok = await postWorking({
            projectId: pMulti,
            templateCode: 'T10_EXECUTIVE_MARGIN',
            sourceId: snapMultiV2,
            format: 'json',
          });
          assert.equal(multiV2Ok.status, 200);
          const multiV2Body = await multiV2Ok.json();
          assert.equal(
            multiV2Body.executiveMarginSummary.targetBudgetStatus,
            'VERIFIED_APPROVED_PROJECT_BUDGET'
          );
          assert.equal(multiV2Body.executiveMarginSummary.targetTotalCostExVat, '210000.00');
          assert.equal(multiV2Body.executiveMarginSummary.targetProfitTotalExVat, '90000.00');

          const multiV1StillAmb = await postWorking({
            projectId: pMulti,
            templateCode: 'T10_EXECUTIVE_MARGIN',
            sourceId: snapMultiV1,
            format: 'json',
          });
          assert.equal(multiV1StillAmb.status, 409);

          return {
            singleSnapshotUnboundBudgetStatus: 200,
            twoApprovedSnapshotsUnboundV1Status: 409,
            twoApprovedSnapshotsUnboundV2Status: 409,
            explicitlyBoundSnapshotV2Status: 200,
            explicitlyBoundV2TargetTotalExVat:
              multiV2Body.executiveMarginSummary.targetTotalCostExVat,
          };
        } finally {
          await s.transaction(admin, async () => {
            await admin.query("SET LOCAL session_replication_role='replica'");
            await admin.query(
              `DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`,
              [[pSingle, pMulti]]
            );
            await admin.query(`UPDATE "UboqContractorTargetBudget" SET "supersedesId" = NULL WHERE "projectId" = $1`, [
              pMulti,
            ]);
            await admin.query(
              `DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = ANY($1::text[])`,
              [[pSingle, pMulti]]
            );
          });
        }
      }
    );
  } finally {
    await s.transaction(admin, async () => {
      await admin.query("SET LOCAL session_replication_role='replica'");
      const pList = [pAudit, pRcpt, pSingle, pMulti];
      await admin.query(`DELETE FROM "SensitiveExportLog" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(
        `DELETE FROM "UboqTemplateAuditEvent" WHERE "projectId" = ANY($1::text[])`,
        [pList]
      );
      await admin.query(
        `DELETE FROM "UboqClientReceiptAllocation" WHERE "projectId" = ANY($1::text[])`,
        [pList]
      );
      await admin.query(`DELETE FROM "UboqClientReceipt" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(
        `UPDATE "UboqContractorTargetBudget" SET "supersedesId" = NULL WHERE "projectId" = ANY($1::text[])`,
        [pList]
      );
      await admin.query(
        `DELETE FROM "UboqContractorTargetBudget" WHERE "projectId" = ANY($1::text[])`,
        [pList]
      );
      await admin.query(`DELETE FROM "UboqCashFlowPeriod" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(`DELETE FROM "UboqAwardedPhaseLine" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(`DELETE FROM "AwardedBOQItem" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(
        `DELETE FROM "UboqOperationalSnapshot" WHERE "projectId" = ANY($1::text[])`,
        [pList]
      );
      await admin.query(`DELETE FROM "UboqContractAuthority" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(`DELETE FROM "UboqSourceDocument" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(`DELETE FROM "ProjectUserAssignment" WHERE "projectId" = ANY($1::text[])`, [
        pList,
      ]);
      await admin.query(`DELETE FROM "Project" WHERE id = ANY($1::text[])`, [pList]);
      await admin.query(
        `DELETE FROM "User" WHERE id = ANY($1::text[])`,
        [[uExec, uAcct, uPm, uSite, uViewer, uNarrowExec]]
      );
    });

    if (restrictedClient) await restrictedClient.end();
    afterTables = await tableHashes();
    await admin.end();
  }

  const hashBefore = crypto
    .createHash('sha256')
    .update(JSON.stringify(beforeTables))
    .digest('hex');
  const hashAfter = crypto.createHash('sha256').update(JSON.stringify(afterTables)).digest('hex');
  const residueTables = Object.keys(afterTables).filter((k) => beforeTables[k] !== afterTables[k]);

  assert.equal(
    residueTables.length,
    0,
    `Test residue detected on tables: ${residueTables.join(', ')}`
  );

  const failed = checks.filter((c) => c.result !== 'PASS');
  const report = {
    suite: 'wp3-batch-c-r2-final-control-hardening',
    created_at: new Date().toISOString(),
    database_identity: identity,
    synthetic_only: true,
    database_before_sha256: hashBefore,
    database_after_sha256: hashAfter,
    public_tables_verified_clean: Object.keys(afterTables).length,
    residue_tables: residueTables,
    total_checks: checks.length,
    passed_checks: checks.length - failed.length,
    failed_checks: failed.length,
    status: failed.length === 0 ? 'PASS' : 'FAIL',
    checks,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2) + '\n');
  if (failed.length > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
