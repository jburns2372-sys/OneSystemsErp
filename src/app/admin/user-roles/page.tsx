import { getUsersWithRoles } from '@/app/actions/user-roles';
import UserRoleClient from './UserRoleClient';

export const dynamic = 'force-dynamic';

export default async function UserRolesPage() {
  const { users, roles } = await getUsersWithRoles();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <UserRoleClient 
        initialUsers={users} 
        initialRoles={roles} 
      />
    </div>
  );
}
