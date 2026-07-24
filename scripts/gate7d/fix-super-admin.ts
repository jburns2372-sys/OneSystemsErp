import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

async function run() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('Junixsys_001', 10);
  await prisma.user.updateMany({
    where: { email: 'J.BURNS2372@GMAIL.COM' },
    data: { passwordHash: hash }
  });
  console.log('Fixed Super Admin password hash');
  await prisma.$disconnect();
}
run();
