import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5434/gate7d_sanitized_baseline";

const prisma = new PrismaClient();

async function main() {
    const report: any = {};
    
    // Count before
    const before: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AwardedBOQItem"`;
    report.before = Number(before[0].c);
    
    // Delete
    const result = await prisma.$executeRaw`DELETE FROM "AwardedBOQItem"`;
    report.removed = result;
    
    // Count after
    const after: any[] = await prisma.$queryRaw`SELECT count(*) as c FROM "AwardedBOQItem"`;
    report.after = Number(after[0].c);
    
    console.log(JSON.stringify(report, null, 2));
}
main().finally(() => prisma.$disconnect());
