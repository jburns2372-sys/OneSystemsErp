import { PrismaClient } from '@prisma/client';
import { AiRagCleanupService } from '../src/lib/services/aiRagCleanupService';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting RAG Registry Repair & Alias Restoration...");
  
  const adminUser = await prisma.user.findFirst();
  if (!adminUser) {
    console.log("No user found to attribute run");
    return;
  }

  // 1. Restore Aliases directly
  console.log("Restoring missing aliases from deactivated duplicate rows...");
  const repairStats = await AiRagCleanupService.restoreAliasesFromDisabledDuplicates();
  
  console.log(`✅ Repaired ${repairStats.activeRowsRepaired} active rows!`);
  console.log(`✅ Restored ${repairStats.aliasesRestored} aliases!`);

  // 2. Run the main cleanup again to catch new schemas / ui labels and re-run canonical selections
  console.log("\nRunning full cleanup to migrate any remaining fields and noise...");
  const report = await AiRagCleanupService.runFullCleanup(adminUser.id);
  
  console.log("\n=== REPAIR & CLEANUP REPORT ===");
  console.log(JSON.stringify(report, null, 2));

  // 3. Acceptance Tests verification
  const testKeywords = ['13th month', 'absence', 'approval', 'accounts payable', 'project cost'];
  console.log("\n--- Verification Check ---");
  for (const kw of testKeywords) {
    const row = await prisma.aiRagKeywordRegistry.findFirst({
      where: { keyword: kw, isActive: true }
    });
    console.log(`Keyword: "${kw}" | Aliases Present: ${row?.aliases && row.aliases !== '[]' && row.aliases !== '-' ? 'YES ✅' : 'NO ❌'} (${row?.aliases})`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
