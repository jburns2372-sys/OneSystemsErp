const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const a = await prisma.projectUserAssignment.findMany({ include: { user: true } });
    console.log(a);
}
main().finally(() => prisma.$disconnect());
