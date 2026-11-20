'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  classifyProjectDocumentFile,
  getDocumentCategoryLabel,
  PROJECT_DOCUMENT_CATEGORY_OPTIONS,
  type ProjectDocumentRoleCode,
} from '@/lib/uboq/document-classifier';

type DocumentRow = {
  id: string;
  fileName: string;
  documentRole: string;
  byteSize: number;
  createdAt: string;
  sha256: string;
  latestSnapshotStatus: string | null;
};

type QueuedUploadFile = {
  key: string;
  file: File;
  roleCode: ProjectDocumentRoleCode;
  confidence: 'HIGH' | 'MEDIUM' | 'NEEDS_CONFIRMATION';
  reason: string;
  confirmed: boolean;
};

const TAX_PROFILES: Record<string, Array<[string, string]>> = {
  GOVERNMENT: [['GOV_PH_DUPA_5PCT_EST', 'Government (DPWH / public contract tax profile)']],
  CORPORATE: [
    ['CORP_PH_VAT_EXCL_12', 'Corporate – contract prices exclude 12% VAT'],
    ['CORP_PH_VAT_INCL_12', 'Corporate – contract prices include 12% VAT'],
    ['PEZA_ZERO_RATED_0', 'Corporate – PEZA zero-rated'],
  ],
  PRIVATE: [['PRIVATE_NON_VAT_EXEMPT', 'Private – non-VAT / exempt']],
};

function friendlyUploadError(rawError: unknown, status?: number): string {
  const msg = String(rawError || '').trim();
  if (msg.includes('UBOQ_XLSX_LIMIT_EXCEEDED')) {
    return 'This spreadsheet is larger than the single-upload processing limit. Save only the BOQ sheets to a smaller .xlsx file and upload again.';
  }
  if (msg.includes('UBOQ_EXPLICIT_COMPATIBLE_TAX_PROFILE_REQUIRED')) {
    return 'Please select the applicable contract tax/price basis for the Awarded BOQ.';
  }
  if (msg.includes('UBOQ_RBAC_FORBIDDEN') || msg.includes('UBOQ_PBAC')) {
    return 'Your account does not have permission to upload this file category.';
  }
  if (msg.includes('UBOQ_SEC_') || msg.includes('UBOQ_INTAKE_SECURITY_BLOCKED')) {
    return 'This file did not pass safety checks (macros, embedded scripts, or damaged archive structure).';
  }
  if (msg && !/[/\\]|node_modules|stack|sql|prisma/i.test(msg)) {
    return msg;
  }
  return status ? `Upload could not be completed (HTTP ${status}). Please retry.` : 'Upload could not be completed.';
}

export default function ProjectDocumentIntakeClient(props: {
  projectId: string;
  sector: string;
  canStageBoq: boolean;
  canUploadEvidence: boolean;
  files: DocumentRow[];
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);

  const taxes = TAX_PROFILES[props.sector] || [];
  // Auto-select when the project's verified sector establishes a single unambiguous profile
  const defaultTax = taxes.length === 1 ? taxes[0][0] : '';
  const [tax, setTax] = useState<string>(defaultTax);
  const [queue, setQueue] = useState<QueuedUploadFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [formNotice, setFormNotice] = useState<string | null>(null);

  const activeTax = taxes.some(([code]) => code === tax) ? tax : defaultTax;
  const hasQueuedBoq = queue.length > 0 ? queue.some((q) => q.roleCode === 'CONTRACT_BOQ') : true;
  const needsTaxChoice = hasQueuedBoq && taxes.length > 1;
  const unconfirmedCount = queue.filter((q) => q.confidence === 'NEEDS_CONFIRMATION' && !q.confirmed).length;

  function handleFileSelection(e: React.ChangeEvent<HTMLInputElement>) {
    setFormNotice(null);
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;

    const additions: QueuedUploadFile[] = selected.map((file, idx) => {
      const proposal = classifyProjectDocumentFile(file.name);
      return {
        key: `${file.name}-${file.size}-${file.lastModified}-${idx}`,
        file,
        roleCode: proposal.roleCode,
        confidence: proposal.confidence,
        reason: proposal.reason,
        confirmed: proposal.confidence !== 'NEEDS_CONFIRMATION',
      };
    });

    setQueue((prev) => {
      const existingKeys = new Set(prev.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
      const unique = additions.filter((a) => !existingKeys.has(`${a.file.name}-${a.file.size}-${a.file.lastModified}`));
      return [...prev, ...unique];
    });
    if (input.current) input.current.value = '';
  }

  function updateQueuedRole(key: string, nextRole: ProjectDocumentRoleCode) {
    setQueue((prev) =>
      prev.map((item) => (item.key === key ? { ...item, roleCode: nextRole, confirmed: true } : item))
    );
  }

  function confirmQueuedItem(key: string) {
    setQueue((prev) => prev.map((item) => (item.key === key ? { ...item, confirmed: true } : item)));
  }

  function removeQueuedItem(key: string) {
    setQueue((prev) => prev.filter((item) => item.key !== key));
  }

  async function uploadQueuedFiles() {
    setFormNotice(null);
    const directFiles = queue.length === 0 ? Array.from(input.current?.files || []) : [];
    const itemsToProcess: QueuedUploadFile[] =
      queue.length > 0
        ? queue
        : directFiles.map((file, idx) => {
            const proposal = classifyProjectDocumentFile(file.name);
            return {
              key: `direct-${file.name}-${idx}`,
              file,
              roleCode: proposal.roleCode,
              confidence: proposal.confidence,
              reason: proposal.reason,
              confirmed: true,
            };
          });

    if (itemsToProcess.length === 0) {
      setFormNotice('Select one or more project files first.');
      return;
    }
    if (queue.length > 0 && unconfirmedCount > 0) {
      setFormNotice(`Please confirm or choose a category for the ${unconfirmedCount} highlighted file(s) before uploading.`);
      return;
    }
    const batchHasBoq = itemsToProcess.some((q) => q.roleCode === 'CONTRACT_BOQ');
    if (batchHasBoq && !activeTax) {
      setFormNotice('Please select the contract tax/price basis for the Awarded BOQ before uploading.');
      return;
    }

    setBusy(true);
    const completed: string[] = [];
    const remaining: QueuedUploadFile[] = [];

    for (const item of itemsToProcess) {
      const isBoq = item.roleCode === 'CONTRACT_BOQ';
      const allowed = isBoq ? props.canStageBoq : props.canUploadEvidence;
      const categoryLabel = getDocumentCategoryLabel(item.roleCode);

      if (!allowed) {
        completed.push(`${item.file.name} (${categoryLabel}): Your role does not have permission to upload this document category.`);
        if (queue.length > 0) remaining.push(item);
        continue;
      }

      if (item.file.size > 25 * 1024 * 1024) {
        completed.push(`${item.file.name} (${categoryLabel}): Exceeds the 25 MB per-file upload limit.`);
        if (queue.length > 0) remaining.push(item);
        continue;
      }

      const form = new FormData();
      form.set('file', item.file);
      form.set('projectId', props.projectId);
      form.set('documentRole', item.roleCode);
      if (isBoq) {
        form.set('sectorType', props.sector);
        form.set('taxProfileCode', activeTax);
      }

      try {
        const url = isBoq
          ? '/api/uboq/intake'
          : '/api/projects/' + encodeURIComponent(props.projectId) + '/documents';
        const res = await fetch(url, { method: 'POST', body: form, credentials: 'same-origin' });
        const value = await res.json().catch(() => ({}));
        if (!res.ok) {
          completed.push(`${item.file.name} (${categoryLabel}): ${friendlyUploadError(value.error, res.status)}`);
          if (queue.length > 0) remaining.push(item);
        } else {
          const isDup = Boolean(value.duplicate || value.duplicateIdempotentReplay);
          const msg = isBoq
            ? isDup
              ? 'Awarded BOQ already stored — existing verified copy preserved'
              : 'Awarded BOQ uploaded — calculations and formulas checked automatically'
            : isDup
              ? 'Supporting document already stored in the Document Register'
              : 'Stored securely in the Document Register';
          completed.push(`${item.file.name} (${categoryLabel}): ${msg}`);
        }
      } catch {
        completed.push(`${item.file.name} (${categoryLabel}): Connection interrupted. Check the Document Register before retrying.`);
        if (queue.length > 0) remaining.push(item);
      }
    }

    setResults(completed);
    if (queue.length > 0) setQueue(remaining);
    if (input.current) input.current.value = '';
    setBusy(false);
    router.refresh();
  }

  const anyUploadSucceeded = results.some((line) => line.includes('uploaded') || line.includes('Stored') || line.includes('already stored'));
  const hasExistingDocs = props.files.length > 0;
  const canUploadAnything = props.canStageBoq || props.canUploadEvidence;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={{ padding: 20, background: '#1e293b', border: '1px solid #475569', borderRadius: 14 }}>
        <h2 style={{ margin: '0 0 8px' }}>Upload Project Files</h2>
        <p style={{ color: '#94a3b8', margin: '0 0 16px', fontSize: '0.92rem' }}>
          Select one or more project files at once (Awarded BOQ, NOA, NTP, Contract Agreement, POW, DUPA, Schedule, Drawings, or Specifications). Each file receives its own suggested category that you can adjust individually before uploading.
        </p>

        {!canUploadAnything && (
          <p role="status" style={{ color: '#fbbf24' }}>
            Your role has view access to the Document Register, but not permission to upload new files.
          </p>
        )}

        <input
          ref={input}
          type="file"
          multiple
          onChange={handleFileSelection}
          disabled={!canUploadAnything || busy}
          accept=".xlsx,.xls,.csv,.pdf,.docx,.png,.jpg,.jpeg"
          aria-label="Select project files"
          style={{
            padding: 16,
            border: '2px dashed #475569',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            borderRadius: 10,
            background: 'rgba(15, 23, 42, 0.5)',
            color: '#e2e8f0',
          }}
        />
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          Accepted formats: Excel (.xlsx, .xls, .csv), PDF, Word (.docx), and images (.png, .jpg). Original files are preserved unchanged in private project storage.
        </p>

        {/* Per-file classification review list */}
        {queue.length > 0 && (
          <div style={{ marginTop: 14, display: 'grid', gap: 10 }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e2e8f0' }}>
              Selected Files ({queue.length}) — Confirm Categories
            </div>
            {queue.map((item) => {
              const needsConfirm = item.confidence === 'NEEDS_CONFIRMATION' && !item.confirmed;
              return (
                <div
                  key={item.key}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    background: needsConfirm ? 'rgba(245, 158, 11, 0.10)' : 'rgba(15, 23, 42, 0.72)',
                    border: needsConfirm ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid #334155',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 1.4fr) minmax(220px, 1fr) auto',
                    gap: 10,
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.88rem', wordBreak: 'break-word' }}>
                      {item.file.name}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: needsConfirm ? '#fde68a' : '#94a3b8', marginTop: 2 }}>
                      {(item.file.size / 1024).toFixed(1)} KB &middot; {needsConfirm ? 'Please confirm category: ' : ''}{item.reason}
                    </div>
                  </div>

                  <select
                    aria-label={`Category for ${item.file.name}`}
                    value={item.roleCode}
                    disabled={busy}
                    onChange={(e) => updateQueuedRole(item.key, e.target.value as ProjectDocumentRoleCode)}
                    style={{
                      padding: '9px 10px',
                      background: '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid #64748b',
                      borderRadius: 7,
                      fontSize: '0.84rem',
                    }}
                  >
                    {PROJECT_DOCUMENT_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.roleCode} value={opt.roleCode}>
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {needsConfirm && (
                      <button
                        type="button"
                        onClick={() => confirmQueuedItem(item.key)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(245, 158, 11, 0.6)',
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#fde68a',
                          fontWeight: 700,
                          fontSize: '0.76rem',
                          cursor: 'pointer',
                        }}
                      >
                        Confirm
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => removeQueuedItem(item.key)}
                      aria-label={`Remove ${item.file.name}`}
                      style={{
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #475569',
                        background: 'transparent',
                        color: '#cbd5e1',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Only prompt for tax/price basis when a BOQ is queued AND the sector has multiple options */}
        {needsTaxChoice && (
          <div style={{ marginTop: 14, maxWidth: 420 }}>
            <label style={{ display: 'grid', gap: 5, fontSize: '0.86rem' }}>
              <span>Contract Tax / Price Basis (needed for Corporate Awarded BOQ)</span>
              <select
                required
                value={activeTax}
                onChange={(e) => setTax(e.target.value)}
                style={{ padding: 10, background: '#0f172a', color: '#f8fafc', border: '1px solid #64748b', borderRadius: 7 }}
              >
                <option value="">Select applicable contract tax basis</option>
                {taxes.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}

        {hasQueuedBoq && !needsTaxChoice && taxes.length === 1 && (
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 10 }}>
            Contract pricing basis automatically set from project sector: <strong style={{ color: '#cbd5e1' }}>{taxes[0][1]}</strong>.
          </p>
        )}

        {formNotice && (
          <p role="alert" style={{ marginTop: 12, color: '#fde68a', fontSize: '0.86rem' }}>
            {formNotice}
          </p>
        )}

        {/* One primary action per screen */}
        <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          {(queue.length > 0 || (!hasExistingDocs && !anyUploadSucceeded)) ? (
            <button
              type="button"
              onClick={uploadQueuedFiles}
              disabled={busy || !canUploadAnything}
              style={{
                background: busy ? '#475569' : '#22d3ee',
                color: '#042f2e',
                padding: '11px 20px',
                border: 0,
                borderRadius: 8,
                fontWeight: 700,
                cursor: busy ? 'wait' : 'pointer',
              }}
            >
              {busy
                ? 'Uploading and verifying...'
                : queue.length > 0
                  ? `Upload ${queue.length} Selected File${queue.length === 1 ? '' : 's'}`
                  : 'Upload Selected Documents'}
            </button>
          ) : (
            <Link
              href={`/projects/${encodeURIComponent(props.projectId)}?tab=awarded-boq`}
              style={{
                display: 'inline-block',
                background: '#10b981',
                color: '#022c22',
                padding: '11px 20px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: '0.92rem',
                textDecoration: 'none',
              }}
            >
              Continue to Project Workspace &rarr;
            </Link>
          )}

          {(hasExistingDocs || anyUploadSucceeded) && (
            <Link
              href={`/projects/${encodeURIComponent(props.projectId)}/uboq`}
              style={{ color: '#7dd3fc', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 600 }}
            >
              Continue to Step 2: Review BOQ Items &rarr;
            </Link>
          )}
        </div>

        {results.length > 0 && (
          <div
            role="status"
            aria-live="polite"
            style={{
              marginTop: 14,
              padding: 12,
              borderRadius: 8,
              background: 'rgba(15,23,42,0.75)',
              border: '1px solid rgba(56,189,248,0.3)',
              display: 'grid',
              gap: 6,
            }}
          >
            {results.map((line, i) => (
              <p key={i} style={{ margin: '2px 0', fontSize: 13.5, color: '#e2e8f0' }}>
                {line}
              </p>
            ))}
          </div>
        )}
      </section>

      <section style={{ padding: 20, background: '#1e293b', border: '1px solid #475569', borderRadius: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0 }}>Document Register ({props.files.length})</h2>
          <Link href={`/projects/${encodeURIComponent(props.projectId)}?tab=awarded-boq`} style={{ color: '#67e8f9', textDecoration: 'none', fontWeight: 600 }}>
            Continue to Project Workspace &rarr;
          </Link>
        </div>
        {!props.files.length ? (
          <p style={{ color: '#94a3b8' }}>
            No documents uploaded yet. Upload the Awarded BOQ and supporting contract files above.
          </p>
        ) : (
          <div style={{ overflowX: 'auto', marginTop: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ textAlign: 'left', color: '#94a3b8' }}>
                  <th style={{ padding: 10 }}>Document</th>
                  <th style={{ padding: 10 }}>Category</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Uploaded</th>
                  <th style={{ padding: 10 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {props.files.map((f) => (
                  <tr key={f.id} style={{ borderTop: '1px solid #334155' }}>
                    <td style={{ padding: 10 }}>
                      <div style={{ fontWeight: 600, color: '#f8fafc' }}>{f.fileName}</div>
                      <div style={{ fontSize: 11, color: '#64748b' }}>
                        {(f.byteSize / 1024).toFixed(1)} KB &middot; Verified immutable copy
                      </div>
                    </td>
                    <td style={{ padding: 10 }}>{getDocumentCategoryLabel(f.documentRole)}</td>
                    <td style={{ padding: 10 }}>
                      {f.documentRole === 'CONTRACT_BOQ'
                        ? (f.latestSnapshotStatus || 'Imported — View reconciliation in Project Workspace')
                        : 'Stored in project file register'}
                    </td>
                    <td style={{ padding: 10 }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: 10 }}>
                      <a
                        style={{ color: '#67e8f9' }}
                        href={'/api/projects/' + encodeURIComponent(props.projectId) + '/documents/' + encodeURIComponent(f.id) + '/download'}
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
