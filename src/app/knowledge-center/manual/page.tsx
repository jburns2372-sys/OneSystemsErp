import React from 'react';
import Link from 'next/link';
import { 
  Briefcase, 
  HardHat, 
  ShoppingCart, 
  Calculator, 
  Landmark, 
  Crown,
  ChevronLeft
} from 'lucide-react';

export const metadata = {
  title: 'User Manual | OneSystems ERP'
};

const ROLES = [
  {
    id: 'pm',
    title: 'Project Manager (PM)',
    icon: <Briefcase size={28} color="#00f0ff" />,
    color: 'rgba(0, 240, 255, 0.1)',
    borderColor: 'rgba(0, 240, 255, 0.3)',
    purpose: 'Responsible for executing the project within the limits of the Procurement Benchmark BOQ and Awarded BOQ.',
    daily: [
      'Review and approve Material Requests (MRs).',
      'Review Daily Time Records (DTRs) and worker deployment.',
      'Monitor daily accomplishments logged by Site Engineers.'
    ],
    weekly: [
      'Review AI-generated schedule risk alerts.',
      'Update Gantt Chart / Project Schedule.',
      'Approve Job Order payments.'
    ],
    monthly: [
      'Review and validate Progress Billings against actual site condition.',
      'Prepare justification for any Subcontractor or Client Variation Orders.'
    ],
    bestPractices: 'Do not let MRs sit unapproved; this bottlenecks Purchasing. Keep the active project selected in the top bar to avoid creating records in the wrong workspace.',
    mistakes: ''
  },
  {
    id: 'pe',
    title: 'Project Engineer / Site Engineer',
    icon: <HardHat size={28} color="#f97316" />,
    color: 'rgba(249, 115, 22, 0.1)',
    borderColor: 'rgba(249, 115, 22, 0.3)',
    purpose: 'Managing site execution, requesting materials, and logging physical progress.',
    daily: [
      'Draft MRs based on the site\'s immediate needs, explicitly selecting the correct Benchmark BOQ item to draw from.',
      'Log Accomplishments and upload timestamped photos.'
    ],
    weekly: [],
    monthly: [],
    mistakes: 'Requesting items without checking the remaining Benchmark BOQ balance. The system will block requests if the balance is zero unless an override is authorized.',
    bestPractices: 'Upload clear photos for accomplishments. The AI validation engine will reject blurry or irrelevant photos, delaying billing.'
  },
  {
    id: 'po',
    title: 'Purchasing Officer',
    icon: <ShoppingCart size={28} color="#eab308" />,
    color: 'rgba(234, 179, 8, 0.1)',
    borderColor: 'rgba(234, 179, 8, 0.3)',
    purpose: 'Canvassing suppliers and issuing Purchase Orders (POs).',
    daily: [
      'Monitor approved MRs on the dashboard.',
      'Input supplier quotations into the Canvass module.',
      'Generate Draft POs for the lowest bidder.'
    ],
    weekly: [],
    monthly: [],
    mistakes: 'Forgetting to attach the Canvass PDF to the PO, causing the Director to reject the PO during review.',
    bestPractices: ''
  },
  {
    id: 'admin',
    title: 'Site Admin / Site Accountant',
    icon: <Calculator size={28} color="#3b82f6" />,
    color: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    purpose: 'Managing site petty cash, DTRs, and direct expenses.',
    daily: [
      'Upload daily attendance (DTRs) via Excel.',
      'Encode direct expenses (e.g., fuel, supplies) and upload receipt photos.',
      'Dispense and log Petty Cash.'
    ],
    weekly: [
      'Submit Petty Cash Replenishment requests before the fund hits zero.'
    ],
    monthly: [
      'Generate the Payroll Register for PM approval.'
    ],
    mistakes: '',
    bestPractices: 'Always tag expenses to a BOQ item. Untagged expenses fall into "Overhead" and skew project profitability reports.'
  },
  {
    id: 'finance',
    title: 'Finance Officer',
    icon: <Landmark size={28} color="#10b981" />,
    color: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    purpose: 'Managing accounts payable, billing the client, and maintaining the corporate ledger.',
    daily: [
      'Approve direct Expense logs. (Rely on AI validation to catch duplicates).',
      'Record supplier payables upon warehouse Delivery Receipt (DR) confirmation.'
    ],
    weekly: [
      'Process Progress Billings generated from the Accomplishments module.'
    ],
    monthly: [
      'Approve Payroll disbursements.'
    ],
    mistakes: '',
    bestPractices: ''
  },
  {
    id: 'exec',
    title: 'Executive / Project Director',
    icon: <Crown size={28} color="#8b5cf6" />,
    color: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    purpose: 'Multi-project oversight, high-level approval, and profitability monitoring.',
    daily: [
      'Review the Executive Dashboard.',
      'Approve high-value POs and Subcontracts.'
    ],
    weekly: [
      'Run the AI RAG Command Center to generate a weekly health summary report.'
    ],
    monthly: [],
    mistakes: '',
    bestPractices: 'Pay attention to the AI Risk Alerts widget. It will automatically flag projects that are spending faster than they are accomplishing.'
  }
];

export default function UserManualPage() {
  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '60px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
        <Link 
          href="/knowledge-center"
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', 
            padding: '8px 16px', background: 'var(--glass-panel)', 
            border: '1px solid var(--glass-border)', borderRadius: '8px',
            color: 'var(--text-secondary)', textDecoration: 'none',
            transition: 'all 0.2s', fontWeight: 'bold'
          }}
        >
          <ChevronLeft size={18} /> Back
        </Link>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--text-primary)' }}>Operational & User Manual</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '5px' }}>
            Daily, weekly, and monthly operational expectations and standard procedures by role.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '25px' }}>
        {ROLES.map((role) => (
          <div 
            key={role.id} 
            style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: '16px', 
              border: '1px solid var(--glass-border)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Header */}
            <div style={{ 
              background: role.color, 
              borderBottom: `1px solid ${role.borderColor}`,
              padding: '20px 25px',
              display: 'flex',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{ 
                background: 'rgba(0,0,0,0.3)', 
                padding: '12px', 
                borderRadius: '12px',
                border: `1px solid ${role.borderColor}`
              }}>
                {role.icon}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--text-primary)' }}>{role.title}</h2>
                <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  {role.purpose}
                </p>
              </div>
            </div>

            {/* Content */}
            <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
              
              {/* Daily Tasks */}
              {role.daily.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#e5e7eb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>☀️ Daily Tasks</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#9ca3af', lineHeight: '1.6' }}>
                    {role.daily.map((task, i) => <li key={i}>{task}</li>)}
                  </ul>
                </div>
              )}

              {/* Weekly Tasks */}
              {role.weekly.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#e5e7eb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📅 Weekly Tasks</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#9ca3af', lineHeight: '1.6' }}>
                    {role.weekly.map((task, i) => <li key={i}>{task}</li>)}
                  </ul>
                </div>
              )}

              {/* Monthly Tasks */}
              {role.monthly.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#e5e7eb', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>📆 Monthly Tasks</h4>
                  <ul style={{ margin: 0, paddingLeft: '20px', color: '#9ca3af', lineHeight: '1.6' }}>
                    {role.monthly.map((task, i) => <li key={i}>{task}</li>)}
                  </ul>
                </div>
              )}

              <div style={{ flex: 1 }}></div>

              {/* Mistakes & Best Practices (Rendered at bottom of card) */}
              {(role.mistakes || role.bestPractices) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  {role.mistakes && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderLeft: '4px solid #ef4444', padding: '12px 15px', borderRadius: '4px' }}>
                      <strong style={{ color: '#ef4444', display: 'block', marginBottom: '4px', fontSize: '0.85rem', textTransform: 'uppercase' }}>⚠️ Common Mistake</strong>
                      <span style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.5' }}>{role.mistakes}</span>
                    </div>
                  )}
                  {role.bestPractices && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', borderLeft: '4px solid #10b981', padding: '12px 15px', borderRadius: '4px' }}>
                      <strong style={{ color: '#10b981', display: 'block', marginBottom: '4px', fontSize: '0.85rem', textTransform: 'uppercase' }}>💡 Best Practice</strong>
                      <span style={{ color: '#d1d5db', fontSize: '0.9rem', lineHeight: '1.5' }}>{role.bestPractices}</span>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
