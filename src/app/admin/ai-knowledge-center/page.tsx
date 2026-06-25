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

  // Fetch initial stats safely (in case Prisma Client hasn't been regenerated yet)
  const knowledgeMapCount = await (prisma as any).aiKnowledgeMap?.count() || 0;
  const keywordCount = await (prisma as any).aiRagKeywordRegistry?.count() || 0;
  const comparisonCount = await (prisma as any).aiComparisonMap?.count() || 0;
  const embeddingCount = await (prisma as any).aiRagEmbedding?.count() || 0;

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
