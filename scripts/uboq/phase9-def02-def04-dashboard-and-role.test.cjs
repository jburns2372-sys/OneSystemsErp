'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function loadTs(file, deps = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  const exportsObj = {};
  vm.runInNewContext(
    compiled.outputText,
    {
      exports: exportsObj,
      module: { exports: exportsObj },
      Buffer,
      console,
      process: { env: {} },
      require: (name) => {
        if (Object.hasOwn(deps, name)) return deps[name];
        throw new Error(`Unmocked dep: ${name} in ${file}`);
      },
    },
    { filename: file }
  );
  return exportsObj;
}

const VALID_BASELINE = {
  pendingAIOverrides: 0,
  totalProjects: 3,
  totalBudget: 1200000,
  totalPayables: 50000,
  totalAccomplishments: 2,
  pendingMRFs: 1,
  pendingPettyCash: 2,
  activePayrollPeriods: 1,
  openCanvassing: 0,
  activePurchaseOrders: 1,
  expectedDeliveries: 1,
  totalIssuances: 0,
  totalSuppliers: 4,
  totalWorkers: 12,
  totalUsers: 4,
  totalAuditLogs: 10,
  totalDailyLogs: 5,
  totalJobOrders: 0,
};

test('DEF-02: dashboardStatsState preserves valid metrics and explicitly marks pendingPettyCash Unavailable on 42501', () => {
  const mod = loadTs('src/lib/dashboardStatsState.ts');

  // Normal live numeric value
  const live = mod.normalizeLiveDashboardStats(VALID_BASELINE);
  assert.equal(live.statsUnavailable, false);
  assert.equal(live.pendingPettyCash, 2);
  assert.equal(mod.formatDashboardCount(live, live.pendingPettyCash, ' Accts'), '2 Accts');

  // Explicit 42501 unavailable pendingPettyCash -> never silently shown as 0 Accts
  const partial = mod.normalizeLiveDashboardStats({
    ...VALID_BASELINE,
    pendingPettyCash: null,
    unavailableMetrics: ['pendingPettyCash'],
  });
  assert.equal(partial.statsUnavailable, false);
  assert.equal(partial.statsStatus, 'LIVE');
  assert.equal(partial.pendingPettyCash, null);
  assert.deepEqual(partial.unavailableMetrics, ['pendingPettyCash']);
  assert.equal(mod.formatDashboardCount(partial, partial.pendingPettyCash, ' Accts'), 'Unavailable');
  assert.equal(mod.formatDashboardCount(partial, partial.totalProjects), '3');

  // Null pendingPettyCash WITHOUT unavailableMetrics declaration must fail closed
  const forgedNull = mod.normalizeLiveDashboardStats({ ...VALID_BASELINE, pendingPettyCash: null });
  assert.equal(forgedNull.statsUnavailable, true);
  assert.equal(forgedNull.statsDiagnosticCode, 'BACKEND_INVALID_PAYLOAD');
});

test('DEF-02: backend projects.ts handles ONLY SQLSTATE 42501 on pettyCashAccount, worker, and subcontractor counts and emits unavailableMetrics', () => {
  const src = fs.readFileSync('apps/aws-backend/src/routes/projects.ts', 'utf8');
  assert.match(src, /function isPgPermissionDeniedError/);
  assert.match(src, /code === '42501'/);
  assert.match(src, /unavailableMetrics\.push\('pendingPettyCash'\)/);
  assert.match(src, /pendingPettyCash = null;/);
  assert.match(src, /unavailableMetrics\.push\('totalWorkers'\)/);
  assert.match(src, /totalWorkers = null;/);
  assert.match(src, /unavailableMetrics\.push\('totalSubcontractors'\)/);
  assert.match(src, /totalSubcontractors = null;/);
  assert.match(src, /else\s*\{\s*throw err;\s*\}/);

  const state = loadTs('src/lib/dashboardStatsState.ts');
  const multiUnavailable = state.normalizeLiveDashboardStats({
    ...state.ZERO_DASHBOARD_STATS,
    totalProjects: 3,
    pendingPettyCash: null,
    totalWorkers: null,
    totalSubcontractors: null,
    unavailableMetrics: ['pendingPettyCash', 'totalWorkers', 'totalSubcontractors'],
  });
  assert.equal(multiUnavailable.statsUnavailable, false);
  assert.equal(multiUnavailable.totalProjects, 3);
  assert.equal(multiUnavailable.pendingPettyCash, null);
  assert.equal(multiUnavailable.totalWorkers, null);
  assert.equal(multiUnavailable.totalSubcontractors, null);
  assert.deepEqual(multiUnavailable.unavailableMetrics, [
    'pendingPettyCash',
    'totalWorkers',
    'totalSubcontractors',
  ]);
  assert.equal(state.formatDashboardCount(multiUnavailable, multiUnavailable.totalWorkers), 'Unavailable');

  // Forged null totalWorkers without unavailableMetrics must still fail closed
  const forgedWorkersNull = state.normalizeLiveDashboardStats({
    ...state.ZERO_DASHBOARD_STATS,
    totalWorkers: null,
  });
  assert.equal(forgedWorkersNull.statsUnavailable, true);
  assert.equal(forgedWorkersNull.statsDiagnosticCode, 'BACKEND_INVALID_PAYLOAD');
});

test('DEF-04: getCurrentUserRole rejects unauthenticated sessions, forged cookies, inactive users, and non-admin simulation', async () => {
  const makeMod = ({ session, cookieRole, userRecord, userCount = 0 }) =>
    loadTs('src/app/actions/systemResetActions.ts', {
      'next/headers': {
        cookies: async () => ({
          get: (k) => (k === 'simulatedRole' && cookieRole ? { value: cookieRole } : undefined),
        }),
      },
      'next/cache': { revalidatePath: () => {} },
      '@/lib/dal/auth': { verifySession: async () => session },
      '@/lib/prisma': {
        prisma: {
          user: {
            findUnique: async () => userRecord,
            count: async () => userCount,
          },
        },
      },
      '@/lib/backendAuth': { fetchAuthenticatedBackend: async () => { throw new Error('unused'); } },
    });

  // 1. Unauthenticated + forged SUPER_ADMIN cookie + empty DB -> must return null (NEVER SUPER_ADMIN)
  const unauth = makeMod({ session: null, cookieRole: 'SUPER_ADMIN', userRecord: null, userCount: 0 });
  assert.equal(await unauth.getCurrentUserRole(), null);

  // 2. Active PROJECT_MANAGER + forged SUPER_ADMIN cookie -> must return PROJECT_MANAGER
  const pmForged = makeMod({
    session: { id: 'u-pm' },
    cookieRole: 'SUPER_ADMIN',
    userRecord: { role: 'PROJECT_MANAGER', status: 'ACTIVE', lockedUntil: null },
  });
  assert.equal(await pmForged.getCurrentUserRole(), 'PROJECT_MANAGER');

  // 3. Inactive SUPER_ADMIN -> must return null
  const inactiveSa = makeMod({
    session: { id: 'u-sa' },
    cookieRole: 'FINANCE_OFFICER',
    userRecord: { role: 'SUPER_ADMIN', status: 'INACTIVE', lockedUntil: null },
  });
  assert.equal(await inactiveSa.getCurrentUserRole(), null);

  // 4. Active SUPER_ADMIN without simulation -> SUPER_ADMIN
  const activeSa = makeMod({
    session: { id: 'u-sa' },
    cookieRole: undefined,
    userRecord: { role: 'SUPER_ADMIN', status: 'ACTIVE', lockedUntil: null },
  });
  assert.equal(await activeSa.getCurrentUserRole(), 'SUPER_ADMIN');

  // 5. Active SUPER_ADMIN with presentation-only simulation cookie -> simulated role
  const activeSaSim = makeMod({
    session: { id: 'u-sa' },
    cookieRole: 'FINANCE_OFFICER',
    userRecord: { role: 'SUPER_ADMIN', status: 'ACTIVE', lockedUntil: null },
  });
  assert.equal(await activeSaSim.getCurrentUserRole(), 'FINANCE_OFFICER');
});
