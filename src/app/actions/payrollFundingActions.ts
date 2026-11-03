'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Placeholder for fetchWithAuth - replace with your actual implementation
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

export async function createFundingRequest(periodId: string, destinationAccountId: string, userId: string, boqItemId?: string) {
  try {
    const data = await fetchWithAuth('/api/payrollFundingActions/createFundingRequest', {
      method: 'POST',
      body: JSON.stringify({ periodId, destinationAccountId, userId, boqItemId }),
    });

    if (!data.success) {
      // Backend error messages are passed through
      throw new Error(data.error || 'Failed to create funding request');
    }

    revalidatePath(`/payroll/${periodId}`);
    return { success: true, requestId: data.requestId };
  } catch (error: any) {
    console.error('Error creating funding request via proxy:', error);
    return { success: false, error: error.message };
  }
}

export async function approveFundingRequest(requestId: string, userId: string) {
  try {
    const data = await fetchWithAuth('/api/payrollFundingActions/approveFundingRequest', {
      method: 'POST',
      body: JSON.stringify({ requestId, userId }),
    });

    if (!data.success) {
      // Backend error messages are passed through
      throw new Error(data.error || 'Failed to approve funding request');
    }

    // The backend now returns payrollPeriodId for revalidation.
    revalidatePath(`/payroll/${data.payrollPeriodId}`); 
    return { success: true };
  } catch (error: any) {
    console.error('Error approving funding request via proxy:', error);
    return { success: false, error: error.message };
  }
}