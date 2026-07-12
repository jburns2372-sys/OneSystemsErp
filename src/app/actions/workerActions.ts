'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_AWS_BACKEND_URL || process.env.AWS_BACKEND_URL) || 'http://localhost:4000';

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('session')?.value;
  const activeProjectId = cookieStore.get('activeProjectId')?.value;
  const simulatedRole = cookieStore.get('simulatedRole')?.value;

  const headers = new Headers(options.headers);
  if (session) headers.set('x-user-session', session);
  if (activeProjectId) headers.set('x-active-project-id', activeProjectId);
  if (simulatedRole) headers.set('x-simulated-role', simulatedRole);
  headers.set('Content-Type', 'application/json');

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

export async function validateWorkerProfileWithAI(workerData: any) {
  return await fetchWithAuth('/api/workers/validate', {
    method: 'POST',
    body: JSON.stringify({ workerData })
  });
}

export async function saveWorkerProfile(data: any, aiValidationLogs: any[]) {
  const result = await fetchWithAuth('/api/workers/save', {
    method: 'POST',
    body: JSON.stringify({ data, aiValidationLogs })
  });

  if (result.success) {
    revalidatePath('/workers');
    revalidatePath('/payroll');
  }

  return result;
}

export async function approvePaymentProfile(workerId: string) {
  const result = await fetchWithAuth(`/api/workers/${workerId}/approve-payment`, {
    method: 'POST'
  });

  if (result.success) {
    revalidatePath(`/workers/${workerId}`);
  }

  return result;
}

export async function holdPaymentProfile(workerId: string, reason: string) {
  const result = await fetchWithAuth(`/api/workers/${workerId}/hold-payment`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });

  if (result.success) {
    revalidatePath(`/workers/${workerId}`);
  }

  return result;
}

export async function deleteWorker(id: string) {
  const result = await fetchWithAuth(`/api/workers/${id}`, {
    method: 'DELETE'
  });

  if (result.success) {
    revalidatePath('/workers');
    revalidatePath('/payroll');
  }

  return result;
}
