import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.uat-v4-r7' });
import { PrismaClient } from '@prisma/client';
import { POST } from '../src/app/api/projects/[id]/scheduling/[scheduleId]/baseline/activate/route';
import ScheduleReviewPanel from '../src/app/projects/[id]/scheduling/review/ScheduleReviewPanel';
import * as React from 'react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn() })
}));

jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useTransition: () => [false, (cb: any) => cb()],
    useRef: (init: any) => ({ current: init }),
    useState: (init: any) => [init, jest.fn()]
  };
});

const prismaBase = new PrismaClient();

// Mock getSessionActor
jest.mock('../src/lib/scheduling/authUtils', () => ({
  getSessionActor: jest.fn().mockResolvedValue({ id: 'test-user-id', email: 'test@example.com', role: 'PROJECT_DIRECTOR' }),
  checkSchedulingAccess: jest.fn().mockResolvedValue({ allowed: true, projectRole: 'PROJECT_DIRECTOR' })
}));

jest.setTimeout(60000);

describe('Gate 11D Idempotency Wiring Tests', () => {
  let projectId: string;
  let scheduleId: string;
  
  beforeAll(async () => {
    const project = await prismaBase.project.create({
      data: { name: 'Gate 11D Idempotency Wiring Test' }
    });
    projectId = project.id;

    const s = await prismaBase.projectSchedule.create({
      data: {
        projectId,
        name: 'Idempotency Test Schedule',
        workflowStatus: 'PENDING_BASELINE_APPROVAL',
        rowVersion: 6,
        reviewRound: 1,
        awardedContractAmount: 1000,
        scheduledAmount: 1000,
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

    const user = await prismaBase.user.upsert({
      where: { email: 'idemp-test-director@example.com' },
      update: {},
      create: { email: 'idemp-test-director@example.com', role: 'PROJECT_DIRECTOR' }
    });
    
    await prismaBase.projectUserAssignment.create({
      data: {
        projectId,
        userId: user.id,
        projectRole: 'PROJECT_DIRECTOR',
        accessLevel: 'WRITE'
      }
    });

    const pm = await prismaBase.user.upsert({
      where: { email: 'idemp-pm@example.com' },
      update: {},
      create: { email: 'idemp-pm@example.com', role: 'PROJECT_MANAGER' }
    });
    const fo = await prismaBase.user.upsert({
      where: { email: 'idemp-fo@example.com' },
      update: {},
      create: { email: 'idemp-fo@example.com', role: 'FINANCE_OFFICER' }
    });

    await prismaBase.scheduleApproval.createMany({
      data: [
        {
          projectId, scheduleId, reviewerId: pm.id, reviewerRoleSnapshot: 'PROJECT_MANAGER', reviewerNameSnapshot: 'PM', approvalStage: 'TECHNICAL', decision: 'APPROVE', snapshotVersion: '1.0', reviewRound: 1
        },
        {
          projectId, scheduleId, reviewerId: fo.id, reviewerRoleSnapshot: 'FINANCE_OFFICER', reviewerNameSnapshot: 'FO', approvalStage: 'FINANCE', decision: 'APPROVE', snapshotVersion: '1.0', reviewRound: 1
        }
      ]
    });
    
    require('../src/lib/scheduling/authUtils').getSessionActor.mockResolvedValue(user);
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

  const mockRequest = (body: any) => ({
    json: async () => body
  } as Request);

  test('1. Missing idempotency key returns IDEMPOTENCY_KEY_REQUIRED', async () => {
    const req = mockRequest({ expectedRowVersion: 6 });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(400);
    const data = await (res as any).json();
    expect(data.error).toBe('IDEMPOTENCY_KEY_REQUIRED');
  });

  test('3. expectedRowVersion is sent correctly and UI logic uses UUID', async () => {
    // We mock global fetch
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true })
    });
    global.fetch = fetchMock;
    
    // We mock crypto.randomUUID
    const mockUUID = '1234-abcd-5678-efgh';
    if (!global.crypto) (global as any).crypto = {};
    global.crypto.randomUUID = jest.fn().mockReturnValue(mockUUID);

    // Call the functional component
    const scheduleMock = {
      id: scheduleId,
      workflowStatus: 'PENDING_BASELINE_APPROVAL',
      rowVersion: 6,
      reviewRound: 1
    };
    const actorMock = { role: 'PROJECT_DIRECTOR' };
    
    const ui = ScheduleReviewPanel({ schedule: scheduleMock, projectId, actor: actorMock });
    
    // In React 18 / standard FC return, ui is an object describing the DOM.
    // Let's traverse it to find the Activate Baseline button.
    const findButton = (node: any): any => {
      if (!node) return null;
      if (node.type === 'button' && node.props && node.props.children === 'Activate Baseline') return node;
      if (Array.isArray(node)) {
        for (const child of node) {
          const found = findButton(child);
          if (found) return found;
        }
      }
      if (node.props && node.props.children) {
        return findButton(node.props.children);
      }
      return null;
    };
    
    const button = findButton(ui);
    expect(button).toBeTruthy();
    
    // 2. The Activate Baseline UI sends a valid non-empty UUID using the exact route contract.
    // Simulate first click
    button.props.onClick();
    
    // Await transition
    await new Promise(r => setTimeout(r, 10));
    
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const callArgs = fetchMock.mock.calls[0];
    expect(callArgs[0]).toBe(`/api/projects/${projectId}/scheduling/${scheduleId}/baseline/activate`);
    
    const body = JSON.parse(callArgs[1].body);
    expect(body.expectedRowVersion).toBe(6);
    expect(body.idempotencyKey).toBe(mockUUID);
    
    global.fetch = undefined as any;
  });

  test('4. The route reaches activateScheduleBaseline() with a valid key', async () => {
    const key = 'test-idemp-key-1';
    const req = mockRequest({ expectedRowVersion: 6, idempotencyKey: key });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(200);
    const data = await (res as any).json();
    expect(data.success).toBe(true);
  });

  test('5. Reusing the same key cannot create a second BaselineActivation', async () => {
    const key = 'test-idemp-key-1'; // Reused
    const req = mockRequest({ expectedRowVersion: 7, idempotencyKey: key });
    const res = await POST(req, { params: Promise.resolve({ id: projectId, scheduleId }) });
    expect(res.status).toBe(409); // IDEMPOTENCY_KEY_CONFLICT
    const data = await (res as any).json();
    expect(data.error).toBe('IDEMPOTENCY_KEY_CONFLICT');
  });

});
