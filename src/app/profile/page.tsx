import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ProfileForm from './ProfileForm';

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value;

  if (!userId) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!user) {
    redirect('/login');
  }

  const roleNames = user.userRoles.map(ur => ur.role.roleName).join(', ') || 'No Assigned Roles';

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '20px', color: 'var(--text-primary)', fontSize: '2rem' }}>My Profile</h1>
      
      <div style={{
        background: 'var(--bg-secondary)',
        padding: '30px',
        borderRadius: '12px',
        border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{ marginBottom: '30px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--accent-color)', marginBottom: '10px' }}>System Roles</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '10px' }}>
            Your access permissions are determined by these roles. You cannot edit your own role assignments.
          </p>
          <div style={{ display: 'inline-block', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-color)', padding: '8px 16px', borderRadius: '20px', color: '#fff', fontWeight: 'bold' }}>
            {roleNames}
          </div>
        </div>

        <ProfileForm 
          initialName={user.name || ''} 
          initialEmail={user.email || ''} 
        />
      </div>
    </div>
  );
}
