import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function run() {
  const hash = await bcrypt.hash('Password123!', 10);
  const emails = ['admin@onesystemserp.com', 'manager@onesystemserp.com', 'director@onesystemserp.com', 'engineer@onesystemserp.com'];
  
  for (const email of emails) {
    await prisma.user.updateMany({
      where: { email },
      data: {
        passwordHash: hash,
        failedLoginAttempts: 0,
        lockedUntil: null,
        status: 'ACTIVE'
      }
    });
    console.log(`Reset ${email}`);
  }
}

run().then(() => process.exit(0)).catch(console.error);
