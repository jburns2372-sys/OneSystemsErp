'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUser } from '@/app/actions/user';
import Link from 'next/link';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
}

export default function EditUserClient({ user, roles = [] }: { user: UserData, roles?: string[] }) {
  const router = useRouter();

  // Normalize matching to handle underscores vs spaces (e.g. FINANCE_OFFICER vs FINANCE OFFICER)
  const normalizedUserRole = user.role.replace(/_/g, ' ').toUpperCase().trim();
  const matchedRole = roles.find(r => r.replace(/_/g, ' ').toUpperCase().trim() === normalizedUserRole) || 
                      (roles.includes(user.role) ? user.role : 'OTHER');

  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: matchedRole,
    password: ''
  });
  const [customRole, setCustomRole] = useState(matchedRole === 'OTHER' ? user.role : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const finalRole = formData.role === 'OTHER' ? customRole.trim().toUpperCase().replace(/ /g, '_') : formData.role;
    if (formData.role === 'OTHER' && !finalRole) {
      setError('Please specify a custom role.');
      setIsLoading(false);
      return;
    }

    try {
      await updateUser(user.id, { ...formData, role: finalRole });
      alert('User successfully updated!');
      router.push('/users');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating the user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{
      backgroundColor: 'var(--glass-panel)',
      padding: '30px',
      borderRadius: '12px',
      border: '1px solid var(--glass-border)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      backdropFilter: 'blur(10px)'
    }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px' }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Full Name *</label>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>Email Address *</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '500' }}>System Role *</label>
            <select 
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {roles.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
              <option value="OTHER" style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>+ Add New Role...</option>
            </select>
            {formData.role === 'OTHER' && (
              <input 
                type="text" 
                required 
                placeholder="Type new role (e.g. SAFETY_OFFICER)" 
                value={customRole} 
                onChange={e => setCustomRole(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent-glow)', backgroundColor: 'rgba(0,240,255,0.05)', color: 'var(--text-primary)', marginTop: '8px' }}
              />
            )}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: '500' }}>Override Password (Optional)</label>
            <input 
              type="text" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Leave blank to keep current password"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--accent-glow)', backgroundColor: 'rgba(0,240,255,0.05)', color: 'var(--text-primary)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          <Link 
            href="/users"
            style={{ padding: '10px 20px', borderRadius: '6px', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', textDecoration: 'none', transition: 'all 0.2s' }}
          >
            Cancel
          </Link>
          <button 
            type="submit" 
            disabled={isLoading}
            style={{ 
              padding: '10px 25px', 
              borderRadius: '6px', 
              backgroundColor: 'var(--accent-color)', 
              color: '#000', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
