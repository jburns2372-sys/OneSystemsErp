import styles from './page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

import AddUserButton from './AddUserButton';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>System Users</h1>
          <p>Manage access and roles for all personnel.</p>
        </div>
        <AddUserButton />
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>No users found.</td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id}>
                <td>
                  <div className={styles.userName}>{user.name}</div>
                </td>
                <td>{user.email || 'N/A'}</td>
                <td>
                  <span className={styles.roleBadge}>{user.role}</span>
                </td>
                <td>
                  <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                </td>
                <td>
                  <Link href={`/users/${user.id}`} className={styles.actionLink}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
