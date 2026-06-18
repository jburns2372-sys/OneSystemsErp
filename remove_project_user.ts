import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst({ where: { email: 'backup_admin@demo.com' } });
  if (!u) {
    console.log('User not found');
    return;
  }
  
  console.log('Found user:', u.id);
  
  // Reassign all known relations to system admin
  const admin = await prisma.user.findFirst({ where: { email: 'system_admin@demo.com' } });
  if (admin) {
    try { await prisma.project.updateMany({ where: { projectManagerId: u.id }, data: { projectManagerId: admin.id } }); } catch (e) {}
    try { await prisma.document.updateMany({ where: { uploadedById: u.id }, data: { uploadedById: admin.id } }); } catch (e) {}
    try { await prisma.expense.updateMany({ where: { loggedById: u.id }, data: { loggedById: admin.id } }); } catch (e) {}
    try { await prisma.accomplishmentRecord.updateMany({ where: { recordedById: u.id }, data: { recordedById: admin.id } }); } catch (e) {}
    try { await prisma.subcontractAccomplishment.updateMany({ where: { recordedById: u.id }, data: { recordedById: admin.id } }); } catch (e) {}
    try { await prisma.paymentRecord.updateMany({ where: { recordedById: u.id }, data: { recordedById: admin.id } }); } catch (e) {}
    try { await prisma.subcontractBilling.updateMany({ where: { approvedById: u.id }, data: { approvedById: admin.id } }); } catch (e) {}
    try { await prisma.materialRequest.updateMany({ where: { requestedById: u.id }, data: { requestedById: admin.id } }); } catch (e) {}
    try { await prisma.materialRequest.updateMany({ where: { checkedById: u.id }, data: { checkedById: admin.id } }); } catch (e) {}
    try { await prisma.materialRequest.updateMany({ where: { approvedById: u.id }, data: { approvedById: admin.id } }); } catch (e) {}
    try { await prisma.materialRequest.updateMany({ where: { preparedById: u.id }, data: { preparedById: admin.id } }); } catch (e) {}
    try { await prisma.delivery.updateMany({ where: { receivedById: u.id }, data: { receivedById: admin.id } }); } catch (e) {}
    try { await prisma.delivery.updateMany({ where: { verifiedById: u.id }, data: { verifiedById: admin.id } }); } catch (e) {}
    try { await prisma.delivery.updateMany({ where: { reviewedById: u.id }, data: { reviewedById: admin.id } }); } catch (e) {}
    try { await prisma.delivery.updateMany({ where: { approvedById: u.id }, data: { approvedById: admin.id } }); } catch (e) {}
  }
  
  try {
    await prisma.user.delete({ where: { id: u.id } });
    console.log('User deleted successfully');
  } catch (e) {
    console.error('Could not delete user:', e);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
