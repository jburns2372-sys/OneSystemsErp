export enum SimulationMode {
  STEALTH = 'STEALTH',
  LOUD = 'LOUD',
  HYBRID = 'HYBRID'
}

export class SimulationEngine {
  static async runScenario(scenarioId: string, mode: SimulationMode, userId: string) {
    return {
      success: true,
      runId: 'mock-run-id',
      overallResult: 'Passed'
    };
  }
}
