'use client';

import { useState } from 'react';
import { saveCutoffSetting, deleteCutoffSetting } from '../../actions/payrollEngine';

export default function CutoffFormModal({ cutoff, onClose }: { cutoff?: any, onClose: () => void }) {
  const [formData, setFormData] = useState({
    id: cutoff?.id || '',
    cutoffName: cutoff?.cutoffName || '',
    cutoffType: cutoff?.cutoffType || 'SEMI_MONTHLY_FIXED',
    startDay: cutoff?.startDay || '',
    endDay: cutoff?.endDay || '',
    payrollReleaseDay: cutoff?.payrollReleaseDay || '',
    crossesMonth: cutoff?.crossesMonth || false,
    isDefault: cutoff?.isDefault || false,
    appliesTo: cutoff?.appliesTo || 'ALL',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      startDay: formData.startDay ? parseInt(formData.startDay as string) : null,
      endDay: formData.endDay ? parseInt(formData.endDay as string) : null,
      payrollReleaseDay: formData.payrollReleaseDay ? parseInt(formData.payrollReleaseDay as string) : null,
    };

    const res = await saveCutoffSetting(payload);
    setLoading(false);

    if (res.success) {
      onClose();
    } else {
      alert(res.error || 'Failed to save cutoff setting');
    }
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    if (confirm('Are you sure you want to delete this custom cutoff?')) {
      setLoading(true);
      const res = await deleteCutoffSetting(formData.id);
      if (res.success) {
        onClose();
      } else {
        alert(res.error || 'Failed to delete');
        setLoading(false);
      }
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        background: 'var(--bg-secondary)', padding: '30px', borderRadius: '16px',
        width: '500px', maxWidth: '90vw', border: '1px solid var(--glass-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)', color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>
            {formData.id ? 'Edit Cutoff Setting' : 'Create New Cutoff'}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Cutoff Name</label>
            <input 
              type="text" 
              required
              value={formData.cutoffName}
              onChange={e => setFormData({...formData, cutoffName: e.target.value})}
              style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}
              placeholder="e.g. Field Workers Weekly"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Cutoff Type</label>
              <select 
                value={formData.cutoffType}
                onChange={e => setFormData({...formData, cutoffType: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}
              >
                <option value="SEMI_MONTHLY_FIXED">Semi-Monthly (Fixed)</option>
                <option value="CUSTOM_SEMI_MONTHLY">Custom Semi-Monthly</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BI_WEEKLY">Bi-Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Applies To</label>
              <select 
                value={formData.appliesTo}
                onChange={e => setFormData({...formData, appliesTo: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}
              >
                <option value="ALL">All Employees</option>
                <option value="DEPARTMENT">Specific Department</option>
                <option value="PROJECT">Specific Project</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Start Day</label>
              <input 
                type="number" min="1" max="31"
                value={formData.startDay}
                onChange={e => setFormData({...formData, startDay: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}
                placeholder="11"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>End Day</label>
              <input 
                type="number" min="1" max="31"
                value={formData.endDay}
                onChange={e => setFormData({...formData, endDay: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}
                placeholder="25"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>Release Day</label>
              <input 
                type="number" min="1" max="31"
                value={formData.payrollReleaseDay}
                onChange={e => setFormData({...formData, payrollReleaseDay: e.target.value})}
                style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: '#fff', fontSize: '1rem' }}
                placeholder="30"
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', background: 'rgba(0,0,0,0.1)', padding: '15px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={formData.crossesMonth}
                onChange={e => setFormData({...formData, crossesMonth: e.target.checked})}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Crosses Month</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input 
                type="checkbox"
                checked={formData.isDefault}
                onChange={e => setFormData({...formData, isDefault: e.target.checked})}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
              />
              <span style={{ fontSize: '0.9rem' }}>Is Default Cutoff</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
            {formData.id && (
              <button 
                type="button" 
                onClick={handleDelete}
                disabled={loading}
                style={{ background: 'transparent', color: '#ff6b6b', border: '1px solid #ff6b6b', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginRight: 'auto' }}
              >
                Delete
              </button>
            )}
            <button 
              type="button" 
              onClick={onClose}
              disabled={loading}
              style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 12px rgba(0, 255, 163, 0.2)' }}
            >
              {loading ? 'Saving...' : 'Save Cutoff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
