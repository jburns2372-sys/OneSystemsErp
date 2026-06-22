// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const backupPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./backups/dev_backup_2026-06-17T10-11-25-573Z.db",
    },
  },
});

const devPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./dev.db",
    },
  },
});

async function main() {
  try {
    const rolePermissions = await backupPrisma.rolePermission.findMany();
    console.log(`Found ${rolePermissions.length} RolePermissions in backup.`);

    if (rolePermissions.length > 0) {
      // Clear existing first
      await devPrisma.rolePermission.deleteMany({});
      
      // Insert from backup
      await devPrisma.rolePermission.createMany({
        data: rolePermissions
      });
      
      console.log('Successfully restored RolePermission matrix.');
    } else {
      console.log('No RolePermissions found in backup either.');
    }
  } catch (error) {
    console.error("Restore failed:", error);
  } finally {
    await backupPrisma.$disconnect();
    await devPrisma.$disconnect();
  }
}

main();
