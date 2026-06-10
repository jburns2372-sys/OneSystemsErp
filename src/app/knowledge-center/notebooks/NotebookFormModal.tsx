'use client';

import { useState } from 'react';
import { saveKnowledgeRecord } from '@/app/actions/knowledgeActions';

export default function NotebookFormModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    notebookUrl: '',
    relatedModule: 'General',
    description: '',
    notebookType: 'ERP Master Notebook',
    documentType: 'Notebook Link',
    status: 'Approved'
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
        <h2 style={{ marginTop: 0 }}>Add Gemini Notebook</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Notebook Title</label>
            <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff' }} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>NotebookLM URL</label>
            <input required type="url" value={formData.notebookUrl} onChange={e => setFormData({...formData, notebookUrl: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff' }} placeholder="https://notebooklm.google.com/..." />
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
            <label style={{ display: 'block', marginBottom: '5px' }}>Description</label>
            <textarea rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', color: '#fff' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 15px', background: 'transparent', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '10px 15px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              {loading ? 'Saving...' : 'Save Notebook Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
