'use client';

import React from 'react';
import Link from 'next/link';

export default function AIValidationRulesPage() {
  const rules = [
    {
      id: 'V-PR-01',
      module: 'Procurement',
      name: 'High-Value Executive Approval',
      description: 'Automatically flags Purchase Orders exceeding ₱500,000 for mandatory Project Director approval.',
      status: 'Active',
      type: 'Blocking Rule',
      icon: '🛒'
    },
    {
      id: 'V-PY-01',
      module: 'Payroll',
      name: 'Ghost Employee Detection',
      description: 'Blocks payroll generation if unverified, inactive, or unregistered workers are detected in the daily time record.',
      status: 'Active',
      type: 'Critical Blocking Issue',
      icon: '👥'
    },
    {
      id: 'V-SC-01',
      module: 'Subcontracting',
      name: 'Evidence Matching',
      description: 'Validates subcontractor progress billings against attached evidence files and prevents billing exceeding awarded BOQ quantities.',
      status: 'Active',
      type: 'Requirement',
      icon: '👷'
    },
    {
      id: 'V-AC-01',
      module: 'Site Accomplishment',
      name: 'AI Photo Duplication Check',
      description: 'Scans uploaded site progress photos for duplicates or previously submitted images to prevent fraudulent accomplishment claims.',
      status: 'Active',
      type: 'Security Check',
      icon: '📸'
    },
    {
      id: 'V-EX-01',
      module: 'Expenses',
      name: 'Receipt Verification',
      description: 'Cross-references submitted expense breakdowns with attached receipt proofs using AI OCR extraction.',
      status: 'Active',
      type: 'Verification',
      icon: '🧾'
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2rem', color: '#fff' }}>Programmed AI Validation Rules</h1>
          <p style={{ margin: '10px 0 0 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            The following automated rules and security checks are currently active globally across the system.
          </p>
        </div>
        <button style={{ background: 'var(--accent-color)', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          + Create Custom Rule
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {rules.map((rule) => (
          <div key={rule.id} style={{ 
            background: 'var(--bg-secondary)', 
            border: '1px solid var(--glass-border)', 
            borderRadius: '12px', 
            padding: '20px',
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ fontSize: '2.5rem', background: 'rgba(0,0,0,0.3)', padding: '15px', borderRadius: '12px' }}>
              {rule.icon}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {rule.id}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {rule.module}
                </span>
              </div>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.3rem', color: '#fff' }}>{rule.name}</h3>
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {rule.description}
              </p>
            </div>
            
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px #22c55e' }}></div>
                <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{rule.status}</span>
              </div>
              <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem' }}>
                {rule.type}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Engine Status: Online</h4>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          These rules are hardcoded into the transaction layer. When creating new NotebookLM references, the system will apply them on top of these foundational security validations.
        </p>
      </div>
    </div>
  );
}
