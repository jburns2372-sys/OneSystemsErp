'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';

/**
 * A wrapper around `fetch` that automatically includes authentication headers.
 * Assumes the existence of a session cookie or similar mechanism for authentication.
 * 
 * @param url The URL to fetch.
 * @param options Standard Fetch API options.
 * @returns A promise that resolves to the `Response` object.
 */
async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  // In a real application, you'd likely fetch a token from a secure cookie
  // or an auth provider and add it to the headers.
  // For this example, we're assuming the AWS backend handles auth or doesn't strictly require it
  // via headers for specific actions, but rather relies on sessionId in body if needed.
  
  const headers = new Headers(options?.headers);
  // Example for an actual auth token if you had one:
  // const token = cookies().get('authToken')?.value;
  // if (token) {
  //   headers.set('Authorization', `Bearer ${token}`);
  // }

  return fetch(url, {
    ...options,
    headers: headers,
  });
}

const AWS_BACKEND_API_BASE = process.env.AWS_BACKEND_API_BASE || (process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/api` : 'http://localhost:4000/api');
const ROUTE_NAME = 'systemResetActions';

export async function resetTransactionData(confirmationText: string) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    const simulatedRole = cookieStore.get('simulatedRole')?.value;

    const response = await fetchWithAuth(`${AWS_BACKEND_API_BASE}/${ROUTE_NAME}/resetTransactionData`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmationText, sessionId, simulatedRole }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.error || 'Failed to reset transaction data');
    }

    revalidatePath('/', 'layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to reset transaction data (proxy):', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentUserRole() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session')?.value;
    const simulatedRole = cookieStore.get('simulatedRole')?.value;
    
    // Fast path: if UI role is simulated, return it immediately for the UI to adapt
    if (simulatedRole) {
      return simulatedRole;
    }

    // Direct database check instead of relying on external AWS proxy which fails on Vercel
    if (!sessionId) {
      return null;
    }

    const currentUser = await prisma.user.findUnique({ where: { id: sessionId }});
    
    // Emergency empty state override
    if (!currentUser) {
      const userCount = await prisma.user.count();
      if (userCount === 0) return 'SUPER_ADMIN';
    }

    return currentUser?.role || null;
  } catch (e: any) {
    console.error('Failed to get current user role (Prisma direct):', e);
    return null;
  }
}
