'use server';
import { cookies } from 'next/headers';
import { verifySession } from '@/lib/dal/auth';

// This `fetchWithAuth` function acts as a proxy to your AWS backend.
// It assumes NEXT_PUBLIC_AWS_BACKEND_URL is configured in your Next.js environment variables
// (e.g., .env.local, .env.production) and points to your AWS Express.js API base URL.
async function fetchWithAuth(urlPath: string, options?: RequestInit) {
  const backendUrl = (process.env.NEXT_PUBLIC_AWS_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL);
  if (!backendUrl) {
    throw new Error("NEXT_PUBLIC_AWS_BACKEND_URL is not defined in your environment.");
  }

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { headers.Cookie = __allCookies; } }

const response = await fetch(`${backendUrl}${urlPath}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers
    }
  });

  if (!response.ok) {
    let errorDetail = 'Unknown error occurred.';
    try {
      const errorResponse = await response.json();
      errorDetail = errorResponse.error || errorResponse.message || errorDetail;
    } catch (e) {
      // If response is not JSON, use default error message
    }
    throw new Error(`Backend fetch failed: ${response.status} ${response.statusText} - ${errorDetail}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Operation failed on the server.');
  }
  return result;
}

export async function getFinancialReport() {
  // Access cookies on the server side using Next.js headers API
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

  // Call the AWS backend through the fetchWithAuth proxy
  const response = await fetchWithAuth('/reportActions/getFinancialReport', {
    method: 'POST',
    body: JSON.stringify({ sessionId, activeProjectId })
  });

  // Return the data exactly as the original function did
  return {
    projectFinancials: response.projectFinancials,
    globalOutstandingPayables: response.globalOutstandingPayables
  };
}

export async function getProjectReport() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

  const response = await fetchWithAuth('/reportActions/getProjectReport', {
    method: 'POST',
    body: JSON.stringify({ sessionId, activeProjectId })
  });

  // The backend is expected to return { success: true, data: reportArray }
  return response.data; 
}

export async function getInventoryReport() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

  const response = await fetchWithAuth('/reportActions/getInventoryReport', {
    method: 'POST',
    body: JSON.stringify({ sessionId, activeProjectId })
  });

  // The backend is expected to return { success: true, data: reportArray }
  return response.data;
}
