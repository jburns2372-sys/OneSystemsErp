import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const jo = await prisma.jobOrder.findFirst({
    where: { status: 'APPROVED' },
    include: { subcontractor: true }
  });
  console.log("Locked JO:", jo?.jobNumber);
  console.log("Subcontractor:", jo?.subcontractor?.name);
}

main().catch(console.error).finally(() => prisma.$disconnect());
