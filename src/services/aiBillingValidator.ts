import { prisma } from "@/lib/prisma";

export async function validateBillingAccomplishments(projectId: string, accomplishments: any[]) {
  const issues = [];
  
  for (const acc of accomplishments) {
    for (const item of acc.items) {
      const boqItem = await prisma.awardedBOQItem.findUnique({
        where: { id: item.boqItemId }
      });
      
      if (!boqItem) continue;

      // 1. Math check
      if (item.percentageAccomplished > 100) {
        issues.push({
          level: "CRITICAL",
          message: `BOQ Item ${boqItem.itemCode} is claiming >100% completion. Cannot proceed.`,
        });
      }

      // 2. Risk check: Large jumps
      if (item.currentQuantityClaimed > (boqItem.quantity * 0.5)) {
        issues.push({
          level: "WARNING",
          message: `BOQ Item ${boqItem.itemCode} is claiming >50% completion in a single period. Requires Engineer verification.`,
        });
      }
    }
  }

  return {
    isValid: issues.filter(i => i.level === "CRITICAL").length === 0,
    issues
  };
}
