'use client';

import React from 'react';
import { format } from 'date-fns';
import { ShieldAlert, Lock, Fingerprint } from 'lucide-react';

interface SystemCountermeasuresProps {
  countermeasures: any[];
}

export default function SystemCountermeasures({ countermeasures }: SystemCountermeasuresProps) {
  
  const getIcon = (type: string) => {
    if (type.includes('Block') || type.includes('Deny')) return <Lock size={20} style={{ color: '#34d399', flexShrink: 0 }} />;
    if (type.includes('Session') || type.includes('Account')) return <Fingerprint size={20} style={{ color: '#fbbf24', flexShrink: 0 }} />;
    return <ShieldAlert size={20} style={{ color: '#60a5fa', flexShrink: 0 }} />;
  };

  return (
    <div style={{ backgroundColor: '#111', borderRadius: '12px', border: '0', display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#151515', borderTopLeftRadius: '12px', borderTopRightRadius: '12px', position: 'sticky', top: 0, zIndex: 20 }}>
        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'white', letterSpacing: '0.025em', margin: 0 }}>Active Countermeasures</h2>
        <span style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '2px 8px', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          {countermeasures.filter(c => c.status === 'ACTIVE').length} ACTIVE
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {countermeasures.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
            No automated countermeasures currently active.
          </div>
        ) : countermeasures.map(cm => (
          <div key={cm.id} style={{ padding: '16px', backgroundColor: 'rgba(17, 24, 39, 0.5)', border: '1px solid #1f2937', borderRadius: '8px', display: 'flex', gap: '16px' }}>
            <div style={{ marginTop: '4px', flexShrink: 0 }}>
              {getIcon(cm.countermeasureType)}
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#e5e7eb', margin: 0 }}>{cm.countermeasureType}</h3>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', fontFamily: 'monospace' }}>{format(new Date(cm.timestamp), 'HH:mm:ss')}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0', lineHeight: 1.5 }}>{cm.description}</p>
              {cm.result && (
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981', marginTop: '8px', marginBottom: 0 }}>Result: {cm.result}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
