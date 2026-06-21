import React from 'react';
import styles from '../../page.module.css';
import { getUtilizationLogs, getUtilizationOptions, getUtilizationSummary } from '@/app/actions/equipmentActions';
import UtilizationClient from './UtilizationClient';

export default async function UtilizationPage() {
  const [logs, options, summary] = await Promise.all([
    getUtilizationLogs(),
    getUtilizationOptions(),
    getUtilizationSummary()
  ]);

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Utilization Logs</h1>
          <p>Track engine hours, fuel consumption, and operator tasks — synchronized with Equipment Registry, Deployments, and FMS Telemetry.</p>
        </div>
      </header>

      <UtilizationClient
        initialLogs={logs as any}
        initialOptions={options as any}
        initialSummary={summary}
      />
    </div>
  );
}
