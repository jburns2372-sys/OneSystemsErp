const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const voId = 'cmqo9c49k0001vcec5zem0hx9';
  const vo = await prisma.variationOrder.findUnique({
    where: { id: voId },
    include: { items: true, project: true }
  });
  if (!vo) return;

  // 1. Recalculate Totals
  let totalAdditional = 0;
  let totalDeductive = 0;

  vo.items.forEach((item) => {
    totalAdditional += item.additionalAmount;
    totalDeductive += item.deductiveAmount;
  });

  const netAmount = totalAdditional - totalDeductive;
  
  const approvedVos = await prisma.variationOrder.findMany({
    where: { 
      projectId: vo.projectId, 
      currentStatus: 'APPROVED',
      id: { not: voId }
    }
  });

  let prevAdditive = 0;
  let prevDeductive = 0;
  approvedVos.forEach((v) => {
    prevAdditive += v.additionalAmount;
    prevDeductive += v.deductiveAmount;
  });

  const revisedContractAmount = vo.originalContractAmount + prevAdditive - prevDeductive + netAmount;
  const percentageImpact = vo.originalContractAmount > 0 ? (netAmount / vo.originalContractAmount) * 100 : 0;

  await prisma.variationOrder.update({
    where: { id: voId },
    data: {
      additionalAmount: totalAdditional,
      deductiveAmount: totalDeductive,
      netVariationAmount: netAmount,
      totalPreviouslyApprovedAdditive: prevAdditive,
      totalPreviouslyApprovedDeductive: prevDeductive,
      currentRevisedContractAmount: revisedContractAmount,
      percentageImpact
    }
  });
  
  // 2. Apply to Consolidated BOQ
  for (const item of vo.items) {
    if (item.itemClassification === 'ADDITIONAL_WORKS' || item.itemClassification === 'NEW_ITEM') {
      const itemCount = await prisma.consolidatedBOQItem.count({ where: { projectId: vo.projectId } });
      const newItemCode = `VO-${String(itemCount + 1).padStart(3, '0')}`;

      await prisma.consolidatedBOQItem.create({
        data: {
          itemCode: newItemCode,
          category: item.workCategory || 'Variation Order',
          description: item.description,
          unit: item.unit,
          quantity: 0,
          unitCost: item.approvedUnitCost,
          totalCost: 0,
          voAdditiveQty: item.revisedQuantity,
          voDeductiveQty: 0,
          revisedQuantity: item.revisedQuantity,
          voAdditiveCost: item.additionalAmount,
          voDeductiveCost: 0,
          revisedTotalCost: item.additionalAmount,
          isVariationItem: true,
          sourceVoNumber: vo.voNumber,
          status: 'PENDING',
          projectId: vo.projectId
        }
      });
    } else {
      const matchingItem = await prisma.consolidatedBOQItem.findFirst({
        where: {
          projectId: vo.projectId,
          description: { contains: item.description.trim().substring(0, 30) }
        }
      });

      if (matchingItem) {
        const addQty = item.additionalAmount > 0 ? (item.revisedQuantity - item.originalQuantity) : 0;
        const dedQty = item.deductiveAmount > 0 ? (item.originalQuantity - item.revisedQuantity) : 0;

        const newAdditiveQty = matchingItem.voAdditiveQty + Math.max(0, addQty);
        const newDeductiveQty = matchingItem.voDeductiveQty + Math.max(0, dedQty);
        const revisedQty = matchingItem.quantity + newAdditiveQty - newDeductiveQty;
        const revisedCost = revisedQty * matchingItem.unitCost;

        await prisma.consolidatedBOQItem.update({
          where: { id: matchingItem.id },
          data: {
            voAdditiveQty: newAdditiveQty,
            voDeductiveQty: newDeductiveQty,
            revisedQuantity: revisedQty,
            voAdditiveCost: matchingItem.voAdditiveCost + Math.max(0, item.additionalAmount),
            voDeductiveCost: matchingItem.voDeductiveCost + Math.max(0, item.deductiveAmount),
            revisedTotalCost: revisedCost,
            sourceVoNumber: matchingItem.sourceVoNumber
              ? `${matchingItem.sourceVoNumber}, ${vo.voNumber}`
              : vo.voNumber
          }
        });
      }
    }
  }

  console.log("Recalculated VO 2 and Applied to Consolidated BOQ.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
