import { prisma } from '@/lib/prisma';
import { PaymentBatch, Worker } from '@prisma/client';

export type AIRiskLevel = 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Payment Blocked';

export interface AIValidationResult {
  riskLevel: AIRiskLevel;
  findings: string[];
}

export class AIPaymentValidationService {
  /**
   * Validate a specific Payment Batch and its rows before release
   */
  static async validateBatch(batchId: string): Promise<AIValidationResult> {
    const batch = await prisma.paymentBatch.findUnique({
      where: { id: batchId },
      include: {
        rows: {
          include: { worker: true }
        }
      }
    });

    if (!batch) throw new Error('Batch not found');

    const findings: string[] = [];
    let highestRisk: AIRiskLevel = 'Low Risk';

    const setRisk = (level: AIRiskLevel) => {
      const levels = ['Low Risk', 'Medium Risk', 'High Risk', 'Payment Blocked'];
      if (levels.indexOf(level) > levels.indexOf(highestRisk)) {
        highestRisk = level;
      }
    };

    const gcashNumbers = new Set<string>();
    const bankAccounts = new Set<string>();

    for (const row of batch.rows) {
      const worker = row.worker;

      // 1. Weekly Salaried Check
      if (worker.payrollCategory === 'Weekly Salaried' && batch.transferRail !== 'GCash') {
        findings.push(`Worker ${worker.workerId} is Weekly Salaried but routed to ${batch.transferRail}.`);
        setRisk('Payment Blocked');
      }

      // 2. Non-weekly to GCash Check
      if (worker.payrollCategory !== 'Weekly Salaried' && batch.transferRail === 'GCash') {
        findings.push(`Worker ${worker.workerId} is ${worker.payrollCategory} but routed to GCash.`);
        setRisk('Payment Blocked');
      }

      // 3. Duplicate checks
      if (row.gcashMobileNumber) {
        if (gcashNumbers.has(row.gcashMobileNumber)) {
          findings.push(`Duplicate GCash Number detected: ${row.gcashMobileNumber}`);
          setRisk('Payment Blocked');
        }
        gcashNumbers.add(row.gcashMobileNumber);
      }

      if (row.recipientAccountNumber) {
        if (bankAccounts.has(row.recipientAccountNumber)) {
          findings.push(`Duplicate Bank Account detected: ${row.recipientAccountNumber}`);
          setRisk('Payment Blocked');
        }
        bankAccounts.add(row.recipientAccountNumber);
      }

      // 4. Inactive Worker Check
      if (worker.employmentStatus !== 'ACTIVE') {
        findings.push(`Worker ${worker.workerId} is not ACTIVE (Status: ${worker.employmentStatus}).`);
        setRisk('Payment Blocked');
      }

      // 5. Verification Check
      if (batch.transferRail === 'GCash' && worker.gcashVerificationStatus !== 'Verified') {
        findings.push(`Worker ${worker.workerId} has unverified GCash.`);
        setRisk('Payment Blocked');
      } else if (batch.transferRail !== 'GCash' && worker.bankVerificationStatus !== 'Verified') {
        findings.push(`Worker ${worker.workerId} has unverified Bank Account.`);
        setRisk('Payment Blocked');
      }

      // 6. Duplicate Payslip Payment
      const existingSuccess = await prisma.paymentBatchRow.findFirst({
        where: {
          payrollId: row.payrollId,
          status: 'SUCCESSFUL',
          id: { not: row.id }
        }
      });
      if (existingSuccess) {
        findings.push(`Payslip for Payroll ${row.payrollId} has already been paid successfully.`);
        setRisk('Payment Blocked');
      }
    }

    // Advanced Mocking: Imagine calling a Google GenAI model here 
    // to do anomaly detection on historical payroll amounts (e.g., net pay unusually high)
    // For now, this deterministic rules engine enforces the strict requirements requested.

    await prisma.paymentBatch.update({
      where: { id: batchId },
      data: {
        aiRiskLevel: highestRisk,
        aiAuditNotes: findings.join(' | ')
      }
    });

    return {
      riskLevel: highestRisk,
      findings
    };
  }
}
