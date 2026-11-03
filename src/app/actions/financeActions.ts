'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';


async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const res = await fetchAuthenticatedBackend(endpoint, options);

  if (!res.ok) {
    const errorText = await res.text();
    if (res.status === 400 && errorText.includes('AI Blocked')) {
      return JSON.parse(errorText);
    }
    throw new Error(`Backend Error: ${res.status} ${errorText}`);
  }
  return res.json();
}

export async function issuePayment(payableId: string, paymentData: {
  amount: number;
  paymentMethod: string;
  paymentRef: string;
  paidAt: string;
}) {
  const result = await fetchWithAuth('/api/finance/payment/issue', {
    method: 'POST',
    body: JSON.stringify({ payableId, paymentData })
  });

  if (result.success) {
    revalidatePath('/supplier-payables');
    revalidatePath(`/supplier-payables/${payableId}`);
    revalidatePath('/finance');
  }

  return result;
}

export async function clearAccruedPayment(payableId: string) {
  const result = await fetchWithAuth(`/api/finance/payment/${payableId}/clear-accrued`, {
    method: 'PUT'
  });

  if (result.success) {
    revalidatePath('/supplier-payables');
    revalidatePath('/finance');
  }
  return result;
}

export async function getConsolidatedItemsForProject(projectId: string) {
  return await fetchWithAuth(`/api/finance/consolidated-items/${projectId}`);
}

export async function logDirectExpense(data: {
  projectId: string;
  consolidatedBoqItemId?: string;
  voucherNo: string;
  date: string;
  category: string;
  description: string;
  issuedById: string;
  supplierName: string;
  netAmount: number;
  vatAmount: number;
  isAccrued: boolean;
  breakdowns: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    supplierName: string;
    isVat: boolean;
  }>;
}) {
  const result = await fetchWithAuth('/api/finance/expense/log', {
    method: 'POST',
    body: JSON.stringify({ data })
  });

  revalidatePath('/expenses');
  return result.id;
}
