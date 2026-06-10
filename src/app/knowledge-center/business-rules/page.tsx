import { prisma } from '@/lib/prisma';
import RulesClientPage from './RulesClientPage';

export const dynamic = 'force-dynamic';

export default async function BusinessRulesPage() {
  const rules = await prisma.knowledgeRecord.findMany({
    where: { documentType: 'Business Rule' },
    orderBy: { createdAt: 'desc' }
  });

  return <RulesClientPage initialRules={rules} />;
}
