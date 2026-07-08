'use client';
import React, { useState, useRef, useMemo } from 'react';

interface AwardedBOQItem {
  id: string;
  itemCode: string;
  category?: string;
  description: string;
  unit: string;
  quantity: number;
  directCost: number;
  indirectCost: number;
  combinedUnitCost: number;
  totalCost: number;
  revisedContractQuantity: number;
  revisedContractUnitPrice: number;
  revisedContractAmount: number;
  approvedClientVoQuantity: number;
  materialUnitCost: number;
  laborUnitCost: number;
  equipmentUnitCost: number;
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

  // OCM / CP / VAT rates
  const [rates, setRates] = useState({ ocm: 0.08, cp: 0.08, vat: 0.05 });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Build rows from AwardedBOQItems
  const rows = useMemo(() => {
    if (awardedBoqItems.length === 0) return [];

    return awardedBoqItems.map((item) => {
      const qty = item.revisedContractQuantity || item.quantity || 0;
      const totalCost = item.revisedContractAmount || item.totalCost || 0;
      const unitCost = item.revisedContractUnitPrice || item.combinedUnitCost || 0;

      // Determine if this is a category header (no qty, no cost)
      const isHeader = !item.quantity && !item.totalCost && !item.revisedContractAmount;
      const isVO = item.description.includes('(VO)');

      // Use actual stored values from the import
      const materialCost = (item as any).materialUnitCost || 0;
      const laborCost = (item as any).laborUnitCost || 0;
      const equipmentCost = (item as any).equipmentUnitCost || 0;

      const totalDirectCost = materialCost + laborCost + equipmentCost;
      const ocm = totalDirectCost * rates.ocm;
      const cp = totalDirectCost * rates.cp;
      const vatVal = totalDirectCost * rates.vat;
      const totalIndirectCost = ocm + cp + vatVal;
      const computedUnitCost = totalDirectCost + totalIndirectCost;
      const amount = totalCost > 0 ? totalCost : (computedUnitCost * qty);

      return {
        itemCode: item.itemCode || '',
        description: item.description || '',
        unit: item.unit || '',
        quantity: qty,
        materialCost,
        laborCost,
        equipmentCost,
        totalDirectCost,
        ocm,
        cp,
        vatVal,
        totalIndirectCost,
        unitCost: unitCost > 0 ? unitCost : computedUnitCost,
        amount,
        isHeader,
        isVO,
      };
    });
  }, [awardedBoqItems, rates]);

  // Grand total
  const grandTotal = rows.reduce((acc, row) => acc + (row.isHeader ? 0 : row.amount), 0);

  const fmt = (n: number) => n > 0 ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';

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
          <span style={{ fontSize: '1.3rem' }}>≡ƒôï</span>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Program of Works</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
              Bid Detailed Cost Breakdown ΓÇö Auto-populated from Awarded BOQ ({awardedBoqItems.length} items)
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {awardedBoqItems.length === 0 && (
            <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontStyle: 'italic' }}>
              ΓÜá∩╕Å No BOQ items found. Import an Awarded BOQ first.
            </span>
          )}
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
          {/* Logo */}
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
                <span style={{ fontSize: '1.5rem', marginBottom: '4px' }}>≡ƒÅó</span>
                Click to upload logo
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
          </div>

          {/* Letterhead Lines */}
          <input
            value={letterhead.line1}
            onChange={(e) => setLetterhead({ ...letterhead, line1: e.target.value })}
            style={{
              display: 'block', width: '100%', textAlign: 'center', border: 'none', outline: 'none',
              fontSize: '14px', fontWeight: 'bold', fontFamily: 'inherit', color: '#111',
              letterSpacing: '2px', padding: '2px 0', background: 'transparent'
            }}
            placeholder="REPUBLIC OF THE PHILIPPINES"
          />
          <input
            value={letterhead.line2}
            onChange={(e) => setLetterhead({ ...letterhead, line2: e.target.value })}
            style={{
              display: 'block', width: '100%', textAlign: 'center', border: 'none', outline: 'none',
              fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit', color: '#333',
              padding: '2px 0', background: 'transparent'
            }}
            placeholder="PROVINCE / REGION"
          />
          <input
            value={letterhead.line3}
            onChange={(e) => setLetterhead({ ...letterhead, line3: e.target.value })}
            style={{
              display: 'block', width: '100%', textAlign: 'center', border: 'none', outline: 'none',
              fontSize: '12px', fontWeight: 'bold', fontFamily: 'inherit', color: '#333',
              padding: '2px 0', background: 'transparent'
            }}
            placeholder="MUNICIPALITY / CITY"
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
              placeholder="Enter project name..."
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
              placeholder="Enter project location..."
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
              placeholder="e.g., Program of Works"
            />
          </div>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '16px', fontWeight: 'bold', fontSize: '13px', letterSpacing: '1px' }}>
          BID DETAILED COST BREAKDOWN
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
                <th rowSpan={2} style={thStyle}>TOTAL DIRECT{'\n'}COST</th>
                <th rowSpan={2} style={thStyle}>OCM</th>
                <th rowSpan={2} style={thStyle}>CP</th>
                <th rowSpan={2} style={thStyle}>VAT (5%)</th>
                <th rowSpan={2} style={thStyle}>TOTAL INDIRECT{'\n'}COST</th>
                <th rowSpan={2} style={thStyle}>UNIT COST</th>
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
              <tr style={{ background: '#f1f5f9', color: '#475569', fontSize: '9px' }}>
                <td colSpan={4} style={{ ...tdStyle, textAlign: 'right', fontStyle: 'italic', fontWeight: 'bold', color: '#64748b' }}>
                  Rates ΓåÆ
                </td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={tdStyle}></td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                  {(rates.ocm * 100).toFixed(0)}%
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                  {(rates.cp * 100).toFixed(0)}%
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 'bold' }}>
                  {(rates.vat * 100).toFixed(0)}%
                </td>
                <td colSpan={4} style={tdStyle}></td>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={15} style={{ ...tdStyle, textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '12px' }}>
                    No Awarded BOQ items found. Please import BOQ data from the "Contract Value &amp; BOQ" tab first.
                  </td>
                </tr>
              ) : (
                rows.map((row, idx) => (
                  <tr
                    key={idx}
                    style={{
                      background: row.isHeader
                        ? '#f0f4f8'
                        : row.isVO
                          ? 'rgba(16, 185, 129, 0.06)'
                          : (idx % 2 === 0 ? '#fff' : '#fafbfc'),
                    }}
                  >
                    <td style={{
                      ...tdStyle, textAlign: 'center',
                      fontWeight: row.isHeader ? 'bold' : 'normal',
                      fontSize: row.isHeader ? '10px' : '9px'
                    }}>
                      {row.itemCode}
                    </td>
                    <td style={{
                      ...tdStyle,
                      fontWeight: row.isHeader ? 'bold' : 'normal',
                      color: row.isVO ? '#059669' : '#111',
                      paddingLeft: row.isHeader ? '6px' : '14px',
                      fontSize: row.isHeader ? '10px' : '9.5px',
                      borderLeft: row.isVO ? '3px solid #10b981' : undefined,
                    }}>
                      {row.description}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>{row.isHeader ? '' : row.unit}</td>
                    <td style={{ ...tdStyle, textAlign: 'right' }}>{row.isHeader ? '' : (row.quantity > 0 ? row.quantity.toLocaleString() : '')}</td>
                    {/* Direct Unit Cost breakdown */}
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{row.isHeader ? '' : fmt(row.materialCost)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{row.isHeader ? '' : fmt(row.laborCost)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{row.isHeader ? '' : fmt(row.equipmentCost)}</td>
                    {/* Total Direct Cost */}
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#334155', fontWeight: '500' }}>{row.isHeader ? '' : fmt(row.totalDirectCost)}</td>
                    {/* Indirect costs */}
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b', fontSize: '9px' }}>{row.isHeader ? '' : fmt(row.ocm)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b', fontSize: '9px' }}>{row.isHeader ? '' : fmt(row.cp)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b', fontSize: '9px' }}>{row.isHeader ? '' : fmt(row.vatVal)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#475569' }}>{row.isHeader ? '' : fmt(row.totalIndirectCost)}</td>
                    {/* Unit Cost & Amount */}
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#0f172a', fontWeight: 'bold' }}>{row.isHeader ? '' : fmt(row.unitCost)}</td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#059669', fontWeight: 'bold' }}>
                      {row.isHeader
                        ? ''
                        : fmt(row.amount)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: '#64748b', fontSize: '9px' }}>
                      {!row.isHeader && grandTotal > 0 ? (row.amount / grandTotal * 100).toFixed(2) + '%' : ''}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr style={{ background: '#0f172a', color: '#fff', fontWeight: 'bold' }}>
                <td colSpan={13} style={{ ...tdStyle, textAlign: 'right', fontSize: '12px', padding: '10px 8px', borderColor: '#334155' }}>
                  GRAND TOTAL:
                </td>
                <td style={{ ...tdStyle, textAlign: 'right', fontSize: '12px', padding: '10px 8px', color: '#34d399', borderColor: '#334155' }}>
                  {fmt(grandTotal)}
                </td>
                <td style={{ ...tdStyle, textAlign: 'center', fontSize: '11px', padding: '10px 8px', borderColor: '#334155' }}>
                  {grandTotal > 0 ? '100.00%' : ''}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Signature Block */}
        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '4px', marginTop: '50px', fontSize: '10px' }}>
              Prepared By
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '4px', marginTop: '50px', fontSize: '10px' }}>
              Checked By
            </div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ borderTop: '1px solid #334155', paddingTop: '4px', marginTop: '50px', fontSize: '10px' }}>
              Approved By
            </div>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #pow-document, #pow-document * { visibility: visible; }
          #pow-document {
            position: absolute; left: 0; top: 0;
            width: 100%; padding: 20px !important;
            box-shadow: none !important; border-radius: 0 !important;
          }
          .pow-no-print { display: none !important; }
          .pow-no-print-hide { display: none !important; }
          input {
            border: none !important;
            border-bottom: none !important;
            outline: none !important;
          }
        }
      `}</style>
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
