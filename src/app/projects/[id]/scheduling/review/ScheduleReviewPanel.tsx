'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function ScheduleReviewPanel({ schedule, projectId }: { schedule: any, projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [comments, setComments] = useState('');

  const status = schedule.workflowStatus || schedule.status;

  const handleAction = async (actionUrl: string, bodyData: any = {}) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/scheduling/${schedule.id}/${actionUrl}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ expectedRowVersion: schedule.rowVersion, ...bodyData })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Action failed');
        router.refresh();
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const renderActions = () => {
    switch (status) {
      case 'AI_GENERATED_DRAFT':
      case 'TECHNICAL_REVISIONS_REQUIRED':
      case 'INVALID_GENERATED_DRAFT':
      case 'DRAFT':
        return (
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => handleAction('review/validate')}
              disabled={isPending}
              className="btn btn-primary"
            >
              Validate & Request Review
            </button>
          </div>
        );

      case 'READY_FOR_REVIEW':
        return (
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => handleAction('review/start')}
              disabled={isPending}
              className="btn btn-primary"
            >
              Start Technical Review
            </button>
          </div>
        );

      case 'UNDER_TECHNICAL_REVIEW':
        return (
          <div style={{ marginTop: '15px' }}>
            <textarea 
              value={comments} 
              onChange={e => setComments(e.target.value)} 
              placeholder="Review comments / reasons"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleAction('review/approve', { comments })}
                disabled={isPending || !comments}
                className="btn btn-success"
              >
                Approve Technically
              </button>
              <button 
                onClick={() => handleAction('review/return', { reason: comments })}
                disabled={isPending || !comments}
                className="btn btn-warning"
              >
                Return for Revision
              </button>
              <button 
                onClick={() => handleAction('review/reject', { reason: comments })}
                disabled={isPending || !comments}
                className="btn btn-danger"
              >
                Reject Schedule
              </button>
            </div>
          </div>
        );

      case 'TECHNICALLY_APPROVED':
        return (
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => handleAction('baseline/submit')}
              disabled={isPending}
              className="btn btn-primary"
            >
              Submit for Baseline Approval
            </button>
          </div>
        );

      case 'PENDING_BASELINE_APPROVAL':
        return (
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => handleAction('baseline/activate')}
              disabled={isPending}
              className="btn btn-success"
            >
              Activate Baseline
            </button>
          </div>
        );

      case 'ACTIVE_BASELINE':
        return (
          <div style={{ marginTop: '15px' }}>
            <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '15px' }}>
              This schedule is an active, immutable baseline.
            </div>
            <textarea 
              value={comments} 
              onChange={e => setComments(e.target.value)} 
              placeholder="Reason for new revision"
              style={{ width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid var(--glass-border)' }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                onClick={() => handleAction('revision', { reason: comments })}
                disabled={isPending || !comments}
                className="btn btn-warning"
              >
                Create New Revision
              </button>
            </div>
          </div>
        );

      default:
        return <div>Current status: {status}</div>;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '20px', margin: '20px 0', border: '1px solid var(--glass-border)', borderRadius: '8px' }}>
      <h3 style={{ color: 'var(--accent-color)', marginTop: 0 }}>Workflow Actions</h3>
      <div style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--text-secondary)' }}>
        Row Version: {schedule.rowVersion} | Revision: {schedule.revisionCode || 'N/A'} | Review Round: {schedule.reviewRound}
      </div>
      {renderActions()}
    </div>
  );
}
