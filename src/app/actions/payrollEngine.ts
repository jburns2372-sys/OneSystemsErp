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

/**
 * AI-Assisted Payroll Computation Engine
 */
export async function computePayrollForPeriod(payrollPeriodId: string) {
  const result = await fetchWithAuth('/api/payrollEngine/computePayrollForPeriod', {
    method: 'POST',
    body: JSON.stringify({ payrollPeriodId })
  });
  revalidatePath(`/payroll/${payrollPeriodId}`);
  return result;
}

export async function deletePayrollPeriod(periodId: string) {
  const result = await fetchWithAuth(`/api/payrollEngine/deletePayrollPeriod/${periodId}`, {
    method: 'DELETE'
  });
  revalidatePath('/payroll');
  return result;
}

export async function saveCutoffSetting(data: any) {
  try {
    await fetchWithAuth('/api/payrollEngine/saveCutoffSetting', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    revalidatePath('/payroll/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCutoffSetting(id: string) {
  try {
    await fetchWithAuth(`/api/payrollEngine/deleteCutoffSetting/${id}`, {
      method: 'DELETE'
    });
    revalidatePath('/payroll/settings');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}