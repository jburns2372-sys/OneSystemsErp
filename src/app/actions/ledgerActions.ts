'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';

async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  return fetchAuthenticatedBackend(url, options);
}

export async function getProjectCostLedger(projectId: string) {
  try {
    const response = await fetchWithAuth('/api/ledgerActions/getProjectCostLedger', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || response.statusText || 'Unknown error during fetch');
    }

    return result;
  } catch (error: any) {
    console.error('Next.js Server Action: Failed to fetch project cost ledger:', error);
    return { success: false, error: error.message || 'Failed to retrieve project cost ledger.' };
  }
}