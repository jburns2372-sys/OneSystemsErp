'use client';

import { useState } from 'react';
import styles from './page.module.css';
import Link from 'next/link';

export default function RoleDashboardClient({ stats }: { stats: any }) {
  const [simulatedRole, setSimulatedRole] = useState('PROJECT_DIRECTOR');

  const roles = [
    { id: 'PROJECT_DIRECTOR', label: 'Project Director / Executive' },
    { id: 'FINANCE_OFFICER', label: 'Finance & Accounting' },
    { id: 'PURCHASING_OFFICER', label: 'Purchasing & Procurement' },
    { id: 'STOCKMAN', label: 'Warehouse & Logistics' },
    { id: 'HR_OFFICER', label: 'Human Resources' }
  ];

  return (
    <div className={styles.dashboardContainer}>
      
      {/* Simulation Header */}
      <div style={{ background: 'rgba(255, 212, 59, 0.1)', border: '1px solid #ffd43b', padding: '15px 20px', borderRadius: '12px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ color: '#ffd43b', margin: 0, marginBottom: '5px' }}>Role Simulator Active</h3>
          <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Change the role below to instantly reconfigure the entire dashboard layout, metrics, and quick actions to match the operational needs of that position.
          </p>
        </div>
        <div>
          <select 
            value={simulatedRole} 
            onChange={(e) => setSimulatedRole(e.target.value)}
            style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #ffd43b', background: '#000', color: '#ffd43b', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
          >
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </div>
      </div>

      <header className={styles.header}>
        <h1>{roles.find(r => r.id === simulatedRole)?.label} Dashboard</h1>
        <p>Welcome back! Here is your personalized daily summary.</p>
      </header>

      {/* --- PROJECT DIRECTOR DASHBOARD --- */}
      {simulatedRole === 'PROJECT_DIRECTOR' && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>AI Overrides Pending Approval</h3>
            <p className={styles.statValue} style={{ color: stats.pendingAIOverrides > 0 ? '#ff6b6b' : '#22c55e' }}>{stats.pendingAIOverrides}</p>
            <Link href="/director-audit" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>View Audit Queue ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>Total Active Projects</h3>
            <p className={styles.statValue}>{stats.totalProjects}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Contract Budget</h3>
            <p className={styles.statValue}>₱ {stats.totalBudget.toLocaleString()}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Outstanding Liabilities</h3>
            <p className={styles.statValue} style={{ color: '#f97316' }}>₱ {stats.totalPayables.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* --- FINANCE OFFICER DASHBOARD --- */}
      {simulatedRole === 'FINANCE_OFFICER' && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Unpaid Payables</h3>
            <p className={styles.statValue} style={{ color: '#ef4444' }}>₱ {stats.totalPayables.toLocaleString()}</p>
            <Link href="/supplier-payables" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Process Payments ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>Petty Cash Low Balance</h3>
            <p className={styles.statValue} style={{ color: stats.pendingPettyCash > 0 ? '#f97316' : '#22c55e' }}>{stats.pendingPettyCash} Accts</p>
            <Link href="/petty-cash" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Review Replenishments ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>Active Payroll Periods</h3>
            <p className={styles.statValue}>{stats.activePayrollPeriods}</p>
            <Link href="/payroll" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Process Payroll ➔</Link>
          </div>
        </div>
      )}

      {/* --- PURCHASING OFFICER DASHBOARD --- */}
      {simulatedRole === 'PURCHASING_OFFICER' && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Pending MRFs to Source</h3>
            <p className={styles.statValue} style={{ color: '#f97316' }}>{stats.pendingMRFs}</p>
            <Link href="/material-requests" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>View Requests ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>Active Purchase Orders</h3>
            <p className={styles.statValue}>{stats.activePurchaseOrders}</p>
            <Link href="/procurement/purchase-orders" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Manage POs ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>Supplier Directory</h3>
            <p className={styles.statValue}>Active</p>
            <Link href="/procurement/suppliers" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Manage Suppliers ➔</Link>
          </div>
        </div>
      )}

      {/* --- STOCKMAN / WAREHOUSE DASHBOARD --- */}
      {simulatedRole === 'STOCKMAN' && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Expected Deliveries</h3>
            <p className={styles.statValue} style={{ color: '#22c55e' }}>{stats.expectedDeliveries} POs</p>
            <Link href="/deliveries/new" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Log New Delivery ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>Material Issuance</h3>
            <p className={styles.statValue}>Active</p>
            <Link href="/material-issuance" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Issue Materials ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>Inventory Overview</h3>
            <p className={styles.statValue}>Live</p>
            <Link href="/inventory" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Check Stocks ➔</Link>
          </div>
        </div>
      )}

      {/* --- HR OFFICER DASHBOARD --- */}
      {simulatedRole === 'HR_OFFICER' && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <h3>Active Payroll Periods</h3>
            <p className={styles.statValue} style={{ color: '#22c55e' }}>{stats.activePayrollPeriods}</p>
            <Link href="/payroll" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '10px', display: 'inline-block' }}>Manage Payroll ➔</Link>
          </div>
          <div className={styles.statCard}>
            <h3>System Users</h3>
            <p className={styles.statValue}>{stats.totalUsers}</p>
          </div>
        </div>
      )}

      <div className={styles.chartsArea}>
        <div className={styles.chartPlaceholder}>
          <h3>Quick Access Tools</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
            <Link href="/projects" style={{ padding: '15px', background: 'var(--bg-dark)', borderRadius: '8px', color: 'white', textDecoration: 'none', border: '1px solid var(--glass-border)' }}>📋 Project Directory</Link>
            <Link href="/reports" style={{ padding: '15px', background: 'var(--bg-dark)', borderRadius: '8px', color: 'white', textDecoration: 'none', border: '1px solid var(--glass-border)' }}>📊 Analytics & Reports</Link>
            <Link href="/system-audit" style={{ padding: '15px', background: 'var(--bg-dark)', borderRadius: '8px', color: 'white', textDecoration: 'none', border: '1px solid var(--glass-border)' }}>🛡️ Global Audit Ledger</Link>
          </div>
        </div>
        <div className={styles.chartPlaceholder}>
          <h3>System Notices</h3>
          <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: '4px solid var(--accent-color)' }}>
            <p style={{ margin: 0, fontWeight: 'bold' }}>AI Compliance Engine Active</p>
            <p style={{ margin: '10px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>All transactions are currently being monitored by the AI Validation system. Anomalies will be routed to the Project Director for override approval.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
