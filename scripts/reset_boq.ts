import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting BOQ values and deleting Variation Orders...');

  // 1. Delete VO-generated BOQ Mappings
  const voConsolidatedItems = await prisma.consolidatedBOQItem.findMany({
    where: { isVariationItem: true }
  });
  
  const voConsolidatedIds = voConsolidatedItems.map(i => i.id);

  if (voConsolidatedIds.length > 0) {
    await prisma.bOQMapping.deleteMany({
      where: { consolidatedBoqItemId: { in: voConsolidatedIds } }
    });
  }

  // 2. Delete VO-generated Consolidated Items
  await prisma.consolidatedBOQItem.deleteMany({
    where: { isVariationItem: true }
  });

  // 3. Delete VO-generated Awarded Items (description ends with '(VO)')
  await prisma.awardedBOQItem.deleteMany({
    where: { description: { endsWith: '(VO)' } }
  });

  // 4. Reset AwardedBOQItem via raw SQL
  await prisma.$executeRawUnsafe('UPDATE "AwardedBOQItem" SET "approvedClientVoQuantity" = 0, "revisedContractQuantity" = "quantity", "revisedContractAmount" = "totalCost"');
  console.log('Reset AwardedBOQItems');

  // 5. Reset ConsolidatedBOQItem via raw SQL
  await prisma.$executeRawUnsafe('UPDATE "ConsolidatedBOQItem" SET "voAdditiveQty" = 0, "voDeductiveQty" = 0, "revisedQuantity" = "quantity", "voAdditiveCost" = 0, "voDeductiveCost" = 0, "revisedTotalCost" = "totalCost"');
  console.log('Reset ConsolidatedBOQItems');

  // 6. Delete all Variation Orders and their items
  await prisma.variationOrderItem.deleteMany({});
  await prisma.variationOrder.deleteMany({});
  console.log('Deleted all Variation Orders');

  // 7. Reset Project amounts & dates
  const projects = await prisma.project.findMany();
  for (const project of projects) {
    // Recalculate original contract amount based on awarded BOQ
    const items = await prisma.awardedBOQItem.findMany({ where: { projectId: project.id } });
    const originalAmount = items.reduce((acc, curr) => acc + curr.totalCost, 0);

    await prisma.project.update({
      where: { id: project.id },
      data: {
        contractAmount: originalAmount > 0 ? originalAmount : project.contractAmount,
        revisedCompletionDate: project.originalCompletionDate,
        endDate: project.originalCompletionDate,
      }
    });
  }
  console.log('Reset Project amounts and completion dates');

  console.log('BOQ Reset successfully completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
