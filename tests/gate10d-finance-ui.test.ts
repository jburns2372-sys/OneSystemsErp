import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

import React from 'react';
import { POST as technicalApprovePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/review/approve/route';
import { POST as financeApprovePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/review/finance-approve/route';
import { POST as submitBaselinePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/baseline/submit/route';
import { prismaBase } from '@/lib/prisma-base';
import { verifySession } from '@/lib/dal/auth';
import ScheduleReviewPanel from '@/app/projects/[id]/scheduling/review/ScheduleReviewPanel';

jest.mock('@/lib/dal/auth', () => ({
  __esModule: true,
  verifySession: jest.fn()
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: jest.fn() })
}));

jest.mock('@/lib/permissions', () => ({
  hasPermission: jest.fn().mockImplementation(async (actorId) => {
    // We cannot access users directly before it's initialized, but we can check if it's the super admin ID if it's passed.
    // Wait, let's just make it return false initially, and we will mock it INSIDE the test where we have `users['SUPER_ADMIN']`!
    return false;
  }),
  getPermissionsForRole: jest.fn().mockImplementation(async (role) => {
    if (role === 'FINANCE_OFFICER') {
      return { PROJECT_MANAGEMENT: { canView: true, canApprove: true, canBaseline: false } };
    }
    return { PROJECT_MANAGEMENT: { canView: true, canEdit: true, canApprove: true, canBaseline: true } };
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() })
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: (init: any) => [init, jest.fn()],
  useTransition: () => [false, jest.fn()],
  useRef: (init: any) => ({ current: init })
}));

jest.setTimeout(30000);

describe('Gate 10D Finance UI and Gating Validation', () => {
  let projectId: string;
  let scheduleId: string;
  const users: Record<string, string> = {};

  beforeAll(async () => {
    const p = await prismaBase.project.create({ data: { name: 'Gate 10D Test Project UI' } });
    projectId = p.id;
    
    const roles = ['PROJECT_MANAGER', 'FINANCE_OFFICER', 'DIRECTORS', 'SITE_ENGINEER', 'SUPER_ADMIN', 'SYSTEM_ADMIN'];
    for (const role of roles) {
      const u = await prismaBase.user.upsert({
        where: { email: `${role.toLowerCase()}@testgate10ui.com` },
        update: { name: `Test ${role}`, role },
        create: { name: `Test ${role}`, email: `${role.toLowerCase()}@testgate10ui.com`, role }
      });
      users[role] = u.id;
      
      // Global admins might not need assignment, but we create one for consistency in test
      if (role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN') {
        await prismaBase.projectUserAssignment.create({
          data: { projectId, userId: u.id, projectRole: role, accessLevel: 'WRITE' }
        });
      }
    }

    const s = await prismaBase.projectSchedule.create({
      data: {
        projectId,
        name: 'Gate 10D UI Test Schedule',
        workflowStatus: 'TECHNICALLY_APPROVED',
        rowVersion: 4,
        reviewRound: 1,
      }
    });
    scheduleId = s.id;
  });

  afterAll(async () => {
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
    return { json: async () => body } as Request;
  }

  function renderTreeToString(element: any): string {
    if (typeof element === 'string' || typeof element === 'number') return String(element);
    if (!element || typeof element !== 'object') return '';
    if (Array.isArray(element)) return element.map(renderTreeToString).join('');
    
    let res = '';
    if (element.props && element.props.children) {
      res += renderTreeToString(element.props.children);
    }
    return res;
  }

  test('UI State 1: FINANCE_OFFICER sees Approve Financially but not Submit', () => {
    const schedule = {
      id: scheduleId,
      workflowStatus: 'TECHNICALLY_APPROVED',
      rowVersion: 4,
      reviewRound: 1,
      approvals: [{ reviewRound: 1, approvalStage: 'TECHNICAL' }] // 1. TECHNICAL exists, no FINANCE
    };
    
    const actorFinance = { id: users['FINANCE_OFFICER'], role: 'FINANCE_OFFICER' };
    const element = ScheduleReviewPanel({ schedule, projectId, actor: actorFinance });
    const output = renderTreeToString(element);
    
    expect(output).toContain('Approve Financially');
    expect(output).not.toContain('Submit for Baseline Approval');
  });

  test('UI State 2: PROJECT_MANAGER sees neither action', () => {
    const schedule = {
      id: scheduleId,
      workflowStatus: 'TECHNICALLY_APPROVED',
      rowVersion: 4,
      reviewRound: 1,
      approvals: [{ reviewRound: 1, approvalStage: 'TECHNICAL' }]
    };
    
    const actorPM = { id: users['PROJECT_MANAGER'], role: 'PROJECT_MANAGER' };
    const element = ScheduleReviewPanel({ schedule, projectId, actor: actorPM });
    const output = renderTreeToString(element);
    
    expect(output).not.toContain('Approve Financially');
    expect(output).not.toContain('Submit for Baseline Approval');
  });

  test('UI State 3: SITE_ENGINEER sees neither action', () => {
    const schedule = {
      id: scheduleId,
      workflowStatus: 'TECHNICALLY_APPROVED',
      rowVersion: 4,
      reviewRound: 1,
      approvals: [{ reviewRound: 1, approvalStage: 'TECHNICAL' }]
    };
    
    const actorSite = { id: users['SITE_ENGINEER'], role: 'SITE_ENGINEER' };
    const element = ScheduleReviewPanel({ schedule, projectId, actor: actorSite });
    const output = renderTreeToString(element);
    
    expect(output).not.toContain('Approve Financially');
    expect(output).not.toContain('Submit for Baseline Approval');
  });

  test('UI State 4: Director does not see Submit without Finance Approval', () => {
    const schedule = {
      id: scheduleId,
      workflowStatus: 'TECHNICALLY_APPROVED',
      rowVersion: 4,
      reviewRound: 1,
      approvals: [{ reviewRound: 1, approvalStage: 'TECHNICAL' }] // No Finance
    };
    
    const actorDir = { id: users['DIRECTORS'], role: 'DIRECTORS' };
    const element = ScheduleReviewPanel({ schedule, projectId, actor: actorDir });
    const output = renderTreeToString(element);
    // Director cannot see Approve Financially
    expect(output).not.toContain('Approve Financially'); 
    expect(output).not.toContain('Submit for Baseline Approval');
  });

  test('UI State 5: Director sees Submit after both approvals exist', () => {
    const schedule = {
      id: scheduleId,
      workflowStatus: 'TECHNICALLY_APPROVED',
      rowVersion: 4,
      reviewRound: 1,
      approvals: [
        { reviewRound: 1, approvalStage: 'TECHNICAL' },
        { reviewRound: 1, approvalStage: 'FINANCE' }
      ]
    };
    
    const actorDir = { id: users['DIRECTORS'], role: 'DIRECTORS' };
    const element = ScheduleReviewPanel({ schedule, projectId, actor: actorDir });
    const output = renderTreeToString(element);
    
    expect(output).not.toContain('Approve Financially');
    expect(output).toContain('Submit for Baseline Approval');
  });

  test('UI State 6: Admins do not see UI fallbacks', () => {
    const schedule = {
      id: scheduleId,
      workflowStatus: 'TECHNICALLY_APPROVED',
      rowVersion: 4,
      reviewRound: 1,
      approvals: [
        { reviewRound: 1, approvalStage: 'TECHNICAL' },
        { reviewRound: 1, approvalStage: 'FINANCE' }
      ]
    };
    
    const actorAdmin = { id: users['SUPER_ADMIN'], role: 'SUPER_ADMIN' };
    const element = ScheduleReviewPanel({ schedule, projectId, actor: actorAdmin });
    const output = renderTreeToString(element);
    
    expect(output).not.toContain('Approve Financially');
    expect(output).not.toContain('Submit for Baseline Approval');
  });

  test('Backend Gating: Director cannot bypass backend if missing Finance approval', async () => {
    // Current DB state has NO approvals yet.
    // Try to submit for baseline approval as Director.
    (verifySession as jest.Mock).mockResolvedValue({ id: users['DIRECTORS'] });
    const req = mockRequest({ expectedRowVersion: 4 });
    const res = await submitBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500); 
    
    const data = await (res as any).json();
    expect(data.error).toContain('Missing prerequisite approvals');
  });

  test('Backend Routing: Duplicate Finance approval remains rejected', async () => {
    // 1. We mock the Technical approval directly into DB so we can test Finance route correctly
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

    // 2. Finance Officer Approves
    (verifySession as jest.Mock).mockResolvedValue({ id: users['FINANCE_OFFICER'] });
    const currentSched = await prismaBase.projectSchedule.findUnique({ where: { id: scheduleId } });
    console.log('BEFORE TEST 2 SCHED:', currentSched);

    const req1 = mockRequest({ expectedRowVersion: 4 });
    const res1 = await financeApprovePost(req1, { params: Promise.resolve({ id: projectId, scheduleId }) });
    if (res1.status !== 200) {
      console.log('TEST 2 FAILED. STATUS:', res1.status, 'BODY:', await (res1 as any).clone().json());
    }
    expect(res1.status).toBe(200);

    // 3. Finance Officer attempts Duplicate Approval
    const req2 = mockRequest({ expectedRowVersion: 5 }); // Row version incremented by previous success
    const res2 = await financeApprovePost(req2, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res2.status).toBe(500); 
    
    const data2 = await (res2 as any).json();
    expect(data2.error).toContain('FINANCE approval already exists');
  });

  test('Backend Gating: Strict Role Separation for Finance and Baseline', async () => {
    const permissions = require('@/lib/permissions');
    (permissions.hasPermission as jest.Mock).mockResolvedValue(true);

    // Admins attempting Finance Approval
    (verifySession as jest.Mock).mockResolvedValue({ id: users['SUPER_ADMIN'] });
    const reqAdminFin = mockRequest({ expectedRowVersion: 5 });
    const resAdminFin = await financeApprovePost(reqAdminFin, { params: Promise.resolve({ id: projectId, scheduleId }) });
    if (resAdminFin.status !== 500) {
       console.log('resAdminFin STATUS:', resAdminFin.status, 'BODY:', await (resAdminFin as any).clone().json());
    }
    expect(resAdminFin.status).toBe(500);
    const dataAdminFin = await (resAdminFin as any).json();
    expect(dataAdminFin.error).toContain('Unauthorized role');

    // Admins attempting Baseline Submit
    const reqAdminBase = mockRequest({ expectedRowVersion: 5 });
    const resAdminBase = await submitBaselinePost(reqAdminBase, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(resAdminBase.status).toBe(500);
    const dataAdminBase = await (resAdminBase as any).json();
    expect(dataAdminBase.error).toContain('Unauthorized role');

    // Restore PBAC for Finance Officer
    (permissions.hasPermission as jest.Mock).mockResolvedValue(false);

    // Finance Officer attempting Baseline Submit (should hit PBAC canSubmit: false)
    (verifySession as jest.Mock).mockResolvedValue({ id: users['FINANCE_OFFICER'] });
    const reqFinBase = mockRequest({ expectedRowVersion: 5 });
    const resFinBase = await submitBaselinePost(reqFinBase, { params: Promise.resolve({ id: projectId, scheduleId }) });
    // Finance officer lacks `canSubmit` PBAC, so it gets 403 Forbidden
    expect(resFinBase.status).toBe(403);
  });
});
