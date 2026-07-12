import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, password: true, passwordHash: true }
  });
  console.log('User Passwords:', users);
}
main().finally(() => prisma.$disconnect());
