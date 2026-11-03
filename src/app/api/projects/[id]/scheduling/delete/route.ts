import { NextResponse } from 'next/server';
import { ProjectScheduleWorkflowStatus } from '@prisma/client';
import { prisma, transactionContext } from '@/lib/prisma';
import { assertScheduleMutable } from '@/lib/scheduling/scheduleWorkflow';
import { verifyApiSession } from '@/lib/dal/auth';
import { checkUserAccess } from '@/lib/accessControl';

const PERMITTED_MUTABLE_DRAFT_STATUSES = new Set<ProjectScheduleWorkflowStatus>([
  ProjectScheduleWorkflowStatus.AI_GENERATED_DRAFT,
  ProjectScheduleWorkflowStatus.INVALID_GENERATED_DRAFT,
]);

class ScheduleDeleteBlockedError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 409) {
    super(message);
    this.name = 'ScheduleDeleteBlockedError';
    this.statusCode = statusCode;
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await verifyApiSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.mustChangePassword) {
    return NextResponse.json({ error: 'PASSWORD_CHANGE_REQUIRED' }, { status: 403 });
  }

  const { id: projectId } = await params;
  const access = await checkUserAccess(session.id, projectId, 'Scheduling', 'DELETE');
  if (!access.allowed) {
    return NextResponse.json({ error: access.denialReason || 'Access Denied' }, { status: 403 });
  }

  const reqUrl = new URL(req.url);
  const requestedScheduleId = reqUrl.searchParams.get('scheduleId')?.trim() || undefined;

  try {
    await prisma.$transaction(async (tx) => {
      return transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
        const schedules = await tx.projectSchedule.findMany({
          where: requestedScheduleId
            ? { id: requestedScheduleId, projectId }
            : { projectId },
          orderBy: { createdAt: 'desc' },
        });

        if (!schedules || schedules.length === 0) {
          throw new ScheduleDeleteBlockedError('Schedule not found', 404);
        }

        const targetIds = new Set(schedules.map((s) => s.id));

        for (const schedule of schedules) {
          // 1. Never delete locked/active/superseded/archived baselines
          try {
            assertScheduleMutable(schedule);
          } catch {
            throw new ScheduleDeleteBlockedError(
              'Locked or active schedule baselines are immutable and cannot be deleted.',
              409
            );
          }

          if (
            !PERMITTED_MUTABLE_DRAFT_STATUSES.has(schedule.workflowStatus) ||
            schedule.status === 'BASELINE' ||
            schedule.activatedAt !== null ||
            schedule.baselineCode !== null
          ) {
            throw new ScheduleDeleteBlockedError(
              `Schedule ${schedule.id} is in status ${schedule.workflowStatus} and is not an expressly permitted mutable draft.`,
              409
            );
          }

          // 2. Preserve schedule history, approvals, waivers, transitions, and lineage: fail closed if any exist
          const [
            approvalCount,
            reviewCommentCount,
            baselineActivationCount,
            waiverCount,
            revisionReasonCount,
            workflowTransitionCount,
            externalLineageCount,
          ] = await Promise.all([
            tx.scheduleApproval.count({ where: { scheduleId: schedule.id } }),
            tx.scheduleReviewComment.count({ where: { scheduleId: schedule.id } }),
            tx.baselineActivation.count({ where: { scheduleId: schedule.id } }),
            tx.financialDataWaiver.count({ where: { scheduleId: schedule.id } }),
            tx.scheduleRevisionReason.count({ where: { scheduleId: schedule.id } }),
            tx.scheduleWorkflowTransition.count({ where: { scheduleId: schedule.id } }),
            tx.projectSchedule.count({
              where: {
                id: { notIn: Array.from(targetIds) },
                OR: [
                  { parentScheduleId: schedule.id },
                  { previousBaselineId: schedule.id },
                ],
              },
            }),
          ]);

          if (
            approvalCount > 0 ||
            reviewCommentCount > 0 ||
            baselineActivationCount > 0 ||
            waiverCount > 0 ||
            revisionReasonCount > 0 ||
            workflowTransitionCount > 0 ||
            externalLineageCount > 0
          ) {
            throw new ScheduleDeleteBlockedError(
              'Cannot delete schedule: approval, review, baseline, workflow audit history, or revision lineage exists and must be preserved.',
              409
            );
          }
        }

        // Unlink intra-batch draft parent pointers if multiple mutable drafts are deleted together
        if (schedules.length > 1) {
          await tx.projectSchedule.updateMany({
            where: { id: { in: Array.from(targetIds) }, projectId },
            data: { parentScheduleId: null, previousBaselineId: null },
          });
        }

        for (const schedule of schedules) {
          await tx.scheduleProgressUpdate.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.scheduleDelayRecord.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.scheduleRecoveryPlan.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.scheduleRevisionRequest.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.schedulePOWMapping.deleteMany({ where: { activity: { scheduleId: schedule.id } } });
          await tx.scheduleDependency.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.scheduleBOQAllocation.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.scheduleActivity.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.scheduleMilestone.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.scheduleWBS.updateMany({
            where: { scheduleId: schedule.id },
            data: { parentId: null },
          });
          await tx.scheduleWBS.deleteMany({ where: { scheduleId: schedule.id } });
          await tx.projectSchedule.delete({ where: { id: schedule.id } });
        }

        const remainingCount = await tx.projectSchedule.count({ where: { projectId } });
        if (remainingCount === 0) {
          await tx.project.update({
            where: { id: projectId },
            data: { status: 'PLANNING' },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: session.id,
            userRole: session.role,
            transactionId: projectId,
            moduleName: 'Scheduling',
            actionType: 'SCHEDULE_DRAFT_DELETED',
            remarks: `Deleted mutable draft schedule(s) for project ${projectId}: ${schedules.map((s) => s.id).join(', ')}`,
          },
        });
      });
    });

    return NextResponse.json({ success: true, message: 'Mutable draft schedule successfully deleted.' });
  } catch (error: any) {
    if (error instanceof ScheduleDeleteBlockedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    console.error('Error deleting schedule:', error);
    return NextResponse.json({ error: 'Failed to delete schedule.' }, { status: 500 });
  }
}
