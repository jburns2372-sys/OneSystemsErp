'use client';

import React, { useState } from 'react';
import LogExpenseModal from './LogExpenseModal';

interface Props {
  projects: { id: string; name: string }[];
  users: { id: string; name: string | null }[];
}

export default function LogExpenseClient({ projects, users }: Props) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button 
        onClick={() => setShowModal(true)} 
        style={{
          padding: '8px 16px',
          backgroundColor: 'var(--accent-color)',
          color: '#000',
          border: 'none',
          borderRadius: '8px',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        + Log Expense
      </button>

      {showModal && (
        <LogExpenseModal 
          projects={projects} 
          users={users} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </>
  );
}
