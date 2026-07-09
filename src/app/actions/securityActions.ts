'use server';

import { cookies } from 'next/headers';

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
    throw new Error(`Backend Error: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function getSecurityEvents(limit = 100) {
  return await fetchWithAuth(`/api/security/events?limit=${limit}`);
}

export async function getSecurityStats() {
  return await fetchWithAuth(`/api/security/stats`);
}
