import { POST } from '@/app/api/projects/[id]/scheduling/[scheduleId]/review/validate/route';
import { prisma, transactionContext } from '@/lib/prisma';
import crypto from 'crypto';

// Minimal mock setup for testing Next.js Route Handlers
const mockRequest = (body: any) => {
  return new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });
};

jest.mock('@/lib/scheduling/authUtils', () => ({
  getSessionActor: jest.fn(),
  checkSchedulingAccess: jest.fn(),
}));

import { getSessionActor, checkSchedulingAccess } from '@/lib/scheduling/authUtils';

describe('Engineer Submission Route', () => {
  const projectId = 'proj-123';
  const scheduleId = 'sched-456';
  const actorId = 'user-789';

  beforeEach(async () => {
    jest.clearAllMocks();
    
    await transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
      // Setup isolated test database for this test suite
      await prisma.scheduleWorkflowTransition.deleteMany({});
      await prisma.auditLog.deleteMany({});
      await prisma.scheduleActivity.deleteMany({});
      await prisma.projectSchedule.deleteMany({});
      await prisma.projectUserAssignment.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.project.deleteMany({});

      await prisma.user.create({
        data: {
          id: actorId,
          email: 'engineer@test.com',
          name: 'Test Engineer',
          role: 'SITE_ENGINEER',
          status: 'ACTIVE'
        }
      });

      await prisma.project.create({
        data: {
          id: projectId,
          name: 'Test Project',
          projectCode: 'TP-01',
          status: 'ACTIVE'
        }
      });

      await prisma.projectUserAssignment.create({
        data: {
          userId: actorId,
          projectId: projectId,
          projectRole: 'SITE_ENGINEER',
          assignmentStatus: 'active'
        }
      });
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  const setupSchedule = async (status = 'AI_GENERATED_DRAFT', expectedRowVersion = 1) => {
    return transactionContext.run({ sourceProvenance: 'GATE9_WORKFLOW_ENGINE' }, async () => {
      return prisma.projectSchedule.create({
        data: {
          id: scheduleId,
          projectId,
          workflowStatus: status,
          rowVersion: expectedRowVersion,
          status: 'DRAFT',
        }
      });
    });
  };

  it('1. Missing authentication is rejected (401)', async () => {
    (getSessionActor as jest.Mock).mockRejectedValueOnce(new Error('UNAUTHORIZED: No active session'));
    
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthenticated');
  });

  it('2. A stale or invalid session is rejected (401)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: 'non-existent', role: 'SITE_ENGINEER' });
    
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

  it('6. A non-AI_GENERATED_DRAFT status is rejected (400)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    await setupSchedule('READY_FOR_REVIEW', 1);

    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('Invalid status');
  });

  it('7. A stale rowVersion is rejected (409)', async () => {
    (getSessionActor as jest.Mock).mockResolvedValueOnce({ id: actorId, role: 'SITE_ENGINEER' });
    (checkSchedulingAccess as jest.Mock).mockResolvedValueOnce({ allowed: true });
    await setupSchedule('AI_GENERATED_DRAFT', 2);

    const req = mockRequest({ expectedRowVersion: 1 }); // Stale version
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toBe('SCHEDULE_VERSION_CONFLICT');
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
    expect(data.error).toBe('Validation failed');
    expect(data.errors.length).toBeGreaterThan(0);

    // Verify DB not mutated
    const current = await prisma.projectSchedule.findUnique({ where: { id: scheduleId } });
    expect(current?.workflowStatus).toBe('AI_GENERATED_DRAFT');
    expect(current?.rowVersion).toBe(1);

    const transitions = await prisma.scheduleWorkflowTransition.count();
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
    
    expect(res1.status).toBe(200);

    // Re-run identical request
    const req2 = mockRequest({ expectedRowVersion: 1 });
    const res2 = await POST(req2, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    // Should be caught by Idempotency check if keys match
    expect(res2.status).toBe(200);
    const data = await res2.json();
    expect(data.status).toBe('IDEMPOTENT_SUCCESS');
    
    const transitions = await prisma.scheduleWorkflowTransition.count();
    expect(transitions).toBe(1);
  });
});
