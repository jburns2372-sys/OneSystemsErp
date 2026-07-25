'use server';

import { revalidatePath } from 'next/cache';
import { getBaseUrl } from '@/lib/urlResolver';
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
  const headers = new Headers(init?.headers);

  if (init?.method === 'POST' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // In a real application, you would add authentication tokens here,
  // e.g., from cookies, session, or server-side auth providers.
  // Example: headers.set('Authorization', `Bearer ${await getAuthToken()}`);

    const __injectedCookieStore = await cookies();
  const __allCookies = __injectedCookieStore.getAll().map(c => "${c.name}=${c.value}").join('; ');
  if (__allCookies) { if (typeof headers.set === 'function') { headers.set('Cookie', __allCookies); } else { headers.Cookie = __allCookies; } }

const response = await fetch(input, {
    ...init,
    headers,
  });

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
  const API_BASE_URL = getBaseUrl();
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
