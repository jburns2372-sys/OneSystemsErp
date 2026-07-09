'use client';

import React, { useState, useEffect } from 'react';
import { clearCurrentSimulationRun, clearAllSimulationRuns } from '@/app/actions/simulationClearActions';
import { getSimulationStats } from '@/app/actions/simulationActions';
import { AlertOctagon, Archive, Trash2, ShieldAlert } from 'lucide-react';

export default function AdminMaintenancePanel() {
  const [stats, setStats] = useState<any>(null);
  const [archiveBeforeClear, setArchiveBeforeClear] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'CURRENT' | 'ALL' | null>(null);
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string>(''); // For clearing a specific run, can be selected or latest

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const st = await getSimulationStats();
      setStats(st);
    } catch (e) {
      console.error(e);
    }
  };

  const initiateClear = (action: 'CURRENT' | 'ALL') => {
    if (action === 'CURRENT' && !currentRunId) {
      alert('Please enter a Simulation Run ID to clear.');
      return;
    }
    setModalAction(action);
    setTypedConfirmation('');
    setShowModal(true);
  };

  const handleConfirmClear = async () => {
    if (typedConfirmation !== 'CLEAR SIMULATION') return;

    setLoading(true);
    try {
      let res;
      if (modalAction === 'ALL') {
        res = await clearAllSimulationRuns(archiveBeforeClear);
      } else if (modalAction === 'CURRENT' && currentRunId) {
        res = await clearCurrentSimulationRun(currentRunId, archiveBeforeClear);
      }
      
      alert(res?.message || 'Data cleared.');
      setShowModal(false);
      window.location.reload(); // Refresh SOC dashboard to say "No active simulation data found"
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
        <AlertOctagon size={20} /> Admin Maintenance Panel
      </h3>
      
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Simulation Data Summary</h4>
          {stats ? (
             <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.85rem', lineHeight: '1.8' }}>
               <li>Total Runs Today: <strong style={{ color: '#fff' }}>{stats.runsToday}</strong></li>
               <li>Passed Runs: <strong style={{ color: '#10b981' }}>{stats.passedRuns}</strong></li>
               <li>Failed Runs: <strong style={{ color: '#ef4444' }}>{stats.failedRuns}</strong></li>
             </ul>
          ) : 'Loading...'}
        </div>

        <div style={{ flex: 2, background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', border: '1px dashed #ef4444' }}>
          <h4 style={{ margin: '0 0 15px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Trash2 size={16} /> Danger Zone: Clear Data
          </h4>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', fontSize: '0.9rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={archiveBeforeClear} 
              onChange={e => setArchiveBeforeClear(e.target.checked)} 
              style={{ accentColor: '#3b82f6' }}
            />
            <Archive size={16} /> Archive data before clearing
          </label>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '15px' }}>
             <div style={{ flex: 1 }}>
               <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '5px', color: 'var(--text-secondary)' }}>Specific Run ID (Optional)</label>
               <input 
                 type="text" 
                 placeholder="Enter Run ID..."
                 value={currentRunId}
                 onChange={e => setCurrentRunId(e.target.value)}
                 style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px' }}
               />
             </div>
             <button 
               onClick={() => initiateClear('CURRENT')}
               style={{ padding: '8px 15px', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.5)', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
             >
               Clear Specific Run
             </button>
          </div>

          <button 
            onClick={() => initiateClear('ALL')}
            style={{ width: '100%', padding: '10px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            <ShieldAlert size={18} /> Clear ALL Simulation Data
          </button>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1f2937', padding: '30px', borderRadius: '12px', border: '1px solid #ef4444', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ margin: '0 0 15px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertOctagon /> Confirm Clear
            </h2>
            <p style={{ color: '#d1d5db', lineHeight: '1.5', marginBottom: '20px' }}>
              You are about to clear SOC simulation test data only. Real security incidents and production records will not be affected. This action will be recorded in the audit trail. Do you want to continue?
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#9ca3af', marginBottom: '8px' }}>
                Type <strong>CLEAR SIMULATION</strong> to confirm:
              </label>
              <input 
                type="text" 
                value={typedConfirmation}
                onChange={e => setTypedConfirmation(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#111', border: '1px solid #374151', color: '#fff', borderRadius: '6px', fontSize: '1rem', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{ padding: '10px 20px', background: 'transparent', border: '1px solid #4b5563', color: '#d1d5db', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmClear}
                disabled={typedConfirmation !== 'CLEAR SIMULATION' || loading}
                style={{ padding: '10px 20px', background: typedConfirmation === 'CLEAR SIMULATION' ? '#ef4444' : '#6b7280', border: 'none', color: '#fff', borderRadius: '6px', cursor: typedConfirmation === 'CLEAR SIMULATION' ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
              >
                {loading ? 'Clearing...' : 'Confirm Clear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
