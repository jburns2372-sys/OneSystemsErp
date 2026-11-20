'use client';

import React, { useTransition, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { setActiveProjectCookie } from '@/app/actions/activeProject';

export default function ActiveProjectSelector({ 
  assignments, 
  activeProjectId,
  isGlobalProjectReader = false,
}: { 
  assignments: { projectId: string; project: { name: string; contractAmount?: number; originalContractDuration?: number | null }; projectRole: string; accessLevel: string }[];
  activeProjectId: string | null;
  isGlobalProjectReader?: boolean;
}) {
  const router = useRouter();
  const params = useParams();
  const [isPending, startTransition] = useTransition();
  const syncedUrlProjectRef = useRef<string | null>(null);

  const urlProjectId = (params?.id || params?.projectId) as string | undefined;
  const displayProjectId = urlProjectId || activeProjectId;

  useEffect(() => {
    if (urlProjectId && urlProjectId !== activeProjectId && syncedUrlProjectRef.current !== urlProjectId) {
      syncedUrlProjectRef.current = urlProjectId;
      // Persist the active project cookie and refresh Topbar once so RLS-scoped
      // project metadata loads truthfully for the current URL project.
      void setActiveProjectCookie(urlProjectId).then(() => {
        router.refresh();
      });
    }
  }, [urlProjectId, activeProjectId, router]);

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
    });
  };

  if (assignments.length === 0) {
    // When no active project cookie is bound yet (e.g. on /projects under per-project RLS),
    // guide the user to choose a project rather than falsely claiming no projects exist.
    if (!displayProjectId) {
      return (
        <Link
          href="/projects"
          style={{
            padding: '6px 12px',
            fontSize: '0.8rem',
            color: '#cbd5e1',
            border: '1px solid rgba(148, 163, 184, 0.3)',
            borderRadius: '6px',
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          {isGlobalProjectReader ? 'Select a Project' : 'Open Projects'}
        </Link>
      );
    }
    return (
      <div
        role="status"
        style={{
          padding: '6px 12px',
          fontSize: '0.8rem',
          color: isGlobalProjectReader ? '#cbd5e1' : '#fcd34d',
          border: isGlobalProjectReader
            ? '1px solid rgba(148, 163, 184, 0.3)'
            : '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '6px',
          backgroundColor: isGlobalProjectReader
            ? 'rgba(15, 23, 42, 0.55)'
            : 'rgba(245, 158, 11, 0.1)',
        }}
      >
        {isGlobalProjectReader ? 'Loading project context…' : 'No assigned projects'}
      </div>
    );
  }

  const currentAssignment = assignments.find(a => a.projectId === displayProjectId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      <label
        htmlFor="active-project-selector"
        style={{ fontSize: '0.7rem', color: 'var(--accent-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}
      >
        Active Project
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <select
          id="active-project-selector"
          value={displayProjectId || ''}
          onChange={handleProjectChange}
          disabled={isPending}
          style={{
            padding: '6px 10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            fontWeight: 600,
            outline: 'none',
            cursor: isPending ? 'wait' : 'pointer',
            opacity: isPending ? 0.5 : 1,
            minWidth: '190px',
            maxWidth: '250px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.25 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Access: {currentAssignment.accessLevel.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--accent-color)', fontWeight: 600 }}>
                Contract: ₱{(currentAssignment.project.contractAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
