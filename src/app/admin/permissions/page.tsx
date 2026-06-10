import { getRolesAndModules } from '@/app/actions/permissions';
import PermissionMatrixClient from './PermissionMatrixClient';
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
