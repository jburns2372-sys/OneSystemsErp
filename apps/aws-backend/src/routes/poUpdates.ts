// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { backendPrisma } from '../lib/prismaRls';
import {
  assertBackendProjectAccess,
  postBackendResourceLedgerDelta,
  withBackendLockedAccountsTx,
} from '../lib/uboq/backendResourceGuard';

const prisma = backendPrisma; // Assuming prisma client is configured and available in your AWS backend

const router = Router();

router.post('/updatePOStatus', async (req, res) => {
  try {
    const { poId, status, approverId } = req.body; // approverId will be sent by the Next.js action if status is 'ISSUED'
    const actorUserId = req.user?.id || approverId;
    const actorRole = req.user?.role;

    if (!poId || !status) {
      return res.status(400).json({ success: false, error: 'Missing poId or status' });
    }

    const existingPo = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
        mr: { select: { projectId: true } },
        canvassForm: { select: { projectId: true } },
      },
    });
    if (!existingPo) {
      return res.status(404).json({ success: false, error: 'Purchase Order not found' });
    }

    const projectId = existingPo.mr?.projectId ?? existingPo.canvassForm?.projectId;
    if (projectId && req.user?.id) {
      await assertBackendProjectAccess(prisma, req.user.id, actorRole, projectId);
    }

    const govResourceIds = existingPo.items
      .map((i) => i.canonicalResourceId)
      .filter((x): x is string => Boolean(x));

    if (govResourceIds.length > 0) {
      if (status === 'APPROVED') {
        return res.status(409).json({
          success: false,
          error: 'UBOQ_USE_DEDICATED_PO_APPROVAL: Governed PO approval must run via /api/procurement/po/:poId/approve',
        });
      }
      if (status === 'ISSUED' && !existingPo.approvedAt && existingPo.status !== 'APPROVED') {
        return res.status(409).json({
          success: false,
          error: 'UBOQ_UNAPPROVED_PO_PROGRESSION: Governed PO must be APPROVED before transition to ISSUED',
        });
      }
      if (
        ['CANCELLED', 'CLOSED_SHORT', 'VOID'].includes(status) &&
        ['APPROVED', 'ISSUED', 'PARTIAL_DELIVERY'].includes(existingPo.status)
      ) {
        await withBackendLockedAccountsTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
          const freshPo = await tx.purchaseOrder.findUnique({
            where: { id: poId },
            include: { items: true },
          });
          for (const item of freshPo.items) {
            if (!item.canonicalResourceId) continue;
            const acct = lockedAccounts.get(item.canonicalResourceId);
            if (!acct) continue;
            const undeliveredOpenQty = Math.max(
              0,
              Number((item.quantity - (item.deliveredApprovedQty ?? 0)).toFixed(4))
            );
            if (undeliveredOpenQty > 0) {
              const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
                prrSnapshotId: item.uboqResourceRequirementId,
                eventType: 'PO_CLOSE_SHORT',
                sourceModule: 'PO_UPDATES',
                sourceHeaderId: freshPo.id,
                sourceLineId: item.id,
                poItemLineageId: item.id,
                idempotencyKey: `PO_CLOSE_SHORT:${freshPo.id}:${item.id}:${status}`,
                qtyDeltaOpenPo: -undeliveredOpenQty,
                unitCostSnapshot: item.unitCost,
                actorUserId: actorUserId || 'system',
                remarks: `Released ${undeliveredOpenQty} ${acct.resourceUomNormalized} on PO ${freshPo.poNumber} (${status})`,
              });
              lockedAccounts.set(acct.id, nextAcct);
            }
          }
          await tx.purchaseOrder.update({
            where: { id: poId },
            data: { status },
          });
        });
        return res.json({ success: true });
      }
    }

    const data: any = { status };

    if (status === 'ISSUED') {
      if (!approverId) {
        return res.status(400).json({ success: false, error: 'approverId is required for ISSUED status' });
      }
      data.approverId = approverId; // The Project Director approves
    }

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating PO status:', error);
    const code = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(code).json({ success: false, error: error.message || 'Internal Server Error' });
  }
});

export default router;
