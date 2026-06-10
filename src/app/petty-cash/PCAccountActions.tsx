'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from '../projects/page.module.css';
import EditPCAccountModal from './EditPCAccountModal';

export default function PCAccountActions({ account, projects, users }: { account: any, projects: any[], users: any[] }) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  return (
    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
      <button 
        onClick={() => setIsEditOpen(true)}
        style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
      >
        Edit
      </button>
      <Link href={`/petty-cash/${account.id}`} className={styles.actionLink}>
        View Ledger
      </Link>

      {isEditOpen && (
        <EditPCAccountModal 
          account={account}
          projects={projects}
          users={users}
          onClose={() => setIsEditOpen(false)}
        />
      )}
    </div>
  );
}
