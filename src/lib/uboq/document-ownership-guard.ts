/**
 * Unified Project Identity & Approved-Document Ownership Guard.
 *
 * Owner's Final Business Rule:
 *  - Similar project names MAY be allowed when contracts are genuinely different.
 *  - One verified contract identity maps to one authoritative project record.
 *  - A project-specific document already used in an approved/verified project MUST NOT
 *    be accepted, attached, or imported into another project when confirmed identical
 *    or substantially equivalent (even if renamed, copied, reformatted, re-exported,
 *    column-reordered, converted between PDF/JPEG/XLSX, or rescanned).
 *  - Confirmed cross-project duplicates = HARD BLOCK (HTTP 422), NEVER overridable by
 *    confirmProjectAssociation or allowDuplicateNewRevision.
 *  - Uncertain similarity / provisional conflict / failed OCR = HOLD (HTTP 409).
 *  - Generic blank templates / standard forms with no project-specific contract data = ALLOW.
 *  - Privacy-safe: never expose confidential project metadata to unauthorized users.
 */

import crypto from 'node:crypto';
import type { AwardedBoqVerificationReport } from './awarded-boq-reconciler';
import type { ExtractedContractDocument } from './contract-document-extractor';
import type { DocumentIdentitySignals } from './project-relevance';

export const MSG_DUPLICATE_PROJECT =
  'PROJECT ALREADY EXISTS\n\nAn existing project matches the verified contract/project identity.\n\nPlease open the existing project instead of creating a duplicate.';

export const MSG_SIMILAR_PROJECT_NAME =
  'POSSIBLE EXISTING PROJECT\n\nA project with a similar name exists.\n\nPlease check that this is a different contract or package before proceeding.';

export const MSG_DOCUMENT_ALREADY_USED =
  'DOCUMENT ALREADY USED BY ANOTHER PROJECT\n\nThis document matches project-specific information already associated with an approved OneSystemsERP project.\n\nThe upload has been blocked to prevent duplicate or incorrect project records.\n\nNo data was imported.';

export const MSG_DOCUMENT_ASSOCIATION_UNVERIFIED =
  'PROJECT ASSOCIATION NOT VERIFIED\n\nThe uploaded document requires verification before it can be used for this project\'s records.';

export const MSG_SAME_FILE_ALREADY_UPLOADED =
  'DOCUMENT ALREADY UPLOADED\n\nThe existing source has been retained.\nNo duplicate document was created.';

const GENERIC_PLACEHOLDER_REFS = new Set([
  '0', '00', '000', '001', '1', 'na', 'n/a', 'tbd', 'none', 'test', 'draft', 'temp', 'sample',
]);

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'of', 'in', 'to', 'at', 'by', 'on', 'with', 'from',
  'project', 'contract', 'works', 'work', 'construction', 'building', 'site',
  'phase', 'boq', 'bill', 'quantities', 'awarded', 'inc', 'corp', 'corporation',
  'company', 'co', 'ltd', 'philippines',
]);

export function normalizeContractToken(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
}

export function isMeaningfulContractRef(raw: string | null | undefined): boolean {
  const norm = normalizeContractToken(raw);
  if (norm.length < 4) return false;
  if (GENERIC_PLACEHOLDER_REFS.has(norm.toLowerCase())) return false;
  // Require at least one letter or >= 5 digits so trivial "001" placeholders stay provisional
  return /[A-Z]/.test(norm) || norm.length >= 5;
}

export function normalizeEntityName(raw: string | null | undefined): string {
  return String(raw ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function significantWords(raw: string | null | undefined): Set<string> {
  return new Set(
    normalizeEntityName(raw)
      .split(' ')
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w))
  );
}

function nameOverlapRatio(a: string | null | undefined, b: string | null | undefined): number {
  const wa = significantWords(a);
  const wb = significantWords(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / Math.min(wa.size, wb.size);
}

/**
 * Computes a deterministic canonical contract identity key when a meaningful contract reference
 * and contracting entity/sector exist. Returns null for provisional projects without verified refs.
 */
export function buildCanonicalContractIdentityKey(input: {
  sector?: string | null;
  client?: string | null;
  contractNumber?: string | null;
}): string | null {
  if (!isMeaningfulContractRef(input.contractNumber)) return null;
  const normRef = normalizeContractToken(input.contractNumber);
  const normClient = normalizeEntityName(input.client);
  const normSector = String(input.sector ?? '').trim().toUpperCase() || 'ANY';
  return `${normSector}::${normClient || 'UNSPECIFIED'}::${normRef}`;
}

export interface ExistingProjectIdentityRecord {
  readonly id: string;
  readonly name: string;
  readonly projectCategory?: string | null;
  readonly client?: string | null;
  readonly contractNumber?: string | null;
  readonly contractAmount?: number | null;
  readonly boqLocked?: boolean | null;
  readonly hasApprovedBaseline?: boolean;
  readonly actorCanAccess?: boolean;
}

export type ProjectCreationIdentityDecision =
  | {
      readonly decision: 'BLOCK_CONFIRMED_DUPLICATE_CONTRACT';
      readonly code: 'PROJECT_ALREADY_EXISTS';
      readonly message: string;
      readonly existingProjectId: string | null;
      readonly canOpenExistingProject: boolean;
      readonly canonicalContractKey: string;
    }
  | {
      readonly decision: 'WARN_SIMILAR_NAME';
      readonly code: 'POSSIBLE_EXISTING_PROJECT';
      readonly message: string;
      readonly similarProjectCount: number;
      readonly canonicalContractKey: string | null;
    }
  | {
      readonly decision: 'ALLOW_DIFFERENT_CONTRACT' | 'ALLOW_PROVISIONAL';
      readonly code: 'OK';
      readonly identityState: 'VERIFIED_REF_READY' | 'PROVISIONAL';
      readonly canonicalContractKey: string | null;
    };

/**
 * Phases 2 & 3 — Project Identity Uniqueness Evaluation at Project Creation.
 * Never blocks on project name similarity alone; hard-blocks confirmed duplicate verified contract identities.
 */
export function evaluateProjectCreationIdentity(
  incoming: {
    readonly name: string;
    readonly sector: string;
    readonly client?: string | null;
    readonly contractNumber?: string | null;
  },
  existingProjects: ReadonlyArray<ExistingProjectIdentityRecord>
): ProjectCreationIdentityDecision {
  const incomingKey = buildCanonicalContractIdentityKey({
    sector: incoming.sector,
    client: incoming.client,
    contractNumber: incoming.contractNumber,
  });
  const incomingRef = isMeaningfulContractRef(incoming.contractNumber)
    ? normalizeContractToken(incoming.contractNumber)
    : null;
  const incomingClient = normalizeEntityName(incoming.client);

  // Case A: Confirmed same verified contract identity (regardless of project name!)
  if (incomingRef) {
    for (const proj of existingProjects) {
      const existingRef = isMeaningfulContractRef(proj.contractNumber)
        ? normalizeContractToken(proj.contractNumber)
        : null;
      if (!existingRef || existingRef !== incomingRef) continue;

      const existingClient = normalizeEntityName(proj.client);
      const clientCompatible =
        !incomingClient ||
        !existingClient ||
        incomingClient === existingClient ||
        nameOverlapRatio(incomingClient, existingClient) >= 0.6;
      const isAuthoritativeExisting =
        Boolean(proj.hasApprovedBaseline) ||
        Boolean(proj.boqLocked) ||
        (typeof proj.contractAmount === 'number' && proj.contractAmount > 0) ||
        Boolean(existingRef && existingClient && incomingClient && existingClient === incomingClient);

      if (clientCompatible && isAuthoritativeExisting) {
        const canAccess = Boolean(proj.actorCanAccess);
        return {
          decision: 'BLOCK_CONFIRMED_DUPLICATE_CONTRACT',
          code: 'PROJECT_ALREADY_EXISTS',
          message: MSG_DUPLICATE_PROJECT,
          existingProjectId: canAccess ? proj.id : null,
          canOpenExistingProject: canAccess,
          canonicalContractKey: incomingKey ?? `REF::${incomingRef}`,
        };
      }
    }
  }

  // Case B: Similar project name (without confirmed duplicate contract) -> WARN, never hard-block!
  const normIncomingName = normalizeEntityName(incoming.name);
  let similarCount = 0;
  for (const proj of existingProjects) {
    const normExistingName = normalizeEntityName(proj.name);
    if (!normExistingName) continue;
    // If both have distinct meaningful contract refs, they are legitimately different contracts (Case C)
    const existingRef = isMeaningfulContractRef(proj.contractNumber)
      ? normalizeContractToken(proj.contractNumber)
      : null;
    if (incomingRef && existingRef && incomingRef !== existingRef) {
      continue;
    }
    const overlap = nameOverlapRatio(normIncomingName, normExistingName);
    const sameExact = normIncomingName === normExistingName;
    if (sameExact || overlap >= 0.65) {
      similarCount++;
    }
  }

  if (similarCount > 0) {
    return {
      decision: 'WARN_SIMILAR_NAME',
      code: 'POSSIBLE_EXISTING_PROJECT',
      message: MSG_SIMILAR_PROJECT_NAME,
      similarProjectCount: similarCount,
      canonicalContractKey: incomingKey,
    };
  }

  if (incomingRef) {
    return {
      decision: 'ALLOW_DIFFERENT_CONTRACT',
      code: 'OK',
      identityState: 'VERIFIED_REF_READY',
      canonicalContractKey: incomingKey,
    };
  }

  return {
    decision: 'ALLOW_PROVISIONAL',
    code: 'OK',
    identityState: 'PROVISIONAL',
    canonicalContractKey: null,
  };
}

// ---------------------------------------------------------------------------
// Phase 6 — Deterministic Canonical Content Fingerprinting
// ---------------------------------------------------------------------------

export interface CanonicalDocumentFingerprint {
  readonly kind: 'BOQ_SUBSTANTIVE' | 'CONTRACT_SUBSTANTIVE' | 'GENERIC_TEMPLATE' | 'UNVERIFIED';
  readonly boqStructureHash: string | null;
  readonly contractIdentityHash: string | null;
  readonly normalizedTextHash: string | null;
  readonly contractRefs: ReadonlyArray<string>;
  readonly payItemCount: number;
  readonly recalculatedTotal: number | null;
  readonly isGenericTemplate: boolean;
  readonly substantiveSignalsCount: number;
}

/**
 * Generates a deterministic content fingerprint immune to filename changes, formatting changes,
 * column reordering, and PDF/XLSX/JPEG re-exports.
 * Generic blank templates without substantive project-specific data are explicitly marked isGenericTemplate: true.
 */
export function computeCanonicalDocumentFingerprint(params: {
  readonly boqVerification?: AwardedBoqVerificationReport | null;
  readonly contractExtraction?: ExtractedContractDocument | null;
  readonly workbookSignals?: DocumentIdentitySignals | null;
  readonly extractedText?: string | null;
  readonly extractionVerified?: boolean;
}): CanonicalDocumentFingerprint {
  const contractRefs = new Set<string>();
  const addRef = (val: string | null | undefined) => {
    if (isMeaningfulContractRef(val)) {
      contractRefs.add(normalizeContractToken(val));
    }
  };

  if (params.contractExtraction) {
    const f = params.contractExtraction.fields;
    addRef(f.contractReference?.value);
    addRef(f.projectReference?.value);
    addRef(f.noticeOfAwardRef?.value);
    addRef(f.noticeToProceedRef?.value);
  }
  if (params.workbookSignals) {
    addRef(params.workbookSignals.contractReference);
    addRef(params.workbookSignals.projectReference);
    addRef(params.workbookSignals.noticeOfAwardRef);
    addRef(params.workbookSignals.noticeToProceedRef);
  }

  // 1. BOQ Substantive Fingerprint (order- and column-layout-independent)
  let boqStructureHash: string | null = null;
  let payItemCount = 0;
  let recalculatedTotal: number | null = null;

  if (params.boqVerification) {
    const pricedPayItems = params.boqVerification.classifiedRows.filter(
      (r) =>
        r.classification === 'PAY_ITEM' &&
        ((r.recalculatedAmount !== null && r.recalculatedAmount > 0) ||
          (r.lineAmount !== null && r.lineAmount > 0) ||
          (r.quantity !== null && r.quantity > 0 && r.unitPrice !== null && r.unitPrice > 0))
    );
    payItemCount = pricedPayItems.length;
    recalculatedTotal =
      params.boqVerification.recalculatedTotal > 0 ? params.boqVerification.recalculatedTotal : null;

    if (pricedPayItems.length >= 2 && recalculatedTotal !== null && recalculatedTotal > 0) {
      const canonicalTuples = pricedPayItems
        .map((r) => {
          const code = normalizeContractToken(r.itemCode);
          const desc = normalizeEntityName(r.description);
          const unit = normalizeEntityName(r.unit);
          const qty = r.quantity !== null ? Number(r.quantity.toFixed(4)) : 0;
          const amt = r.recalculatedAmount ?? r.lineAmount ?? 0;
          const effRate = qty > 0 ? Number((amt / qty).toFixed(2)) : Number((r.unitPrice ?? 0).toFixed(2));
          return `${code}|${desc}|${unit}|${qty}|${effRate}|${Number(amt.toFixed(2))}`;
        })
        .sort();

      const payload = `BOQ_V1|N=${canonicalTuples.length}|TOT=${recalculatedTotal.toFixed(2)}|${canonicalTuples.join('\n')}`;
      boqStructureHash = crypto.createHash('sha256').update(payload, 'utf8').digest('hex');
    }
  }

  // 2. Contract Document Substantive Identity Fingerprint (cross-format PDF <-> JPEG/OCR)
  let contractIdentityHash: string | null = null;
  let substantiveSignalsCount = 0;
  if (params.contractExtraction) {
    const f = params.contractExtraction.fields;
    const refsList = [...contractRefs].sort();
    const client = normalizeEntityName(f.clientName?.value);
    const contractor = normalizeEntityName(f.awardedContractor?.value);
    const amt = typeof f.awardedAmount?.value === 'number' && f.awardedAmount.value > 0
      ? f.awardedAmount.value.toFixed(2)
      : '';
    const commDate = String(f.commencementDate?.value ?? '').trim();
    const projName = normalizeEntityName(f.projectName?.value);

    if (refsList.length > 0) substantiveSignalsCount += 2;
    if (client) substantiveSignalsCount += 1;
    if (contractor) substantiveSignalsCount += 1;
    if (amt) substantiveSignalsCount += 1;
    if (commDate) substantiveSignalsCount += 1;
    if (projName) substantiveSignalsCount += 1;

    if (substantiveSignalsCount >= 3) {
      const contractPayload = [
        'CONTRACT_V1',
        `KIND=${params.contractExtraction.detectedKind}`,
        `REFS=${refsList.join(',')}`,
        `CLIENT=${client}`,
        `CONTRACTOR=${contractor}`,
        `AMT=${amt}`,
        `COMM=${commDate}`,
      ].join('|');
      contractIdentityHash = crypto.createHash('sha256').update(contractPayload, 'utf8').digest('hex');
    }
  }

  // 3. Normalized Substantive Text Hash (fallback for rich PDF/OCR text)
  let normalizedTextHash: string | null = null;
  if (params.extractedText) {
    const cleaned = normalizeEntityName(params.extractedText);
    if (cleaned.length >= 160) {
      normalizedTextHash = crypto.createHash('sha256').update(`TEXT_V1|${cleaned}`, 'utf8').digest('hex');
    }
  }

  if (params.extractionVerified === false && !boqStructureHash && !contractIdentityHash) {
    return {
      kind: 'UNVERIFIED',
      boqStructureHash: null,
      contractIdentityHash: null,
      normalizedTextHash,
      contractRefs: [...contractRefs],
      payItemCount,
      recalculatedTotal,
      isGenericTemplate: false,
      substantiveSignalsCount,
    };
  }

  if (boqStructureHash) {
    return {
      kind: 'BOQ_SUBSTANTIVE',
      boqStructureHash,
      contractIdentityHash,
      normalizedTextHash,
      contractRefs: [...contractRefs],
      payItemCount,
      recalculatedTotal,
      isGenericTemplate: false,
      substantiveSignalsCount: Math.max(substantiveSignalsCount, 3),
    };
  }

  if (contractIdentityHash) {
    return {
      kind: 'CONTRACT_SUBSTANTIVE',
      boqStructureHash: null,
      contractIdentityHash,
      normalizedTextHash,
      contractRefs: [...contractRefs],
      payItemCount,
      recalculatedTotal,
      isGenericTemplate: false,
      substantiveSignalsCount,
    };
  }

  // No substantive priced BOQ rows and no project-specific contract identity -> Generic blank template
  const isGenericTemplate = payItemCount === 0 && contractRefs.size === 0 && substantiveSignalsCount < 2;
  return {
    kind: isGenericTemplate ? 'GENERIC_TEMPLATE' : 'UNVERIFIED',
    boqStructureHash: null,
    contractIdentityHash: null,
    normalizedTextHash,
    contractRefs: [...contractRefs],
    payItemCount,
    recalculatedTotal,
    isGenericTemplate,
    substantiveSignalsCount,
  };
}

// ---------------------------------------------------------------------------
// Phases 5, 7, 8, 9 — Shared Cross-Project Document Ownership Policy
// ---------------------------------------------------------------------------

export interface ExistingDocumentOwnershipRecord {
  readonly documentId: string;
  readonly projectId: string;
  readonly sha256Hash: string;
  readonly documentRole: string;
  readonly isProjectApprovedOrVerified: boolean;
  readonly actorCanAccessOwningProject: boolean;
  readonly projectContractRefs: ReadonlyArray<string>;
  readonly fingerprint?: Partial<CanonicalDocumentFingerprint> | null;
}

export type DocumentOwnershipDecision =
  | {
      readonly decision: 'ALLOW_SAME_PROJECT_IDEMPOTENT';
      readonly httpStatus: 200;
      readonly code: 'DOCUMENT_ALREADY_UPLOADED';
      readonly message: string;
      readonly existingDocumentId: string;
    }
  | {
      readonly decision: 'ALLOW_SAME_PROJECT_REVISION';
      readonly httpStatus: 201;
      readonly code: 'OK_REVISION';
    }
  | {
      readonly decision: 'ALLOW_NEW_OWNERSHIP' | 'ALLOW_GENERIC_TEMPLATE';
      readonly httpStatus: 201;
      readonly code: 'OK';
    }
  | {
      readonly decision: 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE' | 'HARD_BLOCK_FOREIGN_CONTRACT_IDENTITY';
      readonly httpStatus: 422;
      readonly code: 'UBOQ_CROSS_PROJECT_DUPLICATE_BLOCKED';
      readonly matchBasis: 'EXACT_SHA256' | 'CANONICAL_BOQ_CONTENT' | 'CANONICAL_CONTRACT_CONTENT' | 'FOREIGN_CONTRACT_REF';
      readonly message: string;
      readonly owningProjectId: string | null;
      readonly canOpenExistingProject: boolean;
      readonly overridePermitted: false;
    }
  | {
      readonly decision: 'HOLD_UNCERTAIN_OWNERSHIP';
      readonly httpStatus: 409;
      readonly code: 'UBOQ_OWNERSHIP_VERIFICATION_REQUIRED';
      readonly reason: string;
      readonly message: string;
      readonly overridePermitted: false;
    };

/**
 * Shared global cross-project document ownership policy enforced across ALL document upload routes.
 *
 * Strictly enforces:
 *  - Same project, same SHA-256 -> idempotent reuse (never duplicates).
 *  - Different approved/verified project, exact SHA-256 OR substantive BOQ/contract content match
 *    OR foreign approved contract ref -> HARD BLOCK (HTTP 422, overridePermitted: false).
 *  - Different UNAPPROVED/provisional project match -> HOLD (HTTP 409) until ownership resolved.
 *  - Generic blank template -> ALLOW (never transfers project-specific data).
 *  - Privacy-safe: exposes owningProjectId ONLY when actorCanAccessOwningProject is true.
 */
export function evaluateCrossProjectDocumentOwnership(params: {
  readonly selectedProjectId: string;
  readonly incomingSha256: string;
  readonly incomingRole: string;
  readonly incomingFingerprint: CanonicalDocumentFingerprint;
  readonly allowDuplicateNewRevision?: boolean;
  readonly existingDocuments: ReadonlyArray<ExistingDocumentOwnershipRecord>;
}): DocumentOwnershipDecision {
  const {
    selectedProjectId,
    incomingSha256,
    incomingFingerprint,
    allowDuplicateNewRevision = false,
    existingDocuments,
  } = params;

  // Case A: Exact file already stored on the SAME project -> idempotent reuse (never duplicate!)
  const sameProjectExact = existingDocuments.find(
    (d) => d.projectId === selectedProjectId && d.sha256Hash === incomingSha256
  );
  if (sameProjectExact) {
    return {
      decision: 'ALLOW_SAME_PROJECT_IDEMPOTENT',
      httpStatus: 200,
      code: 'DOCUMENT_ALREADY_UPLOADED',
      message: MSG_SAME_FILE_ALREADY_UPLOADED,
      existingDocumentId: sameProjectExact.documentId,
    };
  }

  // Case G: Generic blank template / standard form with zero substantive project-specific data -> ALLOW
  if (incomingFingerprint.isGenericTemplate) {
    return {
      decision: 'ALLOW_GENERIC_TEMPLATE',
      httpStatus: 201,
      code: 'OK',
    };
  }

  const otherProjectDocs = existingDocuments.filter((d) => d.projectId !== selectedProjectId);

  const buildHardBlock = (
    doc: ExistingDocumentOwnershipRecord,
    decision: 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE' | 'HARD_BLOCK_FOREIGN_CONTRACT_IDENTITY',
    matchBasis: 'EXACT_SHA256' | 'CANONICAL_BOQ_CONTENT' | 'CANONICAL_CONTRACT_CONTENT' | 'FOREIGN_CONTRACT_REF'
  ): DocumentOwnershipDecision => ({
    decision,
    httpStatus: 422,
    code: 'UBOQ_CROSS_PROJECT_DUPLICATE_BLOCKED',
    matchBasis,
    message: MSG_DOCUMENT_ALREADY_USED,
    owningProjectId: doc.actorCanAccessOwningProject ? doc.projectId : null,
    canOpenExistingProject: doc.actorCanAccessOwningProject,
    overridePermitted: false,
  });

  // Case C: Exact SHA-256 match in another project
  const crossExactMatches = otherProjectDocs.filter((d) => d.sha256Hash === incomingSha256);
  const approvedExact = crossExactMatches.find((d) => d.isProjectApprovedOrVerified);
  if (approvedExact) {
    return buildHardBlock(approvedExact, 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE', 'EXACT_SHA256');
  }
  if (crossExactMatches.length > 0) {
    // Case H: Exists in an unapproved/provisional project -> HOLD until ownership established
    return {
      decision: 'HOLD_UNCERTAIN_OWNERSHIP',
      httpStatus: 409,
      code: 'UBOQ_OWNERSHIP_VERIFICATION_REQUIRED',
      reason: 'An identical file is already attached to another provisional project; ownership must be verified before import.',
      message: MSG_DOCUMENT_ASSOCIATION_UNVERIFIED,
      overridePermitted: false,
    };
  }

  // Case D: Substantive BOQ content fingerprint match across projects (renamed, reformatted, reordered columns!)
  if (incomingFingerprint.boqStructureHash) {
    const boqMatches = otherProjectDocs.filter(
      (d) => d.fingerprint?.boqStructureHash && d.fingerprint.boqStructureHash === incomingFingerprint.boqStructureHash
    );
    const approvedBoq = boqMatches.find((d) => d.isProjectApprovedOrVerified);
    if (approvedBoq) {
      return buildHardBlock(approvedBoq, 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE', 'CANONICAL_BOQ_CONTENT');
    }
    if (boqMatches.length > 0) {
      return {
        decision: 'HOLD_UNCERTAIN_OWNERSHIP',
        httpStatus: 409,
        code: 'UBOQ_OWNERSHIP_VERIFICATION_REQUIRED',
        reason: 'Substantially equivalent BOQ data already exists in another provisional project; verify ownership before import.',
        message: MSG_DOCUMENT_ASSOCIATION_UNVERIFIED,
        overridePermitted: false,
      };
    }
  }

  // Case D (Contract / Cross-format PDF <-> JPEG/OCR): Substantive contract fingerprint match
  if (incomingFingerprint.contractIdentityHash) {
    const contractMatches = otherProjectDocs.filter(
      (d) =>
        d.fingerprint?.contractIdentityHash &&
        d.fingerprint.contractIdentityHash === incomingFingerprint.contractIdentityHash
    );
    const approvedContract = contractMatches.find((d) => d.isProjectApprovedOrVerified);
    if (approvedContract) {
      return buildHardBlock(approvedContract, 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE', 'CANONICAL_CONTRACT_CONTENT');
    }
    if (contractMatches.length > 0) {
      return {
        decision: 'HOLD_UNCERTAIN_OWNERSHIP',
        httpStatus: 409,
        code: 'UBOQ_OWNERSHIP_VERIFICATION_REQUIRED',
        reason: 'Substantially equivalent contract evidence already exists in another provisional project; verify ownership before import.',
        message: MSG_DOCUMENT_ASSOCIATION_UNVERIFIED,
        overridePermitted: false,
      };
    }
  }

  // Case E: Different document carrying another approved project's authoritative contract reference
  if (incomingFingerprint.contractRefs.length > 0) {
    for (const other of otherProjectDocs) {
      const otherRefs = new Set([
        ...other.projectContractRefs.map(normalizeContractToken).filter(Boolean),
        ...(other.fingerprint?.contractRefs ?? []).map(normalizeContractToken).filter(Boolean),
      ]);
      const matchedRef = incomingFingerprint.contractRefs.find((r) => otherRefs.has(r));
      if (!matchedRef) continue;
      if (other.isProjectApprovedOrVerified) {
        return buildHardBlock(other, 'HARD_BLOCK_FOREIGN_CONTRACT_IDENTITY', 'FOREIGN_CONTRACT_REF');
      }
      return {
        decision: 'HOLD_UNCERTAIN_OWNERSHIP',
        httpStatus: 409,
        code: 'UBOQ_OWNERSHIP_VERIFICATION_REQUIRED',
        reason: `Document references contract identifier "${matchedRef}" already linked to another provisional project.`,
        message: MSG_DOCUMENT_ASSOCIATION_UNVERIFIED,
        overridePermitted: false,
      };
    }
  }

  // Case F: High-similarity normalized text match without confirmed identity -> HOLD
  if (incomingFingerprint.normalizedTextHash) {
    const textMatch = otherProjectDocs.find(
      (d) => d.fingerprint?.normalizedTextHash && d.fingerprint.normalizedTextHash === incomingFingerprint.normalizedTextHash
    );
    if (textMatch) {
      if (textMatch.isProjectApprovedOrVerified && incomingFingerprint.substantiveSignalsCount >= 2) {
        return buildHardBlock(textMatch, 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE', 'CANONICAL_CONTRACT_CONTENT');
      }
      return {
        decision: 'HOLD_UNCERTAIN_OWNERSHIP',
        httpStatus: 409,
        code: 'UBOQ_OWNERSHIP_VERIFICATION_REQUIRED',
        reason: 'Document text closely matches a file in another project without confirmed separate contract identity.',
        message: MSG_DOCUMENT_ASSOCIATION_UNVERIFIED,
        overridePermitted: false,
      };
    }
  }

  // Case B: Legitimate new revision on the SAME project
  const sameProjectPrior = existingDocuments.some((d) => d.projectId === selectedProjectId);
  if (sameProjectPrior && allowDuplicateNewRevision) {
    return {
      decision: 'ALLOW_SAME_PROJECT_REVISION',
      httpStatus: 201,
      code: 'OK_REVISION',
    };
  }

  return {
    decision: 'ALLOW_NEW_OWNERSHIP',
    httpStatus: 201,
    code: 'OK',
  };
}
