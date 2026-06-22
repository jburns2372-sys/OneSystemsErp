'use client';

import React, { useEffect, useState } from 'react';
import { getProjectProfitability } from '@/app/actions/profitabilityActions';

interface Props {
  projectId: string;
}

export default function ProfitabilityTab({ projectId }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchProfitability() {
      try {
        const res = await getProjectProfitability(projectId);
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || 'Failed to load profitability data');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProfitability();
  }, [projectId]);

  if (loading) return <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>Loading Engine...</div>;
  if (error) return <div style={{ padding: '20px', color: '#ef4444' }}>Error: {error}</div>;
  if (!data) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', marginTop: '20px' }}>
      
      <div style={{
        background: 'linear-gradient(135deg, rgba(0, 255, 163, 0.1), rgba(0, 204, 130, 0.05))',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)', fontSize: '1.4rem' }}>Realtime Profitability Engine</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Contract Revenue (Awarded BOQ)</p>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem' }}>
              ₱ {data.contractRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Target Execution Cost (Benchmark)</p>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.8rem' }}>
              ₱ {data.targetExecutionCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Committed Cost (POs / Subcontracts)</p>
            <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.8rem' }}>
              ₱ {data.committedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

          <div style={{ background: 'var(--bg-dark)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold' }}>Actual Cost Incurred (Paid / Delivered)</p>
            <h3 style={{ margin: 0, color: '#ef4444', fontSize: '1.8rem' }}>
              ₱ {data.actualCostIncurred.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>

        </div>

        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '30px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)' }}>Target Profit (Contract - Target Cost)</p>
            <h2 style={{ margin: 0, color: 'var(--accent-color)' }}>
              ₱ {data.targetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '1rem', marginLeft: '10px', color: 'var(--text-secondary)' }}>
                ({data.targetProfitMargin.toFixed(2)}%)
              </span>
            </h2>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)' }}>Execution Variance (Target Cost - Actual Cost)</p>
            <h2 style={{ margin: 0, color: data.executionVariance >= 0 ? 'var(--accent-color)' : '#ef4444' }}>
              ₱ {data.executionVariance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h2>
          </div>

          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)' }}>
            <p style={{ margin: '0 0 5px 0', color: 'var(--text-secondary)' }}>Realized Profitability (Contract - Actual Cost)</p>
            <h2 style={{ margin: 0, color: data.realizedProfit >= 0 ? '#3b82f6' : '#ef4444' }}>
              ₱ {data.realizedProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '1rem', marginLeft: '10px', color: 'var(--text-secondary)' }}>
                ({data.realizedProfitMargin.toFixed(2)}%)
              </span>
            </h2>
          </div>

        </div>
        
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '30px 0' }} />

        <div style={{ padding: '20px', borderRadius: '12px', background: data.isOverrun ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', border: data.isOverrun ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)' }}>
          <h3 style={{ margin: '0 0 10px 0', color: data.isOverrun ? '#ef4444' : '#10b981', display: 'flex', alignItems: 'center', gap: '10px' }}>
            {data.isOverrun ? '⚠️ AI Overrun Exception Flagged' : '✨ Value Engineering Savings'}
          </h3>
          <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Calculated as: Procurement Benchmark (Target Cost) - (Actual Cost + Committed Cost)
          </p>
          <h2 style={{ margin: 0, color: data.isOverrun ? '#ef4444' : '#10b981', fontSize: '2.2rem' }}>
            {data.isOverrun ? '-' : '+'} ₱ {Math.abs(data.veSavings).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          {data.isOverrun && (
            <p style={{ marginTop: '10px', color: '#f87171', fontWeight: 'bold' }}>
              Total execution cost (₱{data.totalExecutionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}) exceeds the procurement benchmark (₱{data.targetExecutionCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}). Immediate executive review required.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
