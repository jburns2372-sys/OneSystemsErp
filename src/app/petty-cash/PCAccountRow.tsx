'use client';

import { useState } from 'react';
import { updatePettyCashAccount } from '../actions/pettyCashActions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../projects/page.module.css';

export default function PCAccountRow({ account, projects, users }: { account: any, projects: any[], users: any[] }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  const [accountName, setAccountName] = useState(account.accountName);
  const [custodianId, setCustodianId] = useState(account.custodianId);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!accountName || !custodianId) {
      alert('Please fill in Account Details and Custodian.');
      return;
    }

    setLoading(true);
    const res = await updatePettyCashAccount(account.id, {
      accountName,
      projectId: account.projectId || undefined,
      custodianId,
      fundLimit: account.fundLimit
    });

    if (res.success) {
      setIsEditing(false);
      router.refresh();
    } else {
      alert(res.error || 'Failed to update account');
    }
    setLoading(false);
  };

  return (
    <tr>
      <td>
        {isEditing ? (
          <input 
            type="text" 
            value={accountName} 
            onChange={e => setAccountName(e.target.value)} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--accent-color)' }} 
          />
        ) : (
          <div className={styles.projectName}>{account.accountName}</div>
        )}
      </td>
      <td>{account.project?.name || 'N/A'}</td>
      <td>
        {isEditing ? (
          <select 
            value={custodianId} 
            onChange={e => setCustodianId(e.target.value)} 
            style={{ width: '100%', padding: '8px', borderRadius: '4px', backgroundColor: '#16213e', color: '#fff', border: '1px solid var(--accent-color)' }}
          >
            <option value="">-- Select --</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        ) : (
          account.custodian?.name || 'N/A'
        )}
      </td>
      <td className={styles.amount}>
        ₱ {account.currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
      </td>
      <td>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          {isEditing ? (
            <>
              <button onClick={handleSave} disabled={loading} style={{ background: 'var(--accent-color)', border: 'none', color: '#000', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                {loading ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', textDecoration: 'underline' }}>
                Edit
              </button>
              <Link href={`/petty-cash/${account.id}`} className={styles.actionLink}>
                View Ledger
              </Link>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
