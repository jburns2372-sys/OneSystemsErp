import { verifySession } from '@/lib/dal/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logout } from '@/app/actions/auth';
import { resolveEffectiveHeaderAccessContext } from '@/lib/uboq/ux-helpers';
import ActiveProjectSelector from './ActiveProjectSelector';
import ExitRolePreviewButton from './ExitRolePreviewButton';

import PageTitle from './PageTitle';

export default async function Topbar() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;
  const rawSimulatedRole = cookieStore.get('simulatedRole')?.value || null;

  let user: { id: string; name: string | null; role: string } | null = null;
  let assignments: Array<{
    projectId: string;
    project: { name: string; contractAmount: number; originalContractDuration: number | null };
    projectRole: string;
    accessLevel: string;
  }> = [];
  let accessContext = resolveEffectiveHeaderAccessContext(null, null);

  if (sessionId) {
    user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (user) {
      accessContext = resolveEffectiveHeaderAccessContext(user.role, rawSimulatedRole);
      if (accessContext.isGlobalProjectReader) {
        const allProjects = await prisma.project.findMany({
          orderBy: { name: 'asc' },
          select: { id: true, name: true, contractAmount: true, originalContractDuration: true },
        });
        assignments = allProjects.map((p) => ({
          projectId: p.id,
          project: p,
          projectRole: accessContext.realRoleCode,
          accessLevel: 'FULL',
        }));
      } else {
        const [directAssignments, managedProjects] = await Promise.all([
          prisma.projectUserAssignment.findMany({
            where: { userId: user.id, assignmentStatus: { in: ['active', 'ACTIVE'] } },
            include: { project: { select: { name: true, contractAmount: true, originalContractDuration: true } } },
            orderBy: { project: { name: 'asc' } },
          }),
          prisma.project.findMany({
            where: { managerId: user.id },
            orderBy: { name: 'asc' },
            select: { id: true, name: true, contractAmount: true, originalContractDuration: true },
          }),
        ]);
        const seen = new Set(directAssignments.map((a) => a.projectId));
        assignments = [
          ...directAssignments,
          ...managedProjects
            .filter((p) => !seen.has(p.id))
            .map((p) => ({
              projectId: p.id,
              project: p,
              projectRole: accessContext.realRoleCode,
              accessLevel: 'MANAGER',
            })),
        ];
      }
    }
  }

  return (
    <header style={{
      minHeight: 'var(--header-height)',
      backgroundColor: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '12px',
      padding: '10px 24px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <PageTitle />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>

            <ActiveProjectSelector
              assignments={assignments}
              activeProjectId={activeProjectId}
              isGlobalProjectReader={accessContext.isGlobalProjectReader}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '16px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{user.name || 'Signed-in User'}</div>
                {accessContext.isSimulating ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap', gap: '4px', marginTop: '2px' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: '#fbbf24',
                        fontWeight: 700,
                      }}
                      title="Role preview adjusts dashboard navigation only. Approvals always require your real authenticated account."
                    >
                      Previewing: {accessContext.activePreviewRoleLabel} (Signed in: {accessContext.realRoleLabel})
                    </span>
                    <ExitRolePreviewButton />
                  </div>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontWeight: 500 }}>
                    {accessContext.realRoleLabel}
                  </div>
                )}
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="allow-guest"
                  style={{
                    background: 'none', border: '1px solid var(--glass-border)', padding: '6px 12px',
                    borderRadius: '6px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem',
                    fontWeight: 600, transition: 'all 0.2s'
                  }}
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
