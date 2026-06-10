import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import styles from '../projects/page.module.css';

export const dynamic = 'force-dynamic';

export default async function SupplierPayablesPage() {
  const payables = await prisma.accountsPayable.findMany({
    where: {
      status: { not: 'PAID' }
    },
    include: {
      delivery: true,
      po: {
        include: { supplier: true }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fiveDaysFromNow = new Date(today);
  fiveDaysFromNow.setDate(today.getDate() + 5);

  const maturingPayables = payables.filter(p => {
    const dueDate = new Date(p.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate >= today && dueDate <= fiveDaysFromNow;
  });

  return (
    <div className={styles.container} style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <header className={styles.header}>
        <div>
          <Link href="/finance" style={{ color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '10px', display: 'inline-block' }}>
            ← Back to Finance Hub
          </Link>
          <h1>Supplier Payables</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>Track outstanding balances to suppliers generated from approved material deliveries.</p>
        </div>
      </header>

      {maturingPayables.length > 0 && (
        <div style={{
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(0, 240, 255, 0.05)',
          border: '1px solid var(--accent-color)',
          borderRadius: '12px',
          display: 'flex',
          gap: '15px',
          alignItems: 'flex-start',
          boxShadow: '0 4px 15px rgba(0, 240, 255, 0.1)'
        }}>
          <div style={{ fontSize: '2rem' }}>🤖</div>
          <div>
            <h3 style={{ margin: '0 0 8px 0', color: 'var(--accent-color)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: 'var(--accent-color)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-color)' }}></span>
              AI Finance Assistant
            </h3>
            <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: '1.5' }}>
              Hello Finance Officer. Please note that there {maturingPayables.length === 1 ? 'is' : 'are'} <strong>{maturingPayables.length} payable{maturingPayables.length === 1 ? '' : 's'}</strong> maturing within the next 5 days. 
              Please ensure sufficient funds are allocated in the master budget to clear these upcoming dues.
            </p>
          </div>
        </div>
      )}

      <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>PO Number</th>
              <th>DR / Invoice No</th>
              <th>Delivery Date</th>
              <th>Amount Due (₱)</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {payables.map(payable => {
              const isOverdue = new Date(payable.dueDate) < new Date() && payable.status !== 'PAID';
              
              return (
                <tr key={payable.id}>
                  <td style={{ fontWeight: 'bold' }}>{payable.po.supplier.name}</td>
                  <td>{payable.po.poNumber}</td>
                  <td>{payable.delivery.receiptNumber || 'N/A'}</td>
                  <td>{new Date(payable.delivery.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    {payable.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ color: isOverdue ? '#ef4444' : 'inherit', fontWeight: isOverdue ? 'bold' : 'normal' }}>
                    {new Date(payable.dueDate).toLocaleDateString()}
                    {isOverdue && ' (OVERDUE)'}
                  </td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 'bold',
                      backgroundColor: payable.status === 'PENDING' ? 'rgba(234, 179, 8, 0.2)' : 
                                     payable.status === 'ACCRUED' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: payable.status === 'PENDING' ? '#eab308' : 
                             payable.status === 'ACCRUED' ? '#a855f7' : '#3b82f6'
                    }}>
                      {payable.status === 'ACCRUED' ? 'PDC ISSUED' : payable.status}
                    </span>
                  </td>
                  <td>
                    {payable.status !== 'PAID' ? (
                      <Link href={`/supplier-payables/${payable.id}`}>
                        <button style={{ 
                          padding: '6px 12px', 
                          background: 'var(--accent-color)', 
                          color: '#000', 
                          border: 'none', 
                          borderRadius: '4px', 
                          fontWeight: 'bold', 
                          cursor: 'pointer' 
                        }}>
                          {payable.status === 'ACCRUED' ? 'Clear Payment' : 'Issue Payment'}
                        </button>
                      </Link>
                    ) : (
                      <Link href={`/supplier-payables/${payable.id}`} style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>
                        View Payment
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            
            {payables.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No supplier payables found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
