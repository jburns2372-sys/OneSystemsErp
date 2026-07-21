'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { setActiveProjectCookie } from '@/app/actions/activeProject';

export default function ActiveProjectSelector({ 
  assignments, 
  activeProjectId 
}: { 
  assignments: { projectId: string; project: { name: string; contractAmount?: number; originalContractDuration?: number | null }; projectRole: string; accessLevel: string }[];
  activeProjectId: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleProjectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    
    // We can show a warning here if there is unsaved work, but for now we proceed
    startTransition(async () => {
      await setActiveProjectCookie(newProjectId || null);
      
      if (newProjectId) {
        router.push(`/projects/${newProjectId}`);
      } else {
        router.push('/');
      }
      
      // Refresh the route to trigger server components to read the new cookie
      router.refresh();
    });
  };

  if (assignments.length === 0) {
    return (
      <div style={{ padding: '6px 12px', fontSize: '0.8rem', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
        No Project Assignments
      </div>
    );
  }

  const currentAssignment = assignments.find(a => a.projectId === activeProjectId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '20px' }}>
      <label style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 'bold', textTransform: 'uppercase' }}>
        Active Project Workspace
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <select
          value={activeProjectId || ''}
          onChange={handleProjectChange}
          disabled={isPending}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            fontWeight: 'bold',
            outline: 'none',
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.5 : 1,
            width: '250px'
          }}
        >
          <option value="">-- Select Active Project --</option>
          {assignments.map(a => (
            <option key={a.projectId} value={a.projectId}>
              {a.project.name}
            </option>
          ))}
        </select>
        
        {currentAssignment && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Role: {currentAssignment.projectRole.replace(/_/g, ' ')}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Access: {currentAssignment.accessLevel.replace(/_/g, ' ').toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2, borderLeft: '1px solid var(--glass-border)', paddingLeft: '15px' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                Cost: ₱{(currentAssignment.project.contractAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>
                Duration: {currentAssignment.project.originalContractDuration || 0} Days
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
