'use client';

import React, { useState, useEffect } from 'react';
import { Play, FileText, BarChart2, CheckCircle, XCircle } from 'lucide-react';
import AdminMaintenancePanel from './AdminMaintenancePanel';

interface Scenario {
  id: string;
  name: string;
  category: string;
  severity: string;
  description?: string | null;
  targetModule: string;
}

interface SimStats {
  runsToday: number;
  passedRuns: number;
  failedRuns: number;
  readinessScore: number;
}

interface SimulationControlPanelProps {
  onRefresh?: () => void;
}

export default function SimulationControlPanel({ onRefresh }: SimulationControlPanelProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [stats, setStats] = useState<SimStats | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'RUN' | 'MAINTENANCE'>('RUN');
  const [runResults, setRunResults] = useState<Record<string, 'passed' | 'failed'>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [scenRes, statsRes] = await Promise.all([
        fetch('/api/admin/security/scenarios'),
        fetch('/api/admin/security/simulation-stats'),
      ]);

      if (!scenRes.ok) throw new Error('Failed to fetch scenarios');
      if (!statsRes.ok) throw new Error('Failed to fetch simulation stats');

      const [scen, st] = await Promise.all([scenRes.json(), statsRes.json()]);
      setScenarios(scen);
      setStats(st);
    } catch (e: any) {
      setError(e.message || 'Failed to load simulation data');
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async (id: string) => {
    setRunning(id);
    try {
      const res = await fetch('/api/admin/security/run-simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: id, mode: 'EVENT_ONLY' }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Simulation failed');

      setRunResults(prev => ({ ...prev, [id]: data.success ? 'passed' : 'failed' }));
      // Refresh stats
      await fetchData();
      if (onRefresh) onRefresh();
    } catch (e: any) {
      setRunResults(prev => ({ ...prev, [id]: 'failed' }));
      alert(`Simulation error: ${e.message}`);
    } finally {
      setRunning(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Medium': return '#f59e0b';
      case 'Low': return '#10b981';
      default: return '#64748b';
    }
  };

  const handleExportExcel = () => {
    window.open('/api/admin/security/export-simulation-report', '_blank');
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div style={{ padding: '15px', color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Tab Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <button
            onClick={() => setActiveTab('RUN')}
            style={{ background: 'none', border: 'none', color: activeTab === 'RUN' ? 'var(--accent-color)' : 'var(--text-secondary)', fontWeight: activeTab === 'RUN' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: activeTab === 'RUN' ? '2px solid var(--accent-color)' : '2px solid transparent' }}
          >
            <Play size={16} /> Run Simulations
          </button>
          <button
            onClick={() => setActiveTab('MAINTENANCE')}
            style={{ background: 'none', border: 'none', color: activeTab === 'MAINTENANCE' ? '#ef4444' : 'var(--text-secondary)', fontWeight: activeTab === 'MAINTENANCE' ? 'bold' : 'normal', cursor: 'pointer', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: activeTab === 'MAINTENANCE' ? '2px solid #ef4444' : '2px solid transparent' }}
          >
            Maintenance & Cleanup
          </button>
        </div>

        {/* Live Stats Bar */}
        {stats && (
          <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem', alignItems: 'center' }}>
            <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={14} /> Passed: {stats.passedRuns}
            </span>
            <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <XCircle size={14} /> Failed: {stats.failedRuns}
            </span>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
              SOC Readiness: {stats.readinessScore.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'RUN' ? (
        <>
          {loading && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
              Loading simulation scenarios...
            </div>
          )}
          {error && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '10px' }}>
              <span style={{ color: '#ef4444' }}>⚠ {error}</span>
              <button onClick={fetchData} style={{ padding: '6px 14px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
                Retry
              </button>
            </div>
          )}
          {!loading && !error && scenarios.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexDirection: 'column', gap: '10px' }}>
              <span>No simulation scenarios found.</span>
              <span style={{ fontSize: '0.8rem' }}>Run <code>npx tsx scripts/seed_soc.ts</code> to seed them.</span>
            </div>
          )}
          {!loading && !error && scenarios.length > 0 && (
            <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px', alignContent: 'start' }}>
              {scenarios.map(s => (
                <div key={s.id} style={{ background: 'var(--glass-panel)', border: `1px solid ${runResults[s.id] === 'passed' ? 'rgba(16,185,129,0.4)' : runResults[s.id] === 'failed' ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)'}`, padding: '12px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'border-color 0.3s' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                      <span>{s.name}</span>
                      {runResults[s.id] && (
                        runResults[s.id] === 'passed'
                          ? <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0 }} />
                          : <XCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>{s.category}</span>
                      <span style={{ padding: '2px 6px', background: `${getSeverityColor(s.severity)}22`, color: getSeverityColor(s.severity), borderRadius: '4px', fontWeight: 'bold' }}>{s.severity}</span>
                    </div>
                  </div>
                  {s.description && (
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {s.description.slice(0, 100)}{s.description.length > 100 ? '...' : ''}
                    </p>
                  )}
                  <button
                    onClick={() => handleRun(s.id)}
                    disabled={running === s.id}
                    style={{
                      background: running === s.id ? '#374151' : 'rgba(59, 130, 246, 0.15)',
                      color: running === s.id ? '#9ca3af' : '#60a5fa',
                      border: '1px solid rgba(59, 130, 246, 0.4)',
                      padding: '7px',
                      borderRadius: '6px',
                      cursor: running === s.id ? 'not-allowed' : 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Play size={12} />
                    {running === s.id ? 'Running...' : 'Run Event-Only'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Export Buttons */}
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleExportPdf}
              style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <FileText size={14} /> Export PDF Report
            </button>
            <button
              onClick={handleExportExcel}
              style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.8rem', cursor: 'pointer' }}
            >
              <BarChart2 size={14} /> Export Excel / CSV
            </button>
          </div>
        </>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <AdminMaintenancePanel />
        </div>
      )}
    </div>
  );
}
