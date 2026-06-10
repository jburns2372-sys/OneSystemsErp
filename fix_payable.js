const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const payables = await prisma.accountsPayable.findMany({
    include: {
      delivery: {
        include: {
          items: { include: { consolidatedBoqItem: true } }
        }
      },
      po: {
        include: { items: true }
      }
    }
  });

  for (const payable of payables) {
    const totalAmount = payable.delivery.items.reduce((sum, item) => {
      const poItem = payable.po.items.find(i => i.consolidatedBoqItemId === item.consolidatedBoqItemId);
      const unitCost = poItem ? poItem.unitCost : item.consolidatedBoqItem.unitCost;
      return sum + (item.quantity * unitCost);
    }, 0);

    await prisma.accountsPayable.update({
      where: { id: payable.id },
      data: {
        amount: totalAmount,
        netAmount: totalAmount
      }
    });
    console.log('Updated AccountsPayable for Delivery:', payable.delivery.receiptNumber, 'New Amount:', totalAmount);
  }
}
main().catch(console.error).finally(() => { prisma.$disconnect(); process.exit(0); });
