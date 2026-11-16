export type UboqFieldVisibility = 'public' | 'internal' | 'restricted' | 'sensitive';

export type UboqOutputRequirement =
  | 'HIDDEN'
  | 'YES'
  | 'YES_IF_APPLICABLE'
  | 'CONDITIONAL'
  | 'OPTIONAL';

export interface CanonicalFieldSpec {
  readonly index: number;
  readonly domain: string;
  readonly fieldId: string;
  readonly suggestedHeading: string;
  readonly dataType: string;
  readonly requiredForOutput: UboqOutputRequirement;
  readonly aggregation: string;
  readonly visibility: UboqFieldVisibility;
  readonly typicalSource: string;
  readonly origin: 'BLUEPRINT_12_FIELD_CATALOG' | 'V2_1_R3_EXTENSION' | 'V2_1_R4_VO_EXTENSION';
}

// Verbatim 119 fields from Blueprint v2.1 Sheet 12_Field_Catalog (rows 5-123)
// + 10 v2.1-R3 extensions + 5 Owner-ratified v2.1-R4 VO extensions (2026-11-15) = 134 unique fields
const RAW_CATALOG_ROWS: ReadonlyArray<
  readonly [string, string, string, string, UboqOutputRequirement, string, UboqFieldVisibility, string, 'B' | 'E' | 'R4']
> = [
  ['Contract / Award', 'project_id', 'Project ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Project Master', 'B'],
  ['Contract / Award', 'contract_id', 'Contract ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Contract Master', 'B'],
  ['Contract / Award', 'client_name', 'Client / Agency Name', 'TEXT', 'YES', 'NONE', 'public', 'Agreement / NOA', 'B'],
  ['Contract / Award', 'contract_ref', 'Contract Agreement Ref', 'TEXT', 'YES_IF_APPLICABLE', 'NONE', 'internal', 'Contract Agreement', 'B'],
  ['Contract / Award', 'noa_ref', 'Notice of Award Ref', 'TEXT', 'CONDITIONAL', 'NONE', 'internal', 'NOA', 'B'],
  ['Contract / Award', 'ntp_ref', 'Notice to Proceed Ref', 'TEXT', 'CONDITIONAL', 'NONE', 'internal', 'NTP', 'B'],
  ['Contract / Award', 'client_po_ref', 'Client Purchase Order Ref', 'TEXT', 'CONDITIONAL', 'NONE', 'internal', 'Client PO', 'B'],
  ['Contract / Award', 'awarded_revenue', 'Awarded Contract Amount', 'CURRENCY', 'HIDDEN', 'SUM_ONCE', 'restricted', 'Executed Contract', 'B'],
  ['Contract / Award', 'pricing_method', 'Contract Pricing Basis', 'ENUM', 'HIDDEN', 'NONE', 'internal', 'Contract / SCC', 'B'],
  ['Contract / Award', 'contract_vat_basis', 'Contract VAT Treatment', 'ENUM', 'HIDDEN', 'NONE', 'restricted', 'Contract / Tax Profile', 'B'],
  ['Contract / Award', 'contract_duration', 'Contract Duration', 'DAYS', 'CONDITIONAL', 'NONE', 'internal', 'Agreement / NTP', 'B'],
  ['Contract / Award', 'commencement_date', 'Authorized Commencement', 'DATE', 'CONDITIONAL', 'NONE', 'internal', 'Agreement / NTP', 'B'],
  ['Contract / Award', 'current_contract_value', 'Current Approved Contract Value', 'CURRENCY', 'HIDDEN', 'SUM_ONCE', 'restricted', 'Agreement + Approved VOs', 'B'],
  ['Contract / Award', 'vo_reference', 'Approved Variation Reference', 'TEXT', 'CONDITIONAL', 'NONE', 'internal', 'Approved VO', 'B'],
  ['BOQ / Contract Lines', 'boq_line_id', 'Original BOQ Line ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Approved Awarded BOQ', 'B'],
  ['BOQ / Contract Lines', 'item_code', 'Pay Item Code', 'TEXT', 'YES', 'NONE', 'public', 'BOQ', 'B'],
  ['BOQ / Contract Lines', 'phase_code', 'Project Phase', 'TEXT', 'YES', 'NONE', 'public', 'BOQ / WBS', 'B'],
  ['BOQ / Contract Lines', 'section_code', 'Work Section', 'TEXT', 'OPTIONAL', 'NONE', 'public', 'BOQ', 'B'],
  ['BOQ / Contract Lines', 'work_description', 'Work Description', 'TEXT', 'YES', 'GROUP_ONLY', 'public', 'BOQ', 'B'],
  ['BOQ / Contract Lines', 'specification', 'Technical Specification', 'TEXT', 'YES_IF_APPLICABLE', 'NONE', 'internal', 'BOQ / Specs', 'B'],
  ['BOQ / Contract Lines', 'unit', 'Measurement Unit', 'UNIT', 'YES', 'NONE', 'public', 'BOQ', 'B'],
  ['BOQ / Contract Lines', 'approved_qty', 'Approved Work Quantity', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'public', 'BOQ / VO', 'B'],
  ['BOQ / Contract Lines', 'original_qty', 'Original Work Quantity', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'public', 'Awarded BOQ', 'B'],
  ['BOQ / Contract Lines', 'contract_unit_rate', 'Approved Contract Unit Rate', 'CURRENCY', 'CONDITIONAL', 'NONE', 'restricted', 'Contract BOQ', 'B'],
  ['BOQ / Contract Lines', 'contract_line_amount', 'Contract Line Amount', 'CURRENCY', 'YES', 'SUM_ONCE', 'restricted', 'Contract BOQ', 'B'],
  ['BOQ / Contract Lines', 'group_code', 'Existing Consolidated Group ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Consolidated BOQ', 'B'],
  ['BOQ / Contract Lines', 'pricing_type', 'Unit / Lump Sum / Milestone', 'ENUM', 'HIDDEN', 'NONE', 'internal', 'Contract / SOV', 'B'],
  ['Agency / Estimate', 'agency_edc_amt', 'Agency Estimated Direct Cost', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'Agency POW / DUPA', 'B'],
  ['Agency / Estimate', 'agency_abc', 'Approved Budget for Contract', 'CURRENCY', 'OPTIONAL', 'SUM_ONCE', 'restricted', 'Agency POW / ABC', 'B'],
  ['Agency / Estimate', 'estimate_material_cost', 'Estimated Material Cost', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'Detailed Estimate / DUPA', 'B'],
  ['Agency / Estimate', 'estimate_labor_cost', 'Estimated Labor Cost', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'Detailed Estimate / DUPA', 'B'],
  ['Agency / Estimate', 'estimate_equipment_cost', 'Estimated Equipment Cost', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'Detailed Estimate / DUPA', 'B'],
  ['Agency / Estimate', 'estimated_direct_cost', 'Estimated Total Direct Cost', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'DUPA / Estimate', 'B'],
  ['Agency / Estimate', 'ocm_rate', 'OCM Percentage', 'PERCENT', 'OPTIONAL', 'NO_SUM', 'restricted', 'Approved pricing basis', 'B'],
  ['Agency / Estimate', 'ocm_amount', 'OCM Amount', 'CURRENCY', 'OPTIONAL', 'SUM_IF_SEPARATE', 'restricted', 'Approved estimate', 'B'],
  ['Agency / Estimate', 'contingency_ocm', 'OCM Contingency Component', 'CURRENCY', 'OPTIONAL', 'SUM_IF_NOT_IN_OCM', 'restricted', 'Approved estimate', 'B'],
  ['Agency / Estimate', 'contractor_profit_rate', 'Estimate Contractor Profit Rate', 'PERCENT', 'OPTIONAL', 'NO_SUM', 'restricted', 'Agency estimate', 'B'],
  ['Agency / Estimate', 'contractor_profit_amt', 'Estimate Contractor Profit Amount', 'CURRENCY', 'OPTIONAL', 'SUM_IF_SEPARATE', 'restricted', 'Agency estimate', 'B'],
  ['Agency / Estimate', 'estimate_vat_rate', 'Estimate VAT Rate', 'PERCENT', 'OPTIONAL', 'NO_SUM', 'restricted', 'Applicable pricing/tax rule', 'B'],
  ['Agency / Estimate', 'estimate_vat_amt', 'Estimate VAT Component', 'CURRENCY', 'OPTIONAL', 'SUM_IF_SEPARATE', 'restricted', 'Cost estimate', 'B'],
  ['Agency / Estimate', 'estimated_indirect_cost', 'Estimated Indirect Cost', 'CURRENCY', 'OPTIONAL', 'SUM_NO_DOUBLE', 'restricted', 'Cost estimate', 'B'],
  ['Agency / Estimate', 'estimated_total_unit_cost', 'Estimated Total Unit Cost', 'CURRENCY', 'OPTIONAL', 'NO_SUM', 'restricted', 'DUPA', 'B'],
  ['Agency / Estimate', 'estimated_total_amount', 'Estimated Total Amount', 'CURRENCY', 'OPTIONAL', 'SUM_ONCE', 'restricted', 'Estimate', 'B'],
  ['Resource / Procurement', 'resource_id', 'Resource / Stock Code', 'TEXT', 'HIDDEN', 'NONE', 'internal', 'Resource Master', 'B'],
  ['Resource / Procurement', 'resource_description', 'Material / Resource Description', 'TEXT', 'YES', 'GROUP_ONLY', 'internal', 'Detailed Estimate / Summary', 'B'],
  ['Resource / Procurement', 'resource_spec', 'Material Specification', 'TEXT', 'YES', 'NONE', 'internal', 'Contract Specs', 'B'],
  ['Resource / Procurement', 'resource_unit', 'Resource Unit', 'UNIT', 'YES', 'NONE', 'internal', 'Resource Master', 'B'],
  ['Resource / Procurement', 'resource_qty_basis', 'Takeoff Basis', 'ENUM', 'HIDDEN', 'NONE', 'internal', 'Detailed / Summary', 'B'],
  ['Resource / Procurement', 'resource_coeff', 'Resource Qty / Work Unit', 'DECIMAL', 'CONDITIONAL', 'NO_SUM', 'restricted', 'DUPA / Takeoff', 'B'],
  ['Resource / Procurement', 'resource_summary_qty', 'Approved Project Summary Qty', 'DECIMAL', 'CONDITIONAL', 'NO_SUM', 'restricted', 'Contractor Summary', 'B'],
  ['Resource / Procurement', 'resource_required_qty', 'Total Resource Requirement', 'DECIMAL', 'YES', 'SUM_DEDUPED', 'internal', 'Takeoff', 'B'],
  ['Resource / Procurement', 'stock_available_qty', 'Available Inventory Qty', 'DECIMAL', 'OPTIONAL', 'SUM_SCOPE', 'internal', 'Inventory', 'B'],
  ['Resource / Procurement', 'committed_qty', 'Open Committed Qty', 'DECIMAL', 'OPTIONAL', 'SUM_DEDUPED', 'restricted', 'PO / Subcontract', 'B'],
  ['Resource / Procurement', 'resource_to_procure', 'Outstanding Procurement Qty', 'DECIMAL', 'YES', 'SUM_DEDUPED', 'internal', 'Takeoff - Stock - Committed', 'B'],
  ['Resource / Procurement', 'target_resource_cost', 'Contractor Target Resource Unit Cost', 'CURRENCY', 'CONDITIONAL', 'NO_SUM', 'restricted', 'Approved internal budget', 'B'],
  ['Resource / Procurement', 'procurement_budget', 'Estimated Procurement Budget', 'CURRENCY', 'OPTIONAL', 'SUM_ONCE', 'restricted', 'Target resources', 'B'],
  ['Resource / Procurement', 'mrf_id', 'MRF Reference', 'TEXT', 'CONDITIONAL', 'NONE', 'internal', 'Existing MRF', 'B'],
  ['Resource / Procurement', 'supplier_po_id', 'Internal Supplier PO Reference', 'TEXT', 'CONDITIONAL', 'NONE', 'restricted', 'Existing Procurement', 'B'],
  ['Accomplishment / Billing', 'measurement_id', 'Measurement Evidence ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Accomplishment', 'B'],
  ['Accomplishment / Billing', 'prev_certified_qty', 'Previously Certified Quantity', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'internal', 'Last accepted certificate', 'B'],
  ['Accomplishment / Billing', 'current_measured_qty', 'Current Measured Quantity', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'internal', 'Engineer measurement', 'B'],
  ['Accomplishment / Billing', 'certified_curr_qty', 'Current Certified Quantity', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'internal', 'Engineer certificate', 'B'],
  ['Accomplishment / Billing', 'cum_certified_qty', 'Cumulative Certified Quantity', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'internal', 'Certification history', 'B'],
  ['Accomplishment / Billing', 'remaining_qty', 'Remaining Approved Quantity', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'internal', 'Contract - certified', 'B'],
  ['Accomplishment / Billing', 'physical_progress_pct', 'Verified Physical Progress %', 'PERCENT', 'YES', 'WEIGHTED', 'internal', 'Measurement', 'B'],
  ['Accomplishment / Billing', 'certified_curr_amt', 'Current Certified Work Amount', 'CURRENCY', 'YES', 'SUM_ONCE', 'restricted', 'Contract rates x qty', 'B'],
  ['Accomplishment / Billing', 'prior_certified_amt', 'Previously Certified Work Amount', 'CURRENCY', 'YES', 'SUM_ONCE', 'restricted', 'Billing history', 'B'],
  ['Accomplishment / Billing', 'gross_billing', 'Gross Billing Claim', 'CURRENCY', 'YES', 'SUM_ONCE', 'restricted', 'Billing', 'B'],
  ['Accomplishment / Billing', 'advance_recoup', 'Advance Recoupment', 'CURRENCY', 'CONDITIONAL', 'SUM_ONCE', 'restricted', 'SCC / Billing', 'B'],
  ['Accomplishment / Billing', 'retention_amt', 'Retention Deduction', 'CURRENCY', 'CONDITIONAL', 'SUM_ONCE', 'restricted', 'SCC / Billing', 'B'],
  ['Accomplishment / Billing', 'withholding_amt', 'Tax Withholding', 'CURRENCY', 'CONDITIONAL', 'SUM_ONCE', 'restricted', 'Tax profile', 'B'],
  ['Accomplishment / Billing', 'net_certified_due', 'Net Certified Due', 'CURRENCY', 'YES', 'SUM_ONCE', 'restricted', 'Certified bill', 'B'],
  ['Accomplishment / Billing', 'payment_received', 'Payment Received', 'CURRENCY', 'OPTIONAL', 'SUM_ONCE', 'restricted', 'Receivables', 'B'],
  ['Accomplishment / Billing', 'billing_cert_id', 'Billing Certificate ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Certificate', 'B'],
  ['Schedule / Performance', 'wbs_id', 'Work Package ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'WBS', 'B'],
  ['Schedule / Performance', 'activity_id', 'Schedule Activity ID', 'TEXT', 'YES', 'NONE', 'public', 'Approved schedule', 'B'],
  ['Schedule / Performance', 'predecessors', 'Activity Predecessors', 'TEXT', 'YES', 'NONE', 'internal', 'Network', 'B'],
  ['Schedule / Performance', 'planned_start', 'Planned Start', 'DATE', 'OPTIONAL', 'NONE', 'public', 'Baseline schedule', 'B'],
  ['Schedule / Performance', 'planned_finish', 'Planned Finish', 'DATE', 'OPTIONAL', 'NONE', 'public', 'Baseline schedule', 'B'],
  ['Schedule / Performance', 'cpm_total_float', 'CPM Total Float', 'DAYS', 'OPTIONAL', 'NONE', 'internal', 'Computed CPM', 'B'],
  ['Schedule / Performance', 'planned_progress_pct', 'Planned Weighted Progress %', 'PERCENT', 'OPTIONAL', 'WEIGHTED', 'public', 'Approved S Curve', 'B'],
  ['Schedule / Performance', 'actual_progress_pct', 'Actual Verified Progress %', 'PERCENT', 'OPTIONAL', 'WEIGHTED', 'public', 'Accomplishment', 'B'],
  ['Schedule / Performance', 'planned_value', 'Planned Value (PV)', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'Approved schedule', 'B'],
  ['Schedule / Performance', 'earned_value', 'Earned Value (EV)', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'Certified progress', 'B'],
  ['Schedule / Performance', 'actual_cost', 'Actual Cost (AC)', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'Expense ledger', 'B'],
  ['Schedule / Performance', 'spi', 'Schedule Performance Index', 'RATIO', 'OPTIONAL', 'NO_SUM', 'restricted', 'EV / PV', 'B'],
  ['Schedule / Performance', 'cpi', 'Cost Performance Index', 'RATIO', 'OPTIONAL', 'NO_SUM', 'restricted', 'EV / AC', 'B'],
  ['Profitability / Governance', 'target_direct_cost_amt', 'Contractor Target Direct Cost', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'sensitive', 'Approved target budget', 'B'],
  ['Profitability / Governance', 'target_total_cost', 'Contractor Target Total Cost', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'sensitive', 'Internal budget', 'B'],
  ['Profitability / Governance', 'target_profit', 'Target Project Profit', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'sensitive', 'Award ex VAT - target', 'B'],
  ['Profitability / Governance', 'target_margin', 'Target Project Margin', 'PERCENT', 'OPTIONAL', 'NO_SUM', 'sensitive', 'Profit / revenue ex VAT', 'B'],
  ['Profitability / Governance', 'commitment_open_amt', 'Unexpensed Open Commitments', 'CURRENCY', 'OPTIONAL', 'SUM_DEDUPED', 'sensitive', 'Procurement', 'B'],
  ['Profitability / Governance', 'etc_uncommitted', 'Uncommitted Estimate to Complete', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'sensitive', 'Approved forecast', 'B'],
  ['Profitability / Governance', 'forecast_eac', 'Estimated Cost at Completion', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'sensitive', 'Cost forecast', 'B'],
  ['Profitability / Governance', 'forecast_profit', 'Forecast Profit', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'sensitive', 'Revenue - EAC', 'B'],
  ['Profitability / Governance', 'original_doc_sha', 'Source SHA-256', 'TEXT', 'HIDDEN', 'NONE', 'internal', 'Document evidence', 'B'],
  ['Profitability / Governance', 'approval_ref', 'Approval Evidence Reference', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Approval log', 'B'],
  ['Profitability / Governance', 'snapshot_version', 'Approved Snapshot Version', 'TEXT', 'HIDDEN', 'NONE', 'internal', 'Immutable baseline', 'B'],
  ['Tax / Pricing', 'estimate_vat_component_rate', 'Estimated VAT Component Rate', 'PERCENT', 'OPTIONAL', 'NO_SUM', 'restricted', 'POW/BOQ/DUPA source profile', 'B'],
  ['Tax / Pricing', 'estimate_vat_component_base', 'Estimated VAT Component Base', 'CURRENCY', 'OPTIONAL', 'SUM_SCOPE', 'restricted', 'BOQ estimate and policy', 'B'],
  ['Tax / Pricing', 'output_vat_rate', 'Invoice Output VAT Rate', 'PERCENT', 'CONDITIONAL', 'NO_SUM', 'restricted', 'Contract and statutory tax profile', 'B'],
  ['Tax / Pricing', 'sales_vat_category', 'Sales VAT Treatment', 'ENUM', 'CONDITIONAL', 'NONE', 'restricted', 'Tax profile / registration', 'B'],
  ['Tax / Pricing', 'gov_vat_withholding_rate', 'Government VAT Withholding Rate', 'PERCENT', 'CONDITIONAL', 'NO_SUM', 'restricted', 'Applicable withholding rules', 'B'],
  ['Tax / Pricing', 'vat_withholding_amount', 'VAT Withheld by Client', 'CURRENCY', 'CONDITIONAL', 'SUM_SCOPE', 'restricted', 'Certified payment and withholding', 'B'],
  ['Tax / Pricing', 'ewt_withholding_amount', 'Income Tax Withheld', 'CURRENCY', 'CONDITIONAL', 'SUM_SCOPE', 'restricted', 'Certified billing/payment', 'B'],
  ['Tax / Pricing', 'tax_profile_version', 'Tax and Pricing Rule Version', 'TEXT', 'HIDDEN', 'NONE', 'internal', 'Approved effective-dated tax profile', 'B'],
  ['Cash Flow', 'cash_period_start', 'Cash Period Start', 'DATE', 'YES', 'NONE', 'internal', 'Project / calendar quarter', 'B'],
  ['Cash Flow', 'cash_period_end', 'Cash Period End', 'DATE', 'YES', 'NONE', 'internal', 'Project / calendar quarter', 'B'],
  ['Cash Flow', 'cash_quarter_label', 'Cash Quarter', 'TEXT', 'YES', 'NONE', 'internal', 'Time bucket classification', 'B'],
  ['Cash Flow', 'planned_value_weight_amt', 'Planned Earned-Value Allocation', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'internal', 'PERT/S curve source', 'B'],
  ['Cash Flow', 'expected_billings_amt', 'Expected Client Billings', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'restricted', 'Milestones and quantities', 'B'],
  ['Cash Flow', 'forecast_receipts_amt', 'Forecast Cash Receipts', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'restricted', 'Certification, payment terms and lag', 'B'],
  ['Cash Flow', 'procurement_cash_out_amt', 'Procurement Cash Out', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'sensitive', 'Supplier payment terms', 'B'],
  ['Cash Flow', 'payroll_subcon_cash_out_amt', 'Labor/Subcon Cash Out', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'sensitive', 'Payroll and subcontract milestones', 'B'],
  ['Cash Flow', 'other_cash_out_amt', 'Other Project Cash Out', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'sensitive', 'Operations and tax payments', 'B'],
  ['Cash Flow', 'actual_cash_receipts_amt', 'Actual Cash Receipts', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'restricted', 'Matched bank receipts', 'B'],
  ['Cash Flow', 'actual_cash_paid_amt', 'Actual Cash Paid', 'CURRENCY', 'OPTIONAL', 'SUM_DATED', 'sensitive', 'Matched bank/cash ledger', 'B'],
  ['Cash Flow', 'quarterly_closing_cash', 'Quarterly Closing Cash', 'CURRENCY', 'OPTIONAL', 'NO_SUM', 'sensitive', 'Opening + Receipts - Disbursements', 'B'],
  ['Cash Flow', 'quarterly_liquidity_gap', 'Quarterly Liquidity Gap', 'CURRENCY', 'OPTIONAL', 'NO_SUM', 'sensitive', 'Approved forecast', 'B'],
  // 10 Explicitly Authorized v2.1-R3 Operational Extensions (#120 - #129)
  ['Resource / Procurement', 'resource_class', 'Resource Classification', 'ENUM', 'HIDDEN', 'NONE', 'internal', 'Canonical Resource Account', 'E'],
  ['Resource / Procurement', 'fulfillment_channel', 'Fulfillment Channel', 'ENUM', 'HIDDEN', 'NONE', 'internal', 'Canonical Resource Account', 'E'],
  ['Resource / Procurement', 'uom_dimension_family', 'UOM Dimension Family', 'ENUM', 'HIDDEN', 'NONE', 'internal', 'UOM Registry', 'E'],
  ['Resource / Procurement', 'open_mr_reserved_qty', 'Open MRF Reserved Qty', 'DECIMAL', 'OPTIONAL', 'SUM_DEDUPED', 'internal', 'Resource Ledger', 'E'],
  ['Resource / Procurement', 'delivered_received_qty', 'Delivered & Approved Qty', 'DECIMAL', 'OPTIONAL', 'SUM_DEDUPED', 'internal', 'Resource Ledger', 'E'],
  ['Resource / Procurement', 'consumed_issued_qty', 'Issued / Consumed Qty', 'DECIMAL', 'OPTIONAL', 'SUM_DEDUPED', 'internal', 'Resource Ledger', 'E'],
  ['Resource / Procurement', 'po_item_lineage_id', 'Approved PO Item Lineage ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'PurchaseOrderItem', 'E'],
  ['Profitability / Governance', 'supersedes_id', 'Superseded Baseline / PRR ID', 'UUID', 'HIDDEN', 'NONE', 'internal', 'Immutable Lineage', 'E'],
  ['Profitability / Governance', 'is_synthetic_test_fixture', 'Synthetic Test Fixture Flag', 'BOOLEAN', 'HIDDEN', 'NONE', 'internal', 'Test Provenance Guard', 'E'],
  ['Resource / Procurement', 'allocated_usable_stock_qty', 'Allocated Usable Opening Stock Qty', 'DECIMAL', 'OPTIONAL', 'SUM_DEDUPED', 'internal', 'Verified Stock Lot Evidence', 'E'],
  // 5 Owner-Ratified v2.1-R4 Variation Order Register Extensions (#130 - #134; ratified 2026-11-15)
  ['Contract / Award', 'vo_number', 'Variation Order Number', 'TEXT', 'YES', 'NONE', 'internal', 'Approved VO / SVO', 'R4'],
  ['Contract / Award', 'vo_classification', 'Variation Classification', 'ENUM', 'YES', 'NONE', 'internal', 'Approved VO / SVO', 'R4'],
  ['BOQ / Contract Lines', 'vo_approved_qty_delta', 'Approved VO Quantity Delta', 'DECIMAL', 'YES', 'SUM_COMPATIBLE', 'internal', 'Approved VO Item / SVO', 'R4'],
  ['Contract / Award', 'vo_client_revenue_delta_amt', 'Approved Client VO Revenue Delta', 'CURRENCY', 'YES', 'SUM_ONCE', 'restricted', 'Approved Client VO', 'R4'],
  ['Profitability / Governance', 'vo_subcon_commitment_delta_amt', 'Approved Subcontract VO Commitment Delta', 'CURRENCY', 'OPTIONAL', 'SUM_ONCE', 'sensitive', 'Approved Subcontract VO', 'R4'],
];

export const CANONICAL_FIELD_CATALOG: ReadonlyArray<CanonicalFieldSpec> = RAW_CATALOG_ROWS.map((r, i) => ({
  index: i + 1,
  domain: r[0],
  fieldId: r[1],
  suggestedHeading: r[2],
  dataType: r[3],
  requiredForOutput: r[4],
  aggregation: r[5],
  visibility: r[6],
  typicalSource: r[7],
  origin:
    r[8] === 'B'
      ? 'BLUEPRINT_12_FIELD_CATALOG'
      : r[8] === 'E'
        ? 'V2_1_R3_EXTENSION'
        : 'V2_1_R4_VO_EXTENSION',
}));

export const CANONICAL_FIELD_MAP: ReadonlyMap<string, CanonicalFieldSpec> = new Map(
  CANONICAL_FIELD_CATALOG.map((spec) => [spec.fieldId, spec])
);

// Explicit alias registry (Correction 3 / CAT-01): maps operational synonyms without duplicating canonical IDs
export const CANONICAL_FIELD_ALIASES: Readonly<Record<string, string>> = {
  remaining_procurement_qty: 'resource_to_procure',
  available_physical_stock_qty: 'stock_available_qty',
  open_committed_po_qty: 'committed_qty',
  pay_item_no: 'item_code',
  pay_item_code: 'item_code',
  item_no: 'item_code',
  description: 'work_description',
  item_description: 'work_description',
  scope_of_work: 'work_description',
  uom: 'unit',
  qty: 'approved_qty',
  quantity: 'approved_qty',
  unit_price: 'contract_unit_rate',
  unit_cost: 'contract_unit_rate',
  rate: 'contract_unit_rate',
  total_amount: 'contract_line_amount',
  amount: 'contract_line_amount',
  phase: 'phase_code',
  building_zone: 'phase_code',
  wbs: 'phase_code',
};

export function resolveCanonicalFieldId(idOrAlias: string): string | null {
  const normalized = idOrAlias
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (CANONICAL_FIELD_MAP.has(normalized)) {
    return normalized;
  }
  const target = CANONICAL_FIELD_ALIASES[normalized];
  if (target && CANONICAL_FIELD_MAP.has(target)) {
    return target;
  }
  return null;
}

export interface SafeDerivedVarianceSpec {
  readonly fieldId: string;
  readonly suggestedHeading: string;
  readonly dataType: 'CURRENCY';
  readonly aggregation: 'SUM_DATED';
  readonly visibility: UboqFieldVisibility;
}

export const T12_SAFE_DERIVED_VARIANCE_SPECS: ReadonlyMap<string, SafeDerivedVarianceSpec> = new Map([
  [
    'receipts_variance_amt',
    {
      fieldId: 'receipts_variance_amt',
      suggestedHeading: 'Receipts Variance (Actual - Forecast)',
      dataType: 'CURRENCY',
      aggregation: 'SUM_DATED',
      visibility: 'restricted',
    },
  ],
  [
    'total_forecast_cash_out_amt',
    {
      fieldId: 'total_forecast_cash_out_amt',
      suggestedHeading: 'Forecast Total Cash Outflow',
      dataType: 'CURRENCY',
      aggregation: 'SUM_DATED',
      visibility: 'sensitive',
    },
  ],
  [
    'disbursement_variance_amt',
    {
      fieldId: 'disbursement_variance_amt',
      suggestedHeading: 'Cash Outflow Variance (Actual Paid - Forecast Outflow)',
      dataType: 'CURRENCY',
      aggregation: 'SUM_DATED',
      visibility: 'sensitive',
    },
  ],
]);

export function getCanonicalCatalogStats() {
  const blueprintCount = CANONICAL_FIELD_CATALOG.filter((f) => f.origin === 'BLUEPRINT_12_FIELD_CATALOG').length;
  const extensionCount = CANONICAL_FIELD_CATALOG.filter((f) => f.origin === 'V2_1_R3_EXTENSION').length;
  const v21R4VoExtensionCount = CANONICAL_FIELD_CATALOG.filter((f) => f.origin === 'V2_1_R4_VO_EXTENSION').length;
  const uniqueIds = new Set(CANONICAL_FIELD_CATALOG.map((f) => f.fieldId));
  return {
    blueprintCount,
    extensionCount,
    v21R4VoExtensionCount,
    totalCount: CANONICAL_FIELD_CATALOG.length,
    uniqueCount: uniqueIds.size,
  };
}

