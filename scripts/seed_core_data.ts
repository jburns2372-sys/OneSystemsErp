const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Core Data (Roles, Modules, Knowledge)...');

  // 1. Roles
  const roles = [
    { name: 'SUPER_ADMIN', code: 'SA' },
    { name: 'PROJECT_DIRECTOR', code: 'PD' },
    { name: 'PROJECT_MANAGER', code: 'PM' },
    { name: 'SITE_ENGINEER', code: 'SE' },
    { name: 'FOREMAN', code: 'FM' },
    { name: 'PURCHASING_OFFICER', code: 'PO' },
    { name: 'WAREHOUSE_CUSTODIAN', code: 'WC' },
    { name: 'ACCOUNTANT', code: 'ACC' },
    { name: 'HR_OFFICER', code: 'HR' },
    { name: 'SOC_MANAGER', code: 'SOC' },
    { name: 'SECURITY_OFFICER', code: 'SO' },
    { name: 'DEVELOPER_ADMIN', code: 'DEV' },
    { name: 'GUEST_USER', code: 'GUEST' }
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { roleName: role.name },
      update: {},
      create: { roleName: role.name, roleCode: role.code }
    });
  }

  console.log(`Seeded ${roles.length} roles.`);

  // 2. Modules
  const modules = [
    'PROJECTS',
    'PROCUREMENT',
    'INVENTORY',
    'FINANCE',
    'PAYROLL',
    'HR',
    'SCHEDULING',
    'DOCUMENTS',
    'AI_VALIDATION',
    'SYSTEM_SETTINGS',
    'SECURITY',
    'KNOWLEDGE_BASE',
    'SUBCONTRACTING',
  ];

  for (const moduleName of modules) {
    const existing = await prisma.module.findFirst({ where: { moduleName } });
    if (!existing) {
      await prisma.module.create({ data: { moduleName } });
    }
  }

  console.log(`Seeded ${modules.length} modules.`);

  // 3. Knowledge Base Keywords Registry
  const keywords = [
    {
      title: 'AI Verification Standard (Invoice)',
      description: 'Standard keywords and rules for validating invoices',
      relatedModule: 'FINANCE',
      documentType: 'SOP',
      status: 'Published',
      notebookType: 'STANDARD_OPERATING_PROCEDURE'
    },
    {
      title: 'BOQ AI Extraction Guidelines',
      description: 'Guidelines on extracting BOQ data using AI',
      relatedModule: 'PROJECTS',
      documentType: 'Rule',
      status: 'Published',
      notebookType: 'DATA_EXTRACTION_RULE'
    },
    {
      title: 'Security Audit Keywords',
      description: 'Keywords and phrases that trigger security SOC alerts',
      relatedModule: 'SECURITY',
      documentType: 'SOP',
      status: 'Published',
      notebookType: 'SECURITY_POLICY'
    },
    {
      title: 'Attendance and DTR Flags',
      description: 'Keywords indicating discrepancy in Daily Time Records',
      relatedModule: 'PAYROLL',
      documentType: 'Policy',
      status: 'Published',
      notebookType: 'BUSINESS_RULE'
    }
  ];

  for (const kw of keywords) {
    const existing = await prisma.knowledgeRecord.findFirst({ where: { title: kw.title } });
    if (!existing) {
      await prisma.knowledgeRecord.create({
        data: {
          title: kw.title,
          description: kw.description,
          relatedModule: kw.relatedModule,
          documentType: kw.documentType,
          status: kw.status,
          notebookType: kw.notebookType,
          version: 'v1.0'
        }
      });
    }
  }

  console.log(`Seeded ${keywords.length} knowledge records.`);
  console.log('Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
