import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.projectSchedule.findMany({
    include: { _count: { select: { activities: true } } }
  });

  for (const s of schedules) {
    if (s._count.activities === 0) {
      console.log(`Deleting stuck schedule: ${s.id}`);
      await prisma.projectSchedule.delete({ where: { id: s.id } });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
