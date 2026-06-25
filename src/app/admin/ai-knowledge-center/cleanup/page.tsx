import { prisma } from '@/lib/prisma';
import CleanupClient from './CleanupClient';
import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function RegistryCleanupPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value || '';
  const permissions = await getUserPermissions(sessionId);

  if (!permissions.IS_ADMIN) {
    redirect('/dashboard');
  }

  // Get current stats
  const totalKeywords = await (prisma as any).aiRagKeywordRegistry?.count({ where: { isActive: true } }) || 0;
  
  // Try to find if there's any report to show rollback
  const lastReport = await (prisma as any).aiRegistryCleanupReport?.findFirst({
    orderBy: { runAt: 'desc' }
  });

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>Registry Cleanup & Deduplication</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Run the AI cleanup engine to merge duplicate keywords, migrate table fields to the Schema Map, and move frontend UI labels to the Action Registry.
        </p>
      </header>

      <CleanupClient 
        totalKeywords={totalKeywords} 
        lastReport={lastReport} 
        adminUserId={permissions.userId}
      />
    </div>
  );
}
