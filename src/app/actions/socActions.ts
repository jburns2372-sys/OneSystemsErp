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

export async function getSocDashboardStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    totalEvents,
    blockedThreats,
    criticalThreats,
    failedLogins,
    aiAttacks,
    fileThreats,
    activeIncidents,
  ] = await Promise.all([
    prisma.securityEvent.count({ where: { timestamp: { gte: today } } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, status: 'BLOCKED' } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, severity: 'CRITICAL' } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, threatType: 'UNAUTHENTICATED_ACCESS' } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, category: 'AI' } }),
    prisma.securityEvent.count({ where: { timestamp: { gte: today }, category: 'FILE' } }),
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

export async function getLiveThreatFeed(limit: number = 50) {
  return await prisma.securityEvent.findMany({
    take: limit,
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

export async function getThreatMapData() {
  const recentEvents = await prisma.securityEvent.findMany({
    take: 100,
    orderBy: { timestamp: 'desc' },
    where: { latitude: { not: null }, longitude: { not: null } },
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
