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

export async function getConsolidatedItemsForIssuance(projectId: string) {
  return await fetchWithAuth(`/api/issuance/consolidated-items/${projectId}`);
}

export async function createIssuanceSlip(data: any) {
  const result = await fetchWithAuth('/api/issuance/create', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (result.success) {
    revalidatePath('/material-issuance');
  }

  return result;
}

export async function processIssuanceSlip(issuanceId: string, warehousemanId: string, itemsData: any[]) {
  const result = await fetchWithAuth(`/api/issuance/${issuanceId}/process`, {
    method: 'POST',
    body: JSON.stringify({ warehousemanId, itemsData })
  });

  if (result.success) {
    revalidatePath('/material-issuance');
  }

  return result;
}

export async function approveIssuanceSlip(issuanceId: string, accountantId: string) {
  const result = await fetchWithAuth(`/api/issuance/${issuanceId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ accountantId })
  });

  if (result.success) {
    revalidatePath('/material-issuance');
  }

  return result;
}

export async function rejectIssuanceSlip(issuanceId: string, userId: string) {
  const result = await fetchWithAuth(`/api/issuance/${issuanceId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });

  if (result.success) {
    revalidatePath('/material-issuance');
  }

  return result;
}
