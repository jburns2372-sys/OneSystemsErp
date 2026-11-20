/**
 * Mandatory Project-Relevance Filtering Engine.
 *
 * Ensures ONLY documents, worksheets, and extracted fields relevant to the SELECTED PROJECT
 * can populate its records or ERP modules.
 *
 * Four Document Relevance States:
 *  - BELONGS_TO_PROJECT            : Document content clearly matches the selected project.
 *  - RELEVANT_SUPPORTING_DOCUMENT  : Supporting document (BOQ/DUPA/drawing/spec/schedule/permit)
 *                                    compatible with the selected project (even without a printed project name).
 *  - UNRELATED                     : Document content clearly identifies a DIFFERENT project / contract.
 *                                    Must NOT attach to or populate the selected project.
 *  - NEEDS_CONFIRMATION            : Project association is uncertain; hold for simple user confirmation
 *                                    without populating financial/operational data or deleting evidence.
 *
 * Five Field-Level Relevance Classes:
 *  - AUTHORITATIVE_CONTRACT_FIELD
 *  - RELEVANT_OPERATIONAL_SUPPORTING_FIELD
 *  - REFERENCE_ONLY_CALCULATION
 *  - UNRELATED_PROJECT_INFO
 *  - DUPLICATE_OR_DERIVED_FIGURE
 */

import type { ExtractedContractDocument } from './contract-document-extractor';
import type { ReconcilerWorksheetInput } from './awarded-boq-reconciler';

export type DocumentProjectRelevanceStatus =
  | 'BELONGS_TO_PROJECT'
  | 'RELEVANT_SUPPORTING_DOCUMENT'
  | 'UNRELATED'
  | 'NEEDS_CONFIRMATION';

export type DocumentDisposition =
  | 'ATTACH_AND_PROCESS'
  | 'REJECT_UNRELATED_DO_NOT_ATTACH'
  | 'HOLD_FOR_USER_CONFIRMATION';

export type FieldRelevanceCategory =
  | 'AUTHORITATIVE_CONTRACT_FIELD'
  | 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD'
  | 'REFERENCE_ONLY_CALCULATION'
  | 'UNRELATED_PROJECT_INFO'
  | 'DUPLICATE_OR_DERIVED_FIGURE';

export interface SelectedProjectIdentity {
  readonly projectId: string;
  readonly projectName: string;
  readonly contractNumber?: string | null;
  readonly clientName?: string | null;
  readonly awardedContractor?: string | null;
  readonly location?: string | null;
  readonly knownReferences?: ReadonlyArray<string>;
}

export interface DocumentIdentitySignals {
  readonly fileName: string;
  readonly documentRole?: string | null;
  readonly projectName?: string | null;
  readonly projectReference?: string | null;
  readonly contractReference?: string | null;
  readonly noticeOfAwardRef?: string | null;
  readonly noticeToProceedRef?: string | null;
  readonly clientName?: string | null;
  readonly awardedContractor?: string | null;
  readonly rawHeaderText?: string | null;
  readonly referenceBudgetAmount?: number | null;
  readonly referenceBudgetLabel?: string | null;
  readonly calculatedBidAmount?: number | null;
}

export interface DocumentRelevanceAssessment {
  readonly status: DocumentProjectRelevanceStatus;
  readonly disposition: DocumentDisposition;
  readonly confidence: number;
  readonly reason: string;
  readonly matchedSignals: ReadonlyArray<string>;
  readonly conflictingSignals: ReadonlyArray<string>;
  readonly extractedIdentifiers: {
    readonly projectName: string | null;
    readonly projectReference: string | null;
    readonly contractReference: string | null;
    readonly clientName: string | null;
    readonly awardedContractor: string | null;
  };
}

export interface ClassifiedFieldRelevanceItem {
  readonly fieldName: string;
  readonly value: string | number | null;
  readonly category: FieldRelevanceCategory;
  readonly usableForProjectRecord: boolean;
  readonly usableAsOfficialContractAmount: boolean;
  readonly provenance: string;
  readonly reason: string;
}

export interface FieldRelevanceReport {
  readonly usedFields: ReadonlyArray<ClassifiedFieldRelevanceItem>;
  readonly ignoredReferenceFields: ReadonlyArray<ClassifiedFieldRelevanceItem>;
  readonly excludedUnrelatedFields: ReadonlyArray<ClassifiedFieldRelevanceItem>;
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'of', 'in', 'to', 'at', 'by', 'on', 'with', 'from',
  'project', 'contract', 'works', 'work', 'construction', 'building', 'site',
  'phase', 'boq', 'bill', 'quantities', 'awarded', 'test', 'synthetic', 'refkit',
  'philippines', 'inc', 'corp', 'corporation', 'company', 'co', 'ltd',
]);

function normToken(s: string | null | undefined): string {
  return String(s ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function splitReferenceTokens(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/[\/|;,]+/)
    .map((part) => normToken(part))
    .filter((t) => t.length >= 4);
}

function significantWords(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return String(raw)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
}

function wordOverlapRatio(a: string | null | undefined, b: string | null | undefined): number {
  const wa = new Set(significantWords(a));
  const wb = new Set(significantWords(b));
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  for (const w of wa) {
    if (wb.has(w)) shared++;
  }
  return shared / Math.min(wa.size, wb.size);
}

/**
 * Extracts project-identity and reference-budget metadata signals directly from worksheet
 * header rows (e.g., Contract ID, Project Name, Implementing Office, ABC, Total Calculated Bid).
 */
export function extractWorkbookIdentitySignals(
  fileName: string,
  sheets: ReadonlyArray<ReconcilerWorksheetInput>,
  documentRole = 'CONTRACT_BOQ'
): DocumentIdentitySignals {
  let projectName: string | null = null;
  let projectReference: string | null = null;
  let contractReference: string | null = null;
  let clientName: string | null = null;
  let awardedContractor: string | null = null;
  let referenceBudgetAmount: number | null = null;
  let referenceBudgetLabel: string | null = null;
  let calculatedBidAmount: number | null = null;
  const headerLines: string[] = [];

  for (const sheet of sheets.slice(0, 4)) {
    for (const row of sheet.rows.slice(0, 14)) {
      const texts = row.cells.map((c) => String(c.text ?? '').trim()).filter(Boolean);
      if (texts.length === 0) continue;
      headerLines.push(texts.join(' | '));

      for (let i = 0; i < row.cells.length; i++) {
        const label = String(row.cells[i]?.text ?? '').trim();
        const nextVal = String(row.cells[i + 1]?.text ?? '').trim();
        const nextNum = typeof row.cells[i + 1]?.numOrText === 'number'
          ? (row.cells[i + 1].numOrText as number)
          : Number(nextVal.replace(/[₱$,\s]/g, ''));
        if (!label) continue;

        if (!contractReference && /^(?:contract\s*(?:id|no\.?|ref(?:erence)?)|project\s*id)\s*:?$/i.test(label) && nextVal) {
          contractReference = nextVal;
          projectReference = projectReference ?? nextVal;
        } else if (!projectName && /^(?:project\s*name|contract\s*name|subject|project\s*title)\s*:?$/i.test(label) && nextVal) {
          projectName = nextVal;
        } else if (!clientName && /^(?:implementing\s*office|client|project\s*owner|owner|agency)\s*:?$/i.test(label) && nextVal) {
          clientName = nextVal;
        } else if (!awardedContractor && /^(?:awarded\s*contractor|contractor|bidder)\s*:?$/i.test(label) && nextVal) {
          awardedContractor = nextVal;
        } else if (referenceBudgetAmount === null && /\b(approved\s+budget|abc)\b/i.test(label) && Number.isFinite(nextNum) && nextNum > 0) {
          referenceBudgetAmount = Math.round(nextNum * 100) / 100;
          referenceBudgetLabel = label;
        } else if (calculatedBidAmount === null && /\b(total\s+calculated\s+bid|calculated\s+bid|estimated\s+cost)\b/i.test(label) && Number.isFinite(nextNum) && nextNum > 0) {
          calculatedBidAmount = Math.round(nextNum * 100) / 100;
        }

        // Single-cell "PROJECT: <name>" format (common in PGH / DPWH BOQ headers)
        if (!projectName && /^(?:project|subject)\s*:\s*(.{4,})/i.test(label)) {
          const m = /^(?:project|subject)\s*:\s*(.{4,})/i.exec(label);
          if (m) projectName = m[1].trim();
        }
      }
    }
  }

  return {
    fileName,
    documentRole,
    projectName,
    projectReference,
    contractReference,
    clientName,
    awardedContractor,
    rawHeaderText: headerLines.slice(0, 20).join('\n'),
    referenceBudgetAmount,
    referenceBudgetLabel,
    calculatedBidAmount,
  };
}

/**
 * Builds DocumentIdentitySignals from an ExtractedContractDocument.
 */
export function buildSignalsFromContractExtraction(
  doc: ExtractedContractDocument,
  documentRole = 'CONTRACT'
): DocumentIdentitySignals {
  return {
    fileName: doc.fileName,
    documentRole,
    projectName: doc.fields.projectName?.value ?? null,
    projectReference: doc.fields.projectReference?.value ?? null,
    contractReference: doc.fields.contractReference?.value ?? null,
    noticeOfAwardRef: doc.fields.noticeOfAwardRef?.value ?? null,
    noticeToProceedRef: doc.fields.noticeToProceedRef?.value ?? null,
    clientName: doc.fields.clientName?.value ?? null,
    awardedContractor: doc.fields.awardedContractor?.value ?? null,
  };
}

const SUPPORTING_ROLES = new Set([
  'DRAWING', 'TECHNICAL_SPEC', 'DUPA', 'SCHEDULE', 'PERMIT',
  'PROCUREMENT', 'PROGRESS_EVIDENCE', 'FINANCIAL_EVIDENCE', 'AGENCY_ESTIMATE', 'OTHER',
]);

/**
 * Evaluates whether an uploaded document belongs to the selected project based on
 * document content and cross-references (never filenames alone).
 */
export function classifyDocumentProjectRelevance(
  selectedProject: SelectedProjectIdentity,
  signals: DocumentIdentitySignals
): DocumentRelevanceAssessment {
  const matchedSignals: string[] = [];
  const conflictingSignals: string[] = [];

  const projectRefTokens = new Set<string>([
    ...splitReferenceTokens(selectedProject.contractNumber),
    ...splitReferenceTokens(selectedProject.projectName),
    ...(selectedProject.knownReferences ?? []).flatMap((r) => splitReferenceTokens(r)),
  ]);

  const docRefTokens = new Set<string>([
    ...splitReferenceTokens(signals.projectReference),
    ...splitReferenceTokens(signals.contractReference),
    ...splitReferenceTokens(signals.noticeOfAwardRef),
    ...splitReferenceTokens(signals.noticeToProceedRef),
  ]);

  // 1. Check direct reference/identifier overlap (strongest identity signal)
  let hasReferenceMatch = false;
  for (const dt of docRefTokens) {
    if (projectRefTokens.has(dt)) {
      hasReferenceMatch = true;
      matchedSignals.push(`Matched project/contract reference token "${dt}"`);
    } else {
      // Also match substring containment for linked notice refs (e.g., NOA-DEMO-001-20261119 contains DEMO001)
      for (const pt of projectRefTokens) {
        if (pt.length >= 5 && (dt.includes(pt) || pt.includes(dt))) {
          hasReferenceMatch = true;
          matchedSignals.push(`Linked reference "${dt}" matches project identifier "${pt}"`);
          break;
        }
      }
    }
  }

  // Also check if project contractNumber appears inside rawHeaderText
  const selectedContractNorm = normToken(selectedProject.contractNumber);
  const rawHeaderNorm = normToken(signals.rawHeaderText);
  if (selectedContractNorm.length >= 4 && rawHeaderNorm.includes(selectedContractNorm)) {
    hasReferenceMatch = true;
    matchedSignals.push(`Header text contains selected contract reference "${selectedProject.contractNumber}"`);
  }

  // 2. Check Project Name similarity
  const nameOverlap = wordOverlapRatio(selectedProject.projectName, signals.projectName);
  const headerNameOverlap = wordOverlapRatio(selectedProject.projectName, signals.rawHeaderText);
  const bestNameOverlap = Math.max(nameOverlap, headerNameOverlap);
  if (bestNameOverlap >= 0.5) {
    matchedSignals.push(`Project title matches selected project (${Math.round(bestNameOverlap * 100)}% keyword overlap)`);
  }

  // 3. Check Client / Owner match
  const clientOverlap = wordOverlapRatio(selectedProject.clientName, signals.clientName);
  if (clientOverlap >= 0.5) {
    matchedSignals.push(`Client/owner "${signals.clientName}" matches selected project client`);
  }

  // 4. Check Contractor match (supporting signal, not sole proof of same project since contractor runs many projects)
  const contractorOverlap = wordOverlapRatio(selectedProject.awardedContractor, signals.awardedContractor);
  if (contractorOverlap >= 0.5) {
    matchedSignals.push(`Awarded contractor "${signals.awardedContractor}" matches`);
  }

  // 5. Detect explicit foreign / conflicting project identity
  const selectedHasStrictRef = Boolean(selectedContractNorm && selectedContractNorm.length >= 4);
  const docHasExplicitRef = Boolean(normToken(signals.contractReference) || normToken(signals.projectReference));

  if (selectedHasStrictRef && docHasExplicitRef && !hasReferenceMatch) {
    conflictingSignals.push(
      `Document contract/project reference ("${signals.contractReference || signals.projectReference}") does not match selected project reference ("${selectedProject.contractNumber}")`
    );
  }

  // Detect conflicting client when both selected project & document clearly state different clients and no ref matched
  if (
    selectedProject.clientName &&
    signals.clientName &&
    significantWords(selectedProject.clientName).length > 0 &&
    significantWords(signals.clientName).length > 0 &&
    clientOverlap === 0 &&
    !hasReferenceMatch
  ) {
    conflictingSignals.push(
      `Document client ("${signals.clientName}") differs from selected project client ("${selectedProject.clientName}")`
    );
  }

  // Detect completely distinct project names when both sides specify rich titles and zero overlap + no ref match
  if (
    signals.projectName &&
    significantWords(selectedProject.projectName).length >= 1 &&
    significantWords(signals.projectName).length >= 2 &&
    bestNameOverlap === 0 &&
    !hasReferenceMatch
  ) {
    conflictingSignals.push(
      `Document project title ("${signals.projectName}") does not match selected project ("${selectedProject.projectName}")`
    );
  }

  const extractedIdentifiers = {
    projectName: signals.projectName ?? null,
    projectReference: signals.projectReference ?? null,
    contractReference: signals.contractReference ?? null,
    clientName: signals.clientName ?? null,
    awardedContractor: signals.awardedContractor ?? null,
  };

  // Decision Logic
  // A. Clear conflict with zero strong project identity match -> UNRELATED
  if (conflictingSignals.length > 0 && !hasReferenceMatch && bestNameOverlap < 0.5) {
    return {
      status: 'UNRELATED',
      disposition: 'REJECT_UNRELATED_DO_NOT_ATTACH',
      confidence: conflictingSignals.length >= 2 ? 0.95 : 0.88,
      reason: `Document appears to belong to a different project: ${conflictingSignals.join('; ')}.`,
      matchedSignals,
      conflictingSignals,
      extractedIdentifiers,
    };
  }

  // B. Strong project identity match -> BELONGS_TO_PROJECT (or RELEVANT_SUPPORTING_DOCUMENT for supporting roles)
  if (hasReferenceMatch || bestNameOverlap >= 0.5) {
    const isSupporting = Boolean(signals.documentRole && SUPPORTING_ROLES.has(signals.documentRole));
    return {
      status: isSupporting ? 'RELEVANT_SUPPORTING_DOCUMENT' : 'BELONGS_TO_PROJECT',
      disposition: 'ATTACH_AND_PROCESS',
      confidence: hasReferenceMatch ? 0.96 : 0.86,
      reason: matchedSignals.join('; '),
      matchedSignals,
      conflictingSignals,
      extractedIdentifiers,
    };
  }

  // C. Supporting document lacking printed project name (never reject merely for missing printed project name!)
  const hasAnyExtractedId = Boolean(
    signals.projectName || signals.projectReference || signals.contractReference || signals.clientName
  );
  if (!hasAnyExtractedId && signals.documentRole && SUPPORTING_ROLES.has(signals.documentRole)) {
    return {
      status: 'RELEVANT_SUPPORTING_DOCUMENT',
      disposition: 'ATTACH_AND_PROCESS',
      confidence: 0.72,
      reason: 'Supporting project document contains no conflicting project identifiers and is preserved as supporting evidence.',
      matchedSignals: ['No conflicting project identifiers found'],
      conflictingSignals: [],
      extractedIdentifiers,
    };
  }

  // D. Uncertain association (e.g., unbranded BOQ/contract lacking matching identifiers) -> NEEDS_CONFIRMATION
  return {
    status: 'NEEDS_CONFIRMATION',
    disposition: 'HOLD_FOR_USER_CONFIRMATION',
    confidence: 0.55,
    reason: 'Could not confirm from document contents whether this file belongs to the selected project. Please confirm before using its figures.',
    matchedSignals,
    conflictingSignals,
    extractedIdentifiers,
  };
}

/**
 * Classifies extracted fields within a document into the five mandatory field-level relevance categories
 * so estimates, reference budgets (ABC), unrelated project figures, and unsigned demo values are never
 * mistakenly treated as the selected project's official awarded contract amount.
 */
export function classifyExtractedFieldRelevance(input: {
  readonly contractDoc?: ExtractedContractDocument | null;
  readonly workbookSignals?: DocumentIdentitySignals | null;
  readonly fullText?: string | null;
}): FieldRelevanceReport {
  const usedFields: ClassifiedFieldRelevanceItem[] = [];
  const ignoredReferenceFields: ClassifiedFieldRelevanceItem[] = [];
  const excludedUnrelatedFields: ClassifiedFieldRelevanceItem[] = [];

  const doc = input.contractDoc ?? null;
  if (doc) {
    const isNonAuth = doc.isTestOnly || doc.isUnsigned || !doc.canAuthorizeLiveContract;
    const f = doc.fields;

    if (f.projectReference) {
      usedFields.push({
        fieldName: 'projectReference',
        value: f.projectReference.value,
        category: 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD',
        usableForProjectRecord: true,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.projectReference.pageNumber}`,
        reason: 'Project / contract identifier extracted from document content',
      });
    }
    if (f.clientName) {
      usedFields.push({
        fieldName: 'clientName',
        value: f.clientName.value,
        category: isNonAuth ? 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD' : 'AUTHORITATIVE_CONTRACT_FIELD',
        usableForProjectRecord: true,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.clientName.pageNumber}`,
        reason: isNonAuth ? 'Client name from unsigned/test document' : 'Client / project owner',
      });
    }
    if (f.awardedContractor) {
      usedFields.push({
        fieldName: 'awardedContractor',
        value: f.awardedContractor.value,
        category: isNonAuth ? 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD' : 'AUTHORITATIVE_CONTRACT_FIELD',
        usableForProjectRecord: true,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.awardedContractor.pageNumber}`,
        reason: isNonAuth ? 'Awarded contractor from unsigned/test document' : 'Awarded contractor',
      });
    }
    if (f.contractReference) {
      usedFields.push({
        fieldName: 'contractReference',
        value: f.contractReference.value,
        category: isNonAuth ? 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD' : 'AUTHORITATIVE_CONTRACT_FIELD',
        usableForProjectRecord: true,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.contractReference.pageNumber}`,
        reason: 'Contract agreement reference',
      });
    }
    if (f.noticeOfAwardRef) {
      usedFields.push({
        fieldName: 'noticeOfAwardRef',
        value: f.noticeOfAwardRef.value,
        category: 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD',
        usableForProjectRecord: true,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.noticeOfAwardRef.pageNumber}`,
        reason: 'Notice of Award reference',
      });
    }
    if (f.noticeToProceedRef) {
      usedFields.push({
        fieldName: 'noticeToProceedRef',
        value: f.noticeToProceedRef.value,
        category: 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD',
        usableForProjectRecord: true,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.noticeToProceedRef.pageNumber}`,
        reason: 'Notice to Proceed reference',
      });
    }
    if (f.awardedAmount) {
      const item: ClassifiedFieldRelevanceItem = {
        fieldName: 'awardedAmount',
        value: f.awardedAmount.value,
        category: isNonAuth ? 'REFERENCE_ONLY_CALCULATION' : 'AUTHORITATIVE_CONTRACT_FIELD',
        usableForProjectRecord: !isNonAuth,
        usableAsOfficialContractAmount: !isNonAuth,
        provenance: `${doc.fileName} p.${f.awardedAmount.pageNumber}`,
        reason: isNonAuth
          ? `Amount (${f.awardedAmount.value}) comes from an unsigned/test-only document (${doc.authorityStatus}) — preserved for test reconciliation only, never as live contract authority`
          : 'Authoritative contract amount from executed contract document',
      };
      if (isNonAuth) ignoredReferenceFields.push(item);
      else usedFields.push(item);
    }
    if (f.commencementDate) {
      usedFields.push({
        fieldName: 'commencementDate',
        value: f.commencementDate.value,
        category: 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD',
        usableForProjectRecord: !isNonAuth,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.commencementDate.pageNumber}`,
        reason: 'Contract commencement date',
      });
    }
    if (f.contractDurationDays) {
      usedFields.push({
        fieldName: 'contractDurationDays',
        value: f.contractDurationDays.value,
        category: 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD',
        usableForProjectRecord: !isNonAuth,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.contractDurationDays.pageNumber}`,
        reason: 'Contract duration in calendar days',
      });
    }
    if (f.completionDate) {
      usedFields.push({
        fieldName: 'completionDate',
        value: f.completionDate.value,
        category: 'RELEVANT_OPERATIONAL_SUPPORTING_FIELD',
        usableForProjectRecord: !isNonAuth,
        usableAsOfficialContractAmount: false,
        provenance: `${doc.fileName} p.${f.completionDate.pageNumber}`,
        reason: 'Target completion date',
      });
    }
  }

  // Detect explicitly disclaimed unrelated reference figures in prose (e.g., "₱11,850,000 source-workbook ABC ... must not be used")
  const textToScan = input.fullText ?? '';
  if (textToScan) {
    const disclaimedRx = /(?:₱|PHP|Php)\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{1,2})?)[^.\n]{0,140}(?:must\s+not\s+be\s+used|unverified\s+reference\s+estimate|different\s+illustrative\s+source)/gi;
    let m: RegExpExecArray | null;
    while ((m = disclaimedRx.exec(textToScan)) !== null) {
      const val = Number(m[1].replace(/,/g, ''));
      if (Number.isFinite(val)) {
        excludedUnrelatedFields.push({
          fieldName: 'disclaimedForeignAmount',
          value: val,
          category: 'UNRELATED_PROJECT_INFO',
          usableForProjectRecord: false,
          usableAsOfficialContractAmount: false,
          provenance: doc?.fileName ?? input.workbookSignals?.fileName ?? 'Document prose',
          reason: 'Excluded unrelated reference estimate explicitly disclaimed as belonging to another source',
        });
      }
    }
  }

  // Workbook reference budget (ABC) & calculated bid are ALWAYS reference-only, never verified official contract award
  const wb = input.workbookSignals ?? null;
  if (wb) {
    if (wb.referenceBudgetAmount !== null && wb.referenceBudgetAmount !== undefined) {
      ignoredReferenceFields.push({
        fieldName: 'approvedBudgetAbc',
        value: wb.referenceBudgetAmount,
        category: 'REFERENCE_ONLY_CALCULATION',
        usableForProjectRecord: false,
        usableAsOfficialContractAmount: false,
        provenance: `${wb.fileName} (${wb.referenceBudgetLabel || 'ABC'})`,
        reason: 'Approved Budget for the Contract (ABC) is a reference budget, NOT an independently verified awarded contract amount',
      });
    }
    if (wb.calculatedBidAmount !== null && wb.calculatedBidAmount !== undefined) {
      ignoredReferenceFields.push({
        fieldName: 'totalCalculatedBid',
        value: wb.calculatedBidAmount,
        category: 'DUPLICATE_OR_DERIVED_FIGURE',
        usableForProjectRecord: false,
        usableAsOfficialContractAmount: false,
        provenance: `${wb.fileName} (POW Total Calculated Bid)`,
        reason: 'Derived summary total mirroring BOQ sheet — excluded from independent awarded contract authority',
      });
    }
  }

  return {
    usedFields,
    ignoredReferenceFields,
    excludedUnrelatedFields,
  };
}
