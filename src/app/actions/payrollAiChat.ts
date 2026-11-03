'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { cookies } from 'next/headers';
// Standard fetchWithAuth wrapper. This would typically handle authentication headers.
// The AWS_BACKEND_BASE_URL environment variable should point to your Express backend's base URL (e.g., 'https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod').
async function fetchWithAuth(url: string, options?: RequestInit) {
  const response = await fetchAuthenticatedBackend(url, options);
  const responseData = await response.json();

  if (!response.ok) {
    throw new Error(responseData.error || 'Something went wrong with the backend request.');
  }

  return responseData;
}

export async function askPayrollAssistant(question: string): Promise<string> {
  try {
    const response = await fetchWithAuth('/api/payrollAiChat/askPayrollAssistant', {
      method: 'POST',
      body: JSON.stringify({ question }),
    });

    // The backend is designed to return { success: true, data: '...' } on success
    // and { success: false, error: '...' } on application-level errors (though HTTP errors are preferred).
    if (response.success) {
      return response.data;
    } else {
      // Fallback for application-level errors not caught by !response.ok
      throw new Error(response.error || "An unknown error occurred on the backend.");
    }
  } catch (error: any) {
    console.error('Error in proxy askPayrollAssistant:', error);
    // Return the same user-friendly error message as the original Server Action
    return "I'm sorry, I encountered an error connecting to the database.";
  }
}