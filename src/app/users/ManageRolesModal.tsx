'use client';

import { useState, useTransition } from 'react';
import { updateSystemRole, deleteSystemRole } from '@/app/actions/user';
import styles from './page.module.css';

export default function ManageRolesModal({ onClose, roles }: { onClose: () => void, roles: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [error, setError] = useState('');

  const handleEdit = (role: string) => {
    setEditingRole(role);
    setEditValue(role);
    setError('');
  };

  const handleSaveEdit = async () => {
    if (!editingRole) return;
    setError('');
    startTransition(async () => {
      try {
        await updateSystemRole(editingRole, editValue);
        setEditingRole(null);
      } catch (err: any) {
        setError(err.message || 'Failed to update role');
      }
    });
  };

  const handleDelete = async (role: string) => {
    if (!confirm(`Are you sure you want to delete the role "${role}"?\n\nIf any users are currently assigned to this role, it will show as a Custom Role for them.`)) return;
    setError('');
    startTransition(async () => {
      try {
        await deleteSystemRole(role);
      } catch (err: any) {
        setError(err.message || 'Failed to delete role');
      }
    });
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)', padding: '30px', borderRadius: '16px',
        border: '1px solid var(--glass-border)', width: '100%', maxWidth: '500px',
        maxHeight: '80vh', display: 'flex', flexDirection: 'column'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Manage System Roles</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
          Edit or permanently delete custom roles from the system.
        </p>

        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</div>}

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px', backgroundColor: 'var(--bg-dark)' }}>
          {roles.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No roles found.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {roles.map(role => (
                <li key={role} style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '12px 15px', borderBottom: '1px solid var(--glass-border)' 
                }}>
                  {editingRole === role ? (
                    <div style={{ display: 'flex', gap: '10px', flex: 1 }}>
                      <input 
                        type="text" 
                        value={editValue} 
                        onChange={e => setEditValue(e.target.value)}
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--accent-glow)', backgroundColor: 'rgba(0,240,255,0.05)', color: 'var(--text-primary)' }}
                        autoFocus
                      />
                      <button onClick={handleSaveEdit} disabled={isPending} style={{ padding: '6px 12px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Save
                      </button>
                      <button onClick={() => setEditingRole(null)} disabled={isPending} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <>
                      <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{role}</span>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => handleEdit(role)}
                          disabled={isPending}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(role)}
                          disabled={isPending}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button type="button" onClick={onClose} disabled={isPending}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
