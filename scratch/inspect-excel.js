const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function test() {
  const filePath = path.join(__dirname, '..', 'scratch', 'test.xlsx');
  
  // Try to find the actual uploaded file from the database
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

  // If the file is in public/uploads, let's read it
  // But wait, the file is saved as a Blob or in public/uploads?
  // Let's just look at the filename and try to find it.
  console.log("File URL:", upload.fileUrl);
  
  // Since we might not have the file locally if it's stored in a blob,
  // let's check if the file exists in public/uploads
  let actualFilePath = path.join(__dirname, '..', 'public', upload.fileUrl || '');
  if (upload.fileUrl && upload.fileUrl.startsWith('/')) {
    actualFilePath = path.join(__dirname, '..', 'public', upload.fileUrl);
  } else if (!fs.existsSync(actualFilePath)) {
    // If we can't find it, we'll try to find any xlsx in scratch
    console.log("File not found locally. Let's look at scratch directory");
    const files = fs.readdirSync(path.join(__dirname, '..', 'scratch'));
    for (const f of files) {
      if (f.endsWith('.xlsx')) {
        actualFilePath = path.join(__dirname, '..', 'scratch', f);
        console.log("Using fallback:", actualFilePath);
        break;
      }
    }
  }

  console.log("Reading from:", actualFilePath);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(actualFilePath);
  const sheet = workbook.worksheets[0];

  const getCellString = (cell) => {
    if (cell.value && typeof cell.value === 'object' && 'richText' in cell.value) {
      return cell.value.richText.map(rt => rt.text).join("");
    }
    return cell.value ? String(cell.value) : "";
  };

  for (const i of [14, 21, 27]) {
    const row = sheet.getRow(i);
    console.log(`Row ${i}:`);
    for (let c = 1; c <= 5; c++) {
      console.log(`  Col ${c}: ${getCellString(row.getCell(c))}`);
    }
  }

  process.exit(0);
}

test();
