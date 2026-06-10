import { prisma } from "@/lib/prisma";

export async function fetchProjectAccomplishments(projectId: string) {
  return await prisma.accomplishment.findMany({
    where: { projectId },
    include: {
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createAccomplishment(
  projectId: string,
  billingPeriod: string,
  accomplishmentDate: Date,
  items: any[]
) {
  // First, check constraints: ensure none of the items exceed 100% completion
  for (const item of items) {
    const boqItem = await prisma.awardedBOQItem.findUnique({
      where: { id: item.boqItemId },
    });
    if (!boqItem) throw new Error(`BOQ Item not found: ${item.boqItemId}`);

    // Assuming new current quantity claimed:
    const newTotal = boqItem.totalQuantityAccomplished + item.currentQuantityClaimed;
    if (newTotal > boqItem.quantity) {
      throw new Error(`Cannot exceed 100% completion for BOQ Item ${boqItem.itemCode}`);
    }
  }

  // Create accomplishment
  const accomplishment = await prisma.accomplishment.create({
    data: {
      projectId,
      billingPeriod,
      accomplishmentDate,
      items: {
        create: items.map((i) => ({
          boqItemId: i.boqItemId,
          currentQuantityClaimed: i.currentQuantityClaimed,
          previousQuantity: i.previousQuantity,
          totalQuantityToDate: i.previousQuantity + i.currentQuantityClaimed,
          contractQuantity: i.contractQuantity,
          remainingQuantity: i.contractQuantity - (i.previousQuantity + i.currentQuantityClaimed),
          unitCost: i.unitCost,
          currentAccomplishmentAmount: i.currentQuantityClaimed * i.unitCost,
          totalAccomplishmentAmount: (i.previousQuantity + i.currentQuantityClaimed) * i.unitCost,
          percentageAccomplished: ((i.previousQuantity + i.currentQuantityClaimed) / i.contractQuantity) * 100,
        })),
      },
    },
    include: { items: true },
  });

  // Update cumulative totals on AwardedBOQItem
  for (const item of items) {
    await prisma.awardedBOQItem.update({
      where: { id: item.boqItemId },
      data: {
        previousQuantityAccomplished: item.previousQuantity,
        currentQuantityAccomplished: item.currentQuantityClaimed,
        totalQuantityAccomplished: item.previousQuantity + item.currentQuantityClaimed,
        remainingQuantity: item.contractQuantity - (item.previousQuantity + item.currentQuantityClaimed),
        percentageAccomplished: ((item.previousQuantity + item.currentQuantityClaimed) / item.contractQuantity) * 100,
        amountAccomplished: (item.previousQuantity + item.currentQuantityClaimed) * item.unitCost,
      },
    });
  }

  return accomplishment;
}
