'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const ts = require('typescript');
const { Prisma } = require('@prisma/client');

const ROOT = process.cwd();

function loadTsModule(relPath, mocks = {}) {
  const absPath = path.resolve(ROOT, relPath);
  const src = fs.readFileSync(absPath, 'utf8');
  const compiled = ts.transpileModule(src, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absPath,
  }).outputText;

  const mod = { exports: {} };
  const localRequire = (specifier) => {
    if (Object.prototype.hasOwnProperty.call(mocks, specifier)) {
      return mocks[specifier];
    }
    if (specifier === '@prisma/client') {
      return { Prisma };
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const resolvedBase = path.resolve(path.dirname(absPath), specifier);
      const candidates = [
        resolvedBase,
        `${resolvedBase}.ts`,
        `${resolvedBase}.tsx`,
        path.join(resolvedBase, 'index.ts'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          return loadTsModule(path.relative(ROOT, c), mocks);
        }
      }
    }
    if (specifier.startsWith('@/')) {
      const resolvedBase = path.resolve(ROOT, 'src', specifier.slice(2));
      const candidates = [
        resolvedBase,
        `${resolvedBase}.ts`,
        `${resolvedBase}.tsx`,
        path.join(resolvedBase, 'index.ts'),
      ];
      for (const c of candidates) {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) {
          return loadTsModule(path.relative(ROOT, c), mocks);
        }
      }
    }
    throw new Error(`Unexpected unmocked import "${specifier}" from ${relPath}`);
  };

  const fn = new vm.Script(
    `(function(exports, require, module, __filename, __dirname) {\n${compiled}\n})`,
    { filename: absPath }
  ).runInThisContext();
  fn(mod.exports, localRequire, mod, absPath, path.dirname(absPath));
  return mod.exports;
}

function loadAdapter({ stageAuthError = null } = {}) {
  return loadTsModule('src/lib/uboq/adapters/schedule-link-adapter.ts', {
    '../security/stage-rbac': {
      assertUboqStageAuthorization: async () => {
        if (stageAuthError) throw stageAuthError;
      },
    },
  });
}

function makeBaseFixture() {
  const projectId = 'proj-alpha';
  const schedule = {
    id: 'sched-1',
    projectId,
    status: 'BASELINE',
    workflowStatus: 'ACTIVE_BASELINE',
  };
  const approvedSnapshot = {
    id: 'snap-approved-1',
    projectId,
    status: 'APPROVED',
    approvedAt: new Date('2026-11-18T10:00:00Z'),
    approvedById: 'u-director',
  };
  const awardedBoqItems = [
    { id: 'boq-1', projectId, itemCode: '900(1)', unit: 'cu.m.', quantity: 100 },
    { id: 'boq-2', projectId, itemCode: '902(1)', unit: 'kg', quantity: 5000 },
  ];
  const phaseLines = [
    {
      id: 'pl-1',
      projectId,
      snapshotId: approvedSnapshot.id,
      awardedBoqItemId: 'boq-1',
      phaseCode: 'PHASE-01',
      sectionCode: 'STRUCTURAL',
      itemCode: '900(1)',
      unitNormalized: 'm3',
      approvedQty: new Prisma.Decimal('100.0000'),
    },
    {
      id: 'pl-2',
      projectId,
      snapshotId: approvedSnapshot.id,
      awardedBoqItemId: 'boq-2',
      phaseCode: 'PHASE-01',
      sectionCode: 'STRUCTURAL',
      itemCode: '902(1)',
      unitNormalized: 'kg',
      approvedQty: new Prisma.Decimal('5000.0000'),
    },
  ];
  const activities = [
    { id: 'act-1', scheduleId: schedule.id, wbsId: 'wbs-1' },
    { id: 'act-2', scheduleId: schedule.id, wbsId: 'wbs-1' },
    { id: 'act-3', scheduleId: schedule.id, wbsId: 'wbs-2' },
  ];
  const allocations = [
    // Multiple activities split one approved phase line (60 + 40 = 100 m3, 60% + 40% = 100%)
    {
      id: 'alloc-1',
      activityId: 'act-1',
      awardedBoqItemId: 'boq-1',
      scheduleId: schedule.id,
      projectId,
      allocationMode: 'QUANTITY_SPLIT',
      allocatedQuantity: new Prisma.Decimal('60.0000'),
    },
    {
      id: 'alloc-2',
      activityId: 'act-2',
      awardedBoqItemId: 'boq-1',
      scheduleId: schedule.id,
      projectId,
      allocationMode: 'PERCENTAGE_SPLIT',
      allocatedPercentage: new Prisma.Decimal('40.000000'),
    },
    // Second phase line allocated 100% to act-3 via fractional mappedWeight (1.0 -> 100%)
    {
      id: 'alloc-3',
      activityId: 'act-3',
      awardedBoqItemId: 'boq-2',
      scheduleId: schedule.id,
      projectId,
      allocationMode: 'SINGLE',
      mappedWeight: 1.0,
    },
  ];

  return { projectId, schedule, approvedSnapshot, awardedBoqItems, phaseLines, activities, allocations };
}

test('Delta 2: correct awarded BOQ/phase linkage across multiple activities and multiple phase lines with exact Decimal math', () => {
  const adapter = loadAdapter();
  const fx = makeBaseFixture();
  const plan = adapter.planScheduleActivityLinks({ ...fx, requireCompleteAllocation: true });

  assert.equal(plan.projectId, 'proj-alpha');
  assert.equal(plan.scheduleId, 'sched-1');
  assert.equal(plan.snapshotId, 'snap-approved-1');
  assert.equal(plan.plannedLinks.length, 3);
  assert.equal(plan.incompletePhaseLines.length, 0);

  const l1 = plan.plannedLinks.find((l) => l.activityId === 'act-1');
  const l2 = plan.plannedLinks.find((l) => l.activityId === 'act-2');
  const l3 = plan.plannedLinks.find((l) => l.activityId === 'act-3');

  assert.equal(l1.phaseLineId, 'pl-1');
  assert.equal(l1.wbsId, 'wbs-1');
  assert.equal(l1.allocatedQty.toFixed(4), '60.0000');
  assert.equal(l1.allocationWeightPct.toFixed(6), '60.000000');

  assert.equal(l2.phaseLineId, 'pl-1');
  assert.equal(l2.allocatedQty.toFixed(4), '40.0000');
  assert.equal(l2.allocationWeightPct.toFixed(6), '40.000000');

  assert.equal(l3.phaseLineId, 'pl-2');
  assert.equal(l3.wbsId, 'wbs-2');
  assert.equal(l3.allocatedQty.toFixed(4), '5000.0000');
  assert.equal(l3.allocationWeightPct.toFixed(6), '100.000000');
});

test('Delta 2: enforces cross-project and cross-schedule identity boundaries', () => {
  const adapter = loadAdapter();

  // Cross-project schedule
  const fx1 = makeBaseFixture();
  fx1.schedule.projectId = 'proj-FOREIGN';
  assert.throws(() => adapter.planScheduleActivityLinks(fx1), /UBOQ_SCHEDULE_CROSS_PROJECT_DENIED/);

  // Cross-project BOQ item
  const fx2 = makeBaseFixture();
  fx2.awardedBoqItems[0].projectId = 'proj-FOREIGN';
  assert.throws(() => adapter.planScheduleActivityLinks(fx2), /UBOQ_BOQ_CROSS_PROJECT_DENIED/);

  // Cross-schedule activity
  const fx3 = makeBaseFixture();
  fx3.activities[0].scheduleId = 'sched-FOREIGN';
  assert.throws(() => adapter.planScheduleActivityLinks(fx3), /UBOQ_ACTIVITY_CROSS_SCHEDULE_DENIED/);

  // Cross-project allocation
  const fx4 = makeBaseFixture();
  fx4.allocations[0].projectId = 'proj-FOREIGN';
  assert.throws(() => adapter.planScheduleActivityLinks(fx4), /UBOQ_ALLOCATION_CROSS_PROJECT_OR_SCHEDULE_DENIED/);
});

test('Delta 2: rejects duplicate, overlapping, overflow, and ambiguous multi-phase allocations', () => {
  const adapter = loadAdapter();

  // Duplicate (boq, activity)
  const fxDup = makeBaseFixture();
  fxDup.allocations.push({ ...fxDup.allocations[0], id: 'alloc-dup' });
  assert.throws(() => adapter.planScheduleActivityLinks(fxDup), /UBOQ_DUPLICATE_ALLOCATION/);

  // Overflow (> approvedQty / > 100%)
  const fxOver = makeBaseFixture();
  fxOver.allocations[0].allocatedQuantity = new Prisma.Decimal('75.0000'); // 75 + 40 = 115 > 100
  assert.throws(() => adapter.planScheduleActivityLinks(fxOver), /UBOQ_ALLOCATION_OVERFLOW/);

  // Multi-snapshot overlap against existing link
  const fxOverlap = makeBaseFixture();
  assert.throws(
    () =>
      adapter.planScheduleActivityLinks({
        ...fxOverlap,
        existingLinks: [
          {
            id: 'old-lnk',
            phaseLineId: 'pl-old-snap',
            activityId: 'act-1',
            allocatedQty: new Prisma.Decimal('60.0000'),
            allocationWeightPct: new Prisma.Decimal('60.000000'),
            phaseLine: {
              snapshotId: 'snap-OLDER-DIFFERENT',
              awardedBoqItemId: 'boq-1',
              phaseCode: 'PHASE-01',
              sectionCode: 'STRUCTURAL',
              itemCode: '900(1)',
            },
          },
        ],
      }),
    /UBOQ_MULTI_SNAPSHOT_OVERLAP/
  );

  // Ambiguous multi-phase mapping for same awardedBoqItemId without phaseId hint
  const fxAmbig = makeBaseFixture();
  fxAmbig.phaseLines.push({
    ...fxAmbig.phaseLines[0],
    id: 'pl-1-phase2',
    phaseCode: 'PHASE-02',
  });
  assert.throws(() => adapter.planScheduleActivityLinks(fxAmbig), /UBOQ_AMBIGUOUS_PHASE_LINE_MAPPING/);
});

test('Delta 2: rejects incompatible units, inactive schedules, unapproved snapshots, and incomplete allocations when required', () => {
  const adapter = loadAdapter();

  // Incompatible unit (m3 vs kg)
  const fxUnit = makeBaseFixture();
  fxUnit.awardedBoqItems[0].unit = 'kg';
  assert.throws(() => adapter.planScheduleActivityLinks(fxUnit), /UBOQ_INCOMPATIBLE_UNIT/);

  // Unapproved DRAFT snapshot
  const fxDraft = makeBaseFixture();
  fxDraft.approvedSnapshot.status = 'DRAFT';
  assert.throws(() => adapter.planScheduleActivityLinks(fxDraft), /UBOQ_UNAPPROVED_SNAPSHOT_SOURCE/);

  // Inactive / archived schedule
  const fxArchived = makeBaseFixture();
  fxArchived.schedule.status = 'ARCHIVED';
  assert.throws(() => adapter.planScheduleActivityLinks(fxArchived), /UBOQ_INACTIVE_SCHEDULE_DENIED/);

  // Incomplete allocation (only 60/100 allocated for pl-1)
  const fxIncomplete = makeBaseFixture();
  fxIncomplete.allocations = fxIncomplete.allocations.filter((a) => a.id !== 'alloc-2');
  const softPlan = adapter.planScheduleActivityLinks({ ...fxIncomplete, requireCompleteAllocation: false });
  assert.equal(softPlan.incompletePhaseLines.length, 1);
  assert.equal(softPlan.incompletePhaseLines[0].phaseLineId, 'pl-1');
  assert.throws(
    () => adapter.planScheduleActivityLinks({ ...fxIncomplete, requireCompleteAllocation: true }),
    /UBOQ_INCOMPLETE_ALLOCATION/
  );
});

test('Delta 2: syncUboqScheduleActivityLinks is transactional, idempotent on repeat runs, never mutates approved baselines, and satisfies T7_SCHEDULE_EVM invariants', async () => {
  const adapter = loadAdapter();
  const fx = makeBaseFixture();

  const storedLinks = new Map();
  let nextId = 1;
  const forbiddenMutationCalls = [];

  const tx = {
    projectSchedule: {
      findUnique: async () => fx.schedule,
      update: async () => { forbiddenMutationCalls.push('projectSchedule.update'); },
    },
    uboqOperationalSnapshot: {
      findFirst: async () => fx.approvedSnapshot,
      update: async () => { forbiddenMutationCalls.push('uboqOperationalSnapshot.update'); },
    },
    uboqAwardedPhaseLine: {
      findMany: async () => fx.phaseLines,
      update: async () => { forbiddenMutationCalls.push('uboqAwardedPhaseLine.update'); },
    },
    scheduleActivity: {
      findMany: async () => fx.activities,
      update: async () => { forbiddenMutationCalls.push('scheduleActivity.update'); },
    },
    scheduleBOQAllocation: {
      findMany: async () => fx.allocations,
      update: async () => { forbiddenMutationCalls.push('scheduleBOQAllocation.update'); },
    },
    awardedBOQItem: {
      findMany: async () => fx.awardedBoqItems,
      update: async () => { forbiddenMutationCalls.push('awardedBOQItem.update'); },
    },
    uboqScheduleActivityLink: {
      findMany: async () =>
        Array.from(storedLinks.values()).map((row) => {
          const pl = fx.phaseLines.find((p) => p.id === row.phaseLineId);
          return {
            ...row,
            phaseLine: {
              snapshotId: pl.snapshotId,
              awardedBoqItemId: pl.awardedBoqItemId,
              phaseCode: pl.phaseCode,
              sectionCode: pl.sectionCode,
              itemCode: pl.itemCode,
            },
          };
        }),
      create: async ({ data }) => {
        const rec = { id: `ulnk-${nextId++}`, ...data };
        storedLinks.set(`${data.phaseLineId}::${data.activityId}`, rec);
        return rec;
      },
      update: async ({ where, data }) => {
        for (const [k, v] of storedLinks.entries()) {
          if (v.id === where.id) {
            const updated = { ...v, ...data };
            storedLinks.set(k, updated);
            return updated;
          }
        }
        throw new Error('Link not found');
      },
    },
  };

  const fakePrisma = { $transaction: async (fn) => fn(tx) };

  // Run 1: creates 3 links
  const run1 = await adapter.syncUboqScheduleActivityLinks(fakePrisma, {
    projectId: fx.projectId,
    scheduleId: fx.schedule.id,
    actorUserId: 'u-pm',
    requireCompleteAllocation: true,
  });
  assert.equal(run1.createdCount, 3);
  assert.equal(run1.updatedCount, 0);
  assert.equal(run1.unchangedCount, 0);
  assert.equal(run1.baselineModified, false);
  assert.equal(forbiddenMutationCalls.length, 0);

  // Run 2 (repeat execution): idempotent — 0 created, 0 updated, 3 unchanged
  const run2 = await adapter.syncUboqScheduleActivityLinks(fakePrisma, {
    projectId: fx.projectId,
    scheduleId: fx.schedule.id,
    actorUserId: 'u-pm',
    requireCompleteAllocation: true,
  });
  assert.equal(run2.createdCount, 0);
  assert.equal(run2.updatedCount, 0);
  assert.equal(run2.unchangedCount, 3);
  assert.equal(forbiddenMutationCalls.length, 0);

  // Verify T7_SCHEDULE_EVM read invariants on persisted links:
  // scopeQty = allocatedQty > 0 ? allocatedQty : approvedQty * allocationWeightPct / 100
  const hundred = new Prisma.Decimal(100);
  const pl1Links = Array.from(storedLinks.values()).filter((l) => l.phaseLineId === 'pl-1');
  const pl1QtyViaQty = pl1Links.reduce((s, l) => s.plus(l.allocatedQty), new Prisma.Decimal(0));
  const pl1QtyViaPct = pl1Links.reduce(
    (s, l) => s.plus(fx.phaseLines[0].approvedQty.mul(l.allocationWeightPct).div(hundred)),
    new Prisma.Decimal(0)
  );
  assert.equal(pl1QtyViaQty.toFixed(4), '100.0000');
  assert.equal(pl1QtyViaPct.toFixed(4), '100.0000');
});

test('Delta 2: unauthorized actor is rejected before transaction starts', async () => {
  const adapter = loadAdapter({
    stageAuthError: new Error('UBOQ_RBAC_FORBIDDEN: missing UBOQ_INTAKE_STAGE'),
  });
  let txCalled = false;
  await assert.rejects(
    () =>
      adapter.syncUboqScheduleActivityLinks(
        {
          $transaction: async () => {
            txCalled = true;
          },
        },
        { projectId: 'proj-alpha', scheduleId: 'sched-1', actorUserId: 'u-unauthorized' }
      ),
    /UBOQ_RBAC_FORBIDDEN/
  );
  assert.equal(txCalled, false);
});

test('Delta 2: all 13/13 accepted R2 canonical baseline source files remain LF SHA-256 unchanged', () => {
  const ledger = JSON.parse(
    fs.readFileSync(path.resolve(ROOT, 'docs/uboq/phase9-accepted-baseline-ledger.json'), 'utf8')
  );
  for (const s of ledger.acceptedSources) {
    const raw = fs.readFileSync(path.resolve(ROOT, s.path), 'utf8').replace(/\r\n/g, '\n');
    const actual = crypto.createHash('sha256').update(Buffer.from(raw, 'utf8')).digest('hex');
    assert.equal(actual, s.expectedSha256, `Accepted baseline source modified unexpectedly: ${s.path}`);
  }
});
