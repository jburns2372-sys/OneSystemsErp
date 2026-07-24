const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function check() {
  try {
    const ps = await prisma.projectSchedule.count();
    const swbs = await prisma.scheduleWBS.count();
    const sact = await prisma.scheduleActivity.count();
    const sdep = await prisma.scheduleDependency.count();
    const sboq = await prisma.scheduleBOQAllocation.count();
    const bact = await prisma.baselineActivation.count();
    const sapp = await prisma.scheduleApproval.count();
    const src = await prisma.scheduleReviewComment.count();
    console.log(JSON.stringify({ProjectSchedule: ps, ScheduleWBS: swbs, ScheduleActivity: sact, ScheduleDependency: sdep, ScheduleBOQAllocation: sboq, BaselineActivation: bact, ScheduleApproval: sapp, ScheduleReviewComment: src}, null, 2));
  } catch(e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}
check();
