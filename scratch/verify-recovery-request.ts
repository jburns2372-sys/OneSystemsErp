import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { PrismaClient } from '@prisma/client';

async function verify() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email: 'j.burns2372@gmail.com' } });
  
  if (!user) { console.error('User not found'); return; }
  console.log(`User ID: ${user.id}`);

  const tokens = await prisma.passwordRecoveryToken.findMany({
    where: { userId: user.id }
  });

  const activeTokens = tokens.filter(t => !t.consumedAt && !t.revokedAt && t.expiresAt > new Date());
  console.log(`New recovery requests (active tokens): ${activeTokens.length}`);

  if (activeTokens.length > 0) {
    const token = activeTokens[0];
    console.log(`Stored as hash (length > 32): ${token.tokenHash && token.tokenHash.length > 32}`);
    console.log(`Unused (consumedAt null): ${token.consumedAt === null}`);
    console.log(`Not expired: ${token.expiresAt > new Date()}`);
    const timeDiffMs = token.expiresAt.getTime() - new Date().getTime();
    console.log(`Expires within 30 min (<= 30 min): ${timeDiffMs <= 30 * 60 * 1000}`);
  }

  const audits = await prisma.auditLog.findMany({
    where: { userId: user.id, actionType: 'PASSWORD_RECOVERY_REQUESTED' },
    orderBy: { createdAt: 'desc' },
    take: 1
  });

  console.log(`Audit events (PASSWORD_RECOVERY_REQUESTED): ${audits.length}`);
  if (audits.length > 0) {
    console.log(`Latest audit: ${audits[0].actionType}`);
  }

  await prisma.$disconnect();
}

verify();
