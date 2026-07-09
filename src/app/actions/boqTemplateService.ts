'use server';

import { cookies } from "next/headers";

// Standard fetchWithAuth wrapper
const fetchWithAuth = async (url: string, options?: RequestInit) => {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token')?.value; // Example: get your actual auth token

  const headers = new Headers(options?.headers);
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }
  headers.set('Content-Type', 'application/json'); // Ensure JSON content type

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}${url}`, {
    ...options,
    headers,
    cache: 'no-store' // Server Actions typically don't cache, unless explicitly desired
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `API call failed with status ${response.status}`);
  }
  return response.json();
};

export async function generateBOQTemplate(projectId?: string) {
  try {
    // Extract user email from cookies to pass to the backend for audit logging
    const cookieStore = await cookies();
    const email = cookieStore.get('demo_user_email')?.value || 'jburns@demo.com';

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
