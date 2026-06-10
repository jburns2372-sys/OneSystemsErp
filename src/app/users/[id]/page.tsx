import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { getSystemRoles } from '@/app/actions/user';
import EditUserClient from './EditUserClient';

export const dynamic = 'force-dynamic';

export default async function EditUserPage({ params }: { params: { id: string } }) {
  // Await params to avoid Next.js 15 sync access warnings
  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    notFound();
  }

  const roles = await getSystemRoles();

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '5px' }}>Edit User Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Update user credentials, roles, and access.</p>
      </header>

      <EditUserClient 
        roles={roles}
        user={{
          id: user.id,
          name: user.name || '',
          email: user.email || '',
          role: user.role
        }} 
      />
    </div>
  );
}
