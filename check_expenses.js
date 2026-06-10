const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.expense.findMany().then(res => { console.log("Expenses:", res); }).finally(() => prisma.$disconnect());
