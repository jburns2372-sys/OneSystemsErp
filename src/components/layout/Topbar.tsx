import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logout } from '@/app/actions/auth';

import PageTitle from './PageTitle';

export default async function Topbar() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  let user = null;
  if (sessionId) {
    user = await prisma.user.findUnique({ where: { id: sessionId } });
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{user.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-color)' }}>{user.role.replace('_', ' ')}</div>
            </div>
            
            <form action={logout}>
              <button 
                type="submit"
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
        )}

      </div>
    </header>
  );
}
