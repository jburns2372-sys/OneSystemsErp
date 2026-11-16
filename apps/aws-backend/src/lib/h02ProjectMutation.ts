import type { Request } from 'express';
import { backendPrisma, backendRlsStorage } from './prismaRls';
import { requirePermission } from './permissions';

export type H02Operation = 'DELETE_EMPTY_PROJECT' | 'DELETE_PACKAGE' | 'DELETE_JOB_ORDER' | 'ASSIGNMENT_CREATE' | 'ASSIGNMENT_UPDATE' | 'ASSIGNMENT_DELETE';
const operations: readonly string[] = ['DELETE_EMPTY_PROJECT', 'DELETE_PACKAGE', 'DELETE_JOB_ORDER', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_UPDATE', 'ASSIGNMENT_DELETE'];
const projectAdminRoles = new Set(['SUPER_ADMIN', 'SYSTEM_ADMIN']);

function requireRealProjectActor(req: Request) {
  const actor = (req as any).user;
  const context = backendRlsStorage.getStore();
  if (!actor?.id || !context?.projectId?.trim() || context.userId !== actor.id ||
      !Number.isSafeInteger(actor.sessionVersion) || actor.sessionVersion < 0 ||
      context.sessionVersion !== actor.sessionVersion) {
    throw new Error('H02_REAL_PROJECT_CONTEXT_REQUIRED');
  }
  return { actor, context, simulatedRole: (req as any).pbacContext?.simulatedRole as string | undefined };
}

/** Preserve the existing canDelete gate. Simulation can only restrict the real actor. */
export async function requireH02DeletePermission(req: Request, moduleName: 'SUBCONTRACTING' | 'PAYROLL') {
  const { actor, simulatedRole } = requireRealProjectActor(req);
  await requirePermission(actor.id, moduleName, 'canDelete');
  if (simulatedRole) await requirePermission(actor.id, moduleName, 'canDelete', simulatedRole);
}

export async function invokeH02ProjectMutation(req: Request, operation: H02Operation, id: string | null, data: Record<string, unknown> = {}) {
  if (!operations.includes(operation)) throw new Error('H02_OPERATION_NOT_ALLOWED');
  if (operation !== 'ASSIGNMENT_CREATE' && (typeof id !== 'string' || !id.trim())) throw new Error('H02_TARGET_ID_REQUIRED');
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('H02_DATA_REQUIRED');
  const { actor, context, simulatedRole } = requireRealProjectActor(req);
  if (operation === 'DELETE_EMPTY_PROJECT' && id !== context.projectId) throw new Error('H02_PROJECT_SCOPE_MISMATCH');
  if ('projectId' in data && data.projectId !== context.projectId) throw new Error('H02_PROJECT_SCOPE_MISMATCH');
  if (operation === 'ASSIGNMENT_CREATE' && data.projectId !== context.projectId) throw new Error('H02_PROJECT_SCOPE_MISMATCH');
  if (operation === 'DELETE_PACKAGE' || operation === 'DELETE_JOB_ORDER') {
    await requireH02DeletePermission(req, 'SUBCONTRACTING');
  } else if (!projectAdminRoles.has(actor.role) || (simulatedRole && !projectAdminRoles.has(simulatedRole))) {
    throw new Error('H02_PROJECT_ADMIN_REQUIRED');
  }
  return backendPrisma.$transaction(async tx => {
    const rows = await tx.$queryRaw<Array<{ result: unknown }>>`SELECT public.uboq_h02_project_mutation(${operation}::text,${id}::text,${JSON.stringify(data)}::jsonb) AS result`;
    const result = Array.isArray(rows) && rows.length === 1 ? rows[0]?.result : undefined;
    if (!result || typeof result !== 'object' || Array.isArray(result)) throw new Error('H02_RPC_RESULT_REQUIRED');
    const payload = result as Record<string, unknown>;
    if (payload.success !== true) throw new Error('H02_RPC_OPERATION_FAILED');
    if (payload.projectId !== context.projectId || typeof payload.id !== 'string' || !payload.id.trim() ||
        (operation !== 'ASSIGNMENT_CREATE' && payload.id !== id)) throw new Error('H02_RPC_RESULT_SCOPE_MISMATCH');
    return payload;
  });
}
