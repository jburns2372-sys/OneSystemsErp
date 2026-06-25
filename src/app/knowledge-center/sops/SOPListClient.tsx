'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SOPListClient({ sops }: { sops: any[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '20px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: '40px', padding: '15px', borderBottom: '1px solid var(--glass-border)' }}></th>
            <th style={{ textAlign: 'left', padding: '15px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Title</th>
            <th style={{ textAlign: 'left', padding: '15px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Module</th>
            <th style={{ textAlign: 'left', padding: '15px', color: 'var(--text-secondary)', borderBottom: '1px solid var(--glass-border)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sops.map(record => {
            const isExpanded = expandedId === record.id;
            
            return (
              <React.Fragment key={record.id}>
                <tr 
                  onClick={() => toggleExpand(record.id)}
                  style={{ cursor: 'pointer', background: isExpanded ? 'rgba(6, 182, 212, 0.05)' : 'transparent', transition: 'background 0.2s' }}
                >
                  <td style={{ padding: '15px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', color: 'var(--accent-color)' }}>
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </td>
                  <td style={{ padding: '15px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)', fontWeight: isExpanded ? 'bold' : 'normal', color: isExpanded ? '#fff' : 'inherit' }}>
                    {record.title}
                  </td>
                  <td style={{ padding: '15px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.85rem' }}>
                      {record.relatedModule || 'Global'}
                    </span>
                  </td>
                  <td style={{ padding: '15px', borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e' }}>
                      <CheckCircle2 size={16} /> {record.status}
                    </div>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td colSpan={4} style={{ padding: '0 20px 20px 65px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ background: 'rgba(0,0,0,0.4)', padding: '20px', borderRadius: '8px', borderLeft: '4px solid #06b6d4' }}>
                        <h4 style={{ margin: '0 0 10px 0', color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>Summary</h4>
                        <p style={{ margin: 0, color: '#e2e8f0', lineHeight: '1.6', fontSize: '0.95rem' }}>
                          {record.summary || 'Click the button below to view the comprehensive manual.'}
                        </p>
                        
                        <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div><strong>Version:</strong> {record.version}</div>
                            <div><strong>Tags:</strong> {record.tags}</div>
                            <div><strong>Prepared By:</strong> {record.preparedBy}</div>
                          </div>
                          <button 
                            onClick={() => router.push(`/knowledge-center/sops/${record.id}`)}
                            style={{ 
                              background: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', border: '1px solid rgba(6, 182, 212, 0.5)', 
                              padding: '8px 16px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold'
                            }}
                          >
                            Read Full SOP Manual
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
