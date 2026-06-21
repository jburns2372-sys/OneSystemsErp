'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { endorseSubcontractPayment, approveSubcontractPayment, rejectSubcontractPayment } from '@/app/actions/progressActions';

export default function SubcontractPaymentForm({ 
  billing, 
  userRole, 
  canIssue 
}: { 
  billing: any; 
  userRole: string; 
  canIssue: boolean; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    amount: billing.netPayable,
    paymentMethod: 'BANK TRANSFER',
    paymentRef: '',
    paidAt: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString().split('T')[0] // GMT+8 today
  });

  const isPaid = billing.paymentStatus === 'PAID' || billing.status === 'PAID';
  const isEndorsed = billing.endorsedForPayment;
  const isDirector = userRole === 'PROJECT_DIRECTOR' || userRole === 'SUPER_ADMIN';

  const handleEndorse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canIssue) return;
    setLoading(true);
    setError('');

    try {
      const res = await endorseSubcontractPayment(billing.id, formData);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Failed to endorse payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to endorse payment');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!isDirector) return;
    setLoading(true);
    setError('');

    try {
      const res = await approveSubcontractPayment(billing.id);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Failed to approve payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve payment');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!isDirector) return;
    setLoading(true);
    setError('');

    try {
      const res = await rejectSubcontractPayment(billing.id);
      if (res.success) {
        router.refresh();
      } else {
        setError(res.error || 'Failed to reject payment');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reject payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--text-primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
        Disbursement Processing
      </h2>

      {error && (
        <div style={{ color: '#ef4444', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {isPaid ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
          <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>Payment Released</h3>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Method: <strong>{billing.paymentMethod}</strong></p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Reference: <strong>{billing.paymentRef}</strong></p>
          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>Approved Date: <strong>{billing.paidAt ? new Date(billing.paidAt).toLocaleDateString() : 'N/A'}</strong></p>
        </div>
      ) : isEndorsed ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '20px', borderRadius: '8px', border: '1px dashed #fbbf24' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '8px', background: '#fbbf24', borderRadius: '50%' }}></span>
              Endorsed for Director's Approval
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '0.9rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Method</span>
                <strong style={{ color: 'var(--text-primary)' }}>{billing.paymentMethod}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Reference</span>
                <strong style={{ color: 'var(--text-primary)' }}>{billing.paymentRef || 'N/A'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Date</span>
                <strong style={{ color: 'var(--text-primary)' }}>{billing.paidAt ? new Date(billing.paidAt).toLocaleDateString() : 'N/A'}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)' }}>Amount</span>
                <strong style={{ color: 'var(--accent-color)' }}>₱{billing.netPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
              </div>
            </div>
          </div>

          {isDirector ? (
            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button 
                onClick={handleApprove}
                disabled={loading}
                style={{ 
                  flex: 1, 
                  padding: '14px', 
                  background: '#10b981', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Approving...' : '✓ Approve Disbursement'}
              </button>
              <button 
                onClick={handleReject}
                disabled={loading}
                style={{ 
                  padding: '14px 20px', 
                  background: '#ef4444', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '8px', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                ✕ Reject
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '6px' }}>
              ⏳ Waiting for Project Director or System Admin approval.
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleEndorse} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Amount to Pay (₱)</label>
            <input 
              type="number" 
              step="0.01"
              required
              disabled
              value={formData.amount}
              style={{ 
                width: '100%', 
                padding: '12px', 
                background: 'rgba(255,255,255,0.03)', 
                border: '1px solid var(--glass-border)', 
                color: 'var(--text-primary)',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'not-allowed'
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
                <option value="BANK TRANSFER">BANK TRANSFER</option>
                <option value="CHECK ISSUANCE">CHECK ISSUANCE</option>
                <option value="GCASH">GCASH</option>
                <option value="CASH">CASH</option>
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
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)' }}>Reference Number (e.g. Check No / Transfer Ref)</label>
            <input 
              type="text" 
              required
              placeholder="Enter check number or transfer ref..."
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
              {loading ? 'Processing...' : 'Endorse Payment to Project Director'}
            </button>
            {!canIssue && <p style={{ textAlign: 'center', color: '#ef4444', fontSize: '0.9rem', marginTop: '10px' }}>You do not have permission to prepare payments.</p>}
          </div>
        </form>
      )}
    </div>
  );
}
