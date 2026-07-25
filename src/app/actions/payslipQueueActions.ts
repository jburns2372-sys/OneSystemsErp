import { cookies } from 'next/headers';
'use server';

import { revalidatePath } from 'next/cache';

// Placeholder for fetchWithAuth. In a real app, this would handle authentication tokens
// (e.g., from a session or cookie) and potentially refresh logic.
async function fetchWithAuth(url: string, options?: RequestInit) {
  const headers = {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${yourAuthToken}`, // Add actual auth token here
    ...options?.headers,
  };

  // Ensure NEXT_PUBLIC_AWS_BACKEND_URL is defined in your .env.local or environment variables.
  // This example uses a fallback for local development.
  const baseUrl = (process.env.NEXT_PUBLIC_AWS_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL) || 'http://localhost:3001'; // Example fallback

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { headers.Cookie = __allCookies; } }

const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Attempt to parse error message from response body, fallback to status text
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || errorData.message || 'An unknown network error occurred');
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
