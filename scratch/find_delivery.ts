import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const deliveries = await prisma.delivery.findMany({
    where: {
      receiptNumber: {
        contains: '002'
      }
    },
    include: {
      items: true
    }
  });

  console.log(JSON.stringify(deliveries, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
