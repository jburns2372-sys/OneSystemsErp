'use server';

import { prisma } from '@/lib/prisma';

export async function getFinancialReport() {
  const projects = await prisma.project.findMany({
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

  // Calculate outstanding payables globally for now
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

  return {
    projectFinancials: report,
    globalOutstandingPayables: unpaidPOs._sum.totalAmount || 0
  };
}

export async function getProjectReport() {
  const projects = await prisma.project.findMany({
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

  return report;
}

export async function getInventoryReport() {
  // Inventory tracking is calculated via Delivery and Issuance.
  // Returning an empty array for now until a dedicated Inventory views are built.
  return [];
}
