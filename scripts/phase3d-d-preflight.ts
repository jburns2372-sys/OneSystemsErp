import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log('--- PHASE 3D-D PREFLIGHT VERIFICATION ---');
  
  // 1-4. DB Connection & Environment Check
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.includes('production') || dbUrl.includes('ep-little-flower')) {
    console.error('DEVELOPMENT_TARGET_NOT_VERIFIED: Detected production database connection.');
    process.exit(1);
  }
  
  console.log('[PASS] Connected to development database.');
  
  // Acceptance schedule IDs
  const projectId = 'cmrjo4msn0000vc9c7s65o3lt';
  const scheduleId = 'cmrjou0ne0001vcf01eju4dh8';
  const lockedBoqId = 'cmrjo4os300c4vc9chs3r2nxp';
  const expectedChecksum = '040d59da1b76e0721c26645a74207c40b33f27c2a3df4a1c216b6340bf9f2fb7';

  // 5-7. Check records exist
  const schedule = await prisma.projectSchedule.findUnique({
    where: { id: scheduleId },
    include: { wbsNodes: true, activities: true, boqAllocations: true, dependencies: true }
  });

  if (!schedule) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Schedule not found');
  if (schedule.projectId !== projectId) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Project ID mismatch');
  if (schedule.lockedBOQVersionId !== lockedBoqId) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Locked BOQ ID mismatch');

  const boqVersion = await prisma.projectBOQVersion.findUnique({ where: { id: lockedBoqId } });
  if (!boqVersion) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: BOQ Version not found');
  if (boqVersion.status !== 'LOCKED') throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: BOQ Version is not locked');
  if (boqVersion.checksum !== expectedChecksum) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: BOQ Version checksum mismatch');

  console.log('[PASS] Project, Schedule, and Locked BOQ constraints verified.');

  // 8-9. Workflow state
  if (schedule.workflowStatus !== 'READY_FOR_REVIEW') throw new Error(`FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Status is ${schedule.workflowStatus}`);
  console.log(`[PASS] Workflow status is READY_FOR_REVIEW.`);
  console.log(`[INFO] Current rowVersion is ${schedule.rowVersion}`);

  // 10. No active baseline
  const activeBaseline = await prisma.projectSchedule.findFirst({
    where: { projectId, workflowStatus: 'ACTIVE_BASELINE' }
  });
  if (activeBaseline) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Active baseline already exists.');

  console.log('[PASS] No active baseline currently exists for this project.');

  // Validate the deterministic gates (from previous step's final validator)
  // WBS roots
  const roots = schedule.wbsNodes.filter(n => n.parentId === null);
  if (roots.length !== 1) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Invalid WBS roots count');
  
  const phases = schedule.wbsNodes.filter(n => n.parentId === roots[0].id);
  if (phases.length !== 12) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Invalid phases count');
  if (schedule.activities.length !== 14) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Invalid activities count');
  if (schedule.dependencies.length < 11) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Invalid dependencies count');
  if (schedule.boqAllocations.length !== 326) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Invalid BOQ allocation count');

  const uniqueBoqs = new Set(schedule.boqAllocations.map(a => a.awardedBoqItemId));
  if (uniqueBoqs.size !== 326) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Unique BOQ coverage not 326');

  if (schedule.awardedContractAmount.toNumber() !== 43106674.89) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Awarded amount mismatch');
  if (schedule.scheduledAmount.toNumber() !== 43106674.89) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Scheduled amount mismatch');
  if (schedule.differenceAmount.toNumber() !== 0) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Difference is not 0');
  
  if (schedule.projectStartDate?.toISOString() !== '2026-06-12T00:00:00.000Z') throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: projectStartDate mismatch');
  if (schedule.projectCompletionDate?.toISOString() !== '2026-12-09T00:00:00.000Z') throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: projectCompletionDate mismatch');

  const metrics = JSON.parse(schedule.validationMetrics || '{}');
  if (metrics.naturalCalculatedCompletionDate !== '2026-10-18T00:00:00.000Z') throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: naturalCalculatedCompletionDate mismatch');
  if (metrics.finalCalculatedCompletionDate !== '2026-10-18T00:00:00.000Z') throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: finalCalculatedCompletionDate mismatch');

  if (schedule.baselineStartDate !== null || schedule.baselineFinishDate !== null) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Baseline dates are not null');

  const hasTest = phases.some(p => p.name.includes('Testing and Commissioning'));
  if (!hasTest) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Testing phase missing');
  
  const hasFinal = phases.some(p => p.name === 'Project Acceptance and Demobilization');
  if (!hasFinal) throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Final phase missing');
  if (phases[phases.length - 1].name !== 'Project Acceptance and Demobilization') throw new Error('FINAL_ACCEPTANCE_PREFLIGHT_FAILED: Final phase is not last');

  console.log('DEVELOPMENT_DATABASE_CONFIRMED');
  process.exit(0);
}

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});
