'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import {
  buildUnavailableDashboardStats,
  classifyDashboardBackendFailure,
  normalizeLiveDashboardStats,
} from '@/lib/dashboardStatsState';
import { revalidatePath } from 'next/cache';


async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchAuthenticatedBackend(endpoint, options);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.error || parsed.message || errorText;
    } catch {
      // non-JSON error body
    }
    const err = new Error(errorMessage || `Backend Error: ${response.status} ${response.statusText}`) as Error & {
      httpStatus?: number;
    };
    err.httpStatus = response.status;
    throw err;
  }

  try {
    return await response.json();
  } catch {
    const parseErr = new Error('Invalid JSON payload from backend') as Error & {
      isInvalidPayload?: boolean;
    };
    parseErr.isInvalidPayload = true;
    throw parseErr;
  }
}

export async function getDashboardStats() {
  try {
    const payload = await fetchWithAuth('/api/projects/dashboard-stats');
    return normalizeLiveDashboardStats(payload);
  } catch (error) {
    const diagnosticCode = classifyDashboardBackendFailure(error);
    console.error('Failed to fetch dashboard stats from backend');
    return buildUnavailableDashboardStats(diagnosticCode);
  }
}

export async function assignProjectManager(projectId: string, managerId: string | null) {
  try {
    return await fetchWithAuth(`/api/projects/${projectId}/assign-manager`, {
      method: 'POST',
      body: JSON.stringify({ managerId })
    });
  } catch {
    console.error('Error assigning manager');
    return { success: false, error: 'Failed to assign manager' };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const res = await fetchWithAuth(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    revalidatePath('/projects');
    return res;
  } catch {
    console.error('Error deleting project');
    return { success: false, error: 'Failed to delete project' };
  }
}

export async function updateProjectDates(projectId: string, startDateStr: string, durationDays: number) {
  try {
    return await fetchWithAuth(`/api/projects/${projectId}/dates`, {
      method: 'POST',
      body: JSON.stringify({ startDateStr, durationDays })
    });
  } catch {
    console.error('Error updating project dates');
    return { success: false, error: 'Failed to update project dates' };
  }
}
