import { PrismaClient } from '@prisma/client';

process.env.DATABASE_URL = "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-holy-darkness-apqs7kn7-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
process.env.DIRECT_URL = "postgresql://neondb_owner:npg_brmzcXfH81MG@ep-holy-darkness-apqs7kn7.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient();

async function main() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    const v3CreationTimeUtc = new Date('2026-07-15T20:44:27.566Z');
    
    const assignments = await prisma.projectUserAssignment.findMany({ where: { projectId } });
    const audits = await prisma.auditLog.findMany({ where: { moduleName: 'Project Reconstruction' } });
    const boqVersions = await prisma.projectBOQVersion.findMany({ where: { projectId } });
    const boqItems = await prisma.awardedBOQItem.findMany({ where: { projectId } });
    const schedules = await prisma.projectSchedule.findMany({ where: { projectId } });
    
    const timestamps = [];
    
    assignments.forEach(a => timestamps.push({ source: 'ProjectUserAssignment', time: a.createdAt }));
    audits.forEach(a => timestamps.push({ source: `AuditLog (${a.actionType})`, time: a.createdAt }));
    boqVersions.forEach(v => {
        timestamps.push({ source: 'ProjectBOQVersion (createdAt)', time: v.createdAt });
        if (v.committedAt) timestamps.push({ source: 'ProjectBOQVersion (committedAt)', time: v.committedAt });
        if (v.approvedAt) timestamps.push({ source: 'ProjectBOQVersion (approvedAt)', time: v.approvedAt });
        if (v.lockedAt) timestamps.push({ source: 'ProjectBOQVersion (lockedAt)', time: v.lockedAt });
    });
    boqItems.forEach(b => timestamps.push({ source: 'AwardedBOQItem', time: b.createdAt }));
    schedules.forEach(s => timestamps.push({ source: 'ProjectSchedule', time: s.createdAt }));
    
    const v3Mutations = timestamps.filter(t => t.time.getTime() > v3CreationTimeUtc.getTime())
                                  .sort((a, b) => a.time.getTime() - b.time.getTime());
    
    if (v3Mutations.length > 0) {
        console.log('Earliest V3 Mutation:');
        console.log('Source:', v3Mutations[0].source);
        console.log('Time (UTC):', v3Mutations[0].time.toISOString());
    } else {
        console.log('No mutations found after V3 creation time.');
    }
}

main().finally(() => prisma.$disconnect());
