'use server';

import { prisma } from '@/lib/prisma';

export async function getDashboardStats() {
  const totalProjects = await prisma.project.count();
  const totalUsers = await prisma.user.count();
  const pendingMRs = await prisma.materialRequest.count({
    where: { status: 'PENDING' },
  });

  const projects = await prisma.project.findMany({
    select: { contractAmount: true },
  });
  const totalBudget = projects.reduce((sum, p) => sum + (p.contractAmount || 0), 0);

  const expenses = await prisma.expense.aggregate({
    _sum: { amount: true },
  });
  const totalExpenses = expenses._sum.amount || 0;

  const unpaidAP = await prisma.accountsPayable.aggregate({
    where: { status: { not: 'PAID' } },
    _sum: { amount: true },
  });
  
  const unpaidSubcontract = await prisma.subcontractBilling.aggregate({
    where: { paymentStatus: { not: 'PAID' } },
    _sum: { netPayable: true },
  });

  const totalPayables = (unpaidAP._sum.amount || 0) + (unpaidSubcontract._sum.netPayable || 0);

  // For accomplishment percentage, we can average across all projects if we have awardedBoqItems 
  // with percentageAccomplished, but for now we'll return a default 0 if we can't compute it easily.
  // Actually, we can get awardedBoqItems average percentage:
  const boqStats = await prisma.awardedBOQItem.aggregate({
    _avg: { percentageAccomplished: true },
  });
  const accomplishmentPercentage = boqStats._avg.percentageAccomplished || 0;

  // Additional Role-Specific Stats
  const pendingAIOverrides = await prisma.aIValidationOverride.count({
    where: { approvedBy: null }
  });

  const pendingPettyCash = await prisma.pettyCashAccount.count({
    where: { currentBalance: { lt: 5000 } } // arbitrary threshold for "needs replenishment"
  });

  const activePayrollPeriods = await prisma.payrollPeriod.count({
    where: { status: { in: ['DRAFT', 'PROCESSING', 'PENDING_APPROVAL'] } }
  });

  const activePurchaseOrders = await prisma.purchaseOrder.count({
    where: { status: { in: ['PENDING', 'APPROVED', 'PARTIAL_DELIVERY'] } }
  });

  const expectedDeliveries = await prisma.purchaseOrder.count({
    where: { status: { in: ['APPROVED', 'PARTIAL_DELIVERY'] } }
  });

  const pendingMRFs = await prisma.materialRequest.count({
    where: { status: 'PENDING' }
  });

  const openCanvassing = await prisma.canvassForm.count({
    where: { status: { in: ['DRAFT', 'PENDING', 'OPEN', 'FOR_REVIEW'] } }
  });

  // Real counts for every dashboard card
  const totalWorkers = await prisma.worker.count();
  const totalSubcontractors = await prisma.subcontractor.count();
  const totalSuppliers = await prisma.supplier.count();
  const totalAccomplishments = await prisma.accomplishment.count();
  const totalIssuances = await prisma.materialIssuance.count();
  const totalAuditLogs = await prisma.auditLog.count();
  const totalDailyLogs = await prisma.dailyTimeRecord.count();
  const totalDocuments = await prisma.document.count();
  const totalJobOrders = await prisma.jobOrder.count();
  const totalVariationOrders = await prisma.variationOrder.count();

  return {
    totalProjects,
    pendingMRs,
    totalBudget,
    totalUsers,
    totalExpenses,
    totalPayables,
    accomplishmentPercentage,
    pendingAIOverrides,
    pendingPettyCash,
    activePayrollPeriods,
    activePurchaseOrders,
    expectedDeliveries,
    pendingMRFs,
    openCanvassing,
    totalWorkers,
    totalSubcontractors,
    totalSuppliers,
    totalAccomplishments,
    totalIssuances,
    totalAuditLogs,
    totalDailyLogs,
    totalDocuments,
    totalJobOrders,
    totalVariationOrders
  };
}

export async function assignProjectManager(projectId: string, managerId: string | null) {
  await prisma.project.update({
    where: { id: projectId },
    data: { managerId }
  });
}

export async function deleteProject(projectId: string) {
  try {
    await prisma.project.delete({
      where: { id: projectId }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}
