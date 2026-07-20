import { verifySession } from '@/lib/dal/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ModuleKnowledgeTab from '@/app/knowledge-center/ModuleKnowledgeTab';
import PaymentProfileControls from './PaymentProfileControls';
import EditWorkerButton from './EditWorkerButton';
import { cookies } from 'next/headers';
import { getUserPermissions } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export default async function WorkerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const userId = __session?.id || '';
  const permissions = await getUserPermissions(userId);

  const { id } = await params;
  const worker = await prisma.worker.findUnique({
    where: { id },
    include: {
      payrolls: {
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      aiValidationResults: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!worker) {
    return <div style={{ padding: '20px', color: '#fff' }}>Worker not found.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>{worker.firstName} {worker.lastName}</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-secondary)' }}>{worker.designation} • {worker.employmentType.replace(/_/g, ' ')}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/workers" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none' }}>
            Back to Directory
          </Link>
          <EditWorkerButton worker={worker} />
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginTop: 0 }}>Basic Info</h2>
          <p><strong>Worker ID:</strong> {worker.workerId || 'N/A'}</p>
          <p><strong>Status:</strong> {worker.employmentStatus}</p>
          <p><strong>Category:</strong> {worker.workerCategory}</p>
          <p><strong>Date Hired:</strong> {worker.dateHired ? new Date(worker.dateHired).toLocaleDateString() : 'N/A'}</p>
        </div>

        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginTop: 0 }}>Compensation & Rate</h2>
          <p><strong>Rate Type:</strong> {worker.rateType.replace(/_/g, ' ')}</p>
          
          {permissions?.IS_GUEST_USER ? (
            <p><strong>Compensation Details:</strong> <span style={{ color: 'var(--text-secondary)' }}>Masked for Guest User</span></p>
          ) : (
            <>
              {worker.rateType === 'DAILY_RATE' && <p><strong>Daily Rate:</strong> ₱{worker.dailyRate?.toLocaleString()}</p>}
              {worker.rateType === 'MONTHLY_SALARY' && <p><strong>Monthly Salary:</strong> ₱{worker.basicMonthlySalary?.toLocaleString()}</p>}
              {worker.rateType === 'ONE_LOT' && <p><strong>Contract Amount:</strong> ₱{worker.contractAmount?.toLocaleString()}</p>}
              {worker.rateType === 'PROFESSIONAL_FEE' && <p><strong>Professional Fee:</strong> ₱{worker.professionalFee?.toLocaleString()}</p>}
            </>
          )}
          
          <p><strong>Payroll Mode:</strong> {worker.payrollMode}</p>
        </div>

        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginTop: 0 }}>Government IDs</h2>
          {permissions?.IS_GUEST_USER ? (
            <>
              <p><strong>TIN:</strong> ****-****-1234</p>
              <p><strong>SSS:</strong> ****-****-1234</p>
              <p><strong>PhilHealth:</strong> ****-****-1234</p>
              <p><strong>Pag-IBIG:</strong> ****-****-1234</p>
            </>
          ) : (
            <>
              <p><strong>TIN:</strong> {worker.tinNumber || <span style={{ color: '#e74c3c' }}>Missing</span>}</p>
              <p><strong>SSS:</strong> {worker.sssNumber || <span style={{ color: '#f1c40f' }}>Missing</span>}</p>
              <p><strong>PhilHealth:</strong> {worker.philHealthNumber || <span style={{ color: '#f1c40f' }}>Missing</span>}</p>
              <p><strong>Pag-IBIG:</strong> {worker.pagIbigNumber || <span style={{ color: '#f1c40f' }}>Missing</span>}</p>
            </>
          )}
        </div>

        <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '20px', border: '1px solid var(--glass-border)' }}>
          <h2 style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '10px', marginTop: 0 }}>AI Validation Logs</h2>
          {worker.aiValidationResults.length === 0 ? (
            <p style={{ color: '#2ecc71' }}>No warnings found during registration.</p>
          ) : (
            <ul style={{ paddingLeft: '20px', margin: 0 }}>
              {worker.aiValidationResults.map(log => (
                <li key={log.id} style={{ marginBottom: '10px' }}>
                  <span style={{ color: log.severity === 'CRITICAL' ? '#e74c3c' : '#f1c40f' }}>[{log.severity}]</span> {log.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <PaymentProfileControls worker={worker} />

      <div style={{ marginTop: '20px' }}>
        <ModuleKnowledgeTab moduleId={worker.id} moduleType="workerId" />
      </div>
    </div>
  );
}
