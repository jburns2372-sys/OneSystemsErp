import {
  extractCandidateCellCoordinates,
  extractCandidateEffectiveFields,
  type VisualCandidateRecord,
  type VisualSourceDocumentRecord,
  type VisualValidationExceptionRecord,
} from './visual-mapping';
import { classifyAwardedBoqRow } from './awarded-boq-reconciler';

export type UboqWorkflowStepId = 'upload' | 'review' | 'approve' | 'schedule';
export type UboqWorkflowStepStatus = 'completed' | 'current' | 'upcoming';

export interface UboqWorkflowStep {
  readonly id: UboqWorkflowStepId;
  readonly number: 1 | 2 | 3 | 4;
  readonly label: string;
  readonly shortHint: string;
  readonly status: UboqWorkflowStepStatus;
}

export interface UboqWorkflowSummary {
  readonly steps: ReadonlyArray<UboqWorkflowStep>;
  readonly hasDocuments: boolean;
  readonly totalCandidates: number;
  readonly acceptedCandidates: number;
  readonly excludedCandidates: number;
  readonly pendingCandidates: number;
  readonly openExceptions: number;
  readonly blockingOpenExceptions: number;
  readonly hasDraftSnapshot: boolean;
  readonly isDraftReadyForApproval: boolean;
  readonly hasApprovedSnapshot: boolean;
  readonly stageHeadline: string;
  readonly stageDetail: string;
}

export type SourceSheetKind = 'BOQ' | 'SUPPORTING';

export interface ReadableBoqRow {
  readonly id: string;
  readonly rowNumber: number | null;
  readonly itemCode: string;
  readonly phaseCode: string;
  readonly description: string;
  readonly quantity: number | null;
  readonly unit: string;
  readonly unitPrice: number | null;
  readonly amount: number | null;
  readonly statusKey: 'PENDING' | 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED';
  readonly statusLabel: 'Needs Review' | 'Accepted' | 'Excluded';
  readonly needsAttention: boolean;
  readonly issueSummary: string | null;
  readonly sheetKind: SourceSheetKind;
  readonly sheetLabel: string;
  readonly confidencePct: number;
  readonly extractionMethod: string;
  readonly sourceLocation: string;
  readonly coordinates: Record<string, string>;
  readonly rawFormulaText: string | null;
  readonly reviewNotes: string | null;
}

const SUPPORTING_SHEET_PATTERN =
  /\b(dupa|program\s+of\s+works|\bpow\b|unit\s+rate|unit\s+price\s+analysis|cost\s+analysis|summary|cover|abc|approved\s+budget|general\s+notes|notes|reference|cash\s*flow|s-?curve|pert|cpm|gantt|schedule|sched\b|manpower|equipment|materials\s+list|appendix|index|instructions)\b/i;

/**
 * Classifies multi-sheet workbook sections (such as DPWH workbooks) into primary BOQ sheets
 * vs supporting reference sheets (POW, DUPA, Schedule, Cash Flow, Summary, ABC, Cover, Notes)
 * for ordinary ERP users.
 */
export function classifySourceSheet(
  sheetOrPageRef: string | null | undefined,
  sectionTitle: string | null | undefined
): { readonly kind: SourceSheetKind; readonly label: string } {
  const raw = String(sheetOrPageRef || sectionTitle || '').trim();
  const label = raw || 'Main BOQ';
  if (raw && SUPPORTING_SHEET_PATTERN.test(raw) && !/\b(boq|bill\s+of\s+quantities|pay\s+items)\b/i.test(raw)) {
    return { kind: 'SUPPORTING', label };
  }
  return { kind: 'BOQ', label };
}

export interface HeaderAccessContext {
  readonly realRoleCode: string;
  readonly realRoleLabel: string;
  readonly isPrivilegedSimulator: boolean;
  readonly isSimulating: boolean;
  readonly activePreviewRoleCode: string | null;
  readonly activePreviewRoleLabel: string | null;
  readonly effectiveRoleCode: string;
  readonly effectiveRoleLabel: string;
  readonly isGlobalProjectReader: boolean;
}

const PRIVILEGED_SIMULATION_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN']);
const GLOBAL_PROJECT_READ_ROLES = new Set([
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'EXECUTIVE',
  'PRESIDENT',
  'VP_OPERATIONS',
]);

export function formatRoleLabel(role: string | null | undefined): string {
  const clean = String(role || '').trim();
  if (!clean) return 'Team Member';
  return clean
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Resolves the real effective access context for the ERP top bar without ever granting
 * privileges or allowing non-admin accounts to display a stale role-simulation badge.
 */
export function resolveEffectiveHeaderAccessContext(
  realRole: string | null | undefined,
  rawSimulatedRole: string | null | undefined
): HeaderAccessContext {
  const realRoleCode = String(realRole || '').trim().toUpperCase() || 'USER';
  const isPrivilegedSimulator = PRIVILEGED_SIMULATION_ROLES.has(realRoleCode);
  const cleanedSim = String(rawSimulatedRole || '').trim().toUpperCase();
  const isSimulating = Boolean(isPrivilegedSimulator && cleanedSim && cleanedSim !== realRoleCode);
  const activePreviewRoleCode = isSimulating ? cleanedSim : null;
  const effectiveRoleCode = activePreviewRoleCode ?? realRoleCode;

  return {
    realRoleCode,
    realRoleLabel: formatRoleLabel(realRoleCode),
    isPrivilegedSimulator,
    isSimulating,
    activePreviewRoleCode,
    activePreviewRoleLabel: activePreviewRoleCode ? formatRoleLabel(activePreviewRoleCode) : null,
    effectiveRoleCode,
    effectiveRoleLabel: formatRoleLabel(effectiveRoleCode),
    isGlobalProjectReader: GLOBAL_PROJECT_READ_ROLES.has(realRoleCode),
  };
}

function toFiniteNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  const n = typeof val === 'number' ? val : Number(String(val).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

export function extractReadableBoqRow(candidate: VisualCandidateRecord): ReadableBoqRow {
  const eff = extractCandidateEffectiveFields(candidate);
  const coords = extractCandidateCellCoordinates(candidate);

  const itemCode = String(eff.item_code ?? eff.itemCode ?? '').trim();
  const phaseCode = String(eff.phase_code ?? eff.phaseCode ?? candidate.sheetOrPageRef ?? '').trim();
  const description = String(
    eff.work_description ?? eff.description ?? eff.canonical_description ?? candidate.rawValueText ?? ''
  ).trim();
  const unit = String(eff.unit ?? eff.uom ?? eff.unit_normalized ?? '').trim();
  const quantity = toFiniteNumber(eff.approved_qty ?? eff.quantity ?? eff.qty);
  const unitPrice = toFiniteNumber(eff.contract_unit_rate ?? eff.unit_price ?? eff.unit_rate);
  const explicitAmount = toFiniteNumber(eff.contract_line_amount ?? eff.amount ?? eff.total_cost);
  const amount =
    explicitAmount !== null
      ? explicitAmount
      : quantity !== null && unitPrice !== null
        ? Number((quantity * unitPrice).toFixed(2))
        : null;

  const storedRowClass =
    candidate.parsedJson &&
    typeof candidate.parsedJson === 'object' &&
    typeof candidate.parsedJson.rowClassification === 'string'
      ? candidate.parsedJson.rowClassification
      : null;

  const rowClassification =
    storedRowClass ??
    classifyAwardedBoqRow({
      itemCode,
      description,
      unit,
      quantity,
      unitPrice,
      lineAmount: explicitAmount,
      rawTextValues: [itemCode, description, unit].filter(Boolean),
      hasFormula: Boolean(candidate.rawFormulaText),
    });
  const isNonPayableHeadingOrNote =
    rowClassification === 'HEADING' ||
    rowClassification === 'SUBHEADING' ||
    rowClassification === 'NOTE' ||
    rowClassification === 'HEADER_META' ||
    rowClassification === 'SUBTOTAL' ||
    rowClassification === 'GRAND_TOTAL' ||
    rowClassification === 'PRICE_COMPONENT';

  const statusKey: 'PENDING' | 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED' =
    candidate.reviewDecision === 'HUMAN_VERIFIED' ||
    (candidate.reviewDecision === 'AUTO_VERIFIED_DETERMINISTIC' && !candidate.requiresHumanReview)
      ? 'HUMAN_VERIFIED'
      : candidate.reviewDecision === 'HUMAN_EXCLUDED'
        ? 'HUMAN_EXCLUDED'
        : 'PENDING';

  const statusLabel =
    statusKey === 'HUMAN_VERIFIED'
      ? 'Accepted'
      : statusKey === 'HUMAN_EXCLUDED'
        ? 'Excluded'
        : 'Needs Review';

  const confidencePct = Math.round(Math.max(0, Math.min(1, Number(candidate.confidenceScore || 0))) * 100);
  const issues: string[] = [];
  if (!isNonPayableHeadingOrNote) {
    if (!description) issues.push('Missing description');
    if (quantity === null) issues.push('Missing quantity');
    if (!unit) issues.push('Missing unit');
    if (unitPrice === null && amount === null) issues.push('Missing unit price');
    if (candidate.requiresHumanReview && statusKey === 'PENDING') {
      issues.push(confidencePct < 90 ? `Check scanned text (${confidencePct}% read certainty)` : 'Requires reviewer check');
    }
  }

  const sheetInfo = classifySourceSheet(candidate.sheetOrPageRef, candidate.sectionTitle);

  return {
    id: candidate.id,
    rowNumber: candidate.sourceRowNumber,
    itemCode: itemCode || (candidate.sourceRowNumber ? `#${candidate.sourceRowNumber}` : '—'),
    phaseCode,
    description: description || 'Untitled BOQ item',
    quantity,
    unit: unit || '—',
    unitPrice,
    amount,
    statusKey,
    statusLabel,
    needsAttention: statusKey === 'PENDING' || issues.length > 0,
    issueSummary: issues.length > 0 ? issues.join(' · ') : null,
    sheetKind: sheetInfo.kind,
    sheetLabel: sheetInfo.label,
    confidencePct,
    extractionMethod: candidate.extractionMethod,
    sourceLocation:
      candidate.sheetOrPageRef ||
      candidate.sourceCellRef ||
      (candidate.sourceRowNumber ? `Row ${candidate.sourceRowNumber}` : 'Source file'),
    coordinates: coords,
    rawFormulaText: candidate.rawFormulaText,
    reviewNotes: candidate.reviewNotes,
  };
}

export function computeUboqWorkflowState(input: {
  sourceDocuments: ReadonlyArray<Pick<VisualSourceDocumentRecord, 'id' | 'candidates'>>;
  exceptions: ReadonlyArray<Pick<VisualValidationExceptionRecord, 'status' | 'severity'>>;
  snapshots: ReadonlyArray<{ id: string; status: string }>;
  hasLinkedSchedule?: boolean;
}): UboqWorkflowSummary {
  const hasDocuments = input.sourceDocuments.length > 0;
  const primaryCandidates = input.sourceDocuments[0]?.candidates ?? [];
  const totalCandidates = primaryCandidates.length;
  const acceptedCandidates = primaryCandidates.filter((c) => c.reviewDecision === 'HUMAN_VERIFIED').length;
  const excludedCandidates = primaryCandidates.filter((c) => c.reviewDecision === 'HUMAN_EXCLUDED').length;
  const pendingCandidates = primaryCandidates.filter(
    (c) => c.reviewDecision === 'PENDING' || (c.requiresHumanReview && c.reviewDecision !== 'HUMAN_VERIFIED' && c.reviewDecision !== 'HUMAN_EXCLUDED')
  ).length;

  const openList = input.exceptions.filter((e) => e.status === 'OPEN');
  const openExceptions = openList.length;
  const blockingOpenExceptions = openList.filter((e) => e.severity === 'BLOCKING').length;

  const hasApprovedSnapshot = input.snapshots.some((s) => s.status === 'APPROVED');
  const hasDraftSnapshot = input.snapshots.some((s) => s.status === 'DRAFT');
  const isDraftReadyForApproval =
    hasDraftSnapshot && !hasApprovedSnapshot && pendingCandidates === 0 && blockingOpenExceptions === 0;

  let currentStep: UboqWorkflowStepId = 'upload';
  if (!hasDocuments) {
    currentStep = 'upload';
  } else if (hasApprovedSnapshot) {
    currentStep = 'schedule';
  } else if (pendingCandidates > 0 || blockingOpenExceptions > 0 || !hasDraftSnapshot) {
    currentStep = 'review';
  } else {
    currentStep = 'approve';
  }

  const order: UboqWorkflowStepId[] = ['upload', 'review', 'approve', 'schedule'];
  const currentIdx = order.indexOf(currentStep);
  const stepStatus = (id: UboqWorkflowStepId): UboqWorkflowStepStatus => {
    const idx = order.indexOf(id);
    if (id === 'schedule' && hasApprovedSnapshot && input.hasLinkedSchedule) return 'completed';
    if (idx < currentIdx) return 'completed';
    if (idx === currentIdx) return 'current';
    return 'upcoming';
  };

  const steps: UboqWorkflowStep[] = [
    {
      id: 'upload',
      number: 1,
      label: 'Upload BOQ',
      shortHint: hasDocuments ? `${input.sourceDocuments.length} file(s) uploaded` : 'Upload Excel, PDF, DOCX, CSV, or PNG',
      status: stepStatus('upload'),
    },
    {
      id: 'review',
      number: 2,
      label: 'Review BOQ Items',
      shortHint:
        pendingCandidates > 0
          ? `${pendingCandidates} item(s) need review`
          : totalCandidates > 0
            ? `${acceptedCandidates} of ${totalCandidates} accepted`
            : 'Check extracted rows & issues',
      status: stepStatus('review'),
    },
    {
      id: 'approve',
      number: 3,
      label: 'Submit / Approve BOQ',
      shortHint: hasApprovedSnapshot
        ? 'Approved baseline active'
        : isDraftReadyForApproval
          ? 'Draft ready for approver sign-off'
          : 'Save draft after review',
      status: stepStatus('approve'),
    },
    {
      id: 'schedule',
      number: 4,
      label: 'Link to Schedule & Export',
      shortHint: hasApprovedSnapshot
        ? input.hasLinkedSchedule
          ? 'Linked to project schedule'
          : 'Ready for scheduling & T7 export'
        : 'Unlocks after BOQ approval',
      status: stepStatus('schedule'),
    },
  ];

  let stageHeadline = 'Step 1: Upload your project BOQ';
  let stageDetail = 'Upload an Awarded BOQ file in Documents & Intake to extract line items for review.';
  if (hasApprovedSnapshot) {
    stageHeadline = 'BOQ Approved — Ready for Scheduling & Export';
    stageDetail = 'Your official BOQ baseline is locked. Continue to Project Scheduling to link activities and export T7 reports.';
  } else if (isDraftReadyForApproval) {
    stageHeadline = 'Draft BOQ Ready for Authorized Approval';
    stageDetail = 'All extracted items are reviewed and open blockers are cleared. An authorized approver can now review and approve this Draft.';
  } else if (hasDocuments) {
    stageHeadline = 'Step 2: Review Extracted BOQ Items';
    stageDetail =
      pendingCandidates > 0
        ? `Check the ${pendingCandidates} item(s) marked "Needs Review", edit any incorrect figures, and save your Draft.`
        : blockingOpenExceptions > 0
          ? `Resolve ${blockingOpenExceptions} blocking issue(s) before submitting the Draft for approval.`
          : 'Review the line items below and save a Draft snapshot when ready.';
  }

  return {
    steps,
    hasDocuments,
    totalCandidates,
    acceptedCandidates,
    excludedCandidates,
    pendingCandidates,
    openExceptions,
    blockingOpenExceptions,
    hasDraftSnapshot,
    isDraftReadyForApproval,
    hasApprovedSnapshot,
    stageHeadline,
    stageDetail,
  };
}

/**
 * Converts internal technical error strings into calm, understandable user messages.
 * Technical details are never exposed in user banners; callers log raw details server/console-side only.
 */
export function formatFriendlyUboqError(rawError: unknown): string {
  const msg = rawError instanceof Error ? rawError.message : String(rawError ?? '');
  if (!msg) return 'Something went wrong while saving your changes. Please try again.';

  if (msg.includes('UBOQ_SOD_VIOLATION')) {
    return 'Maker-checker control: You prepared this draft, so a different authorized approver must approve it.';
  }
  if (msg.includes('UBOQ_RBAC_FORBIDDEN') || msg.includes('UBOQ_PBAC_PROJECT_ACCESS_DENIED')) {
    return 'Your account does not have permission to perform this action on this project.';
  }
  if (msg.includes('UBOQ_UNAUTHORIZED')) {
    return 'Your session has expired. Please sign in again and retry.';
  }
  if (msg.includes('UBOQ_REVIEW_NOTES_REQUIRED')) {
    return 'Please add a short review note explaining your decision before saving.';
  }
  if (msg.includes('UBOQ_CONFLICTING_COLUMN_MAPPING')) {
    return 'Two source columns are mapped to the same BOQ field. Open Advanced Tools to resolve the duplicate column mapping.';
  }
  if (msg.includes('UBOQ_INVALID_CANONICAL_FIELD')) {
    return 'One of the selected column mappings is not valid. Please choose a valid field from the list.';
  }
  if (msg.includes('UBOQ_NO_CANDIDATES_SELECTED')) {
    return 'No matching BOQ items were found to update.';
  }
  if (msg.includes('UBOQ_SNAPSHOT_NOT_FOUND') || msg.includes('UBOQ_SOURCE_DOCUMENT_NOT_FOUND')) {
    return 'This BOQ record could not be found in the current project. Refresh the page and try again.';
  }
  if (msg.includes('UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED')) {
    return 'This record belongs to a different project and cannot be modified here.';
  }
  if (msg.includes('UBOQ_XLSX_LIMIT_EXCEEDED')) {
    return 'This Excel workbook is too large or has too many rows/columns to process safely at once. Please save only the BOQ sheets into a smaller .xlsx file and upload again.';
  }
  if (msg.includes('UBOQ_XLSX_EMPTY_WORKBOOK')) {
    return 'No readable worksheets were found in this Excel file. Please verify the file and try again.';
  }
  if (msg.includes('UBOQ_AWARDED_CONTRACT_AMOUNT_REQUIRED')) {
    return 'Awarded contract amount required to complete reconciliation before populating the Project Workspace BOQ.';
  }
  if (msg.includes('UBOQ_AWARDED_BOQ_DISCREPANCIES_UNRESOLVED')) {
    return 'Resolve the reported BOQ calculation, formula, or contract-total discrepancies before populating the Project Workspace BOQ.';
  }
  if (msg.includes('UBOQ_ROLE_PREVIEW_BLOCKED')) {
    return 'Exit Role Preview before performing contract-import actions.';
  }
  if (msg.includes('UBOQ_WORKSPACE_BOQ_CONFLICT')) {
    return 'This Project Workspace BOQ is already populated from a different source file. Resolve the conflict before importing another BOQ.';
  }
  if (msg.includes('UBOQ_SOURCE_IMMUTABILITY_REQUIRED')) {
    return 'Only immutable, verified source BOQ files can populate the Project Workspace.';
  }
  if (msg.includes('UBOQ_WORKSPACE_BOQ_LOCKED')) {
    return 'This Project Workspace BOQ is already locked.';
  }
  if (msg.includes('UBOQ_OCR_TIMEOUT') || msg.includes('UBOQ_OCR_WORKER_FAILED')) {
    return 'We could not finish reading that scanned image within the time limit. Please try a clearer image or PDF.';
  }
  return 'Could not complete that action right now. Please review your entries and try again.';
}

export function formatCurrencyPhp(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
