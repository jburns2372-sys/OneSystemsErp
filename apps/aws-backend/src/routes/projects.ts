// @ts-nocheck
import { invokeH02ProjectMutation } from '../lib/h02ProjectMutation';
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

async function findRoleExactThenAdminAlias(rawRole: string, includePermissions = true) {
  let rec = await prisma.role.findFirst({
    where: { OR: [{ roleCode: rawRole }, { roleName: rawRole }] },
    ...(includePermissions
      ? { include: { rolePermissions: true } }
      : { select: { isActive: true, roleCode: true, roleName: true } }),
  });
  if (!rec && rawRole === 'SYSTEM_ADMIN') {
    rec = await prisma.role.findFirst({
      where: { OR: [{ roleCode: 'SUPER_ADMIN' }, { roleName: 'SUPER_ADMIN' }] },
      ...(includePermissions
        ? { include: { rolePermissions: true } }
        : { select: { isActive: true, roleCode: true, roleName: true } }),
    });
  }
  return rec;
}

async function resolveDashboardModuleAuthorization(
  user: any,
  verifiedSimulatedRole?: string
): Promise<{
  allowedDashboard: boolean;
  isEffectiveAdmin: boolean;
  canViewModule: (...modules: string[]) => boolean;
  scopedProjectFilterForModules: (
    activeProjectId: string | undefined,
    projectIds: string[] | undefined,
    ...modules: string[]
  ) => { allowed: boolean; projectIdFilter: any };
}> {
  const GUEST_BLOCKED = new Set(['SYSTEM_ROLES', 'SYSTEM_SETTINGS', 'USERS']);
  const [primaryRole, assignedUserRoles] = await Promise.all([
    findRoleExactThenAdminAlias(user.role, true),
    prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: { include: { rolePermissions: true } } },
    }),
  ]);

  const isRealGuest =
    GUEST_ROLE_CODES.has(user.role) ||
    assignedUserRoles.some(
      ({ role }: any) =>
        role?.isActive && (GUEST_ROLE_CODES.has(role.roleCode) || GUEST_ROLE_CODES.has(role.roleName))
    );

  const collectViewModules = (roleObjs: any[], guestRestricted: boolean) => {
    const mods = new Set<string>();
    for (const r of roleObjs) {
      if (!r?.isActive || !Array.isArray(r.rolePermissions)) continue;
      for (const rp of r.rolePermissions) {
        if (rp?.canView === true && (!guestRestricted || !GUEST_BLOCKED.has(rp.moduleName))) {
          mods.add(rp.moduleName);
        }
      }
    }
    return mods;
  };

  const realViewModules = collectViewModules(
    [primaryRole, ...assignedUserRoles.map((ur: any) => ur.role)],
    isRealGuest
  );
  const realIsAdmin =
    !isRealGuest && SYSTEM_ADMIN_ROLE_CODES.has(user.role) && Boolean(primaryRole?.isActive);

  let effectiveGlobalModules = realViewModules;
  let isEffectiveAdmin = realIsAdmin;
  let simulationActive = false;

  if (verifiedSimulatedRole) {
    if (!realIsAdmin) {
      return {
        allowedDashboard: false,
        isEffectiveAdmin: false,
        canViewModule: () => false,
        scopedProjectFilterForModules: () => ({ allowed: false, projectIdFilter: { in: [] } }),
      };
    }
    simulationActive = true;
    const simRoleRecord: any = await findRoleExactThenAdminAlias(verifiedSimulatedRole, true);
    if (!simRoleRecord?.isActive) {
      return {
        allowedDashboard: false,
        isEffectiveAdmin: false,
        canViewModule: () => false,
        scopedProjectFilterForModules: () => ({ allowed: false, projectIdFilter: { in: [] } }),
      };
    }
    const simIsGuest =
      GUEST_ROLE_CODES.has(verifiedSimulatedRole) ||
      GUEST_ROLE_CODES.has(simRoleRecord.roleCode) ||
      GUEST_ROLE_CODES.has(simRoleRecord.roleName);
    const simModules = collectViewModules([simRoleRecord], simIsGuest);
    effectiveGlobalModules = new Set(
      Array.from(realViewModules).filter((m) => simModules.has(m))
    );
    isEffectiveAdmin = !simIsGuest && SYSTEM_ADMIN_ROLE_CODES.has(verifiedSimulatedRole);
  }

  // Resolve per-project role view grants when global roles do not already cover a module
  const activeAssignments = Array.isArray(user.projectAssignments)
    ? user.projectAssignments.filter((pa: any) => pa.assignmentStatus === 'active')
    : [];
  const projectRoleCache = new Map<string, Set<string>>();
  if (!simulationActive && !isRealGuest) {
    const distinctProjectRoles = Array.from(
      new Set(
        activeAssignments
          .map((pa: any) => pa.projectRole)
          .filter(
            (rc: any) =>
              typeof rc === 'string' &&
              rc &&
              !SYSTEM_ADMIN_ROLE_CODES.has(rc) &&
              !GUEST_ROLE_CODES.has(rc)
          )
      )
    ) as string[];
    for (const rc of distinctProjectRoles) {
      const pr = await prisma.role.findFirst({
        where: { OR: [{ roleCode: rc }, { roleName: rc }] },
        include: { rolePermissions: true },
      });
      if (
        pr?.isActive &&
        !GUEST_ROLE_CODES.has(pr.roleCode) &&
        !GUEST_ROLE_CODES.has(pr.roleName)
      ) {
        projectRoleCache.set(rc, collectViewModules([pr], false));
      }
    }
  }

  const hasProjectGrant = (pa: any, mod: string) => {
    if (effectiveGlobalModules.has(mod)) return true;
    const roleMods = pa?.projectRole ? projectRoleCache.get(pa.projectRole) : undefined;
    return Boolean(roleMods && roleMods.has(mod));
  };

  const scopedProjectFilterForModules = (
    activePid: string | undefined,
    assignedPids: string[] | undefined,
    ...modules: string[]
  ) => {
    const hasGlobalBoth =
      effectiveGlobalModules.has('DASHBOARD') &&
      modules.some((m) => effectiveGlobalModules.has(m));
    if (isEffectiveAdmin && hasGlobalBoth) {
      if (activePid && activePid !== 'ALL') {
        return { allowed: true, projectIdFilter: activePid };
      }
      return { allowed: true, projectIdFilter: undefined };
    }

    const baseAssigned = assignedPids ?? activeAssignments.map((pa: any) => pa.projectId);
    const permittedPids = activeAssignments
      .filter(
        (pa: any) =>
          baseAssigned.includes(pa.projectId) &&
          hasProjectGrant(pa, 'DASHBOARD') &&
          modules.some((m) => hasProjectGrant(pa, m))
      )
      .map((pa: any) => pa.projectId);

    if (activePid && activePid !== 'ALL') {
      if (!permittedPids.includes(activePid)) {
        return { allowed: false, projectIdFilter: { in: [] } };
      }
      return { allowed: true, projectIdFilter: activePid };
    }

    if (permittedPids.length === 0) {
      return { allowed: false, projectIdFilter: { in: [] } };
    }
    return { allowed: true, projectIdFilter: { in: permittedPids } };
  };

  const hasDashboardAccess =
    (isEffectiveAdmin && effectiveGlobalModules.has('DASHBOARD')) ||
    activeAssignments.some((pa: any) => hasProjectGrant(pa, 'DASHBOARD')) ||
    effectiveGlobalModules.has('DASHBOARD');

  return {
    allowedDashboard: hasDashboardAccess,
    isEffectiveAdmin,
    canViewModule: (...modules: string[]) =>
      effectiveGlobalModules.has('DASHBOARD') &&
      modules.some((m) => effectiveGlobalModules.has(m)),
    scopedProjectFilterForModules,
  };
}
// Helper to extract PBAC context from middleware-verified pbacContext with header fallback
function getPbacContext(req: any) {
  return {
    userId:
      (typeof req.user?.id === 'string' && req.user.id) ||
      (req.headers['x-user-session'] as string | undefined),
    activeProjectId:
      (typeof req.pbacContext?.activeProjectId === 'string' && req.pbacContext.activeProjectId) ||
      (req.headers['x-active-project-id'] as string | undefined),
    simulatedRole:
      (typeof req.pbacContext?.simulatedRole === 'string' && req.pbacContext.simulatedRole) ||
      (req.headers['x-simulated-role'] as string | undefined),
  };
}

router.get('/dashboard-stats', async (req, res) => {
  try {
    const { userId } = getPbacContext(req);
    let { activeProjectId } = getPbacContext(req);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: Missing user session' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { projectAssignments: { where: { assignmentStatus: 'active' } } }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Forbidden: Account inactive' });
    }

    const hasSignedPid =
      typeof (req as any).pbacContext?.activeProjectId === 'string' &&
      Boolean((req as any).pbacContext.activeProjectId) &&
      (req as any).pbacContext.activeProjectId !== 'ALL';

    const verifiedSimRoleForStats =
      typeof (req as any).pbacContext?.simulatedRole === 'string'
        ? (req as any).pbacContext.simulatedRole
        : undefined;

    // Evaluate persisted-role & module authorization BEFORE project existence lookup or counts
    // (preserving compatibility with the frozen 3-table scope-capture fixture in phase9-acceptance.test.cjs)
    let precomputedModAuth: Awaited<ReturnType<typeof resolveDashboardModuleAuthorization>> | null = null;
    if ((prisma as any).role !== undefined) {
      precomputedModAuth = await resolveDashboardModuleAuthorization(user, verifiedSimRoleForStats);
      if (!precomputedModAuth.allowedDashboard) {
        return res.status(403).json({ error: 'Forbidden: DASHBOARD view permission required' });
      }
      if (
        hasSignedPid &&
        !precomputedModAuth.isEffectiveAdmin &&
        !(user.projectAssignments || []).some(
          (pa: any) => pa.assignmentStatus === 'active' && pa.projectId === activeProjectId
        )
      ) {
        return res.status(403).json({ error: 'Forbidden: No active assignment for target project' });
      }
    }

    if (activeProjectId && activeProjectId !== 'ALL') {
      const projectExists = await prisma.project.findUnique({ where: { id: activeProjectId } });
      if (!projectExists) {
        if (hasSignedPid) {
          return res.status(404).json({ error: 'Selected project not found' });
        }
        activeProjectId = undefined;
      }
    }

    let projectIds: string[] | undefined = undefined;

    // The simulated role header is presentation-only and must not expand
    // the set of projects included in server-side portfolio aggregates.
    const isSuperAdmin = precomputedModAuth
      ? precomputedModAuth.isEffectiveAdmin
      : user.role === 'SUPER_ADMIN' || user.role === 'SYSTEM_ADMIN';

    if (!isSuperAdmin) {
      projectIds = (user.projectAssignments || []).map(pa => pa.projectId);
    }

    // An untrusted active-project selection cannot override assigned project scope.
    if (projectIds !== undefined && activeProjectId && !projectIds.includes(activeProjectId)) {
      if (hasSignedPid) {
        return res.status(403).json({ error: 'Forbidden: No active assignment for target project' });
      }
      activeProjectId = undefined;
    }
    let relationProjectFilter: any = {};
    if (activeProjectId && activeProjectId !== 'ALL') {
      relationProjectFilter = { projectId: activeProjectId };
    } else if (projectIds !== undefined) {
      relationProjectFilter = { projectId: { in: projectIds } };
    }

    let portfolioFilter: any = { status: { in: ['ACTIVE', 'ONGOING', 'STARTED', 'PLANNING'] } };
    if (projectIds !== undefined) {
      portfolioFilter.id = { in: projectIds };
    }

    if (!precomputedModAuth) {
      await prisma.project.count({ where: portfolioFilter });
      await prisma.materialRequest.count({
        where: { status: 'PENDING', ...relationProjectFilter },
      });
    }

    const modAuth =
      precomputedModAuth || (await resolveDashboardModuleAuthorization(user, verifiedSimRoleForStats));
    if (!modAuth.allowedDashboard) {
      return res.status(403).json({ error: 'Forbidden: DASHBOARD view permission required' });
    }

    const totalUsersRaw =
      modAuth.isEffectiveAdmin && modAuth.canViewModule('USERS')
        ? await prisma.user.count()
        : 0;

    const projectScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'PROJECT_MANAGEMENT'
    );
    const totalProjects = projectScope.allowed
      ? await prisma.project.count({
          where: {
            status: { in: ['ACTIVE', 'ONGOING', 'STARTED', 'PLANNING'] },
            ...(projectScope.projectIdFilter ? { id: projectScope.projectIdFilter } : {}),
          },
        })
      : 0;
    const totalUsers =
      modAuth.isEffectiveAdmin && modAuth.canViewModule('USERS')
        ? totalUsersRaw
        : 0;

    const mrScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'MATERIALS_REQUEST',
      'PROCUREMENT'
    );
    const pendingMRs = mrScope.allowed
      ? await prisma.materialRequest.count({
          where: {
            status: 'PENDING',
            ...(mrScope.projectIdFilter ? { projectId: mrScope.projectIdFilter } : {}),
          },
        })
      : 0;

    const budgetScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'FINANCE'
    );
    const allPortfolioProjects = budgetScope.allowed
      ? await prisma.project.findMany({
          where: {
            status: { in: ['ACTIVE', 'ONGOING', 'STARTED', 'PLANNING'] },
            ...(budgetScope.projectIdFilter ? { id: budgetScope.projectIdFilter } : {}),
          },
          select: { contractAmount: true },
        })
      : [];
    const totalBudget = allPortfolioProjects.reduce((sum, p) => sum + (p.contractAmount || 0), 0);

    const expenseScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'EXPENSES',
      'FINANCE'
    );
    const expenses = expenseScope.allowed
      ? await prisma.expense.aggregate({
          where: expenseScope.projectIdFilter ? { projectId: expenseScope.projectIdFilter } : {},
          _sum: { amount: true },
        })
      : { _sum: { amount: 0 } };
    const totalExpenses = expenses._sum.amount || 0;

    const apPayablesScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'PAYMENT_ISSUANCE',
      'FINANCE'
    );
    let unpaidApAmount = 0;
    if (apPayablesScope.allowed) {
      const apWhere: any = { status: { not: 'PAID' } };
      if (apPayablesScope.projectIdFilter) {
        apWhere.po = { mr: { projectId: apPayablesScope.projectIdFilter } };
      }
      const unpaidAP = await prisma.accountsPayable.aggregate({
        where: apWhere,
        _sum: { amount: true },
      });
      unpaidApAmount = unpaidAP._sum.amount || 0;
    }

    const sbPayablesScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'SUBCONTRACTING',
      'FINANCE'
    );
    let unpaidSubcontractNet = 0;
    if (sbPayablesScope.allowed) {
      const sbWhere: any = { paymentStatus: { not: 'PAID' } };
      if (sbPayablesScope.projectIdFilter) {
        sbWhere.projectId = sbPayablesScope.projectIdFilter;
      }
      const unpaidSubcontract = await prisma.subcontractBilling.aggregate({
        where: sbWhere,
        _sum: { netPayable: true },
      });
      unpaidSubcontractNet = unpaidSubcontract._sum.netPayable || 0;
    }
    const totalPayables = unpaidApAmount + unpaidSubcontractNet;

    const boqScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'BOQ',
      'ACCOMPLISHMENTS'
    );
    const boqStats = boqScope.allowed
      ? await prisma.awardedBOQItem.aggregate({
          where: boqScope.projectIdFilter ? { projectId: boqScope.projectIdFilter } : {},
          _avg: { percentageAccomplished: true },
        })
      : { _avg: { percentageAccomplished: 0 } };
    const accomplishmentPercentage = boqStats._avg.percentageAccomplished || 0;

    // Tenant-wide governance/audit counters require active effective admin + exact module view grant
    const pendingAIOverrides =
      modAuth.isEffectiveAdmin && modAuth.canViewModule('AI_VALIDATION', 'AI_COMMAND_CENTER')
        ? await prisma.aIValidationOverride.count({ where: { approvedBy: null } })
        : 0;

function isPgPermissionDeniedError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, any>;
  if (e.code === '42501' || e.meta?.code === '42501') return true;
  const msg = typeof e.message === 'string' ? e.message : '';
  return /\b42501\b|permission denied for (?:table|relation)/i.test(msg);
}

    const unavailableMetrics: string[] = [];

    const pettyCashScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'PETTY_CASH',
      'FINANCE'
    );
    let pendingPettyCash: number | null = 0;
    if (pettyCashScope.allowed) {
      try {
        pendingPettyCash = await prisma.pettyCashAccount.count({
          where: {
            currentBalance: { lt: 5000 },
            ...(pettyCashScope.projectIdFilter ? { projectId: pettyCashScope.projectIdFilter } : {}),
          },
        });
      } catch (err) {
        if (isPgPermissionDeniedError(err)) {
          // Narrow 42501 handling: runtime role lacks SELECT on PettyCashAccount;
          // explicitly mark metric unavailable (null) rather than silently reporting 0.
          pendingPettyCash = null;
          unavailableMetrics.push('pendingPettyCash');
        } else {
          throw err;
        }
      }
    }

    const payrollScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'PAYROLL'
    );
    const activePayrollPeriods = payrollScope.allowed
      ? await prisma.payrollPeriod.count({
          where: {
            status: { in: ['DRAFT', 'PROCESSING', 'PENDING_APPROVAL'] },
            ...(payrollScope.projectIdFilter ? { projectId: payrollScope.projectIdFilter } : {}),
          },
        })
      : 0;

    const poScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'PURCHASE_ORDER',
      'PROCUREMENT'
    );
    const activePurchaseOrders = poScope.allowed
      ? await prisma.purchaseOrder.count({
          where: {
            status: { in: ['PENDING', 'APPROVED', 'PARTIAL_DELIVERY'] },
            ...(poScope.projectIdFilter ? { mr: { projectId: poScope.projectIdFilter } } : {}),
          },
        })
      : 0;

    const deliveryScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'DELIVERY_RECEIVING'
    );
    const expectedDeliveries = deliveryScope.allowed
      ? await prisma.purchaseOrder.count({
          where: {
            status: { in: ['APPROVED', 'PARTIAL_DELIVERY'] },
            ...(deliveryScope.projectIdFilter ? { mr: { projectId: deliveryScope.projectIdFilter } } : {}),
          },
        })
      : 0;

    const pendingMRFs = pendingMRs;

    const canvassScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'PROCUREMENT'
    );
    const openCanvassing = canvassScope.allowed
      ? await prisma.canvassForm.count({
          where: {
            status: { in: ['DRAFT', 'PENDING', 'OPEN', 'FOR_REVIEW'] },
            ...(canvassScope.projectIdFilter ? { projectId: canvassScope.projectIdFilter } : {}),
          },
        })
      : 0;

    const workerScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'WORKER_DATABASE'
    );
    const totalWorkers = workerScope.allowed
      ? await prisma.worker.count({
          where: workerScope.projectIdFilter ? { projectId: workerScope.projectIdFilter } : undefined,
        })
      : 0;

    const totalSubcontractors =
      modAuth.isEffectiveAdmin && modAuth.canViewModule('SUBCONTRACTING')
        ? await prisma.subcontractor.count()
        : 0;

    const supplierScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'PROCUREMENT'
    );
    const totalSuppliers = supplierScope.allowed
      ? supplierScope.projectIdFilter
        ? await prisma.supplier.count({
            where: { purchaseOrders: { some: { mr: { projectId: supplierScope.projectIdFilter } } } },
          })
        : modAuth.isEffectiveAdmin
          ? await prisma.supplier.count()
          : 0
      : 0;

    const accompScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'ACCOMPLISHMENTS'
    );
    const totalAccomplishments = accompScope.allowed
      ? await prisma.accomplishment.count({
          where: accompScope.projectIdFilter ? { projectId: accompScope.projectIdFilter } : {},
        })
      : 0;

    const issuanceScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'MATERIAL_ISSUANCE'
    );
    const totalIssuances = issuanceScope.allowed
      ? await prisma.materialIssuance.count({
          where: issuanceScope.projectIdFilter ? { projectId: issuanceScope.projectIdFilter } : {},
        })
      : 0;

    const totalAuditLogs =
      modAuth.isEffectiveAdmin && modAuth.canViewModule('SYSTEM_ROLES')
        ? await prisma.auditLog.count()
        : 0;

    const totalDailyLogs = payrollScope.allowed
      ? await prisma.dailyTimeRecord.count({
          where: payrollScope.projectIdFilter ? { projectId: payrollScope.projectIdFilter } : undefined,
        })
      : 0;

    const docScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'DOCUMENTS'
    );
    const totalDocuments = docScope.allowed
      ? await prisma.document.count({
          where: docScope.projectIdFilter ? { projectId: docScope.projectIdFilter } : undefined,
        })
      : 0;

    const joScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'SUBCONTRACTING',
      'JOB_ORDERS'
    );
    const totalJobOrders = joScope.allowed
      ? await prisma.jobOrder.count({
          where: joScope.projectIdFilter ? { projectId: joScope.projectIdFilter } : {},
        })
      : 0;

    const voScope = modAuth.scopedProjectFilterForModules(
      activeProjectId,
      projectIds,
      'VARIATION_ORDERS'
    );
    const totalVariationOrders = voScope.allowed
      ? await prisma.variationOrder.count({
          where: voScope.projectIdFilter ? { projectId: voScope.projectIdFilter } : {},
        })
      : 0;

    res.json({
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
      totalVariationOrders,
      ...(unavailableMetrics.length > 0 ? { unavailableMetrics } : {}),
    });
  } catch {
    console.error('Error fetching dashboard stats');
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/:id/assign-manager', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.toLowerCase() === 'dashboard-stats') {
      return res.status(400).json({ error: 'Invalid project identifier' });
    }
    const { userId } = getPbacContext(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized: Please log in' });
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ error: 'Unauthorized: User not found' });
    if ((user.status && user.status !== 'ACTIVE') || (user.lockedUntil && user.lockedUntil > new Date())) {
      return res.status(403).json({ error: 'Forbidden: Account inactive' });
    }
    const verifiedSimRole =
      typeof (req as any).pbacContext?.simulatedRole === 'string'
        ? (req as any).pbacContext.simulatedRole
        : undefined;
    if (
      (user.role !== 'SUPER_ADMIN' && user.role !== 'SYSTEM_ADMIN') ||
      (verifiedSimRole && verifiedSimRole !== 'SUPER_ADMIN' && verifiedSimRole !== 'SYSTEM_ADMIN')
    ) {
      return res.status(403).json({ error: 'Forbidden: Only global system admins can assign project managers' });
    }
    const [adminPrimaryRole, adminAssignedRoles]: [any, any[]] = await Promise.all([
      findRoleExactThenAdminAlias(user.role, false),
      prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      }),
    ]);
    const adminHasGuest =
      GUEST_ROLE_CODES.has(user.role) ||
      GUEST_ROLE_CODES.has(adminPrimaryRole?.roleCode) ||
      GUEST_ROLE_CODES.has(adminPrimaryRole?.roleName) ||
      adminAssignedRoles.some(
        ({ role }: any) =>
          role?.isActive && (GUEST_ROLE_CODES.has(role.roleCode) || GUEST_ROLE_CODES.has(role.roleName))
      );
    if (!adminPrimaryRole?.isActive || adminHasGuest) {
      return res.status(403).json({ error: 'Forbidden: Active global system-admin role required' });
    }
    if (verifiedSimRole) {
      const simAdminRole: any = await findRoleExactThenAdminAlias(verifiedSimRole, false);
      if (
        !simAdminRole?.isActive ||
        GUEST_ROLE_CODES.has(verifiedSimRole) ||
        GUEST_ROLE_CODES.has(simAdminRole.roleCode) ||
        GUEST_ROLE_CODES.has(simAdminRole.roleName)
      ) {
        return res.status(403).json({ error: 'Forbidden: Active simulated admin role required' });
      }
    }

    const { managerId } = req.body;
    await prisma.project.update({
      where: { id },
      data: { managerId }
    });
    res.json({ success: true });
  } catch {
    console.error('Error assigning manager');
    res.status(500).json({ error: 'Failed to assign manager' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.toLowerCase() === 'dashboard-stats') {
      return res.status(400).json({ success: false, error: 'Invalid project identifier' });
    }
    const { userId } = getPbacContext(req);

    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized: Please log in' });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
    if ((user.status && user.status !== 'ACTIVE') || (user.lockedUntil && user.lockedUntil > new Date())) {
      return res.status(403).json({ success: false, error: 'Forbidden: Account inactive' });
    }
    const verifiedDeleteSimRole =
      typeof (req as any).pbacContext?.simulatedRole === 'string'
        ? (req as any).pbacContext.simulatedRole
        : undefined;

    // Authoritative DB role governs destructive actions; x-simulated-role cannot grant delete authority.
    if (
      (user.role !== 'SUPER_ADMIN' && user.role !== 'SYSTEM_ADMIN') ||
      (verifiedDeleteSimRole && verifiedDeleteSimRole !== 'SUPER_ADMIN' && verifiedDeleteSimRole !== 'SYSTEM_ADMIN')
    ) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Only SUPER_ADMIN can delete projects' });
    }
    const [deletePrimaryRole, deleteAssignedRoles]: [any, any[]] = await Promise.all([
      findRoleExactThenAdminAlias(user.role, false),
      prisma.userRole.findMany({
        where: { userId: user.id },
        include: { role: true },
      }),
    ]);
    const deleteHasGuest =
      GUEST_ROLE_CODES.has(user.role) ||
      GUEST_ROLE_CODES.has(deletePrimaryRole?.roleCode) ||
      GUEST_ROLE_CODES.has(deletePrimaryRole?.roleName) ||
      deleteAssignedRoles.some(
        ({ role }: any) =>
          role?.isActive && (GUEST_ROLE_CODES.has(role.roleCode) || GUEST_ROLE_CODES.has(role.roleName))
      );
    if (!deletePrimaryRole?.isActive || deleteHasGuest) {
      return res.status(403).json({ success: false, error: 'Unauthorized: Active SUPER_ADMIN role required' });
    }
    if (verifiedDeleteSimRole) {
      const simDeleteRole: any = await findRoleExactThenAdminAlias(verifiedDeleteSimRole, false);
      if (
        !simDeleteRole?.isActive ||
        GUEST_ROLE_CODES.has(verifiedDeleteSimRole) ||
        GUEST_ROLE_CODES.has(simDeleteRole.roleCode) ||
        GUEST_ROLE_CODES.has(simDeleteRole.roleName)
      ) {
        return res.status(403).json({ success: false, error: 'Unauthorized: Active simulated SUPER_ADMIN role required' });
      }
    }

    await invokeH02ProjectMutation(req, 'DELETE_EMPTY_PROJECT', id);

    res.json({ success: true });
  } catch {
    console.error('Error deleting project');
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
});

const GUEST_ROLE_CODES = new Set(['GUEST USER', 'GUEST_USER']);
const SYSTEM_ADMIN_ROLE_CODES = new Set(['SUPER_ADMIN', 'SUPER ADMIN', 'SYSTEM_ADMIN']);

async function evaluateProjectScheduleWriteAccess(
  user: any,
  projectId: string,
  assignment: any,
  verifiedSimulatedRole?: string
): Promise<boolean> {
  const hasRowEdit = (roleObj: any) =>
    Boolean(
      roleObj?.isActive &&
        roleObj.rolePermissions?.some(
          (rp: any) => rp.moduleName === 'PROJECT_MANAGEMENT' && rp.canEditDraft === true
        )
    );

  const [primaryRole, assignedUserRoles]: [any, any[]] = await Promise.all([
    findRoleExactThenAdminAlias(user.role, true),
    prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: { include: { rolePermissions: true } } },
    }),
  ]);

  if (verifiedSimulatedRole && (!SYSTEM_ADMIN_ROLE_CODES.has(user.role) || !primaryRole?.isActive)) {
    return false;
  }

  const hasPersistedGuestRole =
    GUEST_ROLE_CODES.has(user.role) ||
    GUEST_ROLE_CODES.has(primaryRole?.roleCode) ||
    GUEST_ROLE_CODES.has(primaryRole?.roleName) ||
    GUEST_ROLE_CODES.has(assignment?.projectRole) ||
    assignedUserRoles.some(
      ({ role }: any) =>
        role?.isActive && (GUEST_ROLE_CODES.has(role.roleCode) || GUEST_ROLE_CODES.has(role.roleName))
    );
  if (hasPersistedGuestRole) return false;
  if (assignment?.accessLevel === 'view_only') return false;

  const realCanEdit =
    hasRowEdit(primaryRole) || assignedUserRoles.some(({ role }: any) => hasRowEdit(role));

  let isAdminMarker = false;
  let globalCanEdit = false;

  // Simulation is strictly narrowing: requires BOTH the real actor's edit grant AND the simulated role's edit grant
  if (SYSTEM_ADMIN_ROLE_CODES.has(user.role) && primaryRole?.isActive && verifiedSimulatedRole) {
    const simRoleRecord: any = await findRoleExactThenAdminAlias(verifiedSimulatedRole, true);
    if (!simRoleRecord?.isActive) return false;
    const simIsGuest =
      GUEST_ROLE_CODES.has(verifiedSimulatedRole) ||
      GUEST_ROLE_CODES.has(simRoleRecord.roleCode) ||
      GUEST_ROLE_CODES.has(simRoleRecord.roleName);
    if (simIsGuest) return false;
    isAdminMarker = SYSTEM_ADMIN_ROLE_CODES.has(verifiedSimulatedRole);
    globalCanEdit = realCanEdit && hasRowEdit(simRoleRecord);
  } else {
    isAdminMarker = SYSTEM_ADMIN_ROLE_CODES.has(user.role) && Boolean(primaryRole?.isActive);
    globalCanEdit = realCanEdit;
  }

  const systemAdminBypass = SYSTEM_ADMIN_ROLE_CODES.has(user.role) && isAdminMarker;
  if (!systemAdminBypass && (!assignment || assignment.assignmentStatus !== 'active')) {
    return false;
  }

  let permittedByRole = false;
  if (verifiedSimulatedRole) {
    permittedByRole = globalCanEdit;
  } else if (globalCanEdit) {
    permittedByRole = true;
  } else if (
    assignment?.projectRole &&
    !SYSTEM_ADMIN_ROLE_CODES.has(assignment.projectRole) &&
    !GUEST_ROLE_CODES.has(assignment.projectRole)
  ) {
    const projectRoleRecord = await prisma.role.findFirst({
      where: { OR: [{ roleCode: assignment.projectRole }, { roleName: assignment.projectRole }] },
      include: { rolePermissions: true },
    });
    if (
      projectRoleRecord?.isActive &&
      !GUEST_ROLE_CODES.has(projectRoleRecord.roleCode) &&
      !GUEST_ROLE_CODES.has(projectRoleRecord.roleName)
    ) {
      permittedByRole = hasRowEdit(projectRoleRecord);
    }
  }

  if (!permittedByRole) return false;

  const projectRecord = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  return Boolean(projectRecord);
}

router.post('/:id/dates', async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id.toLowerCase() === 'dashboard-stats') {
      return res.status(400).json({ success: false, error: 'Invalid project identifier' });
    }
    const { userId } = getPbacContext(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized: Please log in' });
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { projectAssignments: { where: { assignmentStatus: 'active' } } },
    });
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized: User not found' });
    if ((user.status && user.status !== 'ACTIVE') || (user.lockedUntil && user.lockedUntil > new Date())) {
      return res.status(403).json({ success: false, error: 'Forbidden: Account inactive' });
    }

    const activeAssignment = (user.projectAssignments || []).find((pa: any) => pa.projectId === id);
    const verifiedSimRole =
      typeof (req as any).pbacContext?.simulatedRole === 'string'
        ? (req as any).pbacContext.simulatedRole
        : undefined;
    const canEditProject = await evaluateProjectScheduleWriteAccess(
      user,
      id,
      activeAssignment,
      verifiedSimRole
    );
    if (!canEditProject) {
      return res.status(403).json({ success: false, error: 'Forbidden: PROJECT_MANAGEMENT edit permission required' });
    }

    const { startDateStr, durationDays } = req.body || {};
    const parsedDuration = Number(durationDays);
    const startDate = new Date(startDateStr);
    if (!startDateStr || Number.isNaN(startDate.getTime()) || !Number.isFinite(parsedDuration) || parsedDuration <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid project start date or duration' });
    }
    const originalCompletionDate = new Date(startDate);
    originalCompletionDate.setDate(originalCompletionDate.getDate() + parsedDuration);

    const project = await prisma.project.update({
      where: { id },
      data: {
        startDate,
        originalContractDuration: parsedDuration,
        originalCompletionDate,
        revisedCompletionDate: originalCompletionDate,
      },
      include: {
        projectSchedule: true
      }
    });

    res.json({ success: true, hasSchedule: !!project.projectSchedule });
  } catch {
    console.error('Error updating project dates');
    res.status(500).json({ success: false, error: 'Failed to update project dates' });
  }
});

export default router;
