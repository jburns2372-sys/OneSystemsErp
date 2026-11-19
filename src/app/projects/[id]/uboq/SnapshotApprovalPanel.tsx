'use client';

import React, { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { approveUboqSnapshotAction, syncUboqScheduleLinksAction } from '@/app/actions/uboq';
import { formatCurrencyPhp, formatFriendlyUboqError } from '@/lib/uboq/ux-helpers';

export interface SnapshotSummaryItem {
  readonly id: string;
  readonly versionNumber: number;
  readonly versionLabel: string;
  readonly status: string;
  readonly preparedById: string | null;
  readonly approvedAt: string | null;
  readonly createdAt: string;
  readonly sourceFileName: string | null;
  readonly lineCount: number;
  readonly estimatedTotalAmount: number | null;
}

interface Props {
  projectId: string;
  projectName: string;
  projectRef: string;
  currentUserId: string;
  actorEmail: string;
  actorRoleLabel: string;
  canApprove: boolean;
  canSyncSchedule: boolean;
  isSimulatingRole: boolean;
  totalCandidates: number;
  acceptedCandidates: number;
  pendingCandidates: number;
  blockingOpenExceptions: number;
  latestDraft: SnapshotSummaryItem | null;
  latestApproved: SnapshotSummaryItem | null;
  eligibleScheduleId: string | null;
  eligibleScheduleName: string | null;
}

export default function SnapshotApprovalPanel({
  projectId,
  projectName,
  projectRef,
  currentUserId,
  actorEmail,
  actorRoleLabel,
  canApprove,
  canSyncSchedule,
  isSimulatingRole,
  totalCandidates,
  acceptedCandidates,
  pendingCandidates,
  blockingOpenExceptions,
  latestDraft,
  latestApproved,
  eligibleScheduleId,
  eligibleScheduleName,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmedChecked, setConfirmedChecked] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    if (!confirmOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) {
        setConfirmOpen(false);
        setConfirmedChecked(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmOpen, isPending]);

  const isSelfPreparer = Boolean(latestDraft && latestDraft.preparedById === currentUserId);
  const draftReady = Boolean(latestDraft && pendingCandidates === 0 && blockingOpenExceptions === 0);
  const canExecuteApprovalNow = Boolean(
    canApprove && !isSimulatingRole && !isSelfPreparer && draftReady && latestDraft
  );

  let approvalBlockedReason: string | null = null;
  if (!latestDraft) {
    approvalBlockedReason = latestApproved
      ? 'The latest BOQ version is already approved. Upload a new BOQ revision to start another draft.'
      : 'Save a Draft BOQ after reviewing items before submitting for approval.';
  } else if (pendingCandidates > 0) {
    approvalBlockedReason = `${pendingCandidates} BOQ item(s) still need review before this Draft can be approved.`;
  } else if (blockingOpenExceptions > 0) {
    approvalBlockedReason = `${blockingOpenExceptions} blocking issue(s) must be resolved before approval.`;
  } else if (isSimulatingRole) {
    approvalBlockedReason = 'Exit Role Preview in the top bar before approving. Approvals require your real signed-in account.';
  } else if (!canApprove) {
    approvalBlockedReason = 'Your Draft is ready for sign-off. An authorized approver (Project Manager, Project Director, or Finance Manager) can approve it.';
  } else if (isSelfPreparer) {
    approvalBlockedReason = 'Maker-checker control: Because you prepared this Draft, a different authorized approver must sign off on it.';
  }

  function handleConfirmApprove() {
    if (!latestDraft || !confirmedChecked || !canExecuteApprovalNow) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await approveUboqSnapshotAction(projectId, latestDraft.id);
        setConfirmOpen(false);
        setConfirmedChecked(false);
        const synced = Boolean((res as { scheduleLinkSync?: { synced?: boolean } })?.scheduleLinkSync?.synced);
        setFeedback({
          kind: 'ok',
          text: synced
            ? `BOQ ${latestDraft.versionLabel} is now Approved and linked to your project schedule.`
            : `BOQ ${latestDraft.versionLabel} is now Approved as the official project baseline. Continue to Scheduling to link activities.`,
        });
        router.refresh();
      } catch (err) {
        console.error('[UBOQ_APPROVAL_ACTION_ERROR]', err);
        setFeedback({ kind: 'err', text: formatFriendlyUboqError(err) });
      }
    });
  }

  function handleSyncScheduleLinks() {
    if (!eligibleScheduleId) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await syncUboqScheduleLinksAction({
          projectId,
          scheduleId: eligibleScheduleId,
        });
        const linkedCount = (res as { linkedCount?: number })?.linkedCount ?? 0;
        setFeedback({
          kind: 'ok',
          text:
            linkedCount > 0
              ? `Synced ${linkedCount} BOQ-to-Schedule activity link(s). Your T7 Schedule & EVM report is ready to export.`
              : 'Schedule sync completed. Allocate BOQ items to schedule activities in Scheduling to populate T7 links.',
        });
        router.refresh();
      } catch (err) {
        console.error('[UBOQ_SCHEDULE_SYNC_ERROR]', err);
        setFeedback({ kind: 'err', text: formatFriendlyUboqError(err) });
      }
    });
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px', marginBottom: '28px' }}>
      {/* STEP 3: SUBMIT / APPROVE BOQ */}
      <section
        aria-labelledby="uboq-step3-heading"
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.78)',
          border: '1px solid rgba(148, 163, 184, 0.24)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8' }}>
            Step 3 of 4
          </div>
          <h2 id="uboq-step3-heading" style={{ margin: '4px 0 6px', fontSize: '1.12rem', color: '#f8fafc' }}>
            Submit &amp; Approve BOQ
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.45 }}>
            Approving promotes a reviewed Draft into the official Awarded BOQ baseline. BOQs are never approved automatically.
          </p>
        </div>

        {/* Separate Governance Stage Badges */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.55)', border: '1px solid rgba(148,163,184,0.18)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>1. Items Accepted</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px', color: pendingCandidates === 0 && totalCandidates > 0 ? '#34d399' : '#f8fafc' }}>
              {totalCandidates > 0 ? `${acceptedCandidates} / ${totalCandidates}` : 'None yet'}
            </div>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.55)', border: '1px solid rgba(148,163,184,0.18)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>2. Draft Snapshot</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px', color: draftReady ? '#38bdf8' : '#cbd5e1' }}>
              {latestDraft ? `${latestDraft.versionLabel} (${draftReady ? 'Ready' : 'In Review'})` : 'Not saved'}
            </div>
          </div>
          <div style={{ padding: '10px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.55)', border: '1px solid rgba(148,163,184,0.18)' }}>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>3. Official Baseline</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '4px', color: latestApproved ? '#34d399' : '#fbbf24' }}>
              {latestApproved ? `Approved (${latestApproved.versionLabel})` : 'Not Approved'}
            </div>
          </div>
        </div>

        {latestDraft && (
          <div
            style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.9)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '0.83rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <strong>Pending Draft: {latestDraft.versionLabel}</strong>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {formatCurrencyPhp(latestDraft.estimatedTotalAmount)}
              </span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
              {latestDraft.sourceFileName ? `Source: ${latestDraft.sourceFileName}` : 'Staged BOQ Draft'} &bull;{' '}
              {latestDraft.lineCount} item group(s)
            </div>
          </div>
        )}

        {feedback && (
          <div
            role="status"
            aria-live="polite"
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              fontSize: '0.83rem',
              background: feedback.kind === 'ok' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
              border: `1px solid ${feedback.kind === 'ok' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'}`,
              color: feedback.kind === 'ok' ? '#6ee7b7' : '#fca5a5',
            }}
          >
            {feedback.text}
          </div>
        )}

        {approvalBlockedReason && (
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
            {approvalBlockedReason}
          </p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          {canExecuteApprovalNow && latestDraft ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                setConfirmedChecked(false);
                setConfirmOpen(true);
              }}
              style={{
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#10b981',
                color: '#022c22',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: isPending ? 'wait' : 'pointer',
              }}
            >
              Review &amp; Approve {latestDraft.versionLabel}…
            </button>
          ) : (
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              Signed in as <strong>{actorRoleLabel}</strong>
            </span>
          )}
        </div>
      </section>

      {/* STEP 4: LINK TO SCHEDULE & EXPORT */}
      <section
        aria-labelledby="uboq-step4-heading"
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'rgba(15, 23, 42, 0.78)',
          border: '1px solid rgba(148, 163, 184, 0.24)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8' }}>
            Step 4 of 4
          </div>
          <h2 id="uboq-step4-heading" style={{ margin: '4px 0 6px', fontSize: '1.12rem', color: '#f8fafc' }}>
            Link to Schedule &amp; Export Reports
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8', lineHeight: 1.45 }}>
            {latestApproved
              ? 'Your approved BOQ is ready to connect to project schedule activities and export standard ERP workbooks.'
              : 'Once a BOQ Draft is approved, connect it to Project Scheduling and export official BOQ and EVM reports.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href={`/projects/${projectId}/scheduling`}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              background: latestApproved ? '#38bdf8' : 'rgba(56, 189, 248, 0.14)',
              color: latestApproved ? '#0f172a' : '#38bdf8',
              border: latestApproved ? 'none' : '1px solid rgba(56, 189, 248, 0.4)',
              fontWeight: 700,
              fontSize: '0.86rem',
              textDecoration: 'none',
            }}
          >
            Continue to Scheduling &rarr;
          </Link>

          {latestApproved && eligibleScheduleId && canSyncSchedule && (
            <button
              type="button"
              disabled={isPending}
              onClick={handleSyncScheduleLinks}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.16)',
                border: '1px solid rgba(16, 185, 129, 0.45)',
                color: '#6ee7b7',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: isPending ? 'wait' : 'pointer',
              }}
            >
              {isPending ? 'Syncing…' : `Sync Schedule Links${eligibleScheduleName ? ` (${eligibleScheduleName})` : ''}`}
            </button>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(148, 163, 184, 0.16)', paddingTop: '12px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px' }}>
            Standard Excel Reports
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {(
              [
                ['T0_CANONICAL_AWARDED_BOQ', 'Export Awarded BOQ (T0)'],
                ['T1_CONTRACT_SUMMARY', 'Export Contract Summary (T1)'],
                ['T7_SCHEDULE_EVM', 'Export Schedule & EVM (T7)'],
              ] as const
            ).map(([code, label]) => (
              <a
                key={code}
                href={`/api/uboq/export?projectId=${encodeURIComponent(projectId)}&templateCode=${encodeURIComponent(code)}&format=xlsx`}
                style={{
                  padding: '7px 12px',
                  borderRadius: '7px',
                  background: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  color: '#e2e8f0',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                {label}
              </a>
            ))}
            <Link
              href={`/projects/${projectId}/uboq/templates`}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                background: 'transparent',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38bdf8',
                fontSize: '0.8rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Custom Templates (T0 / T1)
            </Link>
          </div>
        </div>
      </section>

      {/* EXPLICIT APPROVAL CONFIRMATION DIALOG */}
      {confirmOpen && latestDraft && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="uboq-approve-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(2, 6, 23, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            zIndex: 60,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#0f172a',
              border: '1px solid rgba(56, 189, 248, 0.45)',
              borderRadius: '14px',
              padding: '22px',
              color: '#f8fafc',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 id="uboq-approve-dialog-title" style={{ margin: 0, fontSize: '1.15rem' }}>
              Confirm Official BOQ Approval
            </h3>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5 }}>
              You are about to promote this Draft into the locked Awarded BOQ baseline. This will update the project&apos;s
              official BOQ items for scheduling and procurement and record your identity in the permanent audit log.
            </p>

            <dl
              style={{
                margin: 0,
                padding: '12px',
                borderRadius: '8px',
                background: 'rgba(2, 6, 23, 0.65)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                display: 'grid',
                gridTemplateColumns: '130px 1fr',
                rowGap: '6px',
                columnGap: '10px',
                fontSize: '0.83rem',
              }}
            >
              <dt style={{ color: '#94a3b8' }}>Project</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{projectName} ({projectRef})</dd>
              <dt style={{ color: '#94a3b8' }}>BOQ Version</dt>
              <dd style={{ margin: 0, fontWeight: 600 }}>{latestDraft.versionLabel}</dd>
              <dt style={{ color: '#94a3b8' }}>Source File</dt>
              <dd style={{ margin: 0 }}>{latestDraft.sourceFileName || 'Uploaded BOQ'}</dd>
              <dt style={{ color: '#94a3b8' }}>Financial Total</dt>
              <dd style={{ margin: 0, fontWeight: 700, color: '#34d399' }}>
                {formatCurrencyPhp(latestDraft.estimatedTotalAmount)} ({latestDraft.lineCount} item group(s))
              </dd>
              <dt style={{ color: '#94a3b8' }}>Approver</dt>
              <dd style={{ margin: 0 }}>{actorEmail} ({actorRoleLabel})</dd>
            </dl>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '0.84rem', color: '#e2e8f0', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={confirmedChecked}
                onChange={(e) => setConfirmedChecked(e.target.checked)}
                style={{ marginTop: '3px', width: '16px', height: '16px' }}
              />
              <span>
                I confirm I have reviewed this BOQ and authorize promoting <strong>{latestDraft.versionLabel}</strong> to
                the Approved BOQ Baseline.
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmedChecked(false);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  color: '#cbd5e1',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending || !confirmedChecked}
                onClick={handleConfirmApprove}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: confirmedChecked ? '#10b981' : 'rgba(148, 163, 184, 0.25)',
                  color: confirmedChecked ? '#022c22' : '#94a3b8',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: confirmedChecked && !isPending ? 'pointer' : 'not-allowed',
                }}
              >
                {isPending ? 'Approving…' : 'Confirm & Approve BOQ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
