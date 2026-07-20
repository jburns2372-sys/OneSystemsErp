require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin01@demo.com' }
  });
  console.log('User found:', !!user);

  const tokens = await prisma.passwordRecoveryToken.findMany({
    where: { userId: user.id }
  });
  console.log('Number of tokens:', tokens.length);
  if (tokens.length > 0) {
    const token = tokens[tokens.length - 1]; // get the latest one just in case
    console.log('Token stored as hash (length > 32):', token.tokenHash && token.tokenHash.length > 32);
    console.log('Token unused (consumedAt is null):', token.consumedAt === null);
    console.log('Token expires > now:', token.expiresAt > new Date());
    const thirtyMinFromCreatedAt = new Date(token.createdAt.getTime() + 30 * 60 * 1000);
    // allowing 1 second diff
    const diff = Math.abs(token.expiresAt.getTime() - thirtyMinFromCreatedAt.getTime());
    console.log('Token expires in 30 mins (diff ms):', diff);
  }

  const audits = await prisma.auditLog.findMany({
    where: { 
      userId: user.id,
      actionType: 'PASSWORD_RECOVERY_REQUESTED'
    },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Audit record found for PASSWORD_RECOVERY_REQUESTED:', audits.length > 0);
  
  await prisma.$disconnect();
}
verify();
