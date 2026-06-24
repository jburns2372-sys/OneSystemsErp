'use server';

import { prisma } from '@/lib/prisma';

export async function getFinancialReport() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

  const user = sessionId ? await prisma.user.findUnique({ where: { id: sessionId } }) : null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  const filter: any = {};
  if (!isSuperAdmin && sessionId) {
    filter.userAssignments = { some: { userId: sessionId, assignmentStatus: 'active' } };
  }
  if (activeProjectId) {
    filter.id = activeProjectId;
  }

  const projects = await prisma.project.findMany({
    where: filter,
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
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

  const user = sessionId ? await prisma.user.findUnique({ where: { id: sessionId } }) : null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  const filter: any = {};
  if (!isSuperAdmin && sessionId) {
    filter.userAssignments = { some: { userId: sessionId, assignmentStatus: 'active' } };
  }
  if (activeProjectId) {
    filter.id = activeProjectId;
  }

  const projects = await prisma.project.findMany({
    where: filter,
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
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

  const user = sessionId ? await prisma.user.findUnique({ where: { id: sessionId } }) : null;
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  const baseProjectFilter: any = {};
  if (!isSuperAdmin && sessionId) {
    baseProjectFilter.userAssignments = { some: { userId: sessionId, assignmentStatus: 'active' } };
  }

  const filter: any = {
    deliveredQty: {
      gt: prisma.consolidatedBOQItem.fields.consumedQty
    }
  };

  if (!isSuperAdmin && sessionId) {
    filter.project = baseProjectFilter;
  }
  if (activeProjectId) {
    filter.projectId = activeProjectId;
  }

  const items = await prisma.consolidatedBOQItem.findMany({
    where: filter,
    select: {
      id: true,
      category: true,
      description: true,
      unitCost: true,
      deliveredQty: true,
      consumedQty: true,
    }
  });

  const report = items.map(item => {
    const qoh = item.deliveredQty - item.consumedQty;
    return {
      stockId: item.id,
      category: item.category || 'Uncategorized',
      description: item.description,
      quantityOnHand: qoh,
      estimatedUnitCost: item.unitCost,
      totalEstimatedValue: qoh * item.unitCost
    };
  });

  return report;
}
