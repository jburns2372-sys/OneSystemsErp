import { PrismaClient } from '@prisma/client';
import { validateScheduleForReview } from '../src/lib/scheduling/scheduleWorkflow';

const prisma = new PrismaClient();

async function run() {
  const scheduleId = 'cmrjou0ne0001vcf01eju4dh8';
  const projectId = 'cmrjo4msn0000vc9c7s65o3lt';
  const actorId = 'cmqiy15bq0000vc1cq1f3zg6j'; // Sys admin actor

  console.log('Transitioning schedule through workflow...');

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId }
  });

  if (!schedule) throw new Error('Schedule not found');

  console.log(`Current rowVersion: ${schedule.rowVersion}`);
  console.log(`Current status: ${schedule.workflowStatus}`);

  if (schedule.workflowStatus !== 'AI_GENERATED_DRAFT' && schedule.workflowStatus !== 'INVALID_GENERATED_DRAFT') {
    console.error('Cannot transition, status is not AI_GENERATED_DRAFT or INVALID_GENERATED_DRAFT');
    process.exit(1);
  }

  try {
    const result = await validateScheduleForReview({
      projectId,
      scheduleId,
      actorId,
      expectedRowVersion: schedule.rowVersion,
      tx: prisma
    });

    console.log(`Is Valid: ${result.isValid}`);
    console.log(`Errors: ${JSON.stringify(result.errors, null, 2)}`);
    console.log(`New Status: ${result.schedule.workflowStatus}`);
    console.log(`New RowVersion: ${result.schedule.rowVersion}`);

    if (result.isValid && result.schedule.workflowStatus === 'READY_FOR_REVIEW') {
      console.log('Successfully transitioned to READY_FOR_REVIEW');
    } else {
      console.error('Transition failed or remained in invalid state.');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('Error transitioning:', err.message);
    process.exit(1);
  }

  // Postgresql readback
  const updated = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId }
  });

  console.log(`\n--- POSTGRESQL READ-BACK ---`);
  console.log(`workflowStatus: ${updated?.workflowStatus}`);
  console.log(`rowVersion: ${updated?.rowVersion}`);
  
  process.exit(0);
}

run();
