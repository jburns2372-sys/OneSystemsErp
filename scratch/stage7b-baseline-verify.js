require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    let hasError = false;
    
    const schedule = await prisma.projectSchedule.findFirst({
        where: { workflowStatus: 'AI_GENERATED_DRAFT' },
        include: {
            wbsNodes: true,
            activities: true,
            dependencies: true,
            boqAllocations: true,
            workflowTransitions: true,
            reviewComments: true,
            approvals: true,
            baselineActivations: true
        }
    });

    if (!schedule) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: No AI_GENERATED_DRAFT schedule found');
        return;
    }

    if (schedule.wbsNodes.length !== 13) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: WBS count mismatch', schedule.wbsNodes.length);
        hasError = true;
    }
    if (schedule.activities.length !== 14) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: Activity count mismatch', schedule.activities.length);
        hasError = true;
    }
    if (schedule.dependencies.length !== 11) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: Dependency count mismatch', schedule.dependencies.length);
        hasError = true;
    }
    if (schedule.boqAllocations.length !== 326) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: BOQ allocation count mismatch', schedule.boqAllocations.length);
        hasError = true;
    }
    if (schedule.workflowTransitions.length !== 0) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: Transitions count mismatch', schedule.workflowTransitions.length);
        hasError = true;
    }
    if (schedule.reviewComments.length !== 0) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: Review comments mismatch', schedule.reviewComments.length);
        hasError = true;
    }
    if (schedule.approvals.length !== 0) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: Approvals mismatch', schedule.approvals.length);
        hasError = true;
    }
    if (schedule.baselineActivations.length !== 0) {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: Activations mismatch', schedule.baselineActivations.length);
        hasError = true;
    }
    
    // Check dates
    console.log('Dates found:');
    console.log('baselineFinishDate:', schedule.baselineFinishDate);
    console.log('currentFinishDate:', schedule.currentFinishDate);
    console.log('actualFinishDate:', schedule.actualFinishDate);
    console.log('projectCompletionDate:', schedule.projectCompletionDate);
    
    // Check Amount
    if (schedule.scheduledAmount.toString() !== '43106674.89') {
        console.log('GATE9D_STAGE_7B_BASELINE_CHANGED_UNEXPECTEDLY: Scheduled amount mismatch', schedule.scheduledAmount.toString());
        hasError = true;
    }

    // Resolve authoritative project ID
    console.log('AUTHORITATIVE_PROJECT_ID:', schedule.projectId);

    if (!hasError) {
        console.log('BASELINE_READ_ONLY_VERIFIED');
    }
    
    await prisma.$disconnect();
}
check();
