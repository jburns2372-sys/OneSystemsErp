import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function run() {
  const u = await prisma.user.findUnique({ where: { email: 'director@onesystemserp.com' }});
  console.log('isActive:', u.isActive, 'isLocked:', u.isLocked, 'mustChangePassword:', u.mustChangePassword);
}
run().finally(() => prisma.$disconnect());
