const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const a = await prisma.$queryRaw`SELECT * FROM _prisma_migrations`;
    console.log(a);
}
main().finally(() => prisma.$disconnect());
