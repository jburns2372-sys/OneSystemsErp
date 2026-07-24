const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('P@ssword12345!', 10);
  await prisma.user.updateMany({
    where: {
      email: {
        in: ['engineer@onesystemserp.com', 'manager@onesystemserp.com', 'director@onesystemserp.com']
      }
    },
    data: {
      passwordHash: hash,
      mustChangePassword: true
    }
  });
  console.log('Updated passwords successfully.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
