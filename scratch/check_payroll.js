const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const worker = await prisma.worker.findFirst({where: {firstName: 'Dingdong'}});
  const payrolls = await prisma.payroll.findMany({where: {workerId: worker.id}});
  console.log(payrolls);
}
main().catch(console.error).finally(() => prisma.$disconnect());
