const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:postgres@localhost:5434/gate7d_verify?schema=public"
        }
    }
});

async function run() {
    const hash = await bcrypt.hash('Junixsys_001', 10);
    const updated = await prisma.user.updateMany({
        where: { email: { in: ['engineer@onesystemserp.com', 'ENGINEER@ONESYSTEMSERP.COM'] } },
        data: { passwordHash: hash, status: 'ACTIVE', role: 'SITE_ENGINEER' }
    });
    console.log("Updated users:", updated.count);

    // Make sure PBAC
    const eng = await prisma.user.findFirst({ where: { email: 'ENGINEER@ONESYSTEMSERP.COM' } });
    if (eng) {
        await prisma.projectUserAssignment.upsert({
            where: { userId_projectId: { userId: eng.id, projectId: 'cmrirhhw30000ic0406v47smb' } },
            update: { assignmentStatus: 'active' },
            create: { userId: eng.id, projectId: 'cmrirhhw30000ic0406v47smb', assignmentStatus: 'active' }
        });
        console.log("PBAC Updated");
    }
}

run().finally(() => prisma.$disconnect());
