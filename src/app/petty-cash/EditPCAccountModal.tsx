'use client';

import { useState } from 'react';
import { updatePettyCashAccount } from '../actions/pettyCashActions';
import { useRouter } from 'next/navigation';

export default function EditPCAccountModal({ account, onClose, projects, users }: { account: any, onClose: () => void, projects: any[], users: any[] }) {
  const router = useRouter();
  const [accountName, setAccountName] = useState(account.accountName);
  const [projectId, setProjectId] = useState(account.projectId || '');
  const [custodianId, setCustodianId] = useState(account.custodianId);
  const [fundLimit, setFundLimit] = useState(account.fundLimit.toString());
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!accountName || !custodianId || !fundLimit) {
      setError('Please fill in Account Name, Custodian, and Fund Limit.');
      return;
    }

    setLoading(true);
    const res = await updatePettyCashAccount(account.id, {
      accountName,
      projectId: projectId || undefined,
      custodianId,
      fundLimit: parseFloat(fundLimit)
    });

    if (res.success) {
      router.refresh();
      onClose();
    } else {
      setError(res.error || 'Failed to update account');
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
        <h2 style={{ margin: '0 0 20px 0', color: 'var(--accent-color)' }}>Edit Petty Cash Account</h2>
        
        {error && <div style={{ background: 'rgba(255,50,50,0.1)', color: '#ff6b6b', padding: '10px', borderRadius: '6px', marginBottom: '15px' }}>{error}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.85rem' }}>Account Details *</label>
            <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--glass-border)' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.85rem' }}>Project (Locked)</label>
            <select value={projectId} disabled style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#666', border: '1px solid var(--glass-border)', cursor: 'not-allowed' }}>
              <option value="">-- No specific project --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.85rem' }}>Custodian *</label>
            <select value={custodianId} onChange={e => setCustodianId(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--glass-border)' }}>
              <option value="">-- Select Custodian --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.85rem' }}>Fund Limit (Locked)</label>
            <input type="number" value={fundLimit} disabled style={{ width: '100%', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(255,255,255,0.05)', color: '#666', border: '1px solid var(--glass-border)', cursor: 'not-allowed' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={onClose} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid #444', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '12px', background: 'var(--accent-color)', border: 'none', color: '#000', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
