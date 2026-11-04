import { Prisma } from '@prisma/client';

/**
 * Pure helpers used by the AI scheduling orchestrator for date assignment,
 * contract-feasibility classification, and BOQ-to-contract reconciliation.
 *
 * They are intentionally side-effect free so the exact persisted values can be
 * verified independently of the AI provider and database transaction.
 */

export const BOQ_ADJUSTMENT_ITEM_CODE = 'GEN-REQ-001';
export const BOQ_ADJUSTMENT_DESCRIPTION = 'General Requirements, Overhead, Profit, and Contingency';
export const BOQ_ADJUSTMENT_PLACEHOLDER_ID = 'dummy-overhead-contingency';

/** Shortfalls at or below this amount (PHP) are treated as rounding noise. */
export const BOQ_ADJUSTMENT_TOLERANCE = new Prisma.Decimal('1.00');

/** Monetary precision used for persisted BOQ amounts. */
export const MONEY_DECIMAL_PLACES = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ActivityDateAssignment {
  plannedStartDate: Date;
  plannedFinishDate: Date;
  plannedDuration: number;
}

/**
 * Convert CPM day offsets into calendar dates without clipping to any contract boundary.
 *
 * Convention (continuous calendar, inclusive finish day):
 *   start  = projectStart + earlyStart
 *   finish = projectStart + earlyFinish - 1   (duration > 0)
 *   finish = start                            (milestone, duration = 0)
 * so a 10-day activity with ES=0/EF=10 starts on day 0, finishes on day 9, and
 * stores plannedDuration = 10.
 */
export function computeActivityDates(
  projectStartDate: Date,
  earlyStart: number,
  earlyFinish: number
): ActivityDateAssignment {
  const plannedDuration = Math.max(0, earlyFinish - earlyStart);

  const plannedStartDate = new Date(projectStartDate);
  plannedStartDate.setDate(plannedStartDate.getDate() + earlyStart);

  const plannedFinishDate = new Date(projectStartDate);
  const finishOffset = plannedDuration > 0 ? earlyFinish - 1 : earlyStart;
  plannedFinishDate.setDate(plannedFinishDate.getDate() + finishOffset);

  return { plannedStartDate, plannedFinishDate, plannedDuration };
}

/** Inclusive calendar-day span between two planned dates (used for verification). */
export function inclusiveDaySpan(start: Date, finish: Date): number {
  return Math.round((finish.getTime() - start.getTime()) / DAY_MS) + 1;
}

export type ContractDateStatus = 'WITHIN_CONTRACT' | 'EXCEEDS_CONTRACT';

export interface ContractFeasibility {
  exceedsContract: boolean;
  datesStatus: ContractDateStatus;
  feasibilityStatus: 'SCHEDULE_FEASIBLE' | 'SCHEDULE_INFEASIBLE_EXCEEDS_CONTRACT';
  overrunDays: number;
}

/** Classify the mathematically calculated CPM duration against the contract duration. */
export function assessContractFeasibility(projectDuration: number, contractDuration: number): ContractFeasibility {
  const overrunDays = Math.max(0, projectDuration - contractDuration);
  const exceedsContract = overrunDays > 0;
  return {
    exceedsContract,
    datesStatus: exceedsContract ? 'EXCEEDS_CONTRACT' : 'WITHIN_CONTRACT',
    feasibilityStatus: exceedsContract ? 'SCHEDULE_INFEASIBLE_EXCEEDS_CONTRACT' : 'SCHEDULE_FEASIBLE',
    overrunDays,
  };
}

export type BoqReconciliationPolicy =
  | 'NO_CONTRACT_AMOUNT'
  | 'BALANCED'
  | 'WITHIN_TOLERANCE'
  | 'SHORTFALL_ADJUSTMENT'
  | 'BOQ_EXCEEDS_CONTRACT';

export interface BoqContractReconciliation {
  policy: BoqReconciliationPolicy;
  /** Sum of priced BOQ lines BEFORE any adjustment (includes an existing adjustment line). */
  originalBoqTotal: Prisma.Decimal;
  contractAmount: Prisma.Decimal;
  /** contract - originalBoqTotal, rounded to money precision (may be negative). */
  shortfall: Prisma.Decimal;
  /** Amount added to the BOQ by this reconciliation (0 when no adjustment). */
  adjustmentAmount: Prisma.Decimal;
  /** Final persisted total of the single adjustment line (existing + adjustment). */
  adjustmentLineTotal: Prisma.Decimal;
  /** Existing persisted adjustment line reused instead of creating a duplicate. */
  existingAdjustmentItemId: string | null;
  /** BOQ total after reconciliation (what the schedule must allocate). */
  reconciledBoqTotal: Prisma.Decimal;
}

/**
 * Reconcile the BOQ total against the awarded contract amount.
 *
 * Documented policy:
 *  - contract <= 0                    → NO_CONTRACT_AMOUNT, no adjustment.
 *  - shortfall == 0                   → BALANCED, no adjustment.
 *  - 0 < shortfall <= tolerance (1.00)→ WITHIN_TOLERANCE, no adjustment.
 *  - shortfall > tolerance            → SHORTFALL_ADJUSTMENT: exactly one adjustment line
 *                                       (GEN-REQ-001). An existing adjustment line is
 *                                       increased instead of creating a duplicate.
 *  - BOQ > contract                   → BOQ_EXCEEDS_CONTRACT: no negative/auto-reduction
 *                                       item is created; the schedule allocates the
 *                                       actual BOQ total and the variance is reported.
 *
 * The shortfall is computed from the ORIGINAL totals before any mutation.
 */
export function reconcileBoqToContract(
  originalBoqTotal: Prisma.Decimal.Value,
  contractAmount: Prisma.Decimal.Value,
  existingAdjustment?: { id: string; totalCost: Prisma.Decimal.Value } | null
): BoqContractReconciliation {
  const boqTotal = new Prisma.Decimal(originalBoqTotal).toDecimalPlaces(MONEY_DECIMAL_PLACES);
  const contract = new Prisma.Decimal(contractAmount).toDecimalPlaces(MONEY_DECIMAL_PLACES);
  const zero = new Prisma.Decimal(0);
  const shortfall = contract.minus(boqTotal).toDecimalPlaces(MONEY_DECIMAL_PLACES);
  const existingTotal = existingAdjustment
    ? new Prisma.Decimal(existingAdjustment.totalCost).toDecimalPlaces(MONEY_DECIMAL_PLACES)
    : zero;

  const base = {
    originalBoqTotal: boqTotal,
    contractAmount: contract,
    shortfall,
    existingAdjustmentItemId: existingAdjustment?.id ?? null,
  };

  const noAdjustment = (policy: BoqReconciliationPolicy): BoqContractReconciliation => ({
    ...base,
    policy,
    adjustmentAmount: zero,
    adjustmentLineTotal: existingTotal,
    reconciledBoqTotal: boqTotal,
  });

  if (!contract.gt(0)) return noAdjustment('NO_CONTRACT_AMOUNT');
  if (shortfall.isZero()) return noAdjustment('BALANCED');
  if (shortfall.lt(0)) return noAdjustment('BOQ_EXCEEDS_CONTRACT');
  if (!shortfall.gt(BOQ_ADJUSTMENT_TOLERANCE)) return noAdjustment('WITHIN_TOLERANCE');

  return {
    ...base,
    policy: 'SHORTFALL_ADJUSTMENT',
    adjustmentAmount: shortfall,
    adjustmentLineTotal: existingTotal.plus(shortfall).toDecimalPlaces(MONEY_DECIMAL_PLACES),
    reconciledBoqTotal: boqTotal.plus(shortfall).toDecimalPlaces(MONEY_DECIMAL_PLACES),
  };
}

