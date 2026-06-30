import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- STARTING BOQ JUNK CLEANUP ---');
  
  try {
    // Delete the first row
    const deleted1 = await prisma.awardedBOQItem.deleteMany({
      where: {
        description: {
          contains: 'DIRECT COST OCM (12%) PROFIT'
        }
      }
    });
    console.log(`Deleted ${deleted1.count} rows containing "DIRECT COST OCM...".`);

    // Delete the second row
    const deleted2 = await prisma.awardedBOQItem.deleteMany({
      where: {
        description: '(2)',
        itemCode: '(1)'
      }
    });
    console.log(`Deleted ${deleted2.count} rows containing "(1) / (2)".`);

    console.log('--- CLEANUP COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('--- CLEANUP FAILED ---', error);
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
