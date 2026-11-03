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

export async function uploadAndParseBOQ(projectId: string | null | undefined, fileBufferBase64: string, fileName: string) {
  try {
    const result = await fetchWithAuth('/api/jobs/boq-upload', {
      method: 'POST',
      body: JSON.stringify({ projectId, fileBufferBase64, fileName })
    });
    return result;
  } catch (error: any) {
    console.error("BOQ Upload dispatch error:", error);
    return { success: false, error: error.message || "Failed to dispatch BOQ upload" };
  }
}

export async function checkBoqUploadStatus(jobId: string) {
  try {
    const result = await fetchWithAuth(`/api/jobs/${jobId}`);
    return result;
  } catch (error: any) {
    console.error("BOQ Job status error:", error);
    return { success: false, error: error.message };
  }
}

export async function approveBOQUpload(uploadId: string) {
  try {
    const result = await fetchWithAuth('/api/consolidation/approve', {
      method: 'POST',
      body: JSON.stringify({ uploadId })
    });
    return result;
  } catch (error: any) {
     return { success: false, error: error.message };
  }
}
