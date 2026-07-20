// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Granting FULL access to SUPER_ADMIN...');

  const adminRole = await prisma.role.findFirst({
    where: { roleCode: 'SUPER_ADMIN' }
  });

  if (!adminRole) {
    console.error('SUPER_ADMIN role not found');
    return;
  }

  // Get all known modules in the system from the Module table
  const allModules = await prisma.module.findMany();

  // Also include a comprehensive hardcoded list of every possible module
  const comprehensiveModules = [
    'SYSTEM_ROLES', 'PROCUREMENT', 'WORKER_DATABASE', 'DELIVERY_RECEIVING', 
    'PURCHASE_ORDER', 'PAYROLL', 'FINANCE', 'INVENTORY', 'PROJECT_MANAGEMENT', 
    'SUBCONTRACTING', 'ACCOMPLISHMENTS', 'EQUIPMENT', 'VARIATION_ORDERS', 
    'REPORTS', 'DOCUMENTS', 'KNOWLEDGE_CENTER', 'AI_COMMAND_CENTER'
  ];

  const uniqueModules = new Set([...allModules.map(m => m.moduleName), ...comprehensiveModules]);

  for (const modName of uniqueModules) {
    const mod = await prisma.module.upsert({
      where: { moduleName: modName },
      update: {},
      create: { moduleName: modName }
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: adminRole.id, moduleId: mod.id }
    });

    await prisma.rolePermission.create({
      data: {
        role: { connect: { id: adminRole.id } },
        module: { connect: { id: mod.id } },
        moduleName: modName,
        canView: true,
        canCreate: true,
        canEditDraft: true,
        canSubmit: true,
        canReview: true,
        canRecommend: true,
        canApprove: true,
        canReject: true,
        canReturnForCorrection: true,
        canCancel: true,
        canRevise: true,
        canLock: true,
        canUnlockWithAuthorization: true,
        canReleasePayment: true,
        canMarkAsPaid: true,
        canUploadAttachment: true,
        canDownloadAttachment: true,
        canPrint: true,
        canExport: true,
        canDeleteDraft: true,
        canVoidRecord: true,
        canViewAuditLogs: true
      }
    });
  }

  console.log('SUPER_ADMIN has been granted absolute FULL access to all current and future modules!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
