'use client';

import { useState } from 'react';
import { approvePaymentProfile, holdPaymentProfile } from '@/app/actions/workerActions';

export default function PaymentProfileControls({ worker }: { worker: any }) {
  const [loading, setLoading] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [holdReason, setHoldReason] = useState('');

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve and verify this payment profile?')) return;
    setLoading(true);
    const res = await approvePaymentProfile(worker.id);
    setLoading(false);
    if (res.success) {
      alert('Payment profile approved.');
    } else {
      alert(res.error || 'Failed to approve.');
    }
  };

  const handleHold = async () => {
    if (!holdReason) {
      alert('Please provide a reason for holding the payment profile.');
      return;
    }
    setLoading(true);
    const res = await holdPaymentProfile(worker.id, holdReason);
    setLoading(false);
    if (res.success) {
      setShowHoldModal(false);
      setHoldReason('');
      alert('Payment profile placed on hold.');
    } else {
      alert(res.error || 'Failed to hold.');
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)', marginTop: '20px' }}>
      <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginTop: 0 }}>Payment Profile Verification</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div>
          <p><strong>Allowed Payment Method:</strong> {worker.allowedPaymentMethod}</p>
          <p><strong>Profile Status:</strong> <span style={{ color: worker.paymentProfileStatus === 'Verified' ? '#2ecc71' : worker.paymentProfileStatus === 'Pending' ? '#f1c40f' : '#e74c3c' }}>{worker.paymentProfileStatus}</span></p>
          {worker.paymentHoldReason && <p><strong>Hold Reason:</strong> <span style={{ color: '#e74c3c' }}>{worker.paymentHoldReason}</span></p>}
        </div>
        
        <div>
          {worker.allowedPaymentMethod === 'GCash Only' && (
            <>
              <p><strong>GCash Number:</strong> {worker.gcashNumber || <span style={{ color: '#e74c3c' }}>Missing</span>}</p>
              <p><strong>Account Name:</strong> {worker.gcashAccountName || <span style={{ color: '#e74c3c' }}>Missing</span>}</p>
              <p><strong>Verification:</strong> {worker.gcashVerificationStatus}</p>
              <p><strong>Last Approved By:</strong> {worker.gcashApprovedBy || 'None'}</p>
            </>
          )}

          {worker.allowedPaymentMethod === 'Bank Transfer Only' && (
            <>
              <p><strong>Bank Name:</strong> {worker.bankName || <span style={{ color: '#e74c3c' }}>Missing</span>}</p>
              <p><strong>Account Number:</strong> {worker.bankAccountNumber || <span style={{ color: '#e74c3c' }}>Missing</span>}</p>
              <p><strong>Account Name:</strong> {worker.bankAccountName || <span style={{ color: '#e74c3c' }}>Missing</span>}</p>
              <p><strong>Verification:</strong> {worker.bankVerificationStatus}</p>
              <p><strong>Last Approved By:</strong> {worker.bankApprovedBy || 'None'}</p>
            </>
          )}
        </div>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleApprove} 
          disabled={loading || worker.paymentProfileStatus === 'Verified'}
          style={{ background: '#2ecc71', color: '#fff', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Approve Profile
        </button>
        <button 
          onClick={() => setShowHoldModal(true)} 
          disabled={loading || worker.paymentProfileStatus === 'On Hold'}
          style={{ background: '#e74c3c', color: '#fff', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          Place on Hold
        </button>
      </div>

      {showHoldModal && (
        <div style={{ marginTop: '15px', background: 'rgba(255,255,255,0.05)', padding: '15px', borderRadius: '8px' }}>
          <h4>Hold Reason</h4>
          <input 
            type="text" 
            value={holdReason} 
            onChange={e => setHoldReason(e.target.value)} 
            placeholder="e.g. Account name mismatch"
            style={{ width: '100%', padding: '8px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #555', background: '#222', color: '#fff' }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleHold} disabled={loading} style={{ background: '#e74c3c', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: '4px' }}>Confirm Hold</button>
            <button onClick={() => setShowHoldModal(false)} disabled={loading} style={{ background: '#555', color: '#fff', padding: '6px 12px', border: 'none', borderRadius: '4px' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
