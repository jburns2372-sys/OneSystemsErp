import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const TARGET_PROJECT_ID = 'cmrirhhw30000ic0406v47smb';
const CANDIDATE_EMAIL = 'finance@onesystemserp.com';

async function main() {
    console.log(`Resolving Financial Reviewer for project: ${TARGET_PROJECT_ID}`);
    
    // Check if candidate exists and is active
    const user = await prisma.user.findFirst({
        where: {
            email: { equals: CANDIDATE_EMAIL, mode: 'insensitive' },
        },
        include: {
            projectAssignments: {
                where: {
                    projectId: TARGET_PROJECT_ID,
                    assignmentStatus: 'ACTIVE',
                    OR: [
                        { dateRemoved: null },
                        { dateRemoved: { gt: new Date() } }
                    ]
                },
                include: {
                    role: {
                        include: {
                            permissions: {
                                include: {
                                    module: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log(`GATE_9D_FINANCIAL_REVIEWER_REQUIRED: User ${CANDIDATE_EMAIL} not found.`);
        return;
    }

    if (user.status !== 'ACTIVE' || user.mustChangePassword) {
        console.log(`GATE_9D_FINANCIAL_REVIEWER_REQUIRED: User ${CANDIDATE_EMAIL} is not active or must change password.`);
        return;
    }

    console.log(`User found: ${user.email}, Role: ${user.role}`);
    console.log(`Assignments to target project: ${user.projectAssignments.length}`);
    
    let hasCapability = false;
    
    // Check assignments for financial capability (usually "FINANCIAL_REVIEW" or similar module permission)
    for (const assignment of user.projectAssignments) {
        // Look at role permissions
        const perms = assignment.role?.permissions || [];
        for (const p of perms) {
            console.log(` - Permission: ${p.module.moduleName} (${p.action})`);
            // Check if they have the specific financial review capability
            // Since I don't know the exact string, I'll print all permissions to see what we have
        }
    }

    // Now check if there are OTHER users that might be ambiguous financial reviewers
    // I will query users who have the role 'FINANCE_OFFICER' or similar in this project
    const otherUsers = await prisma.projectUserAssignment.findMany({
        where: {
            projectId: TARGET_PROJECT_ID,
            assignmentStatus: 'ACTIVE',
            role: {
                permissions: {
                    some: {
                        module: { moduleName: { contains: 'SCHEDULE' } },
                        action: { contains: 'FINANCE' }
                    }
                }
            },
            userId: { not: user.id }
        },
        include: { user: true }
    });
    
    console.log(`Other potentially qualified reviewers: ${otherUsers.length}`);
    for (const ou of otherUsers) {
        console.log(` - ${ou.user.email}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
