import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.projectSchedule.update({
    where: { id: 'clean-candidate-1784004755783' },
    data: {
      workflowStatus: 'READY_FOR_REVIEW',
      rowVersion: 2,
      approvals: { deleteMany: {} },
      baselineActivations: { deleteMany: {} },
      baselineCode: null,
      revisionNumber: null,
      revisionCode: null,
      activatedAt: null,
      activatedById: null,
      baselineStartDate: null,
      baselineFinishDate: null
    }
  });
  console.log('RESET');
}
main().finally(() => prisma.$disconnect());
