import { prisma } from '@/lib/prisma';
import { AiRagKeywordRegistry, AiRagSchemaMap } from '@prisma/client';

export type DetectedIntent =
  | 'SUMMARIZE_MODULE'
  | 'COMPARE_RECORDS'
  | 'FETCH_RECORD'
  | 'PROJECT_STATUS'
  | 'PROCUREMENT_STATUS'
  | 'BILLING_STATUS'
  | 'PAYROLL_STATUS'
  | 'FINANCE_STATUS'
  | 'EXECUTIVE_SUMMARY'
  | 'SOP_INSTRUCTION'
  | 'UNKNOWN';

export interface KeywordExpansionResult {
  originalMessage: string;
  matchedKeywords: AiRagKeywordRegistry[];
  modulesToSearch: Set<string>;
  tablesToSearch: Set<string>;
}

/**
 * Step 1: Detects the operational intent of the user's question using heuristic matching.
 */
export async function detectIntents(userMessage: string): Promise<DetectedIntent[]> {
  const lowerMessage = userMessage.toLowerCase();
  const intents: Set<DetectedIntent> = new Set();

  if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('difference')) {
    intents.add('COMPARE_RECORDS');
  }
  if (lowerMessage.includes('status') || lowerMessage.includes('progress') || lowerMessage.includes('delayed') || lowerMessage.includes('schedule')) {
    intents.add('PROJECT_STATUS');
  }
  if (lowerMessage.includes('cost') || lowerMessage.includes('spent') || lowerMessage.includes('profitability') || lowerMessage.includes('financial') || lowerMessage.includes('budget')) {
    intents.add('FINANCE_STATUS');
  }
  if (lowerMessage.includes('summary') || lowerMessage.includes('executive') || lowerMessage.includes('report')) {
    intents.add('EXECUTIVE_SUMMARY');
  }
  if (lowerMessage.includes('po') || lowerMessage.includes('purchase') || lowerMessage.includes('supplier') || lowerMessage.includes('delivery') || lowerMessage.includes('materials')) {
    intents.add('PROCUREMENT_STATUS');
  }
  if (lowerMessage.includes('billing') || lowerMessage.includes('collection') || lowerMessage.includes('receivable') || lowerMessage.includes('paid')) {
    intents.add('BILLING_STATUS');
  }
  if (lowerMessage.includes('payroll') || lowerMessage.includes('dtr') || lowerMessage.includes('salary') || lowerMessage.includes('worker')) {
    intents.add('PAYROLL_STATUS');
  }
  if (lowerMessage.includes('how to') || lowerMessage.includes('explain') || lowerMessage.includes('guide') || lowerMessage.includes('manual')) {
    intents.add('SOP_INSTRUCTION');
  }

  if (intents.size === 0) {
    intents.add('FETCH_RECORD'); // Default fallback
  }

  return Array.from(intents);
}

/**
 * Step 2 & 3: Keyword Extraction and Expansion via AiRagKeywordRegistry
 */
export async function expandKeywords(userMessage: string): Promise<KeywordExpansionResult> {
  const words = userMessage.toLowerCase().replace(/[.,?!]/g, '').split(/\s+/);
  
  // Fetch active keywords registry
  const registry = await prisma.aiRagKeywordRegistry.findMany({
    where: { isActive: true }
  });

  const matchedKeywords: AiRagKeywordRegistry[] = [];
  const modulesToSearch = new Set<string>();
  const tablesToSearch = new Set<string>();

  for (const word of words) {
    if (word.length < 2) continue; // Skip single characters

    const match = registry.find(k => 
      k.normalizedKeyword === word || 
      k.keyword.toLowerCase() === word ||
      (k.aliases && k.aliases.toLowerCase().includes(word)) ||
      (k.synonyms && k.synonyms.toLowerCase().includes(word)) ||
      (k.abbreviations && k.abbreviations.toLowerCase().includes(word))
    );

    if (match) {
      if (!matchedKeywords.some(m => m.id === match.id)) {
        matchedKeywords.push(match);
        if (match.moduleName) modulesToSearch.add(match.moduleName);
        if (match.databaseTable) tablesToSearch.add(match.databaseTable);
        if (match.relatedModule) modulesToSearch.add(match.relatedModule);
      }
    }
  }

  // Also check for multi-word exact matches (e.g., "purchase order", "job order")
  for (const k of registry) {
    if (userMessage.toLowerCase().includes(k.normalizedKeyword) || userMessage.toLowerCase().includes(k.keyword.toLowerCase())) {
      if (!matchedKeywords.some(m => m.id === k.id)) {
        matchedKeywords.push(k);
        if (k.moduleName) modulesToSearch.add(k.moduleName);
        if (k.databaseTable) tablesToSearch.add(k.databaseTable);
        if (k.relatedModule) modulesToSearch.add(k.relatedModule);
      }
    }
  }

  // Also query Schema Map for field-level matches
  const schemaMap = await prisma.aiRagSchemaMap.findMany();
  for (const field of schemaMap) {
    if (userMessage.toLowerCase().includes(field.fieldName.toLowerCase()) || 
        (field.fieldAlias && userMessage.toLowerCase().includes(field.fieldAlias.toLowerCase()))) {
      tablesToSearch.add(field.tableName);
      if (field.moduleName) modulesToSearch.add(field.moduleName);
    }
  }

  return {
    originalMessage: userMessage,
    matchedKeywords,
    modulesToSearch,
    tablesToSearch
  };
}
