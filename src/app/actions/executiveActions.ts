'use server';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

const PUBLIC_EXECUTIVE_AUTH_ERRORS = new Set([
  'Unauthorized: Session token missing',
  'Unauthorized: User not found',
  'Unauthorized: Account inactive',
  'Unauthorized: Executive access required',
]);

function toPublicExecutiveError(error: unknown, fallbackMessage: string): Error {
  const msg = error instanceof Error ? error.message : '';
  if (PUBLIC_EXECUTIVE_AUTH_ERRORS.has(msg)) {
    return new Error(msg);
  }
  return new Error(fallbackMessage);
}

async function _getAccessDetails() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionToken = __session?.id || '';
  const simulatedRoleFromRequest = cookieStore.get('simulatedRole')?.value;

  const userId = sessionToken || ''; 

  if (!userId) {
    throw new Error('Unauthorized: Session token missing');
  }

  // Disabled requirePermission for NextJS server action to prevent dependency cycle
  // await requirePermission(userId, 'PROJECT_MANAGEMENT', 'canView'); 
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('Unauthorized: User not found');
  if ((user as any).status && (user as any).status !== 'ACTIVE') {
    throw new Error('Unauthorized: Account inactive');
  }
  if ((user as any).lockedUntil && (user as any).lockedUntil > new Date()) {
    throw new Error('Unauthorized: Account inactive');
  }

  const GUEST_ROLE_ALIASES = new Set(['GUEST_USER', 'GUEST USER']);
  let primaryRoleRecord = await prisma.role.findFirst({
    where: { OR: [{ roleCode: user.role }, { roleName: user.role }] },
    include: { rolePermissions: true },
  });
  if (!primaryRoleRecord && user.role === 'SYSTEM_ADMIN') {
    primaryRoleRecord = await prisma.role.findFirst({
      where: { OR: [{ roleCode: 'SUPER_ADMIN' }, { roleName: 'SUPER_ADMIN' }] },
      include: { rolePermissions: true },
    });
  }
  const assignedRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { rolePermissions: true } } },
  });

  if (!primaryRoleRecord?.isActive) {
    throw new Error('Unauthorized: Executive access required');
  }

  const isGuestActor =
    GUEST_ROLE_ALIASES.has(user.role) ||
    GUEST_ROLE_ALIASES.has(primaryRoleRecord.roleCode) ||
    GUEST_ROLE_ALIASES.has(primaryRoleRecord.roleName) ||
    assignedRoles.some(
      ({ role }: any) =>
        role?.isActive && (GUEST_ROLE_ALIASES.has(role.roleCode) || GUEST_ROLE_ALIASES.has(role.roleName))
    );
  if (isGuestActor) {
    throw new Error('Unauthorized: Executive access required');
  }

  const isRealSystemAdmin =
    (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') &&
    primaryRoleRecord.isActive === true;

  const hasModuleView = (roleObj: any) =>
    Boolean(
      roleObj?.isActive &&
        roleObj.rolePermissions?.some(
          (rp: any) => rp.moduleName === 'PROJECT_MANAGEMENT' && rp.canView === true
        )
    );

  const realCanViewProjects =
    hasModuleView(primaryRoleRecord) ||
    assignedRoles.some(({ role }: any) => hasModuleView(role));
  if (!realCanViewProjects) {
    throw new Error('Unauthorized: Executive access required');
  }

  const effectiveRole = (simulatedRoleFromRequest && isRealSystemAdmin)
    ? simulatedRoleFromRequest
    : (user.role || 'GUEST_USER');

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

  if (simulatedRoleFromRequest && isRealSystemAdmin) {
    let simRoleRecord = await prisma.role.findFirst({
      where: { OR: [{ roleCode: simulatedRoleFromRequest }, { roleName: simulatedRoleFromRequest }] },
      include: { rolePermissions: true },
    });
    if (!simRoleRecord && simulatedRoleFromRequest === 'SYSTEM_ADMIN') {
      simRoleRecord = await prisma.role.findFirst({
        where: { OR: [{ roleCode: 'SUPER_ADMIN' }, { roleName: 'SUPER_ADMIN' }] },
        include: { rolePermissions: true },
      });
    }
    if (
      !simRoleRecord?.isActive ||
      GUEST_ROLE_ALIASES.has(simulatedRoleFromRequest) ||
      GUEST_ROLE_ALIASES.has(simRoleRecord.roleCode) ||
      GUEST_ROLE_ALIASES.has(simRoleRecord.roleName) ||
      !hasModuleView(simRoleRecord)
    ) {
      throw new Error('Unauthorized: Executive access required');
    }
  }

  return { user, effectiveRole, isRealSystemAdmin };
}

/**
 * Retrieves the high-level company overview KPIs for the Executive Home Dashboard
 */
export async function getCompanyOverview(projectId?: string) {
  try {
    const { user, effectiveRole, isRealSystemAdmin } = await _getAccessDetails();
    const isSuperAdmin = isRealSystemAdmin && (effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN');

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

    const result = {
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

    return result;
  } catch (error: any) {
    const publicErr = toPublicExecutiveError(error, 'Failed to get company overview');
    console.error('Error in getCompanyOverview');
    throw publicErr;
  }
}

/**
 * Retrieves the project portfolio list for the executive dashboard
 */
export async function getProjectPortfolio() {
  try {
    const { user, effectiveRole, isRealSystemAdmin } = await _getAccessDetails();
    const isSuperAdmin = isRealSystemAdmin && (effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'SYSTEM_ADMIN');

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
        },
        consolidatedBoqItems: {
          select: { totalCost: true }
        }
      }
    });

    const result = projects.map(p => {
      const totalVOs = p.variationOrders.reduce((sum, vo) => sum + (vo.netVariationAmount || 0), 0);
      const revisedAmount = p.contractAmount + totalVOs;
      const totalBilled = p.billings.reduce((sum, b) => sum + b.currentBillingAmount, 0);
      const progress = revisedAmount > 0 ? (totalBilled / revisedAmount) * 100 : 0;
      const consolidatedCost = p.consolidatedBoqItems.reduce((sum, i) => sum + (i.totalCost || 0), 0);
      
      return {
        ...p,
        totalVOs,
        revisedAmount,
        totalBilled,
        progressPercentage: progress,
        consolidatedCost,
        // Default to GRAY risk if no score exists yet
        riskLevel: (p as any).projectValidationScore?.riskLevel || 'GRAY',
        validationConfidenceScore: (p as any).projectValidationScore?.validationConfidenceScore || 0
      };
    });

    return result;
  } catch (error: any) {
    const publicErr = toPublicExecutiveError(error, 'Failed to get project portfolio');
    console.error('Error in getProjectPortfolio');
    throw publicErr;
  }
}
