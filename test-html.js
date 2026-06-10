const xlsx = require('xlsx');

const workbook = xlsx.readFile('public/uploads/boq/1780678747123_PGH_AWARDED_BILL_OF_QUANTITY.xlsx');
const sheet = workbook.Sheets[workbook.SheetNames[0]];

const html = xlsx.utils.sheet_to_html(sheet);
console.log(html.substring(0, 2000));
