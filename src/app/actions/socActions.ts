'use server';

import { revalidatePath, revalidateTag } from 'next/cache'; // Include if needed, though not used in original

/**
 * A wrapper around `fetch` that adds authentication headers (if available)
 * and handles API response parsing and error checking.
 */
async function fetchWithAuth<T>(url: string, options?: RequestInit): Promise<T> {
  // In a real application, you'd add actual authentication logic here,
  // e.g., fetching a token from a secure cookie or an auth provider.
  const authHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    // 'Authorization': `Bearer ${await getAuthToken()}`, // Example: replace with actual auth token retrieval
  };

  const fullUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    headers: {
      ...authHeaders,
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorData: any = {};
    try {
      errorData = await response.json();
    } catch (e) {
      // If response is not JSON, just use status text
      errorData.message = response.statusText;
    }
    const errorMessage = errorData.error || errorData.message || 'An unknown error occurred';
    throw new Error(`API Error (${response.status}): ${errorMessage}`);
  }

  const result = await response.json();

  // Check for the 'success' flag in the response body from the Express backend
  if (result && typeof result === 'object' && 'success' in result && !result.success) {
    throw new Error(result.error || 'Backend operation failed');
  }

  // Return the actual data payload from the backend response
  return result.data as T;
}

export async function checkSocAccess(userId: string) {
  return fetchWithAuth<boolean>('/api/socActions/checkSocAccess', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}

export async function getSocDashboardStats(includeSimulated: boolean = true) {
  return fetchWithAuth<{
    totalEvents: number;
    blockedThreats: number;
    criticalThreats: number;
    failedLogins: number;
    aiAttacks: number;
    fileThreats: number;
    activeIncidents: number;
  }>('/api/socActions/getSocDashboardStats', {
    method: 'POST',
    body: JSON.stringify({ includeSimulated }),
  });
}

export async function getLiveThreatFeed(limit: number = 50, includeSimulated: boolean = true) {
  return fetchWithAuth<Array<any>>('/api/socActions/getLiveThreatFeed', {
    method: 'POST',
    body: JSON.stringify({ limit, includeSimulated }),
  });
}

export async function getEventDetails(eventId: string) {
  return fetchWithAuth<any>('/api/socActions/getEventDetails', {
    method: 'POST',
    body: JSON.stringify({ eventId }),
  });
}

export async function getThreatMapData(includeSimulated: boolean = true) {
  return fetchWithAuth<Array<any>>('/api/socActions/getThreatMapData', {
    method: 'POST',
    body: JSON.stringify({ includeSimulated }),
  });
}

export async function getCountermeasuresData(limit: number = 20) {
  return fetchWithAuth<Array<any>>('/api/socActions/getCountermeasuresData', {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}
