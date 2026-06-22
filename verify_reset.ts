// @ts-nocheck
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const projects = await prisma.project.count();
  const workers = await prisma.worker.count();
  const expenses = await prisma.expense.count();
  const users = await prisma.user.count();
  const admins = await prisma.user.findMany({ select: { email: true, role: true } });

  console.log(`Projects: ${projects}`);
  console.log(`Workers: ${workers}`);
  console.log(`Expenses: ${expenses}`);
  console.log(`Users: ${users}`);
  console.log('Current users:', admins);
}

main().catch(console.error).finally(() => prisma.$disconnect());
