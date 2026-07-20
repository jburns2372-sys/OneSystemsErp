import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const schedule = await prisma.projectSchedule.findFirst({
    where: { projectId: 'cmrispdp5000zvcqs8p16dxkc' }
  });
  if (schedule) {
    const wbs = await prisma.scheduleWBS.findMany({
      where: { scheduleId: schedule.id }
    });
    console.log("WBS PHASES:", wbs.map(w => w.name));
    const items = await prisma.awardedBOQItem.findMany({
      where: { projectId: 'cmrispdp5000zvcqs8p16dxkc' }
    });
    const totalAwarded = items.reduce((sum, item) => sum + item.totalCost, 0);
    console.log("TOTAL AWARDED ITEMS SUM:", totalAwarded);
  }
}
main();
