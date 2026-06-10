'use client';

import { useState } from 'react';
import { saveKnowledgeRecord } from '@/app/actions/knowledgeActions';

export default function RuleFormModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    relatedModule: 'General',
    documentType: 'Business Rule',
    status: 'Approved',
    version: 'v1.0'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await saveKnowledgeRecord(formData);
    setLoading(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#1a1a1a', padding: '30px', borderRadius: '12px', width: '500px', border: '1px solid var(--glass-border)' }}>
        <h2 style={{ marginTop: 0 }}>Add Business Rule</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Rule Title</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff' }} placeholder="e.g. Awarded BOQ cannot be modified" />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Related ERP Module</label>
            <select value={formData.relatedModule} onChange={e => setFormData({...formData, relatedModule: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff' }}>
              <option value="General">General / Master</option>
              <option value="Projects">Projects</option>
              <option value="BOQ">BOQ & Procurement</option>
              <option value="Payroll">Workers & Payroll</option>
              <option value="Accounting">Accounting & Finance</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Rule Definition</label>
            <textarea required rows={5} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff' }} placeholder="Define the strict logic or conditions for this business rule..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 15px', background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 15px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Save Business Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
