'use server';

import { prisma } from '@/lib/prisma';
import { SimulationEngine, SimulationMode } from '@/lib/simulationEngine';

export async function runSimulationScenario(scenarioId: string, mode: SimulationMode) {
  // Mock current user
  const currentUser = await prisma.user.findFirst();
  if (!currentUser) throw new Error('Unauthorized');
  
  // For demo, assume SUPER_ADMIN role
  const role = 'SUPER_ADMIN';

  // Check roles: Only Super Admin, Security Officer, SOC Manager, Developer Admin
  const allowedRoles = ['SUPER_ADMIN', 'SECURITY_OFFICER', 'SOC_MANAGER', 'DEVELOPER_ADMIN'];
  if (!allowedRoles.includes(role)) {
    throw new Error('Forbidden: You do not have permission to run security simulations.');
  }

  return await SimulationEngine.runScenario(scenarioId, mode, currentUser.id);
}

export async function getSimulationScenarios() {
  const currentUser = await prisma.user.findFirst();
  if (!currentUser) throw new Error('Unauthorized');

  return await prisma.securitySimulationScenario.findMany({
    orderBy: { category: 'asc' },
  });
}

export async function getSimulationStats() {
  const currentUser = await prisma.user.findFirst();
  if (!currentUser) throw new Error('Unauthorized');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const runsToday = await prisma.securitySimulationRun.count({
    where: { startedAt: { gte: today } },
  });

  const passedRuns = await prisma.securitySimulationRun.count({
    where: { 
      startedAt: { gte: today },
      overallResult: 'Passed'
    },
  });

  const failedRuns = await prisma.securitySimulationRun.count({
    where: { 
      startedAt: { gte: today },
      overallResult: 'Failed'
    },
  });

  const allRuns = await prisma.securitySimulationRun.findMany({
    where: { status: 'COMPLETED' },
    select: { finalScore: true, detectionScore: true, responseScore: true, evidenceScore: true },
  });

  let avgFinalScore = 0;
  let avgDetectionScore = 0;
  let avgResponseScore = 0;
  let avgEvidenceScore = 0;

  if (allRuns.length > 0) {
    avgFinalScore = allRuns.reduce((sum, run) => sum + (run.finalScore || 0), 0) / allRuns.length;
    avgDetectionScore = allRuns.reduce((sum, run) => sum + (run.detectionScore || 0), 0) / allRuns.length;
    avgResponseScore = allRuns.reduce((sum, run) => sum + (run.responseScore || 0), 0) / allRuns.length;
    avgEvidenceScore = allRuns.reduce((sum, run) => sum + (run.evidenceScore || 0), 0) / allRuns.length;
  }

  return {
    runsToday,
    passedRuns,
    failedRuns,
    readinessScore: avgFinalScore,
    detectionScore: avgDetectionScore,
    responseScore: avgResponseScore,
    evidenceScore: avgEvidenceScore,
  };
}
