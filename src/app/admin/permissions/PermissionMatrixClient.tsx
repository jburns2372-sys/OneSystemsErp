'use client';

import { useState } from 'react';
import { saveRolePermission } from '@/app/actions/permissions';

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

export default function PermissionMatrixClient({ initialRoles, initialModules, initialPermissions }: any) {
  const [selectedRole, setSelectedRole] = useState(initialRoles[0]?.id || '');
  const [permissions, setPermissions] = useState<any[]>(initialPermissions);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (moduleId: string, field: string, currentValue: boolean) => {
    if (!selectedRole) return;
    setIsSaving(true);
    try {
      const newValue = !currentValue;
      await saveRolePermission(selectedRole, moduleId, field, newValue);
      
      // Optimistic update
      setPermissions(prev => {
        const exists = prev.find(p => p.roleId === selectedRole && p.moduleId === moduleId);
        if (exists) {
          return prev.map(p => p.roleId === selectedRole && p.moduleId === moduleId ? { ...p, [field]: newValue } : p);
        } else {
          return [...prev, { roleId: selectedRole, moduleId, [field]: newValue }];
        }
      });
    } catch (e) {
      console.error(e);
      alert("Failed to save permission.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', color: 'var(--text-primary)' }}>
      <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0' }}>Role Permission Matrix</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Configure granular access control per role and module.</p>
        </div>
        
        <div>
          <label style={{ marginRight: '10px', fontWeight: 'bold' }}>Select Role to Configure:</label>
          <select 
            value={selectedRole} 
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{ 
              padding: '10px', borderRadius: '8px', backgroundColor: 'var(--bg-dark)', 
              color: 'var(--text-primary)', border: '1px solid var(--glass-border)' 
            }}
          >
            {initialRoles.map((r: any) => (
              <option key={r.id} value={r.id}>{r.roleName}</option>
            ))}
          </select>
        </div>
      </header>

      <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1500px' }}>
          <thead>
            <tr style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '15px', position: 'sticky', left: 0, backgroundColor: 'var(--bg-dark)', zIndex: 1, borderRight: '1px solid var(--glass-border)' }}>Module</th>
              {PERMISSION_FIELDS.map(f => (
                <th key={f.key} style={{ padding: '10px', fontSize: '0.85rem', textAlign: 'center' }}>
                  <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: '120px', margin: '0 auto' }}>
                    {f.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initialModules.map((module: any) => {
              const currentPerm = permissions.find(p => p.roleId === selectedRole && p.moduleId === module.id) || {};
              
              return (
                <tr key={module.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px', position: 'sticky', left: 0, backgroundColor: 'var(--bg-secondary)', fontWeight: 'bold', borderRight: '1px solid var(--glass-border)' }}>
                    {module.description || module.moduleName}
                  </td>
                  {PERMISSION_FIELDS.map(f => (
                    <td key={f.key} style={{ padding: '10px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={!!currentPerm[f.key]}
                        onChange={() => handleToggle(module.id, f.key, !!currentPerm[f.key])}
                        disabled={isSaving}
                        style={{ cursor: isSaving ? 'wait' : 'pointer', width: '18px', height: '18px', accentColor: 'var(--accent-color)' }}
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
  );
}
