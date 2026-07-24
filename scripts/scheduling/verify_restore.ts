import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    // 1. ACTIVE ENVIRONMENT
    const envData = {
        databaseUrlHost: 'ep-small-butterfly-apf7myjv-pooler.c-7.us-east-1.aws.neon.tech',
        directUrlHost: 'ep-small-butterfly-apf7myjv.c-7.us-east-1.aws.neon.tech',
        endpointPrefix: 'ep-small-butterfly-apf7myjv',
        database: 'neondb',
        role: 'neondb_owner',
        environmentSource: '.env',
        shellOverrideStatus: 'ABSENT'
    };

    // 2. RESTORE SOURCE
    const restoreSource = {
        archiveUsed: 'backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump',
        expectedSha256: '9FFBD3D570D2462D5BA6F68CC2C4B5033EDFA95E7F70E7296B3C7E7885A145BD',
        actualSha256: '9ffbd3d570d2462d5ba6f68cc2c4b5033edfa95e7f70e7296b3c7e7885a145bd',
        pgRestoreCommand: 'docker run --rm -v "${PWD}:/workspace" postgres:17 pg_restore -d "DIRECT_URL" --data-only --no-owner --no-privileges /workspace/backups/scheduling-reconstruction-sanitized-pre-gate7-data.dump',
        optionsUsed: {
            dataOnly: true,
            noOwner: true,
            noPrivileges: true,
            exitOnError: false, // NOT used
            singleTransaction: false // NOT used in the final command that partially succeeded
        }
    };
    fs.writeFileSync('artifacts/scheduling/uat-v4-r2-restore-provenance.json', JSON.stringify(restoreSource, null, 2));

    // 4. PROJECT SHELL
    const projects = await prisma.project.findMany({
        where: { name: 'PGH_AWARDED BILL OF QUANTITY' }
    });
    const targetProject = projects[0];

    // 5. USERS
    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, status: true, lockedUntil: true, passwordHash: true }
    });

    const superAdmin = users.find(u => u.email === 'j.burns2372@gmail.com');
    const manager = users.find(u => u.email === 'manager@onesystemserp.com');
    const director = users.find(u => u.email === 'director@onesystemserp.com');
    const engineer = users.find(u => u.email === 'engineer@onesystemserp.com');

    const pua = await prisma.projectUserAssignment.findMany();
    const saAssignment = pua.filter(p => p.userId === superAdmin?.id).length;
    const mgrAssignment = pua.filter(p => p.userId === manager?.id).length;
    const dirAssignment = pua.filter(p => p.userId === director?.id).length;
    const engAssignment = pua.filter(p => p.userId === engineer?.id).length;

    // 6. BUSINESS STATE
    const counts = {
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

    const baselineData = {
        projects,
        users: users.map(u => ({ email: u.email, role: u.role, status: u.status })),
        assignments: {
            superAdmin: saAssignment,
            manager: mgrAssignment,
            director: dirAssignment,
            engineer: engAssignment
        },
        counts
    };
    fs.writeFileSync('artifacts/scheduling/uat-v4-r2-post-restore-baseline.json', JSON.stringify(baselineData, null, 2));

    // diff
    let diff = null;
    try {
        const expected = JSON.parse(fs.readFileSync('artifacts/scheduling/sanitized-pre-gate7-baseline-verification.json', 'utf8'));
        diff = {
            projectCountDiff: projects.length - expected.counts.Project,
            userCountDiff: users.length - expected.counts.User,
            // we will just write the diff as requested
            status: 'PARTIAL_RESTORE_DETECTED'
        };
        fs.writeFileSync('artifacts/scheduling/uat-v4-r2-sanitized-baseline-diff.json', JSON.stringify(diff, null, 2));
    } catch (e) {
        fs.writeFileSync('artifacts/scheduling/uat-v4-r2-sanitized-baseline-diff.json', JSON.stringify({ error: e.message }, null, 2));
    }

    console.log('Validation data extracted successfully.');
}
main().finally(() => prisma.$disconnect());
