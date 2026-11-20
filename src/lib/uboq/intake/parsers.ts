import * as XLSX from 'xlsx';
import { parse as parseCsvSync } from 'csv-parse/sync';
import { resolveCanonicalFieldId } from '../field-catalog';
import { inspectCellSecurity, scanUploadedDocumentSecurity, readVerifiedOfficeZipEntry, type FileSecurityScanResult } from './security-guard';
import { streamVerifiedXlsxWorksheets } from './xlsx-streaming-reader';
import {
  extractContractDocumentFromPages,
  type ContractTextPage,
  type ExtractedContractDocument,
} from '../contract-document-extractor';
import {
  classifyAwardedBoqRow,
  reconcileImportedAwardedBoqCandidates,
  verifyAwardedBoqWorkbook,
  type AwardedBoqRowClassification,
  type AwardedBoqVerificationReport,
  type ReconcilerWorksheetInput,
} from '../awarded-boq-reconciler';

function ensureServerlessPdfGlobals() {
  const g = globalThis as Record<string, unknown>;
  if (typeof g.DOMMatrix === 'undefined') {
    g.DOMMatrix = class DOMMatrix {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      constructor(init?: number[]) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
    };
  }
  if (typeof g.Path2D === 'undefined') {
    g.Path2D = class Path2D {};
  }
  if (typeof g.ImageData === 'undefined') {
    g.ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(width * height * 4);
      }
    };
  }
}

export interface CellBoundingBox {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export interface ExtractedBoqRowCandidate {
  readonly sectionTitle: string;
  readonly sheetOrPageRef: string;
  readonly pageNumber: number | null;
  readonly sourceRowNumber: number;
  readonly sourceCellRef: string;
  readonly cellCoordinates: Record<string, string>;
  readonly mappedFields: Record<string, string | number | null>;
  readonly rawFormulas: Record<string, string>;
  readonly confidenceScore: number;
  readonly extractionMethod: 'DETERMINISTIC_PARSER' | 'NATIVE_PDF_PARSER' | 'TABLE_PARSER' | 'OCR_RASTER';
  readonly requiresHumanReview: boolean;
  readonly securityAlerts: string[];
  readonly rowClassification?: AwardedBoqRowClassification;
}

export interface UniversalExtractionResult {
  readonly security: FileSecurityScanResult;
  readonly sections: Array<{
    sectionType: string;
    sheetOrPageRef: string;
    sectionTitle: string;
    displayOrder: number;
    headerMap: Record<number, string>;
  }>;
  readonly candidates: ExtractedBoqRowCandidate[];
  readonly blockingErrors: string[];
  readonly awardedBoqVerification?: AwardedBoqVerificationReport;
  readonly contractExtraction?: ExtractedContractDocument;
  readonly extractedTextPages?: ReadonlyArray<ContractTextPage>;
}

interface InternalGridCell {
  text: string;
  numOrText: string | number | null;
  formula: string | null;
  cellRef: string;
  confidence?: number;
}

const MAX_SHEET_ROWS = 10000;
const MAX_SHEET_COLS = 200;

const HEADER_SEMANTIC_PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/^(boq\s*line\s*\/\s*phase|line\s*id\s*\/\s*phase|phase\s*\/\s*line)$/i, 'phase_line_composite'],
  [/^(pay\s*item\s*\/\s*description|item\s*\/\s*description|item\s*code\s*\/\s*description)$/i, 'item_desc_composite'],
  [/^(pay\s*item(\s*(no|code|id|ref|number))?|item\s*(no|code|id|ref|number)|boq\s*(code|line|item|no)|wbs\s*item|ref\s*code|refcode|code|line\s*id|line\s*no)$/i, 'item_code'],
  [/^(phase|phase\s*code|phase\s*id|building|zone|package|part|bldg|work\s*phase)$/i, 'phase_code'],
  [/^(section|division|work\s*section|category)$/i, 'section_code'],
  [/^(work\s*description|item\s*description|description(\s*of\s*works?)?|scope(\s*(of\s*works?|title))?|work\s*item(\s*description)?|particulars|bill\s*item|activity\s*description)$/i, 'work_description'],
  [/^(spec|specification|technical\s*spec|material\s*spec|grade)$/i, 'specification'],
  [/^(unit|uom|meas(urement)?\s*unit|unit\s*of\s*measure)$/i, 'unit'],
  [/^(qty|quantity|quantities|boq\s*(qty|quantity)|approved\s*(qty|quantity)|contract\s*(qty|quantity)|awarded\s*(qty|quantity)|bill\s*(qty|quantity)|est(imated)?\s*(qty|quantity)|total\s*(qty|quantity)|volume)$/i, 'approved_qty'],
  [/^(original\s*(qty|quantity)|orig\s*(qty|quantity))$/i, 'original_qty'],
  [/^(total\s*unit\s*(bid\s*)?(rate|price|cost)|unit\s*(bid\s*)?(rate|price|cost)|unitrate|unitprice|contract\s*(unit\s*)?(rate|price)|bid\s*(unit\s*)?(rate|price)|awarded\s*(unit\s*)?(rate|price)|rate|price\s*per\s*unit)$/i, 'contract_unit_rate'],
  [/^(amount|total\s*(bid\s*)?(amount|cost|price)|bid\s*amount|line\s*(amount|total)|contract\s*(amount|price)|extended\s*(amt|amount|price)|total)$/i, 'contract_line_amount'],
  [/^(resource\s*code|stock\s*code|material\s*code)$/i, 'resource_id'],
  [/^(resource\s*description|material\s*description|material\s*name|resource)$/i, 'resource_description'],
  [/^(resource\s*spec|brand\s*spec)$/i, 'resource_spec'],
  [/^(resource\s*unit|purchase\s*unit|stock\s*unit)$/i, 'resource_unit'],
  [/^(resource\s*coeff|coeff|coefficient|usage\s*per\s*unit|dupa\s*coeff)$/i, 'resource_coeff'],
  [/^(resource\s*summary\s*qty|summary\s*qty)$/i, 'resource_summary_qty'],
  [/^(resource\s*required\s*qty|required\s*qty|total\s*resource\s*qty)$/i, 'resource_required_qty'],
  [/^(target\s*resource\s*cost|benchmark\s*cost|budget\s*unit\s*cost)$/i, 'target_resource_cost'],
  [/^(agency\s*edc|estimated\s*direct\s*cost|edc)$/i, 'estimated_direct_cost'],
  [/^(agency\s*abc|abc)$/i, 'agency_abc'],
  [/^(ocm|ocm\s*amount)$/i, 'ocm_amount'],
  [/^(profit|contractor\s*profit)$/i, 'contractor_profit_amt'],
  [/^(vat|estimate\s*vat)$/i, 'estimate_vat_amt'],
];

const NON_PAYABLE_NOTE_TEXT_REGEX =
  /^(by\s+client|by\s+owner|included|incl\.?|excluded|excl\.?|n\/a|not\s+applicable|not\s+included|for\s+reference|see\s+note|waived|free\s+of\s+charge|foc|tbd|existing|others?)$/i;

export function mapHeaderToCanonicalField(rawHeader: string): string | null {
  const cleaned = String(rawHeader ?? '')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-zA-Z0-9\s_/-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
  if (!cleaned) return null;

  const direct = resolveCanonicalFieldId(cleaned);
  if (direct) return direct;

  for (const [regex, fieldId] of HEADER_SEMANTIC_PATTERNS) {
    if (regex.test(cleaned)) {
      return fieldId;
    }
  }
  return null;
}

function parseNumericValue(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const stripped = val.replace(/[₱$,\s]/g, '').trim();
    if (!stripped || stripped === '-' || stripped === '—' || /[?a-zA-Z]/.test(stripped)) return null;
    const num = Number(stripped);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function unzipDocxDocumentXml(buf: Buffer): string {
  // Local ZIP headers may carry zero sizes for data-descriptor entries. Use the
  // same verified central-directory metadata as the upload security scanner;
  // missing or ambiguous document.xml must fail closed, never return empty data.
  return readVerifiedOfficeZipEntry(buf, 'word/document.xml').toString('utf8');
}

function parseGridRowsToCandidates(
  rows: Array<Array<InternalGridCell>>,
  sheetOrPageRef: string,
  sectionTitle: string,
  extractionMethod: ExtractedBoqRowCandidate['extractionMethod'],
  baseConfidence: number,
  pageNumber: number | null = null
): {
  headerMap: Record<number, string>;
  candidates: ExtractedBoqRowCandidate[];
  blockingErrors: string[];
} {
  const headerMap: Record<number, string> = {};
  const candidates: ExtractedBoqRowCandidate[] = [];
  const blockingErrors: string[] = [];

  let headerRowIdx = -1;
  let bestScore = 0;

  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const row = rows[r];
    if (!row) continue;
    const nextRow = r + 1 < rows.length ? rows[r + 1] : null;
    const nextLooksLikeSubHeader =
      Boolean(nextRow) &&
      nextRow!.filter((c) => c && String(c.text ?? '').trim() !== '').length >= 2 &&
      nextRow!.every((c) => !c || parseNumericValue(c.text) === null) &&
      !nextRow!.some((c) => c && /^\(\d+\)$/.test(String(c.text ?? '').trim()));

    const tryHeader = (useNext: boolean) => {
      let matchedCols = 0;
      const tempMap: Record<number, string> = {};
      const maxCols = Math.max(row.length, useNext && nextRow ? nextRow.length : 0);
      for (let c = 0; c < maxCols; c++) {
        const baseText = String(row[c]?.text ?? '').trim();
        const combinedText = useNext && nextRow ? `${baseText} ${String(nextRow[c]?.text ?? '').trim()}`.trim() : baseText;
        const mapped = mapHeaderToCanonicalField(combinedText) ?? (useNext ? mapHeaderToCanonicalField(baseText) : null);
        if (mapped && !Object.values(tempMap).includes(mapped)) {
          tempMap[c] = mapped;
          matchedCols++;
        }
      }
      return { matchedCols, tempMap };
    };

    const singleTry = tryHeader(false);
    const mergedTry = nextLooksLikeSubHeader ? tryHeader(true) : { matchedCols: 0, tempMap: {} };
    const chosen = mergedTry.matchedCols > singleTry.matchedCols ? mergedTry : singleTry;
    const effectiveHeaderIdx = mergedTry.matchedCols > singleTry.matchedCols ? r + 1 : r;

    if (chosen.matchedCols >= 2 && chosen.matchedCols > bestScore) {
      bestScore = chosen.matchedCols;
      headerRowIdx = effectiveHeaderIdx;
      for (const k of Object.keys(headerMap)) delete headerMap[Number(k)];
      Object.assign(headerMap, chosen.tempMap);
    }
  }

  if (headerRowIdx === -1) {
    return { headerMap, candidates, blockingErrors };
  }

  let currentPhaseContext = 'GENERAL';
  const numericCanonicalFields = new Set([
    'approved_qty',
    'original_qty',
    'contract_unit_rate',
    'contract_line_amount',
    'resource_coeff',
    'resource_summary_qty',
    'resource_required_qty',
    'target_resource_cost',
    'estimated_direct_cost',
    'agency_abc',
    'ocm_amount',
    'contractor_profit_amt',
    'estimate_vat_amt',
  ]);

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const nonEmptyCells = row.filter((c) => c && String(c.text ?? '').trim() !== '');
    if (nonEmptyCells.length === 0) continue;

    const securityAlerts: string[] = [];
    for (const cell of nonEmptyCells) {
      const checkText = cell.formula ? cell.formula : cell.text;
      const scan = inspectCellSecurity(checkText);
      if (scan.isFormulaInjection) {
        blockingErrors.push(
          `UBOQ_VAL01_FORMULA_INJECTION [${sheetOrPageRef}!${cell.cellRef}]: Dangerous formula/DDE "${cell.formula || cell.text}" blocked`
        );
      }
      if (scan.isPromptInjection) {
        securityAlerts.push(`PROMPT_INJECTION_NEUTRALIZED:${cell.cellRef}`);
      }
    }

    if (nonEmptyCells.length === 1 && /^(phase|part|division|building|zone|bldg)\b/i.test(nonEmptyCells[0].text.trim())) {
      currentPhaseContext = nonEmptyCells[0].text.trim();
      continue;
    }

    const mappedFields: Record<string, string | number | null> = {};
    const rawFormulas: Record<string, string> = {};
    const cellCoordinates: Record<string, string> = {};
    let hasAmbiguousNumericToken = false;
    const rowConfidences: number[] = [];

    for (const [colStr, canonicalId] of Object.entries(headerMap)) {
      const col = Number(colStr);
      const cell = row[col];
      if (!cell) continue;
      cellCoordinates[canonicalId] = `${sheetOrPageRef}!${cell.cellRef}`;
      if (typeof cell.confidence === 'number') {
        rowConfidences.push(cell.confidence);
      }

      if (canonicalId === 'phase_line_composite') {
        const parts = String(cell.text ?? '')
          .split(/\r?\n|\s*\|\s*/)
          .map((p) => p.trim())
          .filter(Boolean);
        const phasePart = parts.find((p) => /^(phase|part|zone|bldg|building|pkg|package)\b/i.test(p)) ?? parts[1] ?? null;
        const lineIdPart = parts.find((p) => p !== phasePart) ?? parts[0] ?? null;
        if (lineIdPart) {
          mappedFields.source_line_id = lineIdPart;
          cellCoordinates.source_line_id = `${sheetOrPageRef}!${cell.cellRef}`;
        }
        if (phasePart) {
          mappedFields.phase_code = phasePart;
          cellCoordinates.phase_code = `${sheetOrPageRef}!${cell.cellRef}`;
        }
      } else if (canonicalId === 'item_desc_composite') {
        const parts = String(cell.text ?? '')
          .split(/\r?\n/)
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length >= 2 && /^[A-Za-z0-9][A-Za-z0-9()._-]{1,24}$/.test(parts[0])) {
          mappedFields.item_code = parts[0];
          mappedFields.work_description = parts.slice(1).join(' ');
          cellCoordinates.item_code = `${sheetOrPageRef}!${cell.cellRef}`;
          cellCoordinates.work_description = `${sheetOrPageRef}!${cell.cellRef}`;
        } else {
          const single = parts.join(' ').trim();
          const splitInline = /^([A-Za-z0-9][A-Za-z0-9()._-]{1,20})\s+[-–—:]?\s*(.{4,})$/.exec(single);
          if (splitInline && /\d/.test(splitInline[1])) {
            mappedFields.item_code = splitInline[1];
            mappedFields.work_description = splitInline[2].trim();
          } else {
            mappedFields.work_description = single || null;
          }
          cellCoordinates.work_description = `${sheetOrPageRef}!${cell.cellRef}`;
        }
      } else if (numericCanonicalFields.has(canonicalId)) {
        const rawTrimmed = String(cell.text ?? '').trim();
        const parsedNum = parseNumericValue(cell.numOrText);
        if (
          rawTrimmed &&
          rawTrimmed !== '-' &&
          rawTrimmed !== '—' &&
          !NON_PAYABLE_NOTE_TEXT_REGEX.test(rawTrimmed) &&
          parsedNum === null
        ) {
          // Ambiguous/unreadable numeric token (e.g. blurred OCR token) -> NEVER fabricate a number; flag human review!
          hasAmbiguousNumericToken = true;
        }
        mappedFields[canonicalId] = parsedNum;
      } else {
        const strVal = String(cell.text ?? '').trim();
        mappedFields[canonicalId] = strVal || null;
      }
      if (cell.formula) {
        rawFormulas[canonicalId] = cell.formula;
      }
    }

    if (!mappedFields.phase_code) {
      mappedFields.phase_code = currentPhaseContext;
    }

    const descOrCode = `${mappedFields.source_line_id ?? ''} ${mappedFields.item_code ?? ''} ${mappedFields.work_description ?? ''} ${mappedFields.resource_description ?? ''}`.trim();
    if (!descOrCode || /^(sub[\s-]?total|grand\s+total|total\b)/i.test(descOrCode)) {
      continue;
    }

    // Classify row according to Awarded BOQ business rules: headings, subheadings, descriptive notes
    // ("By Client", "Included", "Excluded", "Unit Bid Price in Words"), price components (VAT/Discounts),
    // and multi-row header legends are NEVER flagged merely for missing quantity/unit/price.
    const rowClassification = classifyAwardedBoqRow({
      itemCode: mappedFields.item_code ? String(mappedFields.item_code) : null,
      description: mappedFields.work_description ? String(mappedFields.work_description) : descOrCode,
      unit: mappedFields.unit ? String(mappedFields.unit) : null,
      quantity: typeof mappedFields.approved_qty === 'number' ? mappedFields.approved_qty : null,
      unitPrice: typeof mappedFields.contract_unit_rate === 'number' ? mappedFields.contract_unit_rate : null,
      lineAmount: typeof mappedFields.contract_line_amount === 'number' ? mappedFields.contract_line_amount : null,
      rawTextValues: nonEmptyCells.map((c) => String(c.text ?? '').trim()),
      hasFormula: Object.keys(rawFormulas).length > 0,
      amountFormula: rawFormulas.contract_line_amount ?? rawFormulas.estimated_direct_cost ?? null,
    });
    const isNonPayableRow =
      rowClassification === 'HEADING' ||
      rowClassification === 'SUBHEADING' ||
      rowClassification === 'NOTE' ||
      rowClassification === 'HEADER_META' ||
      rowClassification === 'SUBTOTAL' ||
      rowClassification === 'GRAND_TOTAL' ||
      rowClassification === 'PRICE_COMPONENT';

    // VAL-02: Never fabricate missing quantities, units, or unit rates!
    const hasCoreBoqFields = Boolean(
      mappedFields.work_description &&
        mappedFields.unit &&
        mappedFields.approved_qty !== null &&
        mappedFields.contract_unit_rate !== null
    );
    const hasCoreResourceFields = Boolean(mappedFields.resource_description && mappedFields.resource_unit);

    const measuredCellConf =
      rowConfidences.length > 0 ? Math.min(baseConfidence, ...rowConfidences) : baseConfidence;
    const confidenceScore = Number(
      (
        hasAmbiguousNumericToken
          ? Math.min(measuredCellConf, 0.55)
          : hasCoreBoqFields || hasCoreResourceFields || isNonPayableRow
            ? measuredCellConf
            : Math.min(measuredCellConf, 0.65)
      ).toFixed(4)
    );

    const requiresHumanReview =
      confidenceScore < 0.85 ||
      hasAmbiguousNumericToken ||
      securityAlerts.length > 0 ||
      (!isNonPayableRow &&
        Boolean(mappedFields.work_description) &&
        (mappedFields.unit === null || mappedFields.approved_qty === null || mappedFields.contract_unit_rate === null));

    const firstCellRef = nonEmptyCells[0]?.cellRef || `R${r + 1}`;
    candidates.push({
      sectionTitle,
      sheetOrPageRef,
      pageNumber,
      sourceRowNumber: r + 1,
      sourceCellRef: `${sheetOrPageRef}!${firstCellRef}`,
      cellCoordinates,
      mappedFields,
      rawFormulas,
      confidenceScore,
      extractionMethod,
      requiresHumanReview,
      securityAlerts,
      rowClassification,
    });
  }

  return { headerMap, candidates, blockingErrors };
}

interface PdfPositionedTextItem {
  str?: string;
  width?: number;
  height?: number;
  transform?: number[];
}

function buildPdfCoordinateGridFromTextItems(
  items: ReadonlyArray<PdfPositionedTextItem>,
  pageNum: number
): Array<Array<InternalGridCell>> {
  const positioned = items
    .map((it) => {
      const raw = String(it.str ?? '');
      const trimmed = raw.trim();
      if (!trimmed) return null;
      const x = Number(it.transform?.[4] ?? 0);
      const y = Number(it.transform?.[5] ?? 0);
      const w = Math.max(0, Number(it.width ?? trimmed.length * 5));
      const h = Math.max(8, Number(it.height || Math.abs(Number(it.transform?.[3] ?? 10))));
      return { text: trimmed, x, y, w, h };
    })
    .filter((v): v is { text: string; x: number; y: number; w: number; h: number } => v !== null);

  if (positioned.length === 0) return [];

  // Group into horizontal rows by PDF baseline Y (descending top-to-bottom within 4pt tolerance)
  const sortedByY = [...positioned].sort((a, b) => (Math.abs(b.y - a.y) <= 4 ? a.x - b.x : b.y - a.y));
  const rowBands: Array<{ yRef: number; fragments: Array<{ text: string; x: number; y: number; w: number; h: number }> }> = [];

  for (const frag of sortedByY) {
    const existingBand = rowBands.find((b) => Math.abs(b.yRef - frag.y) <= 4);
    if (existingBand) {
      existingBand.fragments.push(frag);
    } else {
      rowBands.push({ yRef: frag.y, fragments: [frag] });
    }
  }

  rowBands.sort((a, b) => b.yRef - a.yRef);

  const rawBands: Array<{
    yRef: number;
    cells: Array<{ text: string; x: number; y: number; right: number }>;
  }> = [];

  rowBands.forEach((band) => {
    const frags = [...band.fragments].sort((a, b) => a.x - b.x);
    if (frags.length === 1 && (/\|/.test(frags[0].text) || /\t/.test(frags[0].text) || /\s{2,}/.test(frags[0].text))) {
      const cols = frags[0].text.includes('|')
        ? frags[0].text.split('|')
        : frags[0].text.includes('\t')
          ? frags[0].text.split('\t')
          : frags[0].text.split(/\s{2,}/);
      if (cols.length >= 2) {
        let curX = frags[0].x;
        rawBands.push({
          yRef: band.yRef,
          cells: cols.map((col) => {
            const clean = col.trim();
            const cObj = { text: clean, x: curX, y: band.yRef, right: curX + Math.max(20, clean.length * 5) };
            curX += Math.max(40, clean.length * 6);
            return cObj;
          }),
        });
      }
      return;
    }

    // Merge tiny intra-column word fragments (< 8pt horizontal gap) and split distinct PDF table columns (>= 8pt gap)
    const mergedCells: Array<{ text: string; x: number; y: number; right: number }> = [];
    for (const f of frags) {
      const prev = mergedCells[mergedCells.length - 1];
      if (prev && f.x - prev.right < 8) {
        prev.text = `${prev.text} ${f.text}`.trim();
        prev.right = Math.max(prev.right, f.x + f.w);
      } else {
        mergedCells.push({ text: f.text, x: f.x, y: f.y, right: f.x + f.w });
      }
    }
    if (mergedCells.length >= 1) {
      rawBands.push({ yRef: band.yRef, cells: mergedCells });
    }
  });

  // Detect any multi-column BOQ table header band so stacked multi-line table cells align cleanly by X coordinate!
  let headerBandIdx = -1;
  let bestHeaderScore = 0;
  let headerAnchors: Array<{ colIdx: number; x: number; right: number; canonical: string | null }> = [];

  for (let bIdx = 0; bIdx < rawBands.length; bIdx++) {
    const b = rawBands[bIdx];
    if (b.cells.length < 3) continue;
    let score = 0;
    const seen = new Set<string>();
    const anchors = b.cells.map((mc, cIdx) => {
      const mapped = mapHeaderToCanonicalField(mc.text);
      if (mapped && !seen.has(mapped)) {
        seen.add(mapped);
        score++;
      }
      return { colIdx: cIdx, x: mc.x, right: mc.right, canonical: mapped };
    });
    if (score >= 3 && score > bestHeaderScore) {
      bestHeaderScore = score;
      headerBandIdx = bIdx;
      headerAnchors = anchors;
    }
  }

  const grid: Array<Array<InternalGridCell>> = [];

  if (headerBandIdx !== -1 && headerAnchors.length >= 3) {
    const numericColIndices = new Set<number>(
      headerAnchors
        .filter((a) =>
          ['approved_qty', 'original_qty', 'contract_unit_rate', 'contract_line_amount'].includes(a.canonical ?? '')
        )
        .map((a) => a.colIdx)
    );
    const unitColIdx = headerAnchors.find((a) => a.canonical === 'unit')?.colIdx ?? -1;

    // Emit the header row cleanly
    const hb = rawBands[headerBandIdx];
    grid.push(
      hb.cells.map((mc, cIdx) => ({
        text: mc.text,
        numOrText: mc.text,
        formula: null,
        cellRef: `P${pageNum}R1C${cIdx + 1}@x=${Math.round(mc.x)},y=${Math.round(mc.y)}`,
        confidence: 0.96,
      }))
    );

    // Map each cell fragment below the header to its nearest header column anchor by X coordinate
    const mapCellToCol = (mc: { x: number; right: number }): number => {
      let bestIdx = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      for (let i = 0; i < headerAnchors.length; i++) {
        const a = headerAnchors[i];
        const nextAnchor = headerAnchors[i + 1];
        const boundaryRight = nextAnchor ? nextAnchor.x - 4 : Number.POSITIVE_INFINITY;
        // Prefer direct span containment first, then nearest start/right distance
        if (mc.x >= a.x - 18 && mc.x < boundaryRight) {
          return i;
        }
        const dist = Math.min(Math.abs(mc.x - a.x), Math.abs(mc.right - a.right));
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      return bestIdx;
    };

    const alignedRows: Array<{
      yRef: number;
      cols: Array<{ text: string; x: number; y: number } | null>;
      hasNumericOrUnit: boolean;
      isTotalOrStop: boolean;
    }> = [];

    for (let bIdx = headerBandIdx + 1; bIdx < rawBands.length; bIdx++) {
      const b = rawBands[bIdx];
      const joinedText = b.cells.map((c) => c.text).join(' ').trim();
      if (/^(annex\s+[b-z]\b|pricing\s+and\s+provenance\s+note|simulated\s+execution|workbook\s+trace|notes?\s*:)/i.test(joinedText)) {
        break;
      }

      const cols: Array<{ text: string; x: number; y: number } | null> = new Array(headerAnchors.length).fill(null);
      for (const mc of b.cells) {
        const cIdx = mapCellToCol(mc);
        const existing = cols[cIdx];
        if (existing) {
          existing.text = `${existing.text} ${mc.text}`.trim();
        } else {
          cols[cIdx] = { text: mc.text, x: mc.x, y: mc.y };
        }
      }

      const isTotal = /^(sub[\s-]?total|grand\s+total|total\b)/i.test(joinedText);
      const hasNumericOrUnit =
        (unitColIdx >= 0 && Boolean(cols[unitColIdx]?.text)) ||
        [...numericColIndices].some((idx) => cols[idx] !== null && parseNumericValue(cols[idx]!.text) !== null);

      alignedRows.push({ yRef: b.yRef, cols, hasNumericOrUnit, isTotalOrStop: isTotal });
      if (isTotal) break;
    }

    // Fold tightly stacked descriptor-only continuation lines (before or after a data band) into their BOQ row
    const foldedRows: Array<Array<{ text: string; x: number; y: number } | null>> = [];
    let pendingPrefix: Array<{ yRef: number; cols: Array<{ text: string; x: number; y: number } | null> }> = [];

    const mergeInto = (
      target: Array<{ text: string; x: number; y: number } | null>,
      source: Array<{ text: string; x: number; y: number } | null>,
      prepend: boolean
    ) => {
      for (let c = 0; c < target.length; c++) {
        const s = source[c];
        if (!s || !s.text) continue;
        const t = target[c];
        if (!t) {
          target[c] = { ...s };
        } else {
          t.text = prepend ? `${s.text}\n${t.text}` : `${t.text}\n${s.text}`;
        }
      }
    };

    for (let i = 0; i < alignedRows.length; i++) {
      const ar = alignedRows[i];
      if (ar.isTotalOrStop) {
        pendingPrefix = [];
        foldedRows.push(ar.cols);
        continue;
      }
      if (ar.hasNumericOrUnit) {
        const cloned = ar.cols.map((c) => (c ? { ...c } : null));
        for (let p = pendingPrefix.length - 1; p >= 0; p--) {
          if (Math.abs(pendingPrefix[p].yRef - ar.yRef) <= 36) {
            mergeInto(cloned, pendingPrefix[p].cols, true);
          }
        }
        pendingPrefix = [];
        foldedRows.push(cloned);
      } else {
        // Check if this descriptor-only line is a bottom continuation of the previous data row OR a top line of the next data row
        const prevAligned = i > 0 ? alignedRows[i - 1] : null;
        const nextAligned = i + 1 < alignedRows.length ? alignedRows[i + 1] : null;
        const distPrev = prevAligned && prevAligned.hasNumericOrUnit && !prevAligned.isTotalOrStop ? Math.abs(prevAligned.yRef - ar.yRef) : Number.POSITIVE_INFINITY;
        const distNext = nextAligned && nextAligned.hasNumericOrUnit && !nextAligned.isTotalOrStop ? Math.abs(ar.yRef - nextAligned.yRef) : Number.POSITIVE_INFINITY;

        if (distPrev <= 24 && distPrev <= distNext && foldedRows.length > 0) {
          mergeInto(foldedRows[foldedRows.length - 1], ar.cols, false);
        } else {
          pendingPrefix.push({ yRef: ar.yRef, cols: ar.cols });
        }
      }
    }

    foldedRows.forEach((cols, rIdx) => {
      grid.push(
        cols.map((mc, cIdx) => {
          const clean = mc ? mc.text.trim() : '';
          return {
            text: clean,
            numOrText: parseNumericValue(clean) ?? clean,
            formula: /^\s*[=+\-@]/.test(clean) ? clean : null,
            cellRef: `P${pageNum}R${rIdx + 2}C${cIdx + 1}@x=${Math.round(mc?.x ?? headerAnchors[cIdx].x)},y=${Math.round(mc?.y ?? 0)}`,
            confidence: 0.96,
          };
        })
      );
    });

    return grid;
  }

  rawBands.forEach((b, rIdx) => {
    if (b.cells.length >= 2) {
      grid.push(
        b.cells.map((mc, cIdx) => ({
          text: mc.text,
          numOrText: parseNumericValue(mc.text) ?? mc.text,
          formula: /^\s*[=+\-@]/.test(mc.text) ? mc.text : null,
          cellRef: `P${pageNum}R${rIdx + 1}C${cIdx + 1}@x=${Math.round(mc.x)},y=${Math.round(mc.y)}`,
          confidence: 0.96,
        }))
      );
    }
  });

  return grid;
}

function splitNativePdfPageToGrid(pageText: string, pageNum: number, tableRows?: string[][]): Array<Array<InternalGridCell>> {
  if (Array.isArray(tableRows) && tableRows.length >= 2) {
    return tableRows.map((cols, rIdx) =>
      cols.map((col, cIdx) => {
        const clean = String(col ?? '').trim();
        return {
          text: clean,
          numOrText: parseNumericValue(clean) ?? clean,
          formula: /^\s*[=+\-@]/.test(clean) ? clean : null,
          cellRef: `P${pageNum}R${rIdx + 1}C${cIdx + 1}`,
          confidence: 0.96,
        };
      })
    );
  }

  const lines = String(pageText ?? '')
    .split(/\r?\n/)
    .map((ln) => ln.trim())
    .filter((ln) => ln && !/^--\s*\d+\s+of\s+\d+\s*--$/i.test(ln));

  const grid: Array<Array<InternalGridCell>> = [];
  lines.forEach((ln, rIdx) => {
    const rawCols = ln.includes('|')
      ? ln.split('|')
      : ln.includes('\t')
        ? ln.split('\t')
        : ln.split(/\s{2,}/);
    if (rawCols.length >= 2) {
      grid.push(
        rawCols.map((col, cIdx) => {
          const clean = col.trim();
          return {
            text: clean,
            numOrText: parseNumericValue(clean) ?? clean,
            formula: /^\s*[=+\-@]/.test(clean) ? clean : null,
            cellRef: `P${pageNum}R${rIdx + 1}C${cIdx + 1}`,
            confidence: 0.95,
          };
        })
      );
    }
  });
  return grid;
}

/**
 * Extracts structured BOQ candidates from real binary/text project documents (.xlsx, .xls, .pdf native & scanned,
 * .png/.jpg/.jpeg raster OCR, .docx, .csv, .xml/.html, .json) without caller-supplied fake OCR overrides.
 */
export async function extractUniversalDocumentPackage(
  fileName: string,
  buffer: Buffer,
  options?: { declaredMimeType?: string }
): Promise<UniversalExtractionResult> {
  const security = scanUploadedDocumentSecurity(fileName, buffer, options?.declaredMimeType);
  const sections: UniversalExtractionResult['sections'] = [];
  const allCandidates: ExtractedBoqRowCandidate[] = [];
  const blockingErrors: string[] = [...security.findings];
  let awardedBoqVerification: AwardedBoqVerificationReport | undefined;
  const extractedTextPages: ContractTextPage[] = [];

  if (security.detectedFormat === 'XLSX') {
    // Bounded incremental OOXML worksheet streaming: processes one worksheet at a time directly from
    // the security-verified ZIP central directory, skipping style/column-range expansion (<col max="16384"/>)
    // and externalLinks caches so complex workbooks stay well within Vercel serverless memory budgets.
    const reconcilerSheets: ReconcilerWorksheetInput[] = [];
    await streamVerifiedXlsxWorksheets(buffer, ({ sheetName, displayOrder, rows }) => {
      reconcilerSheets.push({ sheetName, rows });
      const denseGrid: Array<Array<InternalGridCell>> = [];
      for (const row of rows) {
        const rowCells: Array<InternalGridCell> = [];
        for (const cell of row.cells) {
          rowCells[cell.colNumber - 1] = {
            text: cell.text,
            numOrText: cell.numOrText,
            formula: cell.formula,
            cellRef: cell.cellRef,
            confidence: 0.99,
          };
        }
        denseGrid.push(rowCells);
      }

      const parsed = parseGridRowsToCandidates(denseGrid, sheetName, sheetName, 'DETERMINISTIC_PARSER', 0.99, null);
      sections.push({
        sectionType: 'WORKSHEET',
        sheetOrPageRef: sheetName,
        sectionTitle: sheetName,
        displayOrder,
        headerMap: parsed.headerMap,
      });
      allCandidates.push(...parsed.candidates);
      blockingErrors.push(...parsed.blockingErrors);
    });
    if (reconcilerSheets.length > 0) {
      awardedBoqVerification = verifyAwardedBoqWorkbook(reconcilerSheets);
    }
  } else if (security.detectedFormat === 'XLS') {
    // H10: Legacy OLE2/BIFF8 .xls extraction via SheetJS with formula, cell-coordinate, and row-limit enforcement
    const wb = XLSX.read(buffer, {
      type: 'buffer',
      cellFormula: true,
      cellNF: true,
      cellDates: true,
      sheetRows: MAX_SHEET_ROWS,
    });

    wb.SheetNames.forEach((sheetName, sIdx) => {
      const ws = wb.Sheets[sheetName];
      const refStr = ws?.['!ref'];
      if (!ws || !refStr) return;
      const range = XLSX.utils.decode_range(refStr);
      const maxR = Math.min(range.e.r, MAX_SHEET_ROWS - 1);
      const maxC = Math.min(range.e.c, MAX_SHEET_COLS - 1);

      const grid: Array<Array<InternalGridCell>> = [];
      for (let r = range.s.r; r <= maxR; r++) {
        const rowCells: Array<InternalGridCell> = [];
        let hasVal = false;
        for (let c = range.s.c; c <= maxC; c++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          const cell = ws[addr] as XLSX.CellObject | undefined;
          if (!cell) continue;
          const rawText = cell.w !== undefined ? String(cell.w) : cell.v !== undefined ? String(cell.v) : '';
          if (rawText.trim() !== '') hasVal = true;
          const numVal = typeof cell.v === 'number' ? cell.v : parseNumericValue(rawText);
          rowCells[c] = {
            text: rawText,
            numOrText: numVal !== null ? numVal : rawText || null,
            formula: cell.f ? `=${String(cell.f).replace(/^=/, '')}` : null,
            cellRef: addr,
            confidence: 0.99,
          };
        }
        if (hasVal) grid.push(rowCells);
      }

      const parsed = parseGridRowsToCandidates(grid, sheetName, sheetName, 'DETERMINISTIC_PARSER', 0.99, null);
      sections.push({
        sectionType: 'XLS_WORKSHEET',
        sheetOrPageRef: sheetName,
        sectionTitle: sheetName,
        displayOrder: sIdx + 1,
        headerMap: parsed.headerMap,
      });
      allCandidates.push(...parsed.candidates);
      blockingErrors.push(...parsed.blockingErrors);
    });
  } else if (security.detectedFormat === 'CSV') {
    const rawCsv = buffer.toString('utf8');
    const records: string[][] = parseCsvSync(rawCsv, { relax_column_count: true, skip_empty_lines: true });
    const grid: Array<Array<InternalGridCell>> = records.slice(0, MAX_SHEET_ROWS).map((cols, rIdx) =>
      cols.slice(0, MAX_SHEET_COLS).map((val, cIdx) => ({
        text: String(val ?? ''),
        numOrText: parseNumericValue(val) ?? String(val ?? ''),
        formula: /^\s*[=+\-@]/.test(String(val ?? '')) ? String(val) : null,
        cellRef: `R${rIdx + 1}C${cIdx + 1}`,
        confidence: 0.98,
      }))
    );
    const parsed = parseGridRowsToCandidates(grid, 'CSV_SHEET_1', fileName, 'DETERMINISTIC_PARSER', 0.98, null);
    sections.push({
      sectionType: 'CSV_TABLE',
      sheetOrPageRef: 'CSV_SHEET_1',
      sectionTitle: fileName,
      displayOrder: 1,
      headerMap: parsed.headerMap,
    });
    allCandidates.push(...parsed.candidates);
    blockingErrors.push(...parsed.blockingErrors);
  } else if (security.detectedFormat === 'DOCX' || security.detectedFormat === 'XML_HTML') {
    const xml = security.detectedFormat === 'DOCX' ? unzipDocxDocumentXml(buffer) : buffer.toString('utf8');
    const rowTag = security.detectedFormat === 'DOCX' ? /<w:tr\b[^>]*>([\s\S]*?)<\/w:tr>/gi : /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
    const cellTag = security.detectedFormat === 'DOCX' ? /<w:tc\b[^>]*>([\s\S]*?)<\/w:tc>/gi : /<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi;

    const grid: Array<Array<InternalGridCell>> = [];
    let rowMatch: RegExpExecArray | null;
    let rIdx = 0;
    while ((rowMatch = rowTag.exec(xml)) !== null) {
      rIdx++;
      const rowXml = rowMatch[1];
      const cols: Array<InternalGridCell> = [];
      let cellMatch: RegExpExecArray | null;
      let cIdx = 0;
      while ((cellMatch = cellTag.exec(rowXml)) !== null) {
        cIdx++;
        const plain = cellMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        cols.push({
          text: plain,
          numOrText: parseNumericValue(plain) ?? plain,
          formula: /^\s*[=+\-@]/.test(plain) ? plain : null,
          cellRef: `T1R${rIdx}C${cIdx}`,
          confidence: 0.94,
        });
      }
      if (cols.length > 0) grid.push(cols);
    }

    const parsed = parseGridRowsToCandidates(grid, 'DOC_TABLE_1', fileName, 'TABLE_PARSER', 0.94, null);
    sections.push({
      sectionType: 'DOCUMENT_TABLE',
      sheetOrPageRef: 'DOC_TABLE_1',
      sectionTitle: fileName,
      displayOrder: 1,
      headerMap: parsed.headerMap,
    });
    allCandidates.push(...parsed.candidates);
    blockingErrors.push(...parsed.blockingErrors);
  } else if (security.detectedFormat === 'PDF') {
    // H01: Genuine multi-page PDF binary parsing via pdfjs-backed PDFParse + automatic raster OCR fallback for scanned PDF pages
    ensureServerlessPdfGlobals();
    const { PDFParse } = await import('pdf-parse');
    // P9-DEF-PDF-01: pdf-parse v2 resolves "./pdf.worker.mjs" via a runtime dynamic import that Vercel's
    // file tracing does not include. The official "pdf-parse/worker" entry embeds the worker as an inline
    // data URL, so no separate .mjs file needs to exist inside the serverless bundle.
    try {
      // The Express backend compiles with classic CommonJS module resolution, which cannot see the package
      // "exports" subpath types; the literal specifier is kept (not a variable) so the file tracer still
      // bundles pdf-parse/worker.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore TS2307 under moduleResolution=node10 only; resolves normally in Next (bundler) and at runtime
      const workerModule = (await import('pdf-parse/worker')) as { getData: () => string };
      PDFParse.setWorker(workerModule.getData());
    } catch (workerErr) {
      throw new Error(
        `UBOQ_PDF_WORKER_UNAVAILABLE: Unable to configure embedded pdf-parse worker (${
          workerErr instanceof Error ? workerErr.message : String(workerErr)
        })`
      );
    }
    const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const textResult = await pdfParser.getText();
      let tableResult: { pages?: Array<{ num?: number; tables?: string[][][] }> } | null = null;
      try {
        tableResult = (await pdfParser.getTable()) as unknown as { pages?: Array<{ num?: number; tables?: string[][][] }> };
      } catch {
        tableResult = null;
      }

      type PdfExtractedImagesResult = {
        pages?: Array<{ pageNumber?: number; images?: Array<{ data?: Uint8Array; width?: number; height?: number }> }>;
      };
      const pages = Array.isArray(textResult.pages) ? textResult.pages : [];
      let extractedImageResult: PdfExtractedImagesResult | null = null;

      const pdfDocHandle = (pdfParser as unknown as {
        doc?: { getPage?: (n: number) => Promise<{ getTextContent: () => Promise<{ items?: PdfPositionedTextItem[] }> }> };
      }).doc;

      for (let pIdx = 0; pIdx < pages.length; pIdx++) {
        const pageNum = pages[pIdx]?.num ?? pIdx + 1;
        const pageRef = `PAGE_${pageNum}`;
        const rawPageText = String(pages[pIdx]?.text ?? '')
          .replace(/--\s*\d+\s+of\s+\d+\s*--/gi, '')
          .trim();
        const pageTables = tableResult?.pages?.find((tp) => tp.num === pageNum)?.tables;
        const firstTable = Array.isArray(pageTables) && pageTables.length > 0 ? pageTables[0] : undefined;

        let coordGrid: Array<Array<InternalGridCell>> = [];
        if (pdfDocHandle?.getPage) {
          try {
            const pdfPage = await pdfDocHandle.getPage(pageNum);
            const tc = await pdfPage.getTextContent();
            coordGrid = buildPdfCoordinateGridFromTextItems(tc.items ?? [], pageNum);
          } catch {
            coordGrid = [];
          }
        }

        if (coordGrid.length >= 2 || rawPageText.length >= 12 || (firstTable && firstTable.length >= 2)) {
          if (rawPageText.length > 0) {
            extractedTextPages.push({
              pageNumber: pageNum,
              text: rawPageText,
              confidence: 0.96,
              extractionMethod: 'NATIVE_PDF',
            });
          }
          const grid = coordGrid.length >= 2 ? coordGrid : splitNativePdfPageToGrid(rawPageText, pageNum, firstTable);
          const parsed = parseGridRowsToCandidates(grid, pageRef, `${fileName} (${pageRef})`, 'NATIVE_PDF_PARSER', 0.96, pageNum);
          sections.push({
            sectionType: 'PDF_NATIVE_PAGE',
            sheetOrPageRef: pageRef,
            sectionTitle: `${fileName} (${pageRef})`,
            displayOrder: pageNum,
            headerMap: parsed.headerMap,
          });
          allCandidates.push(...parsed.candidates);
          blockingErrors.push(...parsed.blockingErrors);
        } else {
          // Scanned / image-only PDF page -> extract embedded raster scan via PDFParse and execute real Tesseract OCR!
          if (!extractedImageResult) {
            extractedImageResult = (await pdfParser.getImage({ imageThreshold: 8 })) as unknown as PdfExtractedImagesResult;
          }
          const imgPage = extractedImageResult?.pages?.[pIdx];
          const firstImg = imgPage?.images?.[0];
          if (firstImg?.data && firstImg.data.length > 0) {
            const imgBuf = Buffer.from(firstImg.data);
            const isEncodedImg =
              imgBuf.subarray(0, 4).toString('hex') === '89504e47' ||
              imgBuf.subarray(0, 3).toString('hex') === 'ffd8ff';
            const { runRasterImageOcr } = await import('./ocr-engine');
            const ocrPage = isEncodedImg
              ? await runRasterImageOcr(imgBuf, pageNum)
              : await runRasterImageOcr(
                  {
                    rawRgba: firstImg.data,
                    width: firstImg.width ?? 1000,
                    height: firstImg.height ?? 1000,
                  },
                  pageNum
                );

            const ocrGrid: Array<Array<InternalGridCell>> = ocrPage.rows.map((r) =>
              r.cells.map((c, cIdx) => ({
                text: c.text,
                numOrText: parseNumericValue(c.text) ?? c.text,
                formula: null,
                cellRef: `P${pageNum}R${r.rowNumber}C${cIdx + 1}@x=${c.bbox.x0},y=${c.bbox.y0},w=${c.bbox.x1 - c.bbox.x0},h=${c.bbox.y1 - c.bbox.y0}`,
                confidence: c.confidence,
              }))
            );

            const parsed = parseGridRowsToCandidates(
              ocrGrid,
              pageRef,
              `${fileName} (${pageRef} OCR)`,
              'OCR_RASTER',
              ocrPage.overallConfidence,
              pageNum
            );
            sections.push({
              sectionType: 'PDF_SCANNED_OCR_PAGE',
              sheetOrPageRef: pageRef,
              sectionTitle: `${fileName} (${pageRef} OCR)`,
              displayOrder: pageNum,
              headerMap: parsed.headerMap,
            });
            allCandidates.push(...parsed.candidates);
            blockingErrors.push(...parsed.blockingErrors);
            if (parsed.candidates.length === 0) {
              allCandidates.push({
                sectionTitle: `${fileName} (${pageRef} OCR)`,
                sheetOrPageRef: pageRef,
                pageNumber: pageNum,
                sourceRowNumber: 1,
                sourceCellRef: `${pageRef}!P${pageNum}R1C1`,
                cellCoordinates: {},
                mappedFields: {
                  work_description: '[LOW-CONFIDENCE OCR SCAN — MANUAL VERIFICATION REQUIRED]',
                },
                rawFormulas: {},
                confidenceScore: Number(Math.min(ocrPage.overallConfidence, 0.49).toFixed(4)),
                extractionMethod: 'OCR_RASTER',
                requiresHumanReview: true,
                securityAlerts: [],
              });
            }
          } else {
            blockingErrors.push(`UBOQ_PDF_UNREADABLE_PAGE [${pageRef}]: Page contains neither extractable text nor decodable scan image`);
          }
        }
      }
    } finally {
      await pdfParser.destroy();
    }
  } else if (security.detectedFormat === 'IMAGE') {
    // H01: Genuine pixel OCR on PNG / JPG / JPEG raster scans with word bounding boxes & real OCR confidence
    const { runRasterImageOcr } = await import('./ocr-engine');
    const ocrPage = await runRasterImageOcr(buffer, 1);
    const ocrPageText = ocrPage.rows
      .map((r) => r.cells.map((c) => c.text).join(' | '))
      .join('\n')
      .trim();
    if (ocrPageText) {
      extractedTextPages.push({
        pageNumber: 1,
        text: ocrPageText,
        confidence: ocrPage.overallConfidence,
        extractionMethod: 'OCR_RASTER',
      });
    }
    const ocrGrid: Array<Array<InternalGridCell>> = ocrPage.rows.map((r) =>
      r.cells.map((c, cIdx) => ({
        text: c.text,
        numOrText: parseNumericValue(c.text) ?? c.text,
        formula: null,
        cellRef: `P1R${r.rowNumber}C${cIdx + 1}@x=${c.bbox.x0},y=${c.bbox.y0},w=${c.bbox.x1 - c.bbox.x0},h=${c.bbox.y1 - c.bbox.y0}`,
        confidence: c.confidence,
      }))
    );

    const parsed = parseGridRowsToCandidates(ocrGrid, 'IMAGE_PAGE_1', fileName, 'OCR_RASTER', ocrPage.overallConfidence, 1);
    sections.push({
      sectionType: 'IMAGE_OCR_SCAN',
      sheetOrPageRef: 'IMAGE_PAGE_1',
      sectionTitle: fileName,
      displayOrder: 1,
      headerMap: parsed.headerMap,
    });
    allCandidates.push(...parsed.candidates);
    blockingErrors.push(...parsed.blockingErrors);
    if (parsed.candidates.length === 0) {
      allCandidates.push({
        sectionTitle: fileName,
        sheetOrPageRef: 'IMAGE_PAGE_1',
        pageNumber: 1,
        sourceRowNumber: 1,
        sourceCellRef: 'IMAGE_PAGE_1!P1R1C1',
        cellCoordinates: {},
        mappedFields: {
          work_description: '[LOW-CONFIDENCE OCR SCAN — MANUAL VERIFICATION REQUIRED]',
        },
        rawFormulas: {},
        confidenceScore: Number(Math.min(ocrPage.overallConfidence, 0.49).toFixed(4)),
        extractionMethod: 'OCR_RASTER',
        requiresHumanReview: true,
        securityAlerts: [],
      });
    }
  } else if (security.detectedFormat === 'JSON') {
    const parsedJson = JSON.parse(buffer.toString('utf8')) as Array<Record<string, unknown>>;
    if (Array.isArray(parsedJson) && parsedJson.length > 0) {
      const headers = Object.keys(parsedJson[0]);
      const grid: Array<Array<InternalGridCell>> = [
        headers.map((h, i) => ({ text: h, numOrText: h, formula: null, cellRef: `R1C${i + 1}`, confidence: 0.99 })),
        ...parsedJson.slice(0, MAX_SHEET_ROWS).map((obj, rIdx) =>
          headers.map((h, cIdx) => {
            const v = obj[h];
            return {
              text: v !== null && v !== undefined ? String(v) : '',
              numOrText: parseNumericValue(v) ?? (v !== null && v !== undefined ? String(v) : null),
              formula: typeof v === 'string' && /^\s*[=+\-@]/.test(v) ? v : null,
              cellRef: `R${rIdx + 2}C${cIdx + 1}`,
              confidence: 0.99,
            };
          })
        ),
      ];
      const parsed = parseGridRowsToCandidates(grid, 'JSON_PAYLOAD', fileName, 'DETERMINISTIC_PARSER', 0.99, null);
      sections.push({
        sectionType: 'JSON_ARRAY',
        sheetOrPageRef: 'JSON_PAYLOAD',
        sectionTitle: fileName,
        displayOrder: 1,
        headerMap: parsed.headerMap,
      });
      allCandidates.push(...parsed.candidates);
      blockingErrors.push(...parsed.blockingErrors);
    }
  }

  const contractExtraction =
    extractedTextPages.length > 0
      ? extractContractDocumentFromPages(fileName, extractedTextPages, {
          sourceSha256: security.sha256Hash,
        })
      : undefined;

  if (!awardedBoqVerification && allCandidates.length > 0) {
    awardedBoqVerification = reconcileImportedAwardedBoqCandidates(
      allCandidates.map((c, idx) => ({
        id: `ext-${idx + 1}`,
        sourceRowNumber: c.sourceRowNumber,
        sourceCellRef: c.sourceCellRef,
        sheetOrPageRef: c.sheetOrPageRef,
        rawFormulaText: Object.keys(c.rawFormulas).length > 0 ? JSON.stringify(c.rawFormulas) : null,
        mappedFields: c.mappedFields,
        rowClassification: c.rowClassification ?? null,
      }))
    );
  }

  return {
    security,
    sections,
    candidates: allCandidates,
    blockingErrors,
    awardedBoqVerification,
    contractExtraction,
    extractedTextPages: extractedTextPages.length > 0 ? extractedTextPages : undefined,
  };
}
