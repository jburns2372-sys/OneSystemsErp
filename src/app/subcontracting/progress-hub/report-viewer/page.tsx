import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ReportViewerPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const accomplishmentId = params.id;

  if (!accomplishmentId) {
    return notFound();
  }

  // Fetch the accomplishment from the database
  const accomplishment = await prisma.subcontractAccomplishment.findUnique({
    where: { id: accomplishmentId },
    include: {
      package: {
        include: {
          subcontractor: true,
          project: true
        }
      }
    }
  });

  if (!accomplishment) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
        <h2>Error Loading Report</h2>
        <p>The requested accomplishment could not be found.</p>
      </div>
    );
  }

  // Parse the AI item breakdown
  let breakdown: any[] = [];
  try {
    if (accomplishment.itemBreakdown) {
      breakdown = typeof accomplishment.itemBreakdown === 'string' 
        ? JSON.parse(accomplishment.itemBreakdown) 
        : accomplishment.itemBreakdown;
    }
  } catch (e) {
    console.error("Failed to parse item breakdown:", e);
  }

  const pkg = accomplishment.package;

  return (
    <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '40px 20px', fontFamily: '"Inter", sans-serif' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Link 
            href={`/subcontracting/progress-hub/${pkg.id}`}
            style={{ padding: '8px 16px', backgroundColor: '#ffffff', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
          >
             <span dangerouslySetInnerHTML={{ __html: '&#8592;' }} /> Back to Hub
          </Link>
          
          {accomplishment.inspectionReport && (
            <a 
              href={accomplishment.inspectionReport} 
              target="_blank"
              rel="noreferrer"
              style={{ padding: '8px 16px', backgroundColor: '#4b5563', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              📄 View Original Upload
            </a>
          )}
        </div>

        {/* Paper Document */}
        <div style={{ backgroundColor: '#ffffff', padding: '60px 50px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', borderTop: '8px solid #8b5cf6' }}>
          
          {/* Header */}
          <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: '0 0 8px 0', color: '#111827', fontSize: '2rem', fontWeight: '800', letterSpacing: '-0.025em' }}>
                AI Validated Accomplishment
              </h1>
              <div style={{ color: '#6b7280', fontSize: '1.1rem' }}>
                Ref ID: {accomplishment.id.split('-')[0].toUpperCase()}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Date Processed</div>
              <div style={{ fontSize: '1.2rem', color: '#111827', fontWeight: 'bold' }}>
                {new Date(accomplishment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>

          {/* Project Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px', backgroundColor: '#f9fafb', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Project</div>
              <div style={{ fontSize: '1.05rem', color: '#111827', fontWeight: '600' }}>{pkg.project.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Subcontractor</div>
              <div style={{ fontSize: '1.05rem', color: '#111827', fontWeight: '600' }}>{pkg.subcontractor.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Package Number</div>
              <div style={{ fontSize: '1.05rem', color: '#111827', fontWeight: '500' }}>{pkg.packageNumber}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: '600' }}>Work Description</div>
              <div style={{ fontSize: '1.05rem', color: '#111827', fontWeight: '500' }}>{accomplishment.workDescription}</div>
            </div>
          </div>

          {/* AI Breakdown Table */}
          <h3 style={{ color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px' }}>AI Itemized Extraction</h3>
          
          {breakdown.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginBottom: '40px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f3f4f6', color: '#374151', borderBottom: '2px solid #d1d5db' }}>
                  <th style={{ padding: '12px 16px' }}>BOQ Item Code</th>
                  <th style={{ padding: '12px 16px' }}>Extracted %</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item: any, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '12px 16px', color: '#111827', fontWeight: '500' }}>{item.itemCode || 'Unknown Item'}</td>
                    <td style={{ padding: '12px 16px', color: '#8b5cf6', fontWeight: 'bold' }}>{item.percent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '20px', backgroundColor: '#f9fafb', color: '#6b7280', fontStyle: 'italic', marginBottom: '40px' }}>
              No itemized breakdown was generated by the AI for this report.
            </div>
          )}

          {/* Progress Summary */}
          <h3 style={{ color: '#111827', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', marginBottom: '16px' }}>Financial Weighted Summary</h3>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1, backgroundColor: '#eff6ff', padding: '20px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
              <div style={{ fontSize: '0.85rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>This Period Claim</div>
              <div style={{ fontSize: '2rem', color: '#1d4ed8', fontWeight: '900' }}>+{accomplishment.currentPercent.toFixed(2)}%</div>
            </div>
            <div style={{ flex: 1, backgroundColor: '#f0fdf4', padding: '20px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.85rem', color: '#16a34a', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '4px' }}>Cumulative Completion</div>
              <div style={{ fontSize: '2rem', color: '#15803d', fontWeight: '900' }}>{accomplishment.cumulativePercent.toFixed(2)}%</div>
            </div>
          </div>

          {/* Footer watermark/stamp */}
          <div style={{ marginTop: '60px', paddingTop: '24px', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ color: '#8b5cf6', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                AI Digitally Processed & Validated
              </div>
              <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
                Ready for Financial & Technical Endorsement
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#9ca3af' }}>
              OneSystems ERP &bull; Progress & Payments Hub
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
