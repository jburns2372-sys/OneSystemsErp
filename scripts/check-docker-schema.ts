import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5433/gate7d_backup_audit";

const prisma = new PrismaClient();

async function main() {
    try {
        const res = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'AwardedBOQItem';
        `;
        console.log("AwardedBOQItem columns:", res);

        const projectBOQVersion = await prisma.$queryRaw`
            SELECT count(*) FROM information_schema.tables WHERE table_name = 'ProjectBOQVersion';
        `;
        console.log("ProjectBOQVersion table exists:", projectBOQVersion);
    } catch (e) {
        console.error(e);
    }
}
main().finally(() => prisma.$disconnect());
