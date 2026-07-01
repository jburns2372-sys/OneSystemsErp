// @ts-nocheck
import { Worksheet } from 'exceljs';
import { prisma } from '@/lib/prisma';

export async function validateFormulas(
  sheet: Worksheet,
  uploadedWorkbookFileId: string
) {
  let criticalErrors = 0;
  let warnings = 0;
  const validationRecords: any[] = [];

  const addValidation = (cellAddress: string, rowNumber: number | null, expected: string, actual: string | null, status: string, message: string) => {
    if (status === 'CRITICAL') criticalErrors++;
    if (status === 'WARNING') warnings++;
    validationRecords.push({
      uploadedWorkbookFileId,
      sheetName: 'BOQ_DATA_ENTRY',
      cellAddress,
      sourceRowNumber: rowNumber,
      expectedFormula: expected,
      actualFormula: actual,
      validationStatus: status,
      message
    });
  };

  // 1. Check required headers and percentages
  const ocmCell = sheet.getCell('J13');
  const cpCell = sheet.getCell('K13');
  const vatCell = sheet.getCell('L13');
  
  if (!ocmCell.value) addValidation('J13', 13, 'Number', null, 'CRITICAL', 'Missing OCM percentage');
  if (!cpCell.value) addValidation('K13', 13, 'Number', null, 'CRITICAL', 'Missing CP percentage');
  if (!vatCell.value) addValidation('L13', 13, 'Number', null, 'CRITICAL', 'Missing VAT percentage');

  // 2. Validate Row formulas
  let lastRow = 161; // Default
  for (let rowNum = 14; rowNum <= 500; rowNum++) {
    const row = sheet.getRow(rowNum);
    // Break if we hit grand total row (Grand Total usually says "GRAND TOTAL" in Column C or something, or it's just row 162)
    if (row.getCell(3).text?.toUpperCase().includes('GRAND TOTAL') || rowNum === 162) {
      lastRow = rowNum;
      break;
    }

    // Only validate formulas if the row has data (e.g. Item Number in Col B or Description in Col C)
    if (row.getCell(2).value || row.getCell(3).value) {
      // Validate Col I (Total Direct Cost)
      const colI = row.getCell(9);
      if (!colI.formula && !colI.sharedFormula && typeof colI.value !== 'object') {
        addValidation(`I${rowNum}`, rowNum, 'Formula', null, 'WARNING', 'Missing formula for Total Direct Cost. Found static value.');
      }
      
      const colO = row.getCell(15);
      if (!colO.formula && !colO.sharedFormula && typeof colO.value !== 'object') {
        addValidation(`O${rowNum}`, rowNum, 'Formula', null, 'WARNING', 'Missing formula for Amount. Found static value.');
      }
    }
  }

  // 3. Grand Total Formulas
  const totalRow = sheet.getRow(lastRow);
  const totalI = totalRow.getCell(9);
  if (!totalI.formula && !totalI.sharedFormula) {
    addValidation(`I${lastRow}`, lastRow, 'SUM(...)', null, 'CRITICAL', 'Missing grand total formula for Total Direct Cost.');
  }
  
  const totalO = totalRow.getCell(15);
  if (!totalO.formula && !totalO.sharedFormula) {
    addValidation(`O${lastRow}`, lastRow, 'SUM(...)', null, 'CRITICAL', 'Missing grand total formula for Total Amount.');
  }

  if (validationRecords.length > 0) {
    await prisma.workbookFormulaValidation.createMany({ data: validationRecords });
  }

  return {
    success: criticalErrors === 0,
    criticalErrors,
    warnings
  };
}
