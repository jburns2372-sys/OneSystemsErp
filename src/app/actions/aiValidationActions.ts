'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { verifySession } from '@/lib/dal/auth';

import { cookies } from 'next/headers';


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

export async function validateTransactionWithAI(
  moduleName: string,
  transactionDetails: any,
  userId: string,
  userRole: string
) {
  try {
    return await fetchWithAuth('/api/ai/validate', {
      method: 'POST',
      body: JSON.stringify({ moduleName, transactionDetails })
    });
  } catch (error: any) {
    console.error('AI Validation Error:', error);
    return { validationStatus: 'NEEDS HUMAN REVIEW', riskLevel: 'MEDIUM', findings: 'AI Engine Error: ' + error.message, aiRecommendation: 'Contact admin.', validationLogId: null };
  }
}

export async function updateAIValidationLog(logId: string, transactionId: string) {
    if (!logId) return;
    try {
        await fetchWithAuth('/api/ai/update-log', {
            method: 'POST',
            body: JSON.stringify({ logId, transactionId })
        });
    } catch(e) {
        console.error("Failed to update AI log with transaction ID", e);
    }
}

export async function verifyDeliveryDocumentWithAI(fileBuffer: Buffer, mimeType: string, poDetails: any) {
  try {
    return await fetchWithAuth('/api/ai/verify-delivery', {
      method: 'POST',
      body: JSON.stringify({
        fileBase64: fileBuffer.toString('base64'),
        mimeType,
        poDetails
      })
    });
  } catch (error: any) {
    console.error('AI Document Verification Error:', error);
    return { matches: false, findings: `AI Vision Engine Error: ${error.message}` };
  }
}

