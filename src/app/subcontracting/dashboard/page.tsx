import React from 'react';
import Link from 'next/link';
import styles from '../../page.module.css';
import DashboardClient from './DashboardClient';
import SubcontractListClient from './SubcontractListClient';
import { getSubcontractPackages } from '@/app/actions/subcontractingActions';
import { getJobOrders } from '@/app/actions/jobOrderActions';

const subModules = [
  { name: 'Dashboard', href: '/subcontracting/dashboard', icon: '📊', description: 'Overview and KPIs' },
  { name: 'Subcontractors & Accreditation', href: '/subcontracting/subcontractors', icon: '🏢', description: 'Manage and accredit subcontractors' },
  { name: 'Create Subcontract Hub', href: '/subcontracting/create', icon: '📝', description: 'Unified wizard for Package, POW & BOQ' },
  { name: 'Progress & Payments Hub', href: '/subcontracting/progress-hub', icon: '📈', description: 'Unified Accomplishments, Billings & Payments' },
  { name: 'Retention', href: '/subcontracting/retention', icon: '🔒', description: 'Retention payables' },
  { name: 'Advances', href: '/subcontracting/advances', icon: '💰', description: 'Advance recoupment' },
  { name: 'Back Charges', href: '/subcontracting/back-charges', icon: '⚠️', description: 'Manage back charges' },
  { name: 'Variations', href: '/subcontracting/variations', icon: '🔄', description: 'Variation orders' },
  { name: 'Closeout', href: '/subcontracting/closeout', icon: '🏁', description: 'Final project closeout' },
  { name: 'AI Validation Center', href: '/subcontracting/ai-center', icon: '🤖', description: 'AI flags & audits' },
  { name: 'Reports', href: '/subcontracting/reports', icon: '📊', description: 'Generate reports' },
  { name: 'Settings', href: '/subcontracting/settings', icon: '⚙️', description: 'Module settings' }
];

const joModules = [
  { name: 'Job Orders Dashboard', href: '/job-orders/dashboard', icon: '📊', description: 'Master list and KPIs' },
  { name: 'Create Job Order', href: '/job-orders/create', icon: '⚡', description: 'New short-form JO' },
  { name: 'Progress & Payments Hub', href: '/job-orders/progress-hub', icon: '📈', description: 'Unified Accomplishments, Billings & Payments for JOs' },
];

export default async function SubcontractingDashboard() {
  const packages = await getSubcontractPackages();
  const jobOrders = await getJobOrders();

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Subcontracting & Job Order Hub</h1>
          <p>Centralized management for all subcontracting workflows, job orders, and AI validation.</p>
        </div>
      </header>

      {/* KPI Stats Section */}
      <div className={styles.statsGrid} style={{ marginBottom: '40px' }}>
        <div className={styles.statCard}>
          <h3>Active Subcontracts</h3>
          <div className={styles.statValue}>1</div>
        </div>
        <div className={styles.statCard}>
          <h3>Active Job Orders</h3>
          <div className={styles.statValue}>2</div>
        </div>
        <div className={styles.statCard}>
          <h3>Total Billed Amount</h3>
          <div className={styles.statValue}>₱0.00</div>
        </div>
        <div className={styles.statCard}>
          <h3>Total Payable</h3>
          <div className={styles.statValue}>₱0.00</div>
        </div>
        <div className={styles.statCard}>
          <h3>AI Flags</h3>
          <div className={styles.statValue} style={{ color: '#ef4444' }}>0</div>
        </div>
      </div>

      {/* Modules Grid & Master List */}
      <DashboardClient subModules={subModules} joModules={joModules} packages={packages} jobOrders={jobOrders} />
    </div>
  );
}
