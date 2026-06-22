// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    where: { email: 'super_admin@demo.com' }
  });
  console.log('Super Admin User:', users);
}
main().finally(() => prisma.$disconnect());
