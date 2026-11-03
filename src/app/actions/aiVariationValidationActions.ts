'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// This is a placeholder fetchWithAuth function. 
// In a real application, ensure it correctly handles authentication tokens
// (e.g., from cookies or server-side sessions) and your backend API URL.
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

const API_ROUTE_PREFIX = '/api/aiVariationValidationActions';

export async function preCheckVariationOrder(voId: string, userId: string) {
  try {
    const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/preCheckVariationOrder`, {
      method: 'POST',
      body: JSON.stringify({ voId, userId }),
    });

    if (response.success) {
      // Revalidation: The original action updates the Variation Order, so revalidate relevant UI.
      // Adjust these paths/tags to match your application's actual data fetching and caching strategy.
      revalidatePath(`/projects`); // Revalidate data for Variation Orders
      revalidatePath(`/projects/[projectId]/variation-orders`); // Revalidate a list of Variation Orders
      revalidatePath(`/projects/[projectId]/variation-orders/${voId}`); // Revalidate the detail page for a VO
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to run AI Pre-check from backend.');
    }
  } catch (error: any) {
    console.error('Error calling preCheckVariationOrder proxy:', error);
    throw new Error('Failed to run AI Pre-check: ' + error.message);
  }
}

export async function askVariationOrderAssistant(voId: string, question: string) {
  try {
    const response = await fetchWithAuth(`${API_ROUTE_PREFIX}/askVariationOrderAssistant`, {
      method: 'POST',
      body: JSON.stringify({ voId, question }),
    });

    if (response.success) {
      // No revalidation needed for a read-only AI question that doesn't alter database state.
      return response.data;
    } else {
      throw new Error(response.error || 'Failed to get AI answer from backend.');
    }
  } catch (error: any) {
    console.error('Error calling askVariationOrderAssistant proxy:', error);
    throw new Error('Failed to get AI answer: ' + error.message);
  }
}
