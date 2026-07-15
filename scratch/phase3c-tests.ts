import { prisma } from '../src/lib/prisma';
import { ProjectScheduleWorkflowStatus } from '@prisma/client';
import { 
  validateScheduleForReview, 
  startScheduleReview, 
  approveTechnicalReview, 
  returnScheduleForRevision, 
  rejectSchedule, 
  submitForBaselineApproval, 
  activateScheduleBaseline 
} from '../src/lib/scheduling/scheduleWorkflow';

async function runTests() {
  console.log('--- STARTING PHASE 3C TESTS ---');

  // 1. Setup a dummy project and schedule
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) throw new Error('No SUPER_ADMIN found');

  const project = await prisma.project.create({
    data: {
      name: 'Phase 3C Test Project',
      status: 'PLANNING'
    }
  });

  const schedule = await prisma.projectSchedule.create({
    data: {
      projectId: project.id,
      name: 'Test Schedule',
      workflowStatus: 'AI_GENERATED_DRAFT',
      status: 'DRAFT',
      awardedContractAmount: 1000,
      scheduledAmount: 1000,
      differenceAmount: 0
    }
  });

  // Create minimal valid WBS and activity structure
  const wbs = await prisma.scheduleWBS.create({
    data: { scheduleId: schedule.id, code: 'CONST', name: 'Testing and Commissioning Phase', level: 1, orderIndex: 1 }
  });

  const wbs2 = await prisma.scheduleWBS.create({
    data: { scheduleId: schedule.id, code: 'ACC', name: 'Project Acceptance and Demobilization Phase', level: 1, orderIndex: 2 }
  });

  const boqItem = await prisma.awardedBOQItem.create({
    data: { projectId: project.id, itemCode: 'TEST-1', description: 'Test', quantity: 1, unit: 'lot', directCost: 1000, indirectCost: 0, combinedUnitCost: 1000, totalCost: 1000 }
  });

  const activity1 = await prisma.scheduleActivity.create({
    data: {
      scheduleId: schedule.id,
      wbsId: wbs.id,
      name: 'Activity 1',
      plannedDuration: 5,
      plannedWeight: 1, // critical path
      plannedStartDate: new Date('2026-08-01'),
      plannedFinishDate: new Date('2026-08-05')
    }
  });

  const activity2 = await prisma.scheduleActivity.create({
    data: {
      scheduleId: schedule.id,
      wbsId: wbs2.id,
      name: 'Activity 2',
      plannedDuration: 5,
      plannedWeight: 1, // critical path
      plannedStartDate: new Date('2026-08-06'),
      plannedFinishDate: new Date('2026-08-10')
    }
  });

  await prisma.scheduleDependency.create({
    data: { scheduleId: schedule.id, predecessorId: activity1.id, successorId: activity2.id, type: 'FS', lagDays: 0 }
  });

  await prisma.scheduleBOQAllocation.create({
    data: { 
      schedule: { connect: { id: schedule.id } },
      allocatedQuantity: 1,
      activity: { connect: { id: activity1.id } },
      awardedBoqItem: { connect: { id: boqItem.id } }
    }
  });

  await prisma.projectSchedule.update({
    where: { id: schedule.id },
    data: { projectStartDate: new Date('2026-08-01'), projectCompletionDate: new Date('2026-08-10') }
  });

  let currentVersion = schedule.rowVersion;

  const assertThrows = async (fn: () => Promise<any>, expectedError: string) => {
    try {
      await fn();
      throw new Error(`Expected error containing "${expectedError}" but got none`);
    } catch (err: any) {
      if (!err.message.includes(expectedError)) {
        throw new Error(`Expected error containing "${expectedError}" but got "${err.message}"`);
      }
      console.log(`✅ Caught expected error: ${expectedError}`);
    }
  };

  // TEST 1: Validate -> READY_FOR_REVIEW
  console.log('Testing Validation...');
  const valResult = await validateScheduleForReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: currentVersion });
  if (!valResult.isValid) throw new Error('Schedule validation failed unexpectedly: ' + valResult.errors.join(', '));
  currentVersion++; // incremented inside validation
  console.log(`✅ Validated -> READY_FOR_REVIEW`);

  // TEST 2: Invalid transition
  console.log('Testing Invalid Transition...');
  await assertThrows(() => approveTechnicalReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, comments: 'Good', expectedRowVersion: currentVersion }), 'INVALID_WORKFLOW_TRANSITION');

  // TEST 3: Row version conflict
  console.log('Testing Concurrency Conflict...');
  await assertThrows(() => startScheduleReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: 999 }), 'SCHEDULE_VERSION_CONFLICT');

  // TEST 4: Start Review -> UNDER_TECHNICAL_REVIEW
  console.log('Testing Start Review...');
  await startScheduleReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: currentVersion });
  currentVersion++;
  console.log(`✅ Started Review -> UNDER_TECHNICAL_REVIEW`);

  // TEST 5: Return for Revision
  console.log('Testing Return for Revision...');
  await returnScheduleForRevision({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, reason: 'Needs work', expectedRowVersion: currentVersion });
  currentVersion++;
  console.log(`✅ Returned -> AI_GENERATED_DRAFT`);

  // Re-validate and start review
  await validateScheduleForReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: currentVersion });
  currentVersion++;
  await startScheduleReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: currentVersion });
  currentVersion++;

  // TEST 6: Approve Technical Review
  console.log('Testing Technical Approval...');
  await approveTechnicalReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, comments: 'LGTM', expectedRowVersion: currentVersion });
  currentVersion += 2; // validate + update increment
  console.log(`✅ Technically Approved -> TECHNICALLY_APPROVED`);

  // TEST 7: Submit for Baseline
  console.log('Testing Submit for Baseline...');
  await submitForBaselineApproval({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: currentVersion });
  currentVersion++;
  console.log(`✅ Submitted -> PENDING_BASELINE_APPROVAL`);

  // TEST 8: Activate Baseline
  console.log('Testing Activate Baseline...');
  await activateScheduleBaseline({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: currentVersion });
  currentVersion += 2; // validate + update increment
  console.log(`✅ Activated -> ACTIVE_BASELINE`);

  // TEST 9: Immutability Guard
  console.log('Testing Immutability Guard...');
  await assertThrows(() => validateScheduleForReview({ projectId: project.id, scheduleId: schedule.id, actorId: admin.id, expectedRowVersion: currentVersion }), 'INVALID_WORKFLOW_TRANSITION');

  console.log('--- ALL TESTS PASSED ---');

  // Cleanup
  await prisma.baselineActivation.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.scheduleApproval.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.scheduleDependency.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.scheduleBOQAllocation.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.scheduleActivity.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.scheduleWBS.deleteMany({ where: { scheduleId: schedule.id } });
  await prisma.projectSchedule.delete({ where: { id: schedule.id } });
  await prisma.awardedBOQItem.deleteMany({ where: { projectId: project.id } });
  await prisma.project.delete({ where: { id: project.id } });

}

runTests().then(() => {
  console.log('Done.');
  process.exit(0);
}).catch(err => {
  console.error('Test Failed:', err);
  process.exit(1);
});
