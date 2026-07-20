const { PrismaClient } = require('@prisma/client');
const xlsx = require('xlsx');

const prisma = new PrismaClient();

async function fixBOQ() {
  const projects = await prisma.project.findMany();
  if (projects.length === 0) return console.log("No projects found");
  
  const project = projects[0];
  console.log("Fixing BOQ for Project:", project.name);

  const workbook = xlsx.readFile('public/uploads/boq/1780678747123_PGH_AWARDED_BILL_OF_QUANTITY.xlsx');
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

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
    const parsedItems = [];
    
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
      
      if (isNaN(totalCost)) totalCost = quantity * unitCost;

      if (description && (quantity > 0 || totalCost > 0)) {
        parsedItems.push({
          itemCode: String(itemCode),
          description: String(description),
          unit: String(unit),
          quantity: quantity,
          directCost: 0,
          indirectCost: 0,
          combinedUnitCost: unitCost,
          totalCost: totalCost,
          status: 'PENDING',
          processingType: 'MATERIAL_EQUIPMENT',
          projectId: project.id
        });
      }
    }
    
    console.log(`Inserting ${parsedItems.length} items...`);
    await prisma.awardedBOQItem.createMany({ data: parsedItems });
    console.log("Success!");
  }
}

fixBOQ().catch(console.error).finally(() => prisma.$disconnect());
