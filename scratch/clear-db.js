const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  console.log('Clearing all data from the database...');
  try {
    // Delete in reverse order of dependencies to avoid foreign key constraints
    await prisma.expense.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.awardedBOQItem.deleteMany();
    await prisma.billOfQuantities.deleteMany();
    await prisma.pettyCashTransaction.deleteMany();
    await prisma.pettyCashAccount.deleteMany();
    await prisma.purchaseOrder.deleteMany();
    await prisma.materialRequest.deleteMany();
    await prisma.project.deleteMany();
    await prisma.user.deleteMany();
    console.log('Successfully removed all data entries.');
  } catch (error) {
    console.error('Error clearing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
