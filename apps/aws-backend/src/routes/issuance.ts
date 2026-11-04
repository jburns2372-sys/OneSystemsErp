// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { backendPrisma } from '../lib/prismaRls';
import { validateTransactionWithAI } from '../lib/aiValidation';
import {
  assertBackendProjectAccess,
  postBackendResourceLedgerDelta,
  withBackendLockedAccountsTx,
} from '../lib/uboq/backendResourceGuard';

const router = Router();
const prisma = backendPrisma;

function getPbacContext(req: any) {
  return {
    userId: (req.user?.id || req.headers['x-user-session']) as string | undefined,
    userRole: req.user?.role as string | undefined,
    activeProjectId: req.headers['x-active-project-id'] as string | undefined,
    simulatedRole: req.headers['x-simulated-role'] as string | undefined,
  };
}

router.get('/consolidated-items/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, userRole } = getPbacContext(req);
    if (userId) {
      await assertBackendProjectAccess(prisma, userId, userRole, projectId);
    }

    const items = await prisma.consolidatedBOQItem.findMany({
      where: { projectId },
      include: {
        uboqCanonicalAccounts: {
          include: { stockLots: { where: { conditionCode: 'GOOD' } } },
        },
      },
      orderBy: { description: 'asc' }
    });

    // Safeguard I-01: Surface UBOQ Canonical Resource Accounts with positive availablePhysicalStockQty
    // (including verified opening stock BEFORE any supplier PO exists!), alongside legacy non-governed items.
    const availableItems: any[] = [];
    for (const item of items) {
      if (item.isUboqResourceGoverned || item.uboqCanonicalAccounts.length > 0) {
        for (const acct of item.uboqCanonicalAccounts) {
          if (Number(acct.availablePhysicalStockQty) > 0) {
            availableItems.push({
              ...item,
              canonicalResourceId: acct.id,
              uboqResourceRequirementId: acct.activeApprovedPrId,
              resourceCode: acct.resourceCode,
              resourceDescription: acct.resourceDescription,
              resourceSpec: acct.resourceSpec,
              resourceUnit: acct.resourceUomNormalized,
              availablePhysicalStockQty: Number(acct.availablePhysicalStockQty),
              allocatedUsableStockQty: Number(acct.allocatedUsableStockQty),
              deliveredReceivedQty: Number(acct.deliveredReceivedQty),
              consumedIssuedQty: Number(acct.consumedIssuedQty),
              stockLots: acct.stockLots,
            });
          }
        }
      } else if (item.deliveredQty > item.consumedQty) {
        availableItems.push(item);
      }
    }

    res.json({ success: true, data: availableItems });
  } catch (error: any) {
    console.error('Error fetching consolidated items:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to fetch items' });
  }
});

// Safeguard I-01: Supports pre-first-PO warehouse issuance from verified usable opening stock OR delivered PO stock!
router.post('/create', async (req, res) => {
  try {
    const data = req.body;
    const { userId, userRole } = getPbacContext(req);

    if (userId && data.projectId) {
      await assertBackendProjectAccess(prisma, userId, userRole, data.projectId);
    }

    const boqIds = (data.items || []).map((i: any) => i.consolidatedBoqItemId);
    const boqMap = new Map(
      (await prisma.consolidatedBOQItem.findMany({ where: { id: { in: boqIds } } })).map((b) => [b.id, b])
    );

    const hasGovernedItems = (data.items || []).some(
      (i: any) => Boolean(i.canonicalResourceId) || Boolean(boqMap.get(i.consolidatedBoqItemId)?.isUboqResourceGoverned)
    );

    const createLines: any[] = [];
    if (hasGovernedItems) {
      for (const item of data.items) {
        if (!item.canonicalResourceId) {
          return res.status(409).json({
            success: false,
            error: `UBOQ_ISSUANCE_MISSING_RESOURCE: Governed item ${item.consolidatedBoqItemId} requires canonicalResourceId`,
          });
        }
        const acct = await prisma.uboqCanonicalResourceAccount.findUnique({
          where: { id: item.canonicalResourceId },
        });
        if (!acct || acct.projectId !== data.projectId || acct.consolidatedBoqItemId !== item.consolidatedBoqItemId) {
          return res.status(409).json({
            success: false,
            error: `UBOQ_ISSUANCE_INVALID_RESOURCE: CanonicalResourceAccount ${item.canonicalResourceId} invalid for project/BOQ item`,
          });
        }
        const prrId = item.uboqResourceRequirementId || acct.activeApprovedPrId;
        if (!prrId) {
          return res.status(409).json({
            success: false,
            error: `UBOQ_ISSUANCE_NO_APPROVED_PRR: Resource ${acct.resourceCode} lacks approved PRR lineage`,
          });
        }
        if (item.resourceUnit && item.resourceUnit !== acct.resourceUomNormalized) {
          return res.status(409).json({
            success: false,
            error: `UBOQ_RESOURCE_UOM_MISMATCH: Issuance unit (${item.resourceUnit}) != ${acct.resourceUomNormalized}`,
          });
        }
        if (item.requestedQty <= 0 || item.requestedQty > Number(acct.availablePhysicalStockQty) + 0.0001) {
          return res.status(409).json({
            success: false,
            error: `UBOQ_ISSUANCE_EXCEEDS_PHYSICAL_STOCK: Requested ${item.requestedQty} ${acct.resourceUomNormalized} exceeds available physical stock (${Number(acct.availablePhysicalStockQty)})`,
          });
        }
        if (item.stockLotEvidenceId) {
          const lot = await prisma.uboqStockLotEvidence.findUnique({ where: { id: item.stockLotEvidenceId } });
          if (
            !lot ||
            lot.canonicalResourceId !== acct.id ||
            lot.conditionCode !== 'GOOD' ||
            Number(lot.allocatedQty) - Number(lot.issuedQty) < item.requestedQty - 0.0001
          ) {
            return res.status(409).json({
              success: false,
              error: `UBOQ_ISSUANCE_UNUSABLE_STOCK_LOT: Stock lot ${item.stockLotEvidenceId} is missing, non-GOOD, or insufficient`,
            });
          }
        }
        createLines.push({
          consolidatedBoqItemId: item.consolidatedBoqItemId,
          requestedQty: item.requestedQty,
          canonicalResourceId: acct.id,
          uboqResourceRequirementId: prrId,
          resourceUnit: acct.resourceUomNormalized,
          warehouseLocationId: item.warehouseLocationId || 'WH-MAIN',
          stockLotEvidenceId: item.stockLotEvidenceId || null,
        });
      }
    } else {
      const validation = await validateTransactionWithAI(
        'Material Issuance',
        {
          action: 'Create Material Issuance Slip',
          projectId: data.projectId,
          activity: data.activity,
          itemsRequested: data.items
        },
        data.foremanId || userId || 'unknown',
        'USER'
      );

      if (validation.validationStatus === 'BLOCKING ISSUE') {
        return res.json({ 
          success: false, 
          error: `AI Blocked Transaction: ${validation.findings}`,
          validationLogId: validation.validationLogId 
        });
      }

      for (const item of data.items) {
        createLines.push({
          consolidatedBoqItemId: item.consolidatedBoqItemId,
          requestedQty: item.requestedQty,
        });
      }
    }

    const count = await prisma.materialIssuance.count();
    const misNumber = `MIS-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-${Date.now().toString().slice(-4)}`;

    const issuance = await prisma.materialIssuance.create({
      data: {
        misNumber,
        projectId: data.projectId,
        foremanId: data.foremanId,
        activity: data.activity,
        items: {
          create: createLines
        }
      },
      include: { items: true }
    });

    res.json({ success: true, issuance });
  } catch (error: any) {
    console.error('Error creating issuance slip:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to create issuance slip' });
  }
});

router.post('/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { warehousemanId, itemsData } = req.body;
    const { userId, userRole } = getPbacContext(req);

    const slip = await prisma.materialIssuance.findUnique({ where: { id } });
    if (!slip) return res.status(404).json({ success: false, error: 'Slip not found' });
    if (userId) {
      await assertBackendProjectAccess(prisma, userId, userRole, slip.projectId);
    }

    await prisma.$transaction(async (tx) => {
      for (const item of itemsData) {
        await tx.issuanceItem.update({
          where: { id: item.id },
          data: {
            releasedQty: item.releasedQty,
            ...(item.warehouseLocationId ? { warehouseLocationId: item.warehouseLocationId } : {}),
            ...(item.stockLotEvidenceId ? { stockLotEvidenceId: item.stockLotEvidenceId } : {}),
          }
        });
      }

      await tx.materialIssuance.update({
        where: { id },
        data: {
          status: 'PROCESSED',
          warehousemanId: warehousemanId
        }
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error processing issuance:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to process issuance' });
  }
});

// Safeguard I-01: Approves & releases warehouse stock from availablePhysicalStockQty (allocatedUsableStockQty + deliveredReceivedQty - consumedIssuedQty)
// WITHOUT requiring any previously approved supplier PO!
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { accountantId } = req.body;
    const { userId, userRole } = getPbacContext(req);

    const preSlip = await prisma.materialIssuance.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!preSlip) return res.status(404).json({ success: false, error: 'Slip not found' });
    if (preSlip.status !== 'PROCESSED') return res.status(400).json({ success: false, error: 'Slip must be processed first' });

    const actorId = userId || accountantId;
    if (userId) {
      await assertBackendProjectAccess(prisma, userId, userRole, preSlip.projectId);
    }

    const govResourceIds = preSlip.items
      .map((i) => i.canonicalResourceId)
      .filter((x): x is string => Boolean(x));

    if (govResourceIds.length > 0) {
      await withBackendLockedAccountsTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
        const slip = await tx.materialIssuance.findUnique({
          where: { id },
          include: { items: true },
        });
        if (!slip || slip.status !== 'PROCESSED') throw new Error('Slip must be processed first');

        for (const item of slip.items) {
          if (!item.canonicalResourceId) continue;
          const acct = lockedAccounts.get(item.canonicalResourceId);
          if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

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
              Number(lot.allocatedQty) - Number(lot.issuedQty) < item.releasedQty - 0.0001
            ) {
              throw new Error(`UBOQ_ISSUANCE_INVALID_STOCK_LOT: Lot ${item.stockLotEvidenceId} lacks usable GOOD stock`);
            }
            await tx.uboqStockLotEvidence.update({
              where: { id: lot.id },
              data: { issuedQty: { increment: item.releasedQty } },
            });
          }

          const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
            prrSnapshotId: item.uboqResourceRequirementId,
            eventType: 'ISSUANCE_CONSUME',
            sourceModule: 'MATERIAL_ISSUANCE',
            sourceHeaderId: slip.id,
            sourceLineId: item.id,
            warehouseLocationId: item.warehouseLocationId || 'WH-MAIN',
            conditionCode: 'GOOD',
            idempotencyKey: `ISSUANCE_CONSUME:${slip.id}:${item.id}`,
            qtyDeltaConsumed: Number(item.releasedQty),
            actorUserId: actorId || slip.warehousemanId || slip.foremanId,
            remarks: `Released ${item.releasedQty} ${acct.resourceUomNormalized} on ${slip.misNumber}`,
          });
          lockedAccounts.set(acct.id, nextAcct);
        }

        // Update header AFTER ISSUANCE_CONSUME ledger entry exists in same tx (satisfies trg_uboq_guard_parent_iss!)
        await tx.materialIssuance.update({
          where: { id },
          data: {
            status: 'RELEASED',
            accountantId: accountantId,
            releaseDate: new Date(),
            releasedById: accountantId
          }
        });
      });

      return res.json({ success: true });
    }

    await prisma.$transaction(async (tx) => {
      const slip = await tx.materialIssuance.findUnique({
        where: { id },
        include: { items: true }
      });

      if (!slip) throw new Error('Slip not found');
      if (slip.status !== 'PROCESSED') throw new Error('Slip must be processed first');

      for (const item of slip.items) {
        const boqItem = await tx.consolidatedBOQItem.findUnique({
          where: { id: item.consolidatedBoqItemId }
        });

        if (!boqItem) throw new Error('BOQ Item not found');

        const available = boqItem.deliveredQty - boqItem.consumedQty;
        if (item.releasedQty > available) {
          throw new Error(`Not enough inventory for ${boqItem.description}. Available: ${available}, Requested: ${item.releasedQty}`);
        }

        await tx.consolidatedBOQItem.update({
          where: { id: boqItem.id },
          data: {
            consumedQty: { increment: Number(item.releasedQty) }
          }
        });
      }

      await tx.materialIssuance.update({
        where: { id },
        data: {
          status: 'RELEASED',
          accountantId: accountantId,
          releaseDate: new Date(),
          releasedById: accountantId
        }
      });
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error approving issuance:', error);
    const msg = error.message || 'Failed to approve issuance';
    const status = msg.includes('UBOQ_PBAC') ? 403 : msg.includes('UBOQ_') ? 409 : 500;
    res.status(status).json({ success: false, error: msg });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.materialIssuance.update({
      where: { id },
      data: { status: 'REJECTED' }
    });
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error rejecting issuance:', error);
    res.status(500).json({ success: false, error: 'Failed to reject' });
  }
});

export default router;
