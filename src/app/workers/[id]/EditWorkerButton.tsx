'use client';

import { useState } from 'react';
import WorkerFormModal from '@/app/payroll/WorkerFormModal';
import { useRouter } from 'next/navigation';

export default function EditWorkerButton({ worker }: { worker: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        style={{ background: '#3498db', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', marginLeft: '10px' }}
      >
        Edit Profile
      </button>

      {isOpen && (
        <WorkerFormModal 
          worker={worker} 
          onClose={() => {
            setIsOpen(false);
            router.refresh(); // Refresh the server component to show updated data
          }} 
        />
      )}
    </>
  );
}
