import * as xlsx from 'xlsx';

const wb = xlsx.readFile('public/uploads/templates/cmriveop10378vcqsma96byxi/awarded-boq-template.xlsx');
const sheet = wb.Sheets['BOQ'];
const data = xlsx.utils.sheet_to_json(sheet) as any[];

let total = 0;
let gr = 0, mw = 0, ew = 0;
data.forEach(row => {
  const t = Number(row['Contract Amount'] || row['Total Cost'] || row['Amount'] || 0);
  const s = row['Section'];
  total += t;
  if(s === 'General Requirements') gr += t;
  if(s === 'Mechanical Works') mw += t;
  if(s === 'Electrical Works') ew += t;
});

console.log('Rows:', data.length);
console.log('Total:', total);
console.log('GR:', gr, 'MW:', mw, 'EW:', ew);
