'use client';

import { useState } from 'react';
import { changePersonalPassword } from '@/app/actions/user';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await changePersonalPassword(currentPassword, newPassword, confirmPassword);
      if (res?.error) {
        setError(res.error);
        setLoading(false);
      }
    } catch (err: any) {
      if (err?.message === 'NEXT_REDIRECT' || String(err?.digest || '').startsWith('NEXT_REDIRECT')) {
        throw err;
      }
      setError(err?.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ backgroundColor: '#1e293b', padding: '40px', borderRadius: '12px', width: '100%', maxWidth: '420px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: '#f8fafc', margin: '0 0 8px 0', fontSize: '22px' }}>Password Update Required</h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>
            Please enter your current password and choose a new password (minimum 12 characters) to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '10px', borderRadius: '6px', fontSize: '14px', border: '1px solid rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '14px' }}>Current Password</label>
            <input
              id="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
            />
          </div>

          <div>
            <label htmlFor="newPassword" style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '14px' }}>New Password</label>
            <input
              id="newPassword"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '14px' }}>Confirm New Password</label>
            <input
              id="confirmPassword"
              type="password"
              required
              minLength={12}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px', width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
              backgroundColor: '#00ffa3', color: '#000', fontWeight: 'bold', fontSize: '15px',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Updating Password...' : 'Update Password & Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

