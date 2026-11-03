'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';


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

export async function deleteProjectSchedule(projectId: string) {
  try {
    await fetchWithAuth(`/api/scheduling/${projectId}`, {
      method: 'DELETE',
    });

    revalidatePath(`/projects/${projectId}/scheduling`);
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting schedule:', error);
    throw new Error(error.message || 'Failed to delete schedule');
  }
}
