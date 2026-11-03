'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Define a placeholder fetchWithAuth for demonstration
// In a real application, this would handle authentication (e.g., attach an auth token)
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

interface ValidationResult {
  success: boolean;
  canSubmit?: boolean;
  criticalErrors?: string[];
  warnings?: string[];
  error?: string;
}

interface SubmissionResult {
  success: boolean;
  error?: string;
}

export async function validatePayrollPreSubmission(periodId: string): Promise<ValidationResult> {
  try {
    const result = await fetchWithAuth('/api/payrollAiValidator/validatePayrollPreSubmission', {
      method: 'POST',
      body: JSON.stringify({ periodId })
    });
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to validate payroll.' };
  }
}

export async function submitPayrollForReview(periodId: string): Promise<SubmissionResult> {
  try {
    const result = await fetchWithAuth('/api/payrollAiValidator/submitPayrollForReview', {
      method: 'POST',
      body: JSON.stringify({ periodId })
    });
    
    if (result.success) {
      revalidatePath(`/payroll/${periodId}`);
      revalidatePath(`/payroll`);
    }
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to submit payroll.' };
  }
}

export async function approveAndLockPayroll(periodId: string): Promise<SubmissionResult> {
  try {
    const result = await fetchWithAuth('/api/payrollAiValidator/approveAndLockPayroll', {
      method: 'POST',
      body: JSON.stringify({ periodId })
    });
    
    if (result.success) {
      revalidatePath(`/payroll/${periodId}`);
      revalidatePath(`/payroll`);
    }
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to approve payroll.' };
  }
}
