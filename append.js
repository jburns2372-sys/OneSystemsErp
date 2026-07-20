const fs = require('fs');
const newContent = `
export async function executeTechnicalApprovalMutation({
  projectId,
  scheduleId,
  expectedRowVersion,
  actorUserId,
  actorRoleSnapshot,
  actorNameSnapshot,
  comments,
}: {
  projectId: string;
  scheduleId: string;
  expectedRowVersion: number;
  actorUserId: string;
  actorRoleSnapshot: string;
  actorNameSnapshot: string;
  comments: string;
}) {
  return prismaBase.$transaction(async (tx) => {
    const currentSchedule = await tx.projectSchedule.findUnique({
      where: { id: scheduleId, projectId },
    });

    if (!currentSchedule) throw new Error('Schedule not found');
    if (currentSchedule.workflowStatus !== 'UNDER_TECHNICAL_REVIEW') {
      throw new Error(\`Invalid status: \${currentSchedule.workflowStatus}\`);
    }
    if (currentSchedule.rowVersion !== expectedRowVersion) throw new Error('Concurrency error');
    
    if (actorRoleSnapshot !== 'PROJECT_MANAGER' && actorRoleSnapshot !== 'DIRECTORS' && actorRoleSnapshot !== 'PROJECT_DIRECTOR') {
      throw new Error('Unauthorized role for technical approval');
    }

    await tx.scheduleApproval.create({
      data: {
        projectId,
        scheduleId,
        approvalStage: 'TECHNICAL',
        decision: 'APPROVE',
        reviewRound: currentSchedule.reviewRound,
        reviewerId: actorUserId,
        reviewerNameSnapshot: actorNameSnapshot,
        reviewerRoleSnapshot: actorRoleSnapshot,
        comments,
        validationSnapshot: 'PASS',
        snapshotVersion: '1.0'
      }
    });

    const updateResult = await tx.projectSchedule.updateMany({
      where: { id: scheduleId, projectId, rowVersion: expectedRowVersion },
      data: {
        workflowStatus: 'TECHNICALLY_APPROVED',
        rowVersion: { increment: 1 }
      }
    });

    if (updateResult.count !== 1) throw new Error('Concurrency error');

    await tx.auditLog.create({
      data: {
        actionType: 'SCHEDULE_TECHNICAL_APPROVED',
        moduleName: 'PROJECT_SCHEDULING',
        userId: actorUserId,
        newValue: JSON.stringify({ scheduleId, projectId })
      }
    });

    return { status: 'SUCCESS' };
  }, { isolationLevel: 'Serializable' });
}

export async function executeFinanceApprovalMutation({
  projectId,
  scheduleId,
  expectedRowVersion,
  actorUserId,
  actorRoleSnapshot,
  actorNameSnapshot,
}: {
  projectId: string;
  scheduleId: string;
  expectedRowVersion: number;
  actorUserId: string;
  actorRoleSnapshot: string;
  actorNameSnapshot: string;
}) {
  return prismaBase.$transaction(async (tx) => {
    const currentSchedule = await tx.projectSchedule.findUnique({
      where: { id: scheduleId, projectId },
    });

    if (!currentSchedule) throw new Error('Schedule not found');
    if (currentSchedule.workflowStatus !== 'TECHNICALLY_APPROVED') {
      throw new Error(\`Invalid status: \${currentSchedule.workflowStatus}\`);
    }
    if (currentSchedule.rowVersion !== expectedRowVersion) throw new Error('Concurrency error');
    
    if (actorRoleSnapshot !== 'FINANCE_OFFICER') {
      throw new Error('Unauthorized role for finance approval');
    }

    await tx.scheduleApproval.create({
      data: {
        projectId,
        scheduleId,
        approvalStage: 'FINANCE',
        decision: 'APPROVE',
        reviewRound: currentSchedule.reviewRound,
        reviewerId: actorUserId,
        reviewerNameSnapshot: actorNameSnapshot,
        reviewerRoleSnapshot: actorRoleSnapshot,
        comments: 'Finance approved',
        validationSnapshot: 'PASS',
        snapshotVersion: '1.0'
      }
    });

    const updateResult = await tx.projectSchedule.updateMany({
      where: { id: scheduleId, projectId, rowVersion: expectedRowVersion },
      data: {
        rowVersion: { increment: 1 }
      }
    });

    if (updateResult.count !== 1) throw new Error('Concurrency error');

    await tx.auditLog.create({
      data: {
        actionType: 'SCHEDULE_FINANCE_APPROVED',
        moduleName: 'PROJECT_SCHEDULING',
        userId: actorUserId,
        newValue: JSON.stringify({ scheduleId, projectId })
      }
    });

    return { status: 'SUCCESS' };
  }, { isolationLevel: 'Serializable' });
}

export async function executeFinalBaselineRecommendationMutation({
  projectId,
  scheduleId,
  expectedRowVersion,
  actorUserId,
  actorRoleSnapshot,
  actorNameSnapshot,
}: {
  projectId: string;
  scheduleId: string;
  expectedRowVersion: number;
  actorUserId: string;
  actorRoleSnapshot: string;
  actorNameSnapshot: string;
}) {
  return prismaBase.$transaction(async (tx) => {
    const currentSchedule = await tx.projectSchedule.findUnique({
      where: { id: scheduleId, projectId },
    });

    if (!currentSchedule) throw new Error('Schedule not found');
    if (currentSchedule.workflowStatus !== 'TECHNICALLY_APPROVED') {
      throw new Error(\`Invalid status: \${currentSchedule.workflowStatus}\`);
    }
    if (currentSchedule.rowVersion !== expectedRowVersion) throw new Error('Concurrency error');
    
    if (actorRoleSnapshot !== 'DIRECTORS' && actorRoleSnapshot !== 'PROJECT_DIRECTOR') {
      throw new Error('Unauthorized role for final recommendation');
    }

    const approvals = await tx.scheduleApproval.findMany({
      where: { scheduleId, reviewRound: currentSchedule.reviewRound }
    });

    const hasTechnical = approvals.some(a => a.approvalStage === 'TECHNICAL' && a.decision === 'APPROVE');
    const hasFinance = approvals.some(a => a.approvalStage === 'FINANCE' && a.decision === 'APPROVE');

    if (!hasTechnical || !hasFinance) {
      throw new Error('Missing prerequisite approvals');
    }

    const updateResult = await tx.projectSchedule.updateMany({
      where: { id: scheduleId, projectId, rowVersion: expectedRowVersion },
      data: {
        workflowStatus: 'PENDING_BASELINE_APPROVAL',
        rowVersion: { increment: 1 }
      }
    });

    if (updateResult.count !== 1) throw new Error('Concurrency error');

    await tx.auditLog.create({
      data: {
        actionType: 'SCHEDULE_FINAL_BASELINE_RECOMMENDED',
        moduleName: 'PROJECT_SCHEDULING',
        userId: actorUserId,
        newValue: JSON.stringify({ scheduleId, projectId })
      }
    });

    return { status: 'SUCCESS' };
  }, { isolationLevel: 'Serializable' });
}
`;
fs.appendFileSync('src/lib/services/schedule-gateway.ts', newContent);
