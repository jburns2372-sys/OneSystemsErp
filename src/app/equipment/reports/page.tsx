import React from 'react';
import styles from '../../page.module.css';

export default function ReportsPage() {
  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Equipment Reports</h1>
          <p>Generate utilization, costing, and maintenance reports.</p>
        </div>
      </header>

      <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '40px', textAlign: 'center', border: '1px solid var(--glass-border)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📈</div>
        <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Analytics & Reporting</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 20px' }}>
          Export comprehensive data regarding fleet utilization, fuel costs, and maintenance expenditures across all your projects.
        </p>
        <button style={{ background: 'var(--accent-color)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold' }}>
          Generate Report
        </button>
      </div>
    </div>
  );
}
