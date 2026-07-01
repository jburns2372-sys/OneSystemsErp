'use client';

import { useState } from 'react';

export default function CleanupClient({ totalKeywords, lastReport, adminUserId }: { totalKeywords: number, lastReport: any, adminUserId: string }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(lastReport);

  const runCleanup = async () => {
    if (!confirm("Are you sure you want to run the massive Deduplication and Cleanup engine? This will merge thousands of duplicate keywords.")) return;
    
    setLoading(true);
    try {
      // In a real app we'd call a Next.js API route here.
      // For demonstration, we will just simulate it or call a server action.
      // Assuming we had a server action `runAiCleanup(adminUserId)`
      const res = await fetch('/api/admin/run-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminUserId })
      });
      const data = await res.json();
      setReport(data.report);
      alert("Cleanup completed successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to run cleanup");
    } finally {
      setLoading(false);
    }
  };

  const runRollback = async () => {
    if (!report || !report.rollbackSupported) return;
    if (!confirm("Are you sure you want to rollback the last cleanup?")) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/rollback-cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: report.id })
      });
      if (res.ok) {
        alert("Rollback successful. Keywords have been restored.");
        setReport({ ...report, rolledBackAt: new Date().toISOString() });
      }
    } catch (e) {
      console.error(e);
      alert("Rollback failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
      
      <div style={{ padding: '20px', background: 'var(--bg-panel)', borderRadius: '12px' }}>
        <h2>Current Registry Status</h2>
        <h1 style={{ fontSize: '3rem', color: 'var(--brand-primary)' }}>{totalKeywords}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Active Keywords Currently Indexed</p>

        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <button 
            onClick={runCleanup} 
            disabled={loading}
            style={{ padding: '10px 20px', background: 'var(--brand-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            {loading ? 'Running Cleanup Engine...' : 'Execute Safe Cleanup'}
          </button>
        </div>
      </div>

      {report && (
        <div style={{ padding: '20px', background: 'var(--bg-panel)', borderRadius: '12px' }}>
          <h2>Last Cleanup Report</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Run at: {new Date(report.runAt).toLocaleString()}
          </p>
          
          <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <li><strong>Total Rows Scanned:</strong> {report.totalRowsScanned}</li>
            <li><strong>Duplicate Groups Found:</strong> {report.duplicateGroupsFound}</li>
            <li style={{ color: 'var(--status-warning)' }}><strong>Rows Merged (Deactivated):</strong> {report.rowsMerged}</li>
            <li style={{ color: 'var(--status-info)' }}><strong>Schema Fields Migrated:</strong> {report.schemaFieldsMoved}</li>
            <li style={{ color: 'var(--status-info)' }}><strong>UI Labels Migrated:</strong> {report.uiLabelsMoved}</li>
            <li style={{ color: 'var(--status-success)' }}><strong>Active Rows Remaining:</strong> {report.activeRowsRemaining}</li>
          </ul>

          {report.rolledBackAt ? (
            <p style={{ color: 'var(--status-error)', fontWeight: 'bold' }}>
              Rolled back on {new Date(report.rolledBackAt).toLocaleString()}
            </p>
          ) : (
            <button 
              onClick={runRollback}
              disabled={loading || !report.rollbackSupported}
              style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--status-error)', color: 'var(--status-error)', borderRadius: '6px', cursor: 'pointer' }}>
              Rollback Cleanup
            </button>
          )}
        </div>
      )}

    </div>
  );
}
