const xlsx = require('xlsx');

const workbook = xlsx.readFile('public/uploads/boq/1780678747123_PGH_AWARDED_BILL_OF_QUANTITY.xlsx');
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
