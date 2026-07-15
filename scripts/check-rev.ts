import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const schedules = await prisma.projectSchedule.findMany({
    where: { projectId: 'cmrjo4msn0000vc9c7s65o3lt' }
  });
  console.log(schedules.map(s => ({
    id: s.id,
    revisionNumber: s.revisionNumber,
    revisionCode: s.revisionCode,
    baselineCode: s.baselineCode,
    workflowStatus: s.workflowStatus
  })));
}
main().finally(() => prisma.$disconnect());
