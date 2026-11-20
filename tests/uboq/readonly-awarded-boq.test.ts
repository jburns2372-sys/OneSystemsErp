/**
 * Focused verification for removing obsolete Awarded BOQ per-item approval UI & workflow dependency:
 * 1. Real 441-entry PGH workbook: ZERO manual item approvals, "(2)" is HEADER_META (never pay item or review exception),
 *    final line amounts match Column Q (direct + indirect), 0 discrepancies, official contract amount not invented.
 * 2. Synthetic 1,050-entry Awarded BOQ: ZERO manual item approvals, exact totals, 0 discrepancies.
 * 3. Awarded BOQ page (`src/app/projects/[id]/uboq/page.tsx`) renders ReadOnlyAwardedBoqTable (not VisualMappingReviewClient
 *    or SnapshotApprovalPanel) for CONTRACT_BOQ while preserving separate review UI for draft estimates / variations.
 * 4. July Project Workspace (`src/app/projects/[id]/page.tsx`) renders ReadOnlyAwardedBoqTable when extracted Awarded BOQ
 *    exists and AwardedBOQItem rows have not yet been populated.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as XLSX from 'xlsx';
import {
  classifyAwardedBoqRow,
  reconcileImportedAwardedBoqCandidates,
} from '../../src/lib/uboq/awarded-boq-reconciler';
import { extractUniversalDocumentPackage } from '../../src/lib/uboq/intake/parsers';
import { canConvertUom, normalizeUom } from '../../src/lib/uboq/uom-registry';

const WORKTREE_ROOT = process.cwd();
const PGH_XLSX_PATH =
  'C:\\Users\\user\\.gemini\\antigravity\\brain\\b35617c7-9740-4aa7-a239-0ffdca5619a7\\scratch\\ref-kit-test\\03_PGH_Reference\\PGH_Awarded_BOQ.xlsx';

async function testSingleCellAndMultiCellColumnLegends(): Promise<void> {
  assert.equal(
    classifyAwardedBoqRow({
      itemCode: null,
      description: '(2)',
      unit: null,
      quantity: null,
      unitPrice: null,
      lineAmount: null,
      rawTextValues: ['(2)'],
    }),
    'HEADER_META',
    'Single-cell column legend "(2)" must be classified as HEADER_META'
  );

  assert.equal(
    classifyAwardedBoqRow({
      itemCode: '(1)',
      description: '(2)',
      unit: '(3)',
      quantity: -4,
      unitPrice: -5,
      lineAmount: -15,
      rawTextValues: ['(1)', '(2)', '(3)', '(4)', '(5)'],
    }),
    'HEADER_META',
    'Multi-column legend "(1) (2) (3)" must be HEADER_META even if accounting-paren numbers were parsed'
  );

  const recon = reconcileImportedAwardedBoqCandidates([
    {
      id: 'legend-row',
      sourceRowNumber: 7,
      sourceCellRef: 'BOQ!A7',
      sheetOrPageRef: 'BOQ',
      rawFormulaText: null,
      mappedFields: { item_code: '(1)', work_description: '(2)', unit: '(3)', approved_qty: -4, contract_line_amount: -15 },
    },
    {
      id: 'item-1',
      sourceRowNumber: 8,
      sourceCellRef: 'BOQ!A8',
      sheetOrPageRef: 'BOQ',
      rawFormulaText: null,
      mappedFields: {
        item_code: '100',
        work_description: 'Concrete Works',
        unit: 'cu.m.',
        approved_qty: 10,
        contract_unit_rate: 5000,
        contract_line_amount: 50000,
      },
    },
  ], { officialAwardedContractAmount: 50000 });

  assert.equal(recon.status, 'VERIFIED_MATCH');
  assert.equal(recon.counts.payItems, 1);
  assert.equal(recon.counts.discrepancies, 0);
  const legendClassified = recon.classifiedRows.find((r) => r.description === '(2)');
  assert.ok(legendClassified, 'Legend row should be present as HEADER_META');
  assert.equal(legendClassified!.classification, 'HEADER_META');
  assert.equal(legendClassified!.quantity, null, 'HEADER_META quantity must be null');
  assert.equal(legendClassified!.lineAmount, null, 'HEADER_META lineAmount must be null');
  assert.equal(legendClassified!.hasDiscrepancy, false);
}

async function testReal441EntryPghWorkbookZeroApprovals(): Promise<void> {
  if (!fs.existsSync(PGH_XLSX_PATH)) {
    console.log('SKIP PGH real workbook (file not present at local scratch path)');
    return;
  }
  const buf = fs.readFileSync(PGH_XLSX_PATH);
  const extracted = await extractUniversalDocumentPackage('PGH_Awarded_BOQ.xlsx', buf);
  assert.equal(extracted.blockingErrors.length, 0);
  assert.equal(extracted.candidates.length, 441, 'PGH workbook should extract all 441 rows');

  const reviewCount = extracted.candidates.filter((c) => c.requiresHumanReview).length;
  assert.equal(reviewCount, 0, 'Real 441-entry PGH Awarded BOQ must require ZERO manual item approvals');

  const row7 = extracted.candidates.find((c) => c.sourceCellRef === 'BOQ!A7');
  assert.ok(row7, 'BOQ!A7 legend row should exist');
  assert.equal(row7!.rowClassification, 'HEADER_META');
  assert.equal(row7!.requiresHumanReview, false);

  // Verify final line amount on DPWH/PGH row BOQ!A166 matches Column Q (direct + indirect = 550,873.40), not Column P (113,672.29)
  const row166 = extracted.candidates.find((c) => c.sourceCellRef === 'BOQ!A166');
  assert.ok(row166, 'BOQ!A166 should exist');
  assert.equal(Math.round(Number(row166!.mappedFields.contract_line_amount) * 100) / 100, 550873.4);

  const verif = extracted.awardedBoqVerification!;
  assert.equal(verif.calculationCheck, 'PASS');
  assert.equal(verif.formulaCheck, 'PASS');
  assert.equal(verif.counts.payItems, 326);
  assert.equal(verif.counts.discrepancies, 0);
  assert.equal(verif.officialAwardedContractAmount, null, 'Must never invent official contract amount');
  assert.equal(verif.outcomeCategory, 'OFFICIAL_CONTRACT_AMOUNT_REQUIRED');
  const legendInVerif = verif.classifiedRows.find((r) => r.description === '(2)');
  assert.ok(legendInVerif);
  assert.equal(legendInVerif!.classification, 'HEADER_META');
  assert.equal(legendInVerif!.quantity, null);
  assert.equal(legendInVerif!.lineAmount, null);

  // Verify every priced PGH HVAC unit normalizes cleanly (ZERO VAL-03 UBOQ_UNKNOWN_UOM blocking errors)
  const unknownUnits: string[] = [];
  for (const row of verif.classifiedRows) {
    if (row.classification !== 'PAY_ITEM' || !row.unit) continue;
    try {
      normalizeUom(row.unit, row.description);
    } catch {
      unknownUnits.push(row.unit);
    }
  }
  assert.deepEqual(unknownUnits, [], `All PGH HVAC pay-item units must normalize without VAL-03 errors; unknown: ${unknownUnits.join(', ')}`);
  // Distinct discrete pack units must remain non-convertible to preserve UOM safety
  assert.equal(canConvertUom('tank', 'roll'), false);
  assert.equal(canConvertUom('bottle', 'length_6m'), false);
}

async function testSynthetic1050EntryBoqZeroApprovals(): Promise<void> {
  const aoa: Array<Array<string | number | { f: string; v: number }>> = [
    ['Item No.', 'Description', 'Unit', 'Qty', 'Unit Price', 'Amount'],
    ['(1)', '(2)', '(3)', '(4)', '(5)', '(6)'],
  ];
  let expectedTotal = 0;
  let currentRow = 3; // 1-based Excel row index

  for (let section = 1; section <= 5; section++) {
    aoa.push([`PART ${section}`, `SECTION ${section} WORKS`, '', '', '', '']);
    currentRow++;
    const sectionStart = currentRow;
    let sectionSum = 0;
    for (let i = 1; i <= 210; i++) {
      const idx = (section - 1) * 210 + i;
      const qty = (i % 25) + 1;
      const rate = 100 + (idx % 50) * 10;
      const amt = qty * rate;
      sectionSum += amt;
      expectedTotal += amt;
      aoa.push([
        `ITEM-${String(idx).padStart(4, '0')}`,
        `Synthetic Structural Work Item ${idx}`,
        'cu.m.',
        qty,
        rate,
        { f: `D${currentRow}*E${currentRow}`, v: amt },
      ]);
      currentRow++;
    }
    const sectionEnd = currentRow - 1;
    aoa.push(['', `Subtotal Section ${section}`, '', '', '', { f: `SUM(F${sectionStart}:F${sectionEnd})`, v: sectionSum }]);
    currentRow++;
  }
  aoa.push(['', 'GRAND TOTAL', '', '', '', expectedTotal]);

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'BOQ');
  const buf = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

  const extracted = await extractUniversalDocumentPackage('Synthetic_1050_Awarded_BOQ.xlsx', buf);
  assert.equal(extracted.blockingErrors.length, 0);
  const reviewCount = extracted.candidates.filter((c) => c.requiresHumanReview).length;
  assert.equal(reviewCount, 0, 'Synthetic 1,050-entry BOQ must require ZERO manual item approvals');

  const verif = extracted.awardedBoqVerification!;
  assert.equal(verif.calculationCheck, 'PASS');
  assert.equal(verif.formulaCheck, 'PASS');
  assert.equal(verif.counts.payItems, 1050);
  assert.equal(verif.counts.discrepancies, 0);
  assert.equal(verif.recalculatedTotal, expectedTotal);
  assert.equal(verif.workbookStatedGrandTotal, expectedTotal);

  const reconciled = reconcileImportedAwardedBoqCandidates(
    extracted.candidates.map((c, idx) => ({
      id: `synth-${idx}`,
      sourceRowNumber: c.sourceRowNumber,
      sourceCellRef: c.sourceCellRef,
      sheetOrPageRef: c.sheetOrPageRef,
      rawFormulaText: Object.keys(c.rawFormulas).length > 0 ? JSON.stringify(c.rawFormulas) : null,
      mappedFields: c.mappedFields,
      rowClassification: c.rowClassification ?? null,
    })),
    {
      officialAwardedContractAmount: expectedTotal,
      persistedWorkbookSummary: verif,
    }
  );
  assert.equal(reconciled.status, 'VERIFIED_MATCH');
  assert.equal(reconciled.counts.payItems, 1050);
  assert.equal(reconciled.counts.discrepancies, 0);
}

async function testUiAndWorkspaceWiringStaticGuards(): Promise<void> {
  const uboqPageSrc = fs.readFileSync(path.join(WORKTREE_ROOT, 'src/app/projects/[id]/uboq/page.tsx'), 'utf8');
  assert.ok(uboqPageSrc.includes('ReadOnlyAwardedBoqTable'), 'uboq/page.tsx must render ReadOnlyAwardedBoqTable');
  assert.ok(
    uboqPageSrc.includes('isDraftEstimateOrVariationReview'),
    'uboq/page.tsx must gate VisualMappingReviewClient & SnapshotApprovalPanel strictly to draft estimates / variations'
  );

  const readOnlySrc = fs.readFileSync(
    path.join(WORKTREE_ROOT, 'src/app/projects/[id]/uboq/ReadOnlyAwardedBoqTable.tsx'),
    'utf8'
  );
  for (const forbidden of ['Needs Review', 'Save Draft', 'Submit / Approve', 'Accept All', 'reviewNotes']) {
    assert.ok(!readOnlySrc.includes(forbidden), `ReadOnlyAwardedBoqTable must NOT contain obsolete approval control: ${forbidden}`);
  }

  const julyWorkspaceSrc = fs.readFileSync(path.join(WORKTREE_ROOT, 'src/app/projects/[id]/page.tsx'), 'utf8');
  assert.ok(
    julyWorkspaceSrc.includes('ReadOnlyAwardedBoqTable'),
    'July Project Workspace must display extracted Awarded BOQ via ReadOnlyAwardedBoqTable when AwardedBOQItem is not yet populated'
  );
}

async function main() {
  const tests: Array<[string, () => Promise<void>]> = [
    ['Column legend "(2)" classified as HEADER_META with null numbers', testSingleCellAndMultiCellColumnLegends],
    ['Real 441-entry PGH workbook requires ZERO manual item approvals & accurate Column Q totals', testReal441EntryPghWorkbookZeroApprovals],
    ['Synthetic 1,050-entry Awarded BOQ requires ZERO manual item approvals & exact reconciliation', testSynthetic1050EntryBoqZeroApprovals],
    ['Awarded BOQ UI & July Project Workspace read-only wiring guards', testUiAndWorkspaceWiringStaticGuards],
  ];

  let passed = 0;
  for (const [name, fn] of tests) {
    await fn();
    passed++;
    console.log(`PASS [${passed}/${tests.length}]: ${name}`);
  }
  console.log(`\nALL ${passed}/${tests.length} READ-ONLY AWARDED BOQ TESTS PASSED.`);
}

main().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
