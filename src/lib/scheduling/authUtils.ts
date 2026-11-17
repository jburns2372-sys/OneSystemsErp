import { verifySession } from '@/lib/dal/auth';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getPermissionsForRole, getUserPermissions } from '@/lib/permissions';
import { isSystemAdminRole, resolveAuthorizationAction } from '@/lib/authorizationActions';

export async function getSessionActor() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const userId = __session?.id || '';
  
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
  // actorRole is a display snapshot, never an authority supplied by the caller.
  const field = resolveAuthorizationAction(action);
  if (!field || !actorId || !projectId) return { allowed: false };
  try {
    const user = await prisma.user.findUnique({ where: { id: actorId }, select: { role: true, status: true, lockedUntil: true } });
    if (!user || user.status !== 'ACTIVE' || (user.lockedUntil && user.lockedUntil > new Date())) return { allowed: false };
    if (!await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })) return { allowed: false };
    const permissions = await getUserPermissions(actorId);
    const systemAdmin = isSystemAdminRole(user.role) && permissions.IS_ADMIN === true;
    const assignment = await prisma.projectUserAssignment.findUnique({
      where: { userId_projectId: { userId: actorId, projectId } },
    });
    if (!systemAdmin && (!assignment || assignment.assignmentStatus !== 'active'
      || (assignment.accessLevel === 'view_only' && field !== 'canView'))) return { allowed: false };
    if (permissions.PROJECT_MANAGEMENT?.[field] === true) {
      return { allowed: true, projectRole: assignment?.projectRole || user.role };
    }
    // Project-role grants cannot promote a non-admin into a system admin, or
    // override the guest read-only restriction.
    if (!assignment || isSystemAdminRole(assignment.projectRole) || permissions.IS_GUEST_USER) return { allowed: false };
    const projectPermissions = await getPermissionsForRole(assignment.projectRole);
    return { allowed: projectPermissions.PROJECT_MANAGEMENT?.[field] === true, projectRole: assignment.projectRole };
  } catch {
    return { allowed: false };
  }
}
