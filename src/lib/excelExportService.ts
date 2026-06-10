import ExcelJS from "exceljs";

export async function exportFortuneSheetToExcelJS(sheetsData: any[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "PGH-PMS System";
  workbook.lastModifiedBy = "PGH-PMS System";
  workbook.created = new Date();
  workbook.modified = new Date();

  for (const sheetData of sheetsData) {
    const sheet = workbook.addWorksheet(sheetData.name || `Sheet${sheetData.index}`);
    
    if (sheetData.celldata) {
      for (const cell of sheetData.celldata) {
        const r = cell.r;
        const c = cell.c;
        const v = cell.v;
        if (!v) continue;

        const targetCell = sheet.getCell(r + 1, c + 1);
        
        // Handle values and formulas
        if (v.f) {
          targetCell.value = { formula: v.f, result: v.v };
        } else if (v.v !== null && v.v !== undefined) {
          // ensure number formats are kept if possible
          targetCell.value = v.v;
        } else if (v.m) {
          targetCell.value = v.m;
        }

        // Basic styling preservation
        if (v.bg) targetCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: v.bg.replace("#", "") } };
        if (v.fc) targetCell.font = { ...targetCell.font, color: { argb: v.fc.replace("#", "") } };
        if (v.bl) targetCell.font = { ...targetCell.font, bold: true };
        if (v.it) targetCell.font = { ...targetCell.font, italic: true };
      }
    }

    // Handle Merged Cells
    if (sheetData.config && sheetData.config.merge) {
      for (const key in sheetData.config.merge) {
        const merge = sheetData.config.merge[key];
        try {
          sheet.mergeCells(merge.r + 1, merge.c + 1, merge.r + merge.rs, merge.c + merge.cs);
        } catch (e) {
          console.warn("Failed to merge cells", merge, e);
        }
      }
    }
    
    // Handle Column Widths
    if (sheetData.config && sheetData.config.columnlen) {
      for (const colIndex in sheetData.config.columnlen) {
        const width = sheetData.config.columnlen[colIndex];
        const excelCol = sheet.getColumn(parseInt(colIndex) + 1);
        // fortune-sheet width is pixels, excel is characters (roughly / 7)
        excelCol.width = width / 7;
      }
    }

    // Handle Row Heights
    if (sheetData.config && sheetData.config.rowlen) {
      for (const rowIndex in sheetData.config.rowlen) {
        const height = sheetData.config.rowlen[rowIndex];
        const excelRow = sheet.getRow(parseInt(rowIndex) + 1);
        // fortune-sheet height is pixels, excel is points (roughly * 0.75)
        excelRow.height = height * 0.75;
      }
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
