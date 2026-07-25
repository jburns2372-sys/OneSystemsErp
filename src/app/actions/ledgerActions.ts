'use server';
import { cookies } from 'next/headers';
import { revalidatePath, revalidateTag } from 'next/cache';

async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const BACKEND_API_URL = process.env.BACKEND_API_URL;

  if (!BACKEND_API_URL) {
    throw new Error('BACKEND_API_URL is not defined in environment variables.');
  }

  const headers = new Headers(options?.headers);
  headers.set('Content-Type', 'application/json');

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { headers.Cookie = __allCookies; } }

return fetch(`${BACKEND_API_URL}${url}`, {
    ...options,
    headers,
  });
}

export async function getProjectCostLedger(projectId: string) {
  try {
    const response = await fetchWithAuth('/api/ledgerActions/getProjectCostLedger', {
      method: 'POST',
      body: JSON.stringify({ projectId }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || response.statusText || 'Unknown error during fetch');
    }

    return result;
  } catch (error: any) {
    console.error('Next.js Server Action: Failed to fetch project cost ledger:', error);
    return { success: false, error: error.message || 'Failed to retrieve project cost ledger.' };
  }
}