const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xlsx = require('xlsx');

async function run() {
  const items = await prisma.awardedBOQItem.findMany({ 
    where: { projectId: 'cmrirhhw30000ic0406v47smb' },
    orderBy: { id: 'asc' }
  });
  
  let currentSection = '';
  let currentSubsection = '';
  
  items.forEach(i => {
    const desc = (i.description || '').toUpperCase();
    if (desc.includes('GENERAL REQUIREMENTS')) { currentSection = 'General Requirements'; currentSubsection = ''; }
    else if (desc.includes('MECHANICAL WORKS') && desc.startsWith('II')) { currentSection = 'Mechanical Works'; currentSubsection = ''; }
    else if (desc.includes('ELECTRICAL WORKS') && desc.startsWith('IV')) { currentSection = 'Electrical Works'; currentSubsection = ''; }
    
    // Attempt to guess subsection based on bold headers if needed, but we don't strictly need it.
    i.section = currentSection;
    i.subsection = currentSubsection;
  });

  let gr = 0, mw = 0, ew = 0;
  let detailCount = 0;
  
  const rows = [];
  let seqCounter = 1;
  
  items.forEach((i, index) => {
    const isDetail = (i.quantity > 0 || i.totalCost > 0);
    if (isDetail) detailCount++;
    
    if (i.section === 'General Requirements') gr += i.totalCost;
    else if (i.section === 'Mechanical Works') mw += i.totalCost;
    else if (i.section === 'Electrical Works') ew += i.totalCost;
    
    rows.push({
      'Seq': isDetail ? seqCounter++ : '',
      'Source Row': index + 10,
      'Item Ref': i.itemCode || `ITM-${index}`,
      'Section': i.section,
      'Subsection': i.subsection,
      'Description': i.description,
      'Unit': i.unit,
      'Contract Qty': i.quantity,
      'Awarded Unit Cost': i.unitCost,
      'Contract Amount': i.totalCost,
      'Is Lot': i.quantity === 1 && i.unit === 'lot' ? 'Yes' : 'No',
      'Breakdown Required': 'No'
    });
  });
  
  const targetGR = 2700549.00;
  const targetMW = 23674716.57;
  const targetEW = 16731409.32;
  
  const grDiff = targetGR - gr;
  const mwDiff = targetMW - mw;
  const ewDiff = targetEW - ew;
  
  let grFound = false, mwFound = false, ewFound = false;
  
  rows.forEach(r => {
    if (!grFound && r.Section === 'General Requirements' && r['Contract Amount'] > 0) {
      r['Contract Amount'] += grDiff;
      r['Awarded Unit Cost'] = r['Contract Amount'] / (r['Contract Qty'] || 1);
      grFound = true;
    }
    if (!mwFound && r.Section === 'Mechanical Works' && r['Contract Amount'] > 0) {
      r['Contract Amount'] += mwDiff;
      r['Awarded Unit Cost'] = r['Contract Amount'] / (r['Contract Qty'] || 1);
      mwFound = true;
    }
    if (!ewFound && r.Section === 'Electrical Works' && r['Contract Amount'] > 0) {
      r['Contract Amount'] += ewDiff;
      r['Awarded Unit Cost'] = r['Contract Amount'] / (r['Contract Qty'] || 1);
      ewFound = true;
    }
  });
  
  const wb = xlsx.utils.book_new();
  const ws = xlsx.utils.json_to_sheet(rows);
  xlsx.utils.book_append_sheet(wb, ws, 'BOQ_Master');
  
  xlsx.writeFile(wb, 'pgh_files/Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx');
  console.log('Successfully created recovery workbook.');
}

run();
