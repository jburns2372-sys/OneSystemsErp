import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function run() {
  const data = JSON.parse(fs.readFileSync('rules_backup.json', 'utf8'));
  
  for (const rule of data) {
    try {
      await prisma.knowledgeRecord.upsert({
        where: { id: rule.id },
        update: {
          title: rule.ruleTitle,
          description: rule.ruleDescription,
          notebookType: rule.notebookName,
          relatedModule: rule.moduleName,
          documentType: "Notebook Link",
          status: "Approved"
        },
        create: {
          id: rule.id,
          title: rule.ruleTitle,
          description: rule.ruleDescription,
          notebookType: rule.notebookName,
          relatedModule: rule.moduleName,
          documentType: "Notebook Link",
          status: "Approved"
        }
      });
      console.log(`Inserted KnowledgeRecord: ${rule.ruleTitle}`);
    } catch (e: any) {
      console.error(`Failed to insert ${rule.ruleTitle}:`, e.message);
    }
  }
  console.log('Migration to KnowledgeRecord complete!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
