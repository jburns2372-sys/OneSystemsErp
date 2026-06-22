'use client';

import { useTransition } from 'react';
import { deleteUser } from '@/app/actions/user';

export default function DeleteUserButton({ userId, userName, actionClass }: { userId: string, userName: string, actionClass?: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (confirm(`Are you sure you want to completely remove user "${userName}"? This action cannot be undone.`)) {
      startTransition(async () => {
        try {
          const res = await deleteUser(userId);
          if (res && !res.success) {
            alert(res.error || 'Failed to delete user.');
          }
        } catch (error: any) {
          alert(error.message || 'Failed to delete user.');
        }
      });
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isPending}
      className={actionClass}
      style={{
        background: 'transparent',
        border: '1px solid #ef4444',
        color: '#ef4444',
        padding: '4px 10px',
        borderRadius: '4px',
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontSize: '0.85rem',
        opacity: isPending ? 0.5 : 1,
        marginLeft: '10px'
      }}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
