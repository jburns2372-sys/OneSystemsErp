import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Helper to define permissions
const canRead = { canView: true };
const canPrepare = { canView: true, canCreate: true, canEditDraft: true, canSubmit: true, canUploadAttachment: true };
const canReview = { canView: true, canReview: true, canRecommend: true, canReturnForCorrection: true };
const canApprove = { canView: true, canApprove: true, canReject: true, canReturnForCorrection: true };
const canPay = { canView: true, canReleasePayment: true, canMarkAsPaid: true };
const canAllAdmin = { canView: true, canCreate: true, canEditDraft: true, canSubmit: true, canReview: true, canRecommend: true, canApprove: true, canReject: true, canReturnForCorrection: true, canCancel: true, canRevise: true, canLock: true, canUnlockWithAuthorization: true, canUploadAttachment: true, canViewAuditLogs: true };

async function grant(roleName: string, moduleCode: string, perms: any) {
  const role = await prisma.role.findFirst({ where: { roleName: roleName } });
  const mod = await prisma.module.findFirst({ where: { moduleName: moduleCode } });
  
  if (role && mod) {
    await prisma.rolePermission.upsert({
      where: { roleId_moduleId: { roleId: role.id, moduleId: mod.id } },
      update: perms,
      create: { roleId: role.id, moduleId: mod.id, moduleName: mod.moduleName, ...perms }
    });
  }
}

async function main() {
  console.log("Seeding matrix permissions...");

  // SYSTEM ADMIN
  await grant("SYSTEM_ADMIN", "USER_MANAGEMENT", canAllAdmin);
  await grant("SYSTEM_ADMIN", "AWARDED_BOQ_UPLOAD", canAllAdmin);
  await grant("SYSTEM_ADMIN", "SYSTEM_SETTINGS", canAllAdmin);
  await grant("SYSTEM_ADMIN", "AUDIT_LOGS", canAllAdmin);
  await grant("SYSTEM_ADMIN", "ROLE_MANAGEMENT", canAllAdmin);

  // PROJECT DIRECTOR
  const pdModules = ["AWARDED_BOQ_UPLOAD", "BOQ_CONSOLIDATION", "MATERIALS_REQUEST", "PURCHASE_ORDER", "EXPENSE_LEDGER", "PETTY_CASH", "PAYROLL", "WORKER_DATABASE", "SUBCONTRACTING", "PROJECT_ACCOMPLISHMENT", "PROGRESS_BILLING", "REPORTS", "VARIATION_ORDERS"];
  for (const m of pdModules) await grant("PROJECT_DIRECTOR", m, canApprove);
  await grant("PROJECT_DIRECTOR", "AUDIT_LOGS", canRead);

  // PROJECT MANAGER
  const pmModules = ["AWARDED_BOQ_UPLOAD", "BOQ_CONSOLIDATION", "MATERIALS_REQUEST", "CANVASSING", "PURCHASE_ORDER", "DELIVERY_RECEIVING", "INVENTORY", "MATERIAL_ISSUANCE", "EXPENSE_LEDGER", "PETTY_CASH", "PAYROLL", "WORKER_DATABASE", "SUBCONTRACTING", "PROJECT_ACCOMPLISHMENT", "PROGRESS_BILLING", "REPORTS"];
  for (const m of pmModules) await grant("PROJECT_MANAGER", m, canReview);

  // PROJECT ACCOUNTANT
  const paPrepare = ["AWARDED_BOQ_UPLOAD", "PURCHASE_ORDER", "EXPENSE_LEDGER", "PETTY_CASH", "PAYROLL", "SUBCONTRACTING", "PROGRESS_BILLING"];
  for (const m of paPrepare) await grant("PROJECT_ACCOUNTANT", m, canPrepare);
  await grant("ACCOUNTANT", "EXPENSE_LEDGER", canPrepare); // alias
  await grant("ACCOUNTANT", "PETTY_CASH", canPrepare); // alias
  
  // FINANCE OFFICER
  const foPay = ["PURCHASE_ORDER", "EXPENSE_LEDGER", "PETTY_CASH", "PAYROLL", "SUBCONTRACTING", "PROGRESS_BILLING"];
  for (const m of foPay) await grant("FINANCE_OFFICER", m, { ...canPay, ...canApprove }); // FO also approves payments
  
  // MATERIALS ENGINEER
  await grant("MATERIALS_ENGINEER", "BOQ_CONSOLIDATION", canPrepare);
  await grant("MATERIALS_ENGINEER", "MATERIALS_REQUEST", canPrepare);
  await grant("MATERIALS_ENGINEER", "DELIVERY_RECEIVING", canReview);
  await grant("MATERIALS_ENGINEER", "INVENTORY", canReview);
  await grant("MATERIALS_ENGINEER", "MATERIAL_ISSUANCE", canReview);

  // PURCHASING OFFICER
  await grant("PURCHASING_OFFICER", "CANVASSING", canPrepare);
  await grant("PURCHASING_OFFICER", "PURCHASING", canPrepare);
  await grant("PURCHASING_OFFICER", "PURCHASE_ORDER", canPrepare);

  // STOCKMAN
  await grant("STOCKMAN", "DELIVERY_RECEIVING", canPrepare);
  await grant("STOCKMAN", "INVENTORY", canPrepare);
  await grant("STOCKMAN", "MATERIAL_ISSUANCE", canPrepare);

  // COST OFFICER
  await grant("COST_OFFICER", "BOQ_CONSOLIDATION", canReview);
  await grant("COST_OFFICER", "PROGRESS_BILLING", canReview);
  await grant("COST_OFFICER", "SUBCONTRACTING", canReview);
  await grant("COST_OFFICER", "AWARDED_BOQ_UPLOAD", canRead);
  await grant("COST_OFFICER", "MATERIALS_REQUEST", canRead);
  await grant("COST_OFFICER", "DELIVERY_RECEIVING", canRead);
  await grant("COST_OFFICER", "MATERIAL_ISSUANCE", canRead);

  // PME / PEE
  await grant("PME", "PROJECT_ACCOMPLISHMENT", canReview);
  await grant("PME", "AWARDED_BOQ_UPLOAD", canRead);
  await grant("PEE", "PROJECT_ACCOMPLISHMENT", canReview);
  await grant("PEE", "AWARDED_BOQ_UPLOAD", canRead);

  // SITE ADMIN
  await grant("SITE_ADMIN", "EXPENSE_LEDGER", canPrepare);
  await grant("SITE_ADMIN", "DTR_UPLOAD", canPrepare);

  // PAYROLL OFFICER
  await grant("PAYROLL_OFFICER", "PAYROLL", canPrepare);
  await grant("PAYROLL_MASTER", "PAYROLL", canPrepare); // alias
  await grant("PAYROLL_OFFICER", "WORKER_DATABASE", canRead);
  await grant("PAYROLL_MASTER", "WORKER_DATABASE", canRead);

  // HR OFFICER
  await grant("HR_OFFICER", "WORKER_DATABASE", canPrepare);

  // BILLING ENGINEER
  await grant("BILLING_ENGINEER", "PROJECT_ACCOMPLISHMENT", canPrepare);
  await grant("BILLING_ENGINEER", "PROGRESS_BILLING", canPrepare);

  // AUDITOR
  const audModules = ["USER_MANAGEMENT", "CANVASSING", "PURCHASE_ORDER", "INVENTORY", "EXPENSE_LEDGER", "PETTY_CASH", "PAYROLL", "SUBCONTRACTING", "PROGRESS_BILLING", "AUDIT_LOGS"];
  for (const m of audModules) await grant("AUDITOR", m, { ...canRead, canViewAuditLogs: true });

  // GUEST USER
  await grant("GUEST_USER", "PROJECT_ACCOMPLISHMENT", canRead);
  await grant("GUEST_USER", "REPORTS", canRead);

  console.log("Seeding completed!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
