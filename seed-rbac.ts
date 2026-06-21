import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Master RBAC Rights...');

  const allRoles = await prisma.role.findMany();
  const roleMap: Record<string, string> = {};
  allRoles.forEach(r => roleMap[r.roleCode] = r.id);

  // Define the Strict Master Rules by roleCode
  const permissionsData = [
    // --- SYSTEM ADMIN ---
    { roleCode: 'SUPER_ADMIN', module: 'SYSTEM_ROLES', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },
    { roleCode: 'SUPER_ADMIN', module: 'PROCUREMENT', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },
    { roleCode: 'SUPER_ADMIN', module: 'WORKER_DATABASE', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },
    { roleCode: 'SUPER_ADMIN', module: 'DELIVERY_RECEIVING', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },
    { roleCode: 'SUPER_ADMIN', module: 'PURCHASE_ORDER', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },
    { roleCode: 'SUPER_ADMIN', module: 'PAYROLL', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },
    { roleCode: 'SUPER_ADMIN', module: 'FINANCE', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },
    { roleCode: 'SUPER_ADMIN', module: 'INVENTORY', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: true, canApprove: true },

    // --- MATERIALS ENGINEER ---
    { roleCode: 'MATERIALS_ENGINEER', module: 'PROCUREMENT', canView: true, canCreate: true, canEditDraft: false, canDeleteDraft: false, canApprove: false },

    // --- PURCHASING OFFICER ---
    { roleCode: 'PURCHASING_OFFICER', module: 'PROCUREMENT', canView: true, canCreate: false, canEditDraft: true, canDeleteDraft: false, canApprove: false },
    { roleCode: 'PURCHASING_OFFICER', module: 'PURCHASE_ORDER', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: false, canApprove: false },

    // --- PROJECT DIRECTOR ---
    { roleCode: 'PROJECT_DIRECTOR', module: 'PROCUREMENT', canView: true, canCreate: false, canEditDraft: false, canDeleteDraft: false, canApprove: true },
    { roleCode: 'PROJECT_DIRECTOR', module: 'PURCHASE_ORDER', canView: true, canCreate: false, canEditDraft: false, canDeleteDraft: false, canApprove: true },
    { roleCode: 'PROJECT_DIRECTOR', module: 'DELIVERY_RECEIVING', canView: true, canCreate: false, canEditDraft: false, canDeleteDraft: false, canApprove: true },

    // --- PROJECT MANAGER ---
    { roleCode: 'PROJECT_MANAGER', module: 'WORKER_DATABASE', canView: true, canCreate: false, canEditDraft: false, canDeleteDraft: false, canApprove: true },

    // --- FINANCE OFFICER ---
    { roleCode: 'FINANCE_OFFICER', module: 'PAYROLL', canView: true, canCreate: false, canEditDraft: false, canDeleteDraft: false, canApprove: true, canReleasePayment: true },
    { roleCode: 'FINANCE_OFFICER', module: 'FINANCE', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: false, canApprove: true },

    // --- STOCKMAN ---
    { roleCode: 'STOCKMAN', module: 'DELIVERY_RECEIVING', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: false, canApprove: false },
    { roleCode: 'STOCKMAN', module: 'INVENTORY', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: false, canApprove: false },

    // --- PROJECT ACCOUNTANT ---
    { roleCode: 'PROJECT_ACCOUNTANT', module: 'FINANCE', canView: true, canCreate: true, canEditDraft: true, canDeleteDraft: false, canApprove: false },

    // --- COST OFFICER ---
    { roleCode: 'COST_OFFICER', module: 'FINANCE', canView: true, canCreate: false, canEditDraft: true, canDeleteDraft: false, canApprove: true },

    // --- GUEST USER ---
    { roleCode: 'GUEST_USER', module: 'PROCUREMENT', canView: true, canCreate: false, canEditDraft: false, canDeleteDraft: false, canApprove: false }
  ];

  // 3. Apply the permissions to the database
  for (const p of permissionsData) {
    const roleId = roleMap[p.roleCode];
    if (!roleId) continue;

    // Ensure the module exists first
    const mod = await prisma.module.upsert({
      where: { moduleName: p.module },
      update: {},
      create: { moduleName: p.module }
    });

    // Delete any existing permission to prevent unique constraint issues
    await prisma.rolePermission.deleteMany({
      where: { roleId, moduleId: mod.id }
    });

    await prisma.rolePermission.create({
      data: {
        role: { connect: { id: roleId } },
        module: { connect: { id: mod.id } },
        moduleName: p.module, // Required string scalar
        canView: p.canView,
        canCreate: p.canCreate,
        canEditDraft: p.canEditDraft,
        canDeleteDraft: p.canDeleteDraft,
        canApprove: p.canApprove,
        ...('canReleasePayment' in p ? { canReleasePayment: (p as any).canReleasePayment } : {})
      }
    });
  }

  // Explicitly block GUEST USER from everything else just in case
  const guestRoleId = roleMap['GUEST_USER'];
  if (guestRoleId) {
     const guestModulesToBlock = ['DELIVERY_RECEIVING', 'PURCHASE_ORDER', 'PAYROLL', 'WORKER_DATABASE', 'FINANCE', 'SYSTEM_ROLES', 'INVENTORY'];
     for (const modName of guestModulesToBlock) {
       const mod = await prisma.module.upsert({
         where: { moduleName: modName },
         update: {},
         create: { moduleName: modName }
       });
       
       await prisma.rolePermission.deleteMany({
         where: { roleId: guestRoleId, moduleId: mod.id }
       });

       await prisma.rolePermission.create({
         data: { 
           role: { connect: { id: guestRoleId } }, 
           module: { connect: { id: mod.id } }, 
           moduleName: modName, 
           canView: true, canCreate: false, canEditDraft: false, canDeleteDraft: false, canApprove: false 
         }
       });
     }
  }

  console.log('Master RBAC Rights strictly enforced in the live database!');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
