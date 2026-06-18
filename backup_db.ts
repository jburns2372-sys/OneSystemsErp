import { PrismaClient, Prisma } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function backup() {
  console.log('Starting full database backup...');
  
  // Exclude some models from the backup if they are extremely large logs or not relevant, 
  // but to be safe and match the prompt, let's backup everything we can.
  // Prisma.dmmf.datamodel.models gives us all models defined in schema.prisma
  const models = Prisma.dmmf.datamodel.models;
  const backupData: Record<string, any> = {};
  
  for (const model of models) {
    // Prisma model names are usually TitleCase but the delegate is lowerCamelCase
    const delegateName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
    
    try {
      if ((prisma as any)[delegateName]) {
        console.log(`Backing up ${model.name}...`);
        const records = await (prisma as any)[delegateName].findMany();
        backupData[model.name] = records;
      }
    } catch (e: any) {
      console.warn(`Failed to backup ${model.name}: ${e.message}`);
    }
  }
  
  const backupFilePath = path.join(process.cwd(), 'backup-before-zero-data-reset.json');
  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2));
  console.log(`\nBackup successfully saved to ${backupFilePath}`);
}

backup().catch(console.error).finally(async () => {
  await prisma.$disconnect();
});
