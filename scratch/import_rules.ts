// @ts-nocheck
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function run() {
  const data = JSON.parse(fs.readFileSync('rules_backup.json', 'utf8'));
  for (const rule of data) {
    // SQLite timestamps might be strings or numbers, Prisma needs Date
    const ruleData = { ...rule };
    
    // Ensure dates are parsed correctly
    if (ruleData.effectiveDate) ruleData.effectiveDate = new Date(ruleData.effectiveDate);
    if (ruleData.createdAt) ruleData.createdAt = new Date(ruleData.createdAt);
    if (ruleData.updatedAt) ruleData.updatedAt = new Date(ruleData.updatedAt);
    if (ruleData.lastReviewedDate) ruleData.lastReviewedDate = new Date(ruleData.lastReviewedDate);

    // SQLite booleans are 1/0, convert to true/false
    if (typeof ruleData.isMandatory === 'number') ruleData.isMandatory = ruleData.isMandatory === 1;

    try {
      await prisma.knowledgeRuleReference.upsert({
        where: { id: ruleData.id },
        update: ruleData,
        create: ruleData
      });
      console.log(`Inserted rule: ${ruleData.ruleTitle}`);
    } catch (e) {
      console.error(`Failed to insert rule ${ruleData.ruleTitle}:`, (e as any).message);
    }
  }
  console.log('Migration complete!');
}

run().catch(console.error).finally(() => prisma.$disconnect());
