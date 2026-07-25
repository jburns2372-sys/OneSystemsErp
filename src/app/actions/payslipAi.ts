'use server';
import { cookies } from 'next/headers';
// Basic fetchWithAuth definition
// In a real application, this would typically be a shared utility
// that handles authentication headers (e.g., JWT, session token).
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Ensure Content-Type is application/json for POST requests with a body
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };

  // In a real app, you might get an auth token from a cookie, session, or other secure storage
  // and add it to the headers:
  // const authToken = getAuthTokenFromCookie(); // Example
  // if (authToken) {
  //   options.headers['Authorization'] = `Bearer ${authToken}`;
  // }

  // Use an environment variable for the backend API base URL
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || ''; 
  const fullUrl = `${apiBaseUrl}${url}`;

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { headers.Cookie = __allCookies; } }

const res = await fetch(fullUrl, options);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    // Prioritize 'error' property from backend, then 'message', then HTTP status text
    throw new Error(errorData.error || errorData.message || `API request failed with status ${res.status}`);
  }

  return res.json();
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
