'use client';

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Clears the client-side role preview cookie (simulatedRole) and refreshes so an
 * administrator returns immediately to their real authenticated role view.
 * Never grants or escalates privileges.
 */
export default function ExitRolePreviewButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleExit = () => {
    document.cookie = 'simulatedRole=; path=/; max-age=0; SameSite=Lax';
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleExit}
      disabled={isPending}
      aria-label="Exit role preview and return to your real signed-in role"
      style={{
        background: 'rgba(245, 158, 11, 0.14)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        color: '#fde68a',
        borderRadius: '6px',
        padding: '2px 8px',
        fontSize: '0.7rem',
        fontWeight: 600,
        cursor: isPending ? 'wait' : 'pointer',
        marginLeft: '8px',
      }}
    >
      {isPending ? 'Exiting…' : 'Exit Preview'}
    </button>
  );
}
