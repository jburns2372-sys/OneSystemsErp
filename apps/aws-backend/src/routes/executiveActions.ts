// @ts-nocheck
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const router = Router();
const EXEC_GUEST_ROLES = new Set(['GUEST USER', 'GUEST_USER']);

const PUBLIC_EXEC_ERRORS = new Map<string, number>([
  ['Unauthorized: Session token missing', 401],
  ['Unauthorized: User not found', 401],
  ['Unauthorized: Account inactive', 403],
  ['Unauthorized: Executive access required', 403],
  ['Forbidden: Body sessionToken does not match authenticated user.', 403],
]);

/**
 * Internal helper function to validate user access and retrieve effective role
 * strictly from middleware-verified request identity (`req.user` / `x-user-session`),
 * never trusting caller-supplied `req.body.sessionToken` or `req.body.simulatedRole`.
 */
async function _getAccessDetails(req: any) {
  const verifiedUserId =
    (typeof req.user?.id === 'string' && req.user.id) ||
    (typeof req.headers?.['x-user-session'] === 'string' ? req.headers['x-user-session'] : '');

  if (!verifiedUserId) {
    throw new Error('Unauthorized: Session token missing');
  }

  const bodySessionToken = req.body?.sessionToken;
  if (typeof bodySessionToken === 'string' && bodySessionToken && bodySessionToken !== verifiedUserId) {
    throw new Error('Forbidden: Body sessionToken does not match authenticated user.');
  }

  const user = await prisma.user.findUnique({ where: { id: verifiedUserId } });
  if (!user) throw new Error('Unauthorized: User not found');
  if ((user.status && user.status !== 'ACTIVE') || (user.lockedUntil && user.lockedUntil > new Date())) {
    throw new Error('Unauthorized: Account inactive');
  }

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
    where: { userId: verifiedUserId },
    include: { role: { include: { rolePermissions: true } } },
  });

  const isGuestActor =
    EXEC_GUEST_ROLES.has(user.role) ||
    EXEC_GUEST_ROLES.has(primaryRoleRecord?.roleCode) ||
    EXEC_GUEST_ROLES.has(primaryRoleRecord?.roleName) ||
    assignedRoles.some(
      ({ role }: any) =>
        role?.isActive && (EXEC_GUEST_ROLES.has(role.roleCode) || EXEC_GUEST_ROLES.has(role.roleName))
    );

  const hasProjectViewGrant = (roleObj: any) =>
    Boolean(
      roleObj?.isActive &&
        roleObj.rolePermissions?.some(
          (rp: any) => rp.moduleName === 'PROJECT_MANAGEMENT' && rp.canView === true
        )
    );

  if (!primaryRoleRecord?.isActive || isGuestActor) {
    throw new Error('Unauthorized: Executive access required');
  }

  // Only active primary global system admins can simulate roles; simulation cannot widen PBAC.
  const isRealSystemAdmin =
    (user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN') &&
    primaryRoleRecord.isActive === true;
  const verifiedSimulatedRole =
    typeof req.pbacContext?.simulatedRole === 'string' ? req.pbacContext.simulatedRole : undefined;
  if (verifiedSimulatedRole && !isRealSystemAdmin) {
    throw new Error('Unauthorized: Executive access required');
  }

  const realCanViewProjects =
    hasProjectViewGrant(primaryRoleRecord) ||
    assignedRoles.some(({ role }: any) => hasProjectViewGrant(role));
  if (!realCanViewProjects) {
    throw new Error('Unauthorized: Executive access required');
  }

  if (verifiedSimulatedRole) {
    let simRoleRecord = await prisma.role.findFirst({
      where: { OR: [{ roleCode: verifiedSimulatedRole }, { roleName: verifiedSimulatedRole }] },
      include: { rolePermissions: true },
    });
    if (!simRoleRecord && verifiedSimulatedRole === 'SYSTEM_ADMIN') {
      simRoleRecord = await prisma.role.findFirst({
        where: { OR: [{ roleCode: 'SUPER_ADMIN' }, { roleName: 'SUPER_ADMIN' }] },
        include: { rolePermissions: true },
      });
    }
    if (
      !simRoleRecord?.isActive ||
      EXEC_GUEST_ROLES.has(verifiedSimulatedRole) ||
      EXEC_GUEST_ROLES.has(simRoleRecord.roleCode) ||
      EXEC_GUEST_ROLES.has(simRoleRecord.roleName) ||
      !hasProjectViewGrant(simRoleRecord)
    ) {
      throw new Error('Unauthorized: Executive access required');
    }
  }

  const effectiveRole = (verifiedSimulatedRole && isRealSystemAdmin)
    ? verifiedSimulatedRole
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

  return { user, effectiveRole, isRealSystemAdmin };
}

/**
 * Retrieves the high-level company overview KPIs for the Executive Home Dashboard
 */
router.post('/getCompanyOverview', async (req, res) => {
  try {
    const { projectId } = req.body || {};

    const { user, effectiveRole, isRealSystemAdmin } = await _getAccessDetails(req);
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

    res.json({ success: true, data: result });
  } catch (error: any) {
    const msg = typeof error?.message === 'string' ? error.message : '';
    const status = PUBLIC_EXEC_ERRORS.get(msg) || 500;
    console.error('Error in getCompanyOverview');
    res.status(status).json({
      success: false,
      error: status === 500 ? 'Failed to get company overview' : msg,
    });
  }
});

/**
 * Retrieves the project portfolio list for the executive dashboard
 */
router.post('/getProjectPortfolio', async (req, res) => {
  try {
    const { user, effectiveRole, isRealSystemAdmin } = await _getAccessDetails(req);
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
        riskLevel: p.projectValidationScore?.riskLevel || 'GRAY',
        validationConfidenceScore: p.projectValidationScore?.validationConfidenceScore || 0
      };
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    const msg = typeof error?.message === 'string' ? error.message : '';
    const status = PUBLIC_EXEC_ERRORS.get(msg) || 500;
    console.error('Error in getProjectPortfolio');
    res.status(status).json({
      success: false,
      error: status === 500 ? 'Failed to get project portfolio' : msg,
    });
  }
});

export default router;
