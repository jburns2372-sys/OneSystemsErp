import { prisma } from '@/lib/prisma';
import KeywordRegistryClient from './KeywordRegistryClient';
import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AIKeywordRegistryPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value || '';
  const permissions = await getUserPermissions(sessionId);

  if (!permissions.IS_ADMIN) {
    redirect('/dashboard');
  }

  const keywords = await prisma.aiRagKeywordRegistry.findMany({
    orderBy: { keywordType: 'asc' }
  });

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
