import styles from './page.module.css';

import { getDashboardStats } from './actions/project';

export default async function Home() {
  const stats = await getDashboardStats();

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.header}>
        <h1>Dashboard Overview</h1>
        <p>Welcome back! Here is a summary of all project activities.</p>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Active Projects</h3>
          <p className={styles.statValue}>{stats.totalProjects}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Pending Material Requests</h3>
          <p className={styles.statValue}>{stats.pendingMRs}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Awarded Contract Amount</h3>
          <p className={styles.statValue}>₱ {stats.totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={styles.statCard}>
          <h3>System Users</h3>
          <p className={styles.statValue}>{stats.totalUsers}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Total Expenses</h3>
          <p className={styles.statValue} style={{ color: '#ef4444' }}>₱ {stats.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Outstanding Payables</h3>
          <p className={styles.statValue} style={{ color: '#f97316' }}>₱ {stats.totalPayables.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className={styles.statCard}>
          <h3>% Accomplishment</h3>
          <p className={styles.statValue} style={{ color: '#22c55e' }}>{stats.accomplishmentPercentage.toFixed(2)}%</p>
        </div>
      </div>

      <div className={styles.chartsArea}>
        <div className={styles.chartPlaceholder}>
          <h3>Project Accomplishments</h3>
          <div className={styles.emptyChart}>Chart Area</div>
        </div>
        <div className={styles.chartPlaceholder}>
          <h3>Recent Activities</h3>
          <div className={styles.emptyChart}>List Area</div>
        </div>
      </div>
    </div>
  );
}
