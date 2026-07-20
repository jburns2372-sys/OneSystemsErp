const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetPurchaseOrders() {
  try {
    console.log('Deleting all PurchaseOrderItems...');
    await prisma.purchaseOrderItem.deleteMany();
    
    console.log('Deleting all PurchaseOrders...');
    await prisma.purchaseOrder.deleteMany();

    console.log('Resetting FULLY_PROCURED MaterialRequests back to APPROVED...');
    await prisma.materialRequest.updateMany({
      where: { status: 'FULLY_PROCURED' },
      data: { status: 'APPROVED' }
    });

    console.log('Successfully reset all Purchase Orders!');
  } catch (err) {
    console.error('Error resetting POs:', err);
  } finally {
    await prisma.$disconnect();
  }
}

resetPurchaseOrders();
