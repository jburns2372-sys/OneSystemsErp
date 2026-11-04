import crypto from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { assertExactNormalizedUomMatch } from '../uom-registry';
import { applyLedgerDeltaOnLockedAccount, withLockedResourceAccountTx } from '../resource-ledger';

export interface GovernedMrfLineInput {
  readonly consolidatedBoqItemId: string;
  readonly quantity: number;
  readonly canonicalResourceId?: string | null;
  readonly uboqResourceRequirementId?: string | null;
  readonly resourceUnit?: string | null;
  readonly breakdownData?: unknown;
}

export async function isProjectOrItemsUboqGoverned(
  prismaInput: PrismaClient | { readonly project: unknown },
  projectId: string,
  consolidatedBoqItemIds: string[]
): Promise<boolean> {
  const prisma = prismaInput as PrismaClient;
  const proj = await prisma.project.findUnique({
    where: { id: projectId },
    select: { uboqGovernanceEnabled: true },
  });
  if (proj?.uboqGovernanceEnabled) return true;
  if (consolidatedBoqItemIds.length === 0) return false;
  const govCount = await prisma.consolidatedBOQItem.count({
    where: {
      id: { in: consolidatedBoqItemIds },
      isUboqResourceGoverned: true,
    },
  });
  return govCount > 0;
}

/**
 * Validates Class A MRF origination lines against active APPROVED PRRs (Correction 1, PRR-01..04).
 */
export async function validateAndNormalizeGovernedMrfLines(
  prismaInput: PrismaClient | { readonly project: unknown },
  projectId: string,
  lines: GovernedMrfLineInput[]
) {
  const prisma = prismaInput as PrismaClient;
  const normalized: Array<{
    consolidatedBoqItemId: string;
    quantity: number;
    canonicalResourceId: string;
    uboqResourceRequirementId: string;
    resourceUnit: string;
    breakdownData?: unknown;
  }> = [];

  for (const ln of lines) {
    if (!ln.canonicalResourceId) {
      throw new Error(
        `UBOQ_MISSING_RESOURCE_BINDING: MRF line on governed ConsolidatedBOQItem ${ln.consolidatedBoqItemId} requires canonicalResourceId (cannot request raw work-item m3 without resource takeoff)`
      );
    }

    const acct = await prisma.uboqCanonicalResourceAccount.findUnique({
      where: { id: ln.canonicalResourceId },
      include: { activeApprovedPr: true },
    });
    if (!acct || acct.projectId !== projectId || acct.consolidatedBoqItemId !== ln.consolidatedBoqItemId) {
      throw new Error(
        `UBOQ_CROSS_PROJECT_OR_CONSOLIDATED_MISMATCH: Resource account ${ln.canonicalResourceId} invalid for ConsolidatedBOQItem ${ln.consolidatedBoqItemId}`
      );
    }

    const targetPrrId = ln.uboqResourceRequirementId ?? acct.activeApprovedPrId;
    if (!targetPrrId || !acct.activeApprovedPr || acct.activeApprovedPrId !== targetPrrId || acct.activeApprovedPr.status !== 'APPROVED') {
      throw new Error(
        `UBOQ_INACTIVE_PRR_FOR_NEW_COMMITMENT: MRF origination requires active APPROVED PRR on resource ${acct.resourceCode} (got ${targetPrrId ?? 'NONE'})`
      );
    }

    const uom = assertExactNormalizedUomMatch(
      ln.resourceUnit || acct.resourceUomNormalized,
      acct.resourceUomNormalized,
      'MRF_CREATE'
    );

    if (ln.quantity <= 0 || ln.quantity > Number(acct.remainingProcurementQty) + 0.0001) {
      throw new Error(
        `UBOQ_CEILING_EXCEEDED: Requested MRF qty (${ln.quantity} ${uom}) exceeds remainingProcurementQty (${Number(acct.remainingProcurementQty)} ${uom}) on ${acct.resourceCode}`
      );
    }

    normalized.push({
      consolidatedBoqItemId: ln.consolidatedBoqItemId,
      quantity: ln.quantity,
      canonicalResourceId: acct.id,
      uboqResourceRequirementId: targetPrrId,
      resourceUnit: uom,
      breakdownData: ln.breakdownData,
    });
  }

  return normalized;
}

export function computeMrfValidationPassHash(mrId: string, snapshotVersion: number, items: Array<{ id: string; quantity: number; canonicalResourceId: string | null }>): string {
  const payload = items
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((i) => `${i.id}:${i.canonicalResourceId ?? 'LEG'}:${i.quantity}`)
    .join('|');
  return crypto.createHash('sha256').update(`${mrId}:v${snapshotVersion}:${payload}`).digest('hex');
}

/**
 * Atomically transitions a governed MaterialRequest status (APPROVED -> MRF_RESERVE; CANCELLED/REJECTED -> MRF_RELEASE)
 * under row-level FOR UPDATE lock with same-tx ledger proof (H1-01, H4-01).
 */
export async function transitionGovernedMrfStatusAtomically(
  prismaInput: PrismaClient | { readonly project: unknown },
  params: {
    mrId: string;
    newStatus: string;
    actorUserId: string;
    remarks?: string;
  }
) {
  const prisma = prismaInput as PrismaClient;
  const mrPre = await prisma.materialRequest.findUnique({
    where: { id: params.mrId },
    include: { items: true, project: { select: { id: true, uboqGovernanceEnabled: true } } },
  });
  if (!mrPre) throw new Error('Material Request not found');

  const govResourceIds = mrPre.items.map((i) => i.canonicalResourceId).filter((x): x is string => Boolean(x));
  if (govResourceIds.length === 0 && !mrPre.project.uboqGovernanceEnabled) {
    return null; // Legacy pass-through
  }

  if (params.newStatus === 'APPROVED' && mrPre.requesterId === params.actorUserId) {
    throw new Error('UBOQ_SOD_VIOLATION: MRF requester cannot self-approve MaterialRequest (VAL-20)');
  }

  return withLockedResourceAccountTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
    const mr = await tx.materialRequest.findUnique({
      where: { id: params.mrId },
      include: { items: true },
    });
    if (!mr) throw new Error('Material Request not found');
    if (mr.status === params.newStatus) return mr;

    if (params.newStatus === 'APPROVED' && mr.status !== 'APPROVED') {
      for (const item of mr.items) {
        if (!item.canonicalResourceId) continue;
        const acct = lockedAccounts.get(item.canonicalResourceId);
        if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

        // Class A: MRF approval requires active APPROVED PRR (Correction 1)
        if (!acct.activeApprovedPrId || item.uboqResourceRequirementId !== acct.activeApprovedPrId) {
          throw new Error(
            `UBOQ_SUPERSEDED_PRR_APPROVAL_BLOCKED: MRF item ${item.id} references superseded/inactive PRR ${item.uboqResourceRequirementId}; re-align to active PRR ${acct.activeApprovedPrId}`
          );
        }

        const reqQty = item.approvedQuantity ?? item.quantity;
        if (reqQty <= 0 || reqQty > acct.remainingProcurementQty + 0.0001) {
          throw new Error(
            `UBOQ_MRF_APPROVAL_CEILING_EXCEEDED: Cannot reserve ${reqQty} ${acct.resourceUomNormalized} on ${acct.resourceCode}; remainingProcurementQty=${acct.remainingProcurementQty}`
          );
        }

        const nextAcct = await applyLedgerDeltaOnLockedAccount(tx, txId, acct, {
          prrSnapshotId: item.uboqResourceRequirementId,
          eventType: 'MRF_RESERVE',
          sourceModule: 'MRF_WORKFLOW',
          sourceHeaderId: mr.id,
          sourceLineId: item.id,
          idempotencyKey: `MRF_RESERVE:${mr.id}:${item.id}`,
          qtyDeltaOpenMr: reqQty,
          actorUserId: params.actorUserId,
          remarks: params.remarks ?? `Reserved ${reqQty} ${acct.resourceUomNormalized} on MRF ${mr.mrNumber}`,
        });
        lockedAccounts.set(acct.id, nextAcct);

        await tx.materialRequestItem.update({
          where: { id: item.id },
          data: { approvedQuantity: reqQty },
        });
      }
    } else if (
      mr.status === 'APPROVED' &&
      ['CANCELLED', 'REJECTED', 'VOID'].includes(params.newStatus)
    ) {
      for (const item of mr.items) {
        if (!item.canonicalResourceId) continue;
        const acct = lockedAccounts.get(item.canonicalResourceId);
        if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

        const unallocatedMrQty = Math.max(
          0,
          Number(((item.approvedQuantity ?? item.quantity) - (item.poAllocatedQty ?? 0)).toFixed(4))
        );
        if (unallocatedMrQty > 0) {
          const nextAcct = await applyLedgerDeltaOnLockedAccount(tx, txId, acct, {
            prrSnapshotId: item.uboqResourceRequirementId,
            eventType: 'MRF_RELEASE',
            sourceModule: 'MRF_WORKFLOW',
            sourceHeaderId: mr.id,
            sourceLineId: item.id,
            idempotencyKey: `MRF_RELEASE:${mr.id}:${item.id}:${params.newStatus}`,
            qtyDeltaOpenMr: -unallocatedMrQty,
            actorUserId: params.actorUserId,
            remarks: `Released ${unallocatedMrQty} ${acct.resourceUomNormalized} on MRF ${mr.mrNumber} (${params.newStatus})`,
          });
          lockedAccounts.set(acct.id, nextAcct);
        }
      }
    }

    return tx.materialRequest.update({
      where: { id: mr.id },
      data: {
        status: params.newStatus,
        ...(params.newStatus === 'APPROVED' ? { approverId: params.actorUserId } : {}),
        ...(params.remarks ? { remarks: params.remarks } : {}),
      },
      include: { items: true },
    });
  });
}
