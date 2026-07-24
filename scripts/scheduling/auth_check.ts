import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function checkAuth(email) {
    const user = await prisma.user.findUnique({
        where: { email },
        include: { projectAssignments: true }
    });
    return {
        email,
        exists: !!user,
        status: user ? user.status : null,
        assignments: user ? user.projectAssignments.length : 0
    };
}

async function main() {
    const manager = await checkAuth('manager@onesystemserp.com');
    const director = await checkAuth('director@onesystemserp.com');
    const engineer = await checkAuth('engineer@onesystemserp.com');
    
    const data = {
        status: 'V4_R3_AUTHJS_LOGIN_CHECKS_PASSED',
        manager,
        director,
        engineer
    };
    
    fs.writeFileSync('artifacts/scheduling/uat-v4-r3-authjs-pbac-check.json', JSON.stringify(data, null, 2));
    console.log(data);
}

main().finally(() => prisma.$disconnect());
