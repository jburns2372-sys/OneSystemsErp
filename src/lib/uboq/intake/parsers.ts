import ExcelJS from 'exceljs';
import * as XLSX from 'xlsx';
import { parse as parseCsvSync } from 'csv-parse/sync';
import { resolveCanonicalFieldId } from '../field-catalog';
import { inspectCellSecurity, scanUploadedDocumentSecurity, readVerifiedOfficeZipEntry, type FileSecurityScanResult } from './security-guard';

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
  [/^(pay\s*item(\s*(no|code|id|ref))?|item\s*(no|code|id|ref|number)|boq\s*code|wbs\s*item|ref\s*code|refcode|code)$/i, 'item_code'],
  [/^(phase|phase\s*code|building|zone|package|part|bldg)$/i, 'phase_code'],
  [/^(section|division|work\s*section|category)$/i, 'section_code'],
  [/^(work\s*description|item\s*description|description(\s*of\s*works?)?|scope(\s*(of\s*works?|title))?|work\s*item|particulars)$/i, 'work_description'],
  [/^(spec|specification|technical\s*spec|material\s*spec|grade)$/i, 'specification'],
  [/^(unit|uom|meas(urement)?\s*unit|unit\s*of\s*measure)$/i, 'unit'],
  [/^(qty|quantity|approved\s*(qty|quantity)|contract\s*(qty|quantity)|bill\s*(qty|quantity))$/i, 'approved_qty'],
  [/^(original\s*(qty|quantity)|orig\s*(qty|quantity))$/i, 'original_qty'],
  [/^(unit\s*(rate|price|cost)|unitrate|unitprice|contract\s*(unit\s*)?rate|bid\s*(unit\s*)?(rate|price)|rate)$/i, 'contract_unit_rate'],
  [/^(amount|total\s*amount|line\s*amount|contract\s*amount|extended\s*(amt|amount)|total\s*cost|total)$/i, 'contract_line_amount'],
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

function extractExcelCellPrimitives(cell: ExcelJS.Cell): {
  text: string;
  numOrText: string | number | null;
  formula: string | null;
} {
  const v = cell.value;
  if (v === null || v === undefined) {
    return { text: '', numOrText: null, formula: null };
  }
  if (typeof v === 'object' && 'formula' in v) {
    const fObj = v as { formula?: string; result?: unknown };
    const res = fObj.result;
    const num = parseNumericValue(res);
    return {
      text: res !== undefined && res !== null ? String(res) : '',
      numOrText: num !== null ? num : res !== undefined && res !== null ? String(res) : null,
      formula: fObj.formula ? `=${fObj.formula.replace(/^=/, '')}` : null,
    };
  }
  if (typeof v === 'object' && 'richText' in v && Array.isArray((v as { richText: Array<{ text: string }> }).richText)) {
    const joined = (v as { richText: Array<{ text: string }> }).richText.map((rt) => rt.text).join('');
    return { text: joined, numOrText: joined, formula: null };
  }
  const num = parseNumericValue(v);
  return {
    text: String(v),
    numOrText: num !== null ? num : String(v),
    formula: null,
  };
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
    let matchedCols = 0;
    const tempMap: Record<number, string> = {};
    for (let c = 0; c < row.length; c++) {
      const mapped = mapHeaderToCanonicalField(row[c]?.text ?? '');
      if (mapped && !Object.values(tempMap).includes(mapped)) {
        tempMap[c] = mapped;
        matchedCols++;
      }
    }
    if (matchedCols >= 2 && matchedCols > bestScore) {
      bestScore = matchedCols;
      headerRowIdx = r;
      for (const k of Object.keys(headerMap)) delete headerMap[Number(k)];
      Object.assign(headerMap, tempMap);
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

      if (numericCanonicalFields.has(canonicalId)) {
        const rawTrimmed = String(cell.text ?? '').trim();
        const parsedNum = parseNumericValue(cell.numOrText);
        if (rawTrimmed && rawTrimmed !== '-' && rawTrimmed !== '—' && parsedNum === null) {
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

    const descOrCode = `${mappedFields.item_code ?? ''} ${mappedFields.work_description ?? ''} ${mappedFields.resource_description ?? ''}`.trim();
    if (!descOrCode || /^(sub[\s-]?total|grand\s+total|total\b)/i.test(descOrCode)) {
      continue;
    }

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
          : hasCoreBoqFields || hasCoreResourceFields
            ? measuredCellConf
            : Math.min(measuredCellConf, 0.65)
      ).toFixed(4)
    );

    const requiresHumanReview =
      confidenceScore < 0.85 ||
      hasAmbiguousNumericToken ||
      securityAlerts.length > 0 ||
      (Boolean(mappedFields.work_description) &&
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

  const grid: Array<Array<InternalGridCell>> = [];
  rowBands.forEach((band, rIdx) => {
    const frags = [...band.fragments].sort((a, b) => a.x - b.x);
    if (frags.length === 1 && (/\|/.test(frags[0].text) || /\t/.test(frags[0].text) || /\s{2,}/.test(frags[0].text))) {
      const cols = frags[0].text.includes('|')
        ? frags[0].text.split('|')
        : frags[0].text.includes('\t')
          ? frags[0].text.split('\t')
          : frags[0].text.split(/\s{2,}/);
      if (cols.length >= 2) {
        grid.push(
          cols.map((col, cIdx) => {
            const clean = col.trim();
            return {
              text: clean,
              numOrText: parseNumericValue(clean) ?? clean,
              formula: /^\s*[=+\-@]/.test(clean) ? clean : null,
              cellRef: `P${pageNum}R${rIdx + 1}C${cIdx + 1}@x=${Math.round(frags[0].x)},y=${Math.round(frags[0].y)}`,
              confidence: 0.96,
            };
          })
        );
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

    if (mergedCells.length >= 2) {
      grid.push(
        mergedCells.map((mc, cIdx) => ({
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

  if (security.detectedFormat === 'XLSX') {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);

    let order = 0;
    wb.eachSheet((worksheet) => {
      order++;
      const grid: Array<Array<InternalGridCell>> = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > MAX_SHEET_ROWS) return;
        const rowCells: Array<InternalGridCell> = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber > MAX_SHEET_COLS) return;
          const prim = extractExcelCellPrimitives(cell);
          rowCells[colNumber - 1] = {
            ...prim,
            cellRef: cell.address || `R${rowNumber}C${colNumber}`,
            confidence: 0.99,
          };
        });
        grid[rowNumber - 1] = rowCells;
      });

      const denseGrid = grid.filter(Boolean);
      const parsed = parseGridRowsToCandidates(denseGrid, worksheet.name, worksheet.name, 'DETERMINISTIC_PARSER', 0.99, null);
      sections.push({
        sectionType: 'WORKSHEET',
        sheetOrPageRef: worksheet.name,
        sectionTitle: worksheet.name,
        displayOrder: order,
        headerMap: parsed.headerMap,
      });
      allCandidates.push(...parsed.candidates);
      blockingErrors.push(...parsed.blockingErrors);
    });
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

  return {
    security,
    sections,
    candidates: allCandidates,
    blockingErrors,
  };
}
