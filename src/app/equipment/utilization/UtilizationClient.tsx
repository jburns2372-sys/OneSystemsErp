'use client';

import React, { useState, useCallback } from 'react';
import {
  getUtilizationLogs,
  createUtilizationLog,
  syncUtilizationFromFMS,
  deleteUtilizationLog,
} from '@/app/actions/equipmentActions';

interface UtilizationLog {
  id: string;
  date: string;
  hoursUsed: number;
  fuelConsumed: number;
  taskDescription: string | null;
  loggedBy: string;
  source: string;
  equipment: { id: string; code: string; name: string; category: string; lastEngineHours: number | null; hourlyRate: number | null };
  project: { id: string; name: string };
}

interface EquipmentOption {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  lastEngineHours: number | null;
  fmsDeviceId: string | null;
  fmsProvider: string | null;
  deployments: { projectId: string; project: { id: string; name: string } }[];
}

interface ProjectOption {
  id: string;
  name: string;
}

interface SummaryData {
  totalLogs: number;
  totalHours: number;
  totalFuel: number;
  totalCost: number;
  manualCount: number;
  fmsCount: number;
  topEquipment: { code: string; name: string; hours: number }[];
}

export default function UtilizationClient({
  initialLogs,
  initialOptions,
  initialSummary
}: {
  initialLogs: UtilizationLog[];
  initialOptions: { equipment: EquipmentOption[]; projects: ProjectOption[] };
  initialSummary: SummaryData;
}) {
  const [logs, setLogs] = useState<UtilizationLog[]>(initialLogs);
  const [options] = useState(initialOptions);
  const [summary, setSummary] = useState(initialSummary);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSyncPanel, setShowSyncPanel] = useState(false);

  // Filters
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  // Form
  const [formData, setFormData] = useState({
    equipmentId: '',
    projectId: '',
    date: new Date().toISOString().split('T')[0],
    hoursUsed: 0,
    fuelConsumed: 0,
    taskDescription: ''
  });

  // Auto-fill project when equipment changes
  const handleEquipmentChange = (eqId: string) => {
    const eq = options.equipment.find(e => e.id === eqId);
    const deployedProject = eq?.deployments?.[0]?.project;
    setFormData(prev => ({
      ...prev,
      equipmentId: eqId,
      projectId: deployedProject?.id || prev.projectId
    }));
  };

  const handleApplyFilters = useCallback(async () => {
    try {
      const filters: any = {};
      if (filterEquipment) filters.equipmentId = filterEquipment;
      if (filterProject) filters.projectId = filterProject;
      if (filterSource) filters.source = filterSource;
      if (filterDateFrom) filters.dateFrom = filterDateFrom;
      if (filterDateTo) filters.dateTo = filterDateTo;
      const result = await getUtilizationLogs(filters);
      setLogs(result as any);
    } catch (err: any) {
      alert(err.message);
    }
  }, [filterEquipment, filterProject, filterSource, filterDateFrom, filterDateTo]);

  const handleClearFilters = async () => {
    setFilterEquipment('');
    setFilterProject('');
    setFilterSource('');
    setFilterDateFrom('');
    setFilterDateTo('');
    const result = await getUtilizationLogs();
    setLogs(result as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentId || !formData.projectId) {
      alert('Please select equipment and project.');
      return;
    }
    setIsSubmitting(true);
    try {
      await createUtilizationLog(formData);
      setIsModalOpen(false);
      setFormData({ equipmentId: '', projectId: '', date: new Date().toISOString().split('T')[0], hoursUsed: 0, fuelConsumed: 0, taskDescription: '' });
      // Refresh data
      const [newLogs, newSummary] = await Promise.all([
        getUtilizationLogs(),
        import('@/app/actions/equipmentActions').then(m => m.getUtilizationSummary())
      ]);
      setLogs(newLogs as any);
      setSummary(newSummary);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFMSSync = async (equipmentId: string) => {
    setIsSyncing(equipmentId);
    try {
      await syncUtilizationFromFMS(equipmentId);
      const [newLogs, newSummary] = await Promise.all([
        getUtilizationLogs(),
        import('@/app/actions/equipmentActions').then(m => m.getUtilizationSummary())
      ]);
      setLogs(newLogs as any);
      setSummary(newSummary);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSyncing(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this utilization log? This will also reverse the engine hours on the equipment.')) return;
    try {
      await deleteUtilizationLog(id);
      const [newLogs, newSummary] = await Promise.all([
        getUtilizationLogs(),
        import('@/app/actions/equipmentActions').then(m => m.getUtilizationSummary())
      ]);
      setLogs(newLogs as any);
      setSummary(newSummary);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const fmsEquipment = options.equipment.filter(e => e.fmsDeviceId);

  const selectedEquipment = options.equipment.find(e => e.id === formData.equipmentId);
  const selectedDeployedProject = selectedEquipment?.deployments?.[0]?.project;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* STATS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard icon="⏱️" label="Hours This Month" value={`${summary.totalHours.toFixed(1)} hrs`} color="#3b82f6" />
        <StatCard icon="⛽" label="Fuel Consumed" value={`${summary.totalFuel.toFixed(1)} L`} color="#f59e0b" />
        <StatCard icon="₱" label="Estimated Cost" value={`₱${summary.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} color="#22c55e" />
        <StatCard icon="📝" label="Manual Logs" value={String(summary.manualCount)} color="#8b5cf6" />
        <StatCard icon="🛰️" label="FMS Auto-Synced" value={String(summary.fmsCount)} color="#06b6d4" />
      </div>

      {/* ACTION BAR */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '10px 20px',
            borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
          onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
        >
          ✏️ Log Manual Utilization
        </button>
        <button
          onClick={() => setShowSyncPanel(!showSyncPanel)}
          style={{
            background: showSyncPanel ? 'rgba(6,182,212,0.2)' : 'transparent',
            color: '#06b6d4', border: '1px solid #06b6d4', padding: '10px 20px',
            borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.95rem',
            display: 'flex', alignItems: 'center', gap: '6px',
            transition: 'all 0.2s',
          }}
        >
          🛰️ Sync from FMS {fmsEquipment.length > 0 && `(${fmsEquipment.length})`}
        </button>
      </div>

      {/* FMS SYNC PANEL */}
      {showSyncPanel && (
        <div style={{
          background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.2)',
          borderRadius: '12px', padding: '20px',
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#06b6d4', fontSize: '1rem' }}>
            🛰️ FMS-Connected Equipment — Click to sync latest telemetry
          </h3>
          {fmsEquipment.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>No FMS-connected equipment found. Register equipment with an FMS Device ID in the Equipment Registry.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
              {fmsEquipment.map(eq => (
                <div key={eq.id} style={{
                  background: 'var(--bg-primary)', border: '1px solid var(--glass-border)',
                  borderRadius: '8px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>[{eq.code}] {eq.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {eq.fmsProvider} • {eq.lastEngineHours?.toFixed(1) || '0'} hrs
                      {eq.deployments[0] ? ` • 🏗️ ${eq.deployments[0].project.name}` : ' • ⚠️ No deployment'}
                    </div>
                  </div>
                  <button
                    disabled={isSyncing === eq.id || !eq.deployments[0]}
                    onClick={() => handleFMSSync(eq.id)}
                    style={{
                      background: eq.deployments[0] ? '#06b6d4' : '#555',
                      color: '#fff', border: 'none', padding: '6px 12px',
                      borderRadius: '6px', fontWeight: 'bold', cursor: eq.deployments[0] ? 'pointer' : 'not-allowed',
                      fontSize: '0.8rem', whiteSpace: 'nowrap',
                    }}
                  >
                    {isSyncing === eq.id ? '⏳ Syncing...' : '↻ Sync'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* FILTER BAR */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '12px', padding: '16px',
        border: '1px solid var(--glass-border)', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end'
      }}>
        <FilterSelect label="Equipment" value={filterEquipment} onChange={setFilterEquipment}
          options={[{ value: '', label: 'All Equipment' }, ...options.equipment.map(e => ({ value: e.id, label: `[${e.code}] ${e.name}` }))]} />
        <FilterSelect label="Project" value={filterProject} onChange={setFilterProject}
          options={[{ value: '', label: 'All Projects' }, ...options.projects.map(p => ({ value: p.id, label: p.name }))]} />
        <FilterSelect label="Source" value={filterSource} onChange={setFilterSource}
          options={[{ value: '', label: 'All Sources' }, { value: 'MANUAL', label: '📝 Manual' }, { value: 'FMS_AUTO', label: '🛰️ FMS Auto' }]} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>From</label>
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>To</label>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }} />
        </div>
        <button onClick={handleApplyFilters} style={{ padding: '8px 16px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
          Apply
        </button>
        <button onClick={handleClearFilters} style={{ padding: '8px 16px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
          Clear
        </button>
      </div>

      {/* DATA TABLE */}
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                <th style={thStyle}>Date</th>
                <th style={thStyle}>Equipment</th>
                <th style={thStyle}>Project</th>
                <th style={thStyle}>Hours</th>
                <th style={thStyle}>Fuel (L)</th>
                <th style={thStyle}>Cost (₱)</th>
                <th style={thStyle}>Source</th>
                <th style={thStyle}>Task / Notes</th>
                <th style={{ ...thStyle, width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                    No utilization logs found. Click "Log Manual Utilization" or "Sync from FMS" to get started.
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.15s' }}
                    onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={tdStyle}>{new Date(log.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td style={tdStyle}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{log.equipment.code}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{log.equipment.name}</div>
                    </td>
                    <td style={tdStyle}>
                      <span style={{ background: 'var(--bg-primary)', padding: '3px 8px', borderRadius: '4px', fontSize: '0.85rem' }}>
                        🏗️ {log.project.name}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 'bold', color: '#3b82f6' }}>{log.hoursUsed.toFixed(1)}</td>
                    <td style={tdStyle}>{log.fuelConsumed.toFixed(1)}</td>
                    <td style={tdStyle}>₱{((log.hoursUsed * (log.equipment.hourlyRate || 0))).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                        background: log.source === 'FMS_AUTO' ? 'rgba(6,182,212,0.15)' : 'rgba(139,92,246,0.15)',
                        color: log.source === 'FMS_AUTO' ? '#06b6d4' : '#8b5cf6'
                      }}>
                        {log.source === 'FMS_AUTO' ? '🛰️ FMS' : '📝 Manual'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {log.taskDescription || '—'}
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => handleDelete(log.id)} title="Delete log"
                        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', padding: '4px', borderRadius: '4px', transition: 'color 0.2s' }}
                        onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                      >🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {logs.length > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Showing {logs.length} log{logs.length !== 1 ? 's' : ''}</span>
            <span>Total: {logs.reduce((s, l) => s + l.hoursUsed, 0).toFixed(1)} hrs | {logs.reduce((s, l) => s + l.fuelConsumed, 0).toFixed(1)} L fuel</span>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '550px', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Log Manual Utilization</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Select Equipment *</label>
                <select
                  required
                  value={formData.equipmentId}
                  onChange={e => handleEquipmentChange(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">-- Choose Equipment --</option>
                  {options.equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.code}] {eq.name} ({eq.status}){eq.fmsDeviceId ? ' 🛰️' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto-filled deployment info */}
              {selectedDeployedProject && (
                <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '10px', fontSize: '0.85rem', color: '#22c55e' }}>
                  ✅ Auto-linked from active deployment → <strong>{selectedDeployedProject.name}</strong>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Project * {selectedDeployedProject && <span style={{ fontSize: '0.8rem', color: '#22c55e' }}>(auto-filled)</span>}</label>
                <select
                  required
                  value={formData.projectId}
                  onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                  style={inputStyle}
                >
                  <option value="">-- Choose Project --</option>
                  {options.projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Date *</label>
                <input
                  type="date" required
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Hours Used *</label>
                  <input
                    type="number" required step="0.1" min="0"
                    value={formData.hoursUsed || ''}
                    onChange={e => setFormData({ ...formData, hoursUsed: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                    placeholder="e.g. 8.5"
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Fuel Consumed (Liters)</label>
                  <input
                    type="number" step="0.1" min="0"
                    value={formData.fuelConsumed || ''}
                    onChange={e => setFormData({ ...formData, fuelConsumed: parseFloat(e.target.value) || 0 })}
                    style={inputStyle}
                    placeholder="e.g. 25.0"
                  />
                </div>
              </div>

              {/* Show cost preview */}
              {selectedEquipment && formData.hoursUsed > 0 && (
                <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '8px', padding: '10px', fontSize: '0.85rem', color: '#3b82f6' }}>
                  💰 Estimated cost: <strong>₱{(formData.hoursUsed * (selectedEquipment.hourlyRate || 0)).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</strong>
                  <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                    (₱{(selectedEquipment.hourlyRate || 0).toFixed(2)}/hr × {formData.hoursUsed} hrs)
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Task Description / Notes</label>
                <textarea
                  rows={3}
                  value={formData.taskDescription}
                  onChange={e => setFormData({ ...formData, taskDescription: e.target.value })}
                  style={{ ...inputStyle, resize: 'none' }}
                  placeholder="e.g. Excavation at Block A, Foundation work..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Saving...' : 'Save Utilization Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared styles
const thStyle: React.CSSProperties = { padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' };
const tdStyle: React.CSSProperties = { padding: '12px 16px', color: 'var(--text-primary)', fontSize: '0.9rem' };
const labelStyle: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: '0.9rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)', boxSizing: 'border-box' as const };

// Stat Card Component
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px',
      border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: '6px',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: '1.5rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
      <span style={{ fontSize: '1.3rem', fontWeight: 'bold', color }}>{value}</span>
    </div>
  );
}

// Filter Select Component
function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '150px' }}>
      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{label}</label>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
