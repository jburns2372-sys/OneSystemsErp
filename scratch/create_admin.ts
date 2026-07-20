// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.user.upsert({
    where: { email: 'pd@gmail.com' },
    update: {},
    create: {
      email: 'pd@gmail.com',
      name: 'System Admin',
      password: 'password123',
      role: 'SYSTEM_ADMIN'
    }
  });
  console.log('Admin user created/verified successfully!');
}
main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
