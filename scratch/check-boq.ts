import { PrismaClient } from '@prisma/client';
import fs from 'fs';
const prisma = new PrismaClient();

async function run() {
  const items = await prisma.awardedBOQItem.findMany({
    where: { projectId: 'cmrirhhw30000ic0406v47smb' }
  });
  
  let result = items.map(i => `${i.itemCode} | ${i.description} | ${i.quantity} | ${i.totalCost}`).join('\n');
  fs.writeFileSync('scratch/boq_items.txt', result);
}
run().finally(() => prisma.$disconnect());
