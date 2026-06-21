import React from 'react';
import styles from '../../page.module.css';
import { getAIValidations, getFleetSafetyEvents, getAIDashboardStats } from '@/app/actions/equipmentActions';
import AIClient from './AIClient';

export default async function AICenterPage() {
  const [validations, safetyEvents, stats] = await Promise.all([
    getAIValidations(),
    getFleetSafetyEvents(50),
    getAIDashboardStats()
  ]);

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>AI Optimization Center</h1>
          <p>Predictive maintenance alerts, utilization audits, and automated safety reviews.</p>
        </div>
      </header>

      <AIClient
        initialValidations={validations as any}
        initialSafetyEvents={safetyEvents as any}
        initialStats={stats}
      />
    </div>
  );
}
