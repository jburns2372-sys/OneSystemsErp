require('dotenv').config({ path: '.env.uat-v4-r7', override: true });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();
async function main() {
    const counts = {
        Project: await prisma.project.count(),
        UserBusinessRecords: await prisma.user.count(),
        ProjectSchedule: await prisma.projectSchedule.count(),
        ScheduleWBS: await prisma.scheduleWBS.count(),
        ScheduleActivity: await prisma.scheduleActivity.count(),
        ScheduleDependency: await prisma.scheduleDependency.count(),
        ScheduleBOQAllocation: await prisma.scheduleBOQAllocation.count(),
        ScheduleWorkflowTransition: await prisma.scheduleWorkflowTransition.count(),
        ScheduleReviewComment: await prisma.scheduleReviewComment.count(),
        ScheduleApproval: await prisma.scheduleApproval.count(),
        BaselineActivation: await prisma.baselineActivation.count()
    };
    
    fs.writeFileSync('artifacts/scheduling/uat-v4-r7-empty-schema.json', JSON.stringify(counts, null, 2));
    const allZero = Object.values(counts).every(c => c === 0);
    if (allZero) {
        console.log('GATE9D_V4_R7_EMPTY_SCHEMA_READY_FOR_DATA_RESTORE');
    } else {
        console.log('Data found!');
    }
}
main().finally(() => prisma.$disconnect());
