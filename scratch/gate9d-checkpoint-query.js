// Gate 9D Checkpoint Query - Read-only against V4-R7 database
require('dotenv').config({ path: '.env.uat-v4-r7' });
// Also load main .env for fallback keys
require('dotenv').config({ path: '.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    
    console.log("=== GATE 9D CHECKPOINT RECOVERY QUERY ===");
    console.log("Database:", process.env.DATABASE_URL?.substring(0, 60) + '...');
    
    // 1. Schedule state
    const schedule = await prisma.projectSchedule.findFirst({
        where: { projectId }
    });
    
    if (!schedule) {
        console.log("NO SCHEDULE FOUND - Gate 8D may not have completed on V4-R7");
        return;
    }
    
    console.log("\n--- Schedule State ---");
    console.log("workflowStatus:", schedule.workflowStatus);
    console.log("rowVersion:", schedule.rowVersion);
    console.log("scheduleId:", schedule.id);
    
    // 2. Workflow transitions
    const transitions = await prisma.scheduleWorkflowTransition.count({
        where: { scheduleId: schedule.id }
    });
    console.log("\n--- Counts ---");
    console.log("ScheduleWorkflowTransition:", transitions);
    
    // 3. Review comments
    const comments = await prisma.scheduleReviewComment.count({
        where: { scheduleId: schedule.id }
    });
    console.log("ScheduleReviewComment:", comments);
    
    // 4. Approvals
    const approvals = await prisma.scheduleApproval.count({
        where: { scheduleId: schedule.id }
    });
    console.log("ScheduleApproval:", approvals);
    
    // 5. Baseline activations
    const baselines = await prisma.baselineActivation.count({
        where: { scheduleId: schedule.id }
    });
    console.log("BaselineActivation:", baselines);
    
    // 6. Audit logs for scheduling
    const auditLogs = await prisma.auditLog.findMany({
        where: {
            moduleName: 'PROJECT_SCHEDULING'
        },
        orderBy: { createdAt: 'asc' },
        select: { actionType: true, createdAt: true }
    });
    console.log("\n--- Audit Log (PROJECT_SCHEDULING) ---");
    console.log("Total:", auditLogs.length);
    auditLogs.forEach(l => console.log(`  ${l.actionType} @ ${l.createdAt.toISOString()}`));
    
    // 7. Detail transitions
    if (transitions > 0) {
        const tList = await prisma.scheduleWorkflowTransition.findMany({
            where: { scheduleId: schedule.id },
            orderBy: { createdAt: 'asc' }
        });
        console.log("\n--- Transition Details ---");
        tList.forEach(t => console.log(`  ${t.action}: ${t.fromStatus} -> ${t.toStatus}`));
    }
    
    // 8. WBS and Activity counts for context
    const wbsCount = await prisma.scheduleWBS.count({ where: { scheduleId: schedule.id } });
    const actCount = await prisma.scheduleActivity.count({ where: { scheduleId: schedule.id } });
    console.log("\n--- Schedule Content ---");
    console.log("WBS nodes:", wbsCount);
    console.log("Activities:", actCount);
}

main().catch(console.error).finally(() => prisma.$disconnect());
