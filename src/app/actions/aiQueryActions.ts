'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';

// Placeholder for fetchWithAuth function
// In a real application, this would handle base URL, authentication tokens,
// error handling, and other common fetch concerns.
async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchAuthenticatedBackend(endpoint, options);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.error || parsed.message || errorText;
    } catch {
      // non-JSON error body
    }
    throw new Error(errorMessage || `Backend Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function processExecutiveQuery(query: string): Promise<string> {
  const cookieStore = await cookies();
  // Extract cookie values needed by the backend logic
  const __session = await verifySession();
  const userId = __session?.id || '';
  const simulatedRole = cookieStore.get('simulatedRole')?.value;
  const executive_projectId = cookieStore.get('executive_projectId')?.value;

  // Call the AWS backend endpoint
  const response = await fetchWithAuth('/api/aiQueryActions/processExecutiveQuery', {
    method: 'POST',
    body: JSON.stringify({
      query, // Original function argument
      userId, // Pass userId from cookie to backend for verification
      simulatedRole, // Pass simulatedRole from cookie to backend for verification
      executive_projectId // Pass project ID from cookie to backend for query filtering
    }),
  });

  // Handle the response from the backend
  if (!response.success) {
    throw new Error(response.error || 'Failed to process query');
  }

  // No revalidatePath or revalidateTag in original, so none needed here.

  return response.result;
}
