const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function fixDB() {
  const { PrismaClient } = require('@prisma/client');
  const { neonConfig } = require('@neondatabase/serverless');
  const { PrismaNeon } = require('@prisma/adapter-neon');
  const ws = require('ws');
  require('dotenv').config();

  neonConfig.webSocketConstructor = ws;
  const connectionString = process.env.NEON_BRANCH_URL || process.env.DATABASE_URL;
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const project = await prisma.project.findFirst({
    where: { name: 'DESIGN AND BUILD OF TALAKAG GOVERNMENT CENTER' },
    include: { boqTemplateUploads: true }
  });

  if (!project || project.boqTemplateUploads.length === 0) {
    console.log("No upload found");
    process.exit(0);
  }

  const upload = project.boqTemplateUploads[0];
  let actualFilePath = path.join(__dirname, '..', 'public', upload.fileUrl || '');

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(actualFilePath);
  const sheet = workbook.worksheets[0];

  const getCellString = (cell) => {
    if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
      return cell.value.richText.map(rt => rt.text).join("");
    }
    return cell.value ? String(cell.value) : "";
  };

  const normalizeHeader = (text) => text ? text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : "";

  const items = [];
  let consecutiveBlank = 0;
  
  const cItem = 1, cDesc = 2, cUnit = 3, cQty = 4, cMat = 5, cLab = 6, cEqu = 7, cTdc = 8, cOcm = 9, cCp = 10, cVat = 11, cTic = 12, cUc = 13, cAmt = 14, cPct = 15;

  let grandTotal = 0;

  for (let currentRowNum = 14; currentRowNum <= 505; currentRowNum++) {
      const row = sheet.getRow(currentRowNum);
      const firstCell = normalizeHeader(getCellString(row.getCell(1)));
      let descCell = getCellString(row.getCell(cDesc)).trim();
      let itemNumberRaw = getCellString(row.getCell(cItem)).trim();

      if (firstCell === "GRANDTOTAL" || normalizeHeader(descCell) === "GRANDTOTAL" || normalizeHeader(itemNumberRaw) === "GRANDTOTAL") {
        grandTotal = Number(row.getCell(cAmt).result !== undefined ? row.getCell(cAmt).result : row.getCell(cAmt).value) || 0;
        break;
      }

      if (!descCell && !itemNumberRaw) {
        consecutiveBlank++;
        if (consecutiveBlank >= 10) break;
        continue;
      }
      consecutiveBlank = 0;

      let itemNumber = itemNumberRaw;
      
      // If user merged Item and Description into the Item column
      if (!descCell && itemNumberRaw) {
        descCell = itemNumberRaw;
        const match = itemNumberRaw.match(/^([IVXLCDM]+\.?|\d+\.)\s*(.*)/i);
        if (match) {
          itemNumber = match[1].trim();
        } else {
          itemNumber = "";
        }
      }

      const getNum = (cell) => {
        const val = cell.result !== undefined ? cell.result : cell.value;
        return Number(val) || 0;
      };

      const unit = getCellString(row.getCell(cUnit)).trim();
      const qty = getNum(row.getCell(cQty));
      const amount = getNum(row.getCell(cAmt));

      items.push({
        projectId: project.id,
        itemCode: itemNumber || `ROW-${currentRowNum}`,
        description: descCell,
        unit: unit || "LOT",
        quantity: qty,
        directCost: getNum(row.getCell(cTdc)),
        indirectCost: getNum(row.getCell(cTic)),
        combinedUnitCost: getNum(row.getCell(cUc)),
        totalCost: amount,
        ocmRate: upload.ocmRate,
        cpRate: upload.cpRate,
        vatRate: upload.vatRate,
        templateVersion: upload.templateVersion,
        sourceFileName: upload.fileName,
        sourceSheetName: "BOQ_DATA_ENTRY",
        sourceRowNumber: currentRowNum,
        status: "APPROVED",
        approvalStatus: "APPROVED",
        boqTemplateUploadId: upload.id
      });
  }

  console.log(`Parsed ${items.length} items. Deleting old items...`);
  
  await prisma.$transaction(async (tx) => {
    await tx.awardedBOQItem.deleteMany({
      where: { projectId: project.id }
    });

    console.log("Inserting new items...");
    await tx.awardedBOQItem.createMany({
      data: items
    });
  });

  console.log("Done!");
  process.exit(0);
}

fixDB();
