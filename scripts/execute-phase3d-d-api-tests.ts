import { PrismaClient, ProjectScheduleWorkflowStatus } from '@prisma/client';
import { startScheduleReview, approveTechnicalReview, returnScheduleForRevision, rejectSchedule, submitForBaselineApproval, activateScheduleBaseline } from '../src/lib/scheduling/scheduleWorkflow';
import { createNewScheduleRevision } from '../src/lib/scheduling/scheduleRevision';
import { checkSchedulingAccess } from '../src/lib/scheduling/authUtils';

const prisma = new PrismaClient();

async function runTests() {
  console.log('--- Phase 3D-D API Integration Tests (Direct Function Calls) ---');
  
  const projectId = 'cmrjo4msn0000vc9c7s65o3lt';
  const scheduleId = 'cmrjou0ne0001vcf01eju4dh8';

  // 1. Reset schedule to READY_FOR_REVIEW
  let schedule = await prisma.projectSchedule.update({
    where: { id: scheduleId },
    data: { workflowStatus: ProjectScheduleWorkflowStatus.READY_FOR_REVIEW, status: 'DRAFT', rowVersion: { increment: 1 } }
  });
  console.log('[Setup] Schedule reset to READY_FOR_REVIEW. RowVersion:', schedule.rowVersion);

  const techUser = await prisma.user.findFirst({ where: { email: 'tech_reviewer@test.com' } });
  const appUser = await prisma.user.findFirst({ where: { email: 'baseline_approver@test.com' } });
  const unauthUser = await prisma.user.findFirst({ where: { email: 'unauth_user@test.com' } });

  let rowVersion = schedule.rowVersion;

  // TEST 1: Tech Reviewer starts review
  console.log('\n[Test 1] Tech Reviewer starts review');
  let access = await checkSchedulingAccess(techUser!.id, techUser!.role, projectId, 'canReview');
  if (!access.allowed) throw new Error('Test 1 Access Failed');
  await startScheduleReview({ projectId, scheduleId, actorId: techUser!.id, expectedRowVersion: rowVersion });
  console.log('Test 1 Passed');
  rowVersion++;

  // TEST 2: Unauth user tries to approve
  console.log('\n[Test 2] Unauth user tries to approve (Expect 403 / Access Denied)');
  access = await checkSchedulingAccess(unauthUser!.id, unauthUser!.role, projectId, 'canApprove');
  if (access.allowed) throw new Error('Test 2 Access Failed');
  console.log('Test 2 Passed (Access Denied)');

  // TEST 3: Tech Reviewer approves
  console.log('\n[Test 3] Tech Reviewer approves (Expect 200)');
  access = await checkSchedulingAccess(techUser!.id, techUser!.role, projectId, 'canApprove');
  if (!access.allowed) throw new Error('Test 3 Access Failed');
  await approveTechnicalReview({ projectId, scheduleId, actorId: techUser!.id, comments: 'Tech Approval', expectedRowVersion: rowVersion });
  console.log('Test 3 Passed');
  rowVersion += 2; // Increments by 2 (validation + approval)

  // TEST 4: Tech Reviewer tries to submit for baseline
  console.log('\n[Test 4] Tech Reviewer submits for baseline (Expect Access Denied)');
  access = await checkSchedulingAccess(techUser!.id, techUser!.role, projectId, 'canSubmit');
  if (access.allowed) throw new Error('Test 4 Access Failed');
  console.log('Test 4 Passed (Access Denied)');

  // TEST 5: Baseline Approver submits for baseline
  console.log('\n[Test 5] Baseline Approver submits for baseline');
  access = await checkSchedulingAccess(appUser!.id, appUser!.role, projectId, 'canSubmit');
  if (!access.allowed) throw new Error('Test 5 Access Failed');
  await submitForBaselineApproval({ projectId, scheduleId, actorId: appUser!.id, expectedRowVersion: rowVersion });
  console.log('Test 5 Passed');
  rowVersion++;

  // TEST 6: Baseline Approver activates baseline
  console.log('\n[Test 6] Baseline Approver activates baseline');
  access = await checkSchedulingAccess(appUser!.id, appUser!.role, projectId, 'canLock');
  if (!access.allowed) throw new Error('Test 6 Access Failed');
  await activateScheduleBaseline({ projectId, scheduleId, actorId: appUser!.id, expectedRowVersion: rowVersion });
  console.log('Test 6 Passed');
  rowVersion++;

  // TEST 8: Revision route
  const activeSched = await prisma.projectSchedule.findUnique({ where: { id: scheduleId } });
  
  console.log('\n[Test 8] Baseline Approver creates revision');
  access = await checkSchedulingAccess(appUser!.id, appUser!.role, projectId, 'canRevise');
  if (!access.allowed) throw new Error('Test 8 Access Failed');
  const newSched = await createNewScheduleRevision({ 
    projectId, 
    parentScheduleId: scheduleId, 
    actorId: appUser!.id, 
    reason: 'Scope change', 
    expectedRowVersion: activeSched!.rowVersion 
  });
  console.log(`Test 8 Passed. New revision created: ${newSched.id}`);

  console.log('\nALL TESTS PASSED SUCCESSFULLY.');
}

runTests().catch(e => {
  console.error('TEST SUITE FAILED:', e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
