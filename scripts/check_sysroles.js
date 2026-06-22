const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.systemRole.findMany({
    where: {
      name: { contains: 'GUEST' }
    }
  });
  console.dir(roles, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
