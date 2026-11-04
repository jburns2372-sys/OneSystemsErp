import type { Prisma, PrismaClient } from '@prisma/client';

export type UboqStageCapability =
  | 'UBOQ_VIEW'
  | 'UBOQ_INTAKE_STAGE'
  | 'UBOQ_HUMAN_REVIEW_RESOLVE'
  | 'UBOQ_SNAPSHOT_APPROVE'
  | 'UBOQ_STOCK_ALLOCATE'
  | 'UBOQ_MRF_CREATE'
  | 'UBOQ_MRF_APPROVE';

const GLOBAL_TENANT_ADMIN_ROLES = new Set([
  'SUPER_ADMIN',
  'SYSTEM_ADMIN',
  'PRESIDENT',
  'VP_OPERATIONS',
]);

const READ_ONLY_ASSIGNMENT_LEVELS = new Set([
  'VIEWER',
  'VIEW_ONLY',
  'READ_ONLY',
  'OBSERVER',
  'GUEST',
]);

const BLOCKED_VIEW_ROLES = new Set(['GUEST', 'EXTERNAL_UNASSIGNED', 'SUSPENDED', 'INACTIVE']);

const STAGE_CAPABILITY_ROLE_MATRIX: Readonly<Record<Exclude<UboqStageCapability, 'UBOQ_VIEW'>, ReadonlySet<string>>> = {
  UBOQ_INTAKE_STAGE: new Set([
    'SUPER_ADMIN',
    'SYSTEM_ADMIN',
    'ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'PROJECT_MANAGER',
    'OPERATIONS_MANAGER',
    'QS_ENGINEER',
    'QUANTITY_SURVEYOR',
    'COST_ENGINEER',
    'ESTIMATOR',
    'PROJECT_ENGINEER',
  ]),
  UBOQ_HUMAN_REVIEW_RESOLVE: new Set([
    'SUPER_ADMIN',
    'SYSTEM_ADMIN',
    'ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'PROJECT_MANAGER',
    'QS_ENGINEER',
    'QUANTITY_SURVEYOR',
    'COST_ENGINEER',
  ]),
  UBOQ_SNAPSHOT_APPROVE: new Set([
    'SUPER_ADMIN',
    'SYSTEM_ADMIN',
    'ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'PROJECT_MANAGER',
    'OPERATIONS_MANAGER',
    'FINANCE_MANAGER',
  ]),
  UBOQ_STOCK_ALLOCATE: new Set([
    'SUPER_ADMIN',
    'SYSTEM_ADMIN',
    'ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'PROJECT_DIRECTOR',
    'PROJECT_MANAGER',
    'WAREHOUSE_MANAGER',
    'WAREHOUSEMAN',
    'INVENTORY_CONTROLLER',
    'PURCHASING_MANAGER',
    'QS_ENGINEER',
    'COST_ENGINEER',
  ]),
  UBOQ_MRF_CREATE: new Set([
    'SUPER_ADMIN',
    'SYSTEM_ADMIN',
    'ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'PROJECT_DIRECTOR',
    'PROJECT_MANAGER',
    'OPERATIONS_MANAGER',
    'PROJECT_ENGINEER',
    'SITE_ENGINEER',
    'QS_ENGINEER',
    'QUANTITY_SURVEYOR',
    'COST_ENGINEER',
    'PURCHASING_OFFICER',
    'PURCHASING_MANAGER',
    'WAREHOUSEMAN',
  ]),
  UBOQ_MRF_APPROVE: new Set([
    'SUPER_ADMIN',
    'SYSTEM_ADMIN',
    'ADMIN',
    'PRESIDENT',
    'VP_OPERATIONS',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'PROJECT_MANAGER',
    'OPERATIONS_MANAGER',
    'PURCHASING_MANAGER',
  ]),
};

export function isRolePermittedForUboqStage(role: string, capability: UboqStageCapability): boolean {
  const normRole = (role || '').trim().toUpperCase();
  if (!normRole || BLOCKED_VIEW_ROLES.has(normRole)) return false;
  if (capability === 'UBOQ_VIEW') {
    return true;
  }
  const allowSet = STAGE_CAPABILITY_ROLE_MATRIX[capability];
  return Boolean(allowSet && allowSet.has(normRole));
}

/**
 * Enforces DB-grounded stage-specific RBAC + PBAC project assignment level checks (Remediation H04).
 * Rejects VIEWER / read-only assignments and unauthorized operational roles with UBOQ_RBAC_FORBIDDEN.
 */
export async function assertUboqStageAuthorization(
  dbInput: PrismaClient | Prisma.TransactionClient | { readonly user: unknown },
  params: {
    userId: string;
    projectId: string;
    capability: UboqStageCapability;
    simulatedRole?: string | null;
  }
): Promise<{ effectiveRole: string; isGlobalAdmin: boolean }> {
  const db = dbInput as PrismaClient;
  const { userId, projectId, capability } = params;

  if (!userId || !projectId) {
    throw new Error('UBOQ_PBAC_MISSING_CONTEXT: userId and projectId are required');
  }

  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, lockedUntil: true },
  });
  if (!dbUser || dbUser.status.toUpperCase() !== 'ACTIVE') {
    throw new Error(`UBOQ_UNAUTHORIZED: User ${userId} does not exist or is inactive`);
  }
  if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
    throw new Error(`UBOQ_RBAC_FORBIDDEN: User ${userId} account is locked`);
  }

  const dbRoleNorm = (dbUser.role || '').trim().toUpperCase();
  const effectiveRole =
    params.simulatedRole && GLOBAL_TENANT_ADMIN_ROLES.has(dbRoleNorm)
      ? params.simulatedRole.trim().toUpperCase()
      : dbRoleNorm;

  if (!isRolePermittedForUboqStage(effectiveRole, capability)) {
    throw new Error(
      `UBOQ_RBAC_FORBIDDEN: Role "${effectiveRole}" is not authorized for stage capability ${capability}`
    );
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true },
  });
  if (!project) {
    throw new Error(`UBOQ_PROJECT_NOT_FOUND: Project ${projectId} does not exist`);
  }

  const isGlobalAdmin = GLOBAL_TENANT_ADMIN_ROLES.has(effectiveRole);
  if (!isGlobalAdmin && project.managerId !== userId) {
    const assignment = await db.projectUserAssignment.findFirst({
      where: {
        userId,
        projectId,
        assignmentStatus: { in: ['active', 'ACTIVE'] },
      },
      select: { id: true, projectRole: true, accessLevel: true },
    });

    if (!assignment) {
      throw new Error(
        `UBOQ_PBAC_PROJECT_ACCESS_DENIED: User ${userId} (${effectiveRole}) has no active assignment on project ${projectId}`
      );
    }

    if (capability !== 'UBOQ_VIEW') {
      const assignAccessNorm = (assignment.accessLevel || '').trim().toUpperCase();
      const assignRoleNorm = (assignment.projectRole || '').trim().toUpperCase();
      if (READ_ONLY_ASSIGNMENT_LEVELS.has(assignAccessNorm) || READ_ONLY_ASSIGNMENT_LEVELS.has(assignRoleNorm)) {
        throw new Error(
          `UBOQ_RBAC_FORBIDDEN: Assignment for user ${userId} on project ${projectId} is read-only (${assignment.projectRole}/${assignment.accessLevel}) and cannot execute ${capability}`
        );
      }
      // If projectRole explicitly narrows role on this project (e.g. assigned as VIEWER or SITE_ENGINEER on this project), enforce intersection
      if (
        assignRoleNorm &&
        assignRoleNorm !== 'MEMBER' &&
        assignRoleNorm !== 'STANDARD' &&
        assignRoleNorm !== 'FULL' &&
        !isRolePermittedForUboqStage(assignRoleNorm, capability)
      ) {
        throw new Error(
          `UBOQ_RBAC_FORBIDDEN: Project role "${assignRoleNorm}" on project ${projectId} is not authorized for ${capability}`
        );
      }
    }
  }

  // Optional RolePermission table override check if configured in DB for this role + UBOQ
  const sysRole = await db.systemRole.findUnique({
    where: { name: effectiveRole },
    select: { id: true },
  });
  if (sysRole) {
    const perm = await db.rolePermission.findFirst({
      where: {
        roleId: sysRole.id,
        moduleId: { in: ['UBOQ', 'UNIVERSAL_BOQ'] },
      },
    });
    if (perm) {
      const allowedByPerm =
        capability === 'UBOQ_VIEW'
          ? perm.canView
          : capability === 'UBOQ_INTAKE_STAGE' || capability === 'UBOQ_MRF_CREATE' || capability === 'UBOQ_STOCK_ALLOCATE'
            ? perm.canCreate
            : capability === 'UBOQ_HUMAN_REVIEW_RESOLVE'
              ? perm.canReview
              : perm.canApprove;
      if (!allowedByPerm) {
        throw new Error(
          `UBOQ_RBAC_FORBIDDEN: RolePermission matrix explicitly denies ${capability} for role "${effectiveRole}"`
        );
      }
    }
  }

  return { effectiveRole, isGlobalAdmin };
}
