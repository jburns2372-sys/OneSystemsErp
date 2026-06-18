import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deliveries = await prisma.delivery.findMany({
    where: { receiptNumber: { contains: '002' } }
  });

  for (const delivery of deliveries) {
    await prisma.deliveryItem.deleteMany({
      where: { deliveryId: delivery.id }
    });

    await prisma.delivery.delete({
      where: { id: delivery.id }
    });

    await prisma.delivery.delete({
      where: { id: delivery.id }
    });
  }

  console.log('Successfully reverted delivery receipt 002.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
