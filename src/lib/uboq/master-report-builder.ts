import ExcelJS from 'exceljs';
import {
  reconcileImportedAwardedBoqCandidates,
  roundCurrency,
  type AwardedBoqRowClassification,
  type AwardedBoqVerificationReport,
} from './awarded-boq-reconciler';
import { neutralizeSpreadsheetFormulaForCsv } from './intake/security-guard';

export type MasterReportPurpose =
  | 'BOQ_SUMMARY'
  | 'ACCOMPLISHMENT_REPORT'
  | 'PROGRESS_BILLING_WORKING_COPY'
  | 'CUSTOM_REPORT';

export type MasterColumnFormat = 'text' | 'number' | 'currency' | 'percent' | 'formula';

export interface MasterReportColumnDef {
  readonly key: string;
  readonly defaultHeading: string;
  readonly group: 'BOQ' | 'COST_BREAKDOWN' | 'ACCOMPLISHMENT' | 'PROVENANCE' | 'SOURCE_EXTRA';
  readonly format: MasterColumnFormat;
  readonly description: string;
  readonly isDerived?: boolean;
}

export interface MasterBoqRow {
  readonly id: string;
  readonly rowNumber: number;
  readonly worksheet: string;
  readonly sectionLabel: string;
  readonly classification: AwardedBoqRowClassification;
  readonly itemCode: string;
  readonly description: string;
  readonly unit: string;
  readonly quantity: number | null;
  readonly directUnitCost: number | null;
  readonly directCost: number | null;
  readonly ocmAmount: number | null;
  readonly profitAmount: number | null;
  readonly vatAmount: number | null;
  readonly indirectCost: number | null;
  readonly finalLineAmount: number | null;
  /** Effective awarded unit rate = finalLineAmount / quantity (distinct from directUnitCost). */
  readonly effectiveAwardedUnitRate: number | null;
  /** Weighted percentage share of total contract BOQ (0..1). */
  readonly weightedPct: number | null;
  readonly formulaText: string | null;
  readonly sourceCellRef: string;
  readonly hasDiscrepancy: boolean;
  /** Preserved extra original columns from the source file beyond standard fields. */
  readonly extraSourceColumns: Record<string, string | number | null>;
}

export interface VerifiedProgressInputRow {
  readonly itemCode?: string | null;
  readonly sourceCellRef?: string | null;
  readonly previousAccomplishmentAmt: number;
  readonly currentPeriodQty: number;
  readonly remarks?: string | null;
}

export interface MasterBoqDataset {
  readonly projectId: string;
  readonly projectName: string;
  readonly projectLocation: string | null;
  readonly clientName: string | null;
  readonly contractorName: string | null;
  readonly contractNumber: string | null;
  readonly officialAwardedContractAmount: number | null;
  readonly sourceDocumentId: string;
  readonly sourceFileName: string;
  readonly sourceSha256Hash: string;
  readonly recalculatedTotal: number;
  readonly payItemCount: number;
  readonly headingAndNoteCount: number;
  readonly discrepancyCount: number;
  readonly calculationCheck: 'PASS' | 'FAIL';
  readonly formulaCheck: 'PASS' | 'FAIL' | 'NO_FORMULAS';
  readonly sections: ReadonlyArray<string>;
  readonly availableColumns: ReadonlyArray<MasterReportColumnDef>;
  readonly rows: ReadonlyArray<MasterBoqRow>;
  readonly hasVerifiedProgressRecords: boolean;
}

export interface MasterReportLayoutConfig {
  readonly purpose: MasterReportPurpose;
  readonly selectedColumns: ReadonlyArray<string>;
  readonly headingAliases: Readonly<Record<string, string>>;
  readonly selectedSections: ReadonlyArray<string>;
  readonly includeHeadings: boolean;
  readonly includeNotes: boolean;
  readonly includeSubtotals: boolean;
  readonly groupBySection: boolean;
  readonly reportTitle: string;
  readonly reportNumber: string;
  readonly periodEnding: string;
  readonly showSignatureBlock: boolean;
}

export interface ProjectedMasterReportColumn {
  readonly key: string;
  readonly heading: string;
  readonly group: MasterReportColumnDef['group'];
  readonly format: MasterColumnFormat;
}

export interface ProjectedMasterReportRow {
  readonly id: string;
  readonly rowNumber: number;
  readonly classification: AwardedBoqRowClassification;
  readonly sectionLabel: string;
  readonly hasDiscrepancy: boolean;
  readonly values: Record<string, string | number | null>;
}

export interface ProjectedMasterReport {
  readonly purpose: MasterReportPurpose;
  readonly reportTitle: string;
  readonly reportNumber: string;
  readonly periodEnding: string;
  readonly showSignatureBlock: boolean;
  readonly isWorkingCopyOnly: boolean;
  readonly hasVerifiedProgressRecords: boolean;
  readonly officialContractDisclosure: string | null;
  readonly columns: ReadonlyArray<ProjectedMasterReportColumn>;
  readonly rows: ReadonlyArray<ProjectedMasterReportRow>;
  readonly totals: {
    readonly payItemCount: number;
    readonly contractTotal: number;
    readonly weightedPctSum: number;
    readonly previousAccomplishmentTotal: number;
    readonly currentPeriodTotal: number;
    readonly cumulativeAccomplishmentTotal: number;
    readonly overallPercentCompleted: number;
  };
}

export const CORE_MASTER_COLUMNS: ReadonlyArray<MasterReportColumnDef> = [
  { key: 'itemCode', defaultHeading: 'Item No.', group: 'BOQ', format: 'text', description: 'Original BOQ item code' },
  { key: 'description', defaultHeading: 'Description of Work', group: 'BOQ', format: 'text', description: 'Original BOQ work description' },
  { key: 'unit', defaultHeading: 'Unit/s', group: 'BOQ', format: 'text', description: 'Preserved original source measurement unit' },
  { key: 'quantity', defaultHeading: 'Qty', group: 'BOQ', format: 'number', description: 'Original awarded quantity' },
  { key: 'effectiveAwardedUnitRate', defaultHeading: 'Unit Cost', group: 'BOQ', format: 'currency', description: 'Effective awarded unit rate (Final Line Amount ÷ Qty)', isDerived: true },
  { key: 'finalLineAmount', defaultHeading: 'Total Cost', group: 'BOQ', format: 'currency', description: 'Final awarded line amount (source total-cost column)' },
  { key: 'weightedPct', defaultHeading: 'Weighted %', group: 'BOQ', format: 'percent', description: 'Item share of total awarded BOQ (Line Amount ÷ Grand Total)', isDerived: true },
  { key: 'directUnitCost', defaultHeading: 'Direct Unit Cost', group: 'COST_BREAKDOWN', format: 'currency', description: 'Original direct unit cost (before markups/VAT)' },
  { key: 'directCost', defaultHeading: 'Estimated Direct Cost', group: 'COST_BREAKDOWN', format: 'currency', description: 'Original direct cost component' },
  { key: 'ocmAmount', defaultHeading: 'OCM', group: 'COST_BREAKDOWN', format: 'currency', description: 'Overhead, Contingencies & Miscellaneous component' },
  { key: 'profitAmount', defaultHeading: 'Contractor Profit', group: 'COST_BREAKDOWN', format: 'currency', description: 'Contractor profit component' },
  { key: 'vatAmount', defaultHeading: 'VAT', group: 'COST_BREAKDOWN', format: 'currency', description: 'Tax / VAT component from source workbook' },
  { key: 'indirectCost', defaultHeading: 'Total Indirect Cost', group: 'COST_BREAKDOWN', format: 'currency', description: 'Total indirect cost / markup component' },
  { key: 'currentPeriodQty', defaultHeading: 'Accomplished Qty', group: 'ACCOMPLISHMENT', format: 'number', description: 'Verified accomplished quantity for period (0 if none recorded)', isDerived: true },
  { key: 'accomplishmentUnit', defaultHeading: 'Accomp. Unit/s', group: 'ACCOMPLISHMENT', format: 'text', description: 'Preserved source unit for accomplishment quantity', isDerived: true },
  { key: 'currentPeriodAmt', defaultHeading: 'Accomplished Total', group: 'ACCOMPLISHMENT', format: 'currency', description: 'Accomplished Qty × Effective Awarded Unit Rate', isDerived: true },
  { key: 'previousAccomplishmentAmt', defaultHeading: 'PREVIOUS', group: 'ACCOMPLISHMENT', format: 'currency', description: 'Verified prior certified accomplishment amount', isDerived: true },
  { key: 'thisPeriodAmt', defaultHeading: 'THIS PERIOD', group: 'ACCOMPLISHMENT', format: 'currency', description: 'Verified current period accomplishment amount', isDerived: true },
  { key: 'cumulativeAccomplishmentAmt', defaultHeading: 'ACCOMPLISHMENT TO DATE', group: 'ACCOMPLISHMENT', format: 'currency', description: 'Previous + This Period cumulative accomplishment', isDerived: true },
  { key: 'percentCompleted', defaultHeading: '%', group: 'ACCOMPLISHMENT', format: 'percent', description: 'Cumulative Accomplishment ÷ Total BOQ Amount', isDerived: true },
  { key: 'remarks', defaultHeading: 'Remarks', group: 'ACCOMPLISHMENT', format: 'text', description: 'Progress or billing remarks' },
  { key: 'sectionLabel', defaultHeading: 'Section / Group', group: 'PROVENANCE', format: 'text', description: 'Detected BOQ section or heading group' },
  { key: 'sourceCellRef', defaultHeading: 'Source Cell', group: 'PROVENANCE', format: 'text', description: 'Immutable workbook worksheet and cell reference' },
  { key: 'formulaText', defaultHeading: 'Source Formula', group: 'PROVENANCE', format: 'formula', description: 'Original preserved Excel formula' },
];

export const MASTER_REPORT_PRESETS: Readonly<Record<MasterReportPurpose, MasterReportLayoutConfig>> = {
  BOQ_SUMMARY: {
    purpose: 'BOQ_SUMMARY',
    selectedColumns: ['itemCode', 'description', 'unit', 'quantity', 'effectiveAwardedUnitRate', 'finalLineAmount'],
    headingAliases: {
      itemCode: 'Item Code',
      description: 'Description of Work',
      unit: 'Unit',
      quantity: 'Quantity',
      effectiveAwardedUnitRate: 'Final Awarded Unit Rate',
      finalLineAmount: 'Final Line Amount',
    },
    selectedSections: [],
    includeHeadings: true,
    includeNotes: false,
    includeSubtotals: true,
    groupBySection: true,
    reportTitle: 'PROJECT BOQ SUMMARY',
    reportNumber: '',
    periodEnding: '',
    showSignatureBlock: false,
  },
  ACCOMPLISHMENT_REPORT: {
    purpose: 'ACCOMPLISHMENT_REPORT',
    selectedColumns: [
      'itemCode',
      'description',
      'unit',
      'quantity',
      'effectiveAwardedUnitRate',
      'finalLineAmount',
      'weightedPct',
      'currentPeriodQty',
      'accomplishmentUnit',
      'currentPeriodAmt',
      'previousAccomplishmentAmt',
      'thisPeriodAmt',
      'cumulativeAccomplishmentAmt',
      'percentCompleted',
      'remarks',
    ],
    headingAliases: {},
    selectedSections: [],
    includeHeadings: true,
    includeNotes: false,
    includeSubtotals: false,
    groupBySection: true,
    reportTitle: 'PROJECT ACCOMPLISHMENT REPORT',
    reportNumber: '____',
    periodEnding: '',
    showSignatureBlock: true,
  },
  PROGRESS_BILLING_WORKING_COPY: {
    purpose: 'PROGRESS_BILLING_WORKING_COPY',
    selectedColumns: [
      'itemCode',
      'description',
      'unit',
      'quantity',
      'effectiveAwardedUnitRate',
      'finalLineAmount',
      'weightedPct',
      'currentPeriodQty',
      'accomplishmentUnit',
      'currentPeriodAmt',
      'previousAccomplishmentAmt',
      'thisPeriodAmt',
      'cumulativeAccomplishmentAmt',
      'percentCompleted',
      'remarks',
    ],
    headingAliases: {},
    selectedSections: [],
    includeHeadings: true,
    includeNotes: false,
    includeSubtotals: false,
    groupBySection: true,
    reportTitle: 'PROJECT ACCOMPLISHMENT REPORT — FIRST PROGRESS BILLING (WORKING COPY)',
    reportNumber: '01 (WORKING COPY)',
    periodEnding: '',
    showSignatureBlock: true,
  },
  CUSTOM_REPORT: {
    purpose: 'CUSTOM_REPORT',
    selectedColumns: [
      'itemCode',
      'description',
      'unit',
      'quantity',
      'directUnitCost',
      'directCost',
      'indirectCost',
      'effectiveAwardedUnitRate',
      'finalLineAmount',
    ],
    headingAliases: {},
    selectedSections: [],
    includeHeadings: true,
    includeNotes: false,
    includeSubtotals: true,
    groupBySection: true,
    reportTitle: 'CUSTOM MASTER BOQ REPORT',
    reportNumber: '',
    periodEnding: '',
    showSignatureBlock: false,
  },
};

function safeHeadingText(raw: string | undefined, fallback: string): string {
  const trimmed = String(raw ?? '').trim().slice(0, 120);
  if (!trimmed) return fallback;
  return neutralizeSpreadsheetFormulaForCsv(trimmed);
}

function toNumOrNull(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const cleaned = val.replace(/[₱$,\s]/g, '').trim();
    if (!cleaned || cleaned === '-' || cleaned === '—') return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

const KNOWN_MAPPED_KEYS = new Set([
  'item_code',
  'work_description',
  'description',
  'unit',
  'uom',
  'approved_qty',
  'quantity',
  'original_qty',
  'contract_unit_rate',
  'unit_price',
  'contract_line_amount',
  'amount',
  'estimated_direct_cost',
  'agency_edc_amt',
  'estimated_indirect_cost',
  'ocm_amount',
  'contractor_profit_amt',
  'estimate_vat_amt',
  'phase_code',
  'section_code',
  'source_line_id',
  '_rowClassification',
]);

/**
 * Builds the immutable canonical Master BOQ dataset from an extracted source document's candidates
 * and verification report, preserving ALL original source columns and computing effective awarded rates.
 */
export function buildMasterBoqDatasetFromSource(params: {
  projectId: string;
  projectName: string;
  projectLocation?: string | null;
  clientName?: string | null;
  contractorName?: string | null;
  contractNumber?: string | null;
  officialAwardedContractAmount?: number | null;
  sourceDocumentId: string;
  sourceFileName: string;
  sourceSha256Hash: string;
  candidates: ReadonlyArray<{
    readonly id: string;
    readonly sourceRowNumber: number | null;
    readonly sourceCellRef: string | null;
    readonly sheetOrPageRef?: string | null;
    readonly rawFormulaText: string | null;
    readonly mappedFields: Record<string, unknown>;
    readonly rowClassification?: AwardedBoqRowClassification | null;
  }>;
  persistedWorkbookSummary?: Partial<AwardedBoqVerificationReport> | null;
  hasVerifiedProgressRecords?: boolean;
}): MasterBoqDataset {
  const verification = reconcileImportedAwardedBoqCandidates(params.candidates, {
    officialAwardedContractAmount: params.officialAwardedContractAmount ?? null,
    persistedWorkbookSummary: params.persistedWorkbookSummary ?? null,
  });

  const extraColumnKeys = new Set<string>();
  const candidateByRowRef = new Map<string, (typeof params.candidates)[number]>();
  for (const c of params.candidates) {
    const key = `${c.sourceRowNumber ?? 0}::${c.sourceCellRef ?? ''}`;
    candidateByRowRef.set(key, c);
    for (const k of Object.keys(c.mappedFields || {})) {
      if (!KNOWN_MAPPED_KEYS.has(k)) {
        extraColumnKeys.add(k);
      }
    }
  }

  const grandTotal = verification.recalculatedTotal > 0 ? verification.recalculatedTotal : 0;
  let currentSection = 'General';
  const sectionsSet = new Set<string>();
  const rows: MasterBoqRow[] = [];

  for (let idx = 0; idx < verification.classifiedRows.length; idx++) {
    const cr = verification.classifiedRows[idx];
    if (cr.classification === 'HEADER_META') continue;

    if (cr.classification === 'HEADING' || cr.classification === 'SUBHEADING') {
      const headingLabel = cr.itemCode ? `${cr.itemCode} — ${cr.description}` : cr.description;
      if (headingLabel.trim()) {
        currentSection = headingLabel.trim().slice(0, 120);
        sectionsSet.add(currentSection);
      }
    } else {
      sectionsSet.add(currentSection);
    }

    const cand = candidateByRowRef.get(`${cr.rowNumber}::${cr.cellRef}`);
    const mf = cand?.mappedFields ?? {};

    const extraSourceColumns: Record<string, string | number | null> = {};
    for (const ek of extraColumnKeys) {
      const raw = mf[ek];
      extraSourceColumns[ek] =
        typeof raw === 'number' || typeof raw === 'string' ? raw : null;
    }

    const qty = cr.quantity;
    const directUnitCost = cr.unitPrice;
    const directCost = cr.directCost ?? toNumOrNull(mf.estimated_direct_cost);
    const indirectCost = cr.indirectCost ?? toNumOrNull(mf.estimated_indirect_cost);
    const ocmAmount = toNumOrNull(mf.ocm_amount);
    const profitAmount = toNumOrNull(mf.contractor_profit_amt);
    const vatAmount = toNumOrNull(mf.estimate_vat_amt);

    // Final awarded line amount: use verified recalculated/lineAmount (Column Q in PGH), NEVER confuse with indirect cost!
    let finalLineAmount = cr.classification === 'PAY_ITEM' ? (cr.recalculatedAmount ?? cr.lineAmount) : cr.lineAmount;
    if (
      cr.classification === 'PAY_ITEM' &&
      directCost !== null &&
      indirectCost !== null &&
      finalLineAmount !== null &&
      Math.abs(finalLineAmount - indirectCost) < 0.05 &&
      directCost > indirectCost
    ) {
      finalLineAmount = roundCurrency(directCost + indirectCost, 2);
    }

    const effectiveAwardedUnitRate =
      cr.classification === 'PAY_ITEM' && qty !== null && qty > 0 && finalLineAmount !== null
        ? Number((finalLineAmount / qty).toFixed(6))
        : directUnitCost;

    const weightedPct =
      cr.classification === 'PAY_ITEM' && grandTotal > 0 && finalLineAmount !== null
        ? Number((finalLineAmount / grandTotal).toFixed(8))
        : null;

    rows.push({
      id: cand?.id ?? `row-${idx + 1}`,
      rowNumber: cr.rowNumber,
      worksheet: cr.worksheet,
      sectionLabel: currentSection,
      classification: cr.classification,
      itemCode: cr.itemCode ?? '',
      description: cr.description,
      unit: cr.unit ?? '',
      quantity: qty,
      directUnitCost,
      directCost,
      ocmAmount,
      profitAmount,
      vatAmount,
      indirectCost,
      finalLineAmount,
      effectiveAwardedUnitRate,
      weightedPct,
      formulaText: cr.formulaText,
      sourceCellRef: cr.cellRef,
      hasDiscrepancy: cr.hasDiscrepancy,
      extraSourceColumns,
    });
  }

  const availableColumns: MasterReportColumnDef[] = [
    ...CORE_MASTER_COLUMNS,
    ...[...extraColumnKeys].sort().map((ek) => ({
      key: `extra:${ek}`,
      defaultHeading: ek.replace(/_/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase()),
      group: 'SOURCE_EXTRA' as const,
      format: 'text' as const,
      description: `Preserved original source column (${ek})`,
    })),
  ];

  return {
    projectId: params.projectId,
    projectName: params.projectName,
    projectLocation: params.projectLocation ?? null,
    clientName: params.clientName ?? null,
    contractorName: params.contractorName ?? null,
    contractNumber: params.contractNumber ?? null,
    officialAwardedContractAmount: verification.officialAwardedContractAmount,
    sourceDocumentId: params.sourceDocumentId,
    sourceFileName: params.sourceFileName,
    sourceSha256Hash: params.sourceSha256Hash,
    recalculatedTotal: verification.recalculatedTotal,
    payItemCount: verification.counts.payItems,
    headingAndNoteCount: verification.counts.headingsAndNotes,
    discrepancyCount: verification.counts.discrepancies,
    calculationCheck: verification.calculationCheck,
    formulaCheck: verification.formulaCheck,
    sections: [...sectionsSet],
    availableColumns,
    rows,
    hasVerifiedProgressRecords: Boolean(params.hasVerifiedProgressRecords),
  };
}

/**
 * Projects a user-configured report layout over the immutable Master BOQ dataset.
 * Never alters original source quantities, rates, formulas, or contract authority.
 */
export function projectMasterBoqReport(
  dataset: MasterBoqDataset,
  config: MasterReportLayoutConfig,
  verifiedProgress?: ReadonlyArray<VerifiedProgressInputRow>
): ProjectedMasterReport {
  const colMap = new Map(dataset.availableColumns.map((c) => [c.key, c]));
  const columns: ProjectedMasterReportColumn[] = [];
  const seen = new Set<string>();

  for (const key of config.selectedColumns) {
    const def = colMap.get(key);
    if (!def || seen.has(key)) continue;
    seen.add(key);
    columns.push({
      key: def.key,
      heading: safeHeadingText(config.headingAliases[key], def.defaultHeading),
      group: def.group,
      format: def.format,
    });
  }

  if (columns.length === 0) {
    for (const fallbackKey of MASTER_REPORT_PRESETS.BOQ_SUMMARY.selectedColumns) {
      const def = colMap.get(fallbackKey);
      if (def) {
        columns.push({ key: def.key, heading: def.defaultHeading, group: def.group, format: def.format });
      }
    }
  }

  const progressByCell = new Map<string, VerifiedProgressInputRow>();
  const progressByCode = new Map<string, VerifiedProgressInputRow>();
  for (const pr of verifiedProgress ?? []) {
    if (pr.sourceCellRef) progressByCell.set(pr.sourceCellRef, pr);
    if (pr.itemCode) progressByCode.set(pr.itemCode, pr);
  }
  const hasVerifiedProgressRecords = (verifiedProgress?.length ?? 0) > 0;

  const sectionFilter =
    config.selectedSections.length > 0 ? new Set(config.selectedSections) : null;

  const filtered = dataset.rows.filter((r) => {
    if (sectionFilter && !sectionFilter.has(r.sectionLabel)) return false;
    if ((r.classification === 'HEADING' || r.classification === 'SUBHEADING') && !config.includeHeadings) return false;
    if (r.classification === 'NOTE' && !config.includeNotes) return false;
    if ((r.classification === 'SUBTOTAL' || r.classification === 'GRAND_TOTAL') && !config.includeSubtotals) return false;
    return true;
  });

  // Compute filtered pay-item denominator so weighted % sums to 100% on the selected scope
  const scopedContractTotal = roundCurrency(
    filtered.reduce(
      (sum, r) => (r.classification === 'PAY_ITEM' && r.finalLineAmount !== null ? sum + r.finalLineAmount : sum),
      0
    ),
    2
  );
  const weightDenom = scopedContractTotal > 0 ? scopedContractTotal : dataset.recalculatedTotal;

  let payItemCount = 0;
  let weightedPctSum = 0;
  let prevTotal = 0;
  let currTotal = 0;
  let cumTotal = 0;

  const projectedRows: ProjectedMasterReportRow[] = filtered.map((r) => {
    const isPay = r.classification === 'PAY_ITEM';
    const prog = isPay
      ? (progressByCell.get(r.sourceCellRef) ?? (r.itemCode ? progressByCode.get(r.itemCode) : undefined))
      : undefined;

    const effRate = r.effectiveAwardedUnitRate ?? 0;
    const prevAmt = isPay ? roundCurrency(prog?.previousAccomplishmentAmt ?? 0, 2) : null;
    const currQty = isPay ? (prog?.currentPeriodQty ?? 0) : null;
    const currAmt = isPay && currQty !== null ? roundCurrency(currQty * effRate, 2) : null;
    const cumAmt = isPay && prevAmt !== null && currAmt !== null ? roundCurrency(prevAmt + currAmt, 2) : null;
    const rowWeightedPct =
      isPay && weightDenom > 0 && r.finalLineAmount !== null ? r.finalLineAmount / weightDenom : null;
    const pctCompleted =
      isPay && weightDenom > 0 && cumAmt !== null ? cumAmt / weightDenom : null;

    if (isPay) {
      payItemCount++;
      if (rowWeightedPct !== null) weightedPctSum += rowWeightedPct;
      if (prevAmt !== null) prevTotal = roundCurrency(prevTotal + prevAmt, 2);
      if (currAmt !== null) currTotal = roundCurrency(currTotal + currAmt, 2);
      if (cumAmt !== null) cumTotal = roundCurrency(cumTotal + cumAmt, 2);
    }

    const values: Record<string, string | number | null> = {};
    for (const col of columns) {
      if (col.key.startsWith('extra:')) {
        const ek = col.key.slice(6);
        values[col.key] = r.extraSourceColumns[ek] ?? null;
        continue;
      }
      switch (col.key) {
        case 'itemCode':
          values[col.key] = r.itemCode || null;
          break;
        case 'description':
          values[col.key] = r.description;
          break;
        case 'unit':
          values[col.key] = r.unit || null;
          break;
        case 'quantity':
          values[col.key] = r.quantity;
          break;
        case 'effectiveAwardedUnitRate':
          values[col.key] = r.effectiveAwardedUnitRate !== null ? roundCurrency(r.effectiveAwardedUnitRate, 2) : null;
          break;
        case 'finalLineAmount':
          values[col.key] = r.finalLineAmount !== null ? roundCurrency(r.finalLineAmount, 2) : null;
          break;
        case 'weightedPct':
          values[col.key] = rowWeightedPct !== null ? Number(rowWeightedPct.toFixed(6)) : null;
          break;
        case 'directUnitCost':
          values[col.key] = r.directUnitCost !== null ? roundCurrency(r.directUnitCost, 2) : null;
          break;
        case 'directCost':
          values[col.key] = r.directCost !== null ? roundCurrency(r.directCost, 2) : null;
          break;
        case 'ocmAmount':
          values[col.key] = r.ocmAmount !== null ? roundCurrency(r.ocmAmount, 2) : null;
          break;
        case 'profitAmount':
          values[col.key] = r.profitAmount !== null ? roundCurrency(r.profitAmount, 2) : null;
          break;
        case 'vatAmount':
          values[col.key] = r.vatAmount !== null ? roundCurrency(r.vatAmount, 2) : null;
          break;
        case 'indirectCost':
          values[col.key] = r.indirectCost !== null ? roundCurrency(r.indirectCost, 2) : null;
          break;
        case 'currentPeriodQty':
          values[col.key] = currQty;
          break;
        case 'accomplishmentUnit':
          values[col.key] = isPay ? r.unit || null : null;
          break;
        case 'currentPeriodAmt':
        case 'thisPeriodAmt':
          values[col.key] = currAmt;
          break;
        case 'previousAccomplishmentAmt':
          values[col.key] = prevAmt;
          break;
        case 'cumulativeAccomplishmentAmt':
          values[col.key] = cumAmt;
          break;
        case 'percentCompleted':
          values[col.key] = pctCompleted !== null ? Number(pctCompleted.toFixed(6)) : null;
          break;
        case 'remarks':
          values[col.key] = prog?.remarks ?? '';
          break;
        case 'sectionLabel':
          values[col.key] = r.sectionLabel;
          break;
        case 'sourceCellRef':
          values[col.key] = r.sourceCellRef;
          break;
        case 'formulaText':
          values[col.key] = r.formulaText;
          break;
        default:
          values[col.key] = null;
      }
    }

    return {
      id: r.id,
      rowNumber: r.rowNumber,
      classification: r.classification,
      sectionLabel: r.sectionLabel,
      hasDiscrepancy: r.hasDiscrepancy,
      values,
    };
  });

  const officialContractDisclosure =
    dataset.officialAwardedContractAmount === null
      ? 'BOQ calculations verified. Official contract amount required to complete contract reconciliation.'
      : null;

  return {
    purpose: config.purpose,
    reportTitle: safeHeadingText(config.reportTitle, MASTER_REPORT_PRESETS[config.purpose].reportTitle),
    reportNumber: safeHeadingText(config.reportNumber, ''),
    periodEnding: safeHeadingText(config.periodEnding, ''),
    showSignatureBlock: config.showSignatureBlock,
    isWorkingCopyOnly: true,
    hasVerifiedProgressRecords,
    officialContractDisclosure,
    columns,
    rows: projectedRows,
    totals: {
      payItemCount,
      contractTotal: scopedContractTotal,
      weightedPctSum: Number(weightedPctSum.toFixed(6)),
      previousAccomplishmentTotal: prevTotal,
      currentPeriodTotal: currTotal,
      cumulativeAccomplishmentTotal: cumTotal,
      overallPercentCompleted: weightDenom > 0 ? Number((cumTotal / weightDenom).toFixed(6)) : 0,
    },
  };
}

function colIndexToLetter(index1Based: number): string {
  let n = index1Based;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

/**
 * Exports a projected Master BOQ Report to a validated .xlsx workbook with live Excel formulas,
 * provenance header, grouped super-headers (for Accomplishment/Billing), and optional signature block.
 */
export async function exportMasterReportToXlsxBuffer(
  dataset: MasterBoqDataset,
  report: ProjectedMasterReport
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'OneSystems ERP — Master BOQ Report Builder';
  wb.created = new Date();

  const sheetName =
    report.purpose === 'ACCOMPLISHMENT_REPORT' || report.purpose === 'PROGRESS_BILLING_WORKING_COPY'
      ? 'Accomplishment Report'
      : 'BOQ Summary';
  const ws = wb.addWorksheet(sheetName);

  // Project Identity & Provenance Header Block
  const addInfoRow = (label: string, value: string, bold = false) => {
    const row = ws.addRow([neutralizeSpreadsheetFormulaForCsv(label), neutralizeSpreadsheetFormulaForCsv(value)]);
    row.font = { bold, size: bold ? 12 : 10 };
  };

  addInfoRow('CLIENT / OWNER', dataset.clientName || 'Not Recorded');
  addInfoRow('PROJECT', dataset.projectName, true);
  addInfoRow('LOCATION', dataset.projectLocation || 'Not Recorded');
  addInfoRow('REPORT', report.reportNumber ? `${report.reportTitle} — No. ${report.reportNumber}` : report.reportTitle, true);
  if (report.periodEnding) {
    addInfoRow('PERIOD ENDING', report.periodEnding);
  }
  addInfoRow('CONTRACTOR', dataset.contractorName || 'Not Recorded');
  addInfoRow(
    'MASTER BOQ SOURCE',
    `${dataset.sourceFileName} (SHA-256: ${dataset.sourceSha256Hash.slice(0, 16)}...) · Read-Only Working Copy — Does NOT certify billing or authorize payment`
  );
  if (report.officialContractDisclosure) {
    addInfoRow('CONTRACT RECONCILIATION', report.officialContractDisclosure);
  }
  ws.addRow([]);

  // Grouped Super-Header Row for Accomplishment / Progress Billing
  const hasAccompCols = report.columns.some((c) => c.group === 'ACCOMPLISHMENT');
  if (hasAccompCols) {
    const superRow = ws.addRow(
      report.columns.map((c) =>
        c.group === 'ACCOMPLISHMENT' ? 'PROJECT ACCOMPLISHMENT' : 'AWARDED BILL OF QUANTITY'
      )
    );
    superRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    superRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    });
  }

  // Column Heading Row
  const headerRow = ws.addRow(report.columns.map((c) => c.heading));
  headerRow.font = { bold: true };
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF64748B' } } };
  });

  const colLetterByKey = new Map<string, string>();
  report.columns.forEach((c, i) => colLetterByKey.set(c.key, colIndexToLetter(i + 1)));

  const firstDataRowNum = ws.rowCount + 1;
  const totalRowPlaceholderNum = firstDataRowNum + report.rows.length;

  for (const r of report.rows) {
    const excelRowNum = ws.rowCount + 1;
    const isPay = r.classification === 'PAY_ITEM';
    const rowVals = report.columns.map((col) => {
      const val = r.values[col.key];
      if (isPay) {
        const qCol = colLetterByKey.get('quantity');
        const rateCol = colLetterByKey.get('effectiveAwardedUnitRate');
        const amtCol = colLetterByKey.get('finalLineAmount');
        const currQtyCol = colLetterByKey.get('currentPeriodQty');
        const prevCol = colLetterByKey.get('previousAccomplishmentAmt');
        const thisCol = colLetterByKey.get('thisPeriodAmt') ?? colLetterByKey.get('currentPeriodAmt');
        const cumCol = colLetterByKey.get('cumulativeAccomplishmentAmt');

        if (col.key === 'finalLineAmount' && qCol && rateCol && typeof val === 'number') {
          return { formula: `${qCol}${excelRowNum}*${rateCol}${excelRowNum}`, result: val };
        }
        if (col.key === 'weightedPct' && amtCol && typeof val === 'number') {
          return { formula: `${amtCol}${excelRowNum}/$${amtCol}$${totalRowPlaceholderNum}`, result: val };
        }
        if ((col.key === 'currentPeriodAmt' || col.key === 'thisPeriodAmt') && currQtyCol && rateCol && typeof val === 'number') {
          return { formula: `${currQtyCol}${excelRowNum}*${rateCol}${excelRowNum}`, result: val };
        }
        if (col.key === 'cumulativeAccomplishmentAmt' && prevCol && thisCol && typeof val === 'number') {
          return { formula: `${prevCol}${excelRowNum}+${thisCol}${excelRowNum}`, result: val };
        }
        if (col.key === 'percentCompleted' && cumCol && amtCol && typeof val === 'number') {
          return { formula: `${cumCol}${excelRowNum}/$${amtCol}$${totalRowPlaceholderNum}`, result: val };
        }
      }
      if (typeof val === 'string') return neutralizeSpreadsheetFormulaForCsv(val);
      return val ?? '';
    });

    const added = ws.addRow(rowVals);
    if (r.classification === 'HEADING' || r.classification === 'SUBHEADING') {
      added.font = { bold: true };
    }
    report.columns.forEach((col, i) => {
      const cell = added.getCell(i + 1);
      if (col.format === 'currency') cell.numFmt = '#,##0.00';
      else if (col.format === 'percent') cell.numFmt = '0.00%';
      else if (col.format === 'number') cell.numFmt = '#,##0.##';
    });
  }

  const lastDataRowNum = ws.rowCount;
  // Grand Total Row
  const totalVals = report.columns.map((col, i) => {
    const letter = colIndexToLetter(i + 1);
    if (col.key === 'description') return 'TOTAL PROJECT COST';
    if (
      [
        'finalLineAmount',
        'directCost',
        'indirectCost',
        'ocmAmount',
        'profitAmount',
        'vatAmount',
        'weightedPct',
        'currentPeriodAmt',
        'previousAccomplishmentAmt',
        'thisPeriodAmt',
        'cumulativeAccomplishmentAmt',
        'percentCompleted',
      ].includes(col.key) &&
      lastDataRowNum >= firstDataRowNum
    ) {
      const resultMap: Record<string, number> = {
        finalLineAmount: report.totals.contractTotal,
        weightedPct: report.totals.weightedPctSum,
        currentPeriodAmt: report.totals.currentPeriodTotal,
        thisPeriodAmt: report.totals.currentPeriodTotal,
        previousAccomplishmentAmt: report.totals.previousAccomplishmentTotal,
        cumulativeAccomplishmentAmt: report.totals.cumulativeAccomplishmentTotal,
        percentCompleted: report.totals.overallPercentCompleted,
      };
      return {
        formula: `SUM(${letter}${firstDataRowNum}:${letter}${lastDataRowNum})`,
        result: resultMap[col.key] ?? undefined,
      };
    }
    return '';
  });
  const totalRow = ws.addRow(totalVals);
  totalRow.font = { bold: true };
  report.columns.forEach((col, i) => {
    const cell = totalRow.getCell(i + 1);
    if (col.format === 'currency') cell.numFmt = '#,##0.00';
    else if (col.format === 'percent') cell.numFmt = '0.00%';
  });

  // Optional Signature Block (matches First Progress Billing reference)
  if (report.showSignatureBlock) {
    ws.addRow([]);
    ws.addRow([]);
    const sigHeader = ws.addRow(['', 'Prepared by:', '', 'Reviewed and Submitted by:', '', '', 'Noted by:']);
    sigHeader.font = { bold: true };
    ws.addRow([]);
    const sigRoles = ws.addRow(['', 'PROJECT ENGINEER', '', 'PROJECT MANAGER', '', '', 'PROJECT DIRECTOR']);
    sigRoles.font = { bold: true };
  }

  // Sensible column widths
  report.columns.forEach((col, i) => {
    ws.getColumn(i + 1).width =
      col.key === 'description' ? 46 : col.key === 'remarks' ? 24 : col.format === 'currency' ? 18 : 14;
  });

  const arrayBuf = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuf);
}

/**
 * Pure read-only preview for Optional Input Mapping (Phase D):
 * Applies a proposed source-column-to-canonical-field remap in memory and recalculates totals
 * WITHOUT altering the immutable original source document or requiring per-item approval.
 */
export function previewOptionalInputMapping(params: {
  candidates: ReadonlyArray<{
    readonly id: string;
    readonly sourceRowNumber: number | null;
    readonly sourceCellRef: string | null;
    readonly sheetOrPageRef?: string | null;
    readonly rawFormulaText: string | null;
    readonly mappedFields: Record<string, unknown>;
    readonly rowClassification?: AwardedBoqRowClassification | null;
  }>;
  fieldRemap: Readonly<Record<string, string>>;
  officialAwardedContractAmount?: number | null;
}): {
  readonly before: { payItems: number; recalculatedTotal: number; discrepancies: number };
  readonly after: { payItems: number; recalculatedTotal: number; discrepancies: number };
  readonly sampleRows: ReadonlyArray<{
    sourceCellRef: string;
    itemCode: string | null;
    description: string;
    unit: string | null;
    quantity: number | null;
    unitPrice: number | null;
    lineAmount: number | null;
    classification: AwardedBoqRowClassification;
  }>;
} {
  const beforeReport = reconcileImportedAwardedBoqCandidates(params.candidates, {
    officialAwardedContractAmount: params.officialAwardedContractAmount ?? null,
  });

  const remappedCandidates = params.candidates.map((c) => {
    const nextFields: Record<string, unknown> = { ...c.mappedFields };
    for (const [fromKey, toKey] of Object.entries(params.fieldRemap)) {
      if (fromKey && toKey && fromKey !== toKey && Object.hasOwn(c.mappedFields, fromKey)) {
        nextFields[toKey] = c.mappedFields[fromKey];
      }
    }
    return { ...c, mappedFields: nextFields };
  });

  const afterReport = reconcileImportedAwardedBoqCandidates(remappedCandidates, {
    officialAwardedContractAmount: params.officialAwardedContractAmount ?? null,
  });

  return {
    before: {
      payItems: beforeReport.counts.payItems,
      recalculatedTotal: beforeReport.recalculatedTotal,
      discrepancies: beforeReport.counts.discrepancies,
    },
    after: {
      payItems: afterReport.counts.payItems,
      recalculatedTotal: afterReport.recalculatedTotal,
      discrepancies: afterReport.counts.discrepancies,
    },
    sampleRows: afterReport.classifiedRows
      .filter((r) => r.classification !== 'HEADER_META')
      .slice(0, 15)
      .map((r) => ({
        sourceCellRef: r.cellRef,
        itemCode: r.itemCode,
        description: r.description,
        unit: r.unit,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        lineAmount: r.lineAmount,
        classification: r.classification,
      })),
  };
}
