import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url), Module = require('node:module'), original = Module._load;
let events: any[] = [], committed: any[] = [], failPow = false;
const scoped: any = {
  subcontractPackage: {
    create: async (args: any) => { events.push(['package-create', args]); return { id: 'pkg', ...args.data }; },
    findMany: async (args: any) => { events.push(['package-read', args]); return []; },
  },
  jobOrder: { create: async (args: any) => { events.push(['job-create', args]); return { id: 'job', ...args.data }; } },
  $transaction: async (fn: any) => {
    const pending: string[] = [];
    const result = await fn({
      subcontractPackage: { create: async (args: any) => { pending.push('package'); return { id: 'pkg', ...args.data }; } },
      programOfWorks: { create: async (args: any) => { assert.equal(args.data.packageId, 'pkg'); if (failPow) throw Error('injected POW failure'); pending.push('pow'); return { id: 'pow', ...args.data }; } },
    });
    committed.push(...pending); return result;
  },
};
const installedPrisma = require('@prisma/client');
Module._load = function (request: string, ...args: any[]) {
  if (request.endsWith('/lib/prismaRls') || request === './prismaRls') return { backendPrisma: scoped };
  if (request.endsWith('/lib/permissions') || request === './permissions') return { requirePermission: async () => {} };
  if (request === '@prisma/client') return { ...installedPrisma, PrismaClient: class { constructor() { return new Proxy({}, { get(_target, prop) { throw Error('UNEXPECTED_RAW_DATABASE_ACCESS:' + String(prop)); } }); } } };
  return original.call(this, request, ...args);
};
const packages = require('../../apps/aws-backend/src/routes/subcontractingActions').default;
const jobs = require('../../apps/aws-backend/src/routes/jobOrderActions').default;
Module._load = original;
async function call(router: any, url: string, body: any) {
  const handler = router.stack.find((x: any) => x.route?.path === url && x.route.methods.post).route.stack[0].handle;
  let status = 200, payload: any;
  const response = { status(n: number) { status = n; return this; }, json(value: any) { payload = value; return this; } };
  await handler({ body, headers: { 'x-user-session': 'actor' }, user: { id: 'actor' } }, response);
  return { status, payload };
}
(async () => {
  assert.equal((await call(packages, '/createSubcontractPackage', { data: { projectId: 'P1', packageNumber: 'SP1' } })).status, 200);
  assert.equal(events[0][0], 'package-create'); assert.equal(events[0][1].data.projectId, 'P1');
  assert.equal((await call(packages, '/getSubcontractPackages', { projectId: 'P1' })).status, 200);
  assert.equal(events[1][0], 'package-read');
  assert.equal((await call(jobs, '/createJobOrder', { data: { projectId: 'P1', jobNumber: 'JO1' } })).status, 200);
  assert.equal(events[2][0], 'job-create');
  const full = { packageData: { projectId: 'P1', packageNumber: 'SP2' }, boqItems: [], powData: { title: 'POW' } };
  assert.equal((await call(packages, '/createFullSubcontractPackage', full)).status, 200);
  assert.deepEqual(committed, ['package', 'pow']); committed = []; failPow = true;
  assert.equal((await call(packages, '/createFullSubcontractPackage', full)).status, 500);
  assert.deepEqual(committed, []);
  // All target direct delegates use the scoped client; unrelated raw delegates remain untouched.
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
  for (const name of ['subcontracting', 'subcontractingActions', 'jobOrderActions']) {
    const source = fs.readFileSync(path.join(root, 'apps/aws-backend/src/routes', name + '.ts'), 'utf8');
    assert.doesNotMatch(source, /\bprisma\.(subcontractPackage|programOfWorks|jobOrder)\./);
  }
  const payroll = fs.readFileSync(path.join(root, 'apps/aws-backend/src/routes/payroll.ts'), 'utf8');
  assert.doesNotMatch(payroll, /\bprisma\.(payrollPeriod|payroll|dailyTimeRecord)\./);
  assert.match(payroll, /prisma\.worker\.findMany/); // not silently granted/rewritten
  class NoConnectionClient {
    $extends() { return this; }
    async $queryRaw(query: any) { return [{ proj: query.values.includes('missing') || query.values.includes('company-period') ? null : 'P1' }]; }
  }
  Module._load = function (request: string, ...args: any[]) {
    if (request === '@prisma/client') return { ...installedPrisma, PrismaClient: NoConnectionClient };
    return original.call(this, request, ...args);
  };
  const { resolveBackendRequestProjectContext } = require('../../apps/aws-backend/src/lib/prismaRls');
  Module._load = original;
  const request = (url: string, body: any = {}, method = 'POST', headers: any = {}) => ({ path: url, body, method, headers, query: {} });
  for (const req of [
    request('/subcontractingActions/createSubcontractPackage', { data: { projectId: 'P1' } }),
    request('/subcontractingActions/createFullSubcontractPackage', { packageData: { projectId: 'P1' } }),
    request('/subcontractingActions/updateFullSubcontractPackage', { id: 'pkg' }),
    request('/subcontractingActions/getSubcontractPackageById', { id: 'pkg' }),
    request('/jobOrderActions/createJobOrder', { data: { projectId: 'P1' } }),
    request('/jobOrderActions/updateJobOrder', { id: 'job' }), request('/jobOrderActions/getJobOrderById', { id: 'job' }),
    request('/subcontracting/packages/pkg', {}, 'PUT'), request('/subcontracting/job-orders/job', {}, 'GET'),
    request('/payroll/engine/compute', { payrollPeriodId: 'period' }),
    request('/payroll/dtr/save-manual', { payrollPeriodId: 'period' }),
  ]) assert.equal((await resolveBackendRequestProjectContext(req)).primaryProjectId, 'P1');
  const conflict = await resolveBackendRequestProjectContext(request('/subcontractingActions/updateSubcontractPackage', { id: 'pkg', data: { projectId: 'P2' } }));
  assert.deepEqual(new Set(conflict.allCandidateProjectIds), new Set(['P1', 'P2']));
  assert.equal((await resolveBackendRequestProjectContext(request('/payroll/engine/compute', { payrollPeriodId: 'company-period' }))).primaryProjectId, null);
  assert.equal((await resolveBackendRequestProjectContext(request('/jobOrderActions/getJobOrderById', { id: 'missing' }))).primaryProjectId, null);
  console.log('PASS: H02 target delegates use the scoped client; actual package/job-order/POW route fixtures and rollback pass; ordinary ID/nested-project resolution preserves conflicts and denies unresolved company payroll scope. Mocked source tests only; no SQL/DB connection.');
})().catch(e => { Module._load = original; console.error(e.stack); process.exitCode = 1; });
