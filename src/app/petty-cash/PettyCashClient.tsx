'use client';

import { useState } from 'react';
import CreatePCAccountModal from './CreatePCAccountModal';
import ApplicableRulesPanel from '@/components/ApplicableRulesPanel';

export default function PettyCashClient({ projects, users }: { projects: any[], users: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <ApplicableRulesPanel moduleName="Petty Cash" />
      <button 
        onClick={() => setIsModalOpen(true)}
        style={{
          background: 'var(--accent-color)',
          color: '#000',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        + Create Account
      </button>

      {isModalOpen && (
        <CreatePCAccountModal 
          projects={projects} 
          users={users} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}
