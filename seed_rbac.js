const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const roles = [
  { name: 'SYSTEM_ADMIN', code: 'SYSTEM_ADMIN', description: 'Full system control.' },
  { name: 'PROJECT_DIRECTOR', code: 'PROJECT_DIRECTOR', description: 'Executive oversight and final approvals.' },
  { name: 'PROJECT_MANAGER', code: 'PROJECT_MANAGER', description: 'Day-to-day project execution.' },
  { name: 'PROJECT_ACCOUNTANT', code: 'PROJECT_ACCOUNTANT', description: 'Prepares accounting documents.' },
  { name: 'FINANCE_OFFICER', code: 'FINANCE_OFFICER', description: 'Payment release and final check.' },
  { name: 'MATERIALS_ENGINEER', code: 'MATERIALS_ENGINEER', description: 'Controls material planning.' },
  { name: 'PURCHASING_OFFICER', code: 'PURCHASING_OFFICER', description: 'Procurement preparation.' },
  { name: 'STOCKMAN', code: 'STOCKMAN', description: 'Warehouse physical movement.' },
  { name: 'COST_OFFICER', code: 'COST_OFFICER', description: 'Budget and variance tracking.' },
  { name: 'PME', code: 'PME', description: 'Mechanical works validation.' },
  { name: 'PEE', code: 'PEE', description: 'Electrical works validation.' },
  { name: 'SITE_ADMIN', code: 'SITE_ADMIN', description: 'Encodes daily site records.' },
  { name: 'PAYROLL_OFFICER', code: 'PAYROLL_OFFICER', description: 'Payroll computation.' },
  { name: 'HR_OFFICER', code: 'HR_OFFICER', description: 'Worker records.' },
  { name: 'BILLING_ENGINEER', code: 'BILLING_ENGINEER', description: 'Project accomplishment preparation.' },
  { name: 'AUDITOR', code: 'AUDITOR', description: 'Independent review.' },
  { name: 'GUEST_USER', code: 'GUEST_USER', description: 'Limited read-only.' }
];

const modules = [
  'Dashboard', 'User Management', 'Role Management', 'Project Setup',
  'Awarded BOQ Upload', 'BOQ Locking and Revision', 'BOQ Consolidation',
  'Materials Request', 'Canvassing', 'Purchase Order', 'Delivery Receiving',
  'Inventory', 'Material Issuance', 'Expense Ledger', 'Petty Cash',
  'Supplier Payables', 'Subcontracting', 'Subcontractor Billing',
  'Worker Database', 'DTR Upload', 'Payroll', 'Payslip Generation',
  'Payroll Payment', 'Project Accomplishment', 'Progress Billing',
  'Variation Order', 'Reports', 'Audit Logs', 'AI Validation',
  'System Settings', 'Bank / GCash / Payment API', 'Document Attachments',
  'AI Notebook Reference Center'
];

async function seed() {
  console.log('Seeding Roles...');
  for (const r of roles) {
    await prisma.role.upsert({
      where: { roleCode: r.code },
      update: { description: r.description, roleName: r.name },
      create: { roleName: r.name, roleCode: r.code, description: r.description }
    });
  }

  console.log('Seeding Modules...');
  for (const m of modules) {
    const code = m.replace(/[\s\/]+/g, '_').toUpperCase();
    await prisma.module.upsert({
      where: { moduleName: code },
      update: { description: m },
      create: { moduleName: code, description: m }
    });
  }

  console.log('Done seeding RBAC foundation.');
}

seed().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
