import { getRolesAndModules } from '@/app/actions/permissions';
import PermissionMatrixClient from './PermissionMatrixClient';
import Layout from '@/components/Layout'; // Assuming standard layout, will adjust if needed or just use default Next.js layout

export const dynamic = 'force-dynamic';

export default async function PermissionsPage() {
  const { roles, modules, rolePermissions } = await getRolesAndModules();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <PermissionMatrixClient 
        initialRoles={roles} 
        initialModules={modules} 
        initialPermissions={rolePermissions} 
      />
    </div>
  );
}
