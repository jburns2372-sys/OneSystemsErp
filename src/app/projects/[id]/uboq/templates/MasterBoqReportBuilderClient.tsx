'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  MASTER_REPORT_PRESETS,
  projectMasterBoqReport,
  type MasterBoqDataset,
  type MasterReportLayoutConfig,
  type MasterReportPurpose,
} from '@/lib/uboq/master-report-builder';

interface SavedMasterLayout {
  id: string;
  layoutGroupId: string;
  versionNumber: number;
  name: string;
  sharingScope: string;
  createdAt: string;
  config: MasterReportLayoutConfig;
}

interface InputMappingSection {
  sectionId: string;
  sheetOrPageRef: string;
  sectionTitle: string | null;
  headerMap: Record<string, string>;
}

const PURPOSE_OPTIONS: ReadonlyArray<{ id: MasterReportPurpose; label: string; hint: string }> = [
  { id: 'BOQ_SUMMARY', label: '1. Project BOQ Summary', hint: 'Clean awarded pay-item summary with optional cost breakdown' },
  { id: 'ACCOMPLISHMENT_REPORT', label: '2. Accomplishment Report', hint: 'Awarded BOQ + weighted % + previous/current/cumulative progress' },
  { id: 'PROGRESS_BILLING_WORKING_COPY', label: '3. Progress Billing Working Copy', hint: 'First-billing working template with header & signature block (non-certifying)' },
  { id: 'CUSTOM_REPORT', label: '4. Custom Authorized Report', hint: 'Choose any combination of original BOQ and cost-breakdown columns' },
];

function formatCellValue(val: string | number | null | undefined, fmt: string): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'number') {
    if (fmt === 'currency') return `₱ ${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (fmt === 'percent') return `${(val * 100).toFixed(2)}%`;
    return val.toLocaleString('en-PH', { maximumFractionDigits: 4 });
  }
  return String(val);
}

export default function MasterBoqReportBuilderClient({ projectId }: { projectId: string }) {
  const [dataset, setDataset] = useState<MasterBoqDataset | null>(null);
  const [savedLayouts, setSavedLayouts] = useState<SavedMasterLayout[]>([]);
  const [inputMapping, setInputMapping] = useState<InputMappingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [config, setConfig] = useState<MasterReportLayoutConfig>(MASTER_REPORT_PRESETS.BOQ_SUMMARY);
  const [activeLayoutGroupId, setActiveLayoutGroupId] = useState<string | null>(null);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [sharingScope, setSharingScope] = useState<'PRIVATE' | 'PROJECT_SHARED'>('PROJECT_SHARED');
  const [page, setPage] = useState(1);

  // Optional Input Mapping preview state (Phase D)
  const [remapFrom, setRemapFrom] = useState('');
  const [remapTo, setRemapTo] = useState('');
  const [remapPreview, setRemapPreview] = useState<{
    before: { payItems: number; recalculatedTotal: number; discrepancies: number };
    after: { payItems: number; recalculatedTotal: number; discrepancies: number };
  } | null>(null);

  const loadMasterData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/master-boq-report`, {
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || 'Could not load Master BOQ data.');
      }
      setDataset(json.masterSource ?? null);
      setSavedLayouts(Array.isArray(json.savedLayouts) ? json.savedLayouts : []);
      setInputMapping(Array.isArray(json.inputMapping) ? json.inputMapping : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load Master BOQ Report Builder.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadMasterData();
  }, [loadMasterData]);

  const projected = useMemo(() => {
    if (!dataset) return null;
    return projectMasterBoqReport(dataset, config);
  }, [dataset, config]);

  const pageSize = 50;
  const totalPages = projected ? Math.max(1, Math.ceil(projected.rows.length / pageSize)) : 1;
  const safePage = Math.min(page, totalPages);
  const visibleRows = useMemo(() => {
    if (!projected) return [];
    const start = (safePage - 1) * pageSize;
    return projected.rows.slice(start, start + pageSize);
  }, [projected, safePage]);

  function selectPurpose(purpose: MasterReportPurpose) {
    setConfig({ ...MASTER_REPORT_PRESETS[purpose] });
    setActiveLayoutGroupId(null);
    setActiveLayoutId(null);
    setPage(1);
    setNotice(null);
  }

  function toggleColumn(colKey: string) {
    setConfig((prev) => {
      const exists = prev.selectedColumns.includes(colKey);
      const next = exists
        ? prev.selectedColumns.filter((k) => k !== colKey)
        : [...prev.selectedColumns, colKey];
      return { ...prev, selectedColumns: next.length > 0 ? next : prev.selectedColumns };
    });
  }

  function moveColumn(colKey: string, delta: -1 | 1) {
    setConfig((prev) => {
      const idx = prev.selectedColumns.indexOf(colKey);
      const target = idx + delta;
      if (idx < 0 || target < 0 || target >= prev.selectedColumns.length) return prev;
      const copy = [...prev.selectedColumns];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return { ...prev, selectedColumns: copy };
    });
  }

  function renameHeading(colKey: string, heading: string) {
    setConfig((prev) => ({
      ...prev,
      headingAliases: { ...prev.headingAliases, [colKey]: heading },
    }));
  }

  function toggleSection(sec: string) {
    setConfig((prev) => {
      const exists = prev.selectedSections.includes(sec);
      const next = exists ? prev.selectedSections.filter((s) => s !== sec) : [...prev.selectedSections, sec];
      return { ...prev, selectedSections: next };
    });
    setPage(1);
  }

  async function handleExportXlsx() {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/master-boq-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'EXPORT_XLSX', config }),
      });
      if (!res.ok) throw new Error('Export failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.purpose.toLowerCase()}_${projectId.slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice('Validated XLSX report exported (original awarded BOQ remains immutable).');
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Unable to export XLSX.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveLayout(mode: 'SAVE_LAYOUT' | 'DUPLICATE_LAYOUT') {
    const cleanName = layoutName.trim() || `${config.reportTitle} Layout`;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/master-boq-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          layoutName: mode === 'DUPLICATE_LAYOUT' ? `${cleanName} (Copy)` : cleanName,
          sharingScope,
          layoutGroupId: mode === 'SAVE_LAYOUT' ? activeLayoutGroupId : null,
          sourceLayoutId: mode === 'DUPLICATE_LAYOUT' ? activeLayoutId : null,
          config,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Could not save layout.');
      setActiveLayoutGroupId(json.saved?.layoutGroupId ?? null);
      setActiveLayoutId(json.saved?.id ?? null);
      setNotice(`Saved reusable layout "${json.saved?.templateName}" (v${json.saved?.versionNumber}).`);
      await loadMasterData();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : 'Failed to save layout.');
    } finally {
      setBusy(false);
    }
  }

  async function handlePreviewRemap() {
    if (!remapFrom || !remapTo) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/master-boq-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'PREVIEW_INPUT_MAPPING', fieldRemap: { [remapFrom]: remapTo } }),
      });
      const json = await res.json();
      if (res.ok && json.preview) setRemapPreview(json.preview);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p role="status" style={{ color: '#94a3b8' }}>Loading Master BOQ Report Template Builder…</p>;
  }
  if (error) {
    return <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>;
  }
  if (!dataset || !projected) {
    return (
      <section style={{ padding: '18px 20px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.78)', border: '1px solid rgba(56, 189, 248, 0.35)', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 8px', color: '#f8fafc' }}>Master BOQ Report Template Builder</h2>
        <p style={{ margin: '0 0 12px', color: '#94a3b8', fontSize: '0.88rem' }}>
          Upload a Final Awarded BOQ in Documents &amp; Intake first. Once extracted, it automatically becomes the immutable Master BOQ source for Summaries, Accomplishment Reports, and Progress Billing Working Copies—with zero manual item approvals.
        </p>
        <Link href={`/projects/${encodeURIComponent(projectId)}/documents`} style={{ color: '#38bdf8', fontWeight: 700 }}>
          Open Documents &amp; Intake &rarr;
        </Link>
      </section>
    );
  }

  return (
    <section
      aria-label="Master BOQ Report Template Builder"
      data-testid="master-boq-report-builder"
      style={{
        marginBottom: '28px',
        padding: '20px',
        borderRadius: '14px',
        background: 'rgba(15, 23, 42, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.4)',
        color: '#f8fafc',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: '1.2rem' }}>MASTER BOQ REPORT TEMPLATE BUILDER</h2>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
            Master Source: <strong style={{ color: '#e2e8f0' }}>{dataset.sourceFileName}</strong> · {dataset.payItemCount.toLocaleString()} priced pay items ·
            Recalculated Total: <strong style={{ color: '#6ee7b7' }}>₱ {dataset.recalculatedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong> ·
            SHA-256 {dataset.sourceSha256Hash.slice(0, 12)}… · <em>Immutable read-only source (zero manual BOQ approvals)</em>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            disabled={busy}
            onClick={handleExportXlsx}
            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#10b981', color: '#022c22', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Export Validated XLSX
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(30,41,59,0.85)', color: '#e2e8f0', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Missing Official Contract Disclosure (Never Invents Authority) */}
      {projected.officialContractDisclosure && (
        <div role="status" style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.45)', color: '#fde68a', fontSize: '0.82rem' }}>
          <strong>{projected.officialContractDisclosure}</strong> You can still configure, preview, save, and export read-only working report layouts below.
        </div>
      )}

      {/* Zero-Basis Accomplishment / Billing Working Copy Disclosure */}
      {(config.purpose === 'ACCOMPLISHMENT_REPORT' || config.purpose === 'PROGRESS_BILLING_WORKING_COPY') && !projected.hasVerifiedProgressRecords && (
        <div role="status" style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#bae6fd', fontSize: '0.81rem' }}>
          <strong>Zero-Basis Working Copy:</strong> No verified site accomplishment or prior billing certification records are posted yet. Accomplishment columns default to 0.00 (never invented). This working copy does NOT certify billing or authorize payment.
        </div>
      )}

      {/* 1. Purpose Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {PURPOSE_OPTIONS.map((p) => {
          const active = config.purpose === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => selectPurpose(p.id)}
              style={{
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                border: active ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
                background: active ? 'rgba(56, 189, 248, 0.16)' : 'rgba(15, 23, 42, 0.7)',
                color: '#f8fafc',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{p.label}</div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>{p.hint}</div>
            </button>
          );
        })}
      </div>

      {/* 2. Column Picker (Include/Exclude, Rename Heading, Reorder Left/Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 1fr) minmax(300px, 1.4fr)', gap: '14px', marginBottom: '16px' }}>
        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.65)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '8px' }}>Available Master &amp; Source Columns ({dataset.availableColumns.length})</div>
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '5px', fontSize: '0.8rem' }}>
            {dataset.availableColumns.map((col) => {
              const checked = config.selectedColumns.includes(col.key);
              return (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', color: checked ? '#f8fafc' : '#94a3b8' }}>
                  <input type="checkbox" checked={checked} onChange={() => toggleColumn(col.key)} />
                  <span>{col.defaultHeading}</span>
                  <span style={{ fontSize: '0.68rem', color: '#64748b' }}>({col.group})</span>
                </label>
              );
            })}
          </div>
        </div>

        <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.65)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '8px' }}>Selected Output Columns — Rename &amp; Reorder ({config.selectedColumns.length})</div>
          <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'grid', gap: '6px' }}>
            {config.selectedColumns.map((key, idx) => {
              const def = dataset.availableColumns.find((c) => c.key === key);
              if (!def) return null;
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', fontSize: '0.74rem', color: '#64748b' }}>{idx + 1}.</span>
                  <input
                    type="text"
                    value={config.headingAliases[key] ?? def.defaultHeading}
                    onChange={(e) => renameHeading(key, e.target.value)}
                    aria-label={`Heading for ${def.defaultHeading}`}
                    style={{ flex: 1, padding: '4px 8px', borderRadius: '5px', border: '1px solid rgba(148,163,184,0.3)', background: '#0f172a', color: '#f8fafc', fontSize: '0.78rem' }}
                  />
                  <button type="button" onClick={() => moveColumn(key, -1)} disabled={idx === 0} aria-label={`Move ${def.defaultHeading} left`} style={{ padding: '3px 7px', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}>&larr;</button>
                  <button type="button" onClick={() => moveColumn(key, 1)} disabled={idx === config.selectedColumns.length - 1} aria-label={`Move ${def.defaultHeading} right`} style={{ padding: '3px 7px', borderRadius: '4px', border: '1px solid rgba(148,163,184,0.3)', background: '#1e293b', color: '#e2e8f0', cursor: 'pointer' }}>&rarr;</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Report Header, Row Filters & Persistent Saved Layouts */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px', fontSize: '0.8rem' }}>
        <input
          type="text"
          value={config.reportTitle}
          onChange={(e) => setConfig((p) => ({ ...p, reportTitle: e.target.value }))}
          placeholder="Report Title"
          aria-label="Report Title"
          style={{ padding: '6px 9px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#0f172a', color: '#f8fafc', minWidth: '220px' }}
        />
        <input
          type="text"
          value={config.periodEnding}
          onChange={(e) => setConfig((p) => ({ ...p, periodEnding: e.target.value }))}
          placeholder="Period Ending (optional)"
          aria-label="Period Ending"
          style={{ padding: '6px 9px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#0f172a', color: '#f8fafc', width: '165px' }}
        />
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={config.includeHeadings} onChange={(e) => setConfig((p) => ({ ...p, includeHeadings: e.target.checked }))} /> Headings
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={config.includeNotes} onChange={(e) => setConfig((p) => ({ ...p, includeNotes: e.target.checked }))} /> Notes
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={config.includeSubtotals} onChange={(e) => setConfig((p) => ({ ...p, includeSubtotals: e.target.checked }))} /> Subtotals
        </label>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <input type="checkbox" checked={config.showSignatureBlock} onChange={(e) => setConfig((p) => ({ ...p, showSignatureBlock: e.target.checked }))} /> Signature Block
        </label>
      </div>

      {/* Section Filter Chips */}
      {dataset.sections.length > 1 && (
        <details style={{ marginBottom: '14px', padding: '8px 12px', borderRadius: '8px', background: 'rgba(2,6,23,0.55)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <summary style={{ cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>
            Filter by Sections / Groups ({config.selectedSections.length === 0 ? `All ${dataset.sections.length}` : `${config.selectedSections.length} selected`})
          </summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', maxHeight: '130px', overflowY: 'auto' }}>
            {dataset.sections.map((sec) => {
              const sel = config.selectedSections.includes(sec);
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => toggleSection(sec)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.73rem',
                    border: sel ? '1px solid #38bdf8' : '1px solid rgba(148,163,184,0.25)',
                    background: sel ? 'rgba(56,189,248,0.2)' : '#0f172a',
                    color: '#e2e8f0',
                    cursor: 'pointer',
                  }}
                >
                  {sec}
                </button>
              );
            })}
          </div>
        </details>
      )}

      {/* Persistent Saved Layouts Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '14px', padding: '10px 12px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.55)', border: '1px solid rgba(148,163,184,0.2)' }}>
        <input
          type="text"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          placeholder="Reusable layout name (e.g. PGH Monthly Billing)"
          aria-label="Reusable layout name"
          style={{ padding: '6px 9px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#0f172a', color: '#f8fafc', fontSize: '0.8rem', minWidth: '240px' }}
        />
        <select
          value={sharingScope}
          onChange={(e) => setSharingScope(e.target.value as 'PRIVATE' | 'PROJECT_SHARED')}
          aria-label="Layout sharing scope"
          style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.3)', background: '#0f172a', color: '#f8fafc', fontSize: '0.8rem' }}
        >
          <option value="PROJECT_SHARED">Project Shared</option>
          <option value="PRIVATE">Private</option>
        </select>
        <button type="button" disabled={busy} onClick={() => handleSaveLayout('SAVE_LAYOUT')} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 600, fontSize: '0.79rem', cursor: 'pointer' }}>
          {activeLayoutGroupId ? 'Save New Version' : 'Save Layout'}
        </button>
        {activeLayoutId && (
          <button type="button" disabled={busy} onClick={() => handleSaveLayout('DUPLICATE_LAYOUT')} style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(148,163,184,0.35)', background: '#1e293b', color: '#e2e8f0', fontSize: '0.79rem', cursor: 'pointer' }}>
            Duplicate Layout
          </button>
        )}
        {savedLayouts.length > 0 && (
          <select
            value={activeLayoutId ?? ''}
            onChange={(e) => {
              const found = savedLayouts.find((l) => l.id === e.target.value);
              if (found) {
                setConfig(found.config);
                setLayoutName(found.name);
                setActiveLayoutGroupId(found.layoutGroupId);
                setActiveLayoutId(found.id);
                setPage(1);
              }
            }}
            aria-label="Open saved layout"
            style={{ padding: '6px 8px', borderRadius: '6px', border: '1px solid rgba(56,189,248,0.45)', background: '#0f172a', color: '#7dd3fc', fontSize: '0.8rem' }}
          >
            <option value="">Reopen Saved Layout ({savedLayouts.length})…</option>
            {savedLayouts.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} (v{l.versionNumber} · {l.sharingScope === 'PROJECT_SHARED' ? 'Shared' : 'Private'})
              </option>
            ))}
          </select>
        )}
      </div>

      {notice && (
        <div role="status" style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '6px', background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.4)', color: '#6ee7b7', fontSize: '0.8rem' }}>
          {notice}
        </div>
      )}

      {/* 4. Live Report Preview Table */}
      <div style={{ overflowX: 'auto', maxHeight: '460px', overflowY: 'auto', borderRadius: '8px', border: '1px solid rgba(148,163,184,0.22)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.79rem', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: '#020617', position: 'sticky', top: 0, zIndex: 1 }}>
              {projected.columns.map((c) => (
                <th
                  key={c.key}
                  style={{
                    padding: '8px 9px',
                    textAlign: c.format === 'currency' || c.format === 'number' || c.format === 'percent' ? 'right' : 'left',
                    borderBottom: '1px solid rgba(148,163,184,0.28)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const isHeading = row.classification === 'HEADING' || row.classification === 'SUBHEADING';
              return (
                <tr key={row.id} style={{ borderTop: '1px solid rgba(148,163,184,0.12)', background: isHeading ? 'rgba(30,41,59,0.55)' : 'transparent', fontWeight: isHeading ? 700 : 400 }}>
                  {projected.columns.map((c) => (
                    <td
                      key={c.key}
                      style={{
                        padding: '7px 9px',
                        textAlign: c.format === 'currency' || c.format === 'number' || c.format === 'percent' ? 'right' : 'left',
                        whiteSpace: c.key === 'description' ? 'normal' : 'nowrap',
                      }}
                    >
                      {formatCellValue(row.values[c.key], c.format)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: '#020617', fontWeight: 700 }}>
              {projected.columns.map((c) => {
                let txt = '';
                if (c.key === 'description') txt = `TOTAL PROJECT COST (${projected.totals.payItemCount.toLocaleString()} items)`;
                else if (c.key === 'finalLineAmount') txt = formatCellValue(projected.totals.contractTotal, 'currency');
                else if (c.key === 'weightedPct') txt = formatCellValue(projected.totals.weightedPctSum, 'percent');
                else if (c.key === 'previousAccomplishmentAmt') txt = formatCellValue(projected.totals.previousAccomplishmentTotal, 'currency');
                else if (c.key === 'thisPeriodAmt' || c.key === 'currentPeriodAmt') txt = formatCellValue(projected.totals.currentPeriodTotal, 'currency');
                else if (c.key === 'cumulativeAccomplishmentAmt') txt = formatCellValue(projected.totals.cumulativeAccomplishmentTotal, 'currency');
                else if (c.key === 'percentCompleted') txt = formatCellValue(projected.totals.overallPercentCompleted, 'percent');
                return (
                  <td key={c.key} style={{ padding: '9px', textAlign: c.format === 'currency' || c.format === 'percent' ? 'right' : 'left', borderTop: '1px solid rgba(148,163,184,0.35)', color: '#6ee7b7' }}>
                    {txt}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '0.78rem', color: '#94a3b8' }}>
          <span>Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, projected.rows.length)} of {projected.rows.length.toLocaleString()} rows</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ padding: '4px 9px', borderRadius: '5px', background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.3)' }}>Previous</button>
            <span>Page {safePage} / {totalPages}</span>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} style={{ padding: '4px 9px', borderRadius: '5px', background: '#0f172a', color: '#e2e8f0', border: '1px solid rgba(148,163,184,0.3)' }}>Next</button>
          </div>
        </div>
      )}

      {/* Phase D: Optional Source Input Mapping (Auto-Mapped by Default, Zero Item Approval) */}
      <details style={{ marginTop: '16px', padding: '12px 14px', borderRadius: '8px', background: 'rgba(2, 6, 23, 0.55)', border: '1px solid rgba(148,163,184,0.22)' }}>
        <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '0.84rem', color: '#cbd5e1' }}>
          Optional Source Input Mapping (Auto-Mapped — No Action Needed Unless Client Layout Is Unfamiliar)
        </summary>
        <p style={{ margin: '8px 0', fontSize: '0.78rem', color: '#94a3b8' }}>
          Input mapping controls how unfamiliar client columns map into ERP fields. It never alters original awarded quantities or rates and does not require item-by-item BOQ approval.
        </p>
        {inputMapping.map((sec) => (
          <div key={sec.sectionId} style={{ marginBottom: '8px', fontSize: '0.77rem' }}>
            <strong>Worksheet: {sec.sheetOrPageRef}</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {Object.entries(sec.headerMap).map(([colIdx, fieldId]) => (
                <span key={colIdx} style={{ padding: '2px 7px', borderRadius: '4px', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', color: '#7dd3fc' }}>
                  Col {Number(colIdx) + 1} &rarr; {fieldId}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '10px' }}>
          <input type="text" value={remapFrom} onChange={(e) => setRemapFrom(e.target.value)} placeholder="Source field key (e.g. estimated_direct_cost)" style={{ padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(148,163,184,0.3)', background: '#0f172a', color: '#f8fafc', fontSize: '0.78rem' }} />
          <span>&rarr;</span>
          <input type="text" value={remapTo} onChange={(e) => setRemapTo(e.target.value)} placeholder="Target canonical field (e.g. contract_line_amount)" style={{ padding: '5px 8px', borderRadius: '5px', border: '1px solid rgba(148,163,184,0.3)', background: '#0f172a', color: '#f8fafc', fontSize: '0.78rem' }} />
          <button type="button" disabled={busy || !remapFrom || !remapTo} onClick={handlePreviewRemap} style={{ padding: '5px 10px', borderRadius: '5px', border: 'none', background: '#38bdf8', color: '#0f172a', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
            Preview Recalculation
          </button>
        </div>
        {remapPreview && (
          <div style={{ marginTop: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
            Before: {remapPreview.before.payItems} pay items, ₱ {remapPreview.before.recalculatedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({remapPreview.before.discrepancies} issues) &rarr; After: {remapPreview.after.payItems} pay items, ₱ {remapPreview.after.recalculatedTotal.toLocaleString('en-PH', { minimumFractionDigits: 2 })} ({remapPreview.after.discrepancies} issues)
          </div>
        )}
      </details>
    </section>
  );
}
