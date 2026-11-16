import ExcelJS from 'exceljs';
import {
  CANONICAL_FIELD_MAP,
  resolveCanonicalFieldId,
  T12_SAFE_DERIVED_VARIANCE_SPECS,
} from './field-catalog';
import { canRoleAccessField, redactUboqPayloadForRole } from './security/redact-payload';
import { inspectCellSecurity, neutralizeSpreadsheetFormulaForCsv } from './intake/security-guard';

export type UboqTemplateGrain =
  | 'CONTRACT_HEADER'
  | 'PHASE_BOQ_LINE'
  | 'CONSOLIDATED_WORK_ITEM'
  | 'CANONICAL_RESOURCE'
  | 'SCHEDULE_ACTIVITY'
  | 'CASH_FLOW_PERIOD'
  | 'CASH_FLOW_QUARTER'
  | 'VARIATION_ORDER_ITEM';

export interface TemplatePresetSpec {
  readonly templateCode: string;
  readonly templateName: string;
  readonly rowGrain: UboqTemplateGrain;
  readonly defaultFields: readonly string[];
  readonly mandatorySystemFields: readonly string[];
  readonly isFormalComplianceOutput: boolean;
}

export const SYSTEM_TEMPLATE_PRESETS: Readonly<Record<string, TemplatePresetSpec>> = {
  T0_MASTER_CONTRACT: {
    templateCode: 'T0_MASTER_CONTRACT',
    templateName: 'Contract & Authority Summary',
    rowGrain: 'CONTRACT_HEADER',
    defaultFields: ['client_name', 'contract_ref', 'noa_ref', 'ntp_ref', 'awarded_revenue', 'current_contract_value', 'contract_duration', 'commencement_date'],
    mandatorySystemFields: ['project_id', 'contract_id', 'tax_profile_version'],
    isFormalComplianceOutput: true,
  },
  T1_PHASE_BOQ: {
    templateCode: 'T1_PHASE_BOQ',
    templateName: 'Awarded Multi-Phase Contract BOQ',
    rowGrain: 'PHASE_BOQ_LINE',
    defaultFields: ['phase_code', 'item_code', 'work_description', 'specification', 'unit', 'original_qty', 'approved_qty', 'contract_unit_rate', 'contract_line_amount'],
    mandatorySystemFields: ['project_id', 'boq_line_id', 'group_code', 'snapshot_version'],
    isFormalComplianceOutput: true,
  },
  T2_CONSOLIDATED_BOQ: {
    templateCode: 'T2_CONSOLIDATED_BOQ',
    templateName: 'Consolidated Work Scope View',
    rowGrain: 'CONSOLIDATED_WORK_ITEM',
    defaultFields: ['group_code', 'work_description', 'specification', 'unit', 'approved_qty', 'contract_unit_rate', 'contract_line_amount'],
    mandatorySystemFields: ['project_id', 'group_code', 'snapshot_version'],
    isFormalComplianceOutput: false,
  },
  T3_AGENCY_ESTIMATE: {
    templateCode: 'T3_AGENCY_ESTIMATE',
    templateName: 'Agency POW / DUPA Estimate Baseline',
    rowGrain: 'PHASE_BOQ_LINE',
    defaultFields: ['phase_code', 'item_code', 'work_description', 'unit', 'approved_qty', 'estimated_direct_cost', 'ocm_amount', 'contractor_profit_amt', 'estimate_vat_amt', 'estimated_total_amount'],
    mandatorySystemFields: ['project_id', 'boq_line_id'],
    isFormalComplianceOutput: false,
  },
  T4_RESOURCE_TAKEOFF: {
    templateCode: 'T4_RESOURCE_TAKEOFF',
    templateName: 'Procurement Resource Requirement & Stock Balance',
    rowGrain: 'CANONICAL_RESOURCE',
    defaultFields: [
      'resource_id',
      'resource_description',
      'resource_spec',
      'resource_unit',
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
    mandatorySystemFields: ['project_id', 'resource_id', 'group_code', 'snapshot_version'],
    isFormalComplianceOutput: true,
  },
  T5_ACCOMPLISHMENT_CERT: {
    templateCode: 'T5_ACCOMPLISHMENT_CERT',
    templateName: 'Statement of Work Accomplished (SWA)',
    rowGrain: 'PHASE_BOQ_LINE',
    defaultFields: ['phase_code', 'item_code', 'work_description', 'unit', 'approved_qty', 'prev_certified_qty', 'current_measured_qty', 'certified_curr_qty', 'cum_certified_qty', 'remaining_qty', 'physical_progress_pct'],
    mandatorySystemFields: ['project_id', 'boq_line_id', 'measurement_id'],
    isFormalComplianceOutput: true,
  },
  T6_PROGRESS_BILLING: {
    templateCode: 'T6_PROGRESS_BILLING',
    templateName: 'Progress Billing Certificate',
    rowGrain: 'PHASE_BOQ_LINE',
    defaultFields: ['phase_code', 'item_code', 'work_description', 'unit', 'certified_curr_qty', 'contract_unit_rate', 'certified_curr_amt', 'gross_billing', 'retention_amt', 'advance_recoup', 'withholding_amt', 'net_certified_due'],
    mandatorySystemFields: ['project_id', 'boq_line_id', 'billing_cert_id', 'tax_profile_version'],
    isFormalComplianceOutput: true,
  },
  T7_SCHEDULE_EVM: {
    templateCode: 'T7_SCHEDULE_EVM',
    templateName: 'CPM Schedule & Earned Value View',
    rowGrain: 'SCHEDULE_ACTIVITY',
    defaultFields: ['activity_id', 'predecessors', 'planned_start', 'planned_finish', 'cpm_total_float', 'planned_progress_pct', 'actual_progress_pct', 'planned_value', 'earned_value', 'actual_cost', 'spi', 'cpi'],
    mandatorySystemFields: ['project_id', 'wbs_id', 'activity_id'],
    isFormalComplianceOutput: false,
  },
  T8_CASHFLOW_HALF_MONTH: {
    templateCode: 'T8_CASHFLOW_HALF_MONTH',
    templateName: 'Native Half-Month Cash Flow Schedule',
    rowGrain: 'CASH_FLOW_PERIOD',
    defaultFields: ['cash_quarter_label', 'cash_period_start', 'cash_period_end', 'planned_value_weight_amt', 'expected_billings_amt', 'forecast_receipts_amt', 'procurement_cash_out_amt', 'payroll_subcon_cash_out_amt', 'other_cash_out_amt'],
    mandatorySystemFields: ['project_id'],
    isFormalComplianceOutput: false,
  },
  T9_CASHFLOW_QUARTERLY: {
    templateCode: 'T9_CASHFLOW_QUARTERLY',
    templateName: 'Quarterly Cash Flow & Liquidity Rollup',
    rowGrain: 'CASH_FLOW_QUARTER',
    defaultFields: ['cash_quarter_label', 'cash_period_start', 'cash_period_end', 'planned_value_weight_amt', 'forecast_receipts_amt', 'procurement_cash_out_amt', 'quarterly_closing_cash', 'quarterly_liquidity_gap'],
    mandatorySystemFields: ['project_id'],
    isFormalComplianceOutput: false,
  },
  T10_EXECUTIVE_MARGIN: {
    templateCode: 'T10_EXECUTIVE_MARGIN',
    templateName: 'Executive Profitability & EAC Forecast',
    rowGrain: 'PHASE_BOQ_LINE',
    defaultFields: ['phase_code', 'item_code', 'work_description', 'contract_line_amount', 'target_direct_cost_amt', 'target_total_cost', 'target_profit', 'target_margin', 'commitment_open_amt', 'etc_uncommitted', 'forecast_eac', 'forecast_profit'],
    mandatorySystemFields: ['project_id', 'boq_line_id', 'snapshot_version'],
    isFormalComplianceOutput: false,
  },
  T11_VARIATION_ORDER_REGISTER: {
    templateCode: 'T11_VARIATION_ORDER_REGISTER',
    templateName: 'Approved Variation Order & Contract / Commitment Revision Register',
    rowGrain: 'VARIATION_ORDER_ITEM',
    defaultFields: [
      'vo_number',
      'vo_classification',
      'phase_code',
      'item_code',
      'work_description',
      'unit',
      'original_qty',
      'vo_approved_qty_delta',
      'approved_qty',
      'contract_unit_rate',
      'vo_client_revenue_delta_amt',
      'vo_subcon_commitment_delta_amt',
    ],
    mandatorySystemFields: ['project_id', 'boq_line_id', 'snapshot_version'],
    isFormalComplianceOutput: true,
  },
  T12_CASHFLOW_VARIANCE_TREASURY: {
    templateCode: 'T12_CASHFLOW_VARIANCE_TREASURY',
    templateName: 'Treasury Cash-Flow Variance & Cash Movement / Liquidity Reconciliation',
    rowGrain: 'CASH_FLOW_PERIOD',
    defaultFields: [
      'cash_quarter_label',
      'cash_period_start',
      'cash_period_end',
      'planned_value_weight_amt',
      'expected_billings_amt',
      'forecast_receipts_amt',
      'actual_cash_receipts_amt',
      'receipts_variance_amt',
      'procurement_cash_out_amt',
      'payroll_subcon_cash_out_amt',
      'other_cash_out_amt',
      'total_forecast_cash_out_amt',
      'actual_cash_paid_amt',
      'disbursement_variance_amt',
      'quarterly_closing_cash',
      'quarterly_liquidity_gap',
    ],
    mandatorySystemFields: ['project_id'],
    isFormalComplianceOutput: false,
  },
};

export const T11_ORIGINAL_BOQ_QTY_HEADING =
  'Baseline Awarded BOQ Qty (NO_SUM)';
export const T11_VO_ITEM_QTY_DELTA_HEADING =
  'Approved VO Item Qty Delta (NO_SUM)';
export const T11_CLIENT_REVISED_BOQ_QTY_HEADING =
  'Client Contract Revised BOQ Qty (Excl. Subcon VOs, NO_SUM)';

export function resolveT11QuantityDefaultHeading(fieldId: string): string | undefined {
  if (fieldId === 'original_qty') {
    return T11_ORIGINAL_BOQ_QTY_HEADING;
  }
  if (fieldId === 'vo_approved_qty_delta') {
    return T11_VO_ITEM_QTY_DELTA_HEADING;
  }
  if (fieldId === 'approved_qty') {
    return T11_CLIENT_REVISED_BOQ_QTY_HEADING;
  }
  return undefined;
}

export function isMisleadingT11RevisedQuantityHeadingAlias(
  fieldId: string,
  heading: string
): boolean {
  const norm = (heading || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!norm) return false;

  if (fieldId === 'approved_qty') {
    if (
      /\b(item\s*post|post[- ]?vo|post\s*(qty|quantity)|delta)\b/i.test(norm)
    ) {
      return true;
    }
    const explicitlyExcludesSubcon =
      norm.includes('excl. subcon') ||
      norm.includes('excl subcon') ||
      norm.includes('excluding subcon');
    if (!explicitlyExcludesSubcon && /\bsubcon(tract(or)?)?\b/i.test(norm)) {
      return true;
    }
    const explicitlyClientQualified =
      /\bclient\b/i.test(norm) || explicitlyExcludesSubcon;
    if (
      !explicitlyClientQualified &&
      /\b(revised|approved|post|final|current)\b.*\b(qty|quantity)\b/i.test(norm)
    ) {
      return true;
    }
    return false;
  }

  if (fieldId === 'vo_approved_qty_delta') {
    const hasDeltaQualifier = /\b(delta|change|diff|variance|addition|deduction|net\s*qty)\b/i.test(
      norm
    );
    if (
      !hasDeltaQualifier &&
      /\b(revised|cumulative|total\s*contract|final)\b.*\b(qty|quantity)\b/i.test(norm)
    ) {
      return true;
    }
    return false;
  }

  if (fieldId === 'original_qty') {
    return /\b(revised|delta|post)\b/i.test(norm);
  }

  return false;
}

export const T12_VERIFIED_CLOSING_CASH_HEADING =
  'Actual Treasury Closing Cash (Verified Opening Basis, NO_SUM)';
export const T12_VERIFIED_LIQUIDITY_GAP_HEADING =
  'Actual Treasury Liquidity Gap (Verified Opening Basis, NO_SUM)';
export const T12_ZERO_BASIS_CLOSING_MOVEMENT_HEADING =
  'Cumulative Net Project Cash Movement (Zero Opening Basis — Not Available Liquidity, NO_SUM)';
export const T12_ZERO_BASIS_LIQUIDITY_DEFICIT_HEADING =
  'Cumulative Net Cash Outflow Deficit (Zero Opening Basis — Not Available Liquidity, NO_SUM)';

export function resolveT12PeriodBalanceDefaultHeading(
  fieldId: string,
  actualTreasuryLiquidityVerified = false
): string | undefined {
  if (fieldId === 'quarterly_closing_cash') {
    return actualTreasuryLiquidityVerified
      ? T12_VERIFIED_CLOSING_CASH_HEADING
      : T12_ZERO_BASIS_CLOSING_MOVEMENT_HEADING;
  }
  if (fieldId === 'quarterly_liquidity_gap') {
    return actualTreasuryLiquidityVerified
      ? T12_VERIFIED_LIQUIDITY_GAP_HEADING
      : T12_ZERO_BASIS_LIQUIDITY_DEFICIT_HEADING;
  }
  return undefined;
}

export function isMisleadingActualTreasuryHeadingAlias(heading: string): boolean {
  const norm = (heading || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!norm) return false;
  if (
    norm.includes('zero opening basis') ||
    norm.includes('zero basis') ||
    norm.includes('zero-basis') ||
    norm.includes('not available liquidity') ||
    norm.includes('not actual')
  ) {
    return false;
  }
  return (
    /\bactual\b.*\b(closing\s*cash|treasury\s*cash|treasury\s*balance|cash\s*balance|liquidity|available\s*cash)\b/i.test(
      norm
    ) ||
    /\bavailable\b.*\b(treasury|liquidity|cash|balance)\b/i.test(norm) ||
    /\b(cash\s*on\s*hand|bank\s*balance|actual\s*closing\s*balance|closing\s*treasury\s*cash)\b/i.test(
      norm
    )
  );
}

export type SafeFormulaNode =
  | { op: 'FIELD'; fieldId: string }
  | { op: 'CONST'; value: number }
  | { op: 'ADD' | 'SUB' | 'MUL' | 'DIV'; left: SafeFormulaNode; right: SafeFormulaNode };

export const T12_SAFE_DERIVED_FORMULAS: Readonly<Record<string, SafeFormulaNode>> = {
  receipts_variance_amt: {
    op: 'SUB',
    left: { op: 'FIELD', fieldId: 'actual_cash_receipts_amt' },
    right: { op: 'FIELD', fieldId: 'forecast_receipts_amt' },
  },
  total_forecast_cash_out_amt: {
    op: 'ADD',
    left: {
      op: 'ADD',
      left: { op: 'FIELD', fieldId: 'procurement_cash_out_amt' },
      right: { op: 'FIELD', fieldId: 'payroll_subcon_cash_out_amt' },
    },
    right: { op: 'FIELD', fieldId: 'other_cash_out_amt' },
  },
  disbursement_variance_amt: {
    op: 'SUB',
    left: { op: 'FIELD', fieldId: 'actual_cash_paid_amt' },
    right: {
      op: 'ADD',
      left: {
        op: 'ADD',
        left: { op: 'FIELD', fieldId: 'procurement_cash_out_amt' },
        right: { op: 'FIELD', fieldId: 'payroll_subcon_cash_out_amt' },
      },
      right: { op: 'FIELD', fieldId: 'other_cash_out_amt' },
    },
  },
};

export function canRoleAccessFormulaAst(userRole: string, node: SafeFormulaNode): boolean {
  if (!node || typeof node !== 'object') return false;
  if (node.op === 'CONST') return true;
  if (node.op === 'FIELD') {
    return canRoleAccessField(userRole, node.fieldId);
  }
  return canRoleAccessFormulaAst(userRole, node.left) && canRoleAccessFormulaAst(userRole, node.right);
}

const ALLOWED_AST_OPS = new Set(['CONST', 'FIELD', 'ADD', 'SUB', 'MUL', 'DIV']);

export function evaluateSafeFormulaAst(node: SafeFormulaNode, row: Record<string, unknown>): number {
  if (!node || typeof node !== 'object' || !ALLOWED_AST_OPS.has((node as { op?: string }).op || '')) {
    throw new Error('UBOQ_UNSAFE_FORMULA_AST: Only whitelisted arithmetic AST nodes (CONST, FIELD, ADD, SUB, MUL, DIV) are permitted');
  }
  if (node.op === 'CONST') return Number(node.value) || 0;
  if (node.op === 'FIELD') {
    const resolved = resolveCanonicalFieldId(node.fieldId) ?? node.fieldId;
    const raw = row[resolved] ?? row[node.fieldId] ?? 0;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }
  const l = evaluateSafeFormulaAst(node.left, row);
  const r = evaluateSafeFormulaAst(node.right, row);
  switch (node.op) {
    case 'ADD':
      return Number((l + r).toFixed(4));
    case 'SUB':
      return Number((l - r).toFixed(4));
    case 'MUL':
      return Number((l * r).toFixed(4));
    case 'DIV':
      return r === 0 ? 0 : Number((l / r).toFixed(6));
  }
}

export interface TemplateProjectionOptions {
  readonly templateCode: string;
  readonly userRole: string;
  readonly selectedFields?: string[];
  readonly headingAliases?: Record<string, string>;
  readonly computedColumns?: Record<string, SafeFormulaNode>;
  readonly isFormalSubmission?: boolean;
  readonly hasOpenBlockingExceptions?: boolean;
  readonly t12ActualTreasuryLiquidityVerified?: boolean;
}

/**
 * Projects canonical rows into any customized template layout without mutating canonical facts,
 * strips unauthorized fields by role (VAL-18), preserves mandatory hidden system IDs (TMP-01..03),
 * and blocks formal exports when open blocking exceptions or missing YES fields exist (VAL-19).
 */
export function buildTemplateProjection(
  canonicalRows: Array<Record<string, unknown>>,
  options: TemplateProjectionOptions
): {
  visibleColumns: Array<{ fieldId: string; heading: string }>;
  systemMetaFields: readonly string[];
  projectedRows: Array<{ visible: Record<string, unknown>; __oserpMeta: Record<string, unknown> }>;
} {
  const preset = SYSTEM_TEMPLATE_PRESETS[options.templateCode] ?? SYSTEM_TEMPLATE_PRESETS.T1_PHASE_BOQ;

  if (options.isFormalSubmission && options.hasOpenBlockingExceptions) {
    throw new Error('UBOQ_VAL19_OPEN_BLOCKING_EXCEPTIONS: Formal compliance export blocked while validation exceptions remain OPEN');
  }

  const requestedIds = (options.selectedFields && options.selectedFields.length > 0 ? options.selectedFields : preset.defaultFields)
    .map((f) => resolveCanonicalFieldId(f) ?? f);

  if (options.isFormalSubmission && preset.isFormalComplianceOutput) {
    // VAL-19: Ensure mandatory output fields ('YES') of the preset are not stripped on formal submission
    for (const defField of preset.defaultFields) {
      const spec = CANONICAL_FIELD_MAP.get(defField);
      if (spec && spec.requiredForOutput === 'YES' && !requestedIds.includes(defField)) {
        throw new Error(
          `UBOQ_VAL19_MANDATORY_FIELD_REMOVED: Formal template ${preset.templateCode} requires mandatory field "${defField}" (${spec.suggestedHeading})`
        );
      }
    }
  }

  const effectiveComputedColumns: Record<string, SafeFormulaNode> = {
    ...(options.templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY' ? T12_SAFE_DERIVED_FORMULAS : {}),
    ...(options.computedColumns ?? {}),
  };

  // Filter out fields unauthorized for the user's role BEFORE projection/export (VAL-18, SEC-03)
  const authorizedFieldIds = requestedIds.filter((fId) => {
    const formulaNode = effectiveComputedColumns[fId];
    if (formulaNode) {
      if (T12_SAFE_DERIVED_VARIANCE_SPECS.has(fId) && !canRoleAccessField(options.userRole, fId)) {
        return false;
      }
      return canRoleAccessFormulaAst(options.userRole, formulaNode);
    }
    return canRoleAccessField(options.userRole, fId);
  });

  const visibleColumns = authorizedFieldIds.map((fId) => {
    const spec = CANONICAL_FIELD_MAP.get(fId);
    const derivedSpec = T12_SAFE_DERIVED_VARIANCE_SPECS.get(fId);
    const t11QuantityDefaultHeading =
      options.templateCode === 'T11_VARIATION_ORDER_REGISTER'
        ? resolveT11QuantityDefaultHeading(fId)
        : undefined;
    const t12PeriodBalanceDefaultHeading =
      options.templateCode === 'T12_CASHFLOW_VARIANCE_TREASURY'
        ? resolveT12PeriodBalanceDefaultHeading(
            fId,
            options.t12ActualTreasuryLiquidityVerified === true
          )
        : undefined;
    const customHeading = options.headingAliases?.[fId];
    return {
      fieldId: fId,
      heading:
        customHeading ||
        t11QuantityDefaultHeading ||
        t12PeriodBalanceDefaultHeading ||
        spec?.suggestedHeading ||
        derivedSpec?.suggestedHeading ||
        fId,
    };
  });

  const redactedInput = redactUboqPayloadForRole(canonicalRows, options.userRole);

  const projectedRows = redactedInput.map((row) => {
    const visible: Record<string, unknown> = {};
    for (const col of visibleColumns) {
      if (effectiveComputedColumns[col.fieldId]) {
        const computedVal = evaluateSafeFormulaAst(effectiveComputedColumns[col.fieldId], row);
        visible[col.fieldId] = T12_SAFE_DERIVED_VARIANCE_SPECS.has(col.fieldId)
          ? computedVal.toFixed(2)
          : computedVal;
      } else {
        const val = row[col.fieldId];
        visible[col.fieldId] = typeof val === 'string' ? inspectCellSecurity(val).sanitizedText : (val ?? null);
      }
    }

    // Hidden system identifiers ALWAYS preserved in __oserpMeta regardless of display customization!
    const __oserpMeta: Record<string, unknown> = {};
    for (const sysKey of preset.mandatorySystemFields) {
      __oserpMeta[sysKey] = row[sysKey] ?? null;
    }

    return { visible, __oserpMeta };
  });

  return {
    visibleColumns,
    systemMetaFields: preset.mandatorySystemFields,
    projectedRows,
  };
}

export async function exportProjectionToXlsxBuffer(
  projection: ReturnType<typeof buildTemplateProjection>,
  sheetTitle: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetTitle.slice(0, 31) || 'UBOQ_Export');

  ws.addRow(projection.visibleColumns.map((c) => c.heading));
  for (const r of projection.projectedRows) {
    ws.addRow(projection.visibleColumns.map((c) => r.visible[c.fieldId] as ExcelJS.CellValue));
  }

  // Hidden round-trip lineage worksheet (__OSERP_META)
  const metaWs = wb.addWorksheet('__OSERP_META');
  metaWs.state = 'veryHidden';
  metaWs.addRow(['row_index', ...projection.systemMetaFields]);
  projection.projectedRows.forEach((r, idx) => {
    metaWs.addRow([idx + 2, ...projection.systemMetaFields.map((k) => r.__oserpMeta[k] as ExcelJS.CellValue)]);
  });

  const arrayBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuf);
}

export function exportProjectionToCsvString(projection: ReturnType<typeof buildTemplateProjection>): string {
  const escapeCsv = (v: unknown): string => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return Number.isFinite(v) ? String(v) : '0';
    if (typeof v === 'boolean') return v ? 'true' : 'false';
    const rawStr = String(v);
    const cleaned = inspectCellSecurity(rawStr).sanitizedText;
    // M02: Neutralize CSV formula triggers (=, +, -, @, leading \t or \r) on all string cells/headings
    const safeStr = neutralizeSpreadsheetFormulaForCsv(rawStr.startsWith('\t') || rawStr.startsWith('\r') ? rawStr : cleaned);
    if (/[",\r\n]/.test(safeStr)) {
      return `"${safeStr.replace(/"/g, '""')}"`;
    }
    return safeStr;
  };
  const headerLine = projection.visibleColumns.map((c) => escapeCsv(c.heading)).join(',');
  const dataLines = projection.projectedRows.map((r) =>
    projection.visibleColumns.map((c) => escapeCsv(r.visible[c.fieldId])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

