import { prisma } from '@/lib/prisma';
import BatchGeneratorClient from './BatchGeneratorClient';

export const dynamic = 'force-dynamic';

export default async function NewBatchPage() {
  const lockedPeriods = await prisma.payrollPeriod.findMany({
    where: { isLocked: true },
    orderBy: { endDate: 'desc' }
  });

  const accounts = await prisma.payrollBankAccount.findMany({
    where: { status: 'ACTIVE' }
  });

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', color: '#fff' }}>
      <h1 style={{ marginBottom: '10px' }}>Generate Payment Batch</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>
        Select a locked payroll period and an active funding account to generate a new GCash or Bank Transfer payment batch.
      </p>

      <BatchGeneratorClient periods={lockedPeriods} accounts={accounts} />
    </div>
  );
}
