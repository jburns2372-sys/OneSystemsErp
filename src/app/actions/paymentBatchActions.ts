'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Basic fetchWithAuth definition (adjust as per your actual implementation)
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

export async function generatePaymentBatch(periodId: string, paymentMethodType: string, payrollBankAccountId: string, userId: string) {
  try {
    const response = await fetchWithAuth('/api/paymentBatchActions/generatePaymentBatch', {
      method: 'POST',
      body: JSON.stringify({
        periodId,
        paymentMethodType,
        payrollBankAccountId,
        userId,
      }),
    });

    if (response.success) {
      revalidatePath(`/payroll/${periodId}`);
    }
    
    return response;
  } catch (error: any) {
    console.error('Error generating payment batch via proxy:', error);
    return { success: false, error: error.message };
  }
}
