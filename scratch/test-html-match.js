const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const fileName = '1780678747123_PGH_AWARDED_BILL_OF_QUANTITY.xlsx';
const filePath = path.join(process.cwd(), 'public', 'uploads', 'boq', fileName);

console.log("File exists?", fs.existsSync(filePath));

if (fs.existsSync(filePath)) {
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const fullHtml = xlsx.utils.sheet_to_html(sheet);
  const tableMatch = fullHtml.match(/<table[\s\S]*?<\/table>/i);
  console.log("Table matched?", !!tableMatch);
  if (!tableMatch) {
    console.log("Full HTML snippet:");
    console.log(fullHtml.substring(0, 500));
  }
}
