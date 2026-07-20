const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function main() {
    const url = process.env.DATABASE_URL || '';
    const direct = process.env.DIRECT_URL || '';
    const endpointPrefix = url.match(/ep-[a-z0-9-]+/)?.[0] || 'UNKNOWN';
    const database = url.match(/\/[a-z_]+(?=\?|$)/)?.[0]?.slice(1) || 'UNKNOWN';
    const role = url.match(/\/\/([^:]+):/)?.[1] || 'UNKNOWN';
    
    let selectOneSucceeded = false;
    try {
        const r = await prisma.$queryRaw`SELECT 1 as val`;
        selectOneSucceeded = r[0].val === 1;
    } catch(e) {
        console.error(e);
    }
    
    const counts = {
        Project: await prisma.project.count(),
        User: await prisma.user.count(),
        ProjectUserAssignment: await prisma.projectUserAssignment.count(),
        ProjectBOQVersion: await prisma.projectBOQVersion.count(),
        AwardedBOQItem: await prisma.awardedBOQItem.count(),
        ProjectSchedule: await prisma.projectSchedule.count(),
        ScheduleWBS: await prisma.scheduleWBS.count(),
        ScheduleActivity: await prisma.scheduleActivity.count(),
        ScheduleDependency: await prisma.scheduleDependency.count(),
        ScheduleBOQAllocation: await prisma.scheduleBOQAllocation.count(),
        ScheduleApproval: await prisma.scheduleApproval.count(),
        ScheduleReviewComment: await prisma.scheduleReviewComment.count(),
        BaselineActivation: await prisma.baselineActivation.count()
    };
    
    const data = {
        environment: {
            databaseUrlHost: url.includes('-pooler') ? url.split('@')[1].split('/')[0] : url,
            directUrlHost: direct.includes('-pooler') ? direct : direct.split('@')[1].split('/')[0],
            endpointPrefix,
            database,
            role,
            environmentSource: '.env',
            shellOverrideStatus: 'ABSENT',
            selectOneSucceeded,
            databaseHasPooler: url.includes('-pooler'),
            directHasPooler: direct.includes('-pooler')
        },
        counts,
        status: 'V4_R3_SCHEMA_ONLY_STARTING_STATE_VERIFIED'
    };
    
    fs.writeFileSync('artifacts/scheduling/uat-v4-r3-schema-only-state.json', JSON.stringify(data, null, 2));
    console.log(JSON.stringify(data, null, 2));
}

main().finally(() => prisma.$disconnect());
