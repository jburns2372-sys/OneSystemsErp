const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.$queryRawUnsafe('SELECT 1 as num')
  .then(r => console.log('SELECT 1 result:', r))
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
