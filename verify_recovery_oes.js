const { PrismaClient } = require('@prisma/client');
require('dotenv').config({ path: '.env.local' });

async function verify() {
  const p = new PrismaClient();
  try {
    const userId = "cmqn5zlim0000vckg4hzn5u7o";
    const allTokens = await p.passwordRecoveryToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log("ALL_TOKENS:", allTokens.map(t => ({
      id: t.id,
      createdAt: t.createdAt,
      consumedAt: t.consumedAt,
      revokedAt: t.revokedAt,
      expiresAt: t.expiresAt
    })));
  } catch (e) {
    console.error(e);
  } finally {
    await p.$disconnect();
  }
}
verify();
