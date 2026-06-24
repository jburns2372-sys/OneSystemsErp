import styles from './page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PermissionGuard from '@/components/PermissionGuard';
import { getUserPermissions } from '@/lib/permissions';
import NewProjectButton from './NewProjectButton';
import ManagerAssigner from './ManagerAssigner';
import DeleteProjectButton from './DeleteProjectButton';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value || '';
  const permissions = await getUserPermissions(userId);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isSuperAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SYSTEM_ADMIN';

  const projects = await prisma.project.findMany({
    where: isSuperAdmin ? {} : {
      userAssignments: {
        some: {
          userId: userId,
          assignmentStatus: 'active'
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    include: { manager: true }
  });

  const canAssignManager = permissions?.PROJECT_MANAGEMENT?.canUpdate || false;
  let users: any[] = [];
  if (canAssignManager || permissions?.PROJECT_MANAGEMENT?.canCreate) {
    users = await prisma.user.findMany({ 
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' }
    });
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Projects</h1>
          <p>Manage and monitor all active construction projects.</p>
        </div>
        <PermissionGuard permissions={permissions} moduleName="PROJECT_MANAGEMENT" action="canCreate">
          <NewProjectButton users={users} />
        </PermissionGuard>
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Project Name</th>
              <th>Status</th>
              <th>Contract Amount</th>
              <th>Timeline</th>
              <th>Manager</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>No projects found.</td>
              </tr>
            ) : projects.map(project => {
              const formatDate = (d: any) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBA';
              return (
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
                <td style={{ fontSize: '0.85rem', color: '#4b5563', whiteSpace: 'nowrap' }}>
                  <div><strong>Start:</strong> {formatDate(project.startDate)}</div>
                  <div style={{ marginTop: '4px' }}><strong>Target:</strong> {formatDate(project.revisedCompletionDate || project.originalCompletionDate)}</div>
                </td>
                <td>
                  <ManagerAssigner 
                    projectId={project.id} 
                    currentManager={project.manager} 
                    users={users} 
                    canEdit={canAssignManager} 
                  />
                </td>
                <td style={{ display: 'flex', gap: '15px', alignItems: 'center', height: '100%' }}>
                  <Link href={`/projects/${project.id}`} className={styles.actionLink}>View Details</Link>
                  <PermissionGuard permissions={permissions} moduleName="PROJECT_MANAGEMENT" action="canDelete">
                    <DeleteProjectButton projectId={project.id} />
                  </PermissionGuard>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
