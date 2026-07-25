'use server';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_AWS_BACKEND_URL || process.env.AWS_BACKEND_URL) || 'http://localhost:4000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const session = __session?.id || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value;
  const simulatedRole = cookieStore.get('simulatedRole')?.value;

  const headers = new Headers(options.headers);
  if (session) headers.set('x-user-session', session);
  if (activeProjectId) headers.set('x-active-project-id', activeProjectId);
  if (simulatedRole) headers.set('x-simulated-role', simulatedRole);
  headers.set('Content-Type', 'application/json');

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { (headers as any).Cookie = __allCookies; } }

const res = await fetch(`${BACKEND_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Backend Error: ${res.status} ${errorText}`);
  }
  return res.json();
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
