import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-rapid-base-apec3cyh-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
process.env.DIRECT_URL = "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-rapid-base-apec3cyh.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient();

async function main() {
    try {
        const res = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('SELECT 1:', res);
        
        const projectId = 'cmrirhhw30000ic0406v47smb';
        
        const boqV = await prisma.projectBOQVersion.findFirst({ where: { projectId }, orderBy: { createdAt: 'asc' } });
        console.log('ProjectBOQVersion createdAt:', boqV?.createdAt);
        
        const alloc = await prisma.awardedBOQItem.findFirst({ where: { projectId }, orderBy: { createdAt: 'asc' } });
        console.log('AwardedBOQItem createdAt:', alloc?.createdAt);
        
        // Find earliest timestamp
        const assignments = await prisma.projectUserAssignment.findMany({ where: { projectId } });
        const audits = await prisma.auditLog.findMany({ where: { moduleName: 'Project Reconstruction' } });
        const schedules = await prisma.projectSchedule.findMany({ where: { projectId } });
        
        const timestamps = [];
        assignments.forEach(a => timestamps.push({ source: 'ProjectUserAssignment', time: a.createdAt }));
        audits.forEach(a => timestamps.push({ source: `AuditLog (${a.actionType})`, time: a.createdAt }));
        if (boqV) timestamps.push({ source: 'ProjectBOQVersion', time: boqV.createdAt });
        if (alloc) timestamps.push({ source: 'AwardedBOQItem', time: alloc.createdAt });
        schedules.forEach(s => timestamps.push({ source: 'ProjectSchedule', time: s.createdAt }));
        
        timestamps.sort((a, b) => a.time.getTime() - b.time.getTime());
        if (timestamps.length > 0) {
            console.log('Earliest record:', timestamps[0].source, timestamps[0].time.toISOString());
        }
    } catch (e) {
        console.error('Connection failed:', e.message);
    }
}
main().finally(() => prisma.$disconnect());
