import { verifySession } from '@/lib/dal/auth';
// @ts-nocheck
import styles from './page.module.css';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

import { getDashboardStats } from '@/app/actions/project';
import RoleDashboardClient from './RoleDashboardClient';
import { redirect } from 'next/navigation';

export default async function Home() {
  const __session = await verifySession();
  if (!__session?.id) {
    redirect('/login');
  }

  const stats = await getDashboardStats();
  const cookieStore = await cookies();
  const sessionId = __session.id;

  let currentUser = null;
  if (sessionId) {
    currentUser = await prisma.user.findUnique({
      where: { id: sessionId },
      include: { userRoles: { include: { role: true } } }
    });
  }

  let isSystemAdmin = false;
  let primaryRole = 'PROJECT_DIRECTOR';

  if (currentUser) {
    primaryRole = currentUser.role || 'PROJECT_DIRECTOR';
    if (primaryRole === 'SUPER_ADMIN' || primaryRole === 'SYSTEM_ADMIN') {
      let primaryRoleRecord = await prisma.role.findFirst({
        where: { OR: [{ roleCode: primaryRole }, { roleName: primaryRole }] },
        select: { isActive: true },
      });
      if (!primaryRoleRecord && primaryRole === 'SYSTEM_ADMIN') {
        primaryRoleRecord = await prisma.role.findFirst({
          where: { OR: [{ roleCode: 'SUPER_ADMIN' }, { roleName: 'SUPER_ADMIN' }] },
          select: { isActive: true },
        });
      }
      isSystemAdmin = primaryRoleRecord?.isActive === true;
    }
  }

  // Only global system admins can simulate roles; simulation never alters real role redirects
  const simulatedRole = isSystemAdmin ? cookieStore.get('simulatedRole')?.value : undefined;

  if (primaryRole === 'DIRECTORS' && !simulatedRole) {
    redirect('/executive/home');
  }

  return (
    <RoleDashboardClient stats={stats} isSystemAdmin={isSystemAdmin} initialRole={primaryRole} />
  );
}
