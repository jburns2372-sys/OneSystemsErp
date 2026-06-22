// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const canvass = await prisma.canvassForm.findUnique({
    where: { canvassNumber: 'CANV-2026-0001' },
    include: {
      project: true,
      mr: true,
      items: {
        include: {
          consolidatedBoqItem: true
        }
      },
      preparedBy: true
    }
  });
  console.log(JSON.stringify(canvass, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
