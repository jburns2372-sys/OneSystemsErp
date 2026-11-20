/**
 * Awarded BOQ Calculation, Formula Verification & Independent Contract Reconciliation Engine.
 *
 * Business Rule:
 * An Awarded Contract BOQ is already approved for project implementation. The ERP must NOT require
 * manual item-by-item acceptance or reapproval of each imported BOQ row. Instead, it must:
 *  1. Automatically classify rows (priced pay items vs headings, subheadings, notes, subtotals,
 *     grand totals, and price components such as VAT/discounts/provisional sums).
 *  2. Verify pay-item arithmetic (Quantity x Unit Price = Line Amount, plus DPWH Direct/Indirect
 *     columns when present) without silently altering any original source value.
 *  3. Safely verify Excel formulas (including SUM, ROUND, arithmetic operators, ranges, and
 *     cross-sheet references) and detect broken references, formula errors, circular references,
 *     unsupported syntax, and cached-vs-recalculated mismatches.
 *  4. Reconcile the independently recalculated grand total strictly against the authoritative
 *     Official Awarded Contract Amount (never using the workbook grand total as both the
 *     recalculated value and the independent awarded-contract reference).
 *  5. Never assume tax rates, never invent contract amounts, and never auto-post spending,
 *     procurement, payment, or variation transactions.
 */

export type AwardedBoqRowClassification =
  | 'PAY_ITEM'
  | 'HEADING'
  | 'SUBHEADING'
  | 'NOTE'
  | 'SUBTOTAL'
  | 'GRAND_TOTAL'
  | 'PRICE_COMPONENT'
  | 'HEADER_META';

export type AwardedBoqDiscrepancyCode =
  | 'LINE_CALCULATION_MISMATCH'
  | 'FORMULA_SYNTAX_ERROR'
  | 'FORMULA_ERROR_VALUE'
  | 'FORMULA_BROKEN_REFERENCE'
  | 'FORMULA_CIRCULAR_REFERENCE'
  | 'FORMULA_UNSUPPORTED'
  | 'FORMULA_CACHED_VALUE_MISMATCH'
  | 'SUBTOTAL_MISMATCH'
  | 'GRAND_TOTAL_MISMATCH'
  | 'MISSING_PAYABLE_VALUE'
  | 'CONTRACT_TOTAL_MISMATCH';

export interface AwardedBoqDiscrepancy {
  readonly code: AwardedBoqDiscrepancyCode;
  readonly severity: 'BLOCKING' | 'WARNING';
  readonly item: string;
  readonly worksheet: string;
  readonly cellRef: string;
  readonly expectedValue: number | string | null;
  readonly actualValue: number | string | null;
  readonly difference: number | null;
  readonly formulaText: string | null;
  readonly message: string;
}

export interface AwardedBoqPriceComponent {
  readonly label: string;
  readonly worksheet: string;
  readonly cellRef: string;
  readonly amount: number;
  readonly formulaText: string | null;
}

export interface ClassifiedAwardedBoqRow {
  readonly worksheet: string;
  readonly rowNumber: number;
  readonly classification: AwardedBoqRowClassification;
  readonly itemCode: string | null;
  readonly description: string;
  readonly unit: string | null;
  readonly quantity: number | null;
  readonly unitPrice: number | null;
  readonly directCost: number | null;
  readonly indirectCost: number | null;
  readonly lineAmount: number | null;
  readonly recalculatedAmount: number | null;
  readonly formulaText: string | null;
  readonly cellRef: string;
  readonly hasDiscrepancy: boolean;
}

export type AwardedBoqReconciliationStatus =
  | 'VERIFIED_MATCH'
  | 'CONTRACT_AMOUNT_REQUIRED'
  | 'DISCREPANCY_FOUND';

export interface AwardedBoqVerificationReport {
  readonly status: AwardedBoqReconciliationStatus;
  readonly headline: string;
  readonly calculationCheck: 'PASS' | 'FAIL';
  readonly formulaCheck: 'PASS' | 'FAIL' | 'NO_FORMULAS';
  readonly officialAwardedContractAmount: number | null;
  readonly workbookStatedGrandTotal: number | null;
  readonly recalculatedTotal: number;
  readonly variance: number | null;
  readonly roundingDecimals: number;
  readonly counts: {
    readonly totalRows: number;
    readonly payItems: number;
    readonly headingsAndNotes: number;
    readonly subtotals: number;
    readonly grandTotals: number;
    readonly priceComponents: number;
    readonly totalFormulasChecked: number;
    readonly validFormulas: number;
    readonly brokenFormulas: number;
    readonly cachedValueMismatches: number;
    readonly unsupportedFormulas: number;
    readonly discrepancies: number;
  };
  readonly priceComponents: ReadonlyArray<AwardedBoqPriceComponent>;
  readonly discrepancies: ReadonlyArray<AwardedBoqDiscrepancy>;
  readonly classifiedRows: ReadonlyArray<ClassifiedAwardedBoqRow>;
}

export interface ReconcilerGridCell {
  readonly colNumber: number;
  readonly cellRef: string;
  readonly text: string;
  readonly numOrText: string | number | null;
  readonly formula: string | null;
}

export interface ReconcilerGridRow {
  readonly rowNumber: number;
  readonly cells: ReadonlyArray<ReconcilerGridCell>;
}

export interface ReconcilerWorksheetInput {
  readonly sheetName: string;
  readonly rows: ReadonlyArray<ReconcilerGridRow>;
}

export const MSG_VERIFIED_MATCH = 'BOQ Verified — Total Matches Awarded Contract.';
export const MSG_CONTRACT_AMOUNT_REQUIRED = 'Awarded contract amount required to complete reconciliation';

const EXCEL_ERROR_REGEX = /^#(REF!|VALUE!|DIV\/0!|NAME\?|N\/A|NUM!|NULL!|CALC!|SPILL!)$/i;
const GRAND_TOTAL_LABEL_REGEX =
  /\b(grand\s+total|total\s+project\s+cost|total\s+contract\s+(?:amount|price|cost)|total\s+bid\s+(?:amount|price)|overall\s+total|net\s+contract\s+amount|contract\s+grand\s+total)\b/i;
const SUBTOTAL_LABEL_REGEX =
  /^(sub[\s-]?total\b|total\s+(?:for\s+|of\s+|part\b|division\b|section\b|phase\b|direct\s+cost|indirect\s+cost|items?\b|page\b|carried|brought)|total$)/i;
const PRICE_COMPONENT_LABEL_REGEX =
  /\b(vat|value[\s-]added\s+tax|e-?vat|output\s+tax|discount|less\s*:|provisional\s+sum|contingency|contingencies|escalation|price\s+adjustment|add\s*:)\b/i;
const NON_PAYABLE_NOTE_VALUE_REGEX =
  /^(by\s+client|by\s+owner|included|incl\.?|excluded|excl\.?|n\/a|not\s+applicable|not\s+included|for\s+reference|see\s+note|waived|free\s+of\s+charge|foc|tbd|existing|others?)$/i;
const ROMAN_OR_PART_HEADING_REGEX =
  /^([IVXLCDM]{1,6}\.?|[A-Z]\.|PART\s+[A-Z0-9]+|DIV(?:ISION)?\.?\s*[A-Z0-9]+|SECTION\s+[A-Z0-9]+|ITEM\s+[A-Z0-9]+(?:\.[0-9]+)?)$/i;

export function roundCurrency(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Math.sign(value) * 1e-12) * factor) / factor;
}

export function parseNumericStrictOrNull(val: unknown): number | null {
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  if (typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed || trimmed === '-' || trimmed === '—' || trimmed === '--') return null;
  if (EXCEL_ERROR_REGEX.test(trimmed)) return null;
  // Support accounting parentheses e.g. "(1,250.00)" -> -1250
  const isParenNeg = /^\([\s₱$,0-9.]+\)$/.test(trimmed);
  const cleaned = trimmed.replace(/[₱$,()\s]/g, '');
  if (!cleaned || !/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(cleaned)) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num)) return null;
  return isParenNeg ? -num : num;
}

function normalizeSheetKey(name: string): string {
  return name.trim().replace(/^'+|'+$/g, '').replace(/''/g, "'").toLowerCase();
}

function colLettersToNumber(letters: string): number {
  let num = 0;
  for (let i = 0; i < letters.length; i++) {
    const c = letters.charCodeAt(i);
    const u = c >= 97 && c <= 122 ? c - 32 : c;
    if (u < 65 || u > 90) return 0;
    num = num * 26 + (u - 64);
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

function parseA1Ref(ref: string): { col: number; row: number } | null {
  const m = /^\$?([A-Za-z]{1,4})\$?(\d{1,7})$/.exec(ref.trim());
  if (!m) return null;
  const col = colLettersToNumber(m[1]);
  const row = Number.parseInt(m[2], 10);
  if (!col || !Number.isFinite(row) || row <= 0) return null;
  return { col, row };
}

/**
 * Classifies a parsed row into a structured Awarded BOQ role so headings, subheadings,
 * notes, multi-row headers, and summary lines are NEVER falsely flagged as missing quantity/price.
 */
export function classifyAwardedBoqRow(input: {
  itemCode?: string | null;
  description?: string | null;
  unit?: string | null;
  quantity?: number | null;
  unitPrice?: number | null;
  lineAmount?: number | null;
  rawTextValues?: ReadonlyArray<string>;
  hasFormula?: boolean;
  amountFormula?: string | null;
  isSummaryZone?: boolean;
}): AwardedBoqRowClassification {
  const itemCode = String(input.itemCode ?? '').trim();
  const desc = String(input.description ?? '').trim();
  const unit = String(input.unit ?? '').trim();
  const combined = `${itemCode} ${desc}`.trim();
  const rawTexts = (input.rawTextValues ?? []).map((t) => t.trim()).filter(Boolean);
  const amtFormula = String(input.amountFormula ?? '').trim().toUpperCase();

  // 1. Multi-row header / numbering / legend rows like "(1) (2) (3)" or "(4)*(5)"
  if (
    rawTexts.length > 0 &&
    rawTexts.every((t) => /^\(\d+\)$/.test(t) || /^[\[\]()0-9+*xX/\-\s]+$/.test(t))
  ) {
    return 'HEADER_META';
  }
  if (/^(direct\s+cost|indirect\s+cost|mark-?ups?\s+in\s+percent|project|location|subject)$/i.test(desc) && input.quantity === null && input.unitPrice === null && input.lineAmount === null) {
    return 'HEADER_META';
  }

  // 2. Grand Total / Subtotal (either labeled OR pure aggregate SUM/SUBTOTAL formula with no qty/unitPrice)
  if (GRAND_TOTAL_LABEL_REGEX.test(combined) && input.quantity === null && input.unitPrice === null) {
    return 'GRAND_TOTAL';
  }
  if (
    (SUBTOTAL_LABEL_REGEX.test(desc) ||
      SUBTOTAL_LABEL_REGEX.test(combined) ||
      /^=\s*(?:SUM|SUBTOTAL)\s*\(/i.test(amtFormula)) &&
    input.quantity === null &&
    input.unitPrice === null
  ) {
    return 'SUBTOTAL';
  }

  // 3. Price components (VAT, Discounts, Provisional Sums, Contingencies) when not a qty*rate pay item
  if (
    PRICE_COMPONENT_LABEL_REGEX.test(combined) &&
    input.quantity === null &&
    input.unitPrice === null &&
    (input.lineAmount !== null || input.hasFormula)
  ) {
    return 'PRICE_COMPONENT';
  }

  // 4. Explicit non-payable contractual annotation ("By Client", "Included", "Excluded", "N/A")
  // when unitPrice and lineAmount are absent (even if quantity e.g. "1 lot" is listed for scope reference)
  if (
    (input.unitPrice === null || input.unitPrice === undefined) &&
    (input.lineAmount === null || input.lineAmount === undefined) &&
    rawTexts.some((t) => NON_PAYABLE_NOTE_VALUE_REGEX.test(t))
  ) {
    return 'NOTE';
  }

  // 5. Priced Pay Item (has quantity, unitPrice, or lineAmount)
  const hasAnyPayNumber =
    (input.quantity !== null && input.quantity !== undefined) ||
    (input.unitPrice !== null && input.unitPrice !== undefined) ||
    (input.lineAmount !== null && input.lineAmount !== undefined);

  if (hasAnyPayNumber) {
    return 'PAY_ITEM';
  }

  // 6. Headings / Subheadings / Descriptive Notes without payable numbers
  if (itemCode && ROMAN_OR_PART_HEADING_REGEX.test(itemCode) && !unit) {
    return 'HEADING';
  }
  if (desc && !unit) {
    const isAllCapsHeading = desc.length >= 3 && desc === desc.toUpperCase() && /[A-Z]/.test(desc);
    if (isAllCapsHeading) {
      return itemCode ? 'HEADING' : 'SUBHEADING';
    }
    return 'NOTE';
  }

  return 'NOTE';
}

// ---------------------------------------------------------------------------
// Safe Excel Formula Recursive-Descent Evaluator (NO eval / NO Function)
// ---------------------------------------------------------------------------

interface IndexedCell {
  readonly sheetKey: string;
  readonly sheetName: string;
  readonly cellRef: string;
  readonly col: number;
  readonly row: number;
  readonly cachedNum: number | null;
  readonly rawText: string;
  readonly formula: string | null;
}

type EvalResult =
  | { readonly ok: true; readonly value: number }
  | {
      readonly ok: false;
      readonly code:
        | 'FORMULA_SYNTAX_ERROR'
        | 'FORMULA_ERROR_VALUE'
        | 'FORMULA_BROKEN_REFERENCE'
        | 'FORMULA_CIRCULAR_REFERENCE'
        | 'FORMULA_UNSUPPORTED';
      readonly message: string;
    };

type FormulaToken =
  | { readonly type: 'NUMBER'; readonly value: number }
  | { readonly type: 'STRING'; readonly value: string }
  | { readonly type: 'REF'; readonly sheet: string | null; readonly ref: string }
  | { readonly type: 'RANGE'; readonly sheet: string | null; readonly start: string; readonly end: string }
  | { readonly type: 'IDENT'; readonly value: string }
  | { readonly type: 'ERROR'; readonly value: string }
  | { readonly type: 'OP'; readonly value: string }
  | { readonly type: 'LPAREN' }
  | { readonly type: 'RPAREN' }
  | { readonly type: 'COMMA' };

function tokenizeFormula(rawFormula: string): { ok: true; tokens: FormulaToken[] } | { ok: false; code: 'FORMULA_SYNTAX_ERROR' | 'FORMULA_ERROR_VALUE'; message: string } {
  const src = rawFormula.trim().replace(/^=/, '').trim();
  const tokens: FormulaToken[] = [];
  let i = 0;

  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Excel error literal e.g. #REF!, #DIV/0!, #VALUE!, #N/A, #NAME?
    if (ch === '#') {
      const m = /^#(?:REF!|VALUE!|DIV\/0!|NAME\?|N\/A|NUM!|NULL!|CALC!|SPILL!)/i.exec(src.slice(i));
      if (m) {
        tokens.push({ type: 'ERROR', value: m[0].toUpperCase() });
        i += m[0].length;
        continue;
      }
      return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Invalid error token near "${src.slice(i, i + 12)}"` };
    }

    // Quoted string literal "..."
    if (ch === '"') {
      let j = i + 1;
      let str = '';
      while (j < src.length) {
        if (src[j] === '"' && src[j + 1] === '"') {
          str += '"';
          j += 2;
        } else if (src[j] === '"') {
          break;
        } else {
          str += src[j++];
        }
      }
      if (j >= src.length) {
        return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'Unterminated string literal in formula' };
      }
      tokens.push({ type: 'STRING', value: str });
      i = j + 1;
      continue;
    }

    // Quoted cross-sheet reference: 'Sheet Name'!A1 or 'Sheet Name'!A1:B10
    if (ch === "'") {
      let j = i + 1;
      let sheetName = '';
      while (j < src.length) {
        if (src[j] === "'" && src[j + 1] === "'") {
          sheetName += "'";
          j += 2;
        } else if (src[j] === "'") {
          break;
        } else {
          sheetName += src[j++];
        }
      }
      if (j >= src.length || src[j + 1] !== '!') {
        return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Malformed quoted sheet reference near "${src.slice(i, i + 24)}"` };
      }
      const afterBang = src.slice(j + 2);
      const rangeMatch = /^(\$?[A-Za-z]{1,4}\$?\d{1,7}):(\$?[A-Za-z]{1,4}\$?\d{1,7})/.exec(afterBang);
      if (rangeMatch) {
        tokens.push({ type: 'RANGE', sheet: sheetName, start: rangeMatch[1], end: rangeMatch[2] });
        i = j + 2 + rangeMatch[0].length;
        continue;
      }
      const refMatch = /^(\$?[A-Za-z]{1,4}\$?\d{1,7})/.exec(afterBang);
      if (refMatch) {
        tokens.push({ type: 'REF', sheet: sheetName, ref: refMatch[1] });
        i = j + 2 + refMatch[0].length;
        continue;
      }
      return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Invalid cell reference after sheet "${sheetName}!"` };
    }

    // Number literal
    if (/[0-9.]/.test(ch)) {
      const m = /^(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/.exec(src.slice(i));
      if (!m) {
        return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Invalid number near "${src.slice(i, i + 12)}"` };
      }
      tokens.push({ type: 'NUMBER', value: Number(m[0]) });
      i += m[0].length;
      continue;
    }

    // Unquoted cross-sheet reference, range, cell ref, or function/identifier
    if (/[A-Za-z_$]/.test(ch)) {
      const rest = src.slice(i);

      // External workbook reference [1]Sheet!A1 -> unsupported/broken external link
      if (rest.startsWith('[')) {
        return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'External workbook reference is not self-contained' };
      }

      // Unquoted Sheet!A1:B2 or Sheet!A1
      const crossRange = /^([A-Za-z0-9_.\s-]+)!(\$?[A-Za-z]{1,4}\$?\d{1,7}):(\$?[A-Za-z]{1,4}\$?\d{1,7})/.exec(rest);
      if (crossRange && !crossRange[1].includes(' ')) {
        tokens.push({ type: 'RANGE', sheet: crossRange[1], start: crossRange[2], end: crossRange[3] });
        i += crossRange[0].length;
        continue;
      }
      const crossRef = /^([A-Za-z0-9_.]+)!(\$?[A-Za-z]{1,4}\$?\d{1,7})/.exec(rest);
      if (crossRef) {
        tokens.push({ type: 'REF', sheet: crossRef[1], ref: crossRef[2] });
        i += crossRef[0].length;
        continue;
      }

      // Local range A1:B10
      const localRange = /^(\$?[A-Za-z]{1,4}\$?\d{1,7}):(\$?[A-Za-z]{1,4}\$?\d{1,7})/.exec(rest);
      if (localRange) {
        tokens.push({ type: 'RANGE', sheet: null, start: localRange[1], end: localRange[2] });
        i += localRange[0].length;
        continue;
      }

      // Function name (followed by '(')
      const fnMatch = /^([A-Za-z_][A-Za-z0-9_.]*)(?=\s*\()/.exec(rest);
      if (fnMatch) {
        tokens.push({ type: 'IDENT', value: fnMatch[1].toUpperCase() });
        i += fnMatch[1].length;
        continue;
      }

      // Local cell reference A1 / $A$1
      const localRef = /^(\$?[A-Za-z]{1,4}\$?\d{1,7})(?![A-Za-z0-9_])/.exec(rest);
      if (localRef) {
        tokens.push({ type: 'REF', sheet: null, ref: localRef[1] });
        i += localRef[1].length;
        continue;
      }

      // Named identifier (TRUE / FALSE / unknown name)
      const ident = /^([A-Za-z_][A-Za-z0-9_.]*)/.exec(rest);
      if (ident) {
        tokens.push({ type: 'IDENT', value: ident[1].toUpperCase() });
        i += ident[1].length;
        continue;
      }
    }

    if (ch === '[') {
      return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'External workbook link cannot be independently verified' };
    }
    if (ch === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (ch === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }
    if (ch === ',') { tokens.push({ type: 'COMMA' }); i++; continue; }

    // Two-character comparison operators
    const two = src.slice(i, i + 2);
    if (two === '<>' || two === '<=' || two === '>=') {
      tokens.push({ type: 'OP', value: two });
      i += 2;
      continue;
    }
    if ('+-*/^%=<>'.includes(ch)) {
      tokens.push({ type: 'OP', value: ch });
      i++;
      continue;
    }

    return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Unexpected character "${ch}" in formula` };
  }

  return { ok: true, tokens };
}

class WorkbookFormulaEvaluator {
  private readonly sheetCells = new Map<string, Map<string, IndexedCell>>();
  private readonly sheetNames = new Map<string, string>();
  private readonly memo = new Map<string, EvalResult>();
  private readonly visiting = new Set<string>();

  constructor(sheets: ReadonlyArray<ReconcilerWorksheetInput>) {
    for (const s of sheets) {
      const sk = normalizeSheetKey(s.sheetName);
      this.sheetNames.set(sk, s.sheetName);
      const cellMap = new Map<string, IndexedCell>();
      for (const r of s.rows) {
        for (const c of r.cells) {
          const refKey = c.cellRef.toUpperCase();
          cellMap.set(refKey, {
            sheetKey: sk,
            sheetName: s.sheetName,
            cellRef: refKey,
            col: c.colNumber,
            row: r.rowNumber,
            cachedNum: parseNumericStrictOrNull(c.numOrText ?? c.text),
            rawText: String(c.text ?? '').trim(),
            formula: c.formula,
          });
        }
      }
      this.sheetCells.set(sk, cellMap);
    }
  }

  evaluateCell(sheetName: string, cellRef: string): EvalResult {
    const sk = normalizeSheetKey(sheetName);
    const refKey = cellRef.replace(/\$/g, '').toUpperCase();
    const memoKey = `${sk}!${refKey}`;

    const cached = this.memo.get(memoKey);
    if (cached) return cached;

    if (this.visiting.has(memoKey)) {
      return {
        ok: false,
        code: 'FORMULA_CIRCULAR_REFERENCE',
        message: `Circular reference detected at ${sheetName}!${refKey}`,
      };
    }

    const sheetMap = this.sheetCells.get(sk);
    if (!sheetMap) {
      return {
        ok: false,
        code: 'FORMULA_BROKEN_REFERENCE',
        message: `Referenced worksheet "${sheetName}" does not exist in workbook`,
      };
    }

    const cell = sheetMap.get(refKey);
    if (!cell) {
      // Standard Excel behavior: empty cell in arithmetic evaluates to 0
      return { ok: true, value: 0 };
    }

    if (EXCEL_ERROR_REGEX.test(cell.rawText)) {
      const err: EvalResult = {
        ok: false,
        code: cell.rawText.toUpperCase() === '#REF!' ? 'FORMULA_BROKEN_REFERENCE' : 'FORMULA_ERROR_VALUE',
        message: `Cell ${cell.sheetName}!${refKey} contains Excel error value ${cell.rawText}`,
      };
      this.memo.set(memoKey, err);
      return err;
    }

    if (!cell.formula) {
      const res: EvalResult = { ok: true, value: cell.cachedNum ?? 0 };
      this.memo.set(memoKey, res);
      return res;
    }

    this.visiting.add(memoKey);
    const res = this.evaluateFormulaString(cell.sheetName, cell.formula);
    this.visiting.delete(memoKey);
    this.memo.set(memoKey, res);
    return res;
  }

  evaluateFormulaString(currentSheetName: string, rawFormula: string): EvalResult {
    const tokRes = tokenizeFormula(rawFormula);
    if ('code' in tokRes) {
      return { ok: false, code: tokRes.code, message: tokRes.message };
    }
    const tokens = tokRes.tokens;
    if (tokens.length === 0) {
      return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'Empty formula expression' };
    }

    let pos = 0;
    const peek = (): FormulaToken | undefined => tokens[pos];
    const next = (): FormulaToken | undefined => tokens[pos++];

    const resolveRangeNumbers = (sheet: string | null, startRef: string, endRef: string): { ok: true; values: number[] } | { ok: false; err: EvalResult } => {
      const targetSheet = sheet ?? currentSheetName;
      const sk = normalizeSheetKey(targetSheet);
      if (!this.sheetCells.has(sk)) {
        return {
          ok: false,
          err: {
            ok: false,
            code: 'FORMULA_BROKEN_REFERENCE',
            message: `Worksheet "${targetSheet}" referenced in ${startRef}:${endRef} does not exist`,
          },
        };
      }
      const sPos = parseA1Ref(startRef);
      const ePos = parseA1Ref(endRef);
      if (!sPos || !ePos) {
        return {
          ok: false,
          err: {
            ok: false,
            code: 'FORMULA_BROKEN_REFERENCE',
            message: `Invalid range ${startRef}:${endRef}`,
          },
        };
      }
      const rMin = Math.min(sPos.row, ePos.row);
      const rMax = Math.max(sPos.row, ePos.row);
      const cMin = Math.min(sPos.col, ePos.col);
      const cMax = Math.max(sPos.col, ePos.col);
      const span = (rMax - rMin + 1) * (cMax - cMin + 1);
      if (span > 100_000) {
        return {
          ok: false,
          err: {
            ok: false,
            code: 'FORMULA_UNSUPPORTED',
            message: `Formula range ${startRef}:${endRef} exceeds safe verification span`,
          },
        };
      }

      const sheetMap = this.sheetCells.get(sk)!;
      const values: number[] = [];
      for (const cell of sheetMap.values()) {
        if (cell.row >= rMin && cell.row <= rMax && cell.col >= cMin && cell.col <= cMax) {
          if (cell.formula || cell.cachedNum !== null || EXCEL_ERROR_REGEX.test(cell.rawText)) {
            const ev = this.evaluateCell(targetSheet, cell.cellRef);
            if (!ev.ok) return { ok: false, err: ev };
            values.push(ev.value);
          }
        }
      }
      return { ok: true, values };
    };

    const parseComparison = (): EvalResult => {
      let left = parseAddSub();
      if (!left.ok) return left;
      while (peek()?.type === 'OP' && ['=', '<>', '<', '>', '<=', '>='].includes((peek() as { value: string }).value)) {
        const op = (next() as { value: string }).value;
        const right = parseAddSub();
        if (!right.ok) return right;
        let truth = false;
        if (op === '=') truth = Math.abs(left.value - right.value) < 1e-9;
        else if (op === '<>') truth = Math.abs(left.value - right.value) >= 1e-9;
        else if (op === '<') truth = left.value < right.value;
        else if (op === '>') truth = left.value > right.value;
        else if (op === '<=') truth = left.value <= right.value;
        else if (op === '>=') truth = left.value >= right.value;
        left = { ok: true, value: truth ? 1 : 0 };
      }
      return left;
    };

    const parseAddSub = (): EvalResult => {
      let left = parseMulDiv();
      if (!left.ok) return left;
      while (peek()?.type === 'OP' && ['+', '-'].includes((peek() as { value: string }).value)) {
        const op = (next() as { value: string }).value;
        const right = parseMulDiv();
        if (!right.ok) return right;
        left = { ok: true, value: op === '+' ? left.value + right.value : left.value - right.value };
      }
      return left;
    };

    const parseMulDiv = (): EvalResult => {
      let left = parsePower();
      if (!left.ok) return left;
      while (peek()?.type === 'OP' && ['*', '/'].includes((peek() as { value: string }).value)) {
        const op = (next() as { value: string }).value;
        const right = parsePower();
        if (!right.ok) return right;
        if (op === '/') {
          if (Math.abs(right.value) < 1e-15) {
            return { ok: false, code: 'FORMULA_ERROR_VALUE', message: 'Division by zero (#DIV/0!) in formula' };
          }
          left = { ok: true, value: left.value / right.value };
        } else {
          left = { ok: true, value: left.value * right.value };
        }
      }
      return left;
    };

    const parsePower = (): EvalResult => {
      let left = parseUnary();
      if (!left.ok) return left;
      while (peek()?.type === 'OP' && (peek() as { value: string }).value === '^') {
        next();
        const right = parseUnary();
        if (!right.ok) return right;
        left = { ok: true, value: Math.pow(left.value, right.value) };
      }
      return left;
    };

    const parseUnary = (): EvalResult => {
      if (peek()?.type === 'OP' && ['+', '-'].includes((peek() as { value: string }).value)) {
        const op = (next() as { value: string }).value;
        const val = parseUnary();
        if (!val.ok) return val;
        return { ok: true, value: op === '-' ? -val.value : val.value };
      }
      return parsePostfix();
    };

    const parsePostfix = (): EvalResult => {
      let val = parsePrimary();
      if (!val.ok) return val;
      while (peek()?.type === 'OP' && (peek() as { value: string }).value === '%') {
        next();
        val = { ok: true, value: val.value / 100 };
      }
      return val;
    };

    const parseFunctionArgs = (allowRanges: boolean): { ok: true; flatValues: number[]; argGroups: number[][] } | { ok: false; err: EvalResult } => {
      const flatValues: number[] = [];
      const argGroups: number[][] = [];
      if (peek()?.type === 'RPAREN') {
        next();
        return { ok: true, flatValues, argGroups };
      }
      while (pos < tokens.length) {
        const cur = peek();
        if (allowRanges && cur?.type === 'RANGE') {
          next();
          const r = resolveRangeNumbers(cur.sheet, cur.start, cur.end);
          if ('err' in r) return { ok: false, err: r.err };
          flatValues.push(...r.values);
          argGroups.push(r.values);
        } else {
          const ev = parseComparison();
          if ('code' in ev) return { ok: false, err: ev };
          flatValues.push(ev.value);
          argGroups.push([ev.value]);
        }
        if (peek()?.type === 'COMMA') {
          next();
          continue;
        }
        if (peek()?.type === 'RPAREN') {
          next();
          return { ok: true, flatValues, argGroups };
        }
        return { ok: false, err: { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'Expected "," or ")" in function arguments' } };
      }
      return { ok: false, err: { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'Unclosed function call "("' } };
    };

    const parsePrimary = (): EvalResult => {
      const tok = next();
      if (!tok) {
        return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'Unexpected end of formula' };
      }
      if (tok.type === 'ERROR') {
        return {
          ok: false,
          code: tok.value === '#REF!' ? 'FORMULA_BROKEN_REFERENCE' : 'FORMULA_ERROR_VALUE',
          message: `Formula contains Excel error ${tok.value}`,
        };
      }
      if (tok.type === 'NUMBER') {
        return { ok: true, value: tok.value };
      }
      if (tok.type === 'STRING') {
        const parsed = parseNumericStrictOrNull(tok.value);
        return { ok: true, value: parsed ?? 0 };
      }
      if (tok.type === 'REF') {
        return this.evaluateCell(tok.sheet ?? currentSheetName, tok.ref);
      }
      if (tok.type === 'RANGE') {
        return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Bare range ${tok.start}:${tok.end} outside aggregate function` };
      }
      if (tok.type === 'LPAREN') {
        const inner = parseComparison();
        if (!inner.ok) return inner;
        if (peek()?.type !== 'RPAREN') {
          return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'Missing closing ")" in formula' };
        }
        next();
        return inner;
      }
      if (tok.type === 'IDENT') {
        if (tok.value === 'TRUE') return { ok: true, value: 1 };
        if (tok.value === 'FALSE') return { ok: true, value: 0 };

        if (peek()?.type !== 'LPAREN') {
          return { ok: false, code: 'FORMULA_UNSUPPORTED', message: `Unresolved named reference "${tok.value}"` };
        }
        next(); // consume '('
        const fn = tok.value;

        if (fn === 'SUM') {
          const args = parseFunctionArgs(true);
          if ('err' in args) return args.err;
          return { ok: true, value: args.flatValues.reduce((a, b) => a + b, 0) };
        }
        if (fn === 'SUBTOTAL') {
          const args = parseFunctionArgs(true);
          if ('err' in args) return args.err;
          const fnCode = args.argGroups[0]?.[0];
          const rest = args.argGroups.slice(1).flat();
          if (fnCode === 9 || fnCode === 109) {
            return { ok: true, value: rest.reduce((a, b) => a + b, 0) };
          }
          return { ok: false, code: 'FORMULA_UNSUPPORTED', message: `Unsupported SUBTOTAL function code ${String(fnCode)}` };
        }
        if (fn === 'ROUND' || fn === 'ROUNDUP' || fn === 'ROUNDDOWN') {
          const args = parseFunctionArgs(false);
          if ('err' in args) return args.err;
          if (args.flatValues.length < 2) {
            return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `${fn} requires 2 arguments` };
          }
          const num = args.flatValues[0];
          const digits = Math.trunc(args.flatValues[1]);
          const factor = Math.pow(10, digits);
          if (fn === 'ROUND') return { ok: true, value: roundCurrency(num, digits) };
          if (fn === 'ROUNDUP') {
            return { ok: true, value: (num >= 0 ? Math.ceil(num * factor - 1e-12) : Math.floor(num * factor + 1e-12)) / factor };
          }
          return { ok: true, value: (num >= 0 ? Math.floor(num * factor + 1e-12) : Math.ceil(num * factor - 1e-12)) / factor };
        }
        if (fn === 'ABS') {
          const args = parseFunctionArgs(false);
          if ('err' in args) return args.err;
          return { ok: true, value: Math.abs(args.flatValues[0] ?? 0) };
        }
        if (fn === 'MIN') {
          const args = parseFunctionArgs(true);
          if ('err' in args) return args.err;
          return { ok: true, value: args.flatValues.length > 0 ? Math.min(...args.flatValues) : 0 };
        }
        if (fn === 'MAX') {
          const args = parseFunctionArgs(true);
          if ('err' in args) return args.err;
          return { ok: true, value: args.flatValues.length > 0 ? Math.max(...args.flatValues) : 0 };
        }
        if (fn === 'IF') {
          const args = parseFunctionArgs(false);
          if ('err' in args) return args.err;
          if (args.flatValues.length < 2) {
            return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: 'IF requires at least 2 arguments' };
          }
          return { ok: true, value: args.flatValues[0] !== 0 ? args.flatValues[1] : (args.flatValues[2] ?? 0) };
        }
        if (fn === 'IFERROR') {
          // Evaluate first arg; if error, evaluate second arg
          const first = parseComparison();
          if (peek()?.type === 'COMMA') next();
          const second = parseComparison();
          if (peek()?.type === 'RPAREN') next();
          if (first.ok) return first;
          return second;
        }

        return { ok: false, code: 'FORMULA_UNSUPPORTED', message: `Unsupported Excel function "${fn}(...)" requires verification` };
      }

      return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Unexpected token in formula` };
    };

    const result = parseComparison();
    if (!result.ok) return result;
    if (pos < tokens.length) {
      return { ok: false, code: 'FORMULA_SYNTAX_ERROR', message: `Unexpected trailing tokens in formula "${rawFormula}"` };
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// Header Detection for Worksheet-Level Awarded BOQ Verification
// ---------------------------------------------------------------------------

interface DetectedBoqColumns {
  readonly headerRowIndex: number;
  readonly itemCodeCol: number | null;
  readonly descriptionCol: number | null;
  readonly unitCol: number | null;
  readonly qtyCol: number | null;
  readonly unitPriceCol: number | null;
  readonly directCostCol: number | null;
  readonly indirectCostCol: number | null;
  readonly totalAmountCol: number | null;
}

function detectWorksheetBoqColumns(rows: ReadonlyArray<ReconcilerGridRow>): DetectedBoqColumns | null {
  let bestScore = 0;
  let best: DetectedBoqColumns | null = null;
  const maxScan = Math.min(rows.length, 30);

  for (let i = 0; i < maxScan; i++) {
    const r = rows[i];
    // Combine current row + next row text per column to handle two-row headers (e.g., DPWH Detailed Estimates)
    const nextRow = i + 1 < rows.length ? rows[i + 1] : null;
    const colText = new Map<number, string>();
    for (const c of r.cells) {
      colText.set(c.colNumber, String(c.text ?? '').trim());
    }
    if (nextRow) {
      const nextCells = nextRow.cells;
      const looksLikeSubHeader = nextCells.length > 0 && nextCells.every((c) => parseNumericStrictOrNull(c.text) === null);
      if (looksLikeSubHeader) {
        for (const c of nextCells) {
          const prev = colText.get(c.colNumber) ?? '';
          colText.set(c.colNumber, `${prev} ${String(c.text ?? '').trim()}`.trim());
        }
      }
    }

    let itemCodeCol: number | null = null;
    let descriptionCol: number | null = null;
    let unitCol: number | null = null;
    let qtyCol: number | null = null;
    let unitPriceCol: number | null = null;
    let directCostCol: number | null = null;
    let indirectCostCol: number | null = null;
    let totalAmountCol: number | null = null;
    let score = 0;

    for (const [colNum, rawLabel] of colText.entries()) {
      const label = rawLabel.replace(/\s+/g, ' ').trim();
      if (!label) continue;

      if (itemCodeCol === null && /^(item\s*(no\.?|code|#)|pay\s+item|code)$/i.test(label)) {
        itemCodeCol = colNum;
        score += 2;
      } else if (descriptionCol === null && /\b(description|scope\s+of\s+work|particulars|work\s+item)\b/i.test(label)) {
        descriptionCol = colNum;
        score += 3;
      } else if (unitCol === null && /^(unit|uom|u\/m)$/i.test(label)) {
        unitCol = colNum;
        score += 2;
      } else if (qtyCol === null && /^(qty\.?|quantity|quantities|volume|contract\s+qty)$/i.test(label)) {
        qtyCol = colNum;
        score += 3;
      } else if (unitPriceCol === null && /\b(unit\s*(cost|price|rate))\b/i.test(label) && !/\btotal\b/i.test(label)) {
        unitPriceCol = colNum;
        score += 3;
      } else if (directCostCol === null && /\b(estimated\s+direct\s+cost|direct\s+cost)\b/i.test(label)) {
        directCostCol = colNum;
        score += 2;
      } else if (indirectCostCol === null && /\b(total\s+indirect\s+cost|indirect\s+cost)\b/i.test(label)) {
        indirectCostCol = colNum;
        score += 1;
      } else if (/\b(total\s*(cost|amount|price)|line\s+amount|contract\s+amount|amount)\b/i.test(label) && !/\b(indirect|direct|mark-?up|vat)\b/i.test(label)) {
        totalAmountCol = colNum;
        score += 3;
      }
    }

    if (descriptionCol !== null && (qtyCol !== null || unitPriceCol !== null || totalAmountCol !== null) && score > bestScore) {
      bestScore = score;
      best = {
        headerRowIndex: i,
        itemCodeCol,
        descriptionCol,
        unitCol,
        qtyCol,
        unitPriceCol,
        directCostCol,
        indirectCostCol,
        totalAmountCol,
      };
    }
  }

  return best;
}

/**
 * Full Workbook-Level Awarded BOQ Verification & Independent Contract Reconciliation.
 * Verifies every worksheet formula, pay-item calculation, subtotal, grand total, and price component,
 * then reconciles independently against `officialAwardedContractAmount`.
 */
export function verifyAwardedBoqWorkbook(
  sheets: ReadonlyArray<ReconcilerWorksheetInput>,
  options?: {
    readonly officialAwardedContractAmount?: number | null;
    readonly roundingDecimals?: number;
  }
): AwardedBoqVerificationReport {
  const roundingDecimals = options?.roundingDecimals ?? 2;
  const officialAwardedContractAmount =
    typeof options?.officialAwardedContractAmount === 'number' &&
    Number.isFinite(options.officialAwardedContractAmount) &&
    options.officialAwardedContractAmount > 0
      ? roundCurrency(options.officialAwardedContractAmount, roundingDecimals)
      : null;

  const evaluator = new WorkbookFormulaEvaluator(sheets);
  const discrepancies: AwardedBoqDiscrepancy[] = [];
  const classifiedRows: ClassifiedAwardedBoqRow[] = [];
  const priceComponents: AwardedBoqPriceComponent[] = [];

  let totalFormulasChecked = 0;
  let validFormulas = 0;
  let brokenFormulas = 0;
  let cachedValueMismatches = 0;
  let unsupportedFormulas = 0;

  let payItemsCount = 0;
  let headingsAndNotesCount = 0;
  let subtotalsCount = 0;
  let grandTotalsCount = 0;

  let sumOfPayItems = 0;
  let sumOfPriceComponents = 0;
  let workbookStatedGrandTotal: number | null = null;
  let workbookRecalculatedGrandTotal: number | null = null;
  let grandTotalMeta: { worksheet: string; cellRef: string; label: string; formulaText: string | null } | null = null;

  // Step 1: Verify ALL formulas across ALL worksheets (including cross-sheet refs & cached-vs-recalculated values)
  for (const sheet of sheets) {
    for (const row of sheet.rows) {
      for (const cell of row.cells) {
        const trimmedText = String(cell.text ?? '').trim();
        if (EXCEL_ERROR_REGEX.test(trimmedText)) {
          brokenFormulas++;
          if (cell.formula) totalFormulasChecked++;
          discrepancies.push({
            code: trimmedText.toUpperCase() === '#REF!' ? 'FORMULA_BROKEN_REFERENCE' : 'FORMULA_ERROR_VALUE',
            severity: 'BLOCKING',
            item: `Row ${row.rowNumber}`,
            worksheet: sheet.sheetName,
            cellRef: `${sheet.sheetName}!${cell.cellRef}`,
            expectedValue: 'Valid numeric value',
            actualValue: trimmedText,
            difference: null,
            formulaText: cell.formula,
            message: `Cell ${sheet.sheetName}!${cell.cellRef} has Excel error "${trimmedText}".`,
          });
          continue;
        }

        if (!cell.formula) continue;
        totalFormulasChecked++;
        const ev = evaluator.evaluateCell(sheet.sheetName, cell.cellRef);
        if ('code' in ev) {
          if (ev.code === 'FORMULA_UNSUPPORTED') unsupportedFormulas++;
          else brokenFormulas++;
          discrepancies.push({
            code: ev.code,
            severity: 'BLOCKING',
            item: `Row ${row.rowNumber}`,
            worksheet: sheet.sheetName,
            cellRef: `${sheet.sheetName}!${cell.cellRef}`,
            expectedValue: 'Valid formula result',
            actualValue: cell.text || null,
            difference: null,
            formulaText: cell.formula,
            message: `${sheet.sheetName}!${cell.cellRef}: ${ev.message}`,
          });
          continue;
        }

        const cachedNum = parseNumericStrictOrNull(cell.numOrText ?? cell.text);
        if (cachedNum !== null) {
          const roundedEval = roundCurrency(ev.value, roundingDecimals);
          const roundedCached = roundCurrency(cachedNum, roundingDecimals);
          const diff = roundCurrency(roundedCached - roundedEval, roundingDecimals);
          if (Math.abs(diff) > 0) {
            cachedValueMismatches++;
            discrepancies.push({
              code: 'FORMULA_CACHED_VALUE_MISMATCH',
              severity: 'BLOCKING',
              item: `Row ${row.rowNumber}`,
              worksheet: sheet.sheetName,
              cellRef: `${sheet.sheetName}!${cell.cellRef}`,
              expectedValue: roundedEval,
              actualValue: roundedCached,
              difference: diff,
              formulaText: cell.formula,
              message: `Cached value (${roundedCached.toFixed(roundingDecimals)}) disagrees with formula result (${roundedEval.toFixed(roundingDecimals)}) at ${sheet.sheetName}!${cell.cellRef}.`,
            });
            continue;
          }
        }
        validFormulas++;
      }
    }
  }

  // Step 2: Classify rows & verify pay-item arithmetic + subtotals + price components + grand total
  for (const sheet of sheets) {
    const cols = detectWorksheetBoqColumns(sheet.rows);
    if (!cols) continue;

    // Determine effective total column (Total Amount if present, else Direct Cost)
    const effectiveAmountCol = cols.totalAmountCol ?? cols.directCostCol;
    const sheetPayItemAmounts: number[] = [];

    for (let i = cols.headerRowIndex + 1; i < sheet.rows.length; i++) {
      const row = sheet.rows[i];
      const byCol = new Map<number, ReconcilerGridCell>();
      for (const c of row.cells) byCol.set(c.colNumber, c);

      const getCell = (col: number | null) => (col !== null ? byCol.get(col) ?? null : null);
      const itemCodeCell = getCell(cols.itemCodeCol);
      const descCell = getCell(cols.descriptionCol);
      const unitCell = getCell(cols.unitCol);
      const qtyCell = getCell(cols.qtyCol);
      const rateCell = getCell(cols.unitPriceCol);
      const directCell = getCell(cols.directCostCol);
      const indirectCell = getCell(cols.indirectCostCol);
      const totalCell = getCell(effectiveAmountCol);

      const rawTexts = row.cells.map((c) => String(c.text ?? '').trim()).filter(Boolean);
      if (rawTexts.length === 0) continue;

      const itemCode = String(itemCodeCell?.text ?? '').trim() || null;
      const desc = String(descCell?.text ?? '').trim() || rawTexts[0] || '';
      const unit = String(unitCell?.text ?? '').trim() || null;
      const qty = qtyCell ? parseNumericStrictOrNull(qtyCell.numOrText ?? qtyCell.text) : null;
      const unitPrice = rateCell ? parseNumericStrictOrNull(rateCell.numOrText ?? rateCell.text) : null;
      const directCost = directCell ? parseNumericStrictOrNull(directCell.numOrText ?? directCell.text) : null;
      const indirectCost = indirectCell ? parseNumericStrictOrNull(indirectCell.numOrText ?? indirectCell.text) : null;
      const lineAmount = totalCell ? parseNumericStrictOrNull(totalCell.numOrText ?? totalCell.text) : null;

      // Also scan any cell in the row for Grand Total / Subtotal / Price Component labels if description cell is blank
      const combinedLabel = desc || rawTexts.join(' ');
      const rowHasFormula = row.cells.some((c) => Boolean(c.formula));

      const classification = classifyAwardedBoqRow({
        itemCode,
        description: combinedLabel,
        unit,
        quantity: qty,
        unitPrice,
        lineAmount,
        rawTextValues: rawTexts,
        hasFormula: rowHasFormula,
        amountFormula: totalCell?.formula ?? directCell?.formula ?? null,
      });

      const primaryRef = `${sheet.sheetName}!${(totalCell ?? descCell ?? row.cells[0]).cellRef}`;
      const itemLabel = itemCode ? `${itemCode} — ${desc || combinedLabel}` : (desc || `Row ${row.rowNumber}`);
      let rowHasDiscrepancy = false;
      let recalculatedAmount: number | null = lineAmount;

      if (classification === 'HEADER_META' || classification === 'HEADING' || classification === 'SUBHEADING' || classification === 'NOTE') {
        headingsAndNotesCount++;
      } else if (classification === 'SUBTOTAL') {
        subtotalsCount++;
        if (totalCell?.formula) {
          const ev = evaluator.evaluateCell(sheet.sheetName, totalCell.cellRef);
          if (ev.ok) recalculatedAmount = roundCurrency(ev.value, roundingDecimals);
        }
      } else if (classification === 'PRICE_COMPONENT') {
        // Locate amount cell (prefer totalAmountCol, else rightmost numeric/formula cell on the row)
        const compCell =
          totalCell && (lineAmount !== null || totalCell.formula)
            ? totalCell
            : [...row.cells].reverse().find((c) => c.formula || parseNumericStrictOrNull(c.numOrText ?? c.text) !== null) ?? null;

        let compVal: number | null = compCell ? parseNumericStrictOrNull(compCell.numOrText ?? compCell.text) : null;
        if (compCell?.formula) {
          const ev = evaluator.evaluateCell(sheet.sheetName, compCell.cellRef);
          if (ev.ok) compVal = roundCurrency(ev.value, roundingDecimals);
        }
        if (compVal !== null) {
          // If label explicitly says "Less:" or "Discount" and stored as positive, treat carefully ONLY as workbook defines it
          sumOfPriceComponents = roundCurrency(sumOfPriceComponents + compVal, roundingDecimals);
          recalculatedAmount = compVal;
          priceComponents.push({
            label: combinedLabel,
            worksheet: sheet.sheetName,
            cellRef: `${sheet.sheetName}!${compCell!.cellRef}`,
            amount: compVal,
            formulaText: compCell?.formula ?? null,
          });
        }
      } else if (classification === 'GRAND_TOTAL') {
        grandTotalsCount++;
        const gtCell =
          totalCell && (lineAmount !== null || totalCell.formula)
            ? totalCell
            : [...row.cells].reverse().find((c) => c.formula || parseNumericStrictOrNull(c.numOrText ?? c.text) !== null) ?? null;
        if (gtCell) {
          const stated = parseNumericStrictOrNull(gtCell.numOrText ?? gtCell.text);
          let evalGt = stated;
          if (gtCell.formula) {
            const ev = evaluator.evaluateCell(sheet.sheetName, gtCell.cellRef);
            if (ev.ok) evalGt = roundCurrency(ev.value, roundingDecimals);
          }
          if (stated !== null) workbookStatedGrandTotal = roundCurrency(stated, roundingDecimals);
          if (evalGt !== null) {
            workbookRecalculatedGrandTotal = roundCurrency(evalGt, roundingDecimals);
            recalculatedAmount = workbookRecalculatedGrandTotal;
          }
          grandTotalMeta = {
            worksheet: sheet.sheetName,
            cellRef: `${sheet.sheetName}!${gtCell.cellRef}`,
            label: combinedLabel,
            formulaText: gtCell.formula,
          };
        }
      } else if (classification === 'PAY_ITEM') {
        payItemsCount++;

        // Rule 6: Detect missing values that prevent a payable item's calculation
        if ((qty !== null && unitPrice === null && lineAmount === null) || (qty === null && unitPrice !== null && lineAmount === null)) {
          rowHasDiscrepancy = true;
          discrepancies.push({
            code: 'MISSING_PAYABLE_VALUE',
            severity: 'BLOCKING',
            item: itemLabel,
            worksheet: sheet.sheetName,
            cellRef: primaryRef,
            expectedValue: 'Complete quantity, unit price, and line amount',
            actualValue: qty === null ? 'Missing quantity' : 'Missing unit price/amount',
            difference: null,
            formulaText: totalCell?.formula ?? null,
            message: `Payable item "${itemLabel}" at ${primaryRef} is missing a value required to compute its line amount.`,
          });
        }

        // Rule 4: Verify Quantity x Unit Price = Direct Cost (when DPWH Direct/Indirect columns exist) or Line Amount
        if (qty !== null && unitPrice !== null) {
          const expectedProduct = roundCurrency(qty * unitPrice, roundingDecimals);

          if (cols.directCostCol !== null && cols.totalAmountCol !== null && cols.directCostCol !== cols.totalAmountCol) {
            // Detailed Estimates / DPWH layout: Qty * Unit Cost = Estimated Direct Cost, Direct + Indirect = Total Cost
            if (directCost !== null) {
              const directDiff = roundCurrency(directCost - expectedProduct, roundingDecimals);
              if (Math.abs(directDiff) > 0) {
                rowHasDiscrepancy = true;
                discrepancies.push({
                  code: 'LINE_CALCULATION_MISMATCH',
                  severity: 'BLOCKING',
                  item: itemLabel,
                  worksheet: sheet.sheetName,
                  cellRef: `${sheet.sheetName}!${directCell!.cellRef}`,
                  expectedValue: expectedProduct,
                  actualValue: roundCurrency(directCost, roundingDecimals),
                  difference: directDiff,
                  formulaText: directCell?.formula ?? null,
                  message: `Direct cost mismatch on "${itemLabel}": Qty (${qty}) × Unit Cost (${unitPrice}) = ${expectedProduct.toFixed(roundingDecimals)}, found ${directCost.toFixed(roundingDecimals)}.`,
                });
              }
            }
            if (lineAmount !== null) {
              const expectedTotal =
                indirectCost !== null
                  ? roundCurrency(expectedProduct + indirectCost, roundingDecimals)
                  : totalCell?.formula
                    ? (() => {
                        const ev = evaluator.evaluateCell(sheet.sheetName, totalCell.cellRef);
                        return ev.ok ? roundCurrency(ev.value, roundingDecimals) : roundCurrency(lineAmount, roundingDecimals);
                      })()
                    : expectedProduct;
              const totalDiff = roundCurrency(lineAmount - expectedTotal, roundingDecimals);
              if (Math.abs(totalDiff) > 0) {
                rowHasDiscrepancy = true;
                discrepancies.push({
                  code: 'LINE_CALCULATION_MISMATCH',
                  severity: 'BLOCKING',
                  item: itemLabel,
                  worksheet: sheet.sheetName,
                  cellRef: `${sheet.sheetName}!${totalCell!.cellRef}`,
                  expectedValue: expectedTotal,
                  actualValue: roundCurrency(lineAmount, roundingDecimals),
                  difference: totalDiff,
                  formulaText: totalCell?.formula ?? null,
                  message: `Total cost mismatch on "${itemLabel}": expected ${expectedTotal.toFixed(roundingDecimals)}, found ${lineAmount.toFixed(roundingDecimals)}.`,
                });
              }
              recalculatedAmount = expectedTotal;
            } else {
              recalculatedAmount = indirectCost !== null ? roundCurrency(expectedProduct + indirectCost, roundingDecimals) : expectedProduct;
            }
          } else {
            // Standard BOQ layout: Qty * Unit Price = Line Amount
            recalculatedAmount = expectedProduct;
            if (lineAmount !== null) {
              const diff = roundCurrency(lineAmount - expectedProduct, roundingDecimals);
              if (Math.abs(diff) > 0) {
                rowHasDiscrepancy = true;
                discrepancies.push({
                  code: 'LINE_CALCULATION_MISMATCH',
                  severity: 'BLOCKING',
                  item: itemLabel,
                  worksheet: sheet.sheetName,
                  cellRef: `${sheet.sheetName}!${totalCell!.cellRef}`,
                  expectedValue: expectedProduct,
                  actualValue: roundCurrency(lineAmount, roundingDecimals),
                  difference: diff,
                  formulaText: totalCell?.formula ?? null,
                  message: `Line amount mismatch on "${itemLabel}": Qty (${qty}) × Unit Price (${unitPrice}) = ${expectedProduct.toFixed(roundingDecimals)}, found ${lineAmount.toFixed(roundingDecimals)}.`,
                });
              }
            }
          }
        } else if (lineAmount !== null) {
          recalculatedAmount = roundCurrency(lineAmount, roundingDecimals);
        }

        if (recalculatedAmount !== null) {
          sheetPayItemAmounts.push(recalculatedAmount);
          sumOfPayItems = roundCurrency(sumOfPayItems + recalculatedAmount, roundingDecimals);
        }
      }

      classifiedRows.push({
        worksheet: sheet.sheetName,
        rowNumber: row.rowNumber,
        classification,
        itemCode,
        description: combinedLabel,
        unit,
        quantity: qty,
        unitPrice,
        directCost,
        indirectCost,
        lineAmount,
        recalculatedAmount,
        formulaText: totalCell?.formula ?? directCell?.formula ?? null,
        cellRef: primaryRef,
        hasDiscrepancy: rowHasDiscrepancy,
      });
    }
  }

  // Step 3: Independently check workbook Grand Total vs sum of pay items + price components
  const independentSumTotal = roundCurrency(sumOfPayItems + sumOfPriceComponents, roundingDecimals);

  if (workbookRecalculatedGrandTotal !== null && payItemsCount > 0) {
    const gtDiff = roundCurrency(workbookRecalculatedGrandTotal - independentSumTotal, roundingDecimals);
    if (Math.abs(gtDiff) > 0 && grandTotalMeta) {
      discrepancies.push({
        code: 'GRAND_TOTAL_MISMATCH',
        severity: 'BLOCKING',
        item: grandTotalMeta.label,
        worksheet: grandTotalMeta.worksheet,
        cellRef: grandTotalMeta.cellRef,
        expectedValue: independentSumTotal,
        actualValue: workbookRecalculatedGrandTotal,
        difference: gtDiff,
        formulaText: grandTotalMeta.formulaText,
        message: `Workbook grand total (${workbookRecalculatedGrandTotal.toFixed(roundingDecimals)}) does not match independent sum of pay items & price components (${independentSumTotal.toFixed(roundingDecimals)}); difference ${gtDiff.toFixed(roundingDecimals)}.`,
      });
    }
  }

  const recalculatedTotal = payItemsCount > 0 ? independentSumTotal : (workbookRecalculatedGrandTotal ?? 0);

  // Step 4: Reconcile independently against Official Awarded Contract Amount (Rules 9-13)
  let variance: number | null = null;
  if (officialAwardedContractAmount !== null) {
    variance = roundCurrency(recalculatedTotal - officialAwardedContractAmount, roundingDecimals);
    if (Math.abs(variance) > 0) {
      discrepancies.push({
        code: 'CONTRACT_TOTAL_MISMATCH',
        severity: 'BLOCKING',
        item: 'Awarded Contract Reconciliation',
        worksheet: grandTotalMeta?.worksheet ?? (sheets[0]?.sheetName || 'BOQ'),
        cellRef: grandTotalMeta?.cellRef ?? 'GRAND_TOTAL',
        expectedValue: officialAwardedContractAmount,
        actualValue: recalculatedTotal,
        difference: variance,
        formulaText: grandTotalMeta?.formulaText ?? null,
        message: `Recalculated BOQ total (${recalculatedTotal.toFixed(roundingDecimals)}) differs from Official Awarded Contract Amount (${officialAwardedContractAmount.toFixed(roundingDecimals)}) by ${variance.toFixed(roundingDecimals)}.`,
      });
    }
  }

  const calculationHasErrors = discrepancies.some((d) =>
    ['LINE_CALCULATION_MISMATCH', 'SUBTOTAL_MISMATCH', 'GRAND_TOTAL_MISMATCH', 'MISSING_PAYABLE_VALUE', 'CONTRACT_TOTAL_MISMATCH'].includes(d.code)
  );
  const formulaHasErrors = brokenFormulas > 0 || cachedValueMismatches > 0 || unsupportedFormulas > 0;

  let status: AwardedBoqReconciliationStatus;
  let headline: string;
  if (discrepancies.length > 0) {
    status = 'DISCREPANCY_FOUND';
    headline = `BOQ verification found ${discrepancies.length} ${discrepancies.length === 1 ? 'discrepancy' : 'discrepancies'} requiring attention.`;
  } else if (officialAwardedContractAmount === null) {
    status = 'CONTRACT_AMOUNT_REQUIRED';
    headline = MSG_CONTRACT_AMOUNT_REQUIRED;
  } else {
    status = 'VERIFIED_MATCH';
    headline = MSG_VERIFIED_MATCH;
  }

  return {
    status,
    headline,
    calculationCheck: calculationHasErrors ? 'FAIL' : 'PASS',
    formulaCheck: totalFormulasChecked === 0 ? 'NO_FORMULAS' : formulaHasErrors ? 'FAIL' : 'PASS',
    officialAwardedContractAmount,
    workbookStatedGrandTotal,
    recalculatedTotal,
    variance,
    roundingDecimals,
    counts: {
      totalRows: classifiedRows.length,
      payItems: payItemsCount,
      headingsAndNotes: headingsAndNotesCount,
      subtotals: subtotalsCount,
      grandTotals: grandTotalsCount,
      priceComponents: priceComponents.length,
      totalFormulasChecked,
      validFormulas,
      brokenFormulas,
      cachedValueMismatches,
      unsupportedFormulas,
      discrepancies: discrepancies.length,
    },
    priceComponents,
    discrepancies,
    classifiedRows,
  };
}

/**
 * Reconciles already-persisted L2 UboqExtractionCandidate rows (e.g. the 441 imported PGH candidates)
 * without overwriting the immutable source workbook or requiring re-upload.
 */
export function reconcileImportedAwardedBoqCandidates(
  candidates: ReadonlyArray<{
    readonly id: string;
    readonly sourceRowNumber: number | null;
    readonly sourceCellRef: string | null;
    readonly sheetOrPageRef?: string | null;
    readonly rawFormulaText: string | null;
    readonly mappedFields: Record<string, unknown>;
  }>,
  options?: {
    readonly officialAwardedContractAmount?: number | null;
    readonly roundingDecimals?: number;
    readonly persistedWorkbookSummary?: Partial<AwardedBoqVerificationReport> | null;
  }
): AwardedBoqVerificationReport {
  const roundingDecimals = options?.roundingDecimals ?? 2;
  const officialAwardedContractAmount =
    typeof options?.officialAwardedContractAmount === 'number' &&
    Number.isFinite(options.officialAwardedContractAmount) &&
    options.officialAwardedContractAmount > 0
      ? roundCurrency(options.officialAwardedContractAmount, roundingDecimals)
      : null;

  const discrepancies: AwardedBoqDiscrepancy[] = [];
  const classifiedRows: ClassifiedAwardedBoqRow[] = [];
  const priceComponents: AwardedBoqPriceComponent[] = [];

  let payItems = 0;
  let headingsAndNotes = 0;
  let subtotals = 0;
  let grandTotals = 0;
  let totalFormulasChecked = 0;
  let validFormulas = 0;
  let brokenFormulas = 0;
  let sumTotal = 0;

  for (const c of candidates) {
    const mf = c.mappedFields ?? {};
    const itemCode = String(mf.item_code ?? '').trim() || null;
    const desc = String(mf.work_description ?? mf.description ?? '').trim();
    const unit = String(mf.unit ?? mf.uom ?? '').trim() || null;
    const qty = parseNumericStrictOrNull(mf.approved_qty ?? mf.quantity);
    const unitPrice = parseNumericStrictOrNull(mf.contract_unit_rate ?? mf.unit_price);
    const directCost = parseNumericStrictOrNull(mf.estimated_direct_cost ?? mf.agency_edc_amt);
    const indirectCost = parseNumericStrictOrNull(mf.estimated_indirect_cost);
    const lineAmount = parseNumericStrictOrNull(mf.contract_line_amount ?? mf.amount);
    const worksheet = String(c.sheetOrPageRef || (c.sourceCellRef?.split('!')[0] ?? 'BOQ')).trim();
    const cellRef = c.sourceCellRef || `${worksheet}!R${c.sourceRowNumber ?? 0}`;

    const hasFormula = Boolean(c.rawFormulaText && c.rawFormulaText.trim() !== '' && c.rawFormulaText !== '{}');
    if (hasFormula) {
      totalFormulasChecked++;
      if (/#(REF!|VALUE!|DIV\/0!|NAME\?|N\/A|NUM!|NULL!)/i.test(c.rawFormulaText || '')) {
        brokenFormulas++;
        discrepancies.push({
          code: 'FORMULA_ERROR_VALUE',
          severity: 'BLOCKING',
          item: itemCode ? `${itemCode} — ${desc}` : desc || cellRef,
          worksheet,
          cellRef,
          expectedValue: 'Valid formula',
          actualValue: c.rawFormulaText,
          difference: null,
          formulaText: c.rawFormulaText,
          message: `Broken formula error detected at ${cellRef}.`,
        });
      } else {
        validFormulas++;
      }
    }

    const storedClassification =
      typeof mf._rowClassification === 'string'
        ? (mf._rowClassification as AwardedBoqRowClassification)
        : null;
    const classification =
      storedClassification ??
      classifyAwardedBoqRow({
        itemCode,
        description: desc,
        unit,
        quantity: qty,
        unitPrice,
        lineAmount,
        rawTextValues: [itemCode ?? '', desc, unit ?? ''].filter(Boolean),
        hasFormula,
      });

    let rowHasDiscrepancy = false;
    let recalc: number | null = lineAmount;

    if (classification === 'HEADER_META' || classification === 'HEADING' || classification === 'SUBHEADING' || classification === 'NOTE') {
      headingsAndNotes++;
    } else if (classification === 'SUBTOTAL') {
      subtotals++;
    } else if (classification === 'GRAND_TOTAL') {
      grandTotals++;
    } else if (classification === 'PRICE_COMPONENT') {
      if (lineAmount !== null) {
        sumTotal = roundCurrency(sumTotal + lineAmount, roundingDecimals);
        priceComponents.push({ label: desc, worksheet, cellRef, amount: lineAmount, formulaText: c.rawFormulaText });
      }
    } else if (classification === 'PAY_ITEM') {
      payItems++;
      const itemLabel = itemCode ? `${itemCode} — ${desc}` : desc || cellRef;
      if (qty !== null && unitPrice !== null) {
        const expectedProduct = roundCurrency(qty * unitPrice, roundingDecimals);
        if (directCost !== null && lineAmount !== null && indirectCost !== null) {
          const directDiff = roundCurrency(directCost - expectedProduct, roundingDecimals);
          const expectedTotal = roundCurrency(expectedProduct + indirectCost, roundingDecimals);
          const totalDiff = roundCurrency(lineAmount - expectedTotal, roundingDecimals);
          recalc = expectedTotal;
          if (Math.abs(directDiff) > 0 || Math.abs(totalDiff) > 0) {
            rowHasDiscrepancy = true;
            discrepancies.push({
              code: 'LINE_CALCULATION_MISMATCH',
              severity: 'BLOCKING',
              item: itemLabel,
              worksheet,
              cellRef,
              expectedValue: expectedTotal,
              actualValue: roundCurrency(lineAmount, roundingDecimals),
              difference: totalDiff,
              formulaText: c.rawFormulaText,
              message: `Calculation mismatch on "${itemLabel}": expected ${expectedTotal.toFixed(roundingDecimals)}, found ${lineAmount.toFixed(roundingDecimals)}.`,
            });
          }
        } else if (lineAmount !== null) {
          // If lineAmount exceeds qty*unitPrice because of an unmapped DPWH indirect-cost/VAT column AND has a preserved formula,
          // check whether workbook-level summary already validated it; otherwise verify exact Qty*UnitPrice = LineAmount.
          const diff = roundCurrency(lineAmount - expectedProduct, roundingDecimals);
          const hasPreservedDpwhFormula =
            hasFormula && /contract_line_amount/i.test(c.rawFormulaText || '') && /[+]/.test(c.rawFormulaText || '');
          if (Math.abs(diff) > 0 && !hasPreservedDpwhFormula) {
            rowHasDiscrepancy = true;
            recalc = expectedProduct;
            discrepancies.push({
              code: 'LINE_CALCULATION_MISMATCH',
              severity: 'BLOCKING',
              item: itemLabel,
              worksheet,
              cellRef,
              expectedValue: expectedProduct,
              actualValue: roundCurrency(lineAmount, roundingDecimals),
              difference: diff,
              formulaText: c.rawFormulaText,
              message: `Line amount mismatch on "${itemLabel}": Qty (${qty}) × Unit Price (${unitPrice}) = ${expectedProduct.toFixed(roundingDecimals)}, found ${lineAmount.toFixed(roundingDecimals)}.`,
            });
          } else {
            recalc = roundCurrency(lineAmount, roundingDecimals);
          }
        } else {
          recalc = expectedProduct;
        }
      } else if ((qty !== null || unitPrice !== null) && lineAmount === null) {
        rowHasDiscrepancy = true;
        discrepancies.push({
          code: 'MISSING_PAYABLE_VALUE',
          severity: 'BLOCKING',
          item: itemLabel,
          worksheet,
          cellRef,
          expectedValue: 'Complete quantity, unit price, and amount',
          actualValue: qty === null ? 'Missing quantity' : 'Missing unit price/amount',
          difference: null,
          formulaText: c.rawFormulaText,
          message: `Payable item "${itemLabel}" at ${cellRef} is missing a value needed to compute its total.`,
        });
      }

      if (recalc !== null) {
        sumTotal = roundCurrency(sumTotal + recalc, roundingDecimals);
      }
    }

    classifiedRows.push({
      worksheet,
      rowNumber: c.sourceRowNumber ?? 0,
      classification,
      itemCode,
      description: desc || cellRef,
      unit,
      quantity: qty,
      unitPrice,
      directCost,
      indirectCost,
      lineAmount,
      recalculatedAmount: recalc,
      formulaText: c.rawFormulaText,
      cellRef,
      hasDiscrepancy: rowHasDiscrepancy,
    });
  }

  // Merge any persisted workbook-level formula/subtotal verification results if present
  const persisted = options?.persistedWorkbookSummary ?? null;
  if (persisted?.discrepancies && persisted.discrepancies.length > 0) {
    for (const d of persisted.discrepancies) {
      if (d.code !== 'CONTRACT_TOTAL_MISMATCH' && !discrepancies.some((e) => e.cellRef === d.cellRef && e.code === d.code)) {
        discrepancies.push(d);
      }
    }
  }

  const recalculatedTotal =
    typeof persisted?.recalculatedTotal === 'number' && Number.isFinite(persisted.recalculatedTotal) && persisted.recalculatedTotal > 0
      ? roundCurrency(persisted.recalculatedTotal, roundingDecimals)
      : sumTotal;

  let variance: number | null = null;
  if (officialAwardedContractAmount !== null) {
    variance = roundCurrency(recalculatedTotal - officialAwardedContractAmount, roundingDecimals);
    if (Math.abs(variance) > 0) {
      discrepancies.push({
        code: 'CONTRACT_TOTAL_MISMATCH',
        severity: 'BLOCKING',
        item: 'Awarded Contract Reconciliation',
        worksheet: classifiedRows[0]?.worksheet ?? 'BOQ',
        cellRef: 'GRAND_TOTAL',
        expectedValue: officialAwardedContractAmount,
        actualValue: recalculatedTotal,
        difference: variance,
        formulaText: null,
        message: `Recalculated BOQ total (${recalculatedTotal.toFixed(roundingDecimals)}) differs from Official Awarded Contract Amount (${officialAwardedContractAmount.toFixed(roundingDecimals)}) by ${variance.toFixed(roundingDecimals)}.`,
      });
    }
  }

  const calcFail = discrepancies.some((d) =>
    ['LINE_CALCULATION_MISMATCH', 'SUBTOTAL_MISMATCH', 'GRAND_TOTAL_MISMATCH', 'MISSING_PAYABLE_VALUE', 'CONTRACT_TOTAL_MISMATCH'].includes(d.code)
  );
  const formulaFail =
    brokenFormulas > 0 ||
    (persisted?.counts?.brokenFormulas ?? 0) > 0 ||
    (persisted?.counts?.cachedValueMismatches ?? 0) > 0 ||
    (persisted?.counts?.unsupportedFormulas ?? 0) > 0;
  const effectiveFormulaCount = Math.max(totalFormulasChecked, persisted?.counts?.totalFormulasChecked ?? 0);

  let status: AwardedBoqReconciliationStatus;
  let headline: string;
  if (discrepancies.length > 0) {
    status = 'DISCREPANCY_FOUND';
    headline = `BOQ verification found ${discrepancies.length} ${discrepancies.length === 1 ? 'discrepancy' : 'discrepancies'} requiring attention.`;
  } else if (officialAwardedContractAmount === null) {
    status = 'CONTRACT_AMOUNT_REQUIRED';
    headline = MSG_CONTRACT_AMOUNT_REQUIRED;
  } else {
    status = 'VERIFIED_MATCH';
    headline = MSG_VERIFIED_MATCH;
  }

  return {
    status,
    headline,
    calculationCheck: calcFail ? 'FAIL' : 'PASS',
    formulaCheck: effectiveFormulaCount === 0 ? 'NO_FORMULAS' : formulaFail ? 'FAIL' : 'PASS',
    officialAwardedContractAmount,
    workbookStatedGrandTotal: persisted?.workbookStatedGrandTotal ?? null,
    recalculatedTotal,
    variance,
    roundingDecimals,
    counts: {
      totalRows: classifiedRows.length,
      payItems,
      headingsAndNotes,
      subtotals,
      grandTotals,
      priceComponents: priceComponents.length,
      totalFormulasChecked: effectiveFormulaCount,
      validFormulas: Math.max(validFormulas, persisted?.counts?.validFormulas ?? 0),
      brokenFormulas: brokenFormulas + (persisted?.counts?.brokenFormulas ?? 0),
      cachedValueMismatches: persisted?.counts?.cachedValueMismatches ?? 0,
      unsupportedFormulas: persisted?.counts?.unsupportedFormulas ?? 0,
      discrepancies: discrepancies.length,
    },
    priceComponents,
    discrepancies,
    classifiedRows,
  };
}

// Re-export helpers for targeted tests
export { colLettersToNumber, colNumberToLetters };
