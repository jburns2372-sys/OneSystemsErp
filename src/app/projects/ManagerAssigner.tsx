'use client';
import { useState } from 'react';
import { assignProjectManager } from '@/app/actions/project';
import { useRouter } from 'next/navigation';

export default function ManagerAssigner({ 
  projectId, 
  currentManager, 
  users, 
  canEdit 
}: { 
  projectId: string; 
  currentManager?: { id: string; name: string | null } | null;
  users: { id: string; name: string; role: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!canEdit) {
    return <span>{currentManager?.name || 'Unassigned'}</span>;
  }

  if (isEditing) {
    return (
      <select 
        autoFocus
        disabled={isSaving}
        defaultValue={currentManager?.id || ''}
        onBlur={() => setIsEditing(false)}
        onChange={async (e) => {
          setIsSaving(true);
          const val = e.target.value;
          await assignProjectManager(projectId, val === '' ? null : val);
          setIsEditing(false);
          setIsSaving(false);
          router.refresh();
        }}
        style={{ 
          padding: '4px', 
          borderRadius: '4px', 
          background: 'var(--bg-secondary)', 
          color: 'var(--text-primary)', 
          border: '1px solid var(--glass-border)',
          maxWidth: '200px'
        }}
      >
        <option value="">-- Unassigned --</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>{u.name} ({u.role.replace('_', ' ')})</option>
        ))}
      </select>
    );
  }

  return (
    <span 
      onClick={() => setIsEditing(true)} 
      style={{ 
        cursor: 'pointer', 
        color: currentManager ? 'var(--text-primary)' : 'var(--accent-color)',
        textDecoration: 'underline',
        textDecorationStyle: 'dotted',
        textUnderlineOffset: '4px',
        fontWeight: 'bold'
      }}
      title="Click to assign a new manager"
    >
      {currentManager?.name || 'Unassigned'}
    </span>
  );
}
