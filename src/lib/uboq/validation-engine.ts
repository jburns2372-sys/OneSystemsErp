import crypto from 'node:crypto';
import { calculateCPM, type CPMActivity, type CPMDependency } from '../cpm-engine';
import { canConvertUom, convertUomQuantity, normalizeUom } from './uom-registry';

export interface ValidationIssue {
  readonly ruleCode: string;
  readonly severity: 'BLOCKING' | 'WARNING';
  readonly entityType: string;
  readonly entityId?: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

export interface PhaseBoqInputLine {
  readonly lineKey: string;
  readonly itemCode: string;
  readonly phaseCode: string;
  readonly sectionCode?: string | null;
  readonly workDescription: string;
  readonly specification?: string | null;
  readonly unitRaw: string;
  readonly pricingType?: 'UNIT_PRICE' | 'LUMP_SUM' | 'MILESTONE';
  readonly originalQty: number;
  readonly approvedQty: number;
  readonly contractUnitRate: number;
  readonly contractLineAmount?: number;
  readonly estimatedDirectCost?: number | null;
  readonly agencyAbc?: number | null;
  readonly sourceSheetName?: string | null;
  readonly sourceCellRef?: string | null;
  readonly extractionCandidateId?: string | null;
}

export interface ConsolidatedGroupPreview {
  readonly groupKey: string;
  readonly canonicalDescription: string;
  readonly specification: string;
  readonly specSignatureHash: string;
  readonly unitNormalized: string;
  readonly uomDimensionFamily: string;
  readonly totalApprovedQty: number;
  readonly totalContractAmount: number;
  readonly weightedUnitRate: number;
  readonly memberLinks: Array<{
    lineKey: string;
    phaseCode: string;
    itemCode: string;
    allocatedQtyInGroupUom: number;
    allocationWeightPct: number;
  }>;
}

export function computeSpecSignatureHash(description: string, specification?: string | null): string {
  const normDesc = (description || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  const normSpec = (specification || 'standard')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
  return crypto.createHash('sha256').update(`${normDesc}||${normSpec}`).digest('hex').slice(0, 32);
}

/**
 * Consolidates multi-phase BOQ lines ONLY when specSignatureHash matches AND UOMs are convertible (BOQ-01..03, VAL-03..05).
 * Preserves every original phase/pay-item line untouched for accomplishment & billing!
 */
export function buildSafePhaseConsolidation(lines: PhaseBoqInputLine[]): {
  groups: ConsolidatedGroupPreview[];
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  const buckets = new Map<
    string,
    {
      canonicalDescription: string;
      specification: string;
      specSignatureHash: string;
      baseUom: string;
      family: string;
      members: Array<{ line: PhaseBoqInputLine; qtyInGroupUom: number; lineAmt: number }>;
    }
  >();

  for (const ln of lines) {
    if (!ln.workDescription || !ln.unitRaw) {
      issues.push({
        ruleCode: 'VAL-02',
        severity: 'BLOCKING',
        entityType: 'PHASE_LINE',
        entityId: ln.lineKey,
        message: `Missing mandatory description or unit on phase line ${ln.itemCode}; silent defaults prohibited`,
      });
      continue;
    }
    if (!Number.isFinite(ln.approvedQty) || ln.approvedQty < 0 || !Number.isFinite(ln.contractUnitRate) || ln.contractUnitRate < 0) {
      issues.push({
        ruleCode: 'VAL-02',
        severity: 'BLOCKING',
        entityType: 'PHASE_LINE',
        entityId: ln.lineKey,
        message: `Invalid negative or missing quantity/rate on phase line ${ln.itemCode}`,
      });
      continue;
    }

    let uomDef;
    try {
      uomDef = normalizeUom(ln.unitRaw, ln.specification);
    } catch (err) {
      issues.push({
        ruleCode: 'VAL-03',
        severity: 'BLOCKING',
        entityType: 'PHASE_LINE',
        entityId: ln.lineKey,
        message: (err as Error).message,
      });
      continue;
    }

    const expectedAmt = Math.round((ln.approvedQty * ln.contractUnitRate + Number.EPSILON) * 100) / 100;
    const lineAmt = ln.contractLineAmount !== undefined ? ln.contractLineAmount : expectedAmt;
    if (Math.abs(lineAmt - expectedAmt) > 0.05 && ln.pricingType !== 'LUMP_SUM') {
      issues.push({
        ruleCode: 'VAL-05',
        severity: 'WARNING',
        entityType: 'PHASE_LINE',
        entityId: ln.lineKey,
        message: `Arithmetic variance on ${ln.itemCode}: stated amount (${lineAmt}) != qty * rate (${expectedAmt})`,
        details: { stated: lineAmt, computed: expectedAmt },
      });
    }

    const specSig = computeSpecSignatureHash(ln.workDescription, ln.specification);
    // Group key partitions by specSignatureHash + dimensionFamily + packCode (LUMP_SCOPE lines stay unmerged per phase if distinct)
    const mergeKey =
      uomDef.dimensionFamily === 'LUMP_SCOPE'
        ? `${specSig}::LUMP::${ln.phaseCode}::${ln.itemCode}`
        : `${specSig}::${uomDef.dimensionFamily}::${uomDef.packCode ?? 'CONV'}`;

    const existing = buckets.get(mergeKey);
    if (!existing) {
      buckets.set(mergeKey, {
        canonicalDescription: ln.workDescription.trim(),
        specification: (ln.specification || '').trim(),
        specSignatureHash: specSig,
        baseUom: uomDef.normalizedCode,
        family: uomDef.dimensionFamily,
        members: [{ line: ln, qtyInGroupUom: ln.approvedQty, lineAmt }],
      });
    } else {
      if (!canConvertUom(uomDef.normalizedCode, existing.baseUom)) {
        issues.push({
          ruleCode: 'VAL-04',
          severity: 'BLOCKING',
          entityType: 'PHASE_LINE',
          entityId: ln.lineKey,
          message: `Incompatible UOM consolidation blocked between ${uomDef.normalizedCode} and ${existing.baseUom}`,
        });
        continue;
      }
      const convertedQty = convertUomQuantity(ln.approvedQty, uomDef.normalizedCode, existing.baseUom);
      existing.members.push({ line: ln, qtyInGroupUom: convertedQty, lineAmt });
    }
  }

  const groups: ConsolidatedGroupPreview[] = [];
  let gIdx = 0;
  for (const [, b] of buckets.entries()) {
    gIdx++;
    const totalQty = Number(b.members.reduce((s, m) => s + m.qtyInGroupUom, 0).toFixed(4));
    const totalAmt = Number(b.members.reduce((s, m) => s + m.lineAmt, 0).toFixed(2));
    const weightedRate = totalQty > 0 ? Number((totalAmt / totalQty).toFixed(4)) : 0;

    groups.push({
      groupKey: `CGRP-${String(gIdx).padStart(3, '0')}`,
      canonicalDescription: b.canonicalDescription,
      specification: b.specification,
      specSignatureHash: b.specSignatureHash,
      unitNormalized: b.baseUom,
      uomDimensionFamily: b.family,
      totalApprovedQty: totalQty,
      totalContractAmount: totalAmt,
      weightedUnitRate: weightedRate,
      memberLinks: b.members.map((m) => ({
        lineKey: m.line.lineKey,
        phaseCode: m.line.phaseCode,
        itemCode: m.line.itemCode,
        allocatedQtyInGroupUom: m.qtyInGroupUom,
        allocationWeightPct: totalQty > 0 ? Number(((m.qtyInGroupUom / totalQty) * 100).toFixed(6)) : 0,
      })),
    });
  }

  return { groups, issues };
}

/**
 * Enforces mutual exclusion between Detailed DUPA takeoff and Verified Summary-Only takeoff (RES-01..04, VAL-06..08).
 * Never adds DUPA + Summary together, and never multiplies a pre-consolidated summary quantity by work quantity again!
 */
export function evaluateResourceTakeoffRequirement(params: {
  resourceCode: string;
  takeoffBasis: 'CONTRACTOR_DETAILED_DUPA' | 'SUMMARY_ONLY_VERIFIED';
  resourceCoeff?: number | null;
  workQuantityBasis?: number | null;
  summaryVerifiedQty?: number | null;
  alsoSubmittedSummarySheetQty?: number | null;
}): { requiredQty: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  if (params.takeoffBasis === 'CONTRACTOR_DETAILED_DUPA') {
    if (params.summaryVerifiedQty !== undefined && params.summaryVerifiedQty !== null && params.summaryVerifiedQty > 0) {
      issues.push({
        ruleCode: 'VAL-06',
        severity: 'BLOCKING',
        entityType: 'PRR_TAKEOFF',
        entityId: params.resourceCode,
        message: `Mutual exclusion violation on ${params.resourceCode}: CONTRACTOR_DETAILED_DUPA cannot add summaryVerifiedQty (${params.summaryVerifiedQty})`,
      });
      return { requiredQty: 0, issues };
    }
    if (!params.resourceCoeff || params.resourceCoeff <= 0 || !params.workQuantityBasis || params.workQuantityBasis <= 0) {
      issues.push({
        ruleCode: 'VAL-07',
        severity: 'BLOCKING',
        entityType: 'PRR_TAKEOFF',
        entityId: params.resourceCode,
        message: `Detailed DUPA takeoff on ${params.resourceCode} requires positive resourceCoeff and workQuantityBasis`,
      });
      return { requiredQty: 0, issues };
    }
    const computed = Number((params.resourceCoeff * params.workQuantityBasis).toFixed(4));
    if (
      params.alsoSubmittedSummarySheetQty !== undefined &&
      params.alsoSubmittedSummarySheetQty !== null &&
      Math.abs(computed - params.alsoSubmittedSummarySheetQty) > 0.01
    ) {
      issues.push({
        ruleCode: 'VAL-08',
        severity: 'WARNING',
        entityType: 'PRR_TAKEOFF',
        entityId: params.resourceCode,
        message: `DUPA takeoff (${computed}) differs from informational summary sheet (${params.alsoSubmittedSummarySheetQty}); controlling basis is DUPA (${computed}), never summed`,
      });
    }
    return { requiredQty: computed, issues };
  }

  // SUMMARY_ONLY_VERIFIED
  if (params.resourceCoeff !== undefined && params.resourceCoeff !== null && params.resourceCoeff > 0) {
    issues.push({
      ruleCode: 'VAL-06',
      severity: 'BLOCKING',
      entityType: 'PRR_TAKEOFF',
      entityId: params.resourceCode,
      message: `SUMMARY_ONLY_VERIFIED on ${params.resourceCode} must NOT multiply by resourceCoeff (${params.resourceCoeff})`,
    });
    return { requiredQty: 0, issues };
  }
  if (!params.summaryVerifiedQty || params.summaryVerifiedQty <= 0) {
    issues.push({
      ruleCode: 'VAL-07',
      severity: 'BLOCKING',
      entityType: 'PRR_TAKEOFF',
      entityId: params.resourceCode,
      message: `SUMMARY_ONLY_VERIFIED on ${params.resourceCode} requires positive summaryVerifiedQty`,
    });
    return { requiredQty: 0, issues };
  }

  return { requiredQty: Number(params.summaryVerifiedQty.toFixed(4)), issues };
}

/**
 * Validates Accomplishment & Progress Billing claims against original Phase BOQ lines + Approved Client VOs (ACC-01..03, BIL-01..03, VAL-12..15).
 */
export function validateAccomplishmentAndBillingClaim(params: {
  boqLineId: string;
  pricingType: 'UNIT_PRICE' | 'LUMP_SUM' | 'MILESTONE';
  approvedWorkQty: number;
  approvedClientVoQty?: number;
  contractUnitRate: number;
  prevCertifiedQty: number;
  currentClaimedQty: number;
  claimSourceBasis: 'ENGINEER_MEASURED_INSPECTED' | 'PLANNED_S_CURVE' | 'WAREHOUSE_MATERIAL_DELIVERED' | 'COST_ESTIMATE';
  hasApprovedInspectionEvidence: boolean;
  milestoneBreakdownWeightsPct?: number[];
}): {
  valid: boolean;
  ceilingQty: number;
  cumCertifiedQty: number;
  certifiedCurrentAmount: number;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];

  // ACC-01 / BIL-01: Planned S-curve, delivered materials on site, or cost estimates NEVER create billable accomplishment!
  if (params.claimSourceBasis !== 'ENGINEER_MEASURED_INSPECTED') {
    issues.push({
      ruleCode: 'VAL-12',
      severity: 'BLOCKING',
      entityType: 'ACCOMPLISHMENT_CLAIM',
      entityId: params.boqLineId,
      message: `Invalid accomplishment basis "${params.claimSourceBasis}": S-curve, warehouse delivery, or cost estimates cannot generate certified billable work`,
    });
  }

  if (!params.hasApprovedInspectionEvidence) {
    issues.push({
      ruleCode: 'VAL-13',
      severity: 'BLOCKING',
      entityType: 'ACCOMPLISHMENT_CLAIM',
      entityId: params.boqLineId,
      message: `Certified accomplishment on ${params.boqLineId} requires verified inspection/measurement evidence`,
    });
  }

  if ((params.pricingType === 'LUMP_SUM' || params.pricingType === 'MILESTONE') && params.milestoneBreakdownWeightsPct) {
    const weightSum = params.milestoneBreakdownWeightsPct.reduce((a, b) => a + b, 0);
    if (Math.abs(weightSum - 100) > 0.01) {
      issues.push({
        ruleCode: 'VAL-15',
        severity: 'BLOCKING',
        entityType: 'ACCOMPLISHMENT_CLAIM',
        entityId: params.boqLineId,
        message: `Lump-sum/milestone breakdown weights sum to ${weightSum.toFixed(2)}% instead of 100.00%`,
      });
    }
  }

  const ceilingQty = Number((params.approvedWorkQty + (params.approvedClientVoQty || 0)).toFixed(4));
  const cumCertifiedQty = Number((params.prevCertifiedQty + params.currentClaimedQty).toFixed(4));

  if (params.currentClaimedQty < 0 || cumCertifiedQty > ceilingQty + 0.0001) {
    issues.push({
      ruleCode: 'VAL-14',
      severity: 'BLOCKING',
      entityType: 'BILLING_CLAIM',
      entityId: params.boqLineId,
      message: `Overbilling blocked on ${params.boqLineId}: cumulative certified qty (${cumCertifiedQty}) exceeds approved contract + VO ceiling (${ceilingQty})`,
      details: { cumCertifiedQty, ceilingQty },
    });
  }

  const certifiedCurrentAmount =
    issues.some((i) => i.severity === 'BLOCKING')
      ? 0
      : Math.round((params.currentClaimedQty * params.contractUnitRate + Number.EPSILON) * 100) / 100;

  return {
    valid: !issues.some((i) => i.severity === 'BLOCKING'),
    ceilingQty,
    cumCertifiedQty,
    certifiedCurrentAmount,
    issues,
  };
}

/**
 * Read-only integration with frozen Scheduling CPM Engine (src/lib/cpm-engine.ts) + Earned Value Management (SCH-01..02, VAL-16..17).
 */
export function evaluateScheduleAndEvmPerformance(params: {
  projectStartDate?: Date;
  activities: CPMActivity[];
  dependencies: CPMDependency[];
  plannedValue: number;
  earnedValue: number;
  actualCost: number;
}): {
  cpmResult: ReturnType<typeof calculateCPM> | null;
  spi: number | null;
  cpi: number | null;
  issues: ValidationIssue[];
} {
  const issues: ValidationIssue[] = [];
  let cpmResult: ReturnType<typeof calculateCPM> | null = null;

  try {
    cpmResult = calculateCPM(params.activities, params.dependencies);
  } catch (err) {
    issues.push({
      ruleCode: 'VAL-16',
      severity: 'BLOCKING',
      entityType: 'SCHEDULE_NETWORK',
      message: `CPM schedule validation failed: ${(err as Error).message}`,
    });
  }

  const spi = params.plannedValue > 0 ? Number((params.earnedValue / params.plannedValue).toFixed(4)) : null;
  const cpi = params.actualCost > 0 ? Number((params.earnedValue / params.actualCost).toFixed(4)) : null;

  return { cpmResult, spi, cpi, issues };
}
