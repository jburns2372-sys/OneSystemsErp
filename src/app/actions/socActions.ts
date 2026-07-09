'use server';

import { prisma } from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';

export async function checkSocAccess(userId: string) {
  const permissions = await getUserPermissions(userId);
  if (!permissions.IS_ADMIN && !permissions.SYSTEM_SETTINGS?.canView) {
    return false;
  }
  return true;
}

export async function getSocDashboardStats(includeSimulated: boolean = true) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const whereClause = includeSimulated ? {} : { simulated: false };

  const [
    totalEvents,
    blockedThreats,
    criticalThreats,
    failedLogins,
    aiAttacks,
    fileThreats,
    activeIncidents,
  ] = await Promise.all([
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, ...whereClause } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, OR: [{ status: 'BLOCKED' }, { result: 'BLOCKED' }, { blocked: true }], ...whereClause } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, severity: { in: ['CRITICAL', 'Critical'] }, ...whereClause } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, OR: [{ threatType: 'UNAUTHENTICATED_ACCESS' }, { category: 'Authentication' }], ...whereClause } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, category: 'AI', ...whereClause } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, category: 'FILE', ...whereClause } }),
    prisma.securityIncident.count({ where: { status: { notIn: ['Resolved', 'Closed'] } } }),
  ]);

  return {
    totalEvents,
    blockedThreats,
    criticalThreats,
    failedLogins,
    aiAttacks,
    fileThreats,
    activeIncidents,
  };
}

export async function getLiveThreatFeed(limit: number = 50, includeSimulated: boolean = true) {
  const whereClause = includeSimulated ? {} : { simulated: false };
  return await prisma.securityEvent.findMany({
    take: limit,
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    select: {
      id: true,
      timestamp: true,
      severity: true,
      threatType: true,
      sourceIp: true,
      country: true,
      city: true,
      userEmail: true,
      userRole: true,
      module: true,
      systemResponse: true,
      result: true,
      status: true,

    }
  });
}

export async function getEventDetails(eventId: string) {
  return await prisma.securityEvent.findUnique({
    where: { id: eventId },
    include: {
      incident: true,
    }
  });
}

export async function getThreatMapData(includeSimulated: boolean = true) {
  const whereClause = includeSimulated 
    ? { latitude: { not: null }, longitude: { not: null } }
    : { latitude: { not: null }, longitude: { not: null }, simulated: false };

  const recentEvents = await prisma.securityEvent.findMany({
    take: 100,
    orderBy: { timestamp: 'desc' },
    where: whereClause,
    select: {
      id: true,
      sourceIp: true,
      latitude: true,
      longitude: true,
      severity: true,
      status: true,
      threatType: true,
      country: true,
      city: true,
      simulated: true,
    }
  });
  return recentEvents;
}

export async function getCountermeasuresData(limit: number = 20) {
    return await prisma.countermeasureLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
}
