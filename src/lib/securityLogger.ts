import { prisma } from '@/lib/prisma';
import { enrichIpAddress } from './geoip';

export interface FullSecurityEventParams {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  projectId?: string;
  targetProjectId?: string;
  module?: string;
  endpoint?: string;
  method?: string;
  actionAttempted?: string;
  resourceType?: string;
  resourceId?: string;
  payloadSummary?: string;
  fieldsAttempted?: string;
  rbacResult?: string;
  pbacResult?: string;
  dataClassification?: string;
  threatDetected?: string;
  systemResponse?: string;
  result?: string;
  status: string; // "BLOCKED", "ALLOWED", "CHALLENGED", etc.
  dataExposure?: string;
  adminActionRequired?: string;
  sourceIp?: string;
  userAgent?: string;
  sessionId?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  threatType: string;
  message?: string;
  simulated?: boolean;
  environment?: string;
}

export async function logFullSecurityEvent(data: FullSecurityEventParams) {
  try {
    const geoData = await enrichIpAddress(data.sourceIp);

    const event = await prisma.securityEvent.create({
      data: {
        userId: data.userId,
        userEmail: data.userEmail,
        userRole: data.userRole,
        projectId: data.projectId,
        targetProjectId: data.targetProjectId,
        module: data.module,
        endpoint: data.endpoint,
        method: data.method,
        actionAttempted: data.actionAttempted,
        resourceType: data.resourceType,
        resourceId: data.resourceId,
        payloadSummary: data.payloadSummary,
        fieldsAttempted: data.fieldsAttempted,
        rbacResult: data.rbacResult,
        pbacResult: data.pbacResult,
        dataClassification: data.dataClassification,
        threatDetected: data.threatDetected || data.threatType,
        systemResponse: data.systemResponse || 'Logged event',
        result: data.result || data.status,
        status: data.status,
        dataExposure: data.dataExposure || 'None',
        adminActionRequired: data.adminActionRequired || 'None required',
        sourceIp: geoData.ipAddress,
        country: geoData.country,
        city: geoData.city,
        region: geoData.region,
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        isp: geoData.isp,
        asn: geoData.asn,
        organization: geoData.organization,
        userAgent: data.userAgent,
        sessionId: data.sessionId,
        severity: data.severity,
        category: data.category,
        threatType: data.threatType,
        message: data.message,
        simulated: data.simulated || false,
        environment: data.environment || process.env.NODE_ENV || 'development',
        blocked: data.status === 'BLOCKED'
      }
    });

    // Update or create ThreatIp if it's a public IP
    if (data.sourceIp && data.sourceIp !== 'unknown' && geoData.country !== 'Localhost' && geoData.country !== 'Internal') {
      await prisma.threatIp.upsert({
        where: { ipAddress: data.sourceIp },
        create: {
          ipAddress: data.sourceIp,
          country: geoData.country,
          city: geoData.city,
          region: geoData.region,
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          isp: geoData.isp,
          asn: geoData.asn,
          organization: geoData.organization,
          attemptCount: 1,
          severity: data.severity,
          status: data.status === 'BLOCKED' ? 'Watching' : 'New',
        },
        update: {
          attemptCount: { increment: 1 },
          lastSeen: new Date(),
          severity: data.severity === 'CRITICAL' ? 'CRITICAL' : undefined, // Escalate if critical
        }
      });
    }

    return event;
  } catch (e) {
    console.error('Failed to log full security event:', e);
  }
}

export async function logCountermeasure(eventId: string, type: string, desc: string, result: string, userId?: string) {
  try {
    await prisma.countermeasureLog.create({
      data: {
        securityEventId: eventId,
        countermeasureType: type,
        description: desc,
        result: result,
        performedBySystem: !userId,
        performedByUserId: userId,
      }
    });
  } catch (e) {
    console.error('Failed to log countermeasure:', e);
  }
}

export async function createIncidentFromEvent(eventId: string, assignedTo?: string) {
  const event = await prisma.securityEvent.findUnique({ where: { id: eventId } });
  if (!event) return;

  const incident = await prisma.securityIncident.create({
    data: {
      title: `Incident: ${event.threatType} (${event.sourceIp || 'Unknown IP'})`,
      description: `Automatically created incident from security event. Message: ${event.message}`,
      severity: event.severity,
      status: 'New',
      affectedUserId: event.userId,
      affectedProjectId: event.projectId,
      affectedModule: event.module,
      sourceIp: event.sourceIp,
      countermeasure: event.systemResponse,
      result: event.result,
      dataExposure: event.dataExposure,
      assignedTo: assignedTo,
    }
  });

  await prisma.securityEvent.update({
    where: { id: eventId },
    data: { incidentId: incident.id }
  });

  return incident;
}

export async function logAIThreat(params: { userId: string, role?: string, projectScope?: string, query: string, threatDetected: string, blockedDocumentIds?: string }) {
  try {
    await prisma.aIQuerySecurityLog.create({
      data: {
        userId: params.userId,
        role: params.role,
        projectScope: params.projectScope,
        query: params.query,
        detectedThreat: params.threatDetected,
        blocked: true,
        blockedDocumentIds: params.blockedDocumentIds,
        responseStatus: 'Refused',
      }
    });

    await logFullSecurityEvent({
      userId: params.userId,
      userRole: params.role,
      projectId: params.projectScope,
      module: 'AI_COMMAND_CENTER',
      actionAttempted: 'AI_QUERY',
      threatDetected: params.threatDetected,
      systemResponse: 'AI refused response, restricted context removed',
      result: 'Blocked',
      status: 'BLOCKED',
      dataExposure: 'None',
      severity: 'HIGH',
      category: 'AI',
      threatType: 'AI Prompt Injection / Policy Violation',
      message: `AI query blocked due to: ${params.threatDetected}`
    });
  } catch (e) {
    console.error('Failed to log AI threat:', e);
  }
}

export async function logFileThreat(params: { fileId?: string, userId: string, projectId?: string, module?: string, action: string, filename: string, threatDetected: string, sourceIp?: string }) {
    try {
      await prisma.fileSecurityLog.create({
        data: {
          fileId: params.fileId,
          userId: params.userId,
          projectId: params.projectId,
          module: params.module,
          action: params.action,
          filename: params.filename,
          scanStatus: 'FAILED',
          threatDetected: params.threatDetected,
          countermeasure: 'Quarantined/Rejected',
        }
      });
  
      await logFullSecurityEvent({
        userId: params.userId,
        projectId: params.projectId,
        module: params.module || 'FILE_MANAGEMENT',
        actionAttempted: params.action,
        resourceId: params.fileId,
        threatDetected: params.threatDetected,
        systemResponse: 'File upload/download blocked',
        result: 'Blocked',
        status: 'BLOCKED',
        dataExposure: 'None',
        sourceIp: params.sourceIp,
        severity: 'HIGH',
        category: 'FILE',
        threatType: 'Suspicious File Activity',
        message: `File activity blocked: ${params.threatDetected} on ${params.filename}`
      });
    } catch (e) {
      console.error('Failed to log File threat:', e);
    }
  }

export async function logSensitiveExport(params: { userId: string, role?: string, projectId?: string, module: string, exportType: string, recordCount?: number, sourceIp?: string, allowed: boolean }) {
    try {
      await prisma.sensitiveExportLog.create({
        data: {
          userId: params.userId,
          role: params.role,
          projectId: params.projectId,
          module: params.module,
          exportType: params.exportType,
          recordCount: params.recordCount,
          sourceIp: params.sourceIp,
          approved: params.allowed,
          blocked: !params.allowed,
          reason: params.allowed ? 'Authorized' : 'Unauthorized Export Attempt'
        }
      });
  
      await logFullSecurityEvent({
        userId: params.userId,
        userRole: params.role,
        projectId: params.projectId,
        module: params.module,
        actionAttempted: 'EXPORT',
        systemResponse: params.allowed ? 'Export Allowed' : 'Export Blocked',
        result: params.allowed ? 'Allowed' : 'Blocked',
        status: params.allowed ? 'ALLOWED' : 'BLOCKED',
        dataExposure: params.allowed ? 'Confirmed' : 'None',
        sourceIp: params.sourceIp,
        severity: params.allowed ? 'INFO' : 'HIGH',
        category: 'DATA_EXFILTRATION',
        threatType: params.allowed ? 'Sensitive Export' : 'Unauthorized Export Attempt',
        message: `User attempted to export ${params.recordCount} records from ${params.module}`
      });
    } catch (e) {
      console.error('Failed to log Sensitive Export:', e);
    }
  }
