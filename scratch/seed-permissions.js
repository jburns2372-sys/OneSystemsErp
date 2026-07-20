const fs = require('fs');
const dotenv = require('dotenv');

// Load .env.production first
const envConfig = dotenv.parse(fs.readFileSync('.env.production'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Get SYSTEM_ADMIN role
  const sysAdminRole = await prisma.role.findFirst({
    where: { roleCode: 'SYSTEM_ADMIN' }
  });

  if (!sysAdminRole) {
    console.log("No SYSTEM_ADMIN role found.");
    return;
  }

  // 2. Get all permissions for SYSTEM_ADMIN
  const sysAdminPerms = await prisma.rolePermission.findMany({
    where: { roleId: sysAdminRole.id }
  });

  if (sysAdminPerms.length === 0) {
    console.log("SYSTEM_ADMIN has no permissions to copy.");
    return;
  }

  // 3. Get all other roles
  const allRoles = await prisma.role.findMany({
    where: { roleCode: { not: 'SYSTEM_ADMIN' } }
  });

  console.log(`Found ${allRoles.length} other roles to apply permissions to.`);

  for (const role of allRoles) {
    console.log(`Applying to ${role.roleCode}...`);
    for (const perm of sysAdminPerms) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_moduleId: {
            roleId: role.id,
            moduleId: perm.moduleId
          }
        },
        update: {
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
          canSubmit: perm.canSubmit,
          canApprove: perm.canApprove,
          canReject: perm.canReject,
          canCancel: perm.canCancel,
          canUpload: perm.canUpload,
          canDownload: perm.canDownload,
          canExport: perm.canExport,
          canPrint: perm.canPrint,
          canImport: perm.canImport,
          canGenerate: perm.canGenerate,
          canProcess: perm.canProcess,
          canPost: perm.canPost,
          canPay: perm.canPay,
          canRelease: perm.canRelease,
          canLock: perm.canLock,
          canUnlock: perm.canUnlock,
          canConfigure: perm.canConfigure,
          canManageUsers: perm.canManageUsers,
          canManageRoles: perm.canManageRoles,
          canResetData: perm.canResetData,
          canBackupRestore: perm.canBackupRestore,
          canRunWriteAIAction: perm.canRunWriteAIAction,
          canOverrideAIValidation: perm.canOverrideAIValidation,
          canEditDraft: perm.canEditDraft,
          canVoidRecord: perm.canVoidRecord,
          canViewAuditLogs: perm.canViewAuditLogs,
          canUploadAttachment: perm.canUploadAttachment,
          canDownloadAttachment: perm.canDownloadAttachment,
          canReturnForCorrection: perm.canReturnForCorrection,
          canRevise: perm.canRevise,
          canUnlockWithAuthorization: perm.canUnlockWithAuthorization,
          canReleasePayment: perm.canReleasePayment,
          canMarkAsPaid: perm.canMarkAsPaid,
          canDeleteDraft: perm.canDeleteDraft
        },
        create: {
          roleId: role.id,
          moduleId: perm.moduleId,
          moduleName: perm.moduleName,
          canView: perm.canView,
          canCreate: perm.canCreate,
          canEdit: perm.canEdit,
          canUpdate: perm.canUpdate,
          canDelete: perm.canDelete,
          canSubmit: perm.canSubmit,
          canApprove: perm.canApprove,
          canReject: perm.canReject,
          canCancel: perm.canCancel,
          canUpload: perm.canUpload,
          canDownload: perm.canDownload,
          canExport: perm.canExport,
          canPrint: perm.canPrint,
          canImport: perm.canImport,
          canGenerate: perm.canGenerate,
          canProcess: perm.canProcess,
          canPost: perm.canPost,
          canPay: perm.canPay,
          canRelease: perm.canRelease,
          canLock: perm.canLock,
          canUnlock: perm.canUnlock,
          canConfigure: perm.canConfigure,
          canManageUsers: perm.canManageUsers,
          canManageRoles: perm.canManageRoles,
          canResetData: perm.canResetData,
          canBackupRestore: perm.canBackupRestore,
          canRunWriteAIAction: perm.canRunWriteAIAction,
          canOverrideAIValidation: perm.canOverrideAIValidation,
          canEditDraft: perm.canEditDraft,
          canVoidRecord: perm.canVoidRecord,
          canViewAuditLogs: perm.canViewAuditLogs,
          canUploadAttachment: perm.canUploadAttachment,
          canDownloadAttachment: perm.canDownloadAttachment,
          canReturnForCorrection: perm.canReturnForCorrection,
          canRevise: perm.canRevise,
          canUnlockWithAuthorization: perm.canUnlockWithAuthorization,
          canReleasePayment: perm.canReleasePayment,
          canMarkAsPaid: perm.canMarkAsPaid,
          canDeleteDraft: perm.canDeleteDraft
        }
      });
    }
  }
  
  console.log("Done!");
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
