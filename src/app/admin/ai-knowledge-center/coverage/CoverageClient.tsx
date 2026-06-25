'use client';

import React from 'react';

interface CoverageClientProps {
  score: number;
  totalTables: number;
  mappedTables: number;
  totalFields: number;
  mappedFields: number;
  uiKeywords: number;
  totalKeywords: number;
}

export default function CoverageClient({
  score, totalTables, mappedTables, totalFields, mappedFields, uiKeywords, totalKeywords
}: CoverageClientProps) {

  let statusColor = 'var(--text-primary)';
  let statusText = 'Not Ready';
  if (score >= 95) {
    statusColor = 'var(--success)';
    statusText = 'Production Ready';
  } else if (score >= 85) {
    statusColor = 'var(--warning)';
    statusText = 'Good but needs review';
  } else if (score >= 70) {
    statusColor = 'var(--warning)';
    statusText = 'Partial Coverage';
  } else {
    statusColor = 'var(--error)';
  }

  return (
    <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
      {/* Score Card */}
      <div style={{
        padding: '30px',
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        textAlign: 'center',
        gridColumn: '1 / -1'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Overall Knowledge Coverage</h2>
        <div style={{ fontSize: '64px', fontWeight: 'bold', color: statusColor }}>
          {score}%
        </div>
        <div style={{ marginTop: '10px', fontSize: '1.2rem', fontWeight: 'bold', color: statusColor }}>
          Status: {statusText}
        </div>
        <p style={{ marginTop: '15px', color: 'var(--text-secondary)' }}>
          To achieve "Production Ready", at least 95% of database tables and fields must be mapped to AI Keywords.
        </p>
      </div>

      {/* Database Tables */}
      <div style={{
        padding: '20px',
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Database Tables</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total Tables</span>
          <span style={{ fontWeight: 'bold' }}>{totalTables}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Mapped Keywords</span>
          <span style={{ fontWeight: 'bold', color: mappedTables >= totalTables ? 'var(--success)' : 'var(--warning)' }}>
            {mappedTables}
          </span>
        </div>
      </div>

      {/* Database Fields */}
      <div style={{
        padding: '20px',
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Database Fields</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total Fields</span>
          <span style={{ fontWeight: 'bold' }}>{totalFields}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Mapped Keywords</span>
          <span style={{ fontWeight: 'bold', color: mappedFields >= totalFields * 0.9 ? 'var(--success)' : 'var(--warning)' }}>
            {mappedFields}
          </span>
        </div>
      </div>

      {/* UI Labels */}
      <div style={{
        padding: '20px',
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Frontend Labels & Text</h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Extracted UI Keywords</span>
          <span style={{ fontWeight: 'bold', color: 'var(--success)' }}>{uiKeywords}</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          These are labels from buttons, headings, and forms that the AI now understands.
        </p>
      </div>

      {/* Total Active Registry */}
      <div style={{
        padding: '20px',
        backgroundColor: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        gridColumn: '1 / -1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h3 style={{ margin: '0 0 5px 0' }}>Total Active Keyword Registry</h3>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>All valid semantic aliases currently powering the Chatbot.</p>
        </div>
        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--accent)' }}>
          {totalKeywords}
        </div>
      </div>
    </div>
  );
}
