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
      console.log(`Item ${item.id} has invalid consolidatedBoqItemId: ${item.consolidatedBoqItemId}`);
      invalidCount++;
    }
  }
  console.log(`Found ${invalidCount} invalid items out of ${items.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
