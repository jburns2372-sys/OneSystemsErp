import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const schedule = await prisma.projectSchedule.findFirst({
    orderBy: { createdAt: 'desc' }
  });
  console.log("Most recent schedule:");
  console.log(schedule);
}

main().finally(() => prisma.$disconnect());
