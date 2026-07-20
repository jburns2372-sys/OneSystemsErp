const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const scheduleId = '641f4c56e72847e6a5e3288d0';
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId }
  });
  console.log(JSON.stringify(schedule, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
