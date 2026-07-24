import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  try {
    const version = await prisma.projectBOQVersion.findFirst();
    console.log(version);
    
    // get totals
    const genReq = await prisma.awardedBOQItem.aggregate({
      where: { category: 'GENERAL REQUIREMENTS' },
      _sum: { totalCost: true }
    });
    console.log('General Requirements =', genReq._sum.totalCost);

    const mechWorks = await prisma.awardedBOQItem.aggregate({
      where: { category: 'MECHANICAL WORKS' },
      _sum: { totalCost: true }
    });
    console.log('Mechanical Works =', mechWorks._sum.totalCost);

    const elecWorks = await prisma.awardedBOQItem.aggregate({
      where: { category: 'ELECTRICAL WORKS' },
      _sum: { totalCost: true }
    });
    console.log('Electrical Works =', elecWorks._sum.totalCost);

    const grandTotal = await prisma.awardedBOQItem.aggregate({
      _sum: { totalCost: true }
    });
    console.log('Grand total =', grandTotal._sum.totalCost);
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
