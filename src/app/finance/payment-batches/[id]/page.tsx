import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import BatchDetailClient from './BatchDetailClient';
import AIAuditClient from './AIAuditClient';
import ReconciliationUploader from './ReconciliationUploader';

export const dynamic = 'force-dynamic';

export default async function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const batch = await prisma.paymentBatch.findUnique({
    where: { id },
    include: {
      payrollPeriod: true,
      payrollBankAccount: true,
      rows: {
        include: { worker: true }
      }
    }
  });

  if (!batch) {
    return <div style={{ padding: '20px', color: '#fff' }}>Batch not found.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Batch: {batch.batchNumber}</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>
            Type: {batch.paymentMethodType} | Status: <span style={{ color: '#f1c40f' }}>{batch.status}</span>
          </p>
        </div>
        <Link href="/finance/payment-batches" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
          Back to Batches
        </Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Total Amount</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#2ecc71', fontWeight: 'bold' }}>₱ {batch.totalAmount.toLocaleString()}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Total Payslips</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#fff', fontWeight: 'bold' }}>{batch.totalWorkers}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Funding Account</h3>
          <p style={{ fontSize: '1.2rem', margin: 0, color: '#fff', fontWeight: 'bold' }}>{batch.payrollBankAccount.bankName}</p>
          <p style={{ margin: 0, color: '#888' }}>{batch.payrollBankAccount.accountNumber}</p>
        </div>
      </div>

      <AIAuditClient 
        batchId={batch.id} 
        existingRiskLevel={batch.aiRiskLevel || undefined} 
        existingNotes={batch.aiAuditNotes || undefined} 
      />

      <BatchDetailClient batch={batch} />

      <ReconciliationUploader 
        batchId={batch.id} 
        disabled={batch.status === 'RELEASED' || batch.status === 'SUCCESSFUL'} 
      />
    </div>
  );
}
