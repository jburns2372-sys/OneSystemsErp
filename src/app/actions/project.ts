'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function getDashboardStats() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;
  let activeProjectId = cookieStore.get('activeProjectId')?.value;
  const simulatedRole = cookieStore.get('simulatedRole')?.value;

  if (activeProjectId && activeProjectId !== 'ALL') {
    const projectExists = await prisma.project.findUnique({ where: { id: activeProjectId } });
    if (!projectExists) {
      activeProjectId = undefined;
    }
  }

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

  let finalProjectFilter: any = { status: { in: ['ACTIVE', 'ONGOING', 'STARTED', 'PLANNING'] } };
  if (activeProjectId && activeProjectId !== 'ALL') {
    finalProjectFilter.id = activeProjectId;
  } else if (projectIds !== undefined) {
    finalProjectFilter.id = { in: projectIds };
  }

  let relationProjectFilter: any = {};
  if (activeProjectId && activeProjectId !== 'ALL') {
    relationProjectFilter = { projectId: activeProjectId };
  } else if (projectIds !== undefined) {
    relationProjectFilter = { projectId: { in: projectIds } };
  }

  // Portfolio-wide filters (ignore activeProjectId for high-level counts)
  let portfolioFilter: any = { status: { in: ['ACTIVE', 'ONGOING', 'STARTED', 'PLANNING'] } };
  if (projectIds !== undefined) {
    portfolioFilter.id = { in: projectIds };
  }

  const totalProjects = await prisma.project.count({ where: portfolioFilter });
  const totalUsers = await prisma.user.count();

  const pendingMRs = await prisma.materialRequest.count({
    where: { status: 'PENDING', ...relationProjectFilter },
  });

  const allPortfolioProjects = await prisma.project.findMany({
    where: portfolioFilter,
    select: { contractAmount: true },
  });
  const totalBudget = allPortfolioProjects.reduce((sum, p) => sum + (p.contractAmount || 0), 0);

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
    if (!user) {
      return { success: false, error: 'Unauthorized: User not found' };
    }

    const simulatedRole = cookieStore.get('simulatedRole')?.value;
    const effectiveRole = simulatedRole ? simulatedRole : user.role;

    if (effectiveRole !== 'SUPER_ADMIN' && effectiveRole !== 'SYSTEM_ADMIN') {
      return { success: false, error: 'Unauthorized: Only SUPER_ADMIN can delete projects' };
    }

    // Manual cascade delete to avoid foreign key constraint errors
    await prisma.$transaction([
      prisma.projectUserAssignment.deleteMany({ where: { projectId } }),


      prisma.project.delete({ where: { id: projectId } })
    ]);

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}

export async function updateProjectDates(projectId: string, startDateStr: string, durationDays: number) {
  try {
    const startDate = new Date(startDateStr);
    const originalCompletionDate = new Date(startDate);
    originalCompletionDate.setDate(originalCompletionDate.getDate() + durationDays);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        startDate,
        originalContractDuration: durationDays,
        originalCompletionDate,
        revisedCompletionDate: originalCompletionDate, // Align revised with original for safety initially
      },
      include: {
        projectSchedule: true
      }
    });

    return {
      success: true,
      hasSchedule: !!project.projectSchedule
    };
  } catch (error: any) {
    console.error('Error updating project dates:', error);
    return { success: false, error: error.message || 'Failed to update project dates' };
  }
}
