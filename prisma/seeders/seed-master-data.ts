import { PrismaClient } from '@prisma/client';
import { seedWorkers } from './seed-workers';
import { seedSuppliers } from './seed-suppliers';
import { seedSubcontractors } from './seed-subcontractors';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING MASTER DATA SEED ---');
  
  try {
    await seedWorkers();
    await seedSuppliers();
    await seedSubcontractors();
    
    console.log('--- SEEDING COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('--- SEEDING FAILED ---', error);
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
