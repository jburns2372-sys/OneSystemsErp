import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const models = Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$') && typeof (prisma as any)[k].count === 'function');
  const counts: Record<string, number> = {};
  for (const model of models) {
    try {
      const c = await (prisma as any)[model].count();
      if (c > 0) counts[model] = c;
    } catch (e) {
      // ignore
    }
  }
  console.log(JSON.stringify(counts, null, 2));
}

main().finally(() => prisma.$disconnect());
