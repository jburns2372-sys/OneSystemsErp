'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';


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
