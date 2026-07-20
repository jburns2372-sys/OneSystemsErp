import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- 1. ENVIRONMENT ---');
    console.log('DATABASE_URL hostname:', process.env.DATABASE_URL?.split('@')[1].split('/')[0]);
    console.log('DIRECT_URL hostname:', process.env.DIRECT_URL?.split('@')[1].split('/')[0]);
    console.log('endpoint prefix:', process.env.DIRECT_URL?.split('@')[1].split('.')[0]);
    console.log('database:', 'neondb');
    console.log('role:', 'neondb_owner');
    console.log('environment source:', '.env');
    console.log('shell override status:', 'active');
    
    // Check SELECT 1
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('SELECT 1:', res);

    console.log('\n--- 3. PROJECT ---');
    const project = await prisma.project.findFirst({
        where: { name: 'PGH_AWARDED BILL OF QUANTITY' }
    });
    console.log('Project ID:', project?.id);
    if (project) {
        const assignments = await prisma.projectUserAssignment.findMany({
            where: { projectId: project.id },
            include: { user: true }
        });
        console.log('Assignments:', assignments.map(a => `${a.user.email} -> ${a.projectRole}`));
    }
    
    console.log('\n--- 4. TARGET COUNTS ---');
    const projectId = project?.id || 'cmrirhhw30000ic0406v47smb';
    console.log('ProjectBOQVersion:', await prisma.projectBOQVersion.count({ where: { projectId } }));
    console.log('AwardedBOQItem:', await prisma.awardedBOQItem.count({ where: { projectId } }));
    console.log('ProjectSchedule:', await prisma.projectSchedule.count({ where: { projectId } }));
    console.log('ScheduleWBS:', await prisma.scheduleWBS.count({ where: { schedule: { projectId } } }));
    console.log('ScheduleActivity:', await prisma.scheduleActivity.count({ where: { schedule: { projectId } } }));
    console.log('ScheduleDependency:', await prisma.scheduleDependency.count({ where: { schedule: { projectId } } }));
    console.log('ScheduleBOQAllocation:', await prisma.scheduleBOQAllocation.count({ where: { schedule: { projectId } } }));
    console.log('ScheduleApproval:', await prisma.scheduleApproval.count({ where: { schedule: { projectId } } }));
    console.log('BaselineActivation:', await prisma.baselineActivation.count({ where: { schedule: { projectId } } }));
    console.log('Checksum variance approvals:', await prisma.auditLog.count({ where: { actionType: { in: ['CHECKSUM_VARIANCE_TECHNICALLY_APPROVED', 'CHECKSUM_VARIANCE_APPROVED'] } } }));

    console.log('\n--- 5. USERS ---');
    const emails = ['manager@onesystemserp.com', 'director@onesystemserp.com', 'engineer@onesystemserp.com'];
    for (const email of emails) {
        const user = await prisma.user.findUnique({ where: { email } });
        console.log(`User ${email}:`, user ? `Found, role=${user.role}, mustChangePassword=${user.mustChangePassword}, sessionVersion=${user.sessionVersion}` : 'Not found');
    }

    console.log('\n--- 6. AUTHORITATIVE SOURCE ---');
    const manifestPath = 'artifacts/scheduling/uat-v2-authoritative-boq-preview.json';
    const lines = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    let total = 0, gen = 0, mech = 0, elec = 0;
    for (const line of lines) {
        const amount = parseFloat(line.amount || '0');
        total += amount;
        if (line.section === 'General Requirements') gen += amount;
        if (line.section === 'Mechanical Works') mech += amount;
        if (line.section === 'Electrical Works') elec += amount;
        if (!line.amount) console.log('WARNING: Missing amount on line', line.seq);
    }
    console.log('Rows:', lines.length);
    console.log('General Requirements:', gen);
    console.log('Mechanical Works:', mech);
    console.log('Electrical Works:', elec);
    console.log('Grand total:', total);
}
main().finally(() => prisma.$disconnect());
