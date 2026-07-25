'use server';
import { cookies } from 'next/headers';
// Placeholder for fetchWithAuth, assuming it handles authentication (e.g., passing a token)
// and sets appropriate headers (like Content-Type: application/json)
async function fetchWithAuth(url: string, options?: RequestInit) {
  // In a real application, you'd get an auth token (e.g., from a cookie, session, or external auth service)
  // const authToken = await getAuthToken(); // Example: Replace with actual auth token retrieval logic
  const authToken = process.env.SERVER_AUTH_TOKEN; // Placeholder, use a secure method to get token for Server Actions

  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
    ...options?.headers,
  };

  // Ensure NEXT_PUBLIC_AWS_BACKEND_URL is set in your .env.local file (and other environments)
  const baseUrl = (process.env.NEXT_PUBLIC_AWS_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL);
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_AWS_BACKEND_URL is not defined in environment variables.');
  }

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { headers.Cookie = __allCookies; } }

const response = await fetch(baseUrl + url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to parse error response from backend' }));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status} - ${errorBody.message || response.statusText}`);
  }

  return response;
}

const API_ROUTE_PREFIX = '/api/profitabilityActions';

export async function getProjectProfitability(projectId: string) {
  try {
    const res = await fetchWithAuth(`${API_ROUTE_PREFIX}/getProjectProfitability`, {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });

    const data = await res.json();

    // The original file did not include revalidatePath or revalidateTag, so they are not included here.
    // If your backend operations involved data mutations that should invalidate Next.js cache,
    // you would add revalidatePath('/your-data-path') or revalidateTag('your-data-tag') here
    // after a successful operation (i.e., if data.success is true).

    return data; // This will already contain { success: true/false, data/error } as returned by the AWS backend
  } catch (error: any) {
    console.error('Next.js Server Action error for getProjectProfitability:', error);
    // Return a consistent error structure expected by the UI
    return { success: false, error: error.message || 'An unexpected error occurred during profitability fetch.' };
  }
}
