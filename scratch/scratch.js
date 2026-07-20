const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const voId = 'cmqo7eebw00pyvckcjukhvn0l';
  const vo = await prisma.variationOrder.findUnique({
    where: { id: voId },
    include: { items: true, project: true }
  });

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

  console.log("Recalculated VO:", {
    totalAdditional, totalDeductive, netAmount, revisedContractAmount
  });
}

run().catch(console.error).finally(() => prisma.$disconnect());
