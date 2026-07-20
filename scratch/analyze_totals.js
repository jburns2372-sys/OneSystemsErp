const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmqr0j0pp01h0vcz0m8f4zjex';
  
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  
  const awardedItems = await prisma.awardedBOQItem.findMany({ where: { projectId } });
  const awardedTotal = awardedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  
  const benchmarkItems = await prisma.procurementBenchmarkItem.findMany({ where: { projectId } });
  const benchmarkTotal = benchmarkItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  
  const consolidatedItems = await prisma.consolidatedBOQItem.findMany({ where: { projectId } });
  const consolidatedTotal = consolidatedItems.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  
  console.log(`Project Awarded BOQ Total: ${project?.contractAmount}`);
  console.log(`Calculated Awarded Items Total: ${awardedTotal}`);
  console.log(`Calculated Benchmark Items Total: ${benchmarkTotal}`);
  console.log(`Calculated Consolidated Items Total: ${consolidatedTotal}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
