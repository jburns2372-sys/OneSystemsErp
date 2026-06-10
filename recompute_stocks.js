const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const items = await prisma.consolidatedBOQItem.findMany({
    include: {
      deliveryItems: { include: { delivery: true } },
      issuanceItems: { include: { issuance: true } },
      returnItems: { include: { materialReturn: true } }
    }
  });

  for (const item of items) {
    let actualDelivered = 0;
    for (const d of item.deliveryItems) {
      if (d.delivery.status === 'RECEIVED' || d.delivery.status === 'PENDING_PAYMENT') {
        actualDelivered += d.quantity;
      }
    }

    let actualConsumed = 0;
    for (const i of item.issuanceItems) {
      if (i.issuance.status === 'RELEASED' || i.issuance.status === 'COMPLETED' || i.issuance.status === 'APPROVED') {
        actualConsumed += i.releasedQty;
      }
    }

    let actualReturned = 0;
    for (const r of item.returnItems) {
      if (r.materialReturn.status === 'COMPLETED' || r.materialReturn.status === 'RECEIVED') {
        if (r.condition === 'GOOD') {
          actualReturned += r.returnedQty;
          actualConsumed -= r.returnedQty;
        }
      }
    }

    if (actualDelivered !== item.deliveredQty || actualConsumed !== item.consumedQty) {
      console.log(`Mismatch on [${item.description}]:`);
      console.log(`  Delivered: DB says ${item.deliveredQty}, Actual is ${actualDelivered}`);
      console.log(`  Consumed:  DB says ${item.consumedQty}, Actual is ${actualConsumed}`);
      console.log(`  (Issuances: ${actualConsumed + actualReturned}, Returned GOOD: ${actualReturned})`);
      
      // Fixing the DB directly
      await prisma.consolidatedBOQItem.update({
        where: { id: item.id },
        data: {
          deliveredQty: actualDelivered,
          consumedQty: actualConsumed
        }
      });
      console.log(`  -> Fixed!`);
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
