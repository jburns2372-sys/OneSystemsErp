const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const deliveries = await prisma.delivery.findMany({
    where: { status: 'APPROVED' },
    include: {
      items: { include: { consolidatedBoqItem: true } },
      po: { include: { supplier: true } },
      payable: true
    }
  });

  for (const delivery of deliveries) {
    if (!delivery.payable) {
      const totalAmount = delivery.items.reduce((sum, item) => sum + (item.quantity * item.consolidatedBoqItem.unitCost), 0);
      
      let termDays = 0;
      if (delivery.po.supplier.paymentTerms) {
        const match = delivery.po.supplier.paymentTerms.match(/(\d+)/);
        if (match) termDays = parseInt(match[1], 10);
      }
      
      const dueDate = new Date(delivery.createdAt);
      dueDate.setDate(dueDate.getDate() + termDays);

      await prisma.accountsPayable.create({
        data: {
          amount: totalAmount,
          netAmount: totalAmount,
          dueDate: dueDate,
          status: 'PENDING',
          deliveryId: delivery.id,
          poId: delivery.poId,
          supplierId: delivery.po.supplierId,
        }
      });
      console.log('Created AccountsPayable for Delivery:', delivery.receiptNumber);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
