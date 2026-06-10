'use client';

import { useState } from 'react';
import { approveFundingRequest } from '@/app/actions/fundingActions';
import { useRouter } from 'next/navigation';

export default function AccountDetailsClient({ account }: { account: any }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'LEDGER' | 'FUNDING'>('LEDGER');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleApproveFunding = async (id: string) => {
    if (!confirm('Are you sure you want to approve this funding request? This will virtually deposit the requested amount into this Payroll Bank Account ledger.')) return;
    
    setLoadingId(id);
    const res = await approveFundingRequest(id);
    setLoadingId(null);
    
    if (res.success) {
      alert('Funding Request Approved and deposited successfully!');
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)' }}>
        <button 
          onClick={() => setActiveTab('LEDGER')}
          style={{ flex: 1, padding: '15px', background: activeTab === 'LEDGER' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'LEDGER' ? 'bold' : 'normal' }}
        >
          Bank Ledger History
        </button>
        <button 
          onClick={() => setActiveTab('FUNDING')}
          style={{ flex: 1, padding: '15px', background: activeTab === 'FUNDING' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: activeTab === 'FUNDING' ? 'bold' : 'normal' }}
        >
          Funding Requests ({account.fundingRequests.filter((r: any) => r.status === 'PENDING').length} Pending)
        </button>
      </div>

      <div style={{ padding: '20px', overflowX: 'auto' }}>
        {activeTab === 'LEDGER' && (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '10px', color: '#888' }}>Date</th>
                <th style={{ padding: '10px', color: '#888' }}>Type</th>
                <th style={{ padding: '10px', color: '#888' }}>Amount</th>
                <th style={{ padding: '10px', color: '#888' }}>Balance After</th>
                <th style={{ padding: '10px', color: '#888' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {account.ledgers.map((l: any) => (
                <tr key={l.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px' }}>{new Date(l.transactionDate || l.createdAt || new Date()).toLocaleString()}</td>
                  <td style={{ padding: '10px', color: l.transactionType === 'DEPOSIT' ? '#2ecc71' : '#e74c3c' }}>{l.transactionType}</td>
                  <td style={{ padding: '10px' }}>₱ {l.amount.toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>₱ {l.balanceAfter.toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>{l.remarks || '-'}</td>
                </tr>
              ))}
              {account.ledgers.length === 0 && (
                <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No ledger transactions yet.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'FUNDING' && (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #333' }}>
                <th style={{ padding: '10px', color: '#888' }}>Request #</th>
                <th style={{ padding: '10px', color: '#888' }}>Date</th>
                <th style={{ padding: '10px', color: '#888' }}>Requested Amount</th>
                <th style={{ padding: '10px', color: '#888' }}>Reason</th>
                <th style={{ padding: '10px', color: '#888' }}>Status</th>
                <th style={{ padding: '10px', color: '#888' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {account.fundingRequests.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #222' }}>
                  <td style={{ padding: '10px' }}>{r.fundingRequestNumber}</td>
                  <td style={{ padding: '10px' }}>{new Date(r.createdAt || r.requestDate || new Date()).toLocaleDateString()}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>₱ {(r.totalRequiredFunding || r.requestedAmount || 0).toLocaleString()}</td>
                  <td style={{ padding: '10px' }}>{r.remarks || '-'}</td>
                  <td style={{ padding: '10px', color: (r.fundingStatus || r.status) === 'APPROVED' ? '#2ecc71' : '#f1c40f' }}>{r.fundingStatus || r.status}</td>
                  <td style={{ padding: '10px' }}>
                    {(r.fundingStatus || r.status) === 'PENDING' && (
                      <button 
                        onClick={() => handleApproveFunding(r.id)}
                        disabled={loadingId === r.id}
                        style={{ background: '#2ecc71', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Approve & Deposit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {account.fundingRequests.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#888' }}>No funding requests found.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
