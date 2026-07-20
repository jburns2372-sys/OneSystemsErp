import { verifySession } from '@/lib/dal/auth';
import { prisma } from '@/lib/prisma';
import KeywordRegistryClient from './KeywordRegistryClient';
import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AIKeywordRegistryPage() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  const permissions = await getUserPermissions(sessionId);

  if (!permissions.IS_ADMIN) {
    redirect('/');
  }

  // Safe fallback if Prisma client hasn't been regenerated yet
  const keywords = await (prisma as any).aiRagKeywordRegistry?.findMany({
    orderBy: { keyword: 'asc' }
  }) || [];

  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>AI RAG Keyword Registry</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Manage the semantic aliases, synonyms, and database mappings that the AI uses to understand user queries.
        </p>
      </header>

      <KeywordRegistryClient initialKeywords={keywords} />
    </div>
  );
}
