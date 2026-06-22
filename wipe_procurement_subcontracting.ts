// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Erasing transaction data for Procurement, Subcontracting, and Job Orders...');
  
  await prisma.$transaction(async (tx) => {
    // Job Orders & Subcontracting
    await tx.subcontractBilling.deleteMany();
    await tx.subcontractAccomplishment.deleteMany();
    await tx.jobOrder.deleteMany();
    await tx.subcontractPackage.deleteMany();
    await tx.subcontractorBOQItem.deleteMany();
    await tx.accomplishmentRecord.deleteMany();
    await tx.paymentRecord.deleteMany();
    await tx.backCharge.deleteMany();

    // Procurement
    await tx.accountsPayable.deleteMany();
    await tx.purchaseOrderItem.deleteMany();
    await tx.purchaseOrder.deleteMany();
    await tx.materialRequestItem.deleteMany();
    await tx.materialRequest.deleteMany();
    
    // Also Delivery as it's part of Procurement fulfillment
    await tx.deliveryItem.deleteMany();
    await tx.delivery.deleteMany();
  });

  console.log('Successfully erased all data entries and transactions for specified modules.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
