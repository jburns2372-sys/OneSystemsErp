import styles from '../projects/page.module.css';
import { prisma } from '@/lib/prisma';
import MaterialIssuanceClient from './MaterialIssuanceClient';
import { getUserPermissions } from '@/lib/permissions';
import { cookies } from 'next/headers';

export default async function MaterialIssuancePage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session')?.value;
  let permissions: Record<string, any> = {};
  
  if (sessionId) {
    permissions = await getUserPermissions(sessionId);
  }
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
    where: permissions.IS_ADMIN ? {} : { consolidatedBOQLocked: true },
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

  return (
    <div className={styles.pageContainer}>
      <MaterialIssuanceClient issuances={issuances} projects={projects} users={users} returns={returns} permissions={permissions} />
    </div>
  );
}
