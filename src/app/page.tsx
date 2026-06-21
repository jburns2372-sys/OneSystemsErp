import styles from './page.module.css';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

import { getDashboardStats } from '@/app/actions/project';
import RoleDashboardClient from './RoleDashboardClient';
import { redirect } from 'next/navigation';

export default async function Home() {
  const stats = await getDashboardStats();

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  
  let currentUser = null;
  if (sessionId) {
    currentUser = await prisma.user.findUnique({
      where: { id: sessionId },
      include: { userRoles: { include: { role: true } } }
    });
  } else {
    // Fallback for demo
    currentUser = await prisma.user.findFirst({
      where: { email: 'jburns@demo.com' },
      include: { userRoles: { include: { role: true } } }
    });
  }

  let isSystemAdmin = false;
  let primaryRole = 'PROJECT_DIRECTOR';

  if (currentUser) {
    primaryRole = currentUser.role || 'PROJECT_DIRECTOR';
    isSystemAdmin = primaryRole === 'SUPER_ADMIN' || (currentUser.userRoles && currentUser.userRoles.some((ur: any) => ur.role.roleCode === 'SUPER_ADMIN'));
  }

  // Respect simulated role
  const simulatedRole = cookieStore.get('simulatedRole')?.value;
  const effectiveRole = (simulatedRole && (primaryRole === 'SUPER_ADMIN' || primaryRole === 'ADMIN' || primaryRole === 'PROJECT_DIRECTOR' || primaryRole === 'DIRECTORS')) 
    ? simulatedRole 
    : primaryRole;

  if ((primaryRole === 'PROJECT_DIRECTOR' || primaryRole === 'DIRECTORS') && primaryRole !== 'SUPER_ADMIN' && primaryRole !== 'ADMIN') {
    redirect('/executive/home');
  }

  return (
    <RoleDashboardClient stats={stats} isSystemAdmin={isSystemAdmin} initialRole={primaryRole} />
  );
}
