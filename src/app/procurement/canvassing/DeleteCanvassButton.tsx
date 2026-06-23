'use client';

import { useTransition } from 'react';
import { deleteCanvass } from '@/app/actions/canvass';

export default function DeleteCanvassButton({ canvassId }: { canvassId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this canvass? All associated quotations will also be deleted.')) {
      startTransition(async () => {
        try {
          await deleteCanvass(canvassId);
        } catch (error: any) {
          alert('Error deleting canvass: ' + error.message);
        }
      });
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      style={{
        background: 'transparent',
        border: '1px solid #ef4444',
        color: '#ef4444',
        padding: '6px 12px',
        borderRadius: '4px',
        cursor: isPending ? 'not-allowed' : 'pointer',
        marginLeft: '10px',
        opacity: isPending ? 0.5 : 1
      }}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
