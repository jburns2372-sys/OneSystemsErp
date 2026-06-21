import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting Comprehensive RBAC Matrix Seeding...");

  // ============================================================================
  // ALL SYSTEM ROLES (must match the Role Simulator dropdown in RoleDashboardClient)
  // ============================================================================
  const comprehensiveRoles = [
    'SUPER_ADMIN',
    'PROJECT_DIRECTOR',
    'DIRECTORS',
    'ADMINISTRATOR',
    'PROJECT_MANAGER',
    'PROJECT_ENGINEER',
    'PME',
    'PEE',
    'SITE_ADMIN',
    'SITE_ENGINEER',
    'MATERIALS_ENGINEER',
    'PURCHASING_OFFICER',
    'PROCUREMENT_OFFICER',
    'FINANCE_OFFICER',
    'PROJECT_ACCOUNTANT',
    'ACCOUNTANT',
    'COST_OFFICER',
    'HR_MANAGER',
    'HR_OFFICER',
    'PAYROLL_OFFICER',
    'PAYROLL_MASTER',
    'STOCKMAN',
    'WAREHOUSEMAN',
    'DRIVER',
    'LIASON_OFFICER',
    'CONTRACTS_ADMINISTRATOR',
    'EQUIPMENT_MANAGER',
    'AUDITOR',
    'FOREMAN',
    'BILLING_ENGINEER',
    'GUEST_USER'
  ];

  // ============================================================================
  // ALL MODULES (must match EVERY moduleKey used in Sidebar.tsx)
  // ============================================================================
  const allModules = [
    // Sidebar module keys (directly control sidebar menu visibility)
    'DASHBOARD',
    'PROJECT_MANAGEMENT',
    'AI_COMMAND_CENTER',
    'PROCUREMENT',
    'INVENTORY',
    'MATERIAL_ISSUANCE',
    'FINANCE',
    'SUBCONTRACTING',
    'ACCOMPLISHMENTS',
    'PAYROLL',
    'EQUIPMENT',
    'VARIATION_ORDERS',
    'REPORTS',
    'DOCUMENTS',
    'KNOWLEDGE_CENTER',
    'SYSTEM_ROLES',
    'SYSTEM_SETTINGS',
    // Additional functional modules (used in page-level permission checks)
    'WORKER_DATABASE',
    'DELIVERY_RECEIVING',
    'PURCHASE_ORDER',
  ];

  // 1. Ensure SystemRoles exist
  for (const r of comprehensiveRoles) {
    await prisma.systemRole.upsert({
      where: { name: r },
      update: {},
      create: { name: r }
    });
  }
  console.log(`Ensured ${comprehensiveRoles.length} SystemRoles exist.`);

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
  console.log(`Ensured ${comprehensiveRoles.length} RBAC Roles exist.`);

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
  console.log(`Ensured ${allModules.length} Modules exist.`);

  // 4. Clear existing permissions for a clean slate
  await prisma.rolePermission.deleteMany({});
  console.log("Cleared old permissions for a clean slate.");

  // Helper to grant permissions
  let grantCount = 0;
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
      grantCount++;
    } else {
      console.warn(`SKIP: role=${roleCode} module=${moduleCode} (roleId=${roleId}, moduleId=${moduleId})`);
    }
  }

  // ============================================================================
  // PERMISSION TEMPLATES
  // ============================================================================
  const FULL_ACCESS = {
    canView: true, canCreate: true, canEditDraft: true, canSubmit: true,
    canReview: true, canRecommend: true, canApprove: true, canReject: true,
    canReturnForCorrection: true, canCancel: true, canRevise: true,
    canLock: true, canUnlockWithAuthorization: true,
    canReleasePayment: true, canMarkAsPaid: true,
    canUploadAttachment: true, canDownloadAttachment: true,
    canPrint: true, canExport: true,
    canDeleteDraft: true, canVoidRecord: true, canViewAuditLogs: true
  };

  const VIEW_ONLY = { canView: true };

  const MANAGE_BASIC = {
    canView: true, canCreate: true, canEditDraft: true, canSubmit: true,
    canUploadAttachment: true, canDownloadAttachment: true,
    canPrint: true, canExport: true
  };

  const APPROVER = {
    canView: true, canReview: true, canRecommend: true,
    canApprove: true, canReject: true, canReturnForCorrection: true
  };

  // ============================================================================
  // 5. BUILD THE COMPLETE ACCESS RIGHTS MATRIX
  // ============================================================================

  // --- SUPER_ADMIN: Full access to everything ---
  for (const mod of allModules) {
    await grant('SUPER_ADMIN', mod, FULL_ACCESS);
  }

  // --- PROJECT_DIRECTOR: View all + approve major modules ---
  for (const mod of allModules) {
    await grant('PROJECT_DIRECTOR', mod, { ...VIEW_ONLY, ...APPROVER, canLock: true, canUnlockWithAuthorization: true, canViewAuditLogs: true });
  }

  // --- DIRECTORS: View all + approve ---
  for (const mod of allModules) {
    await grant('DIRECTORS', mod, { ...VIEW_ONLY, ...APPROVER, canLock: true, canUnlockWithAuthorization: true });
  }

  // --- ADMINISTRATOR: Manage + approve all ---
  for (const mod of allModules) {
    await grant('ADMINISTRATOR', mod, { ...MANAGE_BASIC, ...APPROVER });
  }

  // --- PM ROLES: PROJECT_MANAGER, PROJECT_ENGINEER, PME, PEE, SITE_ADMIN ---
  const pmFullModules = [
    'DASHBOARD', 'PROJECT_MANAGEMENT', 'SUBCONTRACTING', 'ACCOMPLISHMENTS',
    'VARIATION_ORDERS', 'REPORTS', 'DOCUMENTS', 'MATERIAL_ISSUANCE', 'KNOWLEDGE_CENTER'
  ];
  for (const role of ['PROJECT_MANAGER', 'PROJECT_ENGINEER', 'PME', 'PEE', 'SITE_ADMIN']) {
    for (const mod of pmFullModules) await grant(role, mod, { ...MANAGE_BASIC, ...APPROVER });
    for (const mod of allModules.filter(m => !pmFullModules.includes(m))) await grant(role, mod, VIEW_ONLY);
  }

  // --- FIELD ROLES: SITE_ENGINEER, FOREMAN, BILLING_ENGINEER ---
  const fieldModules = ['DASHBOARD', 'ACCOMPLISHMENTS', 'PROJECT_MANAGEMENT', 'DOCUMENTS', 'REPORTS', 'MATERIAL_ISSUANCE'];
  for (const role of ['SITE_ENGINEER', 'FOREMAN', 'BILLING_ENGINEER']) {
    for (const mod of fieldModules) await grant(role, mod, MANAGE_BASIC);
  }

  // --- MATERIALS_ENGINEER ---
  const meModules = ['DASHBOARD', 'INVENTORY', 'PROCUREMENT', 'DELIVERY_RECEIVING', 'EQUIPMENT', 'MATERIAL_ISSUANCE', 'REPORTS'];
  for (const mod of meModules) await grant('MATERIALS_ENGINEER', mod, MANAGE_BASIC);
  await grant('MATERIALS_ENGINEER', 'PURCHASE_ORDER', VIEW_ONLY);
  await grant('MATERIALS_ENGINEER', 'PROJECT_MANAGEMENT', VIEW_ONLY);
  await grant('MATERIALS_ENGINEER', 'DOCUMENTS', VIEW_ONLY);

  // --- PURCHASING_OFFICER & PROCUREMENT_OFFICER ---
  const purchasingModules = ['DASHBOARD', 'PROCUREMENT', 'PURCHASE_ORDER', 'DELIVERY_RECEIVING', 'REPORTS'];
  for (const role of ['PURCHASING_OFFICER', 'PROCUREMENT_OFFICER']) {
    for (const mod of purchasingModules) await grant(role, mod, MANAGE_BASIC);
    await grant(role, 'INVENTORY', VIEW_ONLY);
    await grant(role, 'PROJECT_MANAGEMENT', VIEW_ONLY);
    await grant(role, 'DOCUMENTS', VIEW_ONLY);
  }

  // --- FINANCE_OFFICER ---
  const financeFullModules = ['DASHBOARD', 'FINANCE', 'PAYROLL', 'PURCHASE_ORDER', 'SUBCONTRACTING'];
  for (const mod of financeFullModules) await grant('FINANCE_OFFICER', mod, { ...MANAGE_BASIC, ...APPROVER, canReleasePayment: true, canMarkAsPaid: true });
  for (const mod of allModules.filter(m => !financeFullModules.includes(m))) await grant('FINANCE_OFFICER', mod, VIEW_ONLY);

  // --- PROJECT_ACCOUNTANT & ACCOUNTANT ---
  const accountantModules = ['DASHBOARD', 'FINANCE', 'PAYROLL', 'REPORTS', 'DOCUMENTS'];
  for (const role of ['PROJECT_ACCOUNTANT', 'ACCOUNTANT']) {
    for (const mod of accountantModules) await grant(role, mod, MANAGE_BASIC);
    await grant(role, 'PROCUREMENT', VIEW_ONLY);
    await grant(role, 'INVENTORY', VIEW_ONLY);
    await grant(role, 'PURCHASE_ORDER', VIEW_ONLY);
    await grant(role, 'SUBCONTRACTING', VIEW_ONLY);
    await grant(role, 'PROJECT_MANAGEMENT', VIEW_ONLY);
  }

  // --- COST_OFFICER ---
  const costModules = ['DASHBOARD', 'REPORTS'];
  for (const mod of costModules) await grant('COST_OFFICER', mod, MANAGE_BASIC);
  await grant('COST_OFFICER', 'FINANCE', VIEW_ONLY);
  await grant('COST_OFFICER', 'PROJECT_MANAGEMENT', VIEW_ONLY);
  await grant('COST_OFFICER', 'PROCUREMENT', VIEW_ONLY);
  await grant('COST_OFFICER', 'ACCOMPLISHMENTS', VIEW_ONLY);
  await grant('COST_OFFICER', 'SUBCONTRACTING', VIEW_ONLY);

  // --- HR_MANAGER, HR_OFFICER, PAYROLL_OFFICER, PAYROLL_MASTER ---
  const hrModules = ['DASHBOARD', 'WORKER_DATABASE', 'PAYROLL', 'REPORTS'];
  for (const role of ['HR_MANAGER', 'HR_OFFICER', 'PAYROLL_OFFICER', 'PAYROLL_MASTER']) {
    for (const mod of hrModules) await grant(role, mod, { ...MANAGE_BASIC, ...APPROVER });
    await grant(role, 'DOCUMENTS', MANAGE_BASIC);
    await grant(role, 'PROJECT_MANAGEMENT', VIEW_ONLY);
    await grant(role, 'FINANCE', VIEW_ONLY);
  }

  // --- STOCKMAN, WAREHOUSEMAN ---
  const stockModules = ['DASHBOARD', 'DELIVERY_RECEIVING', 'INVENTORY', 'MATERIAL_ISSUANCE'];
  for (const role of ['STOCKMAN', 'WAREHOUSEMAN']) {
    for (const mod of stockModules) await grant(role, mod, { ...MANAGE_BASIC, canApprove: false });
    await grant(role, 'PROCUREMENT', VIEW_ONLY);
    await grant(role, 'REPORTS', VIEW_ONLY);
    await grant(role, 'DOCUMENTS', VIEW_ONLY);
  }

  // --- DRIVER ---
  await grant('DRIVER', 'DASHBOARD', VIEW_ONLY);
  await grant('DRIVER', 'DELIVERY_RECEIVING', MANAGE_BASIC);
  await grant('DRIVER', 'INVENTORY', VIEW_ONLY);
  await grant('DRIVER', 'DOCUMENTS', VIEW_ONLY);

  // --- LIASON_OFFICER ---
  await grant('LIASON_OFFICER', 'DASHBOARD', VIEW_ONLY);
  await grant('LIASON_OFFICER', 'DELIVERY_RECEIVING', MANAGE_BASIC);
  await grant('LIASON_OFFICER', 'INVENTORY', VIEW_ONLY);
  await grant('LIASON_OFFICER', 'PROCUREMENT', VIEW_ONLY);
  await grant('LIASON_OFFICER', 'DOCUMENTS', MANAGE_BASIC);

  // --- CONTRACTS_ADMINISTRATOR ---
  const contractsModules = ['DASHBOARD', 'SUBCONTRACTING', 'VARIATION_ORDERS', 'REPORTS', 'DOCUMENTS'];
  for (const mod of contractsModules) await grant('CONTRACTS_ADMINISTRATOR', mod, MANAGE_BASIC);
  await grant('CONTRACTS_ADMINISTRATOR', 'PROJECT_MANAGEMENT', VIEW_ONLY);
  await grant('CONTRACTS_ADMINISTRATOR', 'ACCOMPLISHMENTS', VIEW_ONLY);
  await grant('CONTRACTS_ADMINISTRATOR', 'FINANCE', VIEW_ONLY);

  // --- EQUIPMENT_MANAGER ---
  const equipModules = ['DASHBOARD', 'EQUIPMENT', 'REPORTS'];
  for (const mod of equipModules) await grant('EQUIPMENT_MANAGER', mod, { ...MANAGE_BASIC, ...APPROVER });
  await grant('EQUIPMENT_MANAGER', 'PROJECT_MANAGEMENT', VIEW_ONLY);
  await grant('EQUIPMENT_MANAGER', 'INVENTORY', VIEW_ONLY);
  await grant('EQUIPMENT_MANAGER', 'DOCUMENTS', MANAGE_BASIC);

  // --- AUDITOR: View-only access to all modules ---
  for (const mod of allModules) await grant('AUDITOR', mod, { ...VIEW_ONLY, canViewAuditLogs: true });

  // --- GUEST_USER: Strictly limited ---
  await grant('GUEST_USER', 'DASHBOARD', VIEW_ONLY);
  await grant('GUEST_USER', 'REPORTS', VIEW_ONLY);
  await grant('GUEST_USER', 'KNOWLEDGE_CENTER', VIEW_ONLY);

  console.log(`\nComprehensive Matrix seeded successfully! Total permissions created: ${grantCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
