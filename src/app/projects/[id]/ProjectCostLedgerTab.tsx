'use client';

import React, { useEffect, useState } from 'react';
import { getProjectCostLedger } from '@/app/actions/ledgerActions';

export default function ProjectCostLedgerTab({ projectId }: { projectId: string }) {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchLedger() {
      try {
        // Assume getProjectCostLedger exists, we will create it next.
        const res = await getProjectCostLedger(projectId);
        if (res.success) {
          setEntries(res.data);
        } else {
          setError(res.error || 'Failed to fetch ledger');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLedger();
  }, [projectId]);

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading Cost Ledger...</div>;
  if (error) return <div style={{ padding: '20px', color: '#ef4444' }}>Error: {error}</div>;

  const totalCost = entries.reduce((acc, entry) => acc + entry.netAmount, 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3>Actual Cost Ledger</h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            All approved actual expenses and transactions posted against the project.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Total Actual Cost</span>
          <h2 style={{ margin: 0, color: '#ef4444' }}>
            ₱ {totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
      </div>

      <div className="table-container">
        <table className="glass-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference No.</th>
              <th>Payee / Supplier</th>
              <th>Cost Code</th>
              <th>Description</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{new Date(entry.postingDate).toLocaleDateString()}</td>
                <td>{entry.referenceNumber}</td>
                <td>{entry.payeeName}</td>
                <td>{entry.costCode || 'UNCODED'}</td>
                <td style={{ maxWidth: '300px', whiteSpace: 'normal' }}>{entry.description}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                  ₱ {entry.netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    backgroundColor: entry.approvalStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: entry.approvalStatus === 'APPROVED' ? '#10b981' : '#f59e0b'
                  }}>
                    {entry.approvalStatus}
                  </span>
                </td>
              </tr>
            ))}
            {entries.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                  No actual cost entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
