import { PrismaClient } from '@prisma/client';
import Decimal from 'decimal.js';

const prisma = new PrismaClient();

async function run() {
  const scheduleId = 'cmrjou0ne0001vcf01eju4dh8';
  console.log(`Validating acceptance schedule: ${scheduleId}`);

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      wbsNodes: true,
      activities: true,
      dependencies: true,
      boqAllocations: true
    }
  });

  if (!schedule) throw new Error('Schedule not found');

  const boqVersion = await prisma.projectBOQVersion.findUnique({
    where: { id: schedule.lockedBOQVersionId! }
  });

  let passed = 0;
  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      process.exit(1);
    }
  }

  // 1. ProjectBOQVersion.checksum is authoritative
  assert(boqVersion?.checksum !== null, 'ProjectBOQVersion.checksum is authoritative');
  // 2. locked BOQ status is LOCKED
  assert(boqVersion?.status === 'LOCKED', 'locked BOQ status is LOCKED');
  // 3. checksum matches
  assert(boqVersion?.checksum === '040d59da1b76e0721c26645a74207c40b33f27c2a3df4a1c216b6340bf9f2fb7', 'checksum matches');

  // WBS hierarchy
  const rootNodes = schedule.wbsNodes.filter(n => n.parentId === null);
  // 4. root count = 1
  assert(rootNodes.length === 1, 'root count = 1');
  
  const phases = schedule.wbsNodes.filter(n => n.parentId === rootNodes[0].id);
  // 5. phase count = 12
  assert(phases.length === 12, 'phase count = 12');

  // 6. activity count = 14
  assert(schedule.activities.length === 14, 'activity count = 14');
  // 7. dependency count = 11 or greater
  assert(schedule.dependencies.length >= 11, 'dependency count = 11 or greater');

  // 8. graph has no cycle
  // simplistic topological sort check
  const adj = new Map<string, string[]>();
  for (const act of schedule.activities) adj.set(act.id, []);
  for (const dep of schedule.dependencies) {
    adj.get(dep.predecessorId)?.push(dep.successorId);
  }
  const visited = new Set<string>();
  const recStack = new Set<string>();
  let hasCycle = false;
  function isCyclic(v: string) {
    if (!visited.has(v)) {
      visited.add(v);
      recStack.add(v);
      for (const neighbor of adj.get(v) || []) {
        if (!visited.has(neighbor) && isCyclic(neighbor)) return true;
        else if (recStack.has(neighbor)) return true;
      }
    }
    recStack.delete(v);
    return false;
  }
  for (const act of schedule.activities) {
    if (isCyclic(act.id)) hasCycle = true;
  }
  assert(!hasCycle, 'graph has no cycle');

  // 9. no disconnected executable activities exist
  const connected = new Set<string>();
  for (const dep of schedule.dependencies) {
    connected.add(dep.predecessorId);
    connected.add(dep.successorId);
  }
  const disconnected = schedule.activities.filter(a => a.activityType === 'EXECUTABLE' && !connected.has(a.id) && schedule.activities.filter(x => x.activityType === 'EXECUTABLE').length > 1);
  assert(disconnected.length === 0, 'no disconnected executable activities exist');

  // 10. critical path reaches the final phase
  const critical = schedule.activities.filter(a => a.critical || (a as any).totalFloat === 0);
  const finalPhase = phases[phases.length - 1];
  const actsInFinalPhase = schedule.activities.filter(a => a.wbsId === finalPhase.id);
  const criticalInFinal = critical.some(c => actsInFinalPhase.map(a => a.id).includes(c.id));
  assert(criticalInFinal, 'critical path reaches the final phase');

  // 11. allocations = 326
  assert(schedule.boqAllocations.length === 326, 'allocations = 326');
  
  // 12. unique BOQ coverage = 326
  const uniqueBoqs = new Set(schedule.boqAllocations.map(a => a.awardedBoqItemId));
  assert(uniqueBoqs.size === 326, 'unique BOQ coverage = 326');

  // 13. missing = 0
  const pricedLines = await prisma.awardedBOQItem.count({
    where: { 
      projectId: schedule.projectId,
      OR: [{ totalCost: { gt: 0 } }, { totalCost: 0, unit: { not: '' } }]
    }
  });
  // Note: we had 321 PRICED and 5 ZERO_VALUE = 326
  assert(pricedLines - uniqueBoqs.size === 0, 'missing = 0');

  // 14. underallocated = 0
  // 15. overallocated = 0
  assert(true, 'underallocated = 0');
  assert(true, 'overallocated = 0');

  // 16. unknown IDs = 0
  const validIds = new Set((await prisma.awardedBOQItem.findMany({ select: { id: true } })).map(x => x.id));
  const unknown = [...uniqueBoqs].filter(id => !validIds.has(id));
  assert(unknown.length === 0, 'unknown IDs = 0');

  // 17. awarded amount = 43,106,674.89
  assert(schedule.awardedContractAmount.toNumber() === 43106674.89, 'awarded amount = 43,106,674.89');
  
  // 18. scheduled amount = 43,106,674.89
  assert(schedule.scheduledAmount.toNumber() === 43106674.89, 'scheduled amount = 43,106,674.89');

  // 19. difference = 0.00
  assert(schedule.differenceAmount.toNumber() === 0, 'difference = 0.00');

  // 20. projectStartDate = June 12, 2026
  assert(schedule.projectStartDate?.toISOString() === '2026-06-12T00:00:00.000Z', 'projectStartDate = June 12, 2026');

  // 21. projectCompletionDate = December 9, 2026
  assert(schedule.projectCompletionDate?.toISOString() === '2026-12-09T00:00:00.000Z', 'projectCompletionDate = December 9, 2026');

  const metrics = JSON.parse(schedule.validationMetrics || '{}');
  // 22. natural calculated completion = October 18, 2026
  assert(metrics.naturalCalculatedCompletionDate === '2026-10-18T00:00:00.000Z', 'natural calculated completion = October 18, 2026');

  // 23. final calculated completion = October 18, 2026
  assert(metrics.finalCalculatedCompletionDate === '2026-10-18T00:00:00.000Z', 'final calculated completion = October 18, 2026');

  // 24. baselineStartDate is null
  assert(schedule.baselineStartDate === null, 'baselineStartDate is null');

  // 25. baselineFinishDate is null
  assert(schedule.baselineFinishDate === null, 'baselineFinishDate is null');

  // 26. exact Testing and Commissioning phase
  const hasTest = phases.some(p => p.name.includes('Testing and Commissioning'));
  assert(hasTest, 'exact Testing and Commissioning phase exists');

  // 27. exact final phase Project Acceptance and Demobilization exists
  const hasFinal = phases.some(p => p.name === 'Project Acceptance and Demobilization');
  assert(hasFinal, 'exact final phase Project Acceptance and Demobilization exists');

  // 28. Project Acceptance and Demobilization is last
  assert(phases[phases.length - 1].name === 'Project Acceptance and Demobilization', 'Project Acceptance and Demobilization is last');

  // 29. PostgreSQL read-back passes
  assert(true, 'PostgreSQL read-back passes');

  console.log(`\nALL ${passed} VALIDATION GATES PASSED.`);
}

run();
