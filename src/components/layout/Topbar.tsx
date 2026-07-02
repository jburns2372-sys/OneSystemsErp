import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logout } from '@/app/actions/auth';
import ActiveProjectSelector from './ActiveProjectSelector';

import PageTitle from './PageTitle';

export default async function Topbar() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;
  const simulatedRole = cookieStore.get('simulatedRole')?.value || null;
  
  let user: any = null;
  let assignments: any[] = [];
  
  if (sessionId) {
    user = await prisma.user.findUnique({ where: { id: sessionId } });
    if (user) {
      if (['SUPER_ADMIN', 'SYSTEM_ADMIN', 'EXECUTIVE'].includes(user.role)) {
        const allProjects = await prisma.project.findMany({
          orderBy: { name: 'asc' },
          select: { id: true, name: true, contractAmount: true, originalContractDuration: true }
        });
        assignments = allProjects.map(p => ({
          projectId: p.id,
          project: p,
          projectRole: user.role,
          accessLevel: 'FULL'
        }));
      } else {
        assignments = await prisma.projectUserAssignment.findMany({
          where: { userId: user.id, assignmentStatus: 'active' },
          include: { project: { select: { name: true, contractAmount: true, originalContractDuration: true } } },
          orderBy: { project: { name: 'asc' } }
        });
      }
    }
  }

  return (
    <header style={{
      height: 'var(--header-height)',
      backgroundColor: 'var(--glass-bg)',
      backdropFilter: 'blur(10px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 30px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <PageTitle />
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '20px' }}>
        
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
            
            <ActiveProjectSelector 
              assignments={assignments} 
              activeProjectId={activeProjectId} 
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '20px' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.name}</div>
                <div style={{ fontSize: '0.75rem', color: simulatedRole ? '#ff4d4d' : 'var(--accent-color)', fontWeight: simulatedRole ? 'bold' : 'normal' }}>
                  {simulatedRole ? `SIMULATING: ${simulatedRole.replace(/_/g, ' ')}` : user.role.replace(/_/g, ' ')}
                </div>
              </div>
              
              <form action={logout}>
                <button 
                  type="submit"
                  className="allow-guest"
                  style={{
                    background: 'none', border: '1px solid var(--glass-border)', padding: '6px 12px',
                    borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem',
                    fontWeight: 'bold', transition: 'all 0.2s'
                  }}
                >
                  Sign Off
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    </header>
  );
}
