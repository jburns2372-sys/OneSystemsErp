import { prisma } from '@/lib/prisma';
import AccountDetailsClient from './AccountDetailsClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PayrollAccountDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const account = await prisma.payrollBankAccount.findUnique({
    where: { id },
    include: {
      ledgers: {
        orderBy: { createdAt: 'desc' }
      },
      fundingRequests: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!account) {
    return <div style={{ padding: '20px', color: '#fff' }}>Account not found.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{account.bankName} - {account.accountNumber}</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>
            Account Name: {account.accountName} | Currency: {account.currency}
          </p>
        </div>
        <Link href="/finance/payroll-accounts" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
          Back to Accounts
        </Link>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Current Available Balance</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#2ecc71', fontWeight: 'bold' }}>₱ {account.currentAvailableBalance.toLocaleString()}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Reserved for Payroll</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: '#e67e22', fontWeight: 'bold' }}>₱ {account.reservedPayrollBalance.toLocaleString()}</p>
        </div>
        <div style={{ background: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Status</h3>
          <p style={{ fontSize: '2rem', margin: 0, color: account.status === 'ACTIVE' ? '#2ecc71' : '#e74c3c', fontWeight: 'bold' }}>{account.status}</p>
        </div>
      </div>

      <AccountDetailsClient account={account} />
    </div>
  );
}
