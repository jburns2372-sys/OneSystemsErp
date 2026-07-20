import { verifySession } from '@/lib/dal/auth';
import styles from '../page.module.css';
import { prisma } from '@/lib/prisma';
import PayrollClient from './PayrollClient';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';

import PayrollSubNav from '@/components/PayrollSubNav';

export default async function PayrollPage() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  const currentUserId = sessionId || 'demo-user-id';

  const permissions = await getUserPermissions(currentUserId);

  const periods = await prisma.payrollPeriod.findMany({
    include: {
      _count: {
        select: { payrolls: true, dtrs: true }
      }
    },
    orderBy: { startDate: 'desc' }
  });

  const workers = await prisma.worker.findMany({
    orderBy: { lastName: 'asc' }
  });

  const projects = await prisma.project.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle} style={{ marginBottom: '15px' }}>
          <h1>Payroll Dashboard</h1>
        </div>
        <PayrollSubNav />
        <PayrollClient periods={periods} workers={workers} projects={projects} currentUserId={currentUserId} permissions={permissions} />
      </header>
    </div>
  );
}
