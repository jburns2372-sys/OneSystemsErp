'use client';

import React, { useMemo, useState, useTransition } from 'react';
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

interface Props {
  projectId: string;
  sectorType: 'GOVERNMENT' | 'CORPORATE' | 'PRIVATE' | null;
  taxProfileCode: string | null;
  sourceDocuments: VisualSourceDocumentRecord[];
  exceptions: VisualValidationExceptionRecord[];
  canReview: boolean;
}

type ActiveTab = 'mapping' | 'candidates' | 'exceptions';

const LOCAL_PROFILES_STORAGE_KEY_PREFIX = 'oserp_uboq_input_mapping_profiles_v1:';

function confidenceBadgeStyle(score: number): React.CSSProperties {
  if (score >= 0.9) {
    return { background: 'rgba(16, 185, 129, 0.16)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' };
  }
  if (score >= 0.7) {
    return { background: 'rgba(245, 158, 11, 0.16)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)' };
  }
  return { background: 'rgba(239, 68, 68, 0.16)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' };
}

function decisionBadgeStyle(decision: string): React.CSSProperties {
  if (decision === 'HUMAN_VERIFIED') {
    return { background: 'rgba(16, 185, 129, 0.16)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.4)' };
  }
  if (decision === 'HUMAN_EXCLUDED') {
    return { background: 'rgba(239, 68, 68, 0.16)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.4)' };
  }
  return { background: 'rgba(56, 189, 248, 0.16)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' };
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
  const [activeTab, setActiveTab] = useState<ActiveTab>('mapping');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'HUMAN_VERIFIED' | 'HUMAN_EXCLUDED'>('ALL');
  const [banner, setBanner] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  const selectedDoc = useMemo(
    () => sourceDocuments.find((d) => d.id === selectedDocId) ?? sourceDocuments[0] ?? null,
    [sourceDocuments, selectedDocId]
  );

  const canonicalOptions = useMemo(() => getIntakeCanonicalFieldOptions(), []);

  const columnSummaries = useMemo(
    () => (selectedDoc ? extractVisualColumnSummaries(selectedDoc.candidates) : []),
    [selectedDoc]
  );

  // Column mapping state keyed by sourceColumnKey -> target canonical fieldId
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

  // Per-candidate inline review state
  const [candidateNotes, setCandidateNotes] = useState<Record<string, string>>({});
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Record<string, string>>({});

  // Per-exception resolution note state
  const [exceptionNotes, setExceptionNotes] = useState<Record<string, string>>({});

  const pendingCandidates = useMemo(
    () => (selectedDoc ? selectedDoc.candidates.filter((c) => c.reviewDecision === 'PENDING' || c.requiresHumanReview) : []),
    [selectedDoc]
  );

  const filteredCandidates = useMemo(() => {
    if (!selectedDoc) return [];
    if (statusFilter === 'ALL') return selectedDoc.candidates;
    return selectedDoc.candidates.filter((c) => c.reviewDecision === statusFilter);
  }, [selectedDoc, statusFilter]);

  const openExceptionsCount = useMemo(
    () => exceptions.filter((e) => e.status === 'OPEN').length,
    [exceptions]
  );

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
      setBanner({
        kind: 'ok',
        text: `Saved reusable profile "${profile.profileName}" locally for this project (export JSON to share; server-side multi-user profile persistence awaits reviewed additive migration).`,
      });
    } catch (err: unknown) {
      setBanner({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
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
      setBanner({ kind: 'ok', text: `Exported validated mapping profile "${profile.profileName}".` });
    } catch (err: unknown) {
      setBanner({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
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
        text: `Imported mapping profile "${parsed.profileName}" (${Object.keys(parsed.columnMap).length} mapped columns). Review and click Apply to persist candidate remapping.`,
      });
    } catch (err: unknown) {
      setBanner({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
    }
  }

  function handleApplyColumnMapping(targetMode: 'PENDING' | 'ALL') {
    if (!selectedDoc) return;
    setBanner(null);
    if (!mappingValidation.valid) {
      setBanner({ kind: 'err', text: mappingValidation.errors[0] || 'Resolve mapping conflicts before applying.' });
      return;
    }
    if (!mappingNotes.trim()) {
      setBanner({ kind: 'err', text: 'Audit review notes are required before applying column mappings.' });
      return;
    }
    const targets =
      targetMode === 'PENDING'
        ? selectedDoc.candidates.filter((c) => c.reviewDecision === 'PENDING' || c.requiresHumanReview)
        : selectedDoc.candidates.filter((c) => c.reviewDecision !== 'HUMAN_EXCLUDED');

    if (targets.length === 0) {
      setBanner({ kind: 'err', text: 'No eligible candidates to update for this source document.' });
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
          text: `Applied visual column mapping to ${res.appliedCount} candidate(s) (source SHA-256 ${res.sourceSha256Hash.slice(0, 12)}… preserved; auto-approval disabled).`,
        });
        router.refresh();
      } catch (err: unknown) {
        setBanner({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
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
      setBanner({ kind: 'err', text: `Audit review notes are required for candidate row ${c.sourceRowNumber ?? c.id}.` });
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
          text: `Candidate row ${c.sourceRowNumber ?? c.id} marked ${decision}. Original extracted bytes & hash preserved.`,
        });
        router.refresh();
      } catch (err: unknown) {
        setBanner({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
      }
    });
  }

  function handleResolveException(exc: VisualValidationExceptionRecord) {
    setBanner(null);
    const note = (exceptionNotes[exc.id] ?? '').trim();
    if (!note) {
      setBanner({ kind: 'err', text: `Resolution note is required for exception ${exc.ruleCode}.` });
      return;
    }
    startTransition(async () => {
      try {
        await resolveUboqValidationExceptionAction({
          projectId,
          exceptionId: exc.id,
          resolutionNote: note,
        });
        setBanner({ kind: 'ok', text: `Validation exception ${exc.ruleCode} marked RESOLVED.` });
        router.refresh();
      } catch (err: unknown) {
        setBanner({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
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
          text: 'Regenerated DRAFT operational snapshot from human-verified candidates. Approval remains a separate explicit gate; approved financial baselines were not modified.',
        });
        router.refresh();
      } catch (err: unknown) {
        setBanner({ kind: 'err', text: err instanceof Error ? err.message : String(err) });
      }
    });
  }

  return (
    <section
      style={{
        marginBottom: '32px',
        padding: '20px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.72)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.15rem', margin: '0 0 4px' }}>
            Visual Column-Mapping &amp; Candidate / Exception Review Workbench
          </h2>
          <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
            Inspect extracted source columns, coordinates, confidence scores, and validation exceptions. Review actions stage{' '}
            <strong>DRAFT</strong> snapshots only — never auto-approving BOQs or mutating operational financial baselines.
          </p>
        </div>
        {sourceDocuments.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <label htmlFor="uboq-source-doc-select" style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
              Source Document:
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
              }}
            >
              {sourceDocuments.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.fileName} ({doc.documentRole}) — {doc.candidates.length} candidate(s)
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {selectedDoc && (
        <div
          style={{
            display: 'flex',
            gap: '14px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            borderRadius: '8px',
            background: 'rgba(2, 6, 23, 0.55)',
            border: '1px solid rgba(148,163,184,0.18)',
            fontSize: '0.8rem',
            marginBottom: '16px',
          }}
        >
          <span>
            <strong>Immutable SHA-256:</strong>{' '}
            <code style={{ color: '#38bdf8' }}>{selectedDoc.sha256Hash.slice(0, 16)}…</code>
          </span>
          <span>
            <strong>Vault Lock:</strong> {selectedDoc.isLockedImmutable ? 'LOCKED IMMUTABLE' : 'UNLOCKED'}
          </span>
          <span>
            <strong>Pending Review:</strong> {pendingCandidates.length}
          </span>
          <span>
            <strong>Open Exceptions:</strong> {openExceptionsCount}
          </span>
          {isDocLockedByApproval && (
            <span style={{ color: '#fbbf24', fontWeight: 700 }}>
              APPROVED BASELINE LOCK — Upload a new source revision to modify.
            </span>
          )}
        </div>
      )}

      {banner && (
        <div
          role="status"
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {(
          [
            ['mapping', `Visual Column Mapping (${columnSummaries.length})`],
            ['candidates', `Extraction Candidates (${selectedDoc?.candidates.length ?? 0})`],
            ['exceptions', `Validation Exceptions (${openExceptionsCount} open / ${exceptions.length} total)`],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: activeTab === key ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
              background: activeTab === key ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.6)',
              color: activeTab === key ? '#38bdf8' : '#cbd5e1',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* TAB 1: VISUAL COLUMN MAPPING */}
      {activeTab === 'mapping' && (
        <div>
          {!selectedDoc || columnSummaries.length === 0 ? (
            <div style={{ padding: '18px', color: '#94a3b8', fontSize: '0.88rem' }}>
              No extracted BOQ columns found for this project yet. Upload an Awarded BOQ in{' '}
              <strong>Documents &amp; Intake</strong> to populate source columns for visual mapping.
            </div>
          ) : (
            <>
              {/* Profile Controls */}
              <div
                style={{
                  display: 'flex',
                  gap: '10px',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  marginBottom: '14px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: 'rgba(2, 6, 23, 0.45)',
                  border: '1px solid rgba(148,163,184,0.16)',
                }}
              >
                <input
                  type="text"
                  placeholder="Reusable mapping profile name..."
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    background: '#0f172a',
                    color: '#f8fafc',
                    border: '1px solid rgba(148,163,184,0.3)',
                    fontSize: '0.82rem',
                    minWidth: '220px',
                  }}
                />
                <button
                  type="button"
                  onClick={handleSaveLocalProfile}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '6px',
                    background: 'rgba(56, 189, 248, 0.14)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#38bdf8',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Save Local Preset
                </button>
                <button
                  type="button"
                  onClick={handleExportProfileJson}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '6px',
                    background: 'rgba(148, 163, 184, 0.14)',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    color: '#e2e8f0',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Export Profile JSON
                </button>
                <button
                  type="button"
                  onClick={() => setShowImportBox((v) => !v)}
                  style={{
                    padding: '6px 11px',
                    borderRadius: '6px',
                    background: 'rgba(148, 163, 184, 0.14)',
                    border: '1px solid rgba(148, 163, 184, 0.35)',
                    color: '#e2e8f0',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  {showImportBox ? 'Hide Import' : 'Import Profile JSON'}
                </button>
              </div>

              {showImportBox && (
                <div style={{ marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea
                    rows={4}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder='Paste UBOQ_INPUT_MAPPING_PROFILE_V1 JSON here...'
                    style={{
                      width: '100%',
                      padding: '8px',
                      borderRadius: '6px',
                      background: '#020617',
                      color: '#f8fafc',
                      border: '1px solid rgba(148,163,184,0.35)',
                      fontFamily: 'monospace',
                      fontSize: '0.78rem',
                    }}
                  />
                  <div>
                    <button
                      type="button"
                      onClick={handleImportProfileJson}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        background: '#0ea5e9',
                        color: '#0f172a',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                      }}
                    >
                      Validate &amp; Load Profile
                    </button>
                  </div>
                </div>
              )}

              {!mappingValidation.valid && (
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.45)',
                    color: '#fca5a5',
                    fontSize: '0.82rem',
                  }}
                >
                  <strong>Mapping Validation Blocked:</strong>
                  <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                    {mappingValidation.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                  <thead>
                    <tr style={{ background: '#020617', color: '#38bdf8', textAlign: 'left' }}>
                      <th style={{ padding: '10px' }}>Extracted Source Column</th>
                      <th style={{ padding: '10px' }}>Sample Value</th>
                      <th style={{ padding: '10px' }}>Coordinate</th>
                      <th style={{ padding: '10px' }}>Rows</th>
                      <th style={{ padding: '10px' }}>Avg Confidence</th>
                      <th style={{ padding: '10px' }}>Canonical BOQ Field Mapping</th>
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
                          <td style={{ padding: '10px', fontWeight: 600 }}>
                            <code>{col.sourceColumnKey}</code>
                          </td>
                          <td style={{ padding: '10px', color: '#cbd5e1', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {col.sampleValue}
                          </td>
                          <td style={{ padding: '10px', fontFamily: 'monospace', color: '#94a3b8' }}>
                            {col.sampleCoordinate}
                          </td>
                          <td style={{ padding: '10px' }}>{col.candidateCount}</td>
                          <td style={{ padding: '10px' }}>
                            <span
                              style={{
                                ...confidenceBadgeStyle(col.avgConfidence),
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              {(col.avgConfidence * 100).toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: '10px' }}>
                            <select
                              aria-label={`Map column ${col.sourceColumnKey}`}
                              disabled={!canReview || isDocLockedByApproval || isPending}
                              value={currentTarget}
                              onChange={(e) => setColumnTarget(col.sourceColumnKey, e.target.value)}
                              style={{
                                padding: '6px 8px',
                                borderRadius: '6px',
                                background: '#0f172a',
                                color: '#f8fafc',
                                border: isConflicted
                                  ? '1px solid #ef4444'
                                  : '1px solid rgba(148,163,184,0.35)',
                                fontSize: '0.8rem',
                                minWidth: '240px',
                              }}
                            >
                              <option value="">-- Unmapped / Leave Untouched --</option>
                              {canonicalOptions.map((opt) => (
                                <option key={opt.fieldId} value={opt.fieldId}>
                                  {opt.fieldId} — {opt.suggestedHeading} ({opt.domain})
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
                <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Mandatory audit note for column mapping review..."
                    value={mappingNotes}
                    onChange={(e) => setMappingNotes(e.target.value)}
                    style={{
                      flex: '1 1 280px',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#0f172a',
                      color: '#f8fafc',
                      border: '1px solid rgba(148,163,184,0.35)',
                      fontSize: '0.84rem',
                    }}
                  />
                  <button
                    type="button"
                    disabled={isPending || !mappingValidation.valid || pendingCandidates.length === 0}
                    onClick={() => handleApplyColumnMapping('PENDING')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: '#10b981',
                      color: '#022c22',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '0.83rem',
                      cursor: isPending ? 'wait' : 'pointer',
                      opacity: isPending || !mappingValidation.valid || pendingCandidates.length === 0 ? 0.55 : 1,
                    }}
                  >
                    Apply Mapping &amp; Verify Pending ({pendingCandidates.length})
                  </button>
                  <button
                    type="button"
                    disabled={isPending || !mappingValidation.valid}
                    onClick={() => handleApplyColumnMapping('ALL')}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      background: 'rgba(56, 189, 248, 0.16)',
                      border: '1px solid rgba(56, 189, 248, 0.45)',
                      color: '#38bdf8',
                      fontWeight: 600,
                      fontSize: '0.83rem',
                      cursor: isPending ? 'wait' : 'pointer',
                    }}
                  >
                    Apply to All Active Candidates
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* TAB 2: EXTRACTION CANDIDATES REVIEW */}
      {activeTab === 'candidates' && (
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            {(['ALL', 'PENDING', 'HUMAN_VERIFIED', 'HUMAN_EXCLUDED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  border: statusFilter === st ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
                  background: statusFilter === st ? 'rgba(56, 189, 248, 0.16)' : 'transparent',
                  color: statusFilter === st ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ background: '#020617', color: '#38bdf8', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>Row / Coord</th>
                  <th style={{ padding: '10px' }}>Mapped Fields &amp; Formula</th>
                  <th style={{ padding: '10px' }}>Confidence</th>
                  <th style={{ padding: '10px' }}>Review Status</th>
                  <th style={{ padding: '10px' }}>Reviewer Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                      No extraction candidates match this filter.
                    </td>
                  </tr>
                ) : (
                  filteredCandidates.map((c) => {
                    const eff = extractCandidateEffectiveFields(c);
                    const coords = extractCandidateCellCoordinates(c);
                    const isEditing = editingCandidateId === c.id;
                    return (
                      <tr key={c.id} style={{ borderTop: '1px solid rgba(148,163,184,0.14)', verticalAlign: 'top' }}>
                        <td style={{ padding: '10px', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          <div>Row {c.sourceRowNumber ?? '—'}</div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            {c.sheetOrPageRef || c.sourceCellRef || '—'}
                          </div>
                          {Object.keys(coords).length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                              {Object.entries(coords)
                                .slice(0, 3)
                                .map(([k, v]) => `${k}:${v}`)
                                .join(' ')}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          {isEditing ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(120px, 1fr))', gap: '6px' }}>
                              {(['item_code', 'phase_code', 'work_description', 'unit', 'approved_qty', 'contract_unit_rate'] as const).map(
                                (fk) => (
                                  <label key={fk} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.72rem', color: '#94a3b8' }}>
                                    {fk}
                                    <input
                                      type="text"
                                      value={editFields[fk] ?? ''}
                                      onChange={(e) => setEditFields((prev) => ({ ...prev, [fk]: e.target.value }))}
                                      style={{
                                        padding: '4px 6px',
                                        borderRadius: '4px',
                                        background: '#0f172a',
                                        color: '#f8fafc',
                                        border: '1px solid rgba(148,163,184,0.35)',
                                        fontSize: '0.78rem',
                                      }}
                                    />
                                  </label>
                                )
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {Object.entries(eff).map(([k, v]) => (
                                <span
                                  key={k}
                                  style={{
                                    padding: '2px 7px',
                                    borderRadius: '4px',
                                    background: 'rgba(148,163,184,0.12)',
                                    fontSize: '0.76rem',
                                  }}
                                >
                                  <strong style={{ color: '#94a3b8' }}>{k}:</strong> {v === null ? '—' : String(v)}
                                </span>
                              ))}
                              {c.rawFormulaText && (
                                <span style={{ fontSize: '0.74rem', color: '#fbbf24', fontFamily: 'monospace' }}>
                                  fx: {c.rawFormulaText}
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span
                            style={{
                              ...confidenceBadgeStyle(c.confidenceScore),
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {(c.confidenceScore * 100).toFixed(1)}%
                          </span>
                          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                            {c.extractionMethod}
                          </div>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <span
                            style={{
                              ...decisionBadgeStyle(c.reviewDecision),
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                            }}
                          >
                            {c.reviewDecision}
                          </span>
                          {c.reviewNotes && (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px', maxWidth: '180px' }}>
                              {c.reviewNotes}
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px', minWidth: '240px' }}>
                          {canReview && !isDocLockedByApproval ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <input
                                type="text"
                                placeholder="Audit note..."
                                value={candidateNotes[c.id] ?? ''}
                                onChange={(e) =>
                                  setCandidateNotes((prev) => ({ ...prev, [c.id]: e.target.value }))
                                }
                                style={{
                                  padding: '5px 8px',
                                  borderRadius: '5px',
                                  background: '#0f172a',
                                  color: '#f8fafc',
                                  border: '1px solid rgba(148,163,184,0.3)',
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
                                        padding: '4px 9px',
                                        borderRadius: '5px',
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
                                        padding: '4px 9px',
                                        borderRadius: '5px',
                                        background: 'rgba(56,189,248,0.16)',
                                        color: '#38bdf8',
                                        border: '1px solid rgba(56,189,248,0.4)',
                                        fontSize: '0.76rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Correct
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isPending}
                                      onClick={() => handleCandidateDecision(c, 'HUMAN_EXCLUDED', false)}
                                      style={{
                                        padding: '4px 9px',
                                        borderRadius: '5px',
                                        background: 'rgba(239,68,68,0.16)',
                                        color: '#f87171',
                                        border: '1px solid rgba(239,68,68,0.4)',
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
                                        padding: '4px 9px',
                                        borderRadius: '5px',
                                        background: '#10b981',
                                        color: '#022c22',
                                        border: 'none',
                                        fontWeight: 700,
                                        fontSize: '0.76rem',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      Save &amp; Verify
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingCandidateId(null)}
                                      style={{
                                        padding: '4px 9px',
                                        borderRadius: '5px',
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
                            <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                              {isDocLockedByApproval ? 'Immutable (Approved)' : 'Read-Only'}
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
        </div>
      )}

      {/* TAB 3: VALIDATION EXCEPTIONS */}
      {activeTab === 'exceptions' && (
        <div style={{ overflowX: 'auto', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.2)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead>
              <tr style={{ background: '#020617', color: '#38bdf8', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Severity</th>
                <th style={{ padding: '10px' }}>Rule Code</th>
                <th style={{ padding: '10px' }}>Entity</th>
                <th style={{ padding: '10px' }}>Message</th>
                <th style={{ padding: '10px' }}>Status &amp; Resolution</th>
              </tr>
            </thead>
            <tbody>
              {exceptions.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '16px', textAlign: 'center', color: '#94a3b8' }}>
                    No validation exceptions logged for this project.
                  </td>
                </tr>
              ) : (
                exceptions.map((exc) => (
                  <tr key={exc.id} style={{ borderTop: '1px solid rgba(148,163,184,0.14)', verticalAlign: 'top' }}>
                    <td style={{ padding: '10px', fontWeight: 700, color: exc.severity === 'BLOCKING' ? '#f87171' : '#fbbf24' }}>
                      {exc.severity}
                    </td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>{exc.ruleCode}</td>
                    <td style={{ padding: '10px', color: '#cbd5e1' }}>
                      {exc.entityType} {exc.entityId ? `(${exc.entityId.slice(0, 10)}…)` : ''}
                    </td>
                    <td style={{ padding: '10px', color: '#e2e8f0' }}>{exc.message}</td>
                    <td style={{ padding: '10px', minWidth: '240px' }}>
                      {exc.status === 'OPEN' && canReview ? (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          <input
                            type="text"
                            placeholder="Resolution audit note..."
                            value={exceptionNotes[exc.id] ?? ''}
                            onChange={(e) =>
                              setExceptionNotes((prev) => ({ ...prev, [exc.id]: e.target.value }))
                            }
                            style={{
                              flex: '1 1 140px',
                              padding: '5px 8px',
                              borderRadius: '5px',
                              background: '#0f172a',
                              color: '#f8fafc',
                              border: '1px solid rgba(148,163,184,0.3)',
                              fontSize: '0.78rem',
                            }}
                          />
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleResolveException(exc)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '5px',
                              background: '#38bdf8',
                              color: '#0f172a',
                              border: 'none',
                              fontWeight: 700,
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                            }}
                          >
                            Resolve
                          </button>
                        </div>
                      ) : (
                        <div>
                          <strong style={{ color: exc.status === 'RESOLVED' ? '#34d399' : '#fbbf24' }}>
                            {exc.status}
                          </strong>
                          {exc.resolutionNote && (
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                              {exc.resolutionNote}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Human-Gated DRAFT Regeneration Footer */}
      {selectedDoc && canReview && !isDocLockedByApproval && (
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
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
            Human Approval Gate: Regenerating creates a <strong>DRAFT</strong> operational snapshot only. Explicit
            executive approval is required before any baseline or procurement posting occurs.
          </span>
          <button
            type="button"
            disabled={isPending || pendingCandidates.length > 0}
            onClick={handleRegenerateDraft}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: pendingCandidates.length > 0 ? 'rgba(148,163,184,0.2)' : '#38bdf8',
              color: pendingCandidates.length > 0 ? '#94a3b8' : '#0f172a',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: pendingCandidates.length > 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {pendingCandidates.length > 0
              ? `Resolve ${pendingCandidates.length} Pending Candidate(s) First`
              : 'Regenerate DRAFT Snapshot'}
          </button>
        </div>
      )}
    </section>
  );
}
