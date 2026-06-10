'use client';

import { useState } from 'react';
import { createPettyCashReplenishment } from '../../actions/pettyCashActions';
import { useRouter } from 'next/navigation';

export default function ReplenishmentModal({ account, onClose }: { account: any, onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Find all PENDING expenses
  const pendingExpenses = account.expenses.filter((e: any) => e.status === 'PENDING' && !e.replenishmentId);
  const totalAmount = pendingExpenses.reduce((sum: number, e: any) => sum + e.amount, 0);

  const handleSubmit = async () => {
    if (pendingExpenses.length === 0) {
      setError('No pending expenses to replenish.');
      return;
    }

    setLoading(true);
    const res = await createPettyCashReplenishment(
      account.id, 
      pendingExpenses.map((e: any) => e.id)
    );

    if (res.success) {
      router.refresh();
      onClose();
    } else {
      setError((res as any).error || 'Failed to create replenishment request');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 99999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)', padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'var(--bg-dark, #1a1a2e)',
        borderRadius: '16px',
        border: '1px solid var(--glass-border, rgba(255,255,255,0.1))',
        width: '100%',
        maxWidth: '500px',
        padding: '30px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: 'var(--accent-color)' }}>Request Replenishment</h2>
        
        {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{error}</div>}

        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#aaa', fontSize: '0.9rem' }}>
            <span>Unreplenished Expenses:</span>
            <strong style={{ color: '#fff' }}>{pendingExpenses.length} items</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: '#aaa', fontSize: '0.9rem' }}>
            <span>Current Balance:</span>
            <strong style={{ color: '#fff' }}>₱ {account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ height: '1px', background: 'var(--glass-border)', margin: '15px 0' }}></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '1.1rem' }}>Replenishment Amount:</span>
            <strong style={{ fontSize: '1.5rem', color: 'var(--accent-color)' }}>
              ₱ {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </strong>
          </div>
        </div>

        {pendingExpenses.length === 0 ? (
          <p style={{ color: '#ff6b6b', textAlign: 'center', marginBottom: '20px' }}>
            You must log expenses before you can request a replenishment.
          </p>
        ) : (
          <p style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
            This will group all {pendingExpenses.length} pending expenses into a formal liquidation request for finance review.
          </p>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || pendingExpenses.length === 0} 
            style={{ flex: 1, padding: '12px', background: 'var(--accent-color)', border: 'none', color: '#000', borderRadius: '6px', cursor: (loading || pendingExpenses.length === 0) ? 'not-allowed' : 'pointer', fontWeight: 'bold', opacity: (loading || pendingExpenses.length === 0) ? 0.5 : 1 }}
          >
            {loading ? 'Processing...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
