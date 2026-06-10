'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveManualDtr } from '@/app/actions/dtrActions';

const formatDate = (dateInput: any) => {
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (dateInput: any) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export default function ManualDtrModal({ 
  period, 
  workers, 
  editingDtr, 
  onClose 
}: { 
  period: any; 
  workers: any[]; 
  editingDtr?: any; 
  onClose: () => void; 
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    workerId: editingDtr?.workerId || workers[0]?.id || '',
    date: editingDtr?.date ? formatDate(editingDtr.date) : formatDate(new Date()),
    timeIn: editingDtr?.timeIn ? formatTime(editingDtr.timeIn) : '',
    timeOut: editingDtr?.timeOut ? formatTime(editingDtr.timeOut) : '',
    regularHours: editingDtr?.regularHours !== undefined ? editingDtr.regularHours : 8,
    overtimeHours: editingDtr?.overtimeHours !== undefined ? editingDtr.overtimeHours : 0
  });

  // Calculate hours automatically based on time in/out
  useEffect(() => {
    if (formData.timeIn && formData.timeOut) {
      const [inH, inM] = formData.timeIn.split(':').map(Number);
      const [outH, outM] = formData.timeOut.split(':').map(Number);
      
      let startHours = inH + inM / 60;
      let endHours = outH + outM / 60;
      
      if (endHours < startHours) endHours += 24; // Crosses midnight

      let totalHours = endHours - startHours;

      // Handle lunch break (12:00 to 13:00)
      const lunchStart = 12;
      const lunchEnd = 13;
      
      const overlapStart = Math.max(startHours, lunchStart);
      const overlapEnd = Math.min(endHours, lunchEnd);
      
      if (overlapEnd > overlapStart) {
        totalHours -= (overlapEnd - overlapStart);
      }

      let reg = Math.min(8, totalHours);
      let ot = Math.max(0, totalHours - 8);

      reg = Math.round(reg * 100) / 100;
      ot = Math.round(ot * 100) / 100;

      // Only update if changed to avoid loop
      if (reg !== formData.regularHours || ot !== formData.overtimeHours) {
        setFormData(prev => ({ ...prev, regularHours: reg, overtimeHours: ot }));
      }
    }
  }, [formData.timeIn, formData.timeOut]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // user ID should ideally come from props, we use dummy for now
    const currentUserId = 'clxw8xxvj0000vwu4xxw8xxvj'; 
    
    await saveManualDtr(formData, period.id, currentUserId);
    setLoading(false);
    router.refresh();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 15, 26, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', width: '100%', maxWidth: '500px', overflow: 'hidden' }}>
        <div style={{ padding: '25px 35px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: '700' }}>
            {editingDtr ? 'Edit DTR Entry' : 'Manual DTR Entry'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '35px' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Worker</label>
            <select 
              value={formData.workerId} 
              disabled={!!editingDtr}
              onChange={e => setFormData({...formData, workerId: e.target.value})} 
              style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', opacity: editingDtr ? 0.7 : 1 }}
            >
              {workers.map(w => {
                const name = w.firstName && w.lastName ? `${w.lastName}, ${w.firstName}` : (w.name || 'Unknown');
                return (
                  <option key={w.id} value={w.id} style={{ background: 'var(--bg-secondary)' }}>
                    {name}
                  </option>
                );
              })}
            </select>
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Date</label>
            <input 
              type="date" 
              value={formData.date} 
              disabled={!!editingDtr}
              onChange={e => setFormData({...formData, date: e.target.value})} 
              style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', opacity: editingDtr ? 0.7 : 1 }} 
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Time In</label>
              <input type="time" value={formData.timeIn} onChange={e => setFormData({...formData, timeIn: e.target.value})} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Time Out</label>
              <input type="time" value={formData.timeOut} onChange={e => setFormData({...formData, timeOut: e.target.value})} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Regular Hours</label>
              <input type="number" step="0.5" value={formData.regularHours} onChange={e => setFormData({...formData, regularHours: Number(e.target.value)})} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Overtime Hours</label>
              <input type="number" step="0.5" value={formData.overtimeHours} onChange={e => setFormData({...formData, overtimeHours: Number(e.target.value)})} style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '12px 25px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>{loading ? 'Saving...' : 'Save Record'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
