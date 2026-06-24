'use server';

import { cookies } from 'next/headers';

export async function setActiveProjectCookie(projectId: string | null) {
  const cookieStore = await cookies();
  if (projectId) {
    // 7 days expiration
    cookieStore.set('activeProjectId', projectId, { maxAge: 60 * 60 * 24 * 7, path: '/' });
  } else {
    cookieStore.delete('activeProjectId');
  }
}

export async function getActiveProjectCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('activeProjectId')?.value || null;
}
