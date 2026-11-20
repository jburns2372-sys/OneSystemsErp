import assert from 'node:assert/strict';
import test from 'node:test';
import {
  extractContractDocumentFromPages,
  parseContractDateToIso,
  reconcileProjectContractDocuments,
} from '../../src/lib/uboq/contract-document-extractor';
import {
  buildSignalsFromContractExtraction,
  classifyDocumentProjectRelevance,
  classifyExtractedFieldRelevance,
  extractWorkbookIdentitySignals,
} from '../../src/lib/uboq/project-relevance';
import {
  classifyAwardedBoqRow,
  classifyWorkbookWorksheetRole,
  reconcileImportedAwardedBoqCandidates,
  verifyAwardedBoqWorkbook,
  type ReconcilerWorksheetInput,
} from '../../src/lib/uboq/awarded-boq-reconciler';
import { extractUniversalDocumentPackage, mapHeaderToCanonicalField } from '../../src/lib/uboq/intake/parsers';
import { classifySourceSheet, extractReadableBoqRow } from '../../src/lib/uboq/ux-helpers';

// ---------------------------------------------------------------------------
// 1. TASK 1 (P9-GAP-CONTRACT-DOC-EXTRACT-01): Contract Content Extraction &
//    Cross-Document Reconciliation (NOT filenames alone)
// ---------------------------------------------------------------------------

test('Task 1: Extracts NOA, NTP, and Contract Agreement from content even with neutral filenames', () => {
  const caDoc = extractContractDocumentFromPages('neutral_upload_001.pdf', [
    {
      pageNumber: 1,
      extractionMethod: 'NATIVE_PDF',
      confidence: 0.96,
      text: [
        'SAMPLE / TEST ONLY - NOT A VALID AWARD, NTP OR EXECUTED CONTRACT',
        'SIMULATED DOCUMENT - UNSIGNED - FOR INTERNAL SYSTEM TESTING ONLY',
        'CONTRACT AGREEMENT',
        'Contract Agreement Ref CA-SYNTH-001-20261119',
        'Project and Contract ID SYNTH-001 / CT-SYNTH-01',
        'Project Name Two-Phase Structural Concrete Works (SYNTH-001)',
        'Project Owner / Client ILLUSTRATIVE CLIENT (SIMULATED PROJECT OWNER)',
        'Awarded Contractor ACME BUILDERS CORP',
        'Agreement Date 19 November 2026',
        'Contract Price (EX_VAT) ₱500,000.00 | Philippine pesos, excluding VAT',
      ].join('\n'),
    },
    {
      pageNumber: 2,
      extractionMethod: 'NATIVE_PDF',
      confidence: 0.96,
      text: 'The simulated Notice to Proceed specifies a test commencement of 23 November 2026. The sample construction period is 50 calendar days inclusive of commencement, with a target completion date of 11 January 2027.',
    },
    {
      pageNumber: 3,
      extractionMethod: 'NATIVE_PDF',
      confidence: 0.96,
      text: [
        'The ₱11,850,000 source-workbook ABC described elsewhere is an unverified reference estimate for a different illustrative source and must not be used as this award amount.',
        'Notice of Award NOA-SYNTH-001-20261119 | 19 November 2026',
        'Contract Agreement CA-SYNTH-001-20261119 | 19 November 2026',
        'Notice to Proceed NTP-SYNTH-001-20261119 | 19 November 2026',
        'No signature affixed',
      ].join('\n'),
    },
  ]);

  const noaDoc = extractContractDocumentFromPages('scan_img_a.jpg', [
    {
      pageNumber: 1,
      extractionMethod: 'OCR_RASTER',
      confidence: 0.93,
      text: [
        'ILLUSTRATIVE CLIENT | SYNTH-001',
        'SIMULATED PROJECT OWNER | SAMPLE / TEST ONLY',
        'Reference No. | NOA-SYNTH-001-20261119',
        'Date Issued | 19 November 2026',
        'TO: ACME BUILDERS CORP',
        'SUBJECT: Notice of Award - Two-Phase Structural Concrete Works (SYNTH-001)',
        'Project / Contract ID | SYNTH-001 / CT-SYNTH-01',
        'Contract Agreement | CA-SYNTH-001-20261119',
        'Awarded Contractor | ACME BUILDERS CORP',
        'Award Amount | $500,000.00 (EXCLUSIVE OF VAT)',
        'SIMULATED DOCUMENT - UNSIGNED',
      ].join('\n'),
    },
  ]);

  const ntpDoc = extractContractDocumentFromPages('scan_img_b.jpg', [
    {
      pageNumber: 1,
      extractionMethod: 'OCR_RASTER',
      confidence: 0.93,
      text: [
        'ILLUSTRATIVE CLIENT | SYNTH-001',
        'SIMULATED PROJECT OWNER | SAMPLE / TEST ONLY',
        'Reference No. | NTP-SYNTH-001-20261119',
        'Date Issued | 19 November 2026',
        'TO: ACME BUILDERS CORP',
        'SUBJECT: Test Commencement - Two-Phase Structural Concrete Works (SYNTH-001)',
        'Project / Contract ID | SYNTH-001 / CT-SYNTH-01',
        'Notice of Award | NOA-SYNTH-001-20261119',
        'Contract Agreement | CA-SYNTH-001-20261119',
        'Authorized Start Date | 23 November 2026',
        'Contract Period | 50 calendar days (including the start date)',
        'Target Completion | 11 January 2027',
        'The sample contract value remains 500,000.00 exclusive of VAT.',
        'SIMULATED DOCUMENT - UNSIGNED',
      ].join('\n'),
    },
  ]);

  assert.equal(caDoc.detectedKind, 'CONTRACT_AGREEMENT');
  assert.equal(noaDoc.detectedKind, 'NOTICE_OF_AWARD');
  assert.equal(ntpDoc.detectedKind, 'NOTICE_TO_PROCEED');
  assert.equal(caDoc.authorityStatus, 'TEST_ONLY_UNSIGNED');
  assert.equal(caDoc.canAuthorizeLiveContract, false);
  assert.equal(caDoc.fields.awardedAmount?.value, 500000);
  assert.equal(caDoc.fields.commencementDate?.value, '2026-11-23');
  assert.equal(caDoc.fields.contractDurationDays?.value, 50);
  assert.equal(caDoc.fields.completionDate?.value, '2027-01-11');

  const recon = reconcileProjectContractDocuments([caDoc, noaDoc, ntpDoc], { boqRecalculatedTotal: 500000 });
  assert.equal(recon.status, 'TEST_ONLY_RECONCILED');
  assert.equal(recon.canAuthorizeLiveContract, false);
  assert.equal(recon.hasTestOnlyOrUnsignedDocuments, true);
  assert.equal(recon.consensus.awardedAmount, 500000);
  assert.equal(recon.consensus.commencementDate, '2026-11-23');
  assert.equal(recon.consensus.contractDurationDays, 50);
  assert.equal(recon.consensus.completionDate, '2027-01-11');
  assert.equal(recon.boqReconciliation.matches, true);
  assert.equal(recon.discrepancies.filter((d) => d.severity === 'BLOCKING').length, 0);
});

test('Task 1: Detects contradictory contract amounts, schedule date mismatch, and missing fields without inventing values', () => {
  const docA = extractContractDocumentFromPages('noa.pdf', [
    {
      pageNumber: 1,
      extractionMethod: 'NATIVE_PDF',
      text: [
        'NOTICE OF AWARD',
        'Reference No. | NOA-CONFLICT-01',
        'Contract Agreement | CA-CONFLICT-01',
        'Awarded Contractor | ALPHA BUILDERS',
        'Award Amount | PHP 1,200,000.00',
      ].join('\n'),
    },
  ]);
  const docB = extractContractDocumentFromPages('ntp.pdf', [
    {
      pageNumber: 1,
      extractionMethod: 'NATIVE_PDF',
      text: [
        'NOTICE TO PROCEED',
        'Reference No. | NTP-CONFLICT-01',
        'Contract Agreement | CA-CONFLICT-01',
        'Awarded Contractor | BETA BUILDERS',
        'Contract Value | PHP 1,500,000.00',
        'Authorized Start Date | 2026-11-01',
        'Contract Period | 30 calendar days',
        'Target Completion | 2026-12-31',
      ].join('\n'),
    },
  ]);

  const recon = reconcileProjectContractDocuments([docA, docB], { boqRecalculatedTotal: 1200000 });
  assert.equal(recon.status, 'CONFLICT_FOUND');
  const codes = recon.discrepancies.map((d) => d.code);
  assert.ok(codes.includes('CONTRACT_AMOUNT_CONFLICT'));
  assert.ok(codes.includes('CONTRACTOR_CONFLICT'));
  assert.ok(codes.includes('SCHEDULE_DATE_DURATION_MISMATCH'));
  assert.equal(recon.consensus.clientName, null, 'Must never invent missing client name');
  assert.ok(recon.missingFields.includes('Client / Project Owner'));
  assert.equal(parseContractDateToIso('23 November 2026'), '2026-11-23');
});

// ---------------------------------------------------------------------------
// 2. TASK 2 & 3 (P9-DEF-MULTISHEET-SUM-01): Multi-Sheet BOQ Role Isolation,
//    SUMPRODUCT + ROW + MOD + "&" Concat Evaluation & Unfamiliar Client Layouts
// ---------------------------------------------------------------------------

test('Task 3: Isolates primary BOQ sheet, evaluates SUMPRODUCT/MOD/ROW and "&" text formulas with zero false errors', () => {
  const sheets: ReconcilerWorksheetInput[] = [
    {
      sheetName: '1. Program of Works (POW)',
      rows: [
        { rowNumber: 1, cells: [{ colNumber: 1, cellRef: 'A1', text: 'Contract ID:', numOrText: 'Contract ID:', formula: null }, { colNumber: 2, cellRef: 'B1', text: '26OA0001', numOrText: '26OA0001', formula: null }] },
        { rowNumber: 2, cells: [{ colNumber: 1, cellRef: 'A2', text: 'Approved Budget (ABC):', numOrText: 'Approved Budget (ABC):', formula: null }, { colNumber: 2, cellRef: 'B2', text: '500000', numOrText: 500000, formula: null }] },
        { rowNumber: 3, cells: [{ colNumber: 1, cellRef: 'A3', text: 'Description', numOrText: 'Description', formula: null }, { colNumber: 2, cellRef: 'B3', text: 'Amount', numOrText: 'Amount', formula: null }] },
        { rowNumber: 4, cells: [{ colNumber: 1, cellRef: 'A4', text: 'Part A', numOrText: 'Part A', formula: null }, { colNumber: 2, cellRef: 'B4', text: '200000', numOrText: 200000, formula: "='2. Bill of Quantities (BOQ)'!F6" }] },
      ],
    },
    {
      sheetName: '2. Bill of Quantities (BOQ)',
      rows: [
        {
          rowNumber: 1,
          cells: [
            { colNumber: 1, cellRef: 'A1', text: 'Pay Item No.', numOrText: 'Pay Item No.', formula: null },
            { colNumber: 2, cellRef: 'B1', text: 'Description of Works', numOrText: 'Description of Works', formula: null },
            { colNumber: 3, cellRef: 'C1', text: 'Unit', numOrText: 'Unit', formula: null },
            { colNumber: 4, cellRef: 'D1', text: 'BOQ Quantity', numOrText: 'BOQ Quantity', formula: null },
            { colNumber: 5, cellRef: 'E1', text: 'Total Unit Bid Price (Pesos)', numOrText: 'Total Unit Bid Price (Pesos)', formula: null },
            { colNumber: 6, cellRef: 'F1', text: 'Total Bid Amount (Pesos)', numOrText: 'Total Bid Amount (Pesos)', formula: null },
          ],
        },
        {
          rowNumber: 2,
          cells: [
            { colNumber: 1, cellRef: 'A2', text: '(1)', numOrText: '(1)', formula: null },
            { colNumber: 2, cellRef: 'B2', text: '(2)', numOrText: '(2)', formula: null },
            { colNumber: 3, cellRef: 'C2', text: '(3)', numOrText: '(3)', formula: null },
            { colNumber: 4, cellRef: 'D2', text: '(4)', numOrText: '(4)', formula: null },
            { colNumber: 5, cellRef: 'E2', text: '(5) = H+L', numOrText: '(5) = H+L', formula: null },
            { colNumber: 6, cellRef: 'F2', text: '(6) = D×M', numOrText: '(6) = D×M', formula: null },
          ],
        },
        {
          rowNumber: 3,
          cells: [
            { colNumber: 1, cellRef: 'A3', text: '900(1)c1', numOrText: '900(1)c1', formula: null },
            { colNumber: 2, cellRef: 'B3', text: 'Structural Concrete', numOrText: 'Structural Concrete', formula: null },
            { colNumber: 3, cellRef: 'C3', text: 'm³', numOrText: 'm³', formula: null },
            { colNumber: 4, cellRef: 'D3', text: '40', numOrText: 40, formula: null },
            { colNumber: 5, cellRef: 'E3', text: '5000', numOrText: 5000, formula: null },
            { colNumber: 6, cellRef: 'F3', text: '200000', numOrText: 200000, formula: '=ROUND(D3*E3, 2)' },
          ],
        },
        {
          rowNumber: 4,
          cells: [{ colNumber: 2, cellRef: 'B4', text: 'Unit Bid Price in Words: Five Thousand Pesos Only', numOrText: 'Unit Bid Price in Words: Five Thousand Pesos Only', formula: null }],
        },
        {
          rowNumber: 5,
          cells: [
            { colNumber: 1, cellRef: 'A5', text: 'SUBTOTAL PART A', numOrText: 'SUBTOTAL PART A', formula: null },
            { colNumber: 5, cellRef: 'E5', text: '200000', numOrText: 200000, formula: '=SUMPRODUCT((MOD(ROW(E3:E4)-ROW(E3),2)=0)*D3:D4, E3:E4)' },
            { colNumber: 6, cellRef: 'F5', text: '200000', numOrText: 200000, formula: '=SUM(F3:F4)' },
          ],
        },
        {
          rowNumber: 6,
          cells: [
            { colNumber: 1, cellRef: 'A6', text: 'GRAND TOTAL PROJECT BID', numOrText: 'GRAND TOTAL PROJECT BID', formula: null },
            { colNumber: 6, cellRef: 'F6', text: '200000', numOrText: 200000, formula: '=F5' },
          ],
        },
      ],
    },
    {
      sheetName: '3. DUPA - Concrete',
      rows: [
        { rowNumber: 1, cells: [{ colNumber: 1, cellRef: 'A1', text: 'Description', numOrText: 'Description', formula: null }, { colNumber: 2, cellRef: 'B1', text: 'Quantity', numOrText: 'Quantity', formula: null }, { colNumber: 3, cellRef: 'C1', text: 'Unit Cost', numOrText: 'Unit Cost', formula: null }, { colNumber: 4, cellRef: 'D1', text: 'Amount', numOrText: 'Amount', formula: null }] },
        { rowNumber: 2, cells: [{ colNumber: 1, cellRef: 'A2', text: 'Cement', numOrText: 'Cement', formula: null }, { colNumber: 2, cellRef: 'B2', text: '100', numOrText: 100, formula: null }, { colNumber: 3, cellRef: 'C2', text: '250', numOrText: 250, formula: null }, { colNumber: 4, cellRef: 'D2', text: '25000', numOrText: 25000, formula: '=B2*C2' }] },
      ],
    },
    {
      sheetName: '5. PERT-CPM & Gantt S-Curve',
      rows: [
        { rowNumber: 1, cells: [{ colNumber: 1, cellRef: 'A1', text: '15', numOrText: 15, formula: null }, { colNumber: 2, cellRef: 'B1', text: '0', numOrText: 0, formula: null }, { colNumber: 3, cellRef: 'C1', text: '15d Float', numOrText: '15d Float', formula: '=IF((A1-B1)=0, "0d (CRITICAL)", (A1-B1)&"d Float")' }] },
      ],
    },
  ];

  const report = verifyAwardedBoqWorkbook(sheets);
  assert.equal(report.calculationCheck, 'PASS');
  assert.equal(report.formulaCheck, 'PASS');
  assert.equal(report.recalculatedTotal, 200000, 'Must NOT double-count POW (200k) or DUPA (25k) into BOQ total');
  assert.equal(report.workbookStatedGrandTotal, 200000);
  assert.equal(report.officialAwardedContractAmount, null, 'Must NOT treat ABC or calculated bid as official contract award');
  assert.equal(report.outcomeCategory, 'OFFICIAL_CONTRACT_AMOUNT_REQUIRED');
  assert.equal(report.counts.discrepancies, 0);
  assert.equal(report.counts.brokenFormulas, 0);
  assert.equal(report.counts.unsupportedFormulas, 0);

  // Sheet role checks
  assert.equal(classifyWorkbookWorksheetRole('1. Program of Works (POW)', sheets.map((s) => s.sheetName)).role, 'PROGRAM_OF_WORKS');
  assert.equal(classifySourceSheet('1. Program of Works (POW)', null).kind, 'SUPPORTING');
  assert.equal(classifySourceSheet('2. Bill of Quantities (BOQ)', null).kind, 'BOQ');
});

test('Task 3: Never suppresses an unsupported formula that materially affects a BOQ amount', () => {
  const sheets: ReconcilerWorksheetInput[] = [
    {
      sheetName: 'BOQ',
      rows: [
        {
          rowNumber: 1,
          cells: [
            { colNumber: 1, cellRef: 'A1', text: 'Description', numOrText: 'Description', formula: null },
            { colNumber: 2, cellRef: 'B1', text: 'Quantity', numOrText: 'Quantity', formula: null },
            { colNumber: 3, cellRef: 'C1', text: 'Unit Cost', numOrText: 'Unit Cost', formula: null },
            { colNumber: 4, cellRef: 'D1', text: 'Amount', numOrText: 'Amount', formula: null },
          ],
        },
        {
          rowNumber: 2,
          cells: [
            { colNumber: 1, cellRef: 'A2', text: 'Concrete', numOrText: 'Concrete', formula: null },
            { colNumber: 2, cellRef: 'B2', text: '10', numOrText: 10, formula: null },
            { colNumber: 3, cellRef: 'C2', text: '500', numOrText: 500, formula: null },
            { colNumber: 4, cellRef: 'D2', text: '5000', numOrText: 5000, formula: '=XLOOKUP("A",A1:A2,B1:B2)*C2' },
          ],
        },
      ],
    },
  ];
  const report = verifyAwardedBoqWorkbook(sheets, { officialAwardedContractAmount: 5000 });
  assert.equal(report.formulaCheck, 'FAIL');
  assert.equal(report.counts.unsupportedFormulas, 1);
  assert.equal(report.outcomeCategory, 'UNABLE_TO_VERIFY');
});

// ---------------------------------------------------------------------------
// 3. TASK 4 (P9-DEF-RECON-META-01) & Unfamiliar Client Layout CSV Extraction
// ---------------------------------------------------------------------------

test('Task 4 & Unfamiliar Layout: Reordered columns, non-payable "By Client" notes, and VAT price component preserve rowClassification cleanly', async () => {
  // Unfamiliar column order & names + multi-row header + "By Client" note + VAT + duplicate item codes across distinct phases
  const csv = [
    'Work Phase,Line ID,Bill Item,UOM,Estimated Qty,Price Per Unit,Extended Price',
    'PHASE-01,L-001,900(1)c1 Structural Concrete,cu.m,40,5000,200000',
    'PHASE-02,L-002,900(1)c1 Structural Concrete,cu.m,60,5000,300000',
    'GENERAL,NOTE-1,LGU Building Permits,lot,1,,By Client',
    'GENERAL,VAT-1,12% Value Added Tax (VAT),,,,60000',
  ].join('\n');

  assert.equal(mapHeaderToCanonicalField('Work Phase'), 'phase_code');
  assert.equal(mapHeaderToCanonicalField('Bill Item'), 'work_description');
  assert.equal(mapHeaderToCanonicalField('Estimated Qty'), 'approved_qty');
  assert.equal(mapHeaderToCanonicalField('Price Per Unit'), 'contract_unit_rate');
  assert.equal(mapHeaderToCanonicalField('Extended Price'), 'contract_line_amount');

  const extracted = await extractUniversalDocumentPackage('client_custom_layout.csv', Buffer.from(csv, 'utf8'));
  assert.equal(extracted.candidates.length, 4);
  assert.equal(extracted.candidates[0].mappedFields.phase_code, 'PHASE-01');
  assert.equal(extracted.candidates[1].mappedFields.phase_code, 'PHASE-02');
  assert.equal(extracted.candidates[2].rowClassification, 'NOTE');
  assert.equal(extracted.candidates[2].requiresHumanReview, false, '"By Client" note must NOT trigger ambiguous numeric review');
  assert.equal(extracted.candidates[3].rowClassification, 'PRICE_COMPONENT');
  assert.equal(extracted.candidates[3].requiresHumanReview, false, 'VAT price component must NOT trigger missing qty/unit review');

  // Reconcile persisted candidates forwarding rowClassification (P9-DEF-RECON-META-01)
  const recon = reconcileImportedAwardedBoqCandidates(
    extracted.candidates.map((c, idx) => ({
      id: `c-${idx}`,
      sourceRowNumber: c.sourceRowNumber,
      sourceCellRef: c.sourceCellRef,
      sheetOrPageRef: c.sheetOrPageRef,
      rawFormulaText: null,
      mappedFields: c.mappedFields,
      rowClassification: c.rowClassification ?? null,
    })),
    { officialAwardedContractAmount: 560000 }
  );
  assert.equal(recon.status, 'VERIFIED_MATCH');
  assert.equal(recon.recalculatedTotal, 560000);
  assert.equal(recon.counts.payItems, 2);
  assert.equal(recon.counts.priceComponents, 1);
  assert.equal(recon.counts.headingsAndNotes, 1);
  assert.equal(recon.counts.discrepancies, 0);

  // Verify UX readable row helper also respects stored rowClassification without false missing-price issues
  const noteReadable = extractReadableBoqRow({
    id: 'c-2',
    sourceDocumentId: 'doc-1',
    sourceRowNumber: 4,
    sourceCellRef: 'CSV_SHEET_1!R4C1',
    rawHeadingText: null,
    mappedCanonicalId: 'work_description',
    rawValueText: 'LGU Building Permits',
    rawFormulaText: null,
    parsedJson: { mappedFields: extracted.candidates[2].mappedFields, rowClassification: 'NOTE' },
    confidenceScore: 0.98,
    extractionMethod: 'DETERMINISTIC_PARSER',
    requiresHumanReview: false,
    reviewDecision: 'AUTO_VERIFIED_DETERMINISTIC',
    reviewedById: null,
    reviewedAt: null,
    reviewNotes: null,
    sectionTitle: 'CSV_SHEET_1',
    sheetOrPageRef: 'CSV_SHEET_1',
  });
  assert.equal(noteReadable.issueSummary, null);

  // Verify genuine payable item with missing unit price IS still caught!
  assert.equal(
    classifyAwardedBoqRow({
      itemCode: '101',
      description: 'Excavation Works',
      unit: 'cu.m',
      quantity: 50,
      unitPrice: null,
      lineAmount: null,
      rawTextValues: ['101', 'Excavation Works', 'cu.m', '50'],
    }),
    'PAY_ITEM'
  );
});

// ---------------------------------------------------------------------------
// 4. MANDATORY PROJECT-RELEVANCE FILTERING TESTS
// ---------------------------------------------------------------------------

test('Project-Relevance: Classifies BELONGS_TO_PROJECT, RELEVANT_SUPPORTING_DOCUMENT, UNRELATED, and NEEDS_CONFIRMATION accurately', () => {
  const demoProject = {
    projectId: 'proj-demo-001',
    projectName: 'Two-Phase Structural Concrete Works (DEMO-001)',
    contractNumber: 'CA-DEMO-001-20261119',
    clientName: 'ILLUSTRATIVE CLIENT',
    knownReferences: ['DEMO-001', 'CT-DEMO-01'],
  };

  // 1. Matching project contract document -> BELONGS_TO_PROJECT
  const matchDoc = extractContractDocumentFromPages('contract.pdf', [
    {
      pageNumber: 1,
      extractionMethod: 'NATIVE_PDF',
      text: 'CONTRACT AGREEMENT\nContract Agreement Ref CA-DEMO-001-20261119\nProject Owner / Client ILLUSTRATIVE CLIENT\nContract Price ₱500,000.00\nUNSIGNED DEMO_ONLY',
    },
  ]);
  const relMatch = classifyDocumentProjectRelevance(demoProject, buildSignalsFromContractExtraction(matchDoc, 'CONTRACT'));
  assert.equal(relMatch.status, 'BELONGS_TO_PROJECT');
  assert.equal(relMatch.disposition, 'ATTACH_AND_PROCESS');

  // 2. Different project workbook (26OA0001 DPWH) uploaded into DEMO-001 -> UNRELATED (blocked!)
  const foreignWbSignals = extractWorkbookIdentitySignals('Project_Workbook.xlsx', [
    {
      sheetName: '1. Program of Works (POW)',
      rows: [
        { rowNumber: 1, cells: [{ colNumber: 1, cellRef: 'A1', text: 'Implementing Office:', numOrText: 'Implementing Office:', formula: null }, { colNumber: 2, cellRef: 'B1', text: 'DPWH National Capital Region', numOrText: 'DPWH National Capital Region', formula: null }] },
        { rowNumber: 2, cells: [{ colNumber: 1, cellRef: 'A2', text: 'Contract ID:', numOrText: 'Contract ID:', formula: null }, { colNumber: 2, cellRef: 'B2', text: '26OA0001', numOrText: '26OA0001', formula: null }] },
        { rowNumber: 3, cells: [{ colNumber: 1, cellRef: 'A3', text: 'Approved Budget (ABC):', numOrText: 'Approved Budget (ABC):', formula: null }, { colNumber: 2, cellRef: 'B3', text: '11850000', numOrText: 11850000, formula: null }] },
      ],
    },
  ]);
  const relForeign = classifyDocumentProjectRelevance(demoProject, foreignWbSignals);
  assert.equal(relForeign.status, 'UNRELATED');
  assert.equal(relForeign.disposition, 'REJECT_UNRELATED_DO_NOT_ATTACH');
  assert.ok(relForeign.conflictingSignals.length >= 1);

  // 3. Legitimate supporting document (e.g., structural drawing or DUPA) lacking a printed project name -> RELEVANT_SUPPORTING_DOCUMENT (never falsely rejected!)
  const relSupport = classifyDocumentProjectRelevance(demoProject, {
    fileName: 'rebar_detail_sheet.pdf',
    documentRole: 'DRAWING',
  });
  assert.equal(relSupport.status, 'RELEVANT_SUPPORTING_DOCUMENT');
  assert.equal(relSupport.disposition, 'ATTACH_AND_PROCESS');

  // 4. Uncertain unbranded BOQ/contract with no matching project identifiers -> NEEDS_CONFIRMATION
  const relUncertain = classifyDocumentProjectRelevance(demoProject, {
    fileName: 'unlabeled_scan.pdf',
    documentRole: 'CONTRACT_BOQ',
  });
  assert.equal(relUncertain.status, 'NEEDS_CONFIRMATION');
  assert.equal(relUncertain.disposition, 'HOLD_FOR_USER_CONFIRMATION');

  // 5. Field-level relevance: ABC is REFERENCE_ONLY_CALCULATION and disclaimed foreign amount is UNRELATED_PROJECT_INFO
  const fieldReport = classifyExtractedFieldRelevance({
    contractDoc: matchDoc,
    workbookSignals: foreignWbSignals,
    fullText: 'The ₱11,850,000 source-workbook ABC described elsewhere is an unverified reference estimate for a different illustrative source and must not be used as this award amount.',
  });
  assert.ok(fieldReport.ignoredReferenceFields.some((f) => f.fieldName === 'approvedBudgetAbc' && f.category === 'REFERENCE_ONLY_CALCULATION'));
  assert.ok(fieldReport.excludedUnrelatedFields.some((f) => f.value === 11850000 && f.category === 'UNRELATED_PROJECT_INFO'));
  assert.ok(fieldReport.ignoredReferenceFields.every((f) => f.usableAsOfficialContractAmount === false));
});
