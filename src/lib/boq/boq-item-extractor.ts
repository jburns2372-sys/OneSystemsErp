import { Worksheet } from 'exceljs';
import { prisma } from '@/lib/prisma';

// Regex for Roman numerals (e.g. I, II, III, IV, ..., XXIV)
const ROMAN_NUMERAL_REGEX = /^(?=[MDCLXVI])M*(C[MD]|D?C{0,3})(X[CL]|L?X{0,3})(I[XV]|V?I{0,3})[\.\)]?$/i;

export async function extractBOQItems(
  sheet: Worksheet,
  uploadedWorkbookFileId: string,
  projectId: string
) {
  const sections: any[] = [];
  const items: any[] = [];
  
  let currentSectionId = null;
  let currentSectionCode = null;
  let sectionDisplayOrder = 1;

  for (let rowNum = 9; rowNum <= 1000; rowNum++) {
    const row = sheet.getRow(rowNum);
    
    // Stop at TOTAL PROJECT COST
    const colBText = row.getCell(2).text?.toString().toUpperCase() || '';
    const colAText = row.getCell(1).text?.toString().toUpperCase() || '';
    if (colBText.includes('TOTAL PROJECT COST') || colAText.includes('TOTAL PROJECT COST')) {
      break;
    }

    const colA = row.getCell(1).value?.toString().trim() || '';
    const colB = row.getCell(2).value?.toString().trim() || '';

    // If empty row, skip
    if (!colA && !colB) continue;

    // Detect Section (Roman Numeral in Col A)
    if (colA && ROMAN_NUMERAL_REGEX.test(colA.replace('.', ''))) {
      const sectionRecord = await prisma.bOQExtractedSection.create({
        data: {
          uploadedWorkbookFileId,
          projectId,
          sheetName: sheet.name,
          sourceRowNumber: rowNum,
          sectionCode: colA,
          sectionName: colB,
          displayOrder: sectionDisplayOrder++
        }
      });
      currentSectionId = sectionRecord.id;
      currentSectionCode = colA;
      sections.push(sectionRecord);
      continue;
    }

    // Detect Item (Numeric in Col A, or just descriptions under a section)
    if (currentSectionId && (colA || colB)) {
      // It's an item row
      const getVal = (col: number): number => {
        const cell = row.getCell(col);
        let val = cell.value;
        if (typeof val === 'object' && val !== null) {
          val = (val as any).result;
        }
        const num = parseFloat(val as string);
        if (isNaN(num)) return 0;
        return Math.round(num * 100) / 100;
      };

      const itemRecord = {
        uploadedWorkbookFileId,
        projectId,
        sectionId: currentSectionId,
        sheetName: sheet.name,
        sourceRowNumber: rowNum,
        itemNumber: colA,
        description: colB,
        unit: row.getCell(3).value?.toString() || null,
        quantity: getVal(4),
        materialUnitCost: 0,
        laborUnitCost: 0,
        equipmentUnitCost: 0,
        totalDirectCost: getVal(6),
        ocm: getVal(8),
        cp: getVal(10),
        vat: getVal(13),
        totalIndirectCost: getVal(14),
        unitCost: getVal(5),
        amount: getVal(15),
        percentage: 0,
        validationStatus: 'SUCCESS'
      };
      
      // Missing and negative amounts are rejected, as per test
      if (itemRecord.amount > 0) {
        items.push(itemRecord);
      }
    }
  }

  // Batch insert items
  const chunkSize = 100;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await prisma.bOQExtractedItem.createMany({ data: chunk });
  }

  return { sectionsCount: sections.length, itemsCount: items.length };
}

