/**
 * Pure deterministic multi-document auto-classifier for Step 2 (Upload Project Documents).
 * Proposes an ordinary ERP document category for each selected file individually while letting
 * users confirm or adjust uncertain classifications before upload.
 */

export type ProjectDocumentRoleCode =
  | 'CONTRACT_BOQ'
  | 'CONTRACT'
  | 'AGENCY_ESTIMATE'
  | 'DUPA'
  | 'TECHNICAL_SPEC'
  | 'DRAWING'
  | 'SCHEDULE'
  | 'PROCUREMENT'
  | 'PROGRESS_EVIDENCE'
  | 'FINANCIAL_EVIDENCE'
  | 'PERMIT'
  | 'OTHER';

export interface ProjectDocumentCategoryOption {
  readonly roleCode: ProjectDocumentRoleCode;
  readonly label: string;
  readonly shortHint: string;
}

export interface ProposedDocumentClassification {
  readonly roleCode: ProjectDocumentRoleCode;
  readonly suggestedLabel: string;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'NEEDS_CONFIRMATION';
  readonly reason: string;
}

export const PROJECT_DOCUMENT_CATEGORY_OPTIONS: ReadonlyArray<ProjectDocumentCategoryOption> = [
  { roleCode: 'CONTRACT_BOQ', label: 'Awarded BOQ', shortHint: 'Bill of Quantities to verify and reconcile' },
  { roleCode: 'CONTRACT', label: 'Contract / NOA / NTP', shortHint: 'Notice of Award, Notice to Proceed, or Contract Agreement' },
  { roleCode: 'AGENCY_ESTIMATE', label: 'POW / Agency Estimate', shortHint: 'Program of Works or Approved Budget for the Contract' },
  { roleCode: 'DUPA', label: 'DUPA / Unit Price Analysis', shortHint: 'Detailed Unit Price Analysis' },
  { roleCode: 'SCHEDULE', label: 'Project Schedule / S-Curve', shortHint: 'Bar chart, Gantt, PERT-CPM, or cash flow schedule' },
  { roleCode: 'DRAWING', label: 'Drawings / Plans', shortHint: 'Architectural, structural, MEPF plans, or schematics' },
  { roleCode: 'TECHNICAL_SPEC', label: 'Technical Specifications', shortHint: 'Scope of work, standards, and material specs' },
  { roleCode: 'PERMIT', label: 'Permits & Clearances', shortHint: 'Building permits, LGU clearances, or compliance docs' },
  { roleCode: 'PROCUREMENT', label: 'Procurement / Subcontracting', shortHint: 'Supplier quotes, subcontracts, or awards' },
  { roleCode: 'PROGRESS_EVIDENCE', label: 'Site Progress / Inspection', shortHint: 'Accomplishment photos or inspection logs' },
  { roleCode: 'FINANCIAL_EVIDENCE', label: 'Billing / Financial Evidence', shortHint: 'Invoices, receipts, or billing attachments' },
  { roleCode: 'OTHER', label: 'Other Supporting Document', shortHint: 'General project reference document' },
];

export function getDocumentCategoryLabel(roleCode: string): string {
  const match = PROJECT_DOCUMENT_CATEGORY_OPTIONS.find((o) => o.roleCode === roleCode);
  return match ? match.label : roleCode.replaceAll('_', ' ');
}

/**
 * Proposes an individual document category from filename + extension using plain ERP naming cues.
 * Uncertain files are marked `NEEDS_CONFIRMATION` so the user can confirm or adjust before upload.
 */
export function classifyProjectDocumentFile(fileName: string): ProposedDocumentClassification {
  const raw = String(fileName || '').trim();
  const lower = raw.toLowerCase();
  const ext = lower.includes('.') ? lower.slice(lower.lastIndexOf('.')) : '';
  const base = lower.replace(/\.[^.]+$/, '').replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const isSpreadsheet = ext === '.xlsx' || ext === '.xls' || ext === '.csv';
  const isImage = ext === '.png' || ext === '.jpg' || ext === '.jpeg';

  // 1. DUPA (check before generic BOQ/estimate)
  if (/\bdupa\b|detailed\s*unit\s*price|unit\s*price\s*analysis/i.test(base)) {
    return {
      roleCode: 'DUPA',
      suggestedLabel: 'DUPA / Unit Price Analysis',
      confidence: 'HIGH',
      reason: 'Matched DUPA / unit price analysis naming',
    };
  }

  // 2. Program of Works / Agency Estimate / ABC
  if (/\bpow\b|program\s*of\s*works?|agency\s*estimate|\babc\b|approved\s*budget/i.test(base)) {
    return {
      roleCode: 'AGENCY_ESTIMATE',
      suggestedLabel: 'POW / Agency Estimate',
      confidence: 'HIGH',
      reason: 'Matched Program of Works / agency estimate naming',
    };
  }

  // 3. Awarded BOQ / Bill of Quantities
  if (/\bboq\b|\buboq\b|bill\s*of\s*quantit|awarded.*quantit|pay\s*items?|cost\s*estimate|detailed\s*estimate/i.test(base)) {
    return {
      roleCode: 'CONTRACT_BOQ',
      suggestedLabel: 'Awarded BOQ',
      confidence: 'HIGH',
      reason: 'Matched Bill of Quantities / awarded BOQ naming',
    };
  }

  // 4. Notice of Award / Notice to Proceed / Contract Agreement
  if (/\bnoa\b|notice\s*of\s*award/i.test(base)) {
    return {
      roleCode: 'CONTRACT',
      suggestedLabel: 'Notice of Award (Contract)',
      confidence: 'HIGH',
      reason: 'Matched Notice of Award naming',
    };
  }
  if (/\bntp\b|notice\s*to\s*proceed/i.test(base)) {
    return {
      roleCode: 'CONTRACT',
      suggestedLabel: 'Notice to Proceed (Contract)',
      confidence: 'HIGH',
      reason: 'Matched Notice to Proceed naming',
    };
  }
  if (/contract\s*agreement|signed\s*contract|\bcontract\b|letter\s*of\s*award|\bloa\b/i.test(base)) {
    return {
      roleCode: 'CONTRACT',
      suggestedLabel: 'Contract Agreement',
      confidence: 'HIGH',
      reason: 'Matched Contract Agreement naming',
    };
  }

  // 5. Schedules / Gantt / S-Curve
  if (/schedule|gantt|s-?curve|pert|cpm|timeline|bar\s*chart|work\s*program/i.test(base)) {
    return {
      roleCode: 'SCHEDULE',
      suggestedLabel: 'Project Schedule / S-Curve',
      confidence: 'HIGH',
      reason: 'Matched project schedule / S-curve naming',
    };
  }

  // 6. Drawings / Plans
  if (/drawing|plan|blueprint|layout|schematic|elevation|section|as-?built|floor\s*plan|mepf|cad/i.test(base)) {
    return {
      roleCode: 'DRAWING',
      suggestedLabel: 'Drawings / Plans',
      confidence: 'HIGH',
      reason: 'Matched drawing / plan naming',
    };
  }

  // 7. Technical Specifications
  if (/spec|specification|technical\s*req|scope\s*of\s*work|terms\s*of\s*ref|\btor\b/i.test(base)) {
    return {
      roleCode: 'TECHNICAL_SPEC',
      suggestedLabel: 'Technical Specifications',
      confidence: 'HIGH',
      reason: 'Matched technical specifications naming',
    };
  }

  // 8. Permits & Clearances
  if (/permit|clearance|license|ecc|building\s*permit|barangay|lgu|bond|insurance|cari/i.test(base)) {
    return {
      roleCode: 'PERMIT',
      suggestedLabel: 'Permits & Clearances',
      confidence: 'MEDIUM',
      reason: 'Matched permit / compliance naming',
    };
  }

  // 9. Procurement / Billing / Progress cues
  if (/quotation|canvass|subcontract|purchase\s*order|\bpo\b|supplier/i.test(base)) {
    return {
      roleCode: 'PROCUREMENT',
      suggestedLabel: 'Procurement / Subcontracting',
      confidence: 'MEDIUM',
      reason: 'Matched procurement naming',
    };
  }
  if (/billing|invoice|receipt|payment|voucher|collection/i.test(base)) {
    return {
      roleCode: 'FINANCIAL_EVIDENCE',
      suggestedLabel: 'Billing / Financial Evidence',
      confidence: 'MEDIUM',
      reason: 'Matched billing / financial naming',
    };
  }
  if (/progress|accomplishment|inspection|site\s*photo|daily\s*report/i.test(base)) {
    return {
      roleCode: 'PROGRESS_EVIDENCE',
      suggestedLabel: 'Site Progress / Inspection',
      confidence: 'MEDIUM',
      reason: 'Matched site progress / inspection naming',
    };
  }

  // 10. Uncertain fallback by file type -> explicitly ask user to confirm!
  if (isSpreadsheet) {
    return {
      roleCode: 'CONTRACT_BOQ',
      suggestedLabel: 'Awarded BOQ (Please confirm)',
      confidence: 'NEEDS_CONFIRMATION',
      reason: 'Spreadsheet detected — please confirm whether this is the Awarded BOQ or a supporting sheet',
    };
  }
  if (isImage) {
    return {
      roleCode: 'DRAWING',
      suggestedLabel: 'Drawings / Plans (Please confirm)',
      confidence: 'NEEDS_CONFIRMATION',
      reason: 'Image detected — please confirm whether this is a drawing, site photo, or scanned BOQ',
    };
  }

  return {
    roleCode: 'OTHER',
    suggestedLabel: 'Other Supporting Document (Please confirm)',
    confidence: 'NEEDS_CONFIRMATION',
    reason: 'Filename did not clearly identify a category — please confirm before uploading',
  };
}
