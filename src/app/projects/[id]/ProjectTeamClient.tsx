'use client';

import React, { useState } from 'react';
import { updateProjectAssignment, deleteProjectAssignment } from '@/app/actions/projectUserAssignment';

export default function ProjectTeamClient({ 
  projectId, 
  teamMembers 
}: { 
  projectId: string;
  teamMembers: any[];
}) {
  const handleStatusChange = async (id: string, newStatus: string) => {
    if (confirm(`Change status to ${newStatus}?`)) {
      await updateProjectAssignment(id, { assignmentStatus: newStatus });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to completely remove this user from the project?')) {
      await deleteProjectAssignment(id);
    }
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>Project Team Access</h2>
      </div>

      {teamMembers.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No users are assigned to this project yet.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 5px' }}>Name</th>
              <th style={{ padding: '10px 5px' }}>Email</th>
              <th style={{ padding: '10px 5px' }}>System Role</th>
              <th style={{ padding: '10px 5px' }}>Project Role</th>
              <th style={{ padding: '10px 5px' }}>Access Level</th>
              <th style={{ padding: '10px 5px' }}>Status</th>
              <th style={{ padding: '10px 5px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {teamMembers.map(member => (
              <tr key={member.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 5px', color: 'var(--text-primary)', fontWeight: 'bold' }}>{member.user.name || 'Unknown'}</td>
                <td style={{ padding: '12px 5px', color: 'var(--text-secondary)' }}>{member.user.email}</td>
                <td style={{ padding: '12px 5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{member.user.role.replace(/_/g, ' ')}</td>
                <td style={{ padding: '12px 5px', color: 'var(--text-primary)' }}>{member.projectRole}</td>
                <td style={{ padding: '12px 5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{member.accessLevel.replace(/_/g, ' ').toUpperCase()}</td>
                <td style={{ padding: '12px 5px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    backgroundColor: member.assignmentStatus === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: member.assignmentStatus === 'active' ? '#4ade80' : '#f87171'
                  }}>
                    {member.assignmentStatus.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 5px', textAlign: 'right' }}>
                  {member.assignmentStatus === 'active' ? (
                    <button onClick={() => handleStatusChange(member.id, 'suspended')} style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', marginRight: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Suspend</button>
                  ) : (
                    <button onClick={() => handleStatusChange(member.id, 'active')} style={{ background: 'transparent', border: '1px solid #4ade80', color: '#4ade80', padding: '4px 8px', borderRadius: '4px', marginRight: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Activate</button>
                  )}
                  <button onClick={() => handleDelete(member.id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
