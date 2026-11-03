'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';


async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const res = await fetchAuthenticatedBackend(endpoint, options);

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 400 && errorText.includes('AI Blocked')) {
      return JSON.parse(errorText);
    }
    throw new Error(`Backend Error: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function createPayrollPeriod(data: any, userId: string) {
  try {
    const result = await fetchWithAuth('/api/payroll/period/create', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    
    if (result.success) {
      revalidatePath('/payroll');
    }
    
    return result;
  } catch (error: any) {
    console.error('Error creating payroll period:', error);
    return { success: false, error: error.message || 'Failed to create payroll period' };
  }
}
