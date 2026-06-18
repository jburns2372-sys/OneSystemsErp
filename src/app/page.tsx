import styles from './page.module.css';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

import { getDashboardStats } from '@/app/actions/project';
import RoleDashboardClient from './RoleDashboardClient';

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
    isSystemAdmin = primaryRole === 'SYSTEM_ADMIN' || (currentUser.userRoles && currentUser.userRoles.some((ur: any) => ur.role.roleCode === 'SYSTEM_ADMIN'));
  }

  return (
    <RoleDashboardClient stats={stats} isSystemAdmin={isSystemAdmin} initialRole={primaryRole} />
  );
}
