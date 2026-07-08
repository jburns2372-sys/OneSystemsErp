import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.projectSchedule.count();
  const schedules = await prisma.projectSchedule.findMany({
    select: { id: true, projectId: true, name: true, status: true }
  });
  console.log('Total schedules:', count);
  console.table(schedules);
}

main().catch(console.error).finally(() => prisma.$disconnect());
