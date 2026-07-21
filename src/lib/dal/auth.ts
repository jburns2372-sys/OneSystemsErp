import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export async function verifySession() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return null;
  }

  const userId = session.user.id;
  const tokenSessionVersion = session.user.sessionVersion;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      status: true,
      role: true,
      sessionVersion: true,
      mustChangePassword: true,
      lockedUntil: true,
    },
  });

  if (!dbUser) return null;
  if (dbUser.status !== 'ACTIVE') return null;
  if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) return null;

  // Stale session check
  if (dbUser.sessionVersion !== tokenSessionVersion) {
    return null;
  }

  return {
    id: dbUser.id,
    role: dbUser.role,
    mustChangePassword: dbUser.mustChangePassword,
  };
}

export async function verifyPageSession() {
  const actor = await verifySession();
  if (!actor) return null;
  return actor;
}

export async function verifyApiSession() {
  const actor = await verifySession();
  if (!actor) return null;
  return actor;
}

export async function verifyActionSession() {
  const actor = await verifySession();
  if (!actor) return null;
  return actor;
}

export async function verifyOperationalSession() {
  const session = await auth();

  if (!session || !session.user || !session.user.id || typeof session.user.sessionVersion !== 'number') {
    return null;
  }

  const userId = session.user.id;
  const tokenSessionVersion = session.user.sessionVersion;

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      sessionVersion: true,
      mustChangePassword: true,
      lockedUntil: true,
    },
  });

  if (!dbUser) return null;
  if (dbUser.sessionVersion !== tokenSessionVersion) return null;
  
  const accountActive = dbUser.status === 'ACTIVE';
  const accountLocked = dbUser.lockedUntil !== null && dbUser.lockedUntil > new Date();

  if (!accountActive || accountLocked || dbUser.mustChangePassword) return null;

  return {
    userId: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    sessionVersion: dbUser.sessionVersion,
    accountActive,
    accountLocked,
    mustChangePassword: dbUser.mustChangePassword,
  };
}
