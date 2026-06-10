import styles from '../../page.module.css';
import { prisma } from '@/lib/prisma';
import PayrollSettingsClient from './PayrollSettingsClient';

export default async function PayrollSettingsPage() {
  const cutoffs = await prisma.payrollCutoffSetting.findMany({
    orderBy: { createdAt: 'desc' }
  });

  // Default government settings are usually stored as a single row in GovernmentSettings
  let govSettings = await prisma.governmentSettings.findFirst();
  if (!govSettings) {
    // Just in case it's completely empty
    govSettings = {
      phEmployeeRate: 2.5,
      pagibigEmployeeRate: 2.0,
      deductionSchedule: 'SPLIT'
    } as any;
  }

  const cashAdvances = await prisma.deductionLedger.findMany({
    where: { status: 'ACTIVE', type: 'CASH_ADVANCE' },
    include: { worker: true }
  });

  const loans = await prisma.deductionLedger.findMany({
    where: { status: 'ACTIVE', type: 'LOAN' },
    include: { worker: true }
  });

  const allowances = await prisma.allowance.findMany({
    where: { status: 'ACTIVE' },
    include: { worker: true }
  });

  const workers = await prisma.worker.findMany({
    where: { employmentStatus: 'ACTIVE' },
    orderBy: { lastName: 'asc' }
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Payroll Configuration & Deductions</h1>
        </div>
      </header>

      <PayrollSettingsClient 
        cutoffs={cutoffs}
        govSettings={govSettings}
        cashAdvances={cashAdvances}
        loans={loans}
        allowances={allowances}
        workers={workers}
      />
    </div>
  );
}
