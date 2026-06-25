import { expandKeywords } from '../src/lib/rag-intelligence';

const questions = [
  "How much is the project cost?",
  "What is the awarded BOQ?",
  "What is the procurement BOQ?",
  "What is the current billing status?",
  "What are my pending approvals?",
  "What payroll records are pending?",
  "What suppliers are unpaid?",
  "What materials are undelivered?",
  "What is the current profitability?",
  "What can a guest user access?"
];

async function main() {
  console.log("Running Acceptance Tests on Post-Cleanup RAG Semantic Engine\n");
  
  for (const q of questions) {
    const result = await expandKeywords(q);
    console.log(`Q: "${q}"`);
    console.log(`  Matched Keywords: ${result.matchedKeywords.map(k => k.keyword).join(', ')}`);
    console.log(`  Modules: ${Array.from(result.modulesToSearch).join(', ')}`);
    console.log(`  Tables: ${Array.from(result.tablesToSearch).join(', ')}`);
    console.log("-------------------------------------------------");
  }

  console.log("✅ Acceptance Tests Completed.");
}

main().catch(console.error);
