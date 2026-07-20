require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
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
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: No AI_GENERATED_DRAFT schedule found');
            return;
        }

        if (schedule.projectId !== 'cmrirhhw30000ic0406v47smb') {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Project ID mismatch', schedule.projectId);
            hasError = true;
        }

        if (schedule.wbsNodes.length !== 13) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: WBS count mismatch', schedule.wbsNodes.length);
            hasError = true;
        }
        if (schedule.activities.length !== 14) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Activity count mismatch', schedule.activities.length);
            hasError = true;
        }
        if (schedule.dependencies.length !== 11) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Dependency count mismatch', schedule.dependencies.length);
            hasError = true;
        }
        if (schedule.boqAllocations.length !== 326) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: BOQ allocation count mismatch', schedule.boqAllocations.length);
            hasError = true;
        }
        if (schedule.workflowTransitions.length !== 0) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Transitions count mismatch', schedule.workflowTransitions.length);
            hasError = true;
        }
        if (schedule.reviewComments.length !== 0) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Review comments mismatch', schedule.reviewComments.length);
            hasError = true;
        }
        if (schedule.approvals.length !== 0) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Approvals mismatch', schedule.approvals.length);
            hasError = true;
        }
        if (schedule.baselineActivations.length !== 0) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Activations mismatch', schedule.baselineActivations.length);
            hasError = true;
        }

        // Check active baseline (by looking at workflowStatus or baselineActivations, handled above)
        
        // Check AwardedBOQItem count for the project
        const awardedBOQItems = await prisma.awardedBOQItem.count();
        if (awardedBOQItems !== 326) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Awarded BOQ count mismatch', awardedBOQItems);
            hasError = true;
        }

        const awardedSumAggr = await prisma.awardedBOQItem.aggregate({ _sum: { totalCost: true } });
        const boqTotal = awardedSumAggr._sum.totalCost || 0;
        const diff = Math.abs(boqTotal - parseFloat(schedule.scheduledAmount.toString()));

        if (diff > 0.01) {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Amount difference', diff);
            hasError = true;
        }

        const finishDateStr = schedule.baselineFinishDate ? schedule.baselineFinishDate.toISOString().substring(0, 10) : '';
        if (finishDateStr !== '2026-10-18') {
            console.log('GATE9D_STAGE_7C2_BASELINE_CHANGED_UNEXPECTEDLY: Finish date mismatch', finishDateStr);
            hasError = true;
        }

        if (!hasError) {
            console.log('SUPER_ADMIN_RECOVERY_BASELINE_UNCHANGED');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
