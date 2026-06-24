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
  
  const userId = cookieStore.get('session')?.value || '';
  const { prisma } = await import('@/lib/prisma');
  
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  const projects = await prisma.project.findMany({
    where: isSuperAdmin ? undefined : {
      userAssignments: {
        some: {
          userId: userId,
          assignmentStatus: 'active'
        }
      }
    },
    select: { id: true, name: true, startDate: true, endDate: true },
    orderBy: { createdAt: 'desc' }
  });

  return { projects, currentProjectId };
}
