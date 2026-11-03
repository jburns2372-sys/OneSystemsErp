'use server';
import { fetchAuthenticatedBackend } from '@/lib/backendAuth';
import { revalidatePath } from 'next/cache';
import { getBackendUrl } from '@/lib/backendUrl';
import { fetchActiveTemplatesService } from '@/lib/services/document-template.service';
import { verifySession } from '@/lib/dal/auth';
import { cookies } from 'next/headers';

// Basic fetchWithAuth definition (replace with your actual implementation)
// This placeholder adds Content-Type header for POST requests
type FetchWithAuthOptions = RequestInit & {
  next?: NextFetchRequestConfig; // From 'next/dist/server/web/spec-extension/fetch'
  tags?: string[];
};

async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: FetchWithAuthOptions
): Promise<Response> {
  const response = await fetchAuthenticatedBackend(
    input,
    init,
    { defaultJsonContentType: init?.method === 'POST' }
  );

  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`Fetch error for ${input}: ${response.status} - ${errorBody}`);
    throw new Error(
      `Network response was not ok: ${response.status} - ${errorBody}`
    );
  }
  return response;
}

export async function uploadDocumentTemplate(formData: FormData) {
  const API_BASE_URL = getBackendUrl();
  try {
    // Convert FormData to a plain object to send as JSON
    const payload = {
      fileUrl: formData.get('fileUrl') as string,
      fileName: formData.get('fileName') as string,
      templateName: formData.get('templateName') as string,
      templateType: formData.get('templateType') as string,
      uploadedById: formData.get('uploadedById') as string | null,
    };

    const response = await fetchWithAuth(
      `${API_BASE_URL}/api/documentTemplateActions/uploadDocumentTemplate`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (result.success) {
      revalidatePath('/progress-billings/templates');
    }

    return result;
  } catch (error: any) {
    console.error('Template Upload Error (Next.js Proxy):', error);
    return { success: false, error: error.message || 'Failed to upload template' };
  }
}

export async function fetchActiveTemplates() {
  try {
    const session = await verifySession();
    if (!session?.id) {
      throw new Error('Unauthorized');
    }
    
    const cookieStore = await cookies();
    const activeProjectId = cookieStore.get('activeProjectId')?.value || null;

    const templates = await fetchActiveTemplatesService(session.id, activeProjectId);

    return { success: true, data: templates };
  } catch (error: any) {
    console.error('Fetch Templates Error (Next.js Action):', error);
    return { success: false, error: 'Failed to load templates' };
  }
}
