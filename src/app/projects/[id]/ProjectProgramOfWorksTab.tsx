'use client';
import React, { useState, useRef, useMemo } from 'react';

interface AwardedBOQItem {
  id: string;
  itemCode: string;
  category?: string;
  description: string;
  unit: string;
  quantity: number;
  totalCost: number;
  materialUnitCost?: number;
  laborUnitCost?: number;
  equipmentUnitCost?: number;
  directCost?: number;
  ocmAmount?: number;
  cpAmount?: number;
  vatAmount?: number;
  indirectCost?: number;
  combinedUnitCost?: number;
  percentageOfTotal?: number;
}

interface ProjectProgramOfWorksTabProps {
  projectId: string;
  projectName?: string;
  projectLocation?: string;
  awardedBoqItems?: AwardedBOQItem[];
  letterheadLine1?: string;
  letterheadLine2?: string;
  letterheadLine3?: string;
  letterheadLogo?: string;
}

export default function ProjectProgramOfWorksTab({ 
  projectId, 
  projectName, 
  projectLocation, 
  awardedBoqItems = [],
  letterheadLine1,
  letterheadLine2,
  letterheadLine3,
  letterheadLogo
}: ProjectProgramOfWorksTabProps) {
  // Letterhead state
  const [letterhead, setLetterhead] = useState({
    line1: letterheadLine1 || 'REPUBLIC OF THE PHILIPPINES',
    line2: letterheadLine2 || '',
    line3: letterheadLine3 || '',
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(letterheadLogo || null);

  // Project info state
  const [projectInfo, setProjectInfo] = useState({
    project: projectName || '',
    location: projectLocation || '',
    subject: 'Program of Works',
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const thStyle = {
    padding: '8px 6px',
    border: '1px solid #334155',
    textAlign: 'center' as const,
    whiteSpace: 'pre-line' as const,
  };

  const tdStyle = {
    padding: '6px 8px',
    border: '1px solid #cbd5e1',
  };

  const grandTotal = awardedBoqItems.reduce((acc, row) => acc + (row.totalCost || 0), 0);

  const fmt = (n?: number) => (n && n > 0) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

  return (
    <div style={{ padding: '0' }}>
      {/* Toolbar */}
      <div className="pow-no-print" style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '20px', padding: '12px 16px',
        background: 'rgba(255,255,255,0.03)', borderRadius: '12px',
        border: '1px solid var(--glass-border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '1.3rem' }}>📋</span>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Program of Works</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Original Uploaded Format ({awardedBoqItems.length} items)
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button onClick={handlePrint} className="btn-secondary" style={{
            background: 'transparent', border: '1px solid #cbd5e1', color: 'var(--text-primary)',
            padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            🖨️ Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Document Container */}
      <div id="pow-document" style={{
        background: '#fff', color: '#111', borderRadius: '8px',
        padding: '40px 50px', boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        fontFamily: "'Times New Roman', Times, serif", fontSize: '11px',
        maxWidth: '1400px', margin: '0 auto'
      }}>
        {/* Letterhead */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ marginBottom: '10px' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Company Logo" style={{ maxHeight: '80px', objectFit: 'contain' }} />
            ) : (
              <div
                className="pow-no-print-hide"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100px', height: '100px', margin: '0 auto',
                  border: '2px dashed #cbd5e1', borderRadius: '12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#94a3b8', fontSize: '0.7rem', transition: 'all 0.2s'
                }}
              >
                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏢</span>
                Click to upload logo
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </div>

          <input
            value={letterhead.line1}
            onChange={(e) => setLetterhead({ ...letterhead, line1: e.target.value })}
            style={{
              display: 'block', width: '100%', textAlign: 'center', border: 'none', outline: 'none',
              fontSize: '14px', fontWeight: 'bold', fontFamily: 'inherit', color: '#111',
              letterSpacing: '2px', padding: '2px 0', background: 'transparent'
            }}
          />
          <input
            value={letterhead.line2}
            onChange={(e) => setLetterhead({ ...letterhead, line2: e.target.value })}
            style={{
              display: 'block', width: '100%', textAlign: 'center', border: 'none', outline: 'none',
              fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit', color: '#333',
              padding: '2px 0', background: 'transparent'
            }}
          />
          <input
            value={letterhead.line3}
            onChange={(e) => setLetterhead({ ...letterhead, line3: e.target.value })}
            style={{
              display: 'block', width: '100%', textAlign: 'center', border: 'none', outline: 'none',
              fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit', color: '#333',
              padding: '2px 0', background: 'transparent'
            }}
          />
        </div>

        <hr style={{ border: 'none', borderTop: '2px solid #0f172a', marginBottom: '16px' }} />

        {/* Project Info */}
        <div style={{ marginBottom: '16px', fontSize: '11px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', minWidth: '80px' }}>PROJECT:</span>
            <input
              value={projectInfo.project}
              onChange={(e) => setProjectInfo({ ...projectInfo, project: e.target.value })}
              style={{
                flex: 1, border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none',
                fontFamily: 'inherit', fontSize: '11px', fontWeight: 'bold', color: '#111',
                padding: '2px 4px', background: 'transparent'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', minWidth: '80px' }}>LOCATION:</span>
            <input
              value={projectInfo.location}
              onChange={(e) => setProjectInfo({ ...projectInfo, location: e.target.value })}
              style={{
                flex: 1, border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none',
                fontFamily: 'inherit', fontSize: '11px', color: '#333',
                padding: '2px 4px', background: 'transparent'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', minWidth: '80px' }}>SUBJECT:</span>
            <input
              value={projectInfo.subject}
              onChange={(e) => setProjectInfo({ ...projectInfo, subject: e.target.value })}
              style={{
                flex: 1, border: 'none', borderBottom: '1px solid #cbd5e1', outline: 'none',
                fontFamily: 'inherit', fontSize: '11px', color: '#333',
                padding: '2px 4px', background: 'transparent'
              }}
            />
          </div>
        </div>

        {/* Main Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%', borderCollapse: 'collapse', fontSize: '10px',
            border: '2px solid #1e293b'
          }}>
            <thead>
              {/* Row 1: Main headers */}
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th rowSpan={2} style={thStyle}>ITEM #</th>
                <th rowSpan={2} style={{ ...thStyle, minWidth: '200px' }}>D E S C R I P T I O N</th>
                <th rowSpan={2} style={thStyle}>UNIT</th>
                <th rowSpan={2} style={thStyle}>QUANTITY</th>
                <th colSpan={3} style={{ ...thStyle, borderBottom: '1px solid #334155' }}>DIRECT UNIT COST</th>
                <th rowSpan={2} style={thStyle}>TOTAL{'\n'}DIRECT{'\n'}COST</th>
                <th rowSpan={2} style={thStyle}>OCM</th>
                <th rowSpan={2} style={thStyle}>CP</th>
                <th rowSpan={2} style={thStyle}>VAT (5%)</th>
                <th rowSpan={2} style={thStyle}>TOTAL{'\n'}INDIRECT{'\n'}COST</th>
                <th rowSpan={2} style={thStyle}>UNIT{'\n'}COST</th>
                <th rowSpan={2} style={thStyle}>AMOUNT</th>
                <th rowSpan={2} style={thStyle}>%</th>
              </tr>
              {/* Row 2: Sub-headers for Direct Unit Cost */}
              <tr style={{ background: '#1e293b', color: '#94a3b8' }}>
                <th style={thStyle}>MATERIAL</th>
                <th style={thStyle}>LABOR</th>
                <th style={thStyle}>EQUIPMENT</th>
              </tr>
              {/* Row 3: Rate display */}
              <tr style={{ background: '#f8fafc', color: '#64748b', fontSize: '9px', fontStyle: 'italic' }}>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>
                  Rates →
                </td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>8%</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>8%</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>5%</td>
                <td colSpan={4} style={tdStyle}></td>
              </tr>
            </thead>
            <tbody>
              {awardedBoqItems.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '12px' }}>
                    No BOQ items found.
                  </td>
                </tr>
              ) : (
                awardedBoqItems.map((item, idx) => {
                  const isHeader = !item.quantity && !item.totalCost;
                  const qty = item.quantity || 0;

                  return (
                    <tr key={item.id} style={{ background: isHeader ? '#f0f4f8' : (idx % 2 === 0 ? '#fff' : '#fafbfc') }}>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: isHeader ? 'bold' : 'normal' }}>
                        {item.itemCode || ''}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: isHeader ? 'bold' : 'normal' }}>
                        {item.description}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {isHeader ? '' : (item.unit || '')}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {isHeader ? '' : (qty > 0 ? qty.toLocaleString() : '')}
                      </td>

                      {/* Direct Unit Cost breakdown */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{isHeader ? '' : fmt(item.materialUnitCost)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{isHeader ? '' : fmt(item.laborUnitCost)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{isHeader ? '' : fmt(item.equipmentUnitCost)}</td>

                      {/* Total Direct Cost */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>{isHeader ? '' : fmt(item.directCost)}</td>

                      {/* Indirect costs */}
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{isHeader ? '' : fmt(item.ocmAmount)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{isHeader ? '' : fmt(item.cpAmount)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{isHeader ? '' : fmt(item.vatAmount)}</td>

                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>{isHeader ? '' : fmt(item.indirectCost)}</td>

                      {/* Final Unit Cost & Amount */}
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold' }}>{isHeader ? '' : fmt(item.combinedUnitCost)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                        {isHeader ? '' : fmt(item.totalCost)}
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b' }}>
                        {(!isHeader && item.percentageOfTotal && item.percentageOfTotal > 0) ? item.percentageOfTotal.toFixed(2) + '%' : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {awardedBoqItems.length > 0 && (
              <tfoot>
                <tr style={{ background: '#0f172a', color: '#fff', fontWeight: 'bold' }}>
                  <td colSpan={13} style={{ ...tdStyle, textAlign: 'right', padding: '10px' }}>GRAND TOTAL</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#34d399', padding: '10px' }}>
                    {grandTotal > 0 ? grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}
                  </td>
                  <td style={tdStyle}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #111', width: '200px', marginBottom: '8px' }}></div>
            <div>Prepared By</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ borderBottom: '1px solid #111', width: '200px', marginBottom: '8px' }}></div>
            <div>Approved By</div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          body * { visibility: hidden; }
          #pow-document, #pow-document * { visibility: visible; }
          #pow-document { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; box-shadow: none; padding: 20px; }
          .pow-no-print { display: none !important; }
          .pow-no-print-hide { display: none !important; }
          input { border: none !important; background: transparent !important; }
          input::placeholder { color: transparent !important; }
        }
      `}} />
    </div>
  );
}

// Shared styles
const thStyle: React.CSSProperties = {
  padding: '8px 6px',
  textAlign: 'center',
  fontWeight: 'bold',
  fontSize: '9px',
  letterSpacing: '0.5px',
  whiteSpace: 'pre-line',
  borderRight: '1px solid #334155',
  borderBottom: '1px solid #334155',
  verticalAlign: 'middle',
};

const tdStyle: React.CSSProperties = {
  padding: '4px 6px',
  borderRight: '1px solid #e2e8f0',
  borderBottom: '1px solid #e2e8f0',
  verticalAlign: 'middle',
};
