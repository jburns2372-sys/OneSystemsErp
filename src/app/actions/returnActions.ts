'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Placeholder for fetchWithAuth function
// In a real application, this would handle authentication tokens etc.
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

export async function createMaterialReturn(data: any) {
  try {
    const result = await fetchWithAuth('/api/returnActions/createMaterialReturn', {
      method: 'POST',
      body: JSON.stringify({ data }), // Pass original 'data' object as 'data' property in body
    });

    if (result.success) {
      revalidatePath('/material-issuance');
    }
    return result;
  } catch (error: any) {
    console.error('Error creating material return (Proxy):', error);
    return { success: false, error: error.message || 'Failed to create return slip' };
  }
}

export async function processMaterialReturn(returnId: string, warehousemanId: string) {
  try {
    const result = await fetchWithAuth('/api/returnActions/processMaterialReturn', {
      method: 'POST',
      body: JSON.stringify({ returnId, warehousemanId }), // Pass arguments directly
    });

    if (result.success) {
      revalidatePath('/material-issuance');
      revalidatePath('/inventory');
    }
    return result;
  } catch (error: any) {
    console.error('Error processing material return (Proxy):', error);
    return { success: false, error: error.message || 'Failed to process return slip' };
  }
}
