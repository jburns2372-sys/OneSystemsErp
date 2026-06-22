const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    where: {
      OR: [
        { roleCode: { contains: 'GUEST' } },
        { roleName: { contains: 'GUEST' } }
      ]
    },
    include: {
      rolePermissions: true
    }
  });
  console.dir(roles, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
