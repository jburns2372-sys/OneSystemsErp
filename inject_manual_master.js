const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sourceFile = "c:\\Users\\user\\Documents\\JD SOFTWARE PROJECTS\\OneSystemsErp\\PGH-PMS_saved 06-11-2026_11pm\\OneSystemsERP_Master_Operations_Manual.md";
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueName = `OneSystemsERP_Master_Operations_Manual_${Date.now()}.md`;
  const destFile = path.join(uploadDir, uniqueName);

  fs.copyFileSync(sourceFile, destFile);

  const fileUrl = `/uploads/documents/${uniqueName}`;

  await prisma.document.create({
    data: {
      title: "OneSystemsERP Master Operations Manual (Complete Edition)",
      category: "MANUAL",
      fileUrl,
      fileType: "text/markdown",
      fileSize: fs.statSync(destFile).size,
      projectId: null,
      uploaderId: null
    }
  });

  console.log("Master Document saved to Centralized Documents successfully.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
