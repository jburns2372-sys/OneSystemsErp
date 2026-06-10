'use server';

import { prisma } from '@/lib/prisma';

/**
 * Fetches the active, mandatory knowledge rules applicable to a specific ERP module.
 * This is used to display the "Applicable Rules" UI Panel.
 */
export async function getApplicableRulesForModule(moduleName: string) {
  try {
    const rules = await prisma.knowledgeRuleReference.findMany({
      where: {
        moduleName: moduleName,
        isMandatory: true
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: rules };
  } catch (error: any) {
    console.error(`Failed to fetch rules for module ${moduleName}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Logs an audit event whenever the AI or the backend enforces a Knowledge Center rule.
 */
export async function logKnowledgeAudit(data: {
  transactionId?: string;
  moduleName: string;
  notebookName: string;
  ruleApplied: string;
  validationResult: 'APPROVED' | 'BLOCKED' | 'WARNING';
  actionTaken: string;
  userAction?: string;
  overrideRequested?: boolean;
  overrideApprovedBy?: string;
  overrideReason?: string;
}) {
  try {
    const audit = await prisma.knowledgeRuleAuditLog.create({
      data: {
        transactionId: data.transactionId,
        moduleName: data.moduleName,
        notebookName: data.notebookName,
        ruleApplied: data.ruleApplied,
        validationResult: data.validationResult,
        actionTaken: data.actionTaken,
        userAction: data.userAction,
        overrideRequested: data.overrideRequested || false,
        overrideApprovedBy: data.overrideApprovedBy,
        overrideReason: data.overrideReason
      }
    });
    return { success: true, data: audit };
  } catch (error: any) {
    console.error('Failed to log knowledge audit:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches recent audit logs for a specific module to display in the UI panel.
 */
export async function getRecentAuditLogsForModule(moduleName: string, limit: number = 5) {
  try {
    const logs = await prisma.knowledgeRuleAuditLog.findMany({
      where: { moduleName },
      orderBy: { timestamp: 'desc' },
      take: limit
    });
    return { success: true, data: logs };
  } catch (error: any) {
    console.error(`Failed to fetch audit logs for module ${moduleName}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Utility to pre-populate some baseline mandatory rules since this is a new feature.
 * Typically called once during setup or deployment.
 */
export async function seedBaselineRules() {
  const count = await prisma.knowledgeRuleReference.count();
  if (count > 0) return { success: true, message: 'Already seeded' };

  await prisma.knowledgeRuleReference.createMany({
    data: [
      {
        notebookName: 'Progress Billing & Accomplishment Rules',
        moduleName: 'Progress Billing',
        ruleCategory: 'File Integrity',
        ruleTitle: 'Excel Layout Preservation',
        ruleDescription: 'The system must preserve the original Excel file structure, empty rows, and layout when parsing or exporting billing.',
        validationType: 'Structural Check',
        severity: 'BLOCK',
        isMandatory: true,
        sourceLink: '/knowledge/formulas_and_validation.md'
      },
      {
        notebookName: 'Payroll Engine Computation Rules',
        moduleName: 'Payroll',
        ruleCategory: 'AI Compliance',
        ruleTitle: 'Zero Net Pay Protection',
        ruleDescription: 'Payroll submission must be blocked if net pay is zero or negative.',
        validationType: 'Logic Pre-Check',
        severity: 'BLOCK',
        isMandatory: true,
        sourceLink: '/knowledge/payroll_formulas_and_validation.md'
      },
      {
        notebookName: 'Finance & Cash Management Rules',
        moduleName: 'Petty Cash',
        ruleCategory: 'Fund Disbursement',
        ruleTitle: 'Insufficient Balance Block',
        ruleDescription: 'The system must immediately block disbursement if the expense amount exceeds the current active balance.',
        validationType: 'Financial Lock',
        severity: 'BLOCK',
        isMandatory: true,
        sourceLink: '/knowledge/finance_formulas_and_validation.md'
      },
      {
        notebookName: 'Procurement & Inventory Rules',
        moduleName: 'Procurement',
        ruleCategory: 'Accounts Payable',
        ruleTitle: 'VAT Split Rules',
        ruleDescription: 'For Vatable suppliers, the exact Gross / 1.12 BIR formula must be used.',
        validationType: 'Accounting Logic',
        severity: 'BLOCK',
        isMandatory: true,
        sourceLink: '/knowledge/procurement_formulas_and_validation.md'
      }
    ]
  });

  return { success: true, message: 'Seeded baseline rules' };
}
