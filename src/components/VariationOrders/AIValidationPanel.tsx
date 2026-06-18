'use client';

import React from 'react';
import { ShieldCheck, AlertOctagon, Info, FileSearch } from 'lucide-react';
import styles from '@/app/knowledge-center/chat/page.module.css';

export default function AIValidationPanel({ validations }: { validations: any[] }) {
  if (!validations || validations.length === 0) {
    return (
      <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: '12px', border: '1px dashed var(--border)', textAlign: 'center' }}>
        <FileSearch size={32} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
        <h3 style={{ margin: 0, color: 'var(--text-secondary)' }}>No AI Validations Yet</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Click "Run AI Pre-Check" to analyze this Variation Order.</p>
      </div>
    );
  }

  const getIcon = (result: string) => {
    switch (result) {
      case 'PASSED': return <ShieldCheck color="var(--success-color)" size={20} />;
      case 'FAILED': return <AlertOctagon color="var(--danger-color)" size={20} />;
      default: return <Info color="var(--warning-color)" size={20} />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'var(--success-color)';
      case 'MEDIUM': return 'var(--warning-color)';
      case 'HIGH': return 'var(--danger-color)';
      case 'CRITICAL': return '#8B0000'; // Dark Red
      default: return 'var(--text-secondary)';
    }
  };

  const overallRisk = validations.find(v => v.riskLevel)?.riskLevel || 'UNKNOWN';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ background: 'var(--surface)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
        <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} /> Overall AI Risk Assessment
        </h3>
        <div style={{ 
          display: 'inline-block', padding: '0.5rem 1rem', borderRadius: '8px', 
          background: getRiskColor(overallRisk), color: '#fff', fontWeight: 'bold' 
        }}>
          {overallRisk} RISK
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {validations.map((val) => (
          <div key={val.id} style={{ background: 'var(--surface)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>{val.validationType} Validation</strong>
              {getIcon(val.result)}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Result: <span style={{ fontWeight: 'bold', color: 'var(--text)' }}>{val.result.replace(/_/g, ' ')}</span>
            </div>
            <p style={{ fontSize: '0.95rem', margin: 0 }}>
              {val.findings || 'No specific findings.'}
            </p>
            {val.missingRequirements && (
              <div style={{ marginTop: '0.5rem', color: 'var(--danger-color)', fontSize: '0.9rem' }}>
                <strong>Missing:</strong> {val.missingRequirements}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
