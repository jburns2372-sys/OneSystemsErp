const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const w = await prisma.worker.findFirst({where: {firstName: 'Dingdong'}});
  console.log(w);
}
main().catch(console.error).finally(() => prisma.$disconnect());
