const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const projectId = 'cmrirhhw30000ic0406v47smb';
    await prisma.projectBOQVersion.updateMany({
      where: { projectId },
      data: { status: 'LOCKED' }
    });
    console.log('done');
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
