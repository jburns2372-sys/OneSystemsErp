'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveBulkManualDtr } from '@/app/actions/dtrActions';

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
  const [workerId, setWorkerId] = useState(editingDtr?.workerId || (workers.length > 0 ? workers[0].id : ''));
  const [entries, setEntries] = useState<any[]>([]);

  const generateDates = () => {
    const dates = [];
    const current = new Date(period.startDate);
    const end = new Date(period.endDate);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  useEffect(() => {
    if (!workerId) return;

    const dates = generateDates();
    const existingDtrs = period.dtrs?.filter((d: any) => d.workerId === workerId) || [];

    const initialEntries = dates.map(d => {
      const dateStr = formatDate(d);
      const existing = existingDtrs.find((ex: any) => formatDate(ex.date) === dateStr);
      const isSunday = d.getDay() === 0;

      if (existing) {
        return {
          date: dateStr,
          displayDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
          isSunday,
          timeIn: existing.timeIn ? formatTime(existing.timeIn) : '',
          timeOut: existing.timeOut ? formatTime(existing.timeOut) : '',
          regularHours: existing.regularHours,
          overtimeHours: existing.overtimeHours
        };
      }

      // Default: empty times, 0 hours
      return {
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isSunday,
        timeIn: '',
        timeOut: '',
        regularHours: 0,
        overtimeHours: 0
      };
    });

    setEntries(initialEntries);
  }, [workerId, period.dtrs]);

  const handleEntryChange = (index: number, field: string, value: string) => {
    const newEntries = [...entries];
    
    if (field === 'timeIn' || field === 'timeOut') {
      newEntries[index][field] = value;
      
      const tIn = newEntries[index].timeIn;
      const tOut = newEntries[index].timeOut;

      if (tIn && tOut) {
        const [inH, inM] = tIn.split(':').map(Number);
        const [outH, outM] = tOut.split(':').map(Number);
        
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

        newEntries[index].regularHours = Math.round(reg * 100) / 100;
        newEntries[index].overtimeHours = Math.round(ot * 100) / 100;
      }
    } else {
      newEntries[index][field] = Number(value);
    }
    
    setEntries(newEntries);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await saveBulkManualDtr(workerId, period.id, entries);
    setLoading(false);
    if (res.success) {
      router.refresh();
      onClose();
    } else {
      alert(res.error || 'Failed to save bulk DTR');
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 15, 26, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#fff', fontWeight: '700' }}>
            Bulk DTR Entry (Cutoff Period)
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '20px 30px', borderBottom: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Select Worker</label>
            <select 
              value={workerId} 
              disabled={!!editingDtr}
              onChange={e => setWorkerId(e.target.value)} 
              style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', opacity: editingDtr ? 0.7 : 1 }}
            >
              <option value="" disabled>-- Select Worker --</option>
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

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 30px' }}>
            {entries.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
                  <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                    <th style={{ padding: '12px 8px', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Date</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', width: '130px' }}>Time In</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', width: '130px' }}>Time Out</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', width: '100px' }}>Reg Hours</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', width: '100px' }}>OT Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => (
                    <tr key={entry.date} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: entry.isSunday ? 'rgba(255, 107, 107, 0.03)' : 'transparent' }}>
                      <td style={{ padding: '12px 8px', fontWeight: entry.isSunday ? 'bold' : 'normal', color: entry.isSunday ? '#ff6b6b' : '#fff', whiteSpace: 'nowrap' }}>
                        {entry.displayDate}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input 
                          type="time" 
                          value={entry.timeIn} 
                          onChange={e => handleEntryChange(index, 'timeIn', e.target.value)} 
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', textAlign: 'center' }} 
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input 
                          type="time" 
                          value={entry.timeOut} 
                          onChange={e => handleEntryChange(index, 'timeOut', e.target.value)} 
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', textAlign: 'center' }} 
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input 
                          type="number" 
                          step="0.5" 
                          min="0"
                          max="24"
                          value={entry.regularHours} 
                          onChange={e => handleEntryChange(index, 'regularHours', e.target.value)} 
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', textAlign: 'center' }} 
                        />
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input 
                          type="number" 
                          step="0.5"
                          min="0"
                          value={entry.overtimeHours} 
                          onChange={e => handleEntryChange(index, 'overtimeHours', e.target.value)} 
                          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', textAlign: 'center' }} 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>
                Please select a worker to begin entry.
              </div>
            )}
          </div>

          <div style={{ padding: '20px 30px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading || !workerId} style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: (loading || !workerId) ? 'not-allowed' : 'pointer', fontWeight: '700', opacity: (loading || !workerId) ? 0.7 : 1 }}>
              {loading ? 'Saving...' : 'Save All Records'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
