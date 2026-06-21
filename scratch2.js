const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const voId = 'cmqo7eebw00pyvckcjukhvn0l';
  const vo = await prisma.variationOrder.findUnique({
    where: { id: voId },
    include: { items: true, project: true }
  });
  if (!vo) return;

  for (const item of vo.items) {
    if (item.itemClassification === 'ADDITIONAL_WORK' || item.itemClassification === 'NEW_ITEM') {
      // Create a brand-new consolidated BOQ entry for this additional work
      const itemCount = await prisma.consolidatedBOQItem.count({ where: { projectId: vo.projectId } });
      const newItemCode = `VO-${String(itemCount + 1).padStart(3, '0')}`;

      await prisma.consolidatedBOQItem.create({
        data: {
          itemCode: newItemCode,
          category: item.workCategory || 'Variation Order',
          description: item.description,
          unit: item.unit,
          quantity: 0, // original quantity is zero (new item)
          unitCost: item.approvedUnitCost,
          totalCost: 0, // original total is zero
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
      // BOQ_ADJUSTMENT: try to match to an existing consolidated item by description
      const matchingItem = await prisma.consolidatedBOQItem.findFirst({
        where: {
          projectId: vo.projectId,
          description: item.description
        }
      });

      if (matchingItem) {
        let updatedAdditiveQty = matchingItem.voAdditiveQty || 0;
        let updatedDeductiveQty = matchingItem.voDeductiveQty || 0;
        let updatedAdditiveCost = matchingItem.voAdditiveCost || 0;
        let updatedDeductiveCost = matchingItem.voDeductiveCost || 0;

        if (item.itemClassification === 'ADDITIVE') {
          updatedAdditiveQty += item.currentProposedQuantity; // qty added
          updatedAdditiveCost += item.additionalAmount;
        } else if (item.itemClassification === 'DEDUCTIVE') {
          updatedDeductiveQty += item.currentProposedQuantity; // qty deducted
          updatedDeductiveCost += item.deductiveAmount;
        }

        const newRevisedQty = matchingItem.quantity + updatedAdditiveQty - updatedDeductiveQty;
        const newRevisedCost = matchingItem.totalCost + updatedAdditiveCost - updatedDeductiveCost;

        await prisma.consolidatedBOQItem.update({
          where: { id: matchingItem.id },
          data: {
            voAdditiveQty: updatedAdditiveQty,
            voDeductiveQty: updatedDeductiveQty,
            revisedQuantity: newRevisedQty,
            voAdditiveCost: updatedAdditiveCost,
            voDeductiveCost: updatedDeductiveCost,
            revisedTotalCost: newRevisedCost,
            sourceVoNumber: matchingItem.sourceVoNumber 
              ? `${matchingItem.sourceVoNumber}, ${vo.voNumber}` 
              : vo.voNumber
          }
        });
      }
    }
  }
  console.log("Applied VO to Consolidated BOQ.");
}

run().catch(console.error).finally(() => prisma.$disconnect());
