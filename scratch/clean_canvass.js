const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
  
  const tables = ['CanvassForm', 'CanvassItem', 'SupplierQuotation', 'QuotationItem'];
  
  for (const t of tables) {
    try {
      await prisma.$executeRawUnsafe('DELETE FROM ' + t + ';');
      console.log('Cleared ' + t);
    } catch(e) {
      console.error('Failed to clear ' + t + ':', e.message);
    }
  }
  
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
  console.log('Successfully wiped Canvassing tables!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
