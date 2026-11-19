import { Prisma, type PrismaClient } from '@prisma/client';
import { assertUboqStageAuthorization } from '../security/stage-rbac';
import { canConvertUom, normalizeUom } from '../uom-registry';

const ZERO = new Prisma.Decimal(0);
const HUNDRED = new Prisma.Decimal(100);
const QTY_TOLERANCE = new Prisma.Decimal('0.0001');
const WEIGHT_TOLERANCE = new Prisma.Decimal('0.0001');

const DISALLOWED_SCHEDULE_STATUSES = new Set(['ARCHIVED', 'DELETED', 'CANCELLED', 'REJECTED']);
const DISALLOWED_WORKFLOW_STATUSES = new Set(['REJECTED', 'SUPERSEDED', 'ARCHIVED']);

export type NumericLike = Prisma.Decimal | number | string | null | undefined;

export interface ScheduleLinkSnapshotInput {
  id: string;
  projectId: string;
  status: string;
  approvedAt: Date | null;
  approvedById: string | null;
}

export interface ScheduleLinkScheduleInput {
  id: string;
  projectId: string;
  status: string;
  workflowStatus: string;
}

export interface ScheduleLinkPhaseLineInput {
  id: string;
  projectId: string;
  snapshotId: string | null;
  awardedBoqItemId: string | null;
  phaseCode: string;
  sectionCode: string | null;
  itemCode: string;
  unitNormalized: string;
  approvedQty: NumericLike;
}

export interface ScheduleLinkAwardedBoqInput {
  id: string;
  projectId: string;
  itemCode: string;
  unit: string;
  quantity: NumericLike;
}

export interface ScheduleLinkActivityInput {
  id: string;
  scheduleId: string;
  wbsId: string | null;
}

export interface ScheduleLinkAllocationInput {
  id: string;
  activityId: string;
  awardedBoqItemId: string;
  scheduleId: string | null;
  projectId: string | null;
  phaseId?: string | null;
  allocationMode?: string | null;
  mappedQuantity?: NumericLike;
  mappedWeight?: NumericLike;
  allocatedQuantity?: NumericLike;
  allocatedPercentage?: NumericLike;
}

export interface ExistingUboqScheduleLinkInput {
  id: string;
  phaseLineId: string;
  activityId: string;
  allocatedQty: NumericLike;
  allocationWeightPct: NumericLike;
  phaseLine: {
    snapshotId: string | null;
    awardedBoqItemId: string | null;
    phaseCode: string;
    sectionCode: string | null;
    itemCode: string;
  };
}

export interface PlannedScheduleActivityLink {
  phaseLineId: string;
  activityId: string;
  awardedBoqItemId: string;
  wbsId: string | null;
  scheduleId: string;
  projectId: string;
  phaseCode: string;
  itemCode: string;
  unitNormalized: string;
  allocatedQty: Prisma.Decimal;
  allocationWeightPct: Prisma.Decimal;
  sourceAllocationId: string;
}

export interface PhaseLineAllocationCompleteness {
  phaseLineId: string;
  itemCode: string;
  phaseCode: string;
  approvedQty: Prisma.Decimal;
  totalAllocatedQty: Prisma.Decimal;
  totalWeightPct: Prisma.Decimal;
  isComplete: boolean;
}

export interface PlanScheduleActivityLinksResult {
  projectId: string;
  scheduleId: string;
  scheduleStatus: string;
  scheduleWorkflowStatus: string;
  snapshotId: string;
  plannedLinks: PlannedScheduleActivityLink[];
  completeness: PhaseLineAllocationCompleteness[];
  incompletePhaseLines: PhaseLineAllocationCompleteness[];
}

function toDecimal(val: NumericLike): Prisma.Decimal | null {
  if (val === null || val === undefined || val === '') return null;
  if (val instanceof Prisma.Decimal) {
    return val.isFinite() ? val : null;
  }
  const str = String(val).trim();
  if (!str) return null;
  try {
    const d = new Prisma.Decimal(str);
    return d.isFinite() ? d : null;
  } catch {
    return null;
  }
}

function buildSlotKey(phaseCode: string, sectionCode: string | null, itemCode: string): string {
  return `${phaseCode.trim().toUpperCase()}::${(sectionCode || '').trim().toUpperCase()}::${itemCode.trim().toUpperCase()}`;
}

/**
 * Pure, deterministic planner that validates project/schedule/BOQ/unit/weight invariants
 * and maps ScheduleBOQAllocation records onto approved UboqAwardedPhaseLine rows
 * for UboqScheduleActivityLink persistence and T7_SCHEDULE_EVM consumption.
 */
export function planScheduleActivityLinks(params: {
  projectId: string;
  schedule: ScheduleLinkScheduleInput;
  approvedSnapshot: ScheduleLinkSnapshotInput | null;
  phaseLines: ReadonlyArray<ScheduleLinkPhaseLineInput>;
  awardedBoqItems: ReadonlyArray<ScheduleLinkAwardedBoqInput>;
  activities: ReadonlyArray<ScheduleLinkActivityInput>;
  allocations: ReadonlyArray<ScheduleLinkAllocationInput>;
  existingLinks?: ReadonlyArray<ExistingUboqScheduleLinkInput>;
  requireCompleteAllocation?: boolean;
}): PlanScheduleActivityLinksResult {
  const {
    projectId,
    schedule,
    approvedSnapshot,
    phaseLines,
    awardedBoqItems,
    activities,
    allocations,
    existingLinks = [],
    requireCompleteAllocation = false,
  } = params;

  if (!projectId || !projectId.trim()) {
    throw new Error('UBOQ_SCHEDULE_INVALID_INPUT: projectId is required');
  }
  if (!schedule || schedule.projectId !== projectId) {
    throw new Error('UBOQ_SCHEDULE_CROSS_PROJECT_DENIED: Schedule does not belong to target project');
  }
  if (
    DISALLOWED_SCHEDULE_STATUSES.has(String(schedule.status || '').toUpperCase()) ||
    DISALLOWED_WORKFLOW_STATUSES.has(String(schedule.workflowStatus || '').toUpperCase())
  ) {
    throw new Error(
      `UBOQ_INACTIVE_SCHEDULE_DENIED: Schedule "${schedule.id}" is in non-linkable state (${schedule.status}/${schedule.workflowStatus})`
    );
  }

  // Enforce approved snapshot boundary — NEVER link DRAFT or unapproved snapshots (matches T7_SCHEDULE_EVM 409 guard)
  if (
    !approvedSnapshot ||
    approvedSnapshot.projectId !== projectId ||
    approvedSnapshot.status !== 'APPROVED' ||
    !approvedSnapshot.approvedAt ||
    !approvedSnapshot.approvedById
  ) {
    throw new Error(
      'UBOQ_UNAPPROVED_SNAPSHOT_SOURCE: An approved UboqOperationalSnapshot with approver provenance is required before linking schedule activities'
    );
  }

  if (phaseLines.length === 0) {
    throw new Error('UBOQ_NO_APPROVED_PHASE_LINES: Approved snapshot has no awarded phase lines to link');
  }

  // Index and validate AwardedBOQItems (must all belong to target project)
  const boqById = new Map<string, ScheduleLinkAwardedBoqInput>();
  for (const boq of awardedBoqItems) {
    if (boq.projectId !== projectId) {
      throw new Error(`UBOQ_BOQ_CROSS_PROJECT_DENIED: AwardedBOQItem "${boq.id}" does not belong to project "${projectId}"`);
    }
    boqById.set(boq.id, boq);
  }

  // Index and validate ScheduleActivities (must all belong to target schedule)
  const activityById = new Map<string, ScheduleLinkActivityInput>();
  for (const act of activities) {
    if (act.scheduleId !== schedule.id) {
      throw new Error(
        `UBOQ_ACTIVITY_CROSS_SCHEDULE_DENIED: Activity "${act.id}" belongs to schedule "${act.scheduleId}", not "${schedule.id}"`
      );
    }
    activityById.set(act.id, act);
  }

  // Index approved phase lines by awardedBoqItemId and validate UOM compatibility with AwardedBOQItem
  const phaseLinesByBoqId = new Map<string, ScheduleLinkPhaseLineInput[]>();
  const phaseLineById = new Map<string, ScheduleLinkPhaseLineInput>();

  for (const pl of phaseLines) {
    if (pl.projectId !== projectId) {
      throw new Error(`UBOQ_PHASE_LINE_CROSS_PROJECT_DENIED: Phase line "${pl.id}" belongs to another project`);
    }
    if (pl.snapshotId !== approvedSnapshot.id) {
      throw new Error(
        `UBOQ_MULTI_SNAPSHOT_OVERLAP: Phase line "${pl.id}" belongs to snapshot "${pl.snapshotId}", expected "${approvedSnapshot.id}"`
      );
    }
    if (!pl.awardedBoqItemId) {
      throw new Error(
        `UBOQ_UNLINKED_PHASE_LINE: Approved phase line "${pl.id}" (${pl.itemCode}) has no awardedBoqItemId`
      );
    }
    const approvedQty = toDecimal(pl.approvedQty);
    if (!approvedQty || approvedQty.lte(ZERO)) {
      throw new Error(`UBOQ_INVALID_PHASE_LINE_QTY: Phase line "${pl.id}" must have positive approvedQty`);
    }
    const boq = boqById.get(pl.awardedBoqItemId);
    if (!boq) {
      throw new Error(
        `UBOQ_BOQ_NOT_FOUND_FOR_PROJECT: AwardedBOQItem "${pl.awardedBoqItemId}" for phase line "${pl.id}" not found in project`
      );
    }

    // Validate canonical UOM compatibility between UboqAwardedPhaseLine and AwardedBOQItem
    let boqNormCode: string;
    let plNormCode: string;
    try {
      boqNormCode = normalizeUom(boq.unit).normalizedCode;
      plNormCode = normalizeUom(pl.unitNormalized).normalizedCode;
    } catch {
      throw new Error(
        `UBOQ_INCOMPATIBLE_UNIT: Unrecognized unit on phase line "${pl.id}" ("${pl.unitNormalized}") or BOQ item "${boq.id}" ("${boq.unit}")`
      );
    }
    if (boqNormCode !== plNormCode && !canConvertUom(boqNormCode, plNormCode)) {
      throw new Error(
        `UBOQ_INCOMPATIBLE_UNIT: Phase line "${pl.id}" unit "${plNormCode}" is incompatible with AwardedBOQItem "${boq.id}" unit "${boqNormCode}"`
      );
    }

    phaseLineById.set(pl.id, pl);
    const list = phaseLinesByBoqId.get(pl.awardedBoqItemId) ?? [];
    list.push(pl);
    phaseLinesByBoqId.set(pl.awardedBoqItemId, list);
  }

  // Guard against multi-snapshot overlap on existing UboqScheduleActivityLink rows for this schedule
  const existingSlotSnapByAct = new Map<string, string>();
  for (const ex of existingLinks) {
    if (!activityById.has(ex.activityId)) continue;
    const snapId = ex.phaseLine.snapshotId;
    const boqId = ex.phaseLine.awardedBoqItemId;
    if (snapId && boqId) {
      const slotKey = `${ex.activityId}::${boqId}::${buildSlotKey(
        ex.phaseLine.phaseCode,
        ex.phaseLine.sectionCode,
        ex.phaseLine.itemCode
      )}`;
      existingSlotSnapByAct.set(slotKey, snapId);
    }
  }

  // Validate allocations and construct deterministic planned links
  const seenAllocPairs = new Set<string>();
  const plannedLinks: PlannedScheduleActivityLink[] = [];
  const qtySumByPhaseLine = new Map<string, Prisma.Decimal>();
  const weightSumByPhaseLine = new Map<string, Prisma.Decimal>();

  for (const alloc of allocations) {
    // Skip explicit reference-only or zero-cost non-quantity rows if marked REFERENCE_ONLY
    if (String(alloc.allocationMode || '').toUpperCase() === 'REFERENCE_ONLY') {
      continue;
    }

    if (alloc.projectId && alloc.projectId !== projectId) {
      throw new Error(
        `UBOQ_ALLOCATION_CROSS_PROJECT_OR_SCHEDULE_DENIED: Allocation "${alloc.id}" belongs to project "${alloc.projectId}"`
      );
    }
    if (alloc.scheduleId && alloc.scheduleId !== schedule.id) {
      throw new Error(
        `UBOQ_ALLOCATION_CROSS_PROJECT_OR_SCHEDULE_DENIED: Allocation "${alloc.id}" belongs to schedule "${alloc.scheduleId}"`
      );
    }

    const act = activityById.get(alloc.activityId);
    if (!act) {
      throw new Error(
        `UBOQ_ACTIVITY_CROSS_SCHEDULE_DENIED: Allocation "${alloc.id}" references activity "${alloc.activityId}" outside schedule "${schedule.id}"`
      );
    }

    if (!boqById.has(alloc.awardedBoqItemId)) {
      throw new Error(
        `UBOQ_BOQ_CROSS_PROJECT_DENIED: Allocation "${alloc.id}" references BOQ item "${alloc.awardedBoqItemId}" outside project "${projectId}"`
      );
    }

    const pairKey = `${alloc.awardedBoqItemId}::${alloc.activityId}`;
    if (seenAllocPairs.has(pairKey)) {
      throw new Error(
        `UBOQ_DUPLICATE_ALLOCATION: Duplicate allocation detected for BOQ item "${alloc.awardedBoqItemId}" on activity "${alloc.activityId}"`
      );
    }
    seenAllocPairs.add(pairKey);

    const matchingPhaseLines = phaseLinesByBoqId.get(alloc.awardedBoqItemId) ?? [];
    if (matchingPhaseLines.length === 0) {
      throw new Error(
        `UBOQ_UNLINKED_BOQ_ALLOCATION: No approved UboqAwardedPhaseLine found for AwardedBOQItem "${alloc.awardedBoqItemId}"`
      );
    }

    // Disambiguate if multiple phase lines share an awardedBoqItemId
    let targetPhaseLine: ScheduleLinkPhaseLineInput;
    if (matchingPhaseLines.length === 1) {
      targetPhaseLine = matchingPhaseLines[0];
    } else {
      const phaseHint = String(alloc.phaseId || '').trim().toUpperCase();
      const narrowed = phaseHint
        ? matchingPhaseLines.filter(
            (pl) => pl.id === alloc.phaseId || pl.phaseCode.trim().toUpperCase() === phaseHint
          )
        : [];
      if (narrowed.length !== 1) {
        throw new Error(
          `UBOQ_AMBIGUOUS_PHASE_LINE_MAPPING: AwardedBOQItem "${alloc.awardedBoqItemId}" maps to ${matchingPhaseLines.length} phase lines without unambiguous phaseId`
        );
      }
      targetPhaseLine = narrowed[0];
    }

    // Check multi-snapshot overlap against any existing link on this activity+BOQ slot
    const slotKey = `${act.id}::${alloc.awardedBoqItemId}::${buildSlotKey(
      targetPhaseLine.phaseCode,
      targetPhaseLine.sectionCode,
      targetPhaseLine.itemCode
    )}`;
    const existingSnapId = existingSlotSnapByAct.get(slotKey);
    if (existingSnapId && existingSnapId !== approvedSnapshot.id) {
      throw new Error(
        `UBOQ_MULTI_SNAPSHOT_OVERLAP: Activity "${act.id}" already has an active link for BOQ slot "${slotKey}" from snapshot "${existingSnapId}"`
      );
    }

    const approvedQty = toDecimal(targetPhaseLine.approvedQty)!;

    // Resolve precise Decimal allocatedQty (Decimal 18,4) and allocationWeightPct (Decimal 9,6 on 0..100 scale)
    const rawQty = toDecimal(alloc.allocatedQuantity) ?? toDecimal(alloc.mappedQuantity);
    const rawPct = toDecimal(alloc.allocatedPercentage) ?? toDecimal(alloc.mappedWeight);

    if (rawQty && rawQty.lt(ZERO)) {
      throw new Error(`UBOQ_INVALID_ALLOCATION_AMOUNT: Negative allocated quantity on allocation "${alloc.id}"`);
    }
    if (rawPct && rawPct.lt(ZERO)) {
      throw new Error(`UBOQ_INVALID_ALLOCATION_AMOUNT: Negative allocation weight on allocation "${alloc.id}"`);
    }

    let allocatedQty: Prisma.Decimal;
    let allocationWeightPct: Prisma.Decimal;

    if (rawQty && rawQty.gt(ZERO)) {
      allocatedQty = rawQty.toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
      allocationWeightPct = allocatedQty.mul(HUNDRED).div(approvedQty).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
    } else if (rawPct && rawPct.gt(ZERO)) {
      // Normalize 0..1 fractional weights (mappedWeight) vs 0..100 percentage weights (allocatedPercentage)
      const isFractionalWeight =
        alloc.allocatedPercentage === null ||
        alloc.allocatedPercentage === undefined
          ? rawPct.lte(1)
          : false;
      allocationWeightPct = (isFractionalWeight ? rawPct.mul(HUNDRED) : rawPct).toDecimalPlaces(
        6,
        Prisma.Decimal.ROUND_HALF_UP
      );
      allocatedQty = approvedQty.mul(allocationWeightPct).div(HUNDRED).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    } else {
      throw new Error(
        `UBOQ_INVALID_ALLOCATION_AMOUNT: Allocation "${alloc.id}" must specify a positive quantity or weight`
      );
    }

    if (allocationWeightPct.gt(HUNDRED.plus(WEIGHT_TOLERANCE))) {
      throw new Error(
        `UBOQ_ALLOCATION_OVERFLOW: Allocation "${alloc.id}" exceeds 100% weight (${allocationWeightPct.toFixed(4)}%)`
      );
    }

    const prevQtySum = qtySumByPhaseLine.get(targetPhaseLine.id) ?? ZERO;
    const nextQtySum = prevQtySum.plus(allocatedQty);
    if (nextQtySum.gt(approvedQty.plus(QTY_TOLERANCE))) {
      throw new Error(
        `UBOQ_ALLOCATION_OVERFLOW: Phase line "${targetPhaseLine.id}" (${targetPhaseLine.itemCode}) allocated quantity ${nextQtySum.toFixed(4)} exceeds approved quantity ${approvedQty.toFixed(4)}`
      );
    }
    qtySumByPhaseLine.set(targetPhaseLine.id, nextQtySum);

    const prevWeightSum = weightSumByPhaseLine.get(targetPhaseLine.id) ?? ZERO;
    const nextWeightSum = prevWeightSum.plus(allocationWeightPct);
    if (nextWeightSum.gt(HUNDRED.plus(WEIGHT_TOLERANCE))) {
      throw new Error(
        `UBOQ_ALLOCATION_OVERFLOW: Phase line "${targetPhaseLine.id}" (${targetPhaseLine.itemCode}) total weight ${nextWeightSum.toFixed(4)}% exceeds 100%`
      );
    }
    weightSumByPhaseLine.set(targetPhaseLine.id, nextWeightSum);

    plannedLinks.push({
      phaseLineId: targetPhaseLine.id,
      activityId: act.id,
      awardedBoqItemId: alloc.awardedBoqItemId,
      wbsId: act.wbsId,
      scheduleId: schedule.id,
      projectId,
      phaseCode: targetPhaseLine.phaseCode,
      itemCode: targetPhaseLine.itemCode,
      unitNormalized: targetPhaseLine.unitNormalized,
      allocatedQty,
      allocationWeightPct,
      sourceAllocationId: alloc.id,
    });
  }

  // Completeness report per approved phase line
  const completeness: PhaseLineAllocationCompleteness[] = phaseLines.map((pl) => {
    const approvedQty = toDecimal(pl.approvedQty)!;
    const totalAllocatedQty = (qtySumByPhaseLine.get(pl.id) ?? ZERO).toDecimalPlaces(4, Prisma.Decimal.ROUND_HALF_UP);
    const totalWeightPct = (weightSumByPhaseLine.get(pl.id) ?? ZERO).toDecimalPlaces(6, Prisma.Decimal.ROUND_HALF_UP);
    const qtyGap = approvedQty.minus(totalAllocatedQty).abs();
    const isComplete = qtyGap.lte(QTY_TOLERANCE);
    return {
      phaseLineId: pl.id,
      itemCode: pl.itemCode,
      phaseCode: pl.phaseCode,
      approvedQty,
      totalAllocatedQty,
      totalWeightPct,
      isComplete,
    };
  });

  const incompletePhaseLines = completeness.filter((c) => !c.isComplete);
  if (requireCompleteAllocation && incompletePhaseLines.length > 0) {
    const summary = incompletePhaseLines
      .map((c) => `${c.itemCode} (${c.totalAllocatedQty.toFixed(4)}/${c.approvedQty.toFixed(4)})`)
      .join(', ');
    throw new Error(`UBOQ_INCOMPLETE_ALLOCATION: Incomplete schedule allocation for phase line(s): ${summary}`);
  }

  return {
    projectId,
    scheduleId: schedule.id,
    scheduleStatus: schedule.status,
    scheduleWorkflowStatus: schedule.workflowStatus,
    snapshotId: approvedSnapshot.id,
    plannedLinks,
    completeness,
    incompletePhaseLines,
  };
}

/**
 * Transactional, idempotent persistence adapter for UboqScheduleActivityLink.
 * Writes ONLY to UboqScheduleActivityLink — never modifies ProjectSchedule, ScheduleActivity,
 * ScheduleBOQAllocation, AwardedBOQItem, UboqAwardedPhaseLine, or approved financial baselines.
 */
export async function syncUboqScheduleActivityLinks(
  prismaInput: PrismaClient | { readonly $transaction: unknown },
  params: {
    projectId: string;
    scheduleId: string;
    actorUserId: string;
    simulatedRole?: string | null;
    requireCompleteAllocation?: boolean;
  }
) {
  const prisma = prismaInput as PrismaClient;

  await assertUboqStageAuthorization(prisma, {
    userId: params.actorUserId,
    projectId: params.projectId,
    capability: 'UBOQ_INTAKE_STAGE',
    simulatedRole: params.simulatedRole ?? null,
  });

  return prisma.$transaction(async (tx) => {
    const schedule = await tx.projectSchedule.findUnique({
      where: { id: params.scheduleId },
      select: {
        id: true,
        projectId: true,
        status: true,
        workflowStatus: true,
      },
    });
    if (!schedule || schedule.projectId !== params.projectId) {
      throw new Error('UBOQ_SCHEDULE_CROSS_PROJECT_DENIED: Schedule not found for target project');
    }

    const approvedSnapshot = await tx.uboqOperationalSnapshot.findFirst({
      where: {
        projectId: params.projectId,
        status: 'APPROVED',
        approvedAt: { not: null },
        approvedById: { not: null },
      },
      orderBy: { versionNumber: 'desc' },
      select: {
        id: true,
        projectId: true,
        status: true,
        approvedAt: true,
        approvedById: true,
      },
    });

    const phaseLines = approvedSnapshot
      ? await tx.uboqAwardedPhaseLine.findMany({
          where: {
            projectId: params.projectId,
            snapshotId: approvedSnapshot.id,
          },
          select: {
            id: true,
            projectId: true,
            snapshotId: true,
            awardedBoqItemId: true,
            phaseCode: true,
            sectionCode: true,
            itemCode: true,
            unitNormalized: true,
            approvedQty: true,
          },
        })
      : [];

    const activities = await tx.scheduleActivity.findMany({
      where: { scheduleId: schedule.id },
      select: { id: true, scheduleId: true, wbsId: true },
    });
    const activityIds = activities.map((a) => a.id);

    const allocations =
      activityIds.length > 0
        ? await tx.scheduleBOQAllocation.findMany({
            where: { activityId: { in: activityIds } },
            select: {
              id: true,
              activityId: true,
              awardedBoqItemId: true,
              scheduleId: true,
              projectId: true,
              phaseId: true,
              allocationMode: true,
              mappedQuantity: true,
              mappedWeight: true,
              allocatedQuantity: true,
              allocatedPercentage: true,
            },
          })
        : [];

    const boqIds = Array.from(
      new Set([
        ...phaseLines.map((p) => p.awardedBoqItemId).filter((x): x is string => Boolean(x)),
        ...allocations.map((a) => a.awardedBoqItemId),
      ])
    );

    const awardedBoqItems =
      boqIds.length > 0
        ? await tx.awardedBOQItem.findMany({
            where: { id: { in: boqIds } },
            select: {
              id: true,
              projectId: true,
              itemCode: true,
              unit: true,
              quantity: true,
            },
          })
        : [];

    const existingLinks =
      activityIds.length > 0
        ? await tx.uboqScheduleActivityLink.findMany({
            where: { activityId: { in: activityIds } },
            select: {
              id: true,
              phaseLineId: true,
              activityId: true,
              allocatedQty: true,
              allocationWeightPct: true,
              phaseLine: {
                select: {
                  snapshotId: true,
                  awardedBoqItemId: true,
                  phaseCode: true,
                  sectionCode: true,
                  itemCode: true,
                },
              },
            },
          })
        : [];

    const plan = planScheduleActivityLinks({
      projectId: params.projectId,
      schedule,
      approvedSnapshot,
      phaseLines,
      awardedBoqItems,
      activities,
      allocations,
      existingLinks,
      requireCompleteAllocation: Boolean(params.requireCompleteAllocation),
    });

    const existingByPair = new Map(
      existingLinks.map((lnk) => [`${lnk.phaseLineId}::${lnk.activityId}`, lnk])
    );

    let createdCount = 0;
    let updatedCount = 0;
    let unchangedCount = 0;
    const persistedLinks = [];

    for (const item of plan.plannedLinks) {
      const pairKey = `${item.phaseLineId}::${item.activityId}`;
      const existing = existingByPair.get(pairKey);

      if (existing) {
        const sameQty = new Prisma.Decimal(existing.allocatedQty).equals(item.allocatedQty);
        const samePct = new Prisma.Decimal(existing.allocationWeightPct).equals(item.allocationWeightPct);
        if (sameQty && samePct) {
          unchangedCount += 1;
          persistedLinks.push({
            id: existing.id,
            phaseLineId: item.phaseLineId,
            activityId: item.activityId,
            allocatedQty: item.allocatedQty.toFixed(4),
            allocationWeightPct: item.allocationWeightPct.toFixed(6),
          });
          continue;
        }
        const updated = await tx.uboqScheduleActivityLink.update({
          where: { id: existing.id },
          data: {
            allocatedQty: item.allocatedQty,
            allocationWeightPct: item.allocationWeightPct,
          },
          select: { id: true, phaseLineId: true, activityId: true, allocatedQty: true, allocationWeightPct: true },
        });
        updatedCount += 1;
        persistedLinks.push({
          id: updated.id,
          phaseLineId: updated.phaseLineId,
          activityId: updated.activityId,
          allocatedQty: new Prisma.Decimal(updated.allocatedQty).toFixed(4),
          allocationWeightPct: new Prisma.Decimal(updated.allocationWeightPct).toFixed(6),
        });
      } else {
        const created = await tx.uboqScheduleActivityLink.create({
          data: {
            phaseLineId: item.phaseLineId,
            activityId: item.activityId,
            allocatedQty: item.allocatedQty,
            allocationWeightPct: item.allocationWeightPct,
          },
          select: { id: true, phaseLineId: true, activityId: true, allocatedQty: true, allocationWeightPct: true },
        });
        createdCount += 1;
        persistedLinks.push({
          id: created.id,
          phaseLineId: created.phaseLineId,
          activityId: created.activityId,
          allocatedQty: new Prisma.Decimal(created.allocatedQty).toFixed(4),
          allocationWeightPct: new Prisma.Decimal(created.allocationWeightPct).toFixed(6),
        });
      }
    }

    return {
      projectId: plan.projectId,
      scheduleId: plan.scheduleId,
      scheduleStatus: plan.scheduleStatus,
      scheduleWorkflowStatus: plan.scheduleWorkflowStatus,
      snapshotId: plan.snapshotId,
      createdCount,
      updatedCount,
      unchangedCount,
      totalLinks: persistedLinks.length,
      links: persistedLinks,
      completeness: plan.completeness.map((c) => ({
        phaseLineId: c.phaseLineId,
        itemCode: c.itemCode,
        phaseCode: c.phaseCode,
        approvedQty: c.approvedQty.toFixed(4),
        totalAllocatedQty: c.totalAllocatedQty.toFixed(4),
        totalWeightPct: c.totalWeightPct.toFixed(6),
        isComplete: c.isComplete,
      })),
      incompletePhaseLineCount: plan.incompletePhaseLines.length,
      baselineModified: false as const,
    };
  });
}
