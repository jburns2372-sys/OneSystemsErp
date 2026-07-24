import { PrismaClient } from '@prisma/client';
import "dotenv/config";

const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ScheduleBOQMapping" (
            "id" TEXT NOT NULL,
            "activityId" TEXT NOT NULL,
            "awardedBoqItemId" TEXT NOT NULL,
            "mappedQuantity" DOUBLE PRECISION,
            "mappedWeight" DOUBLE PRECISION,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            CONSTRAINT "ScheduleBOQMapping_pkey" PRIMARY KEY ("id")
        );
    `;
    console.log("Dummy table created.");
}
main().finally(() => prisma.$disconnect());
