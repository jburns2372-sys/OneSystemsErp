'use client';

import { useState } from 'react';
import NotebookFormModal from './NotebookFormModal';

export default function NotebooksClientPage({ initialNotebooks }: { initialNotebooks: any[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Gemini Notebooks</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>Manage linked NotebookLM knowledge bases.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--accent-color)', color: '#000', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add Notebook Link
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {initialNotebooks.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No notebooks linked yet.</div>
        ) : (
          initialNotebooks.map(nb => (
            <div key={nb.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', background: 'rgba(52, 152, 219, 0.2)', color: '#3498db', padding: '3px 8px', borderRadius: '4px' }}>
                  {nb.relatedModule}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(nb.createdAt).toLocaleDateString()}</span>
              </div>
              <h3 style={{ margin: '15px 0 10px 0' }}>{nb.title}</h3>
              <p style={{ margin: '0 0 20px 0', color: 'var(--text-secondary)', flex: 1, fontSize: '0.9rem' }}>
                {nb.description || 'No description provided.'}
              </p>
              <a href={nb.notebookUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-block', textAlign: 'center', padding: '10px', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', textDecoration: 'none', border: '1px solid var(--glass-border)' }}>
                Open in NotebookLM ↗
              </a>
            </div>
          ))
        )}
      </div>

      {showModal && <NotebookFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
