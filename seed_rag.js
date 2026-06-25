const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const keywordCategories = [
  // A. General System
  {
    keyword: 'system',
    normalizedKeyword: 'system',
    keywordType: 'module',
    aliases: 'erp, onesystemserp, app, application',
    synonyms: 'platform, software',
    confidentialityLevel: 'PUBLIC',
    exampleUserQuestions: '["How do I use the system?"]'
  },
  {
    keyword: 'dashboard',
    normalizedKeyword: 'dashboard',
    keywordType: 'module',
    aliases: 'summary screen, management view',
    synonyms: 'home, frontpage',
    confidentialityLevel: 'PUBLIC'
  },
  {
    keyword: 'approval',
    normalizedKeyword: 'approval',
    keywordType: 'workflow',
    aliases: 'pending, approve, reject',
    synonyms: 'authorize, review',
    confidentialityLevel: 'INTERNAL'
  },
  // B. User, Role, and Access
  {
    keyword: 'user',
    normalizedKeyword: 'user',
    keywordType: 'database_table',
    databaseTable: 'User',
    aliases: 'account, profile',
    synonyms: 'personnel',
    confidentialityLevel: 'INTERNAL'
  },
  {
    keyword: 'rbac',
    normalizedKeyword: 'rbac',
    keywordType: 'business_term',
    aliases: 'role access, permission control, user rights, role-based access control',
    synonyms: 'permissions, access rights, privilege',
    confidentialityLevel: 'INTERNAL'
  },
  // C. Project Management
  {
    keyword: 'project',
    normalizedKeyword: 'project',
    keywordType: 'database_table',
    databaseTable: 'Project',
    aliases: 'contract, awarded project, live project, site',
    synonyms: 'job, engagement',
    confidentialityLevel: 'INTERNAL',
    projectScoped: true
  },
  {
    keyword: 'project cost',
    normalizedKeyword: 'project cost',
    keywordType: 'project_metric',
    aliases: 'contract amount, awarded amount, total project value',
    databaseField: 'contractAmount',
    databaseTable: 'Project',
    confidentialityLevel: 'RESTRICTED',
    projectScoped: true
  },
  {
    keyword: 'boq',
    normalizedKeyword: 'boq',
    keywordType: 'business_term',
    aliases: 'bill of quantity, awarded boq, procurement boq',
    synonyms: 'scope of work, program of works',
    databaseTable: 'AwardedBOQItem',
    confidentialityLevel: 'RESTRICTED',
    projectScoped: true
  },
  // E. Procurement
  {
    keyword: 'purchase order',
    normalizedKeyword: 'purchase order',
    keywordType: 'database_table',
    aliases: 'po',
    databaseTable: 'PurchaseOrder',
    confidentialityLevel: 'RESTRICTED',
    projectScoped: true
  },
  {
    keyword: 'supplier',
    normalizedKeyword: 'supplier',
    keywordType: 'database_table',
    aliases: 'vendor',
    databaseTable: 'Supplier',
    confidentialityLevel: 'INTERNAL'
  },
  // F. Inventory and Materials
  {
    keyword: 'inventory',
    normalizedKeyword: 'inventory',
    keywordType: 'module',
    aliases: 'materials, stock, warehouse',
    synonyms: 'supplies',
    confidentialityLevel: 'INTERNAL',
    projectScoped: true
  },
  {
    keyword: 'material issuance',
    normalizedKeyword: 'material issuance',
    keywordType: 'database_table',
    aliases: 'mis, issuance slip',
    databaseTable: 'MaterialIssuance',
    confidentialityLevel: 'INTERNAL',
    projectScoped: true
  },
  // G. Subcontracting
  {
    keyword: 'subcontractor',
    normalizedKeyword: 'subcontractor',
    keywordType: 'database_table',
    aliases: 'subcon',
    databaseTable: 'Subcontractor',
    confidentialityLevel: 'INTERNAL'
  },
  {
    keyword: 'subcontract package',
    normalizedKeyword: 'subcontract package',
    keywordType: 'database_table',
    aliases: 'subcontract, subcontract agreement',
    databaseTable: 'SubcontractPackage',
    confidentialityLevel: 'RESTRICTED',
    projectScoped: true
  },
  // J. Payroll
  {
    keyword: 'payroll',
    normalizedKeyword: 'payroll',
    keywordType: 'module',
    aliases: 'salary, wage, workers',
    databaseTable: 'PayrollPeriod',
    confidentialityLevel: 'CONFIDENTIAL',
    projectScoped: true
  },
  {
    keyword: 'dtr',
    normalizedKeyword: 'dtr',
    keywordType: 'database_table',
    aliases: 'daily time record, attendance, biometrics',
    databaseTable: 'DailyTimeRecord',
    confidentialityLevel: 'CONFIDENTIAL',
    projectScoped: true
  },
  // K. Finance
  {
    keyword: 'finance',
    normalizedKeyword: 'finance',
    keywordType: 'module',
    aliases: 'accounting, financials',
    confidentialityLevel: 'RESTRICTED'
  },
  {
    keyword: 'expense',
    normalizedKeyword: 'expense',
    keywordType: 'database_table',
    aliases: 'opex, capex, project expense',
    databaseTable: 'Expense',
    confidentialityLevel: 'RESTRICTED',
    projectScoped: true
  }
];

async function main() {
  console.log("Seeding AiRagKeywordRegistry...");
  
  for (const k of keywordCategories) {
    await prisma.aiRagKeywordRegistry.create({
      data: k
    });
  }
  
  console.log("RAG Keywords seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
