'use client';

import { useState, useTransition } from 'react';
import { createUser } from '@/app/actions/user';
import styles from './page.module.css';

export default function AddUserModal({ onClose, roles = [] }: { onClose: () => void, roles?: string[] }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('PROJECT_ENGINEER');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalRole = role.trim().toUpperCase().replace(/ /g, '_');
    if (!finalRole) {
      return setError('Please specify a role.');
    }

    startTransition(async () => {
      try {
        await createUser({ name, email, role: finalRole });
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to create user');
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
        border: '1px solid var(--glass-border)', width: '100%', maxWidth: '400px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>Add New User</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name</label>
            <input 
              type="text" required value={name} onChange={e => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>Email</label>
            <input 
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: 'var(--text-secondary)' }}>System Role</label>
            <input 
              type="text" 
              required 
              list="role-options"
              value={role} 
              onChange={e => setRole(e.target.value)}
              placeholder="Select or type a new role..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            />
            <datalist id="role-options">
              {roles.map((r, i) => (
                <option key={i} value={r} />
              ))}
            </datalist>
          </div>
          
          {error && <div style={{ color: '#ef4444', fontSize: '0.9rem' }}>{error}</div>}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" onClick={onClose} disabled={isPending}
              style={{ padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={isPending} className={styles.primaryButton} style={{ opacity: isPending ? 0.7 : 1 }}>
              {isPending ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
