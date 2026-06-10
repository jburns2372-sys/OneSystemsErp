import { prisma } from '@/lib/prisma';

export class PaymentReconciliationService {
  /**
   * Reconcile a successful API payment
   */
  static async processSuccess(paymentLineId: string, transactionReference: string, datePaid: Date) {
    const paymentLine = await prisma.paymentBatchRow.findUnique({
      where: { id: paymentLineId },
      include: { paymentBatch: true, payroll: true }
    });

    if (!paymentLine) throw new Error('Payment line not found');

    // 1. Mark Payment Line as Successful
    await prisma.paymentBatchRow.update({
      where: { id: paymentLineId },
      data: {
        status: 'SUCCESSFUL',
        unionBankTransactionReference: transactionReference,
        datePaid,
        reconciledAt: new Date()
      }
    });

    // 2. Mark Payslip as PAID
    await prisma.payroll.update({
      where: { id: paymentLine.payrollId },
      data: {
        paymentStatus: 'PAID',
        transactionReference: transactionReference,
        paymentBatchId: paymentLine.paymentBatchId
      }
    });

    // 3. Post to Payroll Bank Ledger (Debit/Release funds)
    await prisma.payrollBankLedger.create({
      data: {
        payrollBankAccountId: paymentLine.paymentBatch.payrollBankAccountId,
        transactionType: 'PAYMENT_RELEASE',
        amount: -paymentLine.amount,
        balanceAfter: 0, // In production, this would be computed atomically based on actualBankBalance
        referenceId: paymentLine.paymentBatchId,
        referenceNumber: transactionReference,
        remarks: `Payslip ${paymentLine.payrollId} via ${paymentLine.transferRail}`,
        createdById: 'SYSTEM' // System reconciling
      }
    });

    // Optional: Add Accounting Engine Journal Entries here
  }

  /**
   * Reconcile a failed API payment
   */
  static async processFailure(paymentLineId: string, errorCode: string, errorMessage: string) {
    const paymentLine = await prisma.paymentBatchRow.findUnique({
      where: { id: paymentLineId },
      include: { paymentBatch: true }
    });

    if (!paymentLine) throw new Error('Payment line not found');

    // 1. Mark Payment Line as Failed
    await prisma.paymentBatchRow.update({
      where: { id: paymentLineId },
      data: {
        status: 'FAILED',
        providerResponseCode: errorCode,
        providerResponseMessage: errorMessage,
        failureReason: errorMessage,
        reconciledAt: new Date()
      }
    });

    // 2. Mark Payslip as FAILED (Keep Locked)
    await prisma.payroll.update({
      where: { id: paymentLine.payrollId },
      data: {
        paymentStatus: 'FAILED',
      }
    });

    // 3. Create a Payment Exception Queue item
    await prisma.paymentException.create({
      data: {
        apiPaymentBatchId: paymentLine.paymentBatchId,
        payrollId: paymentLine.payrollId,
        workerId: paymentLine.workerId,
        amount: paymentLine.amount,
        recipientBankName: paymentLine.recipientBankName,
        recipientBankCode: paymentLine.recipientBankCode,
        transferRail: paymentLine.transferRail,
        exceptionReason: `API Failure: ${errorMessage}`,
        unionBankResponseCode: errorCode,
        unionBankResponseMessage: errorMessage,
        status: 'OPEN'
      }
    });
  }
}
