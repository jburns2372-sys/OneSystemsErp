import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const args = process.argv.slice(2);
  const isApply = args.includes('--apply');
  const isDryRun = !isApply || args.includes('--dry-run');

  const scheduleId = 'cmrjou0ne0001vcf01eju4dh8';
  const projectId = 'cmrjo4msn0000vc9c7s65o3lt';
  const lockedBOQVersionId = 'cmrjo4os300c4vc9chs3r2nxp';

  console.log(`Starting fix-pgh-schedule-dates in ${isApply ? 'APPLY' : 'DRY-RUN'} mode...`);

  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId }
  });

  if (!schedule) {
    console.error('Schedule not found.');
    process.exit(1);
  }

  if (schedule.projectId !== projectId) {
    console.error('Project ID mismatch.');
    process.exit(1);
  }

  if (schedule.lockedBOQVersionId !== lockedBOQVersionId) {
    console.error('Locked BOQ version ID mismatch.');
    process.exit(1);
  }

  if (schedule.workflowStatus !== 'AI_GENERATED_DRAFT') {
    console.error('Workflow status is not AI_GENERATED_DRAFT.');
    process.exit(1);
  }

  if (schedule.status === 'ACTIVE_BASELINE') {
    console.error('Schedule is ACTIVE_BASELINE.');
    process.exit(1);
  }

  const activations = await prisma.baselineActivation.count({
    where: { scheduleId: schedule.id }
  });

  if (activations > 0) {
    console.error('BaselineActivation exists.');
    process.exit(1);
  }

  const existingMetrics = schedule.validationMetrics ? JSON.parse(schedule.validationMetrics) : {};

  const projectStartDate = new Date('2026-06-12T00:00:00.000Z');
  const projectCompletionDate = new Date('2026-12-09T00:00:00.000Z');
  const naturalCalculatedCompletionDate = '2026-10-18T00:00:00.000Z';
  const finalCalculatedCompletionDate = '2026-10-18T00:00:00.000Z';

  const diffTime = new Date(projectCompletionDate).getTime() - new Date(finalCalculatedCompletionDate).getTime();
  const completionVarianceDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const updatedMetrics = {
    ...existingMetrics,
    naturalCalculatedCompletionDate,
    finalCalculatedCompletionDate,
    contractStartDate: projectStartDate.toISOString(),
    contractCompletionDate: projectCompletionDate.toISOString(),
    completionVarianceDays,
    feasibilityStatus: 'SCHEDULE_FEASIBLE'
  };

  const updateData = {
    projectStartDate,
    projectCompletionDate,
    baselineStartDate: null,
    baselineFinishDate: null,
    validationMetrics: JSON.stringify(updatedMetrics),
    rowVersion: schedule.rowVersion + 1
  };

  if (isDryRun) {
    console.log('DRY RUN: Would update schedule to:', updateData);
  } else {
    console.log('APPLY: Updating schedule...');
    await prisma.projectSchedule.update({
      where: { id: scheduleId, rowVersion: schedule.rowVersion },
      data: updateData
    });
    console.log('Update complete.');

    // PostgreSQL read-back
    const updated = await prisma.projectSchedule.findUnique({
      where: { id: scheduleId }
    });
    console.log('--- READ-BACK RESULT ---');
    console.log(`projectStartDate: ${updated?.projectStartDate?.toISOString()}`);
    console.log(`projectCompletionDate: ${updated?.projectCompletionDate?.toISOString()}`);
    console.log(`baselineStartDate: ${updated?.baselineStartDate}`);
    console.log(`baselineFinishDate: ${updated?.baselineFinishDate}`);
    console.log(`validationMetrics: ${updated?.validationMetrics}`);
    console.log(`rowVersion: ${updated?.rowVersion}`);
  }

  process.exit(0);
}

run();
