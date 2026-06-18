import React from 'react';
import SubcontractorFormClient from './SubcontractorFormClient';
import styles from '../../../page.module.css';

export default function CreateSubcontractorPage() {
  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Register New Subcontractor</h1>
          <p>Enter the company, compliance, and contact details to begin the accreditation process.</p>
        </div>
      </header>

      <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <SubcontractorFormClient />
      </div>
    </div>
  );
}
