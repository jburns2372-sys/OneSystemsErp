'use client';

import { useState } from 'react';

export default function ReportsClient({ financialData, projectData, inventoryData }: { financialData: any, projectData: any, inventoryData: any }) {
  const [activeTab, setActiveTab] = useState('FINANCIAL');

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => `₱ ${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Hide controls when printing */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          .no-print { display: none !important; }
          .print-area { background: #fff !important; color: #000 !important; }
          .print-area table { border-collapse: collapse; width: 100%; color: #000 !important; }
          .print-area th, .print-area td { border: 1px solid #000 !important; padding: 8px !important; color: #000 !important; }
          body { background: #fff !important; }
        }
      `}} />

      <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => setActiveTab('FINANCIAL')}
            style={{ background: activeTab === 'FINANCIAL' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'FINANCIAL' ? '#000' : 'var(--text-secondary)', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'FINANCIAL' ? 'bold' : 'normal', transition: 'all 0.2s' }}
          >
            Financial Overview
          </button>
          <button 
            onClick={() => setActiveTab('PROJECTS')}
            style={{ background: activeTab === 'PROJECTS' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'PROJECTS' ? '#000' : 'var(--text-secondary)', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'PROJECTS' ? 'bold' : 'normal', transition: 'all 0.2s' }}
          >
            Project Accomplishments
          </button>
          <button 
            onClick={() => setActiveTab('INVENTORY')}
            style={{ background: activeTab === 'INVENTORY' ? 'var(--accent-color)' : 'transparent', color: activeTab === 'INVENTORY' ? '#000' : 'var(--text-secondary)', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: activeTab === 'INVENTORY' ? 'bold' : 'normal', transition: 'all 0.2s' }}
          >
            Inventory Valuation
          </button>
        </div>
        
        <button 
          onClick={handlePrint}
          style={{ padding: '12px 24px', background: 'var(--bg-dark)', color: '#fff', border: '1px solid var(--glass-border)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🖨️ Print to PDF
        </button>
      </div>

      <div className="print-area" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '30px' }}>
        
        {activeTab === 'FINANCIAL' && (
          <div>
            <h2 style={{ marginBottom: '20px', color: 'var(--text-primary)' }}>Financial Overview Report</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
              <strong>Global Outstanding Payables:</strong> <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{formatCurrency(financialData.globalOutstandingPayables)}</span>
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '15px' }}>Project Name</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Contract Budget</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Logged Expenses</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Remaining Budget</th>
                </tr>
              </thead>
              <tbody>
                {financialData.projectFinancials.map((p: any) => (
                  <tr key={p.projectId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{p.projectName}</td>
                    <td style={{ padding: '15px' }}>{p.status}</td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>{formatCurrency(p.budget)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', color: '#ff6b6b' }}>{formatCurrency(p.expenses)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', color: p.balance < 0 ? '#ff6b6b' : '#00ffa3' }}>{formatCurrency(p.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'PROJECTS' && (
          <div>
            <h2 style={{ marginBottom: '30px', color: 'var(--text-primary)' }}>Project Accomplishment Report</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '15px' }}>Project Name</th>
                  <th style={{ padding: '15px' }}>Status</th>
                  <th style={{ padding: '15px' }}>Start Date</th>
                  <th style={{ padding: '15px' }}>End Date</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Overall % Accomplished</th>
                </tr>
              </thead>
              <tbody>
                {projectData.map((p: any) => (
                  <tr key={p.projectId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{p.projectName}</td>
                    <td style={{ padding: '15px' }}>{p.status}</td>
                    <td style={{ padding: '15px', color: '#ccc' }}>{p.startDate ? new Date(p.startDate).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '15px', color: '#ccc' }}>{p.endDate ? new Date(p.endDate).toLocaleDateString() : 'N/A'}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                      {p.accomplishment.toFixed(2)} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'INVENTORY' && (
          <div>
            <h2 style={{ marginBottom: '30px', color: 'var(--text-primary)' }}>Inventory Stock & Valuation Report</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', color: '#fff' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', textAlign: 'left', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '15px' }}>Category</th>
                  <th style={{ padding: '15px' }}>Item Description</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Qty On Hand</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Est. Unit Cost</th>
                  <th style={{ padding: '15px', textAlign: 'right' }}>Total Est. Value</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((inv: any) => (
                  <tr key={inv.stockId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '15px' }}>{inv.category}</td>
                    <td style={{ padding: '15px', fontWeight: 'bold' }}>{inv.description}</td>
                    <td style={{ padding: '15px', textAlign: 'right' }}>{inv.quantityOnHand}</td>
                    <td style={{ padding: '15px', textAlign: 'right', color: '#ccc' }}>{formatCurrency(inv.estimatedUnitCost)}</td>
                    <td style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', color: '#00ffa3' }}>{formatCurrency(inv.totalEstimatedValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
