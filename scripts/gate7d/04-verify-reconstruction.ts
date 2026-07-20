import { PrismaClient, Prisma } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const projectId = 'cmrirhhw30000ic0406v47smb';
  
  const version = await prisma.projectBOQVersion.findFirst({
    where: { projectId, checksumVersion: 'BOQ_CANONICAL_V1' }
  });
  
  if (!version) throw new Error('BOQ Version not found');
  if (version.status !== 'LOCKED') throw new Error(`BOQ Status is ${version.status}, expected LOCKED`);
  if (version.checksum !== '514c4bd4a7b188391c5ec7f04f198c2963035021a94b295a7b15d408ba831e17') {
    throw new Error(`Checksum mismatch: ${version.checksum}`);
  }

  const items = await prisma.awardedBOQItem.findMany({
    where: { projectId }
  });

  if (items.length !== 326) throw new Error(`Row count mismatch: ${items.length}`);

  let genTotal = new Prisma.Decimal(0);
  let mechTotal = new Prisma.Decimal(0);
  let elecTotal = new Prisma.Decimal(0);

  for (const item of items) {
    if (item.category === 'General Requirements') {
      genTotal = genTotal.add(item.totalCost);
    } else if (item.category === 'Mechanical Works') {
      mechTotal = mechTotal.add(item.totalCost);
    } else if (item.category === 'Electrical Works') {
      elecTotal = elecTotal.add(item.totalCost);
    }
  }

  const grandTotal = genTotal.add(mechTotal).add(elecTotal);

  console.log(`General Requirements: PHP ${genTotal.toNumber().toFixed(2)}`);
  console.log(`Mechanical Works: PHP ${mechTotal.toNumber().toFixed(2)}`);
  console.log(`Electrical Works: PHP ${elecTotal.toNumber().toFixed(2)}`);
  console.log(`Grand Total: PHP ${grandTotal.toNumber().toFixed(2)}`);

  if (genTotal.toNumber() !== 2700549.00) throw new Error('Gen total mismatch');
  if (mechTotal.toNumber() !== 23674716.57) throw new Error('Mech total mismatch');
  if (elecTotal.toNumber() !== 16731409.32) throw new Error('Elec total mismatch');
  if (grandTotal.toNumber() !== 43106674.89) throw new Error('Grand total mismatch');

  const schedCount = await prisma.projectSchedule.count({ where: { projectId } });
  if (schedCount !== 0) throw new Error(`Schedule count is ${schedCount}, expected 0`);

  console.log('GATE7D_VERIFICATION_COMPLETE');
}

run().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(() => {
  prisma.$disconnect();
});
