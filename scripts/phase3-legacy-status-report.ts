import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Phase 3 Legacy Status Report ---');
  
  const schedules = await prisma.projectSchedule.findMany({
    include: {
      activities: { select: { id: true } },
      wbsNodes: { select: { id: true } },
      boqAllocations: { select: { id: true } }
    }
  });

  console.log(`Found ${schedules.length} schedules.`);

  for (const schedule of schedules) {
    let proposedWorkflowStatus = 'SAFE_FOR_POST_MIGRATION_VALIDATION';
    let specialClassification = '';

    if (schedule.status === 'BASELINE') {
      proposedWorkflowStatus = 'LEGACY_BASELINE_REQUIRES_REVIEW';
      specialClassification = 'LEGACY_BASELINE_REQUIRES_REVIEW';
    } else if (schedule.status === 'DRAFT') {
      proposedWorkflowStatus = 'AI_GENERATED_DRAFT';
      specialClassification = 'LEGACY_DRAFT_REQUIRES_VALIDATION';
    } else {
      proposedWorkflowStatus = 'INVALID_GENERATED_DRAFT';
      specialClassification = 'INVALID_SCHEDULE';
    }

    console.log(`\nSchedule ID: ${schedule.id}`);
    console.log(`Project ID: ${schedule.projectId}`);
    console.log(`Legacy Status: ${schedule.status}`);
    console.log(`Proposed Safe Workflow Status: ${proposedWorkflowStatus}`);
    console.log(`Special Classification: ${specialClassification}`);
    console.log(`Phase Count: ${schedule.wbsNodes.length}`);
    console.log(`Activity Count: ${schedule.activities.length}`);
    console.log(`BOQ Allocation Count: ${schedule.boqAllocations.length}`);
    console.log(`Financial Difference: ${schedule.differenceAmount.toString()}`);
    console.log(`Deterministic Validation Available: YES`);
    console.log(`Manual Review Required: ${specialClassification === 'LEGACY_BASELINE_REQUIRES_REVIEW' ? 'YES' : 'NO'}`);
  }

  console.log('\n--- End of Report ---');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
