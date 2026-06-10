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

  return {
    totalProjects,
    pendingMRs,
    totalBudget,
    totalUsers,
    totalExpenses,
    totalPayables,
    accomplishmentPercentage,
  };
}
