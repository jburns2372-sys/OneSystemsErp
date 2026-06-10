const xlsx = require('xlsx');

const workbook = xlsx.readFile('public/uploads/boq/1780678747123_PGH_AWARDED_BILL_OF_QUANTITY.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Get raw array of arrays
const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

// Find header row
let headerRowIndex = -1;
for (let i = 0; i < rows.length; i++) {
  const row = rows[i];
  if (row && row.some(cell => typeof cell === 'string' && (cell.toLowerCase().includes('item no') || cell.toLowerCase().includes('description')))) {
    headerRowIndex = i;
    break;
  }
}

if (headerRowIndex !== -1) {
  const headers = rows[headerRowIndex].map(h => (h || '').toString().toLowerCase().trim());
  console.log("Found headers at index", headerRowIndex, ":", headers);
  
  const data = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    
    let itemCode = '';
    let description = '';
    let unit = '';
    let quantity = 0;
    let unitCost = 0;
    let totalCost = 0;
    
    for (let j = 0; j < headers.length; j++) {
      const h = headers[j];
      const val = row[j];
      if (!h || val == null) continue;
      
      if (h.includes('item')) itemCode = val;
      else if (h.includes('desc')) description = val;
      else if (h === 'unit' || h === 'uom') unit = val;
      else if (h === 'qty' || h === 'quantity') quantity = parseFloat(val) || 0;
      else if (h === 'unit cost' || h.includes('combined') || h.includes('price')) unitCost = parseFloat(val) || 0;
      else if (h === 'total cost' || h === 'amount') totalCost = parseFloat(val) || 0;
    }
    
    if (description && (quantity > 0 || totalCost > 0)) {
      data.push({ itemCode, description, unit, quantity, unitCost, totalCost });
    }
  }
  
  console.log("Parsed Items:", data.length);
  console.log("First 3 items:", data.slice(0, 3));
} else {
  console.log("Header row not found.");
}
