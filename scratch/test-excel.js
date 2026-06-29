const ExcelJS = require('exceljs');
const fs = require('fs');

async function test() {
  const wb = new ExcelJS.Workbook();
  const filePath = 'c:\\\\Users\\\\user\\\\Documents\\\\JD SOFTWARE PROJECTS\\\\OneSystemsErp\\\\PGH-PMS_saved 06-11-2026_11pm\\\\public\\\\uploads\\\\boq-uploads\\\\cmqybnci4008ovc9kkaid99a5\\\\1782683366264-Awarded_Project_Programs_of_Works_with_Boq_Template_06_29_2026.xlsx';
  await wb.xlsx.readFile(filePath);

  const sheet = wb.getWorksheet('BOQ_DATA_ENTRY') || wb.worksheets[0];
  console.log("Using sheet:", sheet.name);

  const getCellString = (cell) => {
    if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
      return cell.value.richText.map(rt => rt.text).join("");
    }
    return cell.value?.toString() || "";
  };
  function normalizeHeader(text) {
    if (!text) return "";
    return text.toString().toUpperCase().replace(/\\s/g, "").replace(/[^A-Z0-9%]/g, "");
  }

  let headerAnchorRow = 0;
  for (let r = 1; r <= 30; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= 30; c++) {
      const val = normalizeHeader(getCellString(row.getCell(c)));
      if (val.includes("BIDDETAILEDCOSTBREAKDOWN") || val.includes("ITEM")) {
        headerAnchorRow = r;
        break;
      }
    }
    if (headerAnchorRow) break;
  }
  console.log("Anchor row:", headerAnchorRow);

  let headerRowNumber = headerAnchorRow;
  for (let r = headerAnchorRow; r <= headerAnchorRow + 5; r++) {
    const row = sheet.getRow(r);
    let hasDesc = false;
    for (let c = 1; c <= 30; c++) {
      const val = normalizeHeader(getCellString(row.getCell(c)));
      if (val.includes("DESCRIPTION") || val.includes("PARTICULARS") || val.includes("SCOPE")) {
        hasDesc = true;
        break;
      }
    }
    if (hasDesc) {
      headerRowNumber = r;
      break;
    }
  }
  console.log("Header row:", headerRowNumber);

  const colMap = {};
  for (let c = 1; c <= 30; c++) {
    const v1 = normalizeHeader(getCellString(sheet.getRow(headerRowNumber).getCell(c)));
    const v2 = normalizeHeader(getCellString(sheet.getRow(headerRowNumber + 1).getCell(c)));
    const v3 = normalizeHeader(getCellString(sheet.getRow(headerRowNumber + 2).getCell(c)));
    const combined = v1 + "|" + v2 + "|" + v3;
    if (combined !== "||") {
      colMap[combined] = c;
    }
  }
  console.log("ColMap:", colMap);

  const requiredCols = [
    "ITEM", "DESCRIPTION", "UNIT", "QUANTITY", "MATERIAL", "LABOR", "EQUIPMENT",
    "TOTALDIRECTCOST", "OCM", "CP", "VAT", "TOTALINDIRECTCOST", "UNITCOST", "AMOUNT"
  ];
  const missing = [];
  for (const req of requiredCols) {
    let found = false;
    for (const key of Object.keys(colMap)) {
      if (key.includes(req)) found = true;
    }
    if (!found) missing.push(req);
  }
  console.log("Missing columns:", missing);

  const cDesc = colMap[Object.keys(colMap).find(k => k.includes("DESCRIPTION")) || ""];
  console.log("cDesc index:", cDesc);

  let currentRowNum = headerRowNumber + 1;
  if (!sheet.getRow(currentRowNum).getCell(cDesc).value) currentRowNum++;
  console.log("First data row:", currentRowNum);

  const descVal = sheet.getRow(currentRowNum).getCell(cDesc).value?.toString().trim();
  console.log("Desc value at first data row:", descVal);
}
test().catch(console.error);
