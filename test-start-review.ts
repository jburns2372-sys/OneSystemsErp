import { prisma } from './src/lib/prisma';
import { startTechnicalReview } from './src/lib/services/schedule-workflow.service';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const manager = await prisma.user.findUnique({
    where: { email: 'manager@onesystemserp.com' }
  });

  const session = {
    userId: manager!.id,
    email: manager!.email || '',
    sessionVersion: manager!.sessionVersion || 1,
    accountActive: manager!.status === 'ACTIVE',
    accountLocked: false,
    mustChangePassword: false
  };

  const idempotencyKey = `START_TECHNICAL_REVIEW_TEST_${Date.now()}`;

  try {
    console.log('Running START_TECHNICAL_REVIEW transition...');
    const result = await startTechnicalReview(
      projectId,
      scheduleId,
      2, // expectedRowVersion
      idempotencyKey,
      session
    );

    console.log('Transition Result:', result);
    console.log('Action:', result.transition.action);
    console.log('Resulting Status:', result.transition.toStatus);
    
    // Verify a duplicate request fails with IDEMPOTENCY_SUCCESS
    const duplicateResult = await startTechnicalReview(
      projectId,
      scheduleId,
      2,
      idempotencyKey,
      session
    );
    console.log('Duplicate Result Status:', duplicateResult.status);

  } catch (err) {
    console.error('Error during transition:', err);
  } finally {
    // Revert state
    console.log('Reverting state to maintain real-state verification...');
    
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

    console.log('Revert completed.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
