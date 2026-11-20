'use client';

import React, { useMemo, useState } from 'react';
import type {
  AwardedBoqVerificationReport,
  ClassifiedAwardedBoqRow,
} from '@/lib/uboq/awarded-boq-reconciler';

interface ReadOnlyAwardedBoqTableProps {
  sourceFileName: string;
  sourceSha256Hash?: string | null;
  verification: AwardedBoqVerificationReport;
  pageSize?: number;
}

type RowFilterMode = 'ALL' | 'PAY_ITEMS' | 'DISCREPANCIES';

function fmtNumber(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  return val.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtQty(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  const isInt = Math.abs(val - Math.round(val)) < 1e-9;
  return val.toLocaleString('en-PH', {
    minimumFractionDigits: isInt ? 0 : 2,
    maximumFractionDigits: 4,
  });
}

function fmtPhp(val: number | null | undefined): string {
  if (val === null || val === undefined || !Number.isFinite(val)) return '—';
  return `₱ ${fmtNumber(val, 2)}`;
}

function rowStatusBadge(row: ClassifiedAwardedBoqRow): {
  label: string;
  bg: string;
  color: string;
  border: string;
} {
  if (row.hasDiscrepancy) {
    return {
      label: 'Discrepancy',
      bg: 'rgba(239, 68, 68, 0.16)',
      color: '#fca5a5',
      border: '1px solid rgba(239, 68, 68, 0.45)',
    };
  }
  switch (row.classification) {
    case 'PAY_ITEM':
      return {
        label: 'Verified',
        bg: 'rgba(16, 185, 129, 0.14)',
        color: '#6ee7b7',
        border: '1px solid rgba(16, 185, 129, 0.4)',
      };
    case 'HEADING':
    case 'SUBHEADING':
      return {
        label: 'Section Heading',
        bg: 'rgba(56, 189, 248, 0.12)',
        color: '#7dd3fc',
        border: '1px solid rgba(56, 189, 248, 0.3)',
      };
    case 'SUBTOTAL':
      return {
        label: 'Subtotal',
        bg: 'rgba(148, 163, 184, 0.14)',
        color: '#cbd5e1',
        border: '1px solid rgba(148, 163, 184, 0.35)',
      };
    case 'GRAND_TOTAL':
      return {
        label: 'Grand Total',
        bg: 'rgba(139, 92, 246, 0.18)',
        color: '#ddd6fe',
        border: '1px solid rgba(167, 139, 250, 0.4)',
      };
    case 'PRICE_COMPONENT':
      return {
        label: 'Price Component',
        bg: 'rgba(245, 158, 11, 0.14)',
        color: '#fde68a',
        border: '1px solid rgba(245, 158, 11, 0.35)',
      };
    default:
      return {
        label: 'Note',
        bg: 'rgba(100, 116, 139, 0.16)',
        color: '#94a3b8',
        border: '1px solid rgba(148, 163, 184, 0.25)',
      };
  }
}

/**
 * Pure read-only Awarded BOQ results viewer.
 *
 * Business rule: An uploaded Awarded Contract BOQ is FINAL and immutable.
 * Zero per-item review/approval actions, item approval counters, or draft/submit controls are rendered here.
 * HEADER_META column legends (e.g. "(1)", "(2)", "(3)") are automatically excluded from payable items.
 */
export default function ReadOnlyAwardedBoqTable({
  sourceFileName,
  sourceSha256Hash,
  verification,
  pageSize = 100,
}: ReadOnlyAwardedBoqTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<RowFilterMode>('ALL');
  const [selectedSheet, setSelectedSheet] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);

  // Exclude HEADER_META legends (e.g. "(1)", "(2)", "(3)") from the user-facing BOQ rows.
  const visibleBaseRows = useMemo(
    () => verification.classifiedRows.filter((r) => r.classification !== 'HEADER_META'),
    [verification.classifiedRows]
  );

  const headerMetaExcludedCount = verification.classifiedRows.length - visibleBaseRows.length;

  const worksheetNames = useMemo(() => {
    const names = new Set<string>();
    for (const r of visibleBaseRows) {
      if (r.worksheet) names.add(r.worksheet);
    }
    return Array.from(names);
  }, [visibleBaseRows]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return visibleBaseRows.filter((r) => {
      if (selectedSheet !== 'ALL' && r.worksheet !== selectedSheet) return false;
      if (filterMode === 'PAY_ITEMS' && r.classification !== 'PAY_ITEM') return false;
      if (filterMode === 'DISCREPANCIES' && !r.hasDiscrepancy) return false;
      if (q) {
        const hay = `${r.itemCode ?? ''} ${r.description} ${r.unit ?? ''} ${r.cellRef}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [visibleBaseRows, selectedSheet, filterMode, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const discrepancyRowCount = useMemo(
    () => visibleBaseRows.filter((r) => r.hasDiscrepancy).length,
    [visibleBaseRows]
  );

  return (
    <section
      aria-label="Read-Only Final Awarded BOQ Results"
      data-testid="readonly-awarded-boq-table"
      style={{
        marginBottom: '24px',
        padding: '18px 20px',
        borderRadius: '12px',
        background: 'rgba(15, 23, 42, 0.78)',
        border: '1px solid rgba(148, 163, 184, 0.25)',
      }}
    >
      {/* Header & Read-Only Immutability Notice */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0, fontSize: '1.08rem', color: '#f8fafc' }}>
              Final Awarded BOQ — Read-Only Results
            </h2>
            <span
              style={{
                padding: '2px 9px',
                borderRadius: '999px',
                background: 'rgba(56, 189, 248, 0.14)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: '#7dd3fc',
                fontSize: '0.73rem',
                fontWeight: 700,
              }}
            >
              Immutable Source · Zero Manual Item Approvals Required
            </span>
          </div>
          <p style={{ margin: '5px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
            Source file: <strong style={{ color: '#e2e8f0' }}>{sourceFileName}</strong>
            {sourceSha256Hash ? ` · SHA-256 ${sourceSha256Hash.slice(0, 12)}…` : ''}
            {' · '}
            {verification.counts.payItems.toLocaleString()} priced pay items ·{' '}
            {verification.counts.headingsAndNotes.toLocaleString()} headings/notes separated
            {headerMetaExcludedCount > 0
              ? ` · ${headerMetaExcludedCount} column-legend header row(s) excluded from payable items`
              : ''}
          </p>
        </div>
      </div>

      {/* Missing Official Contract Amount Banner (Never Invents Contract Authority) */}
      {verification.officialAwardedContractAmount === null && (
        <div
          role="status"
          style={{
            marginBottom: '14px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.45)',
            color: '#fde68a',
            fontSize: '0.83rem',
          }}
        >
          <strong>Official Awarded Contract Amount Required:</strong> The extracted Awarded BOQ is shown read-only below,
          with recalculated total <strong>{fmtPhp(verification.recalculatedTotal)}</strong>. Record the independent official
          awarded contract amount from the signed Contract Agreement or Notice of Award to complete reconciliation. No
          contract authority has been assumed or invented.
        </div>
      )}

      {/* Search, Sheet & Row-Type Filter Controls (Purely Read-Only Filtering) */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search item code or description…"
            aria-label="Search BOQ items"
            style={{
              padding: '7px 11px',
              borderRadius: '7px',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              background: '#0f172a',
              color: '#f8fafc',
              fontSize: '0.82rem',
              minWidth: '230px',
            }}
          />

          {worksheetNames.length > 1 && (
            <select
              value={selectedSheet}
              onChange={(e) => {
                setSelectedSheet(e.target.value);
                setPage(1);
              }}
              aria-label="Filter by worksheet"
              style={{
                padding: '7px 10px',
                borderRadius: '7px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: '#0f172a',
                color: '#f8fafc',
                fontSize: '0.82rem',
              }}
            >
              <option value="ALL">All Worksheets ({worksheetNames.length})</option>
              {worksheetNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(
            [
              ['ALL', `All Rows (${visibleBaseRows.length})`],
              ['PAY_ITEMS', `Pay Items (${verification.counts.payItems})`],
              ['DISCREPANCIES', `Discrepancies (${discrepancyRowCount})`],
            ] as const
          ).map(([mode, label]) => {
            const active = filterMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setFilterMode(mode);
                  setPage(1);
                }}
                style={{
                  padding: '6px 11px',
                  borderRadius: '7px',
                  border: active
                    ? '1px solid rgba(56, 189, 248, 0.65)'
                    : '1px solid rgba(148, 163, 184, 0.28)',
                  background: active ? 'rgba(56, 189, 248, 0.18)' : 'rgba(15, 23, 42, 0.85)',
                  color: active ? '#f8fafc' : '#cbd5e1',
                  fontSize: '0.78rem',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Read-Only BOQ Table */}
      <div
        style={{
          overflowX: 'auto',
          borderRadius: '8px',
          border: '1px solid rgba(148, 163, 184, 0.22)',
          maxHeight: '620px',
          overflowY: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', color: '#e2e8f0' }}>
          <thead>
            <tr style={{ background: '#020617', color: '#cbd5e1', textAlign: 'left', position: 'sticky', top: 0, zIndex: 1 }}>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)', whiteSpace: 'nowrap' }}>Item Code</th>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)', minWidth: '260px' }}>Description</th>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)' }}>Unit</th>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)', textAlign: 'right' }}>Source Qty</th>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)', textAlign: 'right' }}>Unit Price</th>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)', textAlign: 'right' }}>Final Line Amount</th>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)', textAlign: 'right' }}>Recalculated</th>
              <th style={{ padding: '9px 10px', borderBottom: '1px solid rgba(148,163,184,0.25)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                  {filterMode === 'DISCREPANCIES'
                    ? 'No calculation or formula discrepancies found.'
                    : 'No BOQ rows match the current filter.'}
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => {
                const isHeading = row.classification === 'HEADING' || row.classification === 'SUBHEADING';
                const isTotal = row.classification === 'SUBTOTAL' || row.classification === 'GRAND_TOTAL';
                const badge = rowStatusBadge(row);
                const finalDisplayAmount = row.lineAmount ?? row.recalculatedAmount;
                return (
                  <tr
                    key={`${row.worksheet}-${row.rowNumber}-${row.cellRef}-${idx}`}
                    style={{
                      borderTop: '1px solid rgba(148, 163, 184, 0.14)',
                      background: row.hasDiscrepancy
                        ? 'rgba(239, 68, 68, 0.08)'
                        : isHeading
                          ? 'rgba(30, 41, 59, 0.55)'
                          : isTotal
                            ? 'rgba(56, 189, 248, 0.08)'
                            : 'transparent',
                      fontWeight: isHeading || isTotal ? 700 : 400,
                    }}
                  >
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: isHeading ? '#7dd3fc' : '#cbd5e1' }}>
                      {row.itemCode || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', color: isHeading ? '#f8fafc' : '#e2e8f0' }}>
                      {row.description}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                      {row.unit || '—'}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {fmtQty(row.quantity)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {fmtNumber(row.unitPrice)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap', fontWeight: 600 }}>
                      {fmtPhp(finalDisplayAmount)}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'right', whiteSpace: 'nowrap', color: row.hasDiscrepancy ? '#fca5a5' : '#94a3b8' }}>
                      {fmtPhp(row.recalculatedAmount)}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          background: badge.bg,
                          color: badge.color,
                          border: badge.border,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}
                      >
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#020617', color: '#f8fafc', fontWeight: 700 }}>
              <td colSpan={5} style={{ padding: '10px', textAlign: 'right', borderTop: '1px solid rgba(148,163,184,0.3)' }}>
                Computed BOQ Total ({verification.counts.payItems.toLocaleString()} Priced Pay Items):
              </td>
              <td style={{ padding: '10px', textAlign: 'right', borderTop: '1px solid rgba(148,163,184,0.3)', color: '#38bdf8', whiteSpace: 'nowrap' }}>
                {fmtPhp(verification.workbookStatedGrandTotal ?? verification.recalculatedTotal)}
              </td>
              <td style={{ padding: '10px', textAlign: 'right', borderTop: '1px solid rgba(148,163,184,0.3)', color: '#6ee7b7', whiteSpace: 'nowrap' }}>
                {fmtPhp(verification.recalculatedTotal)}
              </td>
              <td style={{ padding: '10px', borderTop: '1px solid rgba(148,163,184,0.3)', fontSize: '0.75rem', color: '#cbd5e1' }}>
                {verification.calculationCheck}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div
          style={{
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            fontSize: '0.8rem',
            color: '#94a3b8',
          }}
        >
          <span>
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredRows.length)} of{' '}
            {filteredRows.length.toLocaleString()} rows
          </span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: '#0f172a',
                color: safePage <= 1 ? '#475569' : '#e2e8f0',
                cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
              }}
            >
              Previous
            </button>
            <span style={{ padding: '5px 8px', color: '#e2e8f0' }}>
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{
                padding: '5px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: '#0f172a',
                color: safePage >= totalPages ? '#475569' : '#e2e8f0',
                cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
