import { prisma } from '@/lib/prisma';
import { validateScheduleForReview } from '@/lib/scheduling/scheduleWorkflow';
import { submitDraftForReview } from '@/lib/services/schedule-workflow.service';
import { POST } from '@/app/api/projects/[id]/scheduling/[scheduleId]/review/validate/route';

jest.mock('@/lib/dal/auth', () => ({
  verifySession: jest.fn().mockResolvedValue({ id: 'test-user', email: 'test@onesystems.com' }),
  verifyApiSession: jest.fn().mockResolvedValue({ id: 'test-user', email: 'test@onesystems.com' })
}));

jest.mock('@/lib/accessControl', () => ({
  checkUserAccess: jest.fn().mockResolvedValue({ allowed: true }),
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    projectSchedule: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    userRole: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    projectUserAssignment: {
      findFirst: jest.fn(),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue({ id: 'mock-audit' }),
    },
    awardedBOQItem: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    scheduleBOQAllocation: {
      findMany: jest.fn(),
    },
    scheduleWorkflowTransition: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(require('@/lib/prisma').prisma)),
  },
  transactionContext: {
    run: jest.fn((opts, callback) => callback()),
  }
}));

jest.mock('@/lib/scheduling/authUtils', () => ({
  getSessionActor: jest.fn().mockResolvedValue({ id: 'actor1', role: 'SITE_ENGINEER' }),
  checkSchedulingAccess: jest.fn().mockResolvedValue({ allowed: true }),
}));

describe('Schedule Workflow Refactor Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('1. Large reads occur outside interactive transaction (Stage A)', async () => {
    (prisma.projectSchedule.findUnique as jest.Mock).mockResolvedValue({
      id: 'sch1', projectId: 'proj1', rowVersion: 1, workflowStatus: 'AI_GENERATED_DRAFT',
      activities: [], wbsNodes: [], dependencies: []
    });
    (prisma.awardedBOQItem.count as jest.Mock).mockResolvedValue(1);
    (prisma.awardedBOQItem.findMany as jest.Mock).mockResolvedValue([{ id: 'boq1', itemCode: '1', quantity: 10 }]);
    (prisma.scheduleBOQAllocation.findMany as jest.Mock).mockResolvedValue([{ id: 'alloc1', awardedBoqItemId: 'boq1', allocatedQuantity: 10 }]);

    const result = await validateScheduleForReview({ projectId: 'proj1', scheduleId: 'sch1', actorId: 'actor1', expectedRowVersion: 1, tx: prisma });
    
    expect(result).toBeDefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.scheduleBOQAllocation.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.awardedBOQItem.findMany).toHaveBeenCalledTimes(1);
  });

  it('4. Validation failure does not open Stage B', async () => {
    (prisma.projectSchedule.findUnique as jest.Mock).mockResolvedValue({
      id: 'sch1', projectId: 'proj1', rowVersion: 1, workflowStatus: 'AI_GENERATED_DRAFT',
      activities: [], wbsNodes: [], dependencies: []
    });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'actor1', email: 'test@example.com', sessionVersion: 1, status: 'ACTIVE' });
    (prisma.awardedBOQItem.count as jest.Mock).mockResolvedValue(0); // Fails validation

    const req = new Request('http://localhost/api', {
      method: 'POST',
      body: JSON.stringify({ expectedRowVersion: 1 })
    });
    const res = await POST(req, { params: Promise.resolve({ id: 'proj1', scheduleId: 'sch1' }) });
    const json = await res.json();
    
    expect(res.status).toBe(400);
    expect(json.error).toBe('VALIDATION_FAILED');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('5 & 6. Changed rowVersion or workflowStatus between Stage A and Stage B returns conflict', async () => {
    // Stage B conflict test
    (prisma.projectUserAssignment.findFirst as jest.Mock).mockResolvedValue({ projectRole: 'SITE_ENGINEER' });
    (prisma.scheduleWorkflowTransition.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.projectSchedule.findUnique as jest.Mock).mockResolvedValue({
      id: 'sch1', projectId: 'proj1', rowVersion: 2, // Changed!
      workflowStatus: 'UNDER_TECHNICAL_REVIEW' // Changed!
    });

    await expect(submitDraftForReview('proj1', 'sch1', 1, 'key1', { userId: 'actor1', email: 'a@a.com', sessionVersion: 1, accountActive: true, accountLocked: false, mustChangePassword: false }))
      .rejects.toThrow(/status transition/);
  });

  it('7 & 9. Valid mocked submission creates exactly one transition, no approval/comment', async () => {
    (prisma.projectUserAssignment.findFirst as jest.Mock).mockResolvedValue({ projectRole: 'SITE_ENGINEER' });
    (prisma.scheduleWorkflowTransition.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.projectSchedule.findUnique as jest.Mock).mockResolvedValue({
      id: 'sch1', projectId: 'proj1', rowVersion: 1, workflowStatus: 'AI_GENERATED_DRAFT'
    });
    (prisma.projectSchedule.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    (prisma.scheduleWorkflowTransition.create as jest.Mock).mockResolvedValue({ id: 'trans1' });
    (prisma.auditLog.create as jest.Mock).mockResolvedValue({ id: 'audit1' });

    const result = await submitDraftForReview('proj1', 'sch1', 1, 'key1', { userId: 'actor1', email: 'a@a.com', sessionVersion: 1, accountActive: true, accountLocked: false, mustChangePassword: false });
    
    expect(result.status).toBe('SUCCESS');
    expect(prisma.scheduleWorkflowTransition.create).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('8. Duplicate idempotent submission does not create second transition', async () => {
    (prisma.projectUserAssignment.findFirst as jest.Mock).mockResolvedValue({ projectRole: 'SITE_ENGINEER' });
    (prisma.scheduleWorkflowTransition.findUnique as jest.Mock).mockResolvedValue({
      projectId: 'proj1', fromStatus: 'AI_GENERATED_DRAFT', toStatus: 'READY_FOR_REVIEW',
      actorUserId: 'actor1', expectedRowVersion: 1, resultingRowVersion: 2
    });

    const result = await submitDraftForReview('proj1', 'sch1', 1, 'key1', { userId: 'actor1', email: 'a@a.com', sessionVersion: 1, accountActive: true, accountLocked: false, mustChangePassword: false });
    
    expect(result.status).toBe('IDEMPOTENT_SUCCESS');
    expect(prisma.scheduleWorkflowTransition.create).not.toHaveBeenCalled();
  });
});
