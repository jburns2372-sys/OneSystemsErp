'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

const BACKEND_URL = process.env.AWS_BACKEND_URL || 'http://localhost:4000';

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
    if (res.status === 400 && errorText.includes('AI Blocked')) {
      return res.json(); // Pass the validation block to frontend
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
