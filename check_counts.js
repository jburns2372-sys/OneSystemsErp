const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.count();
  const roles = await prisma.role.count();
  const permissions = await prisma.rolePermission.count();
  const subpackages = await prisma.subcontractPackage.count();
  console.log({ users, roles, permissions, subpackages });
}
main().finally(() => prisma.$disconnect());
