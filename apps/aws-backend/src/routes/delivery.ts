// @ts-nocheck
import crypto from 'crypto';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { backendPrisma } from '../lib/prismaRls';
import { requirePermission } from '../lib/permissions';
import { submitTransaction, approveTransaction } from '../lib/workflow';
import { validateTransactionWithAI, verifyDeliveryDocumentWithAI } from '../lib/aiValidation';
import { uploadFileToS3 } from '../services/s3.service';
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

router.post('/encode', async (req, res) => {
  try {
    const {
      poId,
      receiptNumber,
      items,
      fileBase64,
      mimeType,
      fileName,
      noFileReason
    } = req.body;

    const { userId, userRole, simulatedRole } = getPbacContext(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await requirePermission(user.id, 'DELIVERY_RECEIVING', 'canCreate', simulatedRole);

    const poForGov = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        mr: true,
        canvassForm: true,
        items: {
          include: {
            uboqResourceRequirement: true,
          },
        },
      },
    });
    if (!poForGov) return res.status(404).json({ error: 'Purchase Order not found' });

    const projectId = poForGov.mr?.projectId ?? poForGov.canvassForm?.projectId;
    if (projectId) {
      await assertBackendProjectAccess(prisma, user.id, userRole || user.role, projectId);
    }

    const isPoGoverned = poForGov.items.some((i) => Boolean(i.canonicalResourceId));
    if (isPoGoverned) {
      if (!poForGov.approvedAt && !['APPROVED', 'ISSUED', 'PARTIAL_DELIVERY'].includes(poForGov.status)) {
        return res.status(409).json({
          error: `UBOQ_DELIVERY_UNAPPROVED_PO: Governed PO ${poForGov.poNumber} must be APPROVED before receiving delivery`,
        });
      }
      // Class B fulfillment (Correction 1): permits PRR status IN ('APPROVED', 'SUPERSEDED') against previously approved PO!
      for (const reqItem of items) {
        const poItem = reqItem.poItemId
          ? poForGov.items.find((pi) => pi.id === reqItem.poItemId)
          : poForGov.items.find(
              (pi) =>
                pi.consolidatedBoqItemId === reqItem.consolidatedBoqItemId &&
                (!reqItem.canonicalResourceId || pi.canonicalResourceId === reqItem.canonicalResourceId)
            );
        if (!poItem || !poItem.canonicalResourceId) {
          return res.status(409).json({
            error: `UBOQ_DELIVERY_MISSING_PO_ITEM: Delivery line lacks matching governed PurchaseOrderItem`,
          });
        }
        if (
          !poItem.uboqResourceRequirement ||
          !['APPROVED', 'SUPERSEDED'].includes(poItem.uboqResourceRequirement.status)
        ) {
          return res.status(409).json({
            error: `UBOQ_DELIVERY_INVALID_PRR_STATUS: PO item ${poItem.id} PRR status is invalid`,
          });
        }
        if (reqItem.resourceUnit && reqItem.resourceUnit !== poItem.resourceUnit) {
          return res.status(409).json({
            error: `UBOQ_RESOURCE_UOM_MISMATCH: Delivery resourceUnit (${reqItem.resourceUnit}) != PO item resourceUnit (${poItem.resourceUnit})`,
          });
        }
        const remainingOpenPoLine = Number(
          (poItem.quantity - (poItem.deliveredApprovedQty ?? 0) - (poItem.pendingDeliveryQty ?? 0)).toFixed(4)
        );
        if (reqItem.quantity <= 0 || reqItem.quantity > remainingOpenPoLine + 0.0001) {
          return res.status(409).json({
            error: `UBOQ_OVERDELIVERY_BLOCKED: Delivery qty (${reqItem.quantity}) exceeds open PO line balance (${remainingOpenPoLine})`,
          });
        }
        reqItem.__resolvedPoItem = poItem;
      }
    }

    let drDocumentText = noFileReason ? `No document uploaded. Reason provided by user: ${noFileReason}` : 'No document uploaded.';
    let proofFileUrl: string | undefined;
    let hasProof = true;

    if (fileBase64 && mimeType && fileName) {
      const buffer = Buffer.from(fileBase64, 'base64');
      
      const s3Key = `deliveries/${Date.now()}-${fileName}`;
      proofFileUrl = await uploadFileToS3(buffer, s3Key, mimeType);

      const itemIds = items.map((i: any) => i.consolidatedBoqItemId);
      const boqItems = await prisma.consolidatedBOQItem.findMany({
        where: { id: { in: itemIds } }
      });

      const poDetails = {
        poNumber: poForGov.poNumber,
        supplierName: poForGov.supplier.name,
        items: items.map((i: any) => {
          const b = boqItems.find((b: any) => b.id === i.consolidatedBoqItemId);
          return {
            description: b?.description || 'Unknown',
            quantity: i.quantity,
            drQuantity: i.drQuantity
          }
        })
      };

      const visionResult = await verifyDeliveryDocumentWithAI(buffer, mimeType, poDetails);

      if (!visionResult.matches) {
        return res.json({ 
          success: false, 
          error: `AI Document Mismatch: ${visionResult.findings}`,
          validationLogId: null 
        });
      }

      drDocumentText = `[AI EXTRACTED OCR & VISION MATCH PASSED]: ${visionResult.findings}`;
    } else if (noFileReason) {
      hasProof = false;
    }

    const mismatchedItems = items.filter((item: any) => item.drQuantity !== undefined && item.quantity !== item.drQuantity);
    const isMismatch = mismatchedItems.length > 0;
    
    let mismatchNotes = null;
    if (isMismatch) {
      const itemIds = mismatchedItems.map((i: any) => i.consolidatedBoqItemId);
      const boqItems = await prisma.consolidatedBOQItem.findMany({
        where: { id: { in: itemIds } }
      });
      
      mismatchNotes = mismatchedItems.map((item: any) => {
        const boq = boqItems.find((b: any) => b.id === item.consolidatedBoqItemId);
        const diff = item.drQuantity - item.quantity;
        return `${diff > 0 ? 'Missing' : 'Over-delivered'} ${Math.abs(diff)} of ${boq?.description || 'Unknown Item'} (Reason: ${item.remarks})`;
      }).join(' | ');
    }

    if (hasProof !== false && !isPoGoverned) {
      const validation = await validateTransactionWithAI(
        'Delivery Receiving',
        {
          action: 'Encode Delivery Receipt',
          poId,
          receiptNumber,
          isMismatch,
          mismatchNotes,
          items,
          attachedDocumentOCR: drDocumentText
        },
        user.id,
        user.role || 'STOCKMAN'
      );

      if (validation.validationStatus === 'BLOCKING ISSUE') {
        return res.json({ 
          success: false, 
          error: `AI Blocked Transaction: ${validation.findings}`,
          validationLogId: validation.validationLogId 
        });
      }
    }

    const delivery = await prisma.$transaction(async (tx) => {
      const created = await tx.delivery.create({
        data: {
          poId,
          receiptNumber,
          status: 'FOR_ACCOUNTANT_APPROVAL',
          receivedById: user.id,
          proofFileUrl,
          hasProof,
          isMismatch,
          mismatchNotes,
          items: {
            create: items.map((item: any) => {
              const poItem = item.__resolvedPoItem;
              return {
                quantity: item.quantity,
                drQuantity: item.drQuantity ?? item.quantity,
                remarks: item.remarks,
                consolidatedBoqItemId: item.consolidatedBoqItemId,
                poItemId: poItem?.id ?? null,
                canonicalResourceId: poItem?.canonicalResourceId ?? null,
                uboqResourceRequirementId: poItem?.uboqResourceRequirementId ?? null,
                resourceUnit: poItem?.resourceUnit ?? null,
              };
            })
          }
        }
      });

      if (isPoGoverned) {
        for (const item of items) {
          if (item.__resolvedPoItem) {
            await tx.purchaseOrderItem.update({
              where: { id: item.__resolvedPoItem.id },
              data: { pendingDeliveryQty: { increment: item.quantity } },
            });
          }
        }
      }
      return created;
    });

    await submitTransaction(user.id, user.role || 'STOCKMAN', 'DELIVERY_RECEIVING', delivery.id, simulatedRole);

    res.json({ success: true, deliveryId: delivery.id });
  } catch (error: any) {
    console.error('Error encoding delivery:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ error: error.message || 'Failed to encode delivery' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole, simulatedRole } = getPbacContext(req);
    
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    await requirePermission(user.id, 'DELIVERY_RECEIVING', 'canApprove', simulatedRole);

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { 
        items: { include: { consolidatedBoqItem: true, poItem: true } },
        po: { include: { supplier: true, items: true, mr: true, canvassForm: true } }
      }
    });

    if (!delivery || delivery.status !== 'FOR_ACCOUNTANT_APPROVAL') {
      return res.status(400).json({ error: 'Invalid delivery status' });
    }

    const projectId = delivery.po.mr?.projectId ?? delivery.po.canvassForm?.projectId;
    if (projectId) {
      await assertBackendProjectAccess(prisma, user.id, userRole || user.role, projectId);
    }

    const govResourceIds = delivery.items
      .map((i) => i.canonicalResourceId)
      .filter((x): x is string => Boolean(x));

    if (govResourceIds.length > 0) {
      // Governed Class B fulfillment path (Correction 1 + Safeguard I-02):
      // Permits APPROVED or SUPERSEDED PRR on historic approved PO; transitions PO to PARTIAL_DELIVERY or COMPLETED while preserving approvedAt!
      await withBackendLockedAccountsTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
        const freshDeliv = await tx.delivery.findUnique({
          where: { id },
          include: {
            items: { include: { poItem: true } },
            po: { include: { supplier: true, items: true, mr: true, canvassForm: true } },
          },
        });
        if (!freshDeliv || freshDeliv.status !== 'FOR_ACCOUNTANT_APPROVAL') {
          throw new Error('Invalid delivery status');
        }

        let totalApAmount = 0;

        for (const item of freshDeliv.items) {
          if (!item.canonicalResourceId || !item.poItemId || !item.poItem) {
            throw new Error(`UBOQ_DELIVERY_MISSING_PO_ITEM: Delivery item ${item.id} lacks poItemId lineage`);
          }
          const acct = lockedAccounts.get(item.canonicalResourceId);
          if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

          if (item.quantity > acct.openCommittedPoQty + 0.0001) {
            throw new Error(
              `UBOQ_DELIVERY_EXCEEDS_OPEN_PO_COMMITMENT: Delivery qty (${item.quantity}) exceeds openCommittedPoQty (${acct.openCommittedPoQty})`
            );
          }

          const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
            prrSnapshotId: item.uboqResourceRequirementId,
            eventType: 'DELIVERY_RECEIVE',
            sourceModule: 'DELIVERY_RECEIVING',
            sourceHeaderId: freshDeliv.id,
            sourceLineId: item.id,
            poItemLineageId: item.poItemId,
            idempotencyKey: `DELIVERY_RECEIVE:${freshDeliv.id}:${item.id}`,
            qtyDeltaOpenPo: -item.quantity,
            qtyDeltaDelivered: item.quantity,
            unitCostSnapshot: item.poItem.unitCost,
            actorUserId: user.id,
            remarks: `Received ${item.quantity} ${acct.resourceUomNormalized} against PO ${freshDeliv.po.poNumber}`,
          });
          lockedAccounts.set(acct.id, nextAcct);

          await tx.purchaseOrderItem.update({
            where: { id: item.poItemId },
            data: {
              deliveredApprovedQty: { increment: item.quantity },
              pendingDeliveryQty: Math.max(0, Number(((item.poItem.pendingDeliveryQty ?? 0) - item.quantity).toFixed(4))),
            },
          });

          const actualLineCost = Number((item.quantity * item.poItem.unitCost).toFixed(2));
          totalApAmount += actualLineCost;

          if (projectId) {
            await tx.projectCostLedger.create({
              data: {
                projectId,
                consolidatedBoqItemId: item.consolidatedBoqItemId,
                poItemId: item.poItemId,
                canonicalResourceId: item.canonicalResourceId,
                resourceUnit: item.resourceUnit,
                quantity: item.quantity,
                unitCost: item.poItem.unitCost,
                costDate: new Date(),
                costCategory: 'MATERIALS',
                referenceDocumentType: 'DELIVERY_RECEIPT',
                referenceDocumentNo: freshDeliv.receiptNumber,
                supplierName: freshDeliv.po.supplier.name,
                grossAmount: actualLineCost,
                netAmount: actualLineCost,
                paymentStatus: 'UNPAID',
                approvalStatus: 'APPROVED',
              },
            });
          }
        }

        // Approve Delivery AFTER DELIVERY_RECEIVE ledger entry exists in same tx (satisfies trg_uboq_guard_parent_deliv!)
        await tx.delivery.update({
          where: { id },
          data: { status: 'APPROVED', approverId: user.id },
        });

        // Update PO status to PARTIAL_DELIVERY or COMPLETED while preserving historic approvedAt (Safeguard I-02)!
        const updatedPoItems = await tx.purchaseOrderItem.findMany({
          where: { poId: freshDeliv.poId },
        });
        const allFulfilled = updatedPoItems.every(
          (pi) => (pi.deliveredApprovedQty ?? 0) >= pi.quantity - 0.0001
        );
        await tx.purchaseOrder.update({
          where: { id: freshDeliv.poId },
          data: {
            status: allFulfilled ? 'COMPLETED' : 'PARTIAL_DELIVERY',
          },
        });

        let termDays = 0;
        if (freshDeliv.po.supplier.paymentTerms) {
          const match = freshDeliv.po.supplier.paymentTerms.match(/(\d+)/);
          if (match) termDays = parseInt(match[1], 10);
        }
        const dueDate = new Date(freshDeliv.createdAt);
        dueDate.setDate(dueDate.getDate() + termDays);

        const roundedTotal = Number(totalApAmount.toFixed(2));
        let calculatedNetAmount = roundedTotal;
        let calculatedVatAmount = 0;
        if (freshDeliv.po.supplier.isVatable) {
          calculatedNetAmount = Number((roundedTotal / 1.12).toFixed(2));
          calculatedVatAmount = Number((roundedTotal - calculatedNetAmount).toFixed(2));
        }

        const count = await tx.accountsPayable.count();
        const voucherNumber = `PV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-${freshDeliv.id.slice(-4)}`;

        await tx.accountsPayable.create({
          data: {
            voucherNumber,
            amount: roundedTotal,
            netAmount: calculatedNetAmount,
            vatAmount: calculatedVatAmount,
            dueDate,
            status: 'PENDING',
            deliveryId: freshDeliv.id,
            poId: freshDeliv.poId,
            supplierId: freshDeliv.po.supplierId,
          },
        });
      });

      await approveTransaction(user.id, user.role || 'PROJECT_ACCOUNTANT', 'DELIVERY_RECEIVING', id, 'Approved Delivery', simulatedRole);
      return res.json({ success: true });
    }

    await prisma.$transaction(async (tx) => {
      await tx.delivery.update({
        where: { id },
        data: { status: 'APPROVED', approverId: user.id }
      });

      for (const item of delivery.items) {
        const poItem = delivery.po.items.find(i => i.consolidatedBoqItemId === item.consolidatedBoqItemId);
        const unitCost = poItem ? poItem.unitCost : item.consolidatedBoqItem.unitCost;
        const actualLineCost = item.quantity * unitCost;

        await tx.consolidatedBOQItem.update({
          where: { id: item.consolidatedBoqItemId },
          data: {
            deliveredQty: { increment: item.quantity },
            actualCost: { increment: actualLineCost }
          }
        });

        if (delivery.po.mr && delivery.po.mr.projectId) {
          await tx.projectCostLedger.create({
            data: {
              projectId: delivery.po.mr.projectId,
              consolidatedBoqItemId: item.consolidatedBoqItemId,
              costDate: new Date(),
              costCategory: 'MATERIALS',
              referenceDocumentType: 'DELIVERY_RECEIPT',
              referenceDocumentNo: delivery.receiptNumber,
              supplierName: delivery.po.supplier.name,
              grossAmount: actualLineCost,
              netAmount: actualLineCost,
              paymentStatus: 'UNPAID',
              approvalStatus: 'APPROVED'
            }
          });
        }
      }

      const totalAmount = delivery.items.reduce((sum, item) => {
        const poItem = delivery.po.items.find(i => i.consolidatedBoqItemId === item.consolidatedBoqItemId);
        const unitCost = poItem ? poItem.unitCost : item.consolidatedBoqItem.unitCost;
        return sum + (item.quantity * unitCost);
      }, 0);

      let termDays = 0;
      if (delivery.po.supplier.paymentTerms) {
        const match = delivery.po.supplier.paymentTerms.match(/(\d+)/);
        if (match) {
          termDays = parseInt(match[1], 10);
        }
      }
      
      const dueDate = new Date(delivery.createdAt);
      dueDate.setDate(dueDate.getDate() + termDays);

      let calculatedNetAmount = totalAmount;
      let calculatedVatAmount = 0;
      if (delivery.po.supplier.isVatable) {
        calculatedNetAmount = totalAmount / 1.12;
        calculatedVatAmount = totalAmount - calculatedNetAmount;
      }

      const count = await tx.accountsPayable.count();
      const voucherNumber = `PV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      await tx.accountsPayable.create({
        data: {
          voucherNumber: voucherNumber,
          amount: totalAmount,
          netAmount: calculatedNetAmount,
          vatAmount: calculatedVatAmount,
          dueDate: dueDate,
          status: 'PENDING',
          deliveryId: delivery.id,
          poId: delivery.poId,
          supplierId: delivery.po.supplierId,
        }
      });
    });

    await approveTransaction(user.id, user.role || 'PROJECT_ACCOUNTANT', 'DELIVERY_RECEIVING', id, 'Approved Delivery', simulatedRole);

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error approving delivery:', error);
    const msg = error.message || 'Failed to approve delivery';
    const status = msg.includes('UBOQ_PBAC') ? 403 : msg.includes('UBOQ_') ? 409 : 500;
    res.status(status).json({ error: msg });
  }
});

// Credit Adjustment / Delivery Reversal on historic APPROVED or COMPLETED POs (Safeguard I-02)
router.post('/:id/reverse', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId, userRole, simulatedRole } = getPbacContext(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await requirePermission(user.id, 'DELIVERY_RECEIVING', 'canApprove', simulatedRole);

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        items: { include: { poItem: true } },
        payable: true,
        po: { include: { mr: true, canvassForm: true } },
      },
    });
    if (!delivery || delivery.status !== 'APPROVED') {
      return res.status(400).json({ error: 'Only APPROVED deliveries can be reversed' });
    }

    const projectId = delivery.po.mr?.projectId ?? delivery.po.canvassForm?.projectId;
    if (projectId) {
      await assertBackendProjectAccess(prisma, user.id, userRole || user.role, projectId);
    }

    const reopenPoCommitment = req.body?.reopenPoCommitment !== false;
    const govResourceIds = delivery.items
      .map((i) => i.canonicalResourceId)
      .filter((x): x is string => Boolean(x));

    await withBackendLockedAccountsTx(prisma, govResourceIds, async ({ tx, txId, lockedAccounts }) => {
      for (const item of delivery.items) {
        if (!item.canonicalResourceId) continue;
        const acct = lockedAccounts.get(item.canonicalResourceId);
        if (!acct) throw new Error('UBOQ_ACCOUNT_NOT_FOUND');

        if (acct.availablePhysicalStockQty < item.quantity - 0.0001) {
          throw new Error(
            `UBOQ_REVERSAL_BLOCKED_STOCK_CONSUMED: Cannot reverse ${item.quantity} ${acct.resourceUomNormalized} on ${acct.resourceCode}; physical stock already issued (${acct.availablePhysicalStockQty} remaining)`
          );
        }

        const nextAcct = await postBackendResourceLedgerDelta(tx, txId, acct, {
          prrSnapshotId: item.uboqResourceRequirementId,
          eventType: 'DELIVERY_REVERSAL',
          sourceModule: 'DELIVERY_RECEIVING',
          sourceHeaderId: delivery.id,
          sourceLineId: item.id,
          poItemLineageId: item.poItemId,
          idempotencyKey: `DELIVERY_REVERSAL:${delivery.id}:${item.id}`,
          qtyDeltaOpenPo: reopenPoCommitment ? item.quantity : 0,
          qtyDeltaDelivered: -item.quantity,
          unitCostSnapshot: item.poItem?.unitCost ?? null,
          actorUserId: user.id,
          remarks: reason || `Credit adjustment / delivery reversal on ${delivery.receiptNumber}`,
        });
        lockedAccounts.set(acct.id, nextAcct);

        if (item.poItemId) {
          await tx.purchaseOrderItem.update({
            where: { id: item.poItemId },
            data: { deliveredApprovedQty: { decrement: item.quantity } },
          });
        }
      }

      await tx.delivery.update({
        where: { id: delivery.id },
        data: { status: 'REVERSED' },
      });

      if (reopenPoCommitment) {
        const remainingPoItems = await tx.purchaseOrderItem.findMany({
          where: { poId: delivery.poId },
        });
        const anyDelivered = remainingPoItems.some((pi) => (pi.deliveredApprovedQty ?? 0) > 0.0001);
        await tx.purchaseOrder.update({
          where: { id: delivery.poId },
          data: { status: anyDelivered ? 'PARTIAL_DELIVERY' : 'APPROVED' },
        });
      }

      if (delivery.payable && delivery.payable.status !== 'PAID') {
        await tx.accountsPayable.update({
          where: { id: delivery.payable.id },
          data: { status: 'CREDITED_REVERSED' },
        });
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error reversing delivery:', error);
    const msg = error.message || 'Failed to reverse delivery';
    const status = msg.includes('UBOQ_PBAC') ? 403 : msg.includes('UBOQ_') ? 409 : 500;
    res.status(status).json({ error: msg });
  }
});

router.post('/:id/upload-proof', async (req, res) => {
  try {
    const { id } = req.params;
    const { fileBase64, mimeType, fileName } = req.body;

    if (!fileBase64) return res.status(400).json({ error: 'No file provided' });

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        po: { include: { supplier: true } },
        items: { include: { consolidatedBoqItem: true } }
      }
    });

    if (!delivery) return res.status(404).json({ error: 'Delivery not found' });

    const buffer = Buffer.from(fileBase64, 'base64');
    const s3Key = `deliveries/${Date.now()}-delayed-${fileName}`;
    const proofFileUrl = await uploadFileToS3(buffer, s3Key, mimeType);

    const poDetails = {
      poNumber: delivery.po.poNumber,
      supplierName: delivery.po.supplier.name,
      items: delivery.items.map((i: any) => ({
        description: i.consolidatedBoqItem.description,
        quantity: i.quantity,
        drQuantity: i.drQuantity
      }))
    };

    const visionResult = await verifyDeliveryDocumentWithAI(buffer, mimeType, poDetails);

    if (!visionResult.matches) {
      return res.json({ 
        success: false, 
        error: `AI Document Mismatch: ${visionResult.findings}`
      });
    }

    await prisma.delivery.update({
      where: { id },
      data: { proofFileUrl, hasProof: true }
    });

    res.json({ success: true, proofFileUrl });
  } catch (error: any) {
    console.error('Error uploading delayed delivery proof:', error);
    res.status(500).json({ error: error.message || 'Failed to process delayed file upload.' });
  }
});

export default router;
