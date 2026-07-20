const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.user.updateMany({ where: { role: 'SUPER_ADMIN' }, data: { name: 'SUPER ADMIN' } });
  await prisma.role.updateMany({ where: { roleCode: 'SUPER_ADMIN' }, data: { roleName: 'SUPER ADMIN' } });
  console.log('Updated to SUPER ADMIN');
}

main().catch(console.error).finally(() => prisma.$disconnect());
