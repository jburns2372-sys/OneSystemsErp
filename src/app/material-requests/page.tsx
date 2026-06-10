import styles from '../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { cookies } from 'next/headers';
import PermissionGuard from '@/components/PermissionGuard';
import { getUserPermissions } from '@/lib/permissions';

import CreateMRFDropdown from './CreateMRFDropdown';

export const dynamic = 'force-dynamic';

export default async function MaterialRequestsPage() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('session')?.value || '';
  const permissions = await getUserPermissions(userId);

  const requests = await prisma.materialRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: { 
      project: true, 
      requester: true,
      _count: {
        select: { items: true }
      }
    }
  });

  const lockedProjects = await prisma.project.findMany({
    where: { consolidatedBOQLocked: true },
    select: { id: true, name: true }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Material Requests</h1>
          <p>Review and manage material requisitions across all projects.</p>
        </div>
        <PermissionGuard permissions={permissions} moduleName="PROCUREMENT" action="canCreate">
          <CreateMRFDropdown projects={lockedProjects} />
        </PermissionGuard>
      </header>

      <PermissionGuard permissions={permissions} moduleName="PROCUREMENT" action="canView" fallback={<div style={{ padding: '20px', color: '#ef4444' }}>You do not have permission to view Material Requests.</div>}>
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>MR Number</th>
                <th>Project</th>
                <th>Requester</th>
                <th>Priority</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyState}>No material requests found.</td>
                </tr>
              ) : requests.map(req => (
                <tr key={req.id}>
                  <td>
                    <div className={styles.projectName}>{req.mrNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{req.purpose || 'No purpose specified'}</div>
                  </td>
                  <td>{req.project.name}</td>
                  <td>{req.requester.name}</td>
                  <td>
                    <span style={{
                      fontWeight: 'bold',
                      color: req.priority === 'URGENT' ? '#ef4444' : 
                             req.priority === 'HIGH' ? '#f97316' : 
                             req.priority === 'LOW' ? '#94a3b8' : 'var(--text-primary)'
                    }}>
                      {req.priority}
                    </span>
                  </td>
                  <td>{req._count.items} items</td>
                  <td>
                    <span className={`${styles.badge} ${styles['status-' + req.status.toLowerCase()]} badge-${req.status}`}>
                      {req.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <Link href={`/material-requests/${req.id}`} className={styles.actionLink}>View Details</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PermissionGuard>

      <style>{`
        .btn-primary {
          background-color: var(--accent-color);
          color: #000;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 0 10px var(--accent-glow);
          transition: all 0.2s;
        }
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 15px var(--accent-glow);
        }
        .badge-DRAFT { background-color: rgba(148, 163, 184, 0.2); color: #cbd5e1; }
        .badge-AI_CHECKING { background-color: rgba(56, 189, 248, 0.2); color: #38bdf8; }
        .badge-SUBMITTED { background-color: rgba(250, 204, 21, 0.2); color: #facc15; }
        .badge-FOR_REVIEW { background-color: rgba(168, 85, 247, 0.2); color: #c084fc; }
        .badge-APPROVED { background-color: rgba(74, 222, 128, 0.2); color: #4ade80; }
        .badge-REJECTED { background-color: rgba(248, 113, 113, 0.2); color: #f87171; }
        .badge-RETURNED { background-color: rgba(251, 146, 60, 0.2); color: #fb923c; }
      `}</style>
    </div>
  );
}
