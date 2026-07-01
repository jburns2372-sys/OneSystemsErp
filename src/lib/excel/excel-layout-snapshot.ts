import { Worksheet } from 'exceljs';

export function extractLayout(sheet: Worksheet) {
  const columns: Record<string, number> = {};
  const rows: Record<string, number> = {};
  const merges: string[] = [];

  // 1. Column Widths
  for (let i = 1; i <= sheet.columnCount; i++) {
    const col = sheet.getColumn(i);
    if (col.width) {
      columns[col.letter] = col.width;
    }
  }

  // 2. Row Heights
  sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
    if (row.height) {
      rows[rowNumber.toString()] = row.height;
    }
  });

  // 3. Merged Cells
  if (sheet.hasMerges) {
    // @ts-ignore - exceljs internal api usually exposes merges
    const mergeMap = sheet._merges;
    if (mergeMap) {
      for (const key in mergeMap) {
        merges.push(mergeMap[key].model);
      }
    }
  }

  return { columns, rows, merges };
}
