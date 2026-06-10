'use client';

import { useState } from 'react';
import { assignRoleToUser, removeRoleFromUser, updateUserStatus } from '@/app/actions/user-roles';

export default function UserRoleClient({ initialUsers, initialRoles }: any) {
  const [users, setUsers] = useState<any[]>(initialUsers);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAssignRole = async (userId: string, roleId: string) => {
    if (!roleId) return;
    setIsProcessing(true);
    try {
      await assignRoleToUser(userId, roleId);
      // Optimistic update
      const role = initialRoles.find((r: any) => r.id === roleId);
      setUsers(prev => prev.map(u => {
        if (u.id === userId && !u.userRoles.find((ur: any) => ur.roleId === roleId)) {
          return { ...u, userRoles: [...u.userRoles, { roleId, role }] };
        }
        return u;
      }));
    } catch (e) {
      alert("Failed to assign role.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveRole = async (userId: string, roleId: string) => {
    setIsProcessing(true);
    try {
      await removeRoleFromUser(userId, roleId);
      // Optimistic update
      setUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, userRoles: u.userRoles.filter((ur: any) => ur.roleId !== roleId) };
        }
        return u;
      }));
    } catch (e) {
      alert("Failed to remove role.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusChange = async (userId: string, status: string) => {
    setIsProcessing(true);
    try {
      await updateUserStatus(userId, status);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
    } catch (e) {
      alert("Failed to update status.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1 style={{ margin: '0 0 10px 0' }}>User Role Assignment</h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Assign and revoke roles for system users, and manage account status.</p>
      </header>

      <div style={{ backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)', padding: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '15px 10px' }}>User</th>
              <th style={{ padding: '15px 10px' }}>Email</th>
              <th style={{ padding: '15px 10px' }}>Status</th>
              <th style={{ padding: '15px 10px' }}>Assigned Roles</th>
              <th style={{ padding: '15px 10px' }}>Add Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '15px 10px', fontWeight: 'bold' }}>{user.name || 'Unnamed User'}</td>
                <td style={{ padding: '15px 10px', color: 'var(--text-secondary)' }}>{user.email}</td>
                <td style={{ padding: '15px 10px' }}>
                  <select 
                    value={user.status || 'ACTIVE'} 
                    onChange={e => handleStatusChange(user.id, e.target.value)}
                    disabled={isProcessing}
                    style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="LOCKED">Locked</option>
                  </select>
                </td>
                <td style={{ padding: '15px 10px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {user.userRoles.map((ur: any) => (
                      <span key={ur.roleId} style={{ 
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(0, 240, 255, 0.1)', 
                        border: '1px solid var(--accent-glow)', fontSize: '0.85rem' 
                      }}>
                        {ur.role.roleName}
                        <button 
                          onClick={() => handleRemoveRole(user.id, ur.roleId)}
                          disabled={isProcessing}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.2rem', lineHeight: '1' }}
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                    {user.userRoles.length === 0 && <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No roles assigned</span>}
                  </div>
                </td>
                <td style={{ padding: '15px 10px' }}>
                  <select 
                    onChange={e => {
                      handleAssignRole(user.id, e.target.value);
                      e.target.value = '';
                    }}
                    disabled={isProcessing}
                    defaultValue=""
                    style={{ padding: '6px', borderRadius: '4px', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', border: '1px solid var(--glass-border)' }}
                  >
                    <option value="" disabled>+ Assign Role</option>
                    {initialRoles.filter((r: any) => !user.userRoles.find((ur: any) => ur.roleId === r.id)).map((r: any) => (
                      <option key={r.id} value={r.id}>{r.roleName}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
