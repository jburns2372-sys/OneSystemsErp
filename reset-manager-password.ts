import { prisma } from './src/lib/prisma';
import bcrypt from 'bcryptjs';

async function main() {
  const email = 'manager@onesystemserp.com';
  
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    console.log(`User ${email} not found in the database.`);
    return;
  }

  const newPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: { 
      password: hashedPassword, 
      passwordHash: hashedPassword,
      status: 'ACTIVE', 
      mustChangePassword: false,
      failedLoginAttempts: 0,
      lockedUntil: null
    }
  });

  console.log(`Successfully reset password for ${email} to: ${newPassword}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
