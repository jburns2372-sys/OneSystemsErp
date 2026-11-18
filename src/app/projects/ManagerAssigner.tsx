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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!canEdit) {
    return <span>{currentManager?.name || 'Unassigned'}</span>;
  }

  return (
    <div>
      {isEditing ? (
        <select
          autoFocus
          disabled={isSaving}
          defaultValue={currentManager?.id || ''}
          onBlur={() => {
            if (!isSaving) setIsEditing(false);
          }}
          onChange={async (e) => {
            setIsSaving(true);
            setErrorMsg(null);
            const val = e.target.value;
            try {
              const res = await assignProjectManager(projectId, val === '' ? null : val);
              if (res && res.success === false) {
                setErrorMsg(typeof res.error === 'string' ? res.error : 'Failed to assign manager');
                return;
              }
              setIsEditing(false);
              router.refresh();
            } catch {
              setErrorMsg('Failed to assign manager');
            } finally {
              setIsSaving(false);
            }
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
      ) : (
        <span
          onClick={() => {
            setErrorMsg(null);
            setIsEditing(true);
          }}
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
      )}
      {errorMsg && (
        <div role="alert" style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px' }}>
          {errorMsg}
        </div>
      )}
    </div>
  );
}
