import React from 'react';
import type { CrossDocumentReconciliationReport } from '@/lib/uboq/contract-document-extractor';
import type { DocumentRelevanceAssessment } from '@/lib/uboq/project-relevance';

interface Props {
  reconciliation: CrossDocumentReconciliationReport | null;
  needsConfirmationDocs?: ReadonlyArray<{
    readonly id: string;
    readonly fileName: string;
    readonly relevance: DocumentRelevanceAssessment;
  }>;
}

function fmtPhp(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return 'Not found';
  return `₱ ${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ContractReconciliationBanner({
  reconciliation,
  needsConfirmationDocs = [],
}: Props) {
  const hasContractDocs = Boolean(reconciliation && reconciliation.documentsAnalyzed > 0);
  if (!hasContractDocs && needsConfirmationDocs.length === 0) {
    return null;
  }

  const isConflict = reconciliation?.status === 'CONFLICT_FOUND';
  const isTestOnly = Boolean(reconciliation?.hasTestOnlyOrUnsignedDocuments);
  const borderColor = isConflict
    ? 'rgba(239, 68, 68, 0.55)'
    : isTestOnly || needsConfirmationDocs.length > 0
      ? 'rgba(245, 158, 11, 0.55)'
      : 'rgba(16, 185, 129, 0.45)';
  const accentColor = isConflict
    ? '#fca5a5'
    : isTestOnly || needsConfirmationDocs.length > 0
      ? '#fde68a'
      : '#6ee7b7';

  const blockingConflicts = (reconciliation?.discrepancies ?? []).filter((d) => d.severity === 'BLOCKING');
  const warnings = (reconciliation?.discrepancies ?? []).filter((d) => d.severity === 'WARNING');

  return (
    <section
      aria-label="Contract Document Verification and Project Relevance"
      style={{
        marginBottom: '20px',
        padding: '16px 20px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.78)',
        border: `1px solid ${borderColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 10px',
              borderRadius: '999px',
              fontSize: '0.74rem',
              fontWeight: 700,
              color: accentColor,
              background: 'rgba(15, 23, 42, 0.9)',
              border: `1px solid ${borderColor}`,
              marginBottom: '6px',
            }}
          >
            {isConflict
              ? 'Contract Document Conflict'
              : isTestOnly
                ? 'Unsigned / Test-Only Documents'
                : 'Contract Documents Checked'}
          </span>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1rem' }}>
            {reconciliation?.headline ?? 'Documents awaiting project confirmation'}
          </h3>
        </div>
        {reconciliation && (
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            {reconciliation.documentsAnalyzed} contract document(s) recognized for this project
          </div>
        )}
      </div>

      {isTestOnly && (
        <div
          role="note"
          style={{
            marginTop: '10px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#fde68a',
            fontSize: '0.82rem',
          }}
        >
          These documents are explicitly marked unsigned or test-only. Extracted values are shown for verification only and cannot authorize live commercial commitments.
        </div>
      )}

      {reconciliation && hasContractDocs && (
        <div
          style={{
            marginTop: '12px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))',
            gap: '10px',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Client / Contractor</div>
            <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '3px' }}>
              {reconciliation.consensus.clientName ?? 'Not stated'}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.76rem' }}>
              {reconciliation.consensus.awardedContractor ?? 'Contractor not stated'}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Contract &amp; Notice References</div>
            <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '3px' }}>
              {reconciliation.consensus.contractReference ?? 'Not stated'}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.76rem' }}>
              {[reconciliation.consensus.noticeOfAwardRef, reconciliation.consensus.noticeToProceedRef]
                .filter(Boolean)
                .join(' · ') || 'No notice refs linked yet'}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
              {isTestOnly ? 'Simulated Contract Amount' : 'Extracted Contract Amount'}
            </div>
            <div style={{ color: isTestOnly ? '#fde68a' : '#38bdf8', fontWeight: 700, marginTop: '3px' }}>
              {fmtPhp(reconciliation.consensus.awardedAmount)}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.76rem' }}>
              {reconciliation.consensus.pricingBasis !== 'UNSPECIFIED'
                ? reconciliation.consensus.pricingBasis.replace('_', ' ')
                : 'Price basis not stated'}
            </div>
          </div>

          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(30, 41, 59, 0.65)' }}>
            <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>Schedule Window</div>
            <div style={{ color: '#f8fafc', fontWeight: 600, marginTop: '3px' }}>
              {reconciliation.consensus.commencementDate ?? 'Start not stated'} &rarr;{' '}
              {reconciliation.consensus.completionDate ?? 'End not stated'}
            </div>
            <div style={{ color: '#cbd5e1', fontSize: '0.76rem' }}>
              {reconciliation.consensus.contractDurationDays
                ? `${reconciliation.consensus.contractDurationDays} calendar days`
                : 'Duration not stated'}
            </div>
          </div>
        </div>
      )}

      {blockingConflicts.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: '0.84rem', marginBottom: '4px' }}>
            Conflicting Information Requiring Review ({blockingConflicts.length})
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#fecaca', fontSize: '0.82rem', lineHeight: 1.5 }}>
            {blockingConflicts.map((c, idx) => (
              <li key={`${c.code}-${idx}`}>{c.message}</li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <div style={{ color: '#fde68a', fontWeight: 700, fontSize: '0.82rem', marginBottom: '4px' }}>
            Minor Checks ({warnings.length})
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#fef08a', fontSize: '0.8rem', lineHeight: 1.5 }}>
            {warnings.map((w, idx) => (
              <li key={`${w.code}-${idx}`}>{w.message}</li>
            ))}
          </ul>
        </div>
      )}

      {needsConfirmationDocs.length > 0 && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
          }}
        >
          <div style={{ color: '#fde68a', fontWeight: 700, fontSize: '0.83rem', marginBottom: '4px' }}>
            Documents Needing Project Confirmation ({needsConfirmationDocs.length})
          </div>
          <ul style={{ margin: 0, paddingLeft: '18px', color: '#e2e8f0', fontSize: '0.8rem' }}>
            {needsConfirmationDocs.map((d) => (
              <li key={d.id}>
                <strong>{d.fileName}</strong>: {d.relevance.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {reconciliation && reconciliation.documents.length > 0 && (
        <details style={{ marginTop: '12px', fontSize: '0.78rem', color: '#94a3b8' }}>
          <summary style={{ cursor: 'pointer', color: '#cbd5e1', fontWeight: 600 }}>
            Advanced Details — Recognized Source Documents &amp; Provenance ({reconciliation.documents.length})
          </summary>
          <ul style={{ marginTop: '6px', paddingLeft: '18px', lineHeight: 1.55 }}>
            {reconciliation.documents.map((doc, idx) => (
              <li key={`${doc.fileName}-${idx}`}>
                <strong style={{ color: '#e2e8f0' }}>{doc.fileName}</strong> &middot; Detected as{' '}
                <code>{doc.detectedKind}</code> ({Math.round(doc.detectedKindConfidence * 100)}%) &middot; Status:{' '}
                <code>{doc.authorityStatus}</code> &middot; Pages: {doc.pageCount}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
