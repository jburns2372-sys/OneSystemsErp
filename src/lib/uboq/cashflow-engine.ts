export interface CashFlowInputBucket {
  readonly periodIndex: number; // e.g., 1..12 for 12 half-month periods (6 months)
  readonly periodLabel: string; // e.g., "M1-H1", "M1-H2"
  readonly quarterLabel: string; // e.g., "Q1", "Q2"
  readonly periodStart: Date;
  readonly periodEnd: Date;
  /** Stream 1: Planned S-curve / PERT earned-value weight allocation (NOT actual cash!) */
  readonly plannedValueWeightAmt: number;
  /** Stream 2: Expected client progress billing claim */
  readonly expectedBillingsAmt?: number;
  /** Stream 3: Forecast net cash collections after certification lag, retention & withholding */
  readonly forecastReceiptsAmt?: number;
  /** Stream 4: Supplier PO disbursements per payment terms */
  readonly procurementCashOutAmt?: number;
  /** Stream 5: Payroll & subcontract disbursements */
  readonly payrollSubconCashOutAmt?: number;
  /** Stream 6: Overhead, equipment & tax remittances */
  readonly otherCashOutAmt?: number;
  readonly actualCashReceiptsAmt?: number;
  readonly actualCashPaidAmt?: number;
}

export interface ComputedCashFlowPeriod extends Required<CashFlowInputBucket> {
  readonly closingCashAmt: number;
  readonly liquidityGapAmt: number;
  readonly roundingAdjustmentAmt: number;
}

export interface QuarterlyCashFlowRollup {
  readonly quarterLabel: string;
  readonly periodStart: Date;
  readonly periodEnd: Date;
  readonly plannedValueWeightAmt: number;
  readonly expectedBillingsAmt: number;
  readonly forecastReceiptsAmt: number;
  readonly procurementCashOutAmt: number;
  readonly payrollSubconCashOutAmt: number;
  readonly otherCashOutAmt: number;
  readonly actualCashReceiptsAmt: number;
  readonly actualCashPaidAmt: number;
  readonly quarterlyClosingCash: number;
  readonly quarterlyLiquidityGap: number;
  readonly roundingAdjustmentAmt: number;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Preserves native half-month schedule periods (e.g. 12 half-months -> Q1 [P1..P6] & Q2 [P7..P12]),
 * keeps planned bid-value allocation distinct from actual/forecast cash streams, and surfaces explicit
 * rounding adjustments (e.g. 0.02) without silent plug mutation (CF-01..03, VAL-21..22).
 */
export function buildMultiStreamCashFlowSchedule(params: {
  targetTotalContractAmount: number;
  openingCashAmt?: number;
  buckets: CashFlowInputBucket[];
}): {
  periods: ComputedCashFlowPeriod[];
  quarters: QuarterlyCashFlowRollup[];
  totalPlannedAllocation: number;
  explicitRoundingDelta: number;
} {
  const sorted = [...params.buckets].sort((a, b) => a.periodIndex - b.periodIndex);
  let runningCash = round2(params.openingCashAmt ?? 0);

  const rawPlannedSum = round2(sorted.reduce((s, b) => s + round2(b.plannedValueWeightAmt), 0));
  const explicitRoundingDelta = round2(params.targetTotalContractAmount - rawPlannedSum);

  const periods: ComputedCashFlowPeriod[] = sorted.map((b, idx) => {
    const pv = round2(b.plannedValueWeightAmt);
    const expBill = round2(b.expectedBillingsAmt ?? 0);
    const fcstRec = round2(b.forecastReceiptsAmt ?? 0);
    const procOut = round2(b.procurementCashOutAmt ?? 0);
    const paySubOut = round2(b.payrollSubconCashOutAmt ?? 0);
    const othOut = round2(b.otherCashOutAmt ?? 0);
    const actRec = round2(b.actualCashReceiptsAmt ?? 0);
    const actPaid = round2(b.actualCashPaidAmt ?? 0);

    const netForecastFlow = round2(fcstRec - (procOut + paySubOut + othOut));
    runningCash = round2(runningCash + netForecastFlow);
    const liquidityGapAmt = runningCash < 0 ? round2(Math.abs(runningCash)) : 0;

    // Record explicit rounding variance transparently on final period without mutating pv!
    const roundingAdjustmentAmt = idx === sorted.length - 1 ? explicitRoundingDelta : 0;

    return {
      periodIndex: b.periodIndex,
      periodLabel: b.periodLabel,
      quarterLabel: b.quarterLabel,
      periodStart: b.periodStart,
      periodEnd: b.periodEnd,
      plannedValueWeightAmt: pv,
      expectedBillingsAmt: expBill,
      forecastReceiptsAmt: fcstRec,
      procurementCashOutAmt: procOut,
      payrollSubconCashOutAmt: paySubOut,
      otherCashOutAmt: othOut,
      actualCashReceiptsAmt: actRec,
      actualCashPaidAmt: actPaid,
      closingCashAmt: runningCash,
      liquidityGapAmt,
      roundingAdjustmentAmt,
    };
  });

  const quarterOrder: string[] = [];
  const quarterMap = new Map<string, ComputedCashFlowPeriod[]>();
  for (const p of periods) {
    if (!quarterMap.has(p.quarterLabel)) {
      quarterOrder.push(p.quarterLabel);
      quarterMap.set(p.quarterLabel, []);
    }
    quarterMap.get(p.quarterLabel)!.push(p);
  }

  const quarters: QuarterlyCashFlowRollup[] = quarterOrder.map((qLabel) => {
    const qPeriods = quarterMap.get(qLabel)!;
    const lastPeriod = qPeriods[qPeriods.length - 1];
    const maxGap = Math.max(...qPeriods.map((p) => p.liquidityGapAmt), 0);
    return {
      quarterLabel: qLabel,
      periodStart: qPeriods[0].periodStart,
      periodEnd: lastPeriod.periodEnd,
      plannedValueWeightAmt: round2(qPeriods.reduce((s, p) => s + p.plannedValueWeightAmt, 0)),
      expectedBillingsAmt: round2(qPeriods.reduce((s, p) => s + p.expectedBillingsAmt, 0)),
      forecastReceiptsAmt: round2(qPeriods.reduce((s, p) => s + p.forecastReceiptsAmt, 0)),
      procurementCashOutAmt: round2(qPeriods.reduce((s, p) => s + p.procurementCashOutAmt, 0)),
      payrollSubconCashOutAmt: round2(qPeriods.reduce((s, p) => s + p.payrollSubconCashOutAmt, 0)),
      otherCashOutAmt: round2(qPeriods.reduce((s, p) => s + p.otherCashOutAmt, 0)),
      actualCashReceiptsAmt: round2(qPeriods.reduce((s, p) => s + p.actualCashReceiptsAmt, 0)),
      actualCashPaidAmt: round2(qPeriods.reduce((s, p) => s + p.actualCashPaidAmt, 0)),
      // Closing cash is NO_SUM (uses quarter-end closing cash per Blueprint row 122!)
      quarterlyClosingCash: lastPeriod.closingCashAmt,
      quarterlyLiquidityGap: round2(maxGap),
      roundingAdjustmentAmt: round2(qPeriods.reduce((s, p) => s + p.roundingAdjustmentAmt, 0)),
    };
  });

  return {
    periods,
    quarters,
    totalPlannedAllocation: rawPlannedSum,
    explicitRoundingDelta,
  };
}

