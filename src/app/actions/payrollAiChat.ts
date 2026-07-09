'use server';

// Standard fetchWithAuth wrapper. This would typically handle authentication headers.
// The AWS_BACKEND_BASE_URL environment variable should point to your Express backend's base URL (e.g., 'https://your-api-gateway-id.execute-api.us-east-1.amazonaws.com/prod').
async function fetchWithAuth(url: string, options?: RequestInit) {
  const backendBaseUrl = process.env.AWS_BACKEND_BASE_URL;
  if (!backendBaseUrl) {
    throw new Error('AWS_BACKEND_BASE_URL is not defined in environment variables.');
  }

  const response = await fetch(backendBaseUrl + url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const responseData = await response.json();

  if (!response.ok) {
    // If the HTTP status is not OK (e.g., 500), throw an error with the backend's error message.
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