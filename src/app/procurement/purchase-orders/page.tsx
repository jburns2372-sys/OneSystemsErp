import styles from '../../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function ProcurementPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  let currentUser = null;
  if (sessionId) {
    currentUser = await prisma.user.findUnique({ where: { id: sessionId } });
  }

  const isProcurement = currentUser?.role === 'PROCUREMENT_OFFICER' || currentUser?.role === 'PROCUREMENT';

  const pendingMRFs = isProcurement ? await prisma.materialRequest.findMany({
    where: { status: 'APPROVED' },
    include: { project: true }
  }) : [];

  const pos = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: { supplier: true, mr: { include: { project: true } } }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Procurement (POs)</h1>
          <p>Manage all purchase orders and supplier transactions.</p>
        </div>
      </header>

      {pendingMRFs.length > 0 && (
        <div style={{ marginBottom: '40px', backgroundColor: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.3)', padding: '20px', borderRadius: '12px' }}>
          <h2 style={{ color: '#facc15', margin: '0 0 15px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Action Required: Approved MRFs Awaiting PO
          </h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {pendingMRFs.map(mr => (
              <div key={mr.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>{mr.mrNumber}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>Project: {mr.project.name} | Needed By: {mr.dateNeeded ? new Date(mr.dateNeeded).toLocaleDateString() : 'N/A'}</div>
                </div>
                <Link 
                  href={`/procurement/purchase-orders/new?mrId=${mr.id}`}
                  style={{ backgroundColor: 'var(--accent-color)', color: '#000', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}
                >
                  Generate PO
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Project</th>
              <th>Supplier</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pos.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>No purchase orders found.</td>
              </tr>
            ) : pos.map(po => (
              <tr key={po.id}>
                <td>
                  <div className={styles.projectName}>{po.poNumber}</div>
                  <div className={styles.projectLocation}>{new Date(po.createdAt).toLocaleDateString()}</div>
                </td>
                <td>{po.mr?.project?.name || 'N/A'}</td>
                <td>{po.supplier.name}</td>
                <td className={styles.amount}>
                  ₱ {po.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td>
                  <span className={`${styles.badge} ${styles['status-' + po.status.toLowerCase()] || styles.badgeDefault}`}>
                    {po.status}
                  </span>
                </td>
                <td>
                  <Link href={`/procurement/${po.id}`} className={styles.actionLink}>View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
