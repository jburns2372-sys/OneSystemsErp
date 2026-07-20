// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({ 
    where: { email: 'j.burns2372@gmail.com' }, 
    include: { userRoles: { include: { role: true } } } 
  });
  console.log(JSON.stringify(user, null, 2));

  const adminRole = await prisma.role.findFirst({
    where: { roleCode: 'SUPER_ADMIN' },
    include: { rolePermissions: true }
  });
  console.log('Admin Role Perms:', JSON.stringify(adminRole?.rolePermissions, null, 2));
}

main().finally(() => prisma.$disconnect());
