import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

import { POST as submitBaselinePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/baseline/submit/route';
import { prismaBase } from '@/lib/prisma-base';
import { verifySession } from '@/lib/dal/auth';

jest.mock('@/lib/dal/auth', () => ({
  __esModule: true,
  verifySession: jest.fn()
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: jest.fn() })
}));

jest.setTimeout(30000);

describe('Gate 10D Baseline Submit PBAC Validation', () => {
  let projectId: string;
  let scheduleId: string;
  let users: Record<string, string> = {};

  beforeAll(async () => {
    const p = await prismaBase.project.create({ data: { name: 'Gate 10D Baseline PBAC Test' } });
    projectId = p.id;
    
    const roles = [
      'PROJECT_DIRECTOR',
      'DIRECTORS',
      'FINANCE_OFFICER',
      'PROJECT_MANAGER',
      'SITE_ENGINEER',
      'SUPER_ADMIN',
      'SYSTEM_ADMIN'
    ];
    
    for (const role of roles) {
      const u = await prismaBase.user.create({
        data: { name: `Test ${role}`, email: `${role.toLowerCase()}@testgate10base.com`, role }
      });
      users[role] = u.id;
      
      if (role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN') {
        await prismaBase.projectUserAssignment.create({
          data: { projectId, userId: u.id, projectRole: role, accessLevel: 'WRITE' }
        });
      }
    }

    const s = await prismaBase.projectSchedule.create({
      data: {
        projectId,
        name: 'Gate 10D Baseline PBAC Test Schedule',
        workflowStatus: 'TECHNICALLY_APPROVED',
        rowVersion: 1,
        reviewRound: 1,
      }
    });
    scheduleId = s.id;
  });

  afterAll(async () => {
    if (scheduleId) {
      await prismaBase.scheduleApproval.deleteMany({ where: { scheduleId } });
      await prismaBase.baselineActivation.deleteMany({ where: { scheduleId } });
      await prismaBase.projectSchedule.delete({ where: { id_projectId: { id: scheduleId, projectId } } });
    }
    if (projectId) {
      await prismaBase.projectUserAssignment.deleteMany({ where: { projectId } });
      await prismaBase.project.delete({ where: { id: projectId } });
    }
    if (Object.keys(users).length > 0) {
      await prismaBase.user.deleteMany({ where: { id: { in: Object.values(users) } } });
    }
    await prismaBase.$disconnect();
  });

  function mockRequest(body: any) {
    return { json: async () => body } as Request;
  }

  test('9. Missing current-round TECHNICAL approval is rejected', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_DIRECTOR'] });
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500);
    const data = await (res as any).json();
    expect(data.error).toContain('Missing prerequisite approvals');
  });

  test('10. Missing current-round FINANCE approval is rejected', async () => {
    await prismaBase.scheduleApproval.create({
      data: {
        schedule: { connect: { id_projectId: { id: scheduleId, projectId } } },
        reviewer: { connect: { id: users['PROJECT_MANAGER'] } },
        reviewerRoleSnapshot: 'PROJECT_MANAGER',
        reviewerNameSnapshot: 'Test PM',
        approvalStage: 'TECHNICAL',
        decision: 'APPROVE',
        snapshotVersion: '1.0',
        reviewRound: 1
      }
    });

    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500);
    const data = await (res as any).json();
    expect(data.error).toContain('Missing prerequisite approvals');
  });

  test('Prepare required approvals for further tests', async () => {
    await prismaBase.scheduleApproval.create({
      data: {
        schedule: { connect: { id_projectId: { id: scheduleId, projectId } } },
        reviewer: { connect: { id: users['FINANCE_OFFICER'] } },
        reviewerRoleSnapshot: 'FINANCE_OFFICER',
        reviewerNameSnapshot: 'Test FO',
        approvalStage: 'FINANCE',
        decision: 'APPROVE',
        snapshotVersion: '1.0',
        reviewRound: 1
      }
    });
  });

  test('11. Stale rowVersion is rejected', async () => {
    const req = mockRequest({ expectedRowVersion: 999 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(409); // SCHEDULE_VERSION_CONFLICT
  });

  test('5. FINANCE_OFFICER is denied', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['FINANCE_OFFICER'] });
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect([403, 500]).toContain(res.status);
  });

  test('6. PROJECT_MANAGER is denied', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_MANAGER'] });
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect([403, 500]).toContain(res.status);
  });

  test('7. SITE_ENGINEER is denied', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['SITE_ENGINEER'] });
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect([403, 500]).toContain(res.status);
  });

  test('8. SUPER_ADMIN and SYSTEM_ADMIN are denied', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['SUPER_ADMIN'] });
    const req1 = mockRequest({ expectedRowVersion: 1 });
    const res1 = await submitBaselinePost(req1, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    (verifySession as jest.Mock).mockResolvedValue({ id: users['SYSTEM_ADMIN'] });
    const req2 = mockRequest({ expectedRowVersion: 1 });
    const res2 = await submitBaselinePost(req2, { params: Promise.resolve({ id: projectId, scheduleId }) });
    
    expect([403, 500]).toContain(res1.status);
    expect([403, 500]).toContain(res2.status);
  });

  test('1, 3. PROJECT_DIRECTOR with active project assignment and canApprove reaches executeFinalBaselineRecommendationMutation', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_DIRECTOR'] });
    const req = mockRequest({ expectedRowVersion: 1 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(200);
    const data = await (res as any).json();
    expect(data.success).toBe(true);
    
    const sched = await prismaBase.projectSchedule.findUnique({ where: { id_projectId: { id: scheduleId, projectId } } });
    expect(sched?.workflowStatus).toBe('PENDING_BASELINE_APPROVAL');
  });

  test('12. Duplicate baseline recommendation is rejected', async () => {
    // It's already PENDING_BASELINE_APPROVAL now
    const req = mockRequest({ expectedRowVersion: 2 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500);
    const data = await (res as any).json();
    expect(data.error).toContain('Invalid status: PENDING_BASELINE_APPROVAL');
  });

  test('2. DIRECTORS with the same required authorization is allowed', async () => {
    await prismaBase.projectSchedule.update({
      where: { id_projectId: { id: scheduleId, projectId } },
      data: { workflowStatus: 'TECHNICALLY_APPROVED', rowVersion: 2 }
    });

    (verifySession as jest.Mock).mockResolvedValue({ id: users['DIRECTORS'] });
    const req = mockRequest({ expectedRowVersion: 2 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(200);
    const data = await (res as any).json();
    expect(data.success).toBe(true);
    
    const sched = await prismaBase.projectSchedule.findUnique({ where: { id_projectId: { id: scheduleId, projectId } } });
    expect(sched?.workflowStatus).toBe('PENDING_BASELINE_APPROVAL');
  });

  test('4. PROJECT_DIRECTOR with canApprove false is denied', async () => {
    // Reset status
    await prismaBase.projectSchedule.update({
      where: { id_projectId: { id: scheduleId, projectId } },
      data: { workflowStatus: 'TECHNICALLY_APPROVED', rowVersion: 3 }
    });

    // Revoke canApprove from PROJECT_DIRECTOR
    const rolePermission = await prismaBase.rolePermission.findFirst({
      where: { role: { roleCode: 'PROJECT_DIRECTOR' }, moduleName: 'PROJECT_MANAGEMENT' }
    });
    if (rolePermission) {
      await prismaBase.rolePermission.update({
        where: { id: rolePermission.id },
        data: { canApprove: false }
      });
    }

    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_DIRECTOR'] });
    const req = mockRequest({ expectedRowVersion: 3 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect([403, 500]).toContain(res.status);

    // Restore canApprove
    if (rolePermission) {
      await prismaBase.rolePermission.update({
        where: { id: rolePermission.id },
        data: { canApprove: true }
      });
    }
  });

  test('13. No BaselineActivation record is created', async () => {
    const activations = await prismaBase.baselineActivation.count({
      where: { scheduleId }
    });
    expect(activations).toBe(0);
  });
});
