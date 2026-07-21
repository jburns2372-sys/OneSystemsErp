/**
 * AI Integration Architecture - Master Configuration
 * Centralizes model selection, limits, and rules for the Universal Scheduling Engine.
 */

export const AI_CONFIG = {
  // Model Configurations
  models: {
    primaryPlanning: process.env.AI_PRIMARY_MODEL || 'gpt-4o',
    secondaryClassification: process.env.AI_SECONDARY_MODEL || 'gpt-4o-mini',
    fallback: process.env.AI_FALLBACK_MODEL || 'gpt-3.5-turbo',
  },
  
  // Execution Limits
  limits: {
    maxOutputTokens: 8192,
    timeoutMs: 120000,
    maxRetries: 2,
    reasoningEffort: 'high',
  },

  // Versioning and Traceability (For Audit Logs)
  versions: {
    promptVersion: 'v2.0.0', // Multi-stage pipeline prompt
    jsonSchemaVersion: 'v2.0.0',
    schedulingRulesVersion: 'v2.1.0'
  }
};
