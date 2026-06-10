'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteWorker } from '@/app/actions/workerActions';

export default function WorkerDeleteButton({ workerId }: { workerId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this worker?')) return;
    
    setLoading(true);
    const res = await deleteWorker(workerId);
    
    if (res.success) {
      router.push('/workers');
      router.refresh();
    } else {
      alert('Failed to delete worker: ' + res.error);
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleDelete}
      disabled={loading}
      style={{
        background: 'rgba(231, 76, 60, 0.2)',
        color: '#e74c3c',
        border: '1px solid rgba(231, 76, 60, 0.4)',
        padding: '5px 10px',
        borderRadius: '6px',
        cursor: loading ? 'not-allowed' : 'pointer'
      }}
    >
      {loading ? 'Deleting...' : 'Delete'}
    </button>
  );
}
