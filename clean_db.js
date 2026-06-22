const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const res1 = await prisma.procurementBenchmarkItem.deleteMany({
    where: {
      description: {
        contains: 'TOTAL PROJECT COST'
      }
    }
  });
  console.log('Deleted from ProcurementBenchmarkItem:', res1.count);

  const res2 = await prisma.consolidatedBOQItem.deleteMany({
    where: {
      description: {
        contains: 'TOTAL PROJECT COST'
      }
    }
  });
  console.log('Deleted from ConsolidatedBOQItem:', res2.count);
}

main().finally(() => prisma.$disconnect());
