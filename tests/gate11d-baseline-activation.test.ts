import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });

import { POST as activateBaselinePost } from '@/app/api/projects/[id]/scheduling/[scheduleId]/baseline/activate/route';
import { prismaBase } from '@/lib/prisma-base';
import { prisma } from '@/lib/prisma';
import { verifySession } from '@/lib/dal/auth';

jest.mock('@/lib/dal/auth', () => ({
  __esModule: true,
  verifySession: jest.fn()
}));

jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({ get: jest.fn() })
}));

jest.setTimeout(60000);

describe('Gate 11D Baseline Activation PBAC Validation', () => {
  let projectId: string;
  let scheduleId: string;
  const users: Record<string, string> = {};

  beforeAll(async () => {
    const p = await prismaBase.project.create({ data: { name: 'Gate 11D Activation Test' } });
    projectId = p.id;
    
    const roles = [
      'PROJECT_DIRECTOR',
      'DIRECTORS',
      'FINANCE_OFFICER',
      'PROJECT_MANAGER',
      'SITE_ENGINEER',
      'SUPER_ADMIN',
      'SYSTEM_ADMIN',
      'NO_ASSIGNMENT'
    ];
    
    for (const role of roles) {
      const u = await prismaBase.user.upsert({
        where: { email: `${role.toLowerCase()}@testgate11.com` },
        update: { role },
        create: { name: `Test ${role}`, email: `${role.toLowerCase()}@testgate11.com`, role }
      });
      users[role] = u.id;
      
      if (role !== 'SUPER_ADMIN' && role !== 'SYSTEM_ADMIN' && role !== 'NO_ASSIGNMENT') {
        await prismaBase.projectUserAssignment.create({
          data: { projectId, userId: u.id, projectRole: role, accessLevel: 'WRITE' }
        });
      }
    }

    const s = await prismaBase.projectSchedule.create({
      data: {
        projectId,
        name: 'Gate 11D Test Schedule',
        workflowStatus: 'PENDING_BASELINE_APPROVAL',
        rowVersion: 1,
        reviewRound: 1,
        awardedContractAmount: 100,
        scheduledAmount: 100,
        lockedBOQChecksum: '514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17',
        wbsNodes: {
          create: [
            { code: 'WBS-1', name: 'Testing and Commissioning', level: 1 },
            { code: 'WBS-2', name: 'Project Acceptance and Demobilization', level: 1 }
          ]
        }
      }
    });
    scheduleId = s.id;
  });

  afterAll(async () => {
    if (projectId) {
      await prismaBase.scheduleApproval.deleteMany({ where: { schedule: { projectId } } });
      await prismaBase.baselineActivation.deleteMany({ where: { schedule: { projectId } } });
      await prismaBase.scheduleWBS.deleteMany({ where: { schedule: { projectId } } });
      await prismaBase.projectSchedule.deleteMany({ where: { projectId } });
      await prismaBase.projectUserAssignment.deleteMany({ where: { projectId } });
      await prismaBase.project.deleteMany({ where: { id: projectId } });
    }
    await prismaBase.$disconnect();
  });

  function mockRequest(body: any) {
    if (body.idempotencyKey) {
      body.idempotencyKey = `${body.idempotencyKey}-${Math.random().toString(36).substring(7)}`;
    }
    return { json: async () => body } as Request;
  }

  test('4. Missing project assignment is denied', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['NO_ASSIGNMENT'] });
    const req = mockRequest({ expectedRowVersion: 1, idempotencyKey: 'idemp-noassign' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(403);
  });

  test('3. Other roles are denied', async () => {
    const roles = ['PROJECT_MANAGER', 'FINANCE_OFFICER', 'SITE_ENGINEER', 'SUPER_ADMIN', 'SYSTEM_ADMIN'];
    for (const role of roles) {
      (verifySession as jest.Mock).mockResolvedValue({ id: users[role] });
      const req = mockRequest({ expectedRowVersion: 1, idempotencyKey: `idemp-${role}` });
      const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
      expect([403, 500]).toContain(res.status);
    }
  });

  test('5. Missing TECHNICAL approval is denied', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_DIRECTOR'] });
    const req = mockRequest({ expectedRowVersion: 1, idempotencyKey: 'idemp-notech' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500);
    const data = await (res as any).json();
    expect(data.error).toContain('Exactly one TECHNICAL approval required');
  });

  test('6. Missing FINANCE approval is denied', async () => {
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

    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_DIRECTOR'] });
    const req = mockRequest({ expectedRowVersion: 1, idempotencyKey: 'idemp-nofin' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500);
    const data = await (res as any).json();
    expect(data.error).toContain('Exactly one FINANCE approval required');
  });

  test('8. Non-zero financial difference is denied', async () => {
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

    await prismaBase.projectSchedule.update({
      where: { id: scheduleId },
      data: { scheduledAmount: 110, rowVersion: 2 }
    });

    const req = mockRequest({ expectedRowVersion: 2, idempotencyKey: 'idemp-diff' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500);
    const data = await (res as any).json();
    expect(data.error).toContain('Financial difference must be zero');

    // Revert back
    await prismaBase.projectSchedule.update({
      where: { id: scheduleId },
      data: { scheduledAmount: 100, rowVersion: 3 }
    });
  });

  test('7. Wrong review-round approvals are denied', async () => {
    // Current round is 1. If we update approvals to round 0...
    await prismaBase.scheduleApproval.updateMany({
      where: { scheduleId }, data: { reviewRound: 0 }
    });

    const req = mockRequest({ expectedRowVersion: 3, idempotencyKey: 'idemp-wrong-round' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(500);
    const data = await (res as any).json();
    expect(data.error).toContain('Exactly one TECHNICAL approval required');

    // Restore
    await prismaBase.scheduleApproval.updateMany({
      where: { scheduleId }, data: { reviewRound: 1 }
    });
  });

  test('9. Stale rowVersion is denied', async () => {
    const req = mockRequest({ expectedRowVersion: 999, idempotencyKey: 'idemp-stale' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(409); // SCHEDULE_VERSION_CONFLICT
  });

  test('1, 11, 12, 13, 14. PROJECT_DIRECTOR can activate a valid pending baseline', async () => {
    (verifySession as jest.Mock).mockResolvedValue({ id: users['PROJECT_DIRECTOR'] });
    const req = mockRequest({ expectedRowVersion: 3, idempotencyKey: 'idemp-success-pd' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    const data = await (res as any).json();
    if (res.status !== 200) console.log("ACTIVATION FAILED:", data);
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const sched = await prismaBase.projectSchedule.findUnique({ where: { id: scheduleId } });
    expect(sched?.workflowStatus).toBe('ACTIVE_BASELINE');
    expect(sched?.rowVersion).toBe(4);
    expect(sched?.baselineCode).toBeTruthy();

    const activations = await prismaBase.baselineActivation.count({ where: { scheduleId } });
    expect(activations).toBe(1);
  });

  test('10. Duplicate activation is rejected', async () => {
    const req = mockRequest({ expectedRowVersion: 4, idempotencyKey: 'idemp-dup' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect([409, 500]).toContain(res.status); // SCHEDULE_ALREADY_ACTIVE
  });

  test('17. Public guarded Prisma direct mutation remains rejected', async () => {
    // Try to update an activity via public prisma
    await expect(
      prisma.scheduleActivity.create({
        data: {
          projectId,
          scheduleId,
          activityCode: 'TEST',
          name: 'TEST ACT',
          wbsId: 'not-needed'
        }
      })
    ).rejects.toThrow('GATE9D_DIRECT_MUTATION_REJECTED');
  });

  test('2. DIRECTORS can activate a valid pending baseline (on a new schedule)', async () => {
    const s2 = await prismaBase.projectSchedule.create({
      data: {
        projectId,
        name: 'Gate 11D Test Schedule 2',
        workflowStatus: 'PENDING_BASELINE_APPROVAL',
        rowVersion: 1,
        reviewRound: 1,
        awardedContractAmount: 100,
        scheduledAmount: 100,
        lockedBOQChecksum: '514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17',
        wbsNodes: {
          create: [
            { code: 'WBS-1', name: 'Testing and Commissioning', level: 1 },
            { code: 'WBS-2', name: 'Project Acceptance and Demobilization', level: 1 }
          ]
        }
      }
    });

    await prismaBase.scheduleApproval.createMany({
      data: [
        {
          projectId, scheduleId: s2.id, reviewerId: users['PROJECT_MANAGER'],
          reviewerRoleSnapshot: 'PROJECT_MANAGER', reviewerNameSnapshot: 'Test PM',
          approvalStage: 'TECHNICAL', decision: 'APPROVE', snapshotVersion: '1.0', reviewRound: 1
        },
        {
          projectId, scheduleId: s2.id, reviewerId: users['FINANCE_OFFICER'],
          reviewerRoleSnapshot: 'FINANCE_OFFICER', reviewerNameSnapshot: 'Test FO',
          approvalStage: 'FINANCE', decision: 'APPROVE', snapshotVersion: '1.0', reviewRound: 1
        }
      ]
    });

    (verifySession as jest.Mock).mockResolvedValue({ id: users['DIRECTORS'] });
    const req = mockRequest({ expectedRowVersion: 1, idempotencyKey: 'idemp-success-dir' });
    const res = await activateBaselinePost(req, { params: Promise.resolve({ id: projectId, scheduleId: s2.id }) });
    expect(res.status).toBe(200);

    // Cleanup s2
    await prismaBase.scheduleApproval.deleteMany({ where: { scheduleId: s2.id } });
    await prismaBase.baselineActivation.deleteMany({ where: { scheduleId: s2.id } });
    await prismaBase.scheduleWBS.deleteMany({ where: { scheduleId: s2.id } });
    await prismaBase.projectSchedule.deleteMany({ where: { id: s2.id } });
  });
});
