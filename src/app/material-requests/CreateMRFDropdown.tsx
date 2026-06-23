'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
}

export default function CreateMRFDropdown({ projects }: { projects: Project[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (projects.length === 0) {
    return (
      <button 
        className="btn-primary" 
        style={{ opacity: 0.6, cursor: 'not-allowed' }}
        title="No projects have a locked Procurement Benchmark BOQ yet."
        disabled
      >
        + Create MRF (No Locked BOQs)
      </button>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn-primary" 
        onClick={() => setIsOpen(!isOpen)}
      >
        + Create MRF ▾
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '110%',
          right: 0,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          minWidth: '250px',
          zIndex: 1000,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '10px 15px', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Select Project (Locked BOQ)
          </div>
          {projects.map(p => (
            <div 
              key={p.id}
              onClick={() => {
                setIsOpen(false);
                router.push(`/material-requests/create?projectId=${p.id}`);
              }}
              style={{
                padding: '12px 15px',
                cursor: 'pointer',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                transition: 'background 0.2s',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(0,240,255,0.1)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
