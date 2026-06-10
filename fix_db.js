const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const items = await prisma.consolidatedBOQItem.findMany({
    include: {
      issuanceItems: { include: { issuance: true } },
      returnItems: { include: { materialReturn: true } }
    }
  });
  
  let fixedCount = 0;
  for (const item of items) {
    let consumed = 0;
    
    for (const ii of item.issuanceItems) {
      if (ii.issuance.status === 'RELEASED') {
        consumed += ii.releasedQty;
      }
    }
    
    for (const ri of item.returnItems) {
      if (ri.materialReturn.status === 'RECEIVED' && ri.condition === 'GOOD') {
        consumed -= ri.returnedQty;
      }
    }
    
    if (item.consumedQty !== consumed) {
      console.log(`Fixing item ${item.description} from ${item.consumedQty} to ${consumed}`);
      await prisma.consolidatedBOQItem.update({
        where: { id: item.id },
        data: { consumedQty: consumed }
      });
      fixedCount++;
    }
  }
  console.log(`Fixed ${fixedCount} items.`);
}

fix()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
