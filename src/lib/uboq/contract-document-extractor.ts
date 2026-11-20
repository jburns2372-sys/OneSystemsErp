/**
 * Contract Document Content Extraction & Cross-Document Reconciliation Engine
 * (Remediation for P9-GAP-CONTRACT-DOC-EXTRACT-01).
 *
 * Extracts structured contract information directly from actual document text
 * (PDF native pages, raster OCR scans, DOCX, plain text) — NEVER from filenames alone.
 *
 * Strict Governance Rules:
 *  - Preserves page number, field evidence snippet, confidence, and immutable document identity.
 *  - Detects unsigned, draft, simulated, sample, and test-only documents and NEVER elevates
 *    them to legally authoritative live contracts (`canAuthorizeLiveContract: false`).
 *  - Never invents missing values (`null` when not present in source text).
 *  - Automatically reconciles extracted fields across Notice of Award (NOA), Notice to Proceed (NTP),
 *    Contract Agreement, and Awarded BOQ, reporting genuine conflicts clearly.
 */

export type ContractDocumentKind =
  | 'NOTICE_OF_AWARD'
  | 'NOTICE_TO_PROCEED'
  | 'CONTRACT_AGREEMENT'
  | 'AWARDED_BOQ'
  | 'SUPPORTING_DOCUMENT'
  | 'UNKNOWN';

export type ContractAuthorityStatus =
  | 'TEST_ONLY_UNSIGNED'
  | 'UNSIGNED_DRAFT'
  | 'SIGNED_CANDIDATE'
  | 'UNVERIFIED';

export type ContractPricingBasis = 'EX_VAT' | 'INCL_VAT' | 'UNSPECIFIED';

export interface ContractTextPage {
  readonly pageNumber: number;
  readonly text: string;
  readonly confidence?: number;
  readonly extractionMethod: 'NATIVE_PDF' | 'OCR_RASTER' | 'DOCX_TEXT' | 'PLAIN_TEXT';
}

export interface ExtractedContractField<T> {
  readonly value: T;
  readonly rawText: string;
  readonly pageNumber: number;
  readonly snippet: string;
  readonly confidence: number;
  readonly sourceLabel: string | null;
}

export interface ExtractedContractDocument {
  readonly sourceDocumentId?: string | null;
  readonly sourceSha256?: string | null;
  readonly fileName: string;
  readonly detectedKind: ContractDocumentKind;
  readonly detectedKindConfidence: number;
  readonly detectedKindReasons: ReadonlyArray<string>;
  readonly authorityStatus: ContractAuthorityStatus;
  readonly isTestOnly: boolean;
  readonly isUnsigned: boolean;
  readonly canAuthorizeLiveContract: boolean;
  readonly authorityReasons: ReadonlyArray<string>;
  readonly extractionMethod: ContractTextPage['extractionMethod'];
  readonly pageCount: number;
  readonly fields: {
    readonly projectName: ExtractedContractField<string> | null;
    readonly projectReference: ExtractedContractField<string> | null;
    readonly clientName: ExtractedContractField<string> | null;
    readonly awardedContractor: ExtractedContractField<string> | null;
    readonly contractReference: ExtractedContractField<string> | null;
    readonly noticeOfAwardRef: ExtractedContractField<string> | null;
    readonly noticeToProceedRef: ExtractedContractField<string> | null;
    readonly awardedAmount: ExtractedContractField<number> | null;
    readonly currency: string | null;
    readonly pricingBasis: ContractPricingBasis;
    readonly awardDate: ExtractedContractField<string> | null;
    readonly commencementDate: ExtractedContractField<string> | null;
    readonly contractDurationDays: ExtractedContractField<number> | null;
    readonly durationInclusive: boolean | null;
    readonly completionDate: ExtractedContractField<string> | null;
  };
}

export type CrossDocumentConflictCode =
  | 'CONTRACT_AMOUNT_CONFLICT'
  | 'BOQ_CONTRACT_AMOUNT_MISMATCH'
  | 'CONTRACT_REF_CONFLICT'
  | 'NOA_REF_CONFLICT'
  | 'NTP_REF_CONFLICT'
  | 'PROJECT_REF_CONFLICT'
  | 'CLIENT_CONFLICT'
  | 'CONTRACTOR_CONFLICT'
  | 'COMMENCEMENT_DATE_CONFLICT'
  | 'COMPLETION_DATE_CONFLICT'
  | 'DURATION_CONFLICT'
  | 'SCHEDULE_DATE_DURATION_MISMATCH'
  | 'OCR_REFERENCE_CHECK'
  | 'NON_AUTHORITATIVE_TEST_DOCUMENT';

export interface CrossDocumentDiscrepancy {
  readonly code: CrossDocumentConflictCode;
  readonly severity: 'BLOCKING' | 'WARNING' | 'INFO';
  readonly field: string;
  readonly message: string;
  readonly sources: ReadonlyArray<{
    readonly fileName: string;
    readonly detectedKind: ContractDocumentKind;
    readonly value: string | number | null;
    readonly pageNumber: number | null;
  }>;
}

export interface CrossDocumentReconciliationReport {
  readonly status: 'RECONCILED' | 'CONFLICT_FOUND' | 'TEST_ONLY_RECONCILED' | 'INCOMPLETE';
  readonly headline: string;
  readonly canAuthorizeLiveContract: boolean;
  readonly hasTestOnlyOrUnsignedDocuments: boolean;
  readonly documentsAnalyzed: number;
  readonly consensus: {
    readonly projectName: string | null;
    readonly projectReference: string | null;
    readonly clientName: string | null;
    readonly awardedContractor: string | null;
    readonly contractReference: string | null;
    readonly noticeOfAwardRef: string | null;
    readonly noticeToProceedRef: string | null;
    readonly awardedAmount: number | null;
    readonly currency: string | null;
    readonly pricingBasis: ContractPricingBasis;
    readonly awardDate: string | null;
    readonly commencementDate: string | null;
    readonly contractDurationDays: number | null;
    readonly completionDate: string | null;
  };
  readonly boqReconciliation: {
    readonly boqRecalculatedTotal: number | null;
    readonly contractAwardedAmount: number | null;
    readonly variance: number | null;
    readonly matches: boolean | null;
  };
  readonly missingFields: ReadonlyArray<string>;
  readonly discrepancies: ReadonlyArray<CrossDocumentDiscrepancy>;
  readonly documents: ReadonlyArray<ExtractedContractDocument>;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

function clampConfidence(v: number): number {
  return Number(Math.max(0.1, Math.min(0.99, v)).toFixed(4));
}

function normalizeWhitespace(s: string): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function makeSnippet(line: string, maxLen = 160): string {
  const clean = normalizeWhitespace(line);
  return clean.length <= maxLen ? clean : `${clean.slice(0, maxLen - 1)}…`;
}

/**
 * Parses common contract date formats into ISO YYYY-MM-DD:
 * - "23 November 2026" / "23 Nov 2026"
 * - "November 23, 2026" / "Nov 23, 2026"
 * - "2026-11-23" / "2026/11/23"
 */
export function parseContractDateToIso(raw: string): string | null {
  const s = normalizeWhitespace(raw);
  if (!s) return null;

  // ISO YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = /\b(20\d{2}|19\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/.exec(s);
  if (isoMatch) {
    const y = Number(isoMatch[1]);
    const m = Number(isoMatch[2]);
    const d = Number(isoMatch[3]);
    return formatIsoDate(y, m, d);
  }

  // DD Month YYYY (e.g., "23 November 2026", "11 January 2027")
  const dmyMatch = /\b(0?[1-9]|[12]\d|3[01])\s+([A-Za-z]{3,9})\.?,?\s+(20\d{2}|19\d{2})\b/.exec(s);
  if (dmyMatch) {
    const d = Number(dmyMatch[1]);
    const m = MONTHS[dmyMatch[2].toLowerCase()];
    const y = Number(dmyMatch[3]);
    if (m) return formatIsoDate(y, m, d);
  }

  // Month DD, YYYY (e.g., "November 23, 2026")
  const mdyMatch = /\b([A-Za-z]{3,9})\.?\s+(0?[1-9]|[12]\d|3[01]),?\s+(20\d{2}|19\d{2})\b/.exec(s);
  if (mdyMatch) {
    const m = MONTHS[mdyMatch[1].toLowerCase()];
    const d = Number(mdyMatch[2]);
    const y = Number(mdyMatch[3]);
    if (m) return formatIsoDate(y, m, d);
  }

  return null;
}

function formatIsoDate(year: number, month: number, day: number): string | null {
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function addDaysIso(isoDate: string, days: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  dt.setUTCDate(dt.getUTCDate() + days);
  return formatIsoDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
}

/**
 * Parses currency amount strings, tolerating OCR currency-symbol noise (₱ / Php / PHP / P / $ / £).
 */
function parseMoneyAmount(raw: string): number | null {
  const s = normalizeWhitespace(raw);
  // Match a currency-like number with decimals or thousands separators (>= 3 digits)
  const m = /(?:₱|PHP|Php|PhP|P(?=\s?\d)|\$|£|€)?\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?|[0-9]{4,}(?:\.[0-9]{1,2})?)/.exec(s);
  if (!m) return null;
  const num = Number(m[1].replace(/,/g, ''));
  return Number.isFinite(num) && num > 0 ? Math.round(num * 100) / 100 : null;
}

interface PageLine {
  readonly pageNumber: number;
  readonly line: string;
  readonly confidence: number;
}

function splitPagesToLines(pages: ReadonlyArray<ContractTextPage>): PageLine[] {
  const out: PageLine[] = [];
  for (const p of pages) {
    const conf = typeof p.confidence === 'number' && Number.isFinite(p.confidence) ? p.confidence : 0.96;
    const rawLines = String(p.text ?? '').split(/\r?\n/);
    for (const raw of rawLines) {
      const cleaned = normalizeWhitespace(raw);
      if (cleaned) {
        out.push({ pageNumber: p.pageNumber, line: cleaned, confidence: conf });
      }
    }
  }
  return out;
}

function detectDocumentKindFromContent(fullText: string): {
  kind: ContractDocumentKind;
  confidence: number;
  reasons: string[];
} {
  const scores: Record<ContractDocumentKind, { score: number; reasons: string[] }> = {
    NOTICE_OF_AWARD: { score: 0, reasons: [] },
    NOTICE_TO_PROCEED: { score: 0, reasons: [] },
    CONTRACT_AGREEMENT: { score: 0, reasons: [] },
    AWARDED_BOQ: { score: 0, reasons: [] },
    SUPPORTING_DOCUMENT: { score: 0, reasons: [] },
    UNKNOWN: { score: 0, reasons: [] },
  };

  const add = (kind: ContractDocumentKind, pts: number, reason: string) => {
    scores[kind].score += pts;
    scores[kind].reasons.push(reason);
  };

  if (/\bCONTRACT\s+AGREEMENT\b/i.test(fullText) && /\bAGREEMENT\s+AND\s+PARTIES\b|\bCONTRACT\s+TERMS\s+AND\s+CONDITIONS\b|\bContract\s+Agreement\s+Ref\b/i.test(fullText)) {
    add('CONTRACT_AGREEMENT', 6, 'Contains Contract Agreement header and agreement/terms sections');
  } else if (/^\s*CONTRACT\s+AGREEMENT\b/im.test(fullText)) {
    add('CONTRACT_AGREEMENT', 4, 'Contains Contract Agreement title');
  }

  if (/\bSUBJECT:\s*Notice\s+of\s+Award\b|\bTEST\s+AWARD\s+PARTICULARS\b|\bAWARD\s+PARTICULARS\b|\bSimulated\s+award\s+notice\b/i.test(fullText)) {
    add('NOTICE_OF_AWARD', 6, 'Contains Notice of Award subject/award particulars');
  } else if (/\bReference\s+No\.?\s*[|:]?\s*NOA[-_A-Z0-9]+/i.test(fullText)) {
    add('NOTICE_OF_AWARD', 5, 'Primary Reference No. is an NOA identifier');
  } else if (/^\s*NOTICE\s+OF\s+AWARD\b/im.test(fullText)) {
    add('NOTICE_OF_AWARD', 4, 'Contains Notice of Award heading');
  }

  if (/\bCOMMENCEMENT\s+PARTICULARS\b|\bAuthorized\s+Start\s+Date\b|\bgiven\s+this\s+(?:dummy\s+)?Notice\s+to\s+Proceed\b|\bSimulated\s+commencement\s+authorization\b/i.test(fullText)) {
    add('NOTICE_TO_PROCEED', 6, 'Contains Notice to Proceed commencement particulars');
  } else if (/\bReference\s+No\.?\s*[|:]?\s*NTP[-_A-Z0-9]+/i.test(fullText)) {
    add('NOTICE_TO_PROCEED', 5, 'Primary Reference No. is an NTP identifier');
  } else if (/^\s*NOTICE\s+TO\s+PROCEED\b/im.test(fullText)) {
    add('NOTICE_TO_PROCEED', 4, 'Contains Notice to Proceed heading');
  }

  if (/\bBILL\s+OF\s+QUANTITIES\b/i.test(fullText) && scores.CONTRACT_AGREEMENT.score === 0) {
    add('AWARDED_BOQ', 4, 'Contains Bill of Quantities heading');
  }

  const ranked = (Object.keys(scores) as ContractDocumentKind[])
    .filter((k) => k !== 'UNKNOWN')
    .sort((a, b) => scores[b].score - scores[a].score);

  const top = ranked[0];
  if (!top || scores[top].score === 0) {
    return { kind: 'UNKNOWN', confidence: 0.3, reasons: ['No clear contract/notice content heading detected'] };
  }
  const conf = clampConfidence(0.6 + Math.min(0.38, scores[top].score * 0.06));
  return { kind: top, confidence: conf, reasons: scores[top].reasons };
}

function detectAuthorityStatus(fullText: string): {
  authorityStatus: ContractAuthorityStatus;
  isTestOnly: boolean;
  isUnsigned: boolean;
  canAuthorizeLiveContract: boolean;
  authorityReasons: string[];
} {
  const testOnlyMatches: string[] = [];
  const unsignedMatches: string[] = [];

  const testPatterns: ReadonlyArray<readonly [RegExp, string]> = [
    [/\bDEMO[_\s-]?ONLY\b/i, 'Marked DEMO_ONLY'],
    [/\bSAMPLE\s*\/\s*TEST\s+ONLY\b|\bTEST[\s-]ONLY\b|\bFOR\s+INTERNAL\s+SYSTEM\s+TESTING\s+ONLY\b/i, 'Marked SAMPLE / TEST ONLY'],
    [/\bSIMULATED\s+(?:DOCUMENT|PROJECT\s+OWNER|CONSTRUCTION\s+CONTRACT|EXECUTION\s+BLOCK|AWARD|COMMENCEMENT)\b/i, 'Explicitly marked SIMULATED'],
    [/\bNO\s+ACTUAL\s+PROCUREMENT\s+AUTHORITY\b|\bNOT\s+A\s+VALID\s+AWARD\b|\bNOT\s+SIGNED\s+OR\s+ENFORCEABLE\b/i, 'Disclaims procurement / legal authority'],
    [/\bTEST\s+FIXTURE\b|\bSYNTHETIC\s+TEST\s+RECORD\b|\bDUMMY\s+NOTICE\b/i, 'Identified as synthetic test fixture'],
  ];

  const unsignedPatterns: ReadonlyArray<readonly [RegExp, string]> = [
    [/\bUNSIGNED\b/i, 'Explicitly marked UNSIGNED'],
    [/\bNO\s+SIGNATURE\s+AFFIXED\b|\bNO\s+ACTUAL\s+SIGNATURES\b/i, 'No signature affixed'],
    [/\bFOR\s+DRAFT\s+ONLY\b|\bDRAFT\s+CONTRACT\b/i, 'Marked as DRAFT'],
  ];

  for (const [rx, label] of testPatterns) {
    if (rx.test(fullText)) testOnlyMatches.push(label);
  }
  for (const [rx, label] of unsignedPatterns) {
    if (rx.test(fullText)) unsignedMatches.push(label);
  }

  const isTestOnly = testOnlyMatches.length > 0;
  const isUnsigned = unsignedMatches.length > 0;
  const authorityReasons = [...testOnlyMatches, ...unsignedMatches];

  if (isTestOnly) {
    return {
      authorityStatus: 'TEST_ONLY_UNSIGNED',
      isTestOnly: true,
      isUnsigned: true,
      canAuthorizeLiveContract: false,
      authorityReasons,
    };
  }
  if (isUnsigned) {
    return {
      authorityStatus: 'UNSIGNED_DRAFT',
      isTestOnly: false,
      isUnsigned: true,
      canAuthorizeLiveContract: false,
      authorityReasons,
    };
  }

  const hasSignatureCue = /\bSIGNED\s+BY\b|\bCONFORME\b|\bIN\s+WITNESS\s+WHEREOF\b|\bEXECUTED\s+ON\b/i.test(fullText);
  return {
    authorityStatus: hasSignatureCue ? 'SIGNED_CANDIDATE' : 'UNVERIFIED',
    isTestOnly: false,
    isUnsigned: false,
    canAuthorizeLiveContract: false, // Human/authorized verification still required; never auto-activate live commitments
    authorityReasons: hasSignatureCue
      ? ['Contains execution/signature language — requires authorized reviewer confirmation']
      : ['Signature / execution authority could not be verified automatically from document text'],
  };
}

function findLabeledValue(
  lines: ReadonlyArray<PageLine>,
  labelPatterns: ReadonlyArray<readonly [RegExp, string]>,
  options?: {
    readonly skipLineIf?: RegExp;
    readonly valueCleaner?: (rawVal: string) => string | null;
  }
): ExtractedContractField<string> | null {
  for (const pl of lines) {
    if (options?.skipLineIf && options.skipLineIf.test(pl.line)) continue;
    for (const [rx, sourceLabel] of labelPatterns) {
      const m = rx.exec(pl.line);
      if (!m) continue;
      const candidate = normalizeWhitespace(m[1] ?? '');
      if (!candidate) continue;
      const cleaned = options?.valueCleaner ? options.valueCleaner(candidate) : candidate;
      if (!cleaned) continue;
      return {
        value: cleaned,
        rawText: candidate,
        pageNumber: pl.pageNumber,
        snippet: makeSnippet(pl.line),
        confidence: clampConfidence(pl.confidence),
        sourceLabel,
      };
    }
  }
  return null;
}

function cleanEntityText(raw: string): string | null {
  const s = normalizeWhitespace(raw)
    .replace(/^[|:\-–—\s]+/, '')
    .replace(/\s*\|.*$/, '')
    .replace(/\s*\((?:SIMULATED[^)]*|THE\s+"[^"]+")\)\s*$/i, '')
    .trim();
  if (s.length < 2) return null;
  return s;
}

function cleanRefToken(raw: string): string | null {
  const s = normalizeWhitespace(raw)
    .replace(/^[|:\s]+/, '')
    .replace(/\s*\|.*$/, '')
    .trim();
  const m = /^([A-Za-z0-9][A-Za-z0-9/_-]{2,60}(?:\s*\/\s*[A-Za-z0-9_-]{2,40})?)/.exec(s);
  return m ? normalizeWhitespace(m[1]) : null;
}

/**
 * Extracts structured contract details, authority status, and field-level provenance
 * directly from actual document page text.
 */
export function extractContractDocumentFromPages(
  fileName: string,
  pages: ReadonlyArray<ContractTextPage>,
  meta?: { sourceDocumentId?: string | null; sourceSha256?: string | null }
): ExtractedContractDocument {
  const lines = splitPagesToLines(pages);
  const fullText = pages.map((p) => p.text).join('\n');
  const kindInfo = detectDocumentKindFromContent(fullText);
  const authInfo = detectAuthorityStatus(fullText);
  const primaryMethod: ContractTextPage['extractionMethod'] = pages[0]?.extractionMethod ?? 'PLAIN_TEXT';

  // 1. Project Name
  const projectName = findLabeledValue(
    lines,
    [
      [/^Project\s+Name\s*[|:]?\s+(.+)$/i, 'Project Name'],
      [/^Contract\s+Name\s*[|:]?\s+(.+)$/i, 'Contract Name'],
      [/^SUBJECT\s*:\s*(?:Notice\s+of\s+Award|Notice\s+to\s+Proceed|Test\s+Commencement|Contract\s+Agreement)?\s*[-–—:]?\s*(.+)$/i, 'Subject'],
    ],
    {
      valueCleaner: (v) => {
        const cleaned = normalizeWhitespace(v).replace(/^[|:\-–—\s]+/, '').trim();
        return cleaned.length >= 3 ? cleaned : null;
      },
    }
  );

  // 2. Project & Contract ID / Reference
  const projectReference = findLabeledValue(
    lines,
    [
      [/^Project\s+(?:and|\/|&)\s+Contract\s+ID\s*[|:]?\s+(.+)$/i, 'Project / Contract ID'],
      [/^Project\s+(?:ID|Code|Ref(?:erence)?)\s*[|:]?\s+(.+)$/i, 'Project ID'],
      [/^Contract\s+ID\s*[|:]?\s+(.+)$/i, 'Contract ID'],
    ],
    { valueCleaner: cleanRefToken }
  );

  // 3. Client / Project Owner
  let clientName = findLabeledValue(
    lines,
    [
      [/^Project\s+Owner\s*\/\s*Client\s*[|:]?\s+(.+)$/i, 'Project Owner / Client'],
      [/^(?:Client|Project\s+Owner|Employer|Implementing\s+Office)\s*[|:]\s*(.+)$/i, 'Client / Owner'],
      [/^Owner\s*\/\s*Record\s+Status\s*[|:]?\s+([^|]+)/i, 'Owner'],
      [/^For\s+([A-Za-z][A-Za-z0-9 &.,'-]{2,80}?)(?:\s*\(Simulated\)|\s*\||\s*$)/i, 'Issuing Entity'],
    ],
    { valueCleaner: cleanEntityText }
  );
  // Fallback: top letterhead line above "PROJECT OWNER" / "CLIENT"
  if (!clientName && lines.length >= 2 && /PROJECT\s+OWNER|CLIENT/i.test(lines[1].line)) {
    const letterhead = cleanEntityText(lines[0].line);
    if (letterhead && !/^(NOTICE|CONTRACT|SAMPLE|DEMO)/i.test(letterhead)) {
      clientName = {
        value: letterhead,
        rawText: lines[0].line,
        pageNumber: lines[0].pageNumber,
        snippet: makeSnippet(lines[0].line),
        confidence: clampConfidence(lines[0].confidence * 0.92),
        sourceLabel: 'Document Letterhead',
      };
    }
  }

  // 4. Awarded Contractor
  const awardedContractor = findLabeledValue(
    lines,
    [
      [/^Awarded\s+Contractor\s*[|:]?\s+(.+)$/i, 'Awarded Contractor'],
      [/^Contractor\s*[|:]\s*(.+)$/i, 'Contractor'],
      [/^TO\s*:\s*(.+)$/i, 'Addressee (TO)'],
    ],
    {
      skipLineIf: /\bcontact\s+and\s+authorized\s+signatory\b/i,
      valueCleaner: cleanEntityText,
    }
  );

  // 5. References (Contract Agreement Ref, NOA Ref, NTP Ref)
  const genericRef = findLabeledValue(
    lines,
    [
      [/^Reference\s+No\.?\s*[|:]?\s+(.+)$/i, 'Reference No.'],
      [/^Ref\.?\s*No\.?\s*[|:]?\s+(.+)$/i, 'Ref No.'],
    ],
    { valueCleaner: cleanRefToken }
  );

  let contractReference = findLabeledValue(
    lines,
    [
      [/^Contract\s+Agreement\s+Ref(?:erence)?\s*[|:]?\s+(.+)$/i, 'Contract Agreement Ref'],
      [/^Contract\s+Agreement\s*[|:]\s*(.+)$/i, 'Contract Agreement'],
      [/^Contract\s+Agreement\s+([A-Z]{2,}[-_][A-Z0-9_-]+)/i, 'Contract Agreement'],
      [/^Contract\s+(?:Ref(?:erence)?|No\.?)\s*[|:]?\s+(.+)$/i, 'Contract Ref'],
    ],
    { valueCleaner: cleanRefToken }
  );
  if (!contractReference && genericRef && (kindInfo.kind === 'CONTRACT_AGREEMENT' || /^CA[-_]/i.test(genericRef.value))) {
    contractReference = genericRef;
  }

  let noticeOfAwardRef = findLabeledValue(
    lines,
    [
      [/^Notice\s+of\s+Award\s*[|:]\s*(.+)$/i, 'Notice of Award'],
      [/^Notice\s+of\s+Award\s+([A-Z]{2,}[-_][A-Z0-9_-]+)/i, 'Notice of Award'],
      [/\b(NOA[-_][A-Z0-9_-]{3,40})\b/i, 'Notice of Award Reference'],
    ],
    { valueCleaner: cleanRefToken }
  );
  if (genericRef && (kindInfo.kind === 'NOTICE_OF_AWARD' || /^NOA[-_]/i.test(genericRef.value))) {
    noticeOfAwardRef = genericRef;
  }

  let noticeToProceedRef = findLabeledValue(
    lines,
    [
      [/^Notice\s+to\s+Proceed\s*[|:]\s*(.+)$/i, 'Notice to Proceed'],
      [/^Notice\s+to\s+Proceed\s+([A-Z]{2,}[-_][A-Z0-9_-]+)/i, 'Notice to Proceed'],
      [/\b(NTP[-_][A-Z0-9_-]{3,40})\b/i, 'Notice to Proceed Reference'],
    ],
    { valueCleaner: cleanRefToken }
  );
  if (genericRef && (kindInfo.kind === 'NOTICE_TO_PROCEED' || /^NTP[-_]/i.test(genericRef.value))) {
    noticeToProceedRef = genericRef;
  }

  // 6. Awarded Contract Amount (strictly ignoring negative disclaimers / unverified ABC notes!)
  const NEGATIVE_AMOUNT_LINE = /\b(must\s+not\s+be\s+used|unverified\s+reference\s+estimate|approved\s+budget\s+for\s+the\s+contract|\babc\b|source-workbook\s+abc|not\s+be\s+substituted)\b/i;
  let awardedAmount: ExtractedContractField<number> | null = null;
  let pricingBasis: ContractPricingBasis = 'UNSPECIFIED';
  let currency: string | null = null;

  const amountPatterns: ReadonlyArray<readonly [RegExp, string]> = [
    [/^(?:Awarded\s+)?Contract\s+(?:Price|Amount|Sum|Value)(?:\s*\([^)]*\))?\s*[|:]?\s+(.+)$/i, 'Contract Price / Amount'],
    [/^(?:Total\s+)?Award\s+Amount(?:\s*\([^)]*\))?\s*[|:]?\s+(.+)$/i, 'Award Amount'],
    [/^(?:Total\s+)?Contract\s+Value\s*[|:]?\s+(.+)$/i, 'Contract Value'],
    [/\b(?:synthetic\s+total|sample\s+contract\s+value|contract\s+amount)\s+(?:is|remains|of)\s+(.+)$/i, 'Contract Value Clause'],
  ];

  for (const pl of lines) {
    if (NEGATIVE_AMOUNT_LINE.test(pl.line)) continue;
    for (const [rx, sourceLabel] of amountPatterns) {
      const m = rx.exec(pl.line);
      if (!m) continue;
      const val = parseMoneyAmount(m[1]);
      if (val === null) continue;
      awardedAmount = {
        value: val,
        rawText: normalizeWhitespace(m[1]),
        pageNumber: pl.pageNumber,
        snippet: makeSnippet(pl.line),
        confidence: clampConfidence(pl.confidence),
        sourceLabel,
      };
      if (/\b(EX[_\s-]?VAT|EXCLUDING\s+VAT|EXCLUSIVE\s+OF\s+VAT)\b/i.test(pl.line)) {
        pricingBasis = 'EX_VAT';
      } else if (/\b(INCL(?:USIVE)?[_\s-]?VAT|INCLUDING\s+VAT|VAT[\s-]INCLUSIVE)\b/i.test(pl.line)) {
        pricingBasis = 'INCL_VAT';
      }
      if (/₱|\bPHP\b|\bPhp\b|Philippine\s+pesos/i.test(pl.line) || /₱|\bPHP\b|Philippine\s+pesos/i.test(fullText)) {
        currency = 'PHP';
      }
      break;
    }
    if (awardedAmount) break;
  }

  // 7. Award / Agreement / Issue Date
  const awardDateRaw = findLabeledValue(
    lines,
    [
      [/^(?:Agreement|Award)\s+Date\s*[|:]?\s+(.+)$/i, 'Agreement / Award Date'],
      [/^Date\s+Issued\s*[|:]?\s+(.+)$/i, 'Date Issued'],
      [/^Date\s+of\s+Award\s*[|:]?\s+(.+)$/i, 'Date of Award'],
    ],
    { valueCleaner: (v) => parseContractDateToIso(v) }
  );

  // 8. Commencement / Authorized Start Date
  let commencementDate: ExtractedContractField<string> | null = findLabeledValue(
    lines,
    [
      [/^Authorized\s+Start\s+Date\s*[|:]?\s+(.+)$/i, 'Authorized Start Date'],
      [/^Commencement\s+Date\s*[|:]?\s+(.+)$/i, 'Commencement Date'],
      [/^Start\s+Date\s*[|:]?\s+(.+)$/i, 'Start Date'],
      [/^Commencement\s*\/\s*Duration\s*[|:]?\s+([^|]+)/i, 'Commencement / Duration'],
    ],
    { valueCleaner: (v) => parseContractDateToIso(v) }
  );
  if (!commencementDate) {
    // Handle multi-line prose like "specifies a test commencement of 23 November\n2026"
    for (const p of pages) {
      const m = /\bcommencement(?:\s+date)?\s+of\s+([0-9]{1,2}\s+[A-Za-z]{3,9}\s+20\d{2}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+20\d{2}|20\d{2}-\d{2}-\d{2})/i.exec(
        normalizeWhitespace(p.text)
      );
      if (m) {
        const iso = parseContractDateToIso(m[1]);
        if (iso) {
          commencementDate = {
            value: iso,
            rawText: m[1],
            pageNumber: p.pageNumber,
            snippet: makeSnippet(m[0]),
            confidence: clampConfidence((p.confidence ?? 0.96) * 0.95),
            sourceLabel: 'Commencement Clause',
          };
          break;
        }
      }
    }
  }

  // 9. Contract Duration (calendar days)
  let contractDurationDays: ExtractedContractField<number> | null = null;
  let durationInclusive: boolean | null = null;
  const durationPatterns: ReadonlyArray<readonly [RegExp, string]> = [
    [/^(?:Contract|Project)\s+(?:Period|Duration)\s*[|:]?\s+(.+)$/i, 'Contract Period / Duration'],
    [/^Commencement\s*\/\s*Duration\s*[|:]?\s+.+\|\s*(.+)$/i, 'Commencement / Duration'],
    [/\b(?:construction\s+period|contract\s+duration|contract\s+period)\s+is\s+([0-9]{1,4}\s+calendar\s+days[^.]*)/i, 'Duration Clause'],
  ];
  for (const pl of lines) {
    for (const [rx, sourceLabel] of durationPatterns) {
      const m = rx.exec(pl.line);
      if (!m) continue;
      const numMatch = /\b([0-9]{1,4})\s*(?:calendar\s+)?days?\b/i.exec(m[1]);
      if (!numMatch) continue;
      const days = Number(numMatch[1]);
      if (!Number.isFinite(days) || days <= 0) continue;
      contractDurationDays = {
        value: days,
        rawText: normalizeWhitespace(m[1]),
        pageNumber: pl.pageNumber,
        snippet: makeSnippet(pl.line),
        confidence: clampConfidence(pl.confidence),
        sourceLabel,
      };
      if (/\binclusive\b|\bincluding\s+the\s+start\s+date\b/i.test(pl.line)) {
        durationInclusive = true;
      }
      break;
    }
    if (contractDurationDays) break;
  }
  if (!contractDurationDays) {
    for (const p of pages) {
      const flat = normalizeWhitespace(p.text);
      const m = /\b(?:construction\s+period|contract\s+duration|contract\s+period)\s+is\s+([0-9]{1,4})\s+calendar\s+days(\s+inclusive[^.]*)?/i.exec(flat);
      if (m) {
        const days = Number(m[1]);
        if (Number.isFinite(days) && days > 0) {
          contractDurationDays = {
            value: days,
            rawText: m[0],
            pageNumber: p.pageNumber,
            snippet: makeSnippet(m[0]),
            confidence: clampConfidence((p.confidence ?? 0.96) * 0.95),
            sourceLabel: 'Duration Clause',
          };
          durationInclusive = Boolean(m[2] && /inclusive/i.test(m[2]));
          break;
        }
      }
    }
  }

  // 10. Completion / Target Completion Date
  let completionDate: ExtractedContractField<string> | null = findLabeledValue(
    lines,
    [
      [/^Target\s+Completion(?:\s+Date)?\s*[|:]?\s+(.+)$/i, 'Target Completion'],
      [/^Completion\s+Date\s*[|:]?\s+(.+)$/i, 'Completion Date'],
    ],
    { valueCleaner: (v) => parseContractDateToIso(v) }
  );
  if (!completionDate) {
    for (const p of pages) {
      const flat = normalizeWhitespace(p.text);
      const m = /\b(?:target\s+)?completion\s+date\s+of\s+([0-9]{1,2}\s+[A-Za-z]{3,9}\s+20\d{2}|[A-Za-z]{3,9}\s+[0-9]{1,2},?\s+20\d{2}|20\d{2}-\d{2}-\d{2})/i.exec(flat);
      if (m) {
        const iso = parseContractDateToIso(m[1]);
        if (iso) {
          completionDate = {
            value: iso,
            rawText: m[1],
            pageNumber: p.pageNumber,
            snippet: makeSnippet(m[0]),
            confidence: clampConfidence((p.confidence ?? 0.96) * 0.95),
            sourceLabel: 'Completion Clause',
          };
          break;
        }
      }
    }
  }

  return {
    sourceDocumentId: meta?.sourceDocumentId ?? null,
    sourceSha256: meta?.sourceSha256 ?? null,
    fileName,
    detectedKind: kindInfo.kind,
    detectedKindConfidence: kindInfo.confidence,
    detectedKindReasons: kindInfo.reasons,
    authorityStatus: authInfo.authorityStatus,
    isTestOnly: authInfo.isTestOnly,
    isUnsigned: authInfo.isUnsigned,
    canAuthorizeLiveContract: authInfo.canAuthorizeLiveContract,
    authorityReasons: authInfo.authorityReasons,
    extractionMethod: primaryMethod,
    pageCount: pages.length,
    fields: {
      projectName,
      projectReference,
      clientName,
      awardedContractor,
      contractReference,
      noticeOfAwardRef,
      noticeToProceedRef,
      awardedAmount,
      currency,
      pricingBasis,
      awardDate: awardDateRaw,
      commencementDate,
      contractDurationDays,
      durationInclusive,
      completionDate,
    },
  };
}

function normalizeComparableString(v: string): string {
  return normalizeWhitespace(v).toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Checks whether two identifier strings differ only by a single common OCR glyph insertion/substitution
 * (e.g., "CA-DEMO-001-20261119" vs "CA-DEMO0-001-20261119" from a scanned raster JPG).
 */
function isSingleCharOcrRefArtifact(a: string, b: string): boolean {
  const s1 = normalizeComparableString(a);
  const s2 = normalizeComparableString(b);
  if (s1 === s2) return false;
  if (Math.abs(s1.length - s2.length) > 1) return false;
  // Levenshtein distance <= 1 AND differing char is in OCR-confusable set {0, O, 1, I, L}
  let i = 0;
  let j = 0;
  let diffs = 0;
  let diffChar = '';
  while (i < s1.length && j < s2.length) {
    if (s1[i] === s2[j]) {
      i++;
      j++;
      continue;
    }
    diffs++;
    if (diffs > 1) return false;
    if (s1.length > s2.length) {
      diffChar = s1[i++];
    } else if (s2.length > s1.length) {
      diffChar = s2[j++];
    } else {
      diffChar = `${s1[i]}${s2[j]}`;
      i++;
      j++;
    }
  }
  if (i < s1.length) {
    diffs++;
    diffChar = s1[i];
  } else if (j < s2.length) {
    diffs++;
    diffChar = s2[j];
  }
  return diffs === 1 && /^[0O1IL]+$/.test(diffChar);
}

/**
 * Automatically reconciles extracted contract details across multiple uploaded documents
 * (e.g. Notice of Award, Notice to Proceed, Contract Agreement) and optionally compares
 * the extracted contract amount against the recalculated Awarded BOQ total.
 */
export function reconcileProjectContractDocuments(
  documents: ReadonlyArray<ExtractedContractDocument>,
  options?: {
    readonly boqRecalculatedTotal?: number | null;
  }
): CrossDocumentReconciliationReport {
  const discrepancies: CrossDocumentDiscrepancy[] = [];
  const hasTestOnlyOrUnsigned = documents.some((d) => d.isTestOnly || d.isUnsigned);

  if (hasTestOnlyOrUnsigned) {
    const flagged = documents.filter((d) => d.isTestOnly || d.isUnsigned);
    discrepancies.push({
      code: 'NON_AUTHORITATIVE_TEST_DOCUMENT',
      severity: 'INFO',
      field: 'authorityStatus',
      message: `${flagged.length} uploaded contract document(s) are marked unsigned or test-only (${flagged.map((d) => d.fileName).join(', ')}). Values are shown for verification only and cannot authorize live commercial commitments.`,
      sources: flagged.map((d) => ({
        fileName: d.fileName,
        detectedKind: d.detectedKind,
        value: d.authorityStatus,
        pageNumber: 1,
      })),
    });
  }

  // Helper to compare string fields across all documents that extracted them
  const pickAndCompareString = (
    fieldName: string,
    conflictCode: CrossDocumentConflictCode,
    getter: (d: ExtractedContractDocument) => ExtractedContractField<string> | null,
    isReferenceCode = false
  ): string | null => {
    const entries = documents
      .map((d) => ({ doc: d, field: getter(d) }))
      .filter((e): e is { doc: ExtractedContractDocument; field: ExtractedContractField<string> } => e.field !== null);

    if (entries.length === 0) return null;

    // Prefer NATIVE_PDF / higher-confidence source as canonical reference value
    const sorted = [...entries].sort((a, b) => {
      const aNative = a.doc.extractionMethod === 'NATIVE_PDF' ? 1 : 0;
      const bNative = b.doc.extractionMethod === 'NATIVE_PDF' ? 1 : 0;
      if (bNative !== aNative) return bNative - aNative;
      return b.field.confidence - a.field.confidence;
    });
    const canonical = sorted[0].field.value;
    const canonNorm = normalizeComparableString(canonical);

    const mismatches = entries.filter((e) => normalizeComparableString(e.field.value) !== canonNorm);
    if (mismatches.length > 0) {
      const allOcrArtifacts =
        isReferenceCode &&
        mismatches.every(
          (m) =>
            m.doc.extractionMethod === 'OCR_RASTER' &&
            isSingleCharOcrRefArtifact(canonical, m.field.value)
        );
      discrepancies.push({
        code: allOcrArtifacts ? 'OCR_REFERENCE_CHECK' : conflictCode,
        severity: allOcrArtifacts ? 'WARNING' : 'BLOCKING',
        field: fieldName,
        message: allOcrArtifacts
          ? `Possible single-character OCR read difference on ${fieldName}: "${mismatches[0].field.value}" (${mismatches[0].doc.fileName}) vs "${canonical}" (${sorted[0].doc.fileName}). Confirm scanned reference.`
          : `Conflicting ${fieldName} across uploaded documents: ${entries.map((e) => `"${e.field.value}" (${e.doc.fileName})`).join(' vs ')}.`,
        sources: entries.map((e) => ({
          fileName: e.doc.fileName,
          detectedKind: e.doc.detectedKind,
          value: e.field.value,
          pageNumber: e.field.pageNumber,
        })),
      });
    }
    return canonical;
  };

  const projectName = pickAndCompareString('Project Name', 'PROJECT_REF_CONFLICT', (d) => d.fields.projectName);
  const projectReference = pickAndCompareString('Project / Contract ID', 'PROJECT_REF_CONFLICT', (d) => d.fields.projectReference, true);
  const clientName = pickAndCompareString('Client / Owner', 'CLIENT_CONFLICT', (d) => d.fields.clientName);
  const awardedContractor = pickAndCompareString('Awarded Contractor', 'CONTRACTOR_CONFLICT', (d) => d.fields.awardedContractor);
  const contractReference = pickAndCompareString('Contract Reference', 'CONTRACT_REF_CONFLICT', (d) => d.fields.contractReference, true);
  const noticeOfAwardRef = pickAndCompareString('Notice of Award Ref', 'NOA_REF_CONFLICT', (d) => d.fields.noticeOfAwardRef, true);
  const noticeToProceedRef = pickAndCompareString('Notice to Proceed Ref', 'NTP_REF_CONFLICT', (d) => d.fields.noticeToProceedRef, true);
  const awardDate = pickAndCompareString('Award / Agreement Date', 'COMMENCEMENT_DATE_CONFLICT', (d) => d.fields.awardDate);
  const commencementDate = pickAndCompareString('Commencement Date', 'COMMENCEMENT_DATE_CONFLICT', (d) => d.fields.commencementDate);
  const completionDate = pickAndCompareString('Completion Date', 'COMPLETION_DATE_CONFLICT', (d) => d.fields.completionDate);

  // Compare Awarded Contract Amounts across documents
  const amountEntries = documents
    .map((d) => ({ doc: d, field: d.fields.awardedAmount }))
    .filter((e): e is { doc: ExtractedContractDocument; field: ExtractedContractField<number> } => e.field !== null);

  let consensusAmount: number | null = null;
  if (amountEntries.length > 0) {
    consensusAmount = amountEntries[0].field.value;
    const distinctAmounts = new Set(amountEntries.map((e) => e.field.value.toFixed(2)));
    if (distinctAmounts.size > 1) {
      discrepancies.push({
        code: 'CONTRACT_AMOUNT_CONFLICT',
        severity: 'BLOCKING',
        field: 'Awarded Amount',
        message: `Contradictory contract amounts found across uploaded documents: ${amountEntries
          .map((e) => `${e.field.value.toLocaleString('en-PH', { minimumFractionDigits: 2 })} (${e.doc.fileName})`)
          .join(' vs ')}.`,
        sources: amountEntries.map((e) => ({
          fileName: e.doc.fileName,
          detectedKind: e.doc.detectedKind,
          value: e.field.value,
          pageNumber: e.field.pageNumber,
        })),
      });
    }
  }

  // Compare Contract Duration across documents
  const durationEntries = documents
    .map((d) => ({ doc: d, field: d.fields.contractDurationDays }))
    .filter((e): e is { doc: ExtractedContractDocument; field: ExtractedContractField<number> } => e.field !== null);

  let consensusDuration: number | null = null;
  let consensusInclusive = false;
  if (durationEntries.length > 0) {
    consensusDuration = durationEntries[0].field.value;
    consensusInclusive = documents.some((d) => d.fields.durationInclusive === true);
    const distinctDurations = new Set(durationEntries.map((e) => e.field.value));
    if (distinctDurations.size > 1) {
      discrepancies.push({
        code: 'DURATION_CONFLICT',
        severity: 'BLOCKING',
        field: 'Contract Duration',
        message: `Conflicting contract durations across uploaded documents: ${durationEntries
          .map((e) => `${e.field.value} days (${e.doc.fileName})`)
          .join(' vs ')}.`,
        sources: durationEntries.map((e) => ({
          fileName: e.doc.fileName,
          detectedKind: e.doc.detectedKind,
          value: e.field.value,
          pageNumber: e.field.pageNumber,
        })),
      });
    }
  }

  // Verify Commencement Date + Duration === Completion Date (inclusive or exclusive)
  if (commencementDate && consensusDuration !== null && completionDate) {
    const expectedInclusive = addDaysIso(commencementDate, consensusDuration - 1);
    const expectedExclusive = addDaysIso(commencementDate, consensusDuration);
    const matchesSchedule = consensusInclusive
      ? completionDate === expectedInclusive
      : completionDate === expectedInclusive || completionDate === expectedExclusive;
    if (!matchesSchedule) {
      discrepancies.push({
        code: 'SCHEDULE_DATE_DURATION_MISMATCH',
        severity: 'BLOCKING',
        field: 'Schedule Dates',
        message: `Completion date (${completionDate}) does not match commencement (${commencementDate}) plus ${consensusDuration} calendar days (expected ${expectedInclusive ?? expectedExclusive}).`,
        sources: documents
          .filter((d) => d.fields.commencementDate || d.fields.completionDate || d.fields.contractDurationDays)
          .map((d) => ({
            fileName: d.fileName,
            detectedKind: d.detectedKind,
            value: `${d.fields.commencementDate?.value ?? '?'} + ${d.fields.contractDurationDays?.value ?? '?'}d -> ${d.fields.completionDate?.value ?? '?'}`,
            pageNumber: d.fields.commencementDate?.pageNumber ?? d.fields.completionDate?.pageNumber ?? null,
          })),
      });
    }
  }

  // Compare extracted contract amount with recalculated BOQ total when supplied
  const boqTotal =
    typeof options?.boqRecalculatedTotal === 'number' && Number.isFinite(options.boqRecalculatedTotal) && options.boqRecalculatedTotal > 0
      ? Math.round(options.boqRecalculatedTotal * 100) / 100
      : null;
  let boqVariance: number | null = null;
  let boqMatches: boolean | null = null;
  if (boqTotal !== null && consensusAmount !== null) {
    boqVariance = Math.round((boqTotal - consensusAmount) * 100) / 100;
    boqMatches = Math.abs(boqVariance) === 0;
    if (!boqMatches) {
      discrepancies.push({
        code: 'BOQ_CONTRACT_AMOUNT_MISMATCH',
        severity: 'BLOCKING',
        field: 'BOQ vs Contract Amount',
        message: `Recalculated BOQ total (${boqTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })}) does not match extracted contract amount (${consensusAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}); difference ${boqVariance.toFixed(2)}.`,
        sources: amountEntries.map((e) => ({
          fileName: e.doc.fileName,
          detectedKind: e.doc.detectedKind,
          value: e.field.value,
          pageNumber: e.field.pageNumber,
        })),
      });
    }
  }

  const missingFields: string[] = [];
  if (!clientName) missingFields.push('Client / Project Owner');
  if (!awardedContractor) missingFields.push('Awarded Contractor');
  if (!contractReference) missingFields.push('Contract Reference');
  if (consensusAmount === null) missingFields.push('Awarded Contract Amount');
  if (!commencementDate) missingFields.push('Commencement Date');
  if (consensusDuration === null) missingFields.push('Contract Duration');
  if (!completionDate) missingFields.push('Completion Date');

  const blockingConflicts = discrepancies.filter((d) => d.severity === 'BLOCKING');
  const currency = documents.find((d) => d.fields.currency)?.fields.currency ?? null;
  const pricingBasis: ContractPricingBasis =
    documents.find((d) => d.fields.pricingBasis !== 'UNSPECIFIED')?.fields.pricingBasis ?? 'UNSPECIFIED';

  let status: CrossDocumentReconciliationReport['status'];
  let headline: string;
  if (blockingConflicts.length > 0) {
    status = 'CONFLICT_FOUND';
    headline = `Cross-document check found ${blockingConflicts.length} conflicting contract detail(s) requiring review.`;
  } else if (documents.length === 0 || (consensusAmount === null && !contractReference && !noticeOfAwardRef && !noticeToProceedRef)) {
    status = 'INCOMPLETE';
    headline = 'Upload Notice of Award, Notice to Proceed, or Contract Agreement to reconcile contract details.';
  } else if (hasTestOnlyOrUnsigned) {
    status = 'TEST_ONLY_RECONCILED';
    headline = 'Simulated / Unsigned Test Documents Reconciled — Not Valid for Live Commercial Approval.';
  } else {
    status = 'RECONCILED';
    headline = 'Uploaded contract documents reconciled with no conflicting values.';
  }

  return {
    status,
    headline,
    canAuthorizeLiveContract: false,
    hasTestOnlyOrUnsignedDocuments: hasTestOnlyOrUnsigned,
    documentsAnalyzed: documents.length,
    consensus: {
      projectName,
      projectReference,
      clientName,
      awardedContractor,
      contractReference,
      noticeOfAwardRef,
      noticeToProceedRef,
      awardedAmount: consensusAmount,
      currency,
      pricingBasis,
      awardDate,
      commencementDate,
      contractDurationDays: consensusDuration,
      completionDate,
    },
    boqReconciliation: {
      boqRecalculatedTotal: boqTotal,
      contractAwardedAmount: consensusAmount,
      variance: boqVariance,
      matches: boqMatches,
    },
    missingFields,
    discrepancies,
    documents,
  };
}
