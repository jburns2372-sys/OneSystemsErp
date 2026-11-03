'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Placeholder for fetchWithAuth. In a real app, this would handle authentication tokens
// (e.g., from a session or cookie) and potentially refresh logic.
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

const API_ROUTE_PREFIX = '/api/payslipQueueActions';

export async function holdPayslip(payslipId: string, reason: string) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/holdPayslip`, {
      method: 'POST',
      body: JSON.stringify({ payslipId, reason }),
    });

    if (result.success) {
      revalidatePath('/finance/approved-payslips');
    }
    return result;
  } catch (error: any) {
    console.error('Failed to hold payslip:', error);
    return { success: false, error: error.message };
  }
}

export async function resolvePayslipException(payslipId: string) {
  try {
    const result = await fetchWithAuth(`${API_ROUTE_PREFIX}/resolvePayslipException`, {
      method: 'POST',
      body: JSON.stringify({ payslipId }),
    });

    if (result.success) {
      revalidatePath('/finance/approved-payslips');
    }
    return result;
  } catch (error: any) {
    console.error('Failed to resolve payslip exception:', error);
    return { success: false, error: error.message };
  }
}
