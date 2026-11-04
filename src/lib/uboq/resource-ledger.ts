import type { Prisma, PrismaClient, UboqLedgerEventType } from '@prisma/client';
import { assertExactNormalizedUomMatch } from './uom-registry';

const MAX_TX_RETRIES = 2;

export interface LockedResourceRow {
  id: string;
  projectId: string;
  consolidatedBoqItemId: string;
  resourceCode: string;
  resourceUomNormalized: string;
  activeApprovedPrId: string | null;
  activeApprovedQty: number;
  allocatedUsableStockQty: number;
  openMrReservedQty: number;
  openCommittedPoQty: number;
  deliveredReceivedQty: number;
  consumedIssuedQty: number;
  damagedReturnedQty: number;
  availablePhysicalStockQty: number;
  remainingProcurementQty: number;
  isOvercommittedByRevision: boolean;
  overcommittedQty: number;
  targetResourceUnitCost: number;
  rowVersion: number;
}

function round4(n: number): number {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

export function computeCanonicalAccountBalances(state: {
  activeApprovedQty: number;
  allocatedUsableStockQty: number;
  openMrReservedQty: number;
  openCommittedPoQty: number;
  deliveredReceivedQty: number;
  consumedIssuedQty: number;
  damagedReturnedQty: number;
}) {
  const availablePhysicalStockQty = round4(
    state.allocatedUsableStockQty + state.deliveredReceivedQty - state.consumedIssuedQty
  );
  const totalSupplyCovered = round4(
    state.allocatedUsableStockQty + state.openMrReservedQty + state.openCommittedPoQty + state.deliveredReceivedQty
  );
  const rawRemaining = round4(state.activeApprovedQty - totalSupplyCovered);

  if (rawRemaining >= -0.00005) {
    return {
      availablePhysicalStockQty,
      remainingProcurementQty: Math.max(0, rawRemaining),
      isOvercommittedByRevision: false,
      overcommittedQty: 0,
    };
  }
  return {
    availablePhysicalStockQty,
    remainingProcurementQty: 0,
    isOvercommittedByRevision: true,
    overcommittedQty: round4(Math.abs(rawRemaining)),
  };
}

function isRetryablePgLockOrSerializationError(err: unknown): boolean {
  const msg = String((err as Error)?.message ?? '');
  const code = (err as { code?: string; meta?: { code?: string } })?.meta?.code ?? (err as { code?: string })?.code ?? '';
  return (
    code === '40P01' ||
    code === '40001' ||
    code === '55P03' ||
    code === 'P2034' ||
    /deadlock detected|could not serialize|lock timeout/i.test(msg)
  );
}

/**
 * Executes an atomic PostgreSQL transaction with 3000ms lock_timeout, deterministic ASC row locking,
 * and bounded jittered retry (MAX_TX_RETRIES = 2) on deadlock/lock contention (H4-01..02).
 */
export async function withLockedResourceAccountTx<T>(
  prismaInput: PrismaClient | { readonly project: unknown },
  canonicalResourceIds: string[],
  fn: (ctx: {
    tx: Prisma.TransactionClient;
    txId: string;
    lockedAccounts: Map<string, LockedResourceRow>;
  }) => Promise<T>
): Promise<T> {
  const prisma = prismaInput as PrismaClient;
  const sortedUniqueIds = [...new Set(canonicalResourceIds.filter(Boolean))].sort();
  let attempt = 0;

  while (true) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '3000ms'`);
          const txIdRows = await tx.$queryRaw<Array<{ tx_id: string }>>`SELECT pg_current_xact_id()::text AS tx_id`;
          const txId = txIdRows[0]?.tx_id ?? String(Date.now());

          const lockedAccounts = new Map<string, LockedResourceRow>();
          if (sortedUniqueIds.length > 0) {
            const rows = await tx.$queryRaw<Array<Record<string, unknown>>>`
              SELECT *
              FROM "UboqCanonicalResourceAccount"
              WHERE id = ANY(${sortedUniqueIds}::text[])
              ORDER BY id ASC
              FOR UPDATE
            `;
            for (const r of rows) {
              lockedAccounts.set(String(r.id), {
                id: String(r.id),
                projectId: String(r.projectId),
                consolidatedBoqItemId: String(r.consolidatedBoqItemId),
                resourceCode: String(r.resourceCode),
                resourceUomNormalized: String(r.resourceUomNormalized),
                activeApprovedPrId: r.activeApprovedPrId ? String(r.activeApprovedPrId) : null,
                activeApprovedQty: Number(r.activeApprovedQty),
                allocatedUsableStockQty: Number(r.allocatedUsableStockQty),
                openMrReservedQty: Number(r.openMrReservedQty),
                openCommittedPoQty: Number(r.openCommittedPoQty),
                deliveredReceivedQty: Number(r.deliveredReceivedQty),
                consumedIssuedQty: Number(r.consumedIssuedQty),
                damagedReturnedQty: Number(r.damagedReturnedQty),
                availablePhysicalStockQty: Number(r.availablePhysicalStockQty),
                remainingProcurementQty: Number(r.remainingProcurementQty),
                isOvercommittedByRevision: Boolean(r.isOvercommittedByRevision),
                overcommittedQty: Number(r.overcommittedQty),
                targetResourceUnitCost: Number(r.targetResourceUnitCost),
                rowVersion: Number(r.rowVersion),
              });
            }
          }

          return await fn({ tx, txId, lockedAccounts });
        },
        { maxWait: 5000, timeout: 15000 }
      );
    } catch (err) {
      if (attempt < MAX_TX_RETRIES && isRetryablePgLockOrSerializationError(err)) {
        attempt++;
        const jitterMs = 40 + Math.floor(Math.random() * 80) * attempt;
        await new Promise((res) => setTimeout(res, jitterMs));
        continue;
      }
      throw err;
    }
  }
}

export async function applyLedgerDeltaOnLockedAccount(
  tx: Prisma.TransactionClient,
  txId: string,
  acct: LockedResourceRow,
  entry: {
    prrSnapshotId: string | null;
    eventType: UboqLedgerEventType;
    sourceModule: string;
    sourceHeaderId: string;
    sourceLineId: string;
    poItemLineageId?: string | null;
    transitionSeq?: number;
    warehouseLocationId?: string | null;
    conditionCode?: string | null;
    idempotencyKey: string;
    qtyDeltaApproved?: number;
    qtyDeltaAllocatedStock?: number;
    qtyDeltaOpenMr?: number;
    qtyDeltaOpenPo?: number;
    qtyDeltaDelivered?: number;
    qtyDeltaConsumed?: number;
    qtyDeltaDamaged?: number;
    newActiveApprovedPrId?: string | null;
    unitCostSnapshot?: number | null;
    actorUserId: string;
    remarks?: string | null;
  }
): Promise<LockedResourceRow> {
  // Idempotency replay check
  const existingLedger = await tx.uboqResourceLedgerEntry.findUnique({
    where: { idempotencyKey: entry.idempotencyKey },
  });
  if (existingLedger) {
    return acct;
  }

  const nextApproved = round4(acct.activeApprovedQty + (entry.qtyDeltaApproved ?? 0));
  const nextAllocStock = round4(acct.allocatedUsableStockQty + (entry.qtyDeltaAllocatedStock ?? 0));
  const nextOpenMr = round4(acct.openMrReservedQty + (entry.qtyDeltaOpenMr ?? 0));
  const nextOpenPo = round4(acct.openCommittedPoQty + (entry.qtyDeltaOpenPo ?? 0));
  const nextDelivered = round4(acct.deliveredReceivedQty + (entry.qtyDeltaDelivered ?? 0));
  const nextConsumed = round4(acct.consumedIssuedQty + (entry.qtyDeltaConsumed ?? 0));
  const nextDamaged = round4(acct.damagedReturnedQty + (entry.qtyDeltaDamaged ?? 0));

  if (
    nextApproved < -0.0001 ||
    nextAllocStock < -0.0001 ||
    nextOpenMr < -0.0001 ||
    nextOpenPo < -0.0001 ||
    nextDelivered < -0.0001 ||
    nextConsumed < -0.0001 ||
    nextDamaged < -0.0001
  ) {
    throw new Error(
      `UBOQ_LEDGER_NEGATIVE_BUCKET_BLOCKED [${entry.eventType}] on ${acct.resourceCode}: bucket cannot go negative`
    );
  }

  const computed = computeCanonicalAccountBalances({
    activeApprovedQty: Math.max(0, nextApproved),
    allocatedUsableStockQty: Math.max(0, nextAllocStock),
    openMrReservedQty: Math.max(0, nextOpenMr),
    openCommittedPoQty: Math.max(0, nextOpenPo),
    deliveredReceivedQty: Math.max(0, nextDelivered),
    consumedIssuedQty: Math.max(0, nextConsumed),
    damagedReturnedQty: Math.max(0, nextDamaged),
  });

  if (computed.availablePhysicalStockQty < -0.0001) {
    throw new Error(
      `UBOQ_INSUFFICIENT_PHYSICAL_STOCK [${entry.eventType}] on ${acct.resourceCode}: available stock cannot be negative`
    );
  }

  const updatedActivePrId =
    entry.newActiveApprovedPrId !== undefined ? entry.newActiveApprovedPrId : acct.activeApprovedPrId;

  await tx.uboqCanonicalResourceAccount.update({
    where: { id: acct.id },
    data: {
      activeApprovedPrId: updatedActivePrId,
      activeApprovedQty: Math.max(0, nextApproved),
      allocatedUsableStockQty: Math.max(0, nextAllocStock),
      openMrReservedQty: Math.max(0, nextOpenMr),
      openCommittedPoQty: Math.max(0, nextOpenPo),
      deliveredReceivedQty: Math.max(0, nextDelivered),
      consumedIssuedQty: Math.max(0, nextConsumed),
      damagedReturnedQty: Math.max(0, nextDamaged),
      availablePhysicalStockQty: Math.max(0, computed.availablePhysicalStockQty),
      remainingProcurementQty: computed.remainingProcurementQty,
      isOvercommittedByRevision: computed.isOvercommittedByRevision,
      overcommittedQty: computed.overcommittedQty,
      rowVersion: acct.rowVersion + 1,
    },
  });

  await tx.uboqResourceLedgerEntry.create({
    data: {
      projectId: acct.projectId,
      canonicalResourceId: acct.id,
      prrSnapshotId: entry.prrSnapshotId,
      eventType: entry.eventType,
      sourceModule: entry.sourceModule,
      sourceHeaderId: entry.sourceHeaderId,
      sourceLineId: entry.sourceLineId,
      poItemLineageId: entry.poItemLineageId ?? null,
      transitionSeq: entry.transitionSeq ?? 1,
      txId,
      warehouseLocationId: entry.warehouseLocationId ?? null,
      conditionCode: entry.conditionCode ?? null,
      idempotencyKey: entry.idempotencyKey,
      qtyDeltaApproved: entry.qtyDeltaApproved ?? 0,
      qtyDeltaAllocatedStock: entry.qtyDeltaAllocatedStock ?? 0,
      qtyDeltaOpenMr: entry.qtyDeltaOpenMr ?? 0,
      qtyDeltaOpenPo: entry.qtyDeltaOpenPo ?? 0,
      qtyDeltaDelivered: entry.qtyDeltaDelivered ?? 0,
      qtyDeltaConsumed: entry.qtyDeltaConsumed ?? 0,
      qtyDeltaDamaged: entry.qtyDeltaDamaged ?? 0,
      balanceAvailableStockAfter: Math.max(0, computed.availablePhysicalStockQty),
      balanceRemainingProcureAfter: computed.remainingProcurementQty,
      unitCostSnapshot: entry.unitCostSnapshot ?? null,
      actorUserId: entry.actorUserId,
      remarks: entry.remarks ?? null,
    },
  });

  const updated: LockedResourceRow = {
    ...acct,
    activeApprovedPrId: updatedActivePrId,
    activeApprovedQty: Math.max(0, nextApproved),
    allocatedUsableStockQty: Math.max(0, nextAllocStock),
    openMrReservedQty: Math.max(0, nextOpenMr),
    openCommittedPoQty: Math.max(0, nextOpenPo),
    deliveredReceivedQty: Math.max(0, nextDelivered),
    consumedIssuedQty: Math.max(0, nextConsumed),
    damagedReturnedQty: Math.max(0, nextDamaged),
    availablePhysicalStockQty: Math.max(0, computed.availablePhysicalStockQty),
    remainingProcurementQty: computed.remainingProcurementQty,
    isOvercommittedByRevision: computed.isOvercommittedByRevision,
    overcommittedQty: computed.overcommittedQty,
    rowVersion: acct.rowVersion + 1,
  };
  return updated;
}

/**
 * Approves a PRR version (v1 or superseding v2+) with Maker-Checker SoD & immutable v1 preservation (SNP-V2-01, H3-01..03).
 */
export async function approvePrrVersionAtomically(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: { prrId: string; approverUserId: string; idempotencyKey?: string }
) {
  const prisma = prismaInput as PrismaClient;
  const prrPre = await prisma.uboqProcurementResourceRequirement.findUnique({
    where: { id: params.prrId },
  });
  if (!prrPre) throw new Error(`UBOQ_PRR_NOT_FOUND: PRR ${params.prrId} not found`);
  if (prrPre.preparedById === params.approverUserId) {
    throw new Error('UBOQ_SOD_VIOLATION: PRR preparer cannot self-approve PRR (VAL-20)');
  }

  return withLockedResourceAccountTx(prisma, [prrPre.canonicalResourceId], async ({ tx, txId, lockedAccounts }) => {
    const acct = lockedAccounts.get(prrPre.canonicalResourceId);
    if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

    const prr = await tx.uboqProcurementResourceRequirement.findUnique({ where: { id: params.prrId } });
    if (!prr) throw new Error('UBOQ_PRR_NOT_FOUND');
    if (prr.status === 'APPROVED') return { account: acct, prr };
    if (prr.status === 'SUPERSEDED') {
      throw new Error(`UBOQ_PRR_INVALID_STATE: Cannot approve ${prr.status} PRR ${prr.id}`);
    }

    // Supersede prior active PRR on the same canonical resource account without deleting or overwriting its historical fields!
    if (acct.activeApprovedPrId && acct.activeApprovedPrId !== prr.id) {
      await tx.uboqProcurementResourceRequirement.update({
        where: { id: acct.activeApprovedPrId },
        data: { status: 'SUPERSEDED' },
      });
    }

    const approvedPrr = await tx.uboqProcurementResourceRequirement.update({
      where: { id: prr.id },
      data: {
        status: 'APPROVED',
        approvedById: params.approverUserId,
        approvedAt: new Date(),
      },
    });

    const deltaApproved = round4(Number(prr.requiredQty) - acct.activeApprovedQty);
    const updatedAcct = await applyLedgerDeltaOnLockedAccount(tx, txId, acct, {
      prrSnapshotId: prr.id,
      eventType: acct.activeApprovedPrId ? 'PRR_SUPERSEDED' : 'PRR_APPROVED',
      sourceModule: 'UBOQ_PRR',
      sourceHeaderId: prr.id,
      sourceLineId: prr.id,
      idempotencyKey: params.idempotencyKey ?? `PRR_APPROVE:${prr.id}:v${prr.versionNumber}`,
      qtyDeltaApproved: deltaApproved,
      newActiveApprovedPrId: prr.id,
      unitCostSnapshot: Number(prr.benchmarkUnitCost),
      actorUserId: params.approverUserId,
      remarks: `Approved PRR v${prr.versionNumber} (${Number(prr.requiredQty)} ${acct.resourceUomNormalized})`,
    });

    return { account: updatedAcct, prr: approvedPrr };
  });
}

/**
 * Allocates verified, inspected GOOD warehouse opening stock to a Canonical Resource Account (I-01, STK-OPEN-01..03).
 * Damaged/expired/uninspected lots are strictly rejected!
 */
export async function allocateVerifiedOpeningStockAtomically(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    projectId: string;
    canonicalResourceId: string;
    lotNumber: string;
    warehouseLocationId: string;
    conditionCode: string;
    verifiedQty: number;
    allocatedQty: number;
    unitCost: number;
    resourceUnit: string;
    inspectionRef: string;
    verifiedByUserId: string;
    idempotencyKey?: string;
  }
) {
  const prisma = prismaInput as PrismaClient;
  if (params.conditionCode.trim().toUpperCase() !== 'GOOD') {
    throw new Error(
      `UBOQ_UNUSABLE_STOCK_REJECTED: Cannot allocate opening stock lot ${params.lotNumber} with condition "${params.conditionCode}" (must be GOOD)`
    );
  }
  if (!params.warehouseLocationId.trim() || !params.inspectionRef.trim()) {
    throw new Error('UBOQ_MISSING_LOT_EVIDENCE: warehouseLocationId and inspectionRef are required for opening stock');
  }
  if (params.allocatedQty <= 0 || params.allocatedQty > params.verifiedQty + 0.0001) {
    throw new Error('UBOQ_INVALID_STOCK_ALLOCATION_QTY: allocatedQty must be > 0 and <= verifiedQty');
  }

  return withLockedResourceAccountTx(prisma, [params.canonicalResourceId], async ({ tx, txId, lockedAccounts }) => {
    const acct = lockedAccounts.get(params.canonicalResourceId);
    if (!acct || acct.projectId !== params.projectId) {
      throw new Error('UBOQ_ACCOUNT_NOT_FOUND_FOR_PROJECT');
    }
    if (!acct.activeApprovedPrId) {
      throw new Error('UBOQ_NO_ACTIVE_APPROVED_PRR: Opening stock allocation requires an active APPROVED PRR');
    }
    assertExactNormalizedUomMatch(params.resourceUnit, acct.resourceUomNormalized, 'OPENING_STOCK_LOT');

    if (params.allocatedQty > acct.remainingProcurementQty + 0.0001) {
      throw new Error(
        `UBOQ_OPENING_STOCK_EXCEEDS_REMAINING_NEED: Allocated stock (${params.allocatedQty}) exceeds remaining requirement (${acct.remainingProcurementQty})`
      );
    }

    const lot = await tx.uboqStockLotEvidence.create({
      data: {
        projectId: params.projectId,
        canonicalResourceId: acct.id,
        lotNumber: params.lotNumber.trim(),
        warehouseLocationId: params.warehouseLocationId.trim(),
        conditionCode: 'GOOD',
        verifiedQty: params.verifiedQty,
        allocatedQty: params.allocatedQty,
        issuedQty: 0,
        unitCost: params.unitCost,
        inspectionRef: params.inspectionRef.trim(),
        verifiedById: params.verifiedByUserId,
        status: 'VERIFIED',
      },
    });

    const updatedAcct = await applyLedgerDeltaOnLockedAccount(tx, txId, acct, {
      prrSnapshotId: acct.activeApprovedPrId,
      eventType: 'OPENING_STOCK_ALLOCATED',
      sourceModule: 'UBOQ_WAREHOUSE_STOCK',
      sourceHeaderId: lot.id,
      sourceLineId: lot.id,
      warehouseLocationId: lot.warehouseLocationId,
      conditionCode: 'GOOD',
      idempotencyKey: params.idempotencyKey ?? `OPEN_STOCK:${lot.id}`,
      qtyDeltaAllocatedStock: params.allocatedQty,
      unitCostSnapshot: params.unitCost,
      actorUserId: params.verifiedByUserId,
      remarks: `Allocated ${params.allocatedQty} ${acct.resourceUomNormalized} from verified lot ${lot.lotNumber}`,
    });

    return { lot, account: updatedAcct };
  });
}

/**
 * Pre-first-PO & Post-PO Warehouse Issuance (Safeguard I-01):
 * Issues directly from verified availablePhysicalStockQty (allocatedUsableStockQty + deliveredReceivedQty - consumedIssuedQty)
 * WITHOUT requiring any supplier PO!
 */
export async function issueWarehouseStockResourcesAtomically(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    projectId: string;
    misNumber: string;
    activity: string;
    foremanId: string;
    warehousemanId: string;
    items: Array<{
      consolidatedBoqItemId: string;
      canonicalResourceId: string;
      uboqResourceRequirementId?: string;
      resourceUnit: string;
      requestedQty: number;
      releasedQty: number;
      warehouseLocationId: string;
      stockLotEvidenceId?: string | null;
    }>;
    idempotencyPrefix?: string;
  }
) {
  const prisma = prismaInput as PrismaClient;
  const resourceIds = params.items.map((i) => i.canonicalResourceId);
  return withLockedResourceAccountTx(prisma, resourceIds, async ({ tx, txId, lockedAccounts }) => {
    for (const item of params.items) {
      const acct = lockedAccounts.get(item.canonicalResourceId);
      if (!acct || acct.projectId !== params.projectId || acct.consolidatedBoqItemId !== item.consolidatedBoqItemId) {
        throw new Error(`UBOQ_ISSUANCE_RESOURCE_MISMATCH: Resource ${item.canonicalResourceId} invalid for project/work item`);
      }
      assertExactNormalizedUomMatch(item.resourceUnit, acct.resourceUomNormalized, 'WAREHOUSE_ISSUANCE');
      if (!item.warehouseLocationId?.trim()) {
        throw new Error('UBOQ_ISSUANCE_LOCATION_REQUIRED: warehouseLocationId is mandatory for governed issuance');
      }
      if (item.releasedQty <= 0 || item.releasedQty > acct.availablePhysicalStockQty + 0.0001) {
        throw new Error(
          `UBOQ_ISSUANCE_EXCEEDS_PHYSICAL_STOCK: Requested release (${item.releasedQty} ${acct.resourceUomNormalized}) exceeds available physical stock (${acct.availablePhysicalStockQty} ${acct.resourceUomNormalized})`
        );
      }
      if (item.stockLotEvidenceId) {
        const lot = await tx.uboqStockLotEvidence.findUnique({ where: { id: item.stockLotEvidenceId } });
        if (
          !lot ||
          lot.canonicalResourceId !== acct.id ||
          lot.conditionCode !== 'GOOD' ||
          lot.warehouseLocationId !== item.warehouseLocationId ||
          Number(lot.allocatedQty) - Number(lot.issuedQty) < item.releasedQty - 0.0001
        ) {
          throw new Error(`UBOQ_ISSUANCE_INVALID_STOCK_LOT: Stock lot ${item.stockLotEvidenceId} lacks usable GOOD balance at ${item.warehouseLocationId}`);
        }
      }
    }

    // Create MaterialIssuance in PENDING first, attach governed IssuanceItems, post ISSUANCE_CONSUME ledger, then mark RELEASED (satisfies trg_uboq_guard_parent_iss!)
    const issuance = await tx.materialIssuance.create({
      data: {
        misNumber: params.misNumber,
        status: 'PENDING',
        activity: params.activity,
        projectId: params.projectId,
        foremanId: params.foremanId,
        warehousemanId: params.warehousemanId,
        releasedById: params.warehousemanId,
        releaseDate: new Date(),
        items: {
          create: params.items.map((item) => {
            const acct = lockedAccounts.get(item.canonicalResourceId)!;
            const prrId = item.uboqResourceRequirementId ?? acct.activeApprovedPrId;
            if (!prrId) {
              throw new Error(`UBOQ_ISSUANCE_MISSING_PRR: No approved PRR lineage for resource ${acct.id}`);
            }
            return {
              consolidatedBoqItemId: item.consolidatedBoqItemId,
              canonicalResourceId: acct.id,
              uboqResourceRequirementId: prrId,
              resourceUnit: acct.resourceUomNormalized,
              requestedQty: item.requestedQty,
              releasedQty: item.releasedQty,
              warehouseLocationId: item.warehouseLocationId,
              stockLotEvidenceId: item.stockLotEvidenceId ?? null,
            };
          }),
        },
      },
      include: { items: true },
    });

    for (let idx = 0; idx < issuance.items.length; idx++) {
      const createdLine = issuance.items[idx];
      const inputLine = params.items[idx];
      const acct = lockedAccounts.get(createdLine.canonicalResourceId!)!;

      if (createdLine.stockLotEvidenceId) {
        await tx.uboqStockLotEvidence.update({
          where: { id: createdLine.stockLotEvidenceId },
          data: { issuedQty: { increment: createdLine.releasedQty } },
        });
      }

      const nextAcct = await applyLedgerDeltaOnLockedAccount(tx, txId, acct, {
        prrSnapshotId: createdLine.uboqResourceRequirementId,
        eventType: 'ISSUANCE_CONSUME',
        sourceModule: 'WAREHOUSE_ISSUANCE',
        sourceHeaderId: issuance.id,
        sourceLineId: createdLine.id,
        warehouseLocationId: inputLine.warehouseLocationId,
        conditionCode: 'GOOD',
        idempotencyKey: `${params.idempotencyPrefix ?? 'MIS_RELEASE'}:${issuance.id}:${createdLine.id}`,
        qtyDeltaConsumed: createdLine.releasedQty,
        actorUserId: params.warehousemanId,
        remarks: `Issued ${createdLine.releasedQty} ${acct.resourceUomNormalized} (${issuance.misNumber})`,
      });
      lockedAccounts.set(acct.id, nextAcct);
    }

    const releasedIssuance = await tx.materialIssuance.update({
      where: { id: issuance.id },
      data: { status: 'RELEASED' },
      include: { items: true },
    });

    return { issuance: releasedIssuance, accounts: Array.from(lockedAccounts.values()) };
  });
}
