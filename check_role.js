const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { userRoles: { include: { role: true } } }
  });
  users.forEach(u => console.log(u.email, u.role, u.userRoles?.map(ur => ur.role.roleCode)));
}

main().catch(console.error).finally(() => prisma.$disconnect());
