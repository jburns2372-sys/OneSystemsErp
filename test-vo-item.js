const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const project = await prisma.project.findFirst();
    const count = await prisma.variationOrder.count();
    
    console.log("Creating VO Header...");
    const vo = await prisma.variationOrder.create({
      data: {
        projectId: project.id,
        voNumber: `TEST-NEW-WORK-${count}`,
        variationType: 'Extra Work Order',
        originalContractAmount: 0,
      }
    });
    console.log("VO created:", vo.id);

    console.log("Adding New Work Item...");
    const item = await prisma.variationOrderItem.create({
      data: {
        variationOrderId: vo.id,
        voItemNumber: 'NEW',
        itemClassification: 'ADDITIONAL_WORKS',
        description: 'New Item',
        unit: 'lot',
        originalQuantity: 0,
        currentProposedQuantity: 1,
        revisedQuantity: 1,
        originalUnitCost: 0,
        proposedUnitCost: 5000,
        approvedUnitCost: 5000,
        originalAmount: 0,
        additionalAmount: 5000,
        deductiveAmount: 0,
        netAmount: 5000,
        originalBoqItemId: null,
        otherDirectCost: 5000,
        overhead: 0
      }
    });
    console.log("Item created:", item.id);
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
