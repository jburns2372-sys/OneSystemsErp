'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';

export async function getSecurityEvents(limit = 100) {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;
  if (!userId) throw new Error('Unauthorized');

  const permissions = await getUserPermissions(userId);
  if (!permissions.IS_ADMIN && !permissions.SYSTEM_SETTINGS?.canView) {
    throw new Error('Unauthorized. SOC access required.');
  }

  const events = await prisma.securityEvent.findMany({
    take: limit,
    orderBy: { timestamp: 'desc' },
  });

  return events;
}

export async function getSecurityStats() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;
  if (!userId) throw new Error('Unauthorized');

  const permissions = await getUserPermissions(userId);
  if (!permissions.IS_ADMIN && !permissions.SYSTEM_SETTINGS?.canView) {
    throw new Error('Unauthorized. SOC access required.');
  }

  const [totalBlocked, criticalThreats, aiInjections] = await Promise.all([
    prisma.securityEvent.count({ where: { status: 'BLOCKED' } }),
    prisma.securityEvent.count({ where: { severity: 'CRITICAL' } }),
    prisma.securityEvent.count({ where: { threatType: 'PROMPT_INJECTION_ATTEMPT' } }),
  ]);

  return { totalBlocked, criticalThreats, aiInjections };
}
