'use client';

import React, { useState, useEffect } from 'react';

export default function AIScheduleIntelligence({ projectId }: { projectId: string }) {
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAIAnalysis = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/projects/${projectId}/scheduling/ai`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setAnalysis(data.analysis);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAIAnalysis();
  }, [projectId]);

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '20px', animation: 'pulse 1.5s infinite' }}>🧠</div>
        <h3 style={{ color: 'var(--text-primary)' }}>AI is analyzing your schedule...</h3>
        <p>Crunching CPM calculations, float metrics, and delay reports to generate insights.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', color: '#ef4444', textAlign: 'center' }}>
        <h3>Analysis Failed</h3>
        <p>{error}</p>
        <button 
          onClick={fetchAIAnalysis}
          style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', marginTop: '10px' }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!analysis) return null;

  let scoreColor = '#10b981';
  if (analysis.score < 60) scoreColor = '#ef4444';
  else if (analysis.score < 80) scoreColor = '#f59e0b';

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.5rem' }}>🤖</span> AI Schedule Intelligence
          </h2>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Last analyzed: {new Date(analysis.timestamp).toLocaleString()}
          </div>
        </div>
        <button 
          onClick={fetchAIAnalysis}
          style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          🔄 Re-Analyze
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '25px', marginBottom: '30px' }}>
        {/* Health Score Card */}
        <div className="glass-panel" style={{ padding: '30px', borderRadius: '12px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Schedule Health Score</div>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: scoreColor, lineHeight: '1' }}>{analysis.score}</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: scoreColor, marginTop: '10px' }}>{analysis.healthStatus}</div>
        </div>

        {/* Summary Card */}
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px' }}>
          <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>Executive Summary</h4>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{analysis.summary}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
        {/* Risk Analysis */}
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px', borderTop: '4px solid #ef4444' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Risk Analysis
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {analysis.risks.map((risk: string, i: number) => (
              <li key={i} style={{ marginBottom: '10px' }}>
                <span dangerouslySetInnerHTML={{ __html: risk.replace(/CRITICAL|SEVERE/, '<strong style="color: #ef4444">$&</strong>') }} />
              </li>
            ))}
          </ul>
        </div>

        {/* Recommended Actions */}
        <div className="glass-panel" style={{ padding: '25px', borderRadius: '12px', borderTop: '4px solid #10b981' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            💡 Recommended Actions
          </h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            {analysis.recommendations.map((rec: string, i: number) => (
              <li key={i} style={{ marginBottom: '10px' }}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
