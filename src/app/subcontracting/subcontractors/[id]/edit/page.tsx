import React from 'react';
import SubcontractorFormClient from '../../create/SubcontractorFormClient';
import { getSubcontractorById } from '@/app/actions/subcontractingActions';
import { notFound } from 'next/navigation';
import styles from '../../../../page.module.css';

export default async function EditSubcontractorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subcontractor = await getSubcontractorById(id);

  if (!subcontractor) {
    notFound();
  }

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Edit Subcontractor</h1>
          <p>Update the company, compliance, and contact details.</p>
        </div>
      </header>

      <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <SubcontractorFormClient initialData={subcontractor} id={subcontractor.id} />
      </div>
    </div>
  );
}
