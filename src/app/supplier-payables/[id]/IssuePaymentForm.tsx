'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { issuePayment, clearAccruedPayment } from '@/app/actions/financeActions';

export default function IssuePaymentForm({ payable, userRole }: { payable: any, userRole: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const supplierTerms = payable.po?.supplier?.paymentTerms || 'CASH ON DELIVERY';

  const [formData, setFormData] = useState({
    amount: payable.amount - payable.paidAmount,
    paymentMethod: supplierTerms,
    paymentRef: '',
    paidAt: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0] // Default to GMT+8 today
  });

  const isPaid = payable.status === 'PAID';
  const isAccrued = payable.status === 'ACCRUED';
  const canIssue = userRole === 'COST_CONTROLLER' || userRole === 'FINANCE_OFFICER' || userRole === 'SYSTEM_ADMIN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canIssue) return;
    
    setLoading(true);
    setError('');
    
    try {
      await issuePayment(payable.id, formData);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to issue payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    if (!canIssue) return;
    setLoading(true);
    setError('');
    try {
      await clearAccruedPayment(payable.id);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to clear payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
        Payment Processing
      </h2>
      
      {isPaid ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
          <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Payment Completely Issued</h3>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Method: <strong>{payable.paymentMethod}</strong></p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Reference: <strong>{payable.paymentRef}</strong></p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Date: <strong>{payable.paidAt ? new Date(payable.paidAt).toLocaleDateString() : 'N/A'}</strong></p>
        </div>
      ) : isAccrued ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '8px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>⏳</div>
          <h3 style={{ color: '#a855f7', margin: '0 0 10px 0' }}>Post-Dated Check Issued</h3>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Method: <strong>{payable.paymentMethod}</strong></p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Reference: <strong>{payable.paymentRef}</strong></p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Date Issued: <strong>{payable.paidAt ? new Date(payable.paidAt).toLocaleDateString() : 'N/A'}</strong></p>
          
          <button 
            onClick={handleClear}
            disabled={loading || !canIssue}
            style={{ 
              width: '100%', 
              marginTop: '20px',
              padding: '16px', 
              background: canIssue ? '#a855f7' : 'var(--bg-primary)', 
              color: '#fff', 
              border: 'none', 
              borderRadius: '8px', 
              fontWeight: 'bold', 
              fontSize: '1.1rem',
              cursor: canIssue ? 'pointer' : 'not-allowed',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Processing...' : 'Mark Check as Cleared'}
          </button>
          {!canIssue && <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.9rem', marginTop: '10px' }}>You do not have permission to clear payments.</p>}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div style={{ color: '#ef4444', padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Amount to Pay (₱)</label>
            <input 
              type="number" 
              step="0.01"
              required
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
              max={payable.amount - payable.paidAmount}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--glass-border)', 
                color: 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Payment Method</label>
              <select 
                value={formData.paymentMethod}
                onChange={e => setFormData({...formData, paymentMethod: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--glass-border)', 
                  color: 'var(--text-primary)',
                  borderRadius: '6px'
                }}
              >
                <option value="CASH ON DELIVERY">CASH ON DELIVERY</option>
                <option value="DATED CHECK ON DELIVERY">DATED CHECK ON DELIVERY</option>
                <option value="PDC 30">PDC 30</option>
                <option value="PDC 45">PDC 45</option>
                <option value="PDC 60">PDC 60</option>
                <option value="PDC 90">PDC 90</option>
                <option value="PDC 180">PDC 180</option>
                <option value="BANK TRANSFER">BANK TRANSFER</option>
                <option value="GCASH">GCASH</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Date of Payment</label>
              <input 
                type="date"
                required
                value={formData.paidAt}
                onChange={e => setFormData({...formData, paidAt: e.target.value})}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--glass-border)', 
                  color: 'var(--text-primary)',
                  borderRadius: '6px'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Reference Number (e.g. Check No.)</label>
            <input 
              type="text" 
              required
              placeholder="Enter reference number..."
              value={formData.paymentRef}
              onChange={e => setFormData({...formData, paymentRef: e.target.value})}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: 'var(--bg-primary)', 
                border: '1px solid var(--glass-border)', 
                color: 'var(--text-primary)',
                borderRadius: '6px'
              }}
            />
          </div>

          <div style={{ marginTop: '10px' }}>
            <button 
              type="submit" 
              disabled={loading || !canIssue}
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: canIssue ? 'var(--accent-color)' : 'var(--bg-primary)', 
                color: '#000', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '1.1rem',
                cursor: canIssue ? 'pointer' : 'not-allowed',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Processing...' : 'Confirm & Issue Payment'}
            </button>
            {!canIssue && <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.9rem', marginTop: '10px' }}>You do not have permission to issue payments.</p>}
          </div>
        </form>
      )}
    </div>
  );
}
