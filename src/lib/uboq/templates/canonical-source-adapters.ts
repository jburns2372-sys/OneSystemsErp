import crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import {
  calculateCPM,
  type CPMActivity,
  type CPMDependency,
  resolveWorkingDayDates,
} from '../../cpm-engine';
import { buildMultiStreamCashFlowSchedule, type CashFlowInputBucket } from '../cashflow-engine';
import {
  CANONICAL_FIELD_MAP,
  T12_SAFE_DERIVED_VARIANCE_SPECS,
  type UboqFieldVisibility,
} from '../field-catalog';
import { canRoleAccessField, getPermittedVisibilityTiers } from '../security/redact-payload';
import {
  computeContractBillingTaxBreakdown,
  computeFiveBaselineComparison,
  type TaxPricingProfileConfig,
} from '../tax-engine';
import {
  evaluateSafeFormulaAst,
  resolveT12PeriodBalanceDefaultHeading,
  SYSTEM_TEMPLATE_PRESETS,
  T12_SAFE_DERIVED_FORMULAS,
} from '../template-builder';
import { CANONICAL_UOM_REGISTRY, canConvertUom, normalizeUom } from '../uom-registry';
import {
  computeSpecSignatureHash,
  evaluateScheduleAndEvmPerformance,
  validateAccomplishmentAndBillingClaim,
} from '../validation-engine';

export const ACTIVE_BATCH_TEMPLATE_CODES = [
  'T0_MASTER_CONTRACT',
  'T1_PHASE_BOQ',
  'T2_CONSOLIDATED_BOQ',
  'T3_AGENCY_ESTIMATE',
  'T4_RESOURCE_TAKEOFF',
  'T5_ACCOMPLISHMENT_CERT',
  'T6_PROGRESS_BILLING',
  'T7_SCHEDULE_EVM',
  'T8_CASHFLOW_HALF_MONTH',
  'T9_CASHFLOW_QUARTERLY',
  'T10_EXECUTIVE_MARGIN',
  'T11_VARIATION_ORDER_REGISTER',
  'T12_CASHFLOW_VARIANCE_TREASURY',
] as const;

export type ActiveBatchTemplateCode = (typeof ACTIVE_BATCH_TEMPLATE_CODES)[number];

export const FORMAL_CAPABLE_TEMPLATE_CODES = [
  'T0_MASTER_CONTRACT',
  'T1_PHASE_BOQ',
  'T4_RESOURCE_TAKEOFF',
  'T5_ACCOMPLISHMENT_CERT',
  'T6_PROGRESS_BILLING',
  'T11_VARIATION_ORDER_REGISTER',
] as const;

export type FormalCapableTemplateCode = (typeof FORMAL_CAPABLE_TEMPLATE_CODES)[number];

export function isActiveBatchTemplateCode(value: unknown): value is ActiveBatchTemplateCode {
  return (
    typeof value === 'string' &&
    (ACTIVE_BATCH_TEMPLATE_CODES as readonly string[]).includes(value)
  );
}

export function isFormalCapableTemplateCode(value: unknown): value is FormalCapableTemplateCode {
  return (
    typeof value === 'string' &&
    (FORMAL_CAPABLE_TEMPLATE_CODES as readonly string[]).includes(value)
  );
}

export const ALLOWED_TEMPLATE_FIELDS: Readonly<Record<ActiveBatchTemplateCode, readonly string[]>> = {
  T0_MASTER_CONTRACT: [
    ...SYSTEM_TEMPLATE_PRESETS.T0_MASTER_CONTRACT.defaultFields,
    'client_po_ref',
    'pricing_method',
    'contract_vat_basis',
    'vo_reference',
  ],
  T1_PHASE_BOQ: [
    ...SYSTEM_TEMPLATE_PRESETS.T1_PHASE_BOQ.defaultFields,
    'section_code',
    'pricing_type',
  ],
  T2_CONSOLIDATED_BOQ: [
    ...SYSTEM_TEMPLATE_PRESETS.T2_CONSOLIDATED_BOQ.defaultFields,
    'original_qty',
    'uom_dimension_family',
  ],
  T3_AGENCY_ESTIMATE: [
    ...SYSTEM_TEMPLATE_PRESETS.T3_AGENCY_ESTIMATE.defaultFields,
    'section_code',
    'specification',
    'agency_edc_amt',
    'agency_abc',
    'estimate_material_cost',
    'estimate_labor_cost',
    'estimate_equipment_cost',
    'ocm_rate',
    'contingency_ocm',
    'contractor_profit_rate',
    'estimate_vat_rate',
    'estimated_indirect_cost',
    'estimated_total_unit_cost',
    'estimate_vat_component_rate',
    'estimate_vat_component_base',
  ],
  T4_RESOURCE_TAKEOFF: [
    ...SYSTEM_TEMPLATE_PRESETS.T4_RESOURCE_TAKEOFF.defaultFields,
    'group_code',
    'resource_class',
    'fulfillment_channel',
    'uom_dimension_family',
    'resource_qty_basis',
    'resource_coeff',
    'resource_summary_qty',
    'mrf_id',
    'supplier_po_id',
  ],
  T5_ACCOMPLISHMENT_CERT: [
    ...SYSTEM_TEMPLATE_PRESETS.T5_ACCOMPLISHMENT_CERT.defaultFields,
    'section_code',
    'specification',
    'original_qty',
    'pricing_type',
    'vo_reference',
    'contract_unit_rate',
    'contract_line_amount',
    'certified_curr_amt',
    'prior_certified_amt',
  ],
  T6_PROGRESS_BILLING: [
    ...SYSTEM_TEMPLATE_PRESETS.T6_PROGRESS_BILLING.defaultFields,
    'section_code',
    'specification',
    'original_qty',
    'approved_qty',
    'pricing_type',
    'vo_reference',
    'contract_line_amount',
    'prior_certified_amt',
    'payment_received',
    'output_vat_rate',
    'sales_vat_category',
    'gov_vat_withholding_rate',
    'vat_withholding_amount',
    'ewt_withholding_amount',
  ],
  T7_SCHEDULE_EVM: [
    ...SYSTEM_TEMPLATE_PRESETS.T7_SCHEDULE_EVM.defaultFields,
    'phase_code',
    'work_description',
    'unit',
    'approved_qty',
  ],
  T8_CASHFLOW_HALF_MONTH: [
    ...SYSTEM_TEMPLATE_PRESETS.T8_CASHFLOW_HALF_MONTH.defaultFields,
    'actual_cash_receipts_amt',
    'actual_cash_paid_amt',
  ],
  T9_CASHFLOW_QUARTERLY: [
    ...SYSTEM_TEMPLATE_PRESETS.T9_CASHFLOW_QUARTERLY.defaultFields,
    'expected_billings_amt',
    'payroll_subcon_cash_out_amt',
    'other_cash_out_amt',
    'actual_cash_receipts_amt',
    'actual_cash_paid_amt',
  ],
  T10_EXECUTIVE_MARGIN: [
    ...SYSTEM_TEMPLATE_PRESETS.T10_EXECUTIVE_MARGIN.defaultFields,
    'section_code',
    'unit',
    'approved_qty',
    'contract_unit_rate',
    'certified_curr_amt',
    'physical_progress_pct',
    'procurement_budget',
    'committed_qty',
    'planned_value',
    'earned_value',
    'actual_cost',
    'spi',
    'cpi',
  ],
  T11_VARIATION_ORDER_REGISTER: [
    ...SYSTEM_TEMPLATE_PRESETS.T11_VARIATION_ORDER_REGISTER.defaultFields,
    'section_code',
    'specification',
    'pricing_type',
    'contract_line_amount',
    'awarded_revenue',
    'current_contract_value',
    'vo_reference',
    'contract_ref',
    'supersedes_id',
  ],
  T12_CASHFLOW_VARIANCE_TREASURY: [
    ...SYSTEM_TEMPLATE_PRESETS.T12_CASHFLOW_VARIANCE_TREASURY.defaultFields,
  ],
};

export const PRIMARY_TOTAL_AMOUNT_FIELD: Readonly<Record<ActiveBatchTemplateCode, string | null>> = {
  T0_MASTER_CONTRACT: null,
  T1_PHASE_BOQ: 'contract_line_amount',
  T2_CONSOLIDATED_BOQ: 'contract_line_amount',
  T3_AGENCY_ESTIMATE: 'estimated_total_amount',
  T4_RESOURCE_TAKEOFF: 'procurement_budget',
  T5_ACCOMPLISHMENT_CERT: 'certified_curr_amt',
  T6_PROGRESS_BILLING: 'net_certified_due',
  T7_SCHEDULE_EVM: 'earned_value',
  T8_CASHFLOW_HALF_MONTH: 'forecast_receipts_amt',
  T9_CASHFLOW_QUARTERLY: 'forecast_receipts_amt',
  T10_EXECUTIVE_MARGIN: 'forecast_profit',
  T11_VARIATION_ORDER_REGISTER: 'vo_client_revenue_delta_amt',
  T12_CASHFLOW_VARIANCE_TREASURY: 'receipts_variance_amt',
};

export class CanonicalAdapterError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number = 400,
    public readonly detail?: Record<string, unknown>
  ) {
    super(code);
  }
}

const PUBLIC_SYSTEM_META_KEYS = new Set<string>([
  'project_id',
  'contract_id',
  'snapshot_id',
  'snapshot_version',
  'group_code',
  'phase_code',
  'section_code',
  'resource_id',
  'accomplishment_id',
  'billing_cert_id',
  'billing_number',
  'schedule_id',
  'baseline_revision',
  'activity_id',
  'vo_id',
  'vo_item_id',
  'awarded_boq_item_id',
  'vo_qty_scope_basis',
  'vo_item_pre_qty',
  'vo_item_post_qty',
]);

const RESTRICTED_SYSTEM_META_KEYS = new Set<string>([
  'other_deductions_exact',
  'bac_allocated_amount',
  'tax_profile_version',
  'agency_estimate_id',
  'agency_estimate_status',
  'benchmark_unit_cost_exact',
  'computed_qty_times_target_cost_2dp',
  'budget_line_delta_2dp',
  'awarded_contract_ex_vat',
  'rounding_adjustment_amt',
  'vo_client_revenue_delta_amt',
  'vo_client_revenue_delta_ex_vat',
  'receipts_variance_amt',
]);

const SENSITIVE_SYSTEM_META_KEYS = new Set<string>([
  'target_direct_cost_amt',
  'target_total_cost',
  'target_profit',
  'target_margin',
  'target_margin_pct',
  'target_indirect_cost_ex_vat',
  'closing_cash_amt',
  'liquidity_gap_amt',
  'quarterly_closing_cash',
  'quarterly_liquidity_gap',
  'procurement_cash_out_amt',
  'payroll_subcon_cash_out_amt',
  'other_cash_out_amt',
  'actual_cash_paid_amt',
  'committed_total_ex_vat',
  'incurred_against_commitment_ex_vat',
  'uncommitted_direct_incurred_ex_vat',
  'incurred_actual_cost_ex_vat',
  'paid_disbursed_ex_vat',
  'unpaid_incurred_payable_ex_vat',
  'outstanding_total_obligation_ex_vat',
  'commitment_open_amt',
  'etc_uncommitted',
  'forecast_eac',
  'forecast_profit',
  'vo_subcon_commitment_delta_amt',
  'total_forecast_cash_out_amt',
  'disbursement_variance_amt',
  'actual_treasury_closing_cash',
  'actual_treasury_liquidity_gap',
  'cumulative_net_cash_movement_zero_basis',
  'cumulative_net_cash_deficit_zero_basis',
  'forecast_closing_cash_amt',
  'forecast_liquidity_gap_amt',
]);

const FINANCIAL_META_KEY_PATTERN =
  /(_amt|_amount|_cost|_rate|_revenue|_budget|_value|_profit|_margin|_vat|_tax|_deduction|due|paid)$/i;

export function classifySystemMetaFieldVisibility(metaKey: string): UboqFieldVisibility {
  if (SENSITIVE_SYSTEM_META_KEYS.has(metaKey)) {
    return 'sensitive';
  }
  if (RESTRICTED_SYSTEM_META_KEYS.has(metaKey)) {
    return 'restricted';
  }
  const canonicalSpec = CANONICAL_FIELD_MAP.get(metaKey);
  if (canonicalSpec) {
    return canonicalSpec.visibility;
  }
  const derivedSpec = T12_SAFE_DERIVED_VARIANCE_SPECS.get(metaKey);
  if (derivedSpec) {
    return derivedSpec.visibility;
  }
  if (FINANCIAL_META_KEY_PATTERN.test(metaKey)) {
    return 'restricted';
  }
  if (PUBLIC_SYSTEM_META_KEYS.has(metaKey)) {
    return 'public';
  }
  return 'internal';
}

export function resolveNarrowestFieldRole(effectiveRole: string, fieldAccessRole?: string): string {
  if (!fieldAccessRole) return effectiveRole;
  const effTiers = getPermittedVisibilityTiers(effectiveRole);
  const fldTiers = getPermittedVisibilityTiers(fieldAccessRole);
  return fldTiers.size < effTiers.size ? fieldAccessRole : effectiveRole;
}

export function filterSystemMetaFieldsForRoles(
  metaFields: readonly string[],
  effectiveRole: string,
  fieldAccessRole?: string
): readonly string[] {
  const effTiers = getPermittedVisibilityTiers(effectiveRole);
  const fldTiers = fieldAccessRole ? getPermittedVisibilityTiers(fieldAccessRole) : effTiers;
  return metaFields.filter((key) => {
    const requiredTier = classifySystemMetaFieldVisibility(key);
    return effTiers.has(requiredTier) && fldTiers.has(requiredTier);
  });
}

function resolveUomDef(unitCodeOrRaw: string, specHint?: string | null) {
  return CANONICAL_UOM_REGISTRY[unitCodeOrRaw] ?? normalizeUom(unitCodeOrRaw, specHint);
}

export function convertDecimalUomQuantity(
  qty: Prisma.Decimal,
  fromUnit: string,
  toUnit: string,
  specHint?: string | null
): Prisma.Decimal {
  const fromDef = resolveUomDef(fromUnit, specHint);
  const toDef = resolveUomDef(toUnit, specHint);
  if (!canConvertUom(fromDef.normalizedCode, toDef.normalizedCode)) {
    throw new CanonicalAdapterError('TEMPLATE_INCOMPATIBLE_UOM_CONSOLIDATION', 409, {
      fromUnit: fromDef.normalizedCode,
      toUnit: toDef.normalizedCode,
    });
  }
  if (fromDef.normalizedCode === toDef.normalizedCode) {
    return qty;
  }
  const fromFactor = new Prisma.Decimal(String(fromDef.baseConversionFactor));
  const toFactor = new Prisma.Decimal(String(toDef.baseConversionFactor));
  return qty
    .mul(fromFactor)
    .div(toFactor)
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
}

export async function listBatchTemplateCatalogSources(
  db: Prisma.TransactionClient,
  role: string,
  projectId: string,
  fieldAccessRole?: string
) {
  const canReadCatalogField = (fieldId: string): boolean =>
    canRoleAccessField(role, fieldId) &&
    (!fieldAccessRole || canRoleAccessField(fieldAccessRole, fieldId));

  const [
    contracts,
    snapshotsAll,
    prrSnapshots,
    accomplishments,
    billings,
    schedules,
    cashflowSnapshots,
  ] = await Promise.all([
    db.uboqContractAuthority.findMany({
      where: {
        projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      select: { id: true, contractRef: true, approvedAt: true },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
      take: 100,
    }),
    db.uboqOperationalSnapshot.findMany({
      where: {
        projectId,
        status: { in: ['APPROVED', 'SUPERSEDED'] },
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      select: {
        id: true,
        versionNumber: true,
        versionLabel: true,
        status: true,
        contractAuthorityId: true,
      },
      orderBy: { versionNumber: 'desc' },
      take: 100,
    }),
    db.uboqProcurementResourceRequirement.findMany({
      where: {
        projectId,
        snapshotId: { not: null },
        status: { in: ['APPROVED', 'SUPERSEDED'] },
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      select: { snapshotId: true },
      distinct: ['snapshotId'],
    }),
    db.accomplishment.findMany({
      where: {
        projectId,
        status: { in: ['APPROVED', 'approved'] },
        items: { some: {} },
      },
      select: { id: true, billingPeriod: true, accomplishmentDate: true },
      orderBy: [{ accomplishmentDate: 'desc' }, { id: 'asc' }],
      take: 100,
    }),
    db.billing.findMany({
      where: {
        projectId,
        status: {
          in: [
            'APPROVED',
            'APPROVED_FOR_PAYMENT',
            'PAID',
            'approved',
            'approved_for_payment',
            'paid',
          ],
        },
        approvedById: { not: null },
        items: { some: {} },
      },
      select: { id: true, billingNumber: true, billingPeriodTo: true },
      orderBy: [{ billingPeriodTo: 'desc' }, { id: 'asc' }],
      take: 100,
    }),
    db.projectSchedule.findMany({
      where: {
        projectId,
        workflowStatus: { in: ['ACTIVE_BASELINE', 'SUPERSEDED_BASELINE'] },
        activities: { some: {} },
      },
      select: {
        id: true,
        name: true,
        baselineRevision: true,
        workflowStatus: true,
        baselineCode: true,
      },
      orderBy: [{ baselineRevision: 'desc' }, { id: 'asc' }],
      take: 100,
    }),
    db.uboqCashFlowPeriod.findMany({
      where: {
        projectId,
        periodType: 'HALF_MONTH',
      },
      select: { snapshotId: true },
      distinct: ['snapshotId'],
    }),
  ]);

  const snapshots = snapshotsAll.filter((s) => s.status === 'APPROVED');
  const snapshotIdsWithPrr = new Set(
    prrSnapshots.map((r) => r.snapshotId).filter((v): v is string => typeof v === 'string')
  );
  const snapshotIdsWithCashflow = new Set(
    cashflowSnapshots.map((r) => r.snapshotId).filter((v): v is string => typeof v === 'string')
  );
  const hasUnboundCashflowPeriods = cashflowSnapshots.some((r) => r.snapshotId === null);
  const hasBaselineSchedule = schedules.length > 0;
  const hasApprovedSnapshot = snapshotsAll.length > 0;

  return ACTIVE_BATCH_TEMPLATE_CODES.map((code) => {
    const preset = SYSTEM_TEMPLATE_PRESETS[code];
    let sources: Array<{ id: string; label: string }>;
    if (code === 'T0_MASTER_CONTRACT') {
      sources = contracts.map((c) => ({
        id: c.id,
        label: canReadCatalogField('contract_ref') ? c.contractRef || c.id : c.id,
      }));
    } else if (code === 'T4_RESOURCE_TAKEOFF') {
      sources = snapshots
        .filter((s) => snapshotIdsWithPrr.has(s.id))
        .map((s) => ({
          id: s.id,
          label: `v${s.versionNumber} — ${s.versionLabel} (Resource Takeoff)`,
        }));
    } else if (code === 'T5_ACCOMPLISHMENT_CERT') {
      sources = hasApprovedSnapshot
        ? accomplishments.map((a) => ({
            id: a.id,
            label: `SWA — ${a.billingPeriod} (${a.accomplishmentDate.toISOString().slice(0, 10)})`,
          }))
        : [];
    } else if (code === 'T6_PROGRESS_BILLING') {
      sources = hasApprovedSnapshot
        ? billings.map((b) => ({
            id: b.id,
            label: `Billing ${b.billingNumber} (${b.billingPeriodTo.toISOString().slice(0, 10)})`,
          }))
        : [];
    } else if (code === 'T7_SCHEDULE_EVM') {
      sources = schedules.map((sch) => ({
        id: sch.id,
        label: `${sch.baselineCode ? `${sch.baselineCode} — ` : ''}${sch.name} (Rev ${sch.baselineRevision}, ${sch.workflowStatus})`,
      }));
    } else if (code === 'T8_CASHFLOW_HALF_MONTH' || code === 'T9_CASHFLOW_QUARTERLY') {
      const suffix =
        code === 'T8_CASHFLOW_HALF_MONTH' ? 'Half-Month Cash Flow' : 'Quarterly Cash Flow';
      sources = snapshots
        .filter(
          (s) =>
            snapshotIdsWithCashflow.has(s.id) || hasUnboundCashflowPeriods || hasBaselineSchedule
        )
        .map((s) => ({
          id: s.id,
          label: `v${s.versionNumber} — ${s.versionLabel} (${suffix})`,
        }));
    } else if (code === 'T10_EXECUTIVE_MARGIN') {
      sources = snapshots.map((s) => ({
        id: s.id,
        label: `v${s.versionNumber} — ${s.versionLabel} (Executive Margin & Commitments)`,
      }));
    } else if (code === 'T11_VARIATION_ORDER_REGISTER') {
      sources = snapshots
        .filter((s) => s.contractAuthorityId !== null)
        .map((s) => ({
          id: s.id,
          label: `v${s.versionNumber} — ${s.versionLabel} (Variation Order Register)`,
        }));
    } else if (code === 'T12_CASHFLOW_VARIANCE_TREASURY') {
      sources = snapshots
        .filter(
          (s) =>
            s.contractAuthorityId !== null &&
            (snapshotIdsWithCashflow.has(s.id) || hasUnboundCashflowPeriods || hasBaselineSchedule)
        )
        .map((s) => ({
          id: s.id,
          label: `v${s.versionNumber} — ${s.versionLabel} (Treasury Cash-Flow Variance)`,
        }));
    } else {
      sources = snapshots.map((s) => ({
        id: s.id,
        label: `v${s.versionNumber} — ${s.versionLabel}`,
      }));
    }

    return {
      code,
      name: preset.templateName,
      rowGrain: preset.rowGrain,
      isFormalComplianceOutput: preset.isFormalComplianceOutput,
      fields: ALLOWED_TEMPLATE_FIELDS[code]
        .filter((id) => canReadCatalogField(id))
        .map((id) => {
          const t12PeriodHeading =
            code === 'T12_CASHFLOW_VARIANCE_TREASURY'
              ? (resolveT12PeriodBalanceDefaultHeading(id, false) ?? null)
              : null;
          const heading =
            t12PeriodHeading ??
            CANONICAL_FIELD_MAP.get(id)?.suggestedHeading ??
            T12_SAFE_DERIVED_VARIANCE_SPECS.get(id)?.suggestedHeading ??
            id;
          return {
            id,
            heading,
            selectedByDefault: preset.defaultFields.includes(id),
          };
        }),
      sources,
    };
  });
}

export interface LoadedTemplateCanonicalData {
  sourceId: string;
  sourceVersion: string;
  rows: Array<Record<string, unknown>>;
  systemMetaFields: readonly string[];
  approvedById: string;
  approvedAtIso: string;
  canonicalHash: string | null;
  sourceEvidenceHash: string | null;
  snapshotContractAuthorityId?: string | null;
  swaSummary?: {
    accomplishmentId: string;
    billingPeriod: string;
    accomplishmentDateIso: string;
    snapshotId: string;
    snapshotVersionNumber: number;
    certifiedCurrentAmountTotal: string;
    priorCertifiedAmountTotal: string;
    cumulativeCertifiedAmountTotal: string;
    revisedContractLineTotal: string;
    weightedPhysicalProgressPct: string;
  };
  billingSummary?: {
    billingId: string;
    billingNumber: string;
    billingPeriodFromIso: string;
    billingPeriodToIso: string;
    billingDateIso: string;
    snapshotId: string;
    snapshotVersionNumber: number;
    taxProfileVersion: string;
    salesVatCategory: string;
    outputVatRatePct: string;
    govVatWithholdingRatePct: string;
    ewtRatePct: string;
    retentionRatePct: string;
    advanceRecoupmentRatePct: string;
    contractVatInclusive: boolean;
    certifiedCurrentAmountTotal: string;
    priorCertifiedAmountTotal: string;
    exVatBaseTotal: string;
    outputVatTotal: string;
    grossBillingTotal: string;
    retentionTotal: string;
    advanceRecoupmentTotal: string;
    vatWithholdingTotal: string;
    ewtWithholdingTotal: string;
    withholdingTotal: string;
    otherDeductionsTotal: string;
    netCertifiedDueTotal: string;
    paymentReceivedTotal: string;
  };
  scheduleEvmSummary?: {
    scheduleId: string;
    baselineRevision: number;
    workflowStatus: string;
    projectDurationWorkingDays: number;
    criticalActivityCount: number;
    statusCutoffDateIso: string;
    bacTotal: string;
    plannedValueTotal: string;
    earnedValueTotal: string;
    actualCostTotal: string;
    overallSpi: string | null;
    overallCpi: string | null;
  };
  cashFlowSummary?: {
    snapshotId: string;
    snapshotVersionNumber: number;
    scheduleSourceBasis: 'PERSISTED_CASHFLOW_PERIODS' | 'BASELINE_SCHEDULE_DERIVED';
    asOfCutoffDateIso: string;
    targetContractTotal: string;
    plannedValueWeightTotal: string;
    explicitRoundingDelta: string;
    expectedBillingsTotal: string;
    forecastReceiptsTotal: string;
    procurementCashOutTotal: string | null;
    payrollSubconCashOutTotal: string | null;
    otherCashOutTotal: string | null;
    actualCashReceiptsTotal: string;
    actualCashPaidTotal: string | null;
    endingClosingCash: string | null;
    peakLiquidityGap: string | null;
    actualsReconciliation?: {
      verifiedClientReceiptsCount: number;
      allocatedMultiBillingReceiptsCount: number;
      operationalReceiptPeriodsCount: number;
      persistedHistoricalReceiptPeriodsPreservedCount: number;
      deduplicatedIdenticalReceiptMirrorPeriodsCount: number;
      operationalPaidPeriodsCount: number;
      persistedHistoricalPaidPeriodsPreservedCount: number;
      deduplicatedIdenticalPaidMirrorPeriodsCount: number;
    };
    billingForecastReconciliation?: {
      approvedClaimsEvaluatedCount: number;
      periodsDominatedByApprovedClaimsCount: number;
      alreadyCollectedOffsetTotal: string;
    };
  };
  executiveMarginSummary?: {
    snapshotId: string;
    snapshotVersionNumber: number;
    asOfCutoffDateIso: string;
    taxProfileVersion: string;
    targetBudgetStatus:
      | 'VERIFIED_APPROVED_LINE_BUDGETS'
      | 'VERIFIED_APPROVED_PROJECT_BUDGET'
      | 'VERIFIED_RECONCILED_PROJECT_AND_LINE_BUDGETS'
      | 'UNAVAILABLE_NO_APPROVED_BUDGET'
      | 'REDACTED_NON_EXECUTIVE';
    awardedContractTotalGross: string;
    awardedContractTotalExVat: string;
    targetDirectCostTotalExVat: string | null;
    targetTotalCostExVat: string | null;
    targetProfitTotalExVat: string | null;
    targetMarginPctOverall: string | null;
    committedTotalExVat: string | null;
    incurredAgainstCommitmentTotalExVat: string | null;
    uncommittedDirectIncurredTotalExVat: string | null;
    incurredActualCostTotalExVat: string;
    paidDisbursedTotalExVat: string | null;
    unpaidIncurredPayableTotalExVat: string | null;
    outstandingTotalObligationExVat: string | null;
    commitmentOpenTotalExVat: string | null;
    etcUncommittedTotalExVat: string | null;
    forecastEacTotalExVat: string | null;
    forecastProfitTotalExVat: string | null;
    deduplicatedMirrorCommitmentsCount: number;
    deduplicatedMirroredExpensesCount: number;
  };
  variationRegisterSummary?: {
    snapshotId: string;
    snapshotVersionNumber: number;
    supersedesSnapshotId: string | null;
    contractAuthorityId: string;
    contractRef: string | null;
    originalContractAwardAmount: string;
    awardedRevenueExVat: string;
    approvedClientVoCount: number;
    approvedSubconVoCount: number;
    approvedClientVoItemCount: number;
    approvedSubconVoItemCount: number;
    excludedNonApprovedVoCount: number;
    deduplicatedClientVoMirrorsCount: number;
    deduplicatedSubconVoLedgerMirrorsCount: number;
    clientVoRevenueDeltaTotal: string;
    clientVoRevenueDeltaExVatTotal: string;
    revisedContractValueTotal: string;
    subconCommitmentVoDeltaTotal: string | null;
  };
  treasuryVarianceSummary?: {
    snapshotId: string;
    snapshotVersionNumber: number;
    scheduleSourceBasis: 'PERSISTED_CASHFLOW_PERIODS' | 'BASELINE_SCHEDULE_DERIVED';
    asOfCutoffDateIso: string;
    periodCount: number;
    actualTreasuryLiquidityVerified: boolean;
    openingBalanceBasis:
      | 'VERIFIED_TREASURY_OPENING_CASH'
      | 'UNVERIFIED_ZERO_BASIS_CUMULATIVE_NET_MOVEMENT'
      | 'REDACTED_NON_EXECUTIVE';
    openingEffectiveDateIso: string | null;
    bankStatementEvidenceRef: string | null;
    openingTreasuryCashAmt: string | null;
    forecastReceiptsTotal: string;
    actualCashReceiptsTotal: string;
    receiptsVarianceTotal: string;
    totalForecastCashOutTotal: string | null;
    actualCashPaidTotal: string | null;
    disbursementVarianceTotal: string | null;
    endingActualTreasuryClosingCash: string | null;
    peakActualTreasuryLiquidityGap: string | null;
    endingCumulativeNetCashMovementZeroBasis: string | null;
    peakCumulativeNetCashDeficitZeroBasis: string | null;
    endingForecastClosingCash: string | null;
    peakForecastLiquidityGap: string | null;
    balanceAggregationPolicy: 'NO_SUM_PERIOD_ENDING_AND_PEAK_ONLY';
  };
}

export async function loadT2ConsolidatedBoqCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string
): Promise<LoadedTemplateCanonicalData> {
  const snapshot = await db.uboqOperationalSnapshot.findFirst({
    where: {
      id: sourceId,
      projectId,
      status: 'APPROVED',
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    select: {
      id: true,
      versionNumber: true,
      approvedById: true,
      approvedAt: true,
      canonicalHash: true,
      sourceEvidenceHash: true,
      contractAuthorityId: true,
    },
  });
  if (!snapshot || !snapshot.approvedAt || !snapshot.approvedById) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }

  const [phaseLines, persistedGroups] = await Promise.all([
    db.uboqAwardedPhaseLine.findMany({
      where: { projectId, snapshotId: snapshot.id },
      orderBy: [{ phaseCode: 'asc' }, { sectionCode: 'asc' }, { itemCode: 'asc' }, { id: 'asc' }],
      take: 1001,
    }),
    db.uboqConsolidationGroup.findMany({
      where: {
        projectId,
        links: {
          some: {
            phaseLine: { projectId, snapshotId: snapshot.id },
          },
        },
      },
      include: {
        links: {
          where: { phaseLine: { projectId, snapshotId: snapshot.id } },
          include: { phaseLine: true },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: [{ groupCode: 'asc' }, { id: 'asc' }],
    }),
  ]);

  if (phaseLines.length > 1000) {
    throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
  }

  const linkedPhaseLineIds = new Set<string>();
  const rows: Array<Record<string, unknown>> = [];

  for (const grp of persistedGroups) {
    if (grp.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    if (grp.uomDimensionFamily === 'LUMP_SCOPE' && grp.links.length > 1) {
      throw new CanonicalAdapterError('TEMPLATE_UNSAFE_LUMP_SUM_CONSOLIDATION', 409, {
        groupCode: grp.groupCode,
      });
    }

    let approvedQtySum = new Prisma.Decimal(0);
    let originalQtySum = new Prisma.Decimal(0);
    let contractAmtSum = new Prisma.Decimal(0);
    const phaseCodesSet = new Set<string>();

    for (const lnk of grp.links) {
      const pl = lnk.phaseLine;
      if (pl.projectId !== projectId || pl.snapshotId !== snapshot.id) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      if (pl.specSignatureHash !== grp.specSignatureHash) {
        throw new CanonicalAdapterError('TEMPLATE_CONSOLIDATION_SPEC_MISMATCH', 409, {
          groupCode: grp.groupCode,
          phaseLineId: pl.id,
        });
      }
      const origInGroupUom = convertDecimalUomQuantity(
        pl.originalQty,
        pl.unitNormalized,
        grp.unitNormalized,
        pl.specification
      );
      approvedQtySum = approvedQtySum.plus(lnk.allocatedQty);
      originalQtySum = originalQtySum.plus(origInGroupUom);
      contractAmtSum = contractAmtSum.plus(pl.contractLineAmount);
      phaseCodesSet.add(pl.phaseCode);
      linkedPhaseLineIds.add(pl.id);
    }

    const weightedRate = approvedQtySum.gt(0)
      ? contractAmtSum.div(approvedQtySum).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      : new Prisma.Decimal(0);

    rows.push({
      project_id: projectId,
      snapshot_id: snapshot.id,
      snapshot_version: snapshot.versionNumber,
      group_code: grp.groupCode,
      consolidated_boq_item_id: grp.consolidatedBoqItemId,
      work_description: grp.canonicalDescription,
      specification: grp.specification,
      spec_signature_hash: grp.specSignatureHash,
      unit: grp.unitNormalized,
      uom_dimension_family: grp.uomDimensionFamily,
      original_qty: originalQtySum.toFixed(4),
      approved_qty: approvedQtySum.toFixed(4),
      contract_unit_rate: weightedRate.toFixed(4),
      contract_line_amount: contractAmtSum.toFixed(2),
      member_phase_line_count: grp.links.length,
      member_phase_codes: [...phaseCodesSet].sort().join(','),
    });
  }

  // Deterministic read-only fallback for any snapshot phase lines without pre-materialized links
  const unlinkedLines = phaseLines.filter((pl) => !linkedPhaseLineIds.has(pl.id));
  if (unlinkedLines.length > 0) {
    const dynamicBuckets = new Map<
      string,
      {
        canonicalDescription: string;
        specification: string | null;
        specSignatureHash: string;
        baseUom: string;
        family: string;
        approvedQtySum: Prisma.Decimal;
        originalQtySum: Prisma.Decimal;
        contractAmtSum: Prisma.Decimal;
        memberCount: number;
        phaseCodes: Set<string>;
      }
    >();

    for (const pl of unlinkedLines) {
      const uomDef = resolveUomDef(pl.unitNormalized || pl.unitRaw, pl.specification);
      const specSig =
        pl.specSignatureHash || computeSpecSignatureHash(pl.workDescription, pl.specification);
      const mergeKey =
        uomDef.dimensionFamily === 'LUMP_SCOPE'
          ? `${specSig}::LUMP::${pl.phaseCode}::${pl.itemCode}::${pl.id}`
          : `${specSig}::${uomDef.dimensionFamily}::${uomDef.packCode ?? 'CONV'}`;

      const existing = dynamicBuckets.get(mergeKey);
      if (!existing) {
        dynamicBuckets.set(mergeKey, {
          canonicalDescription: pl.workDescription.trim(),
          specification: pl.specification ? pl.specification.trim() : null,
          specSignatureHash: specSig,
          baseUom: uomDef.normalizedCode,
          family: uomDef.dimensionFamily,
          approvedQtySum: pl.approvedQty.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP),
          originalQtySum: pl.originalQty.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP),
          contractAmtSum: pl.contractLineAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
          memberCount: 1,
          phaseCodes: new Set([pl.phaseCode]),
        });
      } else {
        const convertedApproved = convertDecimalUomQuantity(
          pl.approvedQty,
          uomDef.normalizedCode,
          existing.baseUom,
          pl.specification
        );
        const convertedOriginal = convertDecimalUomQuantity(
          pl.originalQty,
          uomDef.normalizedCode,
          existing.baseUom,
          pl.specification
        );
        existing.approvedQtySum = existing.approvedQtySum.plus(convertedApproved);
        existing.originalQtySum = existing.originalQtySum.plus(convertedOriginal);
        existing.contractAmtSum = existing.contractAmtSum.plus(pl.contractLineAmount);
        existing.memberCount += 1;
        existing.phaseCodes.add(pl.phaseCode);
      }
    }

    let dynIdx = rows.length;
    for (const [, b] of dynamicBuckets.entries()) {
      dynIdx += 1;
      const weightedRate = b.approvedQtySum.gt(0)
        ? b.contractAmtSum.div(b.approvedQtySum).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(0);
      rows.push({
        project_id: projectId,
        snapshot_id: snapshot.id,
        snapshot_version: snapshot.versionNumber,
        group_code: `CGRP-${String(dynIdx).padStart(3, '0')}`,
        consolidated_boq_item_id: null,
        work_description: b.canonicalDescription,
        specification: b.specification,
        spec_signature_hash: b.specSignatureHash,
        unit: b.baseUom,
        uom_dimension_family: b.family,
        original_qty: b.originalQtySum.toFixed(4),
        approved_qty: b.approvedQtySum.toFixed(4),
        contract_unit_rate: weightedRate.toFixed(4),
        contract_line_amount: b.contractAmtSum.toFixed(2),
        member_phase_line_count: b.memberCount,
        member_phase_codes: [...b.phaseCodes].sort().join(','),
      });
    }
  }

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'group_code',
    'consolidated_boq_item_id',
    'spec_signature_hash',
    'uom_dimension_family',
    'member_phase_line_count',
    'member_phase_codes',
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: String(snapshot.versionNumber),
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById,
    approvedAtIso: snapshot.approvedAt.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
  };
}

export async function loadT3AgencyEstimateCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string
): Promise<LoadedTemplateCanonicalData> {
  const snapshot = await db.uboqOperationalSnapshot.findFirst({
    where: {
      id: sourceId,
      projectId,
      status: 'APPROVED',
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    select: {
      id: true,
      versionNumber: true,
      approvedById: true,
      approvedAt: true,
      canonicalHash: true,
      sourceEvidenceHash: true,
      contractAuthorityId: true,
    },
  });
  if (!snapshot || !snapshot.approvedAt || !snapshot.approvedById) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }

  const lines = await db.uboqAwardedPhaseLine.findMany({
    where: { projectId, snapshotId: snapshot.id },
    include: {
      agencyEstimates: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ phaseCode: 'asc' }, { sectionCode: 'asc' }, { itemCode: 'asc' }, { id: 'asc' }],
    take: 1001,
  });

  if (lines.length > 1000) {
    throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
  }

  const rows: Array<Record<string, unknown>> = lines.map((l) => {
    const est = l.agencyEstimates[0] ?? null;
    if (est && est.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }

    // R1-M02 / H06: Never synthesize Agency Estimate / ABC figures from Awarded Contract Revenue
    if (!est || l.agencyEstimateStatus === 'SOURCE_NOT_PROVIDED') {
      return {
        project_id: l.projectId,
        snapshot_id: snapshot.id,
        snapshot_version: snapshot.versionNumber,
        boq_line_id: l.id,
        agency_estimate_id: null,
        agency_estimate_status: l.agencyEstimateStatus || 'SOURCE_NOT_PROVIDED',
        phase_code: l.phaseCode,
        section_code: l.sectionCode,
        item_code: l.itemCode,
        work_description: l.workDescription,
        specification: l.specification,
        unit: l.unitNormalized,
        approved_qty: l.approvedQty.toFixed(4),
        agency_edc_amt: null,
        agency_abc: null,
        estimate_material_cost: null,
        estimate_labor_cost: null,
        estimate_equipment_cost: null,
        estimated_direct_cost: null,
        ocm_rate: null,
        ocm_amount: null,
        contingency_ocm: null,
        contractor_profit_rate: null,
        contractor_profit_amt: null,
        estimate_vat_rate: null,
        estimate_vat_amt: null,
        estimated_indirect_cost: null,
        estimated_total_unit_cost: null,
        estimated_total_amount: null,
        estimate_vat_component_rate: null,
        estimate_vat_component_base: null,
      };
    }

    const edc = est.estimatedDirectCost;
    const ocmAmt = est.ocmAmount;
    const contingencyAmt = est.contingencyOcm;
    const profitAmt = est.contractorProfitAmt;
    const estVatAmt = est.estimateVatAmt;

    // VAL-10: Indirect cost adds contingency only once alongside OCM, profit, and DUPA estimate VAT
    const nonDoubleIndirect = ocmAmt.plus(contingencyAmt).plus(profitAmt).plus(estVatAmt);
    const indirectCost = est.estimatedIndirectCost.gt(0)
      ? est.estimatedIndirectCost
      : nonDoubleIndirect;

    const totalEstAmt = est.estimatedTotalAmount.gt(0)
      ? est.estimatedTotalAmount
      : edc.plus(indirectCost);

    const totalUnitCost = est.estimatedTotalUnitCost.gt(0)
      ? est.estimatedTotalUnitCost
      : l.approvedQty.gt(0)
        ? totalEstAmt.div(l.approvedQty).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
        : new Prisma.Decimal(0);

    const ocmRate = edc.gt(0)
      ? ocmAmt.div(edc).mul(100).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4)
      : null;
    const profitRate = edc.gt(0)
      ? profitAmt.div(edc).mul(100).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4)
      : null;

    // TAX-01: DUPA estimate VAT component base & rate kept strictly distinct from 12% statutory output VAT
    const vatComponentBase = edc.plus(ocmAmt).plus(contingencyAmt).plus(profitAmt);
    const vatComponentRate = vatComponentBase.gt(0)
      ? estVatAmt
          .div(vatComponentBase)
          .mul(100)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
          .toFixed(4)
      : null;

    return {
      project_id: l.projectId,
      snapshot_id: snapshot.id,
      snapshot_version: snapshot.versionNumber,
      boq_line_id: l.id,
      agency_estimate_id: est.id,
      agency_estimate_status: l.agencyEstimateStatus,
      phase_code: l.phaseCode,
      section_code: l.sectionCode,
      item_code: l.itemCode,
      work_description: l.workDescription,
      specification: l.specification,
      unit: l.unitNormalized,
      approved_qty: l.approvedQty.toFixed(4),
      agency_edc_amt: est.agencyEdcAmt !== null ? est.agencyEdcAmt.toFixed(2) : null,
      // R1-M02: Sourced agency_abc only — never back-populated from estimatedTotalAmount or contractLineAmount
      agency_abc: est.agencyAbcAmt !== null ? est.agencyAbcAmt.toFixed(2) : null,
      estimate_material_cost: est.estimateMaterialCost.toFixed(2),
      estimate_labor_cost: est.estimateLaborCost.toFixed(2),
      estimate_equipment_cost: est.estimateEquipmentCost.toFixed(2),
      estimated_direct_cost: edc.toFixed(2),
      ocm_rate: ocmRate,
      ocm_amount: ocmAmt.toFixed(2),
      contingency_ocm: contingencyAmt.toFixed(2),
      contractor_profit_rate: profitRate,
      contractor_profit_amt: profitAmt.toFixed(2),
      estimate_vat_rate: vatComponentRate,
      estimate_vat_amt: estVatAmt.toFixed(2),
      estimated_indirect_cost: indirectCost.toFixed(2),
      estimated_total_unit_cost: totalUnitCost.toFixed(4),
      estimated_total_amount: totalEstAmt.toFixed(2),
      estimate_vat_component_rate: vatComponentRate,
      estimate_vat_component_base: vatComponentBase.toFixed(2),
    };
  });

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'boq_line_id',
    'phase_code',
    'section_code',
    'agency_estimate_id',
    'agency_estimate_status',
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: String(snapshot.versionNumber),
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById,
    approvedAtIso: snapshot.approvedAt.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
  };
}

export async function loadT4ResourceTakeoffCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string,
  options?: { requireNonEmptyForFormal?: boolean }
): Promise<LoadedTemplateCanonicalData> {
  const snapshot = await db.uboqOperationalSnapshot.findFirst({
    where: {
      id: sourceId,
      projectId,
      status: 'APPROVED',
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    include: {
      sourceDocument: {
        select: { id: true, projectId: true, sha256Hash: true },
      },
    },
  });
  if (!snapshot || !snapshot.approvedAt || !snapshot.approvedById) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (snapshot.sourceDocument && snapshot.sourceDocument.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }

  const prrRows = await db.uboqProcurementResourceRequirement.findMany({
    where: {
      projectId,
      snapshotId: snapshot.id,
      status: { in: ['APPROVED', 'SUPERSEDED'] },
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    include: {
      canonicalResource: true,
      consolidatedBoqItem: {
        select: {
          id: true,
          projectId: true,
          itemCode: true,
          uboqConsolidationGroup: {
            select: { id: true, groupCode: true },
          },
        },
      },
      sourceDocument: {
        select: { id: true, projectId: true, sha256Hash: true },
      },
      mrItems: {
        select: {
          id: true,
          mr: { select: { id: true, mrNumber: true, projectId: true } },
        },
        orderBy: { id: 'asc' },
        take: 10,
      },
      poItems: {
        select: {
          id: true,
          po: {
            select: {
              id: true,
              poNumber: true,
              mr: { select: { projectId: true } },
            },
          },
        },
        orderBy: { id: 'asc' },
        take: 10,
      },
    },
    orderBy: [
      { canonicalResource: { resourceCode: 'asc' } },
      { versionNumber: 'desc' },
      { id: 'asc' },
    ],
    take: 1001,
  });

  if (prrRows.length > 1000) {
    throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
  }

  // Deduplicate by canonicalResourceId (retaining latest approved PRR version bound to this snapshot)
  const latestByAccount = new Map<string, (typeof prrRows)[number]>();
  for (const prr of prrRows) {
    if (!latestByAccount.has(prr.canonicalResourceId)) {
      latestByAccount.set(prr.canonicalResourceId, prr);
    }
  }
  const dedupedPrrs = [...latestByAccount.values()];

  if (dedupedPrrs.length === 0) {
    if (options?.requireNonEmptyForFormal) {
      throw new CanonicalAdapterError('FORMAL_EMPTY_RESOURCE_TAKEOFF', 409, {
        snapshotId: snapshot.id,
      });
    }
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }

  const zero = new Prisma.Decimal(0);

  const rows: Array<Record<string, unknown>> = dedupedPrrs.map((prr) => {
    const acct = prr.canonicalResource;
    if (
      acct.projectId !== projectId ||
      prr.consolidatedBoqItem.projectId !== projectId ||
      (prr.sourceDocument && prr.sourceDocument.projectId !== projectId)
    ) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }

    const mrNumbers = new Set<string>();
    for (const mri of prr.mrItems) {
      if (mri.mr.projectId !== projectId) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      if (mri.mr.mrNumber) mrNumbers.add(mri.mr.mrNumber);
    }

    const poNumbers = new Set<string>();
    const poLineageIds = new Set<string>();
    for (const poi of prr.poItems) {
      if (poi.po.mr.projectId !== projectId) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      if (poi.po.poNumber) poNumbers.add(poi.po.poNumber);
      poLineageIds.add(poi.id);
    }

    const requiredQtyDec = prr.requiredQty.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const allocStockDec = acct.allocatedUsableStockQty.toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const openMrDec = acct.openMrReservedQty.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const committedPoDec = acct.openCommittedPoQty.toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const deliveredDec = acct.deliveredReceivedQty.toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const consumedDec = acct.consumedIssuedQty.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    // Exact Prisma.Decimal mirror of computeCanonicalAccountBalances (resource-ledger.ts)
    const rawPhysicalStock = allocStockDec.plus(deliveredDec).minus(consumedDec);
    const stockAvailableDec = Prisma.Decimal.max(zero, rawPhysicalStock).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const totalCoveredDec = allocStockDec
      .plus(openMrDec)
      .plus(committedPoDec)
      .plus(deliveredDec);
    const rawRemainingDec = requiredQtyDec.minus(totalCoveredDec);
    const resourceToProcureDec = Prisma.Decimal.max(zero, rawRemainingDec).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const overcommittedDec = rawRemainingDec.lt(0)
      ? rawRemainingDec.abs().toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      : zero;
    const isOvercommitted = overcommittedDec.gt(0);

    // STRICT BENCHMARK / PRR INTERNAL COST CEILING SEPARATION:
    // Uses ONLY internal benchmarkUnitCost / targetResourceUnitCost and procurementBudget.
    // Awarded BOQ contractUnitRate / contractLineAmount are NEVER mixed into T4.
    const targetUnitCostDec = prr.benchmarkUnitCost.gt(0)
      ? prr.benchmarkUnitCost.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      : acct.targetResourceUnitCost.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const computedBudget2dp = requiredQtyDec
      .mul(targetUnitCostDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const procurementBudgetDec = prr.procurementBudget.gt(0)
      ? prr.procurementBudget.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : computedBudget2dp;
    const budgetDelta2dp = procurementBudgetDec.minus(computedBudget2dp);

    const groupCode =
      prr.consolidatedBoqItem.uboqConsolidationGroup?.groupCode ??
      prr.consolidatedBoqItem.itemCode;
    const docId = prr.sourceDocumentId ?? snapshot.sourceDocumentId ?? null;
    const docSha =
      prr.sourceDocument?.sha256Hash ?? snapshot.sourceDocument?.sha256Hash ?? null;

    return {
      project_id: projectId,
      snapshot_id: snapshot.id,
      snapshot_version: snapshot.versionNumber,
      canonical_resource_id: acct.id,
      resource_id: acct.resourceCode,
      prr_id: prr.id,
      prr_version: prr.versionNumber,
      group_code: groupCode,
      consolidated_boq_item_id: prr.consolidatedBoqItemId,
      resource_description: acct.resourceDescription,
      resource_spec: acct.resourceSpec,
      spec_signature_hash: acct.specSignatureHash,
      resource_unit: acct.resourceUomNormalized,
      uom_dimension_family: acct.uomDimensionFamily,
      resource_class: acct.resourceClass,
      fulfillment_channel: acct.fulfillmentChannel,
      resource_qty_basis: prr.takeoffBasis,
      resource_coeff: prr.resourceCoeff !== null ? prr.resourceCoeff.toFixed(6) : null,
      resource_summary_qty:
        prr.summaryVerifiedQty !== null ? prr.summaryVerifiedQty.toFixed(4) : null,
      resource_required_qty: requiredQtyDec.toFixed(4),
      allocated_usable_stock_qty: allocStockDec.toFixed(4),
      open_mr_reserved_qty: openMrDec.toFixed(4),
      committed_qty: committedPoDec.toFixed(4),
      delivered_received_qty: deliveredDec.toFixed(4),
      consumed_issued_qty: consumedDec.toFixed(4),
      stock_available_qty: stockAvailableDec.toFixed(4),
      resource_to_procure: resourceToProcureDec.toFixed(4),
      target_resource_cost: targetUnitCostDec.toFixed(4),
      procurement_budget: procurementBudgetDec.toFixed(2),
      benchmark_unit_cost_exact: prr.benchmarkUnitCost.toFixed(4),
      computed_qty_times_target_cost_2dp: computedBudget2dp.toFixed(2),
      budget_line_delta_2dp: budgetDelta2dp.toFixed(2),
      is_overcommitted_by_revision: isOvercommitted,
      overcommitted_qty_exact: overcommittedDec.toFixed(4),
      mrf_id: mrNumbers.size > 0 ? [...mrNumbers].join(', ') : null,
      supplier_po_id: poNumbers.size > 0 ? [...poNumbers].join(', ') : null,
      po_item_lineage_id: poLineageIds.size > 0 ? [...poLineageIds].join(',') : null,
      source_document_id: docId,
      source_document_sha256: docSha,
      source_sheet_name: prr.sourceSheetName,
      source_cell_ref: prr.sourceCellRef,
    };
  });

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'canonical_resource_id',
    'resource_id',
    'prr_id',
    'prr_version',
    'group_code',
    'consolidated_boq_item_id',
    'resource_class',
    'fulfillment_channel',
    'uom_dimension_family',
    'resource_qty_basis',
    'is_overcommitted_by_revision',
    'overcommitted_qty_exact',
    'source_document_id',
    'source_document_sha256',
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: String(snapshot.versionNumber),
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById,
    approvedAtIso: snapshot.approvedAt.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
  };
}

// ============================================================================
// BATCH B SHARED CANONICAL BRIDGING & DECIMAL ALLOCATION HELPERS (T5, T6, T7)
// ============================================================================

function allocateDecimalProRata(
  total: Prisma.Decimal,
  weights: readonly Prisma.Decimal[],
  decimalPlaces: number
): Prisma.Decimal[] {
  if (weights.length === 0) return [];
  if (weights.length === 1) {
    return [total.toDecimalPlaces(decimalPlaces, Prisma.Decimal.ROUND_HALF_UP)];
  }
  const weightSum = weights.reduce((acc, w) => acc.plus(w), new Prisma.Decimal(0));
  if (weightSum.lte(0)) {
    const zero = new Prisma.Decimal(0).toDecimalPlaces(decimalPlaces);
    const out = weights.map(() => zero);
    out[out.length - 1] = total.toDecimalPlaces(decimalPlaces, Prisma.Decimal.ROUND_HALF_UP);
    return out;
  }

  const out: Prisma.Decimal[] = [];
  let running = new Prisma.Decimal(0);
  for (let i = 0; i < weights.length - 1; i += 1) {
    const share = total
      .mul(weights[i])
      .div(weightSum)
      .toDecimalPlaces(decimalPlaces, Prisma.Decimal.ROUND_HALF_UP);
    out.push(share);
    running = running.plus(share);
  }
  out.push(
    total.toDecimalPlaces(decimalPlaces, Prisma.Decimal.ROUND_HALF_UP).minus(running)
  );
  return out;
}

function normalizePricingType(raw: string | null | undefined): 'UNIT_PRICE' | 'LUMP_SUM' | 'MILESTONE' {
  const upper = (raw || '').trim().toUpperCase();
  if (upper === 'LUMP_SUM') return 'LUMP_SUM';
  if (upper === 'MILESTONE') return 'MILESTONE';
  return 'UNIT_PRICE';
}

interface VerifiedInspectionClaimSummary {
  measuredDec: Prisma.Decimal;
  certifiedDec: Prisma.Decimal;
  inspectionIdsJoined: string | null;
  primaryInspectorName: string | null;
}

function verifyApprovedInspectionsForClaim(params: {
  accomplishmentId: string;
  accomplishmentItemId: string;
  boqItemId: string;
  rawClaimDec: Prisma.Decimal;
  inspections: ReadonlyArray<{
    id: string;
    approvalStatus: string;
    actualQuantityVerified: number | Prisma.Decimal | null;
    approvedQuantity: number | Prisma.Decimal | null;
    inspectorName: string | null;
    remarks?: string | null;
    inspectionFindings?: string | null;
  }>;
}): VerifiedInspectionClaimSummary {
  const zero = new Prisma.Decimal(0);
  const approvedInspections = params.inspections.filter(
    (ins) => ins.approvalStatus.trim().toUpperCase() === 'APPROVED'
  );

  if (params.rawClaimDec.lte(0)) {
    const first = approvedInspections[0] ?? null;
    const meas = first
      ? new Prisma.Decimal(String(first.actualQuantityVerified ?? 0)).toDecimalPlaces(
          4,
          Prisma.Decimal.ROUND_HALF_UP
        )
      : zero;
    return {
      measuredDec: meas,
      certifiedDec: params.rawClaimDec,
      inspectionIdsJoined: first?.id ?? null,
      primaryInspectorName: first?.inspectorName ?? null,
    };
  }

  if (approvedInspections.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_MISSING_INSPECTION_EVIDENCE', 409, {
      accomplishmentId: params.accomplishmentId,
      accomplishmentItemId: params.accomplishmentItemId,
      boqItemId: params.boqItemId,
    });
  }

  let totalInspectedApprovedDec = zero;
  let totalInspectedVerifiedDec = zero;
  const seenScopeKeys = new Set<string>();

  for (const ins of approvedInspections) {
    const insApprovedDec = new Prisma.Decimal(String(ins.approvedQuantity ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const insVerifiedDec = new Prisma.Decimal(
      String(ins.actualQuantityVerified ?? 0)
    ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    if (insApprovedDec.lt(0) || (insVerifiedDec.gt(0) && insApprovedDec.gt(insVerifiedDec))) {
      throw new CanonicalAdapterError('TEMPLATE_INSPECTION_QUANTITY_INVALID', 409, {
        accomplishmentId: params.accomplishmentId,
        accomplishmentItemId: params.accomplishmentItemId,
        boqItemId: params.boqItemId,
        inspectionId: ins.id,
        approvedQuantity: insApprovedDec.toFixed(4),
        actualQuantityVerified: insVerifiedDec.toFixed(4),
      });
    }

    if (approvedInspections.length > 1) {
      const scopeRaw =
        (ins.remarks || '').trim() || (ins.inspectionFindings || '').trim();
      if (!scopeRaw) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_INSPECTION_LINKAGE', 409, {
          accomplishmentId: params.accomplishmentId,
          accomplishmentItemId: params.accomplishmentItemId,
          boqItemId: params.boqItemId,
          inspectionId: ins.id,
          reason: 'MULTI_INSPECTION_MISSING_LOT_SCOPE_LINKAGE',
        });
      }
      const normScope = scopeRaw.toUpperCase();
      if (seenScopeKeys.has(normScope)) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_INSPECTION_LINKAGE', 409, {
          accomplishmentId: params.accomplishmentId,
          accomplishmentItemId: params.accomplishmentItemId,
          boqItemId: params.boqItemId,
          duplicateLotScope: scopeRaw,
          reason: 'DUPLICATE_INSPECTION_LOT_SCOPE',
        });
      }
      seenScopeKeys.add(normScope);
    }

    totalInspectedApprovedDec = totalInspectedApprovedDec.plus(insApprovedDec);
    totalInspectedVerifiedDec = totalInspectedVerifiedDec.plus(
      insVerifiedDec.gt(0) ? insVerifiedDec : insApprovedDec
    );
  }

  totalInspectedApprovedDec = totalInspectedApprovedDec.toDecimalPlaces(
    4,
    Prisma.Decimal.ROUND_HALF_UP
  );
  totalInspectedVerifiedDec = totalInspectedVerifiedDec.toDecimalPlaces(
    4,
    Prisma.Decimal.ROUND_HALF_UP
  );

  if (totalInspectedApprovedDec.lt(params.rawClaimDec)) {
    throw new CanonicalAdapterError('TEMPLATE_INSPECTION_QUANTITY_INSUFFICIENT', 409, {
      accomplishmentId: params.accomplishmentId,
      accomplishmentItemId: params.accomplishmentItemId,
      boqItemId: params.boqItemId,
      claimedCertifiedQty: params.rawClaimDec.toFixed(4),
      verifiedApprovedInspectionQty: totalInspectedApprovedDec.toFixed(4),
    });
  }

  return {
    measuredDec: totalInspectedVerifiedDec,
    // Strictly cap certified quantity at the approved item claim even when inspected quantity exceeds claim
    certifiedDec: params.rawClaimDec,
    inspectionIdsJoined:
      approvedInspections.length === 1
        ? approvedInspections[0].id
        : approvedInspections.map((i) => i.id).join(','),
    primaryInspectorName: approvedInspections[0].inspectorName ?? null,
  };
}

interface ReconciledVoItemQuantities {
  preVoQtyDec: Prisma.Decimal;
  qtyDeltaDec: Prisma.Decimal;
  postVoQtyDec: Prisma.Decimal;
  isDeductiveClass: boolean;
  isAdditiveClass: boolean;
}

function reconcileApprovedVoItemQuantities(
  item: {
    id: string;
    voItemNumber?: string | null;
    itemClassification?: string | null;
    originalQuantity?: number | null;
    previouslyApprovedQuantity?: number | null;
    currentProposedQuantity?: number | null;
    revisedQuantity?: number | null;
    additionalAmount?: number | null;
    deductiveAmount?: number | null;
    netAmount?: number | null;
  },
  baselineOrigQtyDec: Prisma.Decimal,
  priorVoQtyDeltaDec: Prisma.Decimal,
  voClassification: 'CLIENT_CONTRACT_VO' | 'SUBCONTRACTOR_COMMITMENT_VO',
  errCtx: Record<string, unknown>
): ReconciledVoItemQuantities {
  const zero = new Prisma.Decimal(0);
  const qtyTol = new Prisma.Decimal('0.0001');
  const amtTol = new Prisma.Decimal('0.05');

  if (
    item.originalQuantity === null ||
    item.originalQuantity === undefined ||
    !Number.isFinite(Number(item.originalQuantity)) ||
    item.currentProposedQuantity === null ||
    item.currentProposedQuantity === undefined ||
    !Number.isFinite(Number(item.currentProposedQuantity)) ||
    item.revisedQuantity === null ||
    item.revisedQuantity === undefined ||
    !Number.isFinite(Number(item.revisedQuantity)) ||
    (item.previouslyApprovedQuantity !== null &&
      item.previouslyApprovedQuantity !== undefined &&
      !Number.isFinite(Number(item.previouslyApprovedQuantity)))
  ) {
    throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
      ...errCtx,
      reason: 'VO_ITEM_QUANTITY_FIELD_MISSING_OR_INVALID',
    });
  }

  const origQtyDec = new Prisma.Decimal(String(item.originalQuantity)).toDecimalPlaces(
    4,
    Prisma.Decimal.ROUND_HALF_UP
  );
  const prevAppQtyDec = new Prisma.Decimal(
    String(item.previouslyApprovedQuantity ?? 0)
  ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
  const propQtyRawDec = new Prisma.Decimal(String(item.currentProposedQuantity)).toDecimalPlaces(
    4,
    Prisma.Decimal.ROUND_HALF_UP
  );
  const revQtyDec = new Prisma.Decimal(String(item.revisedQuantity)).toDecimalPlaces(
    4,
    Prisma.Decimal.ROUND_HALF_UP
  );

  if (origQtyDec.lt(zero.minus(qtyTol)) || revQtyDec.lt(zero.minus(qtyTol))) {
    throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
      ...errCtx,
      originalQuantity: origQtyDec.toFixed(4),
      revisedQuantity: revQtyDec.toFixed(4),
      reason: 'VO_ITEM_NEGATIVE_ORIGINAL_OR_REVISED_QUANTITY',
    });
  }

  const expectedCumPreVoQty = baselineOrigQtyDec
    .plus(priorVoQtyDeltaDec)
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

  let preVoQtyDec: Prisma.Decimal;
  if (voClassification === 'CLIENT_CONTRACT_VO') {
    if (origQtyDec.minus(baselineOrigQtyDec).abs().lte(qtyTol)) {
      if (prevAppQtyDec.minus(priorVoQtyDeltaDec).abs().gt(qtyTol)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
          ...errCtx,
          originalQuantity: origQtyDec.toFixed(4),
          previouslyApprovedQuantity: prevAppQtyDec.toFixed(4),
          expectedPriorVoDelta: priorVoQtyDeltaDec.toFixed(4),
          reason: 'VO_ITEM_PREVIOUSLY_APPROVED_QUANTITY_CONFLICTS_WITH_PRIOR_VO_LINEAGE',
        });
      }
      preVoQtyDec = expectedCumPreVoQty;
    } else if (
      !priorVoQtyDeltaDec.isZero() &&
      prevAppQtyDec.isZero() &&
      origQtyDec.minus(expectedCumPreVoQty).abs().lte(qtyTol)
    ) {
      preVoQtyDec = expectedCumPreVoQty;
    } else {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        ...errCtx,
        originalQuantity: origQtyDec.toFixed(4),
        baselineOriginalQuantity: baselineOrigQtyDec.toFixed(4),
        expectedCumulativePreVoQuantity: expectedCumPreVoQty.toFixed(4),
        reason: 'VO_ITEM_ORIGINAL_QUANTITY_CONFLICTS_WITH_CANONICAL_BOQ_BASELINE',
      });
    }
  } else {
    if (!baselineOrigQtyDec.isZero() && origQtyDec.isZero()) {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        ...errCtx,
        originalQuantity: origQtyDec.toFixed(4),
        baselineOriginalQuantity: baselineOrigQtyDec.toFixed(4),
        reason: 'SUBCON_VO_ITEM_ZERO_ORIGINAL_QUANTITY_CONFLICTS_WITH_NONZERO_BASELINE',
      });
    }
    preVoQtyDec = origQtyDec.plus(prevAppQtyDec).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    if (preVoQtyDec.lt(zero.minus(qtyTol))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        ...errCtx,
        preVoQuantity: preVoQtyDec.toFixed(4),
        reason: 'SUBCON_VO_ITEM_NEGATIVE_PRE_VO_QUANTITY',
      });
    }
  }

  const clsUpper = (item.itemClassification || '').trim().toUpperCase();
  const isDeductiveClass =
    clsUpper.includes('DEDUCT') ||
    clsUpper.includes('OMIT') ||
    clsUpper.includes('DECREASE') ||
    clsUpper.includes('REDUC');
  const isAdditiveClass =
    !isDeductiveClass &&
    (clsUpper.includes('ADD') ||
      clsUpper.includes('EXTRA') ||
      clsUpper.includes('INCREASE') ||
      clsUpper.includes('NEW'));

  const itemAddTmp = new Prisma.Decimal(String(item.additionalAmount ?? 0)).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );
  const netTmp = new Prisma.Decimal(String(item.netAmount ?? 0)).toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );

  let signedPropQtyDec: Prisma.Decimal;
  if (isAdditiveClass) {
    if (propQtyRawDec.lt(zero.minus(qtyTol))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        ...errCtx,
        itemClassification: item.itemClassification ?? null,
        currentProposedQuantity: propQtyRawDec.toFixed(4),
        reason: 'ADDITIVE_VO_ITEM_HAS_NEGATIVE_PROPOSED_QUANTITY',
      });
    }
    signedPropQtyDec = propQtyRawDec;
  } else if (isDeductiveClass) {
    if (propQtyRawDec.lt(zero)) {
      signedPropQtyDec = propQtyRawDec;
    } else if (propQtyRawDec.gt(zero)) {
      const candidateRevAfterDeduct = preVoQtyDec
        .minus(propQtyRawDec)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      if (
        revQtyDec.minus(candidateRevAfterDeduct).abs().lte(qtyTol) &&
        itemAddTmp.lte(amtTol) &&
        netTmp.lte(amtTol)
      ) {
        signedPropQtyDec = propQtyRawDec.negated();
      } else {
        throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
          ...errCtx,
          itemClassification: item.itemClassification ?? null,
          preVoQuantity: preVoQtyDec.toFixed(4),
          currentProposedQuantity: propQtyRawDec.toFixed(4),
          revisedQuantity: revQtyDec.toFixed(4),
          reason: 'DEDUCTIVE_VO_ITEM_DIRECTION_CONFLICTS_WITH_REVISED_QUANTITY_OR_AMOUNT',
        });
      }
    } else {
      signedPropQtyDec = zero;
    }
  } else {
    signedPropQtyDec = propQtyRawDec;
  }

  const expectedRevQtyDec = preVoQtyDec
    .plus(signedPropQtyDec)
    .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

  if (expectedRevQtyDec.lt(zero.minus(qtyTol))) {
    throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
      ...errCtx,
      preVoQuantity: preVoQtyDec.toFixed(4),
      qtyDelta: signedPropQtyDec.toFixed(4),
      expectedRevisedQuantity: expectedRevQtyDec.toFixed(4),
      reason: 'VO_ITEM_DEDUCTION_EXCEEDS_AVAILABLE_PRE_VO_QUANTITY',
    });
  }

  if (revQtyDec.minus(expectedRevQtyDec).abs().gt(qtyTol)) {
    throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
      ...errCtx,
      preVoQuantity: preVoQtyDec.toFixed(4),
      qtyDelta: signedPropQtyDec.toFixed(4),
      expectedRevisedQuantity: expectedRevQtyDec.toFixed(4),
      recordedRevisedQuantity: revQtyDec.toFixed(4),
      reason: 'VO_ITEM_REVISED_QUANTITY_DISAGREES_WITH_PRE_VO_PLUS_PROPOSED_DELTA',
    });
  }

  return {
    preVoQtyDec,
    qtyDeltaDec: signedPropQtyDec,
    postVoQtyDec: revQtyDec,
    isDeductiveClass,
    isAdditiveClass,
  };
}

interface HistoricalSnapshotBridgeContext {
  periodCutoffDate: Date;
  sourceEntityId: string;
  templateCode: 'T5_ACCOMPLISHMENT_CERT' | 'T6_PROGRESS_BILLING';
  billingContractBaseline?: {
    contractAmount: number;
    revisedContractAmount: number;
  };
}

async function loadApprovedSnapshotPhaseBridge(
  db: Prisma.TransactionClient,
  projectId: string,
  context: HistoricalSnapshotBridgeContext
) {
  const allSnapshots = await db.uboqOperationalSnapshot.findMany({
    where: {
      projectId,
      status: { in: ['APPROVED', 'SUPERSEDED'] },
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    include: {
      sourceDocument: {
        select: { id: true, projectId: true, sha256Hash: true },
      },
      contractAuthority: {
        include: { taxProfile: true },
      },
    },
    orderBy: [{ versionNumber: 'asc' }, { id: 'asc' }],
  });

  if (allSnapshots.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }

  const cutoffMs = context.periodCutoffDate.getTime();
  const eligibleByCutoff = allSnapshots.filter(
    (s) => s.approvedAt !== null && s.approvedById !== null && s.approvedAt.getTime() <= cutoffMs
  );
  if (eligibleByCutoff.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_HISTORICAL_SNAPSHOT_NOT_FOUND', 409, {
      projectId,
      sourceId: context.sourceEntityId,
      templateCode: context.templateCode,
      periodCutoffIso: context.periodCutoffDate.toISOString(),
    });
  }

  const supersededIdsAtCutoff = new Set(
    eligibleByCutoff
      .map((s) => s.supersedesSnapshotId)
      .filter((id): id is string => typeof id === 'string')
  );
  const activeCandidates = eligibleByCutoff.filter((s) => !supersededIdsAtCutoff.has(s.id));

  if (activeCandidates.length !== 1) {
    throw new CanonicalAdapterError('TEMPLATE_HISTORICAL_SNAPSHOT_AMBIGUOUS', 409, {
      projectId,
      sourceId: context.sourceEntityId,
      templateCode: context.templateCode,
      periodCutoffIso: context.periodCutoffDate.toISOString(),
      candidateSnapshotIds: activeCandidates.map((c) => c.id),
    });
  }

  const snapshot = activeCandidates[0];
  if (!snapshot.approvedAt || !snapshot.approvedById) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (snapshot.sourceDocument && snapshot.sourceDocument.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }

  // IR-02: Require verified historical contract-rate authority effective on or before the period cutoff
  if (!snapshot.contractAuthorityId) {
    throw new CanonicalAdapterError('TEMPLATE_CONTRACT_RATE_ASSOCIATION_UNVERIFIED', 409, {
      projectId,
      sourceId: context.sourceEntityId,
      snapshotId: snapshot.id,
      reason: 'MISSING_SNAPSHOT_CONTRACT_AUTHORITY_LINK',
    });
  }
  const ca = snapshot.contractAuthority;
  if (!ca || ca.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }
  if (ca.status !== 'APPROVED' || !ca.approvedAt || !ca.approvedById) {
    throw new CanonicalAdapterError('TEMPLATE_CONTRACT_RATE_ASSOCIATION_UNVERIFIED', 409, {
      projectId,
      sourceId: context.sourceEntityId,
      snapshotId: snapshot.id,
      contractAuthorityId: snapshot.contractAuthorityId,
      reason: 'LINKED_CONTRACT_NOT_APPROVED',
    });
  }
  if (ca.approvedAt.getTime() > cutoffMs) {
    throw new CanonicalAdapterError('TEMPLATE_CONTRACT_RATE_ASSOCIATION_UNVERIFIED', 409, {
      projectId,
      sourceId: context.sourceEntityId,
      snapshotId: snapshot.id,
      contractAuthorityId: snapshot.contractAuthorityId,
      contractApprovedAtIso: ca.approvedAt.toISOString(),
      periodCutoffIso: context.periodCutoffDate.toISOString(),
      reason: 'LINKED_CONTRACT_POSTDATES_PERIOD_CUTOFF',
    });
  }
  if (ca.taxProfile && ca.taxProfile.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }

  const isSupersededHistoricalSnapshot = allSnapshots.some(
    (s) => s.supersedesSnapshotId === snapshot.id
  );

  const [phaseLines, projectBoqItems, approvedClientVos] = await Promise.all([
    db.uboqAwardedPhaseLine.findMany({
      where: { projectId, snapshotId: snapshot.id },
      include: {
        sourceDocument: { select: { id: true, projectId: true, sha256Hash: true } },
      },
      orderBy: [{ phaseCode: 'asc' }, { sectionCode: 'asc' }, { itemCode: 'asc' }, { id: 'asc' }],
      take: 1001,
    }),
    db.awardedBOQItem.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        itemCode: true,
        quantity: true,
        approvedClientVoQuantity: true,
      },
    }),
    db.variationOrder.findMany({
      where: {
        projectId,
        subcontractPackageId: null,
        currentStatus: { in: ['APPROVED', 'approved'] },
      },
      select: {
        id: true,
        voNumber: true,
        projectId: true,
        subcontractPackageId: true,
        approvals: {
          where: { action: { in: ['APPROVED', 'approved'] } },
          select: { createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        items: {
          where: {
            approvalStatus: { in: ['APPROVED', 'approved'] },
            originalBoqItemId: { not: null },
          },
          select: {
            id: true,
            voItemNumber: true,
            itemClassification: true,
            originalBoqItemId: true,
            originalQuantity: true,
            previouslyApprovedQuantity: true,
            revisedQuantity: true,
            currentProposedQuantity: true,
            additionalAmount: true,
            deductiveAmount: true,
            netAmount: true,
          },
          orderBy: [{ voItemNumber: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
  ]);

  if (phaseLines.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (phaseLines.length > 1000) {
    throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
  }

  const boqById = new Map(projectBoqItems.map((b) => [b.id, b]));
  const boqByCode = new Map<string, (typeof projectBoqItems)[number][]>();
  for (const b of projectBoqItems) {
    const key = b.itemCode.trim().toUpperCase();
    const arr = boqByCode.get(key) ?? [];
    arr.push(b);
    boqByCode.set(key, arr);
  }

  // Map each snapshot phase line deterministically to its AwardedBOQItem (if present)
  const phaseLineBoqId = new Map<string, string | null>();
  const phaseLinesByBoqId = new Map<string, typeof phaseLines>();
  for (const pl of phaseLines) {
    if (pl.sourceDocument && pl.sourceDocument.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    let resolvedBoqId: string | null = null;
    if (pl.awardedBoqItemId) {
      const boq = boqById.get(pl.awardedBoqItemId);
      if (!boq || boq.projectId !== projectId) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      resolvedBoqId = boq.id;
    } else {
      const candidates = boqByCode.get(pl.itemCode.trim().toUpperCase()) ?? [];
      if (candidates.length === 1) {
        resolvedBoqId = candidates[0].id;
      }
    }
    phaseLineBoqId.set(pl.id, resolvedBoqId);
    if (resolvedBoqId) {
      const list = phaseLinesByBoqId.get(resolvedBoqId) ?? [];
      list.push(pl);
      phaseLinesByBoqId.set(resolvedBoqId, list);
    }
  }

  // Approved Client VO delta per AwardedBOQItem (Subcontractor VOs strictly excluded via subcontractPackageId: null)
  const zero = new Prisma.Decimal(0);
  const voDeltaByBoqId = new Map<string, Prisma.Decimal>();
  const voRefsByBoqId = new Map<string, string[]>();
  const voTrackedBoqIds = new Set<string>();

  for (const vo of approvedClientVos) {
    if (vo.projectId !== projectId || vo.subcontractPackageId !== null) continue;
    const latestVoApproval = vo.approvals[0]?.createdAt ?? null;
    const postdatesCutoff = latestVoApproval !== null && latestVoApproval.getTime() > cutoffMs;

    for (const item of vo.items) {
      if (!item.originalBoqItemId) continue;
      const boq = boqById.get(item.originalBoqItemId);
      if (!boq || boq.projectId !== projectId) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      voTrackedBoqIds.add(boq.id);
      if (postdatesCutoff) {
        continue;
      }
      const memberPhaseLines = phaseLinesByBoqId.get(boq.id) ?? [];
      const baselineOrigQtyDec =
        memberPhaseLines.length > 0
          ? memberPhaseLines
              .reduce((acc, pl) => acc.plus(pl.originalQty), zero)
              .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
          : new Prisma.Decimal(String(boq.quantity ?? 0)).toDecimalPlaces(
              4,
              Prisma.Decimal.ROUND_HALF_UP
            );
      const priorDeltaDec = voDeltaByBoqId.get(boq.id) ?? zero;
      const { qtyDeltaDec: deltaDec } = reconcileApprovedVoItemQuantities(
        item,
        baselineOrigQtyDec,
        priorDeltaDec,
        'CLIENT_CONTRACT_VO',
        {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber ?? null,
          awardedBoqItemId: boq.id,
        }
      );
      voDeltaByBoqId.set(boq.id, priorDeltaDec.plus(deltaDec));
      const refs = voRefsByBoqId.get(boq.id) ?? [];
      if (!refs.includes(vo.voNumber)) refs.push(vo.voNumber);
      voRefsByBoqId.set(boq.id, refs);
    }
  }

  // Fallback to AwardedBOQItem.approvedClientVoQuantity only on active non-superseded snapshot when no VO rows track that item
  if (!isSupersededHistoricalSnapshot) {
    for (const boq of projectBoqItems) {
      if (!voTrackedBoqIds.has(boq.id) && !voDeltaByBoqId.has(boq.id) && boq.approvedClientVoQuantity !== 0) {
        voDeltaByBoqId.set(
          boq.id,
          new Prisma.Decimal(String(boq.approvedClientVoQuantity)).toDecimalPlaces(
            4,
            Prisma.Decimal.ROUND_HALF_UP
          )
        );
      }
    }
  }

  // Allocate approved Client VO delta across sharing phase lines without double counting (deducting any VO delta already baked into snapshot approvedQty)
  const allocatedVoQtyByPhaseLineId = new Map<string, Prisma.Decimal>();
  const voRefByPhaseLineId = new Map<string, string | null>();
  for (const [boqId, members] of phaseLinesByBoqId.entries()) {
    const rawVoDelta = (voDeltaByBoqId.get(boqId) ?? zero).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const snapOrigSum = members.reduce((acc, m) => acc.plus(m.originalQty), zero);
    const snapApprSum = members.reduce((acc, m) => acc.plus(m.approvedQty), zero);
    const bakedSignedDelta = snapApprSum.minus(snapOrigSum);
    const totalVoDelta = rawVoDelta.gt(0)
      ? Prisma.Decimal.max(zero, rawVoDelta.minus(Prisma.Decimal.max(zero, bakedSignedDelta))).toDecimalPlaces(
          4,
          Prisma.Decimal.ROUND_HALF_UP
        )
      : rawVoDelta.lt(0)
        ? Prisma.Decimal.min(zero, rawVoDelta.minus(Prisma.Decimal.min(zero, bakedSignedDelta))).toDecimalPlaces(
            4,
            Prisma.Decimal.ROUND_HALF_UP
          )
        : zero;
    const shares = allocateDecimalProRata(
      totalVoDelta,
      members.map((m) => m.approvedQty),
      4
    );
    const refs = voRefsByBoqId.get(boqId);
    const refText = refs && refs.length > 0 ? refs.join(', ') : null;
    members.forEach((m, idx) => {
      allocatedVoQtyByPhaseLineId.set(m.id, shares[idx]);
      voRefByPhaseLineId.set(m.id, refText);
    });
  }

  // Verify T6 Billing contract header baseline matches the resolved historical snapshot & contract authority
  if (context.billingContractBaseline) {
    const snapshotBaseTotalDec = phaseLines
      .reduce((acc, pl) => acc.plus(pl.contractLineAmount), zero)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const snapshotRevisedTotalDec = phaseLines
      .reduce((acc, pl) => {
        const voDec = allocatedVoQtyByPhaseLineId.get(pl.id) ?? zero;
        const lineAmt = voDec.isZero()
          ? pl.contractLineAmount
          : pl.approvedQty
              .plus(voDec)
              .mul(pl.contractUnitRate)
              .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        return acc.plus(lineAmt);
      }, zero)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const caOrigDec = (
      ca.awardedRevenue.gt(0) ? ca.awardedRevenue : ca.awardedRevenueExVat
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const caExVatDec = ca.awardedRevenueExVat.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const caCurrDec = ca.currentContractValue.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const tol = new Prisma.Decimal('0.05');

    const bilOrigDec = new Prisma.Decimal(
      String(context.billingContractBaseline.contractAmount ?? 0)
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const bilRevDec = new Prisma.Decimal(
      String(context.billingContractBaseline.revisedContractAmount ?? 0)
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const origMatches =
      bilOrigDec.lte(0) ||
      bilOrigDec.minus(caOrigDec).abs().lte(tol) ||
      bilOrigDec.minus(caExVatDec).abs().lte(tol) ||
      bilOrigDec.minus(snapshotBaseTotalDec).abs().lte(tol);
    const revMatches =
      bilRevDec.lte(0) ||
      bilRevDec.minus(caCurrDec).abs().lte(tol) ||
      bilRevDec.minus(snapshotRevisedTotalDec).abs().lte(tol) ||
      bilRevDec.minus(snapshotBaseTotalDec).abs().lte(tol);

    if (!origMatches || !revMatches) {
      throw new CanonicalAdapterError('TEMPLATE_CONTRACT_RATE_ASSOCIATION_UNVERIFIED', 409, {
        projectId,
        sourceId: context.sourceEntityId,
        snapshotId: snapshot.id,
        contractAuthorityId: ca.id,
        billingContractAmount: bilOrigDec.toFixed(2),
        billingRevisedContractAmount: bilRevDec.toFixed(2),
        snapshotBaseTotal: snapshotBaseTotalDec.toFixed(2),
        snapshotRevisedTotal: snapshotRevisedTotalDec.toFixed(2),
        contractAwardAmount: caOrigDec.toFixed(2),
        contractCurrentValue: caCurrDec.toFixed(2),
        reason: 'BILLING_HEADER_CONTRACT_BASELINE_MISMATCH',
      });
    }
  }

  const earliestSnapshotApprovedAt = eligibleByCutoff.reduce(
    (minDate, s) =>
      s.approvedAt && s.approvedAt.getTime() < minDate.getTime() ? s.approvedAt : minDate,
    snapshot.approvedAt
  );

  return {
    snapshot,
    earliestSnapshotApprovedAt,
    verifiedContractAuthority: ca,
    phaseLines,
    boqById,
    phaseLineBoqId,
    phaseLinesByBoqId,
    allocatedVoQtyByPhaseLineId,
    voRefByPhaseLineId,
  };
}

export async function loadT5AccomplishmentCertCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string
): Promise<LoadedTemplateCanonicalData> {
  const accomplishment = await db.accomplishment.findFirst({
    where: { id: sourceId, projectId },
    include: {
      items: {
        include: {
          boqItem: { select: { id: true, projectId: true, itemCode: true } },
          inspections: {
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          },
        },
        orderBy: { id: 'asc' },
      },
    },
  });
  if (!accomplishment || accomplishment.status.trim().toUpperCase() !== 'APPROVED') {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (accomplishment.items.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_EMPTY_ACCOMPLISHMENT', 409, {
      accomplishmentId: accomplishment.id,
    });
  }

  const bridge = await loadApprovedSnapshotPhaseBridge(db, projectId, {
    periodCutoffDate: accomplishment.accomplishmentDate,
    sourceEntityId: accomplishment.id,
    templateCode: 'T5_ACCOMPLISHMENT_CERT',
  });
  const { snapshot, phaseLines, phaseLinesByBoqId, allocatedVoQtyByPhaseLineId, voRefByPhaseLineId } =
    bridge;

  const zero = new Prisma.Decimal(0);

  // Precompute effective approved ceiling per AwardedBOQItem on the resolved historical snapshot
  const boqCeilingMap = new Map<string, Prisma.Decimal>();
  for (const [boqId, members] of phaseLinesByBoqId.entries()) {
    const ceiling = members.reduce(
      (acc, m) => acc.plus(m.approvedQty).plus(allocatedVoQtyByPhaseLineId.get(m.id) ?? zero),
      zero
    );
    boqCeilingMap.set(boqId, ceiling.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP));
  }

  // Aggregate AccomplishmentItem claims per AwardedBOQItem and enforce IR-03 inspection quantity integrity
  const claimedByBoqId = new Map<
    string,
    {
      prevQty: Prisma.Decimal;
      measuredQty: Prisma.Decimal;
      certifiedQty: Prisma.Decimal;
      measurementId: string;
      inspectionId: string | null;
      inspectorName: string | null;
    }
  >();

  for (const ai of accomplishment.items) {
    if (!ai.boqItem || ai.boqItem.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const mappedMembers = phaseLinesByBoqId.get(ai.boqItemId);
    if (!mappedMembers || mappedMembers.length === 0) {
      throw new CanonicalAdapterError('TEMPLATE_UNMAPPED_BOQ_PHASE_LINE', 409, {
        accomplishmentId: accomplishment.id,
        boqItemId: ai.boqItemId,
      });
    }

    const prevDec = new Prisma.Decimal(String(ai.previousQuantity ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const rawClaimDec = new Prisma.Decimal(
      String(
        ai.approvedQuantity !== null && ai.approvedQuantity !== undefined
          ? ai.approvedQuantity
          : ai.currentQuantityClaimed ?? 0
      )
    ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    const verifiedInsp = verifyApprovedInspectionsForClaim({
      accomplishmentId: accomplishment.id,
      accomplishmentItemId: ai.id,
      boqItemId: ai.boqItemId,
      rawClaimDec,
      inspections: ai.inspections,
    });

    const existing = claimedByBoqId.get(ai.boqItemId);
    if (!existing) {
      claimedByBoqId.set(ai.boqItemId, {
        prevQty: prevDec,
        measuredQty: verifiedInsp.measuredDec,
        certifiedQty: verifiedInsp.certifiedDec,
        measurementId: verifiedInsp.inspectionIdsJoined?.split(',')[0] ?? ai.id,
        inspectionId: verifiedInsp.inspectionIdsJoined,
        inspectorName: verifiedInsp.primaryInspectorName,
      });
    } else {
      existing.measuredQty = existing.measuredQty.plus(verifiedInsp.measuredDec);
      existing.certifiedQty = existing.certifiedQty.plus(verifiedInsp.certifiedDec);
      if (verifiedInsp.inspectionIdsJoined) {
        const mergedIds = new Set(
          [
            ...(existing.inspectionId ? existing.inspectionId.split(',') : []),
            ...verifiedInsp.inspectionIdsJoined.split(','),
          ].filter(Boolean)
        );
        existing.inspectionId = [...mergedIds].join(',');
      }
    }
  }

  // Prior approved accomplishments strictly before this SWA — reconcile ALL approved historical quantities (IR-02 + IR2-01):
  // Never silently skip or drop an earlier approved record when inspection, history continuity, snapshot cutoff, or ceiling checks fail.
  const rawPriorAccomplishments = await db.accomplishment.findMany({
    where: {
      projectId,
      id: { not: accomplishment.id },
      status: { in: ['APPROVED', 'approved'] },
      accomplishmentDate: { lte: accomplishment.accomplishmentDate },
    },
    include: {
      items: {
        include: {
          inspections: {
            orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
          },
        },
        orderBy: { id: 'asc' },
      },
    },
    orderBy: [{ accomplishmentDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  const historicalCertifiedByBoqId = new Map<string, Prisma.Decimal>();
  const priorUnresolvedIssues: Array<Record<string, string>> = [];

  for (const pa of rawPriorAccomplishments) {
    const isEarlier =
      pa.accomplishmentDate.getTime() < accomplishment.accomplishmentDate.getTime() ||
      (pa.accomplishmentDate.getTime() === accomplishment.accomplishmentDate.getTime() &&
        (pa.createdAt.getTime() < accomplishment.createdAt.getTime() ||
          (pa.createdAt.getTime() === accomplishment.createdAt.getTime() &&
            pa.id < accomplishment.id)));
    if (!isEarlier) continue;

    if (pa.accomplishmentDate.getTime() < bridge.earliestSnapshotApprovedAt.getTime()) {
      priorUnresolvedIssues.push({
        priorAccomplishmentId: pa.id,
        accomplishmentDateIso: pa.accomplishmentDate.toISOString(),
        reason: 'PRIOR_ACCOMPLISHMENT_PREDATES_APPROVED_SNAPSHOT',
      });
    }
    if (pa.items.length === 0) {
      priorUnresolvedIssues.push({
        priorAccomplishmentId: pa.id,
        accomplishmentDateIso: pa.accomplishmentDate.toISOString(),
        reason: 'PRIOR_ACCOMPLISHMENT_EMPTY_ITEMS',
      });
      continue;
    }

    const perBoq = new Map<string, { prevQty: Prisma.Decimal; certQty: Prisma.Decimal }>();
    for (const pai of pa.items) {
      const pPrev = new Prisma.Decimal(String(pai.previousQuantity ?? 0)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const pClaim = new Prisma.Decimal(
        String(
          pai.approvedQuantity !== null && pai.approvedQuantity !== undefined
            ? pai.approvedQuantity
            : pai.currentQuantityClaimed ?? 0
        )
      ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

      if (pPrev.lt(0) || pClaim.lt(0)) {
        priorUnresolvedIssues.push({
          priorAccomplishmentId: pa.id,
          accomplishmentItemId: pai.id,
          boqItemId: pai.boqItemId,
          reason: 'PRIOR_ACCOMPLISHMENT_NEGATIVE_QUANTITY',
          statedPreviousQty: pPrev.toFixed(4),
          statedCertifiedQty: pClaim.toFixed(4),
        });
      }

      let effectiveCertQty = Prisma.Decimal.max(zero, pClaim);
      try {
        const vInsp = verifyApprovedInspectionsForClaim({
          accomplishmentId: pa.id,
          accomplishmentItemId: pai.id,
          boqItemId: pai.boqItemId,
          rawClaimDec: Prisma.Decimal.max(zero, pClaim),
          inspections: pai.inspections,
        });
        effectiveCertQty = Prisma.Decimal.max(effectiveCertQty, vInsp.certifiedDec);
      } catch (inspErr) {
        const inspReason =
          inspErr instanceof CanonicalAdapterError
            ? inspErr.code
            : 'PRIOR_ACCOMPLISHMENT_INSPECTION_UNVERIFIED';
        priorUnresolvedIssues.push({
          priorAccomplishmentId: pa.id,
          accomplishmentItemId: pai.id,
          boqItemId: pai.boqItemId,
          reason: inspReason,
          statedCertifiedQty: pClaim.toFixed(4),
        });
      }

      const ex = perBoq.get(pai.boqItemId);
      if (!ex) {
        perBoq.set(pai.boqItemId, { prevQty: pPrev, certQty: effectiveCertQty });
      } else {
        if (!ex.prevQty.eq(pPrev)) {
          priorUnresolvedIssues.push({
            priorAccomplishmentId: pa.id,
            accomplishmentItemId: pai.id,
            boqItemId: pai.boqItemId,
            reason: 'PRIOR_ACCOMPLISHMENT_DUPLICATE_BOQ_PREV_MISMATCH',
            firstPreviousQty: ex.prevQty.toFixed(4),
            conflictingPreviousQty: pPrev.toFixed(4),
          });
          ex.prevQty = Prisma.Decimal.max(ex.prevQty, pPrev);
        }
        ex.certQty = ex.certQty.plus(effectiveCertQty);
      }
    }

    for (const [bId, qInfo] of perBoq.entries()) {
      if (!phaseLinesByBoqId.has(bId)) {
        priorUnresolvedIssues.push({
          priorAccomplishmentId: pa.id,
          boqItemId: bId,
          reason: 'PRIOR_ACCOMPLISHMENT_UNMAPPED_BOQ_ITEM',
          statedCertifiedQty: qInfo.certQty.toFixed(4),
        });
      }
      const existingCum = historicalCertifiedByBoqId.get(bId);
      if (existingCum !== undefined && !qInfo.prevQty.eq(existingCum)) {
        priorUnresolvedIssues.push({
          priorAccomplishmentId: pa.id,
          boqItemId: bId,
          reason: 'PRIOR_ACCOMPLISHMENT_HISTORY_MISMATCH',
          statedPreviousQty: qInfo.prevQty.toFixed(4),
          authoritativePriorCertifiedQty: existingCum.toFixed(4),
        });
      }
      const nonDecreasingBase =
        existingCum !== undefined
          ? Prisma.Decimal.max(existingCum, Prisma.Decimal.max(zero, qInfo.prevQty))
          : Prisma.Decimal.max(zero, qInfo.prevQty);
      const nextCum = nonDecreasingBase
        .plus(Prisma.Decimal.max(zero, qInfo.certQty))
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      const ceil = boqCeilingMap.get(bId);
      if (ceil !== undefined && nextCum.gt(ceil)) {
        priorUnresolvedIssues.push({
          priorAccomplishmentId: pa.id,
          boqItemId: bId,
          reason: 'PRIOR_ACCOMPLISHMENT_OVER_CEILING',
          cumulativeCertifiedQty: nextCum.toFixed(4),
          ceilingQty: ceil.toFixed(4),
        });
      }
      historicalCertifiedByBoqId.set(bId, nextCum);
    }
  }

  // Allocate quantities across sharing phase lines without double counting, enforcing IR-02 + IR2-01 cumulative reconciliation
  const lineSwaData = new Map<
    string,
    {
      prevQty: Prisma.Decimal;
      measuredQty: Prisma.Decimal;
      certifiedQty: Prisma.Decimal;
      measurementId: string;
      inspectionId: string | null;
    }
  >();

  // First check cumulative overbilling ceiling against the non-reduced historical baseline across all claimed BOQ items
  for (const [boqId] of phaseLinesByBoqId.entries()) {
    const claimed = claimedByBoqId.get(boqId);
    if (!claimed) continue;
    const priorAuthCum = historicalCertifiedByBoqId.get(boqId) ?? zero;
    const boqCeiling = boqCeilingMap.get(boqId) ?? zero;
    const reconciledPrev = Prisma.Decimal.max(claimed.prevQty, priorAuthCum);
    if (
      claimed.certifiedQty.lt(0) ||
      reconciledPrev.plus(claimed.certifiedQty).gt(boqCeiling)
    ) {
      throw new CanonicalAdapterError('TEMPLATE_OVERBILLING_CEILING_EXCEEDED', 409, {
        accomplishmentId: accomplishment.id,
        boqItemId: boqId,
        statedPreviousQty: claimed.prevQty.toFixed(4),
        authoritativePriorCertifiedQty: priorAuthCum.toFixed(4),
        currentCertifiedQty: claimed.certifiedQty.toFixed(4),
        ceilingQty: boqCeiling.toFixed(4),
      });
    }
  }

  // Reject if any earlier approved accomplishment on this project remains unresolved (audit-safe non-financial diagnostics only)
  if (priorUnresolvedIssues.length > 0) {
    throw new CanonicalAdapterError('TEMPLATE_PRIOR_CERTIFICATE_UNRESOLVED', 409, {
      certificateType: 'T5_ACCOMPLISHMENT_CERT',
      accomplishmentId: accomplishment.id,
      unresolvedPriorIssueCount: priorUnresolvedIssues.length,
      unresolvedPriorIssues: priorUnresolvedIssues.slice(0, 10),
    });
  }

  for (const [boqId, members] of phaseLinesByBoqId.entries()) {
    const weights = members.map((m) => m.approvedQty);
    const claimed = claimedByBoqId.get(boqId);
    const hasPriorForBoq = historicalCertifiedByBoqId.has(boqId);
    const priorAuthCum = historicalCertifiedByBoqId.get(boqId) ?? zero;
    const boqCeiling = boqCeilingMap.get(boqId) ?? zero;

    if (priorAuthCum.gt(boqCeiling)) {
      throw new CanonicalAdapterError('TEMPLATE_OVERBILLING_CEILING_EXCEEDED', 409, {
        accomplishmentId: accomplishment.id,
        boqItemId: boqId,
        authoritativePriorCertifiedQty: priorAuthCum.toFixed(4),
        ceilingQty: boqCeiling.toFixed(4),
      });
    }

    if (claimed && hasPriorForBoq && !claimed.prevQty.eq(priorAuthCum)) {
      throw new CanonicalAdapterError(
        'TEMPLATE_PREVIOUS_BILLING_RECONCILIATION_MISMATCH',
        409,
        {
          accomplishmentId: accomplishment.id,
          boqItemId: boqId,
          statedPreviousQty: claimed.prevQty.toFixed(4),
          authoritativePriorCertifiedQty: priorAuthCum.toFixed(4),
        }
      );
    }

    const totalPrev = claimed ? claimed.prevQty : priorAuthCum;
    const totalMeas = claimed ? claimed.measuredQty : zero;
    const totalCert = claimed ? claimed.certifiedQty : zero;

    const prevShares = allocateDecimalProRata(totalPrev, weights, 4);
    const measShares = allocateDecimalProRata(totalMeas, weights, 4);
    const certShares = allocateDecimalProRata(totalCert, weights, 4);

    members.forEach((m, idx) => {
      lineSwaData.set(m.id, {
        prevQty: prevShares[idx],
        measuredQty: measShares[idx],
        certifiedQty: certShares[idx],
        measurementId: claimed
          ? members.length > 1
            ? `${claimed.measurementId}:${m.phaseCode}`
            : claimed.measurementId
          : `${accomplishment.id}:UNCLAIMED:${m.id}`,
        inspectionId: claimed?.inspectionId ?? null,
      });
    });
  }

  let certifiedCurrAmtTotalDec = zero;
  let priorCertifiedAmtTotalDec = zero;
  let cumCertifiedAmtTotalDec = zero;
  let revisedContractTotalDec = zero;

  const rows: Array<Record<string, unknown>> = phaseLines.map((pl) => {
    const voQtyDec = allocatedVoQtyByPhaseLineId.get(pl.id) ?? zero;
    const effectiveApprovedQtyDec = pl.approvedQty
      .plus(voQtyDec)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const swa = lineSwaData.get(pl.id) ?? {
      prevQty: zero,
      measuredQty: zero,
      certifiedQty: zero,
      measurementId: `${accomplishment.id}:UNCLAIMED:${pl.id}`,
      inspectionId: null,
    };

    // Enforce VAL-12..15 via canonical validation engine
    const validation = validateAccomplishmentAndBillingClaim({
      boqLineId: pl.id,
      pricingType: normalizePricingType(pl.pricingType),
      approvedWorkQty: Number(pl.approvedQty),
      approvedClientVoQty: Number(voQtyDec),
      contractUnitRate: Number(pl.contractUnitRate),
      prevCertifiedQty: Number(swa.prevQty),
      currentClaimedQty: Number(swa.certifiedQty),
      claimSourceBasis: 'ENGINEER_MEASURED_INSPECTED',
      hasApprovedInspectionEvidence: swa.certifiedQty.lte(0) || swa.inspectionId !== null,
    });

    const cumQtyDec = swa.prevQty
      .plus(swa.certifiedQty)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    if (
      !validation.valid ||
      swa.certifiedQty.lt(0) ||
      cumQtyDec.gt(effectiveApprovedQtyDec)
    ) {
      const hasMissingInspection = validation.issues.some((i) => i.ruleCode === 'VAL-13');
      throw new CanonicalAdapterError(
        hasMissingInspection
          ? 'TEMPLATE_MISSING_INSPECTION_EVIDENCE'
          : 'TEMPLATE_OVERBILLING_CEILING_EXCEEDED',
        409,
        {
          accomplishmentId: accomplishment.id,
          boqLineId: pl.id,
          itemCode: pl.itemCode,
          cumCertifiedQty: cumQtyDec.toFixed(4),
          ceilingQty: effectiveApprovedQtyDec.toFixed(4),
        }
      );
    }

    const remainingQtyDec = Prisma.Decimal.max(
      zero,
      effectiveApprovedQtyDec.minus(cumQtyDec)
    ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    const progressPctDec = effectiveApprovedQtyDec.gt(0)
      ? cumQtyDec
          .div(effectiveApprovedQtyDec)
          .mul(100)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      : zero;

    // Strictly Awarded BOQ contractUnitRate for any monetary SWA valuation
    const currCertAmtDec = swa.certifiedQty
      .mul(pl.contractUnitRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const priorCertAmtDec = swa.prevQty
      .mul(pl.contractUnitRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const cumCertAmtDec = cumQtyDec
      .mul(pl.contractUnitRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const revisedLineAmtDec = voQtyDec.isZero()
      ? pl.contractLineAmount
      : effectiveApprovedQtyDec
          .mul(pl.contractUnitRate)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    certifiedCurrAmtTotalDec = certifiedCurrAmtTotalDec.plus(currCertAmtDec);
    priorCertifiedAmtTotalDec = priorCertifiedAmtTotalDec.plus(priorCertAmtDec);
    cumCertifiedAmtTotalDec = cumCertifiedAmtTotalDec.plus(cumCertAmtDec);
    revisedContractTotalDec = revisedContractTotalDec.plus(revisedLineAmtDec);

    const docId = pl.sourceDocumentId ?? snapshot.sourceDocumentId ?? null;
    const docSha = pl.sourceDocument?.sha256Hash ?? snapshot.sourceDocument?.sha256Hash ?? null;

    return {
      project_id: projectId,
      snapshot_id: snapshot.id,
      snapshot_version: snapshot.versionNumber,
      accomplishment_id: accomplishment.id,
      billing_period: accomplishment.billingPeriod,
      boq_line_id: pl.id,
      awarded_boq_item_id: bridge.phaseLineBoqId.get(pl.id) ?? null,
      measurement_id: swa.measurementId,
      inspection_id: swa.inspectionId,
      phase_code: pl.phaseCode,
      section_code: pl.sectionCode,
      item_code: pl.itemCode,
      work_description: pl.workDescription,
      specification: pl.specification,
      unit: pl.unitNormalized,
      pricing_type: pl.pricingType,
      vo_reference: voRefByPhaseLineId.get(pl.id) ?? null,
      original_qty: pl.originalQty.toFixed(4),
      snapshot_approved_qty_pre_vo: pl.approvedQty.toFixed(4),
      approved_client_vo_qty: voQtyDec.toFixed(4),
      approved_qty: effectiveApprovedQtyDec.toFixed(4),
      prev_certified_qty: swa.prevQty.toFixed(4),
      current_measured_qty: swa.measuredQty.toFixed(4),
      certified_curr_qty: swa.certifiedQty.toFixed(4),
      cum_certified_qty: cumQtyDec.toFixed(4),
      remaining_qty: remainingQtyDec.toFixed(4),
      physical_progress_pct: progressPctDec.toFixed(4),
      contract_unit_rate: pl.contractUnitRate.toFixed(4),
      contract_line_amount: revisedLineAmtDec.toFixed(2),
      prior_certified_amt: priorCertAmtDec.toFixed(2),
      certified_curr_amt: currCertAmtDec.toFixed(2),
      source_document_id: docId,
      source_document_sha256: docSha,
    };
  });

  const weightedProgressPct = revisedContractTotalDec.gt(0)
    ? cumCertifiedAmtTotalDec
        .div(revisedContractTotalDec)
        .mul(100)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
        .toFixed(4)
    : '0.0000';

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'accomplishment_id',
    'boq_line_id',
    'awarded_boq_item_id',
    'measurement_id',
    'inspection_id',
    'phase_code',
    'section_code',
    'snapshot_approved_qty_pre_vo',
    'approved_client_vo_qty',
    'source_document_id',
    'source_document_sha256',
  ] as const;

  return {
    sourceId: accomplishment.id,
    sourceVersion: `${accomplishment.id}@v${snapshot.versionNumber}`,
    rows,
    systemMetaFields,
    approvedById: accomplishment.preparedById ?? snapshot.approvedById ?? 'SNAPSHOT_AUTHORITY',
    approvedAtIso: accomplishment.accomplishmentDate.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
    swaSummary: {
      accomplishmentId: accomplishment.id,
      billingPeriod: accomplishment.billingPeriod,
      accomplishmentDateIso: accomplishment.accomplishmentDate.toISOString(),
      snapshotId: snapshot.id,
      snapshotVersionNumber: snapshot.versionNumber,
      certifiedCurrentAmountTotal: certifiedCurrAmtTotalDec.toFixed(2),
      priorCertifiedAmountTotal: priorCertifiedAmtTotalDec.toFixed(2),
      cumulativeCertifiedAmountTotal: cumCertifiedAmtTotalDec.toFixed(2),
      revisedContractLineTotal: revisedContractTotalDec.toFixed(2),
      weightedPhysicalProgressPct: weightedProgressPct,
    },
  };
}

export async function loadT6ProgressBillingCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string
): Promise<LoadedTemplateCanonicalData> {
  const billing = await db.billing.findFirst({
    where: { id: sourceId, projectId },
    include: {
      items: {
        include: {
          boqItem: { select: { id: true, projectId: true, itemCode: true } },
        },
        orderBy: { id: 'asc' },
      },
      deductions: {
        orderBy: { id: 'asc' },
      },
      payments: {
        orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }],
      },
    },
  });

  const normStatus = billing?.status.trim().toUpperCase() ?? '';
  const approvedById = billing?.approvedById?.trim() || null;
  if (
    !billing ||
    !approvedById ||
    !['APPROVED', 'APPROVED_FOR_PAYMENT', 'PAID'].includes(normStatus)
  ) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (billing.items.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_EMPTY_BILLING', 409, {
      billingId: billing.id,
    });
  }

  const bridge = await loadApprovedSnapshotPhaseBridge(db, projectId, {
    periodCutoffDate: billing.billingPeriodTo,
    sourceEntityId: billing.id,
    templateCode: 'T6_PROGRESS_BILLING',
    billingContractBaseline: {
      contractAmount: billing.contractAmount,
      revisedContractAmount: billing.revisedContractAmount,
    },
  });
  const {
    snapshot,
    verifiedContractAuthority,
    phaseLines,
    phaseLinesByBoqId,
    allocatedVoQtyByPhaseLineId,
    voRefByPhaseLineId,
  } = bridge;

  // Tax profile comes strictly from the verified historical contract authority
  const verifiedTaxProfile = verifiedContractAuthority.taxProfile ?? null;
  if (verifiedTaxProfile && verifiedTaxProfile.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }

  const zero = new Prisma.Decimal(0);

  // Precompute effective approved ceiling per AwardedBOQItem on the resolved historical snapshot
  const boqCeilingMap = new Map<string, Prisma.Decimal>();
  for (const [boqId, members] of phaseLinesByBoqId.entries()) {
    const ceiling = members.reduce(
      (acc, m) => acc.plus(m.approvedQty).plus(allocatedVoQtyByPhaseLineId.get(m.id) ?? zero),
      zero
    );
    boqCeilingMap.set(boqId, ceiling.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP));
  }

  // Aggregate BillingItem quantities per AwardedBOQItem
  const billedByBoqId = new Map<
    string,
    { prevQty: Prisma.Decimal; currQty: Prisma.Decimal; legacyUnitCost: number }
  >();
  for (const bi of billing.items) {
    if (!bi.boqItem || bi.boqItem.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const mappedMembers = phaseLinesByBoqId.get(bi.boqItemId);
    if (!mappedMembers || mappedMembers.length === 0) {
      throw new CanonicalAdapterError('TEMPLATE_UNMAPPED_BOQ_PHASE_LINE', 409, {
        billingId: billing.id,
        boqItemId: bi.boqItemId,
      });
    }
    const prevDec = new Prisma.Decimal(String(bi.previousQuantityBilled ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const currDec = new Prisma.Decimal(String(bi.currentQuantityForBilling ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const existing = billedByBoqId.get(bi.boqItemId);
    if (!existing) {
      billedByBoqId.set(bi.boqItemId, {
        prevQty: prevDec,
        currQty: currDec,
        legacyUnitCost: bi.unitCost,
      });
    } else {
      existing.currQty = existing.currQty.plus(currDec);
    }
  }

  // Reconcile carried-forward previousQuantityBilled against ALL prior approved Billing certificates (IR-02 + IR2-01):
  // Never silently skip or exclude an earlier approved billing record when history continuity, snapshot cutoff, approver metadata, or ceiling checks fail.
  const rawPriorBillings = await db.billing.findMany({
    where: {
      projectId,
      id: { not: billing.id },
      status: {
        in: [
          'APPROVED',
          'APPROVED_FOR_PAYMENT',
          'PAID',
          'approved',
          'approved_for_payment',
          'paid',
        ],
      },
    },
    include: {
      items: {
        orderBy: { id: 'asc' },
      },
    },
    orderBy: [{ billingPeriodTo: 'asc' }, { billingDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
  });

  const authoritativePriorBilledByBoqId = new Map<string, Prisma.Decimal>();
  const priorBillingUnresolvedIssues: Array<Record<string, string>> = [];

  for (const pb of rawPriorBillings) {
    const isEarlier =
      pb.billingPeriodTo.getTime() < billing.billingPeriodTo.getTime() ||
      (pb.billingPeriodTo.getTime() === billing.billingPeriodTo.getTime() &&
        (pb.billingDate.getTime() < billing.billingDate.getTime() ||
          (pb.billingDate.getTime() === billing.billingDate.getTime() &&
            (pb.createdAt.getTime() < billing.createdAt.getTime() ||
              (pb.createdAt.getTime() === billing.createdAt.getTime() &&
                pb.id < billing.id)))));
    if (!isEarlier) continue;

    if (!pb.approvedById || pb.approvedById.trim() === '') {
      priorBillingUnresolvedIssues.push({
        priorBillingId: pb.id,
        billingPeriodToIso: pb.billingPeriodTo.toISOString(),
        reason: 'PRIOR_BILLING_MISSING_APPROVER',
      });
    }
    if (pb.billingPeriodTo.getTime() < bridge.earliestSnapshotApprovedAt.getTime()) {
      priorBillingUnresolvedIssues.push({
        priorBillingId: pb.id,
        billingPeriodToIso: pb.billingPeriodTo.toISOString(),
        reason: 'PRIOR_BILLING_PREDATES_APPROVED_SNAPSHOT',
      });
    }
    if (pb.items.length === 0) {
      priorBillingUnresolvedIssues.push({
        priorBillingId: pb.id,
        billingPeriodToIso: pb.billingPeriodTo.toISOString(),
        reason: 'PRIOR_BILLING_EMPTY_ITEMS',
      });
      continue;
    }

    const perBoq = new Map<string, { prevQty: Prisma.Decimal; currQty: Prisma.Decimal }>();
    for (const pbi of pb.items) {
      const pPrev = new Prisma.Decimal(String(pbi.previousQuantityBilled ?? 0)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const pCurr = new Prisma.Decimal(String(pbi.currentQuantityForBilling ?? 0)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
      if (pPrev.lt(0) || pCurr.lt(0)) {
        priorBillingUnresolvedIssues.push({
          priorBillingId: pb.id,
          billingItemId: pbi.id,
          boqItemId: pbi.boqItemId,
          reason: 'PRIOR_BILLING_NEGATIVE_QUANTITY',
          statedPreviousBilledQty: pPrev.toFixed(4),
          statedCurrentBilledQty: pCurr.toFixed(4),
        });
      }
      const safeCurr = Prisma.Decimal.max(zero, pCurr);
      const ex = perBoq.get(pbi.boqItemId);
      if (!ex) {
        perBoq.set(pbi.boqItemId, { prevQty: pPrev, currQty: safeCurr });
      } else {
        if (!ex.prevQty.eq(pPrev)) {
          priorBillingUnresolvedIssues.push({
            priorBillingId: pb.id,
            billingItemId: pbi.id,
            boqItemId: pbi.boqItemId,
            reason: 'PRIOR_BILLING_DUPLICATE_BOQ_PREV_MISMATCH',
            firstPreviousBilledQty: ex.prevQty.toFixed(4),
            conflictingPreviousBilledQty: pPrev.toFixed(4),
          });
          ex.prevQty = Prisma.Decimal.max(ex.prevQty, pPrev);
        }
        ex.currQty = ex.currQty.plus(safeCurr);
      }
    }

    for (const [bId, qInfo] of perBoq.entries()) {
      if (!phaseLinesByBoqId.has(bId)) {
        priorBillingUnresolvedIssues.push({
          priorBillingId: pb.id,
          boqItemId: bId,
          reason: 'PRIOR_BILLING_UNMAPPED_BOQ_ITEM',
          statedCurrentBilledQty: qInfo.currQty.toFixed(4),
        });
      }
      const existingCum = authoritativePriorBilledByBoqId.get(bId);
      if (existingCum !== undefined && !qInfo.prevQty.eq(existingCum)) {
        priorBillingUnresolvedIssues.push({
          priorBillingId: pb.id,
          boqItemId: bId,
          reason: 'PRIOR_BILLING_HISTORY_MISMATCH',
          statedPreviousBilledQty: qInfo.prevQty.toFixed(4),
          authoritativePriorBilledQty: existingCum.toFixed(4),
        });
      }
      const nonDecreasingBase =
        existingCum !== undefined
          ? Prisma.Decimal.max(existingCum, Prisma.Decimal.max(zero, qInfo.prevQty))
          : Prisma.Decimal.max(zero, qInfo.prevQty);
      const nextCum = nonDecreasingBase
        .plus(Prisma.Decimal.max(zero, qInfo.currQty))
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      const ceil = boqCeilingMap.get(bId);
      if (ceil !== undefined && nextCum.gt(ceil)) {
        priorBillingUnresolvedIssues.push({
          priorBillingId: pb.id,
          boqItemId: bId,
          reason: 'PRIOR_BILLING_OVER_CEILING',
          cumulativeBilledQty: nextCum.toFixed(4),
          ceilingQty: ceil.toFixed(4),
        });
      }
      authoritativePriorBilledByBoqId.set(bId, nextCum);
    }
  }

  // Allocate billed quantities across sharing phase lines without double counting, enforcing IR-02 + IR2-01 cumulative reconciliation
  const lineBillQtyMap = new Map<string, { prevQty: Prisma.Decimal; currQty: Prisma.Decimal }>();

  // First check cumulative overbilling ceiling against the non-reduced historical baseline across all billed BOQ items
  for (const [boqId] of phaseLinesByBoqId.entries()) {
    const billed = billedByBoqId.get(boqId);
    if (!billed) continue;
    const priorAuthCum = authoritativePriorBilledByBoqId.get(boqId) ?? zero;
    const boqCeiling = boqCeilingMap.get(boqId) ?? zero;
    const reconciledPrev = Prisma.Decimal.max(billed.prevQty, priorAuthCum);
    if (billed.currQty.lt(0) || reconciledPrev.plus(billed.currQty).gt(boqCeiling)) {
      throw new CanonicalAdapterError('TEMPLATE_OVERBILLING_CEILING_EXCEEDED', 409, {
        billingId: billing.id,
        boqItemId: boqId,
        statedPreviousBilledQty: billed.prevQty.toFixed(4),
        authoritativePriorBilledQty: priorAuthCum.toFixed(4),
        currentBillingQty: billed.currQty.toFixed(4),
        ceilingQty: boqCeiling.toFixed(4),
      });
    }
  }

  // Reject if any earlier approved billing certificate on this project remains unresolved (audit-safe non-financial diagnostics only)
  if (priorBillingUnresolvedIssues.length > 0) {
    throw new CanonicalAdapterError('TEMPLATE_PRIOR_CERTIFICATE_UNRESOLVED', 409, {
      certificateType: 'T6_PROGRESS_BILLING',
      billingId: billing.id,
      unresolvedPriorIssueCount: priorBillingUnresolvedIssues.length,
      unresolvedPriorIssues: priorBillingUnresolvedIssues.slice(0, 10),
    });
  }

  for (const [boqId, members] of phaseLinesByBoqId.entries()) {
    const billed = billedByBoqId.get(boqId);
    const hasPriorForBoq = authoritativePriorBilledByBoqId.has(boqId);
    const priorAuthCum = authoritativePriorBilledByBoqId.get(boqId) ?? zero;
    const boqCeiling = boqCeilingMap.get(boqId) ?? zero;

    if (priorAuthCum.gt(boqCeiling)) {
      throw new CanonicalAdapterError('TEMPLATE_OVERBILLING_CEILING_EXCEEDED', 409, {
        billingId: billing.id,
        boqItemId: boqId,
        authoritativePriorBilledQty: priorAuthCum.toFixed(4),
        ceilingQty: boqCeiling.toFixed(4),
      });
    }

    if (billed && hasPriorForBoq && !billed.prevQty.eq(priorAuthCum)) {
      throw new CanonicalAdapterError(
        'TEMPLATE_PREVIOUS_BILLING_RECONCILIATION_MISMATCH',
        409,
        {
          billingId: billing.id,
          boqItemId: boqId,
          statedPreviousBilledQty: billed.prevQty.toFixed(4),
          authoritativePriorBilledQty: priorAuthCum.toFixed(4),
        }
      );
    }

    const weights = members.map((m) => m.approvedQty);
    const prevShares = allocateDecimalProRata(billed ? billed.prevQty : priorAuthCum, weights, 4);
    const currShares = allocateDecimalProRata(billed ? billed.currQty : zero, weights, 4);
    members.forEach((m, idx) => {
      lineBillQtyMap.set(m.id, { prevQty: prevShares[idx], currQty: currShares[idx] });
    });
  }

  // First pass: validate VAL-14 ceilings and compute exact Awarded BOQ certified line amounts
  const baseLines = phaseLines.map((pl) => {
    const voQtyDec = allocatedVoQtyByPhaseLineId.get(pl.id) ?? zero;
    const effectiveApprovedQtyDec = pl.approvedQty
      .plus(voQtyDec)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const billQty = lineBillQtyMap.get(pl.id) ?? { prevQty: zero, currQty: zero };
    const cumQtyDec = billQty.prevQty
      .plus(billQty.currQty)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);

    if (billQty.currQty.lt(0) || cumQtyDec.gt(effectiveApprovedQtyDec)) {
      throw new CanonicalAdapterError('TEMPLATE_OVERBILLING_CEILING_EXCEEDED', 409, {
        billingId: billing.id,
        boqLineId: pl.id,
        itemCode: pl.itemCode,
        cumBilledQty: cumQtyDec.toFixed(4),
        ceilingQty: effectiveApprovedQtyDec.toFixed(4),
      });
    }

    // STRICT AWARDED BOQ BILLING RATE INVARIANT: always use UboqAwardedPhaseLine.contractUnitRate
    const currCertAmtDec = billQty.currQty
      .mul(pl.contractUnitRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const priorCertAmtDec = billQty.prevQty
      .mul(pl.contractUnitRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const revisedLineAmtDec = voQtyDec.isZero()
      ? pl.contractLineAmount
      : effectiveApprovedQtyDec
          .mul(pl.contractUnitRate)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      pl,
      voQtyDec,
      effectiveApprovedQtyDec,
      prevQtyDec: billQty.prevQty,
      currQtyDec: billQty.currQty,
      currCertAmtDec,
      priorCertAmtDec,
      revisedLineAmtDec,
    };
  });

  const totalCurrCertAmtDec = baseLines.reduce(
    (acc, l) => acc.plus(l.currCertAmtDec),
    zero
  );
  const totalPriorCertAmtDec = baseLines.reduce(
    (acc, l) => acc.plus(l.priorCertAmtDec),
    zero
  );

  // Sum explicit BillingDeduction adjustments & matched Payment collections
  let explicitRetentionDec = zero;
  let explicitRecoupDec = zero;
  let explicitWithholdingDec = zero;
  let explicitVatDec = zero;
  let explicitGrossDec = zero;
  let explicitOtherDeductionsDec = zero;
  for (const d of billing.deductions) {
    explicitGrossDec = explicitGrossDec.plus(new Prisma.Decimal(String(d.grossBilling ?? 0)));
    explicitRetentionDec = explicitRetentionDec.plus(new Prisma.Decimal(String(d.retention ?? 0)));
    explicitRecoupDec = explicitRecoupDec.plus(
      new Prisma.Decimal(String(d.mobilizationAdvanceRecoupment ?? 0))
    );
    explicitWithholdingDec = explicitWithholdingDec.plus(
      new Prisma.Decimal(String(d.withholdingTax ?? 0))
    );
    explicitVatDec = explicitVatDec.plus(new Prisma.Decimal(String(d.vat ?? 0)));
    explicitOtherDeductionsDec = explicitOtherDeductionsDec
      .plus(new Prisma.Decimal(String(d.previousOverpayment ?? 0)))
      .plus(new Prisma.Decimal(String(d.liquidatedDamages ?? 0)))
      .plus(new Prisma.Decimal(String(d.backCharges ?? 0)))
      .plus(new Prisma.Decimal(String(d.otherDeductions ?? 0)));
  }
  explicitOtherDeductionsDec = explicitOtherDeductionsDec.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );

  const validPaidStatuses = new Set([
    'PAID',
    'COMPLETED',
    'POSTED',
    'CLEARED',
    'VERIFIED',
    'PARTIAL',
  ]);
  const totalPaymentReceivedDec = billing.payments
    .filter((p) => validPaidStatuses.has(p.paymentStatus.trim().toUpperCase()))
    .reduce(
      (acc, p) => acc.plus(new Prisma.Decimal(String(p.amountPaid ?? 0))),
      zero
    )
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  let taxProfileVersion: string;
  let salesVatCategory: string;
  let outputVatRatePct: string;
  let govVatWithholdingRatePct: string;
  let ewtRatePct: string;
  let retentionRatePct: string;
  let advanceRecoupmentRatePct: string;
  let contractVatInclusive: boolean;

  let exVatBaseCertDec: Prisma.Decimal;
  let outputVatCertDec: Prisma.Decimal;
  let grossBillingCertDec: Prisma.Decimal;
  let vatWithholdingCertDec: Prisma.Decimal;
  let ewtWithholdingCertDec: Prisma.Decimal;
  let withholdingCertDec: Prisma.Decimal;
  let retentionCertDec: Prisma.Decimal;
  let advanceRecoupCertDec: Prisma.Decimal;

  if (verifiedTaxProfile) {
    const tp = verifiedTaxProfile;
    taxProfileVersion = `${tp.profileCode}@${tp.versionCode}`;
    salesVatCategory = tp.salesVatCategory;
    outputVatRatePct = tp.outputVatRate.mul(100).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4);
    govVatWithholdingRatePct = tp.govVatWithholdingRate
      .mul(100)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      .toFixed(4);
    ewtRatePct = tp.ewtRate.mul(100).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4);
    retentionRatePct = tp.retentionRate
      .mul(100)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      .toFixed(4);
    advanceRecoupmentRatePct = tp.advanceRecoupmentRate
      .mul(100)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      .toFixed(4);
    contractVatInclusive = tp.contractVatInclusive;

    // Invoke canonical tax-engine helper for verification parity alongside exact Prisma.Decimal arithmetic
    const profileConfig: TaxPricingProfileConfig = {
      profileCode: tp.profileCode,
      versionCode: tp.versionCode,
      sectorType: tp.sectorType,
      estimateVatComponentRate: Number(tp.estimateVatComponentRate),
      estimateVatBaseMode:
        (tp.estimateVatBaseMode as TaxPricingProfileConfig['estimateVatBaseMode']) || 'NONE',
      outputVatRate: Number(tp.outputVatRate),
      salesVatCategory:
        (tp.salesVatCategory as TaxPricingProfileConfig['salesVatCategory']) || 'VATABLE_12',
      contractVatInclusive: tp.contractVatInclusive,
      govVatWithholdingRate: Number(tp.govVatWithholdingRate),
      ewtRate: Number(tp.ewtRate),
      ocmRate: Number(tp.ocmRate),
      contractorProfitRate: Number(tp.contractorProfitRate),
      contingencyRate: Number(tp.contingencyRate),
      retentionRate: Number(tp.retentionRate),
      advanceRecoupmentRate: Number(tp.advanceRecoupmentRate),
    };
    void computeContractBillingTaxBreakdown(Number(totalCurrCertAmtDec), profileConfig);

    if (tp.outputVatRate.gt(0)) {
      if (tp.contractVatInclusive) {
        exVatBaseCertDec = totalCurrCertAmtDec
          .div(new Prisma.Decimal(1).plus(tp.outputVatRate))
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        outputVatCertDec = totalCurrCertAmtDec.minus(exVatBaseCertDec);
        grossBillingCertDec = totalCurrCertAmtDec;
      } else {
        exVatBaseCertDec = totalCurrCertAmtDec;
        outputVatCertDec = exVatBaseCertDec
          .mul(tp.outputVatRate)
          .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        grossBillingCertDec = exVatBaseCertDec.plus(outputVatCertDec);
      }
    } else {
      exVatBaseCertDec = totalCurrCertAmtDec;
      outputVatCertDec = zero;
      grossBillingCertDec = totalCurrCertAmtDec;
    }

    vatWithholdingCertDec = exVatBaseCertDec
      .mul(tp.govVatWithholdingRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    ewtWithholdingCertDec = exVatBaseCertDec
      .mul(tp.ewtRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    withholdingCertDec = vatWithholdingCertDec.plus(ewtWithholdingCertDec);
    retentionCertDec = totalCurrCertAmtDec
      .mul(tp.retentionRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    advanceRecoupCertDec = totalCurrCertAmtDec
      .mul(tp.advanceRecoupmentRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  } else {
    taxProfileVersion = 'UNLINKED_BILLING_DEDUCTION_LEDGER';
    salesVatCategory = 'UNLINKED_TO_TAX_PROFILE';
    outputVatRatePct = '0.0000';
    govVatWithholdingRatePct = '0.0000';
    ewtRatePct = '0.0000';
    retentionRatePct = '0.0000';
    advanceRecoupmentRatePct = '0.0000';
    contractVatInclusive = true;

    exVatBaseCertDec = totalCurrCertAmtDec.minus(
      explicitVatDec.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    );
    outputVatCertDec = explicitVatDec.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    grossBillingCertDec = explicitGrossDec.gt(0)
      ? explicitGrossDec.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : totalCurrCertAmtDec;
    vatWithholdingCertDec = zero;
    ewtWithholdingCertDec = explicitWithholdingDec.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    withholdingCertDec = ewtWithholdingCertDec;
    retentionCertDec = explicitRetentionDec.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    advanceRecoupCertDec = explicitRecoupDec.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  const netCertifiedDueCertDec = grossBillingCertDec
    .minus(withholdingCertDec)
    .minus(retentionCertDec)
    .minus(advanceRecoupCertDec)
    .minus(explicitOtherDeductionsDec)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  // Allocate certificate tax/deduction/payment amounts pro-rata across active billed lines with exact penny reconciliation
  const activeIndices = baseLines
    .map((l, idx) => (l.currCertAmtDec.gt(0) ? idx : -1))
    .filter((idx) => idx >= 0);
  const allocIndices =
    activeIndices.length > 0 ? activeIndices : baseLines.map((_, idx) => idx);
  const allocWeights =
    activeIndices.length > 0
      ? activeIndices.map((idx) => baseLines[idx].currCertAmtDec)
      : baseLines.map((l) => l.revisedLineAmtDec);

  const grossShares = allocateDecimalProRata(grossBillingCertDec, allocWeights, 2);
  const retShares = allocateDecimalProRata(retentionCertDec, allocWeights, 2);
  const recoupShares = allocateDecimalProRata(advanceRecoupCertDec, allocWeights, 2);
  const vatWhtShares = allocateDecimalProRata(vatWithholdingCertDec, allocWeights, 2);
  const ewtWhtShares = allocateDecimalProRata(ewtWithholdingCertDec, allocWeights, 2);
  const otherDedShares = allocateDecimalProRata(explicitOtherDeductionsDec, allocWeights, 2);
  const paidShares = allocateDecimalProRata(totalPaymentReceivedDec, allocWeights, 2);

  const allocPosByLineIdx = new Map<number, number>();
  allocIndices.forEach((lineIdx, pos) => allocPosByLineIdx.set(lineIdx, pos));

  const rows: Array<Record<string, unknown>> = baseLines.map((item, lineIdx) => {
    const pos = allocPosByLineIdx.get(lineIdx);
    const grossDec = pos !== undefined ? grossShares[pos] : zero;
    const retDec = pos !== undefined ? retShares[pos] : zero;
    const recoupDec = pos !== undefined ? recoupShares[pos] : zero;
    const vatWhtDec = pos !== undefined ? vatWhtShares[pos] : zero;
    const ewtWhtDec = pos !== undefined ? ewtWhtShares[pos] : zero;
    const whtDec = vatWhtDec.plus(ewtWhtDec);
    const otherDedDec = pos !== undefined ? otherDedShares[pos] : zero;
    const netDueDec = grossDec
      .minus(retDec)
      .minus(recoupDec)
      .minus(whtDec)
      .minus(otherDedDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const paidDec = pos !== undefined ? paidShares[pos] : zero;

    const pl = item.pl;
    const docId = pl.sourceDocumentId ?? snapshot.sourceDocumentId ?? null;
    const docSha = pl.sourceDocument?.sha256Hash ?? snapshot.sourceDocument?.sha256Hash ?? null;

    return {
      project_id: projectId,
      snapshot_id: snapshot.id,
      snapshot_version: snapshot.versionNumber,
      billing_cert_id: billing.id,
      billing_number: billing.billingNumber,
      tax_profile_version: taxProfileVersion,
      boq_line_id: pl.id,
      awarded_boq_item_id: bridge.phaseLineBoqId.get(pl.id) ?? null,
      phase_code: pl.phaseCode,
      section_code: pl.sectionCode,
      item_code: pl.itemCode,
      work_description: pl.workDescription,
      specification: pl.specification,
      unit: pl.unitNormalized,
      pricing_type: pl.pricingType,
      vo_reference: voRefByPhaseLineId.get(pl.id) ?? null,
      original_qty: pl.originalQty.toFixed(4),
      snapshot_approved_qty_pre_vo: pl.approvedQty.toFixed(4),
      approved_client_vo_qty: item.voQtyDec.toFixed(4),
      approved_qty: item.effectiveApprovedQtyDec.toFixed(4),
      prev_certified_qty: item.prevQtyDec.toFixed(4),
      certified_curr_qty: item.currQtyDec.toFixed(4),
      contract_unit_rate: pl.contractUnitRate.toFixed(4),
      contract_line_amount: item.revisedLineAmtDec.toFixed(2),
      prior_certified_amt: item.priorCertAmtDec.toFixed(2),
      certified_curr_amt: item.currCertAmtDec.toFixed(2),
      gross_billing: grossDec.toFixed(2),
      retention_amt: retDec.toFixed(2),
      advance_recoup: recoupDec.toFixed(2),
      vat_withholding_amount: vatWhtDec.toFixed(2),
      ewt_withholding_amount: ewtWhtDec.toFixed(2),
      withholding_amt: whtDec.toFixed(2),
      other_deductions_exact: otherDedDec.toFixed(2),
      net_certified_due: netDueDec.toFixed(2),
      payment_received: paidDec.toFixed(2),
      output_vat_rate: verifiedTaxProfile ? outputVatRatePct : null,
      sales_vat_category: verifiedTaxProfile ? salesVatCategory : null,
      gov_vat_withholding_rate: verifiedTaxProfile ? govVatWithholdingRatePct : null,
      source_document_id: docId,
      source_document_sha256: docSha,
    };
  });

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'billing_cert_id',
    'billing_number',
    'tax_profile_version',
    'boq_line_id',
    'awarded_boq_item_id',
    'phase_code',
    'section_code',
    'snapshot_approved_qty_pre_vo',
    'approved_client_vo_qty',
    'other_deductions_exact',
    'source_document_id',
    'source_document_sha256',
  ] as const;

  return {
    sourceId: billing.id,
    sourceVersion: `${billing.id}@v${snapshot.versionNumber}`,
    rows,
    systemMetaFields,
    approvedById,
    approvedAtIso: billing.billingDate.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
    billingSummary: {
      billingId: billing.id,
      billingNumber: billing.billingNumber,
      billingPeriodFromIso: billing.billingPeriodFrom.toISOString(),
      billingPeriodToIso: billing.billingPeriodTo.toISOString(),
      billingDateIso: billing.billingDate.toISOString(),
      snapshotId: snapshot.id,
      snapshotVersionNumber: snapshot.versionNumber,
      taxProfileVersion,
      salesVatCategory,
      outputVatRatePct,
      govVatWithholdingRatePct,
      ewtRatePct,
      retentionRatePct,
      advanceRecoupmentRatePct,
      contractVatInclusive,
      certifiedCurrentAmountTotal: totalCurrCertAmtDec.toFixed(2),
      priorCertifiedAmountTotal: totalPriorCertAmtDec.toFixed(2),
      exVatBaseTotal: exVatBaseCertDec.toFixed(2),
      outputVatTotal: outputVatCertDec.toFixed(2),
      grossBillingTotal: grossBillingCertDec.toFixed(2),
      retentionTotal: retentionCertDec.toFixed(2),
      advanceRecoupmentTotal: advanceRecoupCertDec.toFixed(2),
      vatWithholdingTotal: vatWithholdingCertDec.toFixed(2),
      ewtWithholdingTotal: ewtWithholdingCertDec.toFixed(2),
      withholdingTotal: withholdingCertDec.toFixed(2),
      otherDeductionsTotal: explicitOtherDeductionsDec.toFixed(2),
      netCertifiedDueTotal: netCertifiedDueCertDec.toFixed(2),
      paymentReceivedTotal: totalPaymentReceivedDec.toFixed(2),
    },
  };
}

export async function loadT7ScheduleEvmCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string
): Promise<LoadedTemplateCanonicalData> {
  const schedule = await db.projectSchedule.findFirst({
    where: {
      id: sourceId,
      projectId,
      workflowStatus: { in: ['ACTIVE_BASELINE', 'SUPERSEDED_BASELINE'] },
    },
    include: {
      activities: {
        include: {
          wbs: { select: { id: true, code: true, name: true } },
          uboqLinks: {
            include: {
              phaseLine: {
                select: {
                  id: true,
                  projectId: true,
                  snapshotId: true,
                  awardedBoqItemId: true,
                  phaseCode: true,
                  sectionCode: true,
                  itemCode: true,
                  unitNormalized: true,
                  approvedQty: true,
                  contractUnitRate: true,
                  contractLineAmount: true,
                  snapshot: {
                    select: {
                      id: true,
                      projectId: true,
                      versionNumber: true,
                      status: true,
                      approvedAt: true,
                      approvedById: true,
                    },
                  },
                },
              },
            },
            orderBy: { id: 'asc' },
          },
          boqAllocations: {
            include: {
              awardedBoqItem: {
                select: {
                  id: true,
                  projectId: true,
                  quantity: true,
                  approvedClientVoQuantity: true,
                  revisedContractQuantity: true,
                  totalCost: true,
                  revisedContractAmount: true,
                  revisedContractUnitPrice: true,
                },
              },
            },
            orderBy: { id: 'asc' },
          },
          progressUpdates: {
            orderBy: [{ updateDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
          },
        },
        orderBy: [{ activityCode: 'asc' }, { id: 'asc' }],
        take: 1001,
      },
      dependencies: {
        orderBy: { id: 'asc' },
      },
    },
  });

  if (!schedule) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (schedule.activities.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_EMPTY_SCHEDULE', 409, {
      scheduleId: schedule.id,
    });
  }
  if (schedule.activities.length > 1000) {
    throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
  }

  // Verify cross-project ownership on all linked BOQ lines/allocations
  for (const act of schedule.activities) {
    for (const lnk of act.uboqLinks) {
      if (
        lnk.phaseLine.projectId !== projectId ||
        (lnk.phaseLine.snapshot && lnk.phaseLine.snapshot.projectId !== projectId)
      ) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
    }
    for (const alloc of act.boqAllocations) {
      if (
        alloc.awardedBoqItem.projectId !== projectId ||
        (alloc.projectId && alloc.projectId !== projectId)
      ) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
    }
  }

  // Run frozen CPM engine (src/lib/cpm-engine.ts)
  const cpmActivities: CPMActivity[] = schedule.activities.map((act) => ({
    id: act.id,
    name: act.name,
    duration: Math.max(0, act.plannedDuration),
    plannedStart: act.baselineStartDate ?? act.plannedStartDate,
    plannedFinish: act.baselineFinishDate ?? act.plannedFinishDate,
  }));
  const cpmDeps: CPMDependency[] = schedule.dependencies.map((d) => ({
    id: d.id,
    predecessorId: d.predecessorId,
    successorId: d.successorId,
    type: (['FS', 'SS', 'FF', 'SF'].includes(d.type.toUpperCase())
      ? d.type.toUpperCase()
      : 'FS') as CPMDependency['type'],
    lagDays: d.lagDays,
  }));

  const rawCpmOutput = calculateCPM(cpmActivities, cpmDeps);
  if (rawCpmOutput.hasCircularDependency) {
    throw new CanonicalAdapterError('TEMPLATE_CPM_CIRCULAR_DEPENDENCY', 409, {
      scheduleId: schedule.id,
      errors: rawCpmOutput.errors,
    });
  }

  const baseStartDate =
    schedule.projectStartDate ??
    schedule.baselineStartDate ??
    schedule.currentStartDate ??
    null;
  let parsedWorkDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (schedule.workDaysConfig) {
    try {
      const parsed = JSON.parse(schedule.workDaysConfig);
      if (Array.isArray(parsed) && parsed.every((x) => typeof x === 'string') && parsed.length > 0) {
        parsedWorkDays = parsed;
      }
    } catch {
      // retain default 6-day work week
    }
  }
  const cpmOutput = baseStartDate
    ? resolveWorkingDayDates(rawCpmOutput, baseStartDate, parsedWorkDays)
    : rawCpmOutput;

  const zero = new Prisma.Decimal(0);
  const hundred = new Prisma.Decimal(100);

  // IR-04 + IR2-02 + IR3-01: Never allow future-dated records beyond evaluation wall-clock time OR out-of-schedule approvals to shift cutoff
  const maxAllowedWallClock = new Date();
  const maxWallClockMs = maxAllowedWallClock.getTime();

  const buildCanonicalPhaseSlotKey = (
    phaseCode: string,
    sectionCode: string | null,
    itemCode: string
  ): string =>
    `${phaseCode.trim().toUpperCase()}::${(sectionCode ?? '').trim().toUpperCase()}::${itemCode.trim().toUpperCase()}`;

  // Normalize each activity's BOQ scope slices across UboqScheduleActivityLink and ScheduleBOQAllocation (IR2-02 + IR3-01):
  // - Validates approved snapshot lineage on all UboqScheduleActivityLinks.
  // - Deduplicates identical same-activity legacy ScheduleBOQAllocation shadow rows while failing closed (409) on conflicting intra-activity dual mappings.
  type NormalizedActivityBoqSlice = {
    sliceId: string;
    activityId: string;
    kind: 'UBOQ_PHASE_LINK' | 'LEGACY_BOQ_ALLOCATION';
    boqId: string;
    consolidatedBoqLineId: string | null;
    snapshotId: string | null;
    snapshotVersion: number | null;
    snapshotApprovedAtMs: number | null;
    phaseLineId: string | null;
    canonicalSlotKey: string | null;
    unitNormalized: string | null;
    scopeQty: Prisma.Decimal;
    lineAmt: Prisma.Decimal;
  };

  const slicesByActId = new Map<string, NormalizedActivityBoqSlice[]>();
  const slicesByBoqId = new Map<string, NormalizedActivityBoqSlice[]>();
  const activityMappedBoqIds = new Map<string, Set<string>>();
  const scheduleMappedBoqIds = new Set<string>();
  const referencedSnapshotIds = new Set<string>();

  for (const act of schedule.activities) {
    const actSlices: NormalizedActivityBoqSlice[] = [];
    const mappedSet = new Set<string>();

    if (act.uboqLinks.length > 0) {
      const seenIntraActSlots = new Map<string, string>();
      const uboqScopeByBoq = new Map<string, Prisma.Decimal>();

      for (const lnk of act.uboqLinks) {
        const snap = lnk.phaseLine.snapshot;
        if (
          !lnk.phaseLine.snapshotId ||
          !snap ||
          !['APPROVED', 'SUPERSEDED'].includes(snap.status) ||
          !snap.approvedAt ||
          !snap.approvedById ||
          snap.approvedAt.getTime() > maxWallClockMs
        ) {
          throw new CanonicalAdapterError('TEMPLATE_UNAPPROVED_EVM_SNAPSHOT_SOURCE', 409, {
            scheduleId: schedule.id,
            activityId: act.id,
            linkId: lnk.id,
            phaseLineId: lnk.phaseLine.id,
          });
        }
        if (
          !lnk.phaseLine.awardedBoqItemId ||
          lnk.allocatedQty.lt(0) ||
          lnk.allocationWeightPct.lt(0)
        ) {
          throw new CanonicalAdapterError('TEMPLATE_AMBIGUOUS_EVM_BOQ_MAPPING', 409, {
            scheduleId: schedule.id,
            activityId: act.id,
            linkId: lnk.id,
            phaseLineId: lnk.phaseLine.id,
            reason: 'INVALID_OR_UNLINKED_PHASE_LINE_SCOPE',
          });
        }

        const boqId = lnk.phaseLine.awardedBoqItemId;
        const slotKey = buildCanonicalPhaseSlotKey(
          lnk.phaseLine.phaseCode,
          lnk.phaseLine.sectionCode,
          lnk.phaseLine.itemCode
        );
        const intraKey = `${boqId}::${slotKey}`;
        const prevSnapForSlot = seenIntraActSlots.get(intraKey);
        if (prevSnapForSlot && prevSnapForSlot !== lnk.phaseLine.snapshotId) {
          throw new CanonicalAdapterError('TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING', 409, {
            scheduleId: schedule.id,
            activityId: act.id,
            boqItemId: boqId,
            reason: 'INTRA_ACTIVITY_MULTI_SNAPSHOT_OVERLAP',
          });
        }
        seenIntraActSlots.set(intraKey, lnk.phaseLine.snapshotId);

        const scopeQty = (
          lnk.allocatedQty.gt(0)
            ? lnk.allocatedQty
            : lnk.phaseLine.approvedQty.mul(lnk.allocationWeightPct).div(hundred)
        ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
        const lineAmt = (
          lnk.allocatedQty.gt(0)
            ? lnk.allocatedQty.mul(lnk.phaseLine.contractUnitRate)
            : lnk.phaseLine.contractLineAmount.mul(lnk.allocationWeightPct).div(hundred)
        ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        uboqScopeByBoq.set(boqId, (uboqScopeByBoq.get(boqId) ?? zero).plus(scopeQty));
        referencedSnapshotIds.add(lnk.phaseLine.snapshotId);
        mappedSet.add(boqId);
        scheduleMappedBoqIds.add(boqId);

        actSlices.push({
          sliceId: `ulnk:${lnk.id}`,
          activityId: act.id,
          kind: 'UBOQ_PHASE_LINK',
          boqId,
          consolidatedBoqLineId: null,
          snapshotId: lnk.phaseLine.snapshotId,
          snapshotVersion: snap.versionNumber,
          snapshotApprovedAtMs: snap.approvedAt.getTime(),
          phaseLineId: lnk.phaseLine.id,
          canonicalSlotKey: slotKey,
          unitNormalized: lnk.phaseLine.unitNormalized.trim().toLowerCase(),
          scopeQty,
          lineAmt,
        });
      }

      // If legacy ScheduleBOQAllocation rows also exist on this same activity, they MUST be an exact per-BOQ scope mirror;
      // otherwise fail closed on conflicting intra-activity dual BOQ representations.
      if (act.boqAllocations.length > 0) {
        const allocScopeByBoq = new Map<string, Prisma.Decimal>();
        for (const alloc of act.boqAllocations) {
          if (!alloc.awardedBoqItemId || (alloc.mappedQuantity !== null && alloc.mappedQuantity < 0)) {
            throw new CanonicalAdapterError('TEMPLATE_AMBIGUOUS_EVM_BOQ_MAPPING', 409, {
              scheduleId: schedule.id,
              activityId: act.id,
              allocationId: alloc.id,
              reason: 'INVALID_LEGACY_BOQ_ALLOCATION_SCOPE',
            });
          }
          const fallbackBoqQty =
            alloc.awardedBoqItem.revisedContractQuantity > 0
              ? alloc.awardedBoqItem.revisedContractQuantity
              : alloc.awardedBoqItem.quantity;
          const aScope = new Prisma.Decimal(
            String(
              alloc.mappedQuantity && alloc.mappedQuantity > 0
                ? alloc.mappedQuantity
                : fallbackBoqQty || 0
            )
          ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
          allocScopeByBoq.set(
            alloc.awardedBoqItemId,
            (allocScopeByBoq.get(alloc.awardedBoqItemId) ?? zero).plus(aScope)
          );
        }

        let mirrorsExactly = allocScopeByBoq.size === uboqScopeByBoq.size;
        if (mirrorsExactly) {
          for (const [bId, uQty] of uboqScopeByBoq.entries()) {
            const aQty = allocScopeByBoq.get(bId);
            if (!aQty || !aQty.eq(uQty)) {
              mirrorsExactly = false;
              break;
            }
          }
        }
        if (!mirrorsExactly) {
          throw new CanonicalAdapterError('TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING', 409, {
            scheduleId: schedule.id,
            activityId: act.id,
            reason: 'INTRA_ACTIVITY_CONFLICTING_LINK_METHODS',
          });
        }
      }
    } else if (act.boqAllocations.length > 0) {
      for (const alloc of act.boqAllocations) {
        if (!alloc.awardedBoqItemId || (alloc.mappedQuantity !== null && alloc.mappedQuantity < 0)) {
          throw new CanonicalAdapterError('TEMPLATE_AMBIGUOUS_EVM_BOQ_MAPPING', 409, {
            scheduleId: schedule.id,
            activityId: act.id,
            allocationId: alloc.id,
            reason: 'INVALID_LEGACY_BOQ_ALLOCATION_SCOPE',
          });
        }
        const fallbackBoqQty =
          alloc.awardedBoqItem.revisedContractQuantity > 0
            ? alloc.awardedBoqItem.revisedContractQuantity
            : alloc.awardedBoqItem.quantity;
        const scopeQty = new Prisma.Decimal(
          String(
            alloc.mappedQuantity && alloc.mappedQuantity > 0
              ? alloc.mappedQuantity
              : fallbackBoqQty || 0
          )
        ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
        const unitPrice =
          alloc.awardedBoqItem.revisedContractUnitPrice > 0
            ? alloc.awardedBoqItem.revisedContractUnitPrice
            : alloc.awardedBoqItem.quantity > 0
              ? alloc.awardedBoqItem.totalCost / alloc.awardedBoqItem.quantity
              : 0;
        const lineAmt = (
          alloc.allocatedAmount !== null
            ? alloc.allocatedAmount
            : scopeQty.mul(new Prisma.Decimal(String(unitPrice)))
        ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        mappedSet.add(alloc.awardedBoqItemId);
        scheduleMappedBoqIds.add(alloc.awardedBoqItemId);

        actSlices.push({
          sliceId: `alloc:${alloc.id}`,
          activityId: act.id,
          kind: 'LEGACY_BOQ_ALLOCATION',
          boqId: alloc.awardedBoqItemId,
          consolidatedBoqLineId: alloc.boqLineId ?? null,
          snapshotId: null,
          snapshotVersion: null,
          snapshotApprovedAtMs: null,
          phaseLineId: null,
          canonicalSlotKey: null,
          unitNormalized: null,
          scopeQty,
          lineAmt,
        });
      }
    }

    slicesByActId.set(act.id, actSlices);
    activityMappedBoqIds.set(act.id, mappedSet);
    for (const sl of actSlices) {
      const list = slicesByBoqId.get(sl.boqId) ?? [];
      list.push(sl);
      slicesByBoqId.set(sl.boqId, list);
    }
  }

  // Fetch approved Accomplishments (with Inspections, ordered chronologically), sibling snapshot phase lines, canonical AwardedBOQItems, and approved ProjectCostLedger rows
  const [
    approvedAccomplishments,
    snapshotPhaseLines,
    scheduleAwardedBoqItems,
    approvedCostLedgers,
  ] = await Promise.all([
    db.accomplishment.findMany({
      where: {
        projectId,
        status: { in: ['APPROVED', 'approved'] },
      },
      select: {
        id: true,
        accomplishmentDate: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            boqItemId: true,
            previousQuantity: true,
            approvedQuantity: true,
            currentQuantityClaimed: true,
            contractQuantity: true,
            inspections: {
              select: {
                id: true,
                approvalStatus: true,
                actualQuantityVerified: true,
                approvedQuantity: true,
                inspectorName: true,
                remarks: true,
                inspectionFindings: true,
              },
              orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            },
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: [{ accomplishmentDate: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    }),
    referencedSnapshotIds.size > 0
      ? db.uboqAwardedPhaseLine.findMany({
          where: {
            projectId,
            snapshotId: { in: [...referencedSnapshotIds] },
          },
          select: {
            id: true,
            snapshotId: true,
            awardedBoqItemId: true,
            phaseCode: true,
            sectionCode: true,
            itemCode: true,
            unitNormalized: true,
            approvedQty: true,
          },
          orderBy: { id: 'asc' },
        })
      : Promise.resolve([]),
    scheduleMappedBoqIds.size > 0
      ? db.awardedBOQItem.findMany({
          where: {
            projectId,
            id: { in: [...scheduleMappedBoqIds] },
          },
          select: {
            id: true,
            projectId: true,
            quantity: true,
            approvedClientVoQuantity: true,
            revisedContractQuantity: true,
          },
        })
      : Promise.resolve([]),
    db.projectCostLedger.findMany({
      where: {
        projectId,
        approvalStatus: { in: ['APPROVED', 'approved'] },
      },
      select: {
        id: true,
        costDate: true,
        costCategory: true,
        awardedBoqItemId: true,
        consolidatedBoqItemId: true,
        netAmount: true,
        grossAmount: true,
        withholdingTaxAmount: true,
      },
      orderBy: { id: 'asc' },
    }),
  ]);

  // IR3-01: Reconcile schedule-wide BOQ ceilings, canonical phase slots, and multi-snapshot / mixed-link mappings BEFORE granting any EV credit.
  // Fails closed (409) whenever overlapping mappings across activities, link representations, or snapshot versions exceed canonical ceilings or conflict in phase structure.
  const awardedBoqById = new Map(scheduleAwardedBoqItems.map((b) => [b.id, b]));
  const canonicalPhaseSlotsByBoq = new Map<
    string,
    Array<{ slotKey: string; approvedQtySum: Prisma.Decimal; effectiveCeilingQty: Prisma.Decimal }>
  >();

  for (const [boqId, boqSlices] of slicesByBoqId.entries()) {
    const boqRow = awardedBoqById.get(boqId);
    if (!boqRow || boqRow.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_AMBIGUOUS_EVM_BOQ_MAPPING', 409, {
        scheduleId: schedule.id,
        boqItemId: boqId,
        reason: 'MISSING_CANONICAL_AWARDED_BOQ_ITEM',
      });
    }

    const rawItemQty =
      boqRow.revisedContractQuantity > 0
        ? boqRow.revisedContractQuantity
        : Math.max(0, boqRow.quantity + (boqRow.approvedClientVoQuantity ?? 0));
    const itemEffectiveQtyDec = new Prisma.Decimal(String(rawItemQty)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );

    const uboqPhaseSlices = boqSlices.filter((s) => s.kind === 'UBOQ_PHASE_LINK');
    let boqCeilingDec = itemEffectiveQtyDec;

    if (uboqPhaseSlices.length > 0) {
      // Select the single highest-version referenced snapshot for this BOQ item to define its canonical phase slots ONCE (never duplicated per snapshot!)
      let authSnapId = uboqPhaseSlices[0].snapshotId!;
      let authSnapVer = uboqPhaseSlices[0].snapshotVersion ?? 0;
      let authSnapAppMs = uboqPhaseSlices[0].snapshotApprovedAtMs ?? 0;
      for (const s of uboqPhaseSlices) {
        const sVer = s.snapshotVersion ?? 0;
        const sMs = s.snapshotApprovedAtMs ?? 0;
        if (
          sVer > authSnapVer ||
          (sVer === authSnapVer &&
            (sMs > authSnapAppMs || (sMs === authSnapAppMs && s.snapshotId! > authSnapId)))
        ) {
          authSnapId = s.snapshotId!;
          authSnapVer = sVer;
          authSnapAppMs = sMs;
        }
      }

      const authPhaseLines = snapshotPhaseLines.filter(
        (spl) => spl.snapshotId === authSnapId && spl.awardedBoqItemId === boqId
      );
      if (authPhaseLines.length === 0) {
        throw new CanonicalAdapterError('TEMPLATE_AMBIGUOUS_EVM_BOQ_MAPPING', 409, {
          scheduleId: schedule.id,
          boqItemId: boqId,
          snapshotId: authSnapId,
          reason: 'MISSING_AUTHORITATIVE_SNAPSHOT_PHASE_LINES',
        });
      }

      const slotAgg = new Map<string, { approvedQtySum: Prisma.Decimal; unitNorm: string }>();
      for (const apl of authPhaseLines) {
        const slotKey = buildCanonicalPhaseSlotKey(apl.phaseCode, apl.sectionCode, apl.itemCode);
        const unitNorm = apl.unitNormalized.trim().toLowerCase();
        const ex = slotAgg.get(slotKey);
        if (!ex) {
          slotAgg.set(slotKey, { approvedQtySum: apl.approvedQty, unitNorm });
        } else {
          if (ex.unitNorm !== unitNorm) {
            throw new CanonicalAdapterError('TEMPLATE_AMBIGUOUS_EVM_BOQ_MAPPING', 409, {
              scheduleId: schedule.id,
              boqItemId: boqId,
              reason: 'CONFLICTING_PHASE_SLOT_UNITS',
            });
          }
          ex.approvedQtySum = ex.approvedQtySum.plus(apl.approvedQty);
        }
      }

      const slotEntries = [...slotAgg.entries()];
      const authSnapApprovedSum = slotEntries.reduce((acc, [, v]) => acc.plus(v.approvedQtySum), zero);
      boqCeilingDec =
        (boqRow.approvedClientVoQuantity ?? 0) >= 0
          ? Prisma.Decimal.max(itemEffectiveQtyDec, authSnapApprovedSum)
          : itemEffectiveQtyDec;

      const slotEffectiveCeilings = allocateDecimalProRata(
        boqCeilingDec,
        slotEntries.map(([, v]) => v.approvedQtySum),
        4
      );

      const canonicalSlotMap = new Map<
        string,
        { approvedQtySum: Prisma.Decimal; effectiveCeilingQty: Prisma.Decimal; unitNorm: string }
      >();
      const canonicalSlotList: Array<{
        slotKey: string;
        approvedQtySum: Prisma.Decimal;
        effectiveCeilingQty: Prisma.Decimal;
      }> = [];
      slotEntries.forEach(([slotKey, v], idx) => {
        canonicalSlotMap.set(slotKey, {
          approvedQtySum: v.approvedQtySum,
          effectiveCeilingQty: slotEffectiveCeilings[idx],
          unitNorm: v.unitNorm,
        });
        canonicalSlotList.push({
          slotKey,
          approvedQtySum: v.approvedQtySum,
          effectiveCeilingQty: slotEffectiveCeilings[idx],
        });
      });

      const mappedScopeBySlot = new Map<string, Prisma.Decimal>();
      for (const s of uboqPhaseSlices) {
        const slotInfo = canonicalSlotMap.get(s.canonicalSlotKey!);
        if (!slotInfo || slotInfo.unitNorm !== s.unitNormalized) {
          throw new CanonicalAdapterError('TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING', 409, {
            scheduleId: schedule.id,
            boqItemId: boqId,
            activityId: s.activityId,
            reason: 'INCOMPATIBLE_MULTI_SNAPSHOT_PHASE_MAPPING',
          });
        }
        const nextMapped = (mappedScopeBySlot.get(s.canonicalSlotKey!) ?? zero).plus(s.scopeQty);
        if (nextMapped.gt(slotInfo.effectiveCeilingQty)) {
          throw new CanonicalAdapterError('TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING', 409, {
            scheduleId: schedule.id,
            boqItemId: boqId,
            canonicalSlotKey: s.canonicalSlotKey!,
            mappedSlotQty: nextMapped.toFixed(4),
            slotCeilingQty: slotInfo.effectiveCeilingQty.toFixed(4),
            reason: 'PHASE_SCOPE_CEILING_EXCEEDED_ACROSS_ACTIVITIES_OR_SNAPSHOTS',
          });
        }
        mappedScopeBySlot.set(s.canonicalSlotKey!, nextMapped);
      }

      canonicalPhaseSlotsByBoq.set(boqId, canonicalSlotList);
    }

    const totalScheduleMappedBoqScope = boqSlices.reduce((acc, s) => acc.plus(s.scopeQty), zero);
    if (totalScheduleMappedBoqScope.gt(boqCeilingDec)) {
      throw new CanonicalAdapterError('TEMPLATE_OVERLAPPING_EVM_BOQ_MAPPING', 409, {
        scheduleId: schedule.id,
        boqItemId: boqId,
        totalMappedScopeQty: totalScheduleMappedBoqScope.toFixed(4),
        boqCeilingQty: boqCeilingDec.toFixed(4),
        reason: 'BOQ_SCOPE_CEILING_EXCEEDED_ACROSS_ACTIVITIES_OR_LINK_TYPES',
      });
    }
  }

  // Chronologically validate certified Accomplishments on or before maxAllowedWallClock:
  // Enforces IR-03 inspection quantity integrity, cumulative contract ceilings, and unbroken per-BOQ carried-forward continuity.
  const validCertAccPreCutoff: Array<{
    id: string;
    accomplishmentDate: Date;
    certifiedBoqIds: Set<string>;
    inScheduleCertifiedBoqIds: string[];
    cumAfterAccByBoq: Map<string, Prisma.Decimal>;
  }> = [];

  const runningCumCertByBoq = new Map<string, Prisma.Decimal>();
  const poisonedEvmBoqIds = new Set<string>();

  for (const acc of approvedAccomplishments) {
    if (acc.accomplishmentDate.getTime() > maxWallClockMs || acc.items.length === 0) continue;
    let isValidAcc = true;
    const perBoq = new Map<
      string,
      { prevQty: Prisma.Decimal; certQty: Prisma.Decimal; contractQty: Prisma.Decimal }
    >();

    for (const item of acc.items) {
      if (poisonedEvmBoqIds.has(item.boqItemId)) {
        isValidAcc = false;
        break;
      }
      const prevDec = new Prisma.Decimal(String(item.previousQuantity ?? 0)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const claimDec = new Prisma.Decimal(
        String(
          item.approvedQuantity !== null && item.approvedQuantity !== undefined
            ? item.approvedQuantity
            : item.currentQuantityClaimed ?? 0
        )
      ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      const contractQtyDec = new Prisma.Decimal(String(item.contractQuantity ?? 0)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
      if (prevDec.lt(0) || claimDec.lt(0)) {
        isValidAcc = false;
        break;
      }
      try {
        const verified = verifyApprovedInspectionsForClaim({
          accomplishmentId: acc.id,
          accomplishmentItemId: item.id,
          boqItemId: item.boqItemId,
          rawClaimDec: claimDec,
          inspections: item.inspections,
        });
        const ex = perBoq.get(item.boqItemId);
        if (!ex) {
          perBoq.set(item.boqItemId, {
            prevQty: prevDec,
            certQty: verified.certifiedDec,
            contractQty: contractQtyDec,
          });
        } else {
          if (!ex.prevQty.eq(prevDec)) {
            isValidAcc = false;
            break;
          }
          ex.certQty = ex.certQty.plus(verified.certifiedDec);
          if (contractQtyDec.gt(ex.contractQty)) ex.contractQty = contractQtyDec;
        }
      } catch {
        isValidAcc = false;
        break;
      }
    }

    if (isValidAcc) {
      for (const [bId, qInfo] of perBoq.entries()) {
        const existingCum = runningCumCertByBoq.get(bId);
        if (existingCum !== undefined && !qInfo.prevQty.eq(existingCum)) {
          isValidAcc = false;
          break;
        }
        const candidateCum = qInfo.prevQty.plus(qInfo.certQty);
        if (qInfo.contractQty.gt(0) && candidateCum.gt(qInfo.contractQty)) {
          isValidAcc = false;
          break;
        }
      }
    }

    if (!isValidAcc) {
      for (const item of acc.items) {
        poisonedEvmBoqIds.add(item.boqItemId);
      }
      continue;
    }

    const certifiedBoqIds = new Set<string>();
    const cumAfterAccByBoq = new Map<string, Prisma.Decimal>();
    for (const [bId, qInfo] of perBoq.entries()) {
      const nextCum = qInfo.prevQty
        .plus(qInfo.certQty)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      runningCumCertByBoq.set(bId, nextCum);
      cumAfterAccByBoq.set(bId, nextCum);
      if (qInfo.certQty.gt(0)) {
        certifiedBoqIds.add(bId);
      }
    }

    const inScheduleCertifiedBoqIds = [...certifiedBoqIds].filter((id) =>
      scheduleMappedBoqIds.has(id)
    );
    validCertAccPreCutoff.push({
      id: acc.id,
      accomplishmentDate: acc.accomplishmentDate,
      certifiedBoqIds,
      inScheduleCertifiedBoqIds,
      cumAfterAccByBoq,
    });
  }

  // Only Accomplishments that certify at least one BOQ item mapped to THIS schedule may anchor statusCutoffDate (IR2-02)
  const inScheduleCertAccPreCutoff = validCertAccPreCutoff.filter(
    (a) => a.inScheduleCertifiedBoqIds.length > 0
  );
  const inSchedulePreCutoffById = new Map(inScheduleCertAccPreCutoff.map((a) => [a.id, a]));

  // Determine ONE unified as-of reporting cutoff date (statusCutoffDate) used simultaneously across PV, EV, and AC (IR-04 + IR2-02):
  // - Anchored strictly to in-schedule verified certified accomplishments and activity-matched certified updates.
  // - Never shifted by unverified self-reports, future-dated records, or out-of-schedule / cross-activity approvals.
  let statusCutoffDate: Date | null = null;
  if (inScheduleCertAccPreCutoff.length > 0) {
    for (const a of inScheduleCertAccPreCutoff) {
      if (!statusCutoffDate || a.accomplishmentDate.getTime() > statusCutoffDate.getTime()) {
        statusCutoffDate = a.accomplishmentDate;
      }
    }
    for (const act of schedule.activities) {
      const actBoqs = activityMappedBoqIds.get(act.id) ?? new Set<string>();
      if (actBoqs.size === 0) continue;
      for (const pu of act.progressUpdates) {
        if (
          pu.scheduleId === schedule.id &&
          pu.accomplishmentId &&
          pu.updateDate.getTime() <= maxWallClockMs
        ) {
          const matchedAcc = inSchedulePreCutoffById.get(pu.accomplishmentId);
          const certifiesThisActivity =
            matchedAcc !== undefined &&
            [...matchedAcc.certifiedBoqIds].some((bId) => actBoqs.has(bId));
          if (
            certifiesThisActivity &&
            (!statusCutoffDate || pu.updateDate.getTime() > statusCutoffDate.getTime())
          ) {
            statusCutoffDate = pu.updateDate;
          }
        }
      }
    }
  } else {
    for (const act of schedule.activities) {
      for (const pu of act.progressUpdates) {
        if (
          pu.scheduleId === schedule.id &&
          !pu.accomplishmentId &&
          pu.updateDate.getTime() <= maxWallClockMs &&
          (!statusCutoffDate || pu.updateDate.getTime() > statusCutoffDate.getTime())
        ) {
          statusCutoffDate = pu.updateDate;
        }
      }
    }
    if (!statusCutoffDate) {
      const candidateFallback =
        schedule.baselineFinishDate ?? schedule.currentFinishDate ?? schedule.createdAt;
      statusCutoffDate =
        candidateFallback.getTime() <= maxWallClockMs
          ? candidateFallback
          : schedule.baselineStartDate && schedule.baselineStartDate.getTime() <= maxWallClockMs
            ? schedule.baselineStartDate
            : maxAllowedWallClock;
    }
  }

  const resolvedCutoffDate: Date = statusCutoffDate ?? maxAllowedWallClock;
  const asOfCutoffMs = resolvedCutoffDate.getTime();
  const asOfCutoffIsoDate = resolvedCutoffDate.toISOString().slice(0, 10);

  // Filter certified Accomplishments strictly to accomplishmentDate <= statusCutoffDate
  const validCertifiedAccomplishments = validCertAccPreCutoff.filter(
    (a) => a.accomplishmentDate.getTime() <= asOfCutoffMs && a.inScheduleCertifiedBoqIds.length > 0
  );
  const validCertAccAsOfCutoffById = new Map(validCertifiedAccomplishments.map((a) => [a.id, a]));
  const verifiedCertifiedQtyByBoqId = new Map<string, Prisma.Decimal>();
  for (const acc of validCertifiedAccomplishments) {
    for (const [boqId, cumQ] of acc.cumAfterAccByBoq.entries()) {
      verifiedCertifiedQtyByBoqId.set(boqId, cumQ);
    }
  }

  // Activity display code map & formatted predecessor strings
  const codeByActId = new Map<string, string>();
  for (const act of schedule.activities) {
    codeByActId.set(act.id, act.activityCode?.trim() || act.id);
  }
  const incomingDepsByActId = new Map<string, CPMDependency[]>();
  for (const dep of cpmDeps) {
    const arr = incomingDepsByActId.get(dep.successorId) ?? [];
    arr.push(dep);
    incomingDepsByActId.set(dep.successorId, arr);
  }

  // Compute each activity's BAC and track BOQ-item -> activity BAC weights for Actual Cost (AC) attribution using normalized non-duplicate slices
  const actBacMap = new Map<string, Prisma.Decimal>();
  const boqActivityWeights = new Map<string, Array<{ activityId: string; weight: Prisma.Decimal }>>();
  const cboqActivityWeights = new Map<string, Array<{ activityId: string; weight: Prisma.Decimal }>>();

  for (const act of schedule.activities) {
    const actSlices = slicesByActId.get(act.id) ?? [];
    let bacDec = zero;
    if (actSlices.length > 0) {
      for (const sl of actSlices) {
        bacDec = bacDec.plus(sl.lineAmt);
        const list = boqActivityWeights.get(sl.boqId) ?? [];
        list.push({
          activityId: act.id,
          weight: Prisma.Decimal.max(sl.lineAmt, new Prisma.Decimal('0.01')),
        });
        boqActivityWeights.set(sl.boqId, list);
        if (sl.consolidatedBoqLineId) {
          const clist = cboqActivityWeights.get(sl.consolidatedBoqLineId) ?? [];
          clist.push({
            activityId: act.id,
            weight: Prisma.Decimal.max(sl.lineAmt, new Prisma.Decimal('0.01')),
          });
          cboqActivityWeights.set(sl.consolidatedBoqLineId, clist);
        }
      }
      // Preserve consolidatedBoqLineId AC attribution if an exact-mirror legacy allocation carried boqLineId
      if (act.uboqLinks.length > 0 && act.boqAllocations.length > 0) {
        for (const alloc of act.boqAllocations) {
          if (alloc.boqLineId) {
            const clist = cboqActivityWeights.get(alloc.boqLineId) ?? [];
            clist.push({
              activityId: act.id,
              weight: Prisma.Decimal.max(bacDec, new Prisma.Decimal('0.01')),
            });
            cboqActivityWeights.set(alloc.boqLineId, clist);
          }
        }
      }
    } else {
      bacDec = act.allocatedAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    }
    actBacMap.set(act.id, bacDec);
  }

  // Attribute APPROVED ProjectCostLedger amounts as of statusCutoffDate to activities without double counting:
  // Excludes post-cutoff / future-dated costs (costDate > statusCutoffDate), INDIRECT/OVERHEAD costs, and unallocated costs.
  const EXCLUDED_INDIRECT_COST_CATEGORIES = new Set([
    'INDIRECT',
    'OVERHEAD',
    'GENERAL_ADMIN',
    'UNALLOCATED',
  ]);
  const actualCostByActId = new Map<string, Prisma.Decimal>();
  for (const pcl of approvedCostLedgers) {
    if (pcl.costDate.getTime() > asOfCutoffMs) continue;
    const normCat = (pcl.costCategory || '').trim().toUpperCase();
    if (EXCLUDED_INDIRECT_COST_CATEGORIES.has(normCat)) continue;

    const costAmtDec = new Prisma.Decimal(
      String(pcl.netAmount > 0 ? pcl.netAmount : pcl.grossAmount)
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    if (costAmtDec.lte(0)) continue;

    const targets =
      (pcl.awardedBoqItemId ? boqActivityWeights.get(pcl.awardedBoqItemId) : undefined) ??
      (pcl.consolidatedBoqItemId ? cboqActivityWeights.get(pcl.consolidatedBoqItemId) : undefined);
    if (!targets || targets.length === 0) continue;

    // Merge duplicate entries for the same activityId
    const mergedMap = new Map<string, Prisma.Decimal>();
    for (const t of targets) {
      mergedMap.set(t.activityId, (mergedMap.get(t.activityId) ?? zero).plus(t.weight));
    }
    const mergedEntries = [...mergedMap.entries()];
    const shares = allocateDecimalProRata(
      costAmtDec,
      mergedEntries.map(([, w]) => w),
      2
    );
    mergedEntries.forEach(([actId], idx) => {
      actualCostByActId.set(actId, (actualCostByActId.get(actId) ?? zero).plus(shares[idx]));
    });
  }

  // IR2-02 + IR3-01: Classify each activity's updates and consume from ONE shared authoritative certified quantity budget per BOQ source
  // across ALL schedule activities, link types (UboqScheduleActivityLink + ScheduleBOQAllocation), and snapshot versions.
  type ActivityUpdateClassification = {
    hasBoqScope: boolean;
    activityCertUpdate: (typeof schedule.activities)[number]['progressUpdates'][number] | undefined;
    mismatchedAccomplishmentUpdate:
      | (typeof schedule.activities)[number]['progressUpdates'][number]
      | undefined;
    plainSelfReportedUpdate:
      | (typeof schedule.activities)[number]['progressUpdates'][number]
      | undefined;
  };
  const actUpdateClassMap = new Map<string, ActivityUpdateClassification>();

  for (const act of schedule.activities) {
    const actBoqs = activityMappedBoqIds.get(act.id) ?? new Set<string>();
    const hasBoqScope = actBoqs.size > 0;
    const eligibleUpdatesAsOfCutoff = act.progressUpdates.filter(
      (u) => u.scheduleId === schedule.id && u.updateDate.getTime() <= asOfCutoffMs
    );
    const isActivityMatchedCertUpdate = (
      u: (typeof eligibleUpdatesAsOfCutoff)[number]
    ): boolean => {
      if (!hasBoqScope || !u.accomplishmentId) return false;
      const certAcc = validCertAccAsOfCutoffById.get(u.accomplishmentId);
      if (!certAcc) return false;
      return [...certAcc.certifiedBoqIds].some((bId) => actBoqs.has(bId));
    };

    const activityCertUpdate = eligibleUpdatesAsOfCutoff.find(isActivityMatchedCertUpdate);
    const mismatchedAccomplishmentUpdate = eligibleUpdatesAsOfCutoff.find(
      (u) => Boolean(u.accomplishmentId) && !isActivityMatchedCertUpdate(u)
    );
    const plainSelfReportedUpdate = eligibleUpdatesAsOfCutoff.find((u) => !u.accomplishmentId);

    actUpdateClassMap.set(act.id, {
      hasBoqScope,
      activityCertUpdate,
      mismatchedAccomplishmentUpdate,
      plainSelfReportedUpdate,
    });
  }

  // Single authoritative certified quantity budget keyed by canonical AwardedBOQItem ID (IR3-01):
  // Canonical phase-slot sub-caps are derived ONCE per BOQ item (from its single authoritative snapshot) and NEVER replenish the BOQ budget.
  const remainingBoqCertBudget = new Map<string, Prisma.Decimal>(verifiedCertifiedQtyByBoqId);
  const remainingCanonicalSlotCap = new Map<string, Prisma.Decimal>();

  for (const [boqId, canonicalSlots] of canonicalPhaseSlotsByBoq.entries()) {
    const totalBoqCert = remainingBoqCertBudget.get(boqId) ?? zero;
    const slotShares = allocateDecimalProRata(
      totalBoqCert,
      canonicalSlots.map((s) => s.approvedQtySum),
      4
    );
    canonicalSlots.forEach((slot, idx) => {
      remainingCanonicalSlotCap.set(`${boqId}::${slot.slotKey}`, slotShares[idx]);
    });
  }

  const grantedSliceCertQty = new Map<string, Prisma.Decimal>();

  // Joint per-BOQ allocation across ALL linkage methods and snapshot versions (Stage 1: cert-updated activities, Stage 2: un-updated linked activities)
  for (const [boqId, boqSlices] of slicesByBoqId.entries()) {
    // Stage 1: Activities with a valid activity-specific Accomplishment update
    const stage1Claimants: Array<{
      slice: NormalizedActivityBoqSlice;
      requestedQty: Prisma.Decimal;
      slotBoundedReq: Prisma.Decimal;
    }> = [];

    for (const sl of boqSlices) {
      const cls = actUpdateClassMap.get(sl.activityId)!;
      if (!cls.activityCertUpdate) continue;
      const clampedPct = new Prisma.Decimal(
        String(Math.min(100, Math.max(0, cls.activityCertUpdate.progressPercent)))
      ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      const reqQty = Prisma.Decimal.min(
        sl.scopeQty,
        sl.scopeQty.mul(clampedPct).div(hundred).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      );
      stage1Claimants.push({ slice: sl, requestedQty: reqQty, slotBoundedReq: reqQty });
    }

    if (stage1Claimants.length > 0) {
      const boqAvailStage1 = remainingBoqCertBudget.get(boqId) ?? zero;

      // Apply canonical phase-slot sub-caps across UBOQ_PHASE_LINK slices sharing the same canonical slot (across any snapshot version)
      const bySlot = new Map<string, typeof stage1Claimants>();
      for (const c of stage1Claimants) {
        if (c.slice.kind === 'UBOQ_PHASE_LINK' && c.slice.canonicalSlotKey) {
          const fullSlotKey = `${boqId}::${c.slice.canonicalSlotKey}`;
          const list = bySlot.get(fullSlotKey) ?? [];
          list.push(c);
          bySlot.set(fullSlotKey, list);
        } else {
          c.slotBoundedReq = Prisma.Decimal.min(c.slice.scopeQty, Prisma.Decimal.min(c.requestedQty, boqAvailStage1));
        }
      }

      for (const [fullSlotKey, slotClaimants] of bySlot.entries()) {
        const slotCap = Prisma.Decimal.min(
          remainingCanonicalSlotCap.get(fullSlotKey) ?? zero,
          boqAvailStage1
        );
        const slotReqSum = slotClaimants.reduce((s, c) => s.plus(c.requestedQty), zero);
        if (slotReqSum.lte(slotCap)) {
          for (const c of slotClaimants) {
            c.slotBoundedReq = c.requestedQty;
          }
        } else {
          const shares = allocateDecimalProRata(
            slotCap,
            slotClaimants.map((c) => c.requestedQty),
            4
          );
          slotClaimants.forEach((c, idx) => {
            c.slotBoundedReq = Prisma.Decimal.min(c.slice.scopeQty, shares[idx]);
          });
        }
      }

      // Enforce the single shared BOQ certified quantity budget jointly across ALL Stage 1 slices (UBOQ_PHASE_LINK + LEGACY_BOQ_ALLOCATION)
      const totalBoundedStage1 = stage1Claimants.reduce((s, c) => s.plus(c.slotBoundedReq), zero);
      let grantedSumStage1 = zero;
      if (totalBoundedStage1.lte(boqAvailStage1)) {
        for (const c of stage1Claimants) {
          grantedSliceCertQty.set(c.slice.sliceId, c.slotBoundedReq);
          grantedSumStage1 = grantedSumStage1.plus(c.slotBoundedReq);
          if (c.slice.kind === 'UBOQ_PHASE_LINK' && c.slice.canonicalSlotKey) {
            const fullSlotKey = `${boqId}::${c.slice.canonicalSlotKey}`;
            const curCap = remainingCanonicalSlotCap.get(fullSlotKey) ?? zero;
            remainingCanonicalSlotCap.set(
              fullSlotKey,
              Prisma.Decimal.max(zero, curCap.minus(c.slotBoundedReq))
            );
          }
        }
      } else {
        const jointShares = allocateDecimalProRata(
          boqAvailStage1,
          stage1Claimants.map((c) => c.slotBoundedReq),
          4
        );
        stage1Claimants.forEach((c, idx) => {
          const grant = Prisma.Decimal.min(
            c.slice.scopeQty,
            Prisma.Decimal.min(c.slotBoundedReq, jointShares[idx])
          );
          grantedSliceCertQty.set(c.slice.sliceId, grant);
          grantedSumStage1 = grantedSumStage1.plus(grant);
          if (c.slice.kind === 'UBOQ_PHASE_LINK' && c.slice.canonicalSlotKey) {
            const fullSlotKey = `${boqId}::${c.slice.canonicalSlotKey}`;
            const curCap = remainingCanonicalSlotCap.get(fullSlotKey) ?? zero;
            remainingCanonicalSlotCap.set(fullSlotKey, Prisma.Decimal.max(zero, curCap.minus(grant)));
          }
        });
      }

      remainingBoqCertBudget.set(boqId, Prisma.Decimal.max(zero, boqAvailStage1.minus(grantedSumStage1)));
    }

    // Stage 2: Apportion any remaining shared BOQ certified budget across un-updated linked activities (excluding mismatchedAccomplishmentUpdate)
    const boqAvailStage2 = remainingBoqCertBudget.get(boqId) ?? zero;
    if (boqAvailStage2.gt(0)) {
      const stage2Fallback: Array<{
        slice: NormalizedActivityBoqSlice;
        slotBoundedQty: Prisma.Decimal;
      }> = [];

      for (const sl of boqSlices) {
        const cls = actUpdateClassMap.get(sl.activityId)!;
        if (cls.activityCertUpdate || cls.mismatchedAccomplishmentUpdate || !cls.hasBoqScope) {
          continue;
        }
        stage2Fallback.push({ slice: sl, slotBoundedQty: sl.scopeQty });
      }

      if (stage2Fallback.length > 0) {
        const bySlot2 = new Map<string, typeof stage2Fallback>();
        for (const f of stage2Fallback) {
          if (f.slice.kind === 'UBOQ_PHASE_LINK' && f.slice.canonicalSlotKey) {
            const fullSlotKey = `${boqId}::${f.slice.canonicalSlotKey}`;
            const list = bySlot2.get(fullSlotKey) ?? [];
            list.push(f);
            bySlot2.set(fullSlotKey, list);
          } else {
            f.slotBoundedQty = Prisma.Decimal.min(f.slice.scopeQty, boqAvailStage2);
          }
        }

        for (const [fullSlotKey, slotMembers] of bySlot2.entries()) {
          const slotCap = Prisma.Decimal.min(
            remainingCanonicalSlotCap.get(fullSlotKey) ?? zero,
            boqAvailStage2
          );
          const scopeSum = slotMembers.reduce((s, m) => s.plus(m.slice.scopeQty), zero);
          const dist = Prisma.Decimal.min(slotCap, scopeSum);
          const shares = allocateDecimalProRata(
            dist,
            slotMembers.map((m) => m.slice.scopeQty),
            4
          );
          slotMembers.forEach((m, idx) => {
            m.slotBoundedQty = Prisma.Decimal.min(m.slice.scopeQty, shares[idx]);
          });
        }

        const totalBoundedStage2 = stage2Fallback.reduce((s, f) => s.plus(f.slotBoundedQty), zero);
        let grantedSumStage2 = zero;
        if (totalBoundedStage2.lte(boqAvailStage2)) {
          for (const f of stage2Fallback) {
            grantedSliceCertQty.set(f.slice.sliceId, f.slotBoundedQty);
            grantedSumStage2 = grantedSumStage2.plus(f.slotBoundedQty);
          }
        } else {
          const jointShares2 = allocateDecimalProRata(
            boqAvailStage2,
            stage2Fallback.map((f) => f.slotBoundedQty),
            4
          );
          stage2Fallback.forEach((f, idx) => {
            const grant = Prisma.Decimal.min(
              f.slice.scopeQty,
              Prisma.Decimal.min(f.slotBoundedQty, jointShares2[idx])
            );
            grantedSliceCertQty.set(f.slice.sliceId, grant);
            grantedSumStage2 = grantedSumStage2.plus(grant);
          });
        }

        remainingBoqCertBudget.set(
          boqId,
          Prisma.Decimal.max(zero, boqAvailStage2.minus(grantedSumStage2))
        );
      }
    }

    // Defense-in-depth invariant: total certified quantity credited across all slices of boqId MUST NEVER exceed verifiedCertifiedQtyByBoqId
    const totalCreditedForBoq = boqSlices.reduce(
      (s, sl) => s.plus(grantedSliceCertQty.get(sl.sliceId) ?? zero),
      zero
    );
    const maxBoqCertBudget = verifiedCertifiedQtyByBoqId.get(boqId) ?? zero;
    if (totalCreditedForBoq.gt(maxBoqCertBudget)) {
      throw new CanonicalAdapterError('TEMPLATE_EVM_CERTIFIED_BUDGET_EXCEEDED', 409, {
        scheduleId: schedule.id,
        boqItemId: boqId,
        creditedQty: totalCreditedForBoq.toFixed(4),
        certifiedBudgetQty: maxBoqCertBudget.toFixed(4),
      });
    }
  }

  const computeActivityVerifiedPct = (
    act: (typeof schedule.activities)[number]
  ): { pct: Prisma.Decimal; hasPositiveVerifiedQty: boolean } => {
    const actSlices = slicesByActId.get(act.id) ?? [];
    if (actSlices.length === 0) {
      return { pct: zero, hasPositiveVerifiedQty: false };
    }
    let weightedNum = zero;
    let weightedDen = zero;
    let hasPos = false;
    for (const sl of actSlices) {
      weightedDen = weightedDen.plus(sl.lineAmt);
      const grantedQ = grantedSliceCertQty.get(sl.sliceId) ?? zero;
      if (grantedQ.gt(0)) hasPos = true;
      const pct = sl.scopeQty.gt(0)
        ? Prisma.Decimal.min(hundred, grantedQ.div(sl.scopeQty).mul(100))
        : zero;
      weightedNum = weightedNum.plus(sl.lineAmt.mul(pct));
    }
    return {
      pct: weightedDen.gt(0)
        ? weightedNum.div(weightedDen).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
        : zero,
      hasPositiveVerifiedQty: hasPos,
    };
  };

  let bacTotalDec = zero;
  let pvTotalDec = zero;
  let evTotalDec = zero;
  let acTotalDec = zero;

  const rows: Array<Record<string, unknown>> = schedule.activities.map((act) => {
    const cpmRes = cpmOutput.results.get(act.id)!;
    const preds = incomingDepsByActId.get(act.id) ?? [];
    const predText =
      preds.length === 0
        ? 'NONE'
        : preds
            .map((d) => {
              const pCode = codeByActId.get(d.predecessorId) ?? d.predecessorId;
              const lagSuffix =
                d.lagDays === 0 ? '' : d.lagDays > 0 ? `+${d.lagDays}d` : `${d.lagDays}d`;
              return `${pCode}(${d.type}${lagSuffix})`;
            })
            .join(', ');

    const pStart = act.baselineStartDate ?? act.plannedStartDate ?? cpmRes.earlyStartDate ?? null;
    const pFinish =
      act.baselineFinishDate ?? act.plannedFinishDate ?? cpmRes.earlyFinishDate ?? null;

    let plannedPctDec: Prisma.Decimal;
    if (pStart && pStart.getTime() > asOfCutoffMs) {
      // Future-dated activity starting after unified as-of cutoff has 0% PV
      plannedPctDec = zero;
    } else if (pStart && pFinish) {
      if (asOfCutoffMs <= pStart.getTime()) {
        plannedPctDec = zero;
      } else if (asOfCutoffMs >= pFinish.getTime() || pFinish.getTime() <= pStart.getTime()) {
        plannedPctDec = hundred;
      } else {
        const elapsedMs = asOfCutoffMs - pStart.getTime();
        const spanMs = pFinish.getTime() - pStart.getTime();
        plannedPctDec = new Prisma.Decimal(elapsedMs)
          .div(new Prisma.Decimal(spanMs))
          .mul(100)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      }
    } else {
      const clampedW = Math.min(100, Math.max(0, act.plannedWeight ?? 0));
      plannedPctDec = new Prisma.Decimal(String(clampedW)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
    }

    // IR-04 + IR2-02: Require activity-specific BOQ linkage AND accomplishment-to-activity BOQ overlap,
    // bounding certified EV progress strictly to verified, inspected BOQ quantities allocated to this activity.
    const cls = actUpdateClassMap.get(act.id)!;
    const verifiedShare = computeActivityVerifiedPct(act);

    let actualPctDec: Prisma.Decimal;
    let progressVerificationBasis: string;
    let selfReportedProgressPct: string | null = null;

    if (cls.activityCertUpdate) {
      const claimedClamped = Math.min(100, Math.max(0, cls.activityCertUpdate.progressPercent));
      const claimedPctDec = new Prisma.Decimal(String(claimedClamped)).toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
      actualPctDec = Prisma.Decimal.min(claimedPctDec, verifiedShare.pct);
      if (claimedPctDec.gt(verifiedShare.pct)) {
        progressVerificationBasis = 'CERTIFIED_ACCOMPLISHMENT_CAPPED_BY_VERIFIED_BOQ_QTY';
        selfReportedProgressPct = claimedPctDec.toFixed(4);
      } else {
        progressVerificationBasis = 'CERTIFIED_ACCOMPLISHMENT_LINKED_UPDATE';
        const unverifiedRef = cls.mismatchedAccomplishmentUpdate ?? cls.plainSelfReportedUpdate;
        if (unverifiedRef) {
          const selfClamped = Math.min(100, Math.max(0, unverifiedRef.progressPercent));
          selfReportedProgressPct = new Prisma.Decimal(String(selfClamped)).toFixed(4);
        }
      }
    } else if (cls.mismatchedAccomplishmentUpdate) {
      // Activity references an Accomplishment that does NOT certify any BOQ item mapped to this activity (or activity has no BOQ linkage) -> fail closed EV = 0
      actualPctDec = zero;
      const misClamped = Math.min(
        100,
        Math.max(0, cls.mismatchedAccomplishmentUpdate.progressPercent)
      );
      progressVerificationBasis = cls.hasBoqScope
        ? 'UNVERIFIED_UNRELATED_ACCOMPLISHMENT_EXCLUDED_FROM_EV'
        : 'UNVERIFIED_NO_ACTIVITY_BOQ_LINKAGE_EXCLUDED_FROM_EV';
      selfReportedProgressPct = new Prisma.Decimal(String(misClamped)).toFixed(4);
    } else if (cls.hasBoqScope && verifiedShare.hasPositiveVerifiedQty) {
      actualPctDec = verifiedShare.pct;
      progressVerificationBasis =
        act.uboqLinks.length > 0
          ? 'CERTIFIED_BOQ_ACCOMPLISHMENT_QTY'
          : 'CERTIFIED_BOQ_ALLOCATION_QTY';
      if (cls.plainSelfReportedUpdate) {
        const selfClamped = Math.min(100, Math.max(0, cls.plainSelfReportedUpdate.progressPercent));
        selfReportedProgressPct = new Prisma.Decimal(String(selfClamped)).toFixed(4);
      }
    } else {
      // Unverified self-reported progress NEVER earns contractual Earned Value (EV = 0.00)
      actualPctDec = zero;
      const rawSelfPct = cls.plainSelfReportedUpdate
        ? cls.plainSelfReportedUpdate.progressPercent
        : act.actualProgressPercent ?? 0;
      const clampedSelf = Math.min(100, Math.max(0, rawSelfPct));
      if (cls.plainSelfReportedUpdate || clampedSelf > 0) {
        progressVerificationBasis = cls.hasBoqScope
          ? 'UNVERIFIED_SELF_REPORTED_EXCLUDED_FROM_EV'
          : 'UNVERIFIED_NO_ACTIVITY_BOQ_LINKAGE_EXCLUDED_FROM_EV';
        selfReportedProgressPct = new Prisma.Decimal(String(clampedSelf)).toFixed(4);
      } else {
        progressVerificationBasis = 'NO_CERTIFIED_PROGRESS_AS_OF_CUTOFF';
        selfReportedProgressPct = null;
      }
    }

    const bacDec = actBacMap.get(act.id) ?? zero;
    const pvDec = bacDec
      .mul(plannedPctDec)
      .div(hundred)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const evDec = bacDec
      .mul(actualPctDec)
      .div(hundred)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const acDec = (actualCostByActId.get(act.id) ?? zero).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );

    const spiStr = pvDec.gt(0)
      ? evDec.div(pvDec).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4)
      : null;
    const cpiStr = acDec.gt(0)
      ? evDec.div(acDec).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4)
      : null;

    bacTotalDec = bacTotalDec.plus(bacDec);
    pvTotalDec = pvTotalDec.plus(pvDec);
    evTotalDec = evTotalDec.plus(evDec);
    acTotalDec = acTotalDec.plus(acDec);

    const wbsCode = act.wbs?.code ?? act.uboqLinks[0]?.phaseLine.phaseCode ?? 'WBS-ROOT';
    const actUnit = act.unit ?? act.uboqLinks[0]?.phaseLine.unitNormalized ?? null;
    const actQtyDec = new Prisma.Decimal(String(act.plannedQuantity ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );

    return {
      project_id: projectId,
      schedule_id: schedule.id,
      baseline_revision: schedule.baselineRevision,
      wbs_id: act.wbsId ?? wbsCode,
      activity_db_id: act.id,
      activity_id: codeByActId.get(act.id)!,
      phase_code: wbsCode,
      work_description: act.name,
      unit: actUnit,
      approved_qty: actQtyDec.toFixed(4),
      predecessors: predText,
      planned_start: pStart ? pStart.toISOString().slice(0, 10) : null,
      planned_finish: pFinish ? pFinish.toISOString().slice(0, 10) : null,
      early_start_day: cpmRes.earlyStart,
      early_finish_day: cpmRes.earlyFinish,
      late_start_day: cpmRes.lateStart,
      late_finish_day: cpmRes.lateFinish,
      cpm_total_float: cpmRes.totalFloat,
      cpm_free_float: cpmRes.freeFloat,
      is_critical_path: cpmRes.isCritical,
      as_of_cutoff_date: asOfCutoffIsoDate,
      progress_verification_basis: progressVerificationBasis,
      self_reported_progress_pct: selfReportedProgressPct,
      bac_allocated_amount: bacDec.toFixed(2),
      planned_progress_pct: plannedPctDec.toFixed(4),
      actual_progress_pct: actualPctDec.toFixed(4),
      planned_value: pvDec.toFixed(2),
      earned_value: evDec.toFixed(2),
      actual_cost: acDec.toFixed(2),
      spi: spiStr,
      cpi: cpiStr,
    };
  });

  // Validate schedule-wide EVM via canonical validation engine
  const evmCheck = evaluateScheduleAndEvmPerformance({
    projectStartDate: baseStartDate ?? undefined,
    activities: cpmActivities,
    dependencies: cpmDeps,
    plannedValue: Number(pvTotalDec),
    earnedValue: Number(evTotalDec),
    actualCost: Number(acTotalDec),
  });
  if (evmCheck.issues.some((i) => i.severity === 'BLOCKING')) {
    throw new CanonicalAdapterError('TEMPLATE_CPM_CIRCULAR_DEPENDENCY', 409, {
      scheduleId: schedule.id,
      issues: evmCheck.issues,
    });
  }

  const overallSpi = pvTotalDec.gt(0)
    ? evTotalDec.div(pvTotalDec).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4)
    : null;
  const overallCpi = acTotalDec.gt(0)
    ? evTotalDec.div(acTotalDec).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP).toFixed(4)
    : null;

  const systemMetaFields = [
    'project_id',
    'schedule_id',
    'baseline_revision',
    'wbs_id',
    'activity_db_id',
    'activity_id',
    'early_start_day',
    'early_finish_day',
    'late_start_day',
    'late_finish_day',
    'cpm_free_float',
    'is_critical_path',
    'as_of_cutoff_date',
    'progress_verification_basis',
    'self_reported_progress_pct',
    'bac_allocated_amount',
  ] as const;

  return {
    sourceId: schedule.id,
    sourceVersion: `rev${schedule.baselineRevision}`,
    rows,
    systemMetaFields,
    approvedById: schedule.approvedBy ?? schedule.activatedById ?? 'BASELINE_AUTHORITY',
    approvedAtIso: (
      schedule.approvedAt ??
      schedule.activatedAt ??
      schedule.createdAt
    ).toISOString(),
    canonicalHash: schedule.activationSnapshotHash ?? schedule.lockedBOQChecksum ?? null,
    sourceEvidenceHash: null,
    scheduleEvmSummary: {
      scheduleId: schedule.id,
      baselineRevision: schedule.baselineRevision,
      workflowStatus: schedule.workflowStatus,
      projectDurationWorkingDays: cpmOutput.projectDuration,
      criticalActivityCount: cpmOutput.criticalPath.length,
      statusCutoffDateIso: asOfCutoffIsoDate,
      bacTotal: bacTotalDec.toFixed(2),
      plannedValueTotal: pvTotalDec.toFixed(2),
      earnedValueTotal: evTotalDec.toFixed(2),
      actualCostTotal: acTotalDec.toFixed(2),
      overallSpi,
      overallCpi,
    },
  };
}

export interface BatchCActorRoleContext {
  effectiveRole: string;
  fieldAccessRole?: string;
}

export function hasSensitiveProjectedColumns(
  visibleColumns: ReadonlyArray<{ fieldId: string; visibility?: string }>
): boolean {
  return visibleColumns.some((col) => {
    if (col.visibility === 'sensitive') return true;
    const spec =
      CANONICAL_FIELD_MAP.get(col.fieldId) ?? T12_SAFE_DERIVED_VARIANCE_SPECS.get(col.fieldId);
    return spec?.visibility === 'sensitive';
  });
}

export function hasSensitiveRequestedFields(selectedFields?: readonly string[]): boolean {
  if (!Array.isArray(selectedFields) || selectedFields.length === 0) return false;
  return selectedFields.some((f) => {
    const spec = CANONICAL_FIELD_MAP.get(f) ?? T12_SAFE_DERIVED_VARIANCE_SPECS.get(f);
    return spec?.visibility === 'sensitive';
  });
}

export function mintSensitiveExportAttestation(params: {
  id: string;
  projectId: string;
  userId: string;
  templateCode: string;
  format: string;
  sourceId?: string | null;
  recordCount: number;
  approved: boolean;
  blocked: boolean;
  outputSha256?: string | null;
  issuedEpochSec?: number;
  secretHexOverride?: string;
}): string {
  const secretHex = (params.secretHexOverride ?? process.env.UBOQ_RLS_CONTEXT_SECRET ?? '').trim();
  if (!secretHex || secretHex.length < 64) {
    return '';
  }
  const issuedSec = String(params.issuedEpochSec ?? Math.floor(Date.now() / 1000));
  const nonceHex = crypto.randomBytes(12).toString('hex');
  const payload = [
    secretHex,
    'UBOQ_SENSITIVE_EXPORT_V1',
    params.id,
    params.projectId,
    params.userId,
    params.templateCode.trim().toUpperCase(),
    params.format.trim().toUpperCase(),
    (params.sourceId ?? '').trim(),
    String(params.recordCount ?? 0),
    params.approved ? 'true' : 'false',
    params.blocked ? 'true' : 'false',
    (params.outputSha256 ?? '').trim().toLowerCase(),
    issuedSec,
    nonceHex,
  ].join('|');
  const macHex = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
  return `${issuedSec}.${nonceHex}.${macHex}`;
}

export async function recordSensitiveTemplateExportAudit(
  db: Prisma.TransactionClient,
  params: {
    userId: string;
    userEmail?: string | null;
    projectId: string;
    templateCode: string;
    format: string;
    sourceId?: string | null;
    recordCount: number;
    sourceIp?: string | null;
    approved: boolean;
    blocked: boolean;
    reason: string;
    outputSha256?: string | null;
  }
): Promise<void> {
  const eventId = `sel_${crypto.randomUUID().replace(/-/g, '')}`;
  const fmtUpper = params.format.trim().toUpperCase();
  const normalizedSha = params.outputSha256 ? params.outputSha256.trim().toLowerCase() : '';
  const exportProof = mintSensitiveExportAttestation({
    id: eventId,
    projectId: params.projectId,
    userId: params.userId,
    templateCode: params.templateCode,
    format: fmtUpper,
    sourceId: params.sourceId ?? null,
    recordCount: params.recordCount,
    approved: params.approved,
    blocked: params.blocked,
    outputSha256: normalizedSha,
  });
  await db.$queryRaw`
    SELECT (public.uboq_append_sensitive_export_log(
      ${eventId}::text,
      ${params.userId}::text,
      ${params.userEmail ?? null}::text,
      ${params.projectId}::text,
      ${params.templateCode}::text,
      ${fmtUpper}::text,
      ${params.sourceId ?? null}::text,
      ${params.recordCount}::integer,
      ${params.sourceIp ?? null}::text,
      ${params.approved}::boolean,
      ${params.blocked}::boolean,
      ${params.reason.slice(0, 450)}::text,
      ${normalizedSha || null}::text,
      ${exportProof}::text
    )).id AS id
  `;
}

interface SubcontractAndPayrollFactsPayload {
  subcontractPackages?: Array<{
    id: string;
    packageNumber: string;
    subcontractorId: string;
    awardedBoqItemId: string | null;
    consolidatedBoqItemId: string | null;
    quantity: number;
    unit: string;
    unitCost: number;
    contractAmount: number;
    costType: string;
    retentionPct: number | null;
    whtPct: number | null;
    startDate: string | null;
    targetCompletion: string | null;
    status: string;
    createdAt: string;
  }>;
  jobOrders?: Array<{
    id: string;
    jobNumber: string;
    packageId: string | null;
    subcontractorId: string | null;
    boqReferenceId: string | null;
    consolidatedBoqItemId: string | null;
    contractAmount: number;
    startDate: string | null;
    completionDate: string | null;
    status: string;
    createdAt: string;
  }>;
  payrollSummaries?: Array<{
    id: string;
    payrollPeriodId: string;
    payrollBatchNumber: string;
    grossPay: number;
    netPay: number;
    employerStatutoryShare: number;
    paymentStatus: string;
    transactionReference: string | null;
    periodStatus: string;
    periodStartDate: string;
    periodEndDate: string;
    payrollDate: string | null;
    dateReleased: string | null;
    createdAt: string;
  }>;
}

async function readRlsGuardedSubcontractAndPayrollFacts(
  db: Prisma.TransactionClient,
  projectId: string,
  canReadRestricted: boolean
): Promise<Required<SubcontractAndPayrollFactsPayload>> {
  if (!canReadRestricted) {
    return { subcontractPackages: [], jobOrders: [], payrollSummaries: [] };
  }
  const rows = await db.$queryRaw<Array<{ facts: SubcontractAndPayrollFactsPayload | null }>>`
    SELECT public.uboq_read_project_subcontract_and_payroll_facts(${projectId}::text) AS facts
  `;
  const facts = rows[0]?.facts ?? {};
  return {
    subcontractPackages: Array.isArray(facts.subcontractPackages) ? facts.subcontractPackages : [],
    jobOrders: Array.isArray(facts.jobOrders) ? facts.jobOrders : [],
    payrollSummaries: Array.isArray(facts.payrollSummaries) ? facts.payrollSummaries : [],
  };
}

async function loadVerifiedBatchCSnapshotContext(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string
) {
  const snapshot = await db.uboqOperationalSnapshot.findFirst({
    where: {
      id: sourceId,
      projectId,
      status: 'APPROVED',
      approvedAt: { not: null },
      approvedById: { not: null },
    },
    include: {
      sourceDocument: { select: { id: true, projectId: true, sha256Hash: true } },
      contractAuthority: { include: { taxProfile: true } },
    },
  });

  if (!snapshot || !snapshot.approvedAt || !snapshot.approvedById) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (snapshot.sourceDocument && snapshot.sourceDocument.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }

  if (!snapshot.contractAuthorityId) {
    throw new CanonicalAdapterError('TEMPLATE_CONTRACT_RATE_ASSOCIATION_UNVERIFIED', 409, {
      projectId,
      sourceId,
      snapshotId: snapshot.id,
      reason: 'MISSING_SNAPSHOT_CONTRACT_AUTHORITY_LINK',
    });
  }
  const ca = snapshot.contractAuthority;
  if (!ca || ca.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }
  if (ca.status !== 'APPROVED' || !ca.approvedAt || !ca.approvedById) {
    throw new CanonicalAdapterError('TEMPLATE_CONTRACT_RATE_ASSOCIATION_UNVERIFIED', 409, {
      projectId,
      sourceId,
      snapshotId: snapshot.id,
      contractAuthorityId: ca.id,
      reason: 'LINKED_CONTRACT_NOT_APPROVED',
    });
  }
  if (ca.taxProfile && ca.taxProfile.projectId !== projectId) {
    throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
  }

  const [
    phaseLines,
    projectBoqItems,
    approvedClientVos,
    consolidationGroups,
    boqMappings,
    consolidatedItems,
  ] = await Promise.all([
    db.uboqAwardedPhaseLine.findMany({
      where: { projectId, snapshotId: snapshot.id },
      include: {
        sourceDocument: { select: { id: true, projectId: true, sha256Hash: true } },
      },
      orderBy: [{ phaseCode: 'asc' }, { sectionCode: 'asc' }, { itemCode: 'asc' }, { id: 'asc' }],
      take: 1001,
    }),
    db.awardedBOQItem.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        itemCode: true,
        quantity: true,
        approvedClientVoQuantity: true,
      },
    }),
    db.variationOrder.findMany({
      where: {
        projectId,
        subcontractPackageId: null,
        currentStatus: { in: ['APPROVED', 'approved'] },
      },
      select: {
        id: true,
        voNumber: true,
        projectId: true,
        subcontractPackageId: true,
        items: {
          where: {
            approvalStatus: { in: ['APPROVED', 'approved'] },
            originalBoqItemId: { not: null },
          },
          select: {
            id: true,
            voItemNumber: true,
            itemClassification: true,
            originalBoqItemId: true,
            originalQuantity: true,
            previouslyApprovedQuantity: true,
            revisedQuantity: true,
            currentProposedQuantity: true,
            additionalAmount: true,
            deductiveAmount: true,
            netAmount: true,
          },
          orderBy: [{ voItemNumber: 'asc' }, { id: 'asc' }],
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.uboqConsolidationGroup.findMany({
      where: { projectId },
      include: {
        links: {
          orderBy: { id: 'asc' },
        },
      },
    }),
    db.bOQMapping.findMany({
      where: {
        consolidatedBoqItem: { projectId },
        awardedBoqItemId: { not: null },
        status: { in: ['APPROVED', 'approved', 'ACTIVE', 'active'] },
      },
      select: {
        id: true,
        consolidatedBoqItemId: true,
        awardedBoqItemId: true,
        allocationPercentage: true,
        allocationQuantity: true,
      },
      orderBy: { id: 'asc' },
    }),
    db.consolidatedBOQItem.findMany({
      where: { projectId },
      select: { id: true, projectId: true, itemCode: true },
    }),
  ]);

  if (phaseLines.length === 0) {
    throw new CanonicalAdapterError('TEMPLATE_APPROVED_SOURCE_NOT_FOUND', 404);
  }
  if (phaseLines.length > 1000) {
    throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
  }

  const tp = ca.taxProfile;
  const taxProfileVersion = tp
    ? `${tp.profileCode}@${tp.versionCode}`
    : `${ca.contractVatBasis}_${ca.pricingMethod}`;
  const taxProfileConfig: TaxPricingProfileConfig = tp
    ? {
        profileCode: tp.profileCode,
        versionCode: tp.versionCode,
        sectorType: tp.sectorType,
        estimateVatComponentRate: Number(tp.estimateVatComponentRate),
        estimateVatBaseMode:
          (tp.estimateVatBaseMode as TaxPricingProfileConfig['estimateVatBaseMode']) || 'NONE',
        outputVatRate: Number(tp.outputVatRate),
        salesVatCategory:
          (tp.salesVatCategory as TaxPricingProfileConfig['salesVatCategory']) || 'VATABLE_12',
        contractVatInclusive: tp.contractVatInclusive,
        govVatWithholdingRate: Number(tp.govVatWithholdingRate),
        ewtRate: Number(tp.ewtRate),
        ocmRate: Number(tp.ocmRate),
        contractorProfitRate: Number(tp.contractorProfitRate),
        contingencyRate: Number(tp.contingencyRate),
        retentionRate: Number(tp.retentionRate),
        advanceRecoupmentRate: Number(tp.advanceRecoupmentRate),
      }
    : {
        profileCode: 'CONTRACT_AUTHORITY_DERIVED',
        versionCode: '1.0',
        sectorType: ca.sectorType,
        estimateVatComponentRate: 0,
        estimateVatBaseMode: 'NONE',
        outputVatRate: ca.contractVatBasis.toUpperCase().includes('ZERO')
          ? 0
          : ca.awardedRevenueExVat.gt(0) && ca.awardedRevenue.gt(ca.awardedRevenueExVat)
            ? Number(
                ca.awardedRevenue
                  .minus(ca.awardedRevenueExVat)
                  .div(ca.awardedRevenueExVat)
                  .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
              )
            : 0.12,
        salesVatCategory: ca.contractVatBasis.toUpperCase().includes('ZERO')
          ? 'ZERO_RATED_PEZA'
          : 'VATABLE_12',
        contractVatInclusive: !ca.contractVatBasis.toUpperCase().includes('EXCL'),
        govVatWithholdingRate: ca.sectorType === 'GOVERNMENT' ? 0.05 : 0,
        ewtRate: 0.02,
        ocmRate: 0.1,
        contractorProfitRate: 0.1,
        contingencyRate: 0,
        retentionRate: 0.1,
        advanceRecoupmentRate: 0.15,
      };

  const boqById = new Map(projectBoqItems.map((b) => [b.id, b]));
  const boqByCode = new Map<string, (typeof projectBoqItems)[number][]>();
  for (const b of projectBoqItems) {
    const k = b.itemCode.trim().toUpperCase();
    const list = boqByCode.get(k) ?? [];
    list.push(b);
    boqByCode.set(k, list);
  }

  const phaseLineById = new Map(phaseLines.map((pl) => [pl.id, pl]));
  const phaseLineBoqId = new Map<string, string | null>();
  const phaseLinesByBoqId = new Map<string, typeof phaseLines>();
  const phaseLinesByItemCode = new Map<string, typeof phaseLines>();

  for (const pl of phaseLines) {
    if (pl.sourceDocument && pl.sourceDocument.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const codeKey = pl.itemCode.trim().toUpperCase();
    const byCode = phaseLinesByItemCode.get(codeKey) ?? [];
    byCode.push(pl);
    phaseLinesByItemCode.set(codeKey, byCode);

    let resolvedBoqId: string | null = null;
    if (pl.awardedBoqItemId) {
      const boq = boqById.get(pl.awardedBoqItemId);
      if (!boq || boq.projectId !== projectId) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      resolvedBoqId = boq.id;
    } else {
      const candidates = boqByCode.get(codeKey) ?? [];
      if (candidates.length === 1) {
        resolvedBoqId = candidates[0].id;
      }
    }
    phaseLineBoqId.set(pl.id, resolvedBoqId);
    if (resolvedBoqId) {
      const list = phaseLinesByBoqId.get(resolvedBoqId) ?? [];
      list.push(pl);
      phaseLinesByBoqId.set(resolvedBoqId, list);
    }
  }

  // Reconcile approved Client VOs (strictly excluding subcontractor VOs via subcontractPackageId: null)
  const zero = new Prisma.Decimal(0);
  const voDeltaByBoqId = new Map<string, Prisma.Decimal>();
  const voTrackedBoqIds = new Set<string>();
  for (const vo of approvedClientVos) {
    if (vo.projectId !== projectId || vo.subcontractPackageId !== null) continue;
    for (const item of vo.items) {
      if (!item.originalBoqItemId) continue;
      const boq = boqById.get(item.originalBoqItemId);
      if (!boq || boq.projectId !== projectId) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      voTrackedBoqIds.add(boq.id);
      const memberPhaseLines = phaseLinesByBoqId.get(boq.id) ?? [];
      const baselineOrigQtyDec =
        memberPhaseLines.length > 0
          ? memberPhaseLines
              .reduce((acc, pl) => acc.plus(pl.originalQty), zero)
              .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
          : new Prisma.Decimal(String(boq.quantity ?? 0)).toDecimalPlaces(
              4,
              Prisma.Decimal.ROUND_HALF_UP
            );
      const priorDeltaDec = voDeltaByBoqId.get(boq.id) ?? zero;
      const { qtyDeltaDec: deltaDec } = reconcileApprovedVoItemQuantities(
        item,
        baselineOrigQtyDec,
        priorDeltaDec,
        'CLIENT_CONTRACT_VO',
        {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber ?? null,
          awardedBoqItemId: boq.id,
        }
      );
      voDeltaByBoqId.set(boq.id, priorDeltaDec.plus(deltaDec));
    }
  }
  for (const boq of projectBoqItems) {
    if (
      !voTrackedBoqIds.has(boq.id) &&
      !voDeltaByBoqId.has(boq.id) &&
      boq.approvedClientVoQuantity !== 0
    ) {
      voDeltaByBoqId.set(
        boq.id,
        new Prisma.Decimal(String(boq.approvedClientVoQuantity)).toDecimalPlaces(
          4,
          Prisma.Decimal.ROUND_HALF_UP
        )
      );
    }
  }

  const allocatedVoQtyByPhaseLineId = new Map<string, Prisma.Decimal>();
  for (const [boqId, members] of phaseLinesByBoqId.entries()) {
    const rawVoDelta = (voDeltaByBoqId.get(boqId) ?? zero).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const snapOrigSum = members.reduce((acc, m) => acc.plus(m.originalQty), zero);
    const snapApprSum = members.reduce((acc, m) => acc.plus(m.approvedQty), zero);
    const bakedSignedDelta = snapApprSum.minus(snapOrigSum);
    const totalVoDelta = rawVoDelta.gt(0)
      ? Prisma.Decimal.max(zero, rawVoDelta.minus(Prisma.Decimal.max(zero, bakedSignedDelta))).toDecimalPlaces(
          4,
          Prisma.Decimal.ROUND_HALF_UP
        )
      : rawVoDelta.lt(0)
        ? Prisma.Decimal.min(zero, rawVoDelta.minus(Prisma.Decimal.min(zero, bakedSignedDelta))).toDecimalPlaces(
            4,
            Prisma.Decimal.ROUND_HALF_UP
          )
        : zero;
    const shares = allocateDecimalProRata(
      totalVoDelta,
      members.map((m) => m.approvedQty),
      4
    );
    members.forEach((m, idx) => {
      allocatedVoQtyByPhaseLineId.set(m.id, shares[idx]);
    });
  }

  // Compute revised gross & Ex-VAT contract revenue per phase line
  const outputVatDec = new Prisma.Decimal(String(taxProfileConfig.outputVatRate));
  const onePlusVat = new Prisma.Decimal(1).plus(outputVatDec);

  const revisedQtyByPhaseLineId = new Map<string, Prisma.Decimal>();
  const revisedGrossAmtByPhaseLineId = new Map<string, Prisma.Decimal>();
  const revisedExVatAmtByPhaseLineId = new Map<string, Prisma.Decimal>();

  for (const pl of phaseLines) {
    const voQty = allocatedVoQtyByPhaseLineId.get(pl.id) ?? zero;
    const effQty = pl.approvedQty.plus(voQty).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const grossAmt = voQty.isZero()
      ? pl.contractLineAmount.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : effQty.mul(pl.contractUnitRate).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    let exVatAmt: Prisma.Decimal;
    if (voQty.isZero() && pl.contractAmountExVat.gt(0)) {
      exVatAmt = pl.contractAmountExVat.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    } else if (outputVatDec.gt(0) && taxProfileConfig.contractVatInclusive) {
      exVatAmt = grossAmt.div(onePlusVat).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    } else {
      exVatAmt = grossAmt;
    }

    revisedQtyByPhaseLineId.set(pl.id, effQty);
    revisedGrossAmtByPhaseLineId.set(pl.id, grossAmt);
    revisedExVatAmtByPhaseLineId.set(pl.id, exVatAmt);
  }

  // Pre-build deterministic ConsolidatedBOQItem -> PhaseLine weight mapping
  const consolidatedById = new Map(consolidatedItems.map((c) => [c.id, c]));
  const phaseWeightsByConsolidatedId = new Map<
    string,
    Array<{ phaseLineId: string; weight: Prisma.Decimal }>
  >();

  for (const cg of consolidationGroups) {
    const validLinks = cg.links.filter((lnk) => phaseLineById.has(lnk.phaseLineId));
    if (validLinks.length > 0) {
      phaseWeightsByConsolidatedId.set(
        cg.consolidatedBoqItemId,
        validLinks.map((lnk) => ({
          phaseLineId: lnk.phaseLineId,
          weight: lnk.allocatedQty.gt(0)
            ? lnk.allocatedQty
            : lnk.allocationWeightPct.gt(0)
              ? lnk.allocationWeightPct
              : new Prisma.Decimal(1),
        }))
      );
    }
  }

  const mappingsByConsolidated = new Map<string, typeof boqMappings>();
  for (const bm of boqMappings) {
    const list = mappingsByConsolidated.get(bm.consolidatedBoqItemId) ?? [];
    list.push(bm);
    mappingsByConsolidated.set(bm.consolidatedBoqItemId, list);
  }

  for (const ci of consolidatedItems) {
    if (phaseWeightsByConsolidatedId.has(ci.id)) continue;
    const mapped = mappingsByConsolidated.get(ci.id) ?? [];
    const targetEntries: Array<{ phaseLineId: string; weight: Prisma.Decimal }> = [];
    for (const m of mapped) {
      if (!m.awardedBoqItemId) continue;
      const members = phaseLinesByBoqId.get(m.awardedBoqItemId) ?? [];
      const mappingWeight = new Prisma.Decimal(
        String(
          m.allocationPercentage && m.allocationPercentage > 0
            ? m.allocationPercentage
            : m.allocationQuantity && m.allocationQuantity > 0
              ? m.allocationQuantity
              : 1
        )
      );
      for (const pl of members) {
        targetEntries.push({
          phaseLineId: pl.id,
          weight: mappingWeight.mul(revisedExVatAmtByPhaseLineId.get(pl.id) ?? new Prisma.Decimal(1)),
        });
      }
    }
    if (targetEntries.length > 0) {
      phaseWeightsByConsolidatedId.set(ci.id, targetEntries);
      continue;
    }
    const byCode = phaseLinesByItemCode.get(ci.itemCode.trim().toUpperCase()) ?? [];
    if (byCode.length > 0) {
      phaseWeightsByConsolidatedId.set(
        ci.id,
        byCode.map((pl) => ({
          phaseLineId: pl.id,
          weight: revisedExVatAmtByPhaseLineId.get(pl.id) ?? new Prisma.Decimal(1),
        }))
      );
    }
  }

  return {
    snapshot,
    contractAuthority: ca,
    taxProfileConfig,
    taxProfileVersion,
    phaseLines,
    phaseLineById,
    boqById,
    phaseLineBoqId,
    phaseLinesByBoqId,
    phaseLinesByItemCode,
    consolidatedById,
    phaseWeightsByConsolidatedId,
    revisedQtyByPhaseLineId,
    revisedGrossAmtByPhaseLineId,
    revisedExVatAmtByPhaseLineId,
  };
}

interface PhaseLineObligationAccumulator {
  committedTotalExVat: Prisma.Decimal;
  incurredAgainstCommitmentExVat: Prisma.Decimal;
  uncommittedDirectIncurredExVat: Prisma.Decimal;
  paidDisbursedExVat: Prisma.Decimal;
  commitmentOpenExVat: Prisma.Decimal;
}

interface DatedCashDisbursementEvent {
  paidDate: Date;
  cashPaidGrossDec: Prisma.Decimal;
  stream: 'PROCUREMENT' | 'PAYROLL_SUBCON' | 'OTHER';
}

interface ReconciledCommitmentsAndObligations {
  byPhaseLineId: Map<string, PhaseLineObligationAccumulator>;
  totals: {
    committedTotalExVat: Prisma.Decimal;
    incurredAgainstCommitmentExVat: Prisma.Decimal;
    uncommittedDirectIncurredExVat: Prisma.Decimal;
    incurredActualCostExVat: Prisma.Decimal;
    paidDisbursedExVat: Prisma.Decimal;
    unpaidIncurredPayableExVat: Prisma.Decimal;
    outstandingTotalObligationExVat: Prisma.Decimal;
    commitmentOpenExVat: Prisma.Decimal;
    hasAnyCommitmentAuthority: boolean;
    deduplicatedMirrorCommitmentsCount: number;
    deduplicatedMirroredExpensesCount: number;
  };
  datedCashDisbursements: DatedCashDisbursementEvent[];
  forecastPoOutflows: Array<{ dueDate: Date; grossAmtDec: Prisma.Decimal }>;
  forecastSubconOutflows: Array<{ dueDate: Date; grossAmtDec: Prisma.Decimal }>;
  scheduledCommitmentPoOutflows: Array<{ dueDate: Date; grossAmtDec: Prisma.Decimal }>;
  scheduledCommitmentSubconOutflows: Array<{ dueDate: Date; grossAmtDec: Prisma.Decimal }>;
}

const APPROVED_PO_STATUSES = new Set([
  'APPROVED',
  'ISSUED',
  'ORDERED',
  'PARTIALLY_DELIVERED',
  'DELIVERED',
  'COMPLETED',
  'CLOSED',
]);

const APPROVED_AP_STATUSES = new Set([
  'PENDING',
  'APPROVED',
  'OPEN',
  'VERIFIED',
  'POSTED',
  'PARTIAL',
  'PARTIALLY_PAID',
  'PAID',
  'COMPLETED',
  'CLEARED',
]);

const PAID_AP_STATUSES = new Set([
  'PAID',
  'PARTIAL',
  'PARTIALLY_PAID',
  'COMPLETED',
  'CLEARED',
  'POSTED',
]);

const APPROVED_SUBCON_PKG_STATUSES = new Set([
  'APPROVED',
  'ACTIVE',
  'AWARDED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
]);

const APPROVED_JOB_ORDER_STATUSES = new Set([
  'APPROVED',
  'ACTIVE',
  'ISSUED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED',
]);

const APPROVED_COMMITMENT_LEDGER_STATUSES = new Set([
  'ACTIVE',
  'APPROVED',
  'OPEN',
  'PARTIALLY_BILLED',
  'COMPLETED',
  'CLOSED',
]);

const APPROVED_EXPENSE_STATUSES = new Set([
  'APPROVED',
  'PAID',
  'POSTED',
  'REIMBURSED',
  'VERIFIED',
  'COMPLETED',
]);

const APPROVED_PAYROLL_PERIOD_STATUSES = new Set([
  'APPROVED',
  'RELEASED',
  'PAID',
  'CLOSED',
  'POSTED',
]);

const PAID_PAYROLL_STATUSES = new Set(['PAID', 'RELEASED', 'COMPLETED', 'POSTED', 'CLEARED']);

function normalizeExVatAndGrossPair(params: {
  grossRaw: number | Prisma.Decimal | null | undefined;
  netRaw: number | Prisma.Decimal | null | undefined;
  vatRaw: number | Prisma.Decimal | null | undefined;
}): { exVatDec: Prisma.Decimal; grossDec: Prisma.Decimal } {
  const zero = new Prisma.Decimal(0);
  const tol = new Prisma.Decimal('0.05');
  const gross = Prisma.Decimal.max(
    zero,
    new Prisma.Decimal(String(params.grossRaw ?? 0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  );
  const net = Prisma.Decimal.max(
    zero,
    new Prisma.Decimal(String(params.netRaw ?? 0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  );
  const vat = Prisma.Decimal.max(
    zero,
    new Prisma.Decimal(String(params.vatRaw ?? 0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
  );

  if (net.gt(0) && gross.gt(0) && net.plus(vat).minus(gross).abs().lte(tol)) {
    return { exVatDec: net, grossDec: gross };
  }
  if (vat.gt(0) && gross.gt(vat)) {
    return {
      exVatDec: gross.minus(vat).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
      grossDec: gross,
    };
  }
  if (net.gt(0) && gross.isZero()) {
    return {
      exVatDec: net,
      grossDec: net.plus(vat).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
    };
  }
  return { exVatDec: gross, grossDec: gross };
}

async function reconcileProjectCommitmentsAndObligations(
  db: Prisma.TransactionClient,
  projectId: string,
  snapshotCtx: Awaited<ReturnType<typeof loadVerifiedBatchCSnapshotContext>>,
  asOfCutoff: Date,
  roleCtx: BatchCActorRoleContext
): Promise<ReconciledCommitmentsAndObligations> {
  const zero = new Prisma.Decimal(0);
  const tol = new Prisma.Decimal('0.05');
  const cutoffMs = asOfCutoff.getTime();
  const projectionRole = resolveNarrowestFieldRole(roleCtx.effectiveRole, roleCtx.fieldAccessRole);
  const permittedTiers = getPermittedVisibilityTiers(projectionRole);
  const canReadRestricted = permittedTiers.has('restricted');

  const [
    purchaseOrders,
    subcontractBillings,
    subcontractorVos,
    commitmentLedgers,
    projectCostLedgers,
    expenses,
    subconAndPayrollFacts,
  ] = await Promise.all([
    db.purchaseOrder.findMany({
      where: { mr: { projectId } },
      include: {
        mr: { select: { id: true, projectId: true } },
        items: { orderBy: { id: 'asc' } },
        payables: { orderBy: { id: 'asc' } },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.subcontractBilling.findMany({
      where: { projectId },
      include: {
        payments: { orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.subcontractorVariationOrder.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.commitmentLedger.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.projectCostLedger.findMany({
      where: { projectId },
      orderBy: [{ costDate: 'asc' }, { id: 'asc' }],
    }),
    db.expense.findMany({
      where: { projectId },
      orderBy: [{ date: 'asc' }, { id: 'asc' }],
    }),
    readRlsGuardedSubcontractAndPayrollFacts(db, projectId, canReadRestricted),
  ]);

  const byPhaseLineId = new Map<string, PhaseLineObligationAccumulator>();
  for (const pl of snapshotCtx.phaseLines) {
    byPhaseLineId.set(pl.id, {
      committedTotalExVat: zero,
      incurredAgainstCommitmentExVat: zero,
      uncommittedDirectIncurredExVat: zero,
      paidDisbursedExVat: zero,
      commitmentOpenExVat: zero,
    });
  }

  const defaultPhaseWeights = snapshotCtx.phaseLines.map((pl) => ({
    phaseLineId: pl.id,
    weight:
      (snapshotCtx.revisedExVatAmtByPhaseLineId.get(pl.id) ?? zero).gt(0)
        ? snapshotCtx.revisedExVatAmtByPhaseLineId.get(pl.id)!
        : new Prisma.Decimal(1),
  }));

  const resolveAllocationTargets = (linkage: {
    consolidatedBoqItemId?: string | null;
    awardedBoqItemId?: string | null;
    boqReferenceCode?: string | null;
  }): Array<{ phaseLineId: string; weight: Prisma.Decimal }> => {
    if (linkage.consolidatedBoqItemId) {
      if (!snapshotCtx.consolidatedById.has(linkage.consolidatedBoqItemId)) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      const mapped = snapshotCtx.phaseWeightsByConsolidatedId.get(linkage.consolidatedBoqItemId);
      if (mapped && mapped.length > 0) return mapped;
    }
    if (linkage.awardedBoqItemId) {
      const boq = snapshotCtx.boqById.get(linkage.awardedBoqItemId);
      if (!boq || boq.projectId !== projectId) {
        throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
      }
      const members = snapshotCtx.phaseLinesByBoqId.get(linkage.awardedBoqItemId);
      if (members && members.length > 0) {
        return members.map((m) => ({
          phaseLineId: m.id,
          weight:
            (snapshotCtx.revisedExVatAmtByPhaseLineId.get(m.id) ?? zero).gt(0)
              ? snapshotCtx.revisedExVatAmtByPhaseLineId.get(m.id)!
              : new Prisma.Decimal(1),
        }));
      }
    }
    if (linkage.boqReferenceCode) {
      const refTrim = linkage.boqReferenceCode.trim();
      const byBoqId = snapshotCtx.phaseLinesByBoqId.get(refTrim);
      if (byBoqId && byBoqId.length > 0) {
        return byBoqId.map((m) => ({
          phaseLineId: m.id,
          weight:
            (snapshotCtx.revisedExVatAmtByPhaseLineId.get(m.id) ?? zero).gt(0)
              ? snapshotCtx.revisedExVatAmtByPhaseLineId.get(m.id)!
              : new Prisma.Decimal(1),
        }));
      }
      const byCode = snapshotCtx.phaseLinesByItemCode.get(refTrim.toUpperCase());
      if (byCode && byCode.length > 0) {
        return byCode.map((m) => ({
          phaseLineId: m.id,
          weight:
            (snapshotCtx.revisedExVatAmtByPhaseLineId.get(m.id) ?? zero).gt(0)
              ? snapshotCtx.revisedExVatAmtByPhaseLineId.get(m.id)!
              : new Prisma.Decimal(1),
        }));
      }
    }
    return defaultPhaseWeights;
  };

  const distributeToPhaseLines = (
    targets: Array<{ phaseLineId: string; weight: Prisma.Decimal }>,
    amounts: {
      committedExVat?: Prisma.Decimal;
      incurredCommittedExVat?: Prisma.Decimal;
      uncommittedIncurredExVat?: Prisma.Decimal;
      paidExVat?: Prisma.Decimal;
      openCommitmentExVat?: Prisma.Decimal;
    }
  ) => {
    const weights = targets.map((t) => t.weight);
    const commShares = amounts.committedExVat
      ? allocateDecimalProRata(amounts.committedExVat, weights, 2)
      : null;
    const incCommShares = amounts.incurredCommittedExVat
      ? allocateDecimalProRata(amounts.incurredCommittedExVat, weights, 2)
      : null;
    const uncommShares = amounts.uncommittedIncurredExVat
      ? allocateDecimalProRata(amounts.uncommittedIncurredExVat, weights, 2)
      : null;
    const paidShares = amounts.paidExVat
      ? allocateDecimalProRata(amounts.paidExVat, weights, 2)
      : null;
    const openShares = amounts.openCommitmentExVat
      ? allocateDecimalProRata(amounts.openCommitmentExVat, weights, 2)
      : null;

    targets.forEach((t, idx) => {
      const acc = byPhaseLineId.get(t.phaseLineId);
      if (!acc) return;
      if (commShares) acc.committedTotalExVat = acc.committedTotalExVat.plus(commShares[idx]);
      if (incCommShares) {
        acc.incurredAgainstCommitmentExVat = acc.incurredAgainstCommitmentExVat.plus(
          incCommShares[idx]
        );
      }
      if (uncommShares) {
        acc.uncommittedDirectIncurredExVat = acc.uncommittedDirectIncurredExVat.plus(
          uncommShares[idx]
        );
      }
      if (paidShares) acc.paidDisbursedExVat = acc.paidDisbursedExVat.plus(paidShares[idx]);
      if (openShares) acc.commitmentOpenExVat = acc.commitmentOpenExVat.plus(openShares[idx]);
    });
  };

  // Index eligible approved ProjectCostLedger rows (<= asOfCutoff) so operational mirrors are deduplicated once
  const approvedCostLedgers = projectCostLedgers.filter((pcl) => {
    const st = (pcl.approvalStatus || '').trim().toUpperCase();
    return (
      ['APPROVED', 'POSTED', 'PAID', 'COMPLETED', 'VERIFIED'].includes(st) &&
      pcl.costDate.getTime() <= cutoffMs
    );
  });
  const consumedCostLedgerIds = new Set<string>();
  const pclByRefNo = new Map<string, typeof approvedCostLedgers>();
  const pclByPoItemId = new Map<string, typeof approvedCostLedgers>();

  for (const pcl of approvedCostLedgers) {
    if (pcl.referenceDocumentNo) {
      const k = pcl.referenceDocumentNo.trim().toUpperCase();
      if (k) {
        const list = pclByRefNo.get(k) ?? [];
        list.push(pcl);
        pclByRefNo.set(k, list);
      }
    }
    if (pcl.poItemId) {
      const list = pclByPoItemId.get(pcl.poItemId) ?? [];
      list.push(pcl);
      pclByPoItemId.set(pcl.poItemId, list);
    }
  }

  const extractPclAmounts = (pcl: (typeof approvedCostLedgers)[number]) => {
    const { exVatDec, grossDec } = normalizeExVatAndGrossPair({
      grossRaw: pcl.grossAmount > 0 ? pcl.grossAmount : pcl.netAmount + pcl.vatAmount,
      netRaw: pcl.netAmount,
      vatRaw: pcl.vatAmount,
    });
    const paySt = (pcl.paymentStatus || '').trim().toUpperCase();
    const isPaidStatus = PAID_AP_STATUSES.has(paySt);
    const rawPaidGross = isPaidStatus
      ? Prisma.Decimal.min(
          grossDec,
          Prisma.Decimal.max(
            zero,
            new Prisma.Decimal(String(pcl.paidAmount ?? 0)).toDecimalPlaces(
              2,
              Prisma.Decimal.ROUND_HALF_UP
            )
          )
        )
      : zero;
    const paidExVatDec =
      grossDec.gt(0) && rawPaidGross.gt(0)
        ? Prisma.Decimal.min(
            exVatDec,
            rawPaidGross
              .mul(exVatDec)
              .div(grossDec)
              .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
          )
        : zero;
    return { exVatDec, grossDec, paidGrossDec: rawPaidGross, paidExVatDec };
  };

  let deduplicatedMirrorCommitmentsCount = 0;
  let deduplicatedMirroredExpensesCount = 0;
  let hasAnyCommitmentAuthority = false;
  const datedCashDisbursements: DatedCashDisbursementEvent[] = [];
  const forecastPoOutflows: Array<{ dueDate: Date; grossAmtDec: Prisma.Decimal }> = [];
  const forecastSubconOutflows: Array<{ dueDate: Date; grossAmtDec: Prisma.Decimal }> = [];
  const scheduledCommitmentPoOutflows: Array<{ dueDate: Date; grossAmtDec: Prisma.Decimal }> = [];
  const scheduledCommitmentSubconOutflows: Array<{
    dueDate: Date;
    grossAmtDec: Prisma.Decimal;
  }> = [];

  // Track operational commitments for CommitmentLedger mirror reconciliation
  interface OperationalCommitmentFingerprint {
    kind: 'PO' | 'SUBCONTRACT' | 'JOB_ORDER' | 'SVO';
    docRefUpper: string;
    consolidatedBoqItemIds: Set<string>;
    awardedBoqItemIds: Set<string>;
    committedExVatDec: Prisma.Decimal;
    committedGrossDec: Prisma.Decimal;
    matchedMirrorLedgerId: string | null;
  }
  const operationalCommitments: OperationalCommitmentFingerprint[] = [];

  // 1. Reconcile Approved Purchase Orders + PurchaseOrderItems + AccountsPayable (+ mirrored ProjectCostLedger)
  for (const po of purchaseOrders) {
    if (po.mr.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const poStatusNorm = (po.status || '').trim().toUpperCase();
    if (!APPROVED_PO_STATUSES.has(poStatusNorm)) continue;
    if (po.approvedAt && po.approvedAt.getTime() > cutoffMs) continue;

    hasAnyCommitmentAuthority = true;
    const rawItemsTotal = po.items.reduce(
      (acc, it) =>
        acc.plus(
          new Prisma.Decimal(String(it.quantity ?? 0))
            .mul(new Prisma.Decimal(String(it.unitCost ?? 0)))
            .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        ),
      zero
    );

    let poExVatDec: Prisma.Decimal;
    let poGrossDec: Prisma.Decimal;
    if (po.totalAmount > 0 || po.netAmount > 0) {
      const norm = normalizeExVatAndGrossPair({
        grossRaw: po.totalAmount > 0 ? po.totalAmount : rawItemsTotal,
        netRaw: po.netAmount,
        vatRaw: po.vatAmount,
      });
      poExVatDec = norm.exVatDec.gt(0) ? norm.exVatDec : rawItemsTotal;
      poGrossDec = norm.grossDec.gt(0) ? norm.grossDec : poExVatDec;
    } else {
      poExVatDec = rawItemsTotal;
      poGrossDec = rawItemsTotal;
    }

    // Reconcile AP vouchers on this PO <= cutoff
    let poIncurredExVatDec = zero;
    let poPaidExVatDec = zero;
    let poPaidGrossDec = zero;
    const seenVoucherRefs = new Set<string>();

    for (const ap of po.payables) {
      const apSt = (ap.status || '').trim().toUpperCase();
      if (!APPROVED_AP_STATUSES.has(apSt)) continue;
      if (ap.createdAt.getTime() > cutoffMs) continue;

      if (ap.voucherNumber) {
        const vKey = ap.voucherNumber.trim().toUpperCase();
        if (vKey) {
          if (seenVoucherRefs.has(vKey)) {
            throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_COMMITMENT_CONFLICT', 409, {
              projectId,
              poNumber: po.poNumber,
              duplicateVoucherNumber: ap.voucherNumber,
              reason: 'DUPLICATE_AP_VOUCHER_ON_PO',
            });
          }
          seenVoucherRefs.add(vKey);
        }
      }

      let apExVatDec: Prisma.Decimal;
      let apGrossDec: Prisma.Decimal;
      if (ap.netAmount > 0 || ap.vatAmount > 0) {
        const norm = normalizeExVatAndGrossPair({
          grossRaw: ap.amount,
          netRaw: ap.netAmount,
          vatRaw: ap.vatAmount,
        });
        apExVatDec = norm.exVatDec;
        apGrossDec = norm.grossDec;
      } else {
        apGrossDec = Prisma.Decimal.max(
          zero,
          new Prisma.Decimal(String(ap.amount ?? 0)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        );
        apExVatDec =
          poGrossDec.gt(0) && poGrossDec.gt(poExVatDec)
            ? apGrossDec
                .mul(poExVatDec)
                .div(poGrossDec)
                .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
            : apGrossDec;
      }

      const paidEligible =
        PAID_AP_STATUSES.has(apSt) &&
        ap.paidAmount > 0 &&
        (!ap.paidAt || ap.paidAt.getTime() <= cutoffMs);
      let apPaidGrossDec = paidEligible
        ? Prisma.Decimal.min(
            apGrossDec,
            new Prisma.Decimal(String(ap.paidAmount)).toDecimalPlaces(
              2,
              Prisma.Decimal.ROUND_HALF_UP
            )
          )
        : zero;
      let apPaidExVatDec =
        apGrossDec.gt(0) && apPaidGrossDec.gt(0)
          ? Prisma.Decimal.min(
              apExVatDec,
              apPaidGrossDec
                .mul(apExVatDec)
                .div(apGrossDec)
                .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
            )
          : zero;

      // Deduplicate any ProjectCostLedger row mirroring this exact AP voucher
      if (ap.voucherNumber) {
        const matchingPcls = pclByRefNo.get(ap.voucherNumber.trim().toUpperCase()) ?? [];
        for (const mPcl of matchingPcls) {
          if (consumedCostLedgerIds.has(mPcl.id)) continue;
          consumedCostLedgerIds.add(mPcl.id);
          deduplicatedMirroredExpensesCount += 1;
          const pclAmt = extractPclAmounts(mPcl);
          apExVatDec = Prisma.Decimal.max(apExVatDec, pclAmt.exVatDec);
          apPaidExVatDec = Prisma.Decimal.max(apPaidExVatDec, pclAmt.paidExVatDec);
          apPaidGrossDec = Prisma.Decimal.max(apPaidGrossDec, pclAmt.paidGrossDec);
        }
      }

      poIncurredExVatDec = poIncurredExVatDec.plus(apExVatDec);
      poPaidExVatDec = poPaidExVatDec.plus(apPaidExVatDec);
      poPaidGrossDec = poPaidGrossDec.plus(apPaidGrossDec);

      if (apPaidGrossDec.gt(0)) {
        datedCashDisbursements.push({
          paidDate: ap.paidAt ?? ap.createdAt,
          cashPaidGrossDec: apPaidGrossDec,
          stream: 'PROCUREMENT',
        });
      }
    }

    // Reconcile any ProjectCostLedger rows linked to po.poNumber or po.items not already matched to an AP voucher
    const poRefMatches = pclByRefNo.get(po.poNumber.trim().toUpperCase()) ?? [];
    const poItemMatches = po.items.flatMap((it) => pclByPoItemId.get(it.id) ?? []);
    const uniquePoPcls = new Map<string, (typeof approvedCostLedgers)[number]>();
    for (const row of [...poRefMatches, ...poItemMatches]) {
      if (!consumedCostLedgerIds.has(row.id)) {
        uniquePoPcls.set(row.id, row);
      }
    }

    if (uniquePoPcls.size > 0) {
      if (po.payables.length > 0) {
        // Mirror ledger entries of existing PO payables: merge without double counting
        let mirrorIncurredSum = zero;
        let mirrorPaidExSum = zero;
        let mirrorPaidGrossSum = zero;
        for (const mPcl of uniquePoPcls.values()) {
          consumedCostLedgerIds.add(mPcl.id);
          deduplicatedMirroredExpensesCount += 1;
          const pclAmt = extractPclAmounts(mPcl);
          mirrorIncurredSum = mirrorIncurredSum.plus(pclAmt.exVatDec);
          mirrorPaidExSum = mirrorPaidExSum.plus(pclAmt.paidExVatDec);
          mirrorPaidGrossSum = mirrorPaidGrossSum.plus(pclAmt.paidGrossDec);
        }
        poIncurredExVatDec = Prisma.Decimal.max(poIncurredExVatDec, mirrorIncurredSum);
        if (mirrorPaidGrossSum.gt(poPaidGrossDec)) {
          datedCashDisbursements.push({
            paidDate: [...uniquePoPcls.values()][0].costDate,
            cashPaidGrossDec: mirrorPaidGrossSum.minus(poPaidGrossDec),
            stream: 'PROCUREMENT',
          });
          poPaidGrossDec = mirrorPaidGrossSum;
        }
        poPaidExVatDec = Prisma.Decimal.max(poPaidExVatDec, mirrorPaidExSum);
      } else {
        // Direct delivery cost ledger entries against PO items when no AP voucher was created yet
        for (const mPcl of uniquePoPcls.values()) {
          consumedCostLedgerIds.add(mPcl.id);
          const pclAmt = extractPclAmounts(mPcl);
          poIncurredExVatDec = poIncurredExVatDec.plus(pclAmt.exVatDec);
          poPaidExVatDec = poPaidExVatDec.plus(pclAmt.paidExVatDec);
          poPaidGrossDec = poPaidGrossDec.plus(pclAmt.paidGrossDec);
          if (pclAmt.paidGrossDec.gt(0)) {
            datedCashDisbursements.push({
              paidDate: mPcl.costDate,
              cashPaidGrossDec: pclAmt.paidGrossDec,
              stream: 'PROCUREMENT',
            });
          }
        }
      }
    }

    const poOpenCommitmentExVatDec = Prisma.Decimal.max(zero, poExVatDec.minus(poIncurredExVatDec));
    const poScheduledDueDate =
      po.dueDate ??
      (po.deliveryDate
        ? new Date(
            po.deliveryDate.getTime() + Math.max(0, po.paymentTermsDays ?? 30) * 86_400_000
          )
        : new Date(po.createdAt.getTime() + Math.max(0, po.paymentTermsDays ?? 30) * 86_400_000));
    if (poGrossDec.gt(0)) {
      scheduledCommitmentPoOutflows.push({
        dueDate: poScheduledDueDate,
        grossAmtDec: poGrossDec,
      });
    }
    const remainingPoCashOutGross = Prisma.Decimal.max(zero, poGrossDec.minus(poPaidGrossDec));
    if (remainingPoCashOutGross.gt(0)) {
      forecastPoOutflows.push({ dueDate: poScheduledDueDate, grossAmtDec: remainingPoCashOutGross });
    }

    // Allocate PO obligation amounts across PO items -> PhaseLines
    if (po.items.length > 0) {
      const itemWeights = po.items.map((it) => {
        const w = new Prisma.Decimal(String(it.quantity ?? 0)).mul(
          new Prisma.Decimal(String(it.unitCost ?? 0))
        );
        return w.gt(0) ? w : new Prisma.Decimal(1);
      });
      const commByItem = allocateDecimalProRata(poExVatDec, itemWeights, 2);
      const incByItem = allocateDecimalProRata(poIncurredExVatDec, itemWeights, 2);
      const paidByItem = allocateDecimalProRata(poPaidExVatDec, itemWeights, 2);
      const openByItem = allocateDecimalProRata(poOpenCommitmentExVatDec, itemWeights, 2);

      po.items.forEach((it, idx) => {
        const targets = resolveAllocationTargets({
          consolidatedBoqItemId: it.consolidatedBoqItemId,
        });
        distributeToPhaseLines(targets, {
          committedExVat: commByItem[idx],
          incurredCommittedExVat: incByItem[idx],
          paidExVat: paidByItem[idx],
          openCommitmentExVat: openByItem[idx],
        });
      });
    } else {
      distributeToPhaseLines(defaultPhaseWeights, {
        committedExVat: poExVatDec,
        incurredCommittedExVat: poIncurredExVatDec,
        paidExVat: poPaidExVatDec,
        openCommitmentExVat: poOpenCommitmentExVatDec,
      });
    }

    operationalCommitments.push({
      kind: 'PO',
      docRefUpper: po.poNumber.trim().toUpperCase(),
      consolidatedBoqItemIds: new Set(po.items.map((i) => i.consolidatedBoqItemId)),
      awardedBoqItemIds: new Set(),
      committedExVatDec: poExVatDec,
      committedGrossDec: poGrossDec,
      matchedMirrorLedgerId: null,
    });
  }

  // 2. Reconcile Approved SubcontractPackages + SubcontractorVariationOrders + Child/Standalone JobOrders + SubcontractBillings
  const activePackages = subconAndPayrollFacts.subcontractPackages.filter((sp) =>
    APPROVED_SUBCON_PKG_STATUSES.has((sp.status || '').trim().toUpperCase())
  );
  const activeJobOrders = subconAndPayrollFacts.jobOrders.filter((jo) =>
    APPROVED_JOB_ORDER_STATUSES.has((jo.status || '').trim().toUpperCase())
  );

  // Sum approved SubcontractorVariationOrders per package (cost commitment only — NEVER client revenue!)
  const svoDeltaByPkgId = new Map<string, Prisma.Decimal>();
  const unlinkedApprovedSvos: typeof subcontractorVos = [];
  for (const svo of subcontractorVos) {
    const appSt = (svo.approvalStatus || '').trim().toUpperCase();
    if (appSt !== 'APPROVED') continue;
    if (svo.createdAt.getTime() > cutoffMs) continue;

    const origDec = new Prisma.Decimal(String(svo.originalSubcontractAmt ?? 0));
    const revDec = new Prisma.Decimal(String(svo.revisedSubcontractAmt ?? 0));
    const propDec = new Prisma.Decimal(String(svo.proposedAdditionalAmt ?? 0));
    const deltaDec = (
      revDec.gt(0) && origDec.gt(0) ? revDec.minus(origDec) : propDec
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (svo.originalSubcontractId) {
      svoDeltaByPkgId.set(
        svo.originalSubcontractId,
        (svoDeltaByPkgId.get(svo.originalSubcontractId) ?? zero).plus(deltaDec)
      );
    } else if (!deltaDec.isZero()) {
      unlinkedApprovedSvos.push(svo);
    }

    if (svo.svoNumber?.trim()) {
      operationalCommitments.push({
        kind: 'SVO',
        docRefUpper: svo.svoNumber.trim().toUpperCase(),
        consolidatedBoqItemIds: svo.consolidatedBoqItemId
          ? new Set([svo.consolidatedBoqItemId])
          : new Set(),
        awardedBoqItemIds: svo.awardedBoqItemId ? new Set([svo.awardedBoqItemId]) : new Set(),
        committedExVatDec: deltaDec,
        committedGrossDec: deltaDec,
        matchedMirrorLedgerId: null,
      });
    }
  }

  // Index child JobOrders by packageId to prevent double-counting against parent SubcontractPackage
  const childJosByPkgId = new Map<string, typeof activeJobOrders>();
  const standaloneJobOrders: typeof activeJobOrders = [];
  const activePkgById = new Map(activePackages.map((sp) => [sp.id, sp]));

  for (const jo of activeJobOrders) {
    if (jo.packageId) {
      if (!activePkgById.has(jo.packageId)) {
        throw new CanonicalAdapterError('TEMPLATE_SUBCONTRACT_COMMITMENT_EXCEEDED', 409, {
          projectId,
          jobOrderId: jo.id,
          jobNumber: jo.jobNumber,
          packageId: jo.packageId,
          reason: 'CHILD_JOB_ORDER_LINKED_TO_INACTIVE_OR_MISSING_PACKAGE',
        });
      }
      deduplicatedMirrorCommitmentsCount += 1;
      const list = childJosByPkgId.get(jo.packageId) ?? [];
      list.push(jo);
      childJosByPkgId.set(jo.packageId, list);
    } else {
      standaloneJobOrders.push(jo);
    }
  }

  // Reconcile approved SubcontractBillings (<= cutoff) grouped by parent packageId or standalone jobOrderId
  const billingsByPkgId = new Map<string, typeof subcontractBillings>();
  const billingsByStandaloneJoId = new Map<string, typeof subcontractBillings>();
  const standaloneSubconBillings: typeof subcontractBillings = [];

  for (const sb of subcontractBillings) {
    const appSt = (sb.approvalStatus || '').trim().toUpperCase();
    const bilSt = (sb.status || '').trim().toUpperCase();
    if (
      appSt === 'REJECTED' ||
      bilSt === 'REJECTED' ||
      bilSt === 'CANCELLED' ||
      (appSt !== 'APPROVED' && !['APPROVED', 'PAID', 'PARTIALLY_PAID'].includes(bilSt))
    ) {
      continue;
    }
    if (sb.createdAt.getTime() > cutoffMs) continue;

    // Resolve parent package if billed via a child JobOrder
    let resolvedPkgId = sb.packageId;
    if (!resolvedPkgId && sb.jobOrderId) {
      const joMatch = activeJobOrders.find((j) => j.id === sb.jobOrderId);
      if (joMatch?.packageId) {
        resolvedPkgId = joMatch.packageId;
      }
    }

    if (resolvedPkgId && activePkgById.has(resolvedPkgId)) {
      const list = billingsByPkgId.get(resolvedPkgId) ?? [];
      list.push(sb);
      billingsByPkgId.set(resolvedPkgId, list);
    } else if (sb.jobOrderId) {
      const list = billingsByStandaloneJoId.get(sb.jobOrderId) ?? [];
      list.push(sb);
      billingsByStandaloneJoId.set(sb.jobOrderId, list);
    } else {
      standaloneSubconBillings.push(sb);
    }
  }

  const evaluateSubconBillingGroup = (billings: typeof subcontractBillings) => {
    let incurredExVatSum = zero;
    let paidExVatSum = zero;
    let paidGrossSum = zero;

    for (const sb of billings) {
      const currGrossDec = Prisma.Decimal.max(
        zero,
        new Prisma.Decimal(
          String(
            sb.currentGross > 0 || sb.previousGross > 0 ? sb.currentGross : sb.totalGross ?? 0
          )
        ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      );

      const seenPayRefs = new Set<string>();
      let sbPaidDec = zero;
      for (const pr of sb.payments) {
        if (pr.paymentDate.getTime() > cutoffMs) continue;
        if (pr.referenceNumber) {
          const refKey = pr.referenceNumber.trim().toUpperCase();
          if (refKey) {
            if (seenPayRefs.has(refKey)) {
              throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_COLLECTION_REFERENCE', 409, {
                projectId,
                subcontractBillingNumber: sb.billingNumber,
                duplicateReferenceNumber: pr.referenceNumber,
                reason: 'DUPLICATE_SUBCONTRACT_DISBURSEMENT_REFERENCE',
              });
            }
            seenPayRefs.add(refKey);
          }
        }
        const pAmt = Prisma.Decimal.max(
          zero,
          new Prisma.Decimal(String(pr.amountPaid ?? 0)).toDecimalPlaces(
            2,
            Prisma.Decimal.ROUND_HALF_UP
          )
        );
        sbPaidDec = sbPaidDec.plus(pAmt);
        if (pAmt.gt(0)) {
          datedCashDisbursements.push({
            paidDate: pr.paymentDate,
            cashPaidGrossDec: pAmt,
            stream: 'PAYROLL_SUBCON',
          });
        }
      }

      let sbIncurredExVat = currGrossDec;
      let sbPaidExVat = Prisma.Decimal.min(currGrossDec, sbPaidDec);

      // Deduplicate mirrored ProjectCostLedger entries referencing sb.billingNumber
      const matchingPcls = pclByRefNo.get(sb.billingNumber.trim().toUpperCase()) ?? [];
      for (const mPcl of matchingPcls) {
        if (consumedCostLedgerIds.has(mPcl.id)) continue;
        consumedCostLedgerIds.add(mPcl.id);
        deduplicatedMirroredExpensesCount += 1;
        const pclAmt = extractPclAmounts(mPcl);
        sbIncurredExVat = Prisma.Decimal.max(sbIncurredExVat, pclAmt.exVatDec);
        if (pclAmt.paidGrossDec.gt(sbPaidDec)) {
          datedCashDisbursements.push({
            paidDate: mPcl.costDate,
            cashPaidGrossDec: pclAmt.paidGrossDec.minus(sbPaidDec),
            stream: 'PAYROLL_SUBCON',
          });
          sbPaidDec = pclAmt.paidGrossDec;
        }
        sbPaidExVat = Prisma.Decimal.max(sbPaidExVat, pclAmt.paidExVatDec);
      }

      incurredExVatSum = incurredExVatSum.plus(sbIncurredExVat);
      paidExVatSum = paidExVatSum.plus(sbPaidExVat);
      paidGrossSum = paidGrossSum.plus(sbPaidDec);
    }

    return { incurredExVatSum, paidExVatSum, paidGrossSum };
  };

  for (const sp of activePackages) {
    hasAnyCommitmentAuthority = true;
    const basePkgDec = Prisma.Decimal.max(
      zero,
      new Prisma.Decimal(String(sp.contractAmount ?? 0)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    );
    const svoDeltaDec = svoDeltaByPkgId.get(sp.id) ?? zero;
    const revisedPkgCommitmentDec = Prisma.Decimal.max(
      zero,
      basePkgDec.plus(svoDeltaDec).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    );

    const childJos = childJosByPkgId.get(sp.id) ?? [];
    const childJoSumDec = childJos.reduce(
      (acc, jo) =>
        acc.plus(
          new Prisma.Decimal(String(jo.contractAmount ?? 0)).toDecimalPlaces(
            2,
            Prisma.Decimal.ROUND_HALF_UP
          )
        ),
      zero
    );
    if (childJoSumDec.gt(revisedPkgCommitmentDec.plus(tol))) {
      throw new CanonicalAdapterError('TEMPLATE_SUBCONTRACT_COMMITMENT_EXCEEDED', 409, {
        projectId,
        packageId: sp.id,
        packageNumber: sp.packageNumber,
        revisedPackageCeiling: revisedPkgCommitmentDec.toFixed(2),
        childJobOrdersTotal: childJoSumDec.toFixed(2),
        reason: 'CHILD_JOB_ORDERS_EXCEED_PARENT_SUBCONTRACT_PACKAGE',
      });
    }

    const { incurredExVatSum, paidExVatSum, paidGrossSum } = evaluateSubconBillingGroup(
      billingsByPkgId.get(sp.id) ?? []
    );
    const openPkgCommitmentDec = Prisma.Decimal.max(
      zero,
      revisedPkgCommitmentDec.minus(incurredExVatSum)
    );
    const spScheduledDueDate = sp.targetCompletion
      ? new Date(sp.targetCompletion)
      : new Date(new Date(sp.createdAt).getTime() + 30 * 86_400_000);
    if (revisedPkgCommitmentDec.gt(0)) {
      scheduledCommitmentSubconOutflows.push({
        dueDate: spScheduledDueDate,
        grossAmtDec: revisedPkgCommitmentDec,
      });
    }
    const remainingSubconCashOut = Prisma.Decimal.max(
      zero,
      revisedPkgCommitmentDec.minus(paidGrossSum)
    );
    if (remainingSubconCashOut.gt(0)) {
      forecastSubconOutflows.push({ dueDate: spScheduledDueDate, grossAmtDec: remainingSubconCashOut });
    }

    const targets = resolveAllocationTargets({
      consolidatedBoqItemId: sp.consolidatedBoqItemId,
      awardedBoqItemId: sp.awardedBoqItemId,
    });
    distributeToPhaseLines(targets, {
      committedExVat: revisedPkgCommitmentDec,
      incurredCommittedExVat: incurredExVatSum,
      paidExVat: paidExVatSum,
      openCommitmentExVat: openPkgCommitmentDec,
    });

    operationalCommitments.push({
      kind: 'SUBCONTRACT',
      docRefUpper: sp.packageNumber.trim().toUpperCase(),
      consolidatedBoqItemIds: sp.consolidatedBoqItemId
        ? new Set([sp.consolidatedBoqItemId])
        : new Set(),
      awardedBoqItemIds: sp.awardedBoqItemId ? new Set([sp.awardedBoqItemId]) : new Set(),
      committedExVatDec: revisedPkgCommitmentDec,
      committedGrossDec: revisedPkgCommitmentDec,
      matchedMirrorLedgerId: null,
    });
  }

  for (const jo of standaloneJobOrders) {
    hasAnyCommitmentAuthority = true;
    const joAmtDec = Prisma.Decimal.max(
      zero,
      new Prisma.Decimal(String(jo.contractAmount ?? 0)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    );
    const { incurredExVatSum, paidExVatSum, paidGrossSum } = evaluateSubconBillingGroup(
      billingsByStandaloneJoId.get(jo.id) ?? []
    );
    const openJoCommitmentDec = Prisma.Decimal.max(zero, joAmtDec.minus(incurredExVatSum));
    const joScheduledDueDate = jo.completionDate
      ? new Date(jo.completionDate)
      : new Date(new Date(jo.createdAt).getTime() + 15 * 86_400_000);
    if (joAmtDec.gt(0)) {
      scheduledCommitmentSubconOutflows.push({
        dueDate: joScheduledDueDate,
        grossAmtDec: joAmtDec,
      });
    }
    const remainingJoCashOut = Prisma.Decimal.max(zero, joAmtDec.minus(paidGrossSum));
    if (remainingJoCashOut.gt(0)) {
      forecastSubconOutflows.push({ dueDate: joScheduledDueDate, grossAmtDec: remainingJoCashOut });
    }

    const targets = resolveAllocationTargets({
      consolidatedBoqItemId: jo.consolidatedBoqItemId,
      boqReferenceCode: jo.boqReferenceId,
    });
    distributeToPhaseLines(targets, {
      committedExVat: joAmtDec,
      incurredCommittedExVat: incurredExVatSum,
      paidExVat: paidExVatSum,
      openCommitmentExVat: openJoCommitmentDec,
    });

    operationalCommitments.push({
      kind: 'JOB_ORDER',
      docRefUpper: jo.jobNumber.trim().toUpperCase(),
      consolidatedBoqItemIds: jo.consolidatedBoqItemId
        ? new Set([jo.consolidatedBoqItemId])
        : new Set(),
      awardedBoqItemIds: new Set(),
      committedExVatDec: joAmtDec,
      committedGrossDec: joAmtDec,
      matchedMirrorLedgerId: null,
    });
  }

  for (const svo of unlinkedApprovedSvos) {
    hasAnyCommitmentAuthority = true;
    const origDec = new Prisma.Decimal(String(svo.originalSubcontractAmt ?? 0));
    const revDec = new Prisma.Decimal(String(svo.revisedSubcontractAmt ?? 0));
    const propDec = new Prisma.Decimal(String(svo.proposedAdditionalAmt ?? 0));
    const deltaDec = Prisma.Decimal.max(
      zero,
      revDec.gt(0) && origDec.gt(0) ? revDec.minus(origDec) : propDec
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    if (deltaDec.gt(0)) {
      const targets = resolveAllocationTargets({
        consolidatedBoqItemId: svo.consolidatedBoqItemId,
        awardedBoqItemId: svo.awardedBoqItemId,
      });
      distributeToPhaseLines(targets, {
        committedExVat: deltaDec,
        openCommitmentExVat: deltaDec,
      });
    }
  }

  if (standaloneSubconBillings.length > 0) {
    const { incurredExVatSum, paidExVatSum } = evaluateSubconBillingGroup(standaloneSubconBillings);
    distributeToPhaseLines(defaultPhaseWeights, {
      uncommittedIncurredExVat: incurredExVatSum,
      paidExVat: paidExVatSum,
    });
  }

  // 3. Reconcile CommitmentLedger (deduplicate operational mirrors & fail closed on conflicting duplicate refs)
  const seenExplicitLedgerRefs = new Map<string, Prisma.Decimal>();
  for (const cl of commitmentLedgers) {
    const clSt = (cl.status || '').trim().toUpperCase();
    if (!APPROVED_COMMITMENT_LEDGER_STATUSES.has(clSt)) continue;
    if (cl.createdAt.getTime() > cutoffMs) continue;

    const clApprovedDec = Prisma.Decimal.max(
      zero,
      new Prisma.Decimal(String(cl.approvedAmount ?? 0)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    );
    const clBilledDec = Prisma.Decimal.max(
      zero,
      new Prisma.Decimal(String(cl.billedAmount ?? 0)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    );
    const clPaidDec = Prisma.Decimal.min(
      clBilledDec.gt(0) ? clBilledDec : clApprovedDec,
      Prisma.Decimal.max(
        zero,
        new Prisma.Decimal(String(cl.paidAmount ?? 0)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        )
      )
    );

    const typeUpper = (cl.commitmentType || '').trim().toUpperCase();
    if (/^(?:CVO|CLIENT_VO)[:#/-]?(.+)?$/.test(typeUpper)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_COMMITMENT_CONFLICT', 409, {
        projectId,
        commitmentLedgerId: cl.id,
        commitmentType: cl.commitmentType,
        reason: 'CLIENT_CONTRACT_VO_CANNOT_BE_RECOGNIZED_AS_COST_COMMITMENT',
      });
    }
    const explicitRefMatch = typeUpper.match(
      /^(?:PO|SUBCON|SUBCONTRACT|JO|JOB_ORDER|SVO|SUBCON_VO|SUBCONTRACT_VO|SUBCONTRACT_VARIATION_ORDER|REF)[:#/-](.+)$/
    );
    const explicitDocRef = explicitRefMatch ? explicitRefMatch[1].trim() : null;

    if (explicitDocRef) {
      const prevAmt = seenExplicitLedgerRefs.get(explicitDocRef);
      if (prevAmt !== undefined) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_COMMITMENT_CONFLICT', 409, {
          projectId,
          commitmentLedgerId: cl.id,
          duplicateReference: explicitDocRef,
          previousApprovedAmount: prevAmt.toFixed(2),
          conflictingApprovedAmount: clApprovedDec.toFixed(2),
          reason: 'DUPLICATE_EXPLICIT_COMMITMENT_LEDGER_REFERENCE',
        });
      }
      seenExplicitLedgerRefs.set(explicitDocRef, clApprovedDec);

      const opByRef = operationalCommitments.find((op) => op.docRefUpper === explicitDocRef);
      if (opByRef) {
        const matchesExVat = clApprovedDec.minus(opByRef.committedExVatDec).abs().lte(tol);
        const matchesGross = clApprovedDec.minus(opByRef.committedGrossDec).abs().lte(tol);
        if (!matchesExVat && !matchesGross) {
          throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_COMMITMENT_CONFLICT', 409, {
            projectId,
            commitmentLedgerId: cl.id,
            operationalDocumentRef: explicitDocRef,
            operationalExVatAmount: opByRef.committedExVatDec.toFixed(2),
            operationalGrossAmount: opByRef.committedGrossDec.toFixed(2),
            ledgerApprovedAmount: clApprovedDec.toFixed(2),
            reason: 'COMMITMENT_LEDGER_AMOUNT_CONFLICTS_WITH_AUTHORITY',
          });
        }
        opByRef.matchedMirrorLedgerId = cl.id;
        deduplicatedMirrorCommitmentsCount += 1;
        continue;
      }
    }

    // Check generic mirror match against an unmatched operational PO / Subcontract / JobOrder on the same BOQ linkage & amount
    const expectedKind =
      typeUpper === 'PO' || typeUpper === 'PURCHASE_ORDER' || typeUpper === 'SUPPLIER_PO'
        ? 'PO'
        : typeUpper === 'SUBCONTRACT' || typeUpper === 'SUBCONTRACT_PACKAGE'
          ? 'SUBCONTRACT'
          : typeUpper === 'JOB_ORDER' || typeUpper === 'JO'
            ? 'JOB_ORDER'
            : null;

    if (expectedKind) {
      const genericMirror = operationalCommitments.find((op) => {
        if (op.kind !== expectedKind || op.matchedMirrorLedgerId !== null) return false;
        const amtMatches =
          clApprovedDec.minus(op.committedExVatDec).abs().lte(tol) ||
          clApprovedDec.minus(op.committedGrossDec).abs().lte(tol);
        if (!amtMatches) return false;
        if (cl.consolidatedBoqItemId) {
          return op.consolidatedBoqItemIds.has(cl.consolidatedBoqItemId);
        }
        if (cl.awardedBoqItemId) {
          return op.awardedBoqItemIds.has(cl.awardedBoqItemId);
        }
        return op.consolidatedBoqItemIds.size === 0 && op.awardedBoqItemIds.size === 0;
      });
      if (genericMirror) {
        genericMirror.matchedMirrorLedgerId = cl.id;
        deduplicatedMirrorCommitmentsCount += 1;
        continue;
      }
    }

    // Standalone CommitmentLedger authority (not backed by a separate operational PO/Subcontract/JO row)
    hasAnyCommitmentAuthority = true;
    const clOpenDec = Prisma.Decimal.max(zero, clApprovedDec.minus(clBilledDec));
    const targets = resolveAllocationTargets({
      consolidatedBoqItemId: cl.consolidatedBoqItemId,
      awardedBoqItemId: cl.awardedBoqItemId,
    });
    distributeToPhaseLines(targets, {
      committedExVat: clApprovedDec,
      incurredCommittedExVat: clBilledDec,
      paidExVat: clPaidDec,
      openCommitmentExVat: clOpenDec,
    });
    if (clPaidDec.gt(0)) {
      datedCashDisbursements.push({
        paidDate: cl.createdAt,
        cashPaidGrossDec: clPaidDec,
        stream: 'OTHER',
      });
    }
  }

  // 4. Reconcile Direct Expenses (<= cutoff, separating accrued unpaid vs paid, deduplicating ProjectCostLedger)
  for (const exp of expenses) {
    const stNorm = (exp.status || '').trim().toUpperCase();
    const appNorm = (exp.approvalStatus || '').trim().toUpperCase();
    if (
      stNorm === 'REJECTED' ||
      stNorm === 'CANCELLED' ||
      appNorm === 'REJECTED' ||
      (!APPROVED_EXPENSE_STATUSES.has(stNorm) && !APPROVED_EXPENSE_STATUSES.has(appNorm))
    ) {
      continue;
    }
    if (exp.date.getTime() > cutoffMs) continue;

    const norm = normalizeExVatAndGrossPair({
      grossRaw: exp.amount,
      netRaw: exp.netAmount,
      vatRaw: exp.vatAmount,
    });
    let expIncurredExVat = norm.exVatDec;
    const isUnpaidAccrued =
      exp.isAccrued === true || stNorm === 'ACCRUED' || stNorm === 'UNPAID';
    let expPaidExVat = isUnpaidAccrued ? zero : norm.exVatDec;
    let expPaidGross = isUnpaidAccrued ? zero : norm.grossDec;

    const candidateRefKeys = [exp.receiptRef, exp.id]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim().toUpperCase());
    for (const rk of candidateRefKeys) {
      const mList = pclByRefNo.get(rk) ?? [];
      for (const mPcl of mList) {
        if (consumedCostLedgerIds.has(mPcl.id)) continue;
        consumedCostLedgerIds.add(mPcl.id);
        deduplicatedMirroredExpensesCount += 1;
        const pclAmt = extractPclAmounts(mPcl);
        expIncurredExVat = Prisma.Decimal.max(expIncurredExVat, pclAmt.exVatDec);
        expPaidExVat = Prisma.Decimal.max(expPaidExVat, pclAmt.paidExVatDec);
        expPaidGross = Prisma.Decimal.max(expPaidGross, pclAmt.paidGrossDec);
      }
    }

    const targets = resolveAllocationTargets({
      consolidatedBoqItemId: exp.consolidatedBoqItemId,
      awardedBoqItemId: exp.awardedBoqItemId,
    });
    distributeToPhaseLines(targets, {
      uncommittedIncurredExVat: expIncurredExVat,
      paidExVat: expPaidExVat,
    });

    if (expPaidGross.gt(0)) {
      datedCashDisbursements.push({
        paidDate: exp.date,
        cashPaidGrossDec: expPaidGross,
        stream: 'OTHER',
      });
    }
  }

  // 5. Reconcile Executive Payroll Summaries (<= cutoff, PII-free, deduplicating ProjectCostLedger)
  for (const py of subconAndPayrollFacts.payrollSummaries) {
    const periodSt = (py.periodStatus || '').trim().toUpperCase();
    if (!APPROVED_PAYROLL_PERIOD_STATUSES.has(periodSt)) continue;
    const periodEndDt = new Date(py.periodEndDate);
    if (periodEndDt.getTime() > cutoffMs) continue;

    const totalEmployerCostDec = Prisma.Decimal.max(
      zero,
      new Prisma.Decimal(String(py.grossPay ?? 0))
        .plus(new Prisma.Decimal(String(py.employerStatutoryShare ?? 0)))
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    );
    const paySt = (py.paymentStatus || '').trim().toUpperCase();
    const releaseDt = py.dateReleased
      ? new Date(py.dateReleased)
      : py.payrollDate
        ? new Date(py.payrollDate)
        : periodEndDt;
    const isPaid = PAID_PAYROLL_STATUSES.has(paySt) && releaseDt.getTime() <= cutoffMs;
    let pyIncurredDec = totalEmployerCostDec;
    let pyPaidDec = isPaid ? totalEmployerCostDec : zero;

    const pyRefs = [py.payrollBatchNumber, py.transactionReference, py.id]
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim().toUpperCase());
    for (const rk of pyRefs) {
      const mList = pclByRefNo.get(rk) ?? [];
      for (const mPcl of mList) {
        if (consumedCostLedgerIds.has(mPcl.id)) continue;
        consumedCostLedgerIds.add(mPcl.id);
        deduplicatedMirroredExpensesCount += 1;
        const pclAmt = extractPclAmounts(mPcl);
        pyIncurredDec = Prisma.Decimal.max(pyIncurredDec, pclAmt.exVatDec);
        pyPaidDec = Prisma.Decimal.max(pyPaidDec, pclAmt.paidExVatDec);
      }
    }

    distributeToPhaseLines(defaultPhaseWeights, {
      uncommittedIncurredExVat: pyIncurredDec,
      paidExVat: pyPaidDec,
    });

    if (pyPaidDec.gt(0)) {
      datedCashDisbursements.push({
        paidDate: releaseDt,
        cashPaidGrossDec: pyPaidDec,
        stream: 'PAYROLL_SUBCON',
      });
    }
  }

  // 6. Include remaining standalone ProjectCostLedger rows not mirrored by operational PO/Subcon/Expense/Payroll
  for (const pcl of approvedCostLedgers) {
    if (consumedCostLedgerIds.has(pcl.id)) continue;
    consumedCostLedgerIds.add(pcl.id);
    const pclAmt = extractPclAmounts(pcl);
    const targets = resolveAllocationTargets({
      consolidatedBoqItemId: pcl.consolidatedBoqItemId,
      awardedBoqItemId: pcl.awardedBoqItemId,
    });
    distributeToPhaseLines(targets, {
      uncommittedIncurredExVat: pclAmt.exVatDec,
      paidExVat: pclAmt.paidExVatDec,
    });
    if (pclAmt.paidGrossDec.gt(0)) {
      const catNorm = (pcl.costCategory || '').trim().toUpperCase();
      const stream: DatedCashDisbursementEvent['stream'] =
        catNorm.includes('MATERIAL') || catNorm.includes('PO') || catNorm.includes('PROCUREMENT')
          ? 'PROCUREMENT'
          : catNorm.includes('LABOR') ||
              catNorm.includes('PAYROLL') ||
              catNorm.includes('SUBCON')
            ? 'PAYROLL_SUBCON'
            : 'OTHER';
      datedCashDisbursements.push({
        paidDate: pcl.costDate,
        cashPaidGrossDec: pclAmt.paidGrossDec,
        stream,
      });
    }
  }

  let committedTotalExVat = zero;
  let incurredAgainstCommitmentExVat = zero;
  let uncommittedDirectIncurredExVat = zero;
  let paidDisbursedExVat = zero;
  let commitmentOpenExVat = zero;

  for (const acc of byPhaseLineId.values()) {
    committedTotalExVat = committedTotalExVat.plus(acc.committedTotalExVat);
    incurredAgainstCommitmentExVat = incurredAgainstCommitmentExVat.plus(
      acc.incurredAgainstCommitmentExVat
    );
    uncommittedDirectIncurredExVat = uncommittedDirectIncurredExVat.plus(
      acc.uncommittedDirectIncurredExVat
    );
    paidDisbursedExVat = paidDisbursedExVat.plus(acc.paidDisbursedExVat);
    commitmentOpenExVat = commitmentOpenExVat.plus(acc.commitmentOpenExVat);
  }

  const incurredActualCostExVat = incurredAgainstCommitmentExVat.plus(
    uncommittedDirectIncurredExVat
  );
  const unpaidIncurredPayableExVat = Prisma.Decimal.max(
    zero,
    incurredActualCostExVat.minus(paidDisbursedExVat)
  );
  const outstandingTotalObligationExVat = unpaidIncurredPayableExVat.plus(commitmentOpenExVat);

  return {
    byPhaseLineId,
    totals: {
      committedTotalExVat,
      incurredAgainstCommitmentExVat,
      uncommittedDirectIncurredExVat,
      incurredActualCostExVat,
      paidDisbursedExVat,
      unpaidIncurredPayableExVat,
      outstandingTotalObligationExVat,
      commitmentOpenExVat,
      hasAnyCommitmentAuthority,
      deduplicatedMirrorCommitmentsCount,
      deduplicatedMirroredExpensesCount,
    },
    datedCashDisbursements,
    forecastPoOutflows,
    forecastSubconOutflows,
    scheduledCommitmentPoOutflows,
    scheduledCommitmentSubconOutflows,
  };
}

function buildHalfMonthCalendarSkeleton(startDate: Date, endDate: Date): Array<{
  periodIndex: number;
  periodLabel: string;
  quarterLabel: string;
  periodStart: Date;
  periodEnd: Date;
}> {
  const startUtc = new Date(
    Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  );
  const endUtc = new Date(
    Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate())
  );
  const effectiveEnd = endUtc.getTime() >= startUtc.getTime() ? endUtc : startUtc;

  const buckets: Array<{
    periodIndex: number;
    periodLabel: string;
    quarterLabel: string;
    periodStart: Date;
    periodEnd: Date;
  }> = [];

  let cursorYear = startUtc.getUTCFullYear();
  let cursorMonth = startUtc.getUTCMonth();
  let monthCounter = 0;
  let periodIndex = 0;

  while (periodIndex < 240) {
    monthCounter += 1;
    const qNum = Math.floor(cursorMonth / 3) + 1;
    const quarterLabel = `${cursorYear}-Q${qNum}`;
    const lastDayOfMonth = new Date(Date.UTC(cursorYear, cursorMonth + 1, 0)).getUTCDate();

    const h1Start = new Date(Date.UTC(cursorYear, cursorMonth, 1, 0, 0, 0, 0));
    const h1End = new Date(Date.UTC(cursorYear, cursorMonth, 15, 23, 59, 59, 999));
    const h2Start = new Date(Date.UTC(cursorYear, cursorMonth, 16, 0, 0, 0, 0));
    const h2End = new Date(Date.UTC(cursorYear, cursorMonth, lastDayOfMonth, 23, 59, 59, 999));

    if (h1End.getTime() >= startUtc.getTime() && h1Start.getTime() <= effectiveEnd.getTime()) {
      periodIndex += 1;
      buckets.push({
        periodIndex,
        periodLabel: `M${monthCounter}-H1`,
        quarterLabel,
        periodStart: h1Start,
        periodEnd: h1End,
      });
    }
    if (h2End.getTime() >= startUtc.getTime() && h2Start.getTime() <= effectiveEnd.getTime()) {
      periodIndex += 1;
      buckets.push({
        periodIndex,
        periodLabel: `M${monthCounter}-H2`,
        quarterLabel,
        periodStart: h2Start,
        periodEnd: h2End,
      });
    }

    if (h2End.getTime() >= effectiveEnd.getTime()) {
      break;
    }

    cursorMonth += 1;
    if (cursorMonth > 11) {
      cursorMonth = 0;
      cursorYear += 1;
    }
  }

  return buckets;
}

function computeNextHalfMonthEndUtc(dt: Date): Date {
  const y = dt.getUTCFullYear();
  const m = dt.getUTCMonth();
  const d = dt.getUTCDate();
  if (d <= 15) {
    const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    return new Date(Date.UTC(y, m, lastDay, 23, 59, 59, 999));
  }
  const nextMonth = m === 11 ? 0 : m + 1;
  const nextYear = m === 11 ? y + 1 : y;
  return new Date(Date.UTC(nextYear, nextMonth, 15, 23, 59, 59, 999));
}

function buildFollowingHalfMonthBucket(lastBucket: {
  periodIndex: number;
  periodLabel: string;
  periodEnd: Date;
}): {
  periodIndex: number;
  periodLabel: string;
  quarterLabel: string;
  periodStart: Date;
  periodEnd: Date;
} {
  const nextStart = new Date(
    Date.UTC(
      lastBucket.periodEnd.getUTCFullYear(),
      lastBucket.periodEnd.getUTCMonth(),
      lastBucket.periodEnd.getUTCDate()
    ) + 86_400_000
  );
  const ny = nextStart.getUTCFullYear();
  const nm = nextStart.getUTCMonth();
  const nd = nextStart.getUTCDate();
  const qNum = Math.floor(nm / 3) + 1;
  const quarterLabel = `${ny}-Q${qNum}`;
  const isH1 = nd <= 15;
  const endDay = isH1 ? 15 : new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nextEnd = new Date(Date.UTC(ny, nm, endDay, 23, 59, 59, 999));
  const mMatch = /^M(\d+)-H([12])$/.exec(lastBucket.periodLabel);
  const nextLabel = mMatch
    ? mMatch[2] === '1'
      ? `M${Number(mMatch[1])}-H2`
      : `M${Number(mMatch[1]) + 1}-H1`
    : `${ny}-${String(nm + 1).padStart(2, '0')}-${isH1 ? 'H1' : 'H2'}`;

  return {
    periodIndex: lastBucket.periodIndex + 1,
    periodLabel: nextLabel,
    quarterLabel,
    periodStart: nextStart,
    periodEnd: nextEnd,
  };
}

type PeriodLookupResult =
  | { readonly status: 'MATCHED'; readonly index: number }
  | { readonly status: 'BEFORE_HORIZON' | 'AFTER_HORIZON' | 'PERIOD_GAP' };

function matchPeriodIndexForDate(
  buckets: ReadonlyArray<{ periodStart: Date; periodEnd: Date }>,
  dt: Date
): PeriodLookupResult {
  if (buckets.length === 0) {
    return { status: 'BEFORE_HORIZON' };
  }
  const t = dt.getTime();
  const firstStart = Date.UTC(
    buckets[0].periodStart.getUTCFullYear(),
    buckets[0].periodStart.getUTCMonth(),
    buckets[0].periodStart.getUTCDate(),
    0,
    0,
    0,
    0
  );
  const lastBucket = buckets[buckets.length - 1];
  const lastEnd = Date.UTC(
    lastBucket.periodEnd.getUTCFullYear(),
    lastBucket.periodEnd.getUTCMonth(),
    lastBucket.periodEnd.getUTCDate(),
    23,
    59,
    59,
    999
  );

  for (let i = 0; i < buckets.length; i += 1) {
    const bStart = Date.UTC(
      buckets[i].periodStart.getUTCFullYear(),
      buckets[i].periodStart.getUTCMonth(),
      buckets[i].periodStart.getUTCDate(),
      0,
      0,
      0,
      0
    );
    const bEnd = Date.UTC(
      buckets[i].periodEnd.getUTCFullYear(),
      buckets[i].periodEnd.getUTCMonth(),
      buckets[i].periodEnd.getUTCDate(),
      23,
      59,
      59,
      999
    );
    if (t >= bStart && t <= bEnd) {
      return { status: 'MATCHED', index: i };
    }
  }

  if (t < firstStart) return { status: 'BEFORE_HORIZON' };
  if (t > lastEnd) return { status: 'AFTER_HORIZON' };
  return { status: 'PERIOD_GAP' };
}

async function loadReconciledBatchCCashFlowSchedule(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string,
  roleCtx: BatchCActorRoleContext,
  options?: { preservePureBaselineForecastForVariance?: boolean }
) {
  const preservePureBaselineForecast = options?.preservePureBaselineForecastForVariance === true;
  const zero = new Prisma.Decimal(0);
  const asOfCutoff = new Date();
  const cutoffMs = asOfCutoff.getTime();
  const asOfCutoffIsoDate = asOfCutoff.toISOString().slice(0, 10);

  const projectionRole = resolveNarrowestFieldRole(roleCtx.effectiveRole, roleCtx.fieldAccessRole);
  const canReadSensitive = getPermittedVisibilityTiers(projectionRole).has('sensitive');

  const snapshotCtx = await loadVerifiedBatchCSnapshotContext(db, projectId, sourceId);
  const { snapshot } = snapshotCtx;

  const targetContractGrossDec = [...snapshotCtx.revisedGrossAmtByPhaseLineId.values()]
    .reduce((acc, v) => acc.plus(v), zero)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const [
    persistedForSnapshot,
    persistedUnbound,
    approvedBillings,
    allProjectPayments,
    clientReceipts,
    baselineSchedules,
    obligations,
  ] = await Promise.all([
    db.uboqCashFlowPeriod.findMany({
      where: { projectId, snapshotId: snapshot.id, periodType: 'HALF_MONTH' },
      orderBy: [{ periodIndex: 'asc' }, { id: 'asc' }],
      take: 245,
    }),
    db.uboqCashFlowPeriod.findMany({
      where: { projectId, snapshotId: null, periodType: 'HALF_MONTH' },
      orderBy: [{ periodIndex: 'asc' }, { id: 'asc' }],
      take: 245,
    }),
    db.billing.findMany({
      where: {
        projectId,
        status: {
          in: [
            'APPROVED',
            'APPROVED_FOR_PAYMENT',
            'PAID',
            'PARTIALLY_PAID',
            'approved',
            'approved_for_payment',
            'paid',
            'partially_paid',
          ],
        },
        approvedById: { not: null },
      },
      include: {
        deductions: { orderBy: { id: 'asc' }, take: 1 },
      },
      orderBy: [{ billingPeriodTo: 'asc' }, { id: 'asc' }],
    }),
    db.payment.findMany({
      where: { billing: { projectId } },
      include: {
        billing: {
          select: {
            id: true,
            billingNumber: true,
            status: true,
            approvedById: true,
            projectId: true,
          },
        },
      },
      orderBy: [{ paymentDate: 'asc' }, { id: 'asc' }],
    }),
    db.uboqClientReceipt.findMany({
      where: { projectId },
      include: {
        allocations: { orderBy: { id: 'asc' } },
      },
      orderBy: [{ receiptDate: 'asc' }, { id: 'asc' }],
    }),
    db.projectSchedule.findMany({
      where: {
        projectId,
        workflowStatus: { in: ['ACTIVE_BASELINE', 'SUPERSEDED_BASELINE'] },
        activities: { some: {} },
      },
      include: {
        activities: { orderBy: [{ activityCode: 'asc' }, { id: 'asc' }] },
        dependencies: { orderBy: { id: 'asc' } },
      },
      orderBy: [{ baselineRevision: 'desc' }, { id: 'asc' }],
      take: 5,
    }),
    reconcileProjectCommitmentsAndObligations(db, projectId, snapshotCtx, asOfCutoff, roleCtx),
  ]);

  if (preservePureBaselineForecast) {
    const [postCutoffPaidAp, postCutoffSubconPay, postCutoffPaidExp] = await Promise.all([
      db.accountsPayable.findFirst({
        where: {
          po: { mr: { projectId } },
          paidAmount: { gt: 0 },
          paidAt: { gt: asOfCutoff },
          status: { in: [...PAID_AP_STATUSES] },
        },
        select: { id: true, paidAt: true, paidAmount: true },
        orderBy: { paidAt: 'asc' },
      }),
      db.paymentRecord.findFirst({
        where: {
          billing: { projectId },
          amountPaid: { gt: 0 },
          paymentDate: { gt: asOfCutoff },
        },
        select: { id: true, paymentDate: true, amountPaid: true },
        orderBy: { paymentDate: 'asc' },
      }),
      db.expense.findFirst({
        where: {
          projectId,
          amount: { gt: 0 },
          isAccrued: false,
          date: { gt: asOfCutoff },
          status: { in: ['PAID', 'POSTED', 'REIMBURSED', 'COMPLETED'] },
        },
        select: { id: true, date: true, amount: true },
        orderBy: { date: 'asc' },
      }),
    ]);

    if (postCutoffPaidAp || postCutoffSubconPay || postCutoffPaidExp) {
      throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH', 409, {
        projectId,
        asOfCutoffIso: asOfCutoff.toISOString(),
        postCutoffApId: postCutoffPaidAp?.id ?? null,
        postCutoffSubconPaymentId: postCutoffSubconPay?.id ?? null,
        postCutoffExpenseId: postCutoffPaidExp?.id ?? null,
        reason: 'POST_CUTOFF_ACTUAL_DISBURSEMENT_MISMATCH',
      });
    }
  }

  const persistedPeriods =
    persistedForSnapshot.length > 0 ? persistedForSnapshot : persistedUnbound;

  // WP3-BC-IR-03: Enforce unique approved billing numbers so duplicate approved claims are rejected deterministically
  const approvedBillingById = new Map<string, (typeof approvedBillings)[number]>();
  const seenApprovedBillingNumbers = new Set<string>();
  for (const bil of approvedBillings) {
    const normBillNo = (bil.billingNumber || '').trim().toUpperCase();
    if (!normBillNo || seenApprovedBillingNumbers.has(normBillNo)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_BILLING_CLAIM', 409, {
        projectId,
        billingId: bil.id,
        billingNumber: bil.billingNumber,
        reason: 'DUPLICATE_OR_EMPTY_APPROVED_BILLING_NUMBER',
      });
    }
    seenApprovedBillingNumbers.add(normBillNo);
    approvedBillingById.set(bil.id, bil);
  }

  // WP3-BC-IR-01 & WP3-BC-IR-R2-02: Project-wide canonical client receipt reconciliation & verified finance authority check
  const clientReceiptVerifierRoles = new Set([
    'SUPER_ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'FINANCE_DIRECTOR',
    'COMMERCIAL_DIRECTOR',
    'COST_CONTROL_MANAGER',
    'ACCOUNTANT',
    'BILLING_ENGINEER',
  ]);
  const clientReceiptGlobalVerifierRoles = new Set([
    'SUPER_ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
  ]);
  const viewerOnlyTokens = new Set([
    'VIEWER',
    'VIEW_ONLY',
    'READ_ONLY',
    'OBSERVER',
    'GUEST',
    'EXTERNAL_VIEWER',
  ]);

  const distinctVerifierIds = [
    ...new Set(
      clientReceipts
        .map((r) => r.verifiedById)
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    ),
  ];
  const [verifierUsers, verifierAssignments] =
    distinctVerifierIds.length > 0
      ? await Promise.all([
          db.user.findMany({
            where: { id: { in: distinctVerifierIds } },
            select: { id: true, role: true, status: true, lockedUntil: true },
          }),
          db.projectUserAssignment.findMany({
            where: {
              projectId,
              userId: { in: distinctVerifierIds },
              assignmentStatus: { in: ['ACTIVE', 'active'] },
            },
            select: { id: true, userId: true, projectRole: true, accessLevel: true },
            orderBy: { id: 'asc' },
          }),
        ])
      : [[], []];
  const verifierUserById = new Map(verifierUsers.map((u) => [u.id, u]));
  const verifierAssignByUserId = new Map<string, (typeof verifierAssignments)[number]>();
  for (const asn of verifierAssignments) {
    if (!verifierAssignByUserId.has(asn.userId)) {
      verifierAssignByUserId.set(asn.userId, asn);
    }
  }

  const isAuthorizedClientReceiptVerifier = (verifierId: string): boolean => {
    const u = verifierUserById.get(verifierId);
    if (!u || (u.status || '').trim().toUpperCase() !== 'ACTIVE') return false;
    if (u.lockedUntil && u.lockedUntil.getTime() > Date.now()) return false;
    const uRole = (u.role || '').trim().toUpperCase();
    if (!clientReceiptVerifierRoles.has(uRole)) return false;
    if (clientReceiptGlobalVerifierRoles.has(uRole)) return true;
    const asn = verifierAssignByUserId.get(verifierId);
    if (!asn) return false;
    const acc = (asn.accessLevel || '').trim().toUpperCase();
    const pRole = (asn.projectRole || '').trim().toUpperCase();
    if (viewerOnlyTokens.has(acc) || viewerOnlyTokens.has(pRole)) return false;
    if (
      pRole !== '' &&
      pRole !== 'MEMBER' &&
      pRole !== 'STANDARD' &&
      pRole !== 'FULL' &&
      !clientReceiptVerifierRoles.has(pRole)
    ) {
      return false;
    }
    return true;
  };

  const validClientPaidStatuses = new Set([
    'PAID',
    'COMPLETED',
    'POSTED',
    'CLEARED',
    'VERIFIED',
    'PARTIAL',
  ]);

  const receiptByRefKey = new Map<string, (typeof clientReceipts)[number]>();
  const allocByPaymentId = new Map<
    string,
    {
      receipt: (typeof clientReceipts)[number];
      alloc: (typeof clientReceipts)[number]['allocations'][number];
    }
  >();
  for (const rcpt of clientReceipts) {
    const refKey = (rcpt.receiptReference || '').trim().toUpperCase();
    if (!refKey || receiptByRefKey.has(refKey)) {
      throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
        projectId,
        receiptId: rcpt.id,
        receiptReference: rcpt.receiptReference,
        reason: 'DUPLICATE_OR_EMPTY_CLIENT_RECEIPT_REFERENCE',
      });
    }
    receiptByRefKey.set(refKey, rcpt);
    for (const alloc of rcpt.allocations) {
      if (allocByPaymentId.has(alloc.paymentId)) {
        throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
          projectId,
          receiptId: rcpt.id,
          paymentId: alloc.paymentId,
          reason: 'PAYMENT_ALLOCATED_TO_MULTIPLE_CLIENT_RECEIPTS',
        });
      }
      allocByPaymentId.set(alloc.paymentId, { receipt: rcpt, alloc });
    }
  }

  const unapprovedPaymentRefs = new Set<string>();
  const paymentsByRefKey = new Map<
    string,
    Array<{
      pay: (typeof allProjectPayments)[number];
      amtDec: Prisma.Decimal;
      hasExplicitRef: boolean;
    }>
  >();

  for (const pay of allProjectPayments) {
    const pSt = (pay.paymentStatus || '').trim().toUpperCase();
    if (!validClientPaidStatuses.has(pSt)) continue;

    const amtDec = Prisma.Decimal.max(
      zero,
      new Prisma.Decimal(String(pay.amountPaid ?? 0)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    );
    if (amtDec.lte(0)) continue;

    const rawPayRef = (
      pay.paymentReferenceNumber ??
      pay.orNumber ??
      pay.bankOrCheckNumber ??
      ''
    ).trim();
    const normRef = rawPayRef.toUpperCase();

    if (!approvedBillingById.has(pay.billingId)) {
      if (allocByPaymentId.has(pay.id)) {
        throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
          projectId,
          paymentId: pay.id,
          billingId: pay.billingId,
          reason: 'CLIENT_RECEIPT_ALLOCATED_TO_UNAPPROVED_BILLING',
        });
      }
      if (normRef) {
        unapprovedPaymentRefs.add(normRef);
      }
      continue;
    }

    if (!normRef && allocByPaymentId.has(pay.id)) {
      throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
        projectId,
        paymentId: pay.id,
        billingId: pay.billingId,
        reason: 'ALLOCATED_PAYMENT_MISSING_RECEIPT_REFERENCE',
      });
    }

    const groupKey = normRef || `__UNREF_PAYMENT__:${pay.id}`;
    const list = paymentsByRefKey.get(groupKey) ?? [];
    list.push({ pay, amtDec, hasExplicitRef: Boolean(normRef) });
    paymentsByRefKey.set(groupKey, list);
  }

  const datedClientReceipts: Array<{ paymentDate: Date; amountDec: Prisma.Decimal }> = [];
  const collectedLeCutoffByBillingId = new Map<string, Prisma.Decimal>();
  const consumedReceiptIds = new Set<string>();
  let verifiedClientReceiptsCount = 0;
  let allocatedMultiBillingReceiptsCount = 0;

  for (const [refKey, group] of paymentsByRefKey.entries()) {
    const hasExplicitRef = group[0].hasExplicitRef;
    if (hasExplicitRef && unapprovedPaymentRefs.has(refKey)) {
      throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
        projectId,
        receiptReference: refKey,
        reason: 'RECEIPT_REFERENCE_SHARED_WITH_UNAPPROVED_BILLING',
      });
    }

    const linkedReceipt = hasExplicitRef ? (receiptByRefKey.get(refKey) ?? null) : null;

    if (group.length > 1 && !linkedReceipt) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_COLLECTION_REFERENCE', 409, {
        projectId,
        billingIds: group.map((g) => g.pay.billingId),
        duplicateReferenceNumber: refKey,
        reason: 'SHARED_CLIENT_COLLECTION_REFERENCE_WITHOUT_VERIFIED_ALLOCATION',
      });
    }

    if (linkedReceipt) {
      consumedReceiptIds.add(linkedReceipt.id);

      const rcptStatus = (linkedReceipt.status || '').trim().toUpperCase();
      if (
        rcptStatus !== 'VERIFIED' ||
        !linkedReceipt.verifiedById ||
        !linkedReceipt.verifiedAt ||
        linkedReceipt.verifiedAt.getTime() > cutoffMs
      ) {
        throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
          projectId,
          receiptId: linkedReceipt.id,
          receiptReference: linkedReceipt.receiptReference,
          status: linkedReceipt.status,
          reason: 'CLIENT_RECEIPT_NOT_VERIFIED_AS_OF_CUTOFF',
        });
      }

      if (!isAuthorizedClientReceiptVerifier(linkedReceipt.verifiedById)) {
        throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
          projectId,
          receiptId: linkedReceipt.id,
          receiptReference: linkedReceipt.receiptReference,
          verifiedById: linkedReceipt.verifiedById,
          reason: 'CLIENT_RECEIPT_VERIFIER_UNAUTHORIZED',
        });
      }

      if (linkedReceipt.allocations.length !== group.length) {
        throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
          projectId,
          receiptId: linkedReceipt.id,
          receiptReference: linkedReceipt.receiptReference,
          allocationCount: linkedReceipt.allocations.length,
          paymentCount: group.length,
          reason: 'ALLOCATION_COUNT_MISMATCH_AGAINST_CLEARED_PAYMENTS',
        });
      }

      const groupByPaymentId = new Map(group.map((g) => [g.pay.id, g]));
      const seenAllocBillingIds = new Set<string>();
      const rcptDayUtc = Date.UTC(
        linkedReceipt.receiptDate.getUTCFullYear(),
        linkedReceipt.receiptDate.getUTCMonth(),
        linkedReceipt.receiptDate.getUTCDate()
      );
      let allocSumDec = zero;

      for (const alloc of linkedReceipt.allocations) {
        const matched = groupByPaymentId.get(alloc.paymentId);
        if (
          !matched ||
          matched.pay.billingId !== alloc.billingId ||
          !approvedBillingById.has(alloc.billingId) ||
          seenAllocBillingIds.has(alloc.billingId)
        ) {
          throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
            projectId,
            receiptId: linkedReceipt.id,
            paymentId: alloc.paymentId,
            billingId: alloc.billingId,
            reason: 'INVALID_OR_DUPLICATE_BILLING_PAYMENT_ALLOCATION_LINK',
          });
        }
        seenAllocBillingIds.add(alloc.billingId);

        const allocAmtDec = new Prisma.Decimal(String(alloc.allocatedAmount)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );
        if (!allocAmtDec.eq(matched.amtDec)) {
          throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
            projectId,
            receiptId: linkedReceipt.id,
            paymentId: alloc.paymentId,
            allocatedAmount: allocAmtDec.toFixed(2),
            paymentAmountPaid: matched.amtDec.toFixed(2),
            reason: 'ALLOCATED_AMOUNT_MISMATCH_AGAINST_PAYMENT_ROW',
          });
        }

        const payDayUtc = Date.UTC(
          matched.pay.paymentDate.getUTCFullYear(),
          matched.pay.paymentDate.getUTCMonth(),
          matched.pay.paymentDate.getUTCDate()
        );
        if (payDayUtc !== rcptDayUtc) {
          throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
            projectId,
            receiptId: linkedReceipt.id,
            paymentId: alloc.paymentId,
            receiptDateIso: linkedReceipt.receiptDate.toISOString(),
            paymentDateIso: matched.pay.paymentDate.toISOString(),
            reason: 'PAYMENT_DATE_MISMATCH_AGAINST_CANONICAL_RECEIPT',
          });
        }

        allocSumDec = allocSumDec.plus(allocAmtDec);
      }

      const totalReceiptDec = new Prisma.Decimal(
        String(linkedReceipt.totalReceiptAmount)
      ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
      if (!allocSumDec.eq(totalReceiptDec)) {
        throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
          projectId,
          receiptId: linkedReceipt.id,
          receiptReference: linkedReceipt.receiptReference,
          allocatedSum: allocSumDec.toFixed(2),
          totalReceiptAmount: totalReceiptDec.toFixed(2),
          reason: 'ALLOCATION_SUM_DOES_NOT_EQUAL_TOTAL_RECEIPT_AMOUNT',
        });
      }

      if (linkedReceipt.receiptDate.getTime() <= cutoffMs) {
        datedClientReceipts.push({
          paymentDate: linkedReceipt.receiptDate,
          amountDec: totalReceiptDec,
        });
        verifiedClientReceiptsCount += 1;
        if (group.length > 1) {
          allocatedMultiBillingReceiptsCount += 1;
        }
        for (const alloc of linkedReceipt.allocations) {
          const allocAmtDec = new Prisma.Decimal(String(alloc.allocatedAmount)).toDecimalPlaces(
            2,
            Prisma.Decimal.ROUND_HALF_UP
          );
          collectedLeCutoffByBillingId.set(
            alloc.billingId,
            (collectedLeCutoffByBillingId.get(alloc.billingId) ?? zero).plus(allocAmtDec)
          );
        }
      } else if (preservePureBaselineForecast) {
        throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH', 409, {
          projectId,
          receiptId: linkedReceipt.id,
          receiptReference: linkedReceipt.receiptReference,
          receiptDateIso: linkedReceipt.receiptDate.toISOString(),
          asOfCutoffIso: asOfCutoff.toISOString(),
          reason: 'POST_CUTOFF_CLIENT_RECEIPT_MISMATCH',
        });
      }
      continue;
    }

    // Single cleared payment without UboqClientReceipt: ensure it is not cross-linked to a mismatched receipt
    const single = group[0];
    if (allocByPaymentId.has(single.pay.id)) {
      throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
        projectId,
        paymentId: single.pay.id,
        paymentReference: refKey,
        reason: 'PAYMENT_ALLOCATED_TO_MISMATCHED_RECEIPT_REFERENCE',
      });
    }

    if (single.pay.paymentDate.getTime() <= cutoffMs) {
      datedClientReceipts.push({
        paymentDate: single.pay.paymentDate,
        amountDec: single.amtDec,
      });
      verifiedClientReceiptsCount += 1;
      collectedLeCutoffByBillingId.set(
        single.pay.billingId,
        (collectedLeCutoffByBillingId.get(single.pay.billingId) ?? zero).plus(single.amtDec)
      );
    } else if (preservePureBaselineForecast) {
      throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH', 409, {
        projectId,
        paymentId: single.pay.id,
        paymentDateIso: single.pay.paymentDate.toISOString(),
        asOfCutoffIso: asOfCutoff.toISOString(),
        reason: 'POST_CUTOFF_CLIENT_PAYMENT_MISMATCH',
      });
    }
  }

  for (const rcpt of clientReceipts) {
    if (!consumedReceiptIds.has(rcpt.id)) {
      if (rcpt.receiptDate.getTime() <= cutoffMs) {
        throw new CanonicalAdapterError('TEMPLATE_COLLECTION_ALLOCATION_UNVERIFIED', 409, {
          projectId,
          receiptId: rcpt.id,
          receiptReference: rcpt.receiptReference,
          reason: 'ORPHAN_OR_UNRECONCILED_CLIENT_RECEIPT_RECORD',
        });
      }
      if (preservePureBaselineForecast) {
        throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH', 409, {
          projectId,
          receiptId: rcpt.id,
          receiptReference: rcpt.receiptReference,
          receiptDateIso: rcpt.receiptDate.toISOString(),
          asOfCutoffIso: asOfCutoff.toISOString(),
          reason: 'POST_CUTOFF_CLIENT_RECEIPT_MISMATCH',
        });
      }
    }
  }

  const datedApprovedClaims: Array<{
    billingId: string;
    billingNumber: string;
    billingDate: Date;
    grossClaimDec: Prisma.Decimal;
    netDueDec: Prisma.Decimal;
    collectedLeCutoffDec: Prisma.Decimal;
  }> = [];

  for (const bil of approvedBillings) {
    if (bil.billingPeriodTo.getTime() > cutoffMs) continue;
    const claimAmt = Prisma.Decimal.max(
      zero,
      new Prisma.Decimal(String(bil.currentBillingAmount ?? 0)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    );
    if (claimAmt.lte(0)) continue;

    const explicitDed = bil.deductions[0];
    const explicitNet = explicitDed
      ? new Prisma.Decimal(String(explicitDed.netAmountDue ?? 0)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        )
      : zero;
    const computedTax = computeContractBillingTaxBreakdown(
      Number(claimAmt),
      snapshotCtx.taxProfileConfig
    );
    const netDueDec = explicitNet.gt(0)
      ? explicitNet
      : new Prisma.Decimal(String(computedTax.netCertifiedDue)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );

    datedApprovedClaims.push({
      billingId: bil.id,
      billingNumber: bil.billingNumber,
      billingDate: bil.billingPeriodTo,
      grossClaimDec: claimAmt,
      netDueDec,
      collectedLeCutoffDec: collectedLeCutoffByBillingId.get(bil.id) ?? zero,
    });
  }

  const requireMatchedBucketIndex = (
    buckets: ReadonlyArray<{ periodStart: Date; periodEnd: Date }>,
    dt: Date,
    eventKind: string
  ): number => {
    const lookup = matchPeriodIndexForDate(buckets, dt);
    if (lookup.status === 'MATCHED') {
      return lookup.index;
    }
    if (lookup.status === 'PERIOD_GAP') {
      throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID', 409, {
        projectId,
        eventKind,
        transactionDateIso: dt.toISOString(),
        reason: 'TRANSACTION_FALLS_IN_MISSING_REPORTING_PERIOD_GAP',
      });
    }
    throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_OUT_OF_HORIZON_TRANSACTION', 409, {
      projectId,
      eventKind,
      direction: lookup.status,
      transactionDateIso: dt.toISOString(),
      horizonStartIso: buckets[0]?.periodStart.toISOString() ?? null,
      horizonEndIso: buckets[buckets.length - 1]?.periodEnd.toISOString() ?? null,
      reason: 'OUT_OF_HORIZON_CASHFLOW_EVENT_CANNOT_BE_CLAMPED_TO_EDGE_PERIOD',
    });
  };

  let scheduleSourceBasis: 'PERSISTED_CASHFLOW_PERIODS' | 'BASELINE_SCHEDULE_DERIVED';
  let inputBuckets: CashFlowInputBucket[];
  let operationalReceiptPeriodsCount = 0;
  let persistedHistoricalReceiptPeriodsPreservedCount = 0;
  let deduplicatedIdenticalReceiptMirrorPeriodsCount = 0;
  let operationalPaidPeriodsCount = 0;
  let persistedHistoricalPaidPeriodsPreservedCount = 0;
  let deduplicatedIdenticalPaidMirrorPeriodsCount = 0;
  let periodsDominatedByApprovedClaimsCount = 0;
  let alreadyCollectedOffsetTotalDec = zero;

  if (persistedPeriods.length > 0) {
    if (persistedPeriods.length > 240) {
      throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
    }
    scheduleSourceBasis = 'PERSISTED_CASHFLOW_PERIODS';

    // WP3-BC-IR-02: Enforce gap-free 1-based half-month sequence and contiguous calendar day coverage
    if (persistedPeriods[0].periodIndex !== 1) {
      throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID', 409, {
        projectId,
        periodId: persistedPeriods[0].id,
        periodIndex: persistedPeriods[0].periodIndex,
        reason: 'CASHFLOW_PERIOD_INDEX_MUST_START_AT_1',
      });
    }

    for (let i = 0; i < persistedPeriods.length; i += 1) {
      const curr = persistedPeriods[i];
      const currStartDayUtc = Date.UTC(
        curr.periodStart.getUTCFullYear(),
        curr.periodStart.getUTCMonth(),
        curr.periodStart.getUTCDate()
      );
      const currEndDayUtc = Date.UTC(
        curr.periodEnd.getUTCFullYear(),
        curr.periodEnd.getUTCMonth(),
        curr.periodEnd.getUTCDate()
      );
      if (
        curr.periodIndex < 1 ||
        !curr.periodLabel.trim() ||
        !curr.quarterLabel.trim() ||
        curr.periodStart.getTime() > curr.periodEnd.getTime() ||
        currStartDayUtc > currEndDayUtc
      ) {
        throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID', 409, {
          projectId,
          periodId: curr.id,
          periodIndex: curr.periodIndex,
          periodStartIso: curr.periodStart.toISOString(),
          periodEndIso: curr.periodEnd.toISOString(),
          reason: 'INVALID_PERIOD_BOUNDS_OR_LABELS',
        });
      }
      if (i > 0) {
        const prev = persistedPeriods[i - 1];
        const prevEndDayUtc = Date.UTC(
          prev.periodEnd.getUTCFullYear(),
          prev.periodEnd.getUTCMonth(),
          prev.periodEnd.getUTCDate()
        );
        if (
          curr.periodIndex !== prev.periodIndex + 1 ||
          currStartDayUtc !== prevEndDayUtc + 86_400_000
        ) {
          throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_PERIOD_CONTINUITY_INVALID', 409, {
            projectId,
            previousPeriodIndex: prev.periodIndex,
            previousPeriodEndIso: prev.periodEnd.toISOString(),
            currentPeriodIndex: curr.periodIndex,
            currentPeriodStartIso: curr.periodStart.toISOString(),
            reason:
              currStartDayUtc <= prevEndDayUtc
                ? 'OVERLAPPING_OR_OUT_OF_ORDER_CASHFLOW_PERIODS'
                : 'MISSING_HALF_MONTH_GAP_IN_CASHFLOW_PERIODS',
          });
        }
      }
    }

    const opReceiptsByIdx = persistedPeriods.map(() => zero);
    for (const rec of datedClientReceipts) {
      const idx = requireMatchedBucketIndex(persistedPeriods, rec.paymentDate, 'CLIENT_RECEIPT');
      opReceiptsByIdx[idx] = opReceiptsByIdx[idx].plus(rec.amountDec);
    }

    const opPaidByIdx = persistedPeriods.map(() => zero);
    for (const disb of obligations.datedCashDisbursements) {
      const idx = requireMatchedBucketIndex(persistedPeriods, disb.paidDate, 'CASH_DISBURSEMENT');
      opPaidByIdx[idx] = opPaidByIdx[idx].plus(disb.cashPaidGrossDec);
    }

    inputBuckets = persistedPeriods.map((p, idx) => {
      const periodStartUtcMs = Date.UTC(
        p.periodStart.getUTCFullYear(),
        p.periodStart.getUTCMonth(),
        p.periodStart.getUTCDate(),
        0,
        0,
        0,
        0
      );
      const isFuturePeriod = periodStartUtcMs > cutoffMs;

      // WP3-BC-IR-02: Reconcile operational vs persisted actuals period-by-period so verified
      // historical persisted actuals in earlier periods are never erased when another period has
      // an operational payment, while conflicting non-zero period actuals fail closed (409).
      let actualReceiptsDec = zero;
      let actualPaidDec = zero;

      if (!isFuturePeriod) {
        const opRec = opReceiptsByIdx[idx].toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const persRec = new Prisma.Decimal(String(p.actualCashReceiptsAmt ?? 0)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );
        if (opRec.gt(0) && persRec.eq(0)) {
          actualReceiptsDec = opRec;
          operationalReceiptPeriodsCount += 1;
        } else if (opRec.eq(0) && persRec.gt(0)) {
          actualReceiptsDec = persRec;
          persistedHistoricalReceiptPeriodsPreservedCount += 1;
        } else if (opRec.gt(0) && persRec.gt(0)) {
          if (opRec.minus(persRec).abs().lte('0.01')) {
            actualReceiptsDec = opRec;
            deduplicatedIdenticalReceiptMirrorPeriodsCount += 1;
          } else {
            throw new CanonicalAdapterError(
              'TEMPLATE_CASHFLOW_ACTUALS_RECONCILIATION_CONFLICT',
              409,
              {
                projectId,
                periodId: p.id,
                periodIndex: p.periodIndex,
                periodLabel: p.periodLabel,
                operationalReceiptsAmt: opRec.toFixed(2),
                persistedReceiptsAmt: persRec.toFixed(2),
                reason: 'CONFLICTING_OPERATIONAL_AND_PERSISTED_RECEIPT_ACTUALS_IN_PERIOD',
              }
            );
          }
        }

        const opPaid = opPaidByIdx[idx].toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const persPaid = new Prisma.Decimal(String(p.actualCashPaidAmt ?? 0)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );
        if (opPaid.gt(0) && persPaid.eq(0)) {
          actualPaidDec = opPaid;
          operationalPaidPeriodsCount += 1;
        } else if (opPaid.eq(0) && persPaid.gt(0)) {
          actualPaidDec = persPaid;
          persistedHistoricalPaidPeriodsPreservedCount += 1;
        } else if (opPaid.gt(0) && persPaid.gt(0)) {
          if (opPaid.minus(persPaid).abs().lte('0.01')) {
            actualPaidDec = opPaid;
            deduplicatedIdenticalPaidMirrorPeriodsCount += 1;
          } else {
            throw new CanonicalAdapterError(
              'TEMPLATE_CASHFLOW_ACTUALS_RECONCILIATION_CONFLICT',
              409,
              {
                projectId,
                periodId: p.id,
                periodIndex: p.periodIndex,
                periodLabel: p.periodLabel,
                operationalPaidAmt: opPaid.toFixed(2),
                persistedPaidAmt: persPaid.toFixed(2),
                reason: 'CONFLICTING_OPERATIONAL_AND_PERSISTED_PAID_ACTUALS_IN_PERIOD',
              }
            );
          }
        }
      } else if (preservePureBaselineForecast) {
        const persFutureRec = new Prisma.Decimal(String(p.actualCashReceiptsAmt ?? 0)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );
        const persFuturePaid = new Prisma.Decimal(String(p.actualCashPaidAmt ?? 0)).toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );
        if (!persFutureRec.isZero() || !persFuturePaid.isZero()) {
          throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_CUTOFF_PERIOD_MISMATCH', 409, {
            projectId,
            periodId: p.id,
            periodIndex: p.periodIndex,
            periodLabel: p.periodLabel,
            periodStartIso: p.periodStart.toISOString(),
            asOfCutoffIso: asOfCutoff.toISOString(),
            persistedActualReceiptsAmt: persFutureRec.toFixed(2),
            persistedActualPaidAmt: persFuturePaid.toFixed(2),
            reason: 'FUTURE_PERIOD_CONTAINS_NON_ZERO_ACTUAL_CASH_MOVEMENTS',
          });
        }
      }

      return {
        periodIndex: p.periodIndex,
        periodLabel: p.periodLabel,
        quarterLabel: p.quarterLabel,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        plannedValueWeightAmt: Number(p.plannedValueWeightAmt),
        expectedBillingsAmt: Number(p.expectedBillingsAmt),
        forecastReceiptsAmt: Number(p.forecastReceiptsAmt),
        procurementCashOutAmt: Number(p.procurementCashOutAmt),
        payrollSubconCashOutAmt: Number(p.payrollSubconCashOutAmt),
        otherCashOutAmt: Number(p.otherCashOutAmt),
        actualCashReceiptsAmt: Number(actualReceiptsDec),
        actualCashPaidAmt: Number(actualPaidDec),
      };
    });
  } else {
    const activeSchedule =
      baselineSchedules.find((s) => s.workflowStatus === 'ACTIVE_BASELINE') ??
      baselineSchedules[0] ??
      null;
    if (!activeSchedule) {
      throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_SOURCE_INCOMPLETE', 409, {
        projectId,
        snapshotId: snapshot.id,
        reason: 'NO_PERSISTED_CASHFLOW_PERIODS_OR_APPROVED_BASELINE_SCHEDULE',
      });
    }

    scheduleSourceBasis = 'BASELINE_SCHEDULE_DERIVED';
    const cpmActivities: CPMActivity[] = activeSchedule.activities.map((act) => ({
      id: act.id,
      name: act.name,
      duration: Math.max(0, act.plannedDuration),
      plannedStart: act.baselineStartDate ?? act.plannedStartDate,
      plannedFinish: act.baselineFinishDate ?? act.plannedFinishDate,
    }));
    const cpmDeps: CPMDependency[] = activeSchedule.dependencies.map((d) => ({
      id: d.id,
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: (['FS', 'SS', 'FF', 'SF'].includes(d.type.toUpperCase())
        ? d.type.toUpperCase()
        : 'FS') as CPMDependency['type'],
      lagDays: d.lagDays,
    }));
    const rawCpm = calculateCPM(cpmActivities, cpmDeps);
    if (rawCpm.hasCircularDependency) {
      throw new CanonicalAdapterError('TEMPLATE_CPM_CIRCULAR_DEPENDENCY', 409, {
        scheduleId: activeSchedule.id,
        errors: rawCpm.errors,
      });
    }
    const baseStart =
      activeSchedule.projectStartDate ??
      activeSchedule.baselineStartDate ??
      activeSchedule.currentStartDate ??
      snapshot.approvedAt!;
    const resolvedCpm = resolveWorkingDayDates(rawCpm, baseStart, [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
    ]);

    let minStart = baseStart;
    let maxEnd = activeSchedule.baselineFinishDate ?? activeSchedule.currentFinishDate ?? baseStart;
    for (const act of activeSchedule.activities) {
      const cpmNode = resolvedCpm.results.get(act.id);
      const aStart = cpmNode?.earlyStartDate ?? act.baselineStartDate ?? act.plannedStartDate;
      const aEnd = cpmNode?.earlyFinishDate ?? act.baselineFinishDate ?? act.plannedFinishDate;
      if (aStart && aStart.getTime() < minStart.getTime()) minStart = aStart;
      if (aEnd && aEnd.getTime() > maxEnd.getTime()) maxEnd = aEnd;
    }

    // Extend schedule horizon by 1 half-month certification/collection cycle so lagged final-period
    // forecast collections never clamp back into the final construction half-month.
    const postLagHorizonEnd = computeNextHalfMonthEndUtc(maxEnd);
    const skeleton = buildHalfMonthCalendarSkeleton(minStart, postLagHorizonEnd);
    if (skeleton.length === 0) {
      throw new CanonicalAdapterError('TEMPLATE_CASHFLOW_SOURCE_INCOMPLETE', 409, {
        projectId,
        scheduleId: activeSchedule.id,
        reason: 'EMPTY_SCHEDULE_HORIZON',
      });
    }

    const actRawWeights = activeSchedule.activities.map((act) =>
      act.allocatedAmount.gt(0)
        ? act.allocatedAmount
        : new Prisma.Decimal(Math.max(1, act.plannedDuration))
    );
    const actAllocatedContract = allocateDecimalProRata(targetContractGrossDec, actRawWeights, 2);

    const pvByBucket = skeleton.map(() => zero);
    activeSchedule.activities.forEach((act, idx) => {
      const cpmNode = resolvedCpm.results.get(act.id);
      const aStart =
        cpmNode?.earlyStartDate ?? act.baselineStartDate ?? act.plannedStartDate ?? minStart;
      const aEnd =
        cpmNode?.earlyFinishDate ?? act.baselineFinishDate ?? act.plannedFinishDate ?? aStart;
      const overlappingIndices: number[] = [];
      const overlapWeights: Prisma.Decimal[] = [];

      skeleton.forEach((b, bIdx) => {
        const ovStart = Math.max(aStart.getTime(), b.periodStart.getTime());
        const ovEnd = Math.min(aEnd.getTime(), b.periodEnd.getTime());
        if (ovEnd >= ovStart) {
          overlappingIndices.push(bIdx);
          overlapWeights.push(new Prisma.Decimal(Math.max(1, ovEnd - ovStart + 1)));
        }
      });

      if (overlappingIndices.length === 0) {
        const fallbackIdx = requireMatchedBucketIndex(skeleton, aEnd, 'SCHEDULE_ACTIVITY');
        pvByBucket[fallbackIdx] = pvByBucket[fallbackIdx].plus(actAllocatedContract[idx]);
      } else {
        const shares = allocateDecimalProRata(actAllocatedContract[idx], overlapWeights, 2);
        overlappingIndices.forEach((bIdx, sIdx) => {
          pvByBucket[bIdx] = pvByBucket[bIdx].plus(shares[sIdx]);
        });
      }
    });

    // WP3-BC-IR-03: Aggregate unique approved claims within each period FIRST before comparing against PV
    const approvedClaimsGrossByBucket = skeleton.map(() => zero);
    const approvedClaimsNetDueByBucket = skeleton.map(() => zero);
    const collectedAgainstClaimsByBucket = skeleton.map(() => zero);

    for (const clm of datedApprovedClaims) {
      const bIdx = requireMatchedBucketIndex(skeleton, clm.billingDate, 'APPROVED_BILLING_CLAIM');
      approvedClaimsGrossByBucket[bIdx] = approvedClaimsGrossByBucket[bIdx].plus(clm.grossClaimDec);
      approvedClaimsNetDueByBucket[bIdx] = approvedClaimsNetDueByBucket[bIdx].plus(clm.netDueDec);
      collectedAgainstClaimsByBucket[bIdx] = collectedAgainstClaimsByBucket[bIdx].plus(
        clm.collectedLeCutoffDec
      );
    }

    const expBillByBucket = skeleton.map((_, bIdx) => {
      const pvDec = pvByBucket[bIdx];
      const claimsSumDec = approvedClaimsGrossByBucket[bIdx];
      if (claimsSumDec.gt(pvDec)) {
        periodsDominatedByApprovedClaimsCount += 1;
        return claimsSumDec;
      }
      return pvDec;
    });

    const procOutByBucket = skeleton.map(() => zero);
    const poForecastSource = preservePureBaselineForecast
      ? obligations.scheduledCommitmentPoOutflows
      : obligations.forecastPoOutflows;
    for (const poOut of poForecastSource) {
      const bIdx = requireMatchedBucketIndex(skeleton, poOut.dueDate, 'FORECAST_PO_OUTFLOW');
      procOutByBucket[bIdx] = procOutByBucket[bIdx].plus(poOut.grossAmtDec);
    }
    const paySubOutByBucket = skeleton.map(() => zero);
    const subconForecastSource = preservePureBaselineForecast
      ? obligations.scheduledCommitmentSubconOutflows
      : obligations.forecastSubconOutflows;
    for (const scOut of subconForecastSource) {
      const bIdx = requireMatchedBucketIndex(skeleton, scOut.dueDate, 'FORECAST_SUBCON_OUTFLOW');
      paySubOutByBucket[bIdx] = paySubOutByBucket[bIdx].plus(scOut.grossAmtDec);
    }

    const actReceiptsByBucket = skeleton.map(() => zero);
    for (const rec of datedClientReceipts) {
      const bIdx = requireMatchedBucketIndex(skeleton, rec.paymentDate, 'CLIENT_RECEIPT');
      actReceiptsByBucket[bIdx] = actReceiptsByBucket[bIdx].plus(rec.amountDec);
    }
    operationalReceiptPeriodsCount = actReceiptsByBucket.filter((v) => v.gt(0)).length;

    const actPaidByBucket = skeleton.map(() => zero);
    for (const disb of obligations.datedCashDisbursements) {
      const bIdx = requireMatchedBucketIndex(skeleton, disb.paidDate, 'CASH_DISBURSEMENT');
      actPaidByBucket[bIdx] = actPaidByBucket[bIdx].plus(disb.cashPaidGrossDec);
      if (!preservePureBaselineForecast) {
        if (disb.stream === 'PROCUREMENT') {
          procOutByBucket[bIdx] = procOutByBucket[bIdx].plus(disb.cashPaidGrossDec);
        } else if (disb.stream === 'PAYROLL_SUBCON') {
          paySubOutByBucket[bIdx] = paySubOutByBucket[bIdx].plus(disb.cashPaidGrossDec);
        }
      }
    }
    operationalPaidPeriodsCount = actPaidByBucket.filter((v) => v.gt(0)).length;

    // For T8/T9 cash-flow forecast, realized collections appear in their collection bucket and
    // remaining uncollected net due lags +1 half-month. For T12 treasury variance reconciliation,
    // preserve pure scheduled/billed forecast receipts strictly distinct from actual collections.
    const fcstReceiptsByBucket = skeleton.map((_, bIdx) =>
      preservePureBaselineForecast ? zero : actReceiptsByBucket[bIdx]
    );
    const initialBucketCount = skeleton.length;

    for (let bIdx = 0; bIdx < initialBucketCount; bIdx += 1) {
      const billDec = expBillByBucket[bIdx];
      if (billDec.lte(0)) continue;

      const claimsGrossDec = approvedClaimsGrossByBucket[bIdx];
      const claimsNetDec = approvedClaimsNetDueByBucket[bIdx];
      let periodNetExpectedDec: Prisma.Decimal;

      if (claimsGrossDec.gte(billDec) && claimsGrossDec.gt(0)) {
        periodNetExpectedDec = claimsNetDec;
      } else {
        const unbilledPvDec = Prisma.Decimal.max(zero, billDec.minus(claimsGrossDec));
        const unbilledTaxBreak = computeContractBillingTaxBreakdown(
          Number(unbilledPvDec),
          snapshotCtx.taxProfileConfig
        );
        const unbilledNetDec = new Prisma.Decimal(
          String(unbilledTaxBreak.netCertifiedDue)
        ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        periodNetExpectedDec = claimsNetDec.plus(unbilledNetDec);
      }

      const collectedOffsetDec = preservePureBaselineForecast
        ? zero
        : Prisma.Decimal.min(periodNetExpectedDec, collectedAgainstClaimsByBucket[bIdx]);
      alreadyCollectedOffsetTotalDec = alreadyCollectedOffsetTotalDec.plus(collectedOffsetDec);

      const uncollectedLagDec = Prisma.Decimal.max(
        zero,
        periodNetExpectedDec.minus(collectedOffsetDec)
      ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      if (uncollectedLagDec.lte(0)) continue;

      const targetIdx = bIdx + 1;
      if (targetIdx >= skeleton.length) {
        if (skeleton.length >= 240) {
          throw new CanonicalAdapterError('TEMPLATE_ROW_LIMIT_EXCEEDED', 413);
        }
        skeleton.push(buildFollowingHalfMonthBucket(skeleton[skeleton.length - 1]));
        pvByBucket.push(zero);
        expBillByBucket.push(zero);
        fcstReceiptsByBucket.push(zero);
        procOutByBucket.push(zero);
        paySubOutByBucket.push(zero);
        actReceiptsByBucket.push(zero);
        actPaidByBucket.push(zero);
      }
      fcstReceiptsByBucket[targetIdx] = fcstReceiptsByBucket[targetIdx].plus(uncollectedLagDec);
    }

    inputBuckets = skeleton.map((b, idx) => {
      const isFuture = b.periodStart.getTime() > cutoffMs;
      return {
        periodIndex: b.periodIndex,
        periodLabel: b.periodLabel,
        quarterLabel: b.quarterLabel,
        periodStart: b.periodStart,
        periodEnd: b.periodEnd,
        plannedValueWeightAmt: Number(pvByBucket[idx]),
        expectedBillingsAmt: Number(expBillByBucket[idx]),
        forecastReceiptsAmt: Number(fcstReceiptsByBucket[idx]),
        procurementCashOutAmt: Number(procOutByBucket[idx]),
        payrollSubconCashOutAmt: Number(paySubOutByBucket[idx]),
        otherCashOutAmt: 0,
        actualCashReceiptsAmt: isFuture ? 0 : Number(actReceiptsByBucket[idx]),
        actualCashPaidAmt: isFuture ? 0 : Number(actPaidByBucket[idx]),
      };
    });
  }

  const computed = buildMultiStreamCashFlowSchedule({
    targetTotalContractAmount: Number(targetContractGrossDec),
    openingCashAmt: 0,
    buckets: inputBuckets,
  });

  const sumPeriodField = (
    fn: (p: (typeof computed.periods)[number]) => number
  ): Prisma.Decimal =>
    computed.periods
      .reduce(
        (acc, p) =>
          acc.plus(
            new Prisma.Decimal(String(fn(p))).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
          ),
        zero
      )
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const expectedBillingsTotal = sumPeriodField((p) => p.expectedBillingsAmt);
  const forecastReceiptsTotal = sumPeriodField((p) => p.forecastReceiptsAmt);
  const procurementCashOutTotal = sumPeriodField((p) => p.procurementCashOutAmt);
  const payrollSubconCashOutTotal = sumPeriodField((p) => p.payrollSubconCashOutAmt);
  const otherCashOutTotal = sumPeriodField((p) => p.otherCashOutAmt);
  const actualCashReceiptsTotal = sumPeriodField((p) => p.actualCashReceiptsAmt);
  const actualCashPaidTotal = sumPeriodField((p) => p.actualCashPaidAmt);
  const lastPeriod = computed.periods[computed.periods.length - 1];
  const endingClosingCashDec = lastPeriod
    ? new Prisma.Decimal(String(lastPeriod.closingCashAmt)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    : zero;
  const peakLiquidityGapDec = computed.periods.reduce((mx, p) => {
    const gap = new Prisma.Decimal(String(p.liquidityGapAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    return gap.gt(mx) ? gap : mx;
  }, zero);

  const cashFlowSummary: NonNullable<LoadedTemplateCanonicalData['cashFlowSummary']> = {
    snapshotId: snapshot.id,
    snapshotVersionNumber: snapshot.versionNumber,
    scheduleSourceBasis,
    asOfCutoffDateIso: asOfCutoffIsoDate,
    targetContractTotal: targetContractGrossDec.toFixed(2),
    plannedValueWeightTotal: new Prisma.Decimal(String(computed.totalPlannedAllocation)).toFixed(2),
    explicitRoundingDelta: new Prisma.Decimal(String(computed.explicitRoundingDelta)).toFixed(2),
    expectedBillingsTotal: expectedBillingsTotal.toFixed(2),
    forecastReceiptsTotal: forecastReceiptsTotal.toFixed(2),
    procurementCashOutTotal: canReadSensitive ? procurementCashOutTotal.toFixed(2) : null,
    payrollSubconCashOutTotal: canReadSensitive ? payrollSubconCashOutTotal.toFixed(2) : null,
    otherCashOutTotal: canReadSensitive ? otherCashOutTotal.toFixed(2) : null,
    actualCashReceiptsTotal: actualCashReceiptsTotal.toFixed(2),
    actualCashPaidTotal: canReadSensitive ? actualCashPaidTotal.toFixed(2) : null,
    endingClosingCash: canReadSensitive ? endingClosingCashDec.toFixed(2) : null,
    peakLiquidityGap: canReadSensitive ? peakLiquidityGapDec.toFixed(2) : null,
    actualsReconciliation: {
      verifiedClientReceiptsCount,
      allocatedMultiBillingReceiptsCount,
      operationalReceiptPeriodsCount,
      persistedHistoricalReceiptPeriodsPreservedCount,
      deduplicatedIdenticalReceiptMirrorPeriodsCount,
      operationalPaidPeriodsCount,
      persistedHistoricalPaidPeriodsPreservedCount,
      deduplicatedIdenticalPaidMirrorPeriodsCount,
    },
    ...(scheduleSourceBasis === 'BASELINE_SCHEDULE_DERIVED'
      ? {
          billingForecastReconciliation: {
            approvedClaimsEvaluatedCount: datedApprovedClaims.length,
            periodsDominatedByApprovedClaimsCount,
            alreadyCollectedOffsetTotal: alreadyCollectedOffsetTotalDec.toFixed(2),
          },
        }
      : {}),
  };

  return {
    snapshot,
    asOfCutoffIsoDate,
    computed,
    cashFlowSummary,
  };
}

export async function loadT8CashflowHalfMonthCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string,
  roleCtx: BatchCActorRoleContext
): Promise<LoadedTemplateCanonicalData> {
  const { snapshot, asOfCutoffIsoDate, computed, cashFlowSummary } =
    await loadReconciledBatchCCashFlowSchedule(db, projectId, sourceId, roleCtx);

  const rows: Array<Record<string, unknown>> = computed.periods.map((p) => ({
    project_id: projectId,
    snapshot_id: snapshot.id,
    snapshot_version: `v${snapshot.versionNumber}`,
    period_index: p.periodIndex,
    period_label: p.periodLabel,
    quarter_label: p.quarterLabel,
    cash_quarter_label: p.quarterLabel,
    period_start_date: p.periodStart.toISOString().slice(0, 10),
    period_end_date: p.periodEnd.toISOString().slice(0, 10),
    cash_period_start: p.periodStart.toISOString().slice(0, 10),
    cash_period_end: p.periodEnd.toISOString().slice(0, 10),
    as_of_cutoff_date: asOfCutoffIsoDate,
    planned_value_weight_amt: p.plannedValueWeightAmt.toFixed(2),
    expected_billings_amt: p.expectedBillingsAmt.toFixed(2),
    forecast_receipts_amt: p.forecastReceiptsAmt.toFixed(2),
    procurement_cash_out_amt: p.procurementCashOutAmt.toFixed(2),
    payroll_subcon_cash_out_amt: p.payrollSubconCashOutAmt.toFixed(2),
    other_cash_out_amt: p.otherCashOutAmt.toFixed(2),
    actual_cash_receipts_amt: p.actualCashReceiptsAmt.toFixed(2),
    actual_cash_paid_amt: p.actualCashPaidAmt.toFixed(2),
    closing_cash_amt: p.closingCashAmt.toFixed(2),
    liquidity_gap_amt: p.liquidityGapAmt.toFixed(2),
    rounding_adjustment_amt: p.roundingAdjustmentAmt.toFixed(2),
  }));

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'period_index',
    'period_start_date',
    'period_end_date',
    'as_of_cutoff_date',
    'closing_cash_amt',
    'liquidity_gap_amt',
    'rounding_adjustment_amt',
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: `v${snapshot.versionNumber}`,
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById!,
    approvedAtIso: snapshot.approvedAt!.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
    cashFlowSummary,
  };
}

export async function loadT9CashflowQuarterlyCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string,
  roleCtx: BatchCActorRoleContext
): Promise<LoadedTemplateCanonicalData> {
  const { snapshot, asOfCutoffIsoDate, computed, cashFlowSummary } =
    await loadReconciledBatchCCashFlowSchedule(db, projectId, sourceId, roleCtx);

  const rows: Array<Record<string, unknown>> = computed.quarters.map((q, idx) => ({
    project_id: projectId,
    snapshot_id: snapshot.id,
    snapshot_version: `v${snapshot.versionNumber}`,
    quarter_index: idx + 1,
    quarter_label: q.quarterLabel,
    cash_quarter_label: q.quarterLabel,
    period_start_date: q.periodStart.toISOString().slice(0, 10),
    period_end_date: q.periodEnd.toISOString().slice(0, 10),
    cash_period_start: q.periodStart.toISOString().slice(0, 10),
    cash_period_end: q.periodEnd.toISOString().slice(0, 10),
    as_of_cutoff_date: asOfCutoffIsoDate,
    planned_value_weight_amt: q.plannedValueWeightAmt.toFixed(2),
    expected_billings_amt: q.expectedBillingsAmt.toFixed(2),
    forecast_receipts_amt: q.forecastReceiptsAmt.toFixed(2),
    procurement_cash_out_amt: q.procurementCashOutAmt.toFixed(2),
    payroll_subcon_cash_out_amt: q.payrollSubconCashOutAmt.toFixed(2),
    other_cash_out_amt: q.otherCashOutAmt.toFixed(2),
    actual_cash_receipts_amt: q.actualCashReceiptsAmt.toFixed(2),
    actual_cash_paid_amt: q.actualCashPaidAmt.toFixed(2),
    // Strictly NO_SUM: quarter-end closing cash balance & peak intra-quarter liquidity gap
    quarterly_closing_cash: q.quarterlyClosingCash.toFixed(2),
    quarterly_liquidity_gap: q.quarterlyLiquidityGap.toFixed(2),
    rounding_adjustment_amt: q.roundingAdjustmentAmt.toFixed(2),
  }));

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'quarter_index',
    'period_start_date',
    'period_end_date',
    'as_of_cutoff_date',
    'rounding_adjustment_amt',
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: `v${snapshot.versionNumber}`,
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById!,
    approvedAtIso: snapshot.approvedAt!.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
    cashFlowSummary,
  };
}

export async function loadT10ExecutiveMarginCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string,
  roleCtx: BatchCActorRoleContext
): Promise<LoadedTemplateCanonicalData> {
  const zero = new Prisma.Decimal(0);
  const hundred = new Prisma.Decimal(100);
  const asOfCutoff = new Date();
  const cutoffMs = asOfCutoff.getTime();
  const asOfCutoffIsoDate = asOfCutoff.toISOString().slice(0, 10);

  const projectionRole = resolveNarrowestFieldRole(roleCtx.effectiveRole, roleCtx.fieldAccessRole);
  const canReadSensitive = getPermittedVisibilityTiers(projectionRole).has('sensitive');

  const snapshotCtx = await loadVerifiedBatchCSnapshotContext(db, projectId, sourceId);
  const { snapshot } = snapshotCtx;

  const [
    obligations,
    targetBudgets,
    projectGovernedSnapshots,
    agencyEstimates,
    prrRows,
    approvedAccomplishments,
    baselineSchedules,
  ] = await Promise.all([
    reconcileProjectCommitmentsAndObligations(db, projectId, snapshotCtx, asOfCutoff, roleCtx),
    canReadSensitive
      ? db.uboqContractorTargetBudget.findMany({
          where: { projectId },
          orderBy: [{ revisionNumber: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        })
      : Promise.resolve([]),
    canReadSensitive
      ? db.uboqOperationalSnapshot.findMany({
          where: {
            projectId,
            status: { in: ['APPROVED', 'SUPERSEDED'] },
            approvedAt: { not: null },
            approvedById: { not: null },
          },
          select: { id: true, versionNumber: true, status: true },
          orderBy: [{ versionNumber: 'asc' }, { id: 'asc' }],
        })
      : Promise.resolve([]),
    db.uboqAgencyEstimateBaseline.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
    }),
    db.uboqProcurementResourceRequirement.findMany({
      where: {
        projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      include: {
        canonicalResource: {
          select: { id: true, projectId: true, openCommittedPoQty: true },
        },
        workItemAllocations: {
          select: { id: true, phaseLineId: true, allocatedQty: true },
        },
      },
      orderBy: [{ versionNumber: 'desc' }, { id: 'asc' }],
    }),
    db.accomplishment.findMany({
      where: {
        projectId,
        status: { in: ['APPROVED', 'approved'] },
      },
      include: {
        items: {
          include: {
            inspections: {
              where: { approvalStatus: { in: ['APPROVED', 'approved'] } },
              orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
            },
          },
          orderBy: { id: 'asc' },
        },
      },
      orderBy: [{ accomplishmentDate: 'asc' }, { id: 'asc' }],
    }),
    db.projectSchedule.findMany({
      where: {
        projectId,
        workflowStatus: { in: ['ACTIVE_BASELINE', 'SUPERSEDED_BASELINE'] },
      },
      include: {
        activities: {
          include: {
            uboqLinks: { orderBy: { id: 'asc' } },
          },
          orderBy: { id: 'asc' },
        },
        dependencies: { orderBy: { id: 'asc' } },
      },
      orderBy: [{ baselineRevision: 'desc' }, { id: 'asc' }],
      take: 3,
    }),
  ]);

  // 1. Verified physical accomplishment quantities per AwardedBOQItem (<= cutoff, requiring approved inspection)
  const certifiedQtyByBoqId = new Map<string, Prisma.Decimal>();
  for (const acc of approvedAccomplishments) {
    if (acc.accomplishmentDate.getTime() > cutoffMs) continue;
    for (const it of acc.items) {
      const claimDec = Prisma.Decimal.max(
        zero,
        new Prisma.Decimal(
          String(it.approvedQuantity ?? it.currentQuantityClaimed ?? 0)
        ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      );
      if (claimDec.lte(0)) continue;
      const verifiedInsp = it.inspections.reduce(
        (sum, ins) =>
          sum.plus(
            Prisma.Decimal.max(
              zero,
              new Prisma.Decimal(String(ins.approvedQuantity ?? 0)).toDecimalPlaces(
                4,
                Prisma.Decimal.ROUND_HALF_UP
              )
            )
          ),
        zero
      );
      const acceptedDec = Prisma.Decimal.min(claimDec, verifiedInsp);
      if (acceptedDec.gt(0)) {
        certifiedQtyByBoqId.set(
          it.boqItemId,
          (certifiedQtyByBoqId.get(it.boqItemId) ?? zero).plus(acceptedDec)
        );
      }
    }
  }

  const certifiedQtyByPhaseLineId = new Map<string, Prisma.Decimal>();
  for (const [boqId, members] of snapshotCtx.phaseLinesByBoqId.entries()) {
    const totalCeiling = members.reduce(
      (acc, m) => acc.plus(snapshotCtx.revisedQtyByPhaseLineId.get(m.id) ?? m.approvedQty),
      zero
    );
    const cappedBoqCert = Prisma.Decimal.min(
      totalCeiling,
      certifiedQtyByBoqId.get(boqId) ?? zero
    );
    const shares = allocateDecimalProRata(
      cappedBoqCert,
      members.map((m) => snapshotCtx.revisedQtyByPhaseLineId.get(m.id) ?? m.approvedQty),
      4
    );
    members.forEach((m, idx) => certifiedQtyByPhaseLineId.set(m.id, shares[idx]));
  }

  // 2. Schedule Planned Value (PV) per phase line as of cutoff from active baseline schedule
  const pvExVatByPhaseLineId = new Map<string, Prisma.Decimal>();
  const activeSchedule =
    baselineSchedules.find((s) => s.workflowStatus === 'ACTIVE_BASELINE') ??
    baselineSchedules[0] ??
    null;

  if (activeSchedule && activeSchedule.activities.length > 0) {
    const cpmActs: CPMActivity[] = activeSchedule.activities.map((a) => ({
      id: a.id,
      name: a.name,
      duration: Math.max(0, a.plannedDuration),
      plannedStart: a.baselineStartDate ?? a.plannedStartDate,
      plannedFinish: a.baselineFinishDate ?? a.plannedFinishDate,
    }));
    const cpmDeps: CPMDependency[] = activeSchedule.dependencies.map((d) => ({
      id: d.id,
      predecessorId: d.predecessorId,
      successorId: d.successorId,
      type: (['FS', 'SS', 'FF', 'SF'].includes(d.type.toUpperCase())
        ? d.type.toUpperCase()
        : 'FS') as CPMDependency['type'],
      lagDays: d.lagDays,
    }));
    const rawCpm = calculateCPM(cpmActs, cpmDeps);
    const baseStart =
      activeSchedule.projectStartDate ??
      activeSchedule.baselineStartDate ??
      activeSchedule.currentStartDate ??
      null;
    const resolvedCpm =
      !rawCpm.hasCircularDependency && baseStart
        ? resolveWorkingDayDates(rawCpm, baseStart, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
        : rawCpm;

    const scheduledTimeFracByPhaseLine = new Map<string, Prisma.Decimal[]>();
    for (const act of activeSchedule.activities) {
      const node = resolvedCpm.results.get(act.id);
      const aStart = node?.earlyStartDate ?? act.baselineStartDate ?? act.plannedStartDate;
      const aEnd = node?.earlyFinishDate ?? act.baselineFinishDate ?? act.plannedFinishDate;
      let timeFrac = zero;
      if (aStart && aEnd) {
        if (cutoffMs >= aEnd.getTime()) {
          timeFrac = new Prisma.Decimal(1);
        } else if (cutoffMs > aStart.getTime()) {
          const span = Math.max(1, aEnd.getTime() - aStart.getTime());
          timeFrac = new Prisma.Decimal(cutoffMs - aStart.getTime())
            .div(new Prisma.Decimal(span))
            .toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
        }
      }
      for (const lnk of act.uboqLinks) {
        if (snapshotCtx.phaseLineById.has(lnk.phaseLineId)) {
          const list = scheduledTimeFracByPhaseLine.get(lnk.phaseLineId) ?? [];
          list.push(timeFrac);
          scheduledTimeFracByPhaseLine.set(lnk.phaseLineId, list);
        }
      }
    }

    for (const pl of snapshotCtx.phaseLines) {
      const lineExVat = snapshotCtx.revisedExVatAmtByPhaseLineId.get(pl.id) ?? zero;
      const fracs = scheduledTimeFracByPhaseLine.get(pl.id);
      if (fracs && fracs.length > 0) {
        const avgFrac = fracs
          .reduce((acc, f) => acc.plus(f), zero)
          .div(new Prisma.Decimal(fracs.length));
        pvExVatByPhaseLineId.set(
          pl.id,
          lineExVat.mul(avgFrac).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
        );
      }
    }
  }

  // 3. Procurement Resource Requirements (PRR) budget & committed qty allocated per phase line
  const prrBudgetByPhaseLineId = new Map<string, Prisma.Decimal>();
  const committedQtyByPhaseLineId = new Map<string, Prisma.Decimal>();
  const latestPrrByCanonicalId = new Map<string, (typeof prrRows)[number]>();
  for (const prr of prrRows) {
    if (!latestPrrByCanonicalId.has(prr.canonicalResourceId)) {
      latestPrrByCanonicalId.set(prr.canonicalResourceId, prr);
    }
  }
  for (const prr of latestPrrByCanonicalId.values()) {
    const validAllocs = prr.workItemAllocations.filter(
      (w): w is typeof w & { phaseLineId: string } =>
        w.phaseLineId !== null && snapshotCtx.phaseLineById.has(w.phaseLineId)
    );
    const targets =
      validAllocs.length > 0
        ? validAllocs.map((w) => ({
            phaseLineId: w.phaseLineId,
            weight: w.allocatedQty.gt(0) ? w.allocatedQty : new Prisma.Decimal(1),
          }))
        : (snapshotCtx.phaseWeightsByConsolidatedId.get(prr.consolidatedBoqItemId) ?? []);
    if (targets.length === 0) continue;

    const weights = targets.map((t) => t.weight);
    const budShares = allocateDecimalProRata(prr.procurementBudget, weights, 2);
    const commQtyShares = allocateDecimalProRata(
      prr.canonicalResource.openCommittedPoQty,
      weights,
      4
    );
    targets.forEach((t, idx) => {
      prrBudgetByPhaseLineId.set(
        t.phaseLineId,
        (prrBudgetByPhaseLineId.get(t.phaseLineId) ?? zero).plus(budShares[idx])
      );
      committedQtyByPhaseLineId.set(
        t.phaseLineId,
        (committedQtyByPhaseLineId.get(t.phaseLineId) ?? zero).plus(commQtyShares[idx])
      );
    });
  }

  // 4. Agency Estimate Ex-VAT & Executive Contractor Target Budget per phase line
  const agencyDirectByPhaseLineId = new Map<string, Prisma.Decimal>();
  for (const ae of agencyEstimates) {
    if (ae.phaseLineId && !agencyDirectByPhaseLineId.has(ae.phaseLineId)) {
      agencyDirectByPhaseLineId.set(ae.phaseLineId, ae.estimatedDirectCost);
    }
  }

  const targetBudgetByPhaseLineId = new Map<
    string,
    {
      directCostDec: Prisma.Decimal;
      totalCostDec: Prisma.Decimal;
      explicitCommitmentOpenDec: Prisma.Decimal;
      explicitEtcUncommittedDec: Prisma.Decimal;
    }
  >();

  let targetBudgetStatus: NonNullable<
    LoadedTemplateCanonicalData['executiveMarginSummary']
  >['targetBudgetStatus'] = canReadSensitive
    ? 'UNAVAILABLE_NO_APPROVED_BUDGET'
    : 'REDACTED_NON_EXECUTIVE';
  let hasVerifiedTargetBudget = false;

  if (canReadSensitive) {
    // WP3-BC-IR-04: Strictly require approvedById + approvedAt <= asOfCutoff; never allow
    // unapproved or future-dated draft revisions to override approved target budgets.
    const allTargetBudgetsById = new Map(targetBudgets.map((tb) => [tb.id, tb]));
    const approvedTargetBudgets = targetBudgets.filter(
      (tb) =>
        tb.approvedById !== null && tb.approvedAt !== null && tb.approvedAt.getTime() <= cutoffMs
    );

    if (approvedTargetBudgets.length > 0) {
      for (const tb of approvedTargetBudgets) {
        if (
          tb.phaseLineId !== null &&
          snapshotCtx.phaseLineById.has(tb.phaseLineId) &&
          tb.snapshotId !== null &&
          tb.snapshotId !== snapshot.id
        ) {
          throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
            projectId,
            snapshotId: snapshot.id,
            targetBudgetId: tb.id,
            phaseLineId: tb.phaseLineId,
            budgetSnapshotId: tb.snapshotId,
            reason: 'PHASE_LINE_TARGET_BUDGET_SNAPSHOT_MISMATCH',
          });
        }
      }

      const applicableApproved = approvedTargetBudgets.filter((tb) => {
        if (tb.snapshotId !== null && tb.snapshotId !== snapshot.id) {
          return false;
        }
        if (tb.phaseLineId !== null) {
          return snapshotCtx.phaseLineById.has(tb.phaseLineId);
        }
        return true;
      });

      if (applicableApproved.length === 0) {
        throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
          projectId,
          snapshotId: snapshot.id,
          approvedProjectBudgetsCount: approvedTargetBudgets.length,
          reason: 'APPROVED_TARGET_BUDGETS_BOUND_ONLY_TO_OTHER_SNAPSHOT',
        });
      }

      const resolveVerifiedScopeHead = (
        scopeKey: string,
        scopeRows: typeof applicableApproved
      ): (typeof applicableApproved)[number] => {
        if (scopeRows.length === 1) {
          const single = scopeRows[0];
          if (single.supersedesId !== null) {
            const prior = allTargetBudgetsById.get(single.supersedesId);
            if (
              !prior ||
              (prior.phaseLineId ?? '__PROJECT_WIDE__') !== scopeKey ||
              single.revisionNumber <= prior.revisionNumber
            ) {
              throw new CanonicalAdapterError(
                'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS',
                409,
                {
                  projectId,
                  snapshotId: snapshot.id,
                  scopeKey,
                  targetBudgetId: single.id,
                  supersedesId: single.supersedesId,
                  reason: 'BROKEN_TARGET_BUDGET_SUPERSEDES_LINEAGE',
                }
              );
            }
          }
          return single;
        }

        const scopeApprovedById = new Map(scopeRows.map((r) => [r.id, r]));
        const findApprovedPredecessor = (
          row: (typeof scopeRows)[number]
        ): (typeof scopeRows)[number] | null => {
          const visited = new Set<string>([row.id]);
          let currId = row.supersedesId;
          let prevRev = row.revisionNumber;
          while (currId) {
            if (visited.has(currId)) {
              throw new CanonicalAdapterError(
                'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS',
                409,
                {
                  projectId,
                  snapshotId: snapshot.id,
                  scopeKey,
                  targetBudgetId: row.id,
                  reason: 'CYCLIC_TARGET_BUDGET_REVISION_LINEAGE',
                }
              );
            }
            visited.add(currId);
            const ancestor = allTargetBudgetsById.get(currId);
            if (
              !ancestor ||
              (ancestor.phaseLineId ?? '__PROJECT_WIDE__') !== scopeKey ||
              ancestor.revisionNumber >= prevRev
            ) {
              throw new CanonicalAdapterError(
                'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS',
                409,
                {
                  projectId,
                  snapshotId: snapshot.id,
                  scopeKey,
                  targetBudgetId: row.id,
                  reason: 'INVALID_TARGET_BUDGET_SUPERSEDES_CHAIN',
                }
              );
            }
            if (scopeApprovedById.has(ancestor.id)) {
              return scopeApprovedById.get(ancestor.id)!;
            }
            prevRev = ancestor.revisionNumber;
            currId = ancestor.supersedesId;
          }
          return null;
        };

        const supersededByMap = new Map<string, string>();
        for (const r of scopeRows) {
          const pred = findApprovedPredecessor(r);
          if (pred) {
            if (supersededByMap.has(pred.id)) {
              throw new CanonicalAdapterError(
                'TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS',
                409,
                {
                  projectId,
                  snapshotId: snapshot.id,
                  scopeKey,
                  supersededBudgetId: pred.id,
                  reason: 'FORKED_APPROVED_TARGET_BUDGET_REVISIONS',
                }
              );
            }
            supersededByMap.set(pred.id, r.id);
          }
        }

        const heads = scopeRows.filter((r) => !supersededByMap.has(r.id));
        if (heads.length !== 1) {
          throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
            projectId,
            snapshotId: snapshot.id,
            scopeKey,
            candidateBudgetIds: heads.map((h) => h.id),
            reason: 'MULTIPLE_UNRECONCILED_APPROVED_BUDGET_REVISIONS',
          });
        }

        // Verify the single head walks cleanly through all approved revisions in scope
        const walkedIds = new Set<string>();
        let cursor: (typeof scopeRows)[number] | null = heads[0];
        while (cursor) {
          walkedIds.add(cursor.id);
          cursor = findApprovedPredecessor(cursor);
        }
        if (walkedIds.size !== scopeRows.length) {
          throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
            projectId,
            snapshotId: snapshot.id,
            scopeKey,
            reason: 'DISCONNECTED_APPROVED_TARGET_BUDGET_REVISIONS',
          });
        }

        return heads[0];
      };

      const groupedByScope = new Map<string, typeof applicableApproved>();
      for (const tb of applicableApproved) {
        const key = tb.phaseLineId ?? '__PROJECT_WIDE__';
        const list = groupedByScope.get(key) ?? [];
        list.push(tb);
        groupedByScope.set(key, list);
      }

      const projectWideRows = groupedByScope.get('__PROJECT_WIDE__') ?? [];
      const projectWideHead =
        projectWideRows.length > 0
          ? resolveVerifiedScopeHead('__PROJECT_WIDE__', projectWideRows)
          : null;

      // WP3-BC-IR-R2-03: Never apply an unbound project-wide target budget (snapshotId = NULL,
      // phaseLineId = NULL) across multiple approved/superseded snapshots; require either an
      // explicit snapshotId binding or proof that only one governed snapshot exists on the project.
      if (
        projectWideHead &&
        projectWideHead.snapshotId === null &&
        (projectGovernedSnapshots.length !== 1 || projectGovernedSnapshots[0].id !== snapshot.id)
      ) {
        throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
          projectId,
          snapshotId: snapshot.id,
          projectWideBudgetId: projectWideHead.id,
          governedSnapshotIds: projectGovernedSnapshots.map((s) => s.id),
          reason: 'UNBOUND_PROJECT_WIDE_BUDGET_AMBIGUOUS_ACROSS_MULTIPLE_SNAPSHOTS',
        });
      }

      const resolvedLineHeads = new Map<string, (typeof applicableApproved)[number]>();
      for (const [scopeKey, rowsInScope] of groupedByScope.entries()) {
        if (scopeKey === '__PROJECT_WIDE__') continue;
        resolvedLineHeads.set(scopeKey, resolveVerifiedScopeHead(scopeKey, rowsInScope));
      }

      if (resolvedLineHeads.size > 0 && !projectWideHead) {
        if (resolvedLineHeads.size !== snapshotCtx.phaseLines.length) {
          throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
            projectId,
            snapshotId: snapshot.id,
            coveredPhaseLinesCount: resolvedLineHeads.size,
            totalPhaseLinesCount: snapshotCtx.phaseLines.length,
            reason: 'INCOMPLETE_PHASE_LINE_TARGET_BUDGET_COVERAGE',
          });
        }
        for (const [plId, tb] of resolvedLineHeads.entries()) {
          const tot = tb.targetTotalCost.gt(0) ? tb.targetTotalCost : tb.targetDirectCostAmt;
          targetBudgetByPhaseLineId.set(plId, {
            directCostDec: tb.targetDirectCostAmt.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
            totalCostDec: tot.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP),
            explicitCommitmentOpenDec: tb.commitmentOpenAmt.toDecimalPlaces(
              2,
              Prisma.Decimal.ROUND_HALF_UP
            ),
            explicitEtcUncommittedDec: tb.etcUncommitted.toDecimalPlaces(
              2,
              Prisma.Decimal.ROUND_HALF_UP
            ),
          });
        }
        targetBudgetStatus = 'VERIFIED_APPROVED_LINE_BUDGETS';
        hasVerifiedTargetBudget = true;
      } else if (projectWideHead && resolvedLineHeads.size === 0) {
        const pwTot = projectWideHead.targetTotalCost.gt(0)
          ? projectWideHead.targetTotalCost
          : projectWideHead.targetDirectCostAmt;
        const weights = snapshotCtx.phaseLines.map((pl) => {
          const ex = snapshotCtx.revisedExVatAmtByPhaseLineId.get(pl.id) ?? zero;
          return ex.gt(0) ? ex : new Prisma.Decimal(1);
        });
        const dirShares = allocateDecimalProRata(projectWideHead.targetDirectCostAmt, weights, 2);
        const totShares = allocateDecimalProRata(pwTot, weights, 2);
        const openShares = allocateDecimalProRata(projectWideHead.commitmentOpenAmt, weights, 2);
        const etcShares = allocateDecimalProRata(projectWideHead.etcUncommitted, weights, 2);

        snapshotCtx.phaseLines.forEach((pl, idx) => {
          targetBudgetByPhaseLineId.set(pl.id, {
            directCostDec: dirShares[idx],
            totalCostDec: totShares[idx],
            explicitCommitmentOpenDec: openShares[idx],
            explicitEtcUncommittedDec: etcShares[idx],
          });
        });
        targetBudgetStatus = 'VERIFIED_APPROVED_PROJECT_BUDGET';
        hasVerifiedTargetBudget = true;
      } else if (projectWideHead && resolvedLineHeads.size > 0) {
        if (resolvedLineHeads.size !== snapshotCtx.phaseLines.length) {
          throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
            projectId,
            snapshotId: snapshot.id,
            projectWideBudgetId: projectWideHead.id,
            coveredPhaseLinesCount: resolvedLineHeads.size,
            totalPhaseLinesCount: snapshotCtx.phaseLines.length,
            reason: 'UNRECONCILED_MIXED_PROJECT_WIDE_AND_PARTIAL_LINE_BUDGETS',
          });
        }

        const pwDirectDec = projectWideHead.targetDirectCostAmt.toDecimalPlaces(
          2,
          Prisma.Decimal.ROUND_HALF_UP
        );
        const pwTotalDec = (
          projectWideHead.targetTotalCost.gt(0)
            ? projectWideHead.targetTotalCost
            : projectWideHead.targetDirectCostAmt
        ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

        let sumLineDirectDec = zero;
        let sumLineTotalDec = zero;
        for (const [plId, tb] of resolvedLineHeads.entries()) {
          const dDec = tb.targetDirectCostAmt.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          const tDec = (
            tb.targetTotalCost.gt(0) ? tb.targetTotalCost : tb.targetDirectCostAmt
          ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          sumLineDirectDec = sumLineDirectDec.plus(dDec);
          sumLineTotalDec = sumLineTotalDec.plus(tDec);
          targetBudgetByPhaseLineId.set(plId, {
            directCostDec: dDec,
            totalCostDec: tDec,
            explicitCommitmentOpenDec: tb.commitmentOpenAmt.toDecimalPlaces(
              2,
              Prisma.Decimal.ROUND_HALF_UP
            ),
            explicitEtcUncommittedDec: tb.etcUncommitted.toDecimalPlaces(
              2,
              Prisma.Decimal.ROUND_HALF_UP
            ),
          });
        }

        if (
          sumLineDirectDec.minus(pwDirectDec).abs().gt('0.02') ||
          sumLineTotalDec.minus(pwTotalDec).abs().gt('0.02')
        ) {
          throw new CanonicalAdapterError('TEMPLATE_TARGET_BUDGET_ASSOCIATION_AMBIGUOUS', 409, {
            projectId,
            snapshotId: snapshot.id,
            projectWideBudgetId: projectWideHead.id,
            projectWideDirectCost: pwDirectDec.toFixed(2),
            sumLineDirectCost: sumLineDirectDec.toFixed(2),
            projectWideTotalCost: pwTotalDec.toFixed(2),
            sumLineTotalCost: sumLineTotalDec.toFixed(2),
            reason: 'CONFLICTING_PROJECT_WIDE_AND_LINE_BUDGET_TOTALS',
          });
        }

        targetBudgetStatus = 'VERIFIED_RECONCILED_PROJECT_AND_LINE_BUDGETS';
        hasVerifiedTargetBudget = true;
      }
    }
  }

  let awardedGrossTotalDec = zero;
  let awardedExVatTotalDec = zero;
  let targetDirectTotalDec = zero;
  let targetCostTotalDec = zero;
  let targetProfitTotalDec = zero;
  let commitmentOpenTotalDec = zero;
  let etcUncommittedTotalDec = zero;
  let forecastEacTotalDec = zero;
  let forecastProfitTotalDec = zero;

  const rows: Array<Record<string, unknown>> = snapshotCtx.phaseLines.map((pl) => {
    const effQtyDec = snapshotCtx.revisedQtyByPhaseLineId.get(pl.id) ?? pl.approvedQty;
    const lineGrossDec =
      snapshotCtx.revisedGrossAmtByPhaseLineId.get(pl.id) ?? pl.contractLineAmount;
    const lineExVatDec = snapshotCtx.revisedExVatAmtByPhaseLineId.get(pl.id) ?? lineGrossDec;

    awardedGrossTotalDec = awardedGrossTotalDec.plus(lineGrossDec);
    awardedExVatTotalDec = awardedExVatTotalDec.plus(lineExVatDec);

    const certQtyDec = certifiedQtyByPhaseLineId.get(pl.id) ?? zero;
    const progressRatioDec = effQtyDec.gt(0)
      ? Prisma.Decimal.min(
          new Prisma.Decimal(1),
          certQtyDec.div(effQtyDec).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP)
        )
      : zero;
    const physicalProgressPctDec = progressRatioDec
      .mul(hundred)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const certifiedGrossAmtDec = certQtyDec
      .mul(pl.contractUnitRate)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const earnedValueExVatDec = lineExVatDec
      .mul(progressRatioDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const plannedValueExVatDec = pvExVatByPhaseLineId.get(pl.id) ?? earnedValueExVatDec;

    const ob = obligations.byPhaseLineId.get(pl.id)!;
    const actualIncurredExVatDec = ob.incurredAgainstCommitmentExVat
      .plus(ob.uncommittedDirectIncurredExVat)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const unpaidPayableExVatDec = Prisma.Decimal.max(
      zero,
      actualIncurredExVatDec.minus(ob.paidDisbursedExVat)
    );
    const prrBudgetDec = prrBudgetByPhaseLineId.get(pl.id) ?? zero;
    const commQtyDec = committedQtyByPhaseLineId.get(pl.id) ?? zero;

    const spiStr = plannedValueExVatDec.gt(0)
      ? earnedValueExVatDec
          .div(plannedValueExVatDec)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
          .toFixed(4)
      : '1.0000';
    const cpiStr = actualIncurredExVatDec.gt(0)
      ? earnedValueExVatDec
          .div(actualIncurredExVatDec)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
          .toFixed(4)
      : '1.0000';

    const tb = targetBudgetByPhaseLineId.get(pl.id);
    const targetDirectDec = tb ? tb.directCostDec : zero;
    const targetTotalDec = tb ? tb.totalCostDec : zero;
    const targetIndirectDec = Prisma.Decimal.max(zero, targetTotalDec.minus(targetDirectDec));

    // Reconcile unexpensed open commitments without double-counting already-incurred PO/Subcon costs
    const effectiveCommitmentOpenDec = obligations.totals.hasAnyCommitmentAuthority
      ? ob.commitmentOpenExVat
      : tb
        ? tb.explicitCommitmentOpenDec
        : zero;
    const outstandingObligationExVatDec = unpaidPayableExVatDec.plus(effectiveCommitmentOpenDec);

    const committedPlusIncurredDec = actualIncurredExVatDec.plus(effectiveCommitmentOpenDec);
    const effectiveEtcUncommittedDec =
      tb && tb.explicitEtcUncommittedDec.gt(0)
        ? tb.explicitEtcUncommittedDec
        : targetTotalDec.gt(0)
          ? Prisma.Decimal.max(zero, targetTotalDec.minus(committedPlusIncurredDec))
          : prrBudgetDec.gt(0)
            ? Prisma.Decimal.max(zero, prrBudgetDec.minus(committedPlusIncurredDec))
            : zero;

    // Invoke frozen five-baseline comparison engine (src/lib/uboq/tax-engine.ts) on Ex-VAT basis
    const fiveBaseline = computeFiveBaselineComparison({
      agencyEstimateExVat: Number(agencyDirectByPhaseLineId.get(pl.id) ?? zero),
      awardedContractAmount: Number(lineGrossDec),
      profile: snapshotCtx.taxProfileConfig,
      targetDirectCostExVat: Number(targetDirectDec),
      targetIndirectCostExVat: Number(targetIndirectDec),
      openCommittedPoExVat: Number(effectiveCommitmentOpenDec),
      actualIncurredCostExVat: Number(actualIncurredExVatDec),
      uncommittedEtcExVat: Number(effectiveEtcUncommittedDec),
    });
    void fiveBaseline;

    const targetProfitDec = lineExVatDec
      .minus(targetTotalDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    // Strictly NO_SUM percentage ratio on line
    const targetMarginPctDec = lineExVatDec.gt(0)
      ? targetProfitDec
          .div(lineExVatDec)
          .mul(hundred)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
      : zero;
    const forecastEacDec = actualIncurredExVatDec
      .plus(effectiveCommitmentOpenDec)
      .plus(effectiveEtcUncommittedDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const forecastProfitDec = lineExVatDec
      .minus(forecastEacDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (hasVerifiedTargetBudget) {
      targetDirectTotalDec = targetDirectTotalDec.plus(targetDirectDec);
      targetCostTotalDec = targetCostTotalDec.plus(targetTotalDec);
      targetProfitTotalDec = targetProfitTotalDec.plus(targetProfitDec);
    }
    commitmentOpenTotalDec = commitmentOpenTotalDec.plus(effectiveCommitmentOpenDec);
    etcUncommittedTotalDec = etcUncommittedTotalDec.plus(effectiveEtcUncommittedDec);
    forecastEacTotalDec = forecastEacTotalDec.plus(forecastEacDec);
    forecastProfitTotalDec = forecastProfitTotalDec.plus(forecastProfitDec);

    const row: Record<string, unknown> = {
      project_id: projectId,
      snapshot_id: snapshot.id,
      snapshot_version: `v${snapshot.versionNumber}`,
      boq_line_id: pl.id,
      awarded_boq_item_id: snapshotCtx.phaseLineBoqId.get(pl.id) ?? null,
      as_of_cutoff_date: asOfCutoffIsoDate,
      tax_profile_version: snapshotCtx.taxProfileVersion,
      item_code: pl.itemCode,
      phase_code: pl.phaseCode,
      section_code: pl.sectionCode ?? '',
      work_description: pl.workDescription,
      unit: pl.unitNormalized,
      approved_qty: effQtyDec.toFixed(4),
      contract_unit_rate: pl.contractUnitRate.toFixed(4),
      contract_line_amount: lineExVatDec.toFixed(2),
      awarded_contract_ex_vat: lineExVatDec.toFixed(2),
      certified_curr_amt: certifiedGrossAmtDec.toFixed(2),
      physical_progress_pct: physicalProgressPctDec.toFixed(4),
      procurement_budget: prrBudgetDec.toFixed(2),
      committed_qty: commQtyDec.toFixed(4),
      planned_value: plannedValueExVatDec.toFixed(2),
      earned_value: earnedValueExVatDec.toFixed(2),
      actual_cost: actualIncurredExVatDec.toFixed(2),
      incurred_actual_cost_ex_vat: actualIncurredExVatDec.toFixed(2),
      spi: spiStr,
      cpi: cpiStr,
    };

    if (canReadSensitive) {
      row.target_direct_cost_amt = hasVerifiedTargetBudget ? targetDirectDec.toFixed(2) : null;
      row.target_indirect_cost_ex_vat = hasVerifiedTargetBudget
        ? targetIndirectDec.toFixed(2)
        : null;
      row.target_total_cost = hasVerifiedTargetBudget ? targetTotalDec.toFixed(2) : null;
      row.target_profit = hasVerifiedTargetBudget ? targetProfitDec.toFixed(2) : null;
      row.target_margin = hasVerifiedTargetBudget ? targetMarginPctDec.toFixed(4) : null;
      row.committed_total_ex_vat = ob.committedTotalExVat.toFixed(2);
      row.incurred_against_commitment_ex_vat = ob.incurredAgainstCommitmentExVat.toFixed(2);
      row.uncommitted_direct_incurred_ex_vat = ob.uncommittedDirectIncurredExVat.toFixed(2);
      row.paid_disbursed_ex_vat = ob.paidDisbursedExVat.toFixed(2);
      row.unpaid_incurred_payable_ex_vat = unpaidPayableExVatDec.toFixed(2);
      row.outstanding_total_obligation_ex_vat = outstandingObligationExVatDec.toFixed(2);
      row.commitment_open_amt = effectiveCommitmentOpenDec.toFixed(2);
      row.etc_uncommitted = effectiveEtcUncommittedDec.toFixed(2);
      row.forecast_eac = forecastEacDec.toFixed(2);
      row.forecast_profit = forecastProfitDec.toFixed(2);
    }

    return row;
  });

  const overallTargetMarginPct =
    canReadSensitive && hasVerifiedTargetBudget && awardedExVatTotalDec.gt(0)
      ? targetProfitTotalDec
          .div(awardedExVatTotalDec)
          .mul(hundred)
          .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP)
          .toFixed(4)
      : canReadSensitive && hasVerifiedTargetBudget
        ? '0.0000'
        : null;

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'boq_line_id',
    'awarded_boq_item_id',
    'phase_code',
    'section_code',
    'as_of_cutoff_date',
    'tax_profile_version',
    'awarded_contract_ex_vat',
    'incurred_actual_cost_ex_vat',
    'target_indirect_cost_ex_vat',
    'committed_total_ex_vat',
    'incurred_against_commitment_ex_vat',
    'uncommitted_direct_incurred_ex_vat',
    'paid_disbursed_ex_vat',
    'unpaid_incurred_payable_ex_vat',
    'outstanding_total_obligation_ex_vat',
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: `v${snapshot.versionNumber}`,
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById!,
    approvedAtIso: snapshot.approvedAt!.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
    executiveMarginSummary: {
      snapshotId: snapshot.id,
      snapshotVersionNumber: snapshot.versionNumber,
      asOfCutoffDateIso: asOfCutoffIsoDate,
      taxProfileVersion: snapshotCtx.taxProfileVersion,
      targetBudgetStatus,
      awardedContractTotalGross: awardedGrossTotalDec.toFixed(2),
      awardedContractTotalExVat: awardedExVatTotalDec.toFixed(2),
      targetDirectCostTotalExVat:
        canReadSensitive && hasVerifiedTargetBudget ? targetDirectTotalDec.toFixed(2) : null,
      targetTotalCostExVat:
        canReadSensitive && hasVerifiedTargetBudget ? targetCostTotalDec.toFixed(2) : null,
      targetProfitTotalExVat:
        canReadSensitive && hasVerifiedTargetBudget ? targetProfitTotalDec.toFixed(2) : null,
      targetMarginPctOverall: overallTargetMarginPct,
      committedTotalExVat: canReadSensitive
        ? obligations.totals.hasAnyCommitmentAuthority
          ? obligations.totals.committedTotalExVat.toFixed(2)
          : commitmentOpenTotalDec.toFixed(2)
        : null,
      incurredAgainstCommitmentTotalExVat: canReadSensitive
        ? obligations.totals.incurredAgainstCommitmentExVat.toFixed(2)
        : null,
      uncommittedDirectIncurredTotalExVat: canReadSensitive
        ? obligations.totals.uncommittedDirectIncurredExVat.toFixed(2)
        : null,
      incurredActualCostTotalExVat: obligations.totals.incurredActualCostExVat.toFixed(2),
      paidDisbursedTotalExVat: canReadSensitive
        ? obligations.totals.paidDisbursedExVat.toFixed(2)
        : null,
      unpaidIncurredPayableTotalExVat: canReadSensitive
        ? obligations.totals.unpaidIncurredPayableExVat.toFixed(2)
        : null,
      outstandingTotalObligationExVat: canReadSensitive
        ? obligations.totals.unpaidIncurredPayableExVat.plus(commitmentOpenTotalDec).toFixed(2)
        : null,
      commitmentOpenTotalExVat: canReadSensitive ? commitmentOpenTotalDec.toFixed(2) : null,
      etcUncommittedTotalExVat: canReadSensitive ? etcUncommittedTotalDec.toFixed(2) : null,
      forecastEacTotalExVat: canReadSensitive ? forecastEacTotalDec.toFixed(2) : null,
      forecastProfitTotalExVat: canReadSensitive ? forecastProfitTotalDec.toFixed(2) : null,
      deduplicatedMirrorCommitmentsCount: obligations.totals.deduplicatedMirrorCommitmentsCount,
      deduplicatedMirroredExpensesCount: obligations.totals.deduplicatedMirroredExpensesCount,
    },
  };
}

interface RlsSubcontractPackageLineageRow {
  id: string;
  projectId: string;
  packageNumber: string;
  status: string;
  awardedBoqItemId: string | null;
  consolidatedBoqItemId: string | null;
}

interface RlsProjectVoCrossTenantAnomalyRow {
  source_table: string;
  record_id: string;
  anomaly_reason: string;
}

async function readRlsGuardedSubcontractPackageLineage(
  db: Prisma.TransactionClient,
  projectId: string
): Promise<RlsSubcontractPackageLineageRow[]> {
  return db.$queryRaw<RlsSubcontractPackageLineageRow[]>`
    SELECT
      id,
      "projectId",
      "packageNumber",
      status,
      "awardedBoqItemId",
      "consolidatedBoqItemId"
    FROM public.uboq_read_project_subcontract_package_lineage(${projectId})
  `;
}

async function detectProjectVoCrossTenantAnomalies(
  db: Prisma.TransactionClient,
  projectId: string
): Promise<RlsProjectVoCrossTenantAnomalyRow[]> {
  return db.$queryRaw<RlsProjectVoCrossTenantAnomalyRow[]>`
    SELECT
      source_table,
      record_id,
      anomaly_reason
    FROM public.uboq_detect_project_vo_cross_tenant_anomalies(${projectId})
  `;
}

export async function loadT11VariationOrderRegisterCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string,
  roleCtx: BatchCActorRoleContext
): Promise<LoadedTemplateCanonicalData> {
  const zero = new Prisma.Decimal(0);
  const amtTol = new Prisma.Decimal('0.05');
  const qtyTol = new Prisma.Decimal('0.0001');

  const projectionRole = resolveNarrowestFieldRole(roleCtx.effectiveRole, roleCtx.fieldAccessRole);
  const permittedTiers = getPermittedVisibilityTiers(projectionRole);
  const canReadSensitive = permittedTiers.has('sensitive');

  // Ensure canonical BOQ mutations cannot mask unauthorized VO edits before we inspect full VO tables:
  // load full AwardedBOQItem + VariationOrder + ClientVariationOrder + SubcontractorVariationOrder + CommitmentLedger
  // in parallel with snapshot context verification and unconditional RLS-guarded subcontract package lineage
  // (never bypassed by non-executive or read-only actor roles).
  const [
    snapshotCtx,
    fullBoqItems,
    allVariationOrders,
    allClientVos,
    allSubconVos,
    allCommitmentLedgers,
    subconPackages,
    crossTenantAnomalies,
    boqMappings,
  ] = await Promise.all([
    loadVerifiedBatchCSnapshotContext(db, projectId, sourceId),
    db.awardedBOQItem.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        itemCode: true,
        description: true,
        unit: true,
        quantity: true,
        totalCost: true,
        approvedClientVoQuantity: true,
        revisedContractQuantity: true,
        revisedContractUnitPrice: true,
        revisedContractAmount: true,
      },
      orderBy: [{ itemCode: 'asc' }, { id: 'asc' }],
    }),
    db.variationOrder.findMany({
      where: { projectId },
      include: {
        items: { orderBy: [{ voItemNumber: 'asc' }, { id: 'asc' }] },
        approvals: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
        documents: { orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.clientVariationOrder.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.subcontractorVariationOrder.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    db.commitmentLedger.findMany({
      where: { projectId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    }),
    readRlsGuardedSubcontractPackageLineage(db, projectId),
    detectProjectVoCrossTenantAnomalies(db, projectId),
    db.bOQMapping.findMany({
      where: {
        OR: [{ awardedBoqItem: { projectId } }, { consolidatedBoqItem: { projectId } }],
      },
      select: {
        awardedBoqItemId: true,
        consolidatedBoqItemId: true,
      },
    }),
  ]);

  if (crossTenantAnomalies.length > 0) {
    throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
      projectId,
      anomalyCount: crossTenantAnomalies.length,
      sourceTable: crossTenantAnomalies[0].source_table,
      recordId: crossTenantAnomalies[0].record_id,
      reason: crossTenantAnomalies[0].anomaly_reason,
    });
  }

  const { snapshot, contractAuthority: ca, taxProfileConfig } = snapshotCtx;
  const fullBoqById = new Map(fullBoqItems.map((b) => [b.id, b]));
  const subconPkgById = new Map(subconPackages.map((p) => [p.id, p]));

  const boqIdsByConsolidatedId = new Map<string, Set<string>>();
  const addConsolidatedBoqLink = (consolId: string, boqId: string) => {
    if (!snapshotCtx.consolidatedById.has(consolId)) return;
    if (!fullBoqById.has(boqId)) return;
    if ((snapshotCtx.phaseLinesByBoqId.get(boqId)?.length ?? 0) === 0) return;
    const set = boqIdsByConsolidatedId.get(consolId) ?? new Set<string>();
    set.add(boqId);
    boqIdsByConsolidatedId.set(consolId, set);
  };
  for (const [consolId, weights] of snapshotCtx.phaseWeightsByConsolidatedId.entries()) {
    for (const w of weights) {
      const bId = snapshotCtx.phaseLineBoqId.get(w.phaseLineId);
      if (bId) addConsolidatedBoqLink(consolId, bId);
    }
  }
  for (const bm of boqMappings) {
    if (bm.consolidatedBoqItemId && bm.awardedBoqItemId) {
      addConsolidatedBoqLink(bm.consolidatedBoqItemId, bm.awardedBoqItemId);
    }
  }

  const resolveVerifiedSubconPackageLineage = (
    packageId: string,
    contextMeta: Record<string, unknown>
  ): { pkg: RlsSubcontractPackageLineageRow; authorizedBoqIds: Set<string> } => {
    const pkg = subconPkgById.get(packageId);
    if (!pkg || pkg.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
        projectId,
        ...contextMeta,
        subcontractPackageId: packageId,
        reason: 'SUBCONTRACT_PACKAGE_NOT_FOUND_FOR_APPROVED_VARIATION',
      });
    }
    if (!APPROVED_SUBCON_PKG_STATUSES.has(String(pkg.status).trim().toUpperCase())) {
      throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
        projectId,
        ...contextMeta,
        subcontractPackageId: pkg.id,
        packageStatus: pkg.status,
        reason: 'SUBCONTRACT_PACKAGE_NOT_APPROVED_FOR_VARIATION',
      });
    }

    let consolBoqSet: Set<string> | null = null;
    if (pkg.consolidatedBoqItemId) {
      if (!snapshotCtx.consolidatedById.has(pkg.consolidatedBoqItemId)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          ...contextMeta,
          subcontractPackageId: pkg.id,
          consolidatedBoqItemId: pkg.consolidatedBoqItemId,
          reason: 'SUBCONTRACT_PACKAGE_CONSOLIDATED_BOQ_NOT_FOUND',
        });
      }
      consolBoqSet = boqIdsByConsolidatedId.get(pkg.consolidatedBoqItemId) ?? new Set<string>();
      if (consolBoqSet.size === 0) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          ...contextMeta,
          subcontractPackageId: pkg.id,
          consolidatedBoqItemId: pkg.consolidatedBoqItemId,
          snapshotId: snapshot.id,
          reason: 'SUBCONTRACT_PACKAGE_CONSOLIDATED_BOQ_NOT_IN_APPROVED_SNAPSHOT',
        });
      }
    }

    const authorizedBoqIds = new Set<string>();
    if (pkg.awardedBoqItemId) {
      if (
        !fullBoqById.has(pkg.awardedBoqItemId) ||
        (snapshotCtx.phaseLinesByBoqId.get(pkg.awardedBoqItemId)?.length ?? 0) === 0
      ) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          ...contextMeta,
          subcontractPackageId: pkg.id,
          awardedBoqItemId: pkg.awardedBoqItemId,
          snapshotId: snapshot.id,
          reason: 'SUBCONTRACT_PACKAGE_AWARDED_BOQ_NOT_IN_APPROVED_SNAPSHOT',
        });
      }
      if (consolBoqSet && !consolBoqSet.has(pkg.awardedBoqItemId)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          ...contextMeta,
          subcontractPackageId: pkg.id,
          awardedBoqItemId: pkg.awardedBoqItemId,
          consolidatedBoqItemId: pkg.consolidatedBoqItemId,
          reason: 'SUBCONTRACT_PACKAGE_AWARDED_AND_CONSOLIDATED_BOQ_CONFLICT',
        });
      }
      authorizedBoqIds.add(pkg.awardedBoqItemId);
    } else if (consolBoqSet) {
      for (const bId of consolBoqSet) {
        authorizedBoqIds.add(bId);
      }
    }

    if (authorizedBoqIds.size === 0) {
      throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
        projectId,
        ...contextMeta,
        subcontractPackageId: pkg.id,
        reason: 'SUBCONTRACT_PACKAGE_MISSING_VERIFIED_BOQ_SNAPSHOT_ALLOCATION',
      });
    }

    return { pkg, authorizedBoqIds };
  };

  const outputVatDec = new Prisma.Decimal(String(taxProfileConfig.outputVatRate));
  const onePlusVat = new Prisma.Decimal(1).plus(outputVatDec);
  const toExVatRevenueDelta = (grossDelta: Prisma.Decimal): Prisma.Decimal => {
    if (grossDelta.isZero()) return zero;
    if (outputVatDec.gt(0) && taxProfileConfig.contractVatInclusive) {
      return grossDelta.div(onePlusVat).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    }
    return grossDelta.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  };

  let excludedNonApprovedVoCount = 0;
  let deduplicatedClientVoMirrorsCount = 0;
  let deduplicatedSubconVoLedgerMirrorsCount = 0;
  let approvedClientVoCount = 0;
  let approvedSubconVoCount = 0;
  let approvedClientVoItemCount = 0;
  let approvedSubconVoItemCount = 0;

  const seenAllVoNumbers = new Map<string, { source: string; approved: boolean }>();
  const approvedClientVoMetaByNo = new Map<
    string,
    { voId: string; boqIds: Set<string>; netRevenueDelta: Prisma.Decimal }
  >();
  const approvedSubconVoMetaByNo = new Map<
    string,
    {
      voId: string;
      packageId: string | null;
      boqIds: Set<string>;
      netCommitmentDelta: Prisma.Decimal;
      netQtyDelta: Prisma.Decimal;
    }
  >();

  const clientVoQtyDeltaByBoqId = new Map<string, Prisma.Decimal>();
  const clientVoAmtDeltaByBoqId = new Map<string, Prisma.Decimal>();
  const subconVoQtyDeltaByPkgBoq = new Map<string, Prisma.Decimal>();

  interface PendingVoRow {
    sortVoNumber: string;
    sortItemNumber: string;
    voId: string;
    voItemId: string;
    voNumber: string;
    voClassification: 'CLIENT_CONTRACT_VO' | 'SUBCONTRACTOR_COMMITMENT_VO';
    qtyScopeBasis: 'CLIENT_CONTRACT_BOQ' | 'SUBCONTRACT_COMMITMENT_PACKAGE';
    phaseLine: (typeof snapshotCtx.phaseLines)[number];
    awardedBoqId: string;
    baselineOrigQtyDec: Prisma.Decimal;
    baselineContractLineAmtDec: Prisma.Decimal;
    voItemPreQtyDec: Prisma.Decimal;
    voQtyDeltaDec: Prisma.Decimal;
    voItemPostQtyDec: Prisma.Decimal;
    effectiveUnitRateDec: Prisma.Decimal;
    clientRevenueDeltaDec: Prisma.Decimal;
    clientRevenueDeltaExVatDec: Prisma.Decimal;
    subconCommitmentDeltaDec: Prisma.Decimal;
    workDescription: string;
  }
  const pendingRows: PendingVoRow[] = [];
  const seenVoItemFingerprints = new Set<string>();

  // 1. Reconcile primary VariationOrder + VariationOrderItem records
  for (const vo of allVariationOrders) {
    if (vo.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const normVoNo = (vo.voNumber || '').trim().toUpperCase();
    if (!normVoNo) {
      throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
        projectId,
        variationOrderId: vo.id,
        reason: 'EMPTY_VARIATION_ORDER_NUMBER',
      });
    }
    const stUpper = (vo.currentStatus || '').trim().toUpperCase();
    const isApproved = stUpper === 'APPROVED';

    const prevSeen = seenAllVoNumbers.get(normVoNo);
    if (prevSeen) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        voNumber: vo.voNumber,
        previousSource: prevSeen.source,
        reason: 'DUPLICATE_VARIATION_ORDER_NUMBER',
      });
    }
    seenAllVoNumbers.set(normVoNo, { source: 'VARIATION_ORDER', approved: isApproved });

    if (!isApproved) {
      excludedNonApprovedVoCount += 1;
      continue;
    }

    // Require approved source document & formal approval action on every approved VariationOrder
    const hasSupportingDoc = vo.documents.some(
      (d) => Boolean(d.fileName?.trim()) && Boolean(d.fileUrl?.trim())
    );
    const hasApprovedAction = vo.approvals.some(
      (a) => a.action?.trim().toUpperCase() === 'APPROVED' && Boolean(a.actionById?.trim())
    );
    if (!hasSupportingDoc || !hasApprovedAction) {
      throw new CanonicalAdapterError('TEMPLATE_VO_SOURCE_DOCUMENT_MISSING', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        hasSupportingDocument: hasSupportingDoc,
        hasApprovedWorkflowAction: hasApprovedAction,
        reason: 'APPROVED_VARIATION_ORDER_MISSING_SOURCE_DOCUMENT_OR_APPROVAL_ACTION',
      });
    }

    const varTypeUpper = (vo.variationType || '').trim().toUpperCase();
    const isSubconVo = vo.subcontractPackageId !== null;
    if (!isSubconVo && (varTypeUpper.includes('SUBCON') || varTypeUpper.includes('COMMITMENT_VO'))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        variationType: vo.variationType,
        reason: 'AMBIGUOUS_SUBCONTRACT_VO_MISSING_PACKAGE_LINK',
      });
    }

    const verifiedSubconPkg = isSubconVo
      ? resolveVerifiedSubconPackageLineage(vo.subcontractPackageId!, {
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
        })
      : null;

    if (
      vo.additionalAmount === null ||
      vo.additionalAmount === undefined ||
      !Number.isFinite(Number(vo.additionalAmount)) ||
      vo.deductiveAmount === null ||
      vo.deductiveAmount === undefined ||
      !Number.isFinite(Number(vo.deductiveAmount)) ||
      vo.netVariationAmount === null ||
      vo.netVariationAmount === undefined ||
      !Number.isFinite(Number(vo.netVariationAmount))
    ) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        reason: 'VO_HEADER_AMOUNT_FIELDS_MISSING_OR_INVALID',
      });
    }
    const headerAddDec = new Prisma.Decimal(String(vo.additionalAmount)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const headerDedDec = new Prisma.Decimal(String(vo.deductiveAmount)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const headerNetDec = new Prisma.Decimal(String(vo.netVariationAmount)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    if (headerAddDec.lt(zero.minus(amtTol)) || headerDedDec.lt(zero.minus(amtTol))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        headerAdditionalAmount: headerAddDec.toFixed(2),
        headerDeductiveAmount: headerDedDec.toFixed(2),
        reason: 'VO_HEADER_NEGATIVE_GROSS_COMPONENT_AMOUNT',
      });
    }
    // D2-R1-IR-02: Unconditionally reconcile header additionalAmount - deductiveAmount == netVariationAmount,
    // including when additionalAmount == 0 and deductiveAmount == 0 or netVariationAmount == 0.
    if (headerAddDec.minus(headerDedDec).minus(headerNetDec).abs().gt(amtTol)) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        headerAdditionalAmount: headerAddDec.toFixed(2),
        headerDeductiveAmount: headerDedDec.toFixed(2),
        headerNetVariationAmount: headerNetDec.toFixed(2),
        reason: 'VO_HEADER_ADDITIVE_MINUS_DEDUCTIVE_DISAGREES_WITH_NET_AMOUNT',
      });
    }

    const voClassification: 'CLIENT_CONTRACT_VO' | 'SUBCONTRACTOR_COMMITMENT_VO' = isSubconVo
      ? 'SUBCONTRACTOR_COMMITMENT_VO'
      : 'CLIENT_CONTRACT_VO';

    const approvedItems: typeof vo.items = [];
    for (const item of vo.items) {
      const itemSt = (item.approvalStatus || '').trim().toUpperCase();
      if (itemSt === 'REJECTED' || itemSt === 'CANCELLED') continue;
      if (itemSt !== 'APPROVED') {
        throw new CanonicalAdapterError('TEMPLATE_VO_ITEM_APPROVAL_INCOMPLETE', 409, {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          approvalStatus: item.approvalStatus,
          reason: 'APPROVED_VO_CONTAINS_UNAPPROVED_LINE_ITEM',
        });
      }
      approvedItems.push(item);
    }

    if (approvedItems.length === 0) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ITEM_APPROVAL_INCOMPLETE', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        reason: 'APPROVED_VO_HAS_ZERO_APPROVED_LINE_ITEMS',
      });
    }

    const voBoqIds = new Set<string>();
    let voGrossAddSum = zero;
    let voGrossDedSum = zero;
    let voNetDeltaSum = zero;
    let voQtyDeltaSum = zero;

    for (const item of approvedItems) {
      if (!item.originalBoqItemId) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          reason: 'VO_ITEM_MISSING_CANONICAL_AWARDED_BOQ_ASSOCIATION',
        });
      }

      const boq = fullBoqById.get(item.originalBoqItemId);
      if (!boq) {
        const foreignBoq = await db.awardedBOQItem.findUnique({
          where: { id: item.originalBoqItemId },
          select: { id: true, projectId: true },
        });
        if (foreignBoq && foreignBoq.projectId !== projectId) {
          throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
        }
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          originalBoqItemId: item.originalBoqItemId,
          reason: 'REFERENCED_AWARDED_BOQ_ITEM_NOT_FOUND',
        });
      }

      const linkedPhaseLines = snapshotCtx.phaseLinesByBoqId.get(boq.id) ?? [];
      if (linkedPhaseLines.length === 0) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          awardedBoqItemId: boq.id,
          snapshotId: snapshot.id,
          reason: 'AWARDED_BOQ_ITEM_NOT_IN_APPROVED_SNAPSHOT_LINEAGE',
        });
      }

      if (verifiedSubconPkg && !verifiedSubconPkg.authorizedBoqIds.has(boq.id)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          subcontractPackageId: verifiedSubconPkg.pkg.id,
          awardedBoqItemId: boq.id,
          authorizedPackageBoqIds: [...verifiedSubconPkg.authorizedBoqIds].sort(),
          reason: 'VO_ITEM_BOQ_MISMATCHES_SUBCONTRACT_PACKAGE_ALLOCATION',
        });
      }

      const itemNoKey = (item.voItemNumber || '').trim().toUpperCase();
      const itemFingerprint = `${normVoNo}::${boq.id}::${itemNoKey}`;
      if (!itemNoKey || seenVoItemFingerprints.has(itemFingerprint)) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          awardedBoqItemId: boq.id,
          reason: 'DUPLICATE_VO_LINE_ITEM_RECOGNITION',
        });
      }
      seenVoItemFingerprints.add(itemFingerprint);
      voBoqIds.add(boq.id);

      const primaryPhaseLine = linkedPhaseLines[0];
      const baselineOrigQtyDec = linkedPhaseLines
        .reduce((acc, pl) => acc.plus(pl.originalQty), zero)
        .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      const baselineContractLineAmtDec = linkedPhaseLines
        .reduce((acc, pl) => acc.plus(pl.contractLineAmount), zero)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      const priorScopeDeltaDec =
        voClassification === 'CLIENT_CONTRACT_VO'
          ? (clientVoQtyDeltaByBoqId.get(boq.id) ?? zero)
          : (subconVoQtyDeltaByPkgBoq.get(`${vo.subcontractPackageId!}::${boq.id}`) ?? zero);

      // D2-R1-IR-03: Deterministic fail-closed quantity reconciliation (resolving pre-VO baseline,
      // full-deduction revisedQuantity == 0 vs omitted revisedQuantity == 0, and sequential multi-VO chains)
      const {
        preVoQtyDec,
        qtyDeltaDec,
        postVoQtyDec,
        isDeductiveClass,
        isAdditiveClass,
      } = reconcileApprovedVoItemQuantities(
        item,
        baselineOrigQtyDec,
        priorScopeDeltaDec,
        voClassification,
        {
          projectId,
          variationOrderId: vo.id,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          awardedBoqItemId: boq.id,
        }
      );

      if (
        item.additionalAmount === null ||
        item.additionalAmount === undefined ||
        !Number.isFinite(Number(item.additionalAmount)) ||
        item.deductiveAmount === null ||
        item.deductiveAmount === undefined ||
        !Number.isFinite(Number(item.deductiveAmount)) ||
        item.netAmount === null ||
        item.netAmount === undefined ||
        !Number.isFinite(Number(item.netAmount))
      ) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          reason: 'VO_ITEM_AMOUNT_FIELDS_MISSING_OR_INVALID',
        });
      }
      const itemAddDec = new Prisma.Decimal(String(item.additionalAmount)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const itemDedDec = new Prisma.Decimal(String(item.deductiveAmount)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const netAmtRaw = new Prisma.Decimal(String(item.netAmount)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      );

      if (itemAddDec.lt(zero.minus(amtTol)) || itemDedDec.lt(zero.minus(amtTol))) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          itemAdditionalAmount: itemAddDec.toFixed(2),
          itemDeductiveAmount: itemDedDec.toFixed(2),
          reason: 'VO_ITEM_NEGATIVE_GROSS_COMPONENT_AMOUNT',
        });
      }
      if (itemAddDec.gt(amtTol) && itemDedDec.gt(amtTol)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          itemAdditionalAmount: itemAddDec.toFixed(2),
          itemDeductiveAmount: itemDedDec.toFixed(2),
          reason: 'VO_ITEM_SIMULTANEOUS_ADDITIVE_AND_DEDUCTIVE_GROSS_AMOUNTS',
        });
      }

      const addMinusDed = itemAddDec
        .minus(itemDedDec)
        .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

      // D2-R1-IR-02: Unconditionally enforce item additionalAmount - deductiveAmount == netAmount,
      // including when netAmount == 0.00 or additionalAmount == 0.00 && deductiveAmount == 0.00!
      if (netAmtRaw.minus(addMinusDed).abs().gt(amtTol)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          itemAdditionalAmount: itemAddDec.toFixed(2),
          itemDeductiveAmount: itemDedDec.toFixed(2),
          itemNetAmount: netAmtRaw.toFixed(2),
          reason: 'VO_ITEM_ADDITIVE_MINUS_DEDUCTIVE_DISAGREES_WITH_NET_AMOUNT',
        });
      }
      const itemDeltaAmtDec = netAmtRaw;

      if (isAdditiveClass && itemDeltaAmtDec.lt(zero.minus(amtTol))) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          itemClassification: item.itemClassification,
          itemNetAmount: itemDeltaAmtDec.toFixed(2),
          reason: 'ADDITIVE_VO_ITEM_HAS_NEGATIVE_NET_AMOUNT',
        });
      }
      if (isDeductiveClass && itemDeltaAmtDec.gt(amtTol)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          itemClassification: item.itemClassification,
          itemNetAmount: itemDeltaAmtDec.toFixed(2),
          reason: 'DEDUCTIVE_VO_ITEM_HAS_POSITIVE_NET_AMOUNT',
        });
      }

      const origUnitCostDec = new Prisma.Decimal(
        String(item.originalUnitCost ?? 0)
      ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      const approvedUnitCostDec = new Prisma.Decimal(
        String(item.approvedUnitCost ?? 0)
      ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      if (origUnitCostDec.lt(zero) || approvedUnitCostDec.lt(zero)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          reason: 'VO_ITEM_NEGATIVE_UNIT_RATE',
        });
      }

      const contractRateDec = primaryPhaseLine.contractUnitRate.toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      );
      const effectiveUnitRateDec =
        voClassification === 'CLIENT_CONTRACT_VO'
          ? approvedUnitCostDec.gt(0)
            ? approvedUnitCostDec
            : contractRateDec
          : contractRateDec;

      if (primaryPhaseLine.pricingType.toUpperCase() === 'UNIT_PRICE') {
        if (voClassification === 'CLIENT_CONTRACT_VO') {
          if (origUnitCostDec.gt(0) && origUnitCostDec.minus(contractRateDec).abs().gt(qtyTol)) {
            throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
              projectId,
              voNumber: vo.voNumber,
              voItemId: item.id,
              voItemNumber: item.voItemNumber,
              originalUnitCost: origUnitCostDec.toFixed(4),
              contractUnitRate: contractRateDec.toFixed(4),
              reason: 'VO_ITEM_ORIGINAL_UNIT_RATE_CONFLICTS_WITH_CONTRACT_RATE',
            });
          }
          const isExplicitRateRev =
            approvedUnitCostDec.gt(0) &&
            contractRateDec.gt(0) &&
            approvedUnitCostDec.minus(contractRateDec).abs().gt(qtyTol);
          const expectedDeltaAmt = isExplicitRateRev
            ? postVoQtyDec
                .mul(approvedUnitCostDec)
                .minus(preVoQtyDec.mul(contractRateDec))
                .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
            : qtyDeltaDec
                .mul(effectiveUnitRateDec)
                .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

          if (itemDeltaAmtDec.minus(expectedDeltaAmt).abs().gt(amtTol)) {
            throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
              projectId,
              voNumber: vo.voNumber,
              voItemId: item.id,
              voItemNumber: item.voItemNumber,
              qtyDelta: qtyDeltaDec.toFixed(4),
              unitRate: effectiveUnitRateDec.toFixed(4),
              expectedDeltaAmount: expectedDeltaAmt.toFixed(2),
              recordedDeltaAmount: itemDeltaAmtDec.toFixed(2),
              reason: 'VO_ITEM_NET_AMOUNT_DISAGREES_WITH_QTY_DELTA_TIMES_RATE',
            });
          }
        } else if (approvedUnitCostDec.gt(0)) {
          const isExplicitSubRateRev =
            origUnitCostDec.gt(0) &&
            approvedUnitCostDec.minus(origUnitCostDec).abs().gt(qtyTol);
          const expectedDeltaAmt = isExplicitSubRateRev
            ? postVoQtyDec
                .mul(approvedUnitCostDec)
                .minus(preVoQtyDec.mul(origUnitCostDec))
                .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
            : qtyDeltaDec
                .mul(approvedUnitCostDec)
                .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
          if (itemDeltaAmtDec.minus(expectedDeltaAmt).abs().gt(amtTol)) {
            throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
              projectId,
              voNumber: vo.voNumber,
              voItemId: item.id,
              voItemNumber: item.voItemNumber,
              qtyDelta: qtyDeltaDec.toFixed(4),
              unitRate: approvedUnitCostDec.toFixed(4),
              expectedDeltaAmount: expectedDeltaAmt.toFixed(2),
              recordedDeltaAmount: itemDeltaAmtDec.toFixed(2),
              reason: 'VO_ITEM_NET_AMOUNT_DISAGREES_WITH_QTY_DELTA_TIMES_RATE',
            });
          }
        } else if (!qtyDeltaDec.isZero() && itemDeltaAmtDec.isZero()) {
          throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
            projectId,
            voNumber: vo.voNumber,
            voItemId: item.id,
            voItemNumber: item.voItemNumber,
            qtyDelta: qtyDeltaDec.toFixed(4),
            recordedDeltaAmount: itemDeltaAmtDec.toFixed(2),
            reason: 'SUBCON_VO_ITEM_NONZERO_QTY_DELTA_WITH_ZERO_NET_AMOUNT',
          });
        } else if (qtyDeltaDec.isZero() && !itemDeltaAmtDec.isZero()) {
          throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
            projectId,
            voNumber: vo.voNumber,
            voItemId: item.id,
            voItemNumber: item.voItemNumber,
            qtyDelta: qtyDeltaDec.toFixed(4),
            recordedDeltaAmount: itemDeltaAmtDec.toFixed(2),
            reason: 'SUBCON_VO_UNIT_PRICE_ITEM_NONZERO_AMOUNT_WITHOUT_RATE_OR_QTY',
          });
        }
      } else if (
        (qtyDeltaDec.gt(qtyTol) && itemDeltaAmtDec.lte(amtTol)) ||
        (qtyDeltaDec.lt(zero.minus(qtyTol)) && itemDeltaAmtDec.gte(zero.minus(amtTol)))
      ) {
        throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
          projectId,
          voNumber: vo.voNumber,
          voItemId: item.id,
          voItemNumber: item.voItemNumber,
          qtyDelta: qtyDeltaDec.toFixed(4),
          recordedDeltaAmount: itemDeltaAmtDec.toFixed(2),
          reason: 'VO_LUMP_SUM_ITEM_QTY_DELTA_CONFLICTS_WITH_ZERO_OR_OPPOSITE_AMOUNT',
        });
      }

      voGrossAddSum = voGrossAddSum.plus(itemAddDec);
      voGrossDedSum = voGrossDedSum.plus(itemDedDec);
      voNetDeltaSum = voNetDeltaSum.plus(itemDeltaAmtDec);
      voQtyDeltaSum = voQtyDeltaSum.plus(qtyDeltaDec);

      let clientRevDeltaDec = zero;
      let clientRevDeltaExVatDec = zero;
      let subconCommDeltaDec = zero;

      if (voClassification === 'CLIENT_CONTRACT_VO') {
        clientRevDeltaDec = itemDeltaAmtDec;
        clientRevDeltaExVatDec = toExVatRevenueDelta(itemDeltaAmtDec);
        clientVoQtyDeltaByBoqId.set(
          boq.id,
          (clientVoQtyDeltaByBoqId.get(boq.id) ?? zero).plus(qtyDeltaDec)
        );
        clientVoAmtDeltaByBoqId.set(
          boq.id,
          (clientVoAmtDeltaByBoqId.get(boq.id) ?? zero).plus(clientRevDeltaDec)
        );
        approvedClientVoItemCount += 1;
      } else {
        subconCommDeltaDec = itemDeltaAmtDec;
        const pkgBoqKey = `${vo.subcontractPackageId!}::${boq.id}`;
        subconVoQtyDeltaByPkgBoq.set(
          pkgBoqKey,
          (subconVoQtyDeltaByPkgBoq.get(pkgBoqKey) ?? zero).plus(qtyDeltaDec)
        );
        approvedSubconVoItemCount += 1;
      }

      pendingRows.push({
        sortVoNumber: normVoNo,
        sortItemNumber: itemNoKey,
        voId: vo.id,
        voItemId: item.id,
        voNumber: vo.voNumber.trim(),
        voClassification,
        qtyScopeBasis:
          voClassification === 'CLIENT_CONTRACT_VO'
            ? 'CLIENT_CONTRACT_BOQ'
            : 'SUBCONTRACT_COMMITMENT_PACKAGE',
        phaseLine: primaryPhaseLine,
        awardedBoqId: boq.id,
        baselineOrigQtyDec,
        baselineContractLineAmtDec,
        voItemPreQtyDec: preVoQtyDec,
        voQtyDeltaDec: qtyDeltaDec,
        voItemPostQtyDec: postVoQtyDec,
        effectiveUnitRateDec,
        clientRevenueDeltaDec: clientRevDeltaDec,
        clientRevenueDeltaExVatDec: clientRevDeltaExVatDec,
        subconCommitmentDeltaDec: subconCommDeltaDec,
        workDescription: item.description?.trim() || primaryPhaseLine.workDescription,
      });
    }

    // D2-IR-02 & D2-R1-IR-02: Unconditionally reconcile header net, gross additive, and gross deductive
    // amounts against approved item totals (including zero-header, zero-item, and balanced zero-net cases).
    if (headerNetDec.minus(voNetDeltaSum).abs().gt(amtTol)) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        headerNetVariationAmount: headerNetDec.toFixed(2),
        approvedItemsNetSum: voNetDeltaSum.toFixed(2),
        reason: 'VO_HEADER_NET_AMOUNT_DISAGREES_WITH_APPROVED_ITEMS_SUM',
      });
    }
    if (headerAddDec.minus(voGrossAddSum).abs().gt(amtTol)) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        headerAdditionalAmount: headerAddDec.toFixed(2),
        approvedItemsAdditionalSum: voGrossAddSum.toFixed(2),
        reason: 'VO_HEADER_ADDITIONAL_AMOUNT_DISAGREES_WITH_APPROVED_ITEMS_SUM',
      });
    }
    if (headerDedDec.minus(voGrossDedSum).abs().gt(amtTol)) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        variationOrderId: vo.id,
        voNumber: vo.voNumber,
        headerDeductiveAmount: headerDedDec.toFixed(2),
        approvedItemsDeductiveSum: voGrossDedSum.toFixed(2),
        reason: 'VO_HEADER_DEDUCTIVE_AMOUNT_DISAGREES_WITH_APPROVED_ITEMS_SUM',
      });
    }

    if (voClassification === 'CLIENT_CONTRACT_VO') {
      approvedClientVoCount += 1;
      approvedClientVoMetaByNo.set(normVoNo, {
        voId: vo.id,
        boqIds: voBoqIds,
        netRevenueDelta: voNetDeltaSum,
      });
    } else {
      approvedSubconVoCount += 1;
      approvedSubconVoMetaByNo.set(normVoNo, {
        voId: vo.id,
        packageId: vo.subcontractPackageId,
        boqIds: voBoqIds,
        netCommitmentDelta: voNetDeltaSum,
        netQtyDelta: voQtyDeltaSum,
      });
    }
  }

  // 2. Reconcile ClientVariationOrder mirror/orphan table (prevent duplicate recognition or unverified orphan CVOs)
  const seenCvoNumbers = new Set<string>();
  for (const cvo of allClientVos) {
    if (cvo.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const normCvoNo = (cvo.cvoNumber || '').trim().toUpperCase();
    if (!normCvoNo || seenCvoNumbers.has(normCvoNo)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        clientVariationOrderId: cvo.id,
        cvoNumber: cvo.cvoNumber,
        reason: 'DUPLICATE_OR_EMPTY_CLIENT_VO_NUMBER',
      });
    }
    seenCvoNumbers.add(normCvoNo);

    const cvoSt = (cvo.status || '').trim().toUpperCase();
    if (cvoSt !== 'APPROVED') {
      if (approvedClientVoMetaByNo.has(normCvoNo) || approvedSubconVoMetaByNo.has(normCvoNo)) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
          projectId,
          clientVariationOrderId: cvo.id,
          cvoNumber: cvo.cvoNumber,
          cvoStatus: cvo.status,
          reason: 'CONFLICTING_STATUS_FOR_APPROVED_VO_NUMBER',
        });
      }
      excludedNonApprovedVoCount += 1;
      continue;
    }

    const matchedClientVo = approvedClientVoMetaByNo.get(normCvoNo);
    if (!matchedClientVo) {
      if (approvedSubconVoMetaByNo.has(normCvoNo)) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
          projectId,
          clientVariationOrderId: cvo.id,
          cvoNumber: cvo.cvoNumber,
          reason: 'CLIENT_VO_NUMBER_COLLIDES_WITH_SUBCONTRACTOR_VO',
        });
      }
      throw new CanonicalAdapterError('TEMPLATE_VO_SOURCE_DOCUMENT_MISSING', 409, {
        projectId,
        clientVariationOrderId: cvo.id,
        cvoNumber: cvo.cvoNumber,
        reason: 'APPROVED_CLIENT_VO_MISSING_CANONICAL_VARIATION_ORDER_ITEMS_AND_DOCUMENTS',
      });
    }

    if (cvo.awardedBoqItemId && !matchedClientVo.boqIds.has(cvo.awardedBoqItemId)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        clientVariationOrderId: cvo.id,
        cvoNumber: cvo.cvoNumber,
        awardedBoqItemId: cvo.awardedBoqItemId,
        reason: 'CLIENT_VO_MIRROR_BOQ_ITEM_CONFLICTS_WITH_CANONICAL_VARIATION_ORDER',
      });
    }

    deduplicatedClientVoMirrorsCount += 1;
  }

  // 3. Reconcile SubcontractorVariationOrder authorities (deduplicating exact mirrors & failing closed on conflicts)
  const seenSvoNumbers = new Set<string>();
  for (const svo of allSubconVos) {
    if (svo.projectId !== projectId) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const normSvoNo = (svo.svoNumber || '').trim().toUpperCase();
    if (!normSvoNo || seenSvoNumbers.has(normSvoNo)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        reason: 'DUPLICATE_OR_EMPTY_SUBCONTRACTOR_VO_NUMBER',
      });
    }
    seenSvoNumbers.add(normSvoNo);

    const svoSt = (svo.approvalStatus || '').trim().toUpperCase();
    if (svoSt !== 'APPROVED') {
      if (approvedSubconVoMetaByNo.has(normSvoNo) || approvedClientVoMetaByNo.has(normSvoNo)) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          approvalStatus: svo.approvalStatus,
          reason: 'CONFLICTING_STATUS_FOR_SUBCONTRACTOR_VO_NUMBER',
        });
      }
      excludedNonApprovedVoCount += 1;
      continue;
    }

    if (approvedClientVoMetaByNo.has(normSvoNo)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        reason: 'SUBCONTRACTOR_VO_NUMBER_COLLIDES_WITH_CLIENT_CONTRACT_VO',
      });
    }

    if (
      (svo.originalSubcontractAmt !== null &&
        svo.originalSubcontractAmt !== undefined &&
        !Number.isFinite(Number(svo.originalSubcontractAmt))) ||
      (svo.proposedAdditionalAmt !== null &&
        svo.proposedAdditionalAmt !== undefined &&
        !Number.isFinite(Number(svo.proposedAdditionalAmt))) ||
      (svo.revisedSubcontractAmt !== null &&
        svo.revisedSubcontractAmt !== undefined &&
        !Number.isFinite(Number(svo.revisedSubcontractAmt)))
    ) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        reason: 'SUBCONTRACTOR_VO_AMOUNT_NON_FINITE',
      });
    }

    const origAmtDec = new Prisma.Decimal(String(svo.originalSubcontractAmt ?? 0)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const revAmtDec = new Prisma.Decimal(String(svo.revisedSubcontractAmt ?? 0)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const propAmtDec = new Prisma.Decimal(String(svo.proposedAdditionalAmt ?? 0)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );

    if (origAmtDec.lt(zero.minus(amtTol)) || revAmtDec.lt(zero.minus(amtTol))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        originalSubcontractAmt: origAmtDec.toFixed(2),
        revisedSubcontractAmt: revAmtDec.toFixed(2),
        reason: 'SUBCONTRACTOR_VO_NEGATIVE_BASELINE_OR_REVISED_AMOUNT',
      });
    }

    // D2-R1-IR-02: Unconditionally enforce originalSubcontractAmt + proposedAdditionalAmt == revisedSubcontractAmt
    // across ALL zero and non-zero combinations (never bypass when original, proposed, or revised amount is 0).
    if (origAmtDec.plus(propAmtDec).minus(revAmtDec).abs().gt(amtTol)) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        originalSubcontractAmt: origAmtDec.toFixed(2),
        proposedAdditionalAmt: propAmtDec.toFixed(2),
        revisedSubcontractAmt: revAmtDec.toFixed(2),
        expectedRevisedSubcontractAmt: origAmtDec.plus(propAmtDec).toFixed(2),
        reason: 'SUBCONTRACTOR_VO_REVISED_AMOUNT_CONFLICTS_WITH_PROPOSED_DELTA',
      });
    }
    const svoDeltaAmtDec = propAmtDec;

    if (
      (svo.originalSubcontractQty !== null &&
        svo.originalSubcontractQty !== undefined &&
        !Number.isFinite(Number(svo.originalSubcontractQty))) ||
      (svo.proposedAdditionalQty !== null &&
        svo.proposedAdditionalQty !== undefined &&
        !Number.isFinite(Number(svo.proposedAdditionalQty))) ||
      (svo.revisedSubcontractQty !== null &&
        svo.revisedSubcontractQty !== undefined &&
        !Number.isFinite(Number(svo.revisedSubcontractQty)))
    ) {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        reason: 'SUBCONTRACTOR_VO_QUANTITY_NON_FINITE',
      });
    }

    const origSubQty = new Prisma.Decimal(String(svo.originalSubcontractQty ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const revSubQty = new Prisma.Decimal(String(svo.revisedSubcontractQty ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const propSubQty = new Prisma.Decimal(String(svo.proposedAdditionalQty ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );

    if (origSubQty.lt(zero.minus(qtyTol)) || revSubQty.lt(zero.minus(qtyTol))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        originalSubcontractQty: origSubQty.toFixed(4),
        revisedSubcontractQty: revSubQty.toFixed(4),
        reason: 'SUBCONTRACTOR_VO_NEGATIVE_BASELINE_OR_REVISED_QUANTITY',
      });
    }

    // D2-R1-IR-03: Unconditionally enforce originalSubcontractQty + proposedAdditionalQty == revisedSubcontractQty
    // so an unpopulated 0 revisedSubcontractQty is never silently mistaken for a 100% deductive scope wipeout.
    if (origSubQty.plus(propSubQty).minus(revSubQty).abs().gt(qtyTol)) {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        originalSubcontractQty: origSubQty.toFixed(4),
        proposedAdditionalQty: propSubQty.toFixed(4),
        revisedSubcontractQty: revSubQty.toFixed(4),
        expectedRevisedSubcontractQty: origSubQty.plus(propSubQty).toFixed(4),
        reason: 'SUBCONTRACTOR_VO_REVISED_QUANTITY_CONFLICTS_WITH_PROPOSED_DELTA',
      });
    }
    const svoQtyDeltaDec = propSubQty;

    // D2-R1-IR-02: Non-zero SVO quantity delta with zero amount delta or conflicting sign is arithmetically invalid.
    if (!svoQtyDeltaDec.isZero() && svoDeltaAmtDec.isZero()) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        svoQuantityDelta: svoQtyDeltaDec.toFixed(4),
        svoAmountDelta: svoDeltaAmtDec.toFixed(2),
        reason: 'SUBCONTRACTOR_VO_NON_ZERO_QUANTITY_DELTA_WITH_ZERO_AMOUNT',
      });
    }
    if (
      (svoQtyDeltaDec.gt(qtyTol) && svoDeltaAmtDec.lt(zero.minus(amtTol))) ||
      (svoQtyDeltaDec.lt(zero.minus(qtyTol)) && svoDeltaAmtDec.gt(amtTol))
    ) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        svoQuantityDelta: svoQtyDeltaDec.toFixed(4),
        svoAmountDelta: svoDeltaAmtDec.toFixed(2),
        reason: 'SUBCONTRACTOR_VO_QUANTITY_AND_AMOUNT_SIGN_CONFLICT',
      });
    }

    const existingSubconVo = approvedSubconVoMetaByNo.get(normSvoNo);
    if (existingSubconVo) {
      if (!svo.approvedById?.trim()) {
        throw new CanonicalAdapterError('TEMPLATE_VO_SOURCE_DOCUMENT_MISSING', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          reason: 'APPROVED_SVO_MIRROR_MISSING_APPROVAL_AUTHORITY',
        });
      }
      if (!svo.originalSubcontractId?.trim()) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          reason: 'APPROVED_SVO_MIRROR_MISSING_SUBCONTRACT_PACKAGE_ASSOCIATION',
        });
      }
      const pkgMismatch =
        !existingSubconVo.packageId || svo.originalSubcontractId.trim() !== existingSubconVo.packageId;
      const boqMismatch =
        Boolean(svo.awardedBoqItemId) && !existingSubconVo.boqIds.has(svo.awardedBoqItemId!);
      const amtMismatch = existingSubconVo.netCommitmentDelta.minus(svoDeltaAmtDec).abs().gt(amtTol);
      const qtyMismatch = existingSubconVo.netQtyDelta.minus(svoQtyDeltaDec).abs().gt(qtyTol);
      if (pkgMismatch || boqMismatch || amtMismatch || qtyMismatch) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          existingNetCommitmentDelta: existingSubconVo.netCommitmentDelta.toFixed(2),
          svoDeltaAmount: svoDeltaAmtDec.toFixed(2),
          existingNetQtyDelta: existingSubconVo.netQtyDelta.toFixed(4),
          svoQtyDelta: svoQtyDeltaDec.toFixed(4),
          reason: 'CONFLICTING_OVERLAPPING_SUBCONTRACTOR_VO_RECORDS',
        });
      }
      deduplicatedSubconVoLedgerMirrorsCount += 1;
      continue;
    }

    // D2-IR-03: Require BOTH approval authority AND a verified approved SubcontractPackage association.
    // Free-text `svo.reason` NEVER substitutes for `svo.originalSubcontractId`.
    if (!svo.approvedById?.trim()) {
      throw new CanonicalAdapterError('TEMPLATE_VO_SOURCE_DOCUMENT_MISSING', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        hasApprovedById: false,
        reason: 'APPROVED_SUBCONTRACTOR_VO_MISSING_APPROVAL_AUTHORITY',
      });
    }
    if (!svo.originalSubcontractId?.trim()) {
      throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        hasReasonTextOnly: Boolean(svo.reason?.trim()),
        reason: 'APPROVED_SUBCONTRACTOR_VO_MISSING_VERIFIED_SUBCONTRACT_PACKAGE_ASSOCIATION',
      });
    }

    const { pkg: linkedPkg, authorizedBoqIds } = resolveVerifiedSubconPackageLineage(
      svo.originalSubcontractId.trim(),
      {
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
      }
    );

    let svoConsolBoqSet: Set<string> | null = null;
    if (svo.consolidatedBoqItemId) {
      if (!snapshotCtx.consolidatedById.has(svo.consolidatedBoqItemId)) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          consolidatedBoqItemId: svo.consolidatedBoqItemId,
          reason: 'SVO_CONSOLIDATED_BOQ_NOT_FOUND',
        });
      }
      if (
        linkedPkg.consolidatedBoqItemId &&
        svo.consolidatedBoqItemId !== linkedPkg.consolidatedBoqItemId
      ) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          svoConsolidatedBoqItemId: svo.consolidatedBoqItemId,
          packageConsolidatedBoqItemId: linkedPkg.consolidatedBoqItemId,
          reason: 'SVO_CONSOLIDATED_BOQ_CONFLICTS_WITH_SUBCONTRACT_PACKAGE',
        });
      }
      const mappedFromConsol = boqIdsByConsolidatedId.get(svo.consolidatedBoqItemId) ?? new Set<string>();
      svoConsolBoqSet = new Set([...mappedFromConsol].filter((bId) => authorizedBoqIds.has(bId)));
      if (svoConsolBoqSet.size === 0) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          consolidatedBoqItemId: svo.consolidatedBoqItemId,
          subcontractPackageId: linkedPkg.id,
          reason: 'SVO_CONSOLIDATED_BOQ_MISMATCHES_SUBCONTRACT_PACKAGE_ALLOCATION',
        });
      }
    }

    // Resolve canonical AwardedBOQItem & enforce strict package-to-BOQ allocation consistency
    let resolvedBoqId: string | null = null;
    if (svo.awardedBoqItemId) {
      const boq = fullBoqById.get(svo.awardedBoqItemId);
      if (!boq) {
        const foreignBoq = await db.awardedBOQItem.findUnique({
          where: { id: svo.awardedBoqItemId },
          select: { id: true, projectId: true },
        });
        if (foreignBoq && foreignBoq.projectId !== projectId) {
          throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
        }
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          awardedBoqItemId: svo.awardedBoqItemId,
          reason: 'SVO_REFERENCED_AWARDED_BOQ_ITEM_NOT_FOUND',
        });
      }
      if (!authorizedBoqIds.has(boq.id) || (svoConsolBoqSet && !svoConsolBoqSet.has(boq.id))) {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          subcontractPackageId: linkedPkg.id,
          svoAwardedBoqItemId: boq.id,
          authorizedPackageBoqIds: [...authorizedBoqIds].sort(),
          reason: 'SVO_AWARDED_BOQ_MISMATCHES_SUBCONTRACT_PACKAGE_ALLOCATION',
        });
      }
      resolvedBoqId = boq.id;
    } else {
      const candidateSet = svoConsolBoqSet ?? authorizedBoqIds;
      if (candidateSet.size === 1) {
        resolvedBoqId = [...candidateSet][0];
      } else {
        throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
          projectId,
          subcontractorVoId: svo.id,
          svoNumber: svo.svoNumber,
          subcontractPackageId: linkedPkg.id,
          authorizedPackageBoqCount: candidateSet.size,
          reason: 'SVO_MULTI_LINE_PACKAGE_REQUIRES_EXPLICIT_AWARDED_BOQ_ALLOCATION',
        });
      }
    }

    const resolvedPhaseLines = resolvedBoqId
      ? snapshotCtx.phaseLinesByBoqId.get(resolvedBoqId) ?? []
      : [];
    if (!resolvedBoqId || resolvedPhaseLines.length === 0) {
      throw new CanonicalAdapterError('TEMPLATE_VO_LINEAGE_UNVERIFIED', 409, {
        projectId,
        subcontractorVoId: svo.id,
        svoNumber: svo.svoNumber,
        awardedBoqItemId: svo.awardedBoqItemId,
        consolidatedBoqItemId: svo.consolidatedBoqItemId,
        reason: 'SVO_MISSING_OR_AMBIGUOUS_CANONICAL_SNAPSHOT_LINEAGE',
      });
    }

    const primaryPhaseLine = resolvedPhaseLines[0];
    const baselineOrigQtyDec = resolvedPhaseLines
      .reduce((acc, pl) => acc.plus(pl.originalQty), zero)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const baselineContractLineAmtDec = resolvedPhaseLines
      .reduce((acc, pl) => acc.plus(pl.contractLineAmount), zero)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    pendingRows.push({
      sortVoNumber: normSvoNo,
      sortItemNumber: '001',
      voId: svo.id,
      voItemId: svo.id,
      voNumber: svo.svoNumber.trim(),
      voClassification: 'SUBCONTRACTOR_COMMITMENT_VO',
      qtyScopeBasis: 'SUBCONTRACT_COMMITMENT_PACKAGE',
      phaseLine: primaryPhaseLine,
      awardedBoqId: resolvedBoqId,
      baselineOrigQtyDec,
      baselineContractLineAmtDec,
      voItemPreQtyDec: origSubQty,
      voQtyDeltaDec: svoQtyDeltaDec,
      voItemPostQtyDec: revSubQty,
      effectiveUnitRateDec: primaryPhaseLine.contractUnitRate.toDecimalPlaces(
        4,
        Prisma.Decimal.ROUND_HALF_UP
      ),
      clientRevenueDeltaDec: zero,
      clientRevenueDeltaExVatDec: zero,
      subconCommitmentDeltaDec: svoDeltaAmtDec,
      workDescription: svo.reason?.trim() || primaryPhaseLine.workDescription,
    });

    approvedSubconVoCount += 1;
    approvedSubconVoItemCount += 1;
    approvedSubconVoMetaByNo.set(normSvoNo, {
      voId: svo.id,
      packageId: svo.originalSubcontractId,
      boqIds: new Set([resolvedBoqId]),
      netCommitmentDelta: svoDeltaAmtDec,
      netQtyDelta: svoQtyDeltaDec,
    });
  }

  // 4. Reconcile CommitmentLedger VO mirror entries (prevent duplicate commitment recognition or client-VO leakage)
  const seenLedgerVoRefs = new Set<string>();
  for (const cl of allCommitmentLedgers) {
    const clSt = (cl.status || '').trim().toUpperCase();
    if (!APPROVED_COMMITMENT_LEDGER_STATUSES.has(clSt)) continue;
    const typeUpper = (cl.commitmentType || '').trim().toUpperCase();
    const cvoLedgerMatch = typeUpper.match(/^(?:CVO|CLIENT_VO)[:#/-]?(.+)?$/);
    if (cvoLedgerMatch) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        commitmentLedgerId: cl.id,
        commitmentType: cl.commitmentType,
        reason: 'CLIENT_CONTRACT_VO_CANNOT_BE_RECOGNIZED_AS_COST_COMMITMENT',
      });
    }

    const svoLedgerMatch = typeUpper.match(
      /^(?:SVO|SUBCON_VO|SUBCONTRACT_VO|SUBCONTRACT_VARIATION_ORDER|VO|VARIATION_ORDER)[:#/-](.+)$/
    );
    if (!svoLedgerMatch) {
      if (
        typeUpper === 'SVO' ||
        typeUpper === 'SUBCONTRACT_VARIATION_ORDER' ||
        typeUpper === 'VARIATION_ORDER'
      ) {
        throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
          projectId,
          commitmentLedgerId: cl.id,
          commitmentType: cl.commitmentType,
          reason: 'AMBIGUOUS_VO_COMMITMENT_LEDGER_MISSING_EXPLICIT_REFERENCE',
        });
      }
      continue;
    }

    const voRefUpper = svoLedgerMatch[1].trim().toUpperCase();
    if (seenLedgerVoRefs.has(voRefUpper)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        commitmentLedgerId: cl.id,
        voReference: voRefUpper,
        reason: 'DUPLICATE_VO_COMMITMENT_LEDGER_ENTRY',
      });
    }
    seenLedgerVoRefs.add(voRefUpper);

    if (approvedClientVoMetaByNo.has(voRefUpper)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        commitmentLedgerId: cl.id,
        voReference: voRefUpper,
        reason: 'CLIENT_VO_DUPLICATED_IN_COMMITMENT_LEDGER',
      });
    }

    const matchedSvo = approvedSubconVoMetaByNo.get(voRefUpper);
    const clAmtDec = new Prisma.Decimal(String(cl.approvedAmount ?? 0)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    if (!matchedSvo || matchedSvo.netCommitmentDelta.minus(clAmtDec).abs().gt(amtTol)) {
      throw new CanonicalAdapterError('TEMPLATE_DUPLICATE_VO_RECOGNITION', 409, {
        projectId,
        commitmentLedgerId: cl.id,
        voReference: voRefUpper,
        ledgerApprovedAmount: clAmtDec.toFixed(2),
        matchedSubconVoDelta: matchedSvo ? matchedSvo.netCommitmentDelta.toFixed(2) : null,
        reason: 'COMMITMENT_LEDGER_VO_CONFLICTS_WITH_OR_LACKS_APPROVED_SUBCONTRACTOR_VO',
      });
    }

    deduplicatedSubconVoLedgerMirrorsCount += 1;
  }

  // 5. Enforce baseline immutability & zero-revised-quantity disambiguation on AwardedBOQItem VO fields
  for (const boq of fullBoqItems) {
    const verifiedClientVoQtyDec = (clientVoQtyDeltaByBoqId.get(boq.id) ?? zero).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const verifiedClientVoAmtDec = (clientVoAmtDeltaByBoqId.get(boq.id) ?? zero).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );

    const boqApprovedVoQtyDec = new Prisma.Decimal(
      String(boq.approvedClientVoQuantity ?? 0)
    ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const baseQtyDec = new Prisma.Decimal(String(boq.quantity ?? 0)).toDecimalPlaces(
      4,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const revContractQtyDec = new Prisma.Decimal(
      String(boq.revisedContractQuantity ?? 0)
    ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const baseAmtDec = new Prisma.Decimal(String(boq.totalCost ?? 0)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const revContractAmtDec = new Prisma.Decimal(
      String(boq.revisedContractAmount ?? 0)
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    const expectedRevQty = baseQtyDec
      .plus(verifiedClientVoQtyDec)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const expectedRevAmt = baseAmtDec
      .plus(verifiedClientVoAmtDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    if (expectedRevQty.lt(zero.minus(qtyTol))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_REVISED_QUANTITY_AMBIGUOUS', 409, {
        projectId,
        awardedBoqItemId: boq.id,
        itemCode: boq.itemCode,
        baselineQuantity: baseQtyDec.toFixed(4),
        verifiedApprovedClientVoQtyDelta: verifiedClientVoQtyDec.toFixed(4),
        expectedRevisedContractQuantity: expectedRevQty.toFixed(4),
        reason: 'CUMULATIVE_CLIENT_VO_DEDUCTION_EXCEEDS_AWARDED_BOQ_BASELINE_QUANTITY',
      });
    }
    if (expectedRevAmt.lt(zero.minus(amtTol))) {
      throw new CanonicalAdapterError('TEMPLATE_VO_ARITHMETIC_MISMATCH', 409, {
        projectId,
        awardedBoqItemId: boq.id,
        itemCode: boq.itemCode,
        baselineAmount: baseAmtDec.toFixed(2),
        verifiedApprovedClientVoAmtDelta: verifiedClientVoAmtDec.toFixed(2),
        expectedRevisedContractAmount: expectedRevAmt.toFixed(2),
        reason: 'CUMULATIVE_CLIENT_VO_DEDUCTION_EXCEEDS_AWARDED_BOQ_BASELINE_AMOUNT',
      });
    }

    // D2-R1-IR-03: Whenever ANY VO tracking field on AwardedBOQItem is populated (non-zero),
    // ALL THREE materialized tracking fields (approvedClientVoQuantity, revisedContractQuantity,
    // revisedContractAmount) MUST reconcile against verified Client VO deltas — including when
    // revisedContractQuantity == 0 or revisedContractAmount == 0 (allowing 0 == 0 ONLY on a
    // verified 100% deductive Client VO, and rejecting partial/zeroed tracking fields!).
    const hasAnyBoqVoTracking =
      !boqApprovedVoQtyDec.isZero() || !revContractQtyDec.isZero() || !revContractAmtDec.isZero();

    if (
      hasAnyBoqVoTracking &&
      boqApprovedVoQtyDec.minus(verifiedClientVoQtyDec).abs().gt(qtyTol)
    ) {
      throw new CanonicalAdapterError('TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION', 409, {
        projectId,
        awardedBoqItemId: boq.id,
        itemCode: boq.itemCode,
        boqApprovedClientVoQuantity: boqApprovedVoQtyDec.toFixed(4),
        verifiedApprovedClientVoQtyDelta: verifiedClientVoQtyDec.toFixed(4),
        reason: 'UNAPPROVED_OR_MISMATCHED_AWARDED_BOQ_CLIENT_VO_QUANTITY',
      });
    }

    if (hasAnyBoqVoTracking && revContractQtyDec.minus(expectedRevQty).abs().gt(qtyTol)) {
      throw new CanonicalAdapterError('TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION', 409, {
        projectId,
        awardedBoqItemId: boq.id,
        itemCode: boq.itemCode,
        revisedContractQuantity: revContractQtyDec.toFixed(4),
        expectedRevisedContractQuantity: expectedRevQty.toFixed(4),
        reason: 'UNAUTHORIZED_AWARDED_BOQ_REVISED_QUANTITY_MODIFICATION',
      });
    }

    if (hasAnyBoqVoTracking && revContractAmtDec.minus(expectedRevAmt).abs().gt(amtTol)) {
      throw new CanonicalAdapterError('TEMPLATE_UNAUTHORIZED_BOQ_VO_MUTATION', 409, {
        projectId,
        awardedBoqItemId: boq.id,
        itemCode: boq.itemCode,
        revisedContractAmount: revContractAmtDec.toFixed(2),
        expectedRevisedContractAmount: expectedRevAmt.toFixed(2),
        reason: 'UNAUTHORIZED_AWARDED_BOQ_REVISED_AMOUNT_MODIFICATION',
      });
    }
  }

  pendingRows.sort(
    (a, b) =>
      a.sortVoNumber.localeCompare(b.sortVoNumber) ||
      a.sortItemNumber.localeCompare(b.sortItemNumber) ||
      a.voItemId.localeCompare(b.voItemId)
  );

  const clientVoRevenueDeltaTotalDec = pendingRows
    .reduce((acc, r) => acc.plus(r.clientRevenueDeltaDec), zero)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const clientVoRevenueDeltaExVatTotalDec = pendingRows
    .reduce((acc, r) => acc.plus(r.clientRevenueDeltaExVatDec), zero)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const subconCommitmentVoDeltaTotalDec = pendingRows
    .reduce((acc, r) => acc.plus(r.subconCommitmentDeltaDec), zero)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const baseContractAwardDec = ca.awardedRevenue.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  const baseAwardedRevenueExVatDec = ca.awardedRevenueExVat.toDecimalPlaces(
    2,
    Prisma.Decimal.ROUND_HALF_UP
  );
  const revisedContractValueTotalDec = baseContractAwardDec
    .plus(clientVoRevenueDeltaTotalDec)
    .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

  const rows: Array<Record<string, unknown>> = pendingRows.map((r) => {
    const cumClientQtyDeltaForBoq = (
      clientVoQtyDeltaByBoqId.get(r.awardedBoqId) ?? zero
    ).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const cumClientAmtDeltaForBoq = (
      clientVoAmtDeltaByBoqId.get(r.awardedBoqId) ?? zero
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    // Client-contract revised quantity & line amount reflect approved CLIENT VOs ONLY;
    // Subcontractor commitment VOs NEVER modify client quantity entitlement or client contract revenue!
    const clientApprovedRevisedQtyDec = r.baselineOrigQtyDec
      .plus(cumClientQtyDeltaForBoq)
      .toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const clientApprovedRevisedLineAmtDec = r.baselineContractLineAmtDec
      .plus(cumClientAmtDeltaForBoq)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    return {
      project_id: projectId,
      snapshot_id: snapshot.id,
      snapshot_version: `v${snapshot.versionNumber}`,
      supersedes_id: snapshot.supersedesSnapshotId ?? null,
      contract_id: ca.id,
      contract_ref: ca.contractRef ?? ca.id,
      vo_reference: r.voNumber,
      vo_id: r.voId,
      vo_item_id: r.voItemId,
      boq_line_id: r.phaseLine.id,
      awarded_boq_item_id: r.awardedBoqId,
      vo_number: r.voNumber,
      vo_classification: r.voClassification,
      vo_qty_scope_basis: r.qtyScopeBasis,
      phase_code: r.phaseLine.phaseCode,
      section_code: r.phaseLine.sectionCode ?? null,
      item_code: r.phaseLine.itemCode,
      work_description: r.workDescription,
      specification: r.phaseLine.specification ?? null,
      unit: r.phaseLine.unitNormalized,
      pricing_type: r.phaseLine.pricingType,
      original_qty: r.baselineOrigQtyDec.toFixed(4),
      vo_item_pre_qty: r.voItemPreQtyDec.toFixed(4),
      vo_approved_qty_delta: r.voQtyDeltaDec.toFixed(4),
      vo_item_post_qty: r.voItemPostQtyDec.toFixed(4),
      approved_qty: clientApprovedRevisedQtyDec.toFixed(4),
      contract_unit_rate: r.effectiveUnitRateDec.toFixed(4),
      contract_line_amount: clientApprovedRevisedLineAmtDec.toFixed(2),
      vo_client_revenue_delta_amt: r.clientRevenueDeltaDec.toFixed(2),
      vo_client_revenue_delta_ex_vat: r.clientRevenueDeltaExVatDec.toFixed(2),
      ...(canReadSensitive
        ? {
            vo_subcon_commitment_delta_amt: r.subconCommitmentDeltaDec.toFixed(2),
          }
        : {}),
      awarded_revenue: baseContractAwardDec.toFixed(2),
      current_contract_value: revisedContractValueTotalDec.toFixed(2),
    };
  });

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'contract_id',
    'boq_line_id',
    'awarded_boq_item_id',
    'vo_id',
    'vo_item_id',
    'vo_qty_scope_basis',
    'vo_item_pre_qty',
    'vo_item_post_qty',
    'phase_code',
    'section_code',
    'vo_client_revenue_delta_ex_vat',
    ...(canReadSensitive ? (['vo_subcon_commitment_delta_amt'] as const) : []),
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: `v${snapshot.versionNumber}`,
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById!,
    approvedAtIso: snapshot.approvedAt!.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
    variationRegisterSummary: {
      snapshotId: snapshot.id,
      snapshotVersionNumber: snapshot.versionNumber,
      supersedesSnapshotId: snapshot.supersedesSnapshotId ?? null,
      contractAuthorityId: ca.id,
      contractRef: ca.contractRef ?? null,
      originalContractAwardAmount: baseContractAwardDec.toFixed(2),
      awardedRevenueExVat: baseAwardedRevenueExVatDec.toFixed(2),
      approvedClientVoCount,
      approvedSubconVoCount,
      approvedClientVoItemCount,
      approvedSubconVoItemCount,
      excludedNonApprovedVoCount,
      deduplicatedClientVoMirrorsCount,
      deduplicatedSubconVoLedgerMirrorsCount,
      clientVoRevenueDeltaTotal: clientVoRevenueDeltaTotalDec.toFixed(2),
      clientVoRevenueDeltaExVatTotal: clientVoRevenueDeltaExVatTotalDec.toFixed(2),
      revisedContractValueTotal: revisedContractValueTotalDec.toFixed(2),
      subconCommitmentVoDeltaTotal: canReadSensitive
        ? subconCommitmentVoDeltaTotalDec.toFixed(2)
        : null,
    },
  };
}

export async function loadT12CashflowVarianceTreasuryCanonicalData(
  db: Prisma.TransactionClient,
  projectId: string,
  sourceId: string,
  roleCtx: BatchCActorRoleContext
): Promise<LoadedTemplateCanonicalData> {
  const zero = new Prisma.Decimal(0);
  const projectionRole = resolveNarrowestFieldRole(roleCtx.effectiveRole, roleCtx.fieldAccessRole);
  const canReadSensitive = getPermittedVisibilityTiers(projectionRole).has('sensitive');

  const { snapshot, asOfCutoffIsoDate, computed, cashFlowSummary } =
    await loadReconciledBatchCCashFlowSchedule(db, projectId, sourceId, roleCtx, {
      preservePureBaselineForecastForVariance: true,
    });

  // D2-IR-04: Reconcile verified treasury opening cash (`UboqTreasuryOpeningBalance`) aligned to
  // the schedule start & cutoff boundary. When no verified opening balance exists, never claim
  // actual treasury closing cash or available liquidity — report zero-basis cumulative net project cash movement only.
  const openingRecords = await db.uboqTreasuryOpeningBalance.findMany({
    where: { projectId, snapshotId: snapshot.id },
    orderBy: [{ createdAt: 'desc' }, { id: 'asc' }],
  });
  const activeOpeningRecords = openingRecords.filter(
    (r) => (r.verificationStatus || '').trim().toUpperCase() !== 'VOID'
  );
  if (activeOpeningRecords.length > 1) {
    throw new CanonicalAdapterError('TEMPLATE_TREASURY_OPENING_BALANCE_UNVERIFIED', 409, {
      projectId,
      snapshotId: snapshot.id,
      activeRecordCount: activeOpeningRecords.length,
      reason: 'MULTIPLE_ACTIVE_TREASURY_OPENING_BALANCE_RECORDS',
    });
  }

  const firstPeriodStartIso = computed.periods[0]
    ? computed.periods[0].periodStart.toISOString().slice(0, 10)
    : null;

  let actualTreasuryLiquidityVerified = false;
  let openingBalanceBasis:
    | 'VERIFIED_TREASURY_OPENING_CASH'
    | 'UNVERIFIED_ZERO_BASIS_CUMULATIVE_NET_MOVEMENT' =
    'UNVERIFIED_ZERO_BASIS_CUMULATIVE_NET_MOVEMENT';
  let openingEffectiveDateIso: string | null = null;
  let bankStatementEvidenceRef: string | null = null;
  let openingCashDec = zero;

  if (activeOpeningRecords.length === 1) {
    const ob = activeOpeningRecords[0];
    if (ob.projectId !== projectId || ob.snapshotId !== snapshot.id) {
      throw new CanonicalAdapterError('TEMPLATE_SOURCE_OWNERSHIP_DENIED', 403);
    }
    const obStatus = (ob.verificationStatus || '').trim().toUpperCase();
    if (
      obStatus !== 'VERIFIED' ||
      !ob.verifiedById?.trim() ||
      !ob.verifiedAt ||
      !ob.bankStatementEvidenceRef?.trim()
    ) {
      throw new CanonicalAdapterError('TEMPLATE_TREASURY_OPENING_BALANCE_UNVERIFIED', 409, {
        projectId,
        snapshotId: snapshot.id,
        openingBalanceId: ob.id,
        verificationStatus: ob.verificationStatus,
        reason: 'TREASURY_OPENING_BALANCE_RECORD_NOT_VERIFIED',
      });
    }
    const obDateIso = ob.openingEffectiveDate.toISOString().slice(0, 10);
    if (!firstPeriodStartIso || obDateIso !== firstPeriodStartIso || obDateIso > asOfCutoffIsoDate) {
      throw new CanonicalAdapterError('TEMPLATE_TREASURY_OPENING_BOUNDARY_MISMATCH', 409, {
        projectId,
        snapshotId: snapshot.id,
        openingBalanceId: ob.id,
        openingEffectiveDateIso: obDateIso,
        scheduleFirstPeriodStartIso: firstPeriodStartIso,
        asOfCutoffDateIso: asOfCutoffIsoDate,
        reason:
          obDateIso > asOfCutoffIsoDate
            ? 'TREASURY_OPENING_EFFECTIVE_DATE_AFTER_CUTOFF'
            : 'TREASURY_OPENING_EFFECTIVE_DATE_MISALIGNED_WITH_FIRST_PERIOD_START',
      });
    }
    if (
      ob.openingCashAmt === null ||
      ob.openingCashAmt === undefined ||
      !Number.isFinite(Number(ob.openingCashAmt))
    ) {
      throw new CanonicalAdapterError('TEMPLATE_TREASURY_OPENING_BALANCE_UNVERIFIED', 409, {
        projectId,
        snapshotId: snapshot.id,
        openingBalanceId: ob.id,
        reason: 'TREASURY_OPENING_CASH_AMOUNT_INVALID',
      });
    }

    actualTreasuryLiquidityVerified = true;
    openingBalanceBasis = 'VERIFIED_TREASURY_OPENING_CASH';
    openingEffectiveDateIso = obDateIso;
    bankStatementEvidenceRef = ob.bankStatementEvidenceRef.trim();
    openingCashDec = new Prisma.Decimal(String(ob.openingCashAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
  }

  let runningPositionDec = openingCashDec;
  let peakPositionDeficitOrGapDec = openingCashDec.lt(0)
    ? openingCashDec.negated().toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
    : zero;
  let runningZeroBasisMovementDec = zero;
  let peakZeroBasisDeficitDec = zero;
  let forecastReceiptsTotalDec = zero;
  let actualReceiptsTotalDec = zero;
  let receiptsVarianceTotalDec = zero;
  let totalForecastCashOutTotalDec = zero;
  let actualCashPaidTotalDec = zero;
  let disbursementVarianceTotalDec = zero;

  const rows: Array<Record<string, unknown>> = computed.periods.map((p) => {
    const fcstRecDec = new Prisma.Decimal(String(p.forecastReceiptsAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const actRecDec = new Prisma.Decimal(String(p.actualCashReceiptsAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const procOutDec = new Prisma.Decimal(String(p.procurementCashOutAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const paySubOutDec = new Prisma.Decimal(String(p.payrollSubconCashOutAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const othOutDec = new Prisma.Decimal(String(p.otherCashOutAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    const actPaidDec = new Prisma.Decimal(String(p.actualCashPaidAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );

    runningPositionDec = runningPositionDec
      .plus(actRecDec)
      .minus(actPaidDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const positionGapDec = runningPositionDec.lt(0)
      ? runningPositionDec.negated().toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : zero;
    if (positionGapDec.gt(peakPositionDeficitOrGapDec)) {
      peakPositionDeficitOrGapDec = positionGapDec;
    }

    runningZeroBasisMovementDec = runningZeroBasisMovementDec
      .plus(actRecDec)
      .minus(actPaidDec)
      .toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const zeroBasisDeficitDec = runningZeroBasisMovementDec.lt(0)
      ? runningZeroBasisMovementDec.negated().toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP)
      : zero;
    if (zeroBasisDeficitDec.gt(peakZeroBasisDeficitDec)) {
      peakZeroBasisDeficitDec = zeroBasisDeficitDec;
    }

    const baseRow: Record<string, unknown> = {
      project_id: projectId,
      snapshot_id: snapshot.id,
      snapshot_version: `v${snapshot.versionNumber}`,
      period_index: p.periodIndex,
      period_label: p.periodLabel,
      quarter_label: p.quarterLabel,
      cash_quarter_label: `${p.quarterLabel} (${p.periodLabel})`,
      period_start_date: p.periodStart.toISOString().slice(0, 10),
      period_end_date: p.periodEnd.toISOString().slice(0, 10),
      cash_period_start: p.periodStart.toISOString().slice(0, 10),
      cash_period_end: p.periodEnd.toISOString().slice(0, 10),
      as_of_cutoff_date: asOfCutoffIsoDate,
      opening_balance_basis: openingBalanceBasis,
      planned_value_weight_amt: p.plannedValueWeightAmt.toFixed(2),
      expected_billings_amt: p.expectedBillingsAmt.toFixed(2),
      forecast_receipts_amt: fcstRecDec.toFixed(2),
      actual_cash_receipts_amt: actRecDec.toFixed(2),
      procurement_cash_out_amt: procOutDec.toFixed(2),
      payroll_subcon_cash_out_amt: paySubOutDec.toFixed(2),
      other_cash_out_amt: othOutDec.toFixed(2),
      actual_cash_paid_amt: actPaidDec.toFixed(2),
      // Period balance / movement columns (explicitly NO_SUM across periods!)
      quarterly_closing_cash: runningPositionDec.toFixed(2),
      quarterly_liquidity_gap: positionGapDec.toFixed(2),
      ...(actualTreasuryLiquidityVerified
        ? {
            actual_treasury_closing_cash: runningPositionDec.toFixed(2),
            actual_treasury_liquidity_gap: positionGapDec.toFixed(2),
          }
        : {}),
      cumulative_net_cash_movement_zero_basis: runningZeroBasisMovementDec.toFixed(2),
      cumulative_net_cash_deficit_zero_basis: zeroBasisDeficitDec.toFixed(2),
      forecast_closing_cash_amt: p.closingCashAmt.toFixed(2),
      forecast_liquidity_gap_amt: p.liquidityGapAmt.toFixed(2),
      rounding_adjustment_amt: p.roundingAdjustmentAmt.toFixed(2),
    };

    const receiptsVarDec = new Prisma.Decimal(
      String(evaluateSafeFormulaAst(T12_SAFE_DERIVED_FORMULAS.receipts_variance_amt, baseRow))
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const totalFcstOutDec = new Prisma.Decimal(
      String(evaluateSafeFormulaAst(T12_SAFE_DERIVED_FORMULAS.total_forecast_cash_out_amt, baseRow))
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    const disbVarDec = new Prisma.Decimal(
      String(evaluateSafeFormulaAst(T12_SAFE_DERIVED_FORMULAS.disbursement_variance_amt, baseRow))
    ).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

    baseRow.receipts_variance_amt = receiptsVarDec.toFixed(2);
    if (canReadSensitive) {
      baseRow.total_forecast_cash_out_amt = totalFcstOutDec.toFixed(2);
      baseRow.disbursement_variance_amt = disbVarDec.toFixed(2);
    }

    forecastReceiptsTotalDec = forecastReceiptsTotalDec.plus(fcstRecDec);
    actualReceiptsTotalDec = actualReceiptsTotalDec.plus(actRecDec);
    receiptsVarianceTotalDec = receiptsVarianceTotalDec.plus(receiptsVarDec);
    totalForecastCashOutTotalDec = totalForecastCashOutTotalDec.plus(totalFcstOutDec);
    actualCashPaidTotalDec = actualCashPaidTotalDec.plus(actPaidDec);
    disbursementVarianceTotalDec = disbursementVarianceTotalDec.plus(disbVarDec);

    return baseRow;
  });

  const lastComputed = computed.periods[computed.periods.length - 1];
  const endingForecastClosingCashDec = lastComputed
    ? new Prisma.Decimal(String(lastComputed.closingCashAmt)).toDecimalPlaces(
        2,
        Prisma.Decimal.ROUND_HALF_UP
      )
    : zero;
  const peakForecastLiquidityGapDec = computed.periods.reduce((mx, p) => {
    const gap = new Prisma.Decimal(String(p.liquidityGapAmt)).toDecimalPlaces(
      2,
      Prisma.Decimal.ROUND_HALF_UP
    );
    return gap.gt(mx) ? gap : mx;
  }, zero);

  const systemMetaFields = [
    'project_id',
    'snapshot_id',
    'snapshot_version',
    'period_index',
    'period_label',
    'quarter_label',
    'period_start_date',
    'period_end_date',
    'as_of_cutoff_date',
    'opening_balance_basis',
    'rounding_adjustment_amt',
    ...(canReadSensitive
      ? ([
          ...(actualTreasuryLiquidityVerified
            ? (['actual_treasury_closing_cash', 'actual_treasury_liquidity_gap'] as const)
            : []),
          'cumulative_net_cash_movement_zero_basis',
          'cumulative_net_cash_deficit_zero_basis',
          'forecast_closing_cash_amt',
          'forecast_liquidity_gap_amt',
        ] as const)
      : []),
  ] as const;

  return {
    sourceId: snapshot.id,
    sourceVersion: `v${snapshot.versionNumber}`,
    rows,
    systemMetaFields,
    approvedById: snapshot.approvedById!,
    approvedAtIso: snapshot.approvedAt!.toISOString(),
    canonicalHash: snapshot.canonicalHash,
    sourceEvidenceHash: snapshot.sourceEvidenceHash ?? null,
    snapshotContractAuthorityId: snapshot.contractAuthorityId,
    cashFlowSummary,
    treasuryVarianceSummary: {
      snapshotId: snapshot.id,
      snapshotVersionNumber: snapshot.versionNumber,
      scheduleSourceBasis: cashFlowSummary.scheduleSourceBasis,
      asOfCutoffDateIso: asOfCutoffIsoDate,
      periodCount: rows.length,
      actualTreasuryLiquidityVerified: canReadSensitive ? actualTreasuryLiquidityVerified : false,
      openingBalanceBasis: canReadSensitive ? openingBalanceBasis : 'REDACTED_NON_EXECUTIVE',
      openingEffectiveDateIso: canReadSensitive ? openingEffectiveDateIso : null,
      bankStatementEvidenceRef: canReadSensitive ? bankStatementEvidenceRef : null,
      openingTreasuryCashAmt:
        actualTreasuryLiquidityVerified && canReadSensitive ? openingCashDec.toFixed(2) : null,
      forecastReceiptsTotal: forecastReceiptsTotalDec.toFixed(2),
      actualCashReceiptsTotal: actualReceiptsTotalDec.toFixed(2),
      receiptsVarianceTotal: receiptsVarianceTotalDec.toFixed(2),
      totalForecastCashOutTotal: canReadSensitive ? totalForecastCashOutTotalDec.toFixed(2) : null,
      actualCashPaidTotal: canReadSensitive ? actualCashPaidTotalDec.toFixed(2) : null,
      disbursementVarianceTotal: canReadSensitive ? disbursementVarianceTotalDec.toFixed(2) : null,
      endingActualTreasuryClosingCash:
        actualTreasuryLiquidityVerified && canReadSensitive ? runningPositionDec.toFixed(2) : null,
      peakActualTreasuryLiquidityGap:
        actualTreasuryLiquidityVerified && canReadSensitive
          ? peakPositionDeficitOrGapDec.toFixed(2)
          : null,
      endingCumulativeNetCashMovementZeroBasis: canReadSensitive
        ? runningZeroBasisMovementDec.toFixed(2)
        : null,
      peakCumulativeNetCashDeficitZeroBasis: canReadSensitive
        ? peakZeroBasisDeficitDec.toFixed(2)
        : null,
      endingForecastClosingCash: canReadSensitive ? endingForecastClosingCashDec.toFixed(2) : null,
      peakForecastLiquidityGap: canReadSensitive ? peakForecastLiquidityGapDec.toFixed(2) : null,
      balanceAggregationPolicy: 'NO_SUM_PERIOD_ENDING_AND_PEAK_ONLY',
    },
  };
}
