const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    const user = await prisma.user.findFirst();
    if (!user) return console.log('no user');
    console.log('UPDATING:', user.name);
    await prisma.user.update({
      where: { id: user.id },
      data: { name: user.name, email: user.email, role: 'PROJECT_MANAGER' }
    });
    console.log('success');
  } catch(e) {
    console.error('ERROR:', e);
  } finally {
    prisma.$disconnect();
  }
}
main();
