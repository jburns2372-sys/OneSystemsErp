import { prisma, transactionContext } from './src/lib/prisma';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const transition = await prisma.scheduleWorkflowTransition.findFirst({
    where: { scheduleId }
  });

  const logs = await prisma.auditLog.findMany({
    where: { actionType: 'SCHEDULE_SUBMITTED_FOR_REVIEW' }
  });

  await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
    if (transition) {
      await prisma.scheduleWorkflowTransition.delete({ where: { id: transition.id } });
    }
  
    for (const log of logs) {
      if (log.newValue && log.newValue.includes(scheduleId)) {
        await prisma.auditLog.delete({ where: { id: log.id } });
      }
    }
  
    await prisma.projectSchedule.update({
      where: { id: scheduleId, projectId },
      data: {
        workflowStatus: 'AI_GENERATED_DRAFT',
        rowVersion: { decrement: 1 }
      }
    });
  });

  console.log('REVERTED!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
