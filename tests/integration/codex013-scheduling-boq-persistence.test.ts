/**
 * ONESYSTEMSERP-CODEX-011-REMEDIATION-013
 * Persistence-level regression for Codex findings 2 (infeasible dates) and 3 (BOQ reconciliation).
 *
 * Runs the real runAIOrchestrator transaction against the LOCAL database with isolated
 * synthetic projects. Only the external AI calls are mocked; all CPM, reconciliation and
 * persistence logic is the production code path. Fixtures are removed in afterAll.
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { prisma } from '@/lib/prisma';
import { prismaBase } from '@/lib/prisma-base';
import { runAIOrchestrator } from '@/lib/scheduling/aiOrchestrator';
import { inclusiveDaySpan } from '@/lib/scheduling/scheduleReconciliation';

jest.mock('ai', () => ({
  generateObject: jest.fn().mockResolvedValue({
    object: { primaryType: 'Building', secondaryDisciplines: [], confidence: 0.95, rationale: 'synthetic test' },
  }),
  generateText: jest.fn(),
}));
jest.mock('@ai-sdk/openai', () => ({ openai: jest.fn(() => ({})) }));

// Deterministic proposal: A (10 days) -> FS -> B (5 days); remaining BOQ groups are auto-assigned.
jest.mock('@/lib/scheduling/providers/OpenAIProposalProvider', () => ({
  OpenAIProposalProvider: class {
    async generateProposal(ctx: any) {
      const ids: string[] = ctx.boqPayload.map((b: any) => b.id);
      return {
        phases: [
          {
            phaseName: 'Construction Works',
            rationale: 'synthetic',
            activities: [
              {
                temporaryActivityKey: 'A', activityName: 'Activity A (10d)', durationMethod: 'FIXED_TECHNICAL_DURATION',
                discipline: 'Civil', assignedBOQItemIds: [ids[0]], productivityAssumption: null, crewCountAssumption: null,
                workFrontAssumption: null, fixedTechnicalDuration: 10, predecessors: [], confidence: 0.9,
              },
              {
                temporaryActivityKey: 'B', activityName: 'Activity B (5d)', durationMethod: 'FIXED_TECHNICAL_DURATION',
                discipline: 'Civil', assignedBOQItemIds: [ids[1]], productivityAssumption: null, crewCountAssumption: null,
                workFrontAssumption: null, fixedTechnicalDuration: 5, predecessors: [{ key: 'A', type: 'FS', lag: 0 }], confidence: 0.9,
              },
            ],
          },
        ],
      };
    }
  },
}));

jest.setTimeout(120000);

const TAG = `CODEX013-${Date.now()}`;
const START = new Date('2026-01-05T00:00:00.000Z');
const createdProjectIds: string[] = [];

async function createSyntheticProject(opts: {
  suffix: string; contractAmount: number; contractDuration: number; boq: Array<{ code: string; total: number }>;
  legacyZeroAdjustment?: boolean;
}) {
  const project = await prisma.project.create({
    data: {
      name: `${TAG} ${opts.suffix}`,
      description: 'Synthetic fixture for Codex 013 regression (safe to delete)',
      contractAmount: opts.contractAmount,
      originalContractDuration: opts.contractDuration,
      startDate: START,
    } as any,
  });
  createdProjectIds.push(project.id);
  for (const line of opts.boq) {
    await prisma.awardedBOQItem.create({
      data: { projectId: project.id, itemCode: line.code, description: `Line ${line.code}`, unit: 'LS', quantity: 1, totalCost: line.total } as any,
    });
  }
  if (opts.legacyZeroAdjustment) {
    await prisma.awardedBOQItem.create({
      data: {
        projectId: project.id, itemCode: 'GEN-REQ-001', description: 'General Requirements, Overhead, Profit, and Contingency',
        unit: 'LOT', quantity: 1, totalCost: 0, status: 'PENDING',
      } as any,
    });
  }
  return project;
}

async function loadPersisted(projectId: string, scheduleId: string) {
  const schedule = await prisma.projectSchedule.findUnique({ where: { id: scheduleId } });
  const activities = await prisma.scheduleActivity.findMany({ where: { scheduleId }, orderBy: { activityCode: 'asc' } });
  const allocations = await prisma.scheduleBOQAllocation.findMany({ where: { scheduleId } });
  const deps = await prisma.scheduleDependency.findMany({ where: { scheduleId } });
  const boq = await prisma.awardedBOQItem.findMany({ where: { projectId } });
  const adjustments = boq.filter(b => b.itemCode === 'GEN-REQ-001');
  const sum = (xs: number[]) => Math.round(xs.reduce((a, b) => a + b, 0) * 100) / 100;
  return {
    schedule, activities, allocations, deps, boq, adjustments,
    metrics: JSON.parse(schedule!.validationMetrics as any),
    flags: JSON.parse(schedule!.feasibilityFlags as any),
    boqTotal: sum(boq.map(b => b.totalCost)),
    allocationTotal: sum(allocations.map(a => Number(a.allocatedAmount))),
  };
}

function expectLineLevelConsistency(p: Awaited<ReturnType<typeof loadPersisted>>) {
  for (const line of p.boq) {
    const lineAlloc = p.allocations.filter(a => a.awardedBoqItemId === line.id).reduce((s, a) => s + Number(a.allocatedAmount), 0);
    expect(Math.round(lineAlloc * 100) / 100).toBe(Math.round(line.totalCost * 100) / 100);
  }
  // No zero-value adjustment item carrying a non-zero allocation
  for (const adj of p.adjustments) {
    const adjAlloc = p.allocations.filter(a => a.awardedBoqItemId === adj.id).reduce((s, a) => s + Number(a.allocatedAmount), 0);
    expect(adj.totalCost === 0 && adjAlloc !== 0).toBe(false);
  }
}

beforeAll(() => {
  const url = new URL(process.env.DATABASE_URL || '');
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/testdb') {
    throw new Error('ISOLATION_ABORT: tests must run against localhost:5432/testdb only');
  }
  process.env.SCHEDULING_GENERATION_MODE = '';
});

afterAll(async () => {
  for (const id of createdProjectIds) {
    // Synthetic fixture teardown (schedule children cascade from ProjectSchedule).
    await prismaBase.projectSchedule.deleteMany({ where: { projectId: id } });
    await prismaBase.project.delete({ where: { id } }).catch(() => undefined);
  }
  const leftover = await prismaBase.project.count({ where: { name: { startsWith: TAG } } });
  console.log(`[CODEX013] fixture cleanup leftover projects = ${leftover}`);
  await prismaBase.$disconnect();
});

describe('Defect 3 — BOQ reconciliation persistence', () => {
  it('BOQ 80 / Contract 100: persisted adjustment = 20, allocations = 100, then rerun creates no duplicate', async () => {
    const project = await createSyntheticProject({
      suffix: 'BOQ80-C100', contractAmount: 100, contractDuration: 30, boq: [{ code: 'A-001', total: 50 }, { code: 'A-002', total: 30 }],
    });

    const r1: any = await runAIOrchestrator({ projectId: project.id, generationRequestId: `${TAG}-1` });
    expect(r1.success).toBe(true);
    const p1 = await loadPersisted(project.id, r1.scheduleId);
    console.log('[CODEX013][BOQ80] run1', JSON.stringify({ adjustments: p1.adjustments.map(a => a.totalCost), boqTotal: p1.boqTotal, allocationTotal: p1.allocationTotal, scheduled: Number(p1.schedule!.scheduledAmount), awarded: Number(p1.schedule!.awardedContractAmount), diff: Number(p1.schedule!.differenceAmount), recon: p1.metrics.boqReconciliation, overall: p1.metrics.OVERALL }));

    expect(p1.adjustments).toHaveLength(1);
    expect(p1.adjustments[0].totalCost).toBe(20);
    expect(p1.adjustments[0].directCost).toBe(20);
    expect(p1.boqTotal).toBe(100);
    expect(p1.allocationTotal).toBe(100);
    expect(Number(p1.schedule!.scheduledAmount)).toBe(100);
    expect(Number(p1.schedule!.awardedContractAmount)).toBe(100);
    expect(Number(p1.schedule!.differenceAmount)).toBe(0);
    expect(p1.metrics.FINANCIAL).toBe('BALANCED');
    expect(p1.metrics.boqReconciliation.policy).toBe('SHORTFALL_ADJUSTMENT');
    expect(p1.metrics.boqReconciliation.adjustmentAmount).toBe('20');
    expectLineLevelConsistency(p1);

    // Repeated reconciliation
    const r2: any = await runAIOrchestrator({ projectId: project.id, generationRequestId: `${TAG}-2` });
    expect(r2.success).toBe(true);
    const p2 = await loadPersisted(project.id, r2.scheduleId);
    console.log('[CODEX013][BOQ80] run2', JSON.stringify({ adjustments: p2.adjustments.map(a => a.totalCost), boqTotal: p2.boqTotal, allocationTotal: p2.allocationTotal, policy: p2.metrics.boqReconciliation.policy }));
    expect(p2.adjustments).toHaveLength(1);
    expect(p2.adjustments[0].id).toBe(p1.adjustments[0].id);
    expect(p2.adjustments[0].totalCost).toBe(20);
    expect(p2.allocationTotal).toBe(100);
    expect(p2.metrics.boqReconciliation.policy).toBe('BALANCED');
    expectLineLevelConsistency(p2);
  });

  it('BOQ 100 / Contract 100: no adjustment item', async () => {
    const project = await createSyntheticProject({
      suffix: 'BOQ100-C100', contractAmount: 100, contractDuration: 30, boq: [{ code: 'B-001', total: 60 }, { code: 'B-002', total: 40 }],
    });
    const r: any = await runAIOrchestrator({ projectId: project.id, generationRequestId: `${TAG}-3` });
    const p = await loadPersisted(project.id, r.scheduleId);
    console.log('[CODEX013][BOQ100] ', JSON.stringify({ adjustments: p.adjustments.length, boqTotal: p.boqTotal, allocationTotal: p.allocationTotal, policy: p.metrics.boqReconciliation.policy }));
    expect(p.adjustments).toHaveLength(0);
    expect(p.allocationTotal).toBe(100);
    expect(p.metrics.boqReconciliation.policy).toBe('BALANCED');
    expect(p.metrics.FINANCIAL).toBe('BALANCED');
    expectLineLevelConsistency(p);
  });

  it('BOQ 120 / Contract 100: documented policy — no reduction item, schedule allocates actual BOQ total', async () => {
    const project = await createSyntheticProject({
      suffix: 'BOQ120-C100', contractAmount: 100, contractDuration: 30, boq: [{ code: 'C-001', total: 70 }, { code: 'C-002', total: 50 }],
    });
    const r: any = await runAIOrchestrator({ projectId: project.id, generationRequestId: `${TAG}-4` });
    const p = await loadPersisted(project.id, r.scheduleId);
    console.log('[CODEX013][BOQ120]', JSON.stringify({ adjustments: p.adjustments.length, boqTotal: p.boqTotal, allocationTotal: p.allocationTotal, recon: p.metrics.boqReconciliation }));
    expect(p.adjustments).toHaveLength(0);
    expect(p.allocationTotal).toBe(120);
    expect(Number(p.schedule!.scheduledAmount)).toBe(120);
    expect(p.metrics.boqReconciliation.policy).toBe('BOQ_EXCEEDS_CONTRACT');
    expect(p.metrics.boqReconciliation.shortfall).toBe('-20');
    expectLineLevelConsistency(p);
  });

  it('Legacy zero-value GEN-REQ-001 is reused and corrected (no duplicate adjustment)', async () => {
    const project = await createSyntheticProject({
      suffix: 'LEGACY-ZERO', contractAmount: 100, contractDuration: 30, boq: [{ code: 'D-001', total: 50 }, { code: 'D-002', total: 30 }],
      legacyZeroAdjustment: true,
    });
    const r: any = await runAIOrchestrator({ projectId: project.id, generationRequestId: `${TAG}-5` });
    const p = await loadPersisted(project.id, r.scheduleId);
    console.log('[CODEX013][LEGACY]', JSON.stringify({ adjustments: p.adjustments.map(a => a.totalCost), allocationTotal: p.allocationTotal }));
    expect(p.adjustments).toHaveLength(1);
    expect(p.adjustments[0].totalCost).toBe(20);
    expect(p.allocationTotal).toBe(100);
    expectLineLevelConsistency(p);
  });
});

describe('Defect 2 — infeasible schedule dates persistence', () => {
  it('Within contract (30 days, CPM 15): WITHIN_CONTRACT / READY_FOR_REVIEW and 10-day activity dates agree', async () => {
    const project = await createSyntheticProject({
      suffix: 'FEASIBLE', contractAmount: 100, contractDuration: 30, boq: [{ code: 'E-001', total: 60 }, { code: 'E-002', total: 40 }],
    });
    const r: any = await runAIOrchestrator({ projectId: project.id, generationRequestId: `${TAG}-6` });
    const p = await loadPersisted(project.id, r.scheduleId);
    const a = p.activities.find(x => x.name === 'Activity A (10d)')!;
    const b = p.activities.find(x => x.name === 'Activity B (5d)')!;
    console.log('[CODEX013][FEASIBLE]', JSON.stringify({ DATES: p.metrics.DATES, OVERALL: p.metrics.OVERALL, status: p.schedule!.status, A: [a.plannedStartDate, a.plannedFinishDate, a.plannedDuration, a.criticalPath], B: [b.plannedStartDate, b.plannedFinishDate, b.plannedDuration, b.criticalPath] }));
    expect(p.metrics.DATES).toBe('WITHIN_CONTRACT');
    expect(p.metrics.OVERALL).toBe('READY_FOR_REVIEW');
    expect(p.schedule!.status).toBe('DRAFT');
    expect(a.plannedDuration).toBe(10);
    expect(inclusiveDaySpan(a.plannedStartDate!, a.plannedFinishDate!)).toBe(10);
    expect(a.plannedStartDate!.toISOString()).toBe('2026-01-05T00:00:00.000Z');
    expect(a.plannedFinishDate!.toISOString()).toBe('2026-01-14T00:00:00.000Z');
    expect(b.plannedStartDate!.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    expect(a.criticalPath).toBe(true);
    expect(b.criticalPath).toBe(true);
    expect(p.deps.some(d => d.predecessorId === a.id && d.successorId === b.id && d.type === 'FS')).toBe(true);
  });

  it('Exceeds contract (12 days, CPM 15): EXCEEDS_CONTRACT / INFEASIBLE, dates preserved (not clipped)', async () => {
    const project = await createSyntheticProject({
      suffix: 'INFEASIBLE', contractAmount: 100, contractDuration: 12, boq: [{ code: 'F-001', total: 60 }, { code: 'F-002', total: 40 }],
    });
    const r: any = await runAIOrchestrator({ projectId: project.id, generationRequestId: `${TAG}-7` });
    expect(r.success).toBe(true);
    expect(r.warningCode).toBe('SCHEDULE_INFEASIBLE_REQUIRES_REVIEW');
    const p = await loadPersisted(project.id, r.scheduleId);
    const a = p.activities.find(x => x.name === 'Activity A (10d)')!;
    const b = p.activities.find(x => x.name === 'Activity B (5d)')!;
    console.log('[CODEX013][INFEASIBLE]', JSON.stringify({ DATES: p.metrics.DATES, OVERALL: p.metrics.OVERALL, feasibilityStatus: p.metrics.feasibilityStatus, calc: p.metrics.calculatedDurationDays, contract: p.metrics.contractDurationDays, overrun: p.metrics.contractOverrunDays, finalCompletion: p.metrics.finalCalculatedCompletionDate, flags: p.flags.map((f: any) => f.action), B: [b.plannedStartDate, b.plannedFinishDate, b.plannedDuration] }));
    expect(p.metrics.DATES).toBe('EXCEEDS_CONTRACT');
    expect(p.metrics.DATES).not.toBe('WITHIN_CONTRACT');
    expect(p.metrics.OVERALL).toBe('INFEASIBLE');
    expect(p.metrics.OVERALL).not.toBe('READY_FOR_REVIEW');
    expect(p.metrics.feasibilityStatus).toBe('SCHEDULE_INFEASIBLE_EXCEEDS_CONTRACT');
    expect(p.metrics.calculatedDurationDays).toBe(15);
    expect(p.metrics.contractOverrunDays).toBe(3);
    expect(p.metrics.finalCalculatedCompletionDate).toBe('2026-01-20T00:00:00.000Z');
    expect(p.flags.map((f: any) => f.action)).toContain('CONTRACT_DURATION_EXCEEDED');
    expect(p.flags.map((f: any) => f.action)).not.toContain('BOUNDARY_CLAMP');
    expect(a.plannedDuration).toBe(10);
    expect(b.plannedDuration).toBe(5);
    expect(b.plannedStartDate!.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    expect(b.plannedFinishDate!.toISOString()).toBe('2026-01-19T00:00:00.000Z');
    expect(inclusiveDaySpan(b.plannedStartDate!, b.plannedFinishDate!)).toBe(b.plannedDuration);
    expect(b.criticalPath).toBe(true);
  });
});

