import styles from '../page.module.css';
import { prisma } from '@/lib/prisma';
import DirectorAuditClient from './DirectorAuditClient';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function DirectorAuditPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  const currentUserId = sessionId || 'demo-user-id';

  // Basic check - would normally use real RBAC matrix, but for now we assume anyone here is acting as Director
  // Or we can just let it through for the demo

  const pendingOverrides = await prisma.aIValidationOverride.findMany({
    where: {
      approvedBy: null
    },
    include: {
      validationResult: true
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const recentLogs = await prisma.aITransactionValidation.findMany({
    take: 20,
    orderBy: {
      createdAt: 'desc'
    }
  });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Director's Audit & Override Dashboard</h1>
        </div>
      </header>
      
      <div style={{ padding: '20px' }}>
        <DirectorAuditClient 
          pendingOverrides={pendingOverrides} 
          recentLogs={recentLogs} 
          currentUserId={currentUserId} 
        />
      </div>
    </div>
  );
}
