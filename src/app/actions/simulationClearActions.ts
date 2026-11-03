'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
// This is a placeholder for `fetchWithAuth`. In a real application, this would typically
// handle authentication (e.g., attaching an auth token from a session or cookie),
// set default headers like 'Content-Type', and define the base URL for your backend.
async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetchAuthenticatedBackend(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown backend error' }));
    throw new Error(errorData.error || response.statusText);
  }
  return response;
}

const API_ROUTE_PREFIX = '/api/simulationClearActions';

export async function clearCurrentSimulationRun(runId: string, archiveBeforeClear: boolean) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/clearCurrentSimulationRun`, {
    method: 'POST',
    body: JSON.stringify({ runId, archiveBeforeClear }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to clear current simulation run.');
  }
  // The original file did not include revalidatePath/revalidateTag, so they are omitted here.
  return data;
}

export async function clearAllSimulationData(archiveBeforeClear: boolean) {
  const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/clearAllSimulationData`, {
    method: 'POST',
    body: JSON.stringify({ archiveBeforeClear }),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to clear all simulation data.');
  }
  // The original file did not include revalidatePath/revalidateTag, so they are omitted here.
  return data;
}