import { Cell } from 'exceljs';

export function extractStyles(cell: Cell) {
  const result: any = {};
  
  if (cell.font) result.font = cell.font;
  if (cell.fill) result.fill = cell.fill;
  if (cell.border) result.border = cell.border;
  if (cell.alignment) result.alignment = cell.alignment;

  return result;
}
