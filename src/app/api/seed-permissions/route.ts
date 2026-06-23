import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Get SYSTEM_ADMIN role
    const sysAdminRole = await prisma.role.findFirst({
      where: { roleCode: 'SYSTEM_ADMIN' }
    });

    if (!sysAdminRole) {
      return NextResponse.json({ success: false, message: "No SYSTEM_ADMIN role found." });
    }

    // 2. Get all permissions for SYSTEM_ADMIN
    const sysAdminPerms = await prisma.rolePermission.findMany({
      where: { roleId: sysAdminRole.id }
    });

    if (sysAdminPerms.length === 0) {
      return NextResponse.json({ success: false, message: "SYSTEM_ADMIN has no permissions to copy." });
    }

    // 3. Get all other roles
    const allRoles = await prisma.role.findMany({
      where: { roleCode: { not: 'SYSTEM_ADMIN' } }
    });

    let appliedCount = 0;

    for (const role of allRoles) {
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
      appliedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully cloned SYSTEM_ADMIN matrix to ${appliedCount} other roles.` 
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
