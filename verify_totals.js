const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const benchmarkItems = await prisma.procurementBenchmarkItem.findMany();
  const consolidatedItems = await prisma.consolidatedBOQItem.findMany();

  const benchTotal = benchmarkItems.reduce((acc, i) => acc + i.totalCost, 0);
  const consTotal = consolidatedItems.reduce((acc, i) => acc + i.totalCost, 0);

  const benchQty = benchmarkItems.reduce((acc, i) => acc + i.quantity, 0);
  const consQty = consolidatedItems.reduce((acc, i) => acc + i.quantity, 0);

  console.log('Benchmark Items Count:', benchmarkItems.length);
  console.log('Consolidated Items Count:', consolidatedItems.length);
  
  console.log('Benchmark Total Cost:', benchTotal);
  console.log('Consolidated Total Cost:', consTotal);

  console.log('Benchmark Total Qty:', benchQty);
  console.log('Consolidated Total Qty:', consQty);
}

main().finally(() => prisma.$disconnect());
