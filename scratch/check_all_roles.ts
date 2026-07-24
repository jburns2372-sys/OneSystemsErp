import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({ select: { roleCode: true, roleName: true } });
  console.table(roles);
}
main().finally(() => prisma.$disconnect());
