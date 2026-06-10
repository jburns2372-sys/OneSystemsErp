import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import styles from '../../projects/page.module.css';
import Link from 'next/link';
import DeliveryWorkflowButtons from './DeliveryWorkflowButtons';

export const dynamic = 'force-dynamic';

export default async function DeliveryDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const delivery = await prisma.delivery.findUnique({
    where: { id: resolvedParams.id },
    include: {
      po: { include: { supplier: true, mr: { include: { project: true } } } },
      items: { include: { consolidatedBoqItem: true } },
      receivedBy: true,
      approvedBy: true,
    }
  });

  if (!delivery) notFound();

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  let currentUser = null;
  if (sessionId) {
    currentUser = await prisma.user.findUnique({ where: { id: sessionId }, select: { id: true, name: true, role: true } });
  }

  const isProjectAccountant = currentUser?.role === 'PROJECT_ACCOUNTANT' || currentUser?.role === 'SYSTEM_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div className={styles.container} style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className={styles.header}>
        <div>
          <Link href="/deliveries" style={{ color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }}>
            ← Back to Deliveries
          </Link>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            Delivery Receipt: {delivery.receiptNumber || 'N/A'}
            <span className={`${styles.badge} ${delivery.status === 'APPROVED' ? styles.badgeActive : styles.badgeInactive}`} style={{ fontSize: '1rem' }}>
              {delivery.status.replace(/_/g, ' ')}
            </span>
          </h1>
          <p style={{ marginTop: '10px', color: 'var(--text-secondary)' }}>
            Project: {delivery.po.mr.project.name} | Supplier: {delivery.po.supplier.name} | PO: {delivery.po.poNumber}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          {delivery.status === 'APPROVED' && (
            <Link href={`/deliveries/${delivery.id}/print`} target="_blank" style={{ textDecoration: 'none' }}>
              <button style={{ 
                padding: '10px 20px', 
                borderRadius: '8px', 
                background: 'white', 
                color: 'black', 
                border: 'none', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                🖨️ Print Official Record
              </button>
            </Link>
          )}
          
          <DeliveryWorkflowButtons 
            deliveryId={delivery.id} 
            status={delivery.status} 
            isProjectAccountant={isProjectAccountant} 
          />
        </div>
      </header>

      {delivery.isMismatch && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '12px', padding: '20px', marginBottom: '30px' }}>
          <h2 style={{ color: '#ef4444', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            ⚠️ PARTIAL / MISMATCHED DELIVERY
          </h2>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
            <strong>Footnote for Project Accountant:</strong> {delivery.mismatchNotes}
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-secondary)' }}>Encoding Details</h3>
          <p><strong>Encoded By:</strong> {delivery.receivedBy?.name || 'Unknown'}</p>
          <p><strong>Encoded Date:</strong> {new Date(delivery.createdAt).toLocaleString()}</p>
        </div>
        <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-secondary)' }}>Approval Details</h3>
          <p><strong>Approved By:</strong> {delivery.approvedBy?.name || 'Pending'}</p>
          <p><strong>Approval Date:</strong> {delivery.status === 'APPROVED' ? new Date(delivery.updatedAt).toLocaleString() : '---'}</p>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Item Description</th>
              <th>DR Qty</th>
              <th>Actual Qty</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            {delivery.items.map(item => (
              <tr key={item.id} style={{ background: item.drQuantity !== item.quantity ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                <td>{item.consolidatedBoqItem.category}</td>
                <td>{item.consolidatedBoqItem.description}</td>
                <td>{item.drQuantity !== null ? item.drQuantity : 'N/A'}</td>
                <td style={{ fontWeight: 'bold', color: item.drQuantity !== item.quantity ? '#ef4444' : 'inherit' }}>{item.quantity}</td>
                <td>{item.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
