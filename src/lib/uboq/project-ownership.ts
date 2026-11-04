import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma, PrismaClient } from '@prisma/client';

export type AnyPrismaDb = PrismaClient | Prisma.TransactionClient | { readonly project: unknown };

export interface UboqRlsContext {
  readonly userId: string;
  readonly sessionVersion?: number;
  readonly projectId: string;
  readonly inInteractiveTx?: boolean;
}

const globalForUboqRls = globalThis as unknown as {
  uboqRlsStorage: AsyncLocalStorage<UboqRlsContext> | undefined;
};

export const uboqRlsStorage =
  globalForUboqRls.uboqRlsStorage ?? new AsyncLocalStorage<UboqRlsContext>();

globalForUboqRls.uboqRlsStorage = uboqRlsStorage;

export function withUboqRlsContext<T>(
  ctx: { userId: string; sessionVersion?: number; projectId: string },
  fn: () => Promise<T>
): Promise<T> {
  return uboqRlsStorage.run(
    {
      userId: ctx.userId,
      sessionVersion: ctx.sessionVersion ?? 0,
      projectId: ctx.projectId,
      inInteractiveTx: false,
    },
    async () => await fn()
  );
}

const GLOBAL_TENANT_ADMIN_ROLES = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN', 'PRESIDENT', 'VP_OPERATIONS']);

export function isGlobalTenantAdminRole(role?: string | null): boolean {
  return GLOBAL_TENANT_ADMIN_ROLES.has((role || '').trim().toUpperCase());
}

/**
 * Verifies PBAC project membership + strict cross-entity projectId graph ownership (H2-01..04).
 */
export async function assertProjectGraphOwnership(
  dbInput: AnyPrismaDb,
  params: {
    userId: string;
    userRole: string;
    projectId: string;
    consolidatedBoqItemIds?: string[];
    mrId?: string | null;
    canvassFormId?: string | null;
    poId?: string | null;
    canonicalResourceIds?: string[];
    prrIds?: string[];
  }
): Promise<{ isGlobalAdmin: boolean; projectUboqGoverned: boolean }> {
  const db = dbInput as PrismaClient;
  const { userId, projectId } = params;
  if (!userId || !projectId) {
    throw new Error('UBOQ_PBAC_MISSING_CONTEXT: userId and projectId are required');
  }

  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });
  if (!dbUser || dbUser.status.toUpperCase() !== 'ACTIVE') {
    throw new Error(`UBOQ_UNAUTHORIZED: User ${userId} does not exist or is inactive`);
  }

  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true, managerId: true, uboqGovernanceEnabled: true },
  });
  if (!project) {
    throw new Error(`UBOQ_PROJECT_NOT_FOUND: Project ${projectId} does not exist`);
  }

  const authoritativeRole = dbUser.role || params.userRole;
  const isGlobalAdmin = isGlobalTenantAdminRole(authoritativeRole);
  if (!isGlobalAdmin && project.managerId !== userId) {
    const assignment = await db.projectUserAssignment.findFirst({
      where: {
        userId,
        projectId,
        assignmentStatus: { in: ['active', 'ACTIVE'] },
      },
      select: { id: true },
    });
    if (!assignment) {
      throw new Error(
        `UBOQ_PBAC_PROJECT_ACCESS_DENIED: User ${userId} (${authoritativeRole}) has no active assignment on project ${projectId}`
      );
    }
  }

  if (params.consolidatedBoqItemIds && params.consolidatedBoqItemIds.length > 0) {
    const uniqueIds = [...new Set(params.consolidatedBoqItemIds)];
    const items = await db.consolidatedBOQItem.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, projectId: true },
    });
    if (items.length !== uniqueIds.length || items.some((i) => i.projectId !== projectId)) {
      throw new Error(`UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: ConsolidatedBOQItem does not belong to project ${projectId}`);
    }
  }

  if (params.mrId) {
    const mr = await db.materialRequest.findUnique({
      where: { id: params.mrId },
      select: { id: true, projectId: true },
    });
    if (!mr || mr.projectId !== projectId) {
      throw new Error(`UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: MaterialRequest ${params.mrId} does not belong to project ${projectId}`);
    }
  }

  if (params.canvassFormId) {
    const cf = await db.canvassForm.findUnique({
      where: { id: params.canvassFormId },
      select: { id: true, projectId: true },
    });
    if (!cf || cf.projectId !== projectId) {
      throw new Error(`UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: CanvassForm ${params.canvassFormId} does not belong to project ${projectId}`);
    }
  }

  if (params.poId) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: params.poId },
      select: {
        id: true,
        mr: { select: { projectId: true } },
        canvassForm: { select: { projectId: true } },
      },
    });
    const resolvedPoProj = po?.mr?.projectId ?? po?.canvassForm?.projectId;
    if (!po || resolvedPoProj !== projectId) {
      throw new Error(`UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: PurchaseOrder ${params.poId} does not belong to project ${projectId}`);
    }
  }

  if (params.canonicalResourceIds && params.canonicalResourceIds.length > 0) {
    const uniqueRes = [...new Set(params.canonicalResourceIds)];
    const accts = await db.uboqCanonicalResourceAccount.findMany({
      where: { id: { in: uniqueRes } },
      select: { id: true, projectId: true },
    });
    if (accts.length !== uniqueRes.length || accts.some((a) => a.projectId !== projectId)) {
      throw new Error(`UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: CanonicalResourceAccount does not belong to project ${projectId}`);
    }
  }

  if (params.prrIds && params.prrIds.length > 0) {
    const uniquePrr = [...new Set(params.prrIds)];
    const prrs = await db.uboqProcurementResourceRequirement.findMany({
      where: { id: { in: uniquePrr } },
      select: { id: true, projectId: true },
    });
    if (prrs.length !== uniquePrr.length || prrs.some((p) => p.projectId !== projectId)) {
      throw new Error(`UBOQ_CROSS_PROJECT_SPOOFING_BLOCKED: PRR does not belong to project ${projectId}`);
    }
  }

  return {
    isGlobalAdmin,
    projectUboqGoverned: Boolean(project.uboqGovernanceEnabled),
  };
}

/**
 * Binds transaction-local PostgreSQL RLS GUC context (I-03, Remediation H03/H07).
 * Never sets any global-admin bypass GUC; PostgreSQL uboq_verify_bound_actor_for_project
 * validates User, sessionVersion, Project, and ProjectUserAssignment directly in DB.
 */
export async function applyProjectRlsSessionVars(
  tx: Prisma.TransactionClient,
  params: { projectId: string; userId: string; sessionVersion?: number; isGlobalAdmin?: boolean }
): Promise<void> {
  const svText = params.sessionVersion !== undefined ? String(params.sessionVersion) : '';
  await tx.$executeRaw`SELECT
    set_config('app.enforce_project_rls', 'on', true),
    set_config('app.current_project_id', ${params.projectId}, true),
    set_config('app.current_user_id', ${params.userId}, true),
    set_config('app.current_session_version', ${svText}, true)`;
}
