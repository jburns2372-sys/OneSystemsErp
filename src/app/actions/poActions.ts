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

export async function createPOFromMRF(mrId: string, items: { consolidatedBoqItemId: string, quantity: number, unitCost: number, supplierId: string }[]) {
  const result = await fetchWithAuth('/api/procurement/po/from-mrf', {
    method: 'POST',
    body: JSON.stringify({ mrId, items })
  });

  if (result.success) {
    revalidatePath('/procurement/purchase-orders');
    revalidatePath('/material-requests');
  }

  return result;
}

export async function approvePurchaseOrder(poId: string) {
  const result = await fetchWithAuth(`/api/procurement/po/${poId}/approve`, {
    method: 'POST'
  });

  if (result.success) {
    revalidatePath('/procurement/purchase-orders');
  }

  return result;
}

export async function submitPOForApproval(poId: string) {
  const result = await fetchWithAuth(`/api/procurement/po/${poId}/submit`, {
    method: 'POST'
  });

  if (result.success) {
    revalidatePath(`/procurement/purchase-orders/${poId}`);
    revalidatePath('/procurement/purchase-orders');
  }

  return result;
}
