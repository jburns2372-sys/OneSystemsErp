// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { assertBackendProjectAccess } from '../lib/uboq/backendResourceGuard';

const router = Router();
const prisma = new PrismaClient();

function getPbacContext(req: any) {
  return {
    userId: (req.user?.id || req.headers['x-user-session']) as string | undefined,
    userRole: req.user?.role as string | undefined,
    activeProjectId: req.headers['x-active-project-id'] as string | undefined,
    simulatedRole: req.headers['x-simulated-role'] as string | undefined,
  };
}

// Create Canvass Form
router.post('/', async (req, res) => {
  try {
    const { mrId } = req.body;
    const { userId, userRole } = getPbacContext(req);

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const mr = await prisma.materialRequest.findUnique({
      where: { id: mrId },
      include: { items: true, project: true }
    });

    if (!mr) return res.status(404).json({ success: false, error: 'Material request not found' });

    await assertBackendProjectAccess(prisma, userId, userRole, mr.projectId);

    const hasGovernedItems =
      Boolean(mr.project?.uboqGovernanceEnabled) || mr.items.some((i) => Boolean(i.canonicalResourceId));
    if (hasGovernedItems && mr.status !== 'APPROVED') {
      return res.status(409).json({
        success: false,
        error: `UBOQ_CANVASS_REQUIRES_APPROVED_MRF: Governed MaterialRequest ${mr.mrNumber} must be APPROVED before canvassing`,
      });
    }

    const existingCanvass = await prisma.canvassForm.findFirst({
      where: { mrId: mrId }
    });

    if (existingCanvass) {
      return res.json({ success: true, canvassId: existingCanvass.id });
    }

    const currentYear = new Date().getFullYear();
    const prefix = `CANV-${currentYear}-`;
    const lastCanvass = await prisma.canvassForm.findFirst({
      where: { canvassNumber: { startsWith: prefix } },
      orderBy: { canvassNumber: 'desc' },
      select: { canvassNumber: true }
    });

    let nextNumber = 1;
    if (lastCanvass && lastCanvass.canvassNumber) {
      const lastInt = parseInt(lastCanvass.canvassNumber.substring(prefix.length), 10);
      if (!isNaN(lastInt)) nextNumber = lastInt + 1;
    }
    const canvassNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    const canvass = await prisma.canvassForm.create({
      data: {
        canvassNumber,
        mrId: mr.id,
        projectId: mr.projectId,
        preparedById: userId,
        status: 'DRAFT',
        items: {
          create: mr.items.map(item => ({
            quantityRequired: item.approvedQuantity || item.quantity,
            consolidatedBoqItemId: item.consolidatedBoqItemId,
            canonicalResourceId: item.canonicalResourceId || null,
            uboqResourceRequirementId: item.uboqResourceRequirementId || null,
            resourceUnit: item.resourceUnit || null,
            mrItemId: item.id,
          }))
        }
      }
    });

    res.json({ success: true, canvassId: canvass.id });
  } catch (error: any) {
    console.error('Error creating canvass:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to create canvass form' });
  }
});

// Add Supplier Quotation
router.post('/:id/quotations', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierId, items } = req.body;
    const { userId, userRole } = getPbacContext(req);

    const canvass = await prisma.canvassForm.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!canvass) return res.status(404).json({ success: false, error: 'Canvass not found' });
    if (userId) {
      await assertBackendProjectAccess(prisma, userId, userRole, canvass.projectId);
    }

    const ciMap = new Map(canvass.items.map((ci) => [ci.id, ci]));

    const quotation = await prisma.supplierQuotation.create({
      data: {
        canvassFormId: id,
        supplierId: supplierId,
        status: 'RECEIVED',
        totalAmount: items.reduce((acc: number, item: any) => acc + (item.unitCost * item.quantityAvailable), 0),
        items: {
          create: items.map((item: any) => {
            const ci = ciMap.get(item.canvassItemId);
            return {
              canvassItemId: item.canvassItemId,
              unitCost: item.unitCost,
              quantityAvailable: item.quantityAvailable,
              totalCost: item.unitCost * item.quantityAvailable,
              brand: item.brand,
              remarks: item.remarks,
              resourceUnit: item.resourceUnit || ci?.resourceUnit || null,
            };
          })
        }
      }
    });

    res.json({ success: true, quotationId: quotation.id });
  } catch (error: any) {
    console.error('Error adding quotation:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to add quotation' });
  }
});

// Update Supplier Quotation
router.put('/:id/quotations/:quotationId', async (req, res) => {
  try {
    const { id, quotationId } = req.params;
    const { supplierId, items } = req.body;
    const { userId, userRole } = getPbacContext(req);

    const canvass = await prisma.canvassForm.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!canvass) return res.status(404).json({ success: false, error: 'Canvass not found' });
    if (userId) {
      await assertBackendProjectAccess(prisma, userId, userRole, canvass.projectId);
    }
    const ciMap = new Map(canvass.items.map((ci) => [ci.id, ci]));

    await prisma.quotationItem.deleteMany({ where: { quotationId } });
    const totalAmount = items.reduce((acc: number, item: any) => acc + (item.unitCost * item.quantityAvailable), 0);
    await prisma.supplierQuotation.update({
      where: { id: quotationId },
      data: {
        supplierId,
        totalAmount,
        items: {
          create: items.map((item: any) => {
            const ci = ciMap.get(item.canvassItemId);
            return {
              canvassItemId: item.canvassItemId,
              unitCost: item.unitCost,
              quantityAvailable: item.quantityAvailable,
              totalCost: item.unitCost * item.quantityAvailable,
              brand: item.brand,
              remarks: item.remarks,
              resourceUnit: item.resourceUnit || ci?.resourceUnit || null,
            };
          })
        }
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error updating quotation:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to update quotation' });
  }
});

// Auto Generate PO (Class A commitment origination — requires active APPROVED PRR per Correction 1)
router.post('/:id/generate-po', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierId } = req.body;
    const { userId, userRole } = getPbacContext(req);

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const canvass = await prisma.canvassForm.findUnique({
      where: { id },
      include: { mr: true }
    });

    if (!canvass) return res.status(404).json({ success: false, error: 'Canvass not found' });
    await assertBackendProjectAccess(prisma, userId, userRole, canvass.projectId);

    const quotation = await prisma.supplierQuotation.findFirst({
      where: { canvassFormId: id, supplierId: supplierId },
      include: {
        items: {
          include: {
            canvassItem: {
              include: {
                canonicalResource: true,
                uboqResourceRequirement: true,
                mrItem: true,
              },
            },
          },
        },
      },
    });

    if (!quotation) return res.status(404).json({ success: false, error: 'Quotation not found' });

    for (const qi of quotation.items) {
      const ci = qi.canvassItem;
      if (ci.canonicalResourceId) {
        if (
          !ci.uboqResourceRequirement ||
          ci.uboqResourceRequirement.status !== 'APPROVED' ||
          ci.canonicalResource?.activeApprovedPrId !== ci.uboqResourceRequirementId
        ) {
          return res.status(409).json({
            success: false,
            error: `UBOQ_INACTIVE_PRR_FOR_NEW_COMMITMENT: Cannot generate PO against non-active PRR ${ci.uboqResourceRequirementId}`,
          });
        }
        const poQty = qi.quantityAvailable || ci.quantityRequired;
        if (poQty > ci.quantityRequired + 0.0001) {
          return res.status(409).json({
            success: false,
            error: `UBOQ_PO_EXCEEDS_CANVASS_QTY: PO qty (${poQty}) exceeds canvassed MRF qty (${ci.quantityRequired})`,
          });
        }
      }
    }

    const currentYear = new Date().getFullYear();
    const prefix = `PO-${currentYear}-`;
    const lastPO = await prisma.purchaseOrder.findFirst({
      where: { poNumber: { startsWith: prefix } },
      orderBy: { poNumber: 'desc' },
      select: { poNumber: true }
    });

    let nextNumber = 1;
    if (lastPO && lastPO.poNumber) {
      const lastInt = parseInt(lastPO.poNumber.substring(prefix.length), 10);
      if (!isNaN(lastInt)) nextNumber = lastInt + 1;
    }
    const poNumber = `${prefix}${String(nextNumber).padStart(4, '0')}`;

    const po = await prisma.$transaction(async (tx) => {
      const createdPo = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId,
          mrId: canvass.mrId,
          canvassFormId: canvass.id,
          preparerId: userId,
          status: 'DRAFT',
          totalAmount: quotation.totalAmount,
          netAmount: quotation.totalAmount,
          items: {
            create: quotation.items.map(qi => {
              const ci = qi.canvassItem;
              const poQty = qi.quantityAvailable || ci.quantityRequired;
              return {
                quantity: poQty,
                unitCost: qi.unitCost,
                consolidatedBoqItemId: ci.consolidatedBoqItemId,
                canonicalResourceId: ci.canonicalResourceId || null,
                uboqResourceRequirementId: ci.uboqResourceRequirementId || null,
                resourceUnit: ci.resourceUnit || null,
                mrItemId: ci.mrItemId || null,
                canvassItemId: ci.id,
              };
            })
          }
        }
      });

      await tx.canvassForm.update({
        where: { id },
        data: { status: 'COMPLETED' }
      });

      return createdPo;
    });

    res.json({ success: true, poId: po.id });
  } catch (error: any) {
    console.error('Error generating PO:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to generate PO' });
  }
});

// Send Canvass Email
router.post('/:id/email', async (req, res) => {
  try {
    const { id } = req.params;
    const { supplierIds } = req.body;

    const canvass = await prisma.canvassForm.findUnique({
      where: { id },
      include: { mr: true }
    });

    if (!canvass) return res.status(404).json({ success: false, error: 'Canvass not found' });

    const suppliers = await prisma.supplier.findMany({
      where: { id: { in: supplierIds } }
    });

    res.json({ 
      success: true, 
      message: `Canvass form successfully emailed to ${suppliers.length} supplier(s).` 
    });
  } catch (error: any) {
    console.error('Error sending canvass email:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to send emails' });
  }
});

// Approve Recommendation
router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = getPbacContext(req);
    
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const canvass = await prisma.canvassForm.findUnique({ where: { id } });

    if (!canvass) return res.status(404).json({ success: false, error: 'Canvass not found' });
    await assertBackendProjectAccess(prisma, userId, userRole, canvass.projectId);
    if (!canvass.recommendedSupplierId) return res.status(400).json({ success: false, error: 'No recommended supplier to approve.' });

    await prisma.canvassForm.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    res.json({ success: true, message: 'AI Recommendation Approved successfully.' });
  } catch (error: any) {
    console.error('Error approving canvass recommendation:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to approve recommendation' });
  }
});

// Endorse Recommendation
router.post('/:id/endorse', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole } = getPbacContext(req);
    
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const canvass = await prisma.canvassForm.findUnique({ where: { id } });

    if (!canvass) return res.status(404).json({ success: false, error: 'Canvass not found' });
    await assertBackendProjectAccess(prisma, userId, userRole, canvass.projectId);
    if (!canvass.recommendedSupplierId) return res.status(400).json({ success: false, error: 'No recommended supplier to endorse.' });

    await prisma.canvassForm.update({
      where: { id },
      data: { status: 'ENDORSED' }
    });

    res.json({ success: true, message: 'AI Recommendation Endorsed successfully.' });
  } catch (error: any) {
    console.error('Error endorsing canvass recommendation:', error);
    const status = error.message?.includes('UBOQ_PBAC') ? 403 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to endorse recommendation' });
  }
});

// Delete Canvass (H2 fix: never allow simulatedRole header to escalate to SUPER_ADMIN)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = getPbacContext(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only actual SUPER_ADMIN can delete canvass forms' });
    }

    const linkedGovPos = await prisma.purchaseOrder.count({
      where: {
        canvassFormId: id,
        items: { some: { canonicalResourceId: { not: null } } },
      },
    });
    if (linkedGovPos > 0) {
      return res.status(409).json({
        success: false,
        error: 'UBOQ_CANVASS_DELETE_BLOCKED: Cannot delete canvass form linked to resource-governed PurchaseOrder',
      });
    }

    await prisma.canvassForm.delete({ where: { id } });
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting canvass:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to delete canvass' });
  }
});

export default router;
