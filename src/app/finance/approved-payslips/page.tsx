import { prisma } from '@/lib/prisma';
import ApprovedPayslipsClient from './ApprovedPayslipsClient';

export const dynamic = 'force-dynamic';

export default async function ApprovedPayslipsPage() {
  const payslips = await prisma.payroll.findMany({
    where: {
      payrollPeriod: {
        isLocked: true,
      },
      paymentStatus: {
        in: ['PENDING', 'ON_HOLD', 'EXCEPTION']
      }
    },
    include: {
      worker: true,
      payrollPeriod: true,
    },
    orderBy: {
      payrollPeriod: {
        endDate: 'desc'
      }
    }
  });

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem', background: 'linear-gradient(45deg, #00C9FF, #92FE9D)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Approved Payslip Queue
          </h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>
            Review, validate, and prepare locked payslips for payment release.
          </p>
        </div>
      </header>

      <ApprovedPayslipsClient payslips={payslips} />
    </div>
  );
}
