'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const prismaClient = require('@prisma/client');
const { Prisma, ProjectScheduleWorkflowStatus } = prismaClient;

const ROOT = process.cwd();
const read = (p) => fs.readFileSync(path.resolve(ROOT, p), 'utf8');

function findNodeModules() {
  for (const c of [path.join(ROOT, 'node_modules'), path.resolve(ROOT, '../../node_modules')]) {
    if (fs.existsSync(path.join(c, 'tesseract.js'))) return c;
  }
  throw new Error('node_modules with tesseract.js not found');
}

function loadAdapter() {
  const abs = path.resolve(ROOT, 'src/lib/uboq/adapters/schedule-link-adapter.ts');
  const out = ts.transpileModule(fs.readFileSync(abs, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const mod = { exports: {} };
  const req = (s) => {
    if (s === '@prisma/client') return prismaClient;
    if (s === '../security/stage-rbac') return { assertUboqStageAuthorization: async () => {} };
    if (s === '../uom-registry') {
      const p = path.resolve(ROOT, 'src/lib/uboq/uom-registry.ts');
      const o = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
      const m = { exports: {} };
      new vm.Script(`(function(exports,require,module){${o}})`).runInThisContext()(m.exports, () => ({}), m);
      return m.exports;
    }
    throw new Error('Unexpected import ' + s);
  };
  new vm.Script(`(function(exports,require,module,__filename,__dirname){${out}})`, { filename: abs }).runInThisContext()(mod.exports, req, mod, abs, path.dirname(abs));
  return mod.exports;
}

test('P9-DEF-SYNC-02: schedule filter uses only valid Prisma ProjectScheduleWorkflowStatus members (typed, no cast)', () => {
  const src = read('src/lib/uboq/adapters/schedule-link-adapter.ts');
  assert.doesNotMatch(src, /as never/);
  assert.match(src, /ProjectScheduleWorkflowStatus\.REJECTED/);
  assert.match(src, /ProjectScheduleWorkflowStatus\.SUPERSEDED_BASELINE/);
  assert.match(src, /ProjectScheduleWorkflowStatus\.ARCHIVED_BASELINE/);
  assert.doesNotMatch(src, /'SUPERSEDED'|'ARCHIVED'\]\)/);
  for (const v of ['REJECTED', 'SUPERSEDED_BASELINE', 'ARCHIVED_BASELINE']) {
    assert.ok(Object.values(ProjectScheduleWorkflowStatus).includes(v), `enum member missing: ${v}`);
  }
});

test('P9-DEF-SYNC-02: tryAutoSync queries only with valid enum values and links the eligible schedule', async () => {
  const adapter = loadAdapter();
  const valid = new Set(Object.values(ProjectScheduleWorkflowStatus));
  let seenWhere = null;
  const prisma = {
    projectSchedule: {
      findMany: async (args) => {
        seenWhere = args.where;
        for (const v of args.where.workflowStatus.notIn) assert.ok(valid.has(v), `invalid enum in notIn: ${v}`);
        // emulate DB: honour the filter against a mixed set (rejected / superseded / archived / active)
        const all = [
          { id: 's-rej', workflowStatus: 'REJECTED', _count: { boqAllocations: 3 } },
          { id: 's-sup', workflowStatus: 'SUPERSEDED_BASELINE', _count: { boqAllocations: 3 } },
          { id: 's-arc', workflowStatus: 'ARCHIVED_BASELINE', _count: { boqAllocations: 3 } },
          { id: 's-draft', workflowStatus: 'AI_GENERATED_DRAFT', _count: { boqAllocations: 0 } },
          { id: 's-active', workflowStatus: 'ACTIVE_BASELINE', _count: { boqAllocations: 3 } },
        ];
        return all.filter((s) => !args.where.workflowStatus.notIn.includes(s.workflowStatus));
      },
      findUnique: async () => ({ id: 's-active', projectId: 'proj-a', status: 'BASELINE', workflowStatus: 'ACTIVE_BASELINE' }),
    },
    $transaction: async () => { throw new Error('REACHED_SYNC'); },
  };
  const res = await adapter.tryAutoSyncProjectScheduleLinks(prisma, { projectId: 'proj-a', actorUserId: 'u1' });
  assert.equal(seenWhere.projectId, 'proj-a'); // project-scoped query (cross-project denial at query level)
  assert.equal(res.synced, false);
  assert.equal(res.scheduleId, 's-active'); // eligible ACTIVE_BASELINE chosen; rejected/superseded/archived excluded
  assert.match(res.reason, /REACHED_SYNC/); // reached the transactional adapter => query itself no longer fails
});

test('P9-DEF-SYNC-02: rejected, superseded and archived schedules are denied by the planner; cross-project denied', () => {
  const adapter = loadAdapter();
  const base = {
    projectId: 'proj-a',
    approvedSnapshot: { id: 'snap', projectId: 'proj-a', status: 'APPROVED', approvedAt: new Date(), approvedById: 'u' },
    phaseLines: [{ id: 'pl', projectId: 'proj-a', snapshotId: 'snap', awardedBoqItemId: 'b1', phaseCode: 'P1', sectionCode: null, itemCode: 'I1', unitNormalized: 'm3', approvedQty: new Prisma.Decimal(10) }],
    awardedBoqItems: [{ id: 'b1', projectId: 'proj-a', itemCode: 'I1', unit: 'm3', quantity: 10 }],
    activities: [{ id: 'a1', scheduleId: 's1', wbsId: null }],
    allocations: [{ id: 'al1', activityId: 'a1', awardedBoqItemId: 'b1', scheduleId: 's1', projectId: 'proj-a', allocatedQuantity: new Prisma.Decimal(10) }],
  };
  for (const wf of ['REJECTED', 'SUPERSEDED_BASELINE', 'ARCHIVED_BASELINE']) {
    assert.throws(() => adapter.planScheduleActivityLinks({ ...base, schedule: { id: 's1', projectId: 'proj-a', status: 'BASELINE', workflowStatus: wf } }), /UBOQ_INACTIVE_SCHEDULE_DENIED/, wf);
  }
  assert.throws(() => adapter.planScheduleActivityLinks({ ...base, schedule: { id: 's1', projectId: 'proj-OTHER', status: 'BASELINE', workflowStatus: 'ACTIVE_BASELINE' } }), /UBOQ_SCHEDULE_CROSS_PROJECT_DENIED/);
  const ok = adapter.planScheduleActivityLinks({ ...base, schedule: { id: 's1', projectId: 'proj-a', status: 'BASELINE', workflowStatus: 'ACTIVE_BASELINE' }, requireCompleteAllocation: true });
  assert.equal(ok.plannedLinks.length, 1);
  assert.equal(ok.plannedLinks[0].allocatedQty.toFixed(4), '10.0000');
});

test('P9-DEF-OCR-01: Express vercel.json includeFiles targets the real function entry and every required asset', () => {
  const cfg = JSON.parse(read('apps/aws-backend/vercel.json'));
  assert.equal(cfg.framework, 'express');
  const entry = 'src/index.ts';
  assert.ok(fs.existsSync(path.resolve(ROOT, 'apps/aws-backend', entry)), 'function entry must exist relative to the project root');
  const glob = cfg.functions[entry].includeFiles;
  assert.equal(typeof glob, 'string');
  const fg = require(path.join(findNodeModules(), 'fast-glob'));
  const nm = findNodeModules();
  const matched = fg.sync(glob.replace(/^node_modules\//, ''), { cwd: nm, dot: true, onlyFiles: true });
  const has = (suffix) => matched.some((m) => m.endsWith(suffix));
  assert.ok(has('@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz'), 'traineddata missing from includeFiles');
  assert.ok(has('tesseract.js/src/worker-script/node/index.js'), 'worker script missing');
  assert.ok(has('tesseract.js-core/tesseract-core-simd-lstm.js'), 'wasm core missing');
  assert.ok(matched.some((m) => m.startsWith('wasm-feature-detect/')), 'wasm-feature-detect missing');
  const bytes = matched.reduce((s, m) => s + fs.statSync(path.join(nm, m)).size, 0);
  assert.ok(bytes < 120 * 1024 * 1024, `includeFiles payload too large: ${(bytes / 1048576).toFixed(1)} MB`);
  console.log(`# includeFiles files=${matched.length} sizeMB=${(bytes / 1048576).toFixed(1)}`);
});

test('P9-DEF-OCR-01: REAL OCR runs from a simulated Vercel bundle containing ONLY includeFiles assets', () => {
  const cfg = JSON.parse(read('apps/aws-backend/vercel.json'));
  const glob = cfg.functions['src/index.ts'].includeFiles;
  const nm = findNodeModules();
  const fg = require(path.join(nm, 'fast-glob'));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'oserp-fn-bundle-'));
  try {
    for (const rel of fg.sync(glob.replace(/^node_modules\//, ''), { cwd: nm, dot: true, onlyFiles: true })) {
      const dest = path.join(tmp, 'node_modules', rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(path.join(nm, rel), dest);
    }
    const tsx = path.join(nm, 'tsx/dist/cli.mjs');
    const t0 = Date.now();
    const res = spawnSync(process.execPath, [tsx, path.resolve(ROOT, 'scripts/uboq/phase9-ocr-bundle-sim-harness.ts')], { cwd: tmp, encoding: 'utf8', timeout: 120000 });
    const line = (res.stdout || '').split(/\r?\n/).find((l) => l.startsWith('SIM_RESULT='));
    assert.ok(line, `simulated-bundle OCR produced no result: ${res.stderr || res.stdout}`);
    const out = JSON.parse(line.slice('SIM_RESULT='.length));
    assert.equal(fs.realpathSync(out.cwd), fs.realpathSync(tmp));
    assert.ok(Date.now() - t0 < 100000);
    const flat = out.rows.flatMap((r) => r.cells).join(' | ');
    assert.match(flat, /Structural Concrete Class A/);
    assert.match(flat, /325000/);
    assert.match(flat, /Reinforcing Steel Grade 60/);
    assert.ok(out.overallConfidence > 0.5);
    assert.ok(out.rows.every((r) => r.hasBbox), 'bounding boxes must be preserved');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('P9-DEF-OCR-01: missing OCR assets fail promptly with explicit errors (never a long hang)', () => {
  const nm = findNodeModules();
  const tsx = path.join(nm, 'tsx/dist/cli.mjs');
  const probe = path.join(os.tmpdir(), `oserp-ocr-probe-${process.pid}.ts`);
  fs.writeFileSync(probe, `
import { resolveOfflineTesseractLangPath, resolveTesseractWorkerScript } from ${JSON.stringify(path.resolve(ROOT, 'src/lib/uboq/intake/ocr-engine').replace(/\\/g, '/'))};
const t = Date.now(); const out: Record<string,string> = {};
try { resolveOfflineTesseractLangPath([]); } catch (e) { out.lang = (e as Error).message; }
try { resolveTesseractWorkerScript([]); } catch (e) { out.worker = (e as Error).message; }
console.log('PROBE=' + JSON.stringify({ ms: Date.now() - t, ...out }));
process.exit(0);
`);
  try {
    const res = spawnSync(process.execPath, [tsx, probe], { cwd: ROOT, encoding: 'utf8', timeout: 60000 });
    const line = (res.stdout || '').split(/\r?\n/).find((l) => l.startsWith('PROBE='));
    assert.ok(line, res.stderr);
    const out = JSON.parse(line.slice(6));
    assert.match(out.lang, /UBOQ_OCR_TRAINEDDATA_MISSING/);
    assert.match(out.worker, /UBOQ_OCR_WORKER_SCRIPT_MISSING/);
    assert.ok(out.ms < 2000, 'asset failure must be immediate, not a long hang');
  } finally {
    fs.rmSync(probe, { force: true });
  }
});

test('13/13 accepted R2 canonical baseline sources remain LF SHA-256 unchanged', () => {
  const ledger = JSON.parse(read('docs/uboq/phase9-accepted-baseline-ledger.json'));
  for (const s of ledger.acceptedSources) {
    const actual = crypto.createHash('sha256').update(Buffer.from(read(s.path).replace(/\r\n/g, '\n'), 'utf8')).digest('hex');
    assert.equal(actual, s.expectedSha256, `modified: ${s.path}`);
  }
});
