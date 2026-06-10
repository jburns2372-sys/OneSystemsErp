'use client';

import { useState } from 'react';
import CutoffSettings from './CutoffSettings';
import GovernmentSettings from './GovernmentSettings';
import DeductionLedger from './DeductionLedger';
import Link from 'next/link';

export default function PayrollSettingsClient({ 
  cutoffs, 
  govSettings, 
  cashAdvances, 
  loans, 
  allowances, 
  workers 
}: any) {
  const [activeTab, setActiveTab] = useState('CUTOFFS');

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <Link href="/payroll" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>
          ← Back to Payroll Dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', background: 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '12px', border: '1px solid var(--glass-border)', width: '100%', overflowX: 'auto' }}>
          <button 
            onClick={() => setActiveTab('CUTOFFS')}
            style={{ 
              background: activeTab === 'CUTOFFS' ? 'var(--accent-color)' : 'transparent', 
              color: activeTab === 'CUTOFFS' ? '#000' : 'var(--text-secondary)', 
              border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: activeTab === 'CUTOFFS' ? 'bold' : 'normal',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            Custom Cutoffs
          </button>
          <button 
            onClick={() => setActiveTab('GOVERNMENT')}
            style={{ 
              background: activeTab === 'GOVERNMENT' ? 'var(--accent-color)' : 'transparent', 
              color: activeTab === 'GOVERNMENT' ? '#000' : 'var(--text-secondary)', 
              border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: activeTab === 'GOVERNMENT' ? 'bold' : 'normal',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            Government Deductions
          </button>
          <button 
            onClick={() => setActiveTab('DEDUCTIONS')}
            style={{ 
              background: activeTab === 'DEDUCTIONS' ? 'var(--accent-color)' : 'transparent', 
              color: activeTab === 'DEDUCTIONS' ? '#000' : 'var(--text-secondary)', 
              border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer',
              fontWeight: activeTab === 'DEDUCTIONS' ? 'bold' : 'normal',
              transition: 'all 0.2s', whiteSpace: 'nowrap'
            }}
          >
            Deduction Ledger & Allowances
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--glass-border)', padding: '30px' }}>
        {activeTab === 'CUTOFFS' && <CutoffSettings cutoffs={cutoffs} />}
        {activeTab === 'GOVERNMENT' && <GovernmentSettings govSettings={govSettings} />}
        {activeTab === 'DEDUCTIONS' && <DeductionLedger cashAdvances={cashAdvances} loans={loans} allowances={allowances} workers={workers} />}
      </div>
    </div>
  );
}
