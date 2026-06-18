import styles from '../page.module.css';
import { getAllDocuments } from '@/app/actions/documentActions';
import { prisma } from '@/lib/prisma';
import DocumentDashboardClient from './DocumentDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DocumentsPage() {
  const docs = await getAllDocuments();
  const projects = await prisma.project.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } });

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Centralized Documents</h1>
          <p>Manage, upload, and track all system files securely.</p>
        </div>
      </header>
      
      <DocumentDashboardClient initialDocs={docs} projects={projects} />
    </div>
  );
}
