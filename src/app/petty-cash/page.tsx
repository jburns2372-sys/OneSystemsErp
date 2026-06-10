import styles from '../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import PettyCashClient from './PettyCashClient';
import PCAccountRow from './PCAccountRow';

export const dynamic = 'force-dynamic';

export default async function PettyCashPage() {
  const accounts = await prisma.pettyCashAccount.findMany({
    include: { project: true, custodian: true }
  });
  
  const projects = await prisma.project.findMany({ select: { id: true, name: true } });
  const users = await prisma.user.findMany({ select: { id: true, name: true } });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Petty Cash Accounts</h1>
          <p>Manage project-level petty cash funds.</p>
        </div>
        <PettyCashClient projects={projects} users={users} />
      </header>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Account Details</th>
              <th>Project</th>
              <th>Custodian</th>
              <th>Balance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>No petty cash accounts found.</td>
              </tr>
            ) : accounts.map(account => (
              <PCAccountRow key={account.id} account={account} projects={projects} users={users} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
