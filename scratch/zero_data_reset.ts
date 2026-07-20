// @ts-nocheck
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting Zero Data Reset...');

  const modelsToKeep = [
    'User',
    'Role',
    'SystemRole',
    'UserRole',
    'RolePermission',
    'Module',
    'DocumentTemplate',
    'KnowledgeReference',
    'KnowledgeRecord'
  ];

  const allModels = Prisma.dmmf.datamodel.models.map(m => m.name);
  const tablesToTruncate = allModels.filter(m => !modelsToKeep.includes(m));

  for (const table of tablesToTruncate) {
    try {
      console.log(`Truncating table: ${table} (CASCADE)`);
      // Use double quotes for Postgres table names
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (e: any) {
      console.warn(`Could not truncate ${table}. Error: ${e.message}`);
    }
  }

  // Clear non-superadmin users
  console.log('Clearing non-admin users...');

  const users = await prisma.user.findMany({
    include: { userRoles: { include: { role: true } } }
  });

  for (const user of users) {
    const isSuperAdmin = user.email === 'pd@gmail.com' || 
                         user.role === 'PROJECT_DIRECTOR' || 
                         user.role === 'SUPER_ADMIN';
                         
    const hasAdminRole = user.userRoles?.some(ur => 
      ur.role?.roleCode === 'SUPER_ADMIN' || 
      ur.role?.name === 'SUPER_ADMIN'
    );
    
    if (!isSuperAdmin && !hasAdminRole) {
      try {
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`Deleted user: ${user.email || user.roleName}`);
      } catch (e: any) {
        console.warn(`Failed to delete user ${user.email}. Error: ${e.message}`);
      }
    } else {
       console.log(`Preserved admin user: ${user.email || user.name}`);
    }
  }

  console.log('Zero Data Reset completed successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
