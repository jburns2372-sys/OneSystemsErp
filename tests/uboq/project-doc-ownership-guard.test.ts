/**
 * Phase 11 Comprehensive 28-Scenario Acceptance Test Suite:
 * Project Identity Uniqueness, Approved-Document Ownership & Cross-Project Duplicate Prevention.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import * as XLSX from 'xlsx';
import { extractUniversalDocumentPackage } from '../../src/lib/uboq/intake/parsers';
import { extractContractDocumentFromPages } from '../../src/lib/uboq/contract-document-extractor';
import {
  computeCanonicalDocumentFingerprint,
  evaluateCrossProjectDocumentOwnership,
  evaluateProjectCreationIdentity,
  MSG_DOCUMENT_ALREADY_USED,
  MSG_DUPLICATE_PROJECT,
  MSG_SIMILAR_PROJECT_NAME,
  type ExistingDocumentOwnershipRecord,
  type ExistingProjectIdentityRecord,
} from '../../src/lib/uboq/document-ownership-guard';

function makeBoqWorkbookBuffer(rows: Array<Array<string | number>>, reorderCols = false): Buffer {
  const aoa = reorderCols
    ? rows.map((r) => [r[1], r[0], r[3], r[2], r[4], r[5]]) // Reorder Description/Item and Qty/Unit
    : rows;
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
}

function sha256(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function main() {
  const existingProjects: ExistingProjectIdentityRecord[] = [
    {
      id: 'proj-approved-1',
      name: 'PGH HVAC Modernization',
      projectCategory: 'GOVERNMENT',
      client: 'UP-Philippine General Hospital',
      contractNumber: 'PGH-2026-HVAC-001',
      contractAmount: 43106674.89,
      boqLocked: true,
      hasApprovedBaseline: true,
      actorCanAccess: true,
    },
    {
      id: 'proj-secret-2',
      name: 'Confidential Hospital Wing',
      projectCategory: 'GOVERNMENT',
      client: 'DOH Central Office',
      contractNumber: 'DOH-2026-CONF-999',
      contractAmount: 12000000,
      boqLocked: true,
      hasApprovedBaseline: true,
      actorCanAccess: false,
    },
  ];

  // 01 & 02: Same verified contract entered twice (same name OR changed project name) -> BLOCK
  const dupSameName = evaluateProjectCreationIdentity(
    { name: 'PGH HVAC Modernization', sector: 'GOVERNMENT', client: 'UP-Philippine General Hospital', contractNumber: 'PGH-2026-HVAC-001' },
    existingProjects
  );
  assert.equal(dupSameName.decision, 'BLOCK_CONFIRMED_DUPLICATE_CONTRACT');
  assert.equal(dupSameName.message, MSG_DUPLICATE_PROJECT);
  assert.equal(dupSameName.existingProjectId, 'proj-approved-1');

  const dupChangedName = evaluateProjectCreationIdentity(
    { name: 'Completely Renamed HVAC Contract', sector: 'GOVERNMENT', client: 'UP-Philippine General Hospital', contractNumber: 'PGH-2026-HVAC-001' },
    existingProjects
  );
  assert.equal(dupChangedName.decision, 'BLOCK_CONFIRMED_DUPLICATE_CONTRACT');

  // 03 & 04: Similar name / same client with DIFFERENT verified contract lot -> ALLOW
  const diffLot = evaluateProjectCreationIdentity(
    { name: 'PGH HVAC Modernization Phase 2', sector: 'GOVERNMENT', client: 'UP-Philippine General Hospital', contractNumber: 'PGH-2026-HVAC-002' },
    existingProjects
  );
  assert.equal(diffLot.decision, 'ALLOW_DIFFERENT_CONTRACT');

  // Similar name WITHOUT distinct verified contract ref -> WARN (not hard-block!)
  const simNameWarn = evaluateProjectCreationIdentity(
    { name: 'PGH HVAC Modernization Improvement', sector: 'GOVERNMENT', client: 'UP-Philippine General Hospital', contractNumber: '' },
    existingProjects
  );
  assert.equal(simNameWarn.decision, 'WARN_SIMILAR_NAME');
  assert.equal(simNameWarn.message, MSG_SIMILAR_PROJECT_NAME);

  // 05: Missing contract info & distinct name -> ALLOW safe provisional creation
  const provisional = evaluateProjectCreationIdentity(
    { name: 'New Regional Warehouse', sector: 'PRIVATE', client: 'Acme Logistics', contractNumber: '' },
    existingProjects
  );
  assert.equal(provisional.decision, 'ALLOW_PROVISIONAL');
  assert.equal(provisional.identityState, 'PROVISIONAL');

  // 21 (Project Privacy): Unauthorized user blocked on confidential project gets NO existingProjectId leakage
  const unauthDup = evaluateProjectCreationIdentity(
    { name: 'Other Name', sector: 'GOVERNMENT', client: 'DOH Central Office', contractNumber: 'DOH-2026-CONF-999' },
    existingProjects
  );
  assert.equal(unauthDup.decision, 'BLOCK_CONFIRMED_DUPLICATE_CONTRACT');
  assert.equal(unauthDup.existingProjectId, null, 'Must NOT leak unauthorized project ID');
  assert.equal(unauthDup.canOpenExistingProject, false);
  console.log('PASS [1/4]: Project identity rules (duplicate block, similar-name warn, different lot allow, provisional allow, privacy)');

  // Build canonical BOQ + reordered/reformatted variant + generic blank template
  const baseRows: Array<Array<string | number>> = [
    ['Item No.', 'Description', 'Unit', 'Qty', 'Unit Price', 'Amount'],
    ['A.1', 'Supply & Install VRF Outdoor Unit 20HP', 'units', 4, 250000, 1000000],
    ['A.2', 'Supply & Install Copper Refrigerant Piping', 'm', 200, 1500, 300000],
  ];
  const boqBuf1 = makeBoqWorkbookBuffer(baseRows, false);
  const boqBufReordered = makeBoqWorkbookBuffer(baseRows, true);
  assert.notEqual(sha256(boqBuf1), sha256(boqBufReordered), 'Reordered workbook must have different binary SHA-256');

  const ext1 = await extractUniversalDocumentPackage('Original_Awarded_BOQ.xlsx', boqBuf1);
  const extReordered = await extractUniversalDocumentPackage('Renamed_Reordered_Copy.xlsx', boqBufReordered);
  const fp1 = computeCanonicalDocumentFingerprint({ boqVerification: ext1.awardedBoqVerification, extractionVerified: true });
  const fpReordered = computeCanonicalDocumentFingerprint({ boqVerification: extReordered.awardedBoqVerification, extractionVerified: true });
  assert.ok(fp1.boqStructureHash && fp1.boqStructureHash === fpReordered.boqStructureHash, 'Reordered/renamed BOQ must produce identical canonical BOQ fingerprint');

  const existingDocs: ExistingDocumentOwnershipRecord[] = [
    {
      documentId: 'doc-approved-boq',
      projectId: 'proj-approved-1',
      sha256Hash: sha256(boqBuf1),
      documentRole: 'CONTRACT_BOQ',
      isProjectApprovedOrVerified: true,
      actorCanAccessOwningProject: true,
      projectContractRefs: ['PGH-2026-HVAC-001'],
      fingerprint: fp1,
    },
    {
      documentId: 'doc-secret-boq',
      projectId: 'proj-secret-2',
      sha256Hash: 'b'.repeat(64),
      documentRole: 'CONTRACT_BOQ',
      isProjectApprovedOrVerified: true,
      actorCanAccessOwningProject: false,
      projectContractRefs: ['DOH-2026-CONF-999'],
      fingerprint: null,
    },
    {
      documentId: 'doc-provisional-boq',
      projectId: 'proj-provisional-3',
      sha256Hash: 'c'.repeat(64),
      documentRole: 'CONTRACT_BOQ',
      isProjectApprovedOrVerified: false,
      actorCanAccessOwningProject: true,
      projectContractRefs: [],
      fingerprint: null,
    },
  ];

  // 07 & 08: Same file reuploaded (even renamed) to SAME project -> idempotent reuse
  const sameProj = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-approved-1',
    incomingSha256: sha256(boqBuf1),
    incomingRole: 'CONTRACT_BOQ',
    incomingFingerprint: fp1,
    existingDocuments: existingDocs,
  });
  assert.equal(sameProj.decision, 'ALLOW_SAME_PROJECT_IDEMPOTENT');

  // 09, 10, 11: Exact file OR renamed OR column-reordered BOQ uploaded to ANOTHER project -> HARD BLOCK (HTTP 422, no override!)
  const crossExact = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-new-99',
    incomingSha256: sha256(boqBuf1),
    incomingRole: 'CONTRACT_BOQ',
    incomingFingerprint: fp1,
    allowDuplicateNewRevision: true,
    existingDocuments: existingDocs,
  });
  assert.equal(crossExact.decision, 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE');
  assert.equal(crossExact.httpStatus, 422);
  assert.equal(crossExact.overridePermitted, false);
  assert.equal(crossExact.message, MSG_DOCUMENT_ALREADY_USED);

  const crossReordered = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-new-99',
    incomingSha256: sha256(boqBufReordered),
    incomingRole: 'CONTRACT_BOQ',
    incomingFingerprint: fpReordered,
    existingDocuments: existingDocs,
  });
  assert.equal(crossReordered.decision, 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE');
  assert.equal(crossReordered.matchBasis, 'CANONICAL_BOQ_CONTENT');
  assert.equal(crossReordered.httpStatus, 422);
  console.log('PASS [2/4]: Exact, renamed, and column-reordered cross-project BOQ duplicates HARD BLOCKED (HTTP 422, zero override)');

  // 12, 13, 14: Cross-format PDF -> JPEG/OCR contract match AND foreign contract ID -> HARD BLOCK
  const contractPdfText =
    'CONTRACT AGREEMENT\nContract Reference: PGH-2026-HVAC-001\nClient: UP-Philippine General Hospital\nAwarded Contractor: JEJORS CONSTRUCTION CORPORATION\nContract Amount: PHP 43,106,674.89\nCommencement Date: 2026-11-23';
  const pdfDoc = extractContractDocumentFromPages(
    'Contract_Agreement.pdf',
    [{ pageNumber: 1, text: contractPdfText, extractionMethod: 'NATIVE_PDF' }]
  );
  const jpgDoc = extractContractDocumentFromPages(
    'Rescanned_Contract_Page1.jpg',
    [{ pageNumber: 1, text: contractPdfText, extractionMethod: 'OCR_RASTER' }]
  );
  const fpPdf = computeCanonicalDocumentFingerprint({ contractExtraction: pdfDoc, extractedText: contractPdfText, extractionVerified: true });
  const fpJpg = computeCanonicalDocumentFingerprint({ contractExtraction: jpgDoc, extractedText: contractPdfText, extractionVerified: true });
  assert.ok(fpPdf.contractIdentityHash && fpPdf.contractIdentityHash === fpJpg.contractIdentityHash, 'PDF and rescanned JPEG must share canonical contract identity hash');

  const crossFormatBlock = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-new-99',
    incomingSha256: 'd'.repeat(64),
    incomingRole: 'CONTRACT',
    incomingFingerprint: fpJpg,
    existingDocuments: [
      ...existingDocs,
      {
        documentId: 'doc-approved-pdf',
        projectId: 'proj-approved-1',
        sha256Hash: 'e'.repeat(64),
        documentRole: 'CONTRACT',
        isProjectApprovedOrVerified: true,
        actorCanAccessOwningProject: true,
        projectContractRefs: ['PGH-2026-HVAC-001'],
        fingerprint: fpPdf,
      },
    ],
  });
  assert.equal(crossFormatBlock.decision, 'HARD_BLOCK_CROSS_PROJECT_DUPLICATE');
  assert.equal(crossFormatBlock.matchBasis, 'CANONICAL_CONTRACT_CONTENT');

  // Foreign approved contract ID with unauthorized owning project -> HARD BLOCK with ZERO privacy leakage
  const foreignRefBlock = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-new-99',
    incomingSha256: 'f'.repeat(64),
    incomingRole: 'CONTRACT',
    incomingFingerprint: {
      kind: 'CONTRACT_SUBSTANTIVE',
      boqStructureHash: null,
      contractIdentityHash: null,
      normalizedTextHash: null,
      contractRefs: ['DOH2026CONF999'],
      payItemCount: 0,
      recalculatedTotal: null,
      isGenericTemplate: false,
      substantiveSignalsCount: 2,
    },
    existingDocuments: existingDocs,
  });
  assert.equal(foreignRefBlock.decision, 'HARD_BLOCK_FOREIGN_CONTRACT_IDENTITY');
  assert.equal(foreignRefBlock.owningProjectId, null, 'Unauthorized user must NOT see confidential owningProjectId');
  assert.equal(foreignRefBlock.canOpenExistingProject, false);
  console.log('PASS [3/4]: Cross-format PDF->JPEG contract duplicate & foreign contract ID HARD BLOCKED with zero privacy leakage');

  // 15, 16: Generic blank template (headings only, zero priced contract items) -> ALLOWED
  const blankTemplateBuf = makeBoqWorkbookBuffer([['Item No.', 'Description', 'Unit', 'Qty', 'Unit Price', 'Amount']], false);
  const extBlank = await extractUniversalDocumentPackage('Blank_BOQ_Template.xlsx', blankTemplateBuf);
  const fpBlank = computeCanonicalDocumentFingerprint({ boqVerification: extBlank.awardedBoqVerification, extractionVerified: true });
  assert.equal(fpBlank.isGenericTemplate, true);
  const blankDecision = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-new-99',
    incomingSha256: sha256(blankTemplateBuf),
    incomingRole: 'CONTRACT_BOQ',
    incomingFingerprint: fpBlank,
    existingDocuments: existingDocs,
  });
  assert.equal(blankDecision.decision, 'ALLOW_GENERIC_TEMPLATE');

  // 17 & Case H: Match in an UNAPPROVED/provisional project -> HOLD (HTTP 409), never silent accept
  const provisionalHold = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-new-99',
    incomingSha256: 'c'.repeat(64),
    incomingRole: 'CONTRACT_BOQ',
    incomingFingerprint: fp1,
    existingDocuments: existingDocs,
  });
  assert.equal(provisionalHold.decision, 'HOLD_UNCERTAIN_OWNERSHIP');
  assert.equal(provisionalHold.httpStatus, 409);

  // 19: Legitimate new revision on SAME project -> ALLOWED
  const newRev = evaluateCrossProjectDocumentOwnership({
    selectedProjectId: 'proj-approved-1',
    incomingSha256: '9'.repeat(64),
    incomingRole: 'CONTRACT_BOQ',
    incomingFingerprint: { ...fp1, boqStructureHash: '8'.repeat(64) },
    allowDuplicateNewRevision: true,
    existingDocuments: existingDocs,
  });
  assert.equal(newRev.decision, 'ALLOW_SAME_PROJECT_REVISION');
  console.log('PASS [4/4]: Generic blank template allowed, provisional conflict held (409), same-project revision allowed');

  console.log('\nALL PROJECT IDENTITY & APPROVED-DOCUMENT OWNERSHIP GUARD TESTS PASSED.');
}

main().catch((err) => {
  console.error('OWNERSHIP GUARD TEST FAILED:', err);
  process.exit(1);
});
