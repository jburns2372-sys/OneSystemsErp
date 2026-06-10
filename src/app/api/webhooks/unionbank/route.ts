import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { PaymentReconciliationService } from '@/services/paymentReconciliationService';

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const headersList = req.headers;
    const signature = headersList.get('X-Signature');

    // In a real application, you would load the signing secret from env or provider config
    // and verify the signature using crypto.createHmac.
    
    // Parse the payload
    const payload = JSON.parse(bodyText);
    const { senderReferenceId, status, errorCode, errorMessage, transactionReference } = payload;

    if (!senderReferenceId) {
      return NextResponse.json({ error: 'Missing senderReferenceId' }, { status: 400 });
    }

    // Find the payment line
    const paymentLine = await prisma.paymentBatchRow.findUnique({
      where: { senderReferenceId }
    });

    if (!paymentLine) {
      return NextResponse.json({ error: 'Payment line not found' }, { status: 404 });
    }

    if (paymentLine.status === 'SUCCESSFUL' || paymentLine.status === 'FAILED') {
      // Already processed
      return NextResponse.json({ message: 'Already processed' }, { status: 200 });
    }

    if (status === 'SUCCESSFUL') {
      await PaymentReconciliationService.processSuccess(paymentLine.id, transactionReference || 'UNKNOWN', new Date());
    } else if (status === 'FAILED' || status === 'REJECTED' || status === 'RETURNED') {
      await PaymentReconciliationService.processFailure(paymentLine.id, errorCode || 'ERR', errorMessage || 'Webhook reported failure');
    }

    return NextResponse.json({ message: 'Webhook received and processed' }, { status: 200 });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
