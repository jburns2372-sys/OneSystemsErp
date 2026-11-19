import { Readable } from 'node:stream';
import { createInflateRaw } from 'node:zlib';
import {
  listVerifiedOfficeZipEntries,
  type VerifiedOfficeZipEntry,
} from './security-guard';

/**
 * Explicit aggregate XLSX resource budgets enforced BEFORE and DURING incremental streaming
 * expansion so complex workbooks (including files with <col max="16384"/> formatting tags or
 * hundreds of externalLinks caches) never trigger V8 heap exhaustion (SIGABRT 134) on Vercel.
 */
export const MAX_XLSX_WORKSHEETS = 40;
export const MAX_XLSX_SHARED_STRING_XML_BYTES = 16 * 1024 * 1024;
export const MAX_XLSX_SHARED_STRINGS = 200_000;
export const MAX_XLSX_SINGLE_SHEET_XML_BYTES = 32 * 1024 * 1024;
export const MAX_XLSX_TOTAL_SHEET_XML_BYTES = 64 * 1024 * 1024;
export const MAX_XLSX_SHEET_ROWS = 10_000;
export const MAX_XLSX_SHEET_COLS = 200;
export const MAX_XLSX_TOTAL_CELLS = 250_000;

export interface StreamedXlsxCell {
  readonly colNumber: number;
  readonly cellRef: string;
  readonly text: string;
  readonly numOrText: string | number | null;
  readonly formula: string | null;
}

export interface StreamedXlsxRow {
  readonly rowNumber: number;
  readonly cells: ReadonlyArray<StreamedXlsxCell>;
}

export interface StreamedXlsxSheetStats {
  readonly sheetName: string;
  readonly displayOrder: number;
  readonly xmlBytes: number;
  readonly rowCount: number;
  readonly cellCount: number;
}

export interface StreamedXlsxLimits {
  readonly maxWorksheets?: number;
  readonly maxSharedStringXmlBytes?: number;
  readonly maxSharedStrings?: number;
  readonly maxSingleSheetXmlBytes?: number;
  readonly maxTotalSheetXmlBytes?: number;
  readonly maxSheetRows?: number;
  readonly maxSheetCols?: number;
  readonly maxTotalCells?: number;
}

const XML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

export function decodeXmlEntities(raw: string): string {
  if (!raw) return '';
  let text = raw;
  if (text.includes('&')) {
    text = text.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (full, body: string) => {
      if (body.startsWith('#x') || body.startsWith('#X')) {
        const cp = Number.parseInt(body.slice(2), 16);
        return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : full;
      }
      if (body.startsWith('#')) {
        const cp = Number.parseInt(body.slice(1), 10);
        return Number.isFinite(cp) && cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : full;
      }
      return XML_ENTITY_MAP[body] ?? full;
    });
  }
  if (text.includes('_x')) {
    text = text.replace(/_x([0-9a-fA-F]{4})_/g, (_m, hex: string) => {
      const cp = Number.parseInt(hex, 16);
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : _m;
    });
  }
  return text;
}

function parseXmlAttr(tag: string, attrName: string): string | null {
  const re = new RegExp(`(?:^|\\s)${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i');
  const m = re.exec(tag);
  if (!m) return null;
  return decodeXmlEntities(m[1] ?? m[2] ?? '');
}

function parseNumericStrict(val: string): number | null {
  const stripped = val.replace(/[₱$,\s]/g, '').trim();
  if (!stripped || stripped === '-' || stripped === '—' || /[?a-zA-Z]/.test(stripped)) return null;
  const num = Number(stripped);
  return Number.isFinite(num) ? num : null;
}

function colLettersToNumber(letters: string): number {
  let num = 0;
  for (let i = 0; i < letters.length; i++) {
    const code = letters.charCodeAt(i);
    const upper = code >= 97 && code <= 122 ? code - 32 : code;
    if (upper < 65 || upper > 90) return 0;
    num = num * 26 + (upper - 64);
  }
  return num;
}

function colNumberToLetters(colNumber: number): string {
  let n = colNumber;
  let out = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out || 'A';
}

function parseCellRef(ref: string | null): { col: number; row: number } | null {
  if (!ref) return null;
  const m = /^([A-Za-z]{1,4})(\d{1,7})$/.exec(ref.trim());
  if (!m) return null;
  const col = colLettersToNumber(m[1]);
  const row = Number.parseInt(m[2], 10);
  if (!col || !Number.isFinite(row) || row <= 0) return null;
  return { col, row };
}

function normalizeZipTargetPath(baseDir: string, target: string): string {
  const clean = target.replace(/\\/g, '/').trim();
  const joined = clean.startsWith('/') ? clean.slice(1) : `${baseDir}${clean}`;
  const parts: string[] = [];
  for (const seg of joined.split('/')) {
    if (!seg || seg === '.') continue;
    if (seg === '..') {
      parts.pop();
    } else {
      parts.push(seg);
    }
  }
  return parts.join('/');
}

function createEntryReadable(buf: Buffer, entry: VerifiedOfficeZipEntry): Readable {
  const slice = buf.subarray(entry.dataStart, entry.dataStart + entry.compressedSize);
  const src = Readable.from([slice]);
  if (entry.method === 0) return src;
  const inflater = createInflateRaw();
  src.pipe(inflater);
  return inflater;
}

async function readSmallVerifiedEntryText(
  buf: Buffer,
  entry: VerifiedOfficeZipEntry,
  maxBytes: number,
  label: string
): Promise<string> {
  if (entry.uncompressedSize > maxBytes) {
    throw new Error(
      `UBOQ_XLSX_LIMIT_EXCEEDED: ${label} exceeds the ${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit`
    );
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of createEntryReadable(buf, entry)) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += b.length;
    if (total > maxBytes) {
      throw new Error(
        `UBOQ_XLSX_LIMIT_EXCEEDED: ${label} exceeded the ${(maxBytes / (1024 * 1024)).toFixed(0)} MB streaming limit`
      );
    }
    chunks.push(b);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function extractInlineTextFromRuns(xmlFragment: string): string {
  const parts: string[] = [];
  const tRe = /<(?:[a-zA-Z0-9_]+:)?t(?:\s[^>]*)?>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?t>/g;
  let m: RegExpExecArray | null;
  while ((m = tRe.exec(xmlFragment)) !== null) {
    parts.push(decodeXmlEntities(m[1]));
  }
  return parts.join('');
}

async function streamSharedStrings(
  buf: Buffer,
  entry: VerifiedOfficeZipEntry,
  maxBytes: number,
  maxStrings: number
): Promise<string[]> {
  if (entry.uncompressedSize > maxBytes) {
    throw new Error(
      `UBOQ_XLSX_LIMIT_EXCEEDED: Shared string table exceeds ${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit. Export only the BOQ worksheet to a clean .xlsx file and retry.`
    );
  }
  const strings: string[] = [];
  let carry = '';
  let bytesRead = 0;
  const closeSiRe = /<\/(?:[a-zA-Z0-9_]+:)?si>/g;
  const openSiRe = /<(?:[a-zA-Z0-9_]+:)?si(?:\s[^>]*)?>/;

  for await (const chunk of createEntryReadable(buf, entry)) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytesRead += b.length;
    if (bytesRead > maxBytes) {
      throw new Error(
        `UBOQ_XLSX_LIMIT_EXCEEDED: Shared string table exceeded ${(maxBytes / (1024 * 1024)).toFixed(0)} MB limit`
      );
    }
    carry += b.toString('utf8');

    let lastEnd = 0;
    closeSiRe.lastIndex = 0;
    let closeMatch: RegExpExecArray | null;
    while ((closeMatch = closeSiRe.exec(carry)) !== null) {
      const segment = carry.slice(lastEnd, closeMatch.index);
      lastEnd = closeMatch.index + closeMatch[0].length;
      const openMatch = openSiRe.exec(segment);
      if (!openMatch) continue;
      const inner = segment.slice(openMatch.index + openMatch[0].length);
      strings.push(extractInlineTextFromRuns(inner));
      if (strings.length > maxStrings) {
        throw new Error(
          `UBOQ_XLSX_LIMIT_EXCEEDED: Workbook contains more than ${maxStrings.toLocaleString()} shared strings. Save only the BOQ sheets to a smaller .xlsx file and retry.`
        );
      }
    }
    if (lastEnd > 0) {
      carry = carry.slice(lastEnd);
    } else if (carry.length > 4 * 1024 * 1024) {
      throw new Error('UBOQ_XLSX_LIMIT_EXCEEDED: Single shared string entry exceeds safe streaming buffer');
    }
  }
  return strings;
}

function parseWorkbookSheetTargets(workbookXml: string, relsXml: string): Array<{ name: string; target: string }> {
  const relMap = new Map<string, string>();
  const relRe = /<(?:[a-zA-Z0-9_]+:)?Relationship\b([^>]*)\/?>/g;
  let relMatch: RegExpExecArray | null;
  while ((relMatch = relRe.exec(relsXml)) !== null) {
    const attrs = relMatch[1];
    const id = parseXmlAttr(attrs, 'Id');
    const target = parseXmlAttr(attrs, 'Target');
    if (id && target) {
      relMap.set(id, normalizeZipTargetPath('xl/', target));
    }
  }

  const sheets: Array<{ name: string; target: string }> = [];
  const sheetRe = /<(?:[a-zA-Z0-9_]+:)?sheet\b([^>]*)\/?>/g;
  let sheetMatch: RegExpExecArray | null;
  while ((sheetMatch = sheetRe.exec(workbookXml)) !== null) {
    const attrs = sheetMatch[1];
    const name = parseXmlAttr(attrs, 'name') || `Sheet${sheets.length + 1}`;
    const rId = parseXmlAttr(attrs, 'r:id') || parseXmlAttr(attrs, 'id');
    const target = rId ? relMap.get(rId) : null;
    if (target) {
      sheets.push({ name, target });
    }
  }
  return sheets;
}

function parseRowXmlCells(
  rowInnerXml: string,
  rowNumber: number,
  sharedStrings: ReadonlyArray<string>,
  sharedFormulas: Map<string, string>,
  maxSheetCols: number,
  sheetName: string
): StreamedXlsxCell[] {
  const cells: StreamedXlsxCell[] = [];
  const cellRe = /<(?:[a-zA-Z0-9_]+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?c>)/g;
  let m: RegExpExecArray | null;
  let fallbackCol = 0;

  while ((m = cellRe.exec(rowInnerXml)) !== null) {
    const attrs = m[1];
    const inner = m[2] ?? '';
    const refAttr = parseXmlAttr(attrs, 'r');
    const parsedRef = parseCellRef(refAttr);
    const colNumber = parsedRef?.col ?? fallbackCol + 1;
    fallbackCol = colNumber;

    if (!inner) continue; // empty styled cell with no value or formula

    const typeAttr = (parseXmlAttr(attrs, 't') || '').trim();
    const fTagMatch = /<(?:[a-zA-Z0-9_]+:)?f\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?f>)/.exec(inner);
    let formula: string | null = null;
    if (fTagMatch) {
      const fAttrs = fTagMatch[1] ?? '';
      const fBody = decodeXmlEntities((fTagMatch[2] ?? '').trim());
      const fType = parseXmlAttr(fAttrs, 't');
      const si = parseXmlAttr(fAttrs, 'si');
      if (fBody) {
        formula = `=${fBody.replace(/^=/, '')}`;
        if (fType === 'shared' && si) {
          sharedFormulas.set(si, formula);
        }
      } else if (fType === 'shared' && si && sharedFormulas.has(si)) {
        formula = sharedFormulas.get(si) ?? null;
      }
    }

    let text = '';
    let numOrText: string | number | null = null;

    if (typeAttr === 'inlineStr') {
      const isMatch = /<(?:[a-zA-Z0-9_]+:)?is\b[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?is>/.exec(inner);
      text = isMatch ? extractInlineTextFromRuns(isMatch[1]) : '';
      const num = parseNumericStrict(text);
      numOrText = num !== null ? num : text || null;
    } else {
      const vMatch = /<(?:[a-zA-Z0-9_]+:)?v\b[^>]*>([\s\S]*?)<\/(?:[a-zA-Z0-9_]+:)?v>/.exec(inner);
      const rawV = vMatch ? decodeXmlEntities(vMatch[1]) : '';
      if (typeAttr === 's') {
        const idx = Number.parseInt(rawV.trim(), 10);
        text = Number.isFinite(idx) && idx >= 0 && idx < sharedStrings.length ? sharedStrings[idx] : '';
        const num = parseNumericStrict(text);
        numOrText = num !== null ? num : text || null;
      } else if (typeAttr === 'b') {
        text = rawV.trim() === '1' ? 'TRUE' : 'FALSE';
        numOrText = text;
      } else if (typeAttr === 'str' || typeAttr === 'e') {
        text = rawV;
        const num = typeAttr === 'str' ? parseNumericStrict(rawV) : null;
        numOrText = num !== null ? num : rawV || null;
      } else if (rawV !== '') {
        const num = Number(rawV);
        if (Number.isFinite(num)) {
          text = rawV;
          numOrText = num;
        } else {
          text = rawV;
          numOrText = rawV;
        }
      }
    }

    const hasContent = text.trim() !== '' || formula !== null;
    if (!hasContent) continue;

    if (colNumber > maxSheetCols) {
      throw new Error(
        `UBOQ_XLSX_LIMIT_EXCEEDED: Sheet "${sheetName}" has non-empty data past column ${maxSheetCols} (${refAttr || colNumber}). Trim unused far-right columns and retry.`
      );
    }

    const cellRef = refAttr || `${colNumberToLetters(colNumber)}${rowNumber}`;
    cells.push({
      colNumber,
      cellRef,
      text,
      numOrText,
      formula,
    });
  }

  return cells;
}

async function streamSingleWorksheetRows(params: {
  buf: Buffer;
  entry: VerifiedOfficeZipEntry;
  sheetName: string;
  sharedStrings: ReadonlyArray<string>;
  maxSheetXmlBytes: number;
  maxSheetRows: number;
  maxSheetCols: number;
  remainingCellBudget: number;
}): Promise<{ rows: StreamedXlsxRow[]; totalCells: number }> {
  const {
    buf,
    entry,
    sheetName,
    sharedStrings,
    maxSheetXmlBytes,
    maxSheetRows,
    maxSheetCols,
    remainingCellBudget,
  } = params;

  if (entry.uncompressedSize > maxSheetXmlBytes) {
    throw new Error(
      `UBOQ_XLSX_LIMIT_EXCEEDED: Sheet "${sheetName}" exceeds the ${(maxSheetXmlBytes / (1024 * 1024)).toFixed(0)} MB worksheet XML limit. Export only the BOQ sheet to a clean .xlsx file and retry.`
    );
  }

  const rows: StreamedXlsxRow[] = [];
  const sharedFormulas = new Map<string, string>();
  let totalCells = 0;
  let bytesRead = 0;
  let carry = '';
  let sequentialRow = 0;
  const rowCloseRe = /<\/(?:[a-zA-Z0-9_]+:)?row>/g;
  const rowOpenRe = /<(?:[a-zA-Z0-9_]+:)?row\b([^>]*)>/;

  for await (const chunk of createEntryReadable(buf, entry)) {
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bytesRead += b.length;
    if (bytesRead > maxSheetXmlBytes) {
      throw new Error(
        `UBOQ_XLSX_LIMIT_EXCEEDED: Sheet "${sheetName}" exceeded the ${(maxSheetXmlBytes / (1024 * 1024)).toFixed(0)} MB streaming limit`
      );
    }
    carry += b.toString('utf8');

    // Discard pre-sheetData preamble (<cols><col max="16384"/>, styles, sheetViews) immediately without allocating column objects
    const sheetDataOpen = carry.indexOf('<sheetData');
    if (rows.length === 0 && sheetDataOpen > 0 && !carry.slice(0, sheetDataOpen).includes('<row')) {
      carry = carry.slice(sheetDataOpen);
    }

    let lastEnd = 0;
    rowCloseRe.lastIndex = 0;
    let closeMatch: RegExpExecArray | null;
    while ((closeMatch = rowCloseRe.exec(carry)) !== null) {
      const seg = carry.slice(lastEnd, closeMatch.index);
      lastEnd = closeMatch.index + closeMatch[0].length;

      // Locate the innermost opening <row ...> before this </row> (skipping any self-closing <row .../> earlier)
      const lastOpenIdx = seg.lastIndexOf('<row');
      if (lastOpenIdx < 0) continue;
      const openSlice = seg.slice(lastOpenIdx);
      const openMatch = rowOpenRe.exec(openSlice);
      if (!openMatch) continue;
      const rowAttrs = openMatch[1] ?? '';
      const rowInner = openSlice.slice(openMatch.index + openMatch[0].length);
      const rAttr = parseXmlAttr(rowAttrs, 'r');
      const rowNumber = rAttr ? Number.parseInt(rAttr, 10) : sequentialRow + 1;
      sequentialRow = Number.isFinite(rowNumber) && rowNumber > 0 ? rowNumber : sequentialRow + 1;

      const cells = parseRowXmlCells(
        rowInner,
        sequentialRow,
        sharedStrings,
        sharedFormulas,
        maxSheetCols,
        sheetName
      );
      if (cells.length === 0) continue;

      if (sequentialRow > maxSheetRows) {
        throw new Error(
          `UBOQ_XLSX_LIMIT_EXCEEDED: Sheet "${sheetName}" has BOQ data past row ${maxSheetRows.toLocaleString()} (row ${sequentialRow.toLocaleString()}). Split the workbook into smaller BOQ sheets and retry.`
        );
      }

      totalCells += cells.length;
      if (totalCells > remainingCellBudget) {
        throw new Error(
          `UBOQ_XLSX_LIMIT_EXCEEDED: Workbook exceeds the aggregate cell processing budget. Remove unrelated supporting sheets and retry with only the BOQ sheets.`
        );
      }

      rows.push({ rowNumber: sequentialRow, cells });
    }

    if (lastEnd > 0) {
      carry = carry.slice(lastEnd);
    } else if (carry.length > 8 * 1024 * 1024) {
      // If we are past </sheetData> (e.g. huge mergeCells/conditionalFormatting/extLst tail), stop scanning safely
      if (carry.includes('</sheetData>')) {
        carry = '';
      } else {
        throw new Error(
          `UBOQ_XLSX_LIMIT_EXCEEDED: Sheet "${sheetName}" contains an oversized XML row exceeding safe streaming memory`
        );
      }
    }
  }

  return { rows, totalCells };
}

/**
 * Incrementally streams verified XLSX worksheets one sheet at a time directly from the
 * security-verified ZIP central directory. Ignores style/column-range expansion (<col max="16384"/>)
 * and externalLinks caches completely, keeping memory bounded well below Vercel serverless limits.
 */
export async function streamVerifiedXlsxWorksheets(
  buffer: Buffer,
  onSheet: (sheet: {
    readonly sheetName: string;
    readonly displayOrder: number;
    readonly rows: ReadonlyArray<StreamedXlsxRow>;
  }) => void,
  limits?: StreamedXlsxLimits
): Promise<{
  readonly sheetsProcessed: ReadonlyArray<StreamedXlsxSheetStats>;
  readonly totalCellsParsed: number;
  readonly skippedNonDataEntries: number;
}> {
  const maxWorksheets = limits?.maxWorksheets ?? MAX_XLSX_WORKSHEETS;
  const maxSharedStringXmlBytes = limits?.maxSharedStringXmlBytes ?? MAX_XLSX_SHARED_STRING_XML_BYTES;
  const maxSharedStrings = limits?.maxSharedStrings ?? MAX_XLSX_SHARED_STRINGS;
  const maxSingleSheetXmlBytes = limits?.maxSingleSheetXmlBytes ?? MAX_XLSX_SINGLE_SHEET_XML_BYTES;
  const maxTotalSheetXmlBytes = limits?.maxTotalSheetXmlBytes ?? MAX_XLSX_TOTAL_SHEET_XML_BYTES;
  const maxSheetRows = limits?.maxSheetRows ?? MAX_XLSX_SHEET_ROWS;
  const maxSheetCols = limits?.maxSheetCols ?? MAX_XLSX_SHEET_COLS;
  const maxTotalCells = limits?.maxTotalCells ?? MAX_XLSX_TOTAL_CELLS;

  const { entries } = listVerifiedOfficeZipEntries(buffer);
  const byName = new Map<string, VerifiedOfficeZipEntry>();
  for (const e of entries) {
    byName.set(e.name, e);
  }

  const wbEntry = byName.get('xl/workbook.xml');
  const relsEntry = byName.get('xl/_rels/workbook.xml.rels');
  if (!wbEntry || !relsEntry) {
    throw new Error('UBOQ_SEC_OFFICE_ENTRY_MISSING_OR_DUPLICATE: Required XLSX workbook structure is missing');
  }

  const workbookXml = await readSmallVerifiedEntryText(buffer, wbEntry, 8 * 1024 * 1024, 'workbook.xml');
  const relsXml = await readSmallVerifiedEntryText(buffer, relsEntry, 4 * 1024 * 1024, 'workbook.xml.rels');
  const sheetTargets = parseWorkbookSheetTargets(workbookXml, relsXml);

  if (sheetTargets.length === 0) {
    throw new Error('UBOQ_XLSX_EMPTY_WORKBOOK: No worksheets found in uploaded Excel file');
  }
  if (sheetTargets.length > maxWorksheets) {
    throw new Error(
      `UBOQ_XLSX_LIMIT_EXCEEDED: Workbook has ${sheetTargets.length} worksheets (maximum ${maxWorksheets}). Export only the BOQ sheets to a smaller .xlsx file and retry.`
    );
  }

  // Enforce aggregate worksheet XML budget BEFORE expanding any worksheet
  let totalPlannedSheetXmlBytes = 0;
  const resolvedSheets: Array<{ name: string; entry: VerifiedOfficeZipEntry }> = [];
  for (const st of sheetTargets) {
    const entry = byName.get(st.target);
    if (!entry) continue;
    if (entry.uncompressedSize > maxSingleSheetXmlBytes) {
      throw new Error(
        `UBOQ_XLSX_LIMIT_EXCEEDED: Sheet "${st.name}" exceeds the ${(maxSingleSheetXmlBytes / (1024 * 1024)).toFixed(0)} MB worksheet size limit. Export only the BOQ rows to a clean .xlsx file and retry.`
      );
    }
    totalPlannedSheetXmlBytes += entry.uncompressedSize;
    if (totalPlannedSheetXmlBytes > maxTotalSheetXmlBytes) {
      throw new Error(
        `UBOQ_XLSX_LIMIT_EXCEEDED: Combined worksheet XML (${(totalPlannedSheetXmlBytes / (1024 * 1024)).toFixed(1)} MB) exceeds the ${(maxTotalSheetXmlBytes / (1024 * 1024)).toFixed(0)} MB limit. Remove large supporting sheets and retry.`
      );
    }
    resolvedSheets.push({ name: st.name, entry });
  }

  const sstEntry = byName.get('xl/sharedStrings.xml');
  const sharedStrings = sstEntry
    ? await streamSharedStrings(buffer, sstEntry, maxSharedStringXmlBytes, maxSharedStrings)
    : [];

  const sheetsProcessed: StreamedXlsxSheetStats[] = [];
  let totalCellsParsed = 0;

  for (let idx = 0; idx < resolvedSheets.length; idx++) {
    const { name, entry } = resolvedSheets[idx];
    const remainingBudget = maxTotalCells - totalCellsParsed;
    const { rows, totalCells } = await streamSingleWorksheetRows({
      buf: buffer,
      entry,
      sheetName: name,
      sharedStrings,
      maxSheetXmlBytes: maxSingleSheetXmlBytes,
      maxSheetRows,
      maxSheetCols,
      remainingCellBudget: remainingBudget,
    });
    totalCellsParsed += totalCells;
    sheetsProcessed.push({
      sheetName: name,
      displayOrder: idx + 1,
      xmlBytes: entry.uncompressedSize,
      rowCount: rows.length,
      cellCount: totalCells,
    });
    // Hand off this sheet immediately and allow its rows to be GC'd before streaming the next sheet
    onSheet({
      sheetName: name,
      displayOrder: idx + 1,
      rows,
    });
  }

  const parsedEntryCount = 2 + (sstEntry ? 1 : 0) + resolvedSheets.length;
  return {
    sheetsProcessed,
    totalCellsParsed,
    skippedNonDataEntries: Math.max(0, entries.length - parsedEntryCount),
  };
}
