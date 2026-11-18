/**
 * Server-side project-scope boundary. The validated simulator claim may
 * narrow an admin's view but must never grant broad project access to a
 * database actor who does not hold an actual global-admin role.
 *
 * This mirrors the frontend's project-list-visibility decision; this module
 * is local to the independently built backend service.
 */
export function mayReadAllProjects(
  actualRole: string | null | undefined,
  simulatedRole: string | null | undefined
): boolean {
  const actualAdmin = actualRole === 'SUPER_ADMIN' || actualRole === 'SYSTEM_ADMIN';
  if (!actualAdmin) return false;
  if (!simulatedRole) return true;
  return simulatedRole === 'SUPER_ADMIN' || simulatedRole === 'SYSTEM_ADMIN';
}
