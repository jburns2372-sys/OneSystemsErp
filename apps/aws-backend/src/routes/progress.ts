// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requirePermission } from '../lib/permissions';

const router = Router();
const prisma = new PrismaClient();

function getPbacContext(req: any) {
  return {
    userId: req.headers['x-user-session'] as string | undefined,
    activeProjectId: req.headers['x-active-project-id'] as string | undefined,
    simulatedRole: req.headers['x-simulated-role'] as string | undefined,
  };
}

// Accomplishment Form Save (after file upload)
router.post('/accomplishments', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canCreate', simulatedRole);
    const result = await prisma.subcontractAccomplishment.create({ data: req.body });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/accomplishments/:id/approve', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canEdit', simulatedRole);
    const result = await prisma.subcontractAccomplishment.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED' }
    });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/billings', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canCreate', simulatedRole);
    const data = req.body;
    const result = await prisma.subcontractBilling.create({
      data: {
        billingNumber: data.billingNumber,
        projectId: data.projectId,
        subcontractorId: data.subcontractorId,
        ...(data.packageId ? { packageId: data.packageId } : {}),
        ...(data.jobOrderId ? { jobOrderId: data.jobOrderId } : {}),
        contractAmount: data.contractAmount,
        previousGross: data.previousGross || 0,
        currentGross: data.currentGross || 0,
        totalGross: data.totalGross || 0,
        remainingBalance: data.remainingBalance || 0,
        netPayable: data.netPayable || 0,
        retentionDeduction: data.retentionDeduction || 0,
        whtDeduction: data.whtDeduction || 0,
        mobilizationDeduction: data.mobilizationDeduction || 0,
        status: 'DRAFT',
      }
    });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/billings/:id/process-payment', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'PAYMENT_ISSUANCE', 'canEdit', simulatedRole);
    const billingId = req.params.id;

    const result = await prisma.$transaction(async (tx) => {
      const billing = await tx.subcontractBilling.update({
        where: { id: billingId },
        data: { paymentStatus: 'PAID', status: 'APPROVED' },
        include: { subcontractor: true, package: true }
      }) as any;

      await tx.expense.create({
        data: {
          projectId: billing.projectId,
          amount: billing.netPayable,
          totalBreakdownAmount: billing.netPayable,
          date: new Date(),
          category: 'SUBCONTRACT_PAYMENT',
          description: `Subcontract Progress Payment for Invoice ${billing.billingNumber} - ${billing.subcontractor?.name}`,
          receiptRef: billing.billingNumber,
          supplierName: billing.subcontractor?.name || 'Subcontractor',
          isAccrued: false,
          netAmount: billing.netPayable,
          vatAmount: 0,
          billingEligibility: 'BILLABLE',
          status: 'APPROVED',
          loggedById: userId!,
          costType: 'DIRECT',
          breakdownItems: {
            create: [{
              description: `Subcontract Billing ${billing.billingNumber}`,
              quantity: 1,
              unit: 'lot',
              unitCost: billing.netPayable,
              totalCost: billing.netPayable,
              supplierName: billing.subcontractor?.name || 'Subcontractor',
            }]
          }
        }
      });

      if (billing.packageId) {
        await tx.subcontractPackage.update({
          where: { id: billing.packageId },
          data: { status: 'FULLY_PAID' }
        });
      }

      return billing;
    });

    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/billings/:id/submit', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canEdit', simulatedRole);
    const result = await prisma.subcontractBilling.update({
      where: { id: req.params.id },
      data: { status: 'SUBMITTED' }
    });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/billings/:id/endorse', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canEdit', simulatedRole);
    const result = await prisma.subcontractBilling.update({
      where: { id: req.params.id },
      data: { status: 'FOR_VALIDATION' }
    });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/billings/:id/approve-request', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canEdit', simulatedRole);
    const result = await prisma.subcontractBilling.update({
      where: { id: req.params.id },
      data: { status: 'APPROVED_FOR_PAYMENT' }
    });

    const billing = await prisma.subcontractBilling.findUnique({ where: { id: req.params.id } });
    if (billing?.packageId) {
      await prisma.subcontractPackage.update({
        where: { id: billing.packageId },
        data: { status: 'BILLED' }
      });
    }

    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/billings/:id/endorse-payment', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'PAYMENT_ISSUANCE', 'canEdit', simulatedRole);
    const result = await prisma.subcontractBilling.update({
      where: { id: req.params.id },
      data: {}
    });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/billings/:id/approve-payment', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'PAYMENT_ISSUANCE', 'canEdit', simulatedRole);
    const billingId = req.params.id;

    const billing: any = await prisma.subcontractBilling.findUnique({
      where: { id: billingId },
      include: { subcontractor: true, package: true, jobOrder: true }
    });
    if (!billing) throw new Error('Billing record not found');

    const result = await prisma.$transaction(async (tx) => {
      const updatedBilling = await tx.subcontractBilling.update({
        where: { id: billingId },
        data: { paymentStatus: 'PAID', status: 'PAID' } as any
      });

      await tx.paymentRecord.create({
        data: {
          billingId,
          amountPaid: billing.netPayable,
          paymentDate: billing.paidAt || new Date(),
          method: billing.paymentMethod || 'BANK_TRANSFER',
          referenceNumber: billing.paymentRef
        }
      });

      const expenseCategory = billing.jobOrderId ? 'JOB_ORDER_PAYMENT' : 'SUBCONTRACT_PAYMENT';
      const expenseDesc = billing.jobOrderId
        ? `Job Order Progress Payment for Invoice ${billing.billingNumber} - ${billing.subcontractor?.name}`
        : `Subcontract Progress Payment for Invoice ${billing.billingNumber} - ${billing.subcontractor?.name}`;

      await tx.expense.create({
        data: {
          projectId: billing.projectId,
          amount: billing.netPayable,
          totalBreakdownAmount: billing.netPayable,
          date: billing.paidAt || new Date(),
          category: expenseCategory,
          description: expenseDesc,
          receiptRef: billing.billingNumber,
          supplierName: billing.subcontractor?.name || 'Subcontractor',
          isAccrued: false,
          netAmount: billing.netPayable,
          vatAmount: 0,
          billingEligibility: 'BILLABLE',
          status: 'APPROVED',
          loggedById: userId!,
          costType: 'DIRECT',
          breakdownItems: {
            create: [{
              description: `${expenseCategory} Billing ${billing.billingNumber}`,
              quantity: 1,
              unit: 'lot',
              unitCost: billing.netPayable,
              totalCost: billing.netPayable,
              supplierName: billing.subcontractor?.name || 'Subcontractor',
            }]
          }
        }
      });

      const consolidatedBoqItemId = billing.jobOrder?.consolidatedBoqItemId || billing.package?.consolidatedBoqItemId;
      if (consolidatedBoqItemId) {
        await tx.projectCostLedger.create({
          data: {
            projectId: billing.projectId,
            consolidatedBoqItemId: consolidatedBoqItemId,
            type: 'SUBCONTRACT',
            referenceId: billing.id,
            referenceNumber: billing.billingNumber,
            supplierId: billing.subcontractorId,
            amount: billing.netPayable,
            status: 'RECORDED'
          }
        });

        await tx.consolidatedBOQItem.update({
          where: { id: consolidatedBoqItemId },
          data: { actualCost: { increment: billing.netPayable } }
        });
      }

      if (billing.jobOrderId) {
        const allBillings = await tx.subcontractBilling.findMany({
          where: { jobOrderId: billing.jobOrderId, paymentStatus: 'PAID' }
        });
        const totalGrossPaid = allBillings.reduce((sum, b) => sum + (b.currentGross || 0), 0);
        
        const jobOrder = await tx.jobOrder.findUnique({ where: { id: billing.jobOrderId } });
        if (jobOrder && totalGrossPaid >= (jobOrder.contractAmount || 0) - 0.01) {
          await tx.jobOrder.update({
            where: { id: jobOrder.id },
            data: { status: 'PAID' as any }
          });
        }
      }

      if (billing.packageId) {
        await tx.subcontractPackage.update({
          where: { id: billing.packageId },
          data: { status: 'FULLY_PAID' }
        });
      }

      return updatedBilling;
    });

    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/billings/:id/reject-payment', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'PAYMENT_ISSUANCE', 'canEdit', simulatedRole);
    const result = await prisma.subcontractBilling.update({
      where: { id: req.params.id },
      data: {}
    });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

// ---------------------------------------------------------
// ACCOMPLISHMENT FILES (Excel / PDF Document Management)
// ---------------------------------------------------------

router.post('/accomplishment-files', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canCreate', simulatedRole);
    const data = req.body;
    const result = await prisma.projectAccomplishmentFile.create({ data });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.put('/accomplishment-files/:id', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canEdit', simulatedRole);
    const data = req.body;
    const result = await prisma.projectAccomplishmentFile.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.delete('/accomplishment-files/:id', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canDelete', simulatedRole);
    await prisma.projectAccomplishmentFile.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

router.post('/accomplishment-files/:id/versions', async (req, res) => {
  try {
    const { userId, simulatedRole } = getPbacContext(req);
    await requirePermission(userId!, 'SUBCONTRACTING', 'canEdit', simulatedRole);
    const { fileRecordId, versionNumber, publicPath, isLocked } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      await tx.projectAccomplishmentFileVersion.create({
        data: {
          fileId: fileRecordId,
          versionNumber: versionNumber,
          filePath: publicPath,
        }
      });

      return await tx.projectAccomplishmentFile.update({
        where: { id: fileRecordId },
        data: {
          fileVersion: versionNumber,
          workingFilePath: publicPath,
          isLockedOriginal: isLocked,
          status: isLocked ? "BILLING" : "ACTIVE",
        }
      });
    });

    res.json({ success: true, data: result });
  } catch (error: any) { res.status(500).json({ success: false, error: error.message }); }
});

export default router;
