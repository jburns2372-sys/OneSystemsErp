import styles from '../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PermissionGuard from '@/components/PermissionGuard';
import { getUserPermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function DeliveriesPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  let currentUser = null;
  let permissions: Record<string, any> = {};

  if (sessionId) {
    currentUser = await prisma.user.findUnique({ where: { id: sessionId }, select: { id: true, role: true } });
    if (currentUser) {
      permissions = await getUserPermissions(currentUser.id);
    }
  }

  const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'SYSTEM_ADMIN';

  const deliveriesFilter: any = {};
  if (!isSuperAdmin || activeProjectId) {
    deliveriesFilter.po = { mr: { ...(!isSuperAdmin ? { project: { userAssignments: { some: { userId: sessionId, assignmentStatus: 'active' } } } } : {}) } };
    if (activeProjectId) deliveriesFilter.po.mr.projectId = activeProjectId;
  }

  const deliveries = await prisma.delivery.findMany({
    where: deliveriesFilter,
    orderBy: { date: 'desc' },
    include: { po: { include: { mr: { include: { project: true } } } } }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Deliveries</h1>
          <p>Track materials received on-site.</p>
        </div>
        <PermissionGuard permissions={permissions} moduleName="DELIVERY_RECEIVING" action="canCreate">
          <Link href="/deliveries/new" className={styles.primaryButton}>+ Receive Delivery</Link>
        </PermissionGuard>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>DR Number</th>
              <th>Project</th>
              <th>Related PO</th>
              <th>Delivery Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>No deliveries logged.</td>
              </tr>
            ) : deliveries.map(delivery => (
              <tr key={delivery.id}>
                <td>
                  <div className={styles.projectName}>{delivery.receiptNumber || 'No DR'}</div>
                </td>
                <td>{delivery.po?.mr?.project?.name || 'N/A'}</td>
                <td>{delivery.po?.poNumber || 'N/A'}</td>
                <td>{new Date(delivery.date).toLocaleDateString()}</td>
                <td>
                  <span className={`${styles.badge} ${delivery.status === 'APPROVED' ? styles.badgeActive : styles.badgeInactive}`}>
                    {delivery.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td>
                  <Link href={`/deliveries/${delivery.id}`} className={styles.actionLink}>View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
