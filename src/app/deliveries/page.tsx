import styles from '../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function DeliveriesPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  let userRole = null;
  if (sessionId) {
    const user = await prisma.user.findUnique({ where: { id: sessionId }, select: { role: true } });
    userRole = user?.role;
  }

  const isStockman = userRole === 'STOCKMAN' || userRole === 'SYSTEM_ADMIN' || userRole === 'ADMIN';

  const deliveries = await prisma.delivery.findMany({
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
        {isStockman && (
          <Link href="/deliveries/new" className={styles.primaryButton}>+ Receive Delivery</Link>
        )}
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
