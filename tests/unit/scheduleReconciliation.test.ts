import { Prisma } from '@prisma/client';
import { calculateCPM, CPMActivity, CPMDependency } from '@/lib/cpm-engine';
import {
  assessContractFeasibility,
  computeActivityDates,
  inclusiveDaySpan,
  reconcileBoqToContract,
} from '@/lib/scheduling/scheduleReconciliation';

/**
 * ONESYSTEMSERP-CODEX-011-REMEDIATION-013
 * Pure-logic regression tests for Codex findings 2 (infeasible dates) and 3 (BOQ reconciliation).
 */

const D = (v: Prisma.Decimal.Value) => new Prisma.Decimal(v);

describe('Defect 3 — BOQ to contract reconciliation (reconcileBoqToContract)', () => {
  it('BOQ 80 / Contract 100 → single adjustment of 20, reconciled total 100', () => {
    const r = reconcileBoqToContract(80, 100);
    expect(r.policy).toBe('SHORTFALL_ADJUSTMENT');
    expect(r.shortfall.toString()).toBe('20');
    expect(r.adjustmentAmount.toString()).toBe('20');
    expect(r.adjustmentLineTotal.toString()).toBe('20');
    expect(r.reconciledBoqTotal.toString()).toBe('100');
    expect(r.adjustmentAmount.isZero()).toBe(false);
  });

  it('BOQ 100 / Contract 100 → no adjustment', () => {
    const r = reconcileBoqToContract(100, 100);
    expect(r.policy).toBe('BALANCED');
    expect(r.adjustmentAmount.isZero()).toBe(true);
    expect(r.reconciledBoqTotal.toString()).toBe('100');
  });

  it('BOQ 120 / Contract 100 → documented policy: no negative/reduction item, BOQ total retained', () => {
    const r = reconcileBoqToContract(120, 100);
    expect(r.policy).toBe('BOQ_EXCEEDS_CONTRACT');
    expect(r.shortfall.toString()).toBe('-20');
    expect(r.adjustmentAmount.isZero()).toBe(true);
    expect(r.reconciledBoqTotal.toString()).toBe('120');
  });

  it('Repeated reconciliation after a persisted adjustment (BOQ now 100) → no further adjustment', () => {
    const r = reconcileBoqToContract(100, 100, { id: 'existing', totalCost: 20 });
    expect(r.policy).toBe('BALANCED');
    expect(r.adjustmentAmount.isZero()).toBe(true);
    expect(r.adjustmentLineTotal.toString()).toBe('20');
    expect(r.existingAdjustmentItemId).toBe('existing');
  });

  it('Legacy zero-value adjustment line is reused (no duplicate) and becomes non-zero', () => {
    const r = reconcileBoqToContract(80, 100, { id: 'legacy-zero', totalCost: 0 });
    expect(r.policy).toBe('SHORTFALL_ADJUSTMENT');
    expect(r.existingAdjustmentItemId).toBe('legacy-zero');
    expect(r.adjustmentLineTotal.toString()).toBe('20');
  });

  it('Representative monetary values use 2-dp precision without float drift', () => {
    // BOQ 1,234,567.89 + 0.1 + 0.2 ; Contract 1,500,000.00
    const boq = D('1234567.89').plus('0.1').plus('0.2');
    const r = reconcileBoqToContract(boq, '1500000.00');
    expect(r.adjustmentAmount.toFixed(2)).toBe('265431.81');
    expect(r.reconciledBoqTotal.toFixed(2)).toBe('1500000.00');
  });

  it('Shortfall within 1.00 tolerance → no adjustment item (no zero/near-zero entries)', () => {
    const r = reconcileBoqToContract('99.50', '100.00');
    expect(r.policy).toBe('WITHIN_TOLERANCE');
    expect(r.adjustmentAmount.isZero()).toBe(true);
  });

  it('No contract amount → no adjustment', () => {
    expect(reconcileBoqToContract(80, 0).policy).toBe('NO_CONTRACT_AMOUNT');
  });
});

describe('Defect 2 — schedule dates are not clipped to the contract boundary', () => {
  const start = new Date('2026-01-05T00:00:00.000Z');

  it('10-day activity: stored duration and inclusive date span agree', () => {
    const r = computeActivityDates(start, 0, 10);
    expect(r.plannedDuration).toBe(10);
    expect(r.plannedStartDate.toISOString()).toBe('2026-01-05T00:00:00.000Z');
    expect(r.plannedFinishDate.toISOString()).toBe('2026-01-14T00:00:00.000Z');
    expect(inclusiveDaySpan(r.plannedStartDate, r.plannedFinishDate)).toBe(10);
  });

  it('Milestone (0 days) finishes on its start date (never before it)', () => {
    const r = computeActivityDates(start, 15, 15);
    expect(r.plannedDuration).toBe(0);
    expect(r.plannedFinishDate.getTime()).toBe(r.plannedStartDate.getTime());
  });

  it('Activity beyond the contract duration keeps its calculated dates', () => {
    // Contract = 12 days; activity ES=10, EF=15 must NOT be clipped to day 12
    const r = computeActivityDates(start, 10, 15);
    expect(r.plannedDuration).toBe(5);
    expect(r.plannedStartDate.toISOString()).toBe('2026-01-15T00:00:00.000Z');
    expect(r.plannedFinishDate.toISOString()).toBe('2026-01-19T00:00:00.000Z');
  });

  it('assessContractFeasibility: within vs exceeds contract', () => {
    expect(assessContractFeasibility(15, 30)).toEqual({
      exceedsContract: false, datesStatus: 'WITHIN_CONTRACT', feasibilityStatus: 'SCHEDULE_FEASIBLE', overrunDays: 0,
    });
    expect(assessContractFeasibility(30, 30).exceedsContract).toBe(false);
    expect(assessContractFeasibility(15, 12)).toEqual({
      exceedsContract: true, datesStatus: 'EXCEEDS_CONTRACT', feasibilityStatus: 'SCHEDULE_INFEASIBLE_EXCEEDS_CONTRACT', overrunDays: 3,
    });
  });

  it('CPM dependencies, float, and critical path remain accurate and recalculation is consistent', () => {
    const acts: CPMActivity[] = [
      { id: 'A', name: 'A', duration: 10 },
      { id: 'B', name: 'B', duration: 5 },
      { id: 'C', name: 'C', duration: 2 },
    ];
    const deps: CPMDependency[] = [
      { id: 'd1', predecessorId: 'A', successorId: 'B', type: 'FS', lagDays: 0 },
      { id: 'd2', predecessorId: 'A', successorId: 'C', type: 'FS', lagDays: 0 },
    ];
    const r1 = calculateCPM(acts, deps);
    const r2 = calculateCPM(acts, deps);
    expect(r1.projectDuration).toBe(15);
    expect(r1.results.get('A')!.isCritical).toBe(true);
    expect(r1.results.get('B')!.isCritical).toBe(true);
    expect(r1.results.get('C')!.isCritical).toBe(false);
    expect(r1.results.get('C')!.totalFloat).toBe(3);
    expect(r1.results.get('B')!.earlyStart).toBe(10);
    expect(JSON.stringify([...r1.results.entries()])).toBe(JSON.stringify([...r2.results.entries()]));

    // Dates derived from CPM keep the FS dependency: B starts the day after A finishes.
    const start = new Date('2026-01-05T00:00:00.000Z');
    const a = computeActivityDates(start, r1.results.get('A')!.earlyStart, r1.results.get('A')!.earlyFinish);
    const b = computeActivityDates(start, r1.results.get('B')!.earlyStart, r1.results.get('B')!.earlyFinish);
    expect(b.plannedStartDate.getTime() - a.plannedFinishDate.getTime()).toBe(24 * 60 * 60 * 1000);
    // Durations are never mutated to fit a contract boundary
    expect(acts.map(x => x.duration)).toEqual([10, 5, 2]);
  });
});

