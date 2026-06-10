import styles from '../../page.module.css';
import { prisma } from '@/lib/prisma';
import PayrollPeriodClient from './PayrollPeriodClient';
import { notFound } from 'next/navigation';

export default async function PayrollPeriodPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const period = await prisma.payrollPeriod.findUnique({
    where: { id },
    include: {
      dtrs: {
        include: { worker: true }
      },
      payrolls: {
        include: { worker: true }
      }
    }
  });

  if (!period) return notFound();

  let workers = await prisma.worker.findMany({
    orderBy: { lastName: 'asc' }
  });

  const categoryMap: Record<string, string> = {
    'WEEKLY': 'Weekly Salaried',
    'SEMI_MONTHLY': 'Semi-Monthly',
    'MONTHLY': 'Monthly'
  };
  const allowedCategory = categoryMap[period.calendarRule];

  if (allowedCategory) {
    workers = workers.filter(w => w.payrollCategory === allowedCategory);
  }

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>
            Payroll Period: {period.month}/{period.year} - {period.periodType.replace('_', ' ')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '5px', fontSize: '0.95rem' }}>
            <strong>Cutoff Period:</strong> {new Date(period.startDate).toLocaleDateString()} to {new Date(period.endDate).toLocaleDateString()} &nbsp;|&nbsp; <strong>Payroll Date:</strong> {new Date(period.payrollDate).toLocaleDateString()}
          </p>
        </div>
        <PayrollPeriodClient period={period} workers={workers} />
      </header>
    </div>
  );
}
