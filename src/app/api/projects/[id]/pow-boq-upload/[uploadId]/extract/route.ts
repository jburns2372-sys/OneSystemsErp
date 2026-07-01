import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; uploadId: string }> }
) {
  try {
    const { id: projectId, uploadId } = await params;

    const file = await prisma.uploadedWorkbookFile.findUnique({
      where: { id: uploadId },
      include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } }
    });

    if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

    const latestVersion = file.versions[0];

    // Load workbook using exceljs
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(latestVersion.filePath);

    // Look for sheet (default to first if specific name not found, but we prefer BOQ_DATA_ENTRY)
    let sheet = workbook.getWorksheet('BOQ_DATA_ENTRY');
    if (!sheet) {
      sheet = workbook.worksheets[0];
    }

    if (!sheet) {
       return NextResponse.json({ error: 'No worksheet found in the file' }, { status: 400 });
    }

    // Clear previous extractions for this file to avoid duplicates
    await prisma.bOQExtractedSection.deleteMany({ where: { uploadedWorkbookFileId: file.id } });

    let currentSection: any = null;
    let sectionOrder = 1;
    let itemsExtracted = 0;

    // Based on user prompt: rows 14 to 161 is the standard BOQ range
    for (let rowNumber = 14; rowNumber <= 161; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      
      const itemNumber = row.getCell('B').text?.trim(); // Column B
      const description = row.getCell('C').text?.trim(); // Column C
      
      if (!description) continue; // Skip empty rows

      // Check if this is a Roman Numeral Section Header (e.g. "I", "II", "III" in Item Number)
      const isRomanNumeral = /^(I|II|III|IV|V|VI|VII|VIII|IX|X|XI|XII|XIII|XIV|XV)$/i.test(itemNumber || '');
      
      if (isRomanNumeral || (!itemNumber && description === description.toUpperCase())) {
        // It's a Section
        currentSection = await prisma.bOQExtractedSection.create({
          data: {
            uploadedWorkbookFileId: file.id,
            projectId,
            sheetName: sheet.name,
            sourceRowNumber: rowNumber,
            sectionCode: itemNumber,
            sectionName: description,
            displayOrder: sectionOrder++
          }
        });
      } else if (itemNumber || description) {
        // It's an Item
        
        // Helper to get numeric value or formula result
        const getNum = (col: string) => {
          const cell = row.getCell(col);
          if (!cell) return null;
          if (typeof cell.value === 'object' && cell.value !== null && 'result' in cell.value) {
             return typeof cell.value.result === 'number' ? cell.value.result : null;
          }
          return typeof cell.value === 'number' ? cell.value : null;
        };

        const getFormulaMap = () => {
          const map: Record<string, string> = {};
          ['H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].forEach(col => {
             const cell = row.getCell(col);
             if (cell && typeof cell.value === 'object' && cell.value !== null && 'formula' in cell.value) {
                map[col] = cell.value.formula as string;
             }
          });
          return Object.keys(map).length > 0 ? JSON.stringify(map) : null;
        };

        await prisma.bOQExtractedItem.create({
          data: {
            uploadedWorkbookFileId: file.id,
            projectId,
            sectionId: currentSection?.id,
            sheetName: sheet.name,
            sourceRowNumber: rowNumber,
            itemNumber: itemNumber,
            description: description,
            unit: row.getCell('D').text?.trim() || null,
            quantity: getNum('E'),
            materialUnitCost: getNum('F'),
            laborUnitCost: getNum('G'),
            equipmentUnitCost: getNum('H'),
            totalDirectCost: getNum('I'), // Might be formula F+G+H
            ocm: getNum('J'),
            cp: getNum('K'),
            vat: getNum('M'),
            totalIndirectCost: getNum('N'),
            unitCost: getNum('O'),
            amount: getNum('P'), // Total Amount
            formulaMapJson: getFormulaMap()
          }
        });
        itemsExtracted++;
      }
    }

    // Update status
    await prisma.uploadedWorkbookFile.update({
      where: { id: file.id },
      data: { extractionStatus: 'COMPLETED' }
    });

    // Create Audit Trail
    await prisma.workbookExtractionAudit.create({
      data: {
        uploadedWorkbookFileId: file.id,
        projectId,
        action: 'DATA_EXTRACTION',
        status: 'SUCCESS',
        message: `Extracted ${sectionOrder - 1} sections and ${itemsExtracted} items.`
      }
    });

    return NextResponse.json({ success: true, sections: sectionOrder - 1, items: itemsExtracted });

  } catch (error: any) {
    console.error('Extraction Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
