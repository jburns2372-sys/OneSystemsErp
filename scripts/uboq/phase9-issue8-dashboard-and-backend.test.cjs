'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const asyncHooks = require('node:async_hooks');
const ts = require('typescript');
const express = require('express');

const TEST_SECRET = 'phase9-issue8-synthetic-hmac-secret-32b';

function loadTs(file, deps = {}, env = {}, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    reportDiagnostics: true,
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
    },
  });
  assert.equal(
    compiled.diagnostics.length,
    0,
    `TypeScript transpilation diagnostics in ${file}: ${JSON.stringify(compiled.diagnostics.map((d) => d.messageText))}`
  );
  const exports = {};
  vm.runInNewContext(
    compiled.outputText,
    {
      exports,
      Buffer,
      Headers,
      URL,
      FormData,
      Request,
      Response,
      Uint8Array,
      setTimeout,
      clearTimeout,
      console,
      ...globals,
      process: { env },
      require: (name) => {
        if (Object.hasOwn(deps, name)) return deps[name];
        throw new Error(`Unmocked dependency prohibited: ${name} in ${file}`);
      },
    },
    { filename: file }
  );
  return exports;
}

function signToken(claims, secret = TEST_SECRET) {
  const now = Math.floor(Date.now() / 1000);
  const fullClaims = {
    uid: 'user-1',
    role: 'PROJECT_MANAGER',
    sv: 3,
    pid: null,
    sim: null,
    iat: now,
    exp: now + 60,
    ...claims,
  };
  const encoded = Buffer.from(JSON.stringify(fullClaims), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(`v1.${encoded}`).digest('hex');
  return `v1.${encoded}.${sig}`;
}

function collectElementNodes(node, predicate, acc = []) {
  if (!node || typeof node !== 'object') return acc;
  if (Array.isArray(node)) {
    for (const child of node) collectElementNodes(child, predicate, acc);
    return acc;
  }
  if (predicate(node)) acc.push(node);
  if (node.props && node.props.children !== undefined) {
    collectElementNodes(node.props.children, predicate, acc);
  }
  return acc;
}

function flattenText(children) {
  if (children === null || children === undefined || typeof children === 'boolean') return '';
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(flattenText).join('');
  if (typeof children === 'object' && children.props) return flattenText(children.props.children);
  return '';
}

test('getDashboardStats marks HTTP 405, 5xx, URL errors, and network failures as UNAVAILABLE with sanitized codes', async () => {
  const scenarios = [
    {
      name: 'HTTP 405 Method Not Allowed from self-routed Next.js dynamic route',
      response: {
        ok: false,
        status: 405,
        statusText: 'Method Not Allowed',
        text: async () => '',
      },
      expectedCode: 'BACKEND_HTTP_405',
    },
    {
      name: 'HTTP 503 Service Unavailable from backend origin',
      response: {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        text: async () => JSON.stringify({ error: 'Upstream database pool timeout postgres://secret@host' }),
      },
      expectedCode: 'BACKEND_HTTP_5XX',
    },
    {
      name: 'HTTP 401 Unauthorized',
      response: {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        text: async () => JSON.stringify({ error: 'Unauthorized' }),
      },
      expectedCode: 'BACKEND_HTTP_401',
    },
    {
      name: 'Network connection refused',
      throwError: new Error('fetch failed: connect ECONNREFUSED 127.0.0.1:4000'),
      expectedCode: 'BACKEND_UNREACHABLE',
    },
    {
      name: 'Missing or untrusted backend URL',
      throwError: new Error('UNTRUSTED_BACKEND_DESTINATION: https://evil.example.com'),
      expectedCode: 'BACKEND_URL_UNCONFIGURED',
    },
    {
      name: 'Unexpected non-object JSON payload',
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ['unexpected-array'],
      },
      expectedCode: 'BACKEND_INVALID_PAYLOAD',
    },
    {
      name: 'Empty object HTTP 200 payload missing required numeric metrics',
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({}),
      },
      expectedCode: 'BACKEND_INVALID_PAYLOAD',
    },
    {
      name: 'Error envelope returned with HTTP 200',
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({ error: 'Upstream proxy fallback' }),
      },
      expectedCode: 'BACKEND_INVALID_PAYLOAD',
    },
    {
      name: 'Untrusted upstream diagnostic string is sanitized to allowlisted code',
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          statsUnavailable: true,
          statsDiagnosticCode: 'https://secret-internal-host.local/leak',
        }),
      },
      expectedCode: 'BACKEND_UNREACHABLE',
    },
    {
      name: 'HTTP 200 non-JSON / HTML response body produces BACKEND_INVALID_PAYLOAD',
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => {
          throw new SyntaxError('Unexpected token < in JSON at position 0');
        },
      },
      expectedCode: 'BACKEND_INVALID_PAYLOAD',
    },
    {
      name: 'Incomplete HTTP 200 object missing required KPI fields produces BACKEND_INVALID_PAYLOAD',
      response: {
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          totalProjects: 4,
          totalBudget: 12500000,
        }),
      },
      expectedCode: 'BACKEND_INVALID_PAYLOAD',
    },
  ];

  for (const scenario of scenarios) {
    const logged = [];
    const origError = console.error;
    console.error = (...args) => logged.push(args.join(' '));
    try {
      const actions = loadTs('src/app/actions/project.ts', {
        '@/lib/backendAuth': {
          fetchAuthenticatedBackend: async () => {
            if (scenario.throwError) throw scenario.throwError;
            return scenario.response;
          },
        },
        '@/lib/dashboardStatsState': loadTs('src/lib/dashboardStatsState.ts'),
        'next/cache': { revalidatePath: () => {} },
      });

      const result = await actions.getDashboardStats();
      assert.equal(result.statsUnavailable, true, scenario.name);
      assert.equal(result.statsStatus, 'UNAVAILABLE', scenario.name);
      assert.equal(result.statsDiagnosticCode, scenario.expectedCode, scenario.name);
      assert.ok(!JSON.stringify(result).includes('postgres://'), 'must never leak connection strings');
      assert.ok(!JSON.stringify(result).includes('evil.example.com'), 'must never echo untrusted URLs');
      assert.ok(!logged.join(' ').includes('postgres://'), 'server error log must stay sanitized');
    } finally {
      console.error = origError;
    }
  }
});

test('getDashboardStats preserves live metrics when backend returns valid stats payload', async () => {
  const statsState = loadTs('src/lib/dashboardStatsState.ts');
  const actions = loadTs('src/app/actions/project.ts', {
    '@/lib/backendAuth': {
      fetchAuthenticatedBackend: async () => ({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          ...statsState.ZERO_DASHBOARD_STATS,
          totalProjects: 4,
          totalBudget: 12500000,
          totalPayables: 450000,
          pendingMRFs: 2,
          unexpectedInternalField: 'strip-me',
        }),
      }),
    },
    '@/lib/dashboardStatsState': statsState,
    'next/cache': { revalidatePath: () => {} },
  });

  const stats = await actions.getDashboardStats();
  assert.equal(stats.statsUnavailable, false);
  assert.equal(stats.statsStatus, 'LIVE');
  assert.equal(stats.statsDiagnosticCode, null);
  assert.equal(stats.totalProjects, 4);
  assert.equal(stats.totalBudget, 12500000);
  assert.equal(stats.totalPayables, 450000);
  assert.equal(stats.pendingMRFs, 2);
  assert.equal(stats.unexpectedInternalField, undefined, 'arbitrary upstream properties must not be copied');
});

test('RoleDashboardClient renders explicit unavailable alert and non-zero placeholders across all 8 archetypes', () => {
  const statsState = loadTs('src/lib/dashboardStatsState.ts');
  const jsx = (type, props) => ({ type, props: props || {} });

  const representativeRoles = [
    'SUPER_ADMIN',        // EXECUTIVE
    'PROJECT_MANAGER',    // PM
    'FINANCE_OFFICER',    // FINANCE
    'PURCHASING_OFFICER', // PROCUREMENT
    'WAREHOUSEMAN',       // LOGISTICS
    'HR_OFFICER',         // HR
    'AUDITOR',            // AUDIT
    'FOREMAN',            // FIELD
  ];

  for (const code of ['BACKEND_HTTP_405', 'BACKEND_HTTP_5XX']) {
    const unavailableStats = statsState.buildUnavailableDashboardStats(code);

    for (const roleId of representativeRoles) {
      const RoleDashboardClient = loadTs('src/app/RoleDashboardClient.tsx', {
        react: {
          useState: (initial) => [initial, () => {}],
        },
        './page.module.css': {
          dashboardContainer: 'dashboardContainer',
          header: 'header',
          statsGrid: 'statsGrid',
          statCard: 'statCard',
          statValue: 'statValue',
          chartsArea: 'chartsArea',
          chartPlaceholder: 'chartPlaceholder',
        },
        'next/link': ({ children, ...rest }) => ({ type: 'a', props: { ...rest, children } }),
        'next/navigation': { useRouter: () => ({ refresh: () => {} }) },
        '@/lib/dashboardStatsState': statsState,
        'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
      }).default;

      const tree = RoleDashboardClient({
        stats: unavailableStats,
        isSystemAdmin: roleId === 'SUPER_ADMIN',
        initialRole: roleId,
      });

      const banners = collectElementNodes(
        tree,
        (n) => n.props && n.props['data-testid'] === 'dashboard-stats-unavailable-banner'
      );
      assert.equal(banners.length, 1, `expected unavailable banner for ${roleId} (${code})`);
      assert.equal(banners[0].props.role, 'alert');
      assert.match(flattenText(banners[0]), new RegExp(code));

      const statValues = collectElementNodes(
        tree,
        (n) => n.props && n.props.className === 'statValue'
      );
      assert.ok(statValues.length >= 2, `expected stat cards for ${roleId}`);

      for (const statNode of statValues) {
        const text = flattenText(statNode).trim();
        assert.ok(
          text === '—' || text === 'Unavailable',
          `expected placeholder ('—' or 'Unavailable') for ${roleId}, got "${text}"`
        );
      }
    }
  }

  // Verify LIVE zero/positive business metrics still render normally without the alert banner
  const liveStats = statsState.normalizeLiveDashboardStats({
    ...statsState.ZERO_DASHBOARD_STATS,
    totalProjects: 0,
    totalBudget: 0,
    totalPayables: 25000,
    pendingAIOverrides: 1,
  });
  const LiveClient = loadTs('src/app/RoleDashboardClient.tsx', {
    react: { useState: (initial) => [initial, () => {}] },
    './page.module.css': { statValue: 'statValue' },
    'next/link': ({ children, ...rest }) => ({ type: 'a', props: { ...rest, children } }),
    'next/navigation': { useRouter: () => ({ refresh: () => {} }) },
    '@/lib/dashboardStatsState': statsState,
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
  }).default;

  const liveTree = LiveClient({ stats: liveStats, isSystemAdmin: false, initialRole: 'PROJECT_DIRECTOR' });
  const liveBanners = collectElementNodes(
    liveTree,
    (n) => n.props && n.props['data-testid'] === 'dashboard-stats-unavailable-banner'
  );
  assert.equal(liveBanners.length, 0, 'no unavailable banner when backend is LIVE');
  const liveTexts = collectElementNodes(liveTree, (n) => n.props && n.props.className === 'statValue').map((n) =>
    flattenText(n).trim()
  );
  assert.deepEqual(liveTexts, ['1', '0', '₱ 0', '₱ 25,000']);
});

test('Express backend /health, signed x-internal-auth 401/403 boundaries, and /api/projects/dashboard-stats routing', async () => {
  const env = { AUTH_SECRET: TEST_SECRET };

  const users = new Map([
    [
      'pm-1',
      {
        id: 'pm-1',
        name: 'PM One',
        email: 'pm1@example.test',
        role: 'PROJECT_MANAGER',
        status: 'ACTIVE',
        lockedUntil: null,
        mustChangePassword: false,
        sessionVersion: 3,
        projectAssignments: [{ projectId: 'proj-assigned-1', assignmentStatus: 'active' }],
      },
    ],
    [
      'pd-1',
      {
        id: 'pd-1',
        name: 'Director One',
        email: 'pd1@example.test',
        role: 'PROJECT_DIRECTOR',
        status: 'ACTIVE',
        lockedUntil: null,
        mustChangePassword: false,
        sessionVersion: 5,
        projectAssignments: [{ projectId: 'proj-dir-1', assignmentStatus: 'active' }],
      },
    ],
    [
      'sa-1',
      {
        id: 'sa-1',
        name: 'Super Admin',
        email: 'sa1@example.test',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        lockedUntil: null,
        mustChangePassword: false,
        sessionVersion: 9,
        projectAssignments: [],
      },
    ],
  ]);

  let boundVerifyCalls = [];
  let capturedProjectFilter = null;
  let deleteMutationCalled = false;

  const prismaRls = loadTs(
    'apps/aws-backend/src/lib/prismaRls.ts',
    {
      'node:async_hooks': asyncHooks,
      'node:crypto': crypto,
      crypto,
      '@prisma/client': {
        Prisma: { sql: (strings, ...vals) => ({ strings, vals }) },
        PrismaClient: class {
          constructor() {
            this.user = {
              findUnique: async ({ where }) => users.get(where.id) || null,
            };
            this.$queryRaw = async (query) => {
              boundVerifyCalls.push(query);
              return [{ ok: true }];
            };
            this.$extends = () => this;
          }
        },
      },
    },
    env
  );

  // Direct unit check on resolveBackendRequestProjectContext: 'dashboard-stats' is never a projectId candidate
  const dashboardCtx = await prismaRls.resolveBackendRequestProjectContext(
    { path: '/projects/dashboard-stats', method: 'GET', headers: {}, query: {}, body: {} },
    null
  );
  assert.equal(JSON.stringify(dashboardCtx.allCandidateProjectIds), JSON.stringify([]));
  assert.equal(dashboardCtx.primaryProjectId, null);

  // Subpaths or mutations under 'dashboard-stats' are NOT exempted from project candidate resolution
  const mutationDashboardCtx = await prismaRls.resolveBackendRequestProjectContext(
    { path: '/projects/dashboard-stats/assign-manager', method: 'POST', headers: {}, query: {}, body: {} },
    null
  );
  assert.equal(JSON.stringify(mutationDashboardCtx.allCandidateProjectIds), JSON.stringify(['dashboard-stats']));

  const realProjectCtx = await prismaRls.resolveBackendRequestProjectContext(
    { path: '/projects/proj-assigned-1', method: 'DELETE', headers: {}, query: {}, body: {} },
    null
  );
  assert.equal(JSON.stringify(realProjectCtx.allCandidateProjectIds), JSON.stringify(['proj-assigned-1']));

  const { requireAuth } = loadTs(
    'apps/aws-backend/src/middleware/auth.ts',
    {
      crypto,
      '../lib/prismaRls': prismaRls,
    },
    env
  );

  const zeroCountModel = {
    count: async () => 0,
    aggregate: async () => ({ _sum: { amount: 0, netPayable: 0 }, _avg: { percentageAccomplished: 0 } }),
  };

  const mockRouteDb = {
    user: {
      findUnique: async ({ where }) => users.get(where.id) || null,
      count: async () => users.size,
    },
    role: {
      findFirst: async ({ where }) => {
        const matchCode = where?.OR?.[0]?.roleCode || where?.OR?.[0]?.roleName;
        if (matchCode === 'SUPER_ADMIN') {
          return {
            isActive: true,
            roleCode: 'SUPER_ADMIN',
            roleName: 'SUPER_ADMIN',
            rolePermissions: [
              { moduleName: 'DASHBOARD', canView: true },
              { moduleName: 'PROJECT_MANAGEMENT', canView: true, canEditDraft: true },
              { moduleName: 'FINANCE', canView: true },
              { moduleName: 'USERS', canView: true },
              { moduleName: 'SYSTEM_ROLES', canView: true },
            ],
          };
        }
        if (matchCode === 'PROJECT_MANAGER') {
          return {
            isActive: true,
            roleCode: 'PROJECT_MANAGER',
            roleName: 'PROJECT_MANAGER',
            rolePermissions: [
              { moduleName: 'DASHBOARD', canView: true },
              { moduleName: 'PROJECT_MANAGEMENT', canView: true, canEditDraft: true },
            ],
          };
        }
        if (matchCode === 'AUDITOR') {
          return {
            isActive: true,
            roleCode: 'AUDITOR',
            roleName: 'AUDITOR',
            rolePermissions: [
              { moduleName: 'DASHBOARD', canView: true },
              { moduleName: 'PROJECT_MANAGEMENT', canView: true, canEditDraft: false },
            ],
          };
        }
        if (matchCode === 'NO_DASHBOARD') {
          return {
            isActive: true,
            roleCode: 'NO_DASHBOARD',
            roleName: 'NO_DASHBOARD',
            rolePermissions: [{ moduleName: 'DASHBOARD', canView: false }],
          };
        }
        return null;
      },
    },
    userRole: {
      findMany: async () => [],
    },
    project: {
      findUnique: async ({ where }) => (where.id === 'proj-assigned-1' ? { id: 'proj-assigned-1' } : null),
      count: async ({ where }) => {
        capturedProjectFilter = where;
        return 1;
      },
      findMany: async () => [{ contractAmount: 500000 }],
      update: async () => ({ id: 'proj-assigned-1', projectSchedule: null }),
    },
    materialRequest: zeroCountModel,
    expense: zeroCountModel,
    accountsPayable: zeroCountModel,
    subcontractBilling: zeroCountModel,
    awardedBOQItem: zeroCountModel,
    aIValidationOverride: zeroCountModel,
    pettyCashAccount: zeroCountModel,
    payrollPeriod: zeroCountModel,
    purchaseOrder: zeroCountModel,
    canvassForm: zeroCountModel,
    worker: zeroCountModel,
    subcontractor: zeroCountModel,
    supplier: zeroCountModel,
    accomplishment: zeroCountModel,
    materialIssuance: zeroCountModel,
    auditLog: zeroCountModel,
    dailyTimeRecord: zeroCountModel,
    document: zeroCountModel,
    jobOrder: zeroCountModel,
    variationOrder: zeroCountModel,
  };

  const projectsRouter = loadTs('apps/aws-backend/src/routes/projects.ts', {
    '../lib/h02ProjectMutation': {
      invokeH02ProjectMutation: async () => {
        deleteMutationCalled = true;
      },
    },
    express: require('express'),
    '@prisma/client': {
      PrismaClient: class {
        constructor() {
          return mockRouteDb;
        }
      },
    },
  }).default;

  const app = express();
  app.use(express.json());
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'OneSystemsERP AWS Backend' });
  });
  app.use('/api', requireAuth);
  app.use('/api/projects', projectsRouter);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });

  try {
    const base = `http://127.0.0.1:${server.address().port}`;

    // 1. Public health check works without credentials
    const healthRes = await fetch(`${base}/health`);
    assert.equal(healthRes.status, 200);
    assert.deepEqual(await healthRes.json(), { status: 'ok', service: 'OneSystemsERP AWS Backend' });

    // 2. 401 negative paths on /api/projects/dashboard-stats
    const noAuth = await fetch(`${base}/api/projects/dashboard-stats`);
    assert.equal(noAuth.status, 401);

    const badSig = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: { 'x-internal-auth': signToken({ uid: 'pm-1' }, 'wrong-secret') },
    });
    assert.equal(badSig.status, 401);

    const expired = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: {
        'x-internal-auth': signToken({
          uid: 'pm-1',
          iat: Math.floor(Date.now() / 1000) - 120,
          exp: Math.floor(Date.now() / 1000) - 60,
        }),
      },
    });
    assert.equal(expired.status, 401);

    const revokedSv = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: { 'x-internal-auth': signToken({ uid: 'pm-1', sv: 2 }) },
    });
    assert.equal(revokedSv.status, 401);

    // 3. 403 negative paths: mismatched x-user-session & non-admin role simulation escalation
    const spoofedSession = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: {
        'x-internal-auth': signToken({ uid: 'pm-1', sv: 3 }),
        'x-user-session': 'sa-1',
      },
    });
    assert.equal(spoofedSession.status, 403);

    const directorSimulatingAdmin = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: {
        'x-internal-auth': signToken({ uid: 'pd-1', role: 'PROJECT_DIRECTOR', sv: 5, sim: 'SUPER_ADMIN' }),
      },
    });
    assert.equal(directorSimulatingAdmin.status, 403);

    // 4. Legitimate non-admin GET /api/projects/dashboard-stats succeeds (200) without bogus 'dashboard-stats' project check
    boundVerifyCalls = [];
    capturedProjectFilter = null;
    const validPmStats = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: {
        'x-internal-auth': signToken({ uid: 'pm-1', role: 'PROJECT_MANAGER', sv: 3 }),
      },
    });
    assert.equal(validPmStats.status, 200);
    assert.equal(boundVerifyCalls.length, 0, 'dashboard-stats route segment must not trigger project ID check');
    assert.equal(JSON.stringify(capturedProjectFilter.id), JSON.stringify({ in: ['proj-assigned-1'] }));
    const statsJson = await validPmStats.json();
    assert.equal(statsJson.totalProjects, 1);
    assert.equal(statsJson.totalBudget, 0, 'PM without FINANCE.canView must not receive financial budget total');
    assert.equal(statsJson.totalUsers, 0, 'non-admin must not receive global tenant user count');
    assert.equal(statsJson.totalAuditLogs, 0, 'non-admin must not receive global audit log count');
    assert.equal(statsJson.pendingAIOverrides, 0, 'non-admin must not receive global AI override count');

    // Global SUPER_ADMIN with FINANCE & USERS view grants receives totalBudget and tenant-wide totalUsers
    const validSaStats = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: {
        'x-internal-auth': signToken({ uid: 'sa-1', role: 'SUPER_ADMIN', sv: 9 }),
      },
    });
    assert.equal(validSaStats.status, 200);
    const saStatsJson = await validSaStats.json();
    assert.equal(saStatsJson.totalUsers, 3);
    assert.equal(saStatsJson.totalBudget, 500000);

    // Caller whose role denies DASHBOARD.canView is rejected with 403 on GET /api/projects/dashboard-stats
    users.set('no-dash-1', {
      id: 'no-dash-1',
      name: 'No Dashboard',
      email: 'nodash@example.test',
      role: 'NO_DASHBOARD',
      status: 'ACTIVE',
      lockedUntil: null,
      mustChangePassword: false,
      sessionVersion: 1,
      projectAssignments: [{ projectId: 'proj-assigned-1', assignmentStatus: 'active' }],
    });
    const deniedDashStats = await fetch(`${base}/api/projects/dashboard-stats`, {
      headers: {
        'x-internal-auth': signToken({ uid: 'no-dash-1', role: 'NO_DASHBOARD', sv: 1 }),
      },
    });
    assert.equal(deniedDashStats.status, 403);

    // HEAD /api/projects/dashboard-stats also succeeds (200) without triggering reserved-ID 400
    const headStats = await fetch(`${base}/api/projects/dashboard-stats`, {
      method: 'HEAD',
      headers: {
        'x-internal-auth': signToken({ uid: 'pm-1', role: 'PROJECT_MANAGER', sv: 3 }),
      },
    });
    assert.equal(headStats.status, 200);

    // Reserved 'dashboard-stats' rejected with 400 (not 403) even for non-admin callers on assign-manager and dates
    const assignReservedPm = await fetch(`${base}/api/projects/dashboard-stats/assign-manager`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-auth': signToken({ uid: 'pm-1', role: 'PROJECT_MANAGER', sv: 3 }),
      },
      body: JSON.stringify({ managerId: 'pm-1' }),
    });
    assert.equal(assignReservedPm.status, 400);

    const datesReservedPm = await fetch(`${base}/api/projects/dashboard-stats/dates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-auth': signToken({ uid: 'pm-1', role: 'PROJECT_MANAGER', sv: 3 }),
      },
      body: JSON.stringify({ startDateStr: '2026-11-18', durationDays: 30 }),
    });
    assert.equal(datesReservedPm.status, 400);

    // /:id/dates rejects view_only assignment (403) and permits full write assignment with PROJECT_MANAGEMENT.canEditDraft (200)
    users.set('pm-readonly', {
      id: 'pm-readonly',
      name: 'Readonly PM',
      email: 'ro@example.test',
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE',
      lockedUntil: null,
      mustChangePassword: false,
      sessionVersion: 1,
      projectAssignments: [{ projectId: 'proj-assigned-1', assignmentStatus: 'active', accessLevel: 'view_only' }],
    });
    const viewOnlyDates = await fetch(`${base}/api/projects/proj-assigned-1/dates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-auth': signToken({ uid: 'pm-readonly', role: 'PROJECT_MANAGER', sv: 1 }),
      },
      body: JSON.stringify({ startDateStr: '2026-11-18', durationDays: 30 }),
    });
    assert.equal(viewOnlyDates.status, 403);

    users.get('pm-1').projectAssignments = [
      { projectId: 'proj-assigned-1', assignmentStatus: 'active', accessLevel: 'full', projectRole: 'PROJECT_MANAGER' },
    ];
    const writableDates = await fetch(`${base}/api/projects/proj-assigned-1/dates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-auth': signToken({ uid: 'pm-1', role: 'PROJECT_MANAGER', sv: 3 }),
      },
      body: JSON.stringify({ startDateStr: '2026-11-18', durationDays: 30 }),
    });
    assert.equal(writableDates.status, 200);

    // Assigned SUPER_ADMIN with writable projectRole=PROJECT_MANAGER simulating AUDITOR (canEditDraft: false) is STILL denied on /:id/dates (403)
    users.get('sa-1').projectAssignments = [
      { projectId: 'proj-assigned-1', assignmentStatus: 'active', accessLevel: 'full', projectRole: 'PROJECT_MANAGER' },
    ];
    const simulatedAuditorDates = await fetch(`${base}/api/projects/proj-assigned-1/dates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-auth': signToken({ uid: 'sa-1', role: 'SUPER_ADMIN', sv: 9, sim: 'AUDITOR' }),
      },
      body: JSON.stringify({ startDateStr: '2026-11-18', durationDays: 30 }),
    });
    assert.equal(simulatedAuditorDates.status, 403);

    // 5. Direct route unit check: missing userId or missing DB user on /dashboard-stats fails closed (401), never unscoped
    const missingUserRes = {
      code: null,
      status(c) {
        this.code = c;
        return this;
      },
      json() {
        return this;
      },
    };
    const statsLayer = projectsRouter.stack.find((l) => l.route && l.route.path === '/dashboard-stats');
    await statsLayer.route.stack[0].handle({ headers: {} }, missingUserRes, () => {});
    assert.equal(missingUserRes.code, 401);

    // 6. DELETE /api/projects/:id rejects simulated SUPER_ADMIN on non-admin user and rejects reserved 'dashboard-stats'
    const deleteLayer = projectsRouter.stack.find((l) => l.route && l.route.path === '/:id' && l.route.methods.delete);
    const forgedDeleteRes = {
      code: null,
      status(c) {
        this.code = c;
        return this;
      },
      json() {
        return this;
      },
    };
    await deleteLayer.route.stack[0].handle(
      {
        params: { id: 'proj-dir-1' },
        headers: { 'x-user-session': 'pd-1', 'x-simulated-role': 'SUPER_ADMIN' },
      },
      forgedDeleteRes,
      () => {}
    );
    assert.equal(forgedDeleteRes.code, 403);
    assert.equal(deleteMutationCalled, false);

    const reservedDeleteRes = {
      code: null,
      status(c) {
        this.code = c;
        return this;
      },
      json() {
        return this;
      },
    };
    await deleteLayer.route.stack[0].handle(
      {
        params: { id: 'dashboard-stats' },
        headers: { 'x-user-session': 'sa-1' },
      },
      reservedDeleteRes,
      () => {}
    );
    assert.equal(reservedDeleteRes.code, 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('buildAuthenticatedBackendRequest restricts role simulation to SUPER_ADMIN and SYSTEM_ADMIN', async () => {
  const env = {
    AUTH_SECRET: TEST_SECRET,
    AWS_BACKEND_URL: 'https://api-preview.onesystemserp.internal',
  };

  for (const nonSystemAdminRole of ['PROJECT_DIRECTOR', 'DIRECTORS', 'ADMIN', 'PROJECT_MANAGER']) {
    const backendAuth = loadTs(
      'src/lib/backendAuth.ts',
      {
        crypto,
        'next/headers': {
          cookies: async () => ({
            get: (name) => (name === 'simulatedRole' ? { value: 'SUPER_ADMIN' } : undefined),
            getAll: () => [{ name: 'authjs.session-token', value: 'tok-1' }],
          }),
        },
        '@/lib/dal/auth': {
          verifySession: async () => ({
            id: 'actor-1',
            role: nonSystemAdminRole,
            sessionVersion: 4,
            mustChangePassword: false,
          }),
        },
        '@/lib/backendUrl': {
          getBackendUrl: () => 'https://api-preview.onesystemserp.internal',
          isTrustedFirstPartyBackendUrl: () => true,
        },
      },
      env
    );

    const built = await backendAuth.buildAuthenticatedBackendRequest('/api/projects/dashboard-stats');
    assert.equal(built.init.redirect, 'manual', 'authenticated backend requests must not follow redirects');
    const headers = new Headers(built.init.headers);
    assert.equal(headers.get('x-simulated-role'), null, `${nonSystemAdminRole} must not send x-simulated-role`);
    const payload = JSON.parse(
      Buffer.from(headers.get('x-internal-auth').split('.')[1], 'base64url').toString('utf8')
    );
    assert.equal(payload.sim, null, `${nonSystemAdminRole} must not sign sim claim`);
  }

  // Real SUPER_ADMIN may simulate a lower role for UI/RBAC boundary testing
  const adminBackendAuth = loadTs(
    'src/lib/backendAuth.ts',
    {
      crypto,
      'next/headers': {
        cookies: async () => ({
          get: (name) => (name === 'simulatedRole' ? { value: 'PURCHASING_OFFICER' } : undefined),
          getAll: () => [],
        }),
      },
      '@/lib/dal/auth': {
        verifySession: async () => ({
          id: 'admin-1',
          role: 'SUPER_ADMIN',
          sessionVersion: 1,
          mustChangePassword: false,
        }),
      },
      '@/lib/backendUrl': {
        getBackendUrl: () => 'https://api-preview.onesystemserp.internal',
        isTrustedFirstPartyBackendUrl: () => true,
      },
    },
    env
  );
  const adminBuilt = await adminBackendAuth.buildAuthenticatedBackendRequest('/api/projects/dashboard-stats');
  const adminHeaders = new Headers(adminBuilt.init.headers);
  assert.equal(adminHeaders.get('x-simulated-role'), 'PURCHASING_OFFICER');
});

test('Next.js /api/projects/[id] route rejects reserved dashboard-stats segment before Prisma queries', async () => {
  let dbTouched = false;
  const route = loadTs('src/app/api/projects/[id]/route.ts', {
    'next/server': {
      NextResponse: {
        json: (body, init) => ({ status: init?.status ?? 200, body }),
      },
    },
    'next/headers': {
      cookies: async () => ({ get: () => undefined }),
    },
    '@/lib/prisma': {
      prisma: {
        project: {
          findUnique: async () => {
            dbTouched = true;
            return null;
          },
          update: async () => {
            dbTouched = true;
            return null;
          },
        },
      },
    },
    '@/lib/dal/auth': {
      verifyOperationalSession: async () => ({ userId: 'sa-1', role: 'SUPER_ADMIN' }),
    },
    '@/lib/uboq/project-ownership': {
      assertProjectGraphOwnership: async () => {
        dbTouched = true;
      },
      isGlobalTenantAdminRole: () => true,
    },
  });

  assert.equal(route.GET, undefined, 'dynamic [id] route does not masquerade as GET /dashboard-stats');
  const putRes = await route.PUT(
    { json: async () => ({ status: 'ACTIVE' }) },
    { params: Promise.resolve({ id: 'dashboard-stats' }) }
  );
  assert.equal(putRes.status, 400);

  const delRes = await route.DELETE({}, { params: Promise.resolve({ id: 'dashboard-stats' }) });
  assert.equal(delRes.status, 400);
  assert.equal(dbTouched, false);
});

test('executiveActions enforces executive boundary and blocks simulatedRole PBAC widening', async () => {
  const capturedQueries = [];

  function loadExec(realRole, simulatedCookie, status = 'ACTIVE', canViewProjects = true, simCanViewProjects = true) {
    return loadTs('src/app/actions/executiveActions.ts', {
      '@/lib/dal/auth': {
        verifySession: async () => ({ id: 'exec-actor', role: realRole }),
      },
      'next/headers': {
        cookies: async () => ({
          get: (k) => (k === 'simulatedRole' && simulatedCookie ? { value: simulatedCookie } : undefined),
        }),
      },
      '@/lib/prisma': {
        prisma: {
          user: {
            findUnique: async () => ({ id: 'exec-actor', role: realRole, status }),
          },
          role: {
            findFirst: async ({ where }) => {
              const code = where?.OR?.[0]?.roleCode || where?.OR?.[0]?.roleName;
              const isSimLookup = simulatedCookie && code === simulatedCookie && code !== realRole;
              return {
                isActive: true,
                roleCode: code,
                roleName: code,
                rolePermissions: [
                  {
                    moduleName: 'PROJECT_MANAGEMENT',
                    canView: isSimLookup ? simCanViewProjects : canViewProjects,
                  },
                ],
              };
            },
          },
          userRole: {
            findMany: async () => [],
          },
          project: {
            findMany: async (args) => {
              capturedQueries.push(args);
              return [];
            },
          },
        },
      },
    });
  }

  // 0. Executive role with PROJECT_MANAGEMENT.canView denied is rejected (even if SUPER_ADMIN simulates PROJECT_DIRECTOR)
  const deniedPermExec = loadExec('PROJECT_DIRECTOR', null, 'ACTIVE', false);
  await assert.rejects(() => deniedPermExec.getCompanyOverview('ALL'), /Unauthorized: Executive access required/);
  const deniedAdminSimExec = loadExec('SUPER_ADMIN', 'PROJECT_DIRECTOR', 'ACTIVE', false, true);
  await assert.rejects(() => deniedAdminSimExec.getCompanyOverview('ALL'), /Unauthorized: Executive access required/);

  // 1. Non-executive role is rejected with 'Unauthorized: Executive access required'
  const nonExec = loadExec('PURCHASING_OFFICER', null);
  await assert.rejects(() => nonExec.getCompanyOverview('ALL'), /Unauthorized: Executive access required/);
  await assert.rejects(() => nonExec.getProjectPortfolio(), /Unauthorized: Executive access required/);

  // 2. SUPER_ADMIN simulating PURCHASING_OFFICER also hits the executive boundary cleanly
  const simulatedNonExec = loadExec('SUPER_ADMIN', 'PURCHASING_OFFICER');
  await assert.rejects(() => simulatedNonExec.getCompanyOverview('ALL'), /Unauthorized: Executive access required/);

  // 3. PROJECT_DIRECTOR, DIRECTORS, and ADMIN with simulatedRole=SUPER_ADMIN CANNOT widen project scope
  for (const role of ['PROJECT_DIRECTOR', 'DIRECTORS', 'ADMIN']) {
    capturedQueries.length = 0;
    const exec = loadExec(role, 'SUPER_ADMIN');
    await exec.getCompanyOverview('ALL');
    await exec.getProjectPortfolio();
    assert.equal(capturedQueries.length, 2);
    assert.equal(capturedQueries[0].where.userAssignments.some.userId, 'exec-actor');
    assert.equal(capturedQueries[1].where.userAssignments.some.userId, 'exec-actor');
  }

  // 4. ExecutivePortfolioPage catches unauthorized errors and renders controlled alert state
  const jsx = (type, props) => ({ type, props: props || {} });
  const PortfolioPage = loadTs('src/app/executive/portfolio/page.tsx', {
    react: {},
    '@/app/actions/executiveActions': {
      getProjectPortfolio: async () => {
        throw new Error('Unauthorized: Executive access required');
      },
    },
    'next/link': ({ children, ...rest }) => ({ type: 'a', props: { ...rest, children } }),
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
  }).default;

  const portfolioTree = await PortfolioPage();
  const alerts = collectElementNodes(portfolioTree, (n) => n.props && n.props.role === 'alert');
  assert.equal(alerts.length, 1);
  assert.match(flattenText(alerts[0]), /Unauthorized: Executive access required/);

  // 5. Internal database errors in PortfolioPage are sanitized before rendering
  const SanitizedPortfolioPage = loadTs('src/app/executive/portfolio/page.tsx', {
    react: {},
    '@/app/actions/executiveActions': {
      getProjectPortfolio: async () => {
        throw new Error('Can not reach database server at postgresql://secret@db.internal:5432/oserp');
      },
    },
    'next/link': ({ children, ...rest }) => ({ type: 'a', props: { ...rest, children } }),
    'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: Symbol('Fragment') },
  }).default;
  const sanitizedTree = await SanitizedPortfolioPage();
  const sanitizedAlertText = flattenText(
    collectElementNodes(sanitizedTree, (n) => n.props && n.props.role === 'alert')[0]
  );
  assert.ok(!sanitizedAlertText.includes('postgresql://'), 'raw DB details must not render in alert');
  assert.match(sanitizedAlertText, /Failed to load project portfolio data/);

  // 6. Express executiveActions route enforces DB RolePermission grants, ignores caller-supplied body.sessionToken / simulatedRole, and rejects mismatches (403)
  const execRouterQueries = [];
  let saCanViewProjects = true;
  const execRouter = loadTs('apps/aws-backend/src/routes/executiveActions.ts', {
    express: require('express'),
    '@prisma/client': {
      PrismaClient: class {
        constructor() {
          this.user = {
            findUnique: async ({ where }) =>
              where.id === 'pd-1'
                ? { id: 'pd-1', role: 'PROJECT_DIRECTOR', status: 'ACTIVE' }
                : where.id === 'sa-1'
                  ? { id: 'sa-1', role: 'SUPER_ADMIN', status: 'ACTIVE' }
                  : null,
          };
          this.role = {
            findFirst: async ({ where }) => {
              const code = where?.OR?.[0]?.roleCode || where?.OR?.[0]?.roleName;
              if (code === 'SUPER_ADMIN') {
                return {
                  isActive: true,
                  roleCode: 'SUPER_ADMIN',
                  roleName: 'SUPER_ADMIN',
                  rolePermissions: [{ moduleName: 'PROJECT_MANAGEMENT', canView: saCanViewProjects }],
                };
              }
              if (code === 'PROJECT_DIRECTOR') {
                return {
                  isActive: true,
                  roleCode: 'PROJECT_DIRECTOR',
                  roleName: 'PROJECT_DIRECTOR',
                  rolePermissions: [{ moduleName: 'PROJECT_MANAGEMENT', canView: true }],
                };
              }
              return null;
            },
          };
          this.userRole = {
            findMany: async () => [],
          };
          this.project = {
            findMany: async (args) => {
              execRouterQueries.push(args);
              return [];
            },
          };
        }
      },
    },
  }).default;

  const overviewLayer = execRouter.stack.find(
    (l) => l.route && l.route.path === '/getCompanyOverview' && l.route.methods.post
  );
  const spoofedExecRes = {
    code: 200,
    payload: null,
    status(c) {
      this.code = c;
      return this;
    },
    json(p) {
      this.payload = p;
      return this;
    },
  };
  await overviewLayer.route.stack[0].handle(
    {
      user: { id: 'pd-1', role: 'PROJECT_DIRECTOR' },
      headers: { 'x-user-session': 'pd-1' },
      pbacContext: { simulatedRole: undefined },
      body: { sessionToken: 'sa-1', simulatedRole: 'SUPER_ADMIN', projectId: 'ALL' },
    },
    spoofedExecRes,
    () => {}
  );
  assert.equal(spoofedExecRes.code, 403, 'conflicting body sessionToken must be rejected with 403');
  assert.equal(execRouterQueries.length, 0);

  const validDirectorExecRes = {
    code: 200,
    payload: null,
    status(c) {
      this.code = c;
      return this;
    },
    json(p) {
      this.payload = p;
      return this;
    },
  };
  await overviewLayer.route.stack[0].handle(
    {
      user: { id: 'pd-1', role: 'PROJECT_DIRECTOR' },
      headers: { 'x-user-session': 'pd-1' },
      pbacContext: { simulatedRole: undefined },
      body: { simulatedRole: 'SUPER_ADMIN', projectId: 'ALL' },
    },
    validDirectorExecRes,
    () => {}
  );
  assert.equal(validDirectorExecRes.code, 200);
  assert.equal(execRouterQueries.length, 1);
  assert.equal(execRouterQueries[0].where.userAssignments.some.userId, 'pd-1');

  // Active SUPER_ADMIN with denied real PROJECT_MANAGEMENT.canView cannot bypass via simulated PROJECT_DIRECTOR
  saCanViewProjects = false;
  const deniedAdminSimRes = {
    code: 200,
    status(c) {
      this.code = c;
      return this;
    },
    json() {
      return this;
    },
  };
  await overviewLayer.route.stack[0].handle(
    {
      user: { id: 'sa-1', role: 'SUPER_ADMIN' },
      headers: { 'x-user-session': 'sa-1' },
      pbacContext: { simulatedRole: 'PROJECT_DIRECTOR' },
      body: { projectId: 'ALL' },
    },
    deniedAdminSimRes,
    () => {}
  );
  assert.equal(deniedAdminSimRes.code, 403);
});
