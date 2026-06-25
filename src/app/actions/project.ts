'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function getDashboardStats() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;
  const activeProjectId = cookieStore.get('activeProjectId')?.value;
  const simulatedRole = cookieStore.get('simulatedRole')?.value;

  let projectIds: string[] | undefined = undefined;
  
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { projectAssignments: { where: { assignmentStatus: 'active' } } }
    });

    if (user) {
      const effectiveRole = (simulatedRole && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROJECT_DIRECTOR' || user.role === 'DIRECTORS'))
        ? simulatedRole
        : (user.role || 'GUEST_USER');
      
      const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN';

      if (!isSuperAdmin) {
        projectIds = user.projectAssignments.map(pa => pa.projectId);
      }
    }
  }

  let finalProjectFilter: any = {};
  if (activeProjectId && activeProjectId !== 'ALL') {
    finalProjectFilter = { id: activeProjectId };
  } else if (projectIds !== undefined) {
    finalProjectFilter = { id: { in: projectIds } };
  }

  let relationProjectFilter: any = {};
  if (activeProjectId && activeProjectId !== 'ALL') {
    relationProjectFilter = { projectId: activeProjectId };
  } else if (projectIds !== undefined) {
    relationProjectFilter = { projectId: { in: projectIds } };
  }

  const totalProjects = await prisma.project.count({ where: finalProjectFilter });
  const totalUsers = await prisma.user.count();

  const pendingMRs = await prisma.materialRequest.count({
    where: { status: 'PENDING', ...relationProjectFilter },
  });

  const projects = await prisma.project.findMany({
    where: finalProjectFilter,
    select: { contractAmount: true },
  });
  const totalBudget = projects.reduce((sum, p) => sum + (p.contractAmount || 0), 0);

  const expenses = await prisma.expense.aggregate({
    where: relationProjectFilter,
    _sum: { amount: true },
  });
  const totalExpenses = expenses._sum.amount || 0;

  const apWhere: any = { status: { not: 'PAID' } };
  if (relationProjectFilter.projectId) {
    apWhere.po = { mr: { projectId: relationProjectFilter.projectId } };
  }
  const unpaidAP = await prisma.accountsPayable.aggregate({
    where: apWhere,
    _sum: { amount: true },
  });
  
  const sbWhere: any = { paymentStatus: { not: 'PAID' } };
  if (relationProjectFilter.projectId) {
    sbWhere.projectId = relationProjectFilter.projectId;
  }
  const unpaidSubcontract = await prisma.subcontractBilling.aggregate({
    where: sbWhere,
    _sum: { netPayable: true },
  });

  const totalPayables = (unpaidAP._sum.amount || 0) + (unpaidSubcontract._sum.netPayable || 0);

  const boqStats = await prisma.awardedBOQItem.aggregate({
    where: relationProjectFilter,
    _avg: { percentageAccomplished: true },
  });
  const accomplishmentPercentage = boqStats._avg.percentageAccomplished || 0;

  const pendingAIOverrides = await prisma.aIValidationOverride.count({
    where: { approvedBy: null }
  });

  const pendingPettyCash = await prisma.pettyCashAccount.count({
    where: { currentBalance: { lt: 5000 }, ...relationProjectFilter }
  });

  const activePayrollPeriods = await prisma.payrollPeriod.count({
    where: { status: { in: ['DRAFT', 'PROCESSING', 'PENDING_APPROVAL'] }, ...relationProjectFilter }
  });

  const activePurchaseOrders = await prisma.purchaseOrder.count({
    where: { 
      status: { in: ['PENDING', 'APPROVED', 'PARTIAL_DELIVERY'] },
      mr: relationProjectFilter.projectId ? { projectId: relationProjectFilter.projectId } : undefined
    }
  });

  const expectedDeliveries = await prisma.purchaseOrder.count({
    where: { 
      status: { in: ['APPROVED', 'PARTIAL_DELIVERY'] },
      mr: relationProjectFilter.projectId ? { projectId: relationProjectFilter.projectId } : undefined
    }
  });

  const pendingMRFs = await prisma.materialRequest.count({
    where: { status: 'PENDING', ...relationProjectFilter }
  });

  const openCanvassing = await prisma.canvassForm.count({
    where: { 
      status: { in: ['DRAFT', 'PENDING', 'OPEN', 'FOR_REVIEW'] },
      projectId: relationProjectFilter.projectId
    }
  });

  const totalWorkers = await prisma.worker.count({
    where: relationProjectFilter.projectId ? { projectId: relationProjectFilter.projectId } : undefined
  });
  const totalSubcontractors = await prisma.subcontractor.count();
  const totalSuppliers = await prisma.supplier.count();
  const totalAccomplishments = await prisma.accomplishment.count({
    where: relationProjectFilter
  });
  const totalIssuances = await prisma.materialIssuance.count({
    where: relationProjectFilter
  });
  const totalAuditLogs = await prisma.auditLog.count();
  const totalDailyLogs = await prisma.dailyTimeRecord.count({
    where: relationProjectFilter.projectId ? { projectId: relationProjectFilter.projectId } : undefined
  });
  const totalDocuments = await prisma.document.count({
    where: relationProjectFilter.projectId ? { projectId: relationProjectFilter.projectId } : undefined
  });
  const totalJobOrders = await prisma.jobOrder.count({
    where: relationProjectFilter
  });
  const totalVariationOrders = await prisma.variationOrder.count({
    where: relationProjectFilter
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
    const cookieStore = await cookies();
    const userId = cookieStore.get('session')?.value;
    
    if (!userId) {
      return { success: false, error: 'Unauthorized: Please log in' };
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'SUPER_ADMIN') {
      return { success: false, error: 'Unauthorized: Only SUPER_ADMIN can delete projects' };
    }

    await prisma.project.delete({
      where: { id: projectId }
    });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}
