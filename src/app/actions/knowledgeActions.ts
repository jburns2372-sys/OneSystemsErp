'use server';
import { verifySession } from '@/lib/dal/auth';

import { revalidatePath } from 'next/cache';
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
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { headers.Cookie = __allCookies; } }

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
