const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sourceFile = "c:\\Users\\user\\Documents\\JD SOFTWARE PROJECTS\\OneSystemsErp\\PGH-PMS_saved 06-11-2026_11pm\\OneSystemsERP_Ultimate_Operations_Manual.md";
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueName = `OneSystemsERP_Ultimate_Operations_Manual_${Date.now()}.pdf`;
  const destFile = path.join(uploadDir, uniqueName);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream(destFile));

  const text = fs.readFileSync(sourceFile, 'utf8');

  // Basic markdown parsing for PDF
  doc.fontSize(20).text('OneSystemsERP', { align: 'center' });
  doc.fontSize(16).text('Ultimate Operations Manual', { align: 'center' });
  doc.moveDown(2);

  const lines = text.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('# ')) {
      doc.moveDown(1);
      doc.fontSize(18).text(line.replace('# ', ''), { underline: true });
      doc.moveDown(0.5);
    } else if (line.startsWith('## ')) {
      doc.moveDown(1);
      doc.fontSize(14).text(line.replace('## ', ''), { continued: false });
      doc.moveDown(0.5);
    } else if (line.startsWith('### ')) {
      doc.moveDown(0.5);
      doc.fontSize(12).text(line.replace('### ', ''), { continued: false });
      doc.moveDown(0.2);
    } else if (line.startsWith('* ')) {
      doc.fontSize(10).text('   • ' + line.replace('* ', ''));
    } else if (line.startsWith('> ')) {
      doc.fontSize(10).text('   [NOTE] ' + line.replace('> ', ''), { oblique: true });
    } else if (line.trim().length > 0) {
      doc.fontSize(10).text(line.replace(/\*\*/g, ''), { align: 'left' });
    } else {
      doc.moveDown(0.5);
    }
  });

  doc.end();

  // Wait briefly for write stream to finish
  await new Promise(resolve => setTimeout(resolve, 1000));

  const fileUrl = `/uploads/documents/${uniqueName}`;

  await prisma.document.create({
    data: {
      title: "OneSystemsERP Ultimate Operations Manual (PDF)",
      category: "MANUAL",
      fileUrl,
      fileType: "application/pdf",
      fileSize: fs.statSync(destFile).size,
      projectId: null,
      uploaderId: null
    }
  });

  console.log("PDF created and injected successfully.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
