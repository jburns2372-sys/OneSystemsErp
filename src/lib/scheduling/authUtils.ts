import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { hasPermission } from '@/lib/permissions';

export async function getSessionActor() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;
  
  if (!userId) {
    throw new Error('UNAUTHORIZED: No active session');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('UNAUTHORIZED: User not found');
  }

  return { id: user.id, role: user.role, name: user.name, email: user.email };
}

export async function checkSchedulingAccess(actorId: string, actorRole: string, projectId: string, action: string = 'canView') {
  // Use real PBAC permission check
  const hasGlobalAccess = await hasPermission(actorId, 'PROJECT_MANAGEMENT', action);
  if (hasGlobalAccess) {
    return { allowed: true, projectRole: actorRole };
  }

  const assignment = await prisma.projectUserAssignment.findUnique({
    where: { userId_projectId: { userId: actorId, projectId } }
  });

  if (!assignment) {
    return { allowed: false };
  }

  // Fallback to project assignment if PBAC doesn't explicitly allow, though PBAC should be primary
  return { 
    allowed: true, 
    projectRole: assignment?.projectRole || actorRole 
  };
}
