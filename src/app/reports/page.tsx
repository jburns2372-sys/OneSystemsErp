import styles from '../page.module.css';

import { getFinancialReport, getProjectReport, getInventoryReport } from '@/app/actions/reportActions';
import ReportsClient from './ReportsClient';

export default async function ReportsPage() {
  const financialData = await getFinancialReport();
  const projectData = await getProjectReport();
  const inventoryData = await getInventoryReport();

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Analytics & Reports Hub</h1>
          <p>Generate, view, and print aggregate system reports.</p>
        </div>
      </header>
      
      <div style={{ padding: '20px' }}>
        <ReportsClient 
          financialData={financialData} 
          projectData={projectData} 
          inventoryData={inventoryData} 
        />
      </div>
    </div>
  );
}
