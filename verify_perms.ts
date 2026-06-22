// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const roles = await prisma.role.findMany({
    include: { rolePermissions: true }
  });

  const summary = roles.map(r => ({
    Role: r.roleName,
    ConfiguredModules: r.rolePermissions.length
  }));

  console.table(summary);
}

main().finally(() => prisma.$disconnect());
