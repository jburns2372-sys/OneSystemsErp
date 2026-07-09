'use server';

import { cookies } from 'next/headers';

/**
 * A wrapper around fetch that automatically includes authentication tokens/cookies.
 * In this setup, it reads Next.js cookies and sends them in the request body
 * for the backend to use for authentication and authorization.
 */
async function fetchWithAuth(url: string, options?: RequestInit) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('session')?.value;
  const simulatedRole = cookieStore.get('simulatedRole')?.value;

  const headers = {
    'Content-Type': 'application/json',
    ...(options?.headers || {})
  };

  let body = {};
  if (options?.body) {
    try {
      body = JSON.parse(options.body as string);
    } catch (e) {
      // If body is not JSON or not parseable, use it as is (though server actions typically send JSON)
      console.warn('fetchWithAuth: options.body is not valid JSON, sending as raw body. Make sure backend expects this.');
      body = options.body;
    }
  }

  // Merge session and simulatedRole into the body for the backend
  const mergedBody = JSON.stringify({
    ...body,
    sessionToken,
    simulatedRole
  });

  const response = await fetch(url, {
    ...options,
    headers,
    body: mergedBody
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error', success: false }));
    throw new Error(errorData.error || 'Failed to fetch data');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.error || 'Backend operation failed');
  }
  return data.data; // Return the actual data payload
}

const API_BASE_URL = process.env.NEXT_PUBLIC_AWS_BACKEND_URL || 'http://localhost:3001/api';
const ROUTE_NAME = 'executiveActions';

/**
 * Retrieves the high-level company overview KPIs for the Executive Home Dashboard
 */
export async function getCompanyOverview(projectId?: string) {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/${ROUTE_NAME}/getCompanyOverview`,
    {
      method: 'POST',
      body: JSON.stringify({ projectId })
    }
  );
  return response;
}

/**
 * Retrieves the project portfolio list for the executive dashboard
 */
export async function getProjectPortfolio() {
  const response = await fetchWithAuth(
    `${API_BASE_URL}/${ROUTE_NAME}/getProjectPortfolio`,
    {
      method: 'POST',
      body: JSON.stringify({}) // No specific arguments needed for this function besides auth
    }
  );
  return response;
}
