import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ACCESS_LEVEL_RANK: Record<string, number> = {
  'PUBLIC': 1,
  'INTERNAL': 2,
  'RESTRICTED': 3,
  'CONFIDENTIAL': 4,
  'EXECUTIVE_ONLY': 5,
  'SUPER_ADMIN_ONLY': 6
};

async function main() {
  console.log("Starting AI RAG Keyword Registry Deduplication Audit...");

  // 1. Fetch all active keywords
  const allKeywords = await prisma.aiRagKeywordRegistry.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' }
  });

  // Group by normalized keyword
  const groups: Record<string, typeof allKeywords> = {};
  for (const kw of allKeywords) {
    if (!kw.normalizedKeyword) {
      kw.normalizedKeyword = kw.keyword.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }
    
    // Hardcoded merge groups from user prompt
    let norm = kw.normalizedKeyword;
    if (norm === 'subcon') norm = 'subcontractor';
    if (norm === 'po') norm = 'purchase_order';
    if (norm === 'pr') norm = 'purchase_request';
    if (norm === 'jo') norm = 'job_order';
    
    if (!groups[norm]) groups[norm] = [];
    groups[norm].push(kw);
  }

  let mergedCount = 0;

  for (const [normKey, group] of Object.entries(groups)) {
    if (group.length > 1) {
      console.log(`\nFound duplicate group for: ${normKey} (${group.length} entries)`);
      
      // Keep the first one as canonical, or the one with a DB table
      const canonical = group.find(k => k.databaseTable) || group[0];
      
      let mergedAliases = new Set<string>();
      let mergedSynonyms = new Set<string>();
      let highestAccessLevel = canonical.confidentialityLevel;
      let highestRank = ACCESS_LEVEL_RANK[highestAccessLevel] || 1;
      let bestTable = canonical.databaseTable;

      for (const kw of group) {
        // Merge aliases
        if (kw.aliases) kw.aliases.split(',').forEach(a => mergedAliases.add(a.trim()));
        if (kw.synonyms) kw.synonyms.split(',').forEach(a => mergedSynonyms.add(a.trim()));
        mergedAliases.add(kw.keyword);
        
        // Find strictest access level
        const rank = ACCESS_LEVEL_RANK[kw.confidentialityLevel] || 1;
        if (rank > highestRank) {
          highestRank = rank;
          highestAccessLevel = kw.confidentialityLevel;
        }

        if (!bestTable && kw.databaseTable) {
          bestTable = kw.databaseTable;
        }
      }

      mergedAliases.delete(canonical.keyword); // Don't alias itself
      const finalAliases = Array.from(mergedAliases).filter(Boolean).join(', ');
      const finalSynonyms = Array.from(mergedSynonyms).filter(Boolean).join(', ');

      console.log(`  -> Canonical: ${canonical.keyword}`);
      console.log(`  -> Merged Aliases: ${finalAliases}`);
      console.log(`  -> Strictest Access: ${highestAccessLevel}`);

      // Update Canonical
      await prisma.aiRagKeywordRegistry.update({
        where: { id: canonical.id },
        data: {
          aliases: finalAliases.length > 0 ? finalAliases : undefined,
          synonyms: finalSynonyms.length > 0 ? finalSynonyms : undefined,
          confidentialityLevel: highestAccessLevel,
          databaseTable: bestTable,
          normalizedKeyword: normKey
        }
      });

      // Deactivate others
      for (const kw of group) {
        if (kw.id !== canonical.id) {
          await prisma.aiRagKeywordRegistry.update({
            where: { id: kw.id },
            data: { isActive: false, keywordType: 'merged_duplicate' }
          });
          mergedCount++;
        }
      }
    }
  }

  console.log(`\n✅ Deduplication complete. Merged and deactivated ${mergedCount} duplicate entries.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
