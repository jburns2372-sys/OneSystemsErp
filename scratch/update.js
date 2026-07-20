const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const item = await prisma.consolidatedBOQItem.findFirst({
    where: {
      itemCode: {
        contains: 'C049-'
      }
    }
  });

  if (item) {
    console.log('Found item:', item.itemCode);
    await prisma.consolidatedBOQItem.update({
      where: { id: item.id },
      data: { itemCode: 'C049- ACU PUMPS' }
    });
    console.log('Updated item to C049- ACU PUMPS');
  } else {
    console.log('Item C049- not found');
  }
}

main().finally(() => prisma.$disconnect());
