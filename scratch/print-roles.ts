// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function printRoles() {
  const roles = await prisma.role.findMany();
  console.log(roles.map(r => ({ name: r.roleName, code: r.roleCode, id: r.id })));
}

printRoles().finally(() => prisma.$disconnect());
