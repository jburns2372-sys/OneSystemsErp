import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Comprehensive RBAC Matrix Seeding...");

  const comprehensiveRoles = [
    'SYSTEM_ADMIN',
    'PROJECT_DIRECTOR',
    'PROJECT_MANAGER',
    'SITE_ENGINEER',
    'MATERIALS_ENGINEER',
    'PURCHASING_OFFICER',
    'FINANCE_OFFICER',
    'PROJECT_ACCOUNTANT',
    'COST_OFFICER',
    'HR_MANAGER',
    'STOCKMAN',
    'CONTRACTS_ADMINISTRATOR',
    'EQUIPMENT_MANAGER',
    'GUEST_USER'
  ];

  const allModules = [
    'SYSTEM_ROLES', 'PROCUREMENT', 'WORKER_DATABASE', 'DELIVERY_RECEIVING', 
    'PURCHASE_ORDER', 'PAYROLL', 'FINANCE', 'INVENTORY', 'PROJECT_MANAGEMENT', 
    'SUBCONTRACTING', 'ACCOMPLISHMENTS', 'EQUIPMENT', 'VARIATION_ORDERS', 
    'REPORTS', 'DOCUMENTS', 'KNOWLEDGE_CENTER', 'AI_COMMAND_CENTER'
  ];

  // 1. Ensure SystemRoles exist
  for (const r of comprehensiveRoles) {
    await prisma.systemRole.upsert({
      where: { name: r },
      update: {},
      create: { name: r }
    });
  }

  // 2. Ensure RBAC Roles exist
  const roleMap: Record<string, string> = {};
  for (const r of comprehensiveRoles) {
    const role = await prisma.role.findFirst({ where: { roleCode: r } });
    if (role) {
      roleMap[r] = role.id;
    } else {
      const newRole = await prisma.role.create({
        data: { roleName: r, roleCode: r, description: r }
      });
      roleMap[r] = newRole.id;
    }
  }

  // 3. Ensure Modules exist
  const moduleMap: Record<string, string> = {};
  for (const m of allModules) {
    const mod = await prisma.module.upsert({
      where: { moduleName: m },
      update: {},
      create: { moduleName: m }
    });
    moduleMap[m] = mod.id;
  }

  // 4. Clear existing permissions for a clean slate
  await prisma.rolePermission.deleteMany({});
  console.log("Cleared old permissions for a clean slate.");

  // Helper to grant permissions
  async function grant(roleCode: string, moduleCode: string, perms: any) {
    const roleId = roleMap[roleCode];
    const moduleId = moduleMap[moduleCode];
    if (roleId && moduleId) {
      await prisma.rolePermission.create({
        data: {
          roleId,
          moduleId,
          moduleName: moduleCode,
          ...perms
        }
      });
    }
  }

  const FULL_ACCESS = { canView: true, canCreate: true, canEditDraft: true, canSubmit: true, canReview: true, canRecommend: true, canApprove: true, canReject: true, canReturnForCorrection: true, canCancel: true, canRevise: true, canLock: true, canUnlockWithAuthorization: true, canReleasePayment: true, canMarkAsPaid: true, canUploadAttachment: true, canDownloadAttachment: true, canPrint: true, canExport: true, canDeleteDraft: true, canVoidRecord: true, canViewAuditLogs: true };
  const VIEW_ONLY = { canView: true };
  const MANAGE_BASIC = { canView: true, canCreate: true, canEditDraft: true, canSubmit: true, canUploadAttachment: true, canDownloadAttachment: true, canPrint: true, canExport: true };
  const APPROVER = { canView: true, canReview: true, canRecommend: true, canApprove: true, canReject: true, canReturnForCorrection: true };

  // 5. Define Matrix
  for (const mod of allModules) {
    // SYSTEM_ADMIN gets everything
    await grant('SYSTEM_ADMIN', mod, FULL_ACCESS);
    
    // PROJECT_DIRECTOR gets view everything and approve major modules
    await grant('PROJECT_DIRECTOR', mod, { ...VIEW_ONLY, ...APPROVER, canLock: true, canUnlockWithAuthorization: true });
    
    // GUEST gets view only for reports and knowledge center
    if (['REPORTS', 'KNOWLEDGE_CENTER'].includes(mod)) {
      await grant('GUEST_USER', mod, VIEW_ONLY);
    }
  }

  // PROJECT_MANAGER
  const pmModules = ['PROJECT_MANAGEMENT', 'SUBCONTRACTING', 'ACCOMPLISHMENTS', 'VARIATION_ORDERS', 'REPORTS', 'DOCUMENTS'];
  for (const mod of pmModules) await grant('PROJECT_MANAGER', mod, { ...MANAGE_BASIC, ...APPROVER });
  for (const mod of allModules.filter(m => !pmModules.includes(m))) await grant('PROJECT_MANAGER', mod, VIEW_ONLY);

  // SITE_ENGINEER
  await grant('SITE_ENGINEER', 'ACCOMPLISHMENTS', MANAGE_BASIC);
  await grant('SITE_ENGINEER', 'PROJECT_MANAGEMENT', VIEW_ONLY);
  await grant('SITE_ENGINEER', 'DOCUMENTS', MANAGE_BASIC);

  // MATERIALS_ENGINEER
  const meModules = ['INVENTORY', 'PROCUREMENT', 'DELIVERY_RECEIVING', 'EQUIPMENT'];
  for (const mod of meModules) await grant('MATERIALS_ENGINEER', mod, MANAGE_BASIC);
  await grant('MATERIALS_ENGINEER', 'PURCHASE_ORDER', VIEW_ONLY);

  // PURCHASING_OFFICER
  await grant('PURCHASING_OFFICER', 'PROCUREMENT', MANAGE_BASIC);
  await grant('PURCHASING_OFFICER', 'PURCHASE_ORDER', MANAGE_BASIC);
  await grant('PURCHASING_OFFICER', 'INVENTORY', VIEW_ONLY);

  // FINANCE_OFFICER
  const financeModules = ['FINANCE', 'PAYROLL', 'PURCHASE_ORDER', 'SUBCONTRACTING'];
  for (const mod of financeModules) await grant('FINANCE_OFFICER', mod, { ...MANAGE_BASIC, ...APPROVER, canReleasePayment: true, canMarkAsPaid: true });
  for (const mod of allModules.filter(m => !financeModules.includes(m))) await grant('FINANCE_OFFICER', mod, VIEW_ONLY);

  // PROJECT_ACCOUNTANT
  await grant('PROJECT_ACCOUNTANT', 'FINANCE', MANAGE_BASIC);
  await grant('PROJECT_ACCOUNTANT', 'PAYROLL', MANAGE_BASIC);

  // COST_OFFICER
  await grant('COST_OFFICER', 'FINANCE', VIEW_ONLY);
  await grant('COST_OFFICER', 'REPORTS', MANAGE_BASIC);
  await grant('COST_OFFICER', 'PROJECT_MANAGEMENT', VIEW_ONLY);

  // HR_MANAGER
  await grant('HR_MANAGER', 'WORKER_DATABASE', { ...MANAGE_BASIC, ...APPROVER });
  await grant('HR_MANAGER', 'PAYROLL', VIEW_ONLY);

  // STOCKMAN
  await grant('STOCKMAN', 'DELIVERY_RECEIVING', MANAGE_BASIC);
  await grant('STOCKMAN', 'INVENTORY', { ...MANAGE_BASIC, canApprove: false });

  // CONTRACTS_ADMINISTRATOR
  await grant('CONTRACTS_ADMINISTRATOR', 'SUBCONTRACTING', MANAGE_BASIC);
  await grant('CONTRACTS_ADMINISTRATOR', 'VARIATION_ORDERS', MANAGE_BASIC);

  // EQUIPMENT_MANAGER
  await grant('EQUIPMENT_MANAGER', 'EQUIPMENT', { ...MANAGE_BASIC, ...APPROVER });

  console.log("Comprehensive Matrix seeded successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
