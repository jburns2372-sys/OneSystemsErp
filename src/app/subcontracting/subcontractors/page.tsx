import React from 'react';
import { getSubcontractors } from '@/app/actions/subcontractingActions';
import SubcontractorListClient from './SubcontractorListClient';
import styles from '../../page.module.css';

export default async function SubcontractorMasterListPage() {
  const subcontractors = await getSubcontractors();

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1>Subcontractor Master List</h1>
            <p>Manage and accredit subcontractors for the project.</p>
          </div>
        </div>
      </header>

      <SubcontractorListClient initialData={subcontractors} />
    </div>
  );
}
