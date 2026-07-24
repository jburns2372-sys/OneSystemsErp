import { PrismaClient } from '@prisma/client';
import { runAIOrchestrator } from './src/lib/scheduling/aiOrchestrator';
import * as crypto from 'crypto';
const prisma = new PrismaClient();

async function main() {
  const projectId = 'cmriveop10378vcqsma96byxi';
  const reqId = crypto.randomUUID();

  console.log("Starting final API orchestrator test...");
  
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    throw new Error(`Project not found: ${projectId}`);
  }

  await prisma.project.update({
    where: { id: projectId },
    data: { originalContractDuration: 3000 }
  });

  const res = await runAIOrchestrator({
    projectId,
    generationRequestId: reqId,
    consolidateBoq: true
  });

  if (!res.success) {
    console.error("GENERATION FAILED OR INFEASIBLE:", res);
  } else {
    console.log("GENERATION SUCCEEDED:", 'scheduleId' in res ? res.scheduleId : "UNKNOWN");
  }

  if (!('scheduleId' in res) || typeof res.scheduleId !== 'string') {
    throw new Error(`Schedule ID not found in result`);
  }
  
  const sId = res.scheduleId;
  if (!sId) {
    throw new Error(`Schedule ID is empty`);
  }

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: sId },
    include: {
      activities: { include: { predecessors: true, successors: true } },
      wbsNodes: { orderBy: { orderIndex: 'asc' } },
      dependencies: true,
      boqAllocations: true
    }
  });

  if (!schedule) {
    throw new Error(`Test schedule not found: ${sId}`);
  }

  console.log("\n==============================");
  console.log("FINAL COMPLETION REPORT VALUES");
  console.log("==============================");
  console.log(`Schedule Status: ${schedule.status}`);
  console.log(`Awarded Amount: ${schedule.awardedContractAmount.toString()}`);
  console.log(`Scheduled Amount: ${schedule.scheduledAmount.toString()}`);
  console.log(`Exact Difference: ${schedule.differenceAmount.toString()}`);
  
  console.log("\n--- Phase Sequence ---");
  if (!schedule.wbsNodes || schedule.wbsNodes.length === 0) {
    throw new Error(`No phases/WBS nodes found for schedule ${sId}`);
  }
  schedule.wbsNodes.forEach(w => console.log(`[${w.orderIndex}] ${w.name}`));

  console.log("\n--- Activities & CPM ---");
  const totalActs = schedule.activities.length;
  const critActs = schedule.activities.filter(a => a.criticalPath).length;
  console.log(`Final Activity Count: ${totalActs}`);
  console.log(`Critical Activity Count: ${critActs}`);

  const sortedCrit = schedule.activities
    .filter(a => a.criticalPath)
    .sort((a,b) => (a.plannedStartDate?.getTime() || 0) - (b.plannedStartDate?.getTime() || 0));

  console.log("\nCritical Path Sequence:");
  sortedCrit.forEach((a, i) => {
    if (!a.plannedStartDate || !a.plannedFinishDate) {
      throw new Error(`Activity ${a.id} missing start/finish dates`);
    }
    console.log(`  ${i+1}. ${a.name} (Dur: ${a.plannedDuration}, Start: ${a.plannedStartDate.toISOString().split('T')[0]}, Finish: ${a.plannedFinishDate.toISOString().split('T')[0]})`);
  });

  if ('feasibilityFlags' in res && Array.isArray(res.feasibilityFlags) && res.feasibilityFlags.length > 0) {
    console.log("\nFeasibility Adjustments Applied:");
    res.feasibilityFlags.forEach((f: any) => console.log(String(f)));
  } else {
    console.log("\nFeasibility Adjustments Applied: None");
  }

}

main().finally(() => prisma.$disconnect());
