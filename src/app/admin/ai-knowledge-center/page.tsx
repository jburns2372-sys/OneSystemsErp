import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import KnowledgeCenterClient from './KnowledgeCenterClient';

export default async function AiKnowledgeCenterPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value || '';
  const permissions = await getUserPermissions(sessionId);

  if (!permissions.IS_ADMIN) {
    redirect('/dashboard');
  }

  // Fetch initial stats
  const knowledgeMapCount = await prisma.aiKnowledgeMap.count();
  const keywordCount = await prisma.aiRagKeywordRegistry.count();
  const comparisonCount = await prisma.aiComparisonMap.count();
  const embeddingCount = await prisma.aiRagEmbedding.count();

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🧠</span> AI Knowledge Center
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Master control panel for the Bulk Autodiscovery, Keyword Registry, and RAG Comparison mappings.
        </p>
      </header>

      <KnowledgeCenterClient 
        stats={{ knowledgeMapCount, keywordCount, comparisonCount, embeddingCount }}
      />
    </div>
  );
}
