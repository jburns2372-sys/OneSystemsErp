import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('Password123!', 10);
  
  await prisma.user.updateMany({
    where: { email: 'admin@onesystemserp.com' },
    data: { passwordHash: hash, failedLoginAttempts: 0, lockedUntil: null, status: 'ACTIVE', role: 'SUPER_ADMIN' }
  });
  
  await prisma.user.updateMany({
    where: { email: 'manager@onesystemserp.com' },
    data: { passwordHash: hash, failedLoginAttempts: 0, lockedUntil: null, status: 'ACTIVE', role: 'PROJECT_MANAGER' }
  });

  await prisma.user.updateMany({
    where: { email: 'director@onesystemserp.com' },
    data: { passwordHash: hash, failedLoginAttempts: 0, lockedUntil: null, status: 'ACTIVE', role: 'DIRECTORS' }
  });

  console.log('Roles and passwords reset');
}

run().then(() => process.exit(0)).catch(console.error);
