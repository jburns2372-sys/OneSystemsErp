import React from 'react';
import styles from '../../page.module.css';
import { getEquipmentList } from '@/app/actions/equipmentActions';
import RegistryClient from './RegistryClient';

export default async function EquipmentRegistry() {
  const equipment = await getEquipmentList();

  return (
    <div className={styles.dashboardContainer} style={{ maxWidth: '1400px' }}>
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h1>Equipment Registry</h1>
          <p>Master list of all company-owned and rented machinery, fleet vehicles, and connected FMS devices.</p>
        </div>
      </header>

      <RegistryClient initialData={equipment} />
    </div>
  );
}
