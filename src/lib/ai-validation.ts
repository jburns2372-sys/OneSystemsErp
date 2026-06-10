import { prisma } from '@/lib/prisma';
import { logAudit } from './workflow';

/**
 * AI Validation Engine Hook
 * This is the master skeleton where AI models (like Gemini/OpenAI) will be invoked
 * to validate incoming transactions against ACTIVE AI Notebook References.
 */
export async function validateTransactionWithAI(
  moduleName: string, 
  transactionData: any, 
  userId: string, 
  userRole: string
) {
  // 1. Fetch all ACTIVE mandatory references for this module and globally
  const activeReferences = await prisma.aINotebookReference.findMany({
    where: {
      status: 'ACTIVE_REFERENCE',
      isMandatory: true,
      OR: [
        { moduleAssignment: moduleName },
        { moduleAssignment: null },
        { moduleAssignment: '' }
      ]
    }
  });

  if (activeReferences.length === 0) {
    return { status: 'PASSED', message: 'No mandatory references found for validation.' };
  }

  // 2. Mock AI Validation Logic
  // In reality, we would send `transactionData` + `activeReferences.aiSummary` to the LLM.
  // We'll simulate a mock response here to demonstrate the architecture.
  
  let riskLevel = 'LOW';
  let result = 'PASSED';
  let findings = 'Transaction complies with all active notebook rules.';

  // Example hardcoded risk detection based on transaction type
  if (moduleName === 'PURCHASE_ORDER' && transactionData.totalAmount > 500000) {
    result = 'NEEDS_HUMAN_REVIEW';
    riskLevel = 'HIGH';
    findings = 'Amount exceeds standard threshold defined in Procurement Policy Ref #1. Project Director approval strictly required.';
  }

  if (moduleName === 'PAYROLL' && transactionData.hasUnregisteredWorkers) {
    result = 'BLOCKING_ISSUE';
    riskLevel = 'CRITICAL';
    findings = 'Payroll contains inactive or unverified workers, violating Payroll Policy Ref #4.';
  }

  // 3. Log the AI Validation result securely into the database
  const aiLog = await prisma.aIValidationLog.create({
    data: {
      moduleName,
      transactionId: transactionData.id || 'DRAFT_TXN',
      userId,
      userRole,
      validationType: 'NOTEBOOK_COMPLIANCE',
      validationResult: result,
      riskLevel,
      aiFindings: findings,
      aiRecommendation: 'Please refer to the flagged Notebook Reference policies.'
    }
  });

  // 4. Also drop an audit log if it's a blocking issue
  if (result === 'BLOCKING_ISSUE') {
    await logAudit(userId, userRole, moduleName, transactionData.id, 'AI_VALIDATION_FAILED', undefined, result, findings);
  }

  return { status: result, message: findings, logId: aiLog.id };
}
