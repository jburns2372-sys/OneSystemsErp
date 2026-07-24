import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

import { POST as submitBaselinePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/baseline/submit/route';
import { prismaBase } from '@/lib/prisma-base';
import { verifySession } from '@/lib/dal/auth';

jest.mock('@/lib/dal/auth', () => {
  const mockFn = jest.fn();
  return {
    __esModule: true,
    verifySession: mockFn,
    verifyApiSession: mockFn
  };
});

jest.mock('@/lib/permissions', () => ({
  __esModule: true,
  hasPermission: jest.fn().mockImplementation((userId: string, module: string, action: string) => {
    // We can just rely on the fallback or mock it to false to force checking project roles
    return false;
  }),
  getUserPermissions: jest.fn().mockImplementation(async (userId: string) => {
    const prisma = require('@/lib/prisma-base').prismaBase;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return {};
    const roleCode = user.role;
    const canApproveRoles = ['PROJECT_DIRECTOR', 'DIRECTORS', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'SYSTEM_ADMIN'];
    const canApprove = canApproveRoles.includes(roleCode);
    return {
      'PROJECT_MANAGEMENT': { canApprove, canSubmit: canApprove, canEdit: canApprove },
      'Scheduling': { canApprove, canSubmit: canApprove, canEdit: canApprove },
      'ALL': { canApprove, canSubmit: canApprove, canEdit: canApprove }
    };
  }),
  getPermissionsForRole: jest.fn().mockImplementation((roleCode: string) => {
    return { 'PROJECT_MANAGEMENT': { canApprove: true } };
  })
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: jest.fn() })
}));

jest.setTimeout(30000);

describe('Gate 10D Baseline Submit PBAC Validation', () => {
  let projectId: string;
  let scheduleId: string;
  const users: Record<string, string> = {};

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
      const u = await prismaBase.user.upsert({
        where: { email: `${role.toLowerCase()}@testgate10pbac.com` },
        update: { name: `Test ${role}`, role },
        create: { name: `Test ${role}`, email: `${role.toLowerCase()}@testgate10pbac.com`, role }
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
    try {
      if (Object.keys(users).length > 0) {
        await prismaBase.auditLog.deleteMany({
          where: { userId: { in: Object.values(users) } },
        });
      }
      if (scheduleId) {
        await prismaBase.baselineActivation.deleteMany({ where: { scheduleId } });
        await prismaBase.scheduleApproval.deleteMany({ where: { scheduleId } });
        await prismaBase.projectSchedule.deleteMany({ where: { id: scheduleId } });
      }
      if (projectId) {
        await prismaBase.projectUserAssignment.deleteMany({ where: { projectId } });
        await prismaBase.project.deleteMany({ where: { id: projectId } });
      }
      if (Object.keys(users).length > 0) {
        await prismaBase.user.deleteMany({ where: { id: { in: Object.values(users) } } });
      }
    } finally {
      await prismaBase.$disconnect();
    }
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
        schedule: { connect: { id: scheduleId } },
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
        schedule: { connect: { id: scheduleId } },
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
    
    const sched = await prismaBase.projectSchedule.findUnique({ where: { id: scheduleId } });
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
      where: { id: scheduleId },
      data: { workflowStatus: 'TECHNICALLY_APPROVED', rowVersion: 2 }
    });

    (verifySession as jest.Mock).mockResolvedValue({ id: users['DIRECTORS'] });
    const req = mockRequest({ expectedRowVersion: 2 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(200);
    const data = await (res as any).json();
    expect(data.success).toBe(true);
    
    const sched = await prismaBase.projectSchedule.findUnique({ where: { id: scheduleId } });
    expect(sched?.workflowStatus).toBe('PENDING_BASELINE_APPROVAL');
  });

  test('4. PROJECT_DIRECTOR with canApprove false is denied', async () => {
    // Reset status
    await prismaBase.projectSchedule.update({
      where: { id: scheduleId },
      data: { workflowStatus: 'TECHNICALLY_APPROVED', rowVersion: 3 }
    });

      (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_DIRECTOR'] });
      
      const permissionsMock = require('@/lib/permissions');
      permissionsMock.getPermissionsForRole.mockImplementationOnce(() => ({
        'PROJECT_MANAGEMENT': { canApprove: false }
      }));

      const req = mockRequest({ expectedRowVersion: 3 });
      const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
      expect(res.status).toBe(403);
    });

  test('13. No BaselineActivation record is created', async () => {
    const activations = await prismaBase.baselineActivation.count({
      where: { scheduleId }
    });
    expect(activations).toBe(0);
  });
});
