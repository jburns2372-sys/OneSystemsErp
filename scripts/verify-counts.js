const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const lines = await prisma.awardedBOQItem.count();
  const locks = await prisma.projectBOQVersion.count({ where: { status: 'LOCKED' } });
  const schedules = await prisma.projectSchedule.count();
  const logs = await prisma.auditLog.count();
  console.log({ lines, locks, schedules, logs });
}
run().finally(() => prisma.$disconnect());
