const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const item = await prisma.consolidatedBOQItem.findFirst({
    where: {
      category: {
        contains: '5.0m pump Lift'
      }
    }
  });

  if (item) {
    console.log('Found item with category:', item.category);
    await prisma.consolidatedBOQItem.update({
      where: { id: item.id },
      data: { category: 'ACU PUMPS' }
    });
    console.log('Updated category to ACU PUMPS');
  } else {
    console.log('Item not found');
  }
}

main().finally(() => prisma.$disconnect());
