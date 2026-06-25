const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function uploadManuals() {
  const docsDir = path.join(__dirname, 'docs');
  const uploadDir = path.join(__dirname, 'public', 'uploads', 'documents');

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const files = [
    'OneSystemsERP_Updated_Operational_Manual.md',
    'OneSystemsERP_Updated_Operational_Manual_Checklists.md',
    'OneSystemsERP_Updated_Role_Permission_Matrix.md',
    'OneSystemsERP_Updated_Approval_Workflows.md',
    'OneSystemsERP_Updated_Training_Guide.md',
    'OneSystemsERP_Updated_Troubleshooting_Guide.md'
  ];

  let adminUser = await prisma.user.findFirst({
    where: { OR: [{ role: 'SUPER_ADMIN' }, { role: 'SYSTEM_ADMIN' }, { email: 'jburns@demo.com' }] }
  });
  
  if (!adminUser) {
     adminUser = await prisma.user.findFirst();
  }

  for (const fileName of files) {
    const sourcePath = path.join(docsDir, fileName);
    if (!fs.existsSync(sourcePath)) {
      console.log(`Skipping ${fileName}: not found in docs/`);
      continue;
    }

    const uniqueName = `ERP_Manual_${Date.now()}_${fileName}`;
    const targetPath = path.join(uploadDir, uniqueName);
    
    fs.copyFileSync(sourcePath, targetPath);
    const stats = fs.statSync(targetPath);
    
    const fileUrl = `/uploads/documents/${uniqueName}`;

    await prisma.document.create({
      data: {
        title: fileName.replace('.md', '').replace(/_/g, ' '),
        category: 'MANUAL',
        fileUrl: fileUrl,
        fileType: 'text/markdown',
        fileSize: stats.size,
        uploaderId: adminUser?.id || null
      }
    });

    console.log(`Successfully uploaded ${fileName} to Documents module.`);
  }

  console.log('All manuals uploaded.');
}

uploadManuals()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
