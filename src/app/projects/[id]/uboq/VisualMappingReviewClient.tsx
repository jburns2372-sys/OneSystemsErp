'use client';

import React, { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  applyVisualColumnMappingAction,
  regenerateUboqDraftSnapshotAction,
  resolveUboqExtractionCandidateAction,
  resolveUboqValidationExceptionAction,
} from '@/app/actions/uboq';
import {
  buildPortableMappingProfile,
  extractCandidateCellCoordinates,
  extractCandidateEffectiveFields,
  extractVisualColumnSummaries,
  getIntakeCanonicalFieldOptions,
  parsePortableMappingProfile,
  validateVisualColumnMapping,
  type VisualCandidateRecord,
  type VisualMappingProfilePayload,
  type VisualSourceDocumentRecord,
  type VisualValidationExceptionRecord,
} from '@/lib/uboq/visual-mapping';
import {
  extractReadableBoqRow,
  formatCurrencyPhp,
  formatFriendlyUboqError,
} from '@/lib/uboq/ux-helpers';

interface Props {
  projectId: string;
  sectorType: 'GOVERNMENT' | 'CORPORATE' | 'PRIVATE' | null;
  taxProfileCode: string | null;
  sourceDocuments: VisualSourceDocumentRecord[];
  exceptions: VisualValidationExceptionRecord[];
  canReview: boolean;
}

type StatusFilter = 'ALL' | 'PENDING' | 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED';
type SheetKindFilter = 'ALL' | 'BOQ' | 'SUPPORTING';
type AdvancedSubTab = 'mapping' | 'diagnostics';

const LOCAL_PROFILES_STORAGE_KEY_PREFIX = 'oserp_uboq_input_mapping_profiles_v1:';

function statusPillStyle(statusKey: 'PENDING' | 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED'): React.CSSProperties {
  if (statusKey === 'HUMAN_VERIFIED') {
    return { background: 'rgba(16, 185, 129, 0.16)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.42)' };
  }
  if (statusKey === 'HUMAN_EXCLUDED') {
    return { background: 'rgba(239, 68, 68, 0.14)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' };
  }
  return { background: 'rgba(245, 158, 11, 0.16)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.45)' };
}

function confidenceBadgeStyle(score: number): React.CSSProperties {
  if (score >= 0.9) {
    return { background: 'rgba(16, 185, 129, 0.16)', color: '#6ee7b7', border: '1px solid rgba(16, 185, 129, 0.4)' };
  }
  if (score >= 0.7) {
    return { background: 'rgba(245, 158, 11, 0.16)', color: '#fde68a', border: '1px solid rgba(245, 158, 11, 0.4)' };
  }
  return { background: 'rgba(239, 68, 68, 0.16)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' };
}

export default function VisualMappingReviewClient({
  projectId,
  sectorType,
  taxProfileCode,
  sourceDocuments,
  exceptions,
  canReview,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedDocId, setSelectedDocId] = useState<string>(sourceDocuments[0]?.id ?? '');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [sheetKindFilter, setSheetKindFilter] = useState<SheetKindFilter>('ALL');
  const [focusedCandidateId, setFocusedCandidateId] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Advanced Tools hidden by default for ordinary ERP users
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [advancedTab, setAdvancedTab] = useState<AdvancedSubTab>('mapping');

  const selectedDoc = useMemo(
    () => sourceDocuments.find((d) => d.id === selectedDocId) ?? sourceDocuments[0] ?? null,
    [sourceDocuments, selectedDocId]
  );

  const canonicalOptions = useMemo(() => getIntakeCanonicalFieldOptions(), []);

  const columnSummaries = useMemo(
    () => (selectedDoc ? extractVisualColumnSummaries(selectedDoc.candidates) : []),
    [selectedDoc]
  );

  // Column mapping state (Advanced Tools)
  const [columnMapOverrides, setColumnMapOverrides] = useState<Record<string, Record<string, string>>>({});
  const activeColumnMap = useMemo(() => {
    const base: Record<string, string> = {};
    for (const col of columnSummaries) {
      base[col.sourceColumnKey] = col.currentCanonicalFieldId ?? '';
    }
    const overrides = selectedDoc ? columnMapOverrides[selectedDoc.id] : undefined;
    return { ...base, ...(overrides ?? {}) };
  }, [columnSummaries, columnMapOverrides, selectedDoc]);

  const mappingValidation = useMemo(() => validateVisualColumnMapping(activeColumnMap), [activeColumnMap]);

  const [mappingNotes, setMappingNotes] = useState<string>('');
  const [profileName, setProfileName] = useState<string>('');
  const [importJsonText, setImportJsonText] = useState<string>('');
  const [showImportBox, setShowImportBox] = useState<boolean>(false);

  // Per-row inline review state
  const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>({});
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [exceptionNotes, setExceptionNotes] = useState<Record<string, string>>({});

  const readableRows = useMemo(
    () => (selectedDoc ? selectedDoc.candidates.map((c) => ({ candidate: c, row: extractReadableBoqRow(c) })) : []),
    [selectedDoc]
  );

  const pendingCandidates = useMemo(
    () =>
      selectedDoc
        ? selectedDoc.candidates.filter(
            (c) =>
              c.reviewDecision === 'PENDING' ||
              (c.requiresHumanReview && c.reviewDecision !== 'HUMAN_VERIFIED' && c.reviewDecision !== 'HUMAN_EXCLUDED')
          )
        : [],
    [selectedDoc]
  );

  const acceptedCount = useMemo(
    () => (selectedDoc ? selectedDoc.candidates.filter((c) => c.reviewDecision === 'HUMAN_VERIFIED').length : 0),
    [selectedDoc]
  );
  const excludedCount = useMemo(
    () => (selectedDoc ? selectedDoc.candidates.filter((c) => c.reviewDecision === 'HUMAN_EXCLUDED').length : 0),
    [selectedDoc]
  );

  const boqSheetRowCount = useMemo(
    () => readableRows.filter(({ row }) => row.sheetKind === 'BOQ').length,
    [readableRows]
  );
  const supportingSheetRowCount = useMemo(
    () => readableRows.filter(({ row }) => row.sheetKind === 'SUPPORTING').length,
    [readableRows]
  );
  const hasMultipleSheetKinds = boqSheetRowCount > 0 && supportingSheetRowCount > 0;

  const filteredRows = useMemo(() => {
    return readableRows.filter(({ row }) => {
      if (statusFilter !== 'ALL' && row.statusKey !== statusFilter) return false;
      if (sheetKindFilter !== 'ALL' && row.sheetKind !== sheetKindFilter) return false;
      return true;
    });
  }, [readableRows, statusFilter, sheetKindFilter]);

  function jumpToNextUncertainItem() {
    if (pendingCandidates.length === 0) return;
    setStatusFilter('PENDING');
    setSheetKindFilter('ALL');
    const currentIdx = focusedCandidateId
      ? pendingCandidates.findIndex((c) => c.id === focusedCandidateId)
      : -1;
    const next = pendingCandidates[(currentIdx + 1) % pendingCandidates.length];
    if (!next) return;
    setFocusedCandidateId(next.id);
    if (typeof document !== 'undefined') {
      requestAnimationFrame(() => {
        const el = document.getElementById(`uboq-review-note-${next.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        }
      });
    }
  }

  const openExceptions = useMemo(() => exceptions.filter((e) => e.status === 'OPEN'), [exceptions]);
  const isDocLockedByApproval = Boolean(selectedDoc?.isApprovedImmutable);

  function setColumnTarget(sourceCol: string, targetFieldId: string) {
    if (!selectedDoc) return;
    setColumnMapOverrides((prev) => ({
      ...prev,
      [selectedDoc.id]: {
        ...(prev[selectedDoc.id] ?? {}),
        [sourceCol]: targetFieldId,
      },
    }));
  }

  function handleSaveLocalProfile() {
    setBanner(null);
    try {
      const profile = buildPortableMappingProfile({
        profileName: profileName.trim() || `${selectedDoc?.fileName ?? 'BOQ'} Mapping Profile`,
        sectorType: sectorType ?? 'ANY',
        columnMap: activeColumnMap,
      });
      const storageKey = `${LOCAL_PROFILES_STORAGE_KEY_PREFIX}${projectId}`;
      const existingRaw = typeof window !== 'undefined' ? window.localStorage.getItem(storageKey) : null;
      const existingList: VisualMappingProfilePayload[] = existingRaw ? JSON.parse(existingRaw) : [];
      const filtered = existingList.filter((p) => p.profileName.toLowerCase() !== profile.profileName.toLowerCase());
      filtered.unshift(profile);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, JSON.stringify(filtered.slice(0, 20)));
      }
      setBanner({ kind: 'ok', text: `Saved mapping preset "${profile.profileName}" on this browser.` });
    } catch (err: unknown) {
      console.error('[UBOQ_PROFILE_SAVE_ERROR]', err);
      setBanner({ kind: 'err', text: formatFriendlyUboqError(err) });
    }
  }

  function handleExportProfileJson() {
    setBanner(null);
    try {
      const profile = buildPortableMappingProfile({
        profileName: profileName.trim() || `${selectedDoc?.fileName ?? 'BOQ'} Mapping Profile`,
        sectorType: sectorType ?? 'ANY',
        columnMap: activeColumnMap,
      });
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${profile.profileName.replace(/[^\w.\-]+/g, '_')}.uboq-mapping.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBanner({ kind: 'ok', text: `Exported mapping profile "${profile.profileName}".` });
    } catch (err: unknown) {
      console.error('[UBOQ_PROFILE_EXPORT_ERROR]', err);
      setBanner({ kind: 'err', text: formatFriendlyUboqError(err) });
    }
  }

  function handleImportProfileJson() {
    setBanner(null);
    if (!selectedDoc) return;
    try {
      const parsed = parsePortableMappingProfile(importJsonText);
      setProfileName(parsed.profileName);
      setColumnMapOverrides((prev) => ({
        ...prev,
        [selectedDoc.id]: {
          ...(prev[selectedDoc.id] ?? {}),
          ...parsed.columnMap,
        },
      }));
      setShowImportBox(false);
      setImportJsonText('');
      setBanner({
        kind: 'ok',
        text: `Loaded mapping profile "${parsed.profileName}" (${Object.keys(parsed.columnMap).length} columns). Review and apply below to save.`,
      });
    } catch (err: unknown) {
      console.error('[UBOQ_PROFILE_IMPORT_ERROR]', err);
      setBanner({ kind: 'err', text: 'The pasted profile JSON could not be read. Please verify the file and try again.' });
    }
  }

  function handleApplyColumnMapping(targetMode: 'PENDING' | 'ALL') {
    if (!selectedDoc) return;
    setBanner(null);
    if (!mappingValidation.valid) {
      setBanner({ kind: 'err', text: formatFriendlyUboqError(mappingValidation.errors[0]) });
      return;
    }
    if (!mappingNotes.trim()) {
      setBanner({ kind: 'err', text: 'Please add a short review note before applying column changes.' });
      return;
    }
    const targets =
      targetMode === 'PENDING'
        ? selectedDoc.candidates.filter((c) => c.reviewDecision === 'PENDING' || c.requiresHumanReview)
        : selectedDoc.candidates.filter((c) => c.reviewDecision !== 'HUMAN_EXCLUDED');

    if (targets.length === 0) {
      setBanner({ kind: 'err', text: 'There are no eligible BOQ items to update for this document.' });
      return;
    }

    startTransition(async () => {
      try {
        const res = await applyVisualColumnMappingAction({
          projectId,
          sourceDocumentId: selectedDoc.id,
          candidateIds: targets.map((c) => c.id),
          columnMap: activeColumnMap,
          reviewNotes: mappingNotes.trim(),
          decision: 'HUMAN_VERIFIED',
        });
        setBanner({
          kind: 'ok',
          text: `Updated column mapping for ${res.appliedCount} BOQ item(s). Your changes are saved in review state (not yet approved).`,
        });
        router.refresh();
      } catch (err: unknown) {
        console.error('[UBOQ_APPLY_MAPPING_ERROR]', err);
        setBanner({ kind: 'err', text: formatFriendlyUboqError(err) });
      }
    });
  }

  function startEditingCandidate(c: VisualCandidateRecord) {
    const eff = extractCandidateEffectiveFields(c);
    setEditingCandidateId(c.id);
    setEditFields({
      item_code: String(eff.item_code ?? ''),
      phase_code: String(eff.phase_code ?? ''),
      work_description: String(eff.work_description ?? ''),
      unit: String(eff.unit ?? ''),
      approved_qty: eff.approved_qty !== null && eff.approved_qty !== undefined ? String(eff.approved_qty) : '',
      contract_unit_rate:
        eff.contract_unit_rate !== null && eff.contract_unit_rate !== undefined ? String(eff.contract_unit_rate) : '',
    });
  }

  function handleCandidateDecision(
    c: VisualCandidateRecord,
    decision: 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED',
    useInlineEdits: boolean
  ) {
    setBanner(null);
    const notes = (candidateNotes[c.id] ?? '').trim();
    if (!notes) {
      setBanner({
        kind: 'err',
        text: `Please enter a short review note for item #${c.sourceRowNumber ?? 'selected'} before saving.`,
      });
      return;
    }

    const correctedMappedFields: Record<string, string | number | null> | undefined = useInlineEdits
      ? {
          item_code: editFields.item_code?.trim() || null,
          phase_code: editFields.phase_code?.trim() || null,
          work_description: editFields.work_description?.trim() || null,
          unit: editFields.unit?.trim() || null,
          approved_qty: editFields.approved_qty?.trim() === '' ? null : Number(editFields.approved_qty),
          contract_unit_rate:
            editFields.contract_unit_rate?.trim() === '' ? null : Number(editFields.contract_unit_rate),
        }
      : undefined;

    startTransition(async () => {
      try {
        await resolveUboqExtractionCandidateAction({
          projectId,
          candidateId: c.id,
          decision,
          reviewNotes: notes,
          canonicalFieldRemap:
            decision === 'HUMAN_VERIFIED' &&
            mappingValidation.valid &&
            Object.keys(mappingValidation.normalizedRemap).length > 0
              ? mappingValidation.normalizedRemap
              : undefined,
          correctedMappedFields,
        });
        setEditingCandidateId(null);
        setBanner({
          kind: 'ok',
          text:
            decision === 'HUMAN_VERIFIED'
              ? `Item #${c.sourceRowNumber ?? ''} accepted. Remember to click "Save Draft BOQ" once you finish reviewing.`
              : `Item #${c.sourceRowNumber ?? ''} excluded from the BOQ draft. Original uploaded file remains preserved.`,
        });
        router.refresh();
      } catch (err: unknown) {
        console.error('[UBOQ_CANDIDATE_DECISION_ERROR]', err);
        setBanner({ kind: 'err', text: formatFriendlyUboqError(err) });
      }
    });
  }

  function handleResolveException(exc: VisualValidationExceptionRecord) {
    setBanner(null);
    const note = (exceptionNotes[exc.id] ?? '').trim();
    if (!note) {
      setBanner({ kind: 'err', text: 'Please add a brief note explaining how this issue was resolved.' });
      return;
    }
    startTransition(async () => {
      try {
        await resolveUboqValidationExceptionAction({
          projectId,
          exceptionId: exc.id,
          resolutionNote: note,
        });
        setBanner({ kind: 'ok', text: 'Validation issue marked as resolved.' });
        router.refresh();
      } catch (err: unknown) {
        console.error('[UBOQ_EXCEPTION_RESOLVE_ERROR]', err);
        setBanner({ kind: 'err', text: formatFriendlyUboqError(err) });
      }
    });
  }

  function handleRegenerateDraft() {
    if (!selectedDoc) return;
    setBanner(null);
    startTransition(async () => {
      try {
        await regenerateUboqDraftSnapshotAction({
          projectId,
          sourceDocumentId: selectedDoc.id,
          sectorType: sectorType ?? undefined,
          taxProfileCode: taxProfileCode ?? undefined,
        });
        setBanner({
          kind: 'ok',
          text: 'Draft BOQ saved from your reviewed items. An authorized approver can now review and approve it in Step 3.',
        });
        router.refresh();
      } catch (err: unknown) {
        console.error('[UBOQ_REGENERATE_DRAFT_ERROR]', err);
        setBanner({ kind: 'err', text: formatFriendlyUboqError(err) });
      }
    });
  }

  return (
    <section
      aria-labelledby="uboq-step2-heading"
      style={{
        marginBottom: '28px',
        padding: '20px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.78)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
      }}
    >
      {/* Responsive table/card rules so ordinary users never fight horizontal scrolling on mobile */}
      <style>{`
        .uboq-desktop-table { display: block; }
        .uboq-mobile-cards { display: none; }
        @media (max-width: 820px) {
          .uboq-desktop-table { display: none; }
          .uboq-mobile-cards { display: flex; flex-direction: column; gap: 12px; }
        }
      `}</style>

      {/* Header + Uploaded Document Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#38bdf8' }}>
            Step 2 of 4
          </div>
          <h2 id="uboq-step2-heading" style={{ fontSize: '1.15rem', margin: '4px 0 6px', color: '#f8fafc' }}>
            Review Extracted BOQ Items
          </h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', maxWidth: '680px', lineHeight: 1.45 }}>
            Check each extracted line item below. You can edit quantities or prices, accept or exclude items, and save a{' '}
            <strong>Draft BOQ</strong>. Nothing becomes official until explicitly approved in Step 3.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {sourceDocuments.length > 0 && (
            <>
              <label htmlFor="uboq-source-doc-select" style={{ fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 600 }}>
                BOQ File:
              </label>
              <select
                id="uboq-source-doc-select"
                value={selectedDoc?.id ?? ''}
                onChange={(e) => setSelectedDocId(e.target.value)}
                style={{
                  padding: '7px 10px',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#f8fafc',
                  border: '1px solid rgba(148,163,184,0.35)',
                  fontSize: '0.84rem',
                  maxWidth: '280px',
                }}
              >
                {sourceDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.fileName} ({doc.candidates.length} items)
                  </option>
                ))}
              </select>
            </>
          )}
          {selectedDoc && (
            <a
              href={`/api/projects/${encodeURIComponent(projectId)}/documents/${encodeURIComponent(selectedDoc.id)}/download`}
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                background: 'rgba(148, 163, 184, 0.14)',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: '#e2e8f0',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Download Original File
            </a>
          )}
        </div>
      </div>

      {/* Approved Baseline Lock Notice */}
      {isDocLockedByApproval && (
        <div
          role="note"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            color: '#fde68a',
            fontSize: '0.84rem',
            fontWeight: 600,
            marginBottom: '14px',
          }}
        >
          APPROVED BASELINE LOCK — This BOQ file is part of an approved baseline and is read-only. Upload a new BOQ file in
          Documents &amp; Intake to start a revision.
        </div>
      )}

      {/* Status Banner */}
      {banner && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            marginBottom: '14px',
            fontSize: '0.85rem',
            background: banner.kind === 'ok' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(239, 68, 68, 0.14)',
            border: `1px solid ${banner.kind === 'ok' ? 'rgba(16, 185, 129, 0.45)' : 'rgba(239, 68, 68, 0.45)'}`,
            color: banner.kind === 'ok' ? '#6ee7b7' : '#fca5a5',
          }}
        >
          {banner.text}
        </div>
      )}

      {/* Empty State — Guide User to Step 1 Upload */}
      {!selectedDoc ? (
        <div
          style={{
            padding: '28px 20px',
            borderRadius: '10px',
            background: 'rgba(2, 6, 23, 0.5)',
            border: '1px dashed rgba(148, 163, 184, 0.3)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: '0 0 12px', fontSize: '0.94rem', color: '#e2e8f0', fontWeight: 600 }}>
            No BOQ file uploaded for this project yet
          </p>
          <p style={{ margin: '0 0 16px', fontSize: '0.84rem', color: '#94a3b8' }}>
            Upload an Excel (.xlsx), CSV, Word (.docx), searchable PDF, or scanned PNG image in Documents &amp; Intake to begin.
          </p>
          <Link
            href={`/projects/${projectId}/documents`}
            style={{
              display: 'inline-block',
              padding: '9px 16px',
              borderRadius: '8px',
              background: '#38bdf8',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.86rem',
              textDecoration: 'none',
            }}
          >
            Go to Upload BOQ &rarr;
          </Link>
        </div>
      ) : (
        <>
          {/* Review Queue Guidance Banner (Highlights Uncertain Items & Explains Audit Notes in Plain Language) */}
          {pendingCandidates.length > 0 && canReview && !isDocLockedByApproval && (
            <div
              role="region"
              aria-label="Items needing review"
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                marginBottom: '14px',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.42)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '1 1 320px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fde68a' }}>
                  Review Queue: {pendingCandidates.length} item(s) need your check before saving the Draft
                </div>
                <div style={{ fontSize: '0.79rem', color: '#cbd5e1', marginTop: '3px', lineHeight: 1.4 }}>
                  Uncertain items are never approved automatically. Add a brief note explaining your check (for example,
                  &ldquo;Confirmed against signed BOQ&rdquo; or &ldquo;Corrected quantity&rdquo;) — this is required for the project audit log.
                </div>
              </div>
              <button
                type="button"
                onClick={jumpToNextUncertainItem}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: '#f59e0b',
                  color: '#0f172a',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Next Item Needing Review &rarr;
              </button>
            </div>
          )}

          {/* Multi-Sheet Workbook Filter (DPWH BOQ Sheets vs Supporting Sheets) */}
          {hasMultipleSheetKinds && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Workbook Sheets:</span>
              {(
                [
                  ['ALL', `All Sheets (${readableRows.length})`],
                  ['BOQ', `BOQ Sheets (${boqSheetRowCount})`],
                  ['SUPPORTING', `Supporting Sheets (${supportingSheetRowCount})`],
                ] as const
              ).map(([kind, label]) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setSheetKindFilter(kind)}
                  style={{
                    padding: '5px 11px',
                    borderRadius: '999px',
                    fontSize: '0.77rem',
                    fontWeight: 600,
                    border: sheetKindFilter === kind ? '1px solid #10b981' : '1px solid rgba(148,163,184,0.26)',
                    background: sheetKindFilter === kind ? 'rgba(16, 185, 129, 0.16)' : 'rgba(2, 6, 23, 0.45)',
                    color: sheetKindFilter === kind ? '#6ee7b7' : '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Filter Bar & Progress Summary */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
            <div role="tablist" aria-label="Filter BOQ items by status" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(
                [
                  ['ALL', `All Items (${selectedDoc.candidates.length})`],
                  ['PENDING', `Needs Review (${pendingCandidates.length})`],
                  ['HUMAN_VERIFIED', `Accepted (${acceptedCount})`],
                  ['HUMAN_EXCLUDED', `Excluded (${excludedCount})`],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === key}
                  onClick={() => setStatusFilter(key)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    border: statusFilter === key ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.28)',
                    background: statusFilter === key ? 'rgba(56, 189, 248, 0.18)' : 'rgba(2, 6, 23, 0.45)',
                    color: statusFilter === key ? '#38bdf8' : '#cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              aria-expanded={showAdvanced}
              aria-controls="uboq-advanced-tools-panel"
              onClick={() => setShowAdvanced((v) => !v)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: showAdvanced ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.35)',
                color: showAdvanced ? '#38bdf8' : '#94a3b8',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showAdvanced ? 'Hide Advanced Tools ▲' : 'Advanced Tools ▼'}
            </button>
          </div>

          {/* DESKTOP & TABLET CLEAN BOQ TABLE */}
          <div className="uboq-desktop-table" style={{ borderRadius: '10px', border: '1px solid rgba(148,163,184,0.22)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: '#020617', color: '#cbd5e1', textAlign: 'left' }}>
                  <th style={{ padding: '11px 12px', minWidth: '210px' }}>Description</th>
                  <th style={{ padding: '11px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Quantity</th>
                  <th style={{ padding: '11px 10px', whiteSpace: 'nowrap' }}>Unit</th>
                  <th style={{ padding: '11px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Unit Price</th>
                  <th style={{ padding: '11px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>Amount</th>
                  <th style={{ padding: '11px 10px', whiteSpace: 'nowrap' }}>Status</th>
                  <th style={{ padding: '11px 10px', minWidth: '150px' }}>Issues</th>
                  <th style={{ padding: '11px 12px', minWidth: '215px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                      No BOQ items match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map(({ candidate: c, row }) => {
                    const isEditing = editingCandidateId === c.id;
                    const isFocused = focusedCandidateId === c.id;
                    return (
                      <tr
                        key={c.id}
                        style={{
                          borderTop: '1px solid rgba(148,163,184,0.15)',
                          verticalAlign: 'top',
                          background: isFocused ? 'rgba(245, 158, 11, 0.08)' : undefined,
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                                Description
                                <input
                                  type="text"
                                  value={editFields.work_description ?? ''}
                                  onChange={(e) => setEditFields((p) => ({ ...p, work_description: e.target.value }))}
                                  style={{ width: '100%', marginTop: '3px', padding: '5px 8px', fontSize: '0.82rem' }}
                                />
                              </label>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                <label style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                                  Item Code
                                  <input
                                    type="text"
                                    value={editFields.item_code ?? ''}
                                    onChange={(e) => setEditFields((p) => ({ ...p, item_code: e.target.value }))}
                                    style={{ width: '100%', marginTop: '3px', padding: '5px 8px', fontSize: '0.8rem' }}
                                  />
                                </label>
                                <label style={{ fontSize: '0.73rem', color: '#94a3b8' }}>
                                  Section / Phase
                                  <input
                                    type="text"
                                    value={editFields.phase_code ?? ''}
                                    onChange={(e) => setEditFields((p) => ({ ...p, phase_code: e.target.value }))}
                                    style={{ width: '100%', marginTop: '3px', padding: '5px 8px', fontSize: '0.8rem' }}
                                  />
                                </label>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div style={{ fontWeight: 600, color: '#f8fafc', lineHeight: 1.35 }}>{row.description}</div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '3px', display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span>
                                  Item {row.itemCode}
                                  {row.phaseCode ? ` · ${row.phaseCode}` : ''}
                                </span>
                                {hasMultipleSheetKinds && (
                                  <span
                                    style={{
                                      padding: '1px 6px',
                                      borderRadius: '4px',
                                      fontSize: '0.68rem',
                                      fontWeight: 600,
                                      background: row.sheetKind === 'BOQ' ? 'rgba(56, 189, 248, 0.14)' : 'rgba(148, 163, 184, 0.16)',
                                      color: row.sheetKind === 'BOQ' ? '#38bdf8' : '#cbd5e1',
                                    }}
                                  >
                                    {row.sheetKind === 'BOQ' ? `BOQ: ${row.sheetLabel}` : `Supporting: ${row.sheetLabel}`}
                                  </span>
                                )}
                              </div>
                            </>
                          )}
                        </td>

                        <td style={{ padding: '12px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              aria-label={`Quantity for ${row.description}`}
                              value={editFields.approved_qty ?? ''}
                              onChange={(e) => setEditFields((p) => ({ ...p, approved_qty: e.target.value }))}
                              style={{ width: '84px', padding: '5px 7px', textAlign: 'right', fontSize: '0.82rem' }}
                            />
                          ) : row.quantity !== null ? (
                            row.quantity.toLocaleString()
                          ) : (
                            '—'
                          )}
                        </td>

                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <input
                              type="text"
                              aria-label={`Unit for ${row.description}`}
                              value={editFields.unit ?? ''}
                              onChange={(e) => setEditFields((p) => ({ ...p, unit: e.target.value }))}
                              style={{ width: '72px', padding: '5px 7px', fontSize: '0.82rem' }}
                            />
                          ) : (
                            row.unit
                          )}
                        </td>

                        <td style={{ padding: '12px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              aria-label={`Unit Price for ${row.description}`}
                              value={editFields.contract_unit_rate ?? ''}
                              onChange={(e) => setEditFields((p) => ({ ...p, contract_unit_rate: e.target.value }))}
                              style={{ width: '98px', padding: '5px 7px', textAlign: 'right', fontSize: '0.82rem' }}
                            />
                          ) : (
                            formatCurrencyPhp(row.unitPrice)
                          )}
                        </td>

                        <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap', color: '#e2e8f0' }}>
                          {formatCurrencyPhp(row.amount)}
                        </td>

                        <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              ...statusPillStyle(row.statusKey),
                              padding: '3px 9px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-block',
                            }}
                          >
                            {row.statusLabel}
                          </span>
                          {row.reviewNotes && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', maxWidth: '140px', whiteSpace: 'normal' }}>
                              {row.reviewNotes}
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '12px 10px' }}>
                          {row.issueSummary ? (
                            <span style={{ fontSize: '0.78rem', color: '#fde68a', lineHeight: 1.35, display: 'block' }}>
                              {row.issueSummary}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>No issues</span>
                          )}
                        </td>

                        <td style={{ padding: '12px' }}>
                          {canReview && !isDocLockedByApproval ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <input
                                id={`uboq-review-note-${c.id}`}
                                type="text"
                                aria-label={`Review note for ${row.description}`}
                                placeholder="Reason (e.g. Confirmed vs BOQ)..."
                                value={candidateNotes[c.id] ?? ''}
                                onChange={(e) => setCandidateNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  background: '#0f172a',
                                  color: '#f8fafc',
                                  border: '1px solid rgba(148,163,184,0.32)',
                                  fontSize: '0.78rem',
                                }}
                              />
                              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {!isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => handleCandidateDecision(c, 'HUMAN_VERIFIED', false)}
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        background: '#10b981',
                                        color: '#022c22',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.76rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Accept
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => startEditingCandidate(c)}
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(56,189,248,0.16)',
                                        color: '#38bdf8',
                                        border: '1px solid rgba(56,189,248,0.4)',
                                        fontWeight: 600,
                                        fontSize: '0.76rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => handleCandidateDecision(c, 'HUMAN_EXCLUDED', false)}
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(239,68,68,0.14)',
                                        color: '#fca5a5',
                                        border: '1px solid rgba(239,68,68,0.38)',
                                        fontWeight: 600,
                                        fontSize: '0.76rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Reject
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => handleCandidateDecision(c, 'HUMAN_VERIFIED', true)}
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        background: '#10b981',
                                        color: '#022c22',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.76rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Save &amp; Accept
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCandidateId(null)}
                                      style={{
                                        padding: '5px 10px',
                                        borderRadius: '6px',
                                        background: 'transparent',
                                        color: '#94a3b8',
                                        border: '1px solid rgba(148,163,184,0.3)',
                                        fontSize: '0.76rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Cancel
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '0.78rem' }}>
                              {isDocLockedByApproval ? 'Locked (Approved)' : 'View only'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD LIST (ZERO HORIZONTAL SCROLLING) */}
          <div className="uboq-mobile-cards">
            {filteredRows.length === 0 ? (
              <div style={{ padding: '18px', textAlign: 'center', color: '#94a3b8', borderRadius: '10px', border: '1px solid rgba(148,163,184,0.2)' }}>
                No BOQ items match this filter.
              </div>
            ) : (
              filteredRows.map(({ candidate: c, row }) => {
                const isEditing = editingCandidateId === c.id;
                return (
                  <article
                    key={c.id}
                    style={{
                      padding: '14px',
                      borderRadius: '10px',
                      background: 'rgba(2, 6, 23, 0.58)',
                      border: '1px solid rgba(148, 163, 184, 0.22)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>{row.description}</div>
                        <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>Item {row.itemCode}</div>
                      </div>
                      <span
                        style={{
                          ...statusPillStyle(row.statusKey),
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {row.statusLabel}
                      </span>
                    </div>

                    {isEditing ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <label style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#94a3b8' }}>
                          Description
                          <input
                            type="text"
                            value={editFields.work_description ?? ''}
                            onChange={(e) => setEditFields((p) => ({ ...p, work_description: e.target.value }))}
                            style={{ width: '100%', marginTop: '3px', padding: '6px 8px' }}
                          />
                        </label>
                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Quantity
                          <input
                            type="number"
                            value={editFields.approved_qty ?? ''}
                            onChange={(e) => setEditFields((p) => ({ ...p, approved_qty: e.target.value }))}
                            style={{ width: '100%', marginTop: '3px', padding: '6px 8px' }}
                          />
                        </label>
                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          Unit
                          <input
                            type="text"
                            value={editFields.unit ?? ''}
                            onChange={(e) => setEditFields((p) => ({ ...p, unit: e.target.value }))}
                            style={{ width: '100%', marginTop: '3px', padding: '6px 8px' }}
                          />
                        </label>
                        <label style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: '#94a3b8' }}>
                          Unit Price
                          <input
                            type="number"
                            value={editFields.contract_unit_rate ?? ''}
                            onChange={(e) => setEditFields((p) => ({ ...p, contract_unit_rate: e.target.value }))}
                            style={{ width: '100%', marginTop: '3px', padding: '6px 8px' }}
                          />
                        </label>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '0.82rem' }}>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Quantity &amp; Unit</span>
                          <strong>{row.quantity !== null ? `${row.quantity.toLocaleString()} ${row.unit}` : '—'}</strong>
                        </div>
                        <div>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Unit Price</span>
                          <strong>{formatCurrencyPhp(row.unitPrice)}</strong>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.72rem' }}>Amount</span>
                          <strong style={{ color: '#38bdf8' }}>{formatCurrencyPhp(row.amount)}</strong>
                        </div>
                      </div>
                    )}

                    {row.issueSummary && (
                      <div style={{ fontSize: '0.78rem', color: '#fde68a', background: 'rgba(245, 158, 11, 0.1)', padding: '6px 10px', borderRadius: '6px' }}>
                        Issue: {row.issueSummary}
                      </div>
                    )}

                    {canReview && !isDocLockedByApproval && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          type="text"
                          aria-label={`Review note for ${row.description}`}
                          placeholder="Short review note..."
                          value={candidateNotes[c.id] ?? ''}
                          onChange={(e) => setCandidateNotes((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          style={{ width: '100%', padding: '7px 10px', fontSize: '0.82rem' }}
                        />
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {!isEditing ? (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleCandidateDecision(c, 'HUMAN_VERIFIED', false)}
                                style={{ flex: '1 1 auto', padding: '8px 12px', borderRadius: '6px', background: '#10b981', color: '#022c22', border: 'none', fontWeight: 700, fontSize: '0.82rem' }}
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => startEditingCandidate(c)}
                                style={{ flex: '1 1 auto', padding: '8px 12px', borderRadius: '6px', background: 'rgba(56,189,248,0.16)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.4)', fontWeight: 600, fontSize: '0.82rem' }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleCandidateDecision(c, 'HUMAN_EXCLUDED', false)}
                                style={{ flex: '1 1 auto', padding: '8px 12px', borderRadius: '6px', background: 'rgba(239,68,68,0.14)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.38)', fontWeight: 600, fontSize: '0.82rem' }}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleCandidateDecision(c, 'HUMAN_VERIFIED', true)}
                                style={{ flex: '1 1 auto', padding: '8px 12px', borderRadius: '6px', background: '#10b981', color: '#022c22', border: 'none', fontWeight: 700, fontSize: '0.82rem' }}
                              >
                                Save &amp; Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingCandidateId(null)}
                                style={{ flex: '1 1 auto', padding: '8px 12px', borderRadius: '6px', background: 'transparent', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.3)', fontSize: '0.82rem' }}
                              >
                                Cancel
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* VALIDATION ISSUES PANEL (ONLY EXPANDED WHEN OPEN ISSUES EXIST) */}
          {openExceptions.length > 0 && (
            <div
              style={{
                marginTop: '18px',
                padding: '14px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: '0.95rem', color: '#fde68a' }}>
                Validation Issues to Resolve ({openExceptions.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {openExceptions.map((exc) => (
                  <div
                    key={exc.id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(2, 6, 23, 0.65)',
                      border: '1px solid rgba(148,163,184,0.2)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ flex: '1 1 280px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: exc.severity === 'BLOCKING' ? '#fca5a5' : '#fde68a',
                          textTransform: 'uppercase',
                        }}
                      >
                        {exc.severity === 'BLOCKING' ? 'Required Fix' : 'Warning'}
                      </span>
                      <div style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: '2px' }}>{exc.message}</div>
                    </div>
                    {canReview && (
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                          type="text"
                          aria-label={`Resolution note for ${exc.message}`}
                          placeholder="How was this resolved?"
                          value={exceptionNotes[exc.id] ?? ''}
                          onChange={(e) => setExceptionNotes((prev) => ({ ...prev, [exc.id]: e.target.value }))}
                          style={{ padding: '6px 10px', fontSize: '0.8rem', minWidth: '180px' }}
                        />
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleResolveException(exc)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            background: '#38bdf8',
                            color: '#0f172a',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                          }}
                        >
                          Resolve Issue
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SAVE DRAFT FOOTER */}
          {canReview && !isDocLockedByApproval && (
            <div
              style={{
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid rgba(148,163,184,0.18)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                Saving updates your <strong>Draft BOQ</strong> only. An authorized approver must explicitly approve it in Step 3.
              </span>
              <button
                type="button"
                disabled={isPending || pendingCandidates.length > 0}
                onClick={handleRegenerateDraft}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  background: pendingCandidates.length > 0 ? 'rgba(148,163,184,0.22)' : '#38bdf8',
                  color: pendingCandidates.length > 0 ? '#94a3b8' : '#0f172a',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: pendingCandidates.length > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {pendingCandidates.length > 0
                  ? `Review ${pendingCandidates.length} Remaining Item(s) First`
                  : isPending
                    ? 'Saving Draft…'
                    : 'Save Draft BOQ'}
              </button>
            </div>
          )}

          {/* COLLAPSIBLE ADVANCED TOOLS PANEL (HIDDEN BY DEFAULT) */}
          {showAdvanced && (
            <div
              id="uboq-advanced-tools-panel"
              style={{
                marginTop: '20px',
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(2, 6, 23, 0.7)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.96rem', color: '#38bdf8' }}>
                    Advanced Tools — Column Mapping, OCR &amp; Audit Diagnostics
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                    For power users and auditors: remap non-standard source columns, import/export JSON profiles, and inspect OCR coordinates &amp; hashes.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setAdvancedTab('mapping')}
                    style={{
                      padding: '6px 11px',
                      borderRadius: '6px',
                      border: advancedTab === 'mapping' ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
                      background: advancedTab === 'mapping' ? 'rgba(56,189,248,0.16)' : 'transparent',
                      color: advancedTab === 'mapping' ? '#38bdf8' : '#cbd5e1',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Column Mapping &amp; Profiles ({columnSummaries.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvancedTab('diagnostics')}
                    style={{
                      padding: '6px 11px',
                      borderRadius: '6px',
                      border: advancedTab === 'diagnostics' ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
                      background: advancedTab === 'diagnostics' ? 'rgba(56,189,248,0.16)' : 'transparent',
                      color: advancedTab === 'diagnostics' ? '#38bdf8' : '#cbd5e1',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    OCR Coordinates, Confidence &amp; Audit
                  </button>
                </div>
              </div>

              {advancedTab === 'mapping' && (
                <div>
                  {/* JSON Profile Controls */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
                    <input
                      type="text"
                      aria-label="Reusable mapping profile name"
                      placeholder="Mapping profile name..."
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      style={{ padding: '6px 10px', fontSize: '0.8rem', minWidth: '200px' }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveLocalProfile}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(56,189,248,0.14)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      Save Local Preset
                    </button>
                    <button
                      type="button"
                      onClick={handleExportProfileJson}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(148,163,184,0.14)', border: '1px solid rgba(148,163,184,0.35)', color: '#e2e8f0', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      Export Profile JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImportBox((v) => !v)}
                      style={{ padding: '6px 10px', borderRadius: '6px', background: 'rgba(148,163,184,0.14)', border: '1px solid rgba(148,163,184,0.35)', color: '#e2e8f0', fontSize: '0.78rem', cursor: 'pointer' }}
                    >
                      {showImportBox ? 'Hide Import' : 'Import Profile JSON'}
                    </button>
                  </div>

                  {showImportBox && (
                    <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <textarea
                        rows={4}
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder="Paste UBOQ_INPUT_MAPPING_PROFILE_V1 JSON..."
                        style={{ width: '100%', padding: '8px', fontFamily: 'monospace', fontSize: '0.78rem' }}
                      />
                      <div>
                        <button
                          type="button"
                          onClick={handleImportProfileJson}
                          style={{ padding: '6px 12px', borderRadius: '6px', background: '#0ea5e9', color: '#0f172a', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                        >
                          Validate &amp; Load Profile
                        </button>
                      </div>
                    </div>
                  )}

                  {!mappingValidation.valid && (
                    <div style={{ padding: '10px 12px', borderRadius: '8px', marginBottom: '12px', background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.45)', color: '#fca5a5', fontSize: '0.8rem' }}>
                      <strong>Column Mapping Conflict:</strong>
                      <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                        {mappingValidation.errors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#0f172a', color: '#38bdf8', textAlign: 'left' }}>
                          <th style={{ padding: '9px' }}>Raw Column Key</th>
                          <th style={{ padding: '9px' }}>Sample Value</th>
                          <th style={{ padding: '9px' }}>Coord</th>
                          <th style={{ padding: '9px' }}>Avg OCR/Read Conf.</th>
                          <th style={{ padding: '9px' }}>Canonical BOQ Field</th>
                        </tr>
                      </thead>
                      <tbody>
                        {columnSummaries.map((col) => {
                          const currentTarget = activeColumnMap[col.sourceColumnKey] ?? '';
                          const isConflicted = mappingValidation.conflicts.some((c) =>
                            c.sourceColumns.includes(col.sourceColumnKey)
                          );
                          return (
                            <tr key={col.sourceColumnKey} style={{ borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                              <td style={{ padding: '9px' }}><code>{col.sourceColumnKey}</code></td>
                              <td style={{ padding: '9px', color: '#cbd5e1', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {col.sampleValue}
                              </td>
                              <td style={{ padding: '9px', fontFamily: 'monospace', color: '#94a3b8' }}>{col.sampleCoordinate}</td>
                              <td style={{ padding: '9px' }}>
                                <span style={{ ...confidenceBadgeStyle(col.avgConfidence), padding: '2px 7px', borderRadius: '999px', fontSize: '0.73rem', fontWeight: 600 }}>
                                  {(col.avgConfidence * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td style={{ padding: '9px' }}>
                                <select
                                  aria-label={`Map column ${col.sourceColumnKey}`}
                                  disabled={!canReview || isDocLockedByApproval || isPending}
                                  value={currentTarget}
                                  onChange={(e) => setColumnTarget(col.sourceColumnKey, e.target.value)}
                                  style={{
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    background: '#0f172a',
                                    color: '#f8fafc',
                                    border: isConflicted ? '1px solid #ef4444' : '1px solid rgba(148,163,184,0.35)',
                                    fontSize: '0.78rem',
                                    minWidth: '210px',
                                  }}
                                >
                                  <option value="">-- Leave Unmapped --</option>
                                  {canonicalOptions.map((opt) => (
                                    <option key={opt.fieldId} value={opt.fieldId}>
                                      {opt.suggestedHeading} ({opt.fieldId})
                                    </option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {canReview && !isDocLockedByApproval && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <input
                        type="text"
                        aria-label="Audit note for column mapping"
                        placeholder="Mandatory audit note for column remapping..."
                        value={mappingNotes}
                        onChange={(e) => setMappingNotes(e.target.value)}
                        style={{ flex: '1 1 240px', padding: '7px 10px', fontSize: '0.82rem' }}
                      />
                      <button
                        type="button"
                        disabled={isPending || !mappingValidation.valid || pendingCandidates.length === 0}
                        onClick={() => handleApplyColumnMapping('PENDING')}
                        style={{ padding: '7px 12px', borderRadius: '6px', background: '#10b981', color: '#022c22', border: 'none', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Apply to Pending ({pendingCandidates.length})
                      </button>
                      <button
                        type="button"
                        disabled={isPending || !mappingValidation.valid}
                        onClick={() => handleApplyColumnMapping('ALL')}
                        style={{ padding: '7px 12px', borderRadius: '6px', background: 'rgba(56,189,248,0.16)', border: '1px solid rgba(56,189,248,0.4)', color: '#38bdf8', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}
                      >
                        Apply to All Active Rows
                      </button>
                    </div>
                  )}
                </div>
              )}

              {advancedTab === 'diagnostics' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', padding: '10px 12px', borderRadius: '8px', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(148,163,184,0.18)' }}>
                    <span><strong>Source SHA-256:</strong> <code style={{ color: '#38bdf8' }}>{selectedDoc.sha256Hash}</code></span>
                    <span><strong>Vault Lock:</strong> {selectedDoc.isLockedImmutable ? 'LOCKED IMMUTABLE' : 'UNLOCKED'}</span>
                    <span><strong>Role:</strong> {selectedDoc.documentRole}</span>
                    <span><strong>Size:</strong> {(selectedDoc.byteSize / 1024).toFixed(1)} KB</span>
                  </div>

                  <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                      <thead>
                        <tr style={{ background: '#0f172a', color: '#38bdf8', textAlign: 'left' }}>
                          <th style={{ padding: '8px' }}>Row / Coord</th>
                          <th style={{ padding: '8px' }}>OCR / Extraction Method</th>
                          <th style={{ padding: '8px' }}>Confidence</th>
                          <th style={{ padding: '8px' }}>Raw Fields &amp; Formula</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedDoc.candidates.map((c) => {
                          const eff = extractCandidateEffectiveFields(c);
                          const coords = extractCandidateCellCoordinates(c);
                          return (
                            <tr key={c.id} style={{ borderTop: '1px solid rgba(148,163,184,0.14)', verticalAlign: 'top' }}>
                              <td style={{ padding: '8px', fontFamily: 'monospace' }}>
                                Row {c.sourceRowNumber ?? '—'} · {c.sheetOrPageRef || c.sourceCellRef || '—'}
                                {Object.keys(coords).length > 0 && (
                                  <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                    {Object.entries(coords).map(([k, v]) => `${k}:${v}`).join(' ')}
                                  </div>
                                )}
                              </td>
                              <td style={{ padding: '8px', fontFamily: 'monospace', color: '#cbd5e1' }}>{c.extractionMethod}</td>
                              <td style={{ padding: '8px' }}>
                                <span style={{ ...confidenceBadgeStyle(c.confidenceScore), padding: '2px 7px', borderRadius: '999px', fontWeight: 600 }}>
                                  {(c.confidenceScore * 100).toFixed(1)}%
                                </span>
                              </td>
                              <td style={{ padding: '8px' }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                  {Object.entries(eff).map(([k, v]) => (
                                    <code key={k} style={{ background: 'rgba(148,163,184,0.12)', padding: '2px 6px', borderRadius: '4px' }}>
                                      {k}={v === null ? 'null' : String(v)}
                                    </code>
                                  ))}
                                  {c.rawFormulaText && (
                                    <code style={{ color: '#fde68a' }}>fx: {c.rawFormulaText}</code>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
