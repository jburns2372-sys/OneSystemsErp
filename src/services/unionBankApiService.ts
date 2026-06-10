import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export class UnionBankApiService {
  /**
   * Generates an Idempotency Key for an API Payment Line
   */
  static generateIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /**
   * Generates the Sender Reference ID for InstaPay/PESONet
   */
  static generateSenderReferenceId(rail: 'InstaPay' | 'PESONet', payrollBatchId: string, payslipNumber: string): string {
    const prefix = rail === 'InstaPay' ? 'UBIP' : 'UBPN';
    return `${prefix}-${payrollBatchId}-${payslipNumber}`;
  }

  /**
   * Request OAuth Access Token from UnionBank
   */
  static async requestAccessToken(providerId: string): Promise<string | null> {
    const provider = await prisma.paymentProvider.findUnique({ where: { id: providerId } });
    if (!provider || !provider.clientId || !provider.clientSecret || !provider.oauthTokenUrl) {
      throw new Error('Provider OAuth credentials are not properly configured.');
    }

    try {
      // Dummy implementation for OAuth Token generation
      // In production, this would make an actual POST request to provider.oauthTokenUrl
      // with grant_type=client_credentials, etc.
      
      const dummyToken = `token_${crypto.randomBytes(16).toString('hex')}`;
      console.log(`[UnionBankApiService] Generated Access Token for provider: ${provider.providerName}`);
      return dummyToken;
    } catch (error) {
      console.error('Failed to request access token:', error);
      return null;
    }
  }

  /**
   * Submit an InstaPay or PESONet payment
   */
  static async submitPayment(paymentLineId: string): Promise<boolean> {
    const paymentLine = await prisma.paymentBatchRow.findUnique({
      where: { id: paymentLineId },
      include: { paymentBatch: { include: { provider: true } }, worker: true }
    });

    if (!paymentLine || !paymentLine.paymentBatch.provider) {
      throw new Error('Payment line or provider not found');
    }

    const provider = paymentLine.paymentBatch.provider;

    // Securely get token
    const token = await this.requestAccessToken(provider.id);
    if (!token) {
      throw new Error('Failed to obtain OAuth Token');
    }

    // Determine Base URL
    const baseUrl = provider.environment === 'Production' ? provider.apiBaseUrlProduction : provider.apiBaseUrlSandbox;
    
    console.log(`[UnionBankApiService] Submitting ${paymentLine.transferRail} to ${baseUrl}`);
    console.log(`Sender Reference: ${paymentLine.senderReferenceId}, Idempotency: ${paymentLine.idempotencyKey}`);

    // Mock successful submission to provider
    // In production, an axios.post() would go to the UnionBank Endpoint

    await prisma.paymentBatchRow.update({
      where: { id: paymentLineId },
      data: {
        status: 'PROCESSING',
        unionBankTransactionReference: `UB-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
        providerResponseCode: '202',
        providerResponseMessage: 'Accepted for Processing',
        datePaid: null // Only set when webhook/status says SUCCESS
      }
    });

    return true;
  }

  /**
   * Check transaction status by Sender Reference
   */
  static async checkTransactionStatus(paymentLineId: string): Promise<string> {
    const paymentLine = await prisma.paymentBatchRow.findUnique({ where: { id: paymentLineId } });
    if (!paymentLine) throw new Error('Payment line not found');

    // Mock polling
    // In production, we'd make a GET request to UnionBank status endpoint using the senderReferenceId
    
    return paymentLine.status; // Return current status
  }
}
