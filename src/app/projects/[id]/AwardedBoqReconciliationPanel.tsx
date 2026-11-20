'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { populateWorkspaceAwardedBoqAction } from '@/app/actions/uboq';
import type { AwardedBoqVerificationReport } from '@/lib/uboq/awarded-boq-reconciler';

interface Props {
  projectId: string;
  sourceDocument: {
    id: string;
    fileName: string;
    byteSize: number;
    sha256Hash: string;
    createdAt: string;
  } | null;
  verification: AwardedBoqVerificationReport | null;
  hasWorkspaceBoq: boolean;
  isBoqLocked: boolean;
  canPopulateWorkspaceBoq: boolean;
  isSimulatingRole: boolean;
  compact?: boolean;
}

function fmtPhp(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  return `₱ ${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function AwardedBoqReconciliationPanel({
  projectId,
  sourceDocument,
  verification,
  hasWorkspaceBoq,
  isBoqLocked,
  canPopulateWorkspaceBoq,
  isSimulatingRole,
  compact = false,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmationNote, setConfirmationNote] = useState(
    'Verified awarded BOQ calculations and contract reconciliation'
  );
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  if (!sourceDocument || !verification) {
    return (
      <div
        style={{
          marginBottom: '20px',
          padding: '16px 20px',
          borderRadius: '10px',
          background: 'rgba(15, 23, 42, 0.72)',
          border: '1px solid rgba(56, 189, 248, 0.35)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '14px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.95rem' }}>
            Awarded Contract BOQ Verification
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: '4px' }}>
            Upload the project&apos;s awarded BOQ workbook to verify arithmetic, check formulas, and reconcile against the official awarded contract amount.
          </div>
        </div>
        <Link
          href={`/projects/${projectId}/documents`}
          style={{
            padding: '8px 14px',
            borderRadius: '8px',
            background: '#0284c7',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: '0.84rem',
          }}
        >
          Upload Awarded BOQ &rarr;
        </Link>
      </div>
    );
  }

  const isMatch = verification.status === 'VERIFIED_MATCH';
  const isMissingContract = verification.status === 'CONTRACT_AMOUNT_REQUIRED';
  const isDiscrepancy = verification.status === 'DISCREPANCY_FOUND';

  const statusBorder = isMatch
    ? '1px solid rgba(16, 185, 129, 0.55)'
    : isMissingContract
      ? '1px solid rgba(245, 158, 11, 0.55)'
      : '1px solid rgba(239, 68, 68, 0.55)';
  const statusBg = isMatch
    ? 'rgba(16, 185, 129, 0.12)'
    : isMissingContract
      ? 'rgba(245, 158, 11, 0.12)'
      : 'rgba(239, 68, 68, 0.12)';
  const statusColor = isMatch ? '#6ee7b7' : isMissingContract ? '#fde68a' : '#fca5a5';

  function handlePopulateWorkspaceBoq() {
    if (!sourceDocument) return;
    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await populateWorkspaceAwardedBoqAction({
          projectId,
          sourceDocumentId: sourceDocument.id,
          confirmationNote,
        });
        setFeedback({
          kind: 'ok',
          text: res.alreadyPopulated
            ? 'Project Workspace BOQ is already populated.'
            : `Populated ${res.payItemCount} verified pay items (${res.headingCount} headings) into the Project Workspace BOQ. No PRRs, purchase orders, payments, or variations were created.`,
        });
        router.refresh();
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unable to populate Project Workspace BOQ.';
        setFeedback({ kind: 'err', text: msg });
      }
    });
  }

  if (compact) {
    return (
      <div
        style={{
          padding: '14px 18px',
          borderRadius: '10px',
          background: statusBg,
          border: statusBorder,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: statusColor, fontSize: '0.92rem' }}>
            {verification.headline}
          </div>
          <div style={{ color: '#cbd5e1', fontSize: '0.8rem', marginTop: '3px' }}>
            Source: <strong>{sourceDocument.fileName}</strong> &middot; Pay Items: {verification.counts.payItems} &middot;
            Formulas: {verification.formulaCheck} ({verification.counts.validFormulas}/{verification.counts.totalFormulasChecked}) &middot;
            Official Contract: {fmtPhp(verification.officialAwardedContractAmount)} &middot;
            Recalculated Total: {fmtPhp(verification.recalculatedTotal)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href={`/projects/${projectId}?tab=awarded-boq`}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#f8fafc',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Open Contract Value &amp; BOQ
          </Link>
          <Link
            href={`/projects/${projectId}/documents`}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#7dd3fc',
              textDecoration: 'none',
              fontSize: '0.8rem',
              fontWeight: 600,
            }}
          >
            Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section
      aria-label="Awarded BOQ Verification and Contract Reconciliation"
      style={{
        marginBottom: '22px',
        padding: '18px 20px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.78)',
        border: statusBorder,
      }}
    >
      {/* Headline Status */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
          marginBottom: '14px',
        }}
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '3px 10px',
              borderRadius: '999px',
              background: statusBg,
              border: statusBorder,
              color: statusColor,
              fontSize: '0.76rem',
              fontWeight: 700,
              marginBottom: '6px',
            }}
          >
            {isMatch
              ? 'RECONCILED'
              : isMissingContract
                ? 'AWAITING OFFICIAL CONTRACT AMOUNT'
                : 'DISCREPANCIES DETECTED'}
          </span>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.05rem' }}>{verification.headline}</h3>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '4px' }}>
            Immutable Source: <strong style={{ color: '#e2e8f0' }}>{sourceDocument.fileName}</strong> &middot;{' '}
            {verification.counts.payItems} priced pay items &middot; {verification.counts.headingsAndNotes} headings/notes separated (no routine item-by-item reapproval required)
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Link
            href={`/projects/${projectId}/documents`}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'rgba(30, 41, 59, 0.85)',
              border: '1px solid rgba(148, 163, 184, 0.35)',
              color: '#e2e8f0',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            Documents Register
          </Link>
          <Link
            href={`/projects/${projectId}/uboq`}
            style={{
              padding: '7px 12px',
              borderRadius: '8px',
              background: 'rgba(56, 189, 248, 0.14)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#7dd3fc',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
            }}
          >
            BOQ Verification Details &rarr;
          </Link>
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
          gap: '12px',
          marginBottom: '14px',
        }}
      >
        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Official Awarded Contract Amount</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: verification.officialAwardedContractAmount ? '#38bdf8' : '#fde68a', marginTop: '4px' }}>
            {verification.officialAwardedContractAmount ? fmtPhp(verification.officialAwardedContractAmount) : 'Not Recorded'}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
            Independent authoritative reference
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Recalculated BOQ Total</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc', marginTop: '4px' }}>
            {fmtPhp(verification.recalculatedTotal)}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
            Calculation Check: <strong style={{ color: verification.calculationCheck === 'PASS' ? '#6ee7b7' : '#fca5a5' }}>{verification.calculationCheck}</strong>
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Reconciliation Variance</div>
          <div
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color:
                verification.variance === null
                  ? '#fde68a'
                  : Math.abs(verification.variance) === 0
                    ? '#6ee7b7'
                    : '#fca5a5',
              marginTop: '4px',
            }}
          >
            {verification.variance === null ? 'Pending Contract Amount' : fmtPhp(verification.variance)}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
            Recalculated minus Official Contract
          </div>
        </div>

        <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Formula Integrity Check</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: verification.formulaCheck === 'FAIL' ? '#fca5a5' : '#6ee7b7', marginTop: '4px' }}>
            {verification.formulaCheck}
          </div>
          <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
            {verification.counts.validFormulas}/{verification.counts.totalFormulasChecked} formulas verified &middot; {verification.counts.discrepancies} issues
          </div>
        </div>
      </div>

      {/* Discrepancies Table — ONLY shown when genuine calculation/formula/contract mismatches exist */}
      {isDiscrepancy && verification.discrepancies.length > 0 && (
        <div style={{ marginBottom: '14px', overflowX: 'auto' }}>
          <div style={{ fontWeight: 700, color: '#fca5a5', fontSize: '0.86rem', marginBottom: '6px' }}>
            Discrepancies Requiring Attention ({verification.discrepancies.length})
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', color: '#e2e8f0' }}>
            <thead>
              <tr style={{ background: 'rgba(239, 68, 68, 0.14)', textAlign: 'left' }}>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>Item</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>Worksheet / Cell</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>Expected</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>Actual</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>Difference</th>
                <th style={{ padding: '7px 10px', borderBottom: '1px solid rgba(239,68,68,0.3)' }}>Detail</th>
              </tr>
            </thead>
            <tbody>
              {verification.discrepancies.slice(0, 25).map((d, idx) => (
                <tr key={`${d.code}-${d.cellRef}-${idx}`} style={{ borderBottom: '1px solid rgba(148,163,184,0.16)' }}>
                  <td style={{ padding: '7px 10px', fontWeight: 600 }}>{d.item}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'monospace' }}>{d.cellRef}</td>
                  <td style={{ padding: '7px 10px' }}>
                    {typeof d.expectedValue === 'number' ? fmtPhp(d.expectedValue) : String(d.expectedValue ?? '—')}
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    {typeof d.actualValue === 'number' ? fmtPhp(d.actualValue) : String(d.actualValue ?? '—')}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#fca5a5', fontWeight: 600 }}>
                    {d.difference !== null ? fmtPhp(d.difference) : '—'}
                  </td>
                  <td style={{ padding: '7px 10px', color: '#cbd5e1' }}>{d.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {verification.discrepancies.length > 25 && (
            <div style={{ color: '#94a3b8', fontSize: '0.76rem', marginTop: '6px' }}>
              Showing first 25 of {verification.discrepancies.length} discrepancies.
            </div>
          )}
        </div>
      )}

      {/* Authorized Contract-Import Control into Existing Project Workspace */}
      {!hasWorkspaceBoq && !isBoqLocked && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(148, 163, 184, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 280px' }}>
            <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: '0.86rem' }}>
              Populate Existing Project Workspace BOQ
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.78rem', marginTop: '3px' }}>
              {isMatch
                ? 'Imports verified pay items and headings into Contract Value & BOQ, Procurement Benchmark, Master Materials, Profitability, and Scheduling. Does NOT auto-create PRRs, purchase orders, payments, or variations.'
                : isMissingContract
                  ? 'Record the official awarded contract amount from authorized contract evidence before populating the Project Workspace BOQ.'
                  : 'Resolve the reported calculation or contract-total discrepancies before populating the Project Workspace BOQ.'}
            </div>
          </div>

          {isMatch && canPopulateWorkspaceBoq && !isSimulatingRole && (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={confirmationNote}
                onChange={(e) => setConfirmationNote(e.target.value)}
                placeholder="Audit confirmation note"
                aria-label="Audit confirmation note"
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  border: '1px solid rgba(148, 163, 184, 0.35)',
                  background: '#0f172a',
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  minWidth: '220px',
                }}
              />
              <button
                type="button"
                disabled={isPending || confirmationNote.trim().length < 5}
                onClick={handlePopulateWorkspaceBoq}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isPending ? '#475569' : '#10b981',
                  color: '#022c22',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: isPending ? 'wait' : 'pointer',
                }}
              >
                {isPending ? 'Populating…' : 'Populate Project Workspace BOQ'}
              </button>
            </div>
          )}
        </div>
      )}

      {feedback && (
        <div
          role="status"
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: feedback.kind === 'ok' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: feedback.kind === 'ok' ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid rgba(239, 68, 68, 0.45)',
            color: feedback.kind === 'ok' ? '#6ee7b7' : '#fca5a5',
            fontSize: '0.82rem',
          }}
        >
          {feedback.text}
        </div>
      )}
    </section>
  );
}
