'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

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

export async function uploadAndAnalyzeQuotationsBulk(canvassId: string, formData: FormData) {
  try {
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) throw new Error('No files provided');

    const filePayloads = await Promise.all(files.map(async (file) => ({
      name: file.name,
      type: file.type,
      base64: Buffer.from(await file.arrayBuffer()).toString('base64')
    })));

    const result = await fetchWithAuth('/api/ai/quotations', {
      method: 'POST',
      body: JSON.stringify({ canvassId, files: filePayloads })
    });

    return result;
  } catch (error: any) {
    console.error('Bulk AI Analysis Error:', error);
    return { success: false, error: error.message || 'Failed to analyze quotations.' };
  }
}
