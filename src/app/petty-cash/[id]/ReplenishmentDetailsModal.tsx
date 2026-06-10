'use client';

import { useState } from 'react';
import { submitPettyCashReplenishment, processPettyCashReplenishment, releasePettyCashReplenishment } from '../../actions/pettyCashActions';
import { useRouter } from 'next/navigation';

export default function ReplenishmentDetailsModal({ replenishment, users, onClose }: { replenishment: any, users: any[], onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // States for processing
  const [remarks, setRemarks] = useState('');
  
  // States for releasing
  const [releaseMode, setReleaseMode] = useState('CASH');
  const [releaseRefNo, setReleaseRefNo] = useState('');
  const [receiverId, setReceiverId] = useState('');

  const handleAction = async (actionFn: () => Promise<any>) => {
    setLoading(true);
    setError('');
    const res = await actionFn();
    if (res.success) {
      router.refresh();
      onClose();
    } else {
      setError(res.error || 'Action failed');
    }
    setLoading(false);
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
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '30px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>Replenishment Details</h2>
          <span style={{ 
            padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold',
            background: 'rgba(255,255,255,0.1)', color: '#fff'
          }}>
            {replenishment.status}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px', fontSize: '0.9rem' }}>
          <div>
            <div style={{ color: '#aaa' }}>Request Number</div>
            <div style={{ color: '#fff', fontWeight: 'bold' }}>{replenishment.requestNumber}</div>
          </div>
          <div>
            <div style={{ color: '#aaa' }}>Amount Requested</div>
            <div style={{ color: '#00ffa3', fontWeight: 'bold', fontSize: '1.1rem' }}>
              ₱ {replenishment.amountRequested.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div style={{ color: '#aaa' }}>Fund Limit</div>
            <div style={{ color: '#fff' }}>₱ {replenishment.fundLimit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div>
            <div style={{ color: '#aaa' }}>Cash on Hand (at request)</div>
            <div style={{ color: '#fff' }}>₱ {replenishment.cashOnHand.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{error}</div>}

        <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
          {/* Actions based on status */}
          
          {replenishment.status === 'DRAFT' && (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleAction(() => submitPettyCashReplenishment(replenishment.id))}
                disabled={loading}
                style={{ flex: 1, background: 'var(--accent-color)', color: '#000', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Submit Request to Finance
              </button>
            </div>
          )}

          {replenishment.status === 'SUBMITTED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem' }}>Finance Review</p>
              <textarea 
                value={remarks} onChange={e => setRemarks(e.target.value)} 
                placeholder="Remarks (optional)"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--glass-border)', minHeight: '60px' }} 
              />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => handleAction(() => processPettyCashReplenishment(replenishment.id, 'APPROVE', remarks))}
                  disabled={loading}
                  style={{ flex: 1, background: 'var(--accent-color)', color: '#000', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Approve Request
                </button>
                <button 
                  onClick={() => handleAction(() => processPettyCashReplenishment(replenishment.id, 'REJECT', remarks))}
                  disabled={loading}
                  style={{ flex: 1, background: '#ff4444', color: '#fff', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Reject Request
                </button>
              </div>
            </div>
          )}

          {replenishment.status === 'APPROVED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ margin: 0, color: '#aaa', fontSize: '0.85rem' }}>Release Funds</p>
              <select value={releaseMode} onChange={e => setReleaseMode(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--glass-border)' }}>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
              <input 
                type="text" value={releaseRefNo} onChange={e => setReleaseRefNo(e.target.value)} placeholder="Reference Number (e.g. Cheque No)"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--glass-border)' }} 
              />
              <select value={receiverId} onChange={e => setReceiverId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--glass-border)' }}>
                <option value="">-- Received By --</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>

              <button 
                onClick={() => handleAction(() => releasePettyCashReplenishment(replenishment.id, releaseMode, releaseRefNo, receiverId))}
                disabled={loading || !receiverId}
                style={{ width: '100%', background: 'var(--accent-color)', color: '#000', padding: '12px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', opacity: !receiverId ? 0.5 : 1 }}
              >
                Mark as Released & Refit Ledger
              </button>
            </div>
          )}

          {replenishment.status === 'CLOSED' && (
            <div style={{ textAlign: 'center', color: 'var(--accent-color)', padding: '20px', background: 'rgba(0,255,163,0.1)', borderRadius: '6px' }}>
              This replenishment has been released and the petty cash fund has been fully refitted.
            </div>
          )}

        </div>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}>
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
