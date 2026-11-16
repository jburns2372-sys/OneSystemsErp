import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyOperationalSession } from '@/lib/dal/auth';
import { assertProjectGraphOwnership, withUboqRlsContext } from '@/lib/uboq/project-ownership';
import { assertUboqStageAuthorization } from '@/lib/uboq/security/stage-rbac';
import {
  buildTemplateProjection,
  exportProjectionToCsvString,
  exportProjectionToXlsxBuffer,
  SYSTEM_TEMPLATE_PRESETS,
} from '@/lib/uboq/template-builder';
import {
  hasSensitiveProjectedColumns,
  recordSensitiveTemplateExportAudit,
} from '@/lib/uboq/templates/canonical-source-adapters';
import { resolveActorLayoutCapabilities, SavedLayoutError } from '@/lib/uboq/templates/saved-layouts';

export const runtime = 'nodejs';

const NO_CACHE_INTERNAL_HEADERS: Record<string, string> = {
  'Cache-Control': 'private, no-store',
  'X-OSERP-Export-Scope': 'INTERNAL_ERP_WORKING_EXPORT_ONLY',
  'X-OSERP-External-Agency-Spec': 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
  'X-OSERP-Statutory-Certification': 'NONE_INTERNAL_ERP_ONLY',
};

const VALID_ID_RE = /^[a-zA-Z0-9_-]{1,160}$/;
const ALLOWED_QUERY_PARAMS = new Set(['projectId', 'templateCode', 'format']);
const STATUTORY_PARAM_NAMES = new Set([
  'statutory',
  'statutoryFormat',
  'agencyFormat',
  'agencyForm',
  'contractCode',
  'certification',
  'certificationMode',
  'dpwh',
  'coa',
  'bir',
]);
const STATUTORY_CODE_PREFIX_RE = /^(?:DPWH|COA|BIR|GPPB|DBP|STATUTORY|AGENCY_CERT|GOV_CERT)/i;

export const DISABLED_EXTERNAL_STATUTORY_FORMATS = [
  {
    code: 'DPWH_POW_PROGRAM_OF_WORKS',
    agency: 'DPWH',
    status: 'DISABLED_AUTHORITATIVE_SPECIFICATION_ABSENT',
    missingSpecifications: [
      'Official DPWH Department Order Program of Works / ABC cover sheet layout',
      'Mandatory agency regional/district engineering signatory and seal block',
    ],
  },
  {
    code: 'DPWH_DUPA_DETAILED_UNIT_PRICE_ANALYSIS',
    agency: 'DPWH',
    status: 'DISABLED_AUTHORITATIVE_SPECIFICATION_ABSENT',
    missingSpecifications: [
      'Official DPWH Detailed Unit Price Analysis item sheet print layout',
      'Prescribed labor/equipment/material statutory schedule headers and rounding rules',
    ],
  },
  {
    code: 'DPWH_SWA_STATEMENT_OF_WORK_ACCOMPLISHED',
    agency: 'DPWH',
    status: 'DISABLED_AUTHORITATIVE_SPECIFICATION_ABSENT',
    missingSpecifications: [
      'Official DPWH Statement of Work Accomplished certificate form layout',
      'Project Inspector / Resident Engineer / District Engineer statutory attestation block',
    ],
  },
  {
    code: 'DPWH_VARIATION_ORDER_AGENCY_FORM',
    agency: 'DPWH',
    status: 'DISABLED_AUTHORITATIVE_SPECIFICATION_ABSENT',
    missingSpecifications: [
      'Official DPWH Variation Order / Extra Work Order statutory form layout',
      'Statutory legal basis citation & approving authority endorsement block',
    ],
  },
  {
    code: 'COA_DISBURSEMENT_AND_INSPECTION_CERTIFICATE',
    agency: 'COA',
    status: 'DISABLED_AUTHORITATIVE_SPECIFICATION_ABSENT',
    missingSpecifications: [
      'Commission on Audit circular disbursement voucher & inspection report layout',
      'COA audit trail / accounting witness signatory block',
    ],
  },
  {
    code: 'BIR_EXTERNAL_TAX_CERTIFICATE_FORM',
    agency: 'BIR',
    status: 'DISABLED_AUTHORITATIVE_SPECIFICATION_ABSENT',
    missingSpecifications: [
      'BIR Form 2307 / statutory government VAT & EWT certificate print specification',
      'Authorized tax agent TIN & digital/wet signature block',
    ],
  },
] as const;

async function loadApprovedCanonicalRowsForWorkingPreset(
  tx: Prisma.TransactionClient,
  projectId: string,
  templateCode: string
): Promise<{ sourceId: string; rows: Array<Record<string, unknown>> }> {
  const preset = SYSTEM_TEMPLATE_PRESETS[templateCode];

  if (preset.rowGrain === 'CONTRACT_HEADER') {
    const c = await tx.uboqContractAuthority.findFirst({
      where: { projectId, status: 'APPROVED' },
      include: { taxProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!c) return { sourceId: 'NONE', rows: [] };
    return {
      sourceId: c.id,
      rows: [
        {
          project_id: c.projectId,
          contract_id: c.id,
          client_name: c.clientName,
          contract_ref: c.contractRef,
          noa_ref: c.noaRef,
          ntp_ref: c.ntpRef,
          awarded_revenue: Number(c.awardedRevenueExVat),
          current_contract_value: Number(c.currentContractValue),
          contract_duration: c.contractDurationDays,
          commencement_date: c.commencementDate?.toISOString().slice(0, 10) ?? null,
          tax_profile_version: c.taxProfile
            ? `${c.taxProfile.profileCode}@${c.taxProfile.versionCode}`
            : 'UNSET',
        },
      ],
    };
  }

  if (preset.rowGrain === 'CANONICAL_RESOURCE') {
    const accounts = await tx.uboqCanonicalResourceAccount.findMany({
      where: { projectId, activeApprovedPrId: { not: null } },
      include: { consolidatedBoqItem: true, activeApprovedPr: true },
      orderBy: { resourceCode: 'asc' },
    });
    return {
      sourceId: accounts[0]?.activeApprovedPr?.snapshotId ?? 'APPROVED_PRR_LEDGER',
      rows: accounts.map((a) => ({
        project_id: a.projectId,
        resource_id: a.resourceCode,
        group_code: a.consolidatedBoqItem?.itemCode ?? a.consolidatedBoqItemId,
        snapshot_version: a.activeApprovedPr?.versionNumber ?? 1,
        resource_description: a.resourceDescription,
        resource_spec: a.resourceSpec,
        resource_unit: a.resourceUomNormalized,
        resource_required_qty: Number(a.activeApprovedQty),
        allocated_usable_stock_qty: Number(a.allocatedUsableStockQty),
        open_mr_reserved_qty: Number(a.openMrReservedQty),
        committed_qty: Number(a.openCommittedPoQty),
        delivered_received_qty: Number(a.deliveredReceivedQty),
        consumed_issued_qty: Number(a.consumedIssuedQty),
        stock_available_qty: Number(a.availablePhysicalStockQty),
        resource_to_procure: Number(a.remainingProcurementQty),
        target_resource_cost: Number(a.targetResourceUnitCost),
        procurement_budget: Number(a.activeApprovedPr?.procurementBudget ?? 0),
      })),
    };
  }

  if (preset.rowGrain === 'CONSOLIDATED_WORK_ITEM') {
    const latestSnap = await tx.uboqOperationalSnapshot.findFirst({
      where: { projectId, status: 'APPROVED' },
      orderBy: { versionNumber: 'desc' },
    });
    if (!latestSnap) return { sourceId: 'NONE', rows: [] };
    const groups = await tx.uboqConsolidationGroup.findMany({
      where: {
        projectId,
        links: {
          some: {
            phaseLine: { projectId, snapshotId: latestSnap.id },
          },
        },
      },
      orderBy: { groupCode: 'asc' },
    });
    return {
      sourceId: latestSnap.id,
      rows: groups.map((g) => ({
        project_id: g.projectId,
        group_code: g.groupCode,
        snapshot_version: latestSnap.versionNumber,
        work_description: g.canonicalDescription,
        specification: g.specification,
        unit: g.unitNormalized,
        approved_qty: Number(g.totalApprovedQty),
        contract_unit_rate: Number(g.weightedUnitRate),
        contract_line_amount: Number(g.totalContractAmount),
      })),
    };
  }

  if (preset.rowGrain === 'CASH_FLOW_PERIOD' || preset.rowGrain === 'CASH_FLOW_QUARTER') {
    const periods = await tx.uboqCashFlowPeriod.findMany({
      where: { projectId },
      orderBy: { periodIndex: 'asc' },
    });
    return {
      sourceId: periods[0]?.snapshotId ?? 'CASHFLOW_BASELINE',
      rows: periods.map((p) => ({
        project_id: p.projectId,
        period_code: p.periodLabel,
        quarter_code: p.quarterLabel,
        planned_billing_inflow: Number(p.expectedBillingsAmt),
        planned_collection_inflow: Number(p.forecastReceiptsAmt),
        planned_material_outflow: Number(p.procurementCashOutAmt),
        planned_labor_outflow: Number(p.payrollSubconCashOutAmt),
        planned_equipment_outflow: Number(p.otherCashOutAmt),
        planned_subcon_outflow: 0,
        net_period_cash_flow:
          Number(p.forecastReceiptsAmt) -
          (Number(p.procurementCashOutAmt) +
            Number(p.payrollSubconCashOutAmt) +
            Number(p.otherCashOutAmt)),
        cumulative_cash_flow: Number(p.closingCashAmt),
        cumulative_cash_position: Number(p.closingCashAmt),
      })),
    };
  }

  const lines = await tx.uboqAwardedPhaseLine.findMany({
    where: { projectId, snapshot: { status: 'APPROVED' } },
    include: { snapshot: true, agencyEstimates: true },
    orderBy: { createdAt: 'asc' },
  });
  return {
    sourceId: lines[0]?.snapshotId ?? 'NONE',
    rows: lines.map((l) => {
      const est = l.agencyEstimates[0];
      return {
        project_id: l.projectId,
        boq_line_id: l.id,
        group_code: l.phaseCode,
        snapshot_version: l.snapshot?.versionNumber ?? 1,
        phase_code: l.phaseCode,
        item_code: l.itemCode,
        work_description: l.workDescription,
        specification: l.specification,
        unit: l.unitNormalized,
        original_qty: Number(l.originalQty),
        approved_qty: Number(l.approvedQty),
        contract_unit_rate: Number(l.contractUnitRate),
        contract_line_amount: Number(l.contractLineAmount),
        estimated_direct_cost: Number(est?.estimatedDirectCost ?? 0),
        ocm_amount: Number(est?.ocmAmount ?? 0),
        contractor_profit_amt: Number(est?.contractorProfitAmt ?? 0),
        estimate_vat_amt: Number(est?.estimateVatAmt ?? 0),
        estimated_total_amount: Number(est?.estimatedTotalAmount ?? 0),
      };
    }),
  };
}

export async function GET(req: NextRequest) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: NO_CACHE_INTERNAL_HEADERS }
      );
    }

    const { searchParams } = new URL(req.url);

    // Reject formal-submission bypass on the working export endpoint
    if (searchParams.has('formal')) {
      return NextResponse.json(
        {
          error: 'WORKING_EXPORT_FORMAL_MODE_DISABLED',
          message:
            'Formal internal ERP exports must use POST /api/uboq/templates/formal-export with immutable provenance.',
          statutoryCertificationClaimed: false,
        },
        { status: 409, headers: NO_CACHE_INTERNAL_HEADERS }
      );
    }

    // Reject any statutory/external certification parameters fail-closed
    for (const key of searchParams.keys()) {
      if (STATUTORY_PARAM_NAMES.has(key)) {
        return NextResponse.json(
          {
            error: 'EXTERNAL_STATUTORY_EXPORT_DISABLED_SPEC_ABSENT',
            externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
            statutoryCertificationClaimed: false,
            disabledStatutoryFormats: DISABLED_EXTERNAL_STATUTORY_FORMATS.map((f) => f.code),
          },
          { status: 409, headers: NO_CACHE_INTERNAL_HEADERS }
        );
      }
      if (!ALLOWED_QUERY_PARAMS.has(key)) {
        return NextResponse.json(
          { error: 'EXPORT_UNSUPPORTED_OPTION' },
          { status: 400, headers: NO_CACHE_INTERNAL_HEADERS }
        );
      }
    }

    const projectId = searchParams.get('projectId') || '';
    if (!VALID_ID_RE.test(projectId)) {
      return NextResponse.json(
        { error: 'EXPORT_INVALID_PROJECT_ID' },
        { status: 400, headers: NO_CACHE_INTERNAL_HEADERS }
      );
    }

    const templateCode = searchParams.get('templateCode') || 'T1_PHASE_BOQ';
    if (STATUTORY_CODE_PREFIX_RE.test(templateCode)) {
      return NextResponse.json(
        {
          error: 'EXTERNAL_STATUTORY_EXPORT_DISABLED_SPEC_ABSENT',
          requestedTemplateCode: templateCode,
          externalAgencySpecStatus: 'AUTHORITATIVE_SPECIFICATION_ABSENT_GENERIC_RETAINED',
          statutoryCertificationClaimed: false,
          disabledStatutoryFormats: DISABLED_EXTERNAL_STATUTORY_FORMATS.map((f) => f.code),
        },
        { status: 409, headers: NO_CACHE_INTERNAL_HEADERS }
      );
    }

    if (!Object.prototype.hasOwnProperty.call(SYSTEM_TEMPLATE_PRESETS, templateCode)) {
      return NextResponse.json(
        { error: 'TEMPLATE_CODE_NOT_SUPPORTED' },
        { status: 400, headers: NO_CACHE_INTERNAL_HEADERS }
      );
    }

    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    if (format !== 'xlsx' && format !== 'csv') {
      return NextResponse.json(
        { error: 'EXPORT_FORMAT_NOT_SUPPORTED' },
        { status: 400, headers: NO_CACHE_INTERNAL_HEADERS }
      );
    }

    const { projection, sourceId, rowCount } = await withUboqRlsContext(
      { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
      () =>
        prisma.$transaction(
          async (tx) => {
            await tx.$executeRaw`SET TRANSACTION READ ONLY`;
            const db = tx as unknown as Prisma.TransactionClient;

            await assertUboqStageAuthorization(db, {
              userId: actor.userId,
              projectId,
              capability: 'UBOQ_VIEW',
            });

            await assertProjectGraphOwnership(db, {
              userId: actor.userId,
              userRole: actor.role,
              projectId,
            });

            const caps = await resolveActorLayoutCapabilities(db, actor.userId, projectId);
            const loaded = await loadApprovedCanonicalRowsForWorkingPreset(
              db,
              projectId,
              templateCode
            );

            const proj = buildTemplateProjection(loaded.rows, {
              templateCode,
              userRole: caps.fieldAccessRole,
              isFormalSubmission: false,
              hasOpenBlockingExceptions: false,
            });

            return {
              projection: proj,
              sourceId: loaded.sourceId,
              rowCount: loaded.rows.length,
            };
          },
          {
            isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
            maxWait: 5000,
            timeout: 15000,
          }
        )
    );

    const deliveredBytes =
      format === 'csv'
        ? Buffer.from(exportProjectionToCsvString(projection), 'utf8')
        : Buffer.from(await exportProjectionToXlsxBuffer(projection, templateCode));

    if (hasSensitiveProjectedColumns(projection.visibleColumns)) {
      const outputSha256 = crypto.createHash('sha256').update(deliveredBytes).digest('hex');
      const sourceIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
      await withUboqRlsContext(
        { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
        () =>
          prisma.$transaction(
            async (tx) =>
              recordSensitiveTemplateExportAudit(tx as unknown as Prisma.TransactionClient, {
                userId: actor.userId,
                projectId,
                templateCode,
                format: format as 'xlsx' | 'csv',
                sourceId,
                recordCount: rowCount,
                sourceIp,
                approved: true,
                blocked: false,
                reason: `AUTHORIZED_SENSITIVE_WORKING_EXPORT_${format.toUpperCase()}`,
                outputSha256,
              }),
            {
              isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
              maxWait: 5000,
              timeout: 10000,
            }
          )
      );
    }

    return new NextResponse(new Uint8Array(deliveredBytes), {
      status: 200,
      headers: {
        ...NO_CACHE_INTERNAL_HEADERS,
        'Content-Type':
          format === 'csv'
            ? 'text/csv; charset=utf-8'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${projectId}_${templateCode}_INTERNAL_WORKING.${format}"`,
      },
    });
  } catch (err: unknown) {
    if (err instanceof SavedLayoutError) {
      return NextResponse.json(
        { error: err.code },
        { status: err.status, headers: NO_CACHE_INTERNAL_HEADERS }
      );
    }
    const msg = err instanceof Error ? err.message : 'Export failed';
    const isForbidden = /UBOQ_(?:PBAC|RBAC|UNAUTHORIZED|PROJECT_NOT_FOUND)|42501/.test(msg);
    return NextResponse.json(
      { error: isForbidden ? 'EXPORT_ACCESS_DENIED' : 'EXPORT_REQUEST_FAILED' },
      { status: isForbidden ? 403 : 400, headers: NO_CACHE_INTERNAL_HEADERS }
    );
  }
}
