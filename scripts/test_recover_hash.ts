import crypto from 'crypto';
import fs from 'fs';
import * as xlsx from 'xlsx';

const SOURCE_FILE = 'pgh_files/Progress_Accomplishment_Template_Based_on_Awarded_BOQ.xlsx';

function run() {
  const workbook = xlsx.readFile(SOURCE_FILE);
  const worksheet = workbook.Sheets['BOQ_Master'];
  const rawData = xlsx.utils.sheet_to_json(worksheet);

  let currentSection = '';
  let currentSubsection = '';

  const checksumData: any[] = [];

  rawData.forEach((row: any, idx) => {
    // Basic structural fields
    const seq = row['Seq'] ? String(row['Seq']).trim() : '';
    const sourceRow = row['Source Row'] ? String(row['Source Row']).trim() : String(idx + 2);
    
    // Identify hierarchy
    if (row['Description'] && !row['Item Ref'] && !row['Unit']) {
      if (String(row['Description']).match(/^[I|V|X|L|C|D|M]+\s/)) {
        currentSection = String(row['Description']).trim();
        currentSubsection = '';
      } else if (String(row['Description']).match(/^[A-Z]\./)) {
        currentSubsection = String(row['Description']).trim();
      }
    }

    const description = (row['Description'] || '').trim();
    const unit = (row['Unit'] || '').trim();
    
    const qtyRaw = row['Contract Qty'];
    const amountRaw = row['Contract Amount'];
    const unitCostRaw = row['Awarded Unit Cost'];
    
    // Process only items that have an amount > 0
    let amount = 0;
    if (typeof amountRaw === 'number' && amountRaw > 0) {
      amount = amountRaw;
    } else if (typeof amountRaw === 'string') {
      const parsed = parseFloat(amountRaw.replace(/,/g, ''));
      if (!isNaN(parsed) && parsed > 0) amount = parsed;
    }

    if (amount > 0) {
      checksumData.push({
        seq, sourceRow, itemRef: (row['Item Ref'] || '').trim(),
        section: currentSection, subsection: currentSubsection, description, unit, qty: String(qtyRaw),
        unitCost: String(unitCostRaw), amount: amount.toString(),
        isLot: row['Is Lot'], breakdownRequired: row['Breakdown Required']
      });
    }
  });

  checksumData.sort((a, b) => {
    if (a.seq !== b.seq) return a.seq.localeCompare(b.seq);
    return a.sourceRow.localeCompare(b.sourceRow);
  });
  
  const checksumStr = JSON.stringify(checksumData);
  const canonicalChecksum = crypto.createHash('sha256').update(checksumStr).digest('hex');

  console.log("Checksum:", canonicalChecksum);
}

run();
