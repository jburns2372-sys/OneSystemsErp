const xlsx = require('xlsx');

// Create sparse arrays to mimic the error
const data = [
  [,, 'PROJECT', ':', 'Dummy Project'],
  [,, 'LOCATION', ':', 'Dummy Location'],
  [],
  ['ITEM NO', 'DESCRIPTION', 'UNIT', 'QTY', 'UNIT COST', 'TOTAL COST'],
  ['1', 'Pipe', 'pcs', 10, 50, 500],
  [,, 'Labor', 'lot', 1, 1000, 1000] // sparse row
];

const wb = xlsx.utils.book_new();
const ws = xlsx.utils.aoa_to_sheet(data);
xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
xlsx.writeFile(wb, "dummy.xlsx");

// Now test parsing
const workbook = xlsx.readFile("dummy.xlsx");
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let name = 'Fallback';
let location = 'Fallback';

for (let i = 0; i < Math.min(20, rows.length); i++) {
  const row = rows[i];
  if (!row || !Array.isArray(row)) continue;
  
  const cellStrings = row.map(cell => (cell || '').toString().trim());
  
  for (let j = 0; j < cellStrings.length; j++) {
    const cellText = (cellStrings[j] || '').toLowerCase();
    
    if (cellText.startsWith('project') && cellText !== 'project manager') {
      for (let k = j + 1; k < cellStrings.length; k++) {
        const nextCell = cellStrings[k] || '';
        if (nextCell && nextCell !== ':') {
          name = nextCell;
          break;
        }
      }
    }
    
    if (cellText.startsWith('location') || cellText.startsWith('address')) {
      for (let k = j + 1; k < cellStrings.length; k++) {
        const nextCell = cellStrings[k] || '';
        if (nextCell && nextCell !== ':') {
          location = nextCell;
          break;
        }
      }
    }
  }
}

console.log('Name:', name);
console.log('Location:', location);
