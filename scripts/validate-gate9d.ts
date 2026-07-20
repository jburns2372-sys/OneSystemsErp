import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    
    console.log("=== GATE 9D VALIDATION ===");

    const schedule = await prisma.projectSchedule.findFirst({
        where: { projectId: projectId }
    });

    if (!schedule) {
        throw new Error("Schedule not found");
    }

    // 1. ScheduleWorkflowTransition count
    const transitions = await prisma.scheduleWorkflowTransition.findMany({
        where: { scheduleId: schedule.id }
    });
    console.log(`1. ScheduleWorkflowTransition count = ${transitions.length}`);
    transitions.forEach(t => console.log(`   - ${t.action} (from: ${t.fromStatus}, to: ${t.toStatus})`));

    // 2. ScheduleReviewComment count
    const comments = await prisma.scheduleReviewComment.findMany({
        where: { scheduleId: schedule.id }
    });
    console.log(`2. ScheduleReviewComment count = ${comments.length}`);
    comments.forEach(c => console.log(`   - ${c.commentType}`));

    // 3. AuditLog check
    const logs = await prisma.auditLog.findMany({
        where: { 
            moduleName: 'PROJECT_SCHEDULING',
            actionType: {
                in: ['SCHEDULE_SUBMITTED_FOR_REVIEW', 'SCHEDULE_TECHNICAL_REVIEW_STARTED', 'SCHEDULE_REVIEW_COMMENT_CREATED']
            }
        },
        orderBy: { createdAt: 'asc' }
    });
    console.log(`3. AuditLog count for Gate 9D actions = ${logs.length}`);

    // 4. Schedule rowVersion
    console.log(`4. Schedule rowVersion = ${schedule.rowVersion} (Should have incremented twice from 1)`);

    // 5. Schedule workflowStatus
    console.log(`5. Schedule workflowStatus = '${schedule.workflowStatus}' (Expected: 'UNDER_TECHNICAL_REVIEW')`);

    // Verify Expectations
    let success = true;
    if (transitions.length !== 2) success = false;
    if (comments.length !== 5) success = false;
    if (logs.length < 7) success = false; // 1 submit + 1 start review + 5 comments
    if (schedule.rowVersion !== 3) success = false;
    if (schedule.workflowStatus !== 'UNDER_TECHNICAL_REVIEW') success = false;

    console.log("===========================");
    if (success) {
        console.log("ALL VALIDATIONS PASSED");
    } else {
        console.log("SOME VALIDATIONS FAILED");
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
