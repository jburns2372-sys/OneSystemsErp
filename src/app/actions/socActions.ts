'use server';
import { prisma } from '@/lib/prisma';
import { getUserPermissions } from '@/lib/permissions';

export async function checkSocAccess(userId: string) {
  try {
    if (!userId) throw new Error('userId is required');
    const permissions = await getUserPermissions(userId);
    const hasAccess = !!(permissions as any).IS_ADMIN || !!(permissions as any).SYSTEM_SETTINGS?.canView;
    return hasAccess;
  } catch (error: any) {
    console.error('Error in checkSocAccess:', error);
    return false;
  }
}

export async function getSocDashboardStats(includeSimulated: boolean = true) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereClause: any = includeSimulated ? {} : { simulated: false };

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
  } catch (error: any) {
    console.error('Error in getSocDashboardStats:', error);
    return { totalEvents: 0, blockedThreats: 0, criticalThreats: 0, failedLogins: 0, aiAttacks: 0, fileThreats: 0, activeIncidents: 0 };
  }
}

export async function getLiveThreatFeed(limit: number = 50, includeSimulated: boolean = true) {
  try {
    const whereClause: any = includeSimulated ? {} : { simulated: false };
    const data = await prisma.securityEvent.findMany({
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
        simulated: true,
        simulationRunId: true,
        expectedResponse: true,
        actualResponse: true,
      }
    });
    return data;
  } catch (error: any) {
    console.error('Error in getLiveThreatFeed:', error);
    return [];
  }
}

export async function getEventDetails(eventId: string) {
  try {
    if (!eventId) throw new Error('eventId is required');
    const data = await prisma.securityEvent.findUnique({
      where: { id: eventId },
      include: {
        incident: true,
      }
    });
    return data;
  } catch (error: any) {
    console.error('Error in getEventDetails:', error);
    return null;
  }
}

export async function getThreatMapData(includeSimulated: boolean = true) {
  try {
    const whereClause: any = includeSimulated
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
  } catch (error: any) {
    console.error('Error in getThreatMapData:', error);
    return [];
  }
}

export async function getCountermeasuresData(limit: number = 20) {
  try {
    const data = await prisma.countermeasureLog.findMany({
      take: limit,
      orderBy: { timestamp: 'desc' },
    });
    return data;
  } catch (error: any) {
    console.error('Error in getCountermeasuresData:', error);
    return [];
  }
}
