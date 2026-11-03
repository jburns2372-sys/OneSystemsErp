'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Placeholder for fetchWithAuth, assuming it handles authentication and base URL
const fetchWithAuth = async (
  url: string,
  options?: RequestInit & { cache?: RequestCache }
) => {
  const normalizedUrl = url.startsWith('/api/')
    ? url
    : `/api${url.startsWith('/') ? url : `/${url}`}`;

  const res = await fetchAuthenticatedBackend(normalizedUrl, {
    ...options,
    cache: options?.cache || 'no-store',
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Unknown error', success: false }));
    throw new Error(errorData.error || errorData.message || 'Failed to fetch data');
  }

  return res.json();
};

const ROUTE_NAME = 'pettyCashActions'; // As requested in the prompt

export async function createPettyCashAccount(data: {
  accountName: string;
  department?: string;
  fundLimit: number;
  replenishmentTrigger?: number;
  projectId?: string;
  custodianId: string;
  approverId?: string;
  reviewerId?: string;
}) {
  try {
    const result = await fetchWithAuth(`/${ROUTE_NAME}/createPettyCashAccount`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath('/petty-cash');
    return result;
  } catch (error: any) {
    console.error('Error creating PC account:', error);
    return { success: false, error: error.message };
  }
}

export async function updatePettyCashAccount(id: string, data: {
  accountName: string;
  fundLimit: number;
  projectId?: string;
  custodianId: string;
}) {
  try {
    const result = await fetchWithAuth(`/${ROUTE_NAME}/updatePettyCashAccount`, {
      method: 'POST',
      body: JSON.stringify({ id, data }),
    });
    revalidatePath('/petty-cash');
    return result;
  } catch (error: any) {
    console.error('Error updating PC account:', error);
    return { success: false, error: error.message };
  }
}

export async function logPettyCashExpense(data: {
  accountId: string;
  date: Date;
  payee: string;
  purpose: string;
  category: string;
  amount: number;
  isVat: boolean;
  netAmount: number;
  vatAmount: number;
  billingEligibility: string;
  receiptNumber?: string;
  attachmentUrl?: string;
  isNoReceipt: boolean;
  remarks?: string;
  createGeneralExpense?: boolean;
  projectId?: string;
  issuedById?: string;
}) {
  try {
    const result = await fetchWithAuth(`/${ROUTE_NAME}/logPettyCashExpense`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    revalidatePath(`/petty-cash/${data.accountId}`, 'page');
    return result;
  } catch (error: any) {
    console.error('Error logging PC expense:', error);
    return { success: false, error: error.message };
  }
}

export async function createPettyCashReplenishment(accountId: string, expenseIds: string[]) {
  try {
    const result = await fetchWithAuth(`/${ROUTE_NAME}/createPettyCashReplenishment`, {
      method: 'POST',
      body: JSON.stringify({ accountId, expenseIds }),
    });
    // Original function didn't have revalidatePath, so none here.
    return result;
  } catch (error: any) {
    console.error('Error creating PC replenishment:', error);
    return { success: false, error: error.message };
  }
}

export async function submitPettyCashReplenishment(id: string) {
  try {
    const result = await fetchWithAuth(`/${ROUTE_NAME}/submitPettyCashReplenishment`, {
      method: 'POST',
      body: JSON.stringify({ id }),
    });
    revalidatePath('/petty-cash');
    return result;
  } catch (error: any) {
    console.error('Error submitting PC replenishment:', error);
    return { success: false, error: error.message };
  }
}

export async function processPettyCashReplenishment(
  id: string, 
  action: 'APPROVE' | 'REJECT', 
  reviewerRemarks?: string,
  approverId?: string
) {
  try {
    const result = await fetchWithAuth(`/${ROUTE_NAME}/processPettyCashReplenishment`, {
      method: 'POST',
      body: JSON.stringify({ id, action, reviewerRemarks, approverId }),
    });
    // Original function didn't have revalidatePath, so none here.
    return result;
  } catch (error: any) {
    console.error('Error processing PC replenishment:', error);
    return { success: false, error: error.message };
  }
}

export async function releasePettyCashReplenishment(
  id: string,
  releaseMode: string,
  releaseRefNo: string,
  receiverId: string
) {
  try {
    const result = await fetchWithAuth(`/${ROUTE_NAME}/releasePettyCashReplenishment`, {
      method: 'POST',
      body: JSON.stringify({ id, releaseMode, releaseRefNo, receiverId }),
    });
    // Original function didn't have revalidatePath, so none here.
    return result;
  } catch (error: any) {
    console.error('Error releasing PC replenishment:', error);
    return { success: false, error: error.message };
  }
}
