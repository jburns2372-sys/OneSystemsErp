import { prisma } from './prisma';
import { SecuritySimulationScenario, SecuritySimulationRun, SecurityEvent, SecurityIncident } from '@prisma/client';

export type SimulationMode = 'EVENT_ONLY' | 'CONTROLLED_NEGATIVE' | 'CAMPAIGN';

export interface SimulationResult {
  runId: string;
  success: boolean;
  message: string;
}

export class SimulationEngine {
  /**
   * Run a single scenario in the specified mode
   */
  static async runScenario(scenarioId: string, mode: SimulationMode, userId: string): Promise<SimulationResult> {
    const scenario = await prisma.securitySimulationScenario.findUnique({
      where: { id: scenarioId },
    });

    if (!scenario) {
      throw new Error(`Scenario not found: ${scenarioId}`);
    }

    // 1. Create the Simulation Run record
    const run = await prisma.securitySimulationRun.create({
      data: {
        scenarioId: scenario.id,
        runMode: mode,
        environment: process.env.NODE_ENV || 'development',
        status: 'RUNNING',
        initiatedBy: userId,
      },
    });

    try {
      if (mode === 'EVENT_ONLY') {
        await this.executeEventOnlySimulation(scenario, run.id, userId);
      } else if (mode === 'CONTROLLED_NEGATIVE') {
        throw new Error('Controlled Negative Testing Mode not yet implemented.');
      } else if (mode === 'CAMPAIGN') {
        throw new Error('Campaign Simulation Mode not yet implemented.');
      }

      // 2. Score and complete the run
      await this.scoreSimulationRun(run.id);

      return {
        runId: run.id,
        success: true,
        message: `Simulation ${scenario.name} completed successfully.`,
      };
    } catch (error: any) {
      // Handle failure
      await prisma.securitySimulationRun.update({
        where: { id: run.id },
        data: {
          status: 'FAILED',
          notes: error.message,
          overallResult: 'Failed',
        },
      });

      return {
        runId: run.id,
        success: false,
        message: `Simulation failed: ${error.message}`,
      };
    }
  }

  /**
   * Event-Only Mode: injects synthetic threats into the SOC pipeline without actual execution
   */
  private static async executeEventOnlySimulation(scenario: SecuritySimulationScenario, runId: string, userId: string) {
    // 1. Create a synthetic Security Event
    const event = await prisma.securityEvent.create({
      data: {
        severity: scenario.severity,
        category: scenario.category,
        threatType: scenario.name,
        sourceIp: scenario.simulatedSourceIp || '127.0.0.1',
        country: scenario.simulatedCountry || 'Simulated Country',
        city: scenario.simulatedCity || 'Simulated City',
        latitude: scenario.latitude || 0,
        longitude: scenario.longitude || 0,
        module: scenario.targetModule,
        endpoint: scenario.targetRoute || '/simulated/endpoint',
        actionAttempted: 'Simulated Attack',
        userRole: scenario.simulatedRole || 'UNKNOWN',
        userId: userId, // The user running the simulation is tracked as the target for safe testing
        simulated: true, // Safety flag
        simulationRunId: runId,
        status: 'DETECTED',
        threatDetected: scenario.expectedDetection || 'Simulated Threat Detected',
        systemResponse: scenario.expectedCountermeasure || 'Countermeasure applied',
        result: 'BLOCKED',
        blocked: true,
        expectedResponse: scenario.expectedCountermeasure,
        actualResponse: scenario.expectedCountermeasure, // In event-only, actual matches expected
        simulationPassed: true,
      },
    });

    // 2. Create Countermeasure Log
    if (scenario.expectedCountermeasure) {
      await prisma.countermeasureLog.create({
        data: {
          securityEventId: event.id,
          countermeasureType: 'SIMULATED_RESPONSE',
          description: `Simulated action: ${scenario.expectedCountermeasure}`,
          result: 'SUCCESS',
          passed: true,
          expectedResult: scenario.expectedCountermeasure,
          actualResult: scenario.expectedCountermeasure,
          responseTimeMs: Math.floor(Math.random() * 50) + 10, // Simulated 10-60ms response time
        },
      });
    }

    // 3. Create Incident if Severity is High/Critical
    if (scenario.severity === 'Critical' || scenario.severity === 'High') {
      await prisma.securityIncident.create({
        data: {
          title: `[SIMULATION] ${scenario.name}`,
          description: scenario.description || 'Simulated security incident.',
          severity: scenario.severity,
          status: 'OPEN',
          assignedTo: userId,
          affectedModule: scenario.targetModule,
          sourceIp: scenario.simulatedSourceIp,
          countermeasure: scenario.expectedCountermeasure,
          result: 'Mitigated',
          linkedSimulationRunId: runId,
          timelineJson: JSON.stringify([
            { time: new Date().toISOString(), event: 'Threat Detected', details: scenario.expectedDetection },
            { time: new Date().toISOString(), event: 'Countermeasure Applied', details: scenario.expectedCountermeasure },
          ]),
          evidenceJson: JSON.stringify({
            scenarioId: scenario.id,
            mitreTechnique: scenario.mitreTechnique,
            owaspCategory: scenario.owaspCategory,
          }),
        },
      });
    }
  }

  /**
   * Evaluates the simulation run to generate SOC Readiness scores
   */
  private static async scoreSimulationRun(runId: string) {
    const run = await prisma.securitySimulationRun.findUnique({
      where: { id: runId },
      include: {
        events: true,
        incidents: true,
      },
    });

    if (!run) return;

    // In event-only mode, it's 100% since we directly inject it.
    // In controlled negative testing, we would calculate this based on what the system *actually* did.
    let detectionScore = 100;
    let responseScore = 100;
    let evidenceScore = 100;

    if (run.events.length === 0) detectionScore = 0;
    if (run.runMode !== 'EVENT_ONLY') {
        // Logic for evaluating real responses goes here later
    }

    const finalScore = (detectionScore + responseScore + evidenceScore) / 3;

    await prisma.securitySimulationRun.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        detectionScore,
        responseScore,
        evidenceScore,
        finalScore,
        overallResult: finalScore > 80 ? 'Passed' : 'Failed',
      },
    });
  }
}
