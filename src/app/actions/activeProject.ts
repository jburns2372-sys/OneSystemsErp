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

export async function requireActiveProject(): Promise<string> {
  const projectId = await getActiveProjectCookie();
  if (!projectId) {
    throw new Error('No active project selected. Please select a project from the top navigation bar.');
  }
  return projectId;
}
