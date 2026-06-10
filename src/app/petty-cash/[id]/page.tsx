import styles from '../../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PCLedgerClient from './PCLedgerClient';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PettyCashLedgerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const account = await prisma.pettyCashAccount.findUnique({
    where: { id },
    include: {
      project: true,
      custodian: true,
      expenses: { orderBy: { date: 'desc' } },
      replenishments: { orderBy: { createdAt: 'desc' } }
    }
  });

  if (!account) return notFound();

  const users = await prisma.user.findMany({ select: { id: true, name: true } });

  const percentageUsed = ((account.fundLimit - account.currentBalance) / account.fundLimit) * 100;
  
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/petty-cash" style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← Back to Petty Cash Accounts
          </Link>
          <h1 style={{ marginTop: '10px' }}>{account.accountName}</h1>
          <p>Ledger & Replenishment</p>
        </div>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>Fund Limit</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            ₱ {account.fundLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        
        <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>Current Balance</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: account.currentBalance < account.fundLimit * 0.2 ? '#ff6b6b' : 'var(--accent-color)' }}>
            ₱ {account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '5px' }}>Fund Utilization</div>
          <div style={{ width: '100%', height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', marginTop: '10px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(percentageUsed, 100)}%`, background: percentageUsed > 80 ? '#ff6b6b' : 'var(--accent-color)' }}></div>
          </div>
          <div style={{ fontSize: '0.8rem', textAlign: 'right', marginTop: '5px', color: '#aaa' }}>{percentageUsed.toFixed(1)}% Used</div>
        </div>
      </div>

      <PCLedgerClient account={account} users={users} />
    </div>
  );
}
