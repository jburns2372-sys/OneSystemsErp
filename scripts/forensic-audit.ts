import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const PROJECT_ID = 'cmrjo4msn0000vc9c7s65o3lt';
const SCHEDULE_ID = 'cmrjou0ne0001vcf01eju4dh8';

async function runAudit() {
  const output: any = {};

  // 1. VERIFY DATABASE TARGET
  // We're just logging connection URL without credentials
  const url = process.env.DATABASE_URL || '';
  output.dbTarget = url.includes('neon') ? 'NEON' : 'LOCAL';
  output.isProd = url.includes('prod');

  // 2. READ THE CANONICAL SCHEDULE
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: SCHEDULE_ID },
    include: {
      boqAllocations: true,
      wbsNodes: true,
      activities: true,
      dependencies: true
    }
  });

  if (!schedule) {
    console.error("SCHEDULE NOT FOUND");
    return;
  }

  output.schedule = {
    id: schedule.id,
    projectId: schedule.projectId,
    workflowStatus: schedule.workflowStatus,
    baselineCode: schedule.baselineCode,
    revisionNumber: schedule.revisionNumber,
    revisionCode: schedule.revisionCode,
    rowVersion: schedule.rowVersion,
    activatedAt: schedule.activatedAt,
    activatedById: schedule.activatedById,
    activationSnapshotHash: schedule.activationSnapshotHash,
    baselineStartDate: schedule.baselineStartDate,
    baselineFinishDate: schedule.baselineFinishDate,
    projectStartDate: schedule.projectStartDate,
    projectCompletionDate: schedule.projectCompletionDate,
    lockedBOQVersionId: schedule.lockedBOQVersionId,
    lockedBOQChecksum: schedule.lockedBOQChecksum
  };

  // 3. VERIFY ACTIVATION RECORD
  const activations = await prisma.baselineActivation.findMany({
    where: { scheduleId: SCHEDULE_ID, projectId: PROJECT_ID }
  });
  output.activations = activations;

  const approvals = await prisma.scheduleApproval.findMany({
    where: { scheduleId: SCHEDULE_ID },
    orderBy: { decidedAt: 'asc' }
  });
  const reviews = await prisma.scheduleReviewComment.findMany({
    where: { scheduleId: SCHEDULE_ID },
    orderBy: { createdAt: 'asc' }
  });
  output.approvals = approvals;
  output.reviews = reviews;

  // 5. ROW VERSION LOGS
  const audits = await prisma.auditLog.findMany({
    where: { remarks: { contains: SCHEDULE_ID } },
    orderBy: { createdAt: 'asc' }
  });
  output.audits = audits.map(a => ({ action: a.action, module: a.module, date: a.createdAt }));

  // 6. SNAPSHOT & 7. DATA MUTATION
  output.data = {
    wbsCount: schedule.wbsNodes.length,
    activityCount: schedule.activities.length,
    dependencyCount: schedule.dependencies.length,
    allocationCount: schedule.boqAllocations.length,
    uniqueBoqs: new Set(schedule.boqAllocations.map(a => a.awardedBoqItemId)).size,
    awardedAmount: schedule.awardedContractAmount?.toString(),
    scheduledAmount: schedule.scheduledAmount?.toString(),
    difference: schedule.differenceAmount?.toString()
  };

  // Reconstruct hash logic if needed, but we can verify manually in the report

  // 8. VERIFY ACTIVE-BASELINE UNIQUENESS
  const activeBaselines = await prisma.projectSchedule.count({
    where: { projectId: PROJECT_ID, workflowStatus: 'ACTIVE_BASELINE' }
  });
  output.activeBaselineCount = activeBaselines;

  // 9. VERIFY REVISION STATE
  const children = await prisma.projectSchedule.findMany({
    where: { parentScheduleId: SCHEDULE_ID }
  });
  output.children = children.map(c => ({ id: c.id, status: c.workflowStatus }));

  // 10 & 11 can be inferred from the activations and approvals records

  console.log(JSON.stringify(output, null, 2));
}

runAudit().catch(console.error).finally(() => prisma.$disconnect());
