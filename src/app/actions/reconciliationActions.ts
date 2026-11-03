'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Basic fetchWithAuth definition - replace with your actual implementation
// This function should handle authentication (e.g., attaching a token)
// and standard error handling for API calls.
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

// Mock reconciliation that simulates updating batch rows based on a file upload
export async function reconcileBatch(batchId: string, results: { payslipId: string, status: string, reference?: string }[], userId: string) {
  try {
    const responseData = await fetchWithAuth('/api/reconciliationActions/reconcileBatch', {
      method: 'POST',
      body: JSON.stringify({
        batchId,
        results,
        userId
      }),
    });

    if (responseData.success) {
      revalidatePath(`/payroll`);
    }

    return responseData;
  } catch (error: any) {
    console.error('Error reconciling batch via proxy:', error);
    return { success: false, error: error.message };
  }
}
