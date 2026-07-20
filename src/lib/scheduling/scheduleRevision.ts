import { prisma } from '@/lib/prisma';
import { ProjectScheduleWorkflowStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

export async function createNewScheduleRevision({
  projectId,
  parentScheduleId,
  actorId,
  reason,
  expectedRowVersion
}: {
  projectId: string;
  parentScheduleId: string;
  actorId: string;
  reason: string;
  expectedRowVersion: number;
}) {
  if (!reason || reason.trim() === '') throw new Error('REVISION_REASON_REQUIRED');

  return prisma.$transaction(async (tx) => {
    // 1. Fetch parent schedule with all related data
    const parentSchedule = await tx.projectSchedule.findUnique({
      where: { id: parentScheduleId, projectId },
      include: {
        wbsNodes: true,
        activities: {
          include: {
            boqAllocations: true
          }
        },
        dependencies: true
      }
    });

    if (!parentSchedule) throw new Error('SCHEDULE_NOT_FOUND');
    if (parentSchedule.rowVersion !== expectedRowVersion) throw new Error('SCHEDULE_VERSION_CONFLICT');
    if (parentSchedule.workflowStatus !== ProjectScheduleWorkflowStatus.ACTIVE_BASELINE) {
      throw new Error('ONLY_ACTIVE_BASELINES_CAN_BE_REVISED');
    }

    // 2. Create the new schedule record
    const newSchedule = await tx.projectSchedule.create({
      data: {
        projectId,
        name: parentSchedule.name, // Will add " (Rev N)" later or keep same name
        description: parentSchedule.description,
        status: 'DRAFT',
        workflowStatus: ProjectScheduleWorkflowStatus.AI_GENERATED_DRAFT,
        reviewRound: 1,
        rowVersion: 1,
        parentScheduleId: parentSchedule.id,
        previousBaselineId: parentSchedule.id,

        // Copy dates
        projectStartDate: parentSchedule.projectStartDate,
        projectCompletionDate: parentSchedule.projectCompletionDate,
        calendarDays: parentSchedule.calendarDays,
        workingDays: parentSchedule.workingDays,
        holidays: parentSchedule.holidays,
        workDaysConfig: parentSchedule.workDaysConfig,

        // Copy BOQ linkages
        lockedBOQVersionId: parentSchedule.lockedBOQVersionId,
        lockedBOQChecksum: parentSchedule.lockedBOQChecksum,
        awardedContractAmount: parentSchedule.awardedContractAmount,
        scheduledAmount: parentSchedule.scheduledAmount,
        differenceAmount: parentSchedule.differenceAmount,

        // Copy metadata
        openAiModelIdentifier: parentSchedule.openAiModelIdentifier,
        promptVersion: parentSchedule.promptVersion,
        schedulingEngineVersion: parentSchedule.schedulingEngineVersion,
        validationRulesVersion: parentSchedule.validationRulesVersion,
        feasibilityFlags: parentSchedule.feasibilityFlags,
        validationMetrics: parentSchedule.validationMetrics,

        // Clear activation fields
        revisionNumber: null,
        revisionCode: null,
        activatedById: null,
        activatedAt: null,
        activationSnapshotHash: null,
        
        // Audit
        generatedById: actorId,
        generatedAt: new Date()
      }
    });

    // 3. Record the revision reason
    const user = await tx.user.findUnique({ where: { id: actorId } });
    await tx.scheduleRevisionReason.create({
      data: {
        schedule: { connect: { id: newSchedule.id } },
        parentScheduleId: parentSchedule.id,
        createdBy: { connect: { id: actorId } },
        createdByNameSnapshot: user?.name || 'Unknown',
        createdByRoleSnapshot: user?.role || 'Unknown',
        reason,
        revisionType: 'METHODOLOGY_CHANGE' // Default or passed as param
      }
    });

    // 4. Map Old IDs to New IDs for WBS and Activities
    const wbsIdMap = new Map<string, string>();
    const activityIdMap = new Map<string, string>();

    // Prepare WBS IDs
    parentSchedule.wbsNodes.forEach(wbs => {
      wbsIdMap.set(wbs.id, crypto.randomUUID());
    });

    // Prepare Activity IDs
    parentSchedule.activities.forEach(act => {
      activityIdMap.set(act.id, crypto.randomUUID());
    });

    // 5. Clone WBS Nodes
    if (parentSchedule.wbsNodes.length > 0) {
      await tx.scheduleWBS.createMany({
        data: parentSchedule.wbsNodes.map(wbs => ({
          id: wbsIdMap.get(wbs.id)!,
          scheduleId: newSchedule.id,
          code: wbs.code,
          name: wbs.name,
          level: wbs.level,
          orderIndex: wbs.orderIndex,
          parentId: wbs.parentId ? wbsIdMap.get(wbs.parentId) : null
        }))
      });
    }

    // 6. Clone Activities and Allocations
    if (parentSchedule.activities.length > 0) {
      await tx.scheduleActivity.createMany({
        data: parentSchedule.activities.map(act => ({
          id: activityIdMap.get(act.id)!,
          scheduleId: newSchedule.id,
          wbsId: act.wbsId ? wbsIdMap.get(act.wbsId)! : '',
          activityCode: act.activityCode,
          name: act.name,
          description: act.description,
          plannedDuration: act.plannedDuration,
          plannedQuantity: act.plannedQuantity,
          plannedWeight: act.plannedWeight,
          plannedStartDate: act.plannedStartDate,
          plannedFinishDate: act.plannedFinishDate,
          
          baselineStartDate: null,
          baselineFinishDate: null,

          criticalPath: act.criticalPath,
          totalFloat: act.totalFloat,
          freeFloat: act.freeFloat
        }))
      });

      // Clone BOQ Allocations
      const allocationsToCreate: any[] = [];
      parentSchedule.activities.forEach(act => {
        act.boqAllocations.forEach(alloc => {
          allocationsToCreate.push({
            id: crypto.randomUUID(),
            scheduleId: newSchedule.id,
            activityId: activityIdMap.get(act.id)!,
            boqLineId: alloc.boqLineId,
            awardedBoqItemId: alloc.awardedBoqItemId,
            allocatedQuantity: alloc.allocatedQuantity,
            allocatedAmount: alloc.allocatedAmount
          });
        });
      });

      if (allocationsToCreate.length > 0) {
        await tx.scheduleBOQAllocation.createMany({
          data: allocationsToCreate
        });
      }
    }

    // 7. Clone Dependencies
    if (parentSchedule.dependencies.length > 0) {
      await tx.scheduleDependency.createMany({
        data: parentSchedule.dependencies.map(dep => ({
          id: crypto.randomUUID(),
          scheduleId: newSchedule.id,
          predecessorId: activityIdMap.get(dep.predecessorId)!,
          successorId: activityIdMap.get(dep.successorId)!,
          type: dep.type,
          lagDays: dep.lagDays
        }))
      });
    }

    return newSchedule;

  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 15000,
    timeout: 15000
  });
}
