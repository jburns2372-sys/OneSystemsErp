const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function test() {
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

  for (let currentRowNum = 26; currentRowNum <= 36; currentRowNum++) {
      const row = sheet.getRow(currentRowNum);
      const firstCell = normalizeHeader(getCellString(row.getCell(1)));
      let descCell = getCellString(row.getCell(2)).trim();
      let itemNumberRaw = getCellString(row.getCell(1)).trim();

      if (!descCell && !itemNumberRaw) {
        continue;
      }

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

      console.log(`Row ${currentRowNum} -> ItemCode: "${itemNumber}" | Desc: "${descCell}"`);
  }

  process.exit(0);
}

test();
