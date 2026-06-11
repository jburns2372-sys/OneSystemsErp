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

  // Let's assume outstanding payables are unpaid Purchase Orders minus paid ones
  // Since we don't have a direct payable balance, we'll sum PO totalAmounts that aren't PAID
  const unpaidPOs = await prisma.purchaseOrder.aggregate({
    where: { status: { not: 'PAID' } },
    _sum: { totalAmount: true },
  });
  const totalPayables = unpaidPOs._sum.totalAmount || 0;

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
    pendingMRFs
  };
}
