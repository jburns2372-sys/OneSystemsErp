const { PrismaClient, Prisma } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
  const models = Prisma.dmmf.datamodel.models.map(m => m.name);
  const backupData = {};
  
  console.log(`Found ${models.length} models to backup. Starting backup...`);

  for (const model of models) {
    // Convert to camelCase for prisma client
    const camelModel = model.charAt(0).toLowerCase() + model.slice(1);
    try {
      if (prisma[camelModel]) {
        console.log(`Backing up ${model}...`);
        const data = await prisma[camelModel].findMany();
        backupData[model] = data;
      }
    } catch (err) {
      console.warn(`Failed to backup ${model}:`, err.message);
    }
  }

  fs.writeFileSync('backup-before-zero-data-reset.json', JSON.stringify(backupData, null, 2));
  console.log('Backup complete: backup-before-zero-data-reset.json');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
