import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const schedule = await prisma.projectSchedule.findUnique({ where: { id: 'cmrjou0ne0001vcf01eju4dh8' } });
  console.log(schedule?.workflowStatus, schedule?.rowVersion);
  
  const recovery = await prisma.scheduleRevisionReason.findFirst({
    where: { parentScheduleId: 'cmrjou0ne0001vcf01eju4dh8' }
  });
  console.log('Recovery record:', recovery?.scheduleId);
}
main().finally(() => prisma.$disconnect());
