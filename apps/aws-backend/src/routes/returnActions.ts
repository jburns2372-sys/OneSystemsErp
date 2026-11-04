// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  assertBackendProjectAccess,
  postBackendResourceLedgerDelta,
  withBackendLockedAccountsTx,
} from '../lib/uboq/backendResourceGuard';

const prisma = new PrismaClient();

const router = Router();

function getPbacContext(req: any) {
  return {
    userId: (req.user?.id || req.headers['x-user-session']) as string | undefined,
    userRole: req.user?.role as string | undefined,
  };
}

router.post('/createMaterialReturn', async (req, res) => {
  try {
    const { data } = req.body; // Original function takes 'data' as a single argument
    const { issuanceId, projectId, foremanId, items } = data;
    const { userId, userRole } = getPbacContext(req);

    if (userId && projectId) {
      await assertBackendProjectAccess(prisma, userId, userRole, projectId);
    }

    const issuance = await prisma.materialIssuance.findUnique({
      where: { id: issuanceId },
      include: {
        items: { include: { returnItems: true } },
      },
    });
    if (!issuance || issuance.projectId !== projectId) {
      return res.status(400).json({ success: false, error: 'UBOQ_INVALID_ISSUANCE_REFERENCE: Issuance slip not found for project' });
    }

    const issItemMap = new Map(issuance.items.map((ii) => [ii.id, ii]));
    const returnItemsPayload: any[] = [];

    for (const item of items) {
      const issItem = issItemMap.get(item.issuanceItemId);
      if (!issItem) {
        return res.status(400).json({ success: false, error: `IssuanceItem ${item.issuanceItemId} not found` });
      }
      const prevReturned = issItem.returnItems.reduce((s, r) => s + Number(r.returnedQty), 0);
      if (item.returnedQty <= 0 || prevReturned + item.returnedQty > Number(issItem.releasedQty) + 0.0001) {
        return res.status(409).json({
          success: false,
          error: `UBOQ_RETURN_EXCEEDS_ISSUED_QTY: Returned qty (${prevReturned + item.returnedQty}) exceeds released qty (${issItem.releasedQty})`,
        });
      }
      returnItemsPayload.push({
        returnedQty: item.returnedQty,
        condition: (item.condition || 'GOOD').toUpperCase(),
        issuanceItemId: item.issuanceItemId,
        consolidatedBoqItemId: issItem.consolidatedBoqItemId,
        canonicalResourceId: issItem.canonicalResourceId || null,
        uboqResourceRequirementId: issItem.uboqResourceRequirementId || null,
        resourceUnit: issItem.resourceUnit || null,
        warehouseLocationId: item.warehouseLocationId || issItem.warehouseLocationId || null,
      });
    }

    // Generate MRS number (Material Return Slip)
    const count = await prisma.materialReturn.count();
    const mrsNumber = `MRS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

    const newReturn = await prisma.materialReturn.create({
      data: {
        mrsNumber,
        issuanceId,
        projectId,
        foremanId,
        items: {
          create: returnItemsPayload,
        }
      },
      include: { items: true }
    });

    res.json({ success: true, data: newReturn });
  } catch (error: any) {
    console.error('Error creating material return (AWS):', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to create return slip' });
  }
});

// Safeguard I-02 & STK-OPEN-02: Processes GOOD returns (restoring usable physical stock) vs DAMAGED returns (quarantined without restoring usable stock),
// remaining valid even after historic PO status is COMPLETED or PRR is SUPERSEDED!
router.post('/processMaterialReturn', async (req, res) => {
  try {
    const { returnId, warehousemanId } = req.body;
    const { userId, userRole } = getPbacContext(req);

    const materialReturn = await prisma.materialReturn.findUnique({
      where: { id: returnId },
      include: { items: { include: { issuanceItem: true } } }
    });

    if (!materialReturn) throw new Error('Return slip not found');
    if (materialReturn.status === 'COMPLETED') throw new Error('Return slip already completed');

    if (userId) {
      await assertBackendProjectAccess(prisma, userId, userRole, materialReturn.projectId);
    }

    const govResourceIds = materialReturn.items
      .map((i) => i.canonicalResourceId)
      .filter((x): x is string => Boolean(x));

    if (govResourceIds.length > 0) {
      const updatedReturn = await withBackendLockedAccountsTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
        for (const item of materialReturn.items) {
          if (!item.canonicalResourceId) continue;
          const acct = lockedAccounts.get(item.canonicalResourceId);
          if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

          const isGood = (item.condition || 'GOOD').toUpperCase() === 'GOOD';
          if (isGood) {
            if (item.returnedQty > acct.consumedIssuedQty + 0.0001) {
              throw new Error(`UBOQ_RETURN_EXCEEDS_CONSUMED: Cannot restore ${item.returnedQty} > consumed ${acct.consumedIssuedQty}`);
            }
            if (item.issuanceItem?.stockLotEvidenceId) {
              await tx.uboqStockLotEvidence.update({
                where: { id: item.issuanceItem.stockLotEvidenceId },
                data: { issuedQty: { decrement: Number(item.returnedQty) } },
              });
            }
            const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
              prrSnapshotId: item.uboqResourceRequirementId,
              eventType: 'RETURN_GOOD_RESTORE',
              sourceModule: 'MATERIAL_RETURN',
              sourceHeaderId: materialReturn.id,
              sourceLineId: item.id,
              warehouseLocationId: item.warehouseLocationId || 'WH-MAIN',
              conditionCode: 'GOOD',
              idempotencyKey: `RETURN_GOOD:${materialReturn.id}:${item.id}`,
              qtyDeltaConsumed: -Number(item.returnedQty),
              actorUserId: warehousemanId || userId || materialReturn.foremanId,
              remarks: `Restored ${item.returnedQty} ${acct.resourceUomNormalized} GOOD return (${materialReturn.mrsNumber})`,
            });
            lockedAccounts.set(acct.id, nextAcct);
          } else {
            // DAMAGED / SCRAP return: quarantined into damagedReturnedQty; NEVER inflates availablePhysicalStockQty!
            const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
              prrSnapshotId: item.uboqResourceRequirementId,
              eventType: 'RETURN_DAMAGED_QUARANTINE',
              sourceModule: 'MATERIAL_RETURN',
              sourceHeaderId: materialReturn.id,
              sourceLineId: item.id,
              warehouseLocationId: item.warehouseLocationId || 'WH-QUARANTINE',
              conditionCode: item.condition.toUpperCase(),
              idempotencyKey: `RETURN_DAMAGED:${materialReturn.id}:${item.id}`,
              qtyDeltaDamaged: Number(item.returnedQty),
              actorUserId: warehousemanId || userId || materialReturn.foremanId,
              remarks: `Quarantined ${item.returnedQty} ${acct.resourceUomNormalized} ${item.condition} return (${materialReturn.mrsNumber})`,
            });
            lockedAccounts.set(acct.id, nextAcct);
          }
        }

        // Complete MaterialReturn AFTER ledger entry exists in same tx (satisfies trg_uboq_guard_parent_ret!)
        const completed = await tx.materialReturn.update({
          where: { id: returnId },
          data: {
            status: 'COMPLETED',
            warehousemanId,
            receiveDate: new Date()
          }
        });

        await tx.materialIssuance.update({
          where: { id: materialReturn.issuanceId },
          data: { status: 'COMPLETED' }
        });

        return completed;
      });

      return res.json({ success: true, data: updatedReturn });
    }

    // Legacy non-governed return path
    for (const item of materialReturn.items) {
      if (item.condition === 'GOOD') {
        await prisma.consolidatedBOQItem.update({
          where: { id: item.consolidatedBoqItemId },
          data: {
            consumedQty: { decrement: Number(item.returnedQty) }
          }
        });
      }
    }

    const updatedReturn = await prisma.materialReturn.update({
      where: { id: returnId },
      data: {
        status: 'COMPLETED',
        warehousemanId,
        receiveDate: new Date()
      }
    });

    await prisma.materialIssuance.update({
      where: { id: materialReturn.issuanceId },
      data: { status: 'COMPLETED' }
    });

    res.json({ success: true, data: updatedReturn });
  } catch (error: any) {
    console.error('Error processing material return (AWS):', error);
    const msg = error.message || 'Failed to process return slip';
    const status = msg.includes('UBOQ_PBAC') ? 403 : msg.includes('UBOQ_') ? 409 : 500;
    res.status(status).json({ success: false, error: msg });
  }
});

export default router;
