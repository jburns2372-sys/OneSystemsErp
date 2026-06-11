'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPayrollPeriod } from '@/app/actions/payrollActions';
import { submitAIOverrideRequest } from '@/app/actions/aiOverrideActions';

export default function CreatePeriodModal({ onClose, currentUserId, projects }: { onClose: () => void, currentUserId: string, projects: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationLogId, setValidationLogId] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideSuccess, setOverrideSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    calendarRule: 'SEMI_MONTHLY',
    periodType: 'FIRST_HALF',
    startDate: '',
    endDate: '',
    payrollDate: '',
    projectId: '',
    notes: ''
  });

  // Calculate Dates dynamically
  useEffect(() => {
    if (formData.calendarRule === 'CUSTOM' || formData.calendarRule === 'CONSULTANT' || formData.calendarRule === 'PROJECT_BASED') {
      return; // Leave dates as is, or require manual input
    }

    const { month, year, calendarRule, periodType } = formData;
    let sDate = '';
    let eDate = '';
    let pDate = '';

    const lastDayOfMonth = new Date(year, month, 0).getDate();

    if (calendarRule === 'SEMI_MONTHLY') {
      if (periodType === 'FIRST_HALF') {
        sDate = `${year}-${String(month).padStart(2, '0')}-01`;
        eDate = `${year}-${String(month).padStart(2, '0')}-15`;
        pDate = `${year}-${String(month).padStart(2, '0')}-15`;
      } else if (periodType === 'SECOND_HALF') {
        sDate = `${year}-${String(month).padStart(2, '0')}-16`;
        eDate = `${year}-${String(month).padStart(2, '0')}-${lastDayOfMonth}`;
        pDate = `${year}-${String(month).padStart(2, '0')}-${lastDayOfMonth}`;
      }
    } else if (calendarRule === 'MONTHLY') {
      sDate = `${year}-${String(month).padStart(2, '0')}-01`;
      eDate = `${year}-${String(month).padStart(2, '0')}-${lastDayOfMonth}`;
      pDate = `${year}-${String(month).padStart(2, '0')}-${lastDayOfMonth}`;
    } else if (calendarRule === 'WEEKLY') {
      const weekIndex = parseInt(periodType.replace('WEEK_', '')) - 1;
      if (!isNaN(weekIndex)) {
        const startDay = (weekIndex * 7) + 1;
        if (startDay <= lastDayOfMonth) {
          sDate = `${year}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`;
          const endDay = Math.min(startDay + 6, lastDayOfMonth);
          eDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
          pDate = eDate;
        }
      }
    }

    if (sDate && eDate && pDate) {
      setFormData(prev => ({ ...prev, startDate: sDate, endDate: eDate, payrollDate: pDate }));
    }

  }, [formData.month, formData.year, formData.calendarRule, formData.periodType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.payrollDate) {
      setError('Please fill in all dates');
      return;
    }
    
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      setError('End Date cannot be earlier than Start Date.');
      return;
    }

    setLoading(true);
    setError('');

    const res = await createPayrollPeriod(formData, currentUserId);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to create period');
      setValidationLogId(res.validationLogId || null);
      setLoading(false);
    }
  };

  const handleOverride = async () => {
    if (!validationLogId || !overrideReason) return;
    setLoading(true);
    const res = await submitAIOverrideRequest({
      validationLogId,
      transactionId: 'PENDING_PAYROLL',
      moduleName: 'Payroll Generation',
      overriddenBy: currentUserId,
      overriddenByRole: 'HR_MANAGER', // Can pull actual role later
      overrideReason
    });
    
    if (res.success) {
      setOverrideSuccess(true);
      setError('Override Request Submitted! A Project Director must approve it before this payroll period is created.');
      setValidationLogId(null);
    } else {
      setError(res.error || 'Failed to submit override');
    }
    setLoading(false);
  };

  const getPeriodOptions = () => {
    switch (formData.calendarRule) {
      case 'SEMI_MONTHLY':
        return [
          { value: 'FIRST_HALF', label: 'First Half (1st-15th)' },
          { value: 'SECOND_HALF', label: 'Second Half (16th-End)' }
        ];
      case 'WEEKLY':
        return [
          { value: 'WEEK_1', label: 'Week 1' },
          { value: 'WEEK_2', label: 'Week 2' },
          { value: 'WEEK_3', label: 'Week 3' },
          { value: 'WEEK_4', label: 'Week 4' },
          { value: 'WEEK_5', label: 'Week 5' }
        ];
      case 'MONTHLY':
        return [{ value: 'FULL_MONTH', label: 'Full Month' }];
      case 'PROJECT_BASED':
        return [
          { value: 'PROJ_CUTOFF', label: 'Project Payroll Cutoff' },
          { value: 'PROJ_PROGRESS', label: 'Project Progress Payroll' },
          { value: 'PROJ_COMPLETION', label: 'Project Completion Payroll' }
        ];
      case 'CONSULTANT':
        return [
          { value: 'MILESTONE', label: 'Milestone Payment' },
          { value: 'PROGRESS', label: 'Progress Payment' },
          { value: 'COMPLETION', label: 'Completion Payment' },
          { value: 'ONE_TIME', label: 'One-Time Payment' }
        ];
      case 'CUSTOM':
      default:
        return [{ value: 'CUSTOM_PERIOD', label: 'Custom Period' }];
    }
  };

  const isDateLocked = !['CUSTOM', 'PROJECT_BASED', 'CONSULTANT'].includes(formData.calendarRule);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(10, 15, 26, 0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '16px', width: '100%', maxWidth: '600px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column'
      }}>
        <div style={{ padding: '25px 35px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#fff', fontWeight: '700' }}>Create Payroll Period</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <div style={{ overflowY: 'auto', padding: '35px' }}>
          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{ background: 'rgba(255, 107, 107, 0.1)', color: '#ff6b6b', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(255, 107, 107, 0.3)' }}>
                <div style={{ fontWeight: 600, marginBottom: '5px' }}>{error}</div>
                
                {validationLogId && !overrideSuccess && (
                  <div style={{ marginTop: '15px', padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <div style={{ color: '#aaa', fontSize: '0.85rem', marginBottom: '10px' }}>Apply for AI Exception Override:</div>
                    <textarea 
                      value={overrideReason} 
                      onChange={e => setOverrideReason(e.target.value)} 
                      placeholder="Justification for bypassing policy (e.g. Director requested special payroll)..."
                      style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#111', color: '#fff', border: '1px solid #444', marginBottom: '10px' }}
                    />
                    <button 
                      type="button"
                      onClick={handleOverride}
                      disabled={loading || !overrideReason}
                      style={{ padding: '8px 16px', background: '#ffd43b', color: '#000', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                    >
                      Submit Override to Director
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Month</label>
                <select 
                  value={formData.month} 
                  onChange={(e) => setFormData({...formData, month: Number(e.target.value)})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                >
                  {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                    <option key={m} value={m} style={{ background: 'var(--bg-secondary)' }}>
                      {new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Year</label>
                <input 
                  type="number" 
                  value={formData.year} 
                  onChange={(e) => setFormData({...formData, year: Number(e.target.value)})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Calendar Rule</label>
                <select 
                  value={formData.calendarRule} 
                  onChange={(e) => setFormData({...formData, calendarRule: e.target.value, periodType: ''})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                >
                  <option value="SEMI_MONTHLY" style={{ background: 'var(--bg-secondary)' }}>Semi-Monthly</option>
                  <option value="WEEKLY" style={{ background: 'var(--bg-secondary)' }}>Weekly</option>
                  <option value="MONTHLY" style={{ background: 'var(--bg-secondary)' }}>Monthly</option>
                  <option value="CUSTOM" style={{ background: 'var(--bg-secondary)' }}>Custom Period</option>
                  <option value="PROJECT_BASED" style={{ background: 'var(--bg-secondary)' }}>Project-Based</option>
                  <option value="CONSULTANT" style={{ background: 'var(--bg-secondary)' }}>Consultant / One-Lot</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Period Type</label>
                <select 
                  value={formData.periodType} 
                  onChange={(e) => setFormData({...formData, periodType: e.target.value})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                  required
                >
                  <option value="" disabled style={{ background: 'var(--bg-secondary)' }}>Select Period</option>
                  {getPeriodOptions().map(opt => (
                    <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-secondary)' }}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {formData.calendarRule === 'PROJECT_BASED' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Select Project</label>
                <select 
                  value={formData.projectId} 
                  onChange={(e) => setFormData({...formData, projectId: e.target.value})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                  required
                >
                  <option value="" disabled style={{ background: 'var(--bg-secondary)' }}>-- Select a Project --</option>
                  {projects.map(proj => (
                    <option key={proj.id} value={proj.id} style={{ background: 'var(--bg-secondary)' }}>{proj.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Start Date</label>
                <input 
                  type="date" 
                  value={formData.startDate} 
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  disabled={isDateLocked}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: isDateLocked ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: isDateLocked ? '#888' : '#fff', outline: 'none', cursor: isDateLocked ? 'not-allowed' : 'text' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>End Date</label>
                <input 
                  type="date" 
                  value={formData.endDate} 
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  disabled={isDateLocked}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: isDateLocked ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: isDateLocked ? '#888' : '#fff', outline: 'none', cursor: isDateLocked ? 'not-allowed' : 'text' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Payroll Date</label>
                <input 
                  type="date" 
                  value={formData.payrollDate} 
                  onChange={(e) => setFormData({...formData, payrollDate: e.target.value})}
                  style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>Notes / Remarks (Optional)</label>
              <textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="E.g., Early release due to holiday..."
                style={{ width: '100%', padding: '12px 15px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff', outline: 'none', minHeight: '80px', resize: 'vertical' }}
              />
            </div>

            <div style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid rgba(0, 240, 255, 0.2)', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <h4 style={{ margin: '0 0 10px 0', color: 'var(--accent-color)' }}>Payroll Summary Preview</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#ccc', lineHeight: '1.5' }}>
                You are about to open a <strong>{formData.calendarRule.replace('_', ' ')}</strong> payroll period for <strong>{formData.periodType.replace('_', ' ')}</strong>. <br/>
                Coverage: <strong>{formData.startDate || '?'}</strong> to <strong>{formData.endDate || '?'}</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button type="button" onClick={onClose} style={{ padding: '12px 25px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '12px 25px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>
                {loading ? 'Opening Period...' : 'Confirm & Open Period'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
