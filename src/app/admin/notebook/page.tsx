import { getReferenceFiles } from '@/app/actions/notebook';
import NotebookClient from './NotebookClient';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function NotebookPage() {
  // Mock current user fetching. In production this uses next-auth getServerSession.
  // We'll just grab a mock admin for demonstration purposes.
  const adminRole = await prisma.role.findFirst({ where: { roleCode: 'SUPER_ADMIN' } });
  const currentUser = await prisma.user.findFirst(); // Replace with actual session logic
  
  if (!currentUser) redirect('/login');

  const files = await getReferenceFiles();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <NotebookClient 
        initialFiles={files} 
        currentUser={{ id: currentUser.id, role: adminRole?.roleCode || 'SUPER_ADMIN' }} 
      />
    </div>
  );
}
