import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RagTestClient from './RagTestClient';

export default async function RagTestCenterPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value || '';
  const permissions = await getUserPermissions(sessionId);

  if (!permissions.IS_ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>AI RAG Test Center</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Diagnostic tool to test how the AntiGravity AI Assistant breaks down questions, detects intents, and searches the live database.
        </p>
      </header>

      <RagTestClient />
    </div>
  );
}
