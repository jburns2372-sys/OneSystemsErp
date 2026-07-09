'use server';

import { cookies } from 'next/headers';

const BACKEND_URL = process.env.AWS_BACKEND_URL || 'http://localhost:4000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const activeProjectId = cookieStore.get('activeProjectId')?.value;
  const simulatedRole = cookieStore.get('simulatedRole')?.value;

  const headers = new Headers(options.headers);
  if (session) headers.set('x-user-session', session);
  if (activeProjectId) headers.set('x-active-project-id', activeProjectId);
  if (simulatedRole) headers.set('x-simulated-role', simulatedRole);
  headers.set('Content-Type', 'application/json');

  const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Backend Error: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function getDashboardStats() {
  return fetchWithAuth('/api/projects/dashboard-stats');
}

export async function assignProjectManager(projectId: string, managerId: string | null) {
  return fetchWithAuth(`/api/projects/${projectId}/assign-manager`, {
    method: 'POST',
    body: JSON.stringify({ managerId })
  });
}

export async function deleteProject(projectId: string) {
  try {
    return await fetchWithAuth(`/api/projects/${projectId}`, {
      method: 'DELETE'
    });
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
