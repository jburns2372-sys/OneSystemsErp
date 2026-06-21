'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

export async function setExecutiveProjectContext(projectId: string) {
  const cookieStore = await cookies();
  
  if (projectId === 'ALL') {
    cookieStore.delete('executive_projectId');
  } else {
    // Store cookie for 30 days
    cookieStore.set('executive_projectId', projectId, { maxAge: 60 * 60 * 24 * 30 });
  }

  // Revalidate the entire executive layout so all pages refresh their queries
  revalidatePath('/executive', 'layout');
}

export async function getGlobalProjectsAndContext() {
  const cookieStore = await cookies();
  const currentProjectId = cookieStore.get('executive_projectId')?.value || 'ALL';
  
  const { prisma } = await import('@/lib/prisma');
  const projects = await prisma.project.findMany({
    select: { id: true, name: true },
    orderBy: { createdAt: 'desc' }
  });

  return { projects, currentProjectId };
}
