import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

const PROJECT_ID = 'cmrjo4msn0000vc9c7s65o3lt';
const SCHEDULE_ID = 'cmrjou0ne0001vcf01eju4dh8';

export function createCanonicalScheduleSnapshot(schedule: any, wbsNodes: any[], phases: any[], activities: any[], dependencies: any[], allocations: any[]) {
  const sortedWbs = [...wbsNodes].sort((a, b) => a.id.localeCompare(b.id));
  const sortedActivities = [...activities].sort((a, b) => a.id.localeCompare(b.id));
  const sortedDependencies = [...dependencies].sort((a, b) => a.id.localeCompare(b.id));
  const sortedAllocations = [...allocations].sort((a, b) => a.id.localeCompare(b.id));

  return {
    version: '1.0',
    scheduleId: schedule.id,
    projectId: schedule.projectId,
    reviewRound: schedule.reviewRound,
    projectStartDate: schedule.projectStartDate?.toISOString(),
    projectCompletionDate: schedule.projectCompletionDate?.toISOString(),
    lockedBOQVersionId: schedule.lockedBOQVersionId,
    lockedBOQChecksum: schedule.lockedBOQChecksum,
    awardedContractAmount: schedule.awardedContractAmount?.toString(),
    scheduledAmount: schedule.scheduledAmount?.toString(),
    differenceAmount: schedule.differenceAmount?.toString(),
    wbsNodes: sortedWbs.map(w => ({ id: w.id, code: w.code, level: w.level, parentId: w.parentId })),
    activities: sortedActivities.map(a => ({
      id: a.id, wbsId: a.wbsId, code: a.activityCode,
      plannedStartDate: a.plannedStartDate?.toISOString(),
      plannedFinishDate: a.plannedFinishDate?.toISOString(),
      plannedDuration: a.plannedDuration,
      plannedQuantity: a.plannedQuantity,
      plannedWeight: a.plannedWeight
    })),
    dependencies: sortedDependencies.map(d => ({
      id: d.id, predecessorId: d.predecessorId, successorId: d.successorId, type: d.dependencyType
    })),
    allocations: sortedAllocations.map(a => ({
      id: a.id, activityId: a.activityId, boqLineId: a.boqLineId, quantity: a.allocatedQuantity
    }))
  };
}

export function calculateScheduleSnapshotHash(snapshot: any): string {
  const jsonStr = JSON.stringify(snapshot);
  return crypto.createHash('sha256').update(jsonStr).digest('hex');
}

async function runAudit() {
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: SCHEDULE_ID },
    include: { boqAllocations: true, wbsNodes: true, activities: true, dependencies: true }
  });

  const activations = await prisma.baselineActivation.findMany({
    where: { scheduleId: SCHEDULE_ID }
  });

  const snapshot = createCanonicalScheduleSnapshot(schedule, schedule.wbsNodes, [], schedule.activities, schedule.dependencies, schedule.boqAllocations);
  const hash = calculateScheduleSnapshotHash(snapshot);

  console.log(JSON.stringify({ activations, hash, scheduleHash: schedule.activationSnapshotHash }, null, 2));

  // Child revision info
  const child = await prisma.projectSchedule.findUnique({
    where: { id: 'cmrjqp9680004vcso7x97dla1' },
    include: { wbsNodes: true, activities: true, dependencies: true, boqAllocations: true }
  });
  console.log(JSON.stringify({ 
    childId: child?.id, 
    childStatus: child?.workflowStatus, 
    parent: child?.parentScheduleId,
    wbs: child?.wbsNodes.length,
    act: child?.activities.length,
    dep: child?.dependencies.length,
    alloc: child?.boqAllocations.length,
    prevBaseline: child?.previousBaselineId
  }, null, 2));

}
runAudit().catch(console.error).finally(() => prisma.$disconnect());
