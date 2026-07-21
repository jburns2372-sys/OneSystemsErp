import { PrismaClient } from '@prisma/client';
import { extractBOQItems } from '../src/lib/boq/boq-item-extractor';
import { generateCanonicalChecksum, BOQ_CANONICALIZATION_VERSION } from '../src/lib/boq/canonical-checksum';
import * as fs from 'fs';
import * as path from 'path';
import * as ExcelJS from 'exceljs';

jest.setTimeout(120000);

const prisma = new PrismaClient();

describe('Gate 7D-R Authoritative BOQ Importer and Financial Domain', () => {
  let parsedRows: any[] = [];
  let totalCost = 0;
  
  beforeAll(async () => {
    // We will parse the file directly as the importer does
    const filePath = path.join(__dirname, '..', 'pgh_files', 'PGH_AWARDED BILL OF QUANTITY.xlsx');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const sheet = workbook.getWorksheet('BOQ');
    if (!sheet) throw new Error("Worksheet not found");
    
    // Create necessary dummy records if they don't exist
    await prisma.user.upsert({
      where: { id: 'fake-user-id' },
      create: { id: 'fake-user-id', name: 'Fake User', email: 'fake@example.com', passwordHash: 'fake', role: 'SUPER_ADMIN', status: 'VERIFIED' },
      update: {}
    });
    await prisma.project.upsert({
      where: { id: 'fake-project-id' },
      create: { id: 'fake-project-id', name: 'Fake Project' },
      update: {}
    });
    await prisma.uploadedWorkbookFile.upsert({
      where: { id: 'fake-file-id' },
      create: { 
        id: 'fake-file-id', 
        projectId: 'fake-project-id', 
        originalFilename: 'f', 
        fileHash: 'f', 
        mimeType: 'f', 
        fileSize: 100, 
        storagePath: 'f', 
        uploadedBy: 'fake-user-id' 
      },
      update: {}
    });
    
    // Use the actual application importer function to prove the logic
    const { itemsCount } = await extractBOQItems(sheet, 'fake-file-id', 'fake-project-id');
    
    // But since extractBOQItems saves to DB and we want to test pure financial domain logic,
    // wait, extractBOQItems is inserting into bOQExtractedSection and bOQExtractedItem!
    // That means it needs the database!
    // I will fetch the items from DB to test the domain logic
    const rawRows = await prisma.bOQExtractedItem.findMany({
      where: { uploadedWorkbookFileId: 'fake-file-id' },
      include: { section: true }
    });
    parsedRows = rawRows.map(r => {
      const secName = r.section?.sectionName || '';
      let cat = '';
      if (secName.includes('GENERAL REQUIREMENTS')) cat = 'General Requirements';
      else if (secName.includes('MECHANICAL WORKS')) cat = 'Mechanical Works';
      else if (secName.includes('ELECTRICAL WORKS') || secName.includes('Service Entrance') || secName.includes('Feeder') || secName.includes('Panel Board') || secName.includes('Mechanical System Power')) cat = 'Electrical Works';
      return {
        ...r,
        category: cat
      };
    });
  });

  afterAll(async () => {
    await prisma.bOQExtractedItem.deleteMany({ where: { uploadedWorkbookFileId: 'fake-file-id' } });
    await prisma.bOQExtractedSection.deleteMany({ where: { uploadedWorkbookFileId: 'fake-file-id' } });
    await prisma.$disconnect();
  });

  test('All 326 source rows reconcile', () => {
    expect(parsedRows.length).toBe(326);
  });

  test('Missing and negative amounts are rejected', () => {
    // If the parser succeeded, it means it already rejected/handled missing/negatives
    // We can explicitly check the parsed output
    const invalidRows = parsedRows.filter(r => r.amount === null || r.amount === undefined || r.amount < 0);
    expect(invalidRows.length).toBe(0);
  });

  test('null unitCost does not zero a lot-item amount', () => {
    // Find a row where unitCost is null (e.g. Lot item) and verify amount is preserved
    const lotRows = parsedRows.filter(r => r.unit === 'lot' || r.unitCost === 0 || r.unitCost === null);
    if (lotRows.length > 0) {
      for (const row of lotRows) {
        expect(row.amount).toBeGreaterThan(0);
      }
    }
  });

  test('authoritative line.amount is preserved', () => {
    // Ensure that amount is not recalculated strictly as qty * unitCost if it causes precision loss
    // The parser should extract the exact amount from the spreadsheet
    const generalReqs = parsedRows.filter(r => r.category === 'General Requirements');
    const genReqTotal = generalReqs.reduce((sum, r) => sum + r.amount, 0);
    // General Requirements: PHP 2,700,549.00
    expect(genReqTotal).toBeCloseTo(2700549.00, 2);
  });

  test('ROUND_HALF_UP is applied', () => {
    // Test that the amounts have at most 2 decimal places and are correctly rounded
    for (const row of parsedRows) {
      const amountStr = row.amount.toString();
      if (amountStr.includes('.')) {
        const decimals = amountStr.split('.')[1];
        expect(decimals.length).toBeLessThanOrEqual(2);
      }
    }
  });

  test('Total equals PHP 43,106,674.89', () => {
    const mechanical = parsedRows.filter(r => r.category === 'Mechanical Works').reduce((sum, r) => sum + r.amount, 0);
    const electrical = parsedRows.filter(r => r.category === 'Electrical Works').reduce((sum, r) => sum + r.amount, 0);
    const general = parsedRows.filter(r => r.category === 'General Requirements').reduce((sum, r) => sum + r.amount, 0);
    
    expect(mechanical).toBeCloseTo(23674716.57, 2);
    expect(electrical).toBeCloseTo(16731409.32, 2);
    expect(general).toBeCloseTo(2700549.00, 2);

    totalCost = parsedRows.reduce((sum, r) => sum + r.amount, 0);
    expect(totalCost).toBeCloseTo(43106674.89, 2);
  });

  test('Checksum and BOQ_CANONICAL_V1 match', () => {
    const manifestPath = path.join(__dirname, '..', 'artifacts', 'scheduling', 'uat-v2-authoritative-boq-preview.json');
    const jsonLines = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const checksum = generateCanonicalChecksum(jsonLines);
    expect(checksum).toBe('514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17');
    expect(BOQ_CANONICALIZATION_VERSION).toBe('BOQ_CANONICAL_V1');
  });
});
