import React from 'react';
import styles from '../../page.module.css';
import { getMaintenanceLogs, getMaintenanceOptions, getMaintenanceSummary } from '@/app/actions/equipmentActions';
import MaintenanceClient from './MaintenanceClient';

export default async function MaintenancePage() {
  const [logs, options, summary] = await Promise.all([
    getMaintenanceLogs(),
    getMaintenanceOptions(),
    getMaintenanceSummary()
  ]);

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Maintenance &amp; Repairs</h1>
          <p>Preventive maintenance scheduling, repair tracking, and FMS fault code integration.</p>
        </div>
      </header>

      <MaintenanceClient
        initialLogs={logs as any}
        initialOptions={options as any}
        initialSummary={summary}
      />
    </div>
  );
}
