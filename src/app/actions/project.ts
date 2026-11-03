'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';
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
    throw new Error(errorMessage || `Backend Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getDashboardStats() {
  try {
    return await fetchWithAuth('/api/projects/dashboard-stats');
  } catch (error) {
    console.error('Failed to fetch dashboard stats from backend:', error);
    return {
      pendingAIOverrides: 0,
      totalProjects: 0,
      totalBudget: 0,
      totalPayables: 0,
      totalAccomplishments: 0,
      pendingMRFs: 0,
      pendingPettyCash: 0,
      activePayrollPeriods: 0,
      openCanvassing: 0,
      activePurchaseOrders: 0,
      expectedDeliveries: 0,
      totalIssuances: 0,
      totalSuppliers: 0,
      totalWorkers: 0,
      totalUsers: 0,
      totalAuditLogs: 0,
      totalDailyLogs: 0,
      totalJobOrders: 0
    };
  }
}

export async function assignProjectManager(projectId: string, managerId: string | null) {
  return fetchWithAuth(`/api/projects/${projectId}/assign-manager`, {
    method: 'POST',
    body: JSON.stringify({ managerId })
  });
}

export async function deleteProject(projectId: string) {
  try {
    const res = await fetchWithAuth(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
    revalidatePath('/projects');
    return res;
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message || 'Failed to delete project' };
  }
}

export async function updateProjectDates(projectId: string, startDateStr: string, durationDays: number) {
  try {
    return await fetchWithAuth(`/api/projects/${projectId}/dates`, {
      method: 'POST',
      body: JSON.stringify({ startDateStr, durationDays })
    });
  } catch (error: any) {
    console.error('Error updating project dates:', error);
    return { success: false, error: error.message || 'Failed to update project dates' };
  }
}
