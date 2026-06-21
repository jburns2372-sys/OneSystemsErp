'use client';

import React, { useState, useCallback } from 'react';
import {
  getMaintenanceLogs,
  createMaintenance,
  updateMaintenanceStatus,
  deleteMaintenance,
} from '@/app/actions/equipmentActions';

interface MaintenanceRecord {
  id: string;
  type: string;
  scheduledDate: string | null;
  completedDate: string | null;
  cost: number;
  description: string | null;
  status: string;
  fmsFaultCode: string | null;
  equipment: { id: string; code: string; name: string; category: string; status: string; lastEngineHours: number | null };
}

interface EquipmentOption {
  id: string;
  code: string;
  name: string;
  category: string;
  status: string;
  lastEngineHours: number | null;
  fmsDeviceId: string | null;
  telemetry: { faultCodes: string | null; engineHours: number | null; timestamp: string }[];
}

interface SummaryData {
  scheduled: number;
  inProgress: number;
  completed: number;
  overdue: number;
  totalCost: number;
  preventiveCount: number;
  repairCount: number;
  totalRecords: number;
}

export default function MaintenanceClient({
  initialLogs,
  initialOptions,
  initialSummary
}: {
  initialLogs: MaintenanceRecord[];
  initialOptions: { equipment: EquipmentOption[] };
  initialSummary: SummaryData;
}) {
  const [logs, setLogs] = useState<MaintenanceRecord[]>(initialLogs);
  const [options] = useState(initialOptions);
  const [summary, setSummary] = useState(initialSummary);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');
  const [completeModalId, setCompleteModalId] = useState<string | null>(null);
  const [completeCost, setCompleteCost] = useState(0);
  const [completeNotes, setCompleteNotes] = useState('');

  // Filters
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterType, setFilterType] = useState('');

  // Form
  const [formData, setFormData] = useState({
    equipmentId: '',
    type: 'PREVENTIVE',
    scheduledDate: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    fmsFaultCode: ''
  });

  const refreshData = async () => {
    const [newLogs, newSummary] = await Promise.all([
      getMaintenanceLogs(),
      import('@/app/actions/equipmentActions').then(m => m.getMaintenanceSummary())
    ]);
    setLogs(newLogs as any);
    setSummary(newSummary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentId) { alert('Please select equipment.'); return; }
    setIsSubmitting(true);
    try {
      await createMaintenance(formData);
      setIsModalOpen(false);
      setFormData({ equipmentId: '', type: 'PREVENTIVE', scheduledDate: new Date().toISOString().split('T')[0], description: '', cost: 0, fmsFaultCode: '' });
      await refreshData();
    } catch (err: any) { alert(err.message); }
    finally { setIsSubmitting(false); }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (newStatus === 'COMPLETED') {
      setCompleteModalId(id);
      const record = logs.find(l => l.id === id);
      setCompleteCost(record?.cost || 0);
      setCompleteNotes(record?.description || '');
      return;
    }
    try {
      await updateMaintenanceStatus(id, newStatus);
      await refreshData();
    } catch (err: any) { alert(err.message); }
  };

  const handleCompleteSubmit = async () => {
    if (!completeModalId) return;
    try {
      await updateMaintenanceStatus(completeModalId, 'COMPLETED', { cost: completeCost, description: completeNotes });
      setCompleteModalId(null);
      await refreshData();
    } catch (err: any) { alert(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this maintenance record?')) return;
    try {
      await deleteMaintenance(id);
      await refreshData();
    } catch (err: any) { alert(err.message); }
  };

  const handleApplyFilters = useCallback(async () => {
    try {
      const filters: any = {};
      if (filterEquipment) filters.equipmentId = filterEquipment;
      if (filterType) filters.type = filterType;
      if (activeTab !== 'ALL') filters.status = activeTab;
      const result = await getMaintenanceLogs(filters);
      setLogs(result as any);
    } catch (err: any) { alert(err.message); }
  }, [filterEquipment, filterType, activeTab]);

  // Filter logs by tab
  const filteredLogs = activeTab === 'ALL' ? logs : logs.filter(l => l.status === activeTab);

  // Equipment with active fault codes
  const faultEquipment = options.equipment.filter(eq =>
    eq.telemetry?.[0]?.faultCodes && eq.telemetry[0].faultCodes !== '[]' && eq.telemetry[0].faultCodes !== 'null'
  );

  const selectedEquipment = options.equipment.find(e => e.id === formData.equipmentId);
  const selectedFaults = selectedEquipment?.telemetry?.[0]?.faultCodes;

  const statusColor = (s: string) => {
    switch (s) {
      case 'SCHEDULED': return '#3b82f6';
      case 'IN_PROGRESS': return '#f59e0b';
      case 'COMPLETED': return '#22c55e';
      default: return 'var(--text-secondary)';
    }
  };

  const typeColor = (t: string) => t === 'PREVENTIVE' ? '#06b6d4' : '#ef4444';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* STATS BAR */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
        <StatCard icon="📋" label="Scheduled" value={String(summary.scheduled)} color="#3b82f6" />
        <StatCard icon="🔧" label="In Progress" value={String(summary.inProgress)} color="#f59e0b" />
        <StatCard icon="✅" label="Completed" value={String(summary.completed)} color="#22c55e" />
        <StatCard icon="⚠️" label="Overdue" value={String(summary.overdue)} color="#ef4444" highlight={summary.overdue > 0} />
        <StatCard icon="🛡️" label="Preventive" value={String(summary.preventiveCount)} color="#06b6d4" />
        <StatCard icon="🔩" label="Repairs" value={String(summary.repairCount)} color="#f97316" />
        <StatCard icon="₱" label="Total Cost" value={`₱${summary.totalCost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`} color="#8b5cf6" />
      </div>

      {/* FAULT ALERTS */}
      {faultEquipment.length > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: '12px', padding: '16px',
        }}>
          <h3 style={{ margin: '0 0 12px 0', color: '#ef4444', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🚨 Active Fault Codes Detected — Schedule Repairs
          </h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {faultEquipment.map(eq => (
              <div key={eq.id} style={{
                background: 'var(--bg-primary)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)', fontSize: '0.9rem' }}>[{eq.code}] {eq.name}</div>
                  <div style={{ fontSize: '0.8rem', color: '#ef4444' }}>DTC: {eq.telemetry[0].faultCodes}</div>
                </div>
                <button
                  onClick={() => {
                    setFormData(prev => ({ ...prev, equipmentId: eq.id, type: 'REPAIR', fmsFaultCode: eq.telemetry[0].faultCodes || '' }));
                    setIsModalOpen(true);
                  }}
                  style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}
                >
                  + Schedule Repair
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BAR */}
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '10px 20px',
              borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem',
              display: 'flex', alignItems: 'center', gap: '6px', transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            + Schedule Maintenance
          </button>
        </div>

        {/* FILTER CONTROLS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select value={filterEquipment} onChange={e => setFilterEquipment(e.target.value)} style={filterSelectStyle}>
            <option value="">All Equipment</option>
            {options.equipment.map(e => <option key={e.id} value={e.id}>[{e.code}] {e.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} style={filterSelectStyle}>
            <option value="">All Types</option>
            <option value="PREVENTIVE">🛡️ Preventive</option>
            <option value="REPAIR">🔩 Repair</option>
          </select>
          <button onClick={handleApplyFilters} style={{ padding: '8px 14px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>Filter</button>
        </div>
      </div>

      {/* STATUS TABS */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-secondary)', borderRadius: '10px', padding: '4px', border: '1px solid var(--glass-border)' }}>
        {(['ALL', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.9rem', transition: 'all 0.2s',
              background: activeTab === tab ? 'var(--bg-primary)' : 'transparent',
              color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
              boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.2)' : 'none'
            }}
          >
            {tab === 'ALL' ? `All (${logs.length})` :
              tab === 'SCHEDULED' ? `📋 Scheduled (${logs.filter(l => l.status === 'SCHEDULED').length})` :
              tab === 'IN_PROGRESS' ? `🔧 In Progress (${logs.filter(l => l.status === 'IN_PROGRESS').length})` :
              `✅ Completed (${logs.filter(l => l.status === 'COMPLETED').length})`}
          </button>
        ))}
      </div>

      {/* KANBAN / CARDS VIEW */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredLogs.length === 0 ? (
          <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}>
            No maintenance records found. Click "Schedule Maintenance" to create one.
          </div>
        ) : (
          filteredLogs.map(record => {
            const isOverdue = record.status === 'SCHEDULED' && record.scheduledDate && new Date(record.scheduledDate) < new Date();
            return (
              <div key={record.id} style={{
                background: 'var(--bg-secondary)', borderRadius: '12px', padding: '18px',
                border: `1px solid ${isOverdue ? 'rgba(239,68,68,0.4)' : 'var(--glass-border)'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '15px',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                {/* LEFT: Info */}
                <div style={{ display: 'flex', gap: '15px', flex: 1 }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem',
                    background: record.type === 'PREVENTIVE' ? 'rgba(6,182,212,0.1)' : 'rgba(239,68,68,0.1)',
                    flexShrink: 0,
                  }}>
                    {record.type === 'PREVENTIVE' ? '🛡️' : '🔩'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>[{record.equipment.code}] {record.equipment.name}</strong>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: `${typeColor(record.type)}22`, color: typeColor(record.type) }}>
                        {record.type}
                      </span>
                      <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: `${statusColor(record.status)}22`, color: statusColor(record.status) }}>
                        {record.status.replace('_', ' ')}
                      </span>
                      {isOverdue && (
                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                          ⚠️ OVERDUE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      {record.description || 'No description'}
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      <span>📅 Scheduled: {record.scheduledDate ? new Date(record.scheduledDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</span>
                      {record.completedDate && <span>✅ Completed: {new Date(record.completedDate).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>}
                      <span>💰 ₱{record.cost.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</span>
                      {record.fmsFaultCode && <span style={{ color: '#ef4444' }}>🔴 DTC: {record.fmsFaultCode}</span>}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {record.status === 'SCHEDULED' && (
                    <button onClick={() => handleStatusChange(record.id, 'IN_PROGRESS')}
                      style={actionBtnStyle('#f59e0b')}>▶ Start</button>
                  )}
                  {record.status === 'IN_PROGRESS' && (
                    <button onClick={() => handleStatusChange(record.id, 'COMPLETED')}
                      style={actionBtnStyle('#22c55e')}>✓ Complete</button>
                  )}
                  <button onClick={() => handleDelete(record.id)} title="Delete"
                    style={{ ...actionBtnStyle('transparent'), color: 'var(--text-secondary)', border: '1px solid var(--glass-border)' }}
                    onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                  >🗑️</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '550px', borderRadius: '12px', border: '1px solid var(--glass-border)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
            <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Schedule Maintenance</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Equipment *</label>
                <select required value={formData.equipmentId} onChange={e => setFormData({ ...formData, equipmentId: e.target.value })} style={inputStyle}>
                  <option value="">-- Choose Equipment --</option>
                  {options.equipment.map(eq => (
                    <option key={eq.id} value={eq.id}>
                      [{eq.code}] {eq.name} ({eq.status}){eq.fmsDeviceId ? ' 🛰️' : ''} — {eq.lastEngineHours?.toFixed(0) || '0'} hrs
                    </option>
                  ))}
                </select>
              </div>

              {/* Show FMS fault codes if available */}
              {selectedFaults && selectedFaults !== '[]' && selectedFaults !== 'null' && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '10px', fontSize: '0.85rem', color: '#ef4444' }}>
                  🔴 Active Fault Codes: <strong>{selectedFaults}</strong>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '4px' }}>Consider scheduling a repair for this equipment.</div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Type *</label>
                  <select required value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} style={inputStyle}>
                    <option value="PREVENTIVE">🛡️ Preventive Maintenance</option>
                    <option value="REPAIR">🔩 Repair</option>
                  </select>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Scheduled Date *</label>
                  <input type="date" required value={formData.scheduledDate} onChange={e => setFormData({ ...formData, scheduledDate: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Estimated Cost (₱)</label>
                  <input type="number" step="0.01" min="0" value={formData.cost || ''} onChange={e => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })} style={inputStyle} placeholder="0.00" />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <label style={labelStyle}>Fault Code (DTC)</label>
                  <input type="text" value={formData.fmsFaultCode} onChange={e => setFormData({ ...formData, fmsFaultCode: e.target.value })} style={inputStyle} placeholder="e.g. P0301, P0420" />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={labelStyle}>Description / Work Order Notes</label>
                <textarea rows={3} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ ...inputStyle, resize: 'none' }}
                  placeholder="e.g. Oil change & filter replacement at 500-hour interval..." />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '10px 20px', background: 'var(--accent-color)', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting ? 'not-allowed' : 'pointer' }}>
                  {isSubmitting ? 'Scheduling...' : 'Schedule Maintenance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETION MODAL */}
      {completeModalId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '450px', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>✅ Complete Maintenance</h2>
            <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
              This will mark the maintenance as completed and set the equipment status back to <strong style={{ color: '#22c55e' }}>ACTIVE</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>Final Cost (₱)</label>
              <input type="number" step="0.01" min="0" value={completeCost || ''} onChange={e => setCompleteCost(parseFloat(e.target.value) || 0)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={labelStyle}>Completion Notes</label>
              <textarea rows={2} value={completeNotes} onChange={e => setCompleteNotes(e.target.value)} style={{ ...inputStyle, resize: 'none' }} placeholder="Work completed, parts replaced..." />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setCompleteModalId(null)} style={{ padding: '10px 20px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleCompleteSubmit} style={{ padding: '10px 20px', background: '#22c55e', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Mark Completed</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Shared styles
const labelStyle: React.CSSProperties = { color: 'var(--text-secondary)', fontSize: '0.9rem' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px', background: 'var(--bg-primary)', border: '1px solid var(--glass-border)', borderRadius: '6px', color: 'var(--text-primary)', boxSizing: 'border-box' as const };
const filterSelectStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--glass-border)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.85rem' };
const actionBtnStyle = (bg: string): React.CSSProperties => ({
  background: bg, color: '#fff', border: 'none', padding: '6px 14px',
  borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap',
  transition: 'transform 0.1s',
});

function StatCard({ icon, label, value, color, highlight }: { icon: string; label: string; value: string; color: string; highlight?: boolean }) {
  return (
    <div style={{
      background: highlight ? `${color}11` : 'var(--bg-secondary)',
      borderRadius: '12px', padding: '16px',
      border: `1px solid ${highlight ? `${color}44` : 'var(--glass-border)'}`,
      display: 'flex', flexDirection: 'column', gap: '4px',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; }}
      onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <span style={{ fontSize: '1.4rem' }}>{icon}</span>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</span>
      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color }}>{value}</span>
    </div>
  );
}
