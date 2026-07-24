import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    const report: any = {
        endpoint: process.env.DATABASE_URL,
        directUrl: process.env.DIRECT_URL,
        success: false,
        counts: {}
    };

    try {
        const test = await prisma.$queryRaw`SELECT 1 as result`;
        report.success = test !== null;

        report.counts = {
            project: await prisma.project.count(),
            projectBOQVersion: await prisma.projectBOQVersion.count(),
            awardedBOQItem: await prisma.awardedBOQItem.count(),
            projectSchedule: await prisma.projectSchedule.count(),
            scheduleWBS: await prisma.scheduleWBS.count(),
            scheduleActivity: await prisma.scheduleActivity.count(),
            scheduleDependency: await prisma.scheduleDependency.count(),
            scheduleBOQAllocation: await prisma.scheduleBOQAllocation.count(),
            scheduleApproval: await prisma.scheduleApproval.count(),
            scheduleReviewComment: await prisma.scheduleReviewComment.count(),
            baselineActivation: await prisma.baselineActivation.count()
        };
        
        const migrations: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM _prisma_migrations`;
        report.counts.migrations = Number(migrations[0].c);
        
    } catch (e: any) {
        report.error = e.message;
    }

    console.log(JSON.stringify(report, null, 2));
}

main().finally(() => prisma.$disconnect());
