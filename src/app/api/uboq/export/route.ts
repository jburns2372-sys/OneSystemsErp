import { NextRequest, NextResponse } from 'next/server';
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

async function loadCanonicalRowsForPreset(projectId: string, templateCode: string): Promise<Array<Record<string, unknown>>> {
  const preset = SYSTEM_TEMPLATE_PRESETS[templateCode] ?? SYSTEM_TEMPLATE_PRESETS.T1_PHASE_BOQ;

  if (preset.rowGrain === 'CONTRACT_HEADER') {
    const c = await prisma.uboqContractAuthority.findFirst({
      where: { projectId },
      include: { taxProfile: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!c) return [];
    return [
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
        tax_profile_version: c.taxProfile ? `${c.taxProfile.profileCode}@${c.taxProfile.versionCode}` : 'UNSET',
      },
    ];
  }

  if (preset.rowGrain === 'CANONICAL_RESOURCE') {
    const accounts = await prisma.uboqCanonicalResourceAccount.findMany({
      where: { projectId },
      include: { consolidatedBoqItem: true, activeApprovedPr: true },
      orderBy: { resourceCode: 'asc' },
    });
    return accounts.map((a) => ({
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
    }));
  }

  if (preset.rowGrain === 'CONSOLIDATED_WORK_ITEM') {
    const groups = await prisma.uboqConsolidationGroup.findMany({
      where: { projectId },
      orderBy: { groupCode: 'asc' },
    });
    return groups.map((g) => ({
      project_id: g.projectId,
      group_code: g.groupCode,
      snapshot_version: 1,
      work_description: g.canonicalDescription,
      specification: g.specification,
      unit: g.unitNormalized,
      approved_qty: Number(g.totalApprovedQty),
      contract_unit_rate: Number(g.weightedUnitRate),
      contract_line_amount: Number(g.totalContractAmount),
    }));
  }

  if (preset.rowGrain === 'CASH_FLOW_PERIOD' || preset.rowGrain === 'CASH_FLOW_QUARTER') {
    const periods = await prisma.uboqCashFlowPeriod.findMany({
      where: { projectId },
      orderBy: { periodIndex: 'asc' },
    });
    return periods.map((p) => ({
      project_id: p.projectId,
      period_code: p.periodLabel,
      quarter_code: p.quarterLabel,
      planned_billing_inflow: Number(p.expectedBillingsAmt),
      planned_collection_inflow: Number(p.forecastReceiptsAmt),
      planned_material_outflow: Number(p.procurementCashOutAmt),
      planned_labor_outflow: Number(p.payrollSubconCashOutAmt),
      planned_equipment_outflow: Number(p.otherCashOutAmt),
      planned_subcon_outflow: 0,
      net_period_cash_flow: Number(p.forecastReceiptsAmt) - (Number(p.procurementCashOutAmt) + Number(p.payrollSubconCashOutAmt) + Number(p.otherCashOutAmt)),
      cumulative_cash_flow: Number(p.closingCashAmt),
      cumulative_cash_position: Number(p.closingCashAmt),
    }));
  }

  const lines = await prisma.uboqAwardedPhaseLine.findMany({
    where: { projectId },
    include: { snapshot: true, agencyEstimates: true },
    orderBy: { createdAt: 'asc' },
  });
  return lines.map((l) => {
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
  });
}

export async function GET(req: NextRequest) {
  try {
    const actor = await verifyOperationalSession();
    if (!actor) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || '';
    const templateCode = searchParams.get('templateCode') || 'T1_PHASE_BOQ';
    const format = (searchParams.get('format') || 'xlsx').toLowerCase();
    const formal = searchParams.get('formal') === 'true';

    const projection = await withUboqRlsContext(
      { userId: actor.userId, sessionVersion: actor.sessionVersion, projectId },
      async () => {
        await assertUboqStageAuthorization(prisma, {
          userId: actor.userId,
          projectId,
          capability: 'UBOQ_VIEW',
        });

        await assertProjectGraphOwnership(prisma, {
          userId: actor.userId,
          userRole: actor.role,
          projectId,
        });

        const openBlockers = await prisma.uboqValidationException.count({
          where: { projectId, status: 'OPEN', severity: 'BLOCKING' },
        });

        const canonicalRows = await loadCanonicalRowsForPreset(projectId, templateCode);
        return buildTemplateProjection(canonicalRows, {
          templateCode,
          userRole: actor.role,
          isFormalSubmission: formal,
          hasOpenBlockingExceptions: openBlockers > 0,
        });
      }
    );

    if (format === 'csv') {
      const csv = exportProjectionToCsvString(projection);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${projectId}_${templateCode}.csv"`,
        },
      });
    }

    const xlsxBuf = await exportProjectionToXlsxBuffer(projection, templateCode);
    return new NextResponse(new Uint8Array(xlsxBuf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${projectId}_${templateCode}.xlsx"`,
      },
    });
  } catch (err: any) {
    const msg = String(err.message || 'Export failed');
    const status = msg.includes('UBOQ_PBAC') ? 403 : msg.includes('VAL19') ? 409 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
