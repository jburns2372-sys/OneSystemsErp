import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: '@demo.com' } }
  });

  for (const u of users) {
    if (u.role) {
      const role = await prisma.role.findFirst({
        where: { roleCode: u.role }
      });
      if (role) {
        const existingLink = await prisma.userRole.findFirst({
          where: { userId: u.id, roleId: role.id }
        });
        if (!existingLink) {
          await prisma.userRole.create({
            data: { userId: u.id, roleId: role.id }
          });
          console.log(`Relinked ${u.email} to role ${role.roleName}`);
        } else {
          console.log(`${u.email} is already linked to ${role.roleName}`);
        }
      } else {
        console.log(`Role ${u.role} not found for ${u.email}`);
      }
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
