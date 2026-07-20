import { prisma } from './src/lib/prisma';
import { prismaBase } from './src/lib/prisma-base';
import { startTechnicalReview } from './src/lib/services/schedule-workflow.service';
import fs from 'fs';

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

  const idempotencyKey = `GATEWAY_TEST_${Date.now()}`;

  console.log('Testing explicit gateway...');
  
  // 1. Direct mutation test (should fail)
  try {
    await prisma.projectSchedule.update({
      where: { id: scheduleId },
      data: { workflowStatus: 'UNDER_TECHNICAL_REVIEW' }
    });
    console.error('FAILED: Direct mutation succeeded but should have been rejected!');
  } catch (err: any) {
    if (err.message.includes('GATE9D_DIRECT_MUTATION_REJECTED')) {
      console.log('Direct mutation correctly rejected.');
    } else {
      console.error('Direct mutation failed with wrong error:', err);
    }
  }

  // 2. Gateway test via service
  try {
    const result = await startTechnicalReview(
      projectId,
      scheduleId,
      2, // expectedRowVersion
      idempotencyKey,
      session
    );

    console.log('Gateway Transition Result:', result.status);
    console.log('Action:', result.transition.action);
    console.log('Resulting Status:', result.transition.toStatus);
    console.log('Row Version:', result.transition.resultingRowVersion);
    
    // Duplicate test
    const dup = await startTechnicalReview(
      projectId,
      scheduleId,
      2,
      idempotencyKey,
      session
    );
    console.log('Duplicate test:', dup.status);

    // Stale row version test
    try {
      await startTechnicalReview(
        projectId,
        scheduleId,
        1, // stale
        `GATEWAY_TEST_STALE_${Date.now()}`,
        session
      );
    } catch (err: any) {
      console.log('Stale row version rejected:', err.message);
    }

  } catch (err) {
    console.error('Error during gateway test:', err);
  } finally {
    console.log('Reverting...');
    
    // Use base client to revert since public client blocks writes
    await prismaBase.scheduleWorkflowTransition.deleteMany({
      where: {
        scheduleId,
        action: 'START_TECHNICAL_REVIEW'
      }
    });

    await prismaBase.projectSchedule.update({
      where: { id: scheduleId },
      data: {
        workflowStatus: 'READY_FOR_REVIEW',
        rowVersion: 2
      }
    });

    await prismaBase.auditLog.deleteMany({
      where: {
        actionType: 'SCHEDULE_TECHNICAL_REVIEW_STARTED',
        userId: manager!.id
      }
    });

    console.log('Revert completed.');
  }

  // 3. Test that base client is not exported publicly
  const prismaExports = fs.readFileSync('./src/lib/prisma.ts', 'utf8');
  if (prismaExports.includes('export { prismaBase }') || prismaExports.includes('export const prismaBase')) {
    console.error('FAILED: prismaBase is exported from prisma.ts!');
  } else {
    console.log('prismaBase is NOT exported publicly.');
  }
}

main().catch(console.error).finally(() => {
  prisma.$disconnect();
  prismaBase.$disconnect();
});
