import { prisma } from '@/lib/prisma';
import NotebooksClientPage from './NotebooksClientPage';

export const dynamic = 'force-dynamic';

export default async function NotebooksPage() {
  const notebooks = await prisma.knowledgeRecord.findMany({
    where: { documentType: 'Notebook Link' },
    orderBy: { createdAt: 'desc' }
  });

  return <NotebooksClientPage initialNotebooks={notebooks} />;
}
