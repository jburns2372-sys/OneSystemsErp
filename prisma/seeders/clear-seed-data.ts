import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING SEED DATA CLEAR ---');
  
  try {
    const workersDeleted = await prisma.worker.deleteMany({
      where: { isSeedData: true }
    });
    console.log(`Deleted ${workersDeleted.count} seeded workers.`);

    const suppliersDeleted = await prisma.supplier.deleteMany({
      where: { isSeedData: true }
    });
    console.log(`Deleted ${suppliersDeleted.count} seeded suppliers.`);

    const subcontractorsDeleted = await prisma.subcontractor.deleteMany({
      where: { isSeedData: true }
    });
    console.log(`Deleted ${subcontractorsDeleted.count} seeded subcontractors.`);
    
    console.log('--- CLEAR COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('--- CLEAR FAILED ---', error);
    process.exit(1);
  }
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
