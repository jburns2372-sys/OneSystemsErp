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

  return [];
}

export async function getSimulationStats() {
  const currentUser = await prisma.user.findFirst();
  if (!currentUser) throw new Error('Unauthorized');

  return {
    runsToday: 0,
    passedRuns: 0,
    failedRuns: 0,
    readinessScore: 0,
    detectionScore: 0,
    responseScore: 0,
    evidenceScore: 0,
  };
}

export async function getRecentSimulationRuns() {
  return [];
}
