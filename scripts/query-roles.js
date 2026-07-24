const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    where: { email: { in: ['manager@onesystemserp.com', 'director@onesystemserp.com'] } },
    select: { email: true, role: true }
  });
  console.log(users);
}
run().finally(() => prisma.$disconnect());
