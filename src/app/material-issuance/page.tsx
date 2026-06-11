import styles from '../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import MaterialIssuanceClient from './MaterialIssuanceClient';
import { getUserPermissions } from '@/lib/permissions';

export default async function MaterialIssuancePage() {
  const issuances = await prisma.materialIssuance.findMany({
    include: {
      project: true,
      foreman: true,
      warehouseman: true,
      accountant: true,
      releasedBy: true,
      returns: true,
      items: {
        include: {
          consolidatedBoqItem: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const projects = await prisma.project.findMany({
    where: { consolidatedBOQLocked: true }, // Only allow issuance for locked BOQ projects
    select: { id: true, name: true, location: true }
  });

  const returns = await prisma.materialReturn.findMany({
    include: {
      project: true,
      foreman: true,
      warehouseman: true,
      issuance: true,
      items: {
        include: {
          consolidatedBoqItem: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, role: true }
  });

  // Fetch permissions for the logged-in user (using stub user for now)
  const userId = users.length > 0 ? users[0].id : ''; 
  const permissions = await getUserPermissions(userId);

  return (
    <div className={styles.pageContainer}>
      <MaterialIssuanceClient issuances={issuances} projects={projects} users={users} returns={returns} permissions={permissions} />
    </div>
  );
}
