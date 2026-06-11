import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const perms = await prisma.rolePermission.findMany({
    include: { role: true, module: true }
  });
  console.log(`Total RolePermissions: ${perms.length}`);
  if (perms.length > 0) {
    console.log(`Sample: Role: ${perms[0].role?.roleName}, Module: ${perms[0].moduleName}, View: ${perms[0].canView}, Create: ${perms[0].canCreate}`);
  }
}

main().finally(() => prisma.$disconnect());
