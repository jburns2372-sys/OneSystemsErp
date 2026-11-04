import { AsyncLocalStorage } from 'node:async_hooks';
import { Prisma, PrismaClient } from '@prisma/client';
import type { Request } from 'express';

export interface BackendRlsContext {
  readonly userId: string;
  readonly sessionVersion: number;
  readonly projectId: string;
  readonly inInteractiveTx?: boolean;
}

export const backendRlsStorage = new AsyncLocalStorage<BackendRlsContext>();

export const backendPrismaRaw = new PrismaClient();

export async function applyBackendRlsSessionVars(
  tx: Prisma.TransactionClient,
  ctx: { projectId: string; userId: string; sessionVersion: number }
): Promise<void> {
  const svText = String(ctx.sessionVersion ?? 0);
  await tx.$executeRaw`SELECT
    set_config('app.enforce_project_rls', 'on', true),
    set_config('app.current_project_id', ${ctx.projectId}, true),
    set_config('app.current_user_id', ${ctx.userId}, true),
    set_config('app.current_session_version', ${svText}, true)`;
}

function createRlsAwareBackendPrisma(): PrismaClient {
  const extended = backendPrismaRaw.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const rlsCtx = backendRlsStorage.getStore();
          if (rlsCtx && rlsCtx.projectId && !rlsCtx.inInteractiveTx && model) {
            return backendRlsStorage.run({ ...rlsCtx, inInteractiveTx: true }, () =>
              backendPrismaRaw.$transaction(async (tx) => {
                await applyBackendRlsSessionVars(tx, rlsCtx);
                const delegateKey = model.charAt(0).toLowerCase() + model.slice(1);
                return (
                  tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>
                )[delegateKey][operation](args);
              })
            );
          }
          return query(args);
        },
      },
    },
  });

  return new Proxy(extended, {
    get(target, prop, receiver) {
      if (prop === '$transaction') {
        return (arg: unknown, options?: unknown) => {
          const rlsCtx = backendRlsStorage.getStore();
          if (!rlsCtx || !rlsCtx.projectId || rlsCtx.inInteractiveTx) {
            return (target.$transaction as (...a: unknown[]) => unknown)(arg, options);
          }
          if (typeof arg === 'function') {
            return backendRlsStorage.run({ ...rlsCtx, inInteractiveTx: true }, () =>
              (target.$transaction as (...a: unknown[]) => unknown)(async (tx: unknown) => {
                await applyBackendRlsSessionVars(tx as Prisma.TransactionClient, rlsCtx);
                return (arg as (t: unknown) => unknown)(tx);
              }, options)
            );
          }
          if (Array.isArray(arg)) {
            const svText = String(rlsCtx.sessionVersion ?? 0);
            const setCfgPromise = backendPrismaRaw.$executeRaw`SELECT
              set_config('app.enforce_project_rls', 'on', true),
              set_config('app.current_project_id', ${rlsCtx.projectId}, true),
              set_config('app.current_user_id', ${rlsCtx.userId}, true),
              set_config('app.current_session_version', ${svText}, true)`;
            return backendRlsStorage.run({ ...rlsCtx, inInteractiveTx: true }, async () => {
              const res = (await (target.$transaction as (...a: unknown[]) => Promise<unknown[]>)(
                [setCfgPromise, ...arg],
                options
              )) as unknown[];
              return res.slice(1);
            });
          }
          return (target.$transaction as (...a: unknown[]) => unknown)(arg, options);
        };
      }
      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    },
  }) as unknown as PrismaClient;
}

export const backendPrisma: PrismaClient = createRlsAwareBackendPrisma();

async function querySingleProjectResolver(sql: Prisma.Sql): Promise<string | null> {
  try {
    const rows = await backendPrismaRaw.$queryRaw<Array<{ proj: string | null }>>(sql);
    return rows[0]?.proj ?? null;
  } catch {
    return null;
  }
}

/**
 * Resolves the target projectId(s) for an incoming Express /api request, including entity-ID routes
 * (MRF, PO, Canvass, Delivery, Issuance, Return, Payable, Snapshot) via SECURITY DEFINER ID-only resolvers.
 */
export async function resolveBackendRequestProjectContext(
  req: Request,
  claimsPid?: string | null
): Promise<{ allCandidateProjectIds: string[]; primaryProjectId: string | null }> {
  const candidates = new Set<string>();
  const addCandidate = (v: unknown) => {
    if (typeof v === 'string') {
      const t = v.trim();
      if (t && t.toUpperCase() !== 'ALL') {
        candidates.add(t);
      }
    }
  };

  addCandidate(claimsPid);
  addCandidate(req.headers['x-active-project-id']);
  addCandidate(req.body?.projectId);
  addCandidate(req.body?.activeProjectId);
  addCandidate(req.query?.projectId);

  const relPath = (req.path || '').replace(/^\/+/, '');
  let m: RegExpMatchArray | null = null;

  // URL direct projectId routes
  if ((m = relPath.match(/^uboq\/project\/([^/?#]+)/i))) {
    addCandidate(decodeURIComponent(m[1]));
  } else if ((m = relPath.match(/^issuance\/consolidated-items\/([^/?#]+)/i))) {
    addCandidate(decodeURIComponent(m[1]));
  } else if ((m = relPath.match(/^finance\/consolidated-items\/([^/?#]+)/i))) {
    addCandidate(decodeURIComponent(m[1]));
  } else if ((m = relPath.match(/^consolidation\/([^/?#]+)/i)) && m[1].toLowerCase() !== 'items') {
    addCandidate(decodeURIComponent(m[1]));
  } else if ((m = relPath.match(/^projects\/([^/?#]+)/i))) {
    addCandidate(decodeURIComponent(m[1]));
  }

  // Entity-ID routes -> resolve authoritative owning projectId in DB
  if ((m = relPath.match(/^uboq\/mrf\/([^/?#]+)\/status/i))) {
    const mrId = decodeURIComponent(m[1]);
    addCandidate(await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_mr_project(${mrId}::text) AS proj`));
  } else if ((m = relPath.match(/^procurement\/po\/([^/?#]+)\/(approve|submit)/i))) {
    const poId = decodeURIComponent(m[1]);
    addCandidate(await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_po_id_project(${poId}::text) AS proj`));
  } else if (relPath.startsWith('procurement/po/from-mrf') && typeof req.body?.mrId === 'string') {
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_mr_project(${req.body.mrId}::text) AS proj`)
    );
  } else if (relPath.startsWith('poUpdates/updatePOStatus') && typeof req.body?.poId === 'string') {
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_po_id_project(${req.body.poId}::text) AS proj`)
    );
  } else if ((m = relPath.match(/^canvass\/([^/?#]+)/i)) && req.method !== 'POST') {
    const canvassId = decodeURIComponent(m[1]);
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_canvass_project(${canvassId}::text) AS proj`)
    );
  } else if ((m = relPath.match(/^canvass\/([^/?#]+)\//i))) {
    const canvassId = decodeURIComponent(m[1]);
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_canvass_project(${canvassId}::text) AS proj`)
    );
  } else if (relPath.startsWith('delivery/encode') && typeof req.body?.poId === 'string') {
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_po_id_project(${req.body.poId}::text) AS proj`)
    );
  } else if ((m = relPath.match(/^delivery\/([^/?#]+)\/(approve|reverse|upload-proof)/i))) {
    const deliveryId = decodeURIComponent(m[1]);
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_delivery_project(${deliveryId}::text) AS proj`)
    );
  } else if ((m = relPath.match(/^issuance\/([^/?#]+)\/(process|approve|reject)/i))) {
    const issuanceId = decodeURIComponent(m[1]);
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_issuance_project(${issuanceId}::text) AS proj`)
    );
  } else if (relPath.startsWith('returnActions/processMaterialReturn') && typeof req.body?.returnId === 'string') {
    addCandidate(
      await querySingleProjectResolver(
        Prisma.sql`SELECT uboq_resolve_return_project(${req.body.returnId}::text) AS proj`
      )
    );
  } else if (relPath.startsWith('finance/payment/issue')) {
    if (typeof req.body?.payableId === 'string') {
      addCandidate(
        await querySingleProjectResolver(
          Prisma.sql`SELECT uboq_resolve_payable_project(${req.body.payableId}::text) AS proj`
        )
      );
    } else if (typeof req.body?.poId === 'string') {
      addCandidate(
        await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_po_id_project(${req.body.poId}::text) AS proj`)
      );
    }
  } else if ((m = relPath.match(/^finance\/payment\/([^/?#]+)\/clear-accrued/i))) {
    const payableId = decodeURIComponent(m[1]);
    addCandidate(
      await querySingleProjectResolver(Prisma.sql`SELECT uboq_resolve_payable_project(${payableId}::text) AS proj`)
    );
  }

  const allCandidateProjectIds = Array.from(candidates);
  const primaryProjectId = allCandidateProjectIds[0] ?? null;
  return { allCandidateProjectIds, primaryProjectId };
}
