import { PrismaClient } from '@prisma/client';
import { AiRagCleanupService } from '../src/lib/services/aiRagCleanupService';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting RAG Registry Cleanup...");
  const adminUser = await prisma.user.findFirst();
  
  if (!adminUser) {
    console.log("No user found to attribute run");
    return;
  }

  const report = await AiRagCleanupService.runFullCleanup(adminUser.id);
  
  console.log("=== CLEANUP REPORT ===");
  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
