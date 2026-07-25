import { POST } from '@/app/api/projects/[id]/scheduling/[scheduleId]/review/validate/route';
import { prisma, transactionContext } from '@/lib/prisma';
import crypto from 'crypto';

jest.mock('@/lib/dal/auth', () => ({
  verifySession: jest.fn().mockResolvedValue({ id: 'test-user', email: 'test@onesystems.com' }),
  verifyApiSession: jest.fn().mockResolvedValue({ id: 'test-user', email: 'test@onesystems.com' })
}));

// Minimal mock setup for testing Next.js Route Handlers
jest.mock('@/lib/scheduling/authUtils', () => ({
  getSessionActor: jest.fn(),
  checkSchedulingAccess: jest.fn(),
}));

jest.mock('@/lib/accessControl', () => ({
  checkUserAccess: jest.fn().mockResolvedValue({ allowed: true }),
}));

import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';

jest.setTimeout(30000);

const mockRequest = (body: any) => {
  return new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
};

describe('Engineer Submission Route', () => {
  const projectId = 'test-engineer-submission-project';
  const scheduleId = 'test-engineer-submission-schedule';
  const actorId = 'test-engineer-submission-actor';
  const fixtureProjectIds = [projectId, 'proj-123'];
  const fixtureScheduleIds = [scheduleId, 'sched-456'];
  const fixtureActorIds = [actorId, 'user-789'];

  const cleanupFixtures = async () => {
    await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
      await prisma.scheduleWorkflowTransition.deleteMany({
        where: { scheduleId: { in: fixtureScheduleIds } },
      });
      await prisma.baselineActivation.deleteMany({
        where: { scheduleId: { in: fixtureScheduleIds } },
      });
      await prisma.scheduleApproval.deleteMany({
        where: { scheduleId: { in: fixtureScheduleIds } },
      });
      await prisma.auditLog.deleteMany({
        where: { userId: { in: fixtureActorIds } },
      });
      await prisma.scheduleActivity.deleteMany({
        where: { scheduleId: { in: fixtureScheduleIds } },
      });
      await prisma.scheduleWBS.deleteMany({
        where: { scheduleId: { in: fixtureScheduleIds } },
      });
      await prisma.projectSchedule.deleteMany({
        where: { id: { in: fixtureScheduleIds } },
      });
      await prisma.projectUserAssignment.deleteMany({
        where: { projectId: { in: fixtureProjectIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: fixtureActorIds } },
      });
      await prisma.project.deleteMany({
        where: { id: { in: fixtureProjectIds } },
      });
    });
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    (getSessionActor as jest.Mock).mockResolvedValue({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValue({ allowed: true });
    
    await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
      await cleanupFixtures();

      await prisma.user.create({
        data: {
          id: actorId,
          email: 'actor@engineer-submission.test',
          name: 'Test Engineer',
          role: 'SITE_ENGINEER',
          status: 'ACTIVE',
          sessionVersion: 1
        }
      });

      await prisma.project.create({
        data: {
          id: projectId,
          name: 'Test Project',
          status: 'ACTIVE'
        }
      });

      await prisma.projectUserAssignment.create({
        data: {
          userId: actorId,
          projectId: projectId,
          projectRole: 'SITE_ENGINEER',
          assignmentStatus: 'active',
          accessLevel: 'WRITE'
        }
      });
    });
  });

  afterEach(async () => {
    await cleanupFixtures();
  });

  afterAll(async () => {
    try {
      await cleanupFixtures();
    } finally {
      await prisma.$disconnect();
    }
  });

  const setupSchedule = async (status = 'AI_GENERATED_DRAFT', expectedRowVersion = 1) => {
    return transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
      return prisma.projectSchedule.create({
        data: {
          id: scheduleId,
          projectId,
          workflowStatus: status as any,
          rowVersion: expectedRowVersion,
          status: 'DRAFT',
          name: 'Test Schedule'
        }
      });
    });
  };

  it('1. Missing authentication is rejected (401)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce(null);
    
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized');
  });

  it('2. A stale or invalid session is rejected (401)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: 'non-existent', role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(401);
  });

  it('3. An unauthorized actor is rejected (403)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: false });
    
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(403);
  });

  it('4. A wrong project ID is rejected (404)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    await setupSchedule('AI_GENERATED_DRAFT', 1);

    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: 'wrong-proj', scheduleId }) });
    
    expect(res.status).toBe(404);
  });

  it('5. A wrong schedule ID is rejected (404)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    await setupSchedule('AI_GENERATED_DRAFT', 1);

    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId: 'wrong-sched' }) });
    
    expect(res.status).toBe(404);
  });

  it('6. A non-AI_GENERATED_DRAFT status is rejected (409)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    await setupSchedule('READY_FOR_REVIEW', 1);

    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('WORKFLOW_STATE_CONFLICT');
  });

  it('7. A stale rowVersion is rejected (409)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    await setupSchedule('AI_GENERATED_DRAFT', 2);

    const req = mockRequest({ expectedRowVersion: 1 }); // Stale version
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('CONCURRENT_SCHEDULE_CHANGE');
  });

  it('8. Schedule validation failure prevents workflow mutation (400)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    // Empty schedule -> validation fails (no activities, etc)
    await setupSchedule('AI_GENERATED_DRAFT', 1);

    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('VALIDATION_FAILED');
    expect(data.errors.length).toBeGreaterThan(0);

    // Verify DB not mutated
    const current = await prisma.projectSchedule.findUnique({ where: { id: scheduleId } });
    expect(current?.workflowStatus).toBe('AI_GENERATED_DRAFT');
    expect(current?.rowVersion).toBe(1);

    const transitions = await prisma.scheduleWorkflowTransition.count({ where: { scheduleId } });
    expect(transitions).toBe(0);
  });

  it('15. Retrying the same request does not create a duplicate transition (409 or success based on idempotency)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValue({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValue({ allowed: true });
    
    await setupSchedule('AI_GENERATED_DRAFT', 1);
    
    // We mock validation to pass so we can test the workflow transition
    jest.spyOn(require('@/lib/scheduling/scheduleWorkflow'), 'validateScheduleForReview').mockImplementationOnce(async ({tx}: any) => {
      // Simulate validation passing
      return { isValid: true, errors: [], warnings: [], hash: 'testhash' };
    }).mockImplementationOnce(async ({tx}: any) => {
      return { isValid: true, errors: [], warnings: [], hash: 'testhash' };
    });

    const req1 = mockRequest({ expectedRowVersion: 1 });
    const res1 = await POST(req1, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    if (res1.status === 403) {
      console.log('403 Response:', await res1.clone().json());
    }
    expect(res1.status).toBe(200);

    // Re-run identical request
    const req2 = mockRequest({ expectedRowVersion: 1 });
    const res2 = await POST(req2, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    // API route doesn't implement full idempotency keys, so it returns 409 concurrency error
    expect(res2.status).toBe(409);
    const data = await res2.json();
    expect(data.error).toBe('WORKFLOW_STATE_CONFLICT');
    
    const transitions = await prisma.scheduleWorkflowTransition.count({ where: { scheduleId } });
    expect(transitions).toBe(1);
  });
});
