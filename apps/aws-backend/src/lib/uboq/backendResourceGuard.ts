import type { Prisma, PrismaClient, UboqLedgerEventType } from '@prisma/client';

const MAX_TX_RETRIES = 2;
const GLOBAL_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRESIDENT', 'VP_OPERATIONS']);

export interface BackendLockedAccount {
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

const BACKEND_UOM_MAP: Record<string, string> = {
  'cu.m': 'm3',
  'cum': 'm3',
  'm3': 'm3',
  'cubic meter': 'm3',
  'sq.m': 'm2',
  'sqm': 'm2',
  'm2': 'm2',
  'kg': 'kg',
  'kgs': 'kg',
  'ton': 't',
  'mt': 't',
  'm': 'm',
  'lm': 'm',
  'pc': 'pc',
  'pcs': 'pc',
  'bag_40kg': 'bag_40kg',
  'bag (40kg)': 'bag_40kg',
  '40kg bag': 'bag_40kg',
  'bags': 'bag_40kg',
  'bag': 'bag_40kg',
  'bag_50kg': 'bag_50kg',
  'lot': 'lot',
  'ls': 'ls',
};

export function normalizeBackendUom(raw: string): string {
  const cleaned = String(raw || '').trim().toLowerCase();
  return BACKEND_UOM_MAP[cleaned] || cleaned;
}

export function computeBackendAccountBalances(s: {
  activeApprovedQty: number;
  allocatedUsableStockQty: number;
  openMrReservedQty: number;
  openCommittedPoQty: number;
  deliveredReceivedQty: number;
  consumedIssuedQty: number;
}) {
  const availablePhysicalStockQty = round4(
    s.allocatedUsableStockQty + s.deliveredReceivedQty - s.consumedIssuedQty
  );
  const covered = round4(
    s.allocatedUsableStockQty + s.openMrReservedQty + s.openCommittedPoQty + s.deliveredReceivedQty
  );
  const rawRem = round4(s.activeApprovedQty - covered);
  if (rawRem >= -0.00005) {
    return {
      availablePhysicalStockQty: Math.max(0, availablePhysicalStockQty),
      remainingProcurementQty: Math.max(0, rawRem),
      isOvercommittedByRevision: false,
      overcommittedQty: 0,
    };
  }
  return {
    availablePhysicalStockQty: Math.max(0, availablePhysicalStockQty),
    remainingProcurementQty: 0,
    isOvercommittedByRevision: true,
    overcommittedQty: round4(Math.abs(rawRem)),
  };
}

export async function assertBackendProjectAccess(
  prisma: PrismaClient | Prisma.TransactionClient,
  userId: string | undefined,
  userRole: string | undefined,
  projectId: string
): Promise<void> {
  if (!userId || !projectId) {
    throw new Error('UBOQ_PBAC_UNAUTHORIZED: Missing user or project context');
  }
  const normRole = (userRole || '').trim().toUpperCase();
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true },
  });
  if (!project) {
    throw new Error(`UBOQ_PROJECT_NOT_FOUND: Project ${projectId} not found`);
  }
  if (GLOBAL_ADMIN_ROLES.has(normRole) || project.managerId === userId) {
    return;
  }
  const assign = await prisma.projectUserAssignment.findFirst({
    where: {
      userId,
      projectId,
      assignmentStatus: { in: ['active', 'ACTIVE'] },
    },
    select: { id: true },
  });
  if (!assign) {
    throw new Error(`UBOQ_PBAC_PROJECT_ACCESS_DENIED: User ${userId} has no active assignment on project ${projectId}`);
  }
}

export async function withBackendLockedAccountsTx<T>(
  prisma: PrismaClient,
  canonicalResourceIds: string[],
  fn: (ctx: {
    tx: Prisma.TransactionClient;
    txId: string;
    lockedAccounts: Map<string, BackendLockedAccount>;
  }) => Promise<T>
): Promise<T> {
  const sortedIds = [...new Set(canonicalResourceIds.filter(Boolean))].sort();
  let attempt = 0;

  while (true) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await tx.$executeRawUnsafe(`SET LOCAL lock_timeout = '3000ms'`);
          const txRows = await tx.$queryRaw<Array<{ tx_id: string }>>`SELECT pg_current_xact_id()::text AS tx_id`;
          const txId = txRows[0]?.tx_id ?? String(Date.now());

          const lockedAccounts = new Map<string, BackendLockedAccount>();
          if (sortedIds.length > 0) {
            const rows = await tx.$queryRaw<Array<Record<string, unknown>>>`
              SELECT *
              FROM "UboqCanonicalResourceAccount"
              WHERE id = ANY(${sortedIds}::text[])
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
      const msg = String((err as Error)?.message ?? '');
      const code = (err as { code?: string; meta?: { code?: string } })?.meta?.code ?? (err as { code?: string })?.code ?? '';
      const retryable =
        code === '40P01' ||
        code === '40001' ||
        code === '55P03' ||
        code === 'P2034' ||
        /deadlock detected|could not serialize|lock timeout/i.test(msg);
      if (attempt < MAX_TX_RETRIES && retryable) {
        attempt++;
        await new Promise((r) => setTimeout(r, 40 + Math.floor(Math.random() * 80) * attempt));
        continue;
      }
      throw err;
    }
  }
}

export async function postBackendResourceLedgerDelta(
  tx: Prisma.TransactionClient,
  txId: string,
  acct: BackendLockedAccount,
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
    unitCostSnapshot?: number | null;
    actorUserId: string;
    remarks?: string | null;
  }
): Promise<BackendLockedAccount> {
  const dup = await tx.uboqResourceLedgerEntry.findUnique({
    where: { idempotencyKey: entry.idempotencyKey },
  });
  if (dup) return acct;

  const nextApproved = round4(acct.activeApprovedQty + (entry.qtyDeltaApproved ?? 0));
  const nextAlloc = round4(acct.allocatedUsableStockQty + (entry.qtyDeltaAllocatedStock ?? 0));
  const nextOpenMr = round4(acct.openMrReservedQty + (entry.qtyDeltaOpenMr ?? 0));
  const nextOpenPo = round4(acct.openCommittedPoQty + (entry.qtyDeltaOpenPo ?? 0));
  const nextDeliv = round4(acct.deliveredReceivedQty + (entry.qtyDeltaDelivered ?? 0));
  const nextCons = round4(acct.consumedIssuedQty + (entry.qtyDeltaConsumed ?? 0));
  const nextDmg = round4(acct.damagedReturnedQty + (entry.qtyDeltaDamaged ?? 0));

  if (
    nextApproved < -0.0001 ||
    nextAlloc < -0.0001 ||
    nextOpenMr < -0.0001 ||
    nextOpenPo < -0.0001 ||
    nextDeliv < -0.0001 ||
    nextCons < -0.0001 ||
    nextDmg < -0.0001
  ) {
    throw new Error(`UBOQ_LEDGER_NEGATIVE_BUCKET_BLOCKED [${entry.eventType}] on ${acct.resourceCode}`);
  }

  const availRaw = round4(nextAlloc + nextDeliv - nextCons);
  if (availRaw < -0.0001) {
    throw new Error(`UBOQ_INSUFFICIENT_PHYSICAL_STOCK [${entry.eventType}] on ${acct.resourceCode}`);
  }

  const bal = computeBackendAccountBalances({
    activeApprovedQty: Math.max(0, nextApproved),
    allocatedUsableStockQty: Math.max(0, nextAlloc),
    openMrReservedQty: Math.max(0, nextOpenMr),
    openCommittedPoQty: Math.max(0, nextOpenPo),
    deliveredReceivedQty: Math.max(0, nextDeliv),
    consumedIssuedQty: Math.max(0, nextCons),
  });

  await tx.uboqCanonicalResourceAccount.update({
    where: { id: acct.id },
    data: {
      activeApprovedQty: Math.max(0, nextApproved),
      allocatedUsableStockQty: Math.max(0, nextAlloc),
      openMrReservedQty: Math.max(0, nextOpenMr),
      openCommittedPoQty: Math.max(0, nextOpenPo),
      deliveredReceivedQty: Math.max(0, nextDeliv),
      consumedIssuedQty: Math.max(0, nextCons),
      damagedReturnedQty: Math.max(0, nextDmg),
      availablePhysicalStockQty: bal.availablePhysicalStockQty,
      remainingProcurementQty: bal.remainingProcurementQty,
      isOvercommittedByRevision: bal.isOvercommittedByRevision,
      overcommittedQty: bal.overcommittedQty,
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
      balanceAvailableStockAfter: bal.availablePhysicalStockQty,
      balanceRemainingProcureAfter: bal.remainingProcurementQty,
      unitCostSnapshot: entry.unitCostSnapshot ?? null,
      actorUserId: entry.actorUserId,
      remarks: entry.remarks ?? null,
    },
  });

  return {
    ...acct,
    activeApprovedQty: Math.max(0, nextApproved),
    allocatedUsableStockQty: Math.max(0, nextAlloc),
    openMrReservedQty: Math.max(0, nextOpenMr),
    openCommittedPoQty: Math.max(0, nextOpenPo),
    deliveredReceivedQty: Math.max(0, nextDeliv),
    consumedIssuedQty: Math.max(0, nextCons),
    damagedReturnedQty: Math.max(0, nextDmg),
    availablePhysicalStockQty: bal.availablePhysicalStockQty,
    remainingProcurementQty: bal.remainingProcurementQty,
    isOvercommittedByRevision: bal.isOvercommittedByRevision,
    overcommittedQty: bal.overcommittedQty,
    rowVersion: acct.rowVersion + 1,
  };
}
