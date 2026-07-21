import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

import { POST as technicalApprovePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/review/approve/route';
import { POST as financeApprovePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/review/finance-approve/route';
import { POST as submitBaselinePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/baseline/submit/route';
import { prismaBase } from '@/lib/prisma-base';
import { verifySession } from '@/lib/dal/auth';

jest.mock('@/lib/dal/auth', () => ({
  __esModule: true,
  verifySession: jest.fn()
}));

jest.mock('@/lib/permissions', () => ({
  __esModule: true,
  hasPermission: jest.fn().mockImplementation((userId: string, module: string, action: string) => {
    return false;
  }),
  getPermissionsForRole: jest.fn().mockImplementation((roleCode: string) => {
    // For gate 10D tests, roles need canApprove to be true to pass PBAC
    const canApproveRoles = ['PROJECT_DIRECTOR', 'DIRECTORS', 'PROJECT_MANAGER', 'FINANCE_OFFICER', 'SUPER_ADMIN', 'SYSTEM_ADMIN'];
    const canApprove = canApproveRoles.includes(roleCode);
    return {
      'PROJECT_MANAGEMENT': { canApprove }
    };
  })
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: jest.fn() })
}));

jest.setTimeout(30000);

describe('Gate 10D Explicit Approval Paths', () => {
  let projectId: string;
  let scheduleId: string;
  const users: Record<string, string> = {}; // role -> id

  beforeAll(async () => {
    // 1. Create a disposable isolated test project
    const p = await prismaBase.project.create({
      data: { name: 'Gate 10D Test Project' }
    });
    projectId = p.id;
    
    // 2. Create users & assignments for canonical roles
    const roles = ['PROJECT_MANAGER', 'FINANCE_OFFICER', 'DIRECTORS'];
    for (const role of roles) {
      const u = await prismaBase.user.upsert({
        where: { email: `${role.toLowerCase()}@testgate10.com` },
        update: { name: `Test ${role}`, role: role },
        create: { name: `Test ${role}`, email: `${role.toLowerCase()}@testgate10.com`, role: role }
      });
      users[role] = u.id;
      await prismaBase.projectUserAssignment.create({
        data: { projectId, userId: u.id, projectRole: role, accessLevel: 'WRITE' }
      });
    }

    // 3. Create disposable schedule
    const s = await prismaBase.projectSchedule.create({
      data: {
        projectId,
        name: 'Gate 10D Test Schedule',
        workflowStatus: 'UNDER_TECHNICAL_REVIEW',
        rowVersion: 1,
        reviewRound: 1,
      }
    });
    scheduleId = s.id;
  });

  afterAll(async () => {
    // Cleanup disposable test records
    if (scheduleId) {
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
    await prismaBase.$disconnect();
  });

  function mockRequest(body: any) {
    return {
      json: async () => body
    } as Request;
  }

  test('Execute Gate 10D Sequence in Order', async () => {
    let currentRowVersion = 1;

    // --- 1. Technical Approval (PROJECT_MANAGER) ---
    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_MANAGER'] });
    const req1 = mockRequest({ expectedRowVersion: currentRowVersion, comments: 'LGTM' });
    const res1 = await technicalApprovePost(req1, { params: Promise.resolve({ id: projectId, scheduleId }) });
    const data1 = await (res1 as any).json();
    expect(res1.status).toBe(200);
    expect(data1.success).toBe(true);
    
    // Verify changes
    let sched = await prismaBase.projectSchedule.findUnique({ where: { id: scheduleId } });
    expect(sched?.workflowStatus).toBe('TECHNICALLY_APPROVED');
    currentRowVersion++;
    expect(sched?.rowVersion).toBe(currentRowVersion);

    // Verify ScheduleApproval
    let approvals = await prismaBase.scheduleApproval.findMany({ where: { scheduleId } });
    expect(approvals.length).toBe(1);
    expect(approvals[0].approvalStage).toBe('TECHNICAL');

    // --- 2. Finance Approval (FINANCE_OFFICER) ---
    (verifySession as jest.Mock).mockResolvedValue({ id: users['FINANCE_OFFICER'] });
    const req2 = mockRequest({ expectedRowVersion: currentRowVersion });
    const res2 = await financeApprovePost(req2, { params: Promise.resolve({ id: projectId, scheduleId }) });
    const data2 = await (res2 as any).json();
    expect(res2.status).toBe(200);
    expect(data2.success).toBe(true);
    
    // Verify changes (status unchanged, rowVersion incremented)
    sched = await prismaBase.projectSchedule.findUnique({ where: { id: scheduleId } });
    expect(sched?.workflowStatus).toBe('TECHNICALLY_APPROVED');
    currentRowVersion++;
    expect(sched?.rowVersion).toBe(currentRowVersion);

    approvals = await prismaBase.scheduleApproval.findMany({ where: { scheduleId } });
    expect(approvals.length).toBe(2);
    expect(approvals.find(a => a.approvalStage === 'FINANCE')).toBeDefined();

    // --- 3. Final Baseline Recommendation (DIRECTORS) ---
    (verifySession as jest.Mock).mockResolvedValue({ id: users['DIRECTORS'] });
    const req3 = mockRequest({ expectedRowVersion: currentRowVersion });
    const res3 = await submitBaselinePost(req3, { params: Promise.resolve({ id: projectId, scheduleId }) });
    const data3 = await (res3 as any).json();
    expect(res3.status).toBe(200);
    expect(data3.success).toBe(true);
    
    // Verify final state
    sched = await prismaBase.projectSchedule.findUnique({ where: { id: scheduleId } });
    expect(sched?.workflowStatus).toBe('PENDING_BASELINE_APPROVAL');
    currentRowVersion++;
    expect(sched?.rowVersion).toBe(currentRowVersion);

    // Verify no BaselineActivation exists
    const baselines = await prismaBase.baselineActivation.count({ where: { scheduleId } });
    expect(baselines).toBe(0);
    
    console.log('GATE10D_EXPLICIT_APPROVAL_PATHS_READY');
  });
});
