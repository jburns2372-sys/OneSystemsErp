import styles from '../page.module.css';

import CommandCenterClient from './CommandCenterClient';

export default function AICommandCenterPage() {
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>AI Command Center</h1>
          <p>Talk directly to the ERP Assistant for live stats and policy enforcement.</p>
        </div>
      </header>

      <div style={{ padding: '20px' }}>
        <CommandCenterClient />
      </div>
    </div>
  );
}
