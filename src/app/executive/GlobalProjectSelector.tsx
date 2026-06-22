'use client';

import React, { useTransition } from 'react';
import { setExecutiveProjectContext } from '@/app/actions/executiveContextActions';

export default function GlobalProjectSelector({ projects, currentProjectId }: { projects: any[], currentProjectId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newContextId = e.target.value;
    startTransition(() => {
      setExecutiveProjectContext(newContextId);
    });
  };

  const selectedProject = projects.find(p => p.id === currentProjectId);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '24px', flexShrink: 1, minWidth: 0 }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4b5563', whiteSpace: 'nowrap' }}>Context:</span>
      <select 
        value={currentProjectId} 
        onChange={handleSelect}
        disabled={isPending}
        style={{ 
          padding: '6px 12px', 
          borderRadius: '6px', 
          border: '1px solid #d1d5db', 
          backgroundColor: isPending ? '#f3f4f6' : 'white', 
          fontSize: '0.875rem', 
          color: '#111827', 
          outline: 'none',
          cursor: isPending ? 'wait' : 'pointer',
          minWidth: '220px',
          maxWidth: '500px',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}
      >
        <option value="ALL">🏢 All Projects (Company Portfolio)</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>📁 {p.name}</option>
        ))}
      </select>

      {selectedProject && currentProjectId !== 'ALL' && (
        <div style={{ display: 'flex', gap: '12px', marginLeft: '16px', fontSize: '0.8rem', color: '#6b7280', whiteSpace: 'nowrap', borderLeft: '1px solid #e5e7eb', paddingLeft: '16px' }}>
          <span><strong style={{color: '#374151'}}>Start:</strong> {formatDate(selectedProject.startDate)}</span>
          <span><strong style={{color: '#374151'}}>Target:</strong> {formatDate(selectedProject.endDate)}</span>
        </div>
      )}
    </div>
  );
}
