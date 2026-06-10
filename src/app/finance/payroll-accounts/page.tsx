import { prisma } from '@/lib/prisma';
import PayrollAccountsClient from './PayrollAccountsClient';

export default async function PayrollAccountsPage() {
  const accounts = await prisma.payrollBankAccount.findMany({
    orderBy: { dateCreated: 'desc' },
    include: {
      ledgers: {
        orderBy: { transactionDate: 'desc' },
        take: 5
      }
    }
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>Payroll Bank Accounts</h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Manage dedicated bank accounts for automated payroll disbursements.</p>
        </div>
      </header>
      <PayrollAccountsClient accounts={accounts} />
    </div>
  );
}
