'use client';

import React, { useState } from 'react';
import { addProjectAssignment, updateProjectAssignment, deleteProjectAssignment } from '@/app/actions/projectUserAssignment';

export default function ProjectAccessClient({ 
  userId, 
  assignments, 
  availableProjects 
}: { 
  userId: string;
  assignments: any[];
  availableProjects: any[];
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    projectId: '',
    projectRole: 'PROJECT_ENGINEER',
    accessLevel: 'standard_project_access',
    remarks: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await addProjectAssignment({
      userId,
      projectId: formData.projectId,
      projectRole: formData.projectRole,
      accessLevel: formData.accessLevel,
      remarks: formData.remarks
    });
    if (!res.success) {
      setError(res.error || 'Failed to add project assignment.');
    } else {
      setIsAdding(false);
      setFormData({ ...formData, projectId: '', remarks: '' });
    }
    setLoading(false);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (confirm(`Change status to ${newStatus}?`)) {
      await updateProjectAssignment(id, { assignmentStatus: newStatus });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to completely remove this project assignment?')) {
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
        <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>Assigned Projects</h3>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
          >
            + Assign to Project
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px', marginBottom: '20px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '6px' }}>
          {error}
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 200px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project *</label>
              <select required value={formData.projectId} onChange={e => setFormData({ ...formData, projectId: e.target.value })} style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--glass-border)' }}>
                <option value="">-- Select Project --</option>
                {availableProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Project Role *</label>
              <input required type="text" value={formData.projectRole} onChange={e => setFormData({ ...formData, projectRole: e.target.value })} placeholder="e.g. PROJECT_MANAGER" style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--glass-border)' }} />
            </div>
            <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Access Level *</label>
              <select required value={formData.accessLevel} onChange={e => setFormData({ ...formData, accessLevel: e.target.value })} style={{ padding: '8px', borderRadius: '4px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid var(--glass-border)' }}>
                <option value="full_project_access">Full Project Access</option>
                <option value="standard_project_access">Standard Access</option>
                <option value="limited_project_access">Limited Access</option>
                <option value="view_only">View Only</option>
                <option value="approval_only">Approval Only</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
            <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '6px 12px', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{loading ? 'Saving...' : 'Save Assignment'}</button>
          </div>
        </form>
      )}

      {assignments.length === 0 ? (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>This user is not assigned to any projects.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 5px' }}>Project Name</th>
              <th style={{ padding: '10px 5px' }}>Project Role</th>
              <th style={{ padding: '10px 5px' }}>Access Level</th>
              <th style={{ padding: '10px 5px' }}>Status</th>
              <th style={{ padding: '10px 5px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '12px 5px', color: 'var(--text-primary)' }}>{a.project.name}</td>
                <td style={{ padding: '12px 5px', color: 'var(--text-primary)' }}>{a.projectRole}</td>
                <td style={{ padding: '12px 5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{a.accessLevel.replace(/_/g, ' ').toUpperCase()}</td>
                <td style={{ padding: '12px 5px' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '4px', 
                    fontSize: '0.8rem',
                    backgroundColor: a.assignmentStatus === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: a.assignmentStatus === 'active' ? '#4ade80' : '#f87171'
                  }}>
                    {a.assignmentStatus.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 5px', textAlign: 'right' }}>
                  {a.assignmentStatus === 'active' ? (
                    <button onClick={() => handleStatusChange(a.id, 'suspended')} style={{ background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', padding: '4px 8px', borderRadius: '4px', marginRight: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Suspend</button>
                  ) : (
                    <button onClick={() => handleStatusChange(a.id, 'active')} style={{ background: 'transparent', border: '1px solid #4ade80', color: '#4ade80', padding: '4px 8px', borderRadius: '4px', marginRight: '5px', cursor: 'pointer', fontSize: '0.8rem' }}>Activate</button>
                  )}
                  <button onClick={() => handleDelete(a.id)} style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
