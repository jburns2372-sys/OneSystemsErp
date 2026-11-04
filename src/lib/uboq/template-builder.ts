import ExcelJS from 'exceljs';
import { CANONICAL_FIELD_MAP, resolveCanonicalFieldId } from './field-catalog';
import { canRoleAccessField, redactUboqPayloadForRole } from './security/redact-payload';
import { inspectCellSecurity } from './intake/security-guard';

export type UboqTemplateGrain =
  | 'CONTRACT_HEADER'
  | 'PHASE_BOQ_LINE'
  | 'CONSOLIDATED_WORK_ITEM'
  | 'CANONICAL_RESOURCE'
  | 'SCHEDULE_ACTIVITY'
  | 'CASH_FLOW_PERIOD'
  | 'CASH_FLOW_QUARTER';

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
};

export type SafeFormulaNode =
  | { op: 'FIELD'; fieldId: string }
  | { op: 'CONST'; value: number }
  | { op: 'ADD' | 'SUB' | 'MUL' | 'DIV'; left: SafeFormulaNode; right: SafeFormulaNode };

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

  // Filter out fields unauthorized for the user's role BEFORE projection/export (VAL-18, SEC-03)
  const authorizedFieldIds = requestedIds.filter((fId) => {
    if (options.computedColumns && options.computedColumns[fId]) return true;
    return canRoleAccessField(options.userRole, fId);
  });

  const visibleColumns = authorizedFieldIds.map((fId) => {
    const spec = CANONICAL_FIELD_MAP.get(fId);
    const customHeading = options.headingAliases?.[fId];
    return {
      fieldId: fId,
      heading: customHeading || spec?.suggestedHeading || fId,
    };
  });

  const redactedInput = redactUboqPayloadForRole(canonicalRows, options.userRole);

  const projectedRows = redactedInput.map((row) => {
    const visible: Record<string, unknown> = {};
    for (const col of visibleColumns) {
      if (options.computedColumns && options.computedColumns[col.fieldId]) {
        visible[col.fieldId] = evaluateSafeFormulaAst(options.computedColumns[col.fieldId], row);
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
    const s = inspectCellSecurity(String(v)).sanitizedText;
    if (/[",\r\n]/.test(s)) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const headerLine = projection.visibleColumns.map((c) => escapeCsv(c.heading)).join(',');
  const dataLines = projection.projectedRows.map((r) =>
    projection.visibleColumns.map((c) => escapeCsv(r.visible[c.fieldId])).join(',')
  );
  return [headerLine, ...dataLines].join('\n');
}

