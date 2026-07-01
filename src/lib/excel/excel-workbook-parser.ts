// @ts-nocheck
import ExcelJS from 'exceljs';
import { prisma } from '@/lib/prisma';
import { extractLayout } from './excel-layout-snapshot';
import { extractStyles } from './excel-style-extractor';

export async function parseWorkbook(
  buffer: Buffer,
  uploadedWorkbookFileId: string,
  projectId: string
) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  const sheet = workbook.getWorksheet('BOQ_DATA_ENTRY');
  if (!sheet) {
    throw new Error('Critical: Missing BOQ_DATA_ENTRY worksheet.');
  }

  // 1. Extract Layout
  const layout = extractLayout(sheet);
  await prisma.workbookLayoutSnapshot.create({
    data: {
      uploadedWorkbookFileId,
      sheetName: 'BOQ_DATA_ENTRY',
      columnWidthsJson: JSON.stringify(layout.columns),
      rowHeightsJson: JSON.stringify(layout.rows),
      mergedCellsJson: JSON.stringify(layout.merges),
    }
  });

  // 2. Extract Cell Snapshots
  const cellSnapshots: any[] = [];
  
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      // Only capture columns B to P (2 to 16) and rows up to roughly 200 to prevent infinite snapshotting
      if (colNumber >= 2 && colNumber <= 16 && rowNumber <= 500) {
        
        let rawValue = cell.value?.toString() || '';
        let displayValue = cell.text || '';
        let formula = cell.formula || cell.sharedFormula || '';
        let isFormula = !!cell.formula || !!cell.sharedFormula;

        if (typeof cell.value === 'object' && cell.value !== null) {
          if ('formula' in cell.value) {
            formula = (cell.value as any).formula;
            isFormula = true;
          }
          if ('result' in cell.value) {
            rawValue = (cell.value as any).result?.toString() || '';
          }
        }

        const styleData = extractStyles(cell);

        cellSnapshots.push({
          uploadedWorkbookFileId,
          sheetName: 'BOQ_DATA_ENTRY',
          cellAddress: cell.address,
          rowNumber,
          columnLetter: sheet.getColumn(colNumber).letter,
          rawValue: rawValue.substring(0, 1000), // Limit size just in case
          displayValue: displayValue.substring(0, 1000),
          formula: formula.substring(0, 1000),
          dataType: typeof cell.value,
          numberFormat: cell.numFmt || null,
          styleJson: JSON.stringify(styleData),
          isMerged: cell.isMerged,
          mergedRange: cell.master ? cell.master.address : null,
          isFormulaCell: isFormula,
          isEditableCell: isEditable(cell.address, rowNumber, colNumber)
        });
      }
    });
  });

  // Batch insert cell snapshots to avoid DB timeouts
  const chunkSize = 500;
  for (let i = 0; i < cellSnapshots.length; i += chunkSize) {
    const chunk = cellSnapshots.slice(i, i + chunkSize);
    await prisma.workbookCellSnapshot.createMany({ data: chunk });
  }

  return { layout, cellCount: cellSnapshots.length, workbook };
}

function isEditable(address: string, row: number, col: number): boolean {
  // B:H for item rows (14-161)
  if (row >= 14 && row <= 161 && col >= 2 && col <= 8) return true;
  // Specific percentage headers
  if (['J13', 'K13', 'L13'].includes(address)) return true;
  // Project info
  if (['C7', 'C8', 'C9'].includes(address)) return true;
  return false;
}
