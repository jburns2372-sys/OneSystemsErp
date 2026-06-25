import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const CONFIDENTIAL_KEYWORDS = ['salary', 'wage', 'payroll', 'bank', 'account', 'password', 'token', 'ssn', 'tax', 'deduction'];
const RESTRICTED_KEYWORDS = ['amount', 'cost', 'price', 'rate', 'payable', 'receivable', 'budget', 'margin', 'profit', 'revenue'];

function determineAccessLevel(name: string): string {
  const lowerName = name.toLowerCase();
  for (const word of CONFIDENTIAL_KEYWORDS) {
    if (lowerName.includes(word)) return 'CONFIDENTIAL';
  }
  for (const word of RESTRICTED_KEYWORDS) {
    if (lowerName.includes(word)) return 'RESTRICTED';
  }
  return 'INTERNAL';
}

function humanize(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .toLowerCase();
}

async function main() {
  console.log("Starting Auto-Scan of Prisma Schema for RAG Coverage...");

  const dmmf = Prisma.dmmf;
  const models = dmmf.datamodel.models;

  let tablesAdded = 0;
  let fieldsAdded = 0;

  for (const model of models) {
    const tableName = model.name;
    const humanTableName = humanize(tableName);
    
    // 1. Add the table keyword via UPSERT
    const tableKeyword = humanTableName;
    const normalizedTableKeyword = tableKeyword.replace(/[^a-z0-9]/g, '_');
    
    await prisma.aiRagKeywordRegistry.upsert({
      where: { normalizedKeyword_keywordType: { normalizedKeyword: normalizedTableKeyword, keywordType: 'database_table' } },
      create: {
        keyword: tableKeyword,
        normalizedKeyword: normalizedTableKeyword,
        keywordType: 'database_table',
        databaseTable: tableName,
        confidentialityLevel: determineAccessLevel(tableName),
        sourceType: 'AUTO_GENERATED',
        businessMeaning: `Auto-generated mapping for table: ${tableName}`
      },
      update: {}
    });
    tablesAdded++;

    // 2. Add keywords for important fields to SCHEMA MAP
    const hasProjectId = model.fields.some(f => f.name === 'projectId');
    
    for (const field of model.fields) {
      if (field.kind === 'object' || field.name === 'id' || field.name === 'createdAt' || field.name === 'updatedAt') continue;

      const fieldKeyword = humanize(field.name);
      const isConfidential = determineAccessLevel(field.name) === 'CONFIDENTIAL' || determineAccessLevel(field.name) === 'RESTRICTED';

      await prisma.aiRagSchemaMap.upsert({
        where: { tableName_fieldName: { tableName: tableName, fieldName: field.name } },
        create: {
          moduleName: 'auto_scanned',
          tableName: tableName,
          fieldName: field.name,
          fieldAlias: fieldKeyword,
          dataType: field.type,
          searchable: true,
          confidential: isConfidential,
          projectScoped: hasProjectId
        },
        update: { fieldAlias: fieldKeyword }
      });
      fieldsAdded++;
    }
  }

  console.log(`\n✅ Schema Auto-Scan Complete!`);
  console.log(`Tables upserted: ${tablesAdded}`);
  console.log(`Fields upserted to Schema Map: ${fieldsAdded}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
