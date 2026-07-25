'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

// Basic fetchWithAuth definition (adjust as per your actual implementation)
async function fetchWithAuth(url: string, options: RequestInit) {
  // In a real application, this would include logic to get and attach
  // an authentication token (e.g., from a cookie, session, or server-side store)
  // For this example, we'll assume the backend handles authentication based on session
  // or other mechanisms.

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { (headers as any).Cookie = __allCookies; } }

const response = await fetch(process.env.NEXT_PUBLIC_API_BASE_URL + url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || 'Failed to fetch data from backend');
  }

  return response.json();
}

export async function generatePaymentBatch(periodId: string, paymentMethodType: string, payrollBankAccountId: string, userId: string) {
  try {
    const response = await fetchWithAuth('/api/paymentBatchActions/generatePaymentBatch', {
      method: 'POST',
      body: JSON.stringify({
        periodId,
        paymentMethodType,
        payrollBankAccountId,
        userId,
      }),
    });

    if (response.success) {
      revalidatePath(`/payroll/${periodId}`);
    }
    
    return response;
  } catch (error: any) {
    console.error('Error generating payment batch via proxy:', error);
    return { success: false, error: error.message };
  }
}
