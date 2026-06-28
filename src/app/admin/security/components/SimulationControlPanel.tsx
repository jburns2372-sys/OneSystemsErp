'use client';

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, RefreshCcw, FileText, BarChart2 } from 'lucide-react';
import { getSimulationScenarios, runSimulationScenario, getSimulationStats } from '@/app/actions/simulationActions';
import { SecuritySimulationScenario } from '@prisma/client';
import AdminMaintenancePanel from './AdminMaintenancePanel';

interface SimulationControlPanelProps {
  onRefresh?: () => void;
}

export default function SimulationControlPanel({ onRefresh }: SimulationControlPanelProps) {
  const [scenarios, setScenarios] = useState<SecuritySimulationScenario[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'RUN' | 'MAINTENANCE'>('RUN');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [scen, st] = await Promise.all([
        getSimulationScenarios(),
        getSimulationStats()
      ]);
      setScenarios(scen);
      setStats(st);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRun = async (id: string, mode: 'EVENT_ONLY') => {
    setRunning(id);
    try {
      await runSimulationScenario(id, mode);
      await fetchData(); // Refresh stats
      if (onRefresh) onRefresh();
    } catch (e: any) {
      alert(`Error running simulation: ${e.message}`);
    } finally {
      setRunning(null);
    }
  };

  const handleExportExcel = () => {
    window.open('/api/admin/security/export-simulation-report', '_blank');
  };

  const handleExportPdf = () => {
    // Simple print-to-PDF approach
    window.print();
  };

  return (
    <div style={{ padding: '15px', color: 'var(--text-primary)', height: '100%', display: 'flex', flexDirection: 'column' }}>
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
        
        {stats && (
          <div style={{ display: 'flex', gap: '15px', fontSize: '0.8rem' }}>
            <span style={{ color: '#10b981' }}>Passed: {stats.passedRuns}</span>
            <span style={{ color: '#ef4444' }}>Failed: {stats.failedRuns}</span>
            <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>SOC Readiness: {stats.readinessScore.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {activeTab === 'RUN' ? (
        <>
          <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
            {scenarios.map(s => (
              <div key={s.id} style={{ background: 'var(--glass-panel)', border: '1px solid var(--glass-border)', padding: '10px', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{s.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{s.category} | {s.severity}</div>
                </div>
                <button 
                  onClick={() => handleRun(s.id, 'EVENT_ONLY')}
                  disabled={running === s.id}
                  style={{ 
                    background: running === s.id ? '#64748b' : 'rgba(59, 130, 246, 0.2)', 
                    color: '#60a5fa', 
                    border: '1px solid rgba(59, 130, 246, 0.5)', 
                    padding: '6px', 
                    borderRadius: '4px', 
                    cursor: running === s.id ? 'not-allowed' : 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                >
                  <Play size={12} /> {running === s.id ? 'Running...' : 'Run Event-Only'}
                </button>
              </div>
            ))}
          </div>

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
