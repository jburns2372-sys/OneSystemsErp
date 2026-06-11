import styles from './page.module.css';

import { getDashboardStats } from '@/app/actions/project';
import RoleDashboardClient from './RoleDashboardClient';

export default async function Home() {
  const stats = await getDashboardStats();

  return (
    <RoleDashboardClient stats={stats} />
  );
}
