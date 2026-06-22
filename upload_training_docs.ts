// Script to upload all training documents to the OneSystemsERP Documents module
// Run with: npx tsx upload_training_docs.ts

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function uploadTrainingDocs() {
  const docsDir = path.join(process.cwd(), 'docs');
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');

  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Get all markdown files from docs directory
  const files = fs.readdirSync(docsDir).filter((f: string) => f.endsWith('.md'));

  console.log(`\n📚 Found ${files.length} training documents to upload.\n`);

  // Get the first admin user as the uploader
  const adminUser = await prisma.user.findFirst({
    where: {
      OR: [
        { role: 'SUPER_ADMIN' },
        { role: 'PROJECT_DIRECTOR' },
        { role: 'ADMINISTRATOR' }
      ]
    }
  });

  const uploaderId = adminUser?.id || null;
  console.log(`👤 Uploader: ${adminUser?.name || adminUser?.email || 'System Generated'}\n`);

  let successCount = 0;

  for (const fileName of files) {
    const sourcePath = path.join(docsDir, fileName);
    const fileStats = fs.statSync(sourcePath);
    
    // Create a safe copy name with timestamp
    const baseName = path.basename(fileName, '.md');
    const safeName = baseName.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `${safeName}_${Date.now()}.md`;
    const destPath = path.join(uploadDir, uniqueName);

    // Copy the file to the uploads directory
    fs.copyFileSync(sourcePath, destPath);

    const fileUrl = `/uploads/documents/${uniqueName}`;

    // Determine category based on filename
    let category = 'OTHER';
    if (fileName.startsWith('ERP_') && fileName.includes('TRAINING')) {
      category = 'REPORT'; // Training guides categorized as reports
    } else if (fileName.startsWith('CHECKLIST_')) {
      category = 'REPORT';
    } else if (fileName.startsWith('QUICK_') || fileName.startsWith('WORKFLOW_')) {
      category = 'REPORT';
    } else if (fileName.startsWith('TRAINING_')) {
      category = 'REPORT';
    }

    // Create the document record in the database
    await prisma.document.create({
      data: {
        title: `[Training Package] ${fileName}`,
        category,
        fileUrl,
        fileType: 'text/markdown',
        fileSize: fileStats.size,
        projectId: null, // Not project-specific
        uploaderId,
      }
    });

    successCount++;
    console.log(`  ✅ Uploaded: ${fileName} (${(fileStats.size / 1024).toFixed(1)} KB)`);

    // Small delay to ensure unique timestamps
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n🎉 Successfully uploaded ${successCount}/${files.length} documents to the Documents module!`);
  console.log(`📂 Files stored in: public/uploads/documents/`);
  console.log(`🗄️  Database records created in Document table.`);
  console.log(`\n💡 Open OneSystemsERP → Documents module to view all files.\n`);

  await prisma.$disconnect();
}

uploadTrainingDocs().catch((err: any) => {
  console.error('❌ Error uploading documents:', err);
  process.exit(1);
});
