// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = Router();

// Helper to get user authentication details
async function getUserAuthDetails(sessionId: string | null) {
  let user = null;
  if (sessionId) {
    user = await prisma.user.findUnique({ where: { id: sessionId } });
  }
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';
  return { user, isSuperAdmin };
}

// Helper to construct project filtering conditions based on auth and active project ID
function getProjectFilter(isSuperAdmin: boolean, sessionId: string | null, activeProjectId: string | null) {
  const filter: any = {};
  if (!isSuperAdmin && sessionId) {
    filter.userAssignments = { some: { userId: sessionId, assignmentStatus: 'active' } };
  }
  if (activeProjectId) {
    filter.id = activeProjectId;
  }
  return filter;
}

// AWS Express endpoint for getFinancialReport
router.post('/getFinancialReport', async (req, res) => {
  try {
    const { sessionId, activeProjectId } = req.body;

    const { isSuperAdmin } = await getUserAuthDetails(sessionId);
    const projectFilter = getProjectFilter(isSuperAdmin, sessionId, activeProjectId);

    const projects = await prisma.project.findMany({
      where: projectFilter,
      select: {
        id: true,
        name: true,
        contractAmount: true,
        status: true,
        expenses: {
          select: { amount: true }
        }
      }
    });

    const unpaidPOs = await prisma.purchaseOrder.aggregate({
      where: { status: { not: 'PAID' } },
      _sum: { totalAmount: true }
    });

    const report = projects.map(p => {
      const totalExpenses = p.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      return {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        budget: p.contractAmount || 0,
        expenses: totalExpenses,
        balance: (p.contractAmount || 0) - totalExpenses
      };
    });

    res.json({
      success: true,
      projectFinancials: report,
      globalOutstandingPayables: unpaidPOs._sum.totalAmount || 0
    });
  } catch (error: any) {
    console.error('Error in getFinancialReport:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AWS Express endpoint for getProjectReport
router.post('/getProjectReport', async (req, res) => {
  try {
    const { sessionId, activeProjectId } = req.body;

    const { isSuperAdmin } = await getUserAuthDetails(sessionId);
    const projectFilter = getProjectFilter(isSuperAdmin, sessionId, activeProjectId);

    const projects = await prisma.project.findMany({
      where: projectFilter,
      select: {
        id: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        awardedBoqItems: {
          select: { percentageAccomplished: true }
        }
      }
    });

    const report = projects.map(p => {
      let avgAccomplishment = 0;
      if (p.awardedBoqItems.length > 0) {
        const sum = p.awardedBoqItems.reduce((acc, item) => acc + (item.percentageAccomplished || 0), 0);
        avgAccomplishment = sum / p.awardedBoqItems.length;
      }

      return {
        projectId: p.id,
        projectName: p.name,
        status: p.status,
        startDate: p.startDate,
        endDate: p.endDate,
        accomplishment: avgAccomplishment
      };
    });

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error in getProjectReport:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AWS Express endpoint for getInventoryReport (STK-UI-01: reconciles resource-governed opening + delivered - issued stock!)
router.post('/getInventoryReport', async (req, res) => {
  try {
    const { sessionId, activeProjectId } = req.body;
    const effectiveSessionId = req.user?.id || sessionId;
    const { isSuperAdmin } = await getUserAuthDetails(effectiveSessionId);

    const baseWhere: any = {};
    if (!isSuperAdmin && effectiveSessionId) {
      baseWhere.project = {
        userAssignments: { some: { userId: effectiveSessionId, assignmentStatus: { in: ['active', 'ACTIVE'] } } }
      };
    }
    if (activeProjectId) {
      baseWhere.projectId = activeProjectId;
    }

    const items = await prisma.consolidatedBOQItem.findMany({
      where: baseWhere,
      include: {
        uboqCanonicalAccounts: true,
      },
    });

    const report: any[] = [];
    for (const item of items) {
      if (item.isUboqResourceGoverned || item.uboqCanonicalAccounts.length > 0) {
        for (const acct of item.uboqCanonicalAccounts) {
          const qoh = Number(acct.availablePhysicalStockQty);
          if (qoh > 0 || Number(acct.damagedReturnedQty) > 0) {
            const unitCost = Number(acct.targetResourceUnitCost);
            report.push({
              stockId: acct.id,
              consolidatedBoqItemId: item.id,
              isUboqResourceGoverned: true,
              category: item.category || 'UBOQ_RESOURCE',
              resourceCode: acct.resourceCode,
              description: `${acct.resourceDescription} (${acct.resourceSpec})`,
              unit: acct.resourceUomNormalized,
              allocatedUsableStockQty: Number(acct.allocatedUsableStockQty),
              deliveredReceivedQty: Number(acct.deliveredReceivedQty),
              consumedIssuedQty: Number(acct.consumedIssuedQty),
              damagedQuarantinedQty: Number(acct.damagedReturnedQty),
              quantityOnHand: qoh,
              estimatedUnitCost: unitCost,
              totalEstimatedValue: Number((qoh * unitCost).toFixed(2)),
            });
          }
        }
      } else {
        const qoh = item.deliveredQty - item.consumedQty;
        if (qoh > 0) {
          report.push({
            stockId: item.id,
            isUboqResourceGoverned: false,
            category: item.category || 'Uncategorized',
            description: item.description,
            unit: item.unit,
            quantityOnHand: qoh,
            estimatedUnitCost: item.unitCost,
            totalEstimatedValue: Number((qoh * item.unitCost).toFixed(2)),
          });
        }
      }
    }

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error in getInventoryReport:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
