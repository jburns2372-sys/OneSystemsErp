'use server';

import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/permissions';
import { cookies } from 'next/headers';

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get('session')?.value || '';
}

// ------------------------------------------------------------------
// EQUIPMENT REGISTRY ACTIONS
// ------------------------------------------------------------------

export async function getEquipmentList() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');
  
  return prisma.equipment.findMany({
    orderBy: { name: 'asc' },
    include: {
      deployments: {
        where: { status: 'ACTIVE' },
        include: { project: { select: { id: true, name: true } } }
      }
    }
  });
}

export async function createEquipment(data: any) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canCreate');
  
  return prisma.equipment.create({
    data
  });
}

// ------------------------------------------------------------------
// TELEMETRY & FMS ACTIONS
// ------------------------------------------------------------------

export async function getActiveTelemetry() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');
  
  // Get all equipment that has an FMS Device ID
  const fleet = await prisma.equipment.findMany({
    where: { fmsDeviceId: { not: null } },
    include: {
      telemetry: {
        orderBy: { timestamp: 'desc' },
        take: 1
      },
      deployments: {
        where: { status: 'ACTIVE' },
        include: { project: { select: { name: true } } }
      }
    }
  });

  return fleet;
}

export async function getFleetStats() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const totalVehicles = await prisma.equipment.count({
    where: { fmsDeviceId: { not: null } }
  });

  const activeNow = await prisma.equipmentTelemetry.count({
    where: {
      engineState: 'MOVING',
      timestamp: { gte: new Date(Date.now() - 3600000) } // Last hour
    }
  });

  // Calculate total engine hours across fleet
  const fleet = await prisma.equipment.findMany({
    where: { fmsDeviceId: { not: null } },
    select: { lastEngineHours: true }
  });
  const totalEngineHours = fleet.reduce((sum, eq) => sum + (eq.lastEngineHours || 0), 0);

  // Find equipment with fault codes in the latest telemetry
  const faultEvents = await prisma.equipmentTelemetry.count({
    where: {
      faultCodes: { not: null },
      timestamp: { gte: new Date(Date.now() - 86400000) } // Last 24 hours
    }
  });

  return {
    totalVehicles,
    activeNow,
    totalEngineHours,
    faultEvents
  };
}

// ------------------------------------------------------------------
// DEPLOYMENT WORKFLOW ACTIONS
// ------------------------------------------------------------------

export async function getDeploymentOptions() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');
  
  const [equipment, projects, workers] = await Promise.all([
    prisma.equipment.findMany({ select: { id: true, code: true, name: true, category: true, status: true } }),
    prisma.project.findMany({ where: { status: 'ACTIVE' }, select: { id: true, name: true } }),
    prisma.worker.findMany({ where: { employmentStatus: 'ACTIVE' }, select: { id: true, firstName: true, lastName: true, designation: true } })
  ]);
  
  return { equipment, projects, workers };
}

export async function getDeployments() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');
  
  return prisma.equipmentDeployment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      equipment: { select: { code: true, name: true } },
      project: { select: { name: true } },
      driver: { select: { firstName: true, lastName: true } },
      requestedBy: { select: { name: true } },
      approvedBy: { select: { name: true } }
    }
  });
}

export async function requestDeployment(payload: any) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canCreate');
  
  const { equipmentId, targetDate, expectedReturnDate, purpose, destinationAddress, destinationLat, destinationLng } = payload;
  const projectId = payload.projectId;
  const driverId = payload.driverId;

  // Conflict Detection
  const start = new Date(targetDate);
  const end = expectedReturnDate ? new Date(expectedReturnDate) : null;
  
  const overlaps = await prisma.equipmentDeployment.findMany({
    where: {
      equipmentId,
      status: { in: ['APPROVED', 'DISPATCHED'] },
      OR: [
        {
          targetDate: { lte: end || start },
          expectedReturnDate: { gte: start }
        }
      ]
    }
  });

  if (overlaps.length > 0) {
    throw new Error('Equipment is already deployed or approved for deployment during these dates.');
  }

  return prisma.equipmentDeployment.create({
    data: {
      equipmentId,
      projectId,
      driverId: driverId || null,
      targetDate: start,
      expectedReturnDate: end,
      purpose,
      destinationAddress,
      destinationLat,
      destinationLng,
      status: 'REQUESTED',
      requestedById: userId,
    }
  });
}

export async function updateDeploymentStatus(id: string, newStatus: string) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canEdit');
  
  const updateData: any = { status: newStatus };
  
  if (newStatus === 'APPROVED') {
    updateData.approvedById = userId;
  } else if (newStatus === 'DISPATCHED') {
    updateData.dateDeployed = new Date();
    // Update equipment status to DEPLOYED
    const dep = await prisma.equipmentDeployment.findUnique({ where: { id } });
    if (dep) {
      await prisma.equipment.update({ where: { id: dep.equipmentId }, data: { status: 'DEPLOYED' } });
    }
  } else if (newStatus === 'RETURNED') {
    updateData.dateReturned = new Date();
    // Update equipment status back to ACTIVE
    const dep = await prisma.equipmentDeployment.findUnique({ where: { id } });
    if (dep) {
      await prisma.equipment.update({ where: { id: dep.equipmentId }, data: { status: 'ACTIVE' } });
    }
  }

  return prisma.equipmentDeployment.update({
    where: { id },
    data: updateData,
    include: {
      equipment: { select: { code: true, name: true } },
      project: { select: { name: true } },
      driver: { select: { firstName: true, lastName: true } }
    }
  });
}

// ------------------------------------------------------------------
// UTILIZATION LOG ACTIONS (Synchronized with all equipment modules)
// ------------------------------------------------------------------

export async function getUtilizationLogs(filters?: {
  equipmentId?: string;
  projectId?: string;
  source?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const where: any = {};
  if (filters?.equipmentId) where.equipmentId = filters.equipmentId;
  if (filters?.projectId) where.projectId = filters.projectId;
  if (filters?.source) where.source = filters.source;
  if (filters?.dateFrom || filters?.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
  }

  return prisma.equipmentUtilization.findMany({
    where,
    orderBy: { date: 'desc' },
    include: {
      equipment: { select: { id: true, code: true, name: true, category: true, lastEngineHours: true, hourlyRate: true } },
      project: { select: { id: true, name: true } }
    }
  });
}

export async function getUtilizationOptions() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const [equipment, projects] = await Promise.all([
    prisma.equipment.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        category: true,
        status: true,
        lastEngineHours: true,
        fmsDeviceId: true,
        fmsProvider: true,
        deployments: {
          where: { status: { in: ['DISPATCHED', 'APPROVED'] } },
          include: { project: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { code: 'asc' }
    }),
    prisma.project.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true, name: true }
    })
  ]);

  return { equipment, projects };
}

export async function createUtilizationLog(data: {
  equipmentId: string;
  projectId: string;
  date: string;
  hoursUsed: number;
  fuelConsumed: number;
  taskDescription?: string;
}) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canCreate');

  const { equipmentId, projectId, date, hoursUsed, fuelConsumed, taskDescription } = data;

  // Create utilization log
  const log = await prisma.equipmentUtilization.create({
    data: {
      equipmentId,
      projectId,
      date: new Date(date),
      hoursUsed,
      fuelConsumed,
      taskDescription: taskDescription || null,
      loggedBy: userId,
      source: 'MANUAL'
    },
    include: {
      equipment: { select: { code: true, name: true } },
      project: { select: { name: true } }
    }
  });

  // SYNC: Update Equipment Registry with cumulative engine hours
  const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
  if (equipment) {
    const newTotalHours = (equipment.lastEngineHours || 0) + hoursUsed;
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { lastEngineHours: newTotalHours }
    });
  }

  return log;
}

export async function syncUtilizationFromFMS(equipmentId: string) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canCreate');

  // Get the equipment and its latest telemetry
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    include: {
      telemetry: { orderBy: { timestamp: 'desc' }, take: 1 },
      deployments: {
        where: { status: { in: ['DISPATCHED', 'APPROVED'] } },
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { project: { select: { id: true, name: true } } }
      }
    }
  });

  if (!equipment) throw new Error('Equipment not found');
  if (!equipment.fmsDeviceId) throw new Error('Equipment is not connected to an FMS device');
  if (!equipment.telemetry || equipment.telemetry.length === 0) {
    throw new Error('No telemetry data available for this equipment');
  }

  const latestTelemetry = equipment.telemetry[0];
  const activeDeployment = equipment.deployments[0];

  if (!activeDeployment) {
    throw new Error('Equipment has no active deployment. Assign it to a project first.');
  }

  // Calculate delta hours from last known value
  const telemetryHours = latestTelemetry.engineHours || 0;
  const previousHours = equipment.lastEngineHours || 0;
  const deltaHours = Math.max(0, telemetryHours - previousHours);

  // Create FMS_AUTO utilization log
  const log = await prisma.equipmentUtilization.create({
    data: {
      equipmentId,
      projectId: activeDeployment.projectId,
      date: latestTelemetry.timestamp,
      hoursUsed: deltaHours,
      fuelConsumed: latestTelemetry.fuelLevel || 0,
      taskDescription: `Auto-synced from FMS (${equipment.fmsProvider || 'Unknown'}) — Engine: ${latestTelemetry.engineState || 'N/A'}, Speed: ${latestTelemetry.speed?.toFixed(1) || '0'} km/h`,
      loggedBy: userId,
      source: 'FMS_AUTO'
    },
    include: {
      equipment: { select: { code: true, name: true } },
      project: { select: { name: true } }
    }
  });

  // SYNC: Update Equipment Registry engine hours
  if (telemetryHours > previousHours) {
    await prisma.equipment.update({
      where: { id: equipmentId },
      data: { lastEngineHours: telemetryHours }
    });
  }

  return log;
}

export async function deleteUtilizationLog(id: string) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canEdit');

  // Get the log first to reverse the engine hours on the equipment
  const log = await prisma.equipmentUtilization.findUnique({ where: { id } });
  if (!log) throw new Error('Utilization log not found');

  // SYNC: Reverse the engine hours from the Equipment Registry
  const equipment = await prisma.equipment.findUnique({ where: { id: log.equipmentId } });
  if (equipment) {
    const correctedHours = Math.max(0, (equipment.lastEngineHours || 0) - log.hoursUsed);
    await prisma.equipment.update({
      where: { id: log.equipmentId },
      data: { lastEngineHours: correctedHours }
    });
  }

  return prisma.equipmentUtilization.delete({ where: { id } });
}

export async function getUtilizationSummary() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  // Current month range
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const allLogs = await prisma.equipmentUtilization.findMany({
    where: { date: { gte: startOfMonth, lte: endOfMonth } },
    include: {
      equipment: { select: { code: true, name: true, hourlyRate: true } }
    }
  });

  const totalHours = allLogs.reduce((sum, l) => sum + l.hoursUsed, 0);
  const totalFuel = allLogs.reduce((sum, l) => sum + l.fuelConsumed, 0);
  const totalCost = allLogs.reduce((sum, l) => sum + (l.hoursUsed * (l.equipment.hourlyRate || 0)), 0);
  const manualCount = allLogs.filter(l => l.source === 'MANUAL').length;
  const fmsCount = allLogs.filter(l => l.source === 'FMS_AUTO').length;

  // Top utilized equipment this month
  const byEquipment: Record<string, { code: string; name: string; hours: number }> = {};
  for (const log of allLogs) {
    const key = log.equipmentId;
    if (!byEquipment[key]) {
      byEquipment[key] = { code: log.equipment.code, name: log.equipment.name, hours: 0 };
    }
    byEquipment[key].hours += log.hoursUsed;
  }
  const topEquipment = Object.values(byEquipment).sort((a, b) => b.hours - a.hours).slice(0, 5);

  return {
    totalLogs: allLogs.length,
    totalHours,
    totalFuel,
    totalCost,
    manualCount,
    fmsCount,
    topEquipment
  };
}

// ------------------------------------------------------------------
// MAINTENANCE & REPAIR ACTIONS (Synchronized with Equipment Registry)
// ------------------------------------------------------------------

export async function getMaintenanceLogs(filters?: {
  equipmentId?: string;
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const where: any = {};
  if (filters?.equipmentId) where.equipmentId = filters.equipmentId;
  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.dateFrom || filters?.dateTo) {
    where.scheduledDate = {};
    if (filters.dateFrom) where.scheduledDate.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.scheduledDate.lte = new Date(filters.dateTo);
  }

  return prisma.equipmentMaintenance.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      equipment: { select: { id: true, code: true, name: true, category: true, status: true, lastEngineHours: true } }
    }
  });
}

export async function getMaintenanceOptions() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const equipment = await prisma.equipment.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      status: true,
      lastEngineHours: true,
      fmsDeviceId: true,
      telemetry: {
        orderBy: { timestamp: 'desc' },
        take: 1,
        select: { faultCodes: true, engineHours: true, timestamp: true }
      }
    },
    orderBy: { code: 'asc' }
  });

  return { equipment };
}

export async function createMaintenance(data: {
  equipmentId: string;
  type: string;
  scheduledDate: string;
  description?: string;
  cost?: number;
  fmsFaultCode?: string;
}) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canCreate');

  const { equipmentId, type, scheduledDate, description, cost, fmsFaultCode } = data;

  const record = await prisma.equipmentMaintenance.create({
    data: {
      equipmentId,
      type,
      scheduledDate: new Date(scheduledDate),
      description: description || null,
      cost: cost || 0,
      fmsFaultCode: fmsFaultCode || null,
      status: 'SCHEDULED'
    },
    include: {
      equipment: { select: { code: true, name: true } }
    }
  });

  return record;
}

export async function updateMaintenanceStatus(id: string, newStatus: string, completionData?: { cost?: number; description?: string }) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canEdit');

  const maintenance = await prisma.equipmentMaintenance.findUnique({ where: { id } });
  if (!maintenance) throw new Error('Maintenance record not found');

  const updateData: any = { status: newStatus };

  if (newStatus === 'IN_PROGRESS') {
    // SYNC: Set equipment status to MAINTENANCE
    await prisma.equipment.update({
      where: { id: maintenance.equipmentId },
      data: { status: 'MAINTENANCE' }
    });
  } else if (newStatus === 'COMPLETED') {
    updateData.completedDate = new Date();
    if (completionData?.cost !== undefined) updateData.cost = completionData.cost;
    if (completionData?.description) updateData.description = completionData.description;

    // SYNC: Set equipment status back to ACTIVE
    await prisma.equipment.update({
      where: { id: maintenance.equipmentId },
      data: { status: 'ACTIVE' }
    });
  }

  return prisma.equipmentMaintenance.update({
    where: { id },
    data: updateData,
    include: {
      equipment: { select: { code: true, name: true, status: true } }
    }
  });
}

export async function deleteMaintenance(id: string) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canEdit');

  const record = await prisma.equipmentMaintenance.findUnique({ where: { id } });
  if (!record) throw new Error('Maintenance record not found');

  // If it was IN_PROGRESS, restore equipment status
  if (record.status === 'IN_PROGRESS') {
    await prisma.equipment.update({
      where: { id: record.equipmentId },
      data: { status: 'ACTIVE' }
    });
  }

  return prisma.equipmentMaintenance.delete({ where: { id } });
}

export async function getMaintenanceSummary() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const [scheduled, inProgress, completed, allRecords] = await Promise.all([
    prisma.equipmentMaintenance.count({ where: { status: 'SCHEDULED' } }),
    prisma.equipmentMaintenance.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.equipmentMaintenance.count({ where: { status: 'COMPLETED' } }),
    prisma.equipmentMaintenance.findMany({
      select: { cost: true, type: true, status: true }
    })
  ]);

  const totalCost = allRecords.reduce((sum, r) => sum + r.cost, 0);
  const preventiveCount = allRecords.filter(r => r.type === 'PREVENTIVE').length;
  const repairCount = allRecords.filter(r => r.type === 'REPAIR').length;

  // Overdue: scheduled date in the past but still SCHEDULED
  const overdue = await prisma.equipmentMaintenance.count({
    where: {
      status: 'SCHEDULED',
      scheduledDate: { lt: new Date() }
    }
  });

  return {
    scheduled,
    inProgress,
    completed,
    overdue,
    totalCost,
    preventiveCount,
    repairCount,
    totalRecords: allRecords.length
  };
}

// ------------------------------------------------------------------
// AI SAFETY & DIAGNOSTICS ACTIONS
// ------------------------------------------------------------------

export async function getAIValidations(filters?: {
  type?: string;
  severity?: string;
  status?: string;
}) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const where: any = {};
  if (filters?.type) where.type = filters.type;
  if (filters?.severity) where.severity = filters.severity;
  if (filters?.status) where.status = filters.status;

  return prisma.equipmentAIValidation.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      equipment: { select: { id: true, code: true, name: true, category: true, status: true, lastEngineHours: true } }
    }
  });
}

export async function updateAIValidationStatus(id: string, newStatus: string) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canEdit');

  return prisma.equipmentAIValidation.update({
    where: { id },
    data: { status: newStatus },
    include: {
      equipment: { select: { code: true, name: true } }
    }
  });
}

export async function getFleetSafetyEvents(limit?: number) {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  return prisma.fleetEvent.findMany({
    orderBy: { eventTime: 'desc' },
    take: limit || 50,
    include: {
      equipment: { select: { code: true, name: true } },
      driver: { select: { firstName: true, lastName: true } },
      aiReviews: { select: { aiSummary: true, aiRiskScore: true, aiRecommendation: true } }
    }
  });
}

export async function getAIDashboardStats() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canView');

  const [openFindings, resolvedFindings, criticalFindings, highFindings, safetyEvents] = await Promise.all([
    prisma.equipmentAIValidation.count({ where: { status: 'OPEN' } }),
    prisma.equipmentAIValidation.count({ where: { status: 'RESOLVED' } }),
    prisma.equipmentAIValidation.count({ where: { severity: 'CRITICAL', status: 'OPEN' } }),
    prisma.equipmentAIValidation.count({ where: { severity: 'HIGH', status: 'OPEN' } }),
    prisma.fleetEvent.count({
      where: {
        status: { in: ['NEW', 'ACKNOWLEDGED'] },
        eventTime: { gte: new Date(Date.now() - 7 * 86400000) } // Last 7 days
      }
    })
  ]);

  return {
    openFindings,
    resolvedFindings,
    criticalFindings,
    highFindings,
    safetyEvents
  };
}

export async function runAIDiagnostics() {
  const userId = await getUserId();
  await requirePermission(userId, 'EQUIPMENT', 'canCreate');

  // Fetch all cross-module data for analysis
  const equipment = await prisma.equipment.findMany({
    include: {
      telemetry: { orderBy: { timestamp: 'desc' }, take: 1 },
      maintenances: { orderBy: { createdAt: 'desc' }, take: 3 },
      utilizations: { orderBy: { date: 'desc' }, take: 30 },
      deployments: { where: { status: { in: ['DISPATCHED', 'APPROVED'] } }, take: 1 }
    }
  });

  const findings: { equipmentId: string; type: string; severity: string; findings: string; recommendations: string }[] = [];

  for (const eq of equipment) {
    const latestTelemetry = eq.telemetry[0] || null;
    const lastMaintenance = eq.maintenances[0] || null;
    const recentUtils = eq.utilizations;
    const engineHours = eq.lastEngineHours || 0;

    // ─── CHECK 1: Active Fault Codes → CRITICAL/HIGH ───
    if (latestTelemetry?.faultCodes && latestTelemetry.faultCodes !== '[]' && latestTelemetry.faultCodes !== 'null') {
      findings.push({
        equipmentId: eq.id,
        type: 'PREDICTIVE_MAINTENANCE',
        severity: 'CRITICAL',
        findings: `Active Diagnostic Trouble Codes detected: ${latestTelemetry.faultCodes}. Equipment [${eq.code}] "${eq.name}" is reporting fault conditions from FMS telemetry recorded at ${latestTelemetry.timestamp.toISOString()}.`,
        recommendations: `Immediately schedule a diagnostic inspection and repair. Take equipment offline if fault codes indicate safety-critical systems (engine, brakes, hydraulics). Cross-reference DTC codes with manufacturer service manual.`
      });
    }

    // ─── CHECK 2: Engine Hours Threshold Without Maintenance ───
    const lastMaintDate = lastMaintenance?.completedDate || lastMaintenance?.scheduledDate;
    const hoursSinceLastMaint = lastMaintDate
      ? (Date.now() - new Date(lastMaintDate).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (engineHours > 250 && hoursSinceLastMaint > 90) {
      findings.push({
        equipmentId: eq.id,
        type: 'PREDICTIVE_MAINTENANCE',
        severity: engineHours > 500 ? 'HIGH' : 'MEDIUM',
        findings: `Equipment [${eq.code}] "${eq.name}" has accumulated ${engineHours.toFixed(0)} engine hours with no maintenance in the last ${Math.floor(hoursSinceLastMaint)} days. Industry standard recommends servicing every 250 hours or 90 days.`,
        recommendations: `Schedule preventive maintenance immediately. Perform oil change, filter replacement, and general inspection. Equipment at this utilization level is at risk of accelerated wear if maintenance is deferred.`
      });
    }

    // ─── CHECK 3: Utilization Anomalies ───
    if (recentUtils.length >= 5) {
      const avgHours = recentUtils.reduce((s, u) => s + u.hoursUsed, 0) / recentUtils.length;
      const avgFuel = recentUtils.reduce((s, u) => s + u.fuelConsumed, 0) / recentUtils.length;

      // Detect fuel anomaly: fuel per hour significantly above average
      if (avgHours > 0 && avgFuel > 0) {
        const fuelPerHour = avgFuel / avgHours;
        // Flag if fuel consumption is unusually high (> 8 L/hr for heavy equipment is suspicious)
        if (fuelPerHour > 8 && eq.category === 'HEAVY') {
          findings.push({
            equipmentId: eq.id,
            type: 'FUEL_AUDIT',
            severity: 'MEDIUM',
            findings: `Equipment [${eq.code}] "${eq.name}" shows average fuel consumption of ${fuelPerHour.toFixed(1)} L/hr over the last ${recentUtils.length} logs. This is above the typical range for ${eq.category} equipment.`,
            recommendations: `Investigate potential causes: fuel line leaks, injector problems, operator behavior (excessive idling), or possible fuel pilferage. Compare with FMS telemetry fuel levels if available.`
          });
        }
      }

      // Detect overutilization: consistently more than 12 hrs/day
      const highUtilDays = recentUtils.filter(u => u.hoursUsed > 12).length;
      if (highUtilDays >= 3) {
        findings.push({
          equipmentId: eq.id,
          type: 'UTILIZATION_AUDIT',
          severity: 'MEDIUM',
          findings: `Equipment [${eq.code}] "${eq.name}" was operated for more than 12 hours/day on ${highUtilDays} of the last ${recentUtils.length} recorded days. This exceeds safe operating thresholds and accelerates component wear.`,
          recommendations: `Review operator shift schedules. Consider rotating equipment or deploying additional units to distribute workload. Excessive utilization without rest periods increases risk of mechanical failure.`
        });
      }
    }

    // ─── CHECK 4: Idle Equipment (Deployed but no recent utilization) ───
    if (eq.deployments.length > 0 && eq.status === 'DEPLOYED') {
      const lastUtil = recentUtils[0];
      const daysSinceLastUtil = lastUtil
        ? (Date.now() - new Date(lastUtil.date).getTime()) / (1000 * 60 * 60 * 24)
        : 999;

      if (daysSinceLastUtil > 14) {
        findings.push({
          equipmentId: eq.id,
          type: 'UTILIZATION_AUDIT',
          severity: 'LOW',
          findings: `Equipment [${eq.code}] "${eq.name}" is currently deployed but has no utilization logs in the last ${Math.floor(daysSinceLastUtil)} days. This may indicate idle equipment or missing log entries.`,
          recommendations: `Verify with the project site if the equipment is actively being used. If idle, consider recalling and redeploying to a project that needs it. Ensure operators are logging daily utilization.`
        });
      }
    }
  }

  // Deduplicate: don't create findings that already exist as OPEN for the same equipment+type
  const existingOpen = await prisma.equipmentAIValidation.findMany({
    where: { status: 'OPEN' },
    select: { equipmentId: true, type: true }
  });
  const existingKeys = new Set(existingOpen.map(e => `${e.equipmentId}::${e.type}`));

  const newFindings = findings.filter(f => !existingKeys.has(`${f.equipmentId}::${f.type}`));

  // Batch create
  if (newFindings.length > 0) {
    await prisma.equipmentAIValidation.createMany({
      data: newFindings.map(f => ({
        equipmentId: f.equipmentId,
        type: f.type,
        severity: f.severity,
        findings: f.findings,
        recommendations: f.recommendations,
        status: 'OPEN'
      }))
    });
  }

  return {
    analyzed: equipment.length,
    newFindings: newFindings.length,
    skippedDuplicates: findings.length - newFindings.length
  };
}
