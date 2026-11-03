'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
// Standard fetchWithAuth definition for making API calls.
// In a production environment, `process.env.AWS_API_GATEWAY_URL` should be configured
// with the actual URL of your deployed AWS Express backend.
async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetchAuthenticatedBackend(endpoint, options);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = errorText;
    try {
      const parsed = JSON.parse(errorText);
      errorMessage = parsed.error || parsed.message || errorText;
    } catch {
      // non-JSON error body
    }
    throw new Error(errorMessage || `Backend Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

const API_ROUTE_PREFIX = '/api/aiPaymentValidationActions'; // As specified in the instructions

export async function validatePaymentBatchWithAI(batchId: string) {
  try {
    const data = await fetchWithAuth(`${API_ROUTE_PREFIX}/validatePaymentBatchWithAI`, {
      method: 'POST',
      body: JSON.stringify({ batchId }),
    });

    // The backend already returns { success: true, riskLevel, anomalies } on success.
    // If fetchWithAuth succeeds, 'data' will contain these properties.
    return data; // Return the backend's response directly
  } catch (error: any) {
    // Catch errors thrown by fetchWithAuth or other issues
    console.error("Error in validatePaymentBatchWithAI proxy:", error);
    return { success: false, error: error.message };
  }
}
