'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ValidationDetailClient({ project, validationRecords, validationScore, billings = [] }: any) {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [selectedBillingId, setSelectedBillingId] = useState(billings.length > 0 ? billings[0].id : 'ALL');

  const tabs = [
    { id: 'OVERVIEW', label: 'Overview' },
    { id: 'BOQ', label: 'BOQ Validation' },
    { id: 'BILLING', label: 'Billing Validation' },
    { id: 'PHOTO', label: 'Photo/Image' },
    { id: 'DRONE', label: 'Drone Evidence' },
    { id: 'CCTV', label: 'CCTV/Live Feed' },
    { id: 'SATELLITE', label: 'Satellite' },
    { id: 'PLAN', label: 'Plans Validation' }
  ];

  const getRiskColors = (level: string) => {
    switch(level) {
      case 'GREEN': return { bg: '#d1fae5', text: '#065f46', border: '#34d399' };
      case 'YELLOW': return { bg: '#fef3c7', text: '#92400e', border: '#fbbf24' };
      case 'ORANGE': return { bg: '#ffedd5', text: '#9a3412', border: '#fdba74' };
      case 'RED': return { bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' };
      default: return { bg: '#f3f4f6', text: '#374151', border: '#d1d5db' };
    }
  };

  const riskColors = getRiskColors(validationScore?.riskLevel || 'GRAY');

  // Filter records by the active tab and selected billing
  let activeRecords = validationRecords;
  if (activeTab !== 'OVERVIEW') {
    activeRecords = activeRecords.filter((r: any) => r.moduleSource === activeTab);
  }
  if (selectedBillingId !== 'ALL') {
    activeRecords = activeRecords.filter((r: any) => r.relatedBillingId === selectedBillingId);
  }

  const selectedBillingObj = billings.find((b: any) => b.id === selectedBillingId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <Link href="/executive/validation" style={{ fontSize: '0.875rem', color: '#6b7280', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
            ← Back to Validation Dashboard
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1.3, fontWeight: 700, color: '#111827' }}>
            {project.name}
          </h1>
          <p style={{ margin: '4px 0 0', color: '#6b7280' }}>Contractor/Client: {project.client}</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ 
            backgroundColor: riskColors.bg, 
            color: riskColors.text, 
            border: `1px solid ${riskColors.border}`,
            padding: '8px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Project Risk Level</span>
              <span style={{ fontSize: '1.125rem', fontWeight: 700 }}>{validationScore?.riskLevel || 'GRAY'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accomplishment Selector */}
      <div style={{ padding: '16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontWeight: 600, color: '#374151' }}>Select Accomplishment / Billing:</span>
        <select 
          value={selectedBillingId} 
          onChange={(e) => setSelectedBillingId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db', outline: 'none', backgroundColor: '#f9fafb', fontSize: '0.9rem', color: '#111827', minWidth: '350px' }}
        >
          {billings.length === 0 && <option value="ALL">No Billings Available in ERP</option>}
          {billings.length > 0 && <option value="ALL">View Entire Project (All Billings)</option>}
          {billings.map((b: any) => (
            <option key={b.id} value={b.id}>
              {b.billingNumber} - ₱{b.currentBillingAmount?.toLocaleString()} ({new Date(b.billingDate).toLocaleDateString()})
            </option>
          ))}
        </select>
        {selectedBillingId !== 'ALL' && selectedBillingObj && (
           <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 500 }}>
             Currently viewing matrix specifically for {selectedBillingObj.billingNumber}
           </span>
        )}
      </div>

      {/* Main Layout: Left content, Right approval panel */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        
        {/* Left Content */}
        <div style={{ flex: '1 1 500px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
                  color: activeTab === tab.id ? '#2563eb' : '#6b7280',
                  fontWeight: activeTab === tab.id ? 600 : 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', minHeight: '400px' }}>
            
            {activeTab === 'OVERVIEW' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>Executive Summary</h3>
                <p style={{ margin: 0, color: '#4b5563', lineHeight: '1.6' }}>
                  Project accomplishment is reported at <strong>{validationScore?.reportedProgress.toFixed(1)}%</strong>, while AI-supported validation indicates only <strong>{validationScore?.aiValidatedProgress.toFixed(1)}%</strong> evidence-backed progress.
                  The variance is mainly due to missing geotagged photo evidence and lack of recent drone coverage.
                </p>
                <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                  <h4 style={{ margin: '0 0 12px', color: '#374151' }}>Evidence Completeness</h4>
                  <div style={{ width: '100%', height: '8px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                    <div style={{ width: `${validationScore?.evidenceCompletenessScore}%`, height: '100%', backgroundColor: '#10b981', borderRadius: '4px' }} />
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '8px' }}>{validationScore?.evidenceCompletenessScore.toFixed(0)}% of required evidence types are present.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeRecords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📂</div>
                    <p>No validation records found for {activeTab}.</p>
                  </div>
                ) : (
                  activeRecords.map((record: any) => {
                    const rc = getRiskColors(record.riskLevel);
                    return (
                      <div key={record.id} style={{ padding: '16px', borderRadius: '8px', border: '1px solid #e5e7eb', display: 'flex', gap: '16px' }}>
                        {record.evidenceFileUrl && (
                          <div style={{ width: '120px', height: '120px', backgroundColor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden' }}>
                            <img src={record.evidenceFileUrl} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Recorded: {new Date(record.createdAt).toLocaleDateString()}</span>
                            <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: rc.bg, color: rc.text, fontSize: '0.75rem', fontWeight: 600 }}>
                              Score: {record.aiConfidenceScore} | {record.riskLevel}
                            </span>
                          </div>
                          <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151', lineHeight: '1.5' }}>
                            {record.aiFindings}
                          </p>
                          {record.recommendation && (
                            <div style={{ marginTop: 'auto', fontSize: '0.875rem', fontWeight: 600, color: '#4f46e5' }}>
                              Recommendation: {record.recommendation}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        </div>

        {/* Right Approval Panel */}
        <div style={{ flex: '1 1 300px', maxWidth: '340px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'sticky', top: '80px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', color: '#111827' }}>Executive Action Panel</h3>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600, marginBottom: '4px' }}>AI Recommendation</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
              {validationScore?.executiveRecommendation || 'Hold for Additional Evidence'}
            </div>
            <p style={{ margin: '8px 0 0', fontSize: '0.875rem', color: '#475569' }}>
              {validationScore?.requiredAction || 'Variance detected requires site re-inspection.'}
            </p>
            {selectedBillingId !== 'ALL' && selectedBillingObj && (
              <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                Applying action to: {selectedBillingObj.billingNumber}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button style={{ padding: '10px', width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Approve
            </button>
            <button style={{ padding: '10px', width: '100%', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Conditionally Approve
            </button>
            <button style={{ padding: '10px', width: '100%', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Require Revalidation
            </button>
            <button style={{ padding: '10px', width: '100%', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>
              Hold / Reject
            </button>
          </div>

          <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <button style={{ padding: '10px', width: '100%', backgroundColor: 'white', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '8px' }}>
              <span>📄</span> Generate Evidence Pack
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
