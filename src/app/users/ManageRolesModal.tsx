'use client';

import { useState, useTransition, useEffect } from 'react';
import { updateSystemRole, deleteSystemRole, createSystemRole } from '@/app/actions/user';
import styles from './page.module.css';

export default function ManageRolesModal({ onClose, roles, rbacRoles = [], modules = [], permissions = [] }: { onClose: () => void, roles: string[], rbacRoles?: any[], modules?: any[], permissions?: any[] }) {
  const [isPending, startTransition] = useTransition();
  const [selectedRole, setSelectedRole] = useState<string | null>(roles[0] || null);
  const [isEditingName, setIsEditingName] = useState(false);
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

  useEffect(() => {
    if (!selectedRole && roles.length > 0) {
      setSelectedRole(roles[0]);
    }
  }, [roles, selectedRole]);

  useEffect(() => {
    setAiSummary(null);
    setIsEditingName(false);
  }, [selectedRole]);

  const handleEditNameStart = () => {
    if (selectedRole) {
      setEditValue(selectedRole);
      setIsEditingName(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedRole) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await updateSystemRole(selectedRole, editValue);
        if (res && !res.success) {
          setError(res.error || 'Failed to update role');
          return;
        }
        setSelectedRole(editValue);
        setIsEditingName(false);
      } catch (err: any) {
        setError(err.message || 'Failed to update role');
      }
    });
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    if (!confirm(`Are you sure you want to delete the role "${selectedRole}"?\n\nIf any users are currently assigned to this role, it will show as a Custom Role for them.`)) return;
    setError('');
    startTransition(async () => {
      try {
        const res = await deleteSystemRole(selectedRole);
        if (res && !res.success) {
          setError(res.error || 'Failed to delete role');
          return;
        }
        setSelectedRole(roles.find(r => r !== selectedRole) || null);
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
        if (added && typeof added === 'object' && !(added as any).success) {
          setError((added as any).error || 'Failed to create role');
          return;
        }
        setNewRoleName('');
        setSelectedRole(typeof added === 'string' ? added : (added as any).name || newRoleName);
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
        border: '1px solid var(--glass-border)', width: '95vw', maxWidth: '1400px',
        height: '90vh', display: 'flex', flexDirection: 'column', transition: 'max-width 0.3s ease'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Role Permission Matrix</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Configure system access rights for each role.
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '2rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '15px' }}>{error}</div>}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '300px' }}>
            <label style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>Select Role:</label>
            <select 
              value={selectedRole || ''} 
              onChange={e => setSelectedRole(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              {roles.map(r => (
                <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isEditingName ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  value={editValue} 
                  onChange={e => setEditValue(e.target.value)}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid var(--accent-glow)', backgroundColor: 'rgba(0,240,255,0.05)', color: 'var(--text-primary)' }}
                  autoFocus
                />
                <button onClick={handleSaveEdit} disabled={isPending} style={{ padding: '6px 12px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
                <button onClick={() => setIsEditingName(false)} disabled={isPending} style={{ padding: '6px 12px', backgroundColor: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--glass-border)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleEditNameStart} disabled={!selectedRole || isPending} style={{ padding: '8px 15px', backgroundColor: 'transparent', color: 'var(--accent-color)', border: '1px solid var(--accent-color)', borderRadius: '8px', cursor: 'pointer' }}>Rename Role</button>
                <button onClick={handleDelete} disabled={!selectedRole || isPending} style={{ padding: '8px 15px', backgroundColor: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '8px', cursor: 'pointer' }}>Delete Role</button>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginLeft: 'auto' }}>
            <input 
              type="text" 
              placeholder="New Role Name"
              value={newRoleName}
              onChange={e => setNewRoleName(e.target.value)}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              onKeyDown={e => e.key === 'Enter' && handleAddRole()}
            />
            <button 
              onClick={handleAddRole} 
              disabled={isPending || !newRoleName.trim()}
              style={{ padding: '10px 20px', backgroundColor: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', cursor: (isPending || !newRoleName.trim()) ? 'not-allowed' : 'pointer', opacity: (isPending || !newRoleName.trim()) ? 0.5 : 1 }}
            >
              Add Role
            </button>
          </div>
        </div>

        {selectedRole && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, color: 'var(--accent-color)' }}>Permissions for {selectedRole.replace(/_/g, ' ')}</h3>
              <button 
                onClick={() => handleGenerateSummary(selectedRole)}
                disabled={isGeneratingSummary}
                style={{ 
                  padding: '8px 15px', backgroundColor: 'rgba(0,240,255,0.1)', color: 'var(--accent-color)', border: '1px solid var(--accent-glow)', borderRadius: '8px', cursor: isGeneratingSummary ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                }}
              >
                {isGeneratingSummary ? 'Generating...' : '✨ Generate AI Summary'}
              </button>
            </div>

            {aiSummary && (
              <div style={{ margin: '0 0 15px 0', padding: '15px', backgroundColor: 'rgba(0,240,255,0.05)', border: '1px solid var(--accent-glow)', borderRadius: '8px', fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                <strong style={{ display: 'block', marginBottom: '5px', color: 'var(--accent-color)' }}>✨ AI Access Summary:</strong>
                {aiSummary}
              </div>
            )}

            <div style={{ flex: 1, overflow: 'auto', backgroundColor: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1500px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ padding: '15px', position: 'sticky', left: 0, top: 0, backgroundColor: '#0f172a', zIndex: 2, borderRight: '1px solid var(--glass-border)', borderBottom: '1px solid var(--glass-border)' }}>Module</th>
                    {PERMISSION_FIELDS.map(f => (
                      <th key={f.key} style={{ padding: '10px 15px', fontSize: '0.85rem', textAlign: 'center', whiteSpace: 'nowrap', position: 'sticky', top: 0, backgroundColor: '#0f172a', zIndex: 1, borderBottom: '1px solid var(--glass-border)' }}>
                        <div>
                          {f.label}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {modules.map((module: any) => {
                    const normalizedName = selectedRole.replace(/_/g, ' ').toUpperCase().trim();
                    const rbacRole = rbacRoles.find(r => r.roleName.toUpperCase().trim() === normalizedName || r.roleCode === selectedRole);
                    const roleId = rbacRole?.id;
                    const currentPerm = localPermissions.find(p => p.roleId === roleId && p.moduleId === module.id) || {};
                    
                    return (
                      <tr key={module.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '15px', position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', fontWeight: 'bold', borderRight: '1px solid var(--glass-border)', zIndex: 1 }}>
                          {module.description || module.moduleName}
                        </td>
                        {PERMISSION_FIELDS.map(f => (
                          <td key={f.key} style={{ padding: '10px', textAlign: 'center' }}>
                            <input 
                              type="checkbox" 
                              checked={!!currentPerm[f.key]}
                              onChange={() => handleTogglePermission(selectedRole, module.id, f.key, !!currentPerm[f.key])}
                              disabled={isSavingPermission || !rbacRole}
                              style={{ cursor: (isSavingPermission || !rbacRole) ? 'not-allowed' : 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
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
        )}
      </div>
    </div>
  );
}
