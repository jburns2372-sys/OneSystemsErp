import { prisma } from './src/lib/prisma';
import { validateScheduleForReview } from './src/lib/scheduling/scheduleWorkflow';
import * as fs from 'fs';

async function main() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  const scheduleId = '641f4c56e72847e6a5e3288d0';

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });

  if (!schedule) {
    throw new Error('Schedule not found');
  }

  const valResult = await validateScheduleForReview({
    projectId,
    scheduleId,
    actorId: 'dummy_actor',
    expectedRowVersion: schedule.rowVersion,
    tx: prisma
  });

  // Safe-state check
  const postSchedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId, projectId }
  });
  
  const transitions = await prisma.scheduleWorkflowTransition.count({
    where: { scheduleId }
  });
  
  const comments = await prisma.scheduleApproval.count({
    where: { scheduleId }
  });

  const baselines = await prisma.baselineActivation.count({
    where: { scheduleId }
  });

  const result = {
    validation: {
      isValid: valResult.isValid,
      errors: valResult.errors,
      warnings: valResult.warnings,
    },
    safeState: {
      preWorkflowStatus: schedule.workflowStatus,
      preRowVersion: schedule.rowVersion,
      postWorkflowStatus: postSchedule?.workflowStatus,
      postRowVersion: postSchedule?.rowVersion,
      transitions,
      comments,
      baselines,
      dataChanged: schedule.rowVersion !== postSchedule?.rowVersion || schedule.workflowStatus !== postSchedule?.workflowStatus
    }
  };

  fs.writeFileSync('validation-errors-output.json', JSON.stringify(result, null, 2));
  console.log("Validation completed and written to validation-errors-output.json");
}

main().catch(console.error).finally(() => prisma.$disconnect());
