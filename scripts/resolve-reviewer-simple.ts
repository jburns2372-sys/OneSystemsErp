import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET_PROJECT_ID = 'cmrirhhw30000ic0406v47smb';
const CANDIDATE_EMAIL = 'finance@onesystemserp.com';

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: { equals: CANDIDATE_EMAIL, mode: 'insensitive' } },
        include: {
            projectAssignments: {
                where: {
                    projectId: TARGET_PROJECT_ID,
                    assignmentStatus: 'ACTIVE',
                    OR: [
                        { dateRemoved: null },
                        { dateRemoved: { gt: new Date() } }
                    ]
                }
            }
        }
    });

    console.log(JSON.stringify(user, null, 2));

    const otherAssign = await prisma.projectUserAssignment.findMany({
        where: { projectId: TARGET_PROJECT_ID },
        include: { user: { select: { email: true } } }
    });

    const sa = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN' }
    });
    console.log(sa?.email);
}

main().catch(console.error).finally(() => prisma.$disconnect());
