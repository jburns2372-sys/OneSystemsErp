'use client';

import { useState } from 'react';
import ManageRolesModal from './ManageRolesModal';

export default function ManageRolesButton({ roles }: { roles: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          padding: '10px 15px',
          borderRadius: '8px',
          backgroundColor: 'transparent',
          color: 'var(--text-primary)',
          border: '1px solid var(--glass-border)',
          cursor: 'pointer',
          fontWeight: '500',
          transition: 'all 0.2s',
          marginRight: '10px'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        Manage Roles
      </button>

      {isOpen && <ManageRolesModal onClose={() => setIsOpen(false)} roles={roles} />}
    </>
  );
}
