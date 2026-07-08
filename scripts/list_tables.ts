import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tables: any[] = await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  );
  console.log(tables.map((t: any) => t.tablename).join('\n'));
}
main().finally(() => prisma.$disconnect());
