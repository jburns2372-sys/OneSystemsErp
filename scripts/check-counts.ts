import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const pId = 'cmrhu7e9f0004vcwoq0uhvaao';
  const a = await prisma.awardedBOQItem.count({ where: { projectId: pId }});
  const b = await prisma.procurementBenchmarkItem.count({ where: { projectId: pId }});
  const c = await prisma.consolidatedBOQItem.count({ where: { projectId: pId }});
  console.log({ Awarded: a, Benchmark: b, Consolidated: c });
  
  const bList = await prisma.procurementBenchmarkItem.findMany({ where: { projectId: pId }, take: 10 });
  console.log(bList);
}
check().then(() => prisma.$disconnect());
