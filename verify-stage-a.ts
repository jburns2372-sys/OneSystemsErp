import { prisma } from './src/lib/prisma';
import { validateScheduleForReview } from './src/lib/scheduling/scheduleWorkflow';

async function main() {
  console.log("Starting Stage A read-only validation against target V4-R7 schedule...");
  
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });

  if (!schedule) {
    throw new Error("Target schedule not found!");
  }

  console.log(`Current workflowStatus: ${schedule.workflowStatus}`);
  console.log(`Current rowVersion: ${schedule.rowVersion}`);

  // STAGE A
  const valResult = await validateScheduleForReview({
    projectId,
    scheduleId,
    actorId: 'dummy_actor',
    expectedRowVersion: schedule.rowVersion,
    tx: prisma // passing normal prisma client, avoiding $transaction
  });

  console.log(`Validation isValid: ${valResult.isValid}`);
  console.log(`Validation errors count: ${valResult.errors.length}`);
  console.log("Stage A completed successfully without opening a workflow mutation transaction.");

  // Verify DB state unchanged
  const postSchedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });
  console.log(`Post-validation workflowStatus: ${postSchedule?.workflowStatus}`);
  console.log(`Post-validation rowVersion: ${postSchedule?.rowVersion}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
