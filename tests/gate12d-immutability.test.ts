import { PrismaClient } from '@prisma/client';
import { prismaBase } from '../src/lib/prisma-base';
import { prisma } from '../src/lib/prisma';
import { executeStartTechnicalReviewMutation } from '../src/lib/services/schedule-gateway';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Use a separate clean client to create the disposable records
const db = prismaBase;

async function setupIsolatedBaseline() {
  const user = await db.user.findFirst();
  const userId = user?.id || 'test-user';

  const dummyProject = await db.project.create({
    data: {
      name: 'GATE 12D Dummy Project ' + Date.now()
    }
  });

  const projectId = dummyProject.id;
  const scheduleId = 'gate12d-test-sched-' + Date.now();
  
  await db.projectSchedule.create({
    data: {
      id: scheduleId,
      projectId,
      name: 'GATE 12D Isolated Immutability Test',
      workflowStatus: 'ACTIVE_BASELINE',
      rowVersion: 1,
      reviewRound: 1,
      revisionNumber: 9999,
      revisionCode: 'TEST-REV-' + Date.now(),
      lockedBOQChecksum: 'test-checksum',
      awardedContractAmount: 1000,
      scheduledAmount: 1000,
      differenceAmount: 0,
      activities: {
        create: [
          {
            id: 'act-' + scheduleId,
            name: 'Test Activity',
            plannedDuration: 5,
            status: 'NOT_STARTED'
          }
        ]
      },
      wbsNodes: {
        create: [
          {
            id: 'wbs-' + scheduleId,
            name: 'Test WBS',
            level: 1,
            code: 'T'
          }
        ]
      },
      baselineActivations: {
        create: [
          {
            id: 'actv-' + scheduleId,
            reviewRound: 1,
            revisionCode: 'TEST-REV-0',
            validationSnapshot: '{}',
            snapshotVersion: '1.0',
            scheduleSnapshotHash: 'hash',
            lockedBOQChecksum: 'test-checksum',
            activatedById: userId,
            activatedByNameSnapshot: 'Test User',
            activatedByRoleSnapshot: 'PROJECT_DIRECTOR'
          }
        ]
      }
    }
  });

  return { scheduleId, projectId, userId };
}

async function runTests() {
  console.log('--- GATE 12D IMMUTABILITY TESTS ---');
  let successCount = 0;
  let failCount = 0;

  const { scheduleId, projectId, userId } = await setupIsolatedBaseline();
  console.log(`Created isolated schedule: ${scheduleId} for project ${projectId}`);

  const runTest = async (name: string, fn: () => Promise<any>, expectedError: string) => {
    try {
      await fn();
      console.log(`❌ FAILED: ${name} (Did not reject as expected)`);
      failCount++;
    } catch (e: any) {
      if (e.message.includes(expectedError)) {
        console.log(`✅ PASSED: ${name}`);
        successCount++;
      } else {
        console.log(`❌ FAILED: ${name} (Threw wrong error: ${e.message})`);
        failCount++;
      }
    }
  };

  const directMutationErr = 'GATE9D_DIRECT_MUTATION_REJECTED';

  // 1. ProjectSchedule status rollback
  await runTest('ProjectSchedule status rollback', async () => {
    await prisma.projectSchedule.update({
      where: { id: scheduleId },
      data: { workflowStatus: 'DRAFT' }
    });
  }, directMutationErr);

  // 2. ProjectSchedule date, amount, checksum or lock-field change
  await runTest('ProjectSchedule amount/lock change', async () => {
    await prisma.projectSchedule.update({
      where: { id: scheduleId },
      data: { awardedContractAmount: 9999 }
    });
  }, directMutationErr);

  // 3. Schedule deletion
  await runTest('Schedule deletion', async () => {
    await prisma.projectSchedule.delete({
      where: { id: scheduleId }
    });
  }, directMutationErr);

  // 4. WBS creation, update or deletion
  await runTest('WBS creation', async () => {
    await prisma.scheduleWBS.create({
      data: {
        scheduleId,
        name: 'New WBS',
        level: 2,
        code: 'N'
      }
    });
  }, directMutationErr);

  await runTest('WBS update', async () => {
    await prisma.scheduleWBS.update({
      where: { id: 'wbs-' + scheduleId },
      data: { name: 'Mutated' }
    });
  }, directMutationErr);

  await runTest('WBS deletion', async () => {
    await prisma.scheduleWBS.delete({
      where: { id: 'wbs-' + scheduleId }
    });
  }, directMutationErr);

  // 5. Activity creation, update or deletion
  await runTest('Activity creation', async () => {
    await prisma.scheduleActivity.create({
      data: {
        scheduleId,
        name: 'New Activity',
        plannedDuration: 1,
        status: 'NOT_STARTED'
      }
    });
  }, directMutationErr);

  await runTest('Activity deletion', async () => {
    await prisma.scheduleActivity.delete({
      where: { id: 'act-' + scheduleId }
    });
  }, directMutationErr);

  // 6. Activity date or duration change
  await runTest('Activity date/duration change', async () => {
    await prisma.scheduleActivity.update({
      where: { id: 'act-' + scheduleId },
      data: { plannedDuration: 10 }
    });
  }, directMutationErr);

  // 7. Dependency creation, update or deletion
  await runTest('Dependency creation', async () => {
    await prisma.scheduleDependency.create({
      data: {
        scheduleId,
        predecessorId: 'act-' + scheduleId,
        successorId: 'act-' + scheduleId,
        type: 'FS'
      }
    });
  }, directMutationErr);

  // 8. BOQ allocation creation, update or deletion
  await runTest('BOQ allocation creation', async () => {
    await prisma.scheduleBOQAllocation.create({
      data: {
        scheduleId,
        activityId: 'act-' + scheduleId,
        awardedBoqItemId: 'dummy',
        allocatedQuantity: 1,
        allocatedAmount: 1
      }
    });
  }, directMutationErr);

  // 9. Financial allocation change
  await runTest('Financial allocation change', async () => {
    await prisma.scheduleBOQAllocation.updateMany({
      where: { scheduleId },
      data: { allocatedAmount: 5000 }
    });
  }, directMutationErr);

  // 10. Additional review comment
  await runTest('Additional review comment', async () => {
    await prisma.scheduleReviewComment.create({
      data: {
        scheduleId,
        authorId: userId,
        content: 'test',
        reviewRound: 1
      }
    });
  }, directMutationErr);

  // 11. Additional approval
  await runTest('Additional approval', async () => {
    await prisma.scheduleApproval.create({
      data: {
        scheduleId,
        approverId: userId,
        approvalStage: 'TECHNICAL',
        reviewRound: 1
      }
    });
  }, directMutationErr);

  // 12. Additional workflow submission or review action
  await runTest('Additional workflow transition via gateway', async () => {
    await executeStartTechnicalReviewMutation({
      projectId: projectId,
      scheduleId: scheduleId,
      expectedRowVersion: 1,
      idempotencyKeyHash: 'test-hash',
      actorUserId: userId,
      actorSessionVersion: 1,
      action: 'START_TECHNICAL_REVIEW'
    });
  }, 'Invalid status transition'); // this tests the gateway checking

  // 13. Second baseline activation
  await runTest('Second baseline activation', async () => {
    await prisma.baselineActivation.create({
      data: {
        scheduleId,
        projectId,
        activatedById: 'test-user',
        activatedByNameSnapshot: 'Test User',
        activatedByRoleSnapshot: 'PROJECT_DIRECTOR',
        reviewRound: 1,
        revisionCode: 'TEST-REV-' + Date.now(),
        validationSnapshot: '{}',
        snapshotVersion: '1.0',
        scheduleSnapshotHash: 'hash',
        lockedBOQChecksum: 'chk'
      }
    });
  }, directMutationErr);

  // 14. BaselineActivation update or deletion
  await runTest('BaselineActivation update', async () => {
    await prisma.baselineActivation.update({
      where: { id: 'actv-' + scheduleId },
      data: { lockedBOQChecksum: 'hacked' }
    });
  }, directMutationErr);

  await runTest('BaselineActivation deletion', async () => {
    await prisma.baselineActivation.delete({
      where: { id: 'actv-' + scheduleId }
    });
  }, directMutationErr);

  // 15. Direct protected mutation through the public Prisma client
  await runTest('Direct protected mutation through public Prisma client', async () => {
    await prisma.projectSchedule.update({
      where: { id: scheduleId },
      data: { name: 'Hacked name' }
    });
  }, directMutationErr);

  console.log(`\nResults: ${successCount} PASSED, ${failCount} FAILED`);
  
  // Cleanup
  await db.baselineActivation.deleteMany({ where: { scheduleId } });
  await db.scheduleActivity.deleteMany({ where: { scheduleId } });
  await db.scheduleWBS.deleteMany({ where: { scheduleId } });
  await db.projectSchedule.delete({ where: { id: scheduleId } });
  await db.project.delete({ where: { id: projectId } });
  
  if (failCount > 0) {
    process.exit(1);
  }
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
