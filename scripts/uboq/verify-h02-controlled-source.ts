import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const original = Module._load;
let context: any = { userId: 'actor', projectId: 'P1', sessionVersion: 7 };
let transactions = 0, commits = 0;
let resultOverride: any;
let overrideResult = false;
let actualDelete = true, simulatedDelete = true;
let permissionCalls: any[] = [], values: any[] = [];
let realPermissionCheck: any;
const fakeRls = {
  backendRlsStorage: { getStore: () => context },
  backendPrisma: { $transaction: async (fn: any) => {
    transactions++;
    const result = await fn({ $queryRaw: async (parts: any, ...args: any[]) => {
      assert.match(parts.join(''), /SELECT public\.uboq_h02_project_mutation/);
      values = args;
      return overrideResult ? resultOverride : [{ result: { success: true, projectId: 'P1', id: args[1] ?? 'created-assignment' } }];
    } });
    commits++;
    return result;
  } },
};
Module._load = function (request: string, ...args: any[]) {
  if (request === './prismaRls') return fakeRls;
  if (request === './permissions') return { requirePermission: async (uid: string, mod: string, action: string, simulation?: string) => {
    if (realPermissionCheck) return realPermissionCheck(uid, mod, action, simulation);
    permissionCalls.push([uid, mod, action, simulation]);
    assert.equal(action, 'canDelete');
    if (!(simulation ? simulatedDelete : actualDelete)) throw Error('permission denied');
  } };
  return original.call(this, request, ...args);
};
const { invokeH02ProjectMutation, requireH02DeletePermission } = require('../../apps/aws-backend/src/lib/h02ProjectMutation');
Module._load = original;
const req: any = { user: { id: 'actor', role: 'SUPER_ADMIN', sessionVersion: 7 }, pbacContext: {} };

(async () => {
  await invokeH02ProjectMutation(req, 'DELETE_EMPTY_PROJECT', 'P1');
  assert.deepEqual(values, ['DELETE_EMPTY_PROJECT', 'P1', '{}']);
  const injection = "x'); DELETE FROM public.\"User\"; --";
  await invokeH02ProjectMutation(req, 'ASSIGNMENT_CREATE', null, { projectId: 'P1', userId: injection });
  assert.equal(JSON.parse(values[2]).userId, injection);
  for (const op of ['DELETE_PACKAGE', 'DELETE_JOB_ORDER']) await invokeH02ProjectMutation(req, op, 'target');
  let before = transactions;
  await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_EMPTY_PROJECT', 'P2'), /SCOPE_MISMATCH/);
  await assert.rejects(() => invokeH02ProjectMutation(req, 'ASSIGNMENT_CREATE', null, { projectId: 'P2' }), /SCOPE_MISMATCH/);
  await assert.rejects(() => invokeH02ProjectMutation(req, 'ASSIGNMENT_CREATE', null), /SCOPE_MISMATCH/);
  await assert.rejects(() => invokeH02ProjectMutation(req, 'ARBITRARY', 'id'), /OPERATION_NOT_ALLOWED/);
  await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_JOB_ORDER', ''), /TARGET_ID_REQUIRED/);
  await assert.rejects(() => invokeH02ProjectMutation(req, 'ASSIGNMENT_UPDATE', 'id', null), /DATA_REQUIRED/);
  for (const bad of [{ ...context, userId: 'other' }, { ...context, projectId: '' }, { ...context, sessionVersion: 8 }]) {
    const good = context; context = bad;
    await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_PACKAGE', 'pkg'), /CONTEXT_REQUIRED/);
    context = good;
  }
  for (const role of ['ADMIN', 'PROJECT_DIRECTOR', 'DIRECTORS', 'VIEWER']) {
    req.user.role = role; req.pbacContext.simulatedRole = 'SUPER_ADMIN';
    for (const op of ['DELETE_EMPTY_PROJECT', 'ASSIGNMENT_CREATE', 'ASSIGNMENT_UPDATE', 'ASSIGNMENT_DELETE']) {
      await assert.rejects(() => invokeH02ProjectMutation(req, op, op === 'ASSIGNMENT_CREATE' ? null : 'P1', { projectId: 'P1' }), /ADMIN_REQUIRED/);
    }
    actualDelete = false; simulatedDelete = true; permissionCalls = [];
    await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_PACKAGE', 'pkg'), /permission denied/);
    assert.deepEqual(permissionCalls, [['actor', 'SUBCONTRACTING', 'canDelete', undefined]]);
    permissionCalls = [];
    await assert.rejects(() => requireH02DeletePermission(req, 'PAYROLL'), /permission denied/);
    assert.deepEqual(permissionCalls, [['actor', 'PAYROLL', 'canDelete', undefined]]);
  }
  req.user.role = 'SUPER_ADMIN'; req.pbacContext.simulatedRole = 'VIEWER'; actualDelete = true; simulatedDelete = false;
  await assert.rejects(() => invokeH02ProjectMutation(req, 'ASSIGNMENT_DELETE', 'id'), /ADMIN_REQUIRED/);
  await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_PACKAGE', 'pkg'), /permission denied/);
  assert.equal(transactions, before);
  simulatedDelete = true; req.pbacContext.simulatedRole = 'SYSTEM_ADMIN'; permissionCalls = [];
  await invokeH02ProjectMutation(req, 'DELETE_JOB_ORDER', 'job');
  assert.deepEqual(permissionCalls, [['actor', 'SUBCONTRACTING', 'canDelete', undefined], ['actor', 'SUBCONTRACTING', 'canDelete', 'SYSTEM_ADMIN']]);
  req.pbacContext = {};
  // Fail inside the transaction so invalid/missing results cannot commit.
  overrideResult = true; const committedBefore = commits;
  for (const bad of [undefined, null, [], [{}], [{ result: null }], [{ result: [] }], [{ result: {} }], [{ result: { success: false } }],
    [{ result: { success: true, projectId: 'P2', id: 'job' } }], [{ result: { success: true, projectId: 'P1', id: '' } }],
    [{ result: { success: true, projectId: 'P1', id: 'other' } }], [{ result: { success: true } }, { result: { success: true } }]]) {
    resultOverride = bad;
    await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_JOB_ORDER', 'job'), /H02_RPC_/);
  }
  assert.equal(commits, committedBefore); overrideResult = false;
  // Reconcile against the actual RBAC implementation and reviewed permission shape.
  let dbRole = 'ADMIN';
  const installedPrisma = original.call(Module, '@prisma/client', module);
  class PermissionFixtureClient {
    user = { findUnique: async () => ({ role: dbRole }) };
    userRole = { findMany: async () => [] };
    role = { findFirst: async (args: any) => ({ rolePermissions: [{
      moduleName: 'SUBCONTRACTING', canDeleteDraft: args.where.OR[0].roleName !== 'VIEWER',
    }] }) };
  }
  Module._load = function (request: string, ...args: any[]) {
    if (request === '@prisma/client') return { ...installedPrisma, PrismaClient: PermissionFixtureClient };
    return original.call(this, request, ...args);
  };
  const actualPermissions = require('../../apps/aws-backend/src/lib/permissions');
  Module._load = original;
  assert.equal(await actualPermissions.hasPermission('actor', 'SUBCONTRACTING', 'canDeleteDraft'), true);
  assert.equal(await actualPermissions.hasPermission('actor', 'SUBCONTRACTING', 'canDelete'), false);
  assert.equal(await actualPermissions.hasPermission('actor', 'SUBCONTRACTING', 'canDelete', 'SUPER_ADMIN'), true);
  // Although legacy RBAC simulation grants canDelete in isolation, the helper
  // must intersect it with the real actor's permission before entering a transaction.
  realPermissionCheck = actualPermissions.requirePermission;
  req.user.role = dbRole; req.pbacContext.simulatedRole = 'SUPER_ADMIN'; before = transactions;
  await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_PACKAGE', 'pkg'), /Unauthorized Action/);
  assert.equal(transactions, before);
  dbRole = req.user.role = 'SUPER_ADMIN'; req.pbacContext.simulatedRole = 'VIEWER';
  await assert.rejects(() => invokeH02ProjectMutation(req, 'DELETE_PACKAGE', 'pkg'), /Unauthorized Action/);
  assert.equal(transactions, before);
  req.pbacContext = {};
  await invokeH02ProjectMutation(req, 'DELETE_PACKAGE', 'pkg');
  realPermissionCheck = undefined;
  // Exercise the real project resolver with a no-connection client.
  const realPrisma = original.call(Module, '@prisma/client', module);
  class NoConnectionClient {
    $extends() { return this; }
    async $queryRaw(sql: any) { return [{ proj: sql.values.includes('missing') ? null : 'P1' }]; }
  }
  Module._load = function (request: string, ...args: any[]) {
    if (request === '@prisma/client') return { ...realPrisma, PrismaClient: NoConnectionClient };
    return original.call(this, request, ...args);
  };
  const { resolveBackendRequestProjectContext } = require('../../apps/aws-backend/src/lib/prismaRls');
  Module._load = original;
  const request = (path: string, body: any = {}, method = 'POST', headers: any = {}) => ({ path, body, method, headers, query: {} });
  for (const r of [request('/subcontracting/packages/pkg', {}, 'DELETE'), request('/subcontracting/job-orders/job', {}, 'DELETE'), request('/jobOrderActions/deleteJobOrder', { id: 'job' }), request('/subcontractingActions/deleteSubcontractPackage', { id: 'pkg' }), request('/projectUserAssignment/updateProjectAssignment', { assignmentId: 'a' }), request('/projectUserAssignment/deleteProjectAssignment', { assignmentId: 'a' }), request('/projectUserAssignment/addProjectAssignment', { data: { projectId: 'P1' } }), request('/projects/P1', {}, 'DELETE')]) {
    assert.equal((await resolveBackendRequestProjectContext(r)).primaryProjectId, 'P1');
  }
  const conflict = await resolveBackendRequestProjectContext(request('/subcontracting/packages/pkg', {}, 'DELETE', { 'x-active-project-id': 'P2' }));
  assert.deepEqual(new Set(conflict.allCandidateProjectIds), new Set(['P1', 'P2']));
  assert.equal((await resolveBackendRequestProjectContext(request('/subcontracting/packages/missing', {}, 'DELETE'))).primaryProjectId, null);
  console.log('PASS: real-actor-first canDelete and simulated-role intersection, admin-operation elevation rejection, session/project identity binding, parameter binding, missing/malformed/failed/cross-scope RPC rollback, and real project-resolver fixtures. No SQL or database connection.');
})().catch(e => { Module._load = original; console.error(e.stack); process.exitCode = 1; });
