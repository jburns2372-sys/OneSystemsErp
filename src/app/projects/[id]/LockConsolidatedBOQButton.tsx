'use client';

import { useState } from 'react';
import { toggleConsolidatedBOQLock } from '@/app/actions/mutations';

export default function LockConsolidatedBOQButton({ projectId, isLocked }: { projectId: string, isLocked: boolean }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    const actionName = isLocked ? 'UNLOCK' : 'LOCK';
    if (confirm(`Are you sure you want to ${actionName} this Procurement Benchmark BOQ?`)) {
      setIsLoading(true);
      await toggleConsolidatedBOQLock(projectId, !isLocked);
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleToggle} 
      disabled={isLoading}
      style={{
        padding: '6px 12px',
        borderRadius: '6px',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        cursor: isLoading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: isLocked ? 'rgba(0, 255, 128, 0.1)' : 'transparent',
        color: isLocked ? '#00ff80' : 'var(--text-secondary)',
        border: isLocked ? '1px solid rgba(0, 255, 128, 0.3)' : '1px solid var(--glass-border)',
        transition: 'all 0.2s ease',
      }}
    >
      {isLoading ? '...' : (isLocked ? '🔒 Locked' : '🔓 Unlock')}
    </button>
  );
}
