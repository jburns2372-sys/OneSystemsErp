// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  const sysRoles = await prisma.systemRole.findMany();
  const rbacRoles = await prisma.role.findMany();
  
  console.log("=== Users Roles ===");
  const userRoles = new Set(users.map(u => u.role));
  console.log([...userRoles].filter(Boolean));

  console.log("\n=== System Roles ===");
  console.log(sysRoles.map(sr => sr.name));

  console.log("\n=== RBAC Roles ===");
  console.log(rbacRoles.map(r => r.roleName));
}

main().finally(() => prisma.$disconnect());
