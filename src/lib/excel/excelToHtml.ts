import ExcelJS from 'exceljs';

export async function convertExcelToHtml(buffer: ArrayBuffer | Buffer): Promise<string> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) return '<p>No sheet found</p>';

  // Map merges
  const merges: any = Object.values((sheet as any)._merges || {}).reduce((acc: any, merge: any) => {
    acc[merge.top + ',' + merge.left] = {
      rowspan: merge.bottom - merge.top + 1,
      colspan: merge.right - merge.left + 1
    };

    // Mark covered cells so we don't render them
    for (let r = merge.top; r <= merge.bottom; r++) {
      for (let c = merge.left; c <= merge.right; c++) {
        if (r !== merge.top || c !== merge.left) {
          acc[r + ',' + c] = 'covered';
        }
      }
    }
    return acc;
  }, {});

  // Calculate default column widths to make it look like excel
  let colGroup = '<colgroup>';
  for (let i = 1; i <= sheet.columnCount; i++) {
    const col = sheet.getColumn(i);
    const width = col.width ? col.width * 8 : 80; // approximate pixels
    colGroup += `<col style="width: ${width}px;" />`;
  }
  colGroup += '</colgroup>';

  let html = `<table style="border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif; font-size: 14px;">${colGroup}<tbody>`;

  sheet.eachRow({ includeEmpty: true }, (row, rowNum) => {
    const height = row.height ? row.height * 1.33 : 20; // convert points to pixels
    html += `<tr style="height: ${height}px;">`;

    for (let colNum = 1; colNum <= sheet.columnCount; colNum++) {
      const mergeInfo = merges[rowNum + ',' + colNum];
      if (mergeInfo === 'covered') continue;

      const cell = row.getCell(colNum);

      let style = 'border: 1px solid #d4d4d4; padding: 2px 4px; overflow: hidden; white-space: pre-wrap; ';

      if (cell.font) {
        if (cell.font.bold) style += 'font-weight: bold; ';
        if (cell.font.italic) style += 'font-style: italic; ';
        if (cell.font.underline) style += 'text-decoration: underline; ';
        if (cell.font.size) style += `font-size: ${cell.font.size}pt; `;
        if (cell.font.color && cell.font.color.argb) {
          const c = cell.font.color.argb;
          if (c.length === 8) {
            style += `color: #${c.substring(2)}; `;
          }
        }
      }

      if (cell.alignment) {
        if (cell.alignment.horizontal) style += `text-align: ${cell.alignment.horizontal}; `;
        if (cell.alignment.vertical) {
          let val = cell.alignment.vertical;
          if (val === 'middle') val = 'middle';
          style += `vertical-align: ${val}; `;
        } else {
          style += `vertical-align: bottom; `;
        }
        if (cell.alignment.wrapText) style += 'white-space: normal; ';
      } else {
        style += `vertical-align: bottom; `;
      }

      if (cell.fill && cell.fill.type === 'pattern' && cell.fill.fgColor && cell.fill.fgColor.argb) {
        const c = cell.fill.fgColor.argb;
        if (c.length === 8) {
          style += `background-color: #${c.substring(2)}; `;
        }
      }

      let text = cell.text || '';
      // If text is totally empty and value is null, keep it empty

      const rowspanAttr = mergeInfo?.rowspan ? ` rowspan="${mergeInfo.rowspan}"` : '';
      const colspanAttr = mergeInfo?.colspan ? ` colspan="${mergeInfo.colspan}"` : '';

      html += `<td${rowspanAttr}${colspanAttr} style="${style}">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
    }

    html += '</tr>';
  });

  html += '</tbody></table>';
  return html;
}
