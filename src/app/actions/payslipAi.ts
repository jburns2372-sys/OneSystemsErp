'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
// Basic fetchWithAuth definition
// In a real application, this would typically be a shared utility
// that handles authentication headers (e.g., JWT, session token).
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

export async function explainPayslipWithAI(payrollId: string) {
  try {
    const result = await fetchWithAuth('/api/payslipAi/explainPayslipWithAI', {
      method: 'POST',
      body: JSON.stringify({ payrollId }),
    });
    return result;
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to generate explanation.' };
  }
}
