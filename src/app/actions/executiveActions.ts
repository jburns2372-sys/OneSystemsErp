'use server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('session')?.value || '';
}

/**
 * Validates that the current user has access to Executive dashboards
 */
async function checkExecutiveAccess() {
  const userId = await getUserId();
  await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView'); // Base requirement
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Unauthorized');

  // Support role simulation
  const cookieStore = await cookies();
  const simulatedRole = cookieStore.get('simulatedRole')?.value;
  
  const effectiveRole = (simulatedRole && (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'PROJECT_DIRECTOR' || user.role === 'DIRECTORS')) 
    ? simulatedRole 
    : (user.role || 'GUEST_USER');

  // Check if effective role is in the allowed executive roles list
  const allowedRoles = [
    'SYSTEM_ADMIN',
    'SUPER_ADMIN',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'PROJECT_MANAGER',
    'ADMINISTRATOR',
    'ADMIN'
  ];

  if (!allowedRoles.includes(effectiveRole)) {
    throw new Error('Unauthorized: Executive access required');
  }

  return { user, effectiveRole };
}

/**
 * Retrieves the high-level company overview KPIs for the Executive Home Dashboard
 */
export async function getCompanyOverview(projectId?: string) {
  const { user, effectiveRole } = await checkExecutiveAccess();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN';

  // Fetch all active/ongoing projects or the specific selected project
  const projectFilter: any = { status: { in: ['ACTIVE', 'ONGOING', 'STARTED'] } };
  if (projectId && projectId !== 'ALL') {
    projectFilter.id = projectId;
  }
  
  if (!isSuperAdmin) {
    projectFilter.userAssignments = {
      some: {
        userId: user.id,
        assignmentStatus: 'active'
      }
    };
  }

  const activeProjects = await prisma.project.findMany({
    where: projectFilter,
    select: {
      id: true,
      contractAmount: true,
      variationOrders: {
        where: { currentStatus: 'APPROVED' },
        select: { netVariationAmount: true }
      },
      billings: {
        where: { status: { in: ['APPROVED', 'SUBMITTED', 'PAID'] } },
        select: { currentBillingAmount: true, payments: { select: { amountPaid: true } } }
      },
      expenses: {
        where: { status: 'APPROVED' },
        select: { netAmount: true }
      },
      payrolls: {
        where: { paymentStatus: 'PAID' },
        select: { netPay: true }
      },
      subcontractBillings: {
        where: { approvalStatus: 'APPROVED' },
        select: { currentGross: true, remainingBalance: true, packageId: true, jobOrderId: true }
      },
      materialRequests: {
        select: {
          purchaseOrders: {
            select: {
              payables: {
                where: { status: { not: 'PAID' } },
                select: { amount: true, paidAmount: true, status: true }
              }
            }
          }
        }
      },
      _count: {
        select: {
          projectValidations: {
            where: { riskLevel: { in: ['HIGH', 'CRITICAL'] } }
          }
        }
      }
    }
  });

  let totalContractAmount = 0;
  let totalApprovedVOs = 0;
  let totalBilledAmount = 0;
  let totalCollectedAmount = 0;
  let totalOutstandingReceivables = 0;
  let totalActualCost = 0;
  let totalSubcontractPayables = 0;
  let totalJobOrderPayables = 0;
  let totalSupplierPayables = 0;
  let totalCriticalRisks = 0;

  activeProjects.forEach(p => {
    // Contract & VOs
    totalContractAmount += p.contractAmount;
    const projectVOs = p.variationOrders.reduce((sum, vo) => sum + (vo.netVariationAmount || 0), 0);
    totalApprovedVOs += projectVOs;

    // Billings & Collections
    p.billings.forEach(b => {
      totalBilledAmount += b.currentBillingAmount;
      const collected = b.payments.reduce((sum, pmt) => sum + pmt.amountPaid, 0);
      totalCollectedAmount += collected;
      totalOutstandingReceivables += (b.currentBillingAmount - collected);
    });

    // Costs
    const projectExpenses = p.expenses.reduce((sum, e) => sum + e.netAmount, 0);
    const projectPayrolls = p.payrolls.reduce((sum, pr) => sum + (pr.netPay || 0), 0);
    const projectSubcontract = p.subcontractBillings.reduce((sum, sb) => sum + sb.currentGross, 0);
    
    totalActualCost += (projectExpenses + projectPayrolls + projectSubcontract);

    // Payables
    p.subcontractBillings.forEach(sb => {
      if (sb.packageId) totalSubcontractPayables += sb.remainingBalance;
      if (sb.jobOrderId) totalJobOrderPayables += sb.remainingBalance;
    });

    p.materialRequests.forEach(mr => {
      mr.purchaseOrders.forEach(po => {
        po.payables.forEach(payable => {
          if (payable.status === 'ACCRUED') {
            totalSupplierPayables += payable.amount;
          } else {
            totalSupplierPayables += (payable.amount - payable.paidAmount);
          }
        });
      });
    });

    // Risks
    totalCriticalRisks += p._count.projectValidations;
  });

  return {
    activeProjectsCount: activeProjects.length,
    totalContractAmount,
    totalApprovedVOs,
    revisedContractAmount: totalContractAmount + totalApprovedVOs,
    totalBilledAmount,
    totalCollectedAmount,
    totalOutstandingReceivables,
    totalActualCost,
    totalSubcontractPayables,
    totalJobOrderPayables,
    totalSupplierPayables,
    totalProjectExpensesToDate: totalSubcontractPayables + totalJobOrderPayables + totalSupplierPayables,
    totalCriticalRisks,
    
    // Derived Metrics
    overallProgressPercentage: totalContractAmount > 0 ? (totalBilledAmount / totalContractAmount) * 100 : 0,
    costToDateRatio: totalContractAmount > 0 ? (totalActualCost / totalContractAmount) * 100 : 0
  };
}

/**
 * Retrieves the project portfolio list for the executive dashboard
 */
export async function getProjectPortfolio() {
  const { user, effectiveRole } = await checkExecutiveAccess();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN';

  const projects = await prisma.project.findMany({
    where: isSuperAdmin ? undefined : {
      userAssignments: {
        some: {
          userId: user.id,
          assignmentStatus: 'active'
        }
      }
    },
    orderBy: { contractAmount: 'desc' },
    select: {
      id: true,
      name: true,
      contractNumber: true,
      client: true,
      status: true,
      contractAmount: true,
      startDate: true,
      revisedCompletionDate: true,
      originalCompletionDate: true,
      projectValidationScore: true, // Fetch AI risk score
      variationOrders: {
        where: { currentStatus: 'APPROVED' },
        select: { netVariationAmount: true }
      },
      billings: {
        where: { status: { in: ['APPROVED', 'SUBMITTED', 'PAID'] } },
        select: { currentBillingAmount: true, payments: { select: { amountPaid: true } } }
      }
    }
  });

  return projects.map(p => {
    const totalVOs = p.variationOrders.reduce((sum, vo) => sum + (vo.netVariationAmount || 0), 0);
    const revisedAmount = p.contractAmount + totalVOs;
    const totalBilled = p.billings.reduce((sum, b) => sum + b.currentBillingAmount, 0);
    const progress = revisedAmount > 0 ? (totalBilled / revisedAmount) * 100 : 0;
    
    return {
      ...p,
      totalVOs,
      revisedAmount,
      totalBilled,
      progressPercentage: progress,
      // Default to GRAY risk if no score exists yet
      riskLevel: p.projectValidationScore?.riskLevel || 'GRAY',
      validationConfidenceScore: p.projectValidationScore?.validationConfidenceScore || 0
    };
  });
}
