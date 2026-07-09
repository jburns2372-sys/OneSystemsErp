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

  for (let rowNum = 14; rowNum <= 500; rowNum++) {
    const row = sheet.getRow(rowNum);
    
    // Stop at Grand Total
    const colCText = row.getCell(3).text?.toString().toUpperCase() || '';
    if (colCText.includes('GRAND TOTAL') || rowNum === 162) {
      break;
    }

    const colB = row.getCell(2).value?.toString().trim() || '';
    const colC = row.getCell(3).value?.toString().trim() || '';

    // If empty row, skip
    if (!colB && !colC) continue;

    // Detect Section (Roman Numeral in Col B)
    if (colB && ROMAN_NUMERAL_REGEX.test(colB.replace('.', ''))) {
      const sectionRecord = await prisma.bOQExtractedSection.create({
        data: {
          uploadedWorkbookFileId,
          projectId,
          sheetName: 'BOQ_DATA_ENTRY',
          sourceRowNumber: rowNum,
          sectionCode: colB,
          sectionName: colC,
          displayOrder: sectionDisplayOrder++
        }
      });
      currentSectionId = sectionRecord.id;
      currentSectionCode = colB;
      sections.push(sectionRecord);
      continue;
    }

    // Detect Item (Numeric in Col B, or just descriptions under a section)
    if (currentSectionId && (colB || colC)) {
      // It's an item row
      const getVal = (col: number) => {
        const cell = row.getCell(col);
        if (typeof cell.value === 'object' && cell.value !== null) {
           return (cell.value as any).result || 0;
        }
        return parseFloat(cell.value?.toString() || '0') || 0;
      };

      const itemRecord = {
        uploadedWorkbookFileId,
        projectId,
        sectionId: currentSectionId,
        sheetName: 'BOQ_DATA_ENTRY',
        sourceRowNumber: rowNum,
        itemNumber: colB,
        description: colC,
        unit: row.getCell(4).value?.toString() || null,
        quantity: getVal(5),
        materialUnitCost: getVal(6),
        laborUnitCost: getVal(7),
        equipmentUnitCost: getVal(8),
        totalDirectCost: getVal(9),
        ocm: getVal(10),
        cp: getVal(11),
        vat: getVal(12),
        totalIndirectCost: getVal(13),
        unitCost: getVal(14),
        amount: getVal(15),
        percentage: getVal(16),
        validationStatus: 'SUCCESS'
      };
      
      items.push(itemRecord);
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
