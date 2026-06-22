// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.materialRequestItem.findMany();
  let invalidCount = 0;
  for (const item of items) {
    const boq = await prisma.consolidatedBOQItem.findUnique({
      where: { id: item.consolidatedBoqItemId }
    });
    if (!boq) {
      console.log(`Deleting invalid MR Item ${item.id}`);
      await prisma.materialRequestItem.delete({ where: { id: item.id } });
      invalidCount++;
    }
  }
  
  // also check if any MaterialRequests are now empty and maybe delete them?
  const mrs = await prisma.materialRequest.findMany({ include: { items: true } });
  for (const mr of mrs) {
    if (mr.items.length === 0) {
      console.log(`Deleting empty MR ${mr.mrNumber}`);
      await prisma.materialRequest.delete({ where: { id: mr.id } });
    }
  }

  console.log(`Deleted ${invalidCount} invalid items`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
