'use client';

import React, { useState, useEffect } from 'react';

export default function DelayAndRecoveryTab({ projectId, activities }: { projectId: string, activities: any[] }) {
  const [delays, setDelays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  // Form state
  const [activityId, setActivityId] = useState('');
  const [category, setCategory] = useState('WEATHER');
  const [cause, setCause] = useState('');
  const [delayStartDate, setDelayStartDate] = useState('');
  const [delayDays, setDelayDays] = useState(1);
  const [impactToCriticalPath, setImpactToCriticalPath] = useState(false);

  const fetchDelays = () => {
    setLoading(true);
    fetch(`/api/projects/${projectId}/scheduling/delays`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setDelays(data.delays || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDelays();
  }, [projectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityId || !cause || !delayStartDate) {
      setError('Please fill all required fields');
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/scheduling/delays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activityId,
          category,
          cause,
          delayStartDate,
          delayDays,
          impactToCriticalPath
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSuccess('Delay reported successfully');
      setIsReporting(false);
      setCause('');
      setDelayDays(1);
      fetchDelays();
      
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError(err.message);
      setTimeout(() => setError(''), 4000);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'rgba(0,0,0,0.3)',
    color: 'white',
    fontSize: '0.9rem',
    width: '100%',
    marginBottom: '15px'
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Delay & Variance Analysis</h3>
        <button
          onClick={() => setIsReporting(!isReporting)}
          style={{
            padding: '8px 16px',
            backgroundColor: isReporting ? 'transparent' : 'rgba(239, 68, 68, 0.15)',
            color: isReporting ? 'var(--text-secondary)' : '#ef4444',
            border: `1px solid ${isReporting ? 'var(--glass-border)' : 'rgba(239, 68, 68, 0.5)'}`,
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isReporting ? 'Cancel Report' : '⚠️ Report Delay'}
        </button>
      </div>

      {error && <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: '6px' }}>{error}</div>}
      {success && <div style={{ padding: '12px', marginBottom: '15px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', borderRadius: '6px' }}>{success}</div>}

      {isReporting && (
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px', borderRadius: '12px', marginBottom: '25px', borderLeft: '4px solid #ef4444' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#ef4444' }}>New Delay Report</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Impacted Activity *</label>
              <select style={inputStyle} value={activityId} onChange={e => setActivityId(e.target.value)} required>
                <option value="">Select activity...</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.activityCode || '-'} | {a.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Category</label>
              <select style={inputStyle} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="WEATHER">Weather</option>
                <option value="PROCUREMENT">Procurement / Supply</option>
                <option value="MANPOWER">Manpower Shortage</option>
                <option value="EQUIPMENT">Equipment Breakdown</option>
                <option value="CLIENT_VO">Client Variation Order</option>
                <option value="DESIGN">Design / Plan Issue</option>
                <option value="FINANCIAL">Financial / Funding</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Delay Start Date *</label>
              <input type="date" style={inputStyle} value={delayStartDate} onChange={e => setDelayStartDate(e.target.value)} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Estimated Delay (Days) *</label>
              <input type="number" min="1" style={inputStyle} value={delayDays} onChange={e => setDelayDays(Number(e.target.value))} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Cause / Description *</label>
              <textarea style={{...inputStyle, minHeight: '80px'}} value={cause} onChange={e => setCause(e.target.value)} required placeholder="Describe the cause of delay and the immediate impact..."></textarea>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="impactCp" checked={impactToCriticalPath} onChange={e => setImpactToCriticalPath(e.target.checked)} />
              <label htmlFor="impactCp" style={{ color: 'var(--text-primary)' }}>This delay impacts the critical path</label>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Submit Report
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>Loading delay records...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Date Reported</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Activity</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Category</th>
                <th style={{ padding: '12px', textAlign: 'left', color: 'var(--text-secondary)' }}>Cause</th>
                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Days</th>
                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Critical Impact</th>
                <th style={{ padding: '12px', textAlign: 'center', color: 'var(--text-secondary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {delays.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>No delay records reported.</td></tr>
              ) : (
                delays.map((d, i) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{new Date(d.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{d.activity?.name}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', fontSize: '0.7rem', fontWeight: 'bold' }}>
                        {d.category}
                      </span>
                    </td>
                    <td style={{ padding: '12px', color: 'var(--text-secondary)', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.cause}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>{d.delayDays}d</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{d.impactToCriticalPath ? '🔴 Yes' : '—'}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{ padding: '4px 8px', borderRadius: '12px', backgroundColor: d.approvalStatus === 'APPROVED' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.1)', color: d.approvalStatus === 'APPROVED' ? '#10b981' : 'var(--text-secondary)', fontSize: '0.7rem' }}>
                        {d.approvalStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
