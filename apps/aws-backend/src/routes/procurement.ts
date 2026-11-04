// @ts-nocheck
import crypto from 'crypto';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { backendPrisma } from '../lib/prismaRls';
import { requirePermission } from '../lib/permissions';
import { submitTransaction, approveTransaction } from '../lib/workflow';
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

// Create PO from MRF (Class A commitment origination — requires active APPROVED PRR per Correction 1)
router.post('/po/from-mrf', async (req, res) => {
  try {
    const { mrId, items } = req.body;
    const { userId, userRole, simulatedRole } = getPbacContext(req);

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    await requirePermission(userId, 'PURCHASE_ORDER', 'canCreate', simulatedRole);

    const mr = await prisma.materialRequest.findUnique({
      where: { id: mrId },
      include: {
        project: true,
        items: {
          include: {
            canonicalResource: true,
            uboqResourceRequirement: true,
          },
        },
      },
    });
    if (!mr) return res.status(404).json({ error: 'Material Request not found' });

    await assertBackendProjectAccess(prisma, userId, userRole || currentUser.role, mr.projectId);

    const isMrGoverned =
      Boolean(mr.project?.uboqGovernanceEnabled) || mr.items.some((i) => Boolean(i.canonicalResourceId));

    if (isMrGoverned) {
      if (mr.status !== 'APPROVED') {
        return res.status(409).json({
          error: `UBOQ_PO_REQUIRES_APPROVED_MRF: Governed MaterialRequest ${mr.mrNumber} must be APPROVED before PO creation`,
        });
      }
      // Validate every requested PO item against the MRF line and active APPROVED PRR
      const requestedPerMrItem = new Map<string, number>();
      for (const reqItem of items) {
        const mrItem = reqItem.mrItemId
          ? mr.items.find((mi) => mi.id === reqItem.mrItemId)
          : mr.items.find(
              (mi) =>
                mi.consolidatedBoqItemId === reqItem.consolidatedBoqItemId &&
                (!reqItem.canonicalResourceId || mi.canonicalResourceId === reqItem.canonicalResourceId)
            );
        if (!mrItem || !mrItem.canonicalResourceId) {
          return res.status(409).json({
            error: `UBOQ_PO_ITEM_MISSING_MRF_LINEAGE: PO line on ${reqItem.consolidatedBoqItemId} lacks governed MRF item`,
          });
        }
        if (
          !mrItem.uboqResourceRequirement ||
          mrItem.uboqResourceRequirement.status !== 'APPROVED' ||
          mrItem.canonicalResource?.activeApprovedPrId !== mrItem.uboqResourceRequirementId
        ) {
          return res.status(409).json({
            error: `UBOQ_INACTIVE_PRR_FOR_NEW_COMMITMENT: MRF item ${mrItem.id} references non-active PRR ${mrItem.uboqResourceRequirementId}`,
          });
        }
        if (reqItem.resourceUnit && reqItem.resourceUnit !== mrItem.resourceUnit) {
          return res.status(409).json({
            error: `UBOQ_RESOURCE_UOM_MISMATCH: PO line unit (${reqItem.resourceUnit}) != MRF resourceUnit (${mrItem.resourceUnit})`,
          });
        }
        const accum = (requestedPerMrItem.get(mrItem.id) ?? 0) + Number(reqItem.quantity);
        requestedPerMrItem.set(mrItem.id, accum);
        const allowedOpenMr = Number(mrItem.approvedQuantity ?? mrItem.quantity) - Number(mrItem.poAllocatedQty ?? 0);
        if (accum > allowedOpenMr + 0.0001) {
          return res.status(409).json({
            error: `UBOQ_PO_EXCEEDS_MRF_BALANCE: Requested PO qty (${accum}) exceeds remaining MRF balance (${allowedOpenMr})`,
          });
        }
        reqItem.__resolvedMrItem = mrItem;
      }
    }

    const supplierGroups = items.reduce((groups: Record<string, any[]>, item: any) => {
      if (!groups[item.supplierId]) groups[item.supplierId] = [];
      groups[item.supplierId].push(item);
      return groups;
    }, {});

    if (!isMrGoverned) {
      const validation = await validateTransactionWithAI(
        'Purchase Order Generation',
        { action: 'Generate Purchase Orders from MRF', mrId, itemsToProcure: items },
        userId,
        currentUser.role || 'PURCHASING_OFFICER'
      );

      if (validation.validationStatus === 'BLOCKING ISSUE') {
        return res.json({ 
          success: false, 
          error: `AI Blocked Transaction: ${validation.findings}`,
          validationLogId: validation.validationLogId 
        });
      }
    }

    const createdPOIds = [];
    const currentYear = new Date().getFullYear();
    const prefix = `PO-${currentYear}-`;
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: prefix } },
      orderBy: { poNumber: 'desc' },
      select: { poNumber: true }
    });

    let count = 0;
    if (lastPO && lastPO.poNumber) {
      const lastInt = parseInt(lastPO.poNumber.substring(prefix.length), 10);
      if (!isNaN(lastInt)) count = lastInt;
    }

    for (const supplierId of Object.keys(supplierGroups)) {
      const supplierItems = supplierGroups[supplierId];
      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId } });
      const isVatable = supplier?.isVatable ?? false;

      const totalAmount = supplierItems.reduce((acc: number, item: any) => acc + (item.quantity * item.unitCost), 0);
      let netAmount = totalAmount;
      let vatAmount = 0;

      if (isVatable) {
        netAmount = totalAmount / 1.12;
        vatAmount = totalAmount - netAmount;
      }
      
      count++;
      const poNumber = `PO-${new Date().getFullYear()}-${String(count).padStart(4, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      const po = await prisma.purchaseOrder.create({
        data: {
          poNumber,
          status: 'FOR_REVIEW',
          supplierId,
          mrId,
          preparerId: userId,
          totalAmount,
          netAmount,
          vatAmount,
          items: {
            create: supplierItems.map((item: any) => {
              const mrItem = item.__resolvedMrItem;
              return {
                quantity: item.quantity,
                unitCost: item.unitCost,
                consolidatedBoqItemId: item.consolidatedBoqItemId,
                canonicalResourceId: mrItem?.canonicalResourceId ?? null,
                uboqResourceRequirementId: mrItem?.uboqResourceRequirementId ?? null,
                resourceUnit: mrItem?.resourceUnit ?? null,
                mrItemId: mrItem?.id ?? null,
              };
            })
          }
        }
      });

      await submitTransaction(userId, currentUser.role || 'PURCHASING_OFFICER', 'PURCHASE_ORDER', po.id, simulatedRole);
      createdPOIds.push(po.id);
    }

    if (!isMrGoverned) {
      await prisma.materialRequest.update({
        where: { id: mrId },
        data: { status: 'FULLY_PROCURED' }
      });
    }

    res.json({ success: true, createdPOIds });
  } catch (error: any) {
    console.error('Error creating PO from MRF:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ error: error.message || 'Failed to create PO' });
  }
});

// Approve PO (Class A commitment — requires active APPROVED PRR, stamps persistent approvedAt per I-02)
router.post('/po/:poId/approve', async (req, res) => {
  try {
    const { poId } = req.params;
    const { userId, userRole, simulatedRole } = getPbacContext(req);

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    await requirePermission(userId, 'PURCHASE_ORDER', 'canApprove', simulatedRole);

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: { include: { mrItem: true } },
        mr: true,
        canvassForm: true,
        supplier: true,
      }
    });
    if (!po) return res.status(404).json({ error: 'PO not found' });

    const projectId = po.mr?.projectId ?? po.canvassForm?.projectId;
    if (projectId) {
      await assertBackendProjectAccess(prisma, userId, userRole || currentUser.role, projectId);
    }

    const govResourceIds = po.items
      .map((i) => i.canonicalResourceId)
      .filter((x): x is string => Boolean(x));

    if (govResourceIds.length > 0) {
      // Strict Maker-Checker SoD on governed POs (VAL-20)
      if (po.preparerId === userId) {
        return res.status(403).json({ error: 'UBOQ_SOD_VIOLATION: Self-approval of governed PurchaseOrder is prohibited' });
      }

      if (po.status === 'APPROVED') {
        return res.json({ success: true });
      }

      await withBackendLockedAccountsTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
        const freshPo = await tx.purchaseOrder.findUnique({
          where: { id: poId },
          include: { items: { include: { mrItem: true } }, mr: true, supplier: true },
        });
        if (!freshPo) throw new Error('PO not found');
        if (freshPo.status === 'APPROVED') return;

        for (const item of freshPo.items) {
          if (!item.canonicalResourceId) continue;
          const acct = lockedAccounts.get(item.canonicalResourceId);
          if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

          // Class A (Correction 1): PO approval requires active APPROVED PRR!
          if (!acct.activeApprovedPrId || item.uboqResourceRequirementId !== acct.activeApprovedPrId) {
            throw new Error(
              `UBOQ_INACTIVE_PRR_FOR_NEW_COMMITMENT: PO item ${item.id} references superseded/inactive PRR ${item.uboqResourceRequirementId}; active PRR is ${acct.activeApprovedPrId}`
            );
          }

          if (item.mrItemId && item.mrItem) {
            const availMr = Number(
              ((item.mrItem.approvedQuantity ?? item.mrItem.quantity) - (item.mrItem.poAllocatedQty ?? 0)).toFixed(4)
            );
            if (item.quantity > availMr + 0.0001 || item.quantity > acct.openMrReservedQty + 0.0001) {
              throw new Error(
                `UBOQ_PO_COMMIT_EXCEEDS_MRF_RESERVATION: PO qty (${item.quantity}) exceeds open MRF reserved qty (${Math.min(availMr, acct.openMrReservedQty)})`
              );
            }
            const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
              prrSnapshotId: item.uboqResourceRequirementId,
              eventType: 'PO_COMMIT_TRANSFER',
              sourceModule: 'PROCUREMENT_PO',
              sourceHeaderId: freshPo.id,
              sourceLineId: item.id,
              poItemLineageId: item.id,
              idempotencyKey: `PO_COMMIT_TRANSFER:${freshPo.id}:${item.id}`,
              qtyDeltaOpenMr: -item.quantity,
              qtyDeltaOpenPo: item.quantity,
              unitCostSnapshot: item.unitCost,
              actorUserId: userId,
              remarks: `Transferred ${item.quantity} ${acct.resourceUomNormalized} from MRF to PO ${freshPo.poNumber}`,
            });
            lockedAccounts.set(acct.id, nextAcct);

            await tx.materialRequestItem.update({
              where: { id: item.mrItemId },
              data: { poAllocatedQty: { increment: item.quantity } },
            });
          } else {
            if (item.quantity > acct.remainingProcurementQty + 0.0001) {
              throw new Error(
                `UBOQ_PO_DIRECT_COMMIT_CEILING_EXCEEDED: PO qty (${item.quantity}) exceeds remainingProcurementQty (${acct.remainingProcurementQty})`
              );
            }
            const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
              prrSnapshotId: item.uboqResourceRequirementId,
              eventType: 'PO_DIRECT_COMMIT',
              sourceModule: 'PROCUREMENT_PO',
              sourceHeaderId: freshPo.id,
              sourceLineId: item.id,
              poItemLineageId: item.id,
              idempotencyKey: `PO_DIRECT_COMMIT:${freshPo.id}:${item.id}`,
              qtyDeltaOpenPo: item.quantity,
              unitCostSnapshot: item.unitCost,
              actorUserId: userId,
              remarks: `Direct PO commitment ${item.quantity} ${acct.resourceUomNormalized} on ${freshPo.poNumber}`,
            });
            lockedAccounts.set(acct.id, nextAcct);
          }

          if (projectId) {
            const lineTotal = item.quantity * item.unitCost;
            await tx.commitmentLedger.create({
              data: {
                projectId,
                consolidatedBoqItemId: item.consolidatedBoqItemId,
                commitmentType: 'PURCHASE_ORDER',
                supplierName: freshPo.supplier?.name || '',
                approvedAmount: lineTotal,
                remainingCommitment: lineTotal,
                status: 'ACTIVE',
              },
            });
          }
        }

        // Stamp persistent approvedAt so COMPLETED POs retain historic approval proof (Safeguard I-02)!
        await tx.purchaseOrder.update({
          where: { id: poId },
          data: {
            status: 'APPROVED',
            approverId: userId,
            approvedAt: new Date(),
          },
        });
      });

      await approveTransaction(userId, currentUser.role || 'PROJECT_DIRECTOR', 'PURCHASE_ORDER', po.id, 'Approved PO digitally', simulatedRole);
      return res.json({ success: true });
    }

    if (po.preparerId === userId && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Self-approval blocked by Workflow Engine.' });
    }

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'APPROVED', approverId: userId, approvedAt: new Date() }
    });

    if (po.mr && po.mr.projectId) {
      for (const item of po.items) {
        if (item.consolidatedBoqItemId) {
          const lineTotal = item.quantity * item.unitCost;
          await prisma.commitmentLedger.create({
            data: {
              projectId: po.mr.projectId,
              consolidatedBoqItemId: item.consolidatedBoqItemId,
              commitmentType: 'PURCHASE_ORDER',
              supplierName: po.supplier?.name || '',
              approvedAmount: lineTotal,
              remainingCommitment: lineTotal,
              status: 'ACTIVE'
            }
          });

          await prisma.consolidatedBOQItem.update({
            where: { id: item.consolidatedBoqItemId },
            data: { committedCost: { increment: lineTotal } }
          });
        }
      }
    }

    await approveTransaction(userId, currentUser.role || 'PROJECT_DIRECTOR', 'PURCHASE_ORDER', po.id, 'Approved PO digitally', simulatedRole);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error approving PO:', error);
    const msg = error.message || 'Failed to approve PO';
    const status = msg.includes('UBOQ_PBAC') || msg.includes('Unauthorized Action') ? 403 : msg.includes('UBOQ_') ? 409 : 500;
    res.status(status).json({ error: msg });
  }
});

// Submit PO
router.post('/po/:poId/submit', async (req, res) => {
  try {
    const { poId } = req.params;
    const { userId, userRole, simulatedRole } = getPbacContext(req);

    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { mr: true, canvassForm: true },
    });
    if (!po) return res.status(404).json({ error: 'PO not found' });

    const projectId = po.mr?.projectId ?? po.canvassForm?.projectId;
    if (projectId) {
      await assertBackendProjectAccess(prisma, userId, userRole || currentUser.role, projectId);
    }

    await prisma.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'FOR_REVIEW' }
    });

    await submitTransaction(userId, currentUser.role || 'PURCHASING_OFFICER', 'PURCHASE_ORDER', po.id, simulatedRole);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error submitting PO:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ error: error.message || 'Failed to submit PO' });
  }
});

export default router;
