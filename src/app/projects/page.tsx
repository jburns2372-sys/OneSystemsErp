import styles from './page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import NewProjectButton from './NewProjectButton';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { createdAt: 'desc' },
    include: { manager: true }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Projects</h1>
          <p>Manage and monitor all active construction projects.</p>
        </div>
        <NewProjectButton />
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Contract Amount</th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>No projects found.</td>
              </tr>
            ) : projects.map(project => (
              <tr key={project.id}>
                <td>
                  <div className={styles.projectName}>{project.name}</div>
                  <div className={styles.projectLocation}>{project.location || 'No location specified'}</div>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles['status-' + project.status.toLowerCase()] || styles.badgeDefault}`}>
                    {project.status}
                  </span>
                </td>
                <td className={styles.amount}>
                  ₱ {project.contractAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td>{project.manager?.name || 'Unassigned'}</td>
                <td>
                  <Link href={`/projects/${project.id}`} className={styles.actionLink}>View Details</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
