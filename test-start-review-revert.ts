import { prisma } from './src/lib/prisma';
import { transactionContext } from './src/lib/prisma';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';
  
  const manager = await prisma.user.findUnique({
    where: { email: 'manager@onesystemserp.com' }
  });

  await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
    // 1. Delete transition
    await prisma.scheduleWorkflowTransition.deleteMany({
      where: {
        scheduleId,
        action: 'START_TECHNICAL_REVIEW'
      }
    });

    // 2. Revert ProjectSchedule
    await prisma.projectSchedule.update({
      where: { id: scheduleId },
      data: {
        workflowStatus: 'READY_FOR_REVIEW',
        rowVersion: 2
      }
    });

    // 3. Delete audit log
    await prisma.auditLog.deleteMany({
      where: {
        actionType: 'SCHEDULE_TECHNICAL_REVIEW_STARTED',
        userId: manager!.id
      }
    });
  });

  console.log('Revert completed.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
