import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.project.update({
    where: { id: 'cmriveop10378vcqsma96byxi' },
    data: { originalContractDuration: 365 }
  });
  console.log('Updated originalContractDuration to 365 days');
}
main().finally(() => prisma.$disconnect());
