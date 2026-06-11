'use client';

import { useState, useTransition } from 'react';
import { updateSystemRole, deleteSystemRole, createSystemRole } from '@/app/actions/user';
import styles from './page.module.css';

export default function ManageRolesModal({ onClose, roles, rbacRoles = [], modules = [], permissions = [] }: { onClose: () => void, roles: string[], rbacRoles?: any[], modules?: any[], permissions?: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [error, setError] = useState('');
  const [localPermissions, setLocalPermissions] = useState<any[]>(permissions || []);
  const [isSavingPermission, setIsSavingPermission] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const PERMISSION_FIELDS = [
    { key: 'canView', label: 'View' },
    { key: 'canCreate', label: 'Create' },
    { key: 'canEditDraft', label: 'Edit Draft' },
    { key: 'canSubmit', label: 'Submit' },
    { key: 'canReview', label: 'Review' },
    { key: 'canRecommend', label: 'Recommend' },
    { key: 'canApprove', label: 'Approve' },
    { key: 'canReject', label: 'Reject' },
    { key: 'canReturnForCorrection', label: 'Return' },
    { key: 'canCancel', label: 'Cancel' },
    { key: 'canRevise', label: 'Revise' },
    { key: 'canLock', label: 'Lock' },
    { key: 'canUnlockWithAuthorization', label: 'Unlock' },
    { key: 'canReleasePayment', label: 'Release Payment' },
    { key: 'canMarkAsPaid', label: 'Mark Paid' },
    { key: 'canUploadAttachment', label: 'Upload' },
    { key: 'canDownloadAttachment', label: 'Download' },
    { key: 'canPrint', label: 'Print' },
    { key: 'canExport', label: 'Export' },
    { key: 'canDeleteDraft', label: 'Delete Draft' },
    { key: 'canVoidRecord', label: 'Void' },
    { key: 'canViewAuditLogs', label: 'Audit Logs' }
  ];

  const handleEdit = (role: string) => {
    setEditingRole(role);
    setEditValue(role);
    setError('');
    setAiSummary(null); // Clear summary when switching roles
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

  const handleAddRole = async () => {
    if (!newRoleName.trim()) return;
    setError('');
    startTransition(async () => {
      try {
        const added = await createSystemRole(newRoleName);
        setNewRoleName('');
        // Automatically start editing the new role
        handleEdit(added);
      } catch (err: any) {
        setError(err.message || 'Failed to create role');
      }
    });
  };

  const handleTogglePermission = async (roleName: string, moduleId: string, field: string, currentValue: boolean) => {
    const normalizedName = roleName.replace(/_/g, ' ').toUpperCase().trim();
    const rbacRole = rbacRoles.find(r => r.roleName.toUpperCase().trim() === normalizedName || r.roleCode === roleName);
    
    if (!rbacRole) {
      alert("This role does not exist in the RBAC permissions table yet. Please contact support to migrate this legacy role.");
      return;
    }

    setIsSavingPermission(true);
    try {
      const newValue = !currentValue;
      // We need to import saveRolePermission dynamically or use fetch to our API if it's not imported
      const { saveRolePermission } = await import('@/app/actions/permissions');
      await saveRolePermission(rbacRole.id, moduleId, field, newValue);
      
      setLocalPermissions(prev => {
        const exists = prev.find(p => p.roleId === rbacRole.id && p.moduleId === moduleId);
        if (exists) {
          return prev.map(p => p.roleId === rbacRole.id && p.moduleId === moduleId ? { ...p, [field]: newValue } : p);
        } else {
          return [...prev, { roleId: rbacRole.id, moduleId, [field]: newValue }];
        }
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save permission.");
    } finally {
      setIsSavingPermission(false);
    }
  };

  const handleGenerateSummary = async (roleName: string) => {
    const normalizedName = roleName.replace(/_/g, ' ').toUpperCase().trim();
    const rbacRole = rbacRoles.find(r => r.roleName.toUpperCase().trim() === normalizedName || r.roleCode === roleName);
    
    if (!rbacRole) {
      alert("This role must be fully synchronized before generating an AI summary.");
      return;
    }

    setIsGeneratingSummary(true);
    setAiSummary(null);
    try {
      const { summarizeRolePermissions } = await import('@/app/actions/permissions');
      // Filter the local state for current permissions for this role
      const currentRolePerms = localPermissions.filter(p => p.roleId === rbacRole.id);
      
      const result = await summarizeRolePermissions(roleName, currentRolePerms);
      if (result.success && result.summary) {
        setAiSummary(result.summary);
      } else {
        alert(result.error || "Failed to generate summary.");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while communicating with the AI.");
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'var(--bg-secondary)', padding: '30px', borderRadius: '16px',
        border: '1px solid var(--glass-border)', width: '100%', maxWidth: editingRole ? '95vw' : '500px',
        maxHeight: '90vh', display: 'flex', flexDirection: 'column', transition: 'max-width 0.3s ease'
      }}>
        <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Manage System Roles</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>
          Edit or permanently delete custom roles from the system.
        </p>

        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</div>}

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <input 
            type="text" 
            placeholder="New Role Name (e.g. AUDITOR)"
            value={newRoleName}
            onChange={e => setNewRoleName(e.target.value)}
            style={{ flex: 1, padding: '10px 15px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)' }}
            onKeyDown={e => e.key === 'Enter' && handleAddRole()}
          />
          <button 
            onClick={handleAddRole} 
            disabled={isPending || !newRoleName.trim()}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: 'var(--accent-color)', 
              color: '#000', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: (isPending || !newRoleName.trim()) ? 'not-allowed' : 'pointer', 
              fontWeight: '500',
              opacity: (isPending || !newRoleName.trim()) ? 0.5 : 1
            }}
          >
            Add Role
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--glass-border)', borderRadius: '8px', backgroundColor: 'var(--bg-dark)' }}>
          {roles.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No roles found.</div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {roles.filter(role => !editingRole || role === editingRole).map(role => (
                <li key={role} style={{ 
                  display: 'flex', flexDirection: editingRole === role ? 'column' : 'row', justifyContent: 'space-between', alignItems: editingRole === role ? 'stretch' : 'center', 
                  padding: '12px 15px', borderBottom: '1px solid var(--glass-border)' 
                }}>
                  {editingRole === role ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <input 
                          type="text" 
                          value={editValue} 
                          onChange={e => setEditValue(e.target.value)}
                          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--accent-glow)', backgroundColor: 'rgba(0,240,255,0.05)', color: 'var(--text-primary)' }}
                          autoFocus
                        />
                        <button onClick={handleSaveEdit} disabled={isPending} style={{ padding: '6px 12px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                          Save Name
                        </button>
                        <button onClick={() => setEditingRole(null)} disabled={isPending} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>
                          Done
                        </button>
                      </div>

                      {/* Permission Matrix for this Role */}
                      <div style={{ overflow: 'auto', maxHeight: '50vh', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--glass-border)', marginTop: '10px' }}>
                        <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, color: 'var(--accent-color)' }}>Role Permissions</h4>
                          <button 
                            onClick={() => handleGenerateSummary(role)}
                            disabled={isGeneratingSummary}
                            style={{ 
                              padding: '6px 12px', 
                              backgroundColor: 'rgba(0,240,255,0.1)', 
                              color: 'var(--accent-color)', 
                              border: '1px solid var(--accent-glow)', 
                              borderRadius: '4px', 
                              cursor: isGeneratingSummary ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '0.85rem'
                            }}
                          >
                            {isGeneratingSummary ? 'Generating...' : '✨ Generate AI Summary'}
                          </button>
                        </div>

                        {aiSummary && (
                          <div style={{ margin: '0 10px 15px 10px', padding: '15px', backgroundColor: 'rgba(0,240,255,0.05)', border: '1px solid var(--accent-glow)', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                            <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--accent-color)' }}>✨ AI Access Summary:</strong>
                            {aiSummary}
                          </div>
                        )}

                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1200px' }}>
                          <thead>
                            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                              <th style={{ padding: '10px', position: 'sticky', left: 0, top: 0, backgroundColor: '#0f172a', zIndex: 2, borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>Module</th>
                              {PERMISSION_FIELDS.map(f => (
                                <th key={f.key} style={{ padding: '10px 5px', fontSize: '0.8rem', textAlign: 'center', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, borderBottom: '1px solid var(--glass-border)' }}>
                                  {f.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {modules.map((module: any) => {
                              const normalizedName = role.replace(/_/g, ' ').toUpperCase().trim();
                              const rbacRole = rbacRoles.find(r => r.roleName.toUpperCase().trim() === normalizedName || r.roleCode === role);
                              const roleId = rbacRole?.id;
                              const currentPerm = localPermissions.find(p => p.roleId === roleId && p.moduleId === module.id) || {};
                              
                              return (
                                <tr key={module.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                                  <td style={{ padding: '10px', position: 'sticky', left: 0, backgroundColor: '#0f172a', fontSize: '0.9rem', borderRight: '1px solid var(--glass-border)', zIndex: 1 }}>
                                    {module.moduleName}
                                  </td>
                                  {PERMISSION_FIELDS.map(f => (
                                    <td key={f.key} style={{ padding: '5px', textAlign: 'center' }}>
                                      <input 
                                        type="checkbox" 
                                        checked={!!currentPerm[f.key]}
                                        onChange={() => handleTogglePermission(role, module.id, f.key, !!currentPerm[f.key])}
                                        disabled={isSavingPermission || !rbacRole}
                                        style={{ cursor: (isSavingPermission || !rbacRole) ? 'not-allowed' : 'pointer', accentColor: 'var(--accent-color)' }}
                                        title={!rbacRole ? "Legacy role without RBAC link" : ""}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
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
