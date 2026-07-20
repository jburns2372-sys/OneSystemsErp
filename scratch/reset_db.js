const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting database cleanup...');

  try {
    // Delete in reverse dependency order
    await prisma.paymentBatchRow.deleteMany();
    console.log('Deleted PaymentBatchRows');
    
    await prisma.paymentBatch.deleteMany();
    console.log('Deleted PaymentBatches');

    await prisma.payrollFundingRequest.deleteMany();
    console.log('Deleted PayrollFundingRequests');

    await prisma.payrollBankLedger.deleteMany();
    console.log('Deleted PayrollBankLedgers');

    await prisma.payrollBankAccount.deleteMany();
    console.log('Deleted PayrollBankAccounts');

    await prisma.payroll.deleteMany();
    console.log('Deleted Payrolls');

    await prisma.payrollPeriod.deleteMany();
    console.log('Deleted PayrollPeriods');

    await prisma.worker.deleteMany();
    console.log('Deleted Workers');

    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
