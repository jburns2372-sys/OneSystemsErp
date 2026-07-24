import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const id = 'cmri5atwh0000vcos810qc8ij';
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      materialRequests: true,
      awardedBoqItems: { orderBy: { createdAt: 'asc' } },
      procurementBenchmarkItems: true,
      variationOrders: {
        where: { currentStatus: 'APPROVED' }
      },
      userAssignments: {
        include: { user: { select: { name: true, email: true, role: true, id: true } } },
        orderBy: { createdAt: 'desc' }
      }
    }
  });
  console.log("Found project:", !!project);
}

main().catch(console.error);
