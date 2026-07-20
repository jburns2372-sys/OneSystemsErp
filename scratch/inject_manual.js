const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const sourceFile = "C:\\Users\\user\\.gemini\\antigravity-ide\\brain\\57520da9-9e2d-4aee-b8ad-36e7e0662fb6\\OneSystemsERP_Operations_Manual.md";
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const uniqueName = `OneSystemsERP_Operations_Manual_${Date.now()}.md`;
  const destFile = path.join(uploadDir, uniqueName);

  fs.copyFileSync(sourceFile, destFile);

  const fileUrl = `/uploads/documents/${uniqueName}`;

  await prisma.document.create({
    data: {
      title: "OneSystemsERP Operations Manual",
      category: "MANUAL",
      fileUrl,
      fileType: "text/markdown",
      fileSize: fs.statSync(destFile).size,
      projectId: null,
      uploaderId: null
    }
  });

  console.log("Document saved to Centralized Documents successfully.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
