'use client';

import { useState } from 'react';
import RuleFormModal from './RuleFormModal';

export default function RulesClientPage({ initialRules }: { initialRules: any[] }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Business Rules</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>Manage the logic rules the AI Assistant and System will enforce.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--accent-color)', color: '#000', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add Business Rule
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {initialRules.length === 0 ? (
          <div style={{ padding: '20px', color: 'var(--text-secondary)' }}>No business rules defined yet.</div>
        ) : (
          initialRules.map(rule => (
            <div key={rule.id} style={{ background: 'rgba(0,0,0,0.3)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', gap: '20px' }}>
              <div style={{ width: '80px', flexShrink: 0, textAlign: 'center' }}>
                <div style={{ background: rule.status === 'Approved' ? 'rgba(46, 204, 113, 0.2)' : 'rgba(241, 196, 15, 0.2)', color: rule.status === 'Approved' ? '#2ecc71' : '#f1c40f', padding: '5px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '10px' }}>
                  {rule.status}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {rule.version}
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#fff' }}>{rule.title}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#ccc', lineHeight: '1.5' }}>{rule.description}</p>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Module: <strong style={{ color: 'var(--accent-color)' }}>{rule.relatedModule}</strong> • Created: {new Date(rule.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && <RuleFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
