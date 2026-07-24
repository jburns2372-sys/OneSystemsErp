import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const s = await prisma.projectSchedule.findFirst({
    where: { id: 'cmrjc9q54000nvc58tfblmle8' }
  });
  if (!s) {
    throw new Error(`Test schedule not found: cmrjc9q54000nvc58tfblmle8`);
  }
  console.log(s.validationMetrics);
  console.log(s.feasibilityFlags);
}
main().finally(() => prisma.$disconnect());
