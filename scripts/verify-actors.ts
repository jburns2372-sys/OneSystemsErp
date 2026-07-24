import { PrismaClient } from '@prisma/client';
import "dotenv/config";
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const p = await prisma.project.findFirst({
        where: {
            title: 'PGH_AWARDED BILL OF QUANTITY',
            startDate: new Date('2026-06-12'),
            targetDate: new Date('2026-12-09')
        }
    });

    const roles = ['System Administrator', 'Manager', 'Director', 'Site Engineer'];
    const emails = ['manager@onesystemserp.com', 'director@onesystemserp.com', 'engineer@onesystemserp.com'];
    
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { in: emails } },
                { role: { name: 'System Administrator' } }
            ]
        },
        include: {
            role: true,
            projectAssignments: true
        }
    });

    const result = {
        projectFound: !!p,
        projectId: p?.id,
        actors: users.map(u => ({
            email: u.email,
            role: u.role?.name,
            status: u.status,
            isLockedOut: u.isLockedOut,
            mustChangePassword: u.mustChangePassword,
            sessionVersionPopulated: u.sessionVersion !== null,
            assignments: u.projectAssignments.map(a => a.projectId)
        }))
    };
    
    console.log(JSON.stringify(result, null, 2));
    fs.writeFileSync('artifacts/scheduling/uat-v4-clean-actor-pbac-verification.json', JSON.stringify(result, null, 2));
}

main().finally(() => prisma.$disconnect());
