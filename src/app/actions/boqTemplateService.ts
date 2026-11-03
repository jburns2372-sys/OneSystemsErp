'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';

import { verifyOperationalSession } from '@/lib/dal/auth';

// Standard fetchWithAuth wrapper
const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const response = await fetchAuthenticatedBackend(url, {
    ...options,
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: `API call failed with status ${response.status}` }));
    throw new Error(errorData.error || `API call failed with status ${response.status}`);
  }
  return response.json();
};

export async function generateBOQTemplate(projectId?: string) {
  try {
    // Extract user email from cookies to pass to the backend for audit logging
    const opSession = await verifyOperationalSession();
    const cookieStore = await cookies();
    const email = opSession?.email || cookieStore.get('demo_user_email')?.value;
    if (!email) throw new Error('No session');

    const response = await fetchWithAuth('/api/boqTemplateService/generateBOQTemplate', {
      method: 'POST',
      body: JSON.stringify({ projectId, email }), // Pass projectId and email to the backend
    });

    // The backend is expected to return { success: true, data: ..., fileName: ... } or { success: false, error: ... }
    return response;

  } catch (error: any) {
    console.error("Error in Next.js proxy for generateBOQTemplate:", error);
    return {
      success: false,
      error: error.message || "Failed to generate BOQ template via proxy."
    };
  }
}
