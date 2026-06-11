'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { approveAIOverride, rejectAIOverride } from '@/app/actions/aiOverrideActions';

export default function DirectorAuditClient({ pendingOverrides, recentLogs, currentUserId }: { pendingOverrides: any[], recentLogs: any[], currentUserId: string }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState('');

  const handleApprove = (id: string) => {
    if (!confirm('Approve this AI Exception Override? The staff will be notified to proceed.')) return;
    setActionError('');
    startTransition(async () => {
      const res = await approveAIOverride(id, currentUserId, 'PROJECT_DIRECTOR');
      if (res.success) {
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to approve');
      }
    });
  };

  const handleReject = (id: string) => {
    if (!confirm('Reject this override request? The transaction will remain blocked.')) return;
    setActionError('');
    startTransition(async () => {
      const res = await rejectAIOverride(id, currentUserId, 'PROJECT_DIRECTOR');
      if (res.success) {
        router.refresh();
      } else {
        setActionError(res.error || 'Failed to reject');
      }
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASSED': return '#00ffa3';
      case 'WARNING': return '#f39c12';
      case 'BLOCKING ISSUE': return '#ff6b6b';
      default: return '#fff';
    }
  };

  return (
    <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
      
      <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '12px', border: '1px solid var(--glass-border)', width: 'fit-content' }}>
        <button 
          onClick={() => setActiveTab('PENDING')}
          style={{ 
            background: activeTab === 'PENDING' ? 'var(--accent-color)' : 'transparent', 
            color: activeTab === 'PENDING' ? '#000' : 'var(--text-secondary)', 
            border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: activeTab === 'PENDING' ? 'bold' : 'normal',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
        >
          Pending Overrides ({pendingOverrides.length})
        </button>
        <button 
          onClick={() => setActiveTab('LOGS')}
          style={{ 
            background: activeTab === 'LOGS' ? 'var(--accent-color)' : 'transparent', 
            color: activeTab === 'LOGS' ? '#000' : 'var(--text-secondary)', 
            border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
            fontWeight: activeTab === 'LOGS' ? 'bold' : 'normal',
            transition: 'all 0.2s', whiteSpace: 'nowrap'
          }}
        >
          AI Activity Feed
        </button>
      </div>

      {actionError && (
        <div style={{ color: '#ff6b6b', background: 'rgba(255, 107, 107, 0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.3)' }}>
          {actionError}
        </div>
      )}

      {activeTab === 'PENDING' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          {pendingOverrides.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No pending override requests. All good!
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Module / Transaction</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Requested By</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>AI Block Reason</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>User Justification</th>
                  <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingOverrides.map(override => (
                  <tr key={override.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px 20px' }}>
                      <div style={{ fontWeight: 'bold' }}>{override.moduleName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ref: {override.transactionId}</div>
                    </td>
                    <td style={{ padding: '15px 20px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid var(--glass-border)' }}>
                        {override.overriddenByRole}
                      </span>
                    </td>
                    <td style={{ padding: '15px 20px', color: '#ff6b6b', maxWidth: '300px' }}>
                      {override.validationResult?.findings || 'Unknown block reason'}
                    </td>
                    <td style={{ padding: '15px 20px', maxWidth: '300px', fontStyle: 'italic', color: '#ccc' }}>
                      "{override.overrideReason}"
                    </td>
                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleReject(override.id)}
                          disabled={isPending}
                          style={{ background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '8px 16px', borderRadius: '6px', cursor: isPending ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                          onMouseOver={e => { e.currentTarget.style.background = '#ff6b6b'; e.currentTarget.style.color = '#fff'; }}
                          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#ff6b6b'; }}
                        >
                          Reject
                        </button>
                        <button 
                          onClick={() => handleApprove(override.id)}
                          disabled={isPending}
                          style={{ background: '#00ffa3', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '6px', cursor: isPending ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: 'all 0.2s' }}
                        >
                          Approve Exception
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'LOGS' && (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Module</th>
                <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '15px 20px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Findings</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  <td style={{ padding: '15px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '15px 20px', fontWeight: 'bold' }}>{log.moduleName}</td>
                  <td style={{ padding: '15px 20px' }}>
                    <span style={{ 
                      color: getStatusColor(log.validationStatus), 
                      fontWeight: 'bold',
                      background: `${getStatusColor(log.validationStatus)}22`,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${getStatusColor(log.validationStatus)}55`
                    }}>
                      {log.validationStatus}
                    </span>
                  </td>
                  <td style={{ padding: '15px 20px', maxWidth: '400px', fontSize: '0.9rem', color: '#ccc' }}>
                    {log.findings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
