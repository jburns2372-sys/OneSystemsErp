'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

// Standard fetchWithAuth definition
async function fetchWithAuth(url: string, options: RequestInit) {
  const normalizedUrl = url.startsWith('/api/')
    ? url
    : `/api${url.startsWith('/') ? url : `/${url}`}`;

  const response = await fetchAuthenticatedBackend(normalizedUrl, options);

  if (!response.ok) {
    let errorData: any;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: 'Unknown error', status: response.status };
    }
    throw new Error(errorData.error || errorData.message || `Failed to fetch data with status ${response.status}`);
  }

  return response.json();
}

export async function updatePOStatus(poId: string, status: string) {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || ''; // This session ID might represent the approverId
  
  if (!sessionId) {
    throw new Error('Not authenticated');
  }

  const body: { poId: string; status: string; approverId?: string } = { poId, status };
  
  if (status === 'ISSUED') {
    body.approverId = sessionId; // Pass the sessionId as approverId to the backend
  }

  const result = await fetchWithAuth('/poUpdates/updatePOStatus', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (result.success) {
    revalidatePath(`/procurement/${poId}`);
    revalidatePath('/procurement/purchase-orders');
  } else {
    throw new Error(result.error || 'Failed to update PO status');
  }
}
