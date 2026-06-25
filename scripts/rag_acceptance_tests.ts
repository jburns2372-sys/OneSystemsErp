import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const testQuestions = [
  { q: "How much have we spent on this project?", expectLevel: "RESTRICTED", expectTable: "ProjectCostSummary" },
  { q: "What is the current profitability?", expectLevel: "EXECUTIVE_ONLY", expectTable: "ProjectProfitability" },
  { q: "What is the contract amount?", expectLevel: "RESTRICTED", expectTable: "Project" },
  { q: "What is the difference between awarded BOQ and procurement BOQ?", expectLevel: "RESTRICTED", expectTable: "BOQVariance" },
  { q: "What materials were purchased but not delivered?", expectLevel: "INTERNAL", expectTable: "ProcurementVariance" },
  { q: "What POs are pending approval?", expectLevel: "INTERNAL", expectTable: "PurchaseOrder" },
  { q: "What job orders are active?", expectLevel: "RESTRICTED", expectTable: "JobOrder" },
  { q: "What payroll is pending approval?", expectLevel: "CONFIDENTIAL", expectTable: "PayrollPeriod" },
  { q: "Who approved this transaction?", expectLevel: "INTERNAL", expectTable: "Approval" }
];

const mockRoles = [
  { name: 'Guest User', maxRank: 1 },
  { name: 'Site Admin', maxRank: 2 },
  { name: 'Project Manager', maxRank: 2 },
  { name: 'Finance Officer', maxRank: 3 },
  { name: 'Payroll Officer', maxRank: 4 }, // Has special access to confidential
  { name: 'Executive', maxRank: 5 },
  { name: 'Super Admin', maxRank: 6 }
];

const RANK_MAP: Record<string, number> = {
  'PUBLIC': 1,
  'INTERNAL': 2,
  'RESTRICTED': 3,
  'CONFIDENTIAL': 4,
  'EXECUTIVE_ONLY': 5,
  'SUPER_ADMIN_ONLY': 6
};

async function resolveIntent(question: string) {
  // Very basic mock of the real `api/chat` intent resolution
  // We'll just search our DB for the closest keyword match in the question
  const words = question.toLowerCase().replace('?', '').split(' ');
  
  // Find all keywords that appear in the question
  const matches = await prisma.aiRagKeywordRegistry.findMany({
    where: { isActive: true }
  });

  let bestMatch = null;
  let bestLength = 0;

  for (const m of matches) {
    if (question.toLowerCase().includes(m.keyword) && m.keyword.length > bestLength) {
      bestMatch = m;
      bestLength = m.keyword.length;
    }
  }

  return bestMatch;
}

async function main() {
  console.log("=== RAG Acceptance Test Suite ===");

  let passed = 0;
  let failed = 0;

  for (const t of testQuestions) {
    console.log(`\nTesting: "${t.q}"`);
    const intent = await resolveIntent(t.q);
    
    if (!intent) {
      console.log(`❌ FAILED: Could not resolve any keyword intent.`);
      failed++;
      continue;
    }

    const resolvedLevel = intent.confidentialityLevel;
    const reqRank = RANK_MAP[resolvedLevel] || 1;

    console.log(`-> Intent Resolved: [${intent.keyword}] -> Table: ${intent.databaseTable} (Requires: ${resolvedLevel})`);

    // Test across roles
    for (const role of mockRoles) {
      let isAllowed = false;
      
      // Payroll has special mapping, but generally it's based on rank
      if (role.name === 'Payroll Officer' && resolvedLevel === 'CONFIDENTIAL') isAllowed = true;
      else if (role.maxRank >= reqRank && resolvedLevel !== 'CONFIDENTIAL') isAllowed = true;
      else if (role.maxRank >= reqRank && role.maxRank >= 5) isAllowed = true; // Executives get confidential

      if (isAllowed) {
        console.log(`   ✅ ${role.name}: ACCESS GRANTED`);
      } else {
        console.log(`   ⛔ ${role.name}: ACCESS DENIED`);
      }
    }
    
    if (intent.confidentialityLevel === t.expectLevel) {
      passed++;
    } else {
      console.log(`❌ FAILED: Expected level ${t.expectLevel} but got ${intent.confidentialityLevel}`);
      failed++;
    }
  }

  console.log(`\n=== Test Results ===`);
  console.log(`Passed: ${passed}/${testQuestions.length}`);
  if (failed > 0) {
    console.log(`Failed: ${failed}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
