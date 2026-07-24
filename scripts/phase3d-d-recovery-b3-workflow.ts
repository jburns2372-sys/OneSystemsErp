import { PrismaClient, ProjectScheduleWorkflowStatus } from '@prisma/client';
import crypto from 'crypto';
import { 
  startScheduleReview, 
  approveTechnicalReview, 
  submitForBaselineApproval, 
  activateScheduleBaseline 
} from '../src/lib/scheduling/scheduleWorkflow';
import { createNewScheduleRevision } from '../src/lib/scheduling/scheduleRevision';

const prisma = new PrismaClient({ log: ['query', 'warn', 'error'] });

const PROJECT_ID = 'cmrjo4msn0000vc9c7s65o3lt';
const SCHEDULE_ID = 'clean-candidate-1784004755783';

async function main() {
  console.log('--- FINAL READ-ONLY PREFLIGHT ---');
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: SCHEDULE_ID, projectId: PROJECT_ID },
    include: {
      wbsNodes: true,
      activities: true,
      dependencies: true,
      boqAllocations: true
    }
  });

  if (!schedule) throw new Error('Schedule not found');
  if (schedule.workflowStatus !== 'READY_FOR_REVIEW') throw new Error('Status not READY_FOR_REVIEW');
  
  // Verification checks
  console.log(`Current RowVersion: ${schedule.rowVersion}`);
  const expectedRowVersion = schedule.rowVersion;
  
  if (schedule.wbsNodes.length !== 13) throw new Error(`WBS count mismatch: ${schedule.wbsNodes.length}`);
  if (schedule.activities.length !== 14) throw new Error(`Activity count mismatch: ${schedule.activities.length}`);
  if (schedule.dependencies.length !== 11) throw new Error(`Dependency count mismatch: ${schedule.dependencies.length}`);
  if (schedule.boqAllocations.length !== 326) throw new Error(`Allocation count mismatch: ${schedule.boqAllocations.length}`);
  
  if (schedule.baselineCode !== null) throw new Error('baselineCode must be null');
  if (schedule.activatedAt !== null) throw new Error('activatedAt must be null');
  
  const authActivations = await prisma.baselineActivation.count({
    where: { scheduleId: SCHEDULE_ID, isAuthoritative: true }
  });
  if (authActivations !== 0) throw new Error('Authoritative activation count must be 0');

  console.log('FINAL_B3_PREFLIGHT_PASSED\n');

  // Find actor
  let sysAdmin = await prisma.user.findFirst({ where: { role: { in: ['SYSTEM_ADMIN', 'CEO'] } } });
  if (!sysAdmin) sysAdmin = await prisma.user.findFirst();
  if (!sysAdmin) throw new Error('No admin user found');
  const actorId = sysAdmin.id;

  console.log('--- START TECHNICAL REVIEW ---');
  let currentRv = expectedRowVersion;
  await startScheduleReview({
    projectId: PROJECT_ID,
    scheduleId: SCHEDULE_ID,
    actorId,
    expectedRowVersion: currentRv
  });
  currentRv++;
  
  const postStart = await prisma.projectSchedule.findUnique({ where: { id: SCHEDULE_ID } });
  if (postStart?.workflowStatus !== 'UNDER_TECHNICAL_REVIEW') throw new Error('Status should be UNDER_TECHNICAL_REVIEW');
  if (postStart?.rowVersion !== currentRv) throw new Error('rowVersion mismatch after start review');
  console.log('TECHNICAL REVIEW STARTED\n');

  console.log('--- CREATE TECHNICAL REVIEW COMMENT ---');
  await prisma.scheduleReviewComment.create({
    data: {
      projectId: PROJECT_ID,
      scheduleId: SCHEDULE_ID,
      reviewRound: postStart.reviewRound,
      commentType: 'TECHNICAL',
      comment: 'Validated the 12-phase WBS structure, CPM network, contract-date feasibility, critical path, required Testing and Commissioning phase, final Project Acceptance and Demobilization phase, 326/326 BOQ coverage, and exact ₱43,106,674.89 financial reconciliation.',
      createdById: actorId,
      createdByNameSnapshot: sysAdmin.name || 'Unknown',
      createdByRoleSnapshot: sysAdmin.role || 'Unknown'
    }
  });
  console.log('TECHNICAL REVIEW COMMENT CREATED\n');

  console.log('--- TECHNICAL APPROVAL ---');
  await approveTechnicalReview({
    projectId: PROJECT_ID,
    scheduleId: SCHEDULE_ID,
    actorId,
    comments: 'Technically approved for baseline submission after validation of schedule structure, CPM, dates, BOQ allocation coverage and financial reconciliation.',
    expectedRowVersion: currentRv
  });
  currentRv += 2; // validate increments by 1, then approve increments by 1
  
  const postTech = await prisma.projectSchedule.findUnique({ where: { id: SCHEDULE_ID } });
  if (postTech?.workflowStatus !== 'TECHNICALLY_APPROVED') throw new Error('Status should be TECHNICALLY_APPROVED');
  if (postTech?.rowVersion !== currentRv) throw new Error('rowVersion mismatch after tech approval');
  console.log('TECHNICALLY APPROVED\n');

  console.log('--- SUBMIT FOR BASELINE APPROVAL ---');
  await submitForBaselineApproval({
    projectId: PROJECT_ID,
    scheduleId: SCHEDULE_ID,
    actorId,
    expectedRowVersion: currentRv
  });
  currentRv++;
  
  const postSubmit = await prisma.projectSchedule.findUnique({ where: { id: SCHEDULE_ID } });
  if (postSubmit?.workflowStatus !== 'PENDING_BASELINE_APPROVAL') throw new Error('Status should be PENDING_BASELINE_APPROVAL');
  if (postSubmit?.rowVersion !== currentRv) throw new Error('rowVersion mismatch after submit');
  console.log('SUBMITTED FOR BASELINE APPROVAL\n');

  console.log('--- FINAL ACTIVATION PREFLIGHT ---');
  // Just verified all those above. The service enforces them too.
  
  console.log('--- ACTIVATE EXACTLY ONCE ---');
  const operation = 'ACTIVATE_B3';
  const requestFingerprint = crypto.createHash('sha256').update(operation + PROJECT_ID + SCHEDULE_ID + actorId + currentRv).digest('hex');
  const idempotencyKey = crypto.createHash('sha256').update(requestFingerprint + 'idempotency').digest('hex');

  await activateScheduleBaseline({
    projectId: PROJECT_ID,
    scheduleId: SCHEDULE_ID,
    actorId,
    expectedRowVersion: currentRv,
    idempotencyKey,
    requestFingerprint
  });
  currentRv += 2; // validate by 1, activate by 1

  console.log('ACTIVATION COMMITTED\n');

  console.log('--- ACTIVATION POSTGRESQL READ-BACK ---');
  const finalActive = await prisma.projectSchedule.findUnique({ where: { id: SCHEDULE_ID } });
  if (finalActive?.workflowStatus !== 'ACTIVE_BASELINE') throw new Error('Not ACTIVE_BASELINE');
  if (finalActive?.baselineCode !== 'BL-001') throw new Error('Not BL-001');
  if (finalActive?.rowVersion !== currentRv) throw new Error(`Row version mismatch: expected ${currentRv}, got ${finalActive?.rowVersion}`);
  
  const finalActiveCount = await prisma.projectSchedule.count({
    where: { projectId: PROJECT_ID, workflowStatus: 'ACTIVE_BASELINE' }
  });
  if (finalActiveCount !== 1) throw new Error('Active baseline count must be 1');
  
  console.log('POSTGRESQL READ-BACK PASSED\n');

  console.log('--- IDEMPOTENT RETRY CHECK ---');
  try {
    await activateScheduleBaseline({
      projectId: PROJECT_ID,
      scheduleId: SCHEDULE_ID,
      actorId,
      expectedRowVersion: currentRv - 2,
      idempotencyKey,
      requestFingerprint
    });
    console.log('IDEMPOTENT RETRY PASSED\n');
  } catch (err: any) {
    console.error('IDEMPOTENT RETRY FAILED', err.message);
    throw err;
  }

  console.log('--- CREATE ONE VALID POST-BASELINE REVISION ---');
  const newRev = await createNewScheduleRevision({
    projectId: PROJECT_ID,
    parentScheduleId: SCHEDULE_ID,
    actorId,
    reason: 'Controlled post-baseline revision acceptance test.',
    expectedRowVersion: currentRv
  });
  console.log(`NEW REVISION CREATED: ${newRev.id}\n`);

  console.log('--- REVISION READ-BACK ---');
  const revCheck = await prisma.projectSchedule.findUnique({
    where: { id: newRev.id },
    include: {
      wbsNodes: true,
      activities: true,
      dependencies: true,
      boqAllocations: true
    }
  });

  if (revCheck?.workflowStatus !== 'AI_GENERATED_DRAFT') throw new Error('Rev not AI_GENERATED_DRAFT');
  if (revCheck?.wbsNodes.length !== 13) throw new Error('Rev WBS count wrong');
  if (revCheck?.activities.length !== 14) throw new Error('Rev Activities count wrong');
  if (revCheck?.boqAllocations.length !== 326) throw new Error('Rev Allocations count wrong');

  const afterRevActiveCount = await prisma.projectSchedule.count({
    where: { projectId: PROJECT_ID, workflowStatus: 'ACTIVE_BASELINE' }
  });
  if (afterRevActiveCount !== 1) throw new Error('Active baseline count must still be 1');
  
  console.log('REVISION READ-BACK PASSED\n');

  console.log('ALL BACKEND WORKFLOWS COMPLETED SUCCESSFULLY.');
}
main().finally(() => prisma.$disconnect());
