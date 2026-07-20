import { verifySession } from '@/lib/dal/auth';
import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import CoverageClient from './CoverageClient';

export default async function RagCoveragePage() {
  const cookieStore = await cookies();
  const __session = await verifySession();
  const sessionId = __session?.id || '';
  const permissions = await getUserPermissions(sessionId);

  if (!permissions.IS_ADMIN) {
    redirect('/');
  }

  // 1. Calculate Schema Coverage
  const dmmf = Prisma.dmmf;
  const models = dmmf.datamodel.models;
  const totalTables = models.length;
  let totalFields = 0;
  for (const m of models) {
    totalFields += m.fields.length;
  }

  // Count from DB
  const mappedTables = await (prisma as any).aiRagKeywordRegistry?.count({
    where: { keywordType: 'database_table', isActive: true }
  }) || 0;

  const mappedFields = await (prisma as any).aiRagKeywordRegistry?.count({
    where: { keywordType: 'database_field', isActive: true }
  }) || 0;

  const uiKeywords = await (prisma as any).aiRagKeywordRegistry?.count({
    where: { keywordType: 'workflow', isActive: true }
  }) || 0;

  const totalKeywords = await (prisma as any).aiRagKeywordRegistry?.count({
    where: { isActive: true }
  }) || 0;

  const tableCoverage = totalTables > 0 ? (mappedTables / totalTables) * 100 : 0;
  const fieldCoverage = totalFields > 0 ? (mappedFields / totalFields) * 100 : 0;
  
  // A rough combined score where fields have more weight
  const coverageScore = Math.min(100, Math.round((tableCoverage * 0.3) + (fieldCoverage * 0.7)));

  return (
    <div style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      <header style={{ marginBottom: '30px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '20px' }}>
        <h1 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🎯</span> RAG Coverage Score
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Monitor the health and completeness of the AI Keyword Registry.
        </p>
      </header>

      <CoverageClient 
        score={coverageScore}
        totalTables={totalTables}
        mappedTables={mappedTables}
        totalFields={totalFields}
        mappedFields={mappedFields}
        uiKeywords={uiKeywords}
        totalKeywords={totalKeywords}
      />
    </div>
  );
}
