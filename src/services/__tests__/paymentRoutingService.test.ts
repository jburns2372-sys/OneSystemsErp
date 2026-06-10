import { PaymentRoutingService } from '../paymentRoutingService';

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    receivingBank: {
      findUnique: jest.fn(),
    },
  },
}));

import { prisma } from '@/lib/prisma';
import { Worker } from '@prisma/client';

describe('PaymentRoutingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseWorker = {
    id: 'w-1',
    workerId: 'EMP-001',
    payrollCategory: 'Semi-Monthly',
    allowedPaymentMethod: 'Bank Transfer Only',
    bankAccountNumber: '12345',
    bankVerificationStatus: 'Verified',
    bankCode: 'BDO',
    bankName: 'BDO Unibank',
  } as Worker;

  it('routes Weekly Salaried workers to GCash if verified', async () => {
    const worker = {
      ...baseWorker,
      payrollCategory: 'Weekly Salaried',
      allowedPaymentMethod: 'GCash Only',
      gcashNumber: '09171234567',
      gcashVerificationStatus: 'Verified'
    } as Worker;

    const result = await PaymentRoutingService.determineRoute(worker, 5000);
    expect(result.route).toBe('GCASH');
  });

  it('routes Weekly Salaried workers to MANUAL if not GCash Only', async () => {
    const worker = {
      ...baseWorker,
      payrollCategory: 'Weekly Salaried',
      allowedPaymentMethod: 'Bank Transfer Only',
    } as Worker;

    const result = await PaymentRoutingService.determineRoute(worker, 5000);
    expect(result.route).toBe('MANUAL_REVIEW');
  });

  it('routes to UNIONBANK_INTERNAL if bank is UnionBank', async () => {
    const worker = {
      ...baseWorker,
      bankCode: 'UBP',
      bankName: 'Union Bank of the Phils',
    } as Worker;

    const result = await PaymentRoutingService.determineRoute(worker, 15000);
    expect(result.route).toBe('UNIONBANK_INTERNAL');
  });

  it('routes to INSTAPAY if below limit and bank is InstaPay enabled', async () => {
    (prisma.receivingBank.findUnique as jest.Mock).mockResolvedValue({
      bankCode: 'BDO',
      instaPayEnabled: true,
      pesonetEnabled: true,
    });

    const result = await PaymentRoutingService.determineRoute(baseWorker, 40000, { instaPayLimit: 50000 });
    expect(result.route).toBe('INSTAPAY');
  });

  it('routes to PESONET if above limit and bank is PESONet enabled', async () => {
    (prisma.receivingBank.findUnique as jest.Mock).mockResolvedValue({
      bankCode: 'BDO',
      instaPayEnabled: true,
      pesonetEnabled: true,
    });

    const result = await PaymentRoutingService.determineRoute(baseWorker, 60000, { instaPayLimit: 50000 });
    expect(result.route).toBe('PESONET');
    expect(result.reason).toContain('exceeds InstaPay limit');
  });
});
