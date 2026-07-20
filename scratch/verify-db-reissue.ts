import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.uat-v4-r7.credentials.local' });
dotenv.config();
import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  const userId = 'cmqn5zlim0000vckg4hzn5u7o';
  
  const tokens = await prisma.passwordRecoveryToken.findMany({
    where: { userId }
  });

  const activeTokens = tokens.filter(t => !t.consumedAt && !t.revokedAt && t.expiresAt > new Date());
  
  console.log(`Total tokens for user: ${tokens.length}`);
  console.log(`Active tokens: ${activeTokens.length}`);
  
  if (activeTokens.length === 1) {
    const token = activeTokens[0];
    console.log(`Active token ID: ${token.id}`);
    console.log(`Stored as hash (length > 32): ${token.tokenHash && token.tokenHash.length > 32}`);
    const timeDiffMs = token.expiresAt.getTime() - new Date().getTime();
    console.log(`Expires within 30 min (<= 30 min): ${timeDiffMs <= 30 * 60 * 1000}`);
  } else if (activeTokens.length > 1) {
    console.error('More than one active recovery token exists.');
  }

  const audits = await prisma.auditLog.findMany({
    where: { userId, actionType: 'PASSWORD_RECOVERY_REQUESTED' },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Audit events (PASSWORD_RECOVERY_REQUESTED) total: ${audits.length}`);

  await prisma.$disconnect();
}

verify();
