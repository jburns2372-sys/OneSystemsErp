/**
 * Preview role simulation may narrow a system administrator's project list,
 * but a client-controlled cookie can never expand database visibility.
 *
 * Always pass the authoritative, freshly loaded User.role as actualRole.
 * This is a display/query-scope helper, not a substitute for PostgreSQL RLS.
 */
export function mayReadAllProjects(
  actualRole: string | null | undefined,
  simulatedRole: string | null | undefined
): boolean {
  const actualAdmin = actualRole === 'SUPER_ADMIN' || actualRole === 'SYSTEM_ADMIN';
  if (!actualAdmin) return false;

  // For real system administrators, simulation is view-only and can only narrow.
  if (!simulatedRole) return true;
  return simulatedRole === 'SUPER_ADMIN' || simulatedRole === 'SYSTEM_ADMIN';
}
