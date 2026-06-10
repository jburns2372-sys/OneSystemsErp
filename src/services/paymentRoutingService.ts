import { prisma } from '@/lib/prisma';
import { Worker, Payroll, ReceivingBank } from '@prisma/client';

export type PaymentRoute = 'GCASH' | 'UNIONBANK_INTERNAL' | 'INSTAPAY' | 'PESONET' | 'MANUAL_REVIEW';

export interface RoutingResult {
  route: PaymentRoute;
  reason?: string;
}

export class PaymentRoutingService {
  /**
   * Determine the target payment rail for a worker's payslip
   */
  static async determineRoute(worker: Worker, netPay: number, providerLimits?: { instaPayLimit: number }): Promise<RoutingResult> {
    const isWeekly = worker.payrollCategory === 'Weekly Salaried';

    // 1. Weekly Salaried Workers
    if (isWeekly) {
      if (worker.allowedPaymentMethod !== 'GCash Only') {
        return { route: 'MANUAL_REVIEW', reason: 'Weekly worker does not have GCash Only allowed.' };
      }
      if (!worker.gcashNumber || worker.gcashVerificationStatus !== 'Verified') {
        return { route: 'MANUAL_REVIEW', reason: 'Missing or unverified GCash details.' };
      }
      return { route: 'GCASH' };
    }

    // 2. Non-weekly Bank-paid workers
    if (worker.allowedPaymentMethod !== 'Bank Transfer Only') {
      return { route: 'MANUAL_REVIEW', reason: 'Non-weekly worker does not have Bank Transfer Only allowed.' };
    }

    if (!worker.bankAccountNumber || worker.bankVerificationStatus !== 'Verified') {
      return { route: 'MANUAL_REVIEW', reason: 'Missing or unverified bank account details.' };
    }

    // 3. UnionBank Internal Transfer (If recipient is UnionBank)
    const isUnionBank = worker.bankName?.toLowerCase().includes('union') || false;
    if (isUnionBank) {
      // Assuming Internal Transfer is configured as highest priority if same bank
      return { route: 'UNIONBANK_INTERNAL' };
    }

    // Look up the Receiving Bank capabilities
    const bankName = worker.bankName;
    if (!bankName) {
      return { route: 'MANUAL_REVIEW', reason: 'Worker bank profile missing Bank Name.' };
    }

    const bank = await prisma.receivingBank.findFirst({
      where: { bankName: bankName }
    });

    if (!bank) {
      return { route: 'MANUAL_REVIEW', reason: 'Bank not found in supported Receiving Banks list.' };
    }

    // 4. InstaPay Limit Check
    const instaPayLimit = providerLimits?.instaPayLimit || 50000;

    if (netPay <= instaPayLimit && bank.instaPayEnabled) {
      return { route: 'INSTAPAY' };
    }

    // 5. PESONet Fallback
    if (bank.pesonetEnabled) {
      const reason = netPay > instaPayLimit 
        ? `Amount ${netPay} exceeds InstaPay limit of ${instaPayLimit}`
        : `Bank ${bankName} is not InstaPay enabled`;
      return { route: 'PESONET', reason };
    }

    // 6. Manual Fallback
    return { route: 'MANUAL_REVIEW', reason: `Bank ${bankName} is neither InstaPay nor PESONet enabled.` };
  }
}
