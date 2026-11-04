import { AsyncLocalStorage } from 'async_hooks';
import { prismaBase } from './prisma-base';
import { applyProjectRlsSessionVars, uboqRlsStorage } from './uboq/project-ownership';

const globalForALS = globalThis as unknown as { transactionContext: AsyncLocalStorage<{ sourceProvenance?: string }> | undefined };
export const transactionContext = globalForALS.transactionContext ?? new AsyncLocalStorage<{ sourceProvenance?: string }>();
if (process.env.NODE_ENV !== 'production') globalForALS.transactionContext = transactionContext;

function createPrismaClient() {
  const extended = prismaBase.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const targetModels = [
            'ProjectSchedule',
            'ScheduleWBS',
            'ScheduleActivity',
            'ScheduleDependency',
            'ScheduleBOQAllocation',
            'ScheduleReviewComment',
            'ScheduleApproval',
            'BaselineActivation',
            'ScheduleWorkflowTransition'
          ];
          const writeOps = ['create', 'createMany', 'update', 'updateMany', 'delete', 'deleteMany', 'upsert'];

          if (model && targetModels.includes(model as string) && writeOps.includes(operation)) {
            const ctx = transactionContext.getStore();
            if (ctx?.sourceProvenance !== 'GATE9_WORKFLOW_ENGINE') {
              throw new Error('GATE9D_DIRECT_MUTATION_REJECTED');
            }
          }

          const rlsCtx = uboqRlsStorage.getStore();
          if (rlsCtx && !rlsCtx.inInteractiveTx && model) {
            return uboqRlsStorage.run({ ...rlsCtx, inInteractiveTx: true }, () =>
              prismaBase.$transaction(async (tx) => {
                await applyProjectRlsSessionVars(tx, rlsCtx);
                const delegateKey = model.charAt(0).toLowerCase() + model.slice(1);
                return (tx as unknown as Record<string, Record<string, (a: unknown) => Promise<unknown>>>)[delegateKey][operation](args);
              })
            );
          }

          return query(args);
        },
      },
    },
  });

  const rawTransaction = extended.$transaction.bind(extended) as (...args: unknown[]) => unknown;

  const rlsAwareTransaction = (arg: unknown, options?: unknown) => {
    const rlsCtx = uboqRlsStorage.getStore();
    if (!rlsCtx || rlsCtx.inInteractiveTx) {
      return rawTransaction(arg, options);
    }
    if (typeof arg === 'function') {
      return uboqRlsStorage.run({ ...rlsCtx, inInteractiveTx: true }, () =>
        rawTransaction(async (tx: unknown) => {
          await applyProjectRlsSessionVars(tx as never, rlsCtx);
          return (arg as (t: unknown) => unknown)(tx);
        }, options)
      );
    }
    if (Array.isArray(arg)) {
      const svText = rlsCtx.sessionVersion !== undefined ? String(rlsCtx.sessionVersion) : '';
      const setCfgPromise = prismaBase.$executeRaw`SELECT
        set_config('app.enforce_project_rls', 'on', true),
        set_config('app.current_project_id', ${rlsCtx.projectId}, true),
        set_config('app.current_user_id', ${rlsCtx.userId}, true),
        set_config('app.current_session_version', ${svText}, true)`;
      return uboqRlsStorage.run({ ...rlsCtx, inInteractiveTx: true }, async () => {
        const res = (await (rawTransaction([setCfgPromise, ...arg], options) as Promise<unknown[]>)) as unknown[];
        return res.slice(1);
      });
    }
    return rawTransaction(arg, options);
  };

  Object.defineProperty(extended, '$transaction', {
    value: rlsAwareTransaction,
    writable: true,
    configurable: true,
  });

  return extended;
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
