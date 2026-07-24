import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userId = 'cmrinioec001gvchcueq8v3db'; // finance@onesystemserp.com
    const projectId = 'cmrirhhw30000ic0406v47smb';

    const existing = await prisma.projectUserAssignment.findUnique({
        where: {
            userId_projectId: {
                userId,
                projectId
            }
        }
    });

    if (existing) {
        console.log("Already assigned:", existing);
        await prisma.projectUserAssignment.update({
            where: {
                userId_projectId: {
                    userId,
                    projectId
                }
            },
            data: {
                projectRole: 'FINANCE_OFFICER',
                assignmentStatus: 'ACTIVE',
            }
        });
        console.log("Updated assignment.");
    } else {
        const created = await prisma.projectUserAssignment.create({
            data: {
                userId,
                projectId,
                projectRole: 'FINANCE_OFFICER',
                assignmentStatus: 'ACTIVE',
                accessLevel: 'READ_WRITE'
            }
        });
        console.log("Created assignment:", created);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
