import zlib from 'node:zlib';
import ExcelJS from 'exceljs';
import { parse as parseCsvSync } from 'csv-parse/sync';
import { resolveCanonicalFieldId } from '../field-catalog';
import { inspectCellSecurity, scanUploadedDocumentSecurity, type FileSecurityScanResult } from './security-guard';

export interface ExtractedBoqRowCandidate {
  readonly sectionTitle: string;
  readonly sheetOrPageRef: string;
  readonly sourceRowNumber: number;
  readonly sourceCellRef: string;
  readonly mappedFields: Record<string, string | number | null>;
  readonly rawFormulas: Record<string, string>;
  readonly confidenceScore: number;
  readonly extractionMethod: 'DETERMINISTIC_PARSER' | 'TABLE_PARSER' | 'OCR_STAGED_REVIEW';
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
    if (!stripped || stripped === '-' || stripped === '—') return null;
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
  let offset = 0;
  while (offset + 30 <= buf.length) {
    const idx = buf.indexOf(Buffer.from([0x50, 0x4b, 0x03, 0x04]), offset);
    if (idx === -1 || idx + 30 > buf.length) break;
    const method = buf.readUInt16LE(idx + 8);
    const compSize = buf.readUInt32LE(idx + 18);
    const nameLen = buf.readUInt16LE(idx + 26);
    const extraLen = buf.readUInt16LE(idx + 28);
    const name = buf.subarray(idx + 30, idx + 30 + nameLen).toString('utf8');
    const dataStart = idx + 30 + nameLen + extraLen;
    if (name === 'word/document.xml' && dataStart + compSize <= buf.length) {
      const slice = buf.subarray(dataStart, dataStart + compSize);
      if (method === 0) return slice.toString('utf8');
      if (method === 8) return zlib.inflateRawSync(slice).toString('utf8');
    }
    offset = dataStart + Math.max(compSize, 1);
  }
  return '';
}

function parseGridRowsToCandidates(
  rows: Array<Array<{ text: string; numOrText: string | number | null; formula: string | null; cellRef: string }>>,
  sheetOrPageRef: string,
  sectionTitle: string,
  extractionMethod: ExtractedBoqRowCandidate['extractionMethod'],
  baseConfidence: number
): {
  headerMap: Record<number, string>;
  candidates: ExtractedBoqRowCandidate[];
  blockingErrors: string[];
} {
  const headerMap: Record<number, string> = {};
  const candidates: ExtractedBoqRowCandidate[] = [];
  const blockingErrors: string[] = [];

  // Dynamically locate header row anywhere in the first 30 rows (layout-independent!)
  let headerRowIdx = -1;
  let bestScore = 0;

  for (let r = 0; r < Math.min(rows.length, 30); r++) {
    const row = rows[r];
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

  for (let r = headerRowIdx + 1; r < rows.length; r++) {
    const row = rows[r];
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

    // Detect standalone section/phase banner rows (e.g., "PHASE 1 - SUBSTRUCTURE" or "PART B: CIVIL WORKS")
    if (nonEmptyCells.length === 1 && /^(phase|part|division|building|zone|bldg)\b/i.test(nonEmptyCells[0].text.trim())) {
      currentPhaseContext = nonEmptyCells[0].text.trim();
      continue;
    }

    const mappedFields: Record<string, string | number | null> = {};
    const rawFormulas: Record<string, string> = {};

    for (const [colStr, canonicalId] of Object.entries(headerMap)) {
      const col = Number(colStr);
      const cell = row[col];
      if (!cell) continue;
      const isNumericField = [
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
      ].includes(canonicalId);

      if (isNumericField) {
        mappedFields[canonicalId] = parseNumericValue(cell.numOrText);
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

    // Skip subtotal/footer lines ("TOTAL", "SUB-TOTAL", "GRAND TOTAL") so summary rows are never double-counted as BOQ items
    const descOrCode = `${mappedFields.item_code ?? ''} ${mappedFields.work_description ?? ''} ${mappedFields.resource_description ?? ''}`.trim();
    if (!descOrCode || /^(sub[\s-]?total|grand\s+total|total\b)/i.test(descOrCode)) {
      continue;
    }

    // VAL-02: Never fabricate missing quantities, units, or unit rates! Flag incomplete or low-confidence rows for human review.
    const hasCoreBoqFields = Boolean(mappedFields.work_description && mappedFields.unit && mappedFields.approved_qty !== null);
    const hasCoreResourceFields = Boolean(mappedFields.resource_description && mappedFields.resource_unit);
    const confidenceScore = hasCoreBoqFields || hasCoreResourceFields ? baseConfidence : Math.min(baseConfidence, 0.65);
    const requiresHumanReview =
      confidenceScore < 0.85 ||
      securityAlerts.length > 0 ||
      (Boolean(mappedFields.work_description) && (mappedFields.unit === null || mappedFields.approved_qty === null || mappedFields.contract_unit_rate === null));

    candidates.push({
      sectionTitle,
      sheetOrPageRef,
      sourceRowNumber: r + 1,
      sourceCellRef: row[0]?.cellRef || `R${r + 1}`,
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

export async function extractUniversalDocumentPackage(
  fileName: string,
  buffer: Buffer,
  options?: { declaredMimeType?: string; ocrConfidenceOverride?: number; ocrTextLines?: string[] }
): Promise<UniversalExtractionResult> {
  const security = scanUploadedDocumentSecurity(fileName, buffer, options?.declaredMimeType);
  const sections: UniversalExtractionResult['sections'] = [];
  const allCandidates: ExtractedBoqRowCandidate[] = [];
  const blockingErrors: string[] = [...security.findings];

  if (security.detectedFormat === 'XLSX') {
    const wb = new ExcelJS.Workbook();
    // Cast required for Node 20+ Buffer<ArrayBufferLike> vs ExcelJS legacy Buffer signature
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);

    let order = 0;
    wb.eachSheet((worksheet) => {
      order++;
      const grid: Array<Array<{ text: string; numOrText: string | number | null; formula: string | null; cellRef: string }>> = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        const rowCells: Array<{ text: string; numOrText: string | number | null; formula: string | null; cellRef: string }> = [];
        row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const prim = extractExcelCellPrimitives(cell);
          rowCells[colNumber - 1] = {
            ...prim,
            cellRef: cell.address || `R${rowNumber}C${colNumber}`,
          };
        });
        grid[rowNumber - 1] = rowCells;
      });

      const denseGrid = grid.filter(Boolean);
      const parsed = parseGridRowsToCandidates(denseGrid, worksheet.name, worksheet.name, 'DETERMINISTIC_PARSER', 0.99);
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
  } else if (security.detectedFormat === 'CSV') {
    const rawCsv = buffer.toString('utf8');
    const records: string[][] = parseCsvSync(rawCsv, { relax_column_count: true, skip_empty_lines: true });
    const grid = records.map((cols, rIdx) =>
      cols.map((val, cIdx) => ({
        text: String(val ?? ''),
        numOrText: parseNumericValue(val) ?? String(val ?? ''),
        formula: /^\s*[=+\-@]/.test(String(val ?? '')) ? String(val) : null,
        cellRef: `R${rIdx + 1}C${cIdx + 1}`,
      }))
    );
    const parsed = parseGridRowsToCandidates(grid, 'CSV_SHEET_1', fileName, 'DETERMINISTIC_PARSER', 0.98);
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

    const grid: Array<Array<{ text: string; numOrText: string | number | null; formula: string | null; cellRef: string }>> = [];
    let rowMatch: RegExpExecArray | null;
    let rIdx = 0;
    while ((rowMatch = rowTag.exec(xml)) !== null) {
      rIdx++;
      const rowXml = rowMatch[1];
      const cols: Array<{ text: string; numOrText: string | number | null; formula: string | null; cellRef: string }> = [];
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
        });
      }
      if (cols.length > 0) grid.push(cols);
    }

    const parsed = parseGridRowsToCandidates(grid, 'DOC_TABLE_1', fileName, 'TABLE_PARSER', 0.94);
    sections.push({
      sectionType: 'DOCUMENT_TABLE',
      sheetOrPageRef: 'DOC_TABLE_1',
      sectionTitle: fileName,
      displayOrder: 1,
      headerMap: parsed.headerMap,
    });
    allCandidates.push(...parsed.candidates);
    blockingErrors.push(...parsed.blockingErrors);
  } else if (security.detectedFormat === 'PDF' || security.detectedFormat === 'IMAGE') {
    // Extract pipe/tab delimited table lines from PDF text stream or OCR staged input; low-confidence (< 0.85) held in L2 review queue!
    const rawLines =
      options?.ocrTextLines ??
      buffer
        .toString('latin1')
        .split(/\r?\n/)
        .filter((ln) => ln.includes('|') || ln.includes('\t'));

    const conf =
      options?.ocrConfidenceOverride ?? (security.detectedFormat === 'IMAGE' ? 0.72 : 0.88);

    const grid = rawLines.map((ln, rIdx) =>
      ln.split(/\||\t/).map((col, cIdx) => {
        const clean = col.trim();
        return {
          text: clean,
          numOrText: parseNumericValue(clean) ?? clean,
          formula: null,
          cellRef: `P1R${rIdx + 1}C${cIdx + 1}`,
        };
      })
    );

    const method = security.detectedFormat === 'IMAGE' || conf < 0.85 ? 'OCR_STAGED_REVIEW' : 'TABLE_PARSER';
    const parsed = parseGridRowsToCandidates(grid, 'PAGE_1', fileName, method, conf);
    sections.push({
      sectionType: security.detectedFormat === 'IMAGE' ? 'OCR_SCAN' : 'PDF_PAGE',
      sheetOrPageRef: 'PAGE_1',
      sectionTitle: fileName,
      displayOrder: 1,
      headerMap: parsed.headerMap,
    });
    allCandidates.push(...parsed.candidates);
    blockingErrors.push(...parsed.blockingErrors);
  } else if (security.detectedFormat === 'JSON') {
    const parsedJson = JSON.parse(buffer.toString('utf8')) as Array<Record<string, unknown>>;
    if (Array.isArray(parsedJson) && parsedJson.length > 0) {
      const headers = Object.keys(parsedJson[0]);
      const grid = [
        headers.map((h, i) => ({ text: h, numOrText: h, formula: null, cellRef: `R1C${i + 1}` })),
        ...parsedJson.map((obj, rIdx) =>
          headers.map((h, cIdx) => {
            const v = obj[h];
            return {
              text: v !== null && v !== undefined ? String(v) : '',
              numOrText: parseNumericValue(v) ?? (v !== null && v !== undefined ? String(v) : null),
              formula: typeof v === 'string' && /^\s*[=+\-@]/.test(v) ? v : null,
              cellRef: `R${rIdx + 2}C${cIdx + 1}`,
            };
          })
        ),
      ];
      const parsed = parseGridRowsToCandidates(grid, 'JSON_PAYLOAD', fileName, 'DETERMINISTIC_PARSER', 0.99);
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

