import { verifySession } from '@/lib/dal/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PermissionGuard from '@/components/PermissionGuard';
import { getUserPermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function PaymentBatchesPage() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  let currentUser = null;
  let permissions: Record<string, any> = {};

  if (sessionId) {
    currentUser = await prisma.user.findUnique({ where: { id: sessionId }, select: { id: true, role: true } });
    if (currentUser) {
      permissions = await getUserPermissions(currentUser.id);
    }
  }

  const batches = await prisma.paymentBatch.findMany({
    include: {
      payrollPeriod: true,
      payrollBankAccount: true,
      _count: { select: { rows: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Payment Batches</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>
            Manage and export GCash and Bank Transfer batches.
          </p>
        </div>
        <PermissionGuard permissions={permissions} moduleName="PAYROLL" action="canReleasePayment">
          <Link href="/finance/payment-batches/new" style={{ background: 'var(--accent-color)', color: '#000', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: 'bold' }}>
            + Generate New Batch
          </Link>
        </PermissionGuard>
      </header>

      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '12px 8px', color: '#888' }}>Batch No.</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Created Date</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Type</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Total Amount</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Payslips</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Funding Account</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Status</th>
              <th style={{ padding: '12px 8px', color: '#888' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {batches.map(b => (
              <tr key={b.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{b.batchNumber}</td>
                <td style={{ padding: '12px 8px' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: '12px 8px' }}>{b.paymentMethodType}</td>
                <td style={{ padding: '12px 8px', fontWeight: 'bold', color: '#2ecc71' }}>₱ {b.totalAmount.toLocaleString()}</td>
                <td style={{ padding: '12px 8px' }}>{b._count.rows}</td>
                <td style={{ padding: '12px 8px' }}>{b.payrollBankAccount.bankName}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ color: b.status === 'COMPLETED' ? '#2ecc71' : '#f1c40f' }}>{b.status}</span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <Link href={`/finance/payment-batches/${b.id}`} style={{ color: '#3498db', textDecoration: 'none' }}>View & Export</Link>
                </td>
              </tr>
            ))}
            {batches.length === 0 && (
              <tr><td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No payment batches generated yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
