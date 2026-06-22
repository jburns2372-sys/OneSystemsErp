const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const items = await prisma.procurementBenchmarkItem.findMany({
    orderBy: { totalCost: 'desc' },
    take: 20
  });
  console.log(items);
}

main().finally(() => prisma.$disconnect());
