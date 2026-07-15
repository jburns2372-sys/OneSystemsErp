import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const records = await prisma.scheduleRevisionReason.findMany({
    where: { parentScheduleId: 'cmrjou0ne0001vcf01eju4dh8' }
  });
  console.log('Revision Reasons:', records.map(r => ({ id: r.scheduleId, reason: r.reason })));
}
main().finally(() => prisma.$disconnect());
