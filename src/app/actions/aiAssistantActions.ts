'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Placeholder for fetchWithAuth - replace with actual implementation for auth if needed.
// Assumes NEXT_PUBLIC_API_URL environment variable is set to your AWS backend URL.
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

export async function askERPAssistant(question: string) {
  try {
    const data = await fetchWithAuth('/api/aiAssistantActions/askERPAssistant', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });

    // No revalidatePath/Tag in original, so not adding here.
    // If a revalidation was present in the original, it would go here:
    // revalidatePath('/some-path'); 

    return data; // This will be { success: true, answer: string } or { success: false, error: string }
  } catch (error: any) {
    console.error('Server Action Proxy Error:', error);
    // Mimic the original error structure
    return { success: false, error: error.message || 'Failed to process AI request through proxy.' };
  }
}
