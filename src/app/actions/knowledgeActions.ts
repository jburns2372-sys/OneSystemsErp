'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';


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

export async function saveKnowledgeRecord(data: any) {
  try {
    const result = await fetchWithAuth('/api/knowledge/records', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    revalidatePath('/knowledge-center');
    revalidatePath('/knowledge-center/notebooks');
    revalidatePath('/knowledge-center/business-rules');
    
    return { success: true, record: result.record };
  } catch (error: any) {
    console.error('Error saving knowledge record:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteKnowledgeRecord(id: string) {
  try {
    await fetchWithAuth(`/api/knowledge/records/${id}`, {
      method: 'DELETE'
    });
    revalidatePath('/knowledge-center');
    revalidatePath('/knowledge-center/notebooks');
    revalidatePath('/knowledge-center/business-rules');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
