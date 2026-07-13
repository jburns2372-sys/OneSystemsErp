import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmriveop10378vcqsma96byxi';
  const awarded = await prisma.awardedBOQItem.findMany({ where: { projectId } });
  
  const schedule = await prisma.projectSchedule.findFirst({
    where: { projectId }
  });
  
  if (!schedule) { console.log('no schedule'); return; }
  
  const mappings = await prisma.scheduleBOQAllocation.findMany({
    where: { activity: { scheduleId: schedule.id } }
  });
  
  const mappedIds = new Set(mappings.map(m => m.awardedBoqItemId));
  
  const unmapped = awarded.filter(a => !mappedIds.has(a.id));
  
  console.log(`Total Awarded: ${awarded.length}`);
  console.log(`Total Mapped: ${mappings.length}`);
  console.log(`Total Unmapped: ${unmapped.length}`);
  
  let unmappedCost = 0;
  for (const u of unmapped) {
    console.log(`Unmapped: ${u.description} (Qty: ${u.quantity}) | Cost: ${u.totalCost}`);
    unmappedCost += (u.totalCost || 0);
  }
  console.log(`Total Unmapped Cost: ${unmappedCost}`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
