'use client';

import React, { useTransition } from 'react';
import { deleteProject } from '@/app/actions/project';
import { useRouter } from 'next/navigation';

export default function DeleteProjectButton({ projectId }: { projectId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project? This action cannot be undone and will delete all associated schedules, tasks, and BOQ items.')) {
      startTransition(async () => {
        try {
          await deleteProject(projectId);
          router.refresh();
        } catch (error: any) {
          alert(error.message || 'Error deleting project');
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
        border: 'none',
        color: '#ef4444',
        cursor: isPending ? 'not-allowed' : 'pointer',
        fontSize: '0.85rem',
        textDecoration: 'underline',
        opacity: isPending ? 0.5 : 1
      }}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
