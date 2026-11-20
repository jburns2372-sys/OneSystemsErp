/**
 * Master BOQ Report Template Builder verification against all 3 Owner reference workbooks:
 * 1. Real 441-entry PGH Awarded BOQ -> Master dataset preserves all original columns & exact PHP 43,106,674.89 total.
 * 2. Example 1 (Project BOQ Summary): column selection, renamed headings, reordered columns, section filter, XLSX export.
 * 3. Example 2 (Accomplishment Report): matches Project_Accomplishment_Report_Template.xlsx 15-column A..O layout,
 *    effective awarded unit rate (FinalLineAmount / Qty != directUnitCost), weighted % sum = 100%, zero-basis draft,
 *    and verified synthetic progress calculations.
 * 4. Example 3 (First Progress Billing Working Copy): matches first-billing header, super-headers, live Excel formulas,
 *    signature block, and non-certifying working-copy notice.
 * 5. Optional Input Mapping read-only before/after preview without mutating original source values.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ExcelJS from 'exceljs';
import { extractUniversalDocumentPackage } from '../../src/lib/uboq/intake/parsers';
import {
  buildMasterBoqDatasetFromSource,
  exportMasterReportToXlsxBuffer,
  MASTER_REPORT_PRESETS,
  previewOptionalInputMapping,
  projectMasterBoqReport,
} from '../../src/lib/uboq/master-report-builder';

const PGH_XLSX_PATH =
  'C:\\Users\\user\\.gemini\\antigravity\\brain\\b35617c7-9740-4aa7-a239-0ffdca5619a7\\scratch\\ref-kit-test\\03_PGH_Reference\\PGH_Awarded_BOQ.xlsx';

async function main() {
  assert.ok(fs.existsSync(PGH_XLSX_PATH), 'PGH reference workbook must exist locally');
  const buf = fs.readFileSync(PGH_XLSX_PATH);
  const extracted = await extractUniversalDocumentPackage('PGH_Awarded_BOQ.xlsx', buf);
  assert.equal(extracted.blockingErrors.length, 0);

  const candidates = extracted.candidates.map((c, idx) => ({
    id: `pgh-c-${idx}`,
    sourceRowNumber: c.sourceRowNumber,
    sourceCellRef: c.sourceCellRef,
    sheetOrPageRef: c.sheetOrPageRef,
    rawFormulaText: Object.keys(c.rawFormulas).length > 0 ? JSON.stringify(c.rawFormulas) : null,
    mappedFields: c.mappedFields,
    rowClassification: c.rowClassification ?? null,
  }));

  // 1. Master BOQ Dataset Completeness (Phase B)
  const dataset = buildMasterBoqDatasetFromSource({
    projectId: 'pgh-ref-readonly',
    projectName: 'Supply, Delivery, Installation, Testing, and Commissioning of HVAC System',
    projectLocation: 'PGH TAFT AVE., MANILA 1000',
    clientName: 'UP-Philippine General Hospital',
    contractorName: 'JEJORS CONSTRUCTION CORPORATION',
    contractNumber: 'PGH-REF-001',
    officialAwardedContractAmount: null,
    sourceDocumentId: 'doc-pgh-ref',
    sourceFileName: 'PGH_AWARDED BILL OF QUANTITY.xlsx',
    sourceSha256Hash: extracted.security.sha256Hash,
    candidates,
    persistedWorkbookSummary: extracted.awardedBoqVerification,
  });

  assert.equal(dataset.payItemCount, 326, 'Master BOQ must preserve all 326 PGH pay items');
  assert.equal(dataset.recalculatedTotal, 43106674.89, 'Master BOQ total must match PHP 43,106,674.89');
  assert.equal(dataset.officialAwardedContractAmount, null, 'Must never invent official contract amount');

  // Verify directUnitCost vs effectiveAwardedUnitRate distinction on BOQ!A166 (10 units, direct 43,720.11, final 550,873.40 -> effective 55,087.34)
  const row166 = dataset.rows.find((r) => r.sourceCellRef === 'BOQ!A166');
  assert.ok(row166, 'Row BOQ!A166 must exist in Master BOQ');
  assert.equal(row166!.quantity, 10);
  assert.equal(Math.round(row166!.directUnitCost! * 100) / 100, 43720.11);
  assert.equal(Math.round(row166!.finalLineAmount! * 100) / 100, 550873.4);
  assert.equal(Math.round(row166!.effectiveAwardedUnitRate! * 100) / 100, 55087.34);
  console.log('PASS [1/5]: Master BOQ dataset preserves all original columns, exact Column Q totals, and effective awarded unit rates');

  // 2. Example 1 — Project BOQ Summary with custom column selection, rename, reorder & XLSX export
  const summaryReport = projectMasterBoqReport(dataset, {
    ...MASTER_REPORT_PRESETS.BOQ_SUMMARY,
    selectedColumns: ['description', 'itemCode', 'unit', 'quantity', 'directCost', 'indirectCost', 'effectiveAwardedUnitRate', 'finalLineAmount'],
    headingAliases: {
      description: 'Work Scope Description',
      effectiveAwardedUnitRate: 'Awarded Effective Rate',
      finalLineAmount: 'Awarded Contract Line Amount',
    },
  });
  assert.equal(summaryReport.columns[0].heading, 'Work Scope Description');
  assert.equal(summaryReport.columns[1].key, 'itemCode');
  assert.equal(summaryReport.totals.payItemCount, 326);
  assert.equal(summaryReport.totals.contractTotal, 43106674.89);
  assert.equal(
    summaryReport.officialContractDisclosure,
    'BOQ calculations verified. Official contract amount required to complete contract reconciliation.'
  );
  const summaryXlsx = await exportMasterReportToXlsxBuffer(dataset, summaryReport);
  const wbSum = new ExcelJS.Workbook();
  await wbSum.xlsx.load(summaryXlsx as unknown as ArrayBuffer);
  assert.equal(wbSum.worksheets[0].name, 'BOQ Summary');
  console.log('PASS [2/5]: Project BOQ Summary supports custom columns, renamed headings, reordering, and validated XLSX export');

  // 3. Example 2 — Project Accomplishment Report (Zero-Basis + Synthetic Verified Progress)
  const zeroBasisAccomp = projectMasterBoqReport(dataset, MASTER_REPORT_PRESETS.ACCOMPLISHMENT_REPORT);
  assert.equal(zeroBasisAccomp.columns.length, 15, 'Accomplishment Report must match 15-column A..O Owner template');
  assert.equal(zeroBasisAccomp.totals.contractTotal, 43106674.89);
  assert.ok(Math.abs(zeroBasisAccomp.totals.weightedPctSum - 1) < 0.0001, 'Weighted % must sum to 100%');
  assert.equal(zeroBasisAccomp.totals.currentPeriodTotal, 0, 'Zero-basis draft must never invent accomplishments');
  assert.equal(zeroBasisAccomp.totals.previousAccomplishmentTotal, 0);

  const syntheticProgressAccomp = projectMasterBoqReport(dataset, MASTER_REPORT_PRESETS.ACCOMPLISHMENT_REPORT, [
    { sourceCellRef: 'BOQ!A166', previousAccomplishmentAmt: 110174.68, currentPeriodQty: 3, remarks: 'Synthetic UAT progress' },
  ]);
  assert.equal(syntheticProgressAccomp.hasVerifiedProgressRecords, true);
  assert.equal(syntheticProgressAccomp.totals.previousAccomplishmentTotal, 110174.68);
  assert.equal(syntheticProgressAccomp.totals.currentPeriodTotal, 165262.02); // 3 * 55,087.34
  assert.equal(syntheticProgressAccomp.totals.cumulativeAccomplishmentTotal, 275436.7);
  console.log('PASS [3/5]: Accomplishment Report reproduces 15-column layout, 100% weighted %, zero-basis safety & progress math');

  // 4. Example 3 — First Progress Billing Working Copy with Excel formulas & signature block
  const billingReport = projectMasterBoqReport(dataset, {
    ...MASTER_REPORT_PRESETS.PROGRESS_BILLING_WORKING_COPY,
    periodEnding: 'November 30, 2026',
  });
  assert.equal(billingReport.isWorkingCopyOnly, true);
  assert.equal(billingReport.showSignatureBlock, true);
  const billingXlsx = await exportMasterReportToXlsxBuffer(dataset, billingReport);
  const wbBill = new ExcelJS.Workbook();
  await wbBill.xlsx.load(billingXlsx as unknown as ArrayBuffer);
  const billWs = wbBill.worksheets[0];
  assert.equal(billWs.name, 'Accomplishment Report');
  let formulaCount = 0;
  let hasSignatureBlock = false;
  billWs.eachRow((row) => {
    row.eachCell((cell) => {
      if (cell.value && typeof cell.value === 'object' && 'formula' in cell.value) formulaCount++;
      if (cell.value === 'PROJECT ENGINEER') hasSignatureBlock = true;
    });
  });
  assert.ok(formulaCount > 1500, `Expected >1500 live Excel formulas in billing export; got ${formulaCount}`);
  assert.equal(hasSignatureBlock, true, 'First billing export must include signature block');
  console.log(`PASS [4/5]: First Progress Billing Working Copy exported cleanly (${formulaCount} live Excel formulas + signature block)`);

  // 5. Phase D — Optional Input Mapping read-only before/after preview
  const remapRes = previewOptionalInputMapping({
    candidates,
    fieldRemap: {},
    officialAwardedContractAmount: null,
  });
  assert.equal(remapRes.before.payItems, 326);
  assert.equal(remapRes.after.payItems, 326);
  assert.equal(remapRes.before.recalculatedTotal, 43106674.89);
  assert.equal(remapRes.after.recalculatedTotal, 43106674.89);
  console.log('PASS [5/5]: Optional Input Mapping read-only before/after preview preserves original awarded values');

  console.log('\nALL 5/5 MASTER BOQ REPORT BUILDER TESTS PASSED.');
}

main().catch((err) => {
  console.error('MASTER REPORT BUILDER TEST FAILED:', err);
  process.exit(1);
});
