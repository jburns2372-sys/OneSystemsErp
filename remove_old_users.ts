import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: {
      email: { endsWith: '@gmail.com' }
    }
  });

  console.log(`Found ${users.length} old users to delete.`);
  for (const u of users) {
    await prisma.userRole.deleteMany({ where: { userId: u.id } });
    await prisma.auditLog.deleteMany({ where: { userId: u.id } });
    await prisma.aIValidationLog.deleteMany({ where: { userId: u.id } });
    await prisma.userLoginLog.deleteMany({ where: { userId: u.id } });
    
    try {
      await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id = '${u.id}'`);
      console.log(`Force deleted user: ${u.email}`);
    } catch (e2) {
      console.log(`Still could not delete user ${u.email}`, e2);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
