'use server';

export async function clearCurrentSimulationRun(runId: string, archiveBeforeClear: boolean) {
  return {
    success: true,
    message: 'Mock simulation run cleared successfully.',
    runId,
    archived: archiveBeforeClear,
    clearedData: {
      events: 0,
      incidents: 0,
      countermeasures: 0
    }
  };
}

export async function clearAllSimulationRuns(archiveBeforeClear: boolean) {
  return {
    success: true,
    message: 'All mock simulation runs cleared successfully.',
    archived: archiveBeforeClear,
    clearedData: {
      runs: 0,
      events: 0,
      incidents: 0,
      countermeasures: 0
    }
  };
}
