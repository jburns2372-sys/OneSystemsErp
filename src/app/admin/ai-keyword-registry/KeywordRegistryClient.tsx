'use client';

import { useState } from 'react';

export default function KeywordRegistryClient({ initialKeywords }: { initialKeywords: any[] }) {
  const [keywords, setKeywords] = useState(initialKeywords);

  return (
    <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between' }}>
        <h3 style={{ margin: 0 }}>Registered Semantic Keywords</h3>
        <button style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer' }}>
          + Add Keyword
        </button>
      </div>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ background: 'rgba(0,0,0,0.2)' }}>
            <tr>
              <th style={{ padding: '15px' }}>Keyword</th>
              <th style={{ padding: '15px' }}>Type</th>
              <th style={{ padding: '15px' }}>Aliases</th>
              <th style={{ padding: '15px' }}>Database Table</th>
              <th style={{ padding: '15px' }}>Access Level</th>
              <th style={{ padding: '15px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {keywords.map(k => (
              <tr key={k.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <td style={{ padding: '15px' }}>
                  <strong>{k.keyword}</strong><br/>
                  <small style={{ color: 'var(--text-secondary)' }}>Norm: {k.normalizedKeyword}</small>
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ padding: '4px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', fontSize: '12px' }}>
                    {k.keywordType}
                  </span>
                </td>
                <td style={{ padding: '15px', color: 'var(--text-secondary)' }}>
                  {k.aliases || '-'}
                </td>
                <td style={{ padding: '15px', color: 'var(--accent-primary)' }}>
                  {k.databaseTable || '-'}
                </td>
                <td style={{ padding: '15px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '12px',
                    background: k.confidentialityLevel === 'RESTRICTED' ? 'rgba(255,100,100,0.1)' : 
                               k.confidentialityLevel === 'CONFIDENTIAL' ? 'rgba(255,50,50,0.2)' : 'rgba(100,255,100,0.1)',
                    color: k.confidentialityLevel === 'RESTRICTED' ? '#ff6b6b' : 
                           k.confidentialityLevel === 'CONFIDENTIAL' ? '#ff3b3b' : '#69db7c'
                  }}>
                    {k.confidentialityLevel}
                  </span>
                </td>
                <td style={{ padding: '15px' }}>
                  {k.isActive ? <span style={{ color: '#69db7c' }}>Active</span> : <span style={{ color: 'var(--text-secondary)' }}>Disabled</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
