import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const rolesData = JSON.parse(fs.readFileSync('roles.json', 'utf8'));
  console.log(`Loaded ${rolesData.length} roles from JSON.`);

  for (const role of rolesData) {
    console.log(`Upserting role: ${role.roleCode}`);
    const createdRole = await prisma.role.upsert({
      where: { roleCode: role.roleCode },
      update: {
        roleName: role.roleName,
        description: role.description,
        isActive: role.isActive
      },
      create: {
        roleName: role.roleName,
        roleCode: role.roleCode,
        description: role.description,
        isActive: role.isActive
      }
    });

    if (role.rolePermissions && role.rolePermissions.length > 0) {
      for (const perm of role.rolePermissions) {
        await prisma.module.upsert({
          where: { id: perm.moduleId },
          update: { moduleName: perm.moduleName },
          create: { id: perm.moduleId, moduleName: perm.moduleName }
        });

        await prisma.rolePermission.upsert({
          where: {
            roleId_moduleId: {
              roleId: createdRole.id,
              moduleId: perm.moduleId
            }
          },
          update: {
            moduleName: perm.moduleName,
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEditDraft: perm.canEditDraft,
            canSubmit: perm.canSubmit,
            canReview: perm.canReview,
            canRecommend: perm.canRecommend,
            canApprove: perm.canApprove,
            canReject: perm.canReject,
            canReturnForCorrection: perm.canReturnForCorrection,
            canCancel: perm.canCancel,
            canRevise: perm.canRevise,
            canLock: perm.canLock,
            canUnlockWithAuthorization: perm.canUnlockWithAuthorization,
            canReleasePayment: perm.canReleasePayment,
            canMarkAsPaid: perm.canMarkAsPaid,
            canUploadAttachment: perm.canUploadAttachment,
            canDownloadAttachment: perm.canDownloadAttachment,
            canPrint: perm.canPrint,
            canExport: perm.canExport,
            canDeleteDraft: perm.canDeleteDraft,
            canVoidRecord: perm.canVoidRecord,
            canViewAuditLogs: perm.canViewAuditLogs
          },
          create: {
            roleId: createdRole.id,
            moduleId: perm.moduleId,
            moduleName: perm.moduleName,
            canView: perm.canView,
            canCreate: perm.canCreate,
            canEditDraft: perm.canEditDraft,
            canSubmit: perm.canSubmit,
            canReview: perm.canReview,
            canRecommend: perm.canRecommend,
            canApprove: perm.canApprove,
            canReject: perm.canReject,
            canReturnForCorrection: perm.canReturnForCorrection,
            canCancel: perm.canCancel,
            canRevise: perm.canRevise,
            canLock: perm.canLock,
            canUnlockWithAuthorization: perm.canUnlockWithAuthorization,
            canReleasePayment: perm.canReleasePayment,
            canMarkAsPaid: perm.canMarkAsPaid,
            canUploadAttachment: perm.canUploadAttachment,
            canDownloadAttachment: perm.canDownloadAttachment,
            canPrint: perm.canPrint,
            canExport: perm.canExport,
            canDeleteDraft: perm.canDeleteDraft,
            canVoidRecord: perm.canVoidRecord,
            canViewAuditLogs: perm.canViewAuditLogs
          }
        });
      }
    }
  }

  console.log("Done seeding roles!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
