import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    await prisma.scheduleGenerationAudit.deleteMany({
        where: { generationRequestId: 'GATE8C:GENERATE:cmrirhhw30000ic0406v47smb:514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17' }
    });
    console.log("Deleted idempotency record");

    await prisma.projectSchedule.deleteMany({
        where: { projectId: 'cmrirhhw30000ic0406v47smb' }
    });
    console.log("Deleted old schedule");
}

main().finally(() => prisma.$disconnect());
