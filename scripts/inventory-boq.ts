import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/gate7d_sanitized_baseline";

const prisma = new PrismaClient();

async function main() {
    const report: any = {};
    const items: any[] = await prisma.$queryRaw`SELECT * FROM "AwardedBOQItem"`;
    
    report.totalCount = items.length;
    
    let earliest = items[0]?.createdAt;
    let latest = items[0]?.createdAt;
    let nullParentCount = 0;
    
    for (const item of items) {
        if (item.createdAt < earliest) earliest = item.createdAt;
        if (item.createdAt > latest) latest = item.createdAt;
        if (!item.projectId) nullParentCount++; // projectBOQVersionId does not exist yet
    }
    
    report.earliest = earliest;
    report.latest = latest;
    report.nullParentCount = nullParentCount;
    
    // Check tables referencing AwardedBOQItem
    const schedules: any[] = await prisma.$queryRaw`SELECT * FROM information_schema.tables WHERE table_name = 'ScheduleBOQAllocation'`;
    if (schedules.length > 0) {
        const allocs: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "ScheduleBOQAllocation"`;
        report.scheduleAllocations = Number(allocs[0].c);
    } else {
        report.scheduleAllocations = 0;
    }
    
    console.log(JSON.stringify(report, null, 2));
}
main().finally(() => prisma.$disconnect());
